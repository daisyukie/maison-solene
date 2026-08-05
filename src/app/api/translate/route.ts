import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function translatePtToEn(text: string): Promise<string> {
  if (!text || !text.trim()) return text

  // Preserve <br /> tags during translation
  const brMarker = '___BR_TAG___'
  const preparedText = text.replace(/<br\s*\/?>/gi, brMarker)

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(preparedText)}&langpair=pt|en`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data?.responseData?.translatedText) {
        let translated = data.responseData.translatedText
        // Restore <br /> tags
        translated = translated.replace(/___BR_TAG___/gi, '<br />')
        return translated
      }
    }
  } catch (err) {
    console.error('Translation error:', err)
  }

  return text
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (token !== 'authenticated') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { text, target } = body

    if (text && typeof text === 'string') {
      const translatedText = await translatePtToEn(text)
      return NextResponse.json({ success: true, translatedText })
    }

    if (target && typeof target === 'object') {
      // Process batch object translation if requested
      const result: Record<string, string> = {}
      for (const [key, ptVal] of Object.entries(target)) {
        if (typeof ptVal === 'string' && ptVal.trim()) {
          result[key] = await translatePtToEn(ptVal)
        }
      }
      return NextResponse.json({ success: true, translations: result })
    }

    return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 })
  } catch (err) {
    console.error('API Translate Error:', err)
    return NextResponse.json({ error: 'Erro ao traduzir texto' }, { status: 500 })
  }
}
