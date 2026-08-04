// One-time seed: writes the original design copy into the "siteContent"
// singleton document so the CMS starts fully populated instead of empty.
// Run with: node scripts/seed.mjs   (needs SANITY_API_WRITE_TOKEN in .env.local)
import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  } catch {
    // ignore if missing, rely on real env vars instead
  }
}
loadEnvLocal()

const client = createClient({
  projectId: process.env.SANITY_API_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_API_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const doc = {
  _id: 'siteContent',
  _type: 'siteContent',

  brandName: 'Maison Solène',
  whatsapp: '+00 000 000 0000',
  email: 'reservas@[dominio].ie',
  addressLine: '[Rua e número]',
  addressNote: { pt: 'Dublin 2 · endereço exato enviado após confirmação', en: 'Dublin 2 · exact address sent after confirmation' },
  hoursLine: { pt: 'Seg – Sáb · 11h às 23h', en: 'Mon – Sat · 11:00 to 23:00' },
  hoursNote: { pt: 'Domingo sob consulta', en: 'Sunday by request' },
  footerTagline: { pt: 'Dublin, Irlanda · Somente com hora marcada · 18+', en: 'Dublin, Ireland · By appointment only · 18+' },

  heroMedia: { hint: 'foto de abertura · penumbra, tecido, vela' },
  heroEyebrow: { pt: 'Dublin · Somente com hora marcada', en: 'Dublin · By appointment only' },
  heroTitlePt: 'O tempo desacelera<br />no instante em que você entra.',
  heroTitleEn: 'Time slows down<br />the moment you arrive.',
  heroSubtitle: {
    pt: 'Uma casa de massagem discreta. Mãos quentes, luz baixa e uma hora que pertence inteiramente a você.',
    en: 'A quiet massage house. Warm hands, low light, and an hour that belongs entirely to you.',
  },

  houseIntroEyebrow: { pt: '01 — A casa', en: '01 — The house' },
  houseIntroParagraph: {
    pt: 'Criamos um lugar pequeno e silencioso para uma única coisa: ser cuidado sem pressa. Poucas salas, poucos horários por dia e discrição completa a partir da porta.',
    en: 'We built a small, quiet place for one thing only: to be attended to without hurry. Few rooms, few bookings a day, and complete discretion from the door onwards.',
  },
  stats: [
    { _key: 'stat1', number: '04', label: { pt: 'Suítes privativas, nunca compartilhadas', en: 'Private suites, never shared' } },
    { _key: 'stat2', number: "60'", label: { pt: 'Sessão mínima — nenhuma hora corrida', en: 'Minimum session — no rushed hours' } },
    { _key: 'stat3', number: '01', label: { pt: 'Convidado por vez na recepção', en: 'Guest at a time in the reception' } },
  ],

  massagesEyebrow: { pt: '02 — Massagens', en: '02 — Massages' },
  massages: [
    {
      _key: 'm1', _type: 'massage',
      title: { pt: 'Toque Sereno', en: 'Serene Touch' },
      homeDescription: { pt: 'Massagem relaxante lenta e contínua. Movimentos longos, óleo morno e nenhuma interrupção do início ao fim.', en: 'Slow, continuous relaxing massage. Long strokes, warm oil, no interruption from start to finish.' },
      rateDescription: { pt: 'Relaxante lenta e contínua. Movimentos longos, óleo morno, nenhuma interrupção.', en: 'Slow, continuous relaxing massage. Long strokes, warm oil, no interruption.' },
      duration1: "60'", duration2: "90'", price1: '€120', price2: '€165',
      media: { hint: 'toque sereno · linho e óleo' },
    },
    {
      _key: 'm2', _type: 'massage',
      title: { pt: 'Fluxo', en: 'Flow' },
      homeDescription: { pt: 'Drenagem linfática com pressão medida. Para pernas pesadas, voos longos e dias inchados.', en: 'Lymphatic drainage with measured pressure. For heavy legs, long flights and swollen days.' },
      rateDescription: { pt: 'Drenagem linfática com pressão medida. Para pernas pesadas e dias inchados.', en: 'Lymphatic drainage with measured pressure. For heavy legs and swollen days.' },
      duration1: "60'", duration2: "90'", price1: '€140', price2: '€190',
      media: { hint: 'fluxo · pressão medida' },
    },
    {
      _key: 'm3', _type: 'massage',
      title: { pt: 'Brasa', en: 'Ember' },
      homeDescription: { pt: 'Pedras quentes de basalto apoiadas ao longo da coluna enquanto as mãos trabalham ao redor. Calor seco e profundo.', en: 'Hot basalt stones resting along the spine while the hands work around them. Deep, dry warmth.' },
      rateDescription: { pt: 'Pedras quentes de basalto ao longo da coluna, com as mãos trabalhando ao redor.', en: 'Hot basalt stones along the spine, with the hands working around them.' },
      duration1: "75'", duration2: "90'", price1: '€170', price2: '€200',
      media: { hint: 'brasa · pedra quente' },
    },
    {
      _key: 'm4', _type: 'massage',
      title: { pt: 'Duas Presenças', en: 'Two Presences' },
      homeDescription: { pt: 'Quatro mãos, dois terapeutas, um só ritmo. A sessão mais envolvente da casa.', en: 'Four hands, two therapists, one rhythm. The most enveloping session in the house.' },
      rateDescription: { pt: 'Quatro mãos, dois terapeutas, um só ritmo. A sessão mais envolvente da casa.', en: 'Four hands, two therapists, one rhythm. The most enveloping session in the house.' },
      duration1: "60'", duration2: "90'", price1: '€240', price2: '€320',
      media: { hint: 'duas presenças · quatro mãos' },
    },
  ],

  videoBannerQuote: { pt: 'Luz baixa, óleo morno e ninguém com pressa.', en: 'Low light, warm oil, and no one in a hurry.' },
  videoBannerCaption: { pt: 'Filme da casa · 40 segundos', en: 'Film of the house · 40 seconds' },
  videoBannerMedia: { hint: 'vídeo · a casa ao anoitecer' },

  homeGallery: [
    { _key: 'hg1', hint: 'detalhe · óleo e linho' },
    { _key: 'hg2', hint: 'suíte em penumbra' },
    { _key: 'hg3', hint: 'corredor · velas' },
  ],

  houseHeroMedia: { hint: 'vídeo · entrada, corredor, suíte' },
  houseHeroEyebrow: { pt: 'A casa', en: 'The house' },
  houseHeroTitle: { pt: 'Quatro salas. Um convidado por vez.', en: 'Four rooms. One guest at a time.' },
  houseHeroSubtitle: { pt: 'E uma porta que se fecha atrás de você.', en: 'And a door that closes behind you.' },

  timelineEyebrow: { pt: '01 — O percurso', en: '01 — The passage' },
  timelineNote: { pt: 'Da rua até a hora que é sua', en: 'From the street to the hour that is yours' },
  timelineSteps: [
    {
      _key: 't1', _type: 'timelineStep',
      kicker: { pt: '23h05 · a rua', en: '23:05 · the street' },
      title: { pt: 'A porta', en: 'The door' },
      body: { pt: 'Entrada privativa, sem sala de espera, sem cruzar com ninguém. Você toca, abrimos, e a rua desaparece atrás de você.', en: 'Private entrance, no waiting room, no crossing paths. You knock, we open, and the street disappears behind you.' },
      media: { hint: 'foto · porta e brasa' },
    },
    {
      _key: 't2', _type: 'timelineStep',
      kicker: { pt: 'os primeiros minutos', en: 'the first minutes' },
      title: { pt: 'A ducha', en: 'The shower' },
      body: { pt: 'Água quente, sabão neutro, roupão pesado. Cinco minutos só para o corpo desacelerar antes das mãos.', en: 'Hot water, unscented soap, a heavy robe. Five minutes just for the body to slow down before the hands.' },
      media: { hint: 'foto · vapor e latão' },
    },
    {
      _key: 't3', _type: 'timelineStep',
      kicker: { pt: 'a porta se fecha', en: 'the door closes' },
      title: { pt: 'A suíte', en: 'The suite' },
      body: { pt: 'Penumbra, lençol de linho, óleo aquecido em banho-maria. A temperatura da sala é ajustada antes de você entrar.', en: 'Dim light, linen sheet, oil warmed in a water bath. The room temperature is set before you walk in.' },
      media: { hint: 'vídeo · suíte em penumbra' },
    },
    {
      _key: 't4', _type: 'timelineStep',
      kicker: { pt: 'sem relógio à vista', en: 'no clock in sight' },
      title: { pt: 'A hora', en: 'The hour' },
      body: { pt: 'Nenhuma batida na porta, nenhum aviso de tempo. A sessão termina quando a hora termina — nunca antes.', en: 'No knock at the door, no time warning. The session ends when the hour ends — never before.' },
      media: { hint: 'foto · mãos e linho' },
    },
  ],

  quoteText: {
    pt: 'A discrição não é um detalhe aqui. Ela é o serviço inteiro, e todo o resto se organiza em volta dela.',
    en: 'Discretion is not a detail here. It is the whole service, and everything else is arranged around it.',
  },

  houseGallery: [
    { _key: 'hg1', hint: 'foto · lençol e sombra' },
    { _key: 'hg2', hint: 'vídeo · velas e cortina' },
    { _key: 'hg3', hint: 'foto · latão e chama' },
  ],

  rulesEyebrow: { pt: '02 — Regras da casa', en: '02 — House rules' },
  rulesNote: { pt: 'Cinco, e todas cumpridas', en: 'Five, and all of them kept' },
  rulesIntro: { pt: 'O que pedimos de você é pouco — e é o que mantém a casa em silêncio.', en: 'What we ask of you is short — and it is what keeps the house quiet.' },
  houseRules: [
    { _key: 'r1', title: { pt: 'Chegada', en: 'Arrival' }, body: { pt: 'Cinco minutos antes — nunca mais cedo. Até ali, a hora ainda é de outra pessoa.', en: 'Five minutes before — never earlier. Until then, the hour still belongs to someone else.' } },
    { _key: 'r2', title: { pt: 'Silêncio', en: 'Silence' }, body: { pt: 'Celular guardado, nenhuma câmera. A discrição vale para os dois lados da porta.', en: 'Phone away, no camera. Discretion runs on both sides of the door.' } },
    { _key: 'r3', title: { pt: 'Respeito', en: 'Respect' }, body: { pt: 'O respeito a quem recebe você é a única regra que não se negocia.', en: 'Respect for the person receiving you is the one rule that is never negotiable.' } },
    { _key: 'r4', title: { pt: 'Sobriedade', en: 'Sobriety' }, body: { pt: 'Sem álcool, sem substância, sem pressa. O corpo precisa estar presente.', en: 'No alcohol, no substances, no hurry. The body needs to be present.' } },
    { _key: 'r5', title: { pt: 'Cuidado', en: 'Care' }, body: { pt: 'Ducha, linho limpo e roupão prontos — antes e depois, sempre.', en: 'A shower, fresh linen and a robe ready — before and after, always.' } },
  ],

  faqEyebrow: { pt: '03 — Perguntas frequentes', en: '03 — Frequently asked' },
  faq: [
    { _key: 'f1', question: { pt: 'Preciso agendar com antecedência?', en: 'Do I need to book in advance?' }, answer: { pt: 'Sim. Atendemos somente com hora marcada e mantemos poucos horários por dia, então pedidos para o mesmo dia raramente são possíveis.', en: 'Yes. We work by appointment only and hold a limited number of slots per day, so same-day requests are rarely possible.' } },
    { _key: 'f2', question: { pt: 'Posso escolher o profissional?', en: 'Can I choose the therapist?' }, answer: { pt: 'Você pode indicar uma preferência no agendamento e atendemos sempre que a agenda permitir.', en: 'You may state a preference when booking and we accommodate it whenever the schedule allows.' } },
    { _key: 'f3', question: { pt: 'Minha visita é confidencial?', en: 'Is my visit confidential?' }, answer: { pt: 'Totalmente. Guardamos apenas o necessário para manter sua reserva, e nada aparece em extratos além de uma descrição neutra.', en: 'Entirely. We keep only what is needed to hold your booking, and nothing appears on any statement beyond a neutral descriptor.' } },
    { _key: 'f4', question: { pt: 'Existe estacionamento por perto?', en: 'Is parking available nearby?' }, answer: { pt: 'Sim — há um estacionamento coberto a dois minutos a pé. Os detalhes seguem junto com a confirmação.', en: 'Yes — a covered car park sits two minutes away on foot. Details are sent with your confirmation.' } },
  ],

  ratesEyebrow: { pt: 'Valores', en: 'Rates' },
  ratesTitle: { pt: 'Um preço. Nada acrescentado na porta.', en: 'One price. Nothing added at the door.' },

  eveningRitualMedia: { hint: 'vídeo · ritual noturno' },
  eveningRitualQuote: { pt: 'Depois das 21h a casa é de um convidado por vez.', en: 'After 21:00 the house belongs to one guest at a time.' },
  eveningRitualLabel: { pt: 'Ritual Noturno · 90 min · €260', en: 'Evening Ritual · 90 min · €260' },

  additionsEyebrow: { pt: 'Acréscimos', en: 'Additions' },
  additions: [
    { _key: 'a1', title: { pt: 'Ritual Noturno', en: 'Evening Ritual' }, value: { pt: '€260', en: '€260' }, body: { pt: '90 minutos após as 21h, com banho quente preparado antes e tempo sem pressa depois.', en: '90 minutes after 21:00, with a warm bath prepared beforehand and unhurried time afterwards.' } },
    { _key: 'a2', title: { pt: 'Sequência de cinco', en: 'Sequence of five' }, value: { pt: '−15%', en: '−15%' }, body: { pt: 'Cinco sessões da mesma massagem, válidas por seis meses, transferíveis para uma outra pessoa.', en: 'Five sessions of the same massage, valid for six months, transferable to one other person.' } },
    { _key: 'a3', title: { pt: '30 minutos extras', en: 'Extra 30 minutes' }, value: { pt: '€60', en: '€60' }, body: { pt: 'Somados a qualquer sessão no momento da reserva, conforme a agenda da noite.', en: 'Added to any session at the time of booking, subject to the schedule of the evening.' } },
  ],

  paymentTitle: { pt: 'Formas de pagamento', en: 'Payment' },
  paymentBody: {
    pt: 'Dinheiro, cartão de débito e crédito, Revolut e transferência bancária. O extrato do cartão mostra apenas uma descrição neutra. O pagamento é feito ao final da sessão.',
    en: 'Cash, debit and credit card, Revolut and bank transfer. Card statements show a neutral descriptor only. Payment is settled at the end of the session.',
  },
  cancellationTitle: { pt: 'Política de cancelamento', en: 'Cancellation policy' },
  cancellationBody: {
    pt: 'Cancele ou remarque até 12 horas antes sem custo. Dentro de 12 horas, 50% do valor é retido. A ausência sem aviso é cobrada integralmente — a hora ficou reservada só para você.',
    en: 'Cancel or move your booking up to 12 hours before at no cost. Within 12 hours, 50% of the value is retained. A no-show is charged in full — the hour was held for you alone.',
  },

  bookingEyebrow: { pt: 'Agendamento', en: 'Booking' },
  bookingTitle: { pt: 'Escolha a sua hora.', en: 'Choose your hour.' },
  bookingSidebarMedia: { hint: 'mãos · toalha morna' },
  bookingBeforeSendNote: {
    pt: 'Um pedido ainda não é uma reserva confirmada. Respondemos com a hora disponível e o endereço exato. Cancelamento gratuito até 12 horas antes.',
    en: 'A request is not yet a confirmed booking. We reply with the available hour and the exact address. Free cancellation up to 12 hours before.',
  },
  bookingConfirmation: { pt: 'Pedido recebido. Confirmamos por mensagem em algumas horas.', en: 'Request received. We confirm by message within a few hours.' },
}

const result = await client.createOrReplace(doc)
console.log('Seeded siteContent document:', result._id)
