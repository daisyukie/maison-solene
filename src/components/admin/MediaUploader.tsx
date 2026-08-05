'use client'

import { useState, useRef } from 'react'
import type { SiteMedia } from '@/sanity/lib/types'

interface MediaUploaderProps {
  label: string
  media?: SiteMedia
  onChange: (updatedMedia: SiteMedia) => void
}

export default function MediaUploader({ label, media = {}, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rawUrl = media.url || media.imageUrl || media.videoUrl || media.video?.asset?.url

  const videoUrl =
    media.videoUrl ||
    media.video?.asset?.url ||
    (media.url && (/\.(mp4|webm|mov|mkv)($|\?)/i.test(media.url) || media.url.includes('video') || media.url.startsWith('data:video/'))
      ? media.url
      : undefined)

  const imageUrl =
    media.imageUrl ||
    (media.url && !(/\.(mp4|webm|mov|mkv)($|\?)/i.test(media.url) || media.url.includes('video') || media.url.startsWith('data:video/'))
      ? media.url
      : undefined)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    // Read client-side as Data URL (instant fallback guaranteed for Vercel serverless)
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name)

      // Try uploading to server first
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()

        if (data.url) {
          if (isVideo) {
            onChange({ ...media, url: data.url, videoUrl: data.url })
          } else {
            onChange({ ...media, url: data.url, imageUrl: data.url })
          }
          setUploading(false)
          return
        }
      } catch {
        // Ignore server error and fallback to dataUrl below
      }

      // Fallback: use dataUrl directly (works anywhere including Vercel)
      if (isVideo) {
        onChange({ ...media, url: dataUrl, videoUrl: dataUrl })
      } else {
        onChange({ ...media, url: dataUrl, imageUrl: dataUrl })
      }
      setUploading(false)
    }

    reader.onerror = () => {
      alert('Erro ao ler arquivo')
      setUploading(false)
    }

    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    onChange({
      hint: media.hint,
    })
  }

  const handleUrlInputChange = (newUrl: string) => {
    const isVideo = /\.(mp4|webm|mov|mkv)($|\?)/i.test(newUrl) || newUrl.includes('video')
    if (isVideo) {
      onChange({ ...media, url: newUrl, videoUrl: newUrl, imageUrl: undefined })
    } else {
      onChange({ ...media, url: newUrl, imageUrl: newUrl, videoUrl: undefined })
    }
  }

  return (
    <div
      style={{
        background: '#130D0F',
        border: '1px solid rgba(201,162,91,.2)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <h4 style={{ color: '#EDE6DD', margin: 0, fontSize: 14, fontWeight: 500 }}>{label}</h4>
          {media.hint && (
            <span style={{ color: '#C9A25B', fontSize: 11, fontFamily: 'monospace', opacity: 0.8 }}>
              Ref: {media.hint}
            </span>
          )}
        </div>

        {(videoUrl || imageUrl || rawUrl) && (
          <button
            type="button"
            onClick={handleRemove}
            style={{
              background: 'transparent',
              border: '1px solid rgba(176,36,58,.4)',
              color: '#B0243A',
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Remover Mídia
          </button>
        )}
      </div>

      {/* Media Preview Box */}
      <div
        style={{
          width: '100%',
          height: 160,
          background: '#0B0809',
          borderRadius: 6,
          border: '1px dashed rgba(201,162,91,.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {videoUrl ? (
          <video src={videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : imageUrl ? (
          <img src={imageUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 12, color: '#7C7369' }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>📷 / 🎬</span>
            <span style={{ fontSize: 12 }}>Nenhuma foto/vídeo enviado (usando placeholder do site)</span>
          </div>
        )}

        {uploading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(11,8,9,.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C9A25B',
              fontSize: 13,
            }}
          >
            Processando mídia...
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#C9A25B',
              color: '#0B0809',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {uploading ? 'Processando...' : videoUrl || imageUrl ? 'Trocar Mídia' : '+ Enviar Foto ou Vídeo'}
          </button>

          <span style={{ fontSize: 11, color: '#7C7369' }}>Suporta JPG, PNG, WEBP, MP4, WEBM</span>
        </div>

        {/* Direct Link Input Option */}
        <div>
          <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>
            Ou cole o link/URL direto da foto ou vídeo:
          </label>
          <input
            type="text"
            value={rawUrl || ''}
            onChange={(e) => handleUrlInputChange(e.target.value)}
            placeholder="https://exemplo.com/minha-foto.jpg ou .mp4"
            style={{
              width: '100%',
              background: '#0B0809',
              border: '1px solid rgba(201,162,91,.2)',
              borderRadius: 4,
              padding: '6px 10px',
              color: '#EDE6DD',
              fontSize: 12,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    </div>
  )
}
