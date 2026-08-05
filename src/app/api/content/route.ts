import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSiteContent, saveSiteContent } from '@/lib/contentStore'

export async function GET() {
  const content = getSiteContent()
  return NextResponse.json(content)
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (token !== 'authenticated') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const updatedContent = await request.json()
    saveSiteContent(updatedContent)
    return NextResponse.json({ success: true, content: updatedContent })
  } catch (err) {
    console.error('Error saving content:', err)
    return NextResponse.json({ error: 'Falha ao salvar conteúdo' }, { status: 500 })
  }
}
