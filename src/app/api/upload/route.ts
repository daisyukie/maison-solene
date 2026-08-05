import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (token !== 'authenticated') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // 1. Try Vercel Blob (if BLOB_READ_WRITE_TOKEN is configured in Vercel)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(file.name, file, { access: 'public' })
        return NextResponse.json({ success: true, url: blob.url })
      } catch (err) {
        console.error('Vercel Blob upload failed:', err)
      }
    }

    // 2. Try local disk upload (development / local server)
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadsDir, { recursive: true })
      const ext = path.extname(file.name) || (file.type.startsWith('video/') ? '.mp4' : '.jpg')
      const sanitizeName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_')
      const fileName = `${Date.now()}_${sanitizeName}${ext.includes('.') ? '' : ext}`
      const filePath = path.join(uploadsDir, fileName)
      await writeFile(filePath, buffer)
      return NextResponse.json({ success: true, url: `/uploads/${fileName}` })
    } catch {}

    // 3. Fallback: Base64 Data URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mime = file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg')
    const dataUrl = `data:${mime};base64,${base64}`

    return NextResponse.json({ success: true, url: dataUrl })
  } catch (err) {
    console.error('Error uploading file:', err)
    return NextResponse.json({ error: 'Erro ao processar upload' }, { status: 500 })
  }
}
