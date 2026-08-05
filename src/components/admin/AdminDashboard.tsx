'use client'

import { useState, useEffect } from 'react'
import type { SiteContent, LocaleString, SiteMedia, Massage, TimelineStep, HouseRule, FaqItem, Addition, Stat } from '@/sanity/lib/types'
import MediaUploader from './MediaUploader'

interface AdminDashboardProps {
  initialContent: SiteContent
  onLogout: () => void
}

type TabType = 'brand' | 'home' | 'house' | 'rates'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

const LOCAL_STORAGE_KEY = 'maison_solene_content_backup'

export default function AdminDashboard({ initialContent, onLogout }: AdminDashboardProps) {
  const [content, setContent] = useState<SiteContent>(initialContent)
  const [activeTab, setActiveTab] = useState<TabType>('brand')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [translatingField, setTranslatingField] = useState<string | null>(null)
  const [translatingAll, setTranslatingAll] = useState(false)

  // On mount, check if browser has a newer local backup
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && typeof parsed === 'object') {
          setContent((prev) => ({ ...prev, ...parsed }))
        }
      }
    } catch {}
  }, [])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  // Generic updater
  const updateField = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  // Update locale object (pt / en)
  const updateLocaleField = (key: keyof SiteContent, subKey: 'pt' | 'en', text: string) => {
    setContent((prev) => {
      const current = (prev[key] as LocaleString) || {}
      return {
        ...prev,
        [key]: {
          ...current,
          [subKey]: text,
        },
      }
    })
  }

  // Update gallery array item (homeGallery / houseGallery)
  const updateGalleryItem = (galleryKey: 'homeGallery' | 'houseGallery', index: number, media: SiteMedia) => {
    setContent((prev) => {
      const list = [...(prev[galleryKey] || [])]
      while (list.length <= index) {
        list.push({ hint: `foto ${list.length + 1}` })
      }
      list[index] = media
      return { ...prev, [galleryKey]: list }
    })
  }

  // Single field auto-translate
  const handleTranslateField = async (fieldKey: string, ptText: string, onSuccess: (enText: string) => void) => {
    if (!ptText || !ptText.trim()) {
      showToast('Preencha primeiro o texto em Português antes de traduzir.', 'info')
      return
    }
    setTranslatingField(fieldKey)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ptText }),
      })
      const data = await res.json()
      if (data.translatedText) {
        onSuccess(data.translatedText)
        showToast('✨ Campo traduzido com sucesso!', 'success')
      } else {
        showToast(data.error || 'Erro na tradução', 'error')
      }
    } catch {
      showToast('Falha ao conectar com o serviço de tradução', 'error')
    } finally {
      setTranslatingField(null)
    }
  }

  // Helper to sanitize SiteMedia objects (ensures NO data: or blob: temporary strings are saved)
  const sanitizeMedia = (media?: SiteMedia): SiteMedia | undefined => {
    if (!media) return undefined
    let url = media.url
    let videoUrl = media.videoUrl
    let imageUrl = media.imageUrl

    if (url && (url.startsWith('data:') || url.startsWith('blob:'))) url = undefined
    if (videoUrl && (videoUrl.startsWith('data:') || videoUrl.startsWith('blob:'))) videoUrl = undefined
    if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))) imageUrl = undefined

    const finalUrl = url || videoUrl || imageUrl
    if (!finalUrl && !media.hint) return undefined

    return {
      hint: media.hint,
      url: finalUrl,
      videoUrl: videoUrl || (finalUrl && !imageUrl ? finalUrl : undefined),
      imageUrl: imageUrl || (finalUrl && !videoUrl ? finalUrl : undefined),
    }
  }

  const sanitizeContentForSaving = (rawContent: SiteContent): SiteContent => {
    const cleaned = { ...rawContent }

    cleaned.heroMedia = sanitizeMedia(cleaned.heroMedia)
    cleaned.houseIntroMedia = sanitizeMedia(cleaned.houseIntroMedia)
    cleaned.videoBannerMedia = sanitizeMedia(cleaned.videoBannerMedia)
    cleaned.houseHeroMedia = sanitizeMedia(cleaned.houseHeroMedia)
    cleaned.eveningRitualMedia = sanitizeMedia(cleaned.eveningRitualMedia)
    cleaned.bookingSidebarMedia = sanitizeMedia(cleaned.bookingSidebarMedia)

    if (cleaned.homeGallery) {
      cleaned.homeGallery = [0, 1, 2].map((i) => sanitizeMedia(cleaned.homeGallery?.[i]) || { hint: `foto ${i + 1}` })
    }
    if (cleaned.houseGallery) {
      cleaned.houseGallery = [0, 1, 2].map((i) => sanitizeMedia(cleaned.houseGallery?.[i]) || { hint: `foto ${i + 1}` })
    }
    if (cleaned.massages) {
      cleaned.massages = cleaned.massages.map((m) => ({ ...m, media: sanitizeMedia(m.media) }))
    }
    if (cleaned.timelineSteps) {
      cleaned.timelineSteps = cleaned.timelineSteps.map((s) => ({ ...s, media: sanitizeMedia(s.media) }))
    }

    return cleaned
  }

  // Save changes
  const handleSave = async () => {
    setSaving(true)

    // Rule 1, 2, 3: Sanitize content before saving to strip any base64/blob temporary URLs
    const cleanedContent = sanitizeContentForSaving(content)
    const jsonString = JSON.stringify(cleanedContent)
    const payloadBytes = new Blob([jsonString]).size
    const payloadMB = payloadBytes / (1024 * 1024)

    // Rule 7: Console log payload and confirm no values start with data:video or data:image
    console.log('[SAVING PAYLOAD]', jsonString.substring(0, 300) + '... (Total MB: ' + payloadMB.toFixed(3) + ')')
    const hasDataVideo = jsonString.includes('data:video/')
    const hasDataImage = jsonString.includes('data:image/')
    console.log('[PAYLOAD VALIDATION] Contains data:video?', hasDataVideo, '| Contains data:image?', hasDataImage)

    if (payloadMB > 3.8) {
      showToast(`O conteúdo do site (${payloadMB.toFixed(1)}MB) está próximo do limite de 4.5MB da Vercel. Por favor, utilize links diretos de vídeo para economizar espaço.`, 'error')
      setSaving(false)
      return
    }

    try {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, jsonString)
      } catch {}

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString,
      })
      const data = await res.json()
      if (data.success) {
        showToast('✅ Alterações salvas com sucesso no site e no navegador!', 'success')
      } else {
        showToast(data.error || 'Erro ao salvar alterações na Vercel', 'error')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na requisição'
      showToast(`Erro ao salvar na Vercel (${errorMessage}). O backup local foi mantido.`, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(content, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', `maison_solene_backup_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(dlAnchor)
    dlAnchor.click()
    dlAnchor.remove()
    showToast('📥 Backup JSON baixado para o seu computador!', 'success')
  }

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (parsed && typeof parsed === 'object') {
          setContent(parsed)
          showToast('📤 Backup JSON restaurado com sucesso! Clique em "Salvar Alterações".', 'success')
        } else {
          showToast('Arquivo de backup inválido', 'error')
        }
      } catch {
        showToast('Erro ao ler o arquivo JSON de backup', 'error')
      }
    }
    reader.readAsText(file)
  }

  // Auto Translate ALL fields
  const handleTranslateAll = async () => {
    setTranslatingAll(true)
    showToast('Traduzindo todos os textos do site para Inglês... Aguarde alguns instantes.', 'info')

    const autoTrans = async (loc?: LocaleString): Promise<LocaleString> => {
      const ptText = loc?.pt || ''
      if (!ptText.trim()) return loc || {}
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: ptText }),
        })
        const data = await res.json()
        return { pt: ptText, en: data.translatedText || loc?.en || ptText }
      } catch {
        return loc || { pt: ptText, en: ptText }
      }
    }

    try {
      const newContent = { ...content }

      newContent.addressNote = await autoTrans(newContent.addressNote)
      newContent.hoursLine = await autoTrans(newContent.hoursLine)
      newContent.hoursNote = await autoTrans(newContent.hoursNote)
      newContent.footerTagline = await autoTrans(newContent.footerTagline)
      newContent.heroEyebrow = await autoTrans(newContent.heroEyebrow)
      newContent.heroSubtitle = await autoTrans(newContent.heroSubtitle)
      newContent.houseIntroEyebrow = await autoTrans(newContent.houseIntroEyebrow)
      newContent.houseIntroParagraph = await autoTrans(newContent.houseIntroParagraph)

      if (newContent.stats) {
        for (const s of newContent.stats) {
          s.label = await autoTrans(s.label)
        }
      }

      newContent.massagesEyebrow = await autoTrans(newContent.massagesEyebrow)
      if (newContent.massages) {
        for (const m of newContent.massages) {
          m.title = await autoTrans(m.title)
          m.homeDescription = await autoTrans(m.homeDescription)
          m.rateDescription = await autoTrans(m.rateDescription)
        }
      }

      newContent.videoBannerQuote = await autoTrans(newContent.videoBannerQuote)
      newContent.videoBannerCaption = await autoTrans(newContent.videoBannerCaption)
      newContent.houseHeroEyebrow = await autoTrans(newContent.houseHeroEyebrow)
      newContent.houseHeroTitle = await autoTrans(newContent.houseHeroTitle)
      newContent.houseHeroSubtitle = await autoTrans(newContent.houseHeroSubtitle)
      newContent.timelineEyebrow = await autoTrans(newContent.timelineEyebrow)
      newContent.timelineNote = await autoTrans(newContent.timelineNote)

      if (newContent.timelineSteps) {
        for (const ts of newContent.timelineSteps) {
          ts.kicker = await autoTrans(ts.kicker)
          ts.title = await autoTrans(ts.title)
          ts.body = await autoTrans(ts.body)
        }
      }

      newContent.quoteText = await autoTrans(newContent.quoteText)
      newContent.rulesEyebrow = await autoTrans(newContent.rulesEyebrow)
      newContent.rulesNote = await autoTrans(newContent.rulesNote)
      newContent.rulesIntro = await autoTrans(newContent.rulesIntro)

      if (newContent.houseRules) {
        for (const r of newContent.houseRules) {
          r.title = await autoTrans(r.title)
          r.body = await autoTrans(r.body)
        }
      }

      newContent.faqEyebrow = await autoTrans(newContent.faqEyebrow)
      if (newContent.faq) {
        for (const f of newContent.faq) {
          f.question = await autoTrans(f.question)
          f.answer = await autoTrans(f.answer)
        }
      }

      newContent.ratesEyebrow = await autoTrans(newContent.ratesEyebrow)
      newContent.ratesTitle = await autoTrans(newContent.ratesTitle)
      newContent.eveningRitualQuote = await autoTrans(newContent.eveningRitualQuote)
      newContent.eveningRitualLabel = await autoTrans(newContent.eveningRitualLabel)

      if (newContent.additions) {
        for (const a of newContent.additions) {
          a.title = await autoTrans(a.title)
          a.value = await autoTrans(a.value)
          a.body = await autoTrans(a.body)
        }
      }

      newContent.paymentTitle = await autoTrans(newContent.paymentTitle)
      newContent.paymentBody = await autoTrans(newContent.paymentBody)
      newContent.cancellationTitle = await autoTrans(newContent.cancellationTitle)
      newContent.cancellationBody = await autoTrans(newContent.cancellationBody)
      newContent.bookingEyebrow = await autoTrans(newContent.bookingEyebrow)
      newContent.bookingTitle = await autoTrans(newContent.bookingTitle)
      newContent.bookingBeforeSendNote = await autoTrans(newContent.bookingBeforeSendNote)
      newContent.bookingConfirmation = await autoTrans(newContent.bookingConfirmation)

      setContent(newContent)
      showToast('✨ Todo o site foi traduzido para o Inglês com sucesso!', 'success')
    } catch {
      showToast('Erro ao traduzir o site completo', 'error')
    } finally {
      setTranslatingAll(false)
    }
  }

  // Helper for dual language input block
  const renderLocaleInput = (
    label: string,
    fieldKey: keyof SiteContent,
    locObj: LocaleString | undefined,
    onChangeLoc: (newLoc: LocaleString) => void,
    isTextArea = false
  ) => {
    const pt = locObj?.pt || ''
    const en = locObj?.en || ''

    return (
      <div
        style={{
          background: '#130D0F',
          border: '1px solid rgba(201,162,91,.15)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label style={{ color: '#EDE6DD', fontSize: 13, fontWeight: 600 }}>{label}</label>
          <button
            type="button"
            disabled={translatingField === fieldKey}
            onClick={() =>
              handleTranslateField(fieldKey as string, pt, (translated) => {
                onChangeLoc({ pt, en: translated })
              })
            }
            style={{
              background: 'rgba(201,162,91,.15)',
              border: '1px solid rgba(201,162,91,.4)',
              color: '#C9A25B',
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {translatingField === fieldKey ? 'Traduzindo...' : '✨ Traduzir EN'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <span style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>
              🇵🇹 Português
            </span>
            {isTextArea ? (
              <textarea
                value={pt}
                onChange={(e) => onChangeLoc({ pt: e.target.value, en })}
                rows={3}
                style={{
                  width: '100%',
                  background: '#0B0809',
                  border: '1px solid rgba(201,162,91,.2)',
                  borderRadius: 4,
                  padding: '8px 12px',
                  color: '#EDE6DD',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <input
                type="text"
                value={pt}
                onChange={(e) => onChangeLoc({ pt: e.target.value, en })}
                style={{
                  width: '100%',
                  background: '#0B0809',
                  border: '1px solid rgba(201,162,91,.2)',
                  borderRadius: 4,
                  padding: '8px 12px',
                  color: '#EDE6DD',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          <div>
            <span style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>
              🇬🇧 Inglês
            </span>
            {isTextArea ? (
              <textarea
                value={en}
                onChange={(e) => onChangeLoc({ pt, en: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  background: '#0B0809',
                  border: '1px solid rgba(201,162,91,.2)',
                  borderRadius: 4,
                  padding: '8px 12px',
                  color: '#EDE6DD',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <input
                type="text"
                value={en}
                onChange={(e) => onChangeLoc({ pt, en: e.target.value })}
                style={{
                  width: '100%',
                  background: '#0B0809',
                  border: '1px solid rgba(201,162,91,.2)',
                  borderRadius: 4,
                  padding: '8px 12px',
                  color: '#EDE6DD',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B0809',
        color: '#EDE6DD',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: toast.type === 'success' ? '#183823' : toast.type === 'error' ? '#4A151D' : '#1F2A38',
            border: `1px solid ${toast.type === 'success' ? '#276E40' : toast.type === 'error' ? '#B0243A' : '#3A5B80'}`,
            color: toast.type === 'success' ? '#6CE097' : toast.type === 'error' ? '#FF9EA9' : '#9ECBFF',
            padding: '14px 20px',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            fontSize: 13,
            maxWidth: 420,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#130D0F',
          borderBottom: '1px solid rgba(201,162,91,.2)',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontFamily: 'serif', fontSize: 20, margin: 0, color: '#C9A25B', fontWeight: 400 }}>
            MAISON SOLÈNE
          </h1>
          <span style={{ fontSize: 11, background: 'rgba(201,162,91,.15)', color: '#C9A25B', padding: '2px 8px', borderRadius: 4 }}>
            PAINEL ADMIN
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportBackup}
            style={{
              background: '#181214',
              border: '1px solid rgba(201,162,91,.3)',
              color: '#C9A25B',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            📥 Backup JSON
          </button>

          <label
            style={{
              background: '#181214',
              border: '1px solid rgba(201,162,91,.3)',
              color: '#C9A25B',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            📤 Restaurar
            <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            disabled={translatingAll}
            onClick={handleTranslateAll}
            style={{
              background: 'linear-gradient(135deg, #7C5C26 0%, #C9A25B 100%)',
              color: '#0B0809',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {translatingAll ? 'Traduzindo Tudo...' : '✨ Traduzir Tudo (PT → EN)'}
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#EDE6DD',
              textDecoration: 'none',
              fontSize: 13,
              padding: '8px 14px',
              border: '1px solid rgba(237,230,221,.2)',
              borderRadius: 6,
            }}
          >
            👁️ Ver Site
          </a>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            style={{
              background: '#C9A25B',
              color: '#0B0809',
              border: 'none',
              padding: '9px 20px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Salvando...' : '💾 Salvar Alterações'}
          </button>

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(176,36,58,.4)',
              color: '#E06B78',
              padding: '8px 14px',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid rgba(201,162,91,.2)',
            marginBottom: 28,
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'brand', label: '📍 Marca & Contato' },
            { id: 'home', label: '🏠 Página de Início' },
            { id: 'house', label: '🚪 A Casa' },
            { id: 'rates', label: '💳 Valores & Agendar' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{
                  background: isActive ? '#C9A25B' : 'transparent',
                  color: isActive ? '#0B0809' : '#EDE6DD',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px 6px 0 0',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* TAB 1: BRAND / CONTATO */}
        {activeTab === 'brand' && (
          <div>
            <h2 style={{ fontSize: 20, color: '#C9A25B', marginBottom: 20, fontWeight: 400 }}>Marca & Contato</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#C9A25B', display: 'block', marginBottom: 6 }}>Nome da Casa</label>
                <input
                  type="text"
                  value={content.brandName || ''}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  style={{
                    width: '100%',
                    background: '#130D0F',
                    border: '1px solid rgba(201,162,91,.2)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#EDE6DD',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#C9A25B', display: 'block', marginBottom: 6 }}>WhatsApp (ex: +353 87 000 0000)</label>
                <input
                  type="text"
                  value={content.whatsapp || ''}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  style={{
                    width: '100%',
                    background: '#130D0F',
                    border: '1px solid rgba(201,162,91,.2)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#EDE6DD',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#C9A25B', display: 'block', marginBottom: 6 }}>E-mail de Contato</label>
                <input
                  type="text"
                  value={content.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  style={{
                    width: '100%',
                    background: '#130D0F',
                    border: '1px solid rgba(201,162,91,.2)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#EDE6DD',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#C9A25B', display: 'block', marginBottom: 6 }}>Endereço (Linha Principal)</label>
                <input
                  type="text"
                  value={content.addressLine || ''}
                  onChange={(e) => updateField('addressLine', e.target.value)}
                  style={{
                    width: '100%',
                    background: '#130D0F',
                    border: '1px solid rgba(201,162,91,.2)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    color: '#EDE6DD',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {renderLocaleInput('Nota do Endereço (ex: Dublin 2 · endereço enviado após confirmação)', 'addressNote', content.addressNote, (v) =>
              updateField('addressNote', v)
            )}
            {renderLocaleInput('Horário Principal (ex: Seg – Sáb · 11h às 23h)', 'hoursLine', content.hoursLine, (v) =>
              updateField('hoursLine', v)
            )}
            {renderLocaleInput('Nota de Horário (ex: Domingo sob consulta)', 'hoursNote', content.hoursNote, (v) =>
              updateField('hoursNote', v)
            )}
            {renderLocaleInput('Linha do Rodapé', 'footerTagline', content.footerTagline, (v) =>
              updateField('footerTagline', v)
            )}
          </div>
        )}

        {/* TAB 2: INÍCIO */}
        {activeTab === 'home' && (
          <div>
            <h2 style={{ fontSize: 20, color: '#C9A25B', marginBottom: 20, fontWeight: 400 }}>Página de Início</h2>

            {/* HERO SECTION */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                1. Abertura do Site (Hero)
              </h3>

              <MediaUploader
                label="Foto / Vídeo da Abertura Principal (Hero)"
                media={content.heroMedia}
                onChange={(media) => updateField('heroMedia', media)}
              />

              {renderLocaleInput('Selo acima do título (Hero Eyebrow)', 'heroEyebrow', content.heroEyebrow, (v) =>
                updateField('heroEyebrow', v)
              )}

              <div style={{ background: '#0B0809', border: '1px solid rgba(201,162,91,.15)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <label style={{ color: '#EDE6DD', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                  Título Principal da Abertura (suporta &lt;br /&gt; para quebrar linha)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>🇵🇹 Português</span>
                    <input
                      type="text"
                      value={content.heroTitlePt || ''}
                      onChange={(e) => updateField('heroTitlePt', e.target.value)}
                      style={{
                        width: '100%',
                        background: '#130D0F',
                        border: '1px solid rgba(201,162,91,.2)',
                        borderRadius: 4,
                        padding: '8px 12px',
                        color: '#EDE6DD',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>🇬🇧 Inglês</span>
                    <input
                      type="text"
                      value={content.heroTitleEn || ''}
                      onChange={(e) => updateField('heroTitleEn', e.target.value)}
                      style={{
                        width: '100%',
                        background: '#130D0F',
                        border: '1px solid rgba(201,162,91,.2)',
                        borderRadius: 4,
                        padding: '8px 12px',
                        color: '#EDE6DD',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {renderLocaleInput('Subtítulo da Abertura (Hero Subtitle)', 'heroSubtitle', content.heroSubtitle, (v) =>
                updateField('heroSubtitle', v),
                true
              )}
            </div>

            {/* INTRO & STATS */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                2. Apresentação da Casa & Estatísticas
              </h3>

              <MediaUploader
                label="Foto / Vídeo de Apoio da Seção A Casa (Ao lado do texto de apresentação)"
                media={content.houseIntroMedia}
                onChange={(media) => updateField('houseIntroMedia', media)}
              />

              {renderLocaleInput('Selo da Introdução', 'houseIntroEyebrow', content.houseIntroEyebrow, (v) =>
                updateField('houseIntroEyebrow', v)
              )}

              {renderLocaleInput('Parágrafo Principal de Apresentação', 'houseIntroParagraph', content.houseIntroParagraph, (v) =>
                updateField('houseIntroParagraph', v),
                true
              )}

              <div style={{ borderTop: '1px dashed rgba(201,162,91,.2)', paddingTop: 16, marginTop: 16 }}>
                <h4 style={{ color: '#EDE6DD', fontSize: 14, margin: '0 0 12px 0' }}>Estatísticas em Destaque (3 itens)</h4>
                {(content.stats || []).map((st, idx) => (
                  <div key={idx} style={{ background: '#0B0809', border: '1px solid rgba(201,162,91,.15)', borderRadius: 6, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Número</label>
                        <input
                          type="text"
                          value={st.number || ''}
                          onChange={(e) => {
                            const newStats = [...(content.stats || [])]
                            newStats[idx] = { ...newStats[idx], number: e.target.value }
                            updateField('stats', newStats)
                          }}
                          style={{
                            width: '100%',
                            background: '#130D0F',
                            border: '1px solid rgba(201,162,91,.2)',
                            borderRadius: 4,
                            padding: '6px 10px',
                            color: '#EDE6DD',
                            fontSize: 13,
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Texto da Estatística (PT / EN)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Português"
                            value={st.label?.pt || ''}
                            onChange={(e) => {
                              const newStats = [...(content.stats || [])]
                              newStats[idx] = {
                                ...newStats[idx],
                                label: { ...newStats[idx].label, pt: e.target.value },
                              }
                              updateField('stats', newStats)
                            }}
                            style={{
                              width: '100%',
                              background: '#130D0F',
                              border: '1px solid rgba(201,162,91,.2)',
                              borderRadius: 4,
                              padding: '6px 10px',
                              color: '#EDE6DD',
                              fontSize: 13,
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Inglês"
                            value={st.label?.en || ''}
                            onChange={(e) => {
                              const newStats = [...(content.stats || [])]
                              newStats[idx] = {
                                ...newStats[idx],
                                label: { ...newStats[idx].label, en: e.target.value },
                              }
                              updateField('stats', newStats)
                            }}
                            style={{
                              width: '100%',
                              background: '#130D0F',
                              border: '1px solid rgba(201,162,91,.2)',
                              borderRadius: 4,
                              padding: '6px 10px',
                              color: '#EDE6DD',
                              fontSize: 13,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MASSAGES LISTING & MEDIA */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                3. As 4 Massagens (Títulos, Descrições & Mídias)
              </h3>

              {renderLocaleInput('Selo da Seção de Massagens', 'massagesEyebrow', content.massagesEyebrow, (v) =>
                updateField('massagesEyebrow', v)
              )}

              {(content.massages || []).map((m, idx) => (
                <div key={idx} style={{ background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <h4 style={{ color: '#C9A25B', margin: '0 0 12px 0', fontSize: 15 }}>
                    Massagem {idx + 1}: {m.title?.pt || 'Sem Título'}
                  </h4>

                  <MediaUploader
                    label={`Foto / Vídeo da Massagem ${idx + 1}`}
                    media={m.media}
                    onChange={(updatedMedia) => {
                      const newMassages = [...(content.massages || [])]
                      newMassages[idx] = { ...newMassages[idx], media: updatedMedia }
                      updateField('massages', newMassages)
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Nome em Português</label>
                      <input
                        type="text"
                        value={m.title?.pt || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], title: { ...newMassages[idx].title, pt: e.target.value } }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Nome em Inglês</label>
                      <input
                        type="text"
                        value={m.title?.en || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], title: { ...newMassages[idx].title, en: e.target.value } }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Descrição na Home (Português)</label>
                      <textarea
                        rows={2}
                        value={m.homeDescription?.pt || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], homeDescription: { ...newMassages[idx].homeDescription, pt: e.target.value } }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Descrição na Home (Inglês)</label>
                      <textarea
                        rows={2}
                        value={m.homeDescription?.en || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], homeDescription: { ...newMassages[idx].homeDescription, en: e.target.value } }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* VIDEO BANNER SECTION */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                4. Banner de Vídeo em Destaque no Início
              </h3>

              <MediaUploader
                label="Vídeo / Foto do Banner Central do Início"
                media={content.videoBannerMedia}
                onChange={(media) => updateField('videoBannerMedia', media)}
              />

              {renderLocaleInput('Frase sobre o Vídeo (Quote)', 'videoBannerQuote', content.videoBannerQuote, (v) =>
                updateField('videoBannerQuote', v)
              )}

              {renderLocaleInput('Legenda do Vídeo (ex: Filme da casa · 40 segundos)', 'videoBannerCaption', content.videoBannerCaption, (v) =>
                updateField('videoBannerCaption', v)
              )}
            </div>

            {/* HOME GALLERY */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                5. Galeria de Fotos / Vídeos da Página de Início (3 mídias)
              </h3>

              {[0, 1, 2].map((gIdx) => (
                <MediaUploader
                  key={gIdx}
                  label={`Galeria do Início - Foto / Vídeo ${gIdx + 1}`}
                  media={content.homeGallery?.[gIdx]}
                  onChange={(updatedMedia) => updateGalleryItem('homeGallery', gIdx, updatedMedia)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: A CASA */}
        {activeTab === 'house' && (
          <div>
            <h2 style={{ fontSize: 20, color: '#C9A25B', marginBottom: 20, fontWeight: 400 }}>A Casa</h2>

            {/* HOUSE HERO */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                1. Abertura da Seção "A Casa"
              </h3>

              <MediaUploader
                label="Foto / Vídeo de Abertura da Casa"
                media={content.houseHeroMedia}
                onChange={(media) => updateField('houseHeroMedia', media)}
              />

              {renderLocaleInput('Selo da Casa', 'houseHeroEyebrow', content.houseHeroEyebrow, (v) =>
                updateField('houseHeroEyebrow', v)
              )}
              {renderLocaleInput('Título da Casa', 'houseHeroTitle', content.houseHeroTitle, (v) =>
                updateField('houseHeroTitle', v)
              )}
              {renderLocaleInput('Subtítulo da Casa', 'houseHeroSubtitle', content.houseHeroSubtitle, (v) =>
                updateField('houseHeroSubtitle', v)
              )}
            </div>

            {/* O PERCURSO / TIMELINE */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                2. O Percurso (4 Passos com Foto/Vídeo)
              </h3>

              {renderLocaleInput('Selo do Percurso', 'timelineEyebrow', content.timelineEyebrow, (v) =>
                updateField('timelineEyebrow', v)
              )}
              {renderLocaleInput('Nota do Percurso', 'timelineNote', content.timelineNote, (v) =>
                updateField('timelineNote', v)
              )}

              {(content.timelineSteps || []).map((step, idx) => (
                <div key={idx} style={{ background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <h4 style={{ color: '#C9A25B', margin: '0 0 12px 0', fontSize: 15 }}>
                    Passo {idx + 1}: {step.title?.pt || 'Sem Título'}
                  </h4>

                  <MediaUploader
                    label={`Foto / Vídeo do Passo ${idx + 1}`}
                    media={step.media}
                    onChange={(updatedMedia) => {
                      const newSteps = [...(content.timelineSteps || [])]
                      newSteps[idx] = { ...newSteps[idx], media: updatedMedia }
                      updateField('timelineSteps', newSteps)
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Horário / Etapa (PT)</label>
                      <input
                        type="text"
                        value={step.kicker?.pt || ''}
                        onChange={(e) => {
                          const newSteps = [...(content.timelineSteps || [])]
                          newSteps[idx] = { ...newSteps[idx], kicker: { ...newSteps[idx].kicker, pt: e.target.value } }
                          updateField('timelineSteps', newSteps)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Horário / Etapa (EN)</label>
                      <input
                        type="text"
                        value={step.kicker?.en || ''}
                        onChange={(e) => {
                          const newSteps = [...(content.timelineSteps || [])]
                          newSteps[idx] = { ...newSteps[idx], kicker: { ...newSteps[idx].kicker, en: e.target.value } }
                          updateField('timelineSteps', newSteps)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Título do Passo (PT)</label>
                      <input
                        type="text"
                        value={step.title?.pt || ''}
                        onChange={(e) => {
                          const newSteps = [...(content.timelineSteps || [])]
                          newSteps[idx] = { ...newSteps[idx], title: { ...newSteps[idx].title, pt: e.target.value } }
                          updateField('timelineSteps', newSteps)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Título do Passo (EN)</label>
                      <input
                        type="text"
                        value={step.title?.en || ''}
                        onChange={(e) => {
                          const newSteps = [...(content.timelineSteps || [])]
                          newSteps[idx] = { ...newSteps[idx], title: { ...newSteps[idx].title, en: e.target.value } }
                          updateField('timelineSteps', newSteps)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Texto Explicativo (PT)</label>
                      <textarea
                        rows={2}
                        value={step.body?.pt || ''}
                        onChange={(e) => {
                          const newSteps = [...(content.timelineSteps || [])]
                          newSteps[idx] = { ...newSteps[idx], body: { ...newSteps[idx].body, pt: e.target.value } }
                          updateField('timelineSteps', newSteps)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Texto Explicativo (EN)</label>
                      <textarea
                        rows={2}
                        value={step.body?.en || ''}
                        onChange={(e) => {
                          const newSteps = [...(content.timelineSteps || [])]
                          newSteps[idx] = { ...newSteps[idx], body: { ...newSteps[idx].body, en: e.target.value } }
                          updateField('timelineSteps', newSteps)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DISCRETION QUOTE */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                3. Frase de Destaque sobre Discrição
              </h3>
              {renderLocaleInput('Frase de Destaque', 'quoteText', content.quoteText, (v) =>
                updateField('quoteText', v),
                true
              )}
            </div>

            {/* HOUSE GALLERY */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                4. Galeria de Fotos / Vídeos da Casa (3 mídias)
              </h3>

              {[0, 1, 2].map((gIdx) => (
                <MediaUploader
                  key={gIdx}
                  label={`Galeria da Casa - Foto / Vídeo ${gIdx + 1}`}
                  media={content.houseGallery?.[gIdx]}
                  onChange={(updatedMedia) => updateGalleryItem('houseGallery', gIdx, updatedMedia)}
                />
              ))}
            </div>

            {/* HOUSE RULES */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                5. As 5 Regras da Casa
              </h3>

              {renderLocaleInput('Selo das Regras', 'rulesEyebrow', content.rulesEyebrow, (v) =>
                updateField('rulesEyebrow', v)
              )}
              {renderLocaleInput('Nota das Regras', 'rulesNote', content.rulesNote, (v) =>
                updateField('rulesNote', v)
              )}
              {renderLocaleInput('Introdução das Regras', 'rulesIntro', content.rulesIntro, (v) =>
                updateField('rulesIntro', v),
                true
              )}

              {(content.houseRules || []).map((r, idx) => (
                <div key={idx} style={{ background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <h4 style={{ color: '#C9A25B', margin: '0 0 10px 0', fontSize: 14 }}>Regra {idx + 1}: {r.title?.pt || 'Sem Título'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <input
                      type="text"
                      placeholder="Título da Regra (PT)"
                      value={r.title?.pt || ''}
                      onChange={(e) => {
                        const newRules = [...(content.houseRules || [])]
                        newRules[idx] = { ...newRules[idx], title: { ...newRules[idx].title, pt: e.target.value } }
                        updateField('houseRules', newRules)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                    <input
                      type="text"
                      placeholder="Título da Regra (EN)"
                      value={r.title?.en || ''}
                      onChange={(e) => {
                        const newRules = [...(content.houseRules || [])]
                        newRules[idx] = { ...newRules[idx], title: { ...newRules[idx].title, en: e.target.value } }
                        updateField('houseRules', newRules)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <textarea
                      rows={2}
                      placeholder="Texto da Regra (PT)"
                      value={r.body?.pt || ''}
                      onChange={(e) => {
                        const newRules = [...(content.houseRules || [])]
                        newRules[idx] = { ...newRules[idx], body: { ...newRules[idx].body, pt: e.target.value } }
                        updateField('houseRules', newRules)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                    <textarea
                      rows={2}
                      placeholder="Texto da Regra (EN)"
                      value={r.body?.en || ''}
                      onChange={(e) => {
                        const newRules = [...(content.houseRules || [])]
                        newRules[idx] = { ...newRules[idx], body: { ...newRules[idx].body, en: e.target.value } }
                        updateField('houseRules', newRules)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                6. Perguntas Frequentes (FAQ)
              </h3>

              {renderLocaleInput('Selo do FAQ', 'faqEyebrow', content.faqEyebrow, (v) =>
                updateField('faqEyebrow', v)
              )}

              {(content.faq || []).map((item, idx) => (
                <div key={idx} style={{ background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <h4 style={{ color: '#C9A25B', margin: '0 0 10px 0', fontSize: 14 }}>Pergunta {idx + 1}: {item.question?.pt || 'Sem Pergunta'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <input
                      type="text"
                      placeholder="Pergunta (PT)"
                      value={item.question?.pt || ''}
                      onChange={(e) => {
                        const newFaq = [...(content.faq || [])]
                        newFaq[idx] = { ...newFaq[idx], question: { ...newFaq[idx].question, pt: e.target.value } }
                        updateField('faq', newFaq)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                    <input
                      type="text"
                      placeholder="Pergunta (EN)"
                      value={item.question?.en || ''}
                      onChange={(e) => {
                        const newFaq = [...(content.faq || [])]
                        newFaq[idx] = { ...newFaq[idx], question: { ...newFaq[idx].question, en: e.target.value } }
                        updateField('faq', newFaq)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <textarea
                      rows={3}
                      placeholder="Resposta (PT)"
                      value={item.answer?.pt || ''}
                      onChange={(e) => {
                        const newFaq = [...(content.faq || [])]
                        newFaq[idx] = { ...newFaq[idx], answer: { ...newFaq[idx].answer, pt: e.target.value } }
                        updateField('faq', newFaq)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                    <textarea
                      rows={3}
                      placeholder="Resposta (EN)"
                      value={item.answer?.en || ''}
                      onChange={(e) => {
                        const newFaq = [...(content.faq || [])]
                        newFaq[idx] = { ...newFaq[idx], answer: { ...newFaq[idx].answer, en: e.target.value } }
                        updateField('faq', newFaq)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: VALORES & AGENDAR */}
        {activeTab === 'rates' && (
          <div>
            <h2 style={{ fontSize: 20, color: '#C9A25B', marginBottom: 20, fontWeight: 400 }}>Valores & Agendar</h2>

            {/* HEADERS */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                1. Cabeçalho de Valores
              </h3>
              {renderLocaleInput('Selo dos Valores', 'ratesEyebrow', content.ratesEyebrow, (v) =>
                updateField('ratesEyebrow', v)
              )}
              {renderLocaleInput('Título da Tabela de Valores', 'ratesTitle', content.ratesTitle, (v) =>
                updateField('ratesTitle', v)
              )}
            </div>

            {/* MASSAGE RATES & DURATIONS */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                2. Tabela de Preços e Tempos (As 4 Massagens)
              </h3>

              {(content.massages || []).map((m, idx) => (
                <div key={idx} style={{ background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <h4 style={{ color: '#C9A25B', margin: '0 0 12px 0', fontSize: 15 }}>
                    Massagem {idx + 1}: {m.title?.pt || 'Sem Título'}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Descrição dos Valores (Português)</label>
                      <textarea
                        rows={2}
                        value={m.rateDescription?.pt || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], rateDescription: { ...newMassages[idx].rateDescription, pt: e.target.value } }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Descrição dos Valores (Inglês)</label>
                      <textarea
                        rows={2}
                        value={m.rateDescription?.en || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], rateDescription: { ...newMassages[idx].rateDescription, en: e.target.value } }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Duração 1 (ex: 60')</label>
                      <input
                        type="text"
                        value={m.duration1 || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], duration1: e.target.value }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Preço 1 (ex: €120)</label>
                      <input
                        type="text"
                        value={m.price1 || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], price1: e.target.value }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Duração 2 (ex: 90')</label>
                      <input
                        type="text"
                        value={m.duration2 || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], duration2: e.target.value }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Preço 2 (ex: €165)</label>
                      <input
                        type="text"
                        value={m.price2 || ''}
                        onChange={(e) => {
                          const newMassages = [...(content.massages || [])]
                          newMassages[idx] = { ...newMassages[idx], price2: e.target.value }
                          updateField('massages', newMassages)
                        }}
                        style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* EVENING RITUAL */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                3. Banner de Destaque - Ritual Noturno
              </h3>

              <MediaUploader
                label="Foto / Vídeo do Ritual Noturno"
                media={content.eveningRitualMedia}
                onChange={(media) => updateField('eveningRitualMedia', media)}
              />

              {renderLocaleInput('Citação do Ritual Noturno', 'eveningRitualQuote', content.eveningRitualQuote, (v) =>
                updateField('eveningRitualQuote', v)
              )}
              {renderLocaleInput('Etiqueta e Valor (ex: Ritual Noturno · 90 min · €260)', 'eveningRitualLabel', content.eveningRitualLabel, (v) =>
                updateField('eveningRitualLabel', v)
              )}
            </div>

            {/* ADDITIONS */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                4. Acréscimos (3 Itens)
              </h3>

              {renderLocaleInput('Selo dos Acréscimos', 'additionsEyebrow', content.additionsEyebrow, (v) =>
                updateField('additionsEyebrow', v)
              )}

              {(content.additions || []).map((add, idx) => (
                <div key={idx} style={{ background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <h4 style={{ color: '#C9A25B', margin: '0 0 10px 0', fontSize: 14 }}>Acréscimo {idx + 1}: {add.title?.pt || 'Sem Título'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 10, marginBottom: 10 }}>
                    <input
                      type="text"
                      placeholder="Nome (PT)"
                      value={add.title?.pt || ''}
                      onChange={(e) => {
                        const newAdditions = [...(content.additions || [])]
                        newAdditions[idx] = { ...newAdditions[idx], title: { ...newAdditions[idx].title, pt: e.target.value } }
                        updateField('additions', newAdditions)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                    <input
                      type="text"
                      placeholder="Nome (EN)"
                      value={add.title?.en || ''}
                      onChange={(e) => {
                        const newAdditions = [...(content.additions || [])]
                        newAdditions[idx] = { ...newAdditions[idx], title: { ...newAdditions[idx].title, en: e.target.value } }
                        updateField('additions', newAdditions)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                    <input
                      type="text"
                      placeholder="Valor (ex: €60)"
                      value={add.value?.pt || ''}
                      onChange={(e) => {
                        const newAdditions = [...(content.additions || [])]
                        newAdditions[idx] = {
                          ...newAdditions[idx],
                          value: { pt: e.target.value, en: e.target.value },
                        }
                        updateField('additions', newAdditions)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <textarea
                      rows={2}
                      placeholder="Descrição (PT)"
                      value={add.body?.pt || ''}
                      onChange={(e) => {
                        const newAdditions = [...(content.additions || [])]
                        newAdditions[idx] = { ...newAdditions[idx], body: { ...newAdditions[idx].body, pt: e.target.value } }
                        updateField('additions', newAdditions)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                    <textarea
                      rows={2}
                      placeholder="Descrição (EN)"
                      value={add.body?.en || ''}
                      onChange={(e) => {
                        const newAdditions = [...(content.additions || [])]
                        newAdditions[idx] = { ...newAdditions[idx], body: { ...newAdditions[idx].body, en: e.target.value } }
                        updateField('additions', newAdditions)
                      }}
                      style={{ width: '100%', background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* PAYMENT & CANCELLATION */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                5. Pagamento & Política de Cancelamento
              </h3>
              {renderLocaleInput('Título - Formas de Pagamento', 'paymentTitle', content.paymentTitle, (v) =>
                updateField('paymentTitle', v)
              )}
              {renderLocaleInput('Texto - Formas de Pagamento', 'paymentBody', content.paymentBody, (v) =>
                updateField('paymentBody', v),
                true
              )}
              {renderLocaleInput('Título - Cancelamento', 'cancellationTitle', content.cancellationTitle, (v) =>
                updateField('cancellationTitle', v)
              )}
              {renderLocaleInput('Texto - Cancelamento', 'cancellationBody', content.cancellationBody, (v) =>
                updateField('cancellationBody', v),
                true
              )}
            </div>

            {/* BOOKING SECTION */}
            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#C9A25B', fontSize: 16, marginTop: 0, marginBottom: 16, fontWeight: 500 }}>
                6. Seção de Agendamento
              </h3>

              <MediaUploader
                label="Foto / Vídeo Lateral do Formulário de Agendamento"
                media={content.bookingSidebarMedia}
                onChange={(media) => updateField('bookingSidebarMedia', media)}
              />

              {renderLocaleInput('Selo do Agendamento', 'bookingEyebrow', content.bookingEyebrow, (v) =>
                updateField('bookingEyebrow', v)
              )}
              {renderLocaleInput('Título do Agendamento', 'bookingTitle', content.bookingTitle, (v) =>
                updateField('bookingTitle', v)
              )}
              {renderLocaleInput('Nota antes de Enviar o Pedido', 'bookingBeforeSendNote', content.bookingBeforeSendNote, (v) =>
                updateField('bookingBeforeSendNote', v),
                true
              )}
              {renderLocaleInput('Mensagem de Confirmação', 'bookingConfirmation', content.bookingConfirmation, (v) =>
                updateField('bookingConfirmation', v)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
