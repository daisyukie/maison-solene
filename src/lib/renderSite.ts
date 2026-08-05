import { urlFor } from '@/sanity/lib/image'
import type { LocaleString, LocaleText, SiteContent, SiteMedia } from '@/sanity/lib/types'

function escText(s?: string): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Attribute values only need & and " escaped.
function escAttr(s?: string): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// The hero title is the one field allowed to contain a line break. Escape
// everything as plain text, then restore only a literal `<br />` — this is
// CMS-editable content, so nothing else is allowed through as real markup.
function escTitleHtml(s?: string): string {
  if (!s) return ''
  const BR = ' BR '
  return s
    .replace(/<br\s*\/?>/gi, BR)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split(BR)
    .join('<br />')
}

// Same allowance, but for use inside an HTML attribute (the data-en title).
function escTitleAttr(s?: string): string {
  if (!s) return ''
  const BR = ' BR '
  return s
    .replace(/<br\s*\/?>/gi, BR)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .split(BR)
    .join('<br />')
}

function pt(v?: LocaleString | LocaleText): string {
  return v?.pt ?? ''
}

function dataEn(v?: LocaleString | LocaleText): string {
  return ` data-en="${escAttr(v?.en)}"`
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

const GRADIENTS = [
  'radial-gradient(58% 48% at 24% 30%, rgba(201,162,91,.34), rgba(201,162,91,0) 62%), radial-gradient(85% 70% at 82% 88%, rgba(142,27,40,.34), rgba(142,27,40,0) 66%), linear-gradient(155deg,#1C1214 0%,#0A0708 72%)',
  'radial-gradient(60% 50% at 30% 26%, rgba(201,162,91,.32), rgba(201,162,91,0) 60%), linear-gradient(165deg,#1A1214,#0A0708 74%)',
  'radial-gradient(58% 52% at 72% 30%, rgba(201,162,91,.24), rgba(201,162,91,0) 58%), radial-gradient(70% 60% at 22% 84%, rgba(142,27,40,.30), rgba(142,27,40,0) 64%), linear-gradient(175deg,#170F12,#0A0708 76%)',
  'radial-gradient(52% 44% at 48% 62%, rgba(184,74,40,.40), rgba(184,74,40,0) 58%), radial-gradient(60% 50% at 30% 18%, rgba(201,162,91,.22), rgba(201,162,91,0) 60%), linear-gradient(160deg,#1D1211,#0A0708 74%)',
  'radial-gradient(46% 40% at 34% 34%, rgba(201,162,91,.28), rgba(201,162,91,0) 58%), radial-gradient(46% 40% at 68% 60%, rgba(142,27,40,.32), rgba(142,27,40,0) 58%), linear-gradient(180deg,#191114,#0A0708 76%)',
  'radial-gradient(70% 58% at 32% 30%, rgba(176,36,58,0.4), rgba(176,36,58,0) 62%), radial-gradient(58% 48% at 76% 78%, rgba(201,162,91,0.22), rgba(201,162,91,0) 60%), linear-gradient(158deg,#241016 0%,#12080C 46%,#0A0708 82%)',
  'radial-gradient(65% 55% at 70% 22%, rgba(201,162,91,.30), rgba(201,162,91,0) 60%), linear-gradient(200deg,#17100F,#0A0708 78%)',
  'radial-gradient(60% 50% at 34% 68%, rgba(142,27,40,.34), rgba(142,27,40,0) 62%), radial-gradient(50% 40% at 78% 18%, rgba(201,162,91,.22), rgba(201,162,91,0) 60%), linear-gradient(170deg,#1A1113,#0A0708 76%)',
  'radial-gradient(55% 60% at 50% 12%, rgba(201,162,91,.28), rgba(201,162,91,0) 58%), linear-gradient(185deg,#150F11,#0A0708 74%)',
]

let gradientCursor = 0
function nextGradient(): string {
  const g = GRADIENTS[gradientCursor % GRADIENTS.length]
  gradientCursor += 1
  return g
}

/**
 * Renders a photo/video slot. Falls back to the original moodboard-style
 * gradient placeholder (with a reference caption) whenever no asset has
 * been uploaded in the CMS yet, so the site never looks broken pre-launch.
 */
function mediaBlock(media: SiteMedia | undefined, variant: 'ambient' | 'feature' = 'ambient'): string {
  const videoUrl =
    media?.videoUrl ||
    media?.video?.asset?.url ||
    (media?.url && (/\.(mp4|webm|mov|mkv)($|\?)/i.test(media.url) || media.url.includes('video')) ? media.url : undefined)
  const imageUrl =
    media?.imageUrl ||
    (media?.image ? urlFor(media.image).width(1600).auto('format').url() : undefined) ||
    (media?.url && !/\.(mp4|webm|mov|mkv)($|\?)/i.test(media.url) ? media.url : undefined)

  if (videoUrl) {
    const poster = imageUrl ? ` poster="${escAttr(imageUrl)}"` : ''
    if (variant === 'feature') {
      return `<video src="${escAttr(videoUrl)}"${poster} controls playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#0C0708"></video>`
    }
    return `<video src="${escAttr(videoUrl)}"${poster} autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#0C0708"></video>`
  }

  if (imageUrl) {
    return `<img src="${escAttr(imageUrl)}" alt="${escAttr(media?.hint)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />`
  }

  const caption = media?.hint
    ? `<span style="position:absolute;left:18px;bottom:15px;font-family:ui-monospace,Menlo,monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(237,230,221,.36)">${escText(media.hint)}</span>`
    : ''
  const playButton =
    variant === 'feature'
      ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><span style="width:56px;height:56px;border-radius:50%;border:1px solid rgba(201,162,91,.5);display:flex;align-items:center;justify-content:center;color:#C9A25B;font-size:12px;animation:halo 4.6s ease-in-out infinite">▶</span></div>`
      : ''
  return `<div style="position:absolute;inset:0;overflow:hidden;background:#0C0809">
    <div style="position:absolute;inset:0;background:${nextGradient()}"></div>
    <div style="position:absolute;inset:-28%;opacity:.55;background:repeating-linear-gradient(96deg, rgba(255,255,255,.055) 0 1px, rgba(255,255,255,0) 1px 14px);animation:drift 42s ease-in-out infinite"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(135% 105% at 50% 110%, rgba(0,0,0,.82), rgba(0,0,0,0) 62%)"></div>
    ${caption}
  </div>${playButton}`
}

function statBlock(number: string, label?: LocaleString) {
  return `<div style="display:flex;flex-direction:column;gap:8px">
    <span style="font-family:'Bodoni Moda',serif;font-size:30px;color:#C9A25B;font-weight:400">${escText(number)}</span>
    <span${dataEn(label)} style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#9A8F88;font-weight:400;line-height:1.7">${escText(pt(label))}</span>
  </div>`
}

function massagePlate(m: SiteContent['massages'] extends (infer U)[] | undefined ? U : never, i: number) {
  const active = i === 0
  return `<div data-plate="" style="position:absolute;inset:0;opacity:${active ? 1 : 0};transform:scale(${active ? 1 : 1.06});transition:opacity 1.2s ease,transform 1.8s cubic-bezier(.2,.7,.2,1)">${mediaBlock(m.media)}</div>`
}

function massageRow(m: SiteContent['massages'] extends (infer U)[] | undefined ? U : never, i: number) {
  const active = i === 0
  return `<div data-massage="${i}" style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:clamp(16px,2.2vw,32px);padding:clamp(20px,3vh,30px) 0;border-top:1px solid rgba(201,162,91,.14);cursor:pointer;transition:padding-left .8s cubic-bezier(.2,.7,.2,1)">
    <span data-num="" style="font-family:'Bodoni Moda',serif;font-size:12px;letter-spacing:.26em;color:${active ? '#C9A25B' : '#6B5A3A'};padding-top:14px;transition:color .7s ease">${ROMAN[i]}</span>
    <div style="min-width:0">
      <h3 data-title=""${dataEn(m.title)} style="margin:0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(22px,2.2vw,34px);line-height:1.1;letter-spacing:-.012em;color:${active ? '#EDE6DD' : '#7C7369'};transition:color .7s ease">${escText(pt(m.title))}</h3>
      <div data-desc="" style="overflow:hidden;transition:max-height .9s cubic-bezier(.2,.7,.2,1),opacity .7s ease;${active ? '' : 'max-height:0px;opacity:0;'}">
        <p${dataEn(m.homeDescription)} style="margin:14px 0 0;font-size:14px;line-height:1.9;color:#9A8F88;max-width:46ch;text-wrap:pretty">${escText(pt(m.homeDescription))}</p>
        <span data-en="${escAttr(`${m.duration1 ?? ''} · ${m.duration2 ?? ''} · from ${m.price1 ?? ''}`)}" style="display:inline-block;margin-top:14px;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#C9A25B">${escText(m.duration1)} · ${escText(m.duration2)} · desde ${escText(m.price1)}</span>
      </div>
    </div>
  </div>`
}

function priceCard(m: SiteContent['massages'] extends (infer U)[] | undefined ? U : never, i: number) {
  return `<div data-reveal="" data-reveal-delay="${i * 110}" data-price-card="" style="position:relative;min-height:clamp(360px,44vh,440px);border:1px solid rgba(176,36,58,.22);overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;transition:border-color .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)" style-hover="border-color:#B0243A;transform:translateY(-6px)">
    <div data-card-plate="" style="position:absolute;inset:0;transition:transform 1.6s cubic-bezier(.2,.7,.2,1)">${mediaBlock(m.media)}</div>
    <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(11,7,8,.96) 0%, rgba(28,10,16,.42) 58%, rgba(11,7,8,.2) 100%)"></div>
    <span style="position:absolute;left:26px;top:22px;font-family:'Bodoni Moda',serif;font-size:13px;letter-spacing:.26em;color:rgba(201,162,91,.72)">${ROMAN[i]}</span>
    <div style="position:relative;padding:clamp(20px,1.6vw,26px);display:flex;flex-direction:column;gap:12px">
      <h3${dataEn(m.title)} style="margin:0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(20px,1.6vw,26px);line-height:1.1;letter-spacing:-.012em">${escText(pt(m.title))}</h3>
      <p${dataEn(m.rateDescription)} style="margin:0;font-size:13px;line-height:1.75;color:#9A8F88;max-width:32ch;text-wrap:pretty">${escText(pt(m.rateDescription))}</p>
      <div style="display:flex;align-items:baseline;gap:12px;margin-top:6px;padding-top:14px;border-top:1px solid rgba(176,36,58,.28)">
        <span data-price="" data-p1="${escAttr(m.price1)}" data-p2="${escAttr(m.price2)}" style="font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(28px,2.2vw,36px);line-height:.9;color:#F2E9E0;transition:opacity .45s ease">${escText(m.price1)}</span>
        <span data-dur="" data-d1="${escAttr(m.duration1)} min" data-d2="${escAttr(m.duration2)} min" style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#C9A25B">${escText(m.duration1)} min</span>
      </div>
    </div>
  </div>`
}

function timelineStepBlock(s: SiteContent['timelineSteps'] extends (infer U)[] | undefined ? U : never, i: number) {
  const flip = i % 2 === 1
  return `<div data-step="" data-reveal="" style="position:relative;display:grid;grid-template-columns:clamp(21px,2.8vw,46px) minmax(0,1fr);gap:clamp(16px,2.6vw,42px);padding:clamp(26px,4.4vh,58px) 0">
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;padding-top:8px">
      <span data-dot="" style="width:9px;height:9px;border-radius:50%;background:#0B0708;border:1px solid #B0243A;box-shadow:0 0 0 5px #0B0809;transition:background .8s ease,box-shadow .8s ease"></span>
      <span style="font-family:'Bodoni Moda',serif;font-size:12px;letter-spacing:.28em;color:rgba(201,162,91,.66);writing-mode:vertical-rl;text-orientation:mixed">${ROMAN[i]}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:clamp(20px,3.4vw,52px);align-items:center;min-width:0">
      <div style="display:flex;flex-direction:column;gap:12px;min-width:0;${flip ? 'order:2' : ''}">
        <span${dataEn(s.kicker)} style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#B0243A">${escText(pt(s.kicker))}</span>
        <h3${dataEn(s.title)} style="margin:0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(20px,2vw,30px);line-height:1.1;letter-spacing:-.014em">${escText(pt(s.title))}</h3>
        <p${dataEn(s.body)} style="margin:6px 0 0;font-size:14px;line-height:1.9;color:#9A8F88;max-width:44ch;text-wrap:pretty">${escText(pt(s.body))}</p>
      </div>
      <div style="position:relative;height:clamp(220px,32vh,360px);overflow:hidden;border:1px solid rgba(176,36,58,.20);${flip ? 'order:1' : ''}">${mediaBlock(s.media)}</div>
    </div>
  </div>`
}

function galleryTile(m: SiteMedia, sizeStyle: string, delay: number, feature = false) {
  return `<div data-reveal="" data-reveal-delay="${delay}" style="position:relative;${sizeStyle};overflow:hidden;border:1px solid rgba(176,36,58,.20)">${mediaBlock(m, feature ? 'feature' : 'ambient')}</div>`
}

function rulePanel(r: SiteContent['houseRules'] extends (infer U)[] | undefined ? U : never, i: number) {
  const active = i === 0
  return `<div data-panel="" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,1.4vh,16px);text-align:center;opacity:${active ? 1 : 0};transform:translateY(${active ? 0 : 10}px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1);pointer-events:none">
    <span style="font-family:'Bodoni Moda',serif;font-size:12px;letter-spacing:.3em;color:#B0243A">${ROMAN[i]}</span>
    <h4${dataEn(r.title)} style="margin:0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(18px,1.8vw,26px);line-height:1.1;letter-spacing:-.014em;color:#F4EBE1">${escText(pt(r.title))}</h4>
    <p${dataEn(r.body)} style="margin:0;font-size:clamp(12px,1.05vw,14px);line-height:1.8;color:#B9AEA6;max-width:24ch;text-wrap:pretty">${escText(pt(r.body))}</p>
  </div>`
}

function ruleSvgGroup(i: number, count: number) {
  const angle = (i / count) * 2 * Math.PI - Math.PI / 2
  const r = 170
  const cx = 220 + r * Math.cos(angle)
  const cy = 220 + r * Math.sin(angle)
  const tx = 220 + (r + 24) * Math.cos(angle)
  const ty = 220 + (r + 24) * Math.sin(angle) + 4
  return `<g data-rule="${i}" style="cursor:pointer"><circle data-dot="" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="#0B0708" stroke="rgba(201,162,91,.55)" stroke-width="1" style="transition:fill .7s ease,stroke .7s ease"></circle><text data-tick="" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-family="Bodoni Moda,serif" font-size="13" letter-spacing="2" fill="rgba(201,162,91,.45)" style="transition:fill .7s ease">${ROMAN[i]}</text><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="26" fill="transparent"></circle></g>`
}

function ruleListRow(r: SiteContent['houseRules'] extends (infer U)[] | undefined ? U : never, i: number) {
  return `<div data-rule="${i}" style="display:grid;grid-template-columns:clamp(30px,3vw,50px) minmax(0,1fr);gap:clamp(12px,1.8vw,26px);align-items:baseline;padding:clamp(16px,2.6vh,26px) 0;border-bottom:1px solid rgba(176,36,58,.16);cursor:pointer;transition:padding-left .8s cubic-bezier(.2,.7,.2,1)">
    <span data-rn="" style="font-family:'Bodoni Moda',serif;font-size:12px;letter-spacing:.24em;color:rgba(201,162,91,.42);transition:color .7s ease">${ROMAN[i]}</span>
    <div style="min-width:0;display:flex;flex-direction:column;gap:8px">
      <span data-rt=""${dataEn(r.title)} style="font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(18px,1.8vw,24px);line-height:1.1;color:#7C7369;transition:color .7s ease">${escText(pt(r.title))}</span>
      <div data-rbar="" style="height:1px;width:0;background:linear-gradient(to right, #B0243A, rgba(201,162,91,.7));transition:width 1s cubic-bezier(.2,.7,.2,1)"></div>
    </div>
  </div>`
}

function faqBlock(f: SiteContent['faq'] extends (infer U)[] | undefined ? U : never) {
  return `<div data-faq="" style="border-bottom:1px solid rgba(176,36,58,.20)">
    <button data-faq-q="" type="button" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:26px 0;background:transparent;border:0;cursor:pointer;text-align:left;color:#EDE6DD;transition:color .5s ease" style-hover="color:#E4C88C">
      <span${dataEn(f.question)} style="font-family:'Bodoni Moda',serif;font-size:clamp(16px,1.5vw,20px);font-weight:400">${escText(pt(f.question))}</span>
      <span data-faq-icon="" style="color:#B0243A;font-size:20px;line-height:1;transition:transform .6s cubic-bezier(.2,.7,.2,1)">+</span>
    </button>
    <div data-faq-a="" style="max-height:0;overflow:hidden;opacity:0;transition:max-height .7s cubic-bezier(.2,.7,.2,1),opacity .6s ease">
      <p${dataEn(f.answer)} style="margin:0 0 26px;max-width:62ch;font-size:15px;line-height:1.9;color:#9A8F88">${escText(pt(f.answer))}</p>
    </div>
  </div>`
}

function additionBlock(a: SiteContent['additions'] extends (infer U)[] | undefined ? U : never, delay: number) {
  return `<div data-reveal="" data-reveal-delay="${delay}" style="display:flex;flex-direction:column;gap:12px;padding-top:20px;border-top:1px solid rgba(176,36,58,.28);transition:border-color .7s ease" style-hover="border-color:#B0243A">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px">
      <span${dataEn(a.title)} style="font-family:'Bodoni Moda',serif;font-size:clamp(18px,1.7vw,23px);font-weight:400">${escText(pt(a.title))}</span>
      <span${dataEn(a.value)} style="font-family:'Bodoni Moda',serif;font-size:clamp(18px,1.7vw,23px);font-weight:400;color:#C9A25B;white-space:nowrap">${escText(pt(a.value))}</span>
    </div>
    <p${dataEn(a.body)} style="margin:0;font-size:13px;line-height:1.85;color:#9A8F88;text-wrap:pretty">${escText(pt(a.body))}</p>
  </div>`
}

export function renderSiteHtml(content: SiteContent): string {
  gradientCursor = 0
  const massages = content.massages ?? []
  const timelineSteps = content.timelineSteps ?? []
  const houseRules = content.houseRules ?? []
  const faq = content.faq ?? []
  const additions = content.additions ?? []
  const homeGallery = content.homeGallery ?? []
  const houseGallery = content.houseGallery ?? []
  const brand = escText(content.brandName)
  const whatsappDigits = (content.whatsapp ?? '').replace(/[^0-9]/g, '')
  const whatsappDisplay = escText(content.whatsapp)

  return `
  <div style="position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden">
    <div style="position:absolute;top:-20%;left:-10%;width:70vw;height:70vw;border-radius:50%;background:radial-gradient(circle, rgba(176,36,58,.46) 0%, rgba(142,27,40,.12) 45%, rgba(142,27,40,0) 66%);filter:blur(40px);animation:drift 34s ease-in-out infinite, ember 11s ease-in-out infinite"></div>
    <div style="position:absolute;bottom:-25%;right:-15%;width:65vw;height:65vw;border-radius:50%;background:radial-gradient(circle, rgba(142,27,40,.34) 0%, rgba(201,162,91,.14) 48%, rgba(201,162,91,0) 66%);filter:blur(50px);animation:drift2 46s ease-in-out infinite, ember 15s ease-in-out infinite"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,.55) 100%)"></div>
  </div>

  <header style="position:fixed;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:20px clamp(20px,5vw,64px);backdrop-filter:blur(14px);background:linear-gradient(to bottom, rgba(11,8,9,.86), rgba(11,8,9,.30) 70%, rgba(11,8,9,0));border-bottom:1px solid rgba(201,162,91,.10)">
    <a href="#" data-goto="inicio" style="display:flex;align-items:baseline;gap:10px;color:#EDE6DD">
      <span data-slot="nome" style="font-family:'Bodoni Moda',serif;font-size:22px;letter-spacing:.24em;text-transform:uppercase;font-weight:400">${brand}</span>
      <span style="width:5px;height:5px;border-radius:50%;background:#8E1B28;display:inline-block"></span>
    </a>
    <nav style="display:flex;align-items:center;flex-wrap:wrap;gap:clamp(16px,2.4vw,34px)">
      <a href="#" data-goto="inicio" data-en="Home" style="font-size:11px;letter-spacing:.26em;text-transform:uppercase;font-weight:400;color:#EDE6DD;transition:color .45s ease">Início</a>
      <a href="#" data-goto="casa" data-en="The House" style="font-size:11px;letter-spacing:.26em;text-transform:uppercase;font-weight:400;color:#9A8F88;transition:color .45s ease">A Casa</a>
      <a href="#" data-goto="valores" data-en="Rates" style="font-size:11px;letter-spacing:.26em;text-transform:uppercase;font-weight:400;color:#9A8F88;transition:color .45s ease">Valores</a>
      <a href="#" data-goto="agendar" data-en="Book" style="font-size:11px;letter-spacing:.26em;text-transform:uppercase;font-weight:400;color:#0B0809;background:#C9A25B;padding:10px 18px;border-radius:999px;transition:background .45s ease,color .45s ease" style-hover="background:#E4C88C;color:#0B0809">Agendar</a>
      <button data-lang-toggle="" type="button" style="background:transparent;border:1px solid rgba(201,162,91,.28);color:#9A8F88;font-size:10px;letter-spacing:.22em;padding:8px 12px;border-radius:999px;cursor:pointer;transition:color .4s ease,border-color .4s ease" style-hover="color:#EDE6DD;border-color:rgba(201,162,91,.6)">EN</button>
    </nav>
  </header>

  <main style="position:relative;z-index:10">
    <section data-page="inicio" data-screen-label="Início" class="is-active" style="display:block;transition:opacity .5s ease, transform .5s cubic-bezier(.2,.7,.2,1), filter .5s ease">
      <div style="position:relative;height:100svh;min-height:620px;overflow:hidden;display:flex;align-items:flex-end">
        <div data-parallax="0.18" style="position:absolute;inset:-8% 0 -8% 0">${mediaBlock(content.heroMedia)}</div>
        <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(11,8,9,.96) 0%, rgba(11,8,9,.55) 42%, rgba(11,8,9,.35) 100%);pointer-events:none"></div>
        <div style="position:relative;width:100%;padding:0 clamp(20px,5vw,64px) clamp(56px,9vh,110px);display:flex;flex-direction:column;gap:26px;pointer-events:none">
          <span data-reveal=""${dataEn(content.heroEyebrow)} style="font-size:10px;letter-spacing:.42em;text-transform:uppercase;color:#C9A25B;font-weight:400">${escText(pt(content.heroEyebrow))}</span>
          <h1 data-reveal="" data-reveal-delay="120" data-en="${escTitleAttr(content.heroTitleEn)}" style="margin:0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(34px,4.6vw,72px);line-height:1.02;letter-spacing:-.015em;max-width:16ch;text-wrap:pretty">${escTitleHtml(content.heroTitlePt)}</h1>
          <p data-reveal="" data-reveal-delay="240"${dataEn(content.heroSubtitle)} style="margin:0;max-width:46ch;font-weight:400;font-size:clamp(15px,1.35vw,19px);line-height:1.75;color:#B9AEA6;text-wrap:pretty">${escText(pt(content.heroSubtitle))}</p>
        </div>
        <div style="position:absolute;bottom:26px;left:50%;width:1px;height:40px;background:linear-gradient(to bottom, rgba(201,162,91,.9), transparent);animation:cue 3.4s ease-in-out infinite"></div>
      </div>

      <div style="padding:clamp(90px,16vh,180px) clamp(20px,5vw,64px);display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(40px,6vw,90px);align-items:start;max-width:1440px;margin:0 auto">
        <span data-reveal=""${dataEn(content.houseIntroEyebrow)} style="font-size:10px;letter-spacing:.42em;text-transform:uppercase;color:#8C7444;font-weight:400">${escText(pt(content.houseIntroEyebrow))}</span>
        <div style="grid-column:span 2;display:flex;flex-direction:column;gap:30px;min-width:0">
          <p data-reveal=""${dataEn(content.houseIntroParagraph)} style="margin:0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(20px,2vw,30px);line-height:1.4;color:#EDE6DD;text-wrap:pretty">${escText(pt(content.houseIntroParagraph))}</p>
          <div data-reveal="" data-reveal-delay="120" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:28px;padding-top:14px;border-top:1px solid rgba(201,162,91,.14)">
            ${(content.stats ?? []).map((s) => statBlock(s.number ?? '', s.label)).join('\n')}
          </div>
        </div>
      </div>

      <div style="padding:0 clamp(20px,5vw,64px) clamp(90px,16vh,180px);max-width:1440px;margin:0 auto">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:clamp(32px,5vh,60px)">
          <span data-reveal=""${dataEn(content.massagesEyebrow)} style="font-size:10px;letter-spacing:.42em;text-transform:uppercase;color:#8C7444;font-weight:400">${escText(pt(content.massagesEyebrow))}</span>
          <a href="#" data-goto="valores" data-en="See all rates →" style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;font-weight:400">Ver todos os valores →</a>
        </div>
        <div data-massagens="" data-reveal="" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:clamp(28px,5vw,74px);align-items:stretch">
          <div style="position:relative;min-height:clamp(400px,66vh,660px);border:1px solid rgba(201,162,91,.14);overflow:hidden">
            ${massages.map((m, i) => massagePlate(m, i)).join('\n')}
            <span data-plate-num="" style="position:absolute;right:26px;bottom:18px;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(36px,3.6vw,56px);line-height:.78;color:rgba(237,230,221,.86);pointer-events:none">I</span>
          </div>
          <div style="display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid rgba(201,162,91,.14)">
            ${massages.map((m, i) => massageRow(m, i)).join('\n')}
          </div>
        </div>
      </div>

      <div style="padding:0 0 clamp(70px,12vh,140px)">
        <div data-reveal="" style="position:relative;height:clamp(420px,78vh,760px);overflow:hidden;margin:0;border-top:1px solid rgba(176,36,58,.22);border-bottom:1px solid rgba(176,36,58,.22)">
          ${mediaBlock(content.videoBannerMedia, 'feature')}
          <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(11,7,8,.94), rgba(28,10,16,.34) 55%, rgba(11,7,8,.55));pointer-events:none"></div>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center;padding:0 clamp(20px,5vw,64px);pointer-events:none">
            <p${dataEn(content.videoBannerQuote)} style="margin:0;font-family:'Bodoni Moda',serif;font-style:italic;font-weight:400;font-size:clamp(22px,2.6vw,38px);line-height:1.2;max-width:22ch;color:#F2E9E0;text-wrap:pretty">${escText(pt(content.videoBannerQuote))}</p>
            <span${dataEn(content.videoBannerCaption)} style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:rgba(201,162,91,.85)">${escText(pt(content.videoBannerCaption))}</span>
          </div>
        </div>
      </div>

      <div style="padding:0 clamp(20px,5vw,64px) clamp(90px,16vh,180px);max-width:1440px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:clamp(18px,2.4vw,34px);align-items:end">
        ${galleryTile(homeGallery[0] ?? {}, 'height:clamp(280px,42vh,440px)', 0)}
        ${galleryTile(homeGallery[1] ?? {}, 'height:clamp(340px,58vh,580px)', 140)}
        ${galleryTile(homeGallery[2] ?? {}, 'height:clamp(240px,34vh,380px)', 280)}
      </div>

      <div style="padding:0 clamp(20px,5vw,64px) clamp(90px,16vh,180px);max-width:1440px;margin:0 auto">
        <div data-reveal="" style="border:1px solid rgba(201,162,91,.16);background:linear-gradient(140deg, rgba(142,27,40,.10), rgba(11,8,9,0) 55%);padding:clamp(34px,6vw,72px);display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:clamp(28px,4vw,56px)">
          <div style="display:flex;flex-direction:column;gap:12px">
            <span data-en="Hours" style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#8C7444">Horários</span>
            <span${dataEn(content.hoursLine)} style="font-family:'Bodoni Moda',serif;font-size:clamp(17px,1.5vw,20px);font-weight:400">${escText(pt(content.hoursLine))}</span>
            <span${dataEn(content.hoursNote)} style="font-size:12px;color:#9A8F88;font-weight:400;letter-spacing:.1em">${escText(pt(content.hoursNote))}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <span data-en="Address" style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#8C7444">Endereço</span>
            <span style="font-family:'Bodoni Moda',serif;font-size:clamp(17px,1.5vw,20px);font-weight:400">${escText(content.addressLine)}</span>
            <span${dataEn(content.addressNote)} style="font-size:12px;color:#9A8F88;font-weight:400;letter-spacing:.1em">${escText(pt(content.addressNote))}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px;justify-content:center">
            <a href="#" data-goto="agendar" data-en="Book a time" style="display:inline-flex;align-items:center;justify-content:center;padding:16px 26px;border-radius:999px;background:#C9A25B;color:#0B0809;font-size:11px;letter-spacing:.26em;text-transform:uppercase;transition:background .5s ease" style-hover="background:#E4C88C;color:#0B0809">Reservar um horário</a>
            <a href="https://wa.me/${whatsappDigits}" target="_blank" rel="noopener" data-en="WhatsApp · ${escAttr(whatsappDisplay)}" style="display:inline-flex;align-items:center;justify-content:center;padding:16px 26px;border-radius:999px;border:1px solid rgba(201,162,91,.32);font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:#EDE6DD;transition:border-color .5s ease,color .5s ease" style-hover="border-color:rgba(201,162,91,.75);color:#E4C88C">WhatsApp · ${whatsappDisplay}</a>
          </div>
        </div>
      </div>
    </section>

    <section data-page="casa" data-screen-label="A Casa" style="display:none;transition:opacity .5s ease, transform .5s cubic-bezier(.2,.7,.2,1), filter .5s ease">
      <div style="position:relative;height:clamp(520px,90svh,900px);overflow:hidden;display:flex;align-items:flex-end">
        <div data-parallax="0.16" style="position:absolute;inset:-12% 0;animation:kb 34s ease-in-out infinite">${mediaBlock(content.houseHeroMedia)}</div>
        <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(11,7,8,.97) 0%, rgba(36,12,20,.45) 45%, rgba(11,7,8,.6) 100%);pointer-events:none"></div>
        <div style="position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 60%, rgba(176,36,58,.30), rgba(176,36,58,0) 70%);animation:veil 12s ease-in-out infinite;pointer-events:none"></div>
        <div style="position:relative;width:100%;padding:0 clamp(20px,5vw,64px) clamp(52px,9vh,110px);display:flex;flex-direction:column;gap:24px">
          <span data-reveal=""${dataEn(content.houseHeroEyebrow)} style="font-size:10px;letter-spacing:.44em;text-transform:uppercase;color:#C9A25B">${escText(pt(content.houseHeroEyebrow))}</span>
          <h2 data-reveal="" data-reveal-delay="110"${dataEn(content.houseHeroTitle)} style="margin:0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(28px,3.2vw,46px);line-height:1.1;letter-spacing:-.02em;max-width:18ch;text-wrap:pretty">${escText(pt(content.houseHeroTitle))}</h2>
          <p data-reveal="" data-reveal-delay="200"${dataEn(content.houseHeroSubtitle)} style="margin:0;max-width:40ch;font-size:15px;line-height:1.85;color:#B9AEA6">${escText(pt(content.houseHeroSubtitle))}</p>
        </div>
      </div>

      <div style="padding:clamp(80px,14vh,160px) clamp(20px,5vw,64px) clamp(70px,12vh,150px);max-width:1520px;margin:0 auto">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:clamp(30px,5vh,64px)">
          <span data-reveal=""${dataEn(content.timelineEyebrow)} style="font-size:10px;letter-spacing:.44em;text-transform:uppercase;color:#B0243A">${escText(pt(content.timelineEyebrow))}</span>
          <span data-reveal=""${dataEn(content.timelineNote)} style="font-size:11px;letter-spacing:.2em;color:#6B6059">${escText(pt(content.timelineNote))}</span>
        </div>
        <div data-timeline="" style="position:relative">
          <div style="position:absolute;left:calc(clamp(21px,2.8vw,46px) / 2);top:14px;bottom:14px;width:1px;background:rgba(176,36,58,.20)"></div>
          <div data-axis-fill="" style="position:absolute;left:calc(clamp(21px,2.8vw,46px) / 2);top:14px;width:1px;height:0;background:linear-gradient(to bottom, rgba(201,162,91,.9), #B0243A);transition:height .3s linear"></div>
          ${timelineSteps.map((s, i) => timelineStepBlock(s, i)).join('\n')}
        </div>
      </div>

      <div style="position:relative;padding:clamp(80px,15vh,180px) clamp(20px,5vw,64px);overflow:hidden">
        <div style="position:absolute;inset:0;background:radial-gradient(56% 62% at 50% 50%, rgba(176,36,58,.34), rgba(176,36,58,0) 70%);animation:veil 14s ease-in-out infinite"></div>
        <div data-reveal="" style="position:relative;max-width:1000px;margin:0 auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:30px">
          <span style="width:1px;height:56px;background:linear-gradient(to bottom, rgba(176,36,58,0), #B0243A)"></span>
          <p${dataEn(content.quoteText)} style="margin:0;font-family:'Bodoni Moda',serif;font-style:italic;font-weight:400;font-size:clamp(22px,2.8vw,40px);line-height:1.22;letter-spacing:-.015em;color:#F2E9E0;text-wrap:pretty">${escText(pt(content.quoteText))}</p>
          <span style="width:1px;height:56px;background:linear-gradient(to bottom, #B0243A, rgba(176,36,58,0))"></span>
        </div>
      </div>

      <div style="padding:0 clamp(20px,5vw,64px) clamp(70px,12vh,150px);max-width:1520px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(20px,3vw,40px);align-items:end">
        ${galleryTile(houseGallery[0] ?? {}, 'height:clamp(300px,52vh,520px)', 0)}
        ${galleryTile(houseGallery[1] ?? {}, 'height:clamp(380px,68vh,660px)', 130, true)}
        ${galleryTile(houseGallery[2] ?? {}, 'height:clamp(260px,42vh,430px)', 260)}
      </div>

      <div style="padding:0 clamp(20px,5vw,64px) clamp(80px,14vh,170px);max-width:1520px;margin:0 auto">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:clamp(28px,4.5vh,58px)">
          <span data-reveal=""${dataEn(content.rulesEyebrow)} style="font-size:10px;letter-spacing:.44em;text-transform:uppercase;color:#B0243A">${escText(pt(content.rulesEyebrow))}</span>
          <span data-reveal=""${dataEn(content.rulesNote)} style="font-size:11px;letter-spacing:.2em;color:#6B6059">${escText(pt(content.rulesNote))}</span>
        </div>
        <div data-rules="" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:clamp(28px,5vw,76px);align-items:center">
          <div data-reveal="" style="position:relative;width:100%;max-width:560px;margin:0 auto;aspect-ratio:1/1">
            <svg viewBox="0 0 440 440" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible">
              <defs><radialGradient id="rgCore" cx="50%" cy="46%" r="62%"><stop offset="0%" stop-color="#2A1017" stop-opacity="0.95"></stop><stop offset="62%" stop-color="#12080C" stop-opacity="0.9"></stop><stop offset="100%" stop-color="#0A0708" stop-opacity="0.98"></stop></radialGradient></defs>
              <circle cx="220" cy="220" r="128" fill="url(#rgCore)"></circle>
              <circle cx="220" cy="220" r="128" fill="none" stroke="rgba(201,162,91,.16)" stroke-width="1"></circle>
              <circle cx="220" cy="220" r="136" fill="none" stroke="rgba(201,162,91,.07)" stroke-width="1"></circle>
              <circle cx="220" cy="220" r="170" fill="none" stroke="rgba(201,162,91,.16)" stroke-width="1"></circle>
              <circle data-glow="" cx="220" cy="220" r="170" fill="none" stroke="rgba(176,36,58,.85)" stroke-width="9" stroke-linecap="round" stroke-dasharray="196 872.1" stroke-dashoffset="-703.1" style="filter:blur(11px);transform-origin:220px 220px;transform:rotate(0deg);transition:transform 1.1s cubic-bezier(.2,.7,.2,1)"></circle>
              <circle data-arc="" cx="220" cy="220" r="170" fill="none" stroke="#B0243A" stroke-width="2" stroke-linecap="round" stroke-dasharray="196 872.1" stroke-dashoffset="-703.1" style="transform-origin:220px 220px;transform:rotate(0deg);transition:transform 1.1s cubic-bezier(.2,.7,.2,1)"></circle>
              <g data-needle="" style="transform-origin:220px 220px;transform:rotate(0deg);transition:transform 1.1s cubic-bezier(.2,.7,.2,1)"><line x1="220" y1="84" x2="220" y2="58" stroke="rgba(201,162,91,.75)" stroke-width="1"></line><circle cx="220" cy="84" r="2.5" fill="#C9A25B"></circle></g>
              ${houseRules.map((_, i) => ruleSvgGroup(i, houseRules.length)).join('')}
            </svg>
            <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:54%;height:38%">${houseRules.map((r, i) => rulePanel(r, i)).join('')}</div>
          </div>
          <div>
            <p data-reveal=""${dataEn(content.rulesIntro)} style="margin:0 0 clamp(20px,3vh,32px);max-width:44ch;font-size:15px;line-height:2;color:#B9AEA6;text-wrap:pretty">${escText(pt(content.rulesIntro))}</p>
            <div data-reveal="" data-reveal-delay="110" style="border-top:1px solid rgba(176,36,58,.16)">${houseRules.map((r, i) => ruleListRow(r, i)).join('')}</div>
            <div data-reveal="" data-reveal-delay="260" style="display:flex;align-items:center;gap:14px;margin-top:clamp(18px,2.6vh,28px)"><span style="width:40px;height:1px;background:linear-gradient(to right, #B0243A, rgba(176,36,58,0))"></span><span style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#6B6059"><span data-slot="nome">${brand}</span> · Dublin</span></div>
          </div>
        </div>
      </div>

      <div style="padding:0 clamp(20px,5vw,64px) clamp(90px,16vh,180px);max-width:1040px;margin:0 auto">
        <span data-reveal=""${dataEn(content.faqEyebrow)} style="font-size:10px;letter-spacing:.44em;text-transform:uppercase;color:#B0243A">${escText(pt(content.faqEyebrow))}</span>
        <div data-reveal="" data-reveal-delay="100" style="margin-top:clamp(26px,4vh,46px);border-top:1px solid rgba(176,36,58,.20)">
          ${faq.map((f) => faqBlock(f)).join('\n')}
        </div>
      </div>
    </section>

    <section data-page="valores" data-screen-label="Valores" style="display:none;transition:opacity .5s ease, transform .5s cubic-bezier(.2,.7,.2,1), filter .5s ease">
      <div style="position:relative;padding:clamp(150px,22vh,250px) clamp(20px,5vw,64px) clamp(40px,7vh,80px);overflow:hidden">
        <div style="position:absolute;inset:0;background:radial-gradient(58% 60% at 76% 24%, rgba(176,36,58,.30), rgba(176,36,58,0) 68%);animation:veil 13s ease-in-out infinite"></div>
        <div style="position:relative;max-width:1520px;margin:0 auto">
          <span data-reveal=""${dataEn(content.ratesEyebrow)} style="font-size:10px;letter-spacing:.44em;text-transform:uppercase;color:#B0243A">${escText(pt(content.ratesEyebrow))}</span>
          <h2 data-reveal="" data-reveal-delay="100"${dataEn(content.ratesTitle)} style="margin:22px 0 0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(28px,3.2vw,46px);line-height:1.1;letter-spacing:-.02em;max-width:24ch;text-wrap:pretty">${escText(pt(content.ratesTitle))}</h2>
          <div data-reveal="" data-reveal-delay="200" style="margin-top:clamp(30px,5vh,54px);display:flex;flex-wrap:wrap;align-items:center;gap:16px">
            <span data-en="Session length" style="font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#6B6059">Duração da sessão</span>
            <div style="display:flex;gap:6px;padding:5px;border:1px solid rgba(176,36,58,.3);border-radius:999px">
              <button data-duration="1" type="button" style="background:#B0243A;color:#F6EFE4;border:0;border-radius:999px;padding:10px 20px;font-size:10px;letter-spacing:.26em;text-transform:uppercase;cursor:pointer;transition:background .55s ease,color .55s ease">60 / 75'</button>
              <button data-duration="2" type="button" style="background:transparent;color:#9A8F88;border:0;border-radius:999px;padding:10px 20px;font-size:10px;letter-spacing:.26em;text-transform:uppercase;cursor:pointer;transition:background .55s ease,color .55s ease">90'</button>
            </div>
          </div>
        </div>
      </div>

      <div style="padding:clamp(24px,4vh,50px) clamp(20px,5vw,64px) clamp(70px,12vh,140px);max-width:1520px;margin:0 auto">
        <div data-price-grid="" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:clamp(16px,1.6vw,24px)">
          ${massages.map((m, i) => priceCard(m, i)).join('\n')}
        </div>
      </div>

      <div data-reveal="" style="position:relative;height:clamp(360px,62vh,600px);overflow:hidden;margin:0;border-top:1px solid rgba(176,36,58,.22);border-bottom:1px solid rgba(176,36,58,.22)">
        ${mediaBlock(content.eveningRitualMedia, 'feature')}
        <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(11,7,8,.94), rgba(28,10,16,.34) 55%, rgba(11,7,8,.55));pointer-events:none"></div>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center;padding:0 clamp(20px,5vw,64px);pointer-events:none">
          <p${dataEn(content.eveningRitualQuote)} style="margin:0;font-family:'Bodoni Moda',serif;font-style:italic;font-weight:400;font-size:clamp(20px,2.4vw,34px);line-height:1.22;max-width:24ch;color:#F2E9E0;text-wrap:pretty">${escText(pt(content.eveningRitualQuote))}</p>
          <span${dataEn(content.eveningRitualLabel)} style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:rgba(201,162,91,.85)">${escText(pt(content.eveningRitualLabel))}</span>
        </div>
      </div>

      <div style="padding:clamp(70px,12vh,140px) clamp(20px,5vw,64px) clamp(60px,10vh,120px);max-width:1520px;margin:0 auto">
        <span data-reveal=""${dataEn(content.additionsEyebrow)} style="font-size:10px;letter-spacing:.44em;text-transform:uppercase;color:#B0243A">${escText(pt(content.additionsEyebrow))}</span>
        <div style="margin-top:clamp(28px,4vh,50px);display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:clamp(22px,3vw,44px)">
          ${additions.map((a, i) => additionBlock(a, i * 110)).join('\n')}
        </div>
      </div>

      <div style="padding:0 clamp(20px,5vw,64px) clamp(90px,16vh,180px);max-width:1520px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(28px,5vw,70px)">
        <div data-reveal="" style="display:flex;flex-direction:column;gap:14px;padding-top:20px;border-top:1px solid rgba(176,36,58,.28)">
          <span${dataEn(content.paymentTitle)} style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#B0243A">${escText(pt(content.paymentTitle))}</span>
          <p${dataEn(content.paymentBody)} style="margin:0;font-size:15px;line-height:1.9;color:#B9AEA6;text-wrap:pretty">${escText(pt(content.paymentBody))}</p>
        </div>
        <div data-reveal="" data-reveal-delay="140" style="display:flex;flex-direction:column;gap:14px;padding-top:20px;border-top:1px solid rgba(176,36,58,.28)">
          <span${dataEn(content.cancellationTitle)} style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#B0243A">${escText(pt(content.cancellationTitle))}</span>
          <p${dataEn(content.cancellationBody)} style="margin:0;font-size:15px;line-height:1.9;color:#B9AEA6;text-wrap:pretty">${escText(pt(content.cancellationBody))}</p>
        </div>
      </div>
    </section>

    <section data-page="agendar" data-screen-label="Agendar" style="display:none;transition:opacity .5s ease, transform .5s cubic-bezier(.2,.7,.2,1), filter .5s ease">
      <div style="padding:clamp(140px,20vh,220px) clamp(20px,5vw,64px) clamp(50px,8vh,90px);max-width:1440px;margin:0 auto">
        <span data-reveal=""${dataEn(content.bookingEyebrow)} style="font-size:10px;letter-spacing:.42em;text-transform:uppercase;color:#8C7444">${escText(pt(content.bookingEyebrow))}</span>
        <h2 data-reveal="" data-reveal-delay="100" style="margin:22px 0 0;font-family:'Bodoni Moda',serif;font-weight:400;font-size:clamp(30px,3.6vw,50px);line-height:1.08;max-width:16ch"${dataEn(content.bookingTitle)}>${escText(pt(content.bookingTitle))}</h2>
      </div>

      <div style="padding:0 clamp(20px,5vw,64px) clamp(90px,16vh,180px);max-width:1440px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:clamp(34px,5vw,80px);align-items:start">
        <form data-booking="" style="display:flex;flex-direction:column;gap:26px">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:22px">
            <label style="display:flex;flex-direction:column;gap:9px">
              <span data-en="Name" style="font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#8C7444">Nome</span>
              <input type="text" name="nome" required data-en-ph="How we should call you" placeholder="Como devemos chamar você" style="background:transparent;border:0;border-bottom:1px solid rgba(201,162,91,.24);padding:10px 0;font-weight:400;font-size:15px;outline:none;transition:border-color .5s ease" style-focus="border-color:#C9A25B" />
            </label>
            <label style="display:flex;flex-direction:column;gap:9px">
              <span data-en="Phone or e-mail" style="font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#8C7444">Telefone ou e-mail</span>
              <input type="text" name="contato" required placeholder="+353 ..." style="background:transparent;border:0;border-bottom:1px solid rgba(201,162,91,.24);padding:10px 0;font-weight:400;font-size:15px;outline:none;transition:border-color .5s ease" style-focus="border-color:#C9A25B" />
            </label>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:22px">
            <label style="display:flex;flex-direction:column;gap:9px">
              <span data-en="Massage" style="font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#8C7444">Massagem</span>
              <select name="servico" style="background:#0B0809;border:0;border-bottom:1px solid rgba(201,162,91,.24);padding:10px 0;font-weight:400;font-size:15px;outline:none;cursor:pointer;transition:border-color .5s ease" style-focus="border-color:#C9A25B">
                ${massages.map((m) => `<option data-en="${escAttr(pt(m.title) ? `${m.title?.en ?? ''}` : '')}">${escText(pt(m.title))}</option>`).join('')}
              </select>
            </label>
            <label style="display:flex;flex-direction:column;gap:9px">
              <span data-en="Duration" style="font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#8C7444">Duração</span>
              <select name="duracao" style="background:#0B0809;border:0;border-bottom:1px solid rgba(201,162,91,.24);padding:10px 0;font-weight:400;font-size:15px;outline:none;cursor:pointer;transition:border-color .5s ease" style-focus="border-color:#C9A25B">
                <option data-en="60 minutes">60 minutos</option>
                <option data-en="75 minutes">75 minutos</option>
                <option data-en="90 minutes">90 minutos</option>
                <option data-en="120 minutes">120 minutos</option>
              </select>
            </label>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:22px">
            <label style="display:flex;flex-direction:column;gap:9px">
              <span data-en="Date" style="font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#8C7444">Data</span>
              <input type="date" name="data" required style="background:transparent;border:0;border-bottom:1px solid rgba(201,162,91,.24);padding:10px 0;font-weight:400;font-size:15px;outline:none;color-scheme:dark;transition:border-color .5s ease" style-focus="border-color:#C9A25B" />
            </label>
            <label style="display:flex;flex-direction:column;gap:9px">
              <span data-en="Preferred time" style="font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#8C7444">Horário desejado</span>
              <input type="time" name="hora" required style="background:transparent;border:0;border-bottom:1px solid rgba(201,162,91,.24);padding:10px 0;font-weight:400;font-size:15px;outline:none;color-scheme:dark;transition:border-color .5s ease" style-focus="border-color:#C9A25B" />
            </label>
          </div>
          <label style="display:flex;flex-direction:column;gap:9px">
            <span data-en="Anything we should know" style="font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#8C7444">Algo que devemos saber</span>
            <textarea name="obs" rows="3" data-en-ph="Preferences, pressure, areas to avoid" placeholder="Preferências, pressão, áreas a evitar" style="background:transparent;border:0;border-bottom:1px solid rgba(201,162,91,.24);padding:10px 0;font-weight:400;font-size:15px;outline:none;resize:vertical;transition:border-color .5s ease" style-focus="border-color:#C9A25B"></textarea>
          </label>
          <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:8px">
            <button type="submit" data-en="Request this time" style="padding:16px 32px;border-radius:999px;border:0;background:#C9A25B;color:#0B0809;font-size:11px;letter-spacing:.26em;text-transform:uppercase;cursor:pointer;transition:background .5s ease" style-hover="background:#E4C88C">Solicitar este horário</button>
            <a href="https://wa.me/${whatsappDigits}" target="_blank" rel="noopener" data-en="or talk on WhatsApp" style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;font-weight:400">ou falar pelo WhatsApp</a>
          </div>
          <div data-booking-ok="" style="display:none;opacity:0;transform:translateY(8px);transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.2,1);border:1px solid rgba(201,162,91,.32);padding:22px 24px;background:linear-gradient(140deg, rgba(142,27,40,.14), rgba(11,8,9,0) 60%)">
            <p style="margin:0;font-family:'Bodoni Moda',serif;font-size:22px;font-weight:400"${dataEn(content.bookingConfirmation)}>${escText(pt(content.bookingConfirmation))}</p>
          </div>
        </form>

        <div style="display:flex;flex-direction:column;gap:clamp(24px,4vh,40px)">
          <div data-reveal="" style="position:relative;height:clamp(240px,38vh,380px)">${mediaBlock(content.bookingSidebarMedia)}</div>
          <div style="display:flex;flex-direction:column;gap:10px;padding-bottom:20px;border-bottom:1px solid rgba(201,162,91,.14)">
            <span data-en="Hours" style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#8C7444">Horários</span>
            <span data-en="${escAttr(`${content.hoursLine?.en ?? ''} · ${content.hoursNote?.en ?? ''}`)}" style="font-size:15px;font-weight:400;color:#B9AEA6;line-height:1.8">${escText(pt(content.hoursLine))} · ${escText(pt(content.hoursNote))}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;padding-bottom:20px;border-bottom:1px solid rgba(201,162,91,.14)">
            <span data-en="Contact" style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#8C7444">Contato</span>
            <span style="font-size:15px;font-weight:400;color:#B9AEA6;line-height:1.8">${whatsappDisplay} · ${escText(content.email)}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <span data-en="Before you send" style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#8C7444">Antes de enviar</span>
            <p style="margin:0;font-size:14px;font-weight:400;line-height:1.9;color:#9A8F88;text-wrap:pretty"${dataEn(content.bookingBeforeSendNote)}>${escText(pt(content.bookingBeforeSendNote))}</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer style="position:relative;z-index:10;padding:clamp(40px,7vh,70px) clamp(20px,5vw,64px);border-top:1px solid rgba(201,162,91,.12);display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between">
    <span data-slot="nome" style="font-family:'Bodoni Moda',serif;font-size:16px;letter-spacing:.24em;text-transform:uppercase;color:#EDE6DD">${brand}</span>
    <span${dataEn(content.footerTagline)} style="font-size:11px;letter-spacing:.2em;color:#6B6059;font-weight:400">${escText(pt(content.footerTagline))}</span>
    <div style="display:flex;gap:22px;flex-wrap:wrap">
      <a href="#" data-goto="casa" data-en="The House" style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9A8F88">A Casa</a>
      <a href="#" data-goto="valores" data-en="Rates" style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9A8F88">Valores</a>
      <a href="#" data-goto="agendar" data-en="Book" style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9A8F88">Agendar</a>
    </div>
  </footer>`
}
