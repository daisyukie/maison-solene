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

  const videoUrl =
    media.videoUrl ||
    media.video?.asset?.url ||
    (media.url && (/\.(mp4|webm|mov|mkv)($|\?)/i.test(media.url) || media.url.includes('video')) ? media.url : undefined)

  const imageUrl =
    media.imageUrl ||
    (media.url && !/\.(mp4|webm|mov|mkv)($|\?)/i.test(media.url) ? media.url : undefined)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name)
        if (isVideo) {
          onChange({
            ...media,
            url: data.url,
            videoUrl: data.url,
          })
        } else {
          onChange({
            ...media,
            url: data.url,
            imageUrl: data.url,
          })
        }
      } else {
        alert(data.error || 'Erro ao enviar arquivo')
      }
    } catch {
      alert('Erro na requisição de upload')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    onChange({
      hint: media.hint,
    })
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

        {(videoUrl || imageUrl) && (
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
          <video
            src={videoUrl}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
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
            Enviando arquivo...
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
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
          {uploading ? 'Enviando...' : videoUrl || imageUrl ? 'Trocar Mídia' : '+ Enviar Foto ou Vídeo'}
        </button>

        <span style={{ fontSize: 11, color: '#7C7369' }}>
          Suporta JPG, PNG, WEBP, MP4, WEBM
        </span>
      </div>
    </div>
  )
}
