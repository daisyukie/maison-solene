import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function translateChunk(text: string): Promise<string> {
  if (!text || !text.trim()) return text

  // Preserve <br /> tags
  const BR_MARKER = '___BR_TAG___'
  const preparedText = text.replace(/<br\s*\/?>/gi, BR_MARKER)

  // 1. Try MyMemory API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(preparedText)}&langpair=pt|en`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.responseData?.translatedText && !data.responseData.translatedText.includes('MYMEMORY WARNING')) {
        let translated = data.responseData.translatedText
        translated = translated.replace(/___BR_TAG___/gi, '<br />')
        return translated
      }
    }
  } catch {}

  // 2. Fallback: Google Translate Free Endpoint
  try {
    const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(preparedText)}`
    const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(6000) })
    if (gRes.ok) {
      const gData = await gRes.json()
      if (Array.isArray(gData?.[0])) {
        let translated = gData[0].map((item: [string]) => item[0]).join('')
        translated = translated.replace(/___BR_TAG___/gi, '<br />')
        return translated
      }
    }
  } catch {}

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
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 })
    }

    const translatedText = await translateChunk(text)
    return NextResponse.json({ success: true, translatedText })
  } catch (err) {
    console.error('API Translate Error:', err)
    return NextResponse.json({ error: 'Erro ao traduzir texto' }, { status: 500 })
  }
}
