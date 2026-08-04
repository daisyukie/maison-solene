'use client'

import { useEffect, useMemo, useRef } from 'react'

import { renderSiteHtml } from '@/lib/renderSite'
import type { SiteContent } from '@/sanity/lib/types'

const EASE = 'cubic-bezier(.2,.7,.2,1)'

class Site {
  root: HTMLElement
  lang = 'pt'
  active = 0
  rule = 0
  dur: string | null = null
  raf: ReturnType<typeof setTimeout> | null = null
  safety: ReturnType<typeof setTimeout> | null = null
  ruleTimer: ReturnType<typeof setInterval> | null = null
  onClick: (ev: Event) => void
  onSubmit: (ev: Event) => void
  onScroll: () => void
  onOver: (ev: Event) => void

  constructor(root: HTMLElement) {
    this.root = root
    this.onClick = this.handleClick.bind(this)
    this.onSubmit = this.handleSubmit.bind(this)
    this.onScroll = this.handleScroll.bind(this)
    this.onOver = (e: Event) => {
      const target = e.target as HTMLElement
      const m = target.closest?.('[data-massage]') as HTMLElement | null
      if (m) this.setMassage(parseInt(m.dataset.massage || '0', 10))
      const r = target.closest?.('[data-rule]') as HTMLElement | null
      if (r) this.setRule(parseInt(r.dataset.rule || '0', 10), true)
      const card = target.closest?.('[data-price-card]') as HTMLElement | null
      this.root.querySelectorAll<HTMLElement>('[data-card-plate]').forEach((p) => {
        p.style.transform = card && card.contains(p) ? 'scale(1.08)' : 'scale(1)'
      })
    }
  }

  init() {
    this.root.addEventListener('click', this.onClick)
    this.root.addEventListener('submit', this.onSubmit)
    this.root.addEventListener('mouseover', this.onOver)
    window.addEventListener('scroll', this.onScroll, { passive: true })

    this.armReveals(this.root.querySelector<HTMLElement>('[data-page="inicio"]'))
    this.setMassage(0)
    this.setRule(0)
    this.ruleTimer = setInterval(() => {
      const wrap = this.root.querySelector<HTMLElement>('[data-rules]')
      if (!wrap || !wrap.offsetParent) return
      const r = wrap.getBoundingClientRect()
      if (r.bottom < 120 || r.top > window.innerHeight - 120) return
      this.setRule((this.rule + 1) % 5)
    }, 4800)
    this.onScroll()
    setTimeout(() => this.checkReveals(false), 20)
    this.armHoverStyles()
  }

  destroy() {
    this.root.removeEventListener('click', this.onClick)
    this.root.removeEventListener('submit', this.onSubmit)
    this.root.removeEventListener('mouseover', this.onOver)
    window.removeEventListener('scroll', this.onScroll)
    if (this.safety) clearTimeout(this.safety)
    if (this.ruleTimer) clearInterval(this.ruleTimer)
  }

  // The design authored hover states as a non-standard `style-hover`
  // attribute (never wired into a real :hover rule anywhere). Reproduce it
  // generically so buttons/cards/links keep their intended feedback.
  armHoverStyles() {
    this.root.querySelectorAll<HTMLElement>('[style-hover]').forEach((el) => {
      const base = el.getAttribute('style') || ''
      const hover = el.getAttribute('style-hover') || ''
      const apply = (css: string) => {
        css.split(';').forEach((decl) => {
          const i = decl.indexOf(':')
          if (i < 0) return
          const prop = decl.slice(0, i).trim()
          const val = decl.slice(i + 1).trim()
          if (prop) el.style.setProperty(prop, val)
        })
      }
      el.addEventListener('mouseenter', () => apply(hover))
      el.addEventListener('mouseleave', () => el.setAttribute('style', base))
      el.addEventListener('focus', () => apply(hover))
      el.addEventListener('blur', () => el.setAttribute('style', base))
    })
  }

  show(el: HTMLElement) {
    if (el.dataset.shown === '1') return
    el.dataset.shown = '1'
    const d = parseInt(el.dataset.revealDelay || '0', 10)
    setTimeout(() => {
      el.style.opacity = '1'
      el.style.transform = 'none'
      el.style.filter = 'none'
    }, d)
  }

  armReveals(scope: HTMLElement | null) {
    if (!scope) return
    scope.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.style.transition = `opacity 1s ease, transform 1s ${EASE}, filter 1s ease`
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.dataset.shown = '0'
        this.show(el)
      } else {
        el.dataset.shown = '0'
        el.style.opacity = '0'
        el.style.transform = 'translateY(26px)'
        el.style.filter = 'blur(6px)'
      }
    })
    if (this.safety) clearTimeout(this.safety)
    this.safety = setTimeout(() => this.checkReveals(true), 1400)
  }

  checkReveals(force: boolean) {
    const page = this.root.querySelector<HTMLElement>('[data-page].is-active') || this.root
    page.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      if (el.dataset.shown === '1') return
      const top = el.getBoundingClientRect().top
      if (top < window.innerHeight * 0.92 || (force && top < window.innerHeight * 1.6)) this.show(el)
    })
  }

  setRule(i: number, manual = false) {
    const wrap = this.root.querySelector<HTMLElement>('[data-rules]')
    if (!wrap) return
    this.rule = i
    if (manual && this.ruleTimer) {
      clearInterval(this.ruleTimer)
      this.ruleTimer = null
    }
    const deg = i * 72
    ;['[data-arc]', '[data-glow]', '[data-needle]'].forEach((sel) => {
      const el = wrap.querySelector<HTMLElement>(sel)
      if (el) el.style.transform = `rotate(${deg}deg)`
    })
    wrap.querySelectorAll<HTMLElement>('[data-panel]').forEach((p, k) => {
      p.style.opacity = k === i ? '1' : '0'
      p.style.transform = k === i ? 'none' : 'translateY(10px)'
    })
    wrap.querySelectorAll('svg [data-rule]').forEach((g, k) => {
      const on = k === i
      const dot = g.querySelector('[data-dot]')
      const tick = g.querySelector('[data-tick]')
      if (dot) {
        dot.setAttribute('fill', on ? '#B0243A' : '#0B0708')
        dot.setAttribute('stroke', on ? '#C9A25B' : 'rgba(201,162,91,.55)')
      }
      if (tick) tick.setAttribute('fill', on ? '#C9A25B' : 'rgba(201,162,91,.45)')
    })
    wrap.querySelectorAll<HTMLElement>('[data-rule] [data-rt]').forEach((t, k) => {
      const row = t.closest<HTMLElement>('[data-rule]')
      const on = k === i
      t.style.color = on ? '#F4EBE1' : '#7C7369'
      if (row) row.style.paddingLeft = on ? '14px' : '0px'
      const n = row?.querySelector<HTMLElement>('[data-rn]')
      if (n) n.style.color = on ? '#C9A25B' : 'rgba(201,162,91,.42)'
      const bar = row?.querySelector<HTMLElement>('[data-rbar]')
      if (bar) bar.style.width = on ? '58px' : '0px'
    })
  }

  setDuration(which: string) {
    this.dur = which
    this.root.querySelectorAll<HTMLElement>('[data-duration]').forEach((b) => {
      const on = b.dataset.duration === which
      b.style.background = on ? '#B0243A' : 'transparent'
      b.style.color = on ? '#F6EFE4' : '#9A8F88'
    })
    this.root.querySelectorAll<HTMLElement>('[data-price]').forEach((el) => {
      el.style.opacity = '0'
      setTimeout(() => {
        el.textContent = which === '2' ? el.dataset.p2 || '' : el.dataset.p1 || ''
        el.style.opacity = '1'
      }, 220)
    })
    this.root.querySelectorAll<HTMLElement>('[data-dur]').forEach((el) => {
      el.textContent = which === '2' ? el.dataset.d2 || '' : el.dataset.d1 || ''
    })
  }

  setMassage(i: number) {
    const wrap = this.root.querySelector<HTMLElement>('[data-massagens]')
    if (!wrap) return
    this.active = i
    wrap.querySelectorAll<HTMLElement>('[data-plate]').forEach((p, k) => {
      p.style.opacity = k === i ? '1' : '0'
      p.style.transform = k === i ? 'scale(1)' : 'scale(1.06)'
    })
    const num = wrap.querySelector<HTMLElement>('[data-plate-num]')
    if (num) num.textContent = ['I', 'II', 'III', 'IV'][i] || 'I'
    wrap.querySelectorAll<HTMLElement>('[data-massage]').forEach((row, k) => {
      const on = k === i
      row.style.paddingLeft = on ? '14px' : '0px'
      const t = row.querySelector<HTMLElement>('[data-title]')
      const n = row.querySelector<HTMLElement>('[data-num]')
      const d = row.querySelector<HTMLElement>('[data-desc]')
      if (t) t.style.color = on ? '#EDE6DD' : '#7C7369'
      if (n) n.style.color = on ? '#C9A25B' : '#6B5A3A'
      if (d) {
        d.style.maxHeight = on ? `${d.scrollHeight}px` : '0px'
        d.style.opacity = on ? '1' : '0'
      }
    })
  }

  handleScroll() {
    if (this.raf) return
    this.raf = setTimeout(() => {
      this.raf = null
      this.checkReveals(false)
      const tl = this.root.querySelector<HTMLElement>('[data-timeline]')
      if (tl && tl.offsetParent) {
        const r = tl.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, (window.innerHeight * 0.56 - r.top) / Math.max(1, r.height)))
        const fill = tl.querySelector<HTMLElement>('[data-axis-fill]')
        if (fill) fill.style.height = `${p * Math.max(0, r.height - 28)}px`
        tl.querySelectorAll<HTMLElement>('[data-step]').forEach((st) => {
          const on = st.getBoundingClientRect().top < window.innerHeight * 0.62
          const dot = st.querySelector<HTMLElement>('[data-dot]')
          if (dot) {
            dot.style.background = on ? '#B0243A' : '#0B0708'
            dot.style.boxShadow = on ? '0 0 0 5px #0B0809, 0 0 16px 3px rgba(176,36,58,.6)' : '0 0 0 5px #0B0809'
          }
        })
      }
      this.root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const f = parseFloat(el.dataset.parallax || '0') || 0
        const box = el.getBoundingClientRect()
        const rel = box.top + box.height / 2 - window.innerHeight / 2
        el.style.transform = `translate3d(0,${(-rel * f).toFixed(1)}px,0)`
      })
    }, 16)
  }

  handleClick(ev: Event) {
    const target = ev.target as HTMLElement
    const nav = target.closest('[data-goto]') as HTMLElement | null
    if (nav) {
      ev.preventDefault()
      this.goTo(nav.dataset.goto || 'inicio')
      return
    }
    const lang = target.closest('[data-lang-toggle]')
    if (lang) {
      ev.preventDefault()
      this.applyLang(this.lang === 'pt' ? 'en' : 'pt')
      return
    }
    const dur = target.closest('[data-duration]') as HTMLElement | null
    if (dur) {
      ev.preventDefault()
      this.setDuration(dur.dataset.duration || '1')
      return
    }
    const r = target.closest('[data-rule]') as HTMLElement | null
    if (r) {
      ev.preventDefault()
      this.setRule(parseInt(r.dataset.rule || '0', 10), true)
      return
    }
    const m = target.closest('[data-massage]') as HTMLElement | null
    if (m) {
      this.setMassage(parseInt(m.dataset.massage || '0', 10))
      return
    }
    const q = target.closest('[data-faq-q]')
    if (q) {
      ev.preventDefault()
      const item = q.closest<HTMLElement>('[data-faq]')
      if (item) this.toggleFaq(item)
    }
  }

  toggleFaq(item: HTMLElement) {
    const a = item.querySelector<HTMLElement>('[data-faq-a]')
    const icon = item.querySelector<HTMLElement>('[data-faq-icon]')
    if (!a || !icon) return
    const open = a.style.maxHeight && a.style.maxHeight !== '0px'
    if (open) {
      a.style.maxHeight = '0px'
      a.style.opacity = '0'
      icon.style.transform = 'none'
      icon.textContent = '+'
    } else {
      a.style.maxHeight = `${a.scrollHeight}px`
      a.style.opacity = '1'
      icon.style.transform = 'rotate(135deg)'
    }
  }

  goTo(page: string) {
    const cur =
      this.root.querySelector<HTMLElement>('[data-page].is-active') ||
      this.root.querySelector<HTMLElement>('[data-page="inicio"]')
    if (cur && cur.dataset.page === page) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const next = this.root.querySelector<HTMLElement>(`[data-page="${page}"]`)
    if (!next || !cur) return
    cur.style.opacity = '0'
    cur.style.transform = 'translateY(12px)'
    cur.style.filter = 'blur(5px)'
    setTimeout(() => {
      cur.style.display = 'none'
      cur.classList.remove('is-active')
      next.style.display = 'block'
      next.classList.add('is-active')
      next.style.opacity = '0'
      next.style.transform = 'translateY(12px)'
      next.style.filter = 'blur(5px)'
      window.scrollTo(0, 0)
      this.armReveals(next)
      this.syncNav(page)
      this.onScroll()
      void next.offsetHeight
      setTimeout(() => {
        next.style.opacity = '1'
        next.style.transform = 'none'
        next.style.filter = 'none'
      }, 20)
      setTimeout(() => {
        next.style.opacity = '1'
        next.style.transform = 'none'
        next.style.filter = 'none'
        this.checkReveals(true)
      }, 600)
    }, 420)
  }

  syncNav(page: string) {
    this.root.querySelectorAll<HTMLElement>('header [data-goto]').forEach((el) => {
      if (el.style.background) return
      el.style.color = el.dataset.goto === page ? '#EDE6DD' : '#9A8F88'
    })
  }

  applyLang(lang: string) {
    this.lang = lang
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR'
    this.root.querySelectorAll<HTMLElement>('[data-en]').forEach((el) => {
      if (el.dataset.pt === undefined) el.dataset.pt = el.innerHTML
      el.innerHTML = lang === 'en' ? el.dataset.en || '' : el.dataset.pt || ''
    })
    this.root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-en-ph]').forEach((el) => {
      if (el.dataset.ptPh === undefined) el.dataset.ptPh = el.placeholder
      el.placeholder = lang === 'en' ? el.dataset.enPh || '' : el.dataset.ptPh || ''
    })
    const btn = this.root.querySelector<HTMLElement>('[data-lang-toggle]')
    if (btn) btn.textContent = lang === 'en' ? 'PT' : 'EN'
    this.setMassage(this.active || 0)
    this.setRule(this.rule || 0)
  }

  handleSubmit(ev: Event) {
    const form = ev.target as HTMLElement
    if (!form.matches('[data-booking]')) return
    ev.preventDefault()
    const ok = form.querySelector<HTMLElement>('[data-booking-ok]')
    if (!ok) return
    ok.style.display = 'block'
    void ok.offsetHeight
    setTimeout(() => {
      ok.style.opacity = '1'
      ok.style.transform = 'none'
    }, 20)
  }
}

export default function SiteClient({ content }: { content: SiteContent }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const html = useMemo(() => renderSiteHtml(content), [content])

  useEffect(() => {
    if (!rootRef.current) return
    const site = new Site(rootRef.current)
    site.init()
    return () => site.destroy()
  }, [html])

  return (
    // Safe: renderSiteHtml HTML-escapes every interpolated CMS field itself
    // (see src/lib/renderSite.ts) — this isn't raw untrusted markup.
    <div
      ref={rootRef}
      data-site-root=""
      style={{ position: 'relative', minHeight: '100vh', background: '#0B0809' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
