import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BitchPls123@'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const isAuthenticated = token === 'authenticated'
  return NextResponse.json({ authenticated: isAuthenticated })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, password } = body

    if (action === 'logout') {
      const response = NextResponse.json({ success: true })
      response.cookies.delete('admin_session')
      return response
    }

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ success: true })
      response.cookies.set({
        name: 'admin_session',
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      return response
    }

    return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 })
  } catch {
    return NextResponse.json({ success: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
