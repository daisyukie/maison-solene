'use client'

import { useState } from 'react'
import type { SiteContent, LocaleString, SiteMedia, Massage, TimelineStep, HouseRule, FaqItem, Addition, Stat } from '@/sanity/lib/types'
import MediaUploader from './MediaUploader'

interface AdminDashboardProps {
  initialContent: SiteContent
  onLogout: () => void
}

type TabType = 'brand' | 'home' | 'house' | 'rates' | 'booking'

export default function AdminDashboard({ initialContent, onLogout }: AdminDashboardProps) {
  const [content, setContent] = useState<SiteContent>(initialContent)
  const [activeTab, setActiveTab] = useState<TabType>('brand')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [translatingField, setTranslatingField] = useState<string | null>(null)
  const [translatingAll, setTranslatingAll] = useState(false)

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

  // Single field auto-translate
  const handleTranslateField = async (fieldKey: string, ptText: string, onSuccess: (enText: string) => void) => {
    if (!ptText || !ptText.trim()) {
      alert('Preencha primeiro o texto em Português antes de traduzir.')
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
      } else {
        alert(data.error || 'Erro na tradução')
      }
    } catch {
      alert('Falha ao conectar com o serviço de tradução')
    } finally {
      setTranslatingField(null)
    }
  }

  // Save changes
  const handleSave = async () => {
    setSaving(true)
    setSaveMessage('')
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      const data = await res.json()
      if (data.success) {
        setSaveMessage('✅ Alterações salvas com sucesso!')
        setTimeout(() => setSaveMessage(''), 4000)
      } else {
        alert(data.error || 'Erro ao salvar alterações')
      }
    } catch {
      alert('Erro na requisição ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Auto translate all empty EN fields across content
  const handleTranslateAll = async () => {
    if (!confirm('Deseja preencher automaticamente todos os campos em Inglês que estiverem em branco?')) return

    setTranslatingAll(true)
    try {
      const newContent = JSON.parse(JSON.stringify(content)) as SiteContent

      const autoTrans = async (loc?: LocaleString): Promise<LocaleString | undefined> => {
        if (!loc || !loc.pt) return loc
        if (!loc.en || !loc.en.trim()) {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: loc.pt }),
          })
          const data = await res.json()
          if (data.translatedText) {
            return { pt: loc.pt, en: data.translatedText }
          }
        }
        return loc
      }

      // Brand
      newContent.addressNote = await autoTrans(newContent.addressNote)
      newContent.hoursLine = await autoTrans(newContent.hoursLine)
      newContent.hoursNote = await autoTrans(newContent.hoursNote)
      newContent.footerTagline = await autoTrans(newContent.footerTagline)

      // Home
      newContent.heroEyebrow = await autoTrans(newContent.heroEyebrow)
      if (newContent.heroTitlePt && (!newContent.heroTitleEn || !newContent.heroTitleEn.trim())) {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newContent.heroTitlePt }),
        })
        const data = await res.json()
        if (data.translatedText) newContent.heroTitleEn = data.translatedText
      }
      newContent.heroSubtitle = await autoTrans(newContent.heroSubtitle)
      newContent.houseIntroEyebrow = await autoTrans(newContent.houseIntroEyebrow)
      newContent.houseIntroParagraph = await autoTrans(newContent.houseIntroParagraph)

      if (newContent.stats) {
        for (const st of newContent.stats) {
          st.label = await autoTrans(st.label)
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

      // House
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

      // Rates
      newContent.ratesEyebrow = await autoTrans(newContent.ratesEyebrow)
      newContent.ratesTitle = await autoTrans(newContent.ratesTitle)
      newContent.eveningRitualQuote = await autoTrans(newContent.eveningRitualQuote)
      newContent.eveningRitualLabel = await autoTrans(newContent.eveningRitualLabel)
      newContent.additionsEyebrow = await autoTrans(newContent.additionsEyebrow)

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

      // Booking
      newContent.bookingEyebrow = await autoTrans(newContent.bookingEyebrow)
      newContent.bookingTitle = await autoTrans(newContent.bookingTitle)
      newContent.bookingBeforeSendNote = await autoTrans(newContent.bookingBeforeSendNote)
      newContent.bookingConfirmation = await autoTrans(newContent.bookingConfirmation)

      setContent(newContent)
      alert('Tradução automática concluída! Clique em "Salvar Alterações" para aplicar.')
    } catch {
      alert('Erro durante a tradução automática')
    } finally {
      setTranslatingAll(false)
    }
  }

  // Helper renderer for dual-language inputs (PT / EN)
  const renderLocaleInput = (
    label: string,
    fieldKey: string,
    loc: LocaleString | undefined,
    onChangeLoc: (newLoc: LocaleString) => void,
    isTextArea = false
  ) => {
    const pt = loc?.pt || ''
    const en = loc?.en || ''

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
              handleTranslateField(fieldKey, pt, (translated) => {
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
                  outline: 'none',
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
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          <div>
            <span style={{ fontSize: 11, color: '#9A8F88', display: 'block', marginBottom: 4 }}>
              🇬🇧 English
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
                  outline: 'none',
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
                  outline: 'none',
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
      {/* Top Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#130D0F',
          borderBottom: '1px solid rgba(201,162,91,.2)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: '#C9A25B',
              letterSpacing: '0.1em',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Maison Solène · Painel Admin
          </h1>
          {saveMessage && <span style={{ fontSize: 13, color: '#C9A25B', fontWeight: 500 }}>{saveMessage}</span>}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            disabled={translatingAll}
            onClick={handleTranslateAll}
            style={{
              background: 'rgba(201,162,91,.15)',
              border: '1px solid rgba(201,162,91,.4)',
              color: '#C9A25B',
              padding: '8px 14px',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {translatingAll ? 'Traduzindo site...' : '✨ Traduzir Tudo (PT → EN)'}
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
            { id: 'home', label: '🏠 Início' },
            { id: 'house', label: '🚪 A Casa' },
            { id: 'rates', label: '💳 Valores' },
            { id: 'booking', label: '📅 Agendamento' },
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
                  padding: '10px 18px',
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
                <label style={{ fontSize: 12, color: '#C9A25B', display: 'block', marginBottom: 6 }}>Endereço (rua e número)</label>
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

            <MediaUploader
              label="Foto / Vídeo de Abertura (Hero)"
              media={content.heroMedia}
              onChange={(media) => updateField('heroMedia', media)}
            />

            {renderLocaleInput('Selo acima do título (Hero Eyebrow)', 'heroEyebrow', content.heroEyebrow, (v) =>
              updateField('heroEyebrow', v)
            )}

            <div style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.15)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <label style={{ color: '#EDE6DD', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                Título Principal da Abertura (pode usar &lt;br /&gt; para quebrar linha)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>🇵🇹 Português</span>
                  <textarea
                    value={content.heroTitlePt || ''}
                    onChange={(e) => updateField('heroTitlePt', e.target.value)}
                    rows={2}
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
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#9A8F88', display: 'block', marginBottom: 4 }}>🇬🇧 English</span>
                  <textarea
                    value={content.heroTitleEn || ''}
                    onChange={(e) => updateField('heroTitleEn', e.target.value)}
                    rows={2}
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
                </div>
              </div>
            </div>

            {renderLocaleInput('Subtítulo da Abertura', 'heroSubtitle', content.heroSubtitle, (v) =>
              updateField('heroSubtitle', v),
              true
            )}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Seção 01 — A Casa (Introdução)</h3>
            {renderLocaleInput('Selo da Introdução', 'houseIntroEyebrow', content.houseIntroEyebrow, (v) =>
              updateField('houseIntroEyebrow', v)
            )}
            {renderLocaleInput('Texto da Introdução', 'houseIntroParagraph', content.houseIntroParagraph, (v) =>
              updateField('houseIntroParagraph', v),
              true
            )}

            {/* Stats Array */}
            <h4 style={{ fontSize: 14, color: '#EDE6DD', marginTop: 20, marginBottom: 12 }}>Estatísticas / Números (até 3)</h4>
            {(content.stats || []).map((st, idx) => (
              <div key={idx} style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.15)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'center' }}>
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
                        background: '#0B0809',
                        border: '1px solid rgba(201,162,91,.2)',
                        borderRadius: 4,
                        padding: '6px 10px',
                        color: '#EDE6DD',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    {renderLocaleInput(`Legenda Stat #${idx + 1}`, `stat_${idx}`, st.label, (newLoc) => {
                      const newStats = [...(content.stats || [])]
                      newStats[idx] = { ...newStats[idx], label: newLoc }
                      updateField('stats', newStats)
                    })}
                  </div>
                </div>
              </div>
            ))}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Seção 02 — Massagens</h3>
            {renderLocaleInput('Selo das Massagens', 'massagesEyebrow', content.massagesEyebrow, (v) =>
              updateField('massagesEyebrow', v)
            )}

            {/* Massagens Array */}
            {(content.massages || []).map((msg, idx) => (
              <div
                key={idx}
                style={{
                  background: '#130D0F',
                  border: '1px solid rgba(201,162,91,.25)',
                  borderRadius: 8,
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <h4 style={{ color: '#C9A25B', margin: '0 0 16px 0', fontSize: 15 }}>
                  Massagem #{idx + 1}: {msg.title?.pt || ''}
                </h4>

                {renderLocaleInput('Título da Massagem', `msg_title_${idx}`, msg.title, (newLoc) => {
                  const arr = [...(content.massages || [])]
                  arr[idx] = { ...arr[idx], title: newLoc }
                  updateField('massages', arr)
                })}

                {renderLocaleInput('Descrição (Página Inicial)', `msg_homedesc_${idx}`, msg.homeDescription, (newLoc) => {
                  const arr = [...(content.massages || [])]
                  arr[idx] = { ...arr[idx], homeDescription: newLoc }
                  updateField('massages', arr)
                }, true)}

                {renderLocaleInput('Descrição (Tabela de Valores)', `msg_ratedesc_${idx}`, msg.rateDescription, (newLoc) => {
                  const arr = [...(content.massages || [])]
                  arr[idx] = { ...arr[idx], rateDescription: newLoc }
                  updateField('massages', arr)
                }, true)}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Duração 1 (ex: 60')</label>
                    <input
                      type="text"
                      value={msg.duration1 || ''}
                      onChange={(e) => {
                        const arr = [...(content.massages || [])]
                        arr[idx] = { ...arr[idx], duration1: e.target.value }
                        updateField('massages', arr)
                      }}
                      style={{ width: '100%', background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Preço 1 (ex: €120)</label>
                    <input
                      type="text"
                      value={msg.price1 || ''}
                      onChange={(e) => {
                        const arr = [...(content.massages || [])]
                        arr[idx] = { ...arr[idx], price1: e.target.value }
                        updateField('massages', arr)
                      }}
                      style={{ width: '100%', background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Duração 2 (ex: 90')</label>
                    <input
                      type="text"
                      value={msg.duration2 || ''}
                      onChange={(e) => {
                        const arr = [...(content.massages || [])]
                        arr[idx] = { ...arr[idx], duration2: e.target.value }
                        updateField('massages', arr)
                      }}
                      style={{ width: '100%', background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#C9A25B', display: 'block', marginBottom: 4 }}>Preço 2 (ex: €165)</label>
                    <input
                      type="text"
                      value={msg.price2 || ''}
                      onChange={(e) => {
                        const arr = [...(content.massages || [])]
                        arr[idx] = { ...arr[idx], price2: e.target.value }
                        updateField('massages', arr)
                      }}
                      style={{ width: '100%', background: '#0B0809', border: '1px solid rgba(201,162,91,.2)', borderRadius: 4, padding: '6px 10px', color: '#EDE6DD', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <MediaUploader
                  label={`Mídia da Massagem #${idx + 1}`}
                  media={msg.media}
                  onChange={(newMedia) => {
                    const arr = [...(content.massages || [])]
                    arr[idx] = { ...arr[idx], media: newMedia }
                    updateField('massages', arr)
                  }}
                />
              </div>
            ))}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Faixa de Vídeo Central</h3>
            {renderLocaleInput('Frase em destaque na Faixa de Vídeo', 'videoBannerQuote', content.videoBannerQuote, (v) =>
              updateField('videoBannerQuote', v),
              true
            )}
            {renderLocaleInput('Legenda pequena (ex: Filme da casa · 40 segundos)', 'videoBannerCaption', content.videoBannerCaption, (v) =>
              updateField('videoBannerCaption', v)
            )}
            <MediaUploader
              label="Mídia da Faixa de Vídeo"
              media={content.videoBannerMedia}
              onChange={(media) => updateField('videoBannerMedia', media)}
            />

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Galeria da Página Inicial (3 mídias)</h3>
            {(content.homeGallery || [{}, {}, {}]).slice(0, 3).map((item, idx) => (
              <MediaUploader
                key={idx}
                label={`Foto / Vídeo #${idx + 1} da Galeria`}
                media={item}
                onChange={(newMedia) => {
                  const arr = [...(content.homeGallery || [])]
                  arr[idx] = newMedia
                  updateField('homeGallery', arr)
                }}
              />
            ))}
          </div>
        )}

        {/* TAB 3: A CASA */}
        {activeTab === 'house' && (
          <div>
            <h2 style={{ fontSize: 20, color: '#C9A25B', marginBottom: 20, fontWeight: 400 }}>Página "A Casa"</h2>

            <MediaUploader
              label="Mídia de Abertura (A Casa)"
              media={content.houseHeroMedia}
              onChange={(media) => updateField('houseHeroMedia', media)}
            />

            {renderLocaleInput('Selo de Abertura', 'houseHeroEyebrow', content.houseHeroEyebrow, (v) =>
              updateField('houseHeroEyebrow', v)
            )}
            {renderLocaleInput('Título Principal', 'houseHeroTitle', content.houseHeroTitle, (v) =>
              updateField('houseHeroTitle', v)
            )}
            {renderLocaleInput('Subtítulo', 'houseHeroSubtitle', content.houseHeroSubtitle, (v) =>
              updateField('houseHeroSubtitle', v),
              true
            )}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Seção 01 — O Percurso (Timeline)</h3>
            {renderLocaleInput('Selo do Percurso', 'timelineEyebrow', content.timelineEyebrow, (v) =>
              updateField('timelineEyebrow', v)
            )}
            {renderLocaleInput('Nota à Direita do Percurso', 'timelineNote', content.timelineNote, (v) =>
              updateField('timelineNote', v)
            )}

            {/* Timeline Steps Array */}
            {(content.timelineSteps || []).map((step, idx) => (
              <div key={idx} style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.25)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                <h4 style={{ color: '#C9A25B', margin: '0 0 16px 0', fontSize: 15 }}>Etapa #{idx + 1}: {step.title?.pt || ''}</h4>

                {renderLocaleInput('Kicker / Horário (ex: 23h05 · a rua)', `ts_kicker_${idx}`, step.kicker, (newLoc) => {
                  const arr = [...(content.timelineSteps || [])]
                  arr[idx] = { ...arr[idx], kicker: newLoc }
                  updateField('timelineSteps', arr)
                })}

                {renderLocaleInput('Título da Etapa', `ts_title_${idx}`, step.title, (newLoc) => {
                  const arr = [...(content.timelineSteps || [])]
                  arr[idx] = { ...arr[idx], title: newLoc }
                  updateField('timelineSteps', arr)
                })}

                {renderLocaleInput('Texto Descritivo', `ts_body_${idx}`, step.body, (newLoc) => {
                  const arr = [...(content.timelineSteps || [])]
                  arr[idx] = { ...arr[idx], body: newLoc }
                  updateField('timelineSteps', arr)
                }, true)}

                <MediaUploader
                  label={`Mídia da Etapa #${idx + 1}`}
                  media={step.media}
                  onChange={(newMedia) => {
                    const arr = [...(content.timelineSteps || [])]
                    arr[idx] = { ...arr[idx], media: newMedia }
                    updateField('timelineSteps', arr)
                  }}
                />
              </div>
            ))}

            {renderLocaleInput('Frase em Destaque (Quote)', 'quoteText', content.quoteText, (v) =>
              updateField('quoteText', v),
              true
            )}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Galeria "A Casa" (3 mídias)</h3>
            {(content.houseGallery || [{}, {}, {}]).slice(0, 3).map((item, idx) => (
              <MediaUploader
                key={idx}
                label={`Foto / Vídeo #${idx + 1} da Galeria`}
                media={item}
                onChange={(newMedia) => {
                  const arr = [...(content.houseGallery || [])]
                  arr[idx] = newMedia
                  updateField('houseGallery', arr)
                }}
              />
            ))}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Seção 02 — Regras da Casa (5 Regras)</h3>
            {renderLocaleInput('Selo das Regras', 'rulesEyebrow', content.rulesEyebrow, (v) =>
              updateField('rulesEyebrow', v)
            )}
            {renderLocaleInput('Nota das Regras', 'rulesNote', content.rulesNote, (v) =>
              updateField('rulesNote', v)
            )}
            {renderLocaleInput('Frase de Introdução das Regras', 'rulesIntro', content.rulesIntro, (v) =>
              updateField('rulesIntro', v),
              true
            )}

            {(content.houseRules || []).map((rule, idx) => (
              <div key={idx} style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ color: '#C9A25B', margin: '0 0 12px 0', fontSize: 14 }}>Regra #{idx + 1}</h4>
                {renderLocaleInput('Título da Regra', `rule_title_${idx}`, rule.title, (newLoc) => {
                  const arr = [...(content.houseRules || [])]
                  arr[idx] = { ...arr[idx], title: newLoc }
                  updateField('houseRules', arr)
                })}
                {renderLocaleInput('Descrição da Regra', `rule_body_${idx}`, rule.body, (newLoc) => {
                  const arr = [...(content.houseRules || [])]
                  arr[idx] = { ...arr[idx], body: newLoc }
                  updateField('houseRules', arr)
                }, true)}
              </div>
            ))}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Seção 03 — Perguntas Frequentes (FAQ)</h3>
            {renderLocaleInput('Selo do FAQ', 'faqEyebrow', content.faqEyebrow, (v) =>
              updateField('faqEyebrow', v)
            )}

            {(content.faq || []).map((item, idx) => (
              <div key={idx} style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ color: '#C9A25B', margin: '0 0 12px 0', fontSize: 14 }}>Pergunta #{idx + 1}</h4>
                {renderLocaleInput('Pergunta', `faq_q_${idx}`, item.question, (newLoc) => {
                  const arr = [...(content.faq || [])]
                  arr[idx] = { ...arr[idx], question: newLoc }
                  updateField('faq', arr)
                })}
                {renderLocaleInput('Resposta', `faq_a_${idx}`, item.answer, (newLoc) => {
                  const arr = [...(content.faq || [])]
                  arr[idx] = { ...arr[idx], answer: newLoc }
                  updateField('faq', arr)
                }, true)}
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: VALORES */}
        {activeTab === 'rates' && (
          <div>
            <h2 style={{ fontSize: 20, color: '#C9A25B', marginBottom: 20, fontWeight: 400 }}>Página "Valores"</h2>

            {renderLocaleInput('Selo dos Valores', 'ratesEyebrow', content.ratesEyebrow, (v) =>
              updateField('ratesEyebrow', v)
            )}
            {renderLocaleInput('Título Principal dos Valores', 'ratesTitle', content.ratesTitle, (v) =>
              updateField('ratesTitle', v)
            )}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Ritual Noturno</h3>
            <MediaUploader
              label="Mídia do Ritual Noturno"
              media={content.eveningRitualMedia}
              onChange={(media) => updateField('eveningRitualMedia', media)}
            />
            {renderLocaleInput('Frase do Ritual Noturno', 'eveningRitualQuote', content.eveningRitualQuote, (v) =>
              updateField('eveningRitualQuote', v),
              true
            )}
            {renderLocaleInput('Legenda (ex: Ritual Noturno · 90 min · €260)', 'eveningRitualLabel', content.eveningRitualLabel, (v) =>
              updateField('eveningRitualLabel', v)
            )}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Acréscimos (3 itens)</h3>
            {renderLocaleInput('Selo dos Acréscimos', 'additionsEyebrow', content.additionsEyebrow, (v) =>
              updateField('additionsEyebrow', v)
            )}

            {(content.additions || []).map((add, idx) => (
              <div key={idx} style={{ background: '#130D0F', border: '1px solid rgba(201,162,91,.2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ color: '#C9A25B', margin: '0 0 12px 0', fontSize: 14 }}>Acréscimo #{idx + 1}</h4>
                {renderLocaleInput('Título', `add_title_${idx}`, add.title, (newLoc) => {
                  const arr = [...(content.additions || [])]
                  arr[idx] = { ...arr[idx], title: newLoc }
                  updateField('additions', arr)
                })}
                {renderLocaleInput('Valor / Desconto (ex: €260, −15%)', `add_val_${idx}`, add.value, (newLoc) => {
                  const arr = [...(content.additions || [])]
                  arr[idx] = { ...arr[idx], value: newLoc }
                  updateField('additions', arr)
                })}
                {renderLocaleInput('Descrição', `add_body_${idx}`, add.body, (newLoc) => {
                  const arr = [...(content.additions || [])]
                  arr[idx] = { ...arr[idx], body: newLoc }
                  updateField('additions', arr)
                }, true)}
              </div>
            ))}

            <h3 style={{ fontSize: 16, color: '#C9A25B', marginTop: 28, marginBottom: 16 }}>Pagamento & Cancelamento</h3>
            {renderLocaleInput('Título do Pagamento', 'paymentTitle', content.paymentTitle, (v) =>
              updateField('paymentTitle', v)
            )}
            {renderLocaleInput('Texto de Formas de Pagamento', 'paymentBody', content.paymentBody, (v) =>
              updateField('paymentBody', v),
              true
            )}
            {renderLocaleInput('Título do Cancelamento', 'cancellationTitle', content.cancellationTitle, (v) =>
              updateField('cancellationTitle', v)
            )}
            {renderLocaleInput('Texto da Política de Cancelamento', 'cancellationBody', content.cancellationBody, (v) =>
              updateField('cancellationBody', v),
              true
            )}
          </div>
        )}

        {/* TAB 5: AGENDAMENTO */}
        {activeTab === 'booking' && (
          <div>
            <h2 style={{ fontSize: 20, color: '#C9A25B', marginBottom: 20, fontWeight: 400 }}>Página "Agendamento"</h2>

            {renderLocaleInput('Selo de Agendamento', 'bookingEyebrow', content.bookingEyebrow, (v) =>
              updateField('bookingEyebrow', v)
            )}
            {renderLocaleInput('Título de Agendamento', 'bookingTitle', content.bookingTitle, (v) =>
              updateField('bookingTitle', v)
            )}

            <MediaUploader
              label="Foto / Vídeo Lateral da Tela de Agendamento"
              media={content.bookingSidebarMedia}
              onChange={(media) => updateField('bookingSidebarMedia', media)}
            />

            {renderLocaleInput('Nota "Antes de Enviar"', 'bookingBeforeSendNote', content.bookingBeforeSendNote, (v) =>
              updateField('bookingBeforeSendNote', v),
              true
            )}
            {renderLocaleInput('Mensagem de Confirmação (pós-envio)', 'bookingConfirmation', content.bookingConfirmation, (v) =>
              updateField('bookingConfirmation', v)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
