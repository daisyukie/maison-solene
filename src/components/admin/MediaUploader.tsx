'use client'

import { useState, useRef, useEffect } from 'react'
import type { SiteMedia } from '@/sanity/lib/types'
import { parseMediaUrl } from '@/lib/mediaHelper'
import { upload } from '@vercel/blob/client'

interface MediaUploaderProps {
  label: string
  media?: SiteMedia
  onChange: (updatedMedia: SiteMedia) => void
}

export default function MediaUploader({ label, media = {}, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [tempPreviewUrl, setTempPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up object URL when component unmounts or tempPreviewUrl changes
  useEffect(() => {
    return () => {
      if (tempPreviewUrl && tempPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(tempPreviewUrl)
      }
    }
  }, [tempPreviewUrl])

  // Determine active media URL (prioritize clean HTTPS/Blob URLs over data URLs)
  const rawUrl = tempPreviewUrl || media.url || media.imageUrl || media.videoUrl || media.video?.asset?.url
  const mediaInfo = parseMediaUrl(rawUrl)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name)

    // Rule 4: Create temporary object URL for instant preview and revoke after upload
    const objectUrl = URL.createObjectURL(file)
    setTempPreviewUrl(objectUrl)

    try {
      // Rule 1: Direct client-side upload to Vercel Blob
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/client',
      })

      if (newBlob?.url) {
        // Save EXCLUSIVELY the HTTPS blob.url in state (Rule 1, 2, 3)
        onChange({
          hint: media.hint,
          url: newBlob.url,
          videoUrl: isVideo ? newBlob.url : undefined,
          imageUrl: !isVideo ? newBlob.url : undefined,
        })
      }
    } catch (err: unknown) {
      console.warn('Upload direto via Vercel Blob não concluído:', err)

      // Fallback: try server upload endpoint
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (data?.url && !data.url.startsWith('data:')) {
          onChange({
            hint: media.hint,
            url: data.url,
            videoUrl: isVideo ? data.url : undefined,
            imageUrl: !isVideo ? data.url : undefined,
          })
        } else {
          alert('Para arquivos de vídeo/foto, ative o Vercel Blob no painel da Vercel ou cole o link HTTPS direto.')
        }
      } catch {
        alert('Erro ao realizar upload do arquivo.')
      }
    } finally {
      // Rule 4: Revoke temporary preview Object URL immediately after upload completes/fails
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      setTempPreviewUrl(null)
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    if (tempPreviewUrl && tempPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(tempPreviewUrl)
    }
    setTempPreviewUrl(null)
    onChange({
      hint: media.hint,
    })
  }

  const handleUrlInputChange = (newUrl: string) => {
    const cleanUrl = newUrl.trim()
    if (cleanUrl.startsWith('data:')) {
      alert('URLs de dados Base64 não são permitidas. Cole um link HTTPS válido.')
      return
    }

    const parsed = parseMediaUrl(cleanUrl)
    if (parsed.type === 'vimeo' || parsed.type === 'youtube' || parsed.type === 'video') {
      onChange({ hint: media.hint, url: cleanUrl, videoUrl: cleanUrl, imageUrl: undefined })
    } else {
      onChange({ hint: media.hint, url: cleanUrl, imageUrl: cleanUrl, videoUrl: undefined })
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

        {(mediaInfo.type !== 'none' || tempPreviewUrl) && (
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
          height: 180,
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
        {mediaInfo.type === 'vimeo' ? (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <iframe
              src={mediaInfo.embedUrl}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '180%',
                height: '180%',
                minWidth: '100%',
                minHeight: '100%',
                transform: 'translate(-50%, -50%)',
                border: 'none',
                pointerEvents: 'none',
              }}
              allow="autoplay; fullscreen"
            />
          </div>
        ) : mediaInfo.type === 'youtube' ? (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <iframe
              src={mediaInfo.embedUrl}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '180%',
                height: '180%',
                minWidth: '100%',
                minHeight: '100%',
                transform: 'translate(-50%, -50%)',
                border: 'none',
                pointerEvents: 'none',
              }}
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : mediaInfo.type === 'video' ? (
          <video src={mediaInfo.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : mediaInfo.type === 'image' ? (
          <img src={mediaInfo.url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            Processando upload para Vercel Blob...
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
            {uploading ? 'Enviando...' : mediaInfo.type !== 'none' ? 'Trocar Mídia' : '+ Enviar Foto ou Vídeo'}
          </button>

          <span style={{ fontSize: 11, color: '#7C7369' }}>Suporta JPG, PNG, WEBP, MP4, WEBM, Vimeo e YouTube</span>
        </div>

        {/* Direct Link Input Option */}
        <div>
          <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>
            Ou cole a URL/link HTTPS (Vercel Blob, Vimeo, YouTube, MP4, WEBP, JPG):
          </label>
          <input
            type="text"
            value={rawUrl && !rawUrl.startsWith('blob:') ? rawUrl : ''}
            onChange={(e) => handleUrlInputChange(e.target.value)}
            placeholder="https://...blob.vercel-storage.com/... ou https://vimeo.com/..."
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
