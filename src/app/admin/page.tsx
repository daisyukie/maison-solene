'use client'

import { useEffect, useState } from 'react'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminDashboard from '@/components/admin/AdminDashboard'
import type { SiteContent } from '@/sanity/lib/types'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [content, setContent] = useState<SiteContent | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuthAndFetchContent = async () => {
    try {
      const authRes = await fetch('/api/auth')
      const authData = await authRes.json()

      if (authData.authenticated) {
        setAuthenticated(true)
        const contentRes = await fetch('/api/content')
        const contentData = await contentRes.json()
        setContent(contentData)
      } else {
        setAuthenticated(false)
      }
    } catch {
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthAndFetchContent()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch {
      // ignore
    }
    setAuthenticated(false)
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0B0809',
          color: '#C9A25B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.1em',
        }}
      >
        Carregando painel...
      </div>
    )
  }

  if (!authenticated) {
    return (
      <AdminLogin
        onSuccess={() => {
          setLoading(true)
          checkAuthAndFetchContent()
        }}
      />
    )
  }

  if (!content) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0809', color: '#EDE6DD', padding: 24 }}>
        Erro ao carregar conteúdo do site.
      </div>
    )
  }

  return <AdminDashboard initialContent={content} onLogout={handleLogout} />
}
