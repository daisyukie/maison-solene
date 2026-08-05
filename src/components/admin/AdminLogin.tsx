'use client'

import { useState } from 'react'

interface AdminLoginProps {
  onSuccess: () => void
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || 'Senha incorreta')
      }
    } catch {
      setError('Erro ao efetuar login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B0809',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#130D0F',
          border: '1px solid rgba(201,162,91,.25)',
          borderRadius: 12,
          padding: 36,
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1
            style={{
              color: '#C9A25B',
              fontSize: 24,
              fontWeight: 400,
              letterSpacing: '0.15em',
              margin: '0 0 8px 0',
              textTransform: 'uppercase',
            }}
          >
            Maison Solène
          </h1>
          <p style={{ color: '#EDE6DD', fontSize: 13, opacity: 0.7, margin: 0 }}>
            Painel de Administração do Site
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                color: '#EDE6DD',
                fontSize: 12,
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              Senha de Acesso
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha..."
              required
              style={{
                width: '100%',
                background: '#0B0809',
                border: '1px solid rgba(201,162,91,.3)',
                borderRadius: 6,
                padding: '12px 14px',
                color: '#EDE6DD',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(176,36,58,.15)',
                border: '1px solid rgba(176,36,58,.4)',
                color: '#E06B78',
                fontSize: 13,
                padding: '10px 12px',
                borderRadius: 6,
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#C9A25B',
              color: '#0B0809',
              border: 'none',
              borderRadius: 6,
              padding: '12px 0',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  )
}
