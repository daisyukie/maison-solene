import { defineType, defineField } from 'sanity'

export const siteContent = defineType({
  name: 'siteContent',
  title: 'Site — Maison Solène',
  type: 'document',
  groups: [
    { name: 'brand', title: 'Marca e contato' },
    { name: 'home', title: 'Início' },
    { name: 'house', title: 'A Casa' },
    { name: 'rates', title: 'Valores' },
    { name: 'booking', title: 'Agendar' },
  ],
  fields: [
    // -------- Brand / contact (used across every page) --------
    defineField({ name: 'brandName', title: 'Nome da casa', type: 'string', group: 'brand', initialValue: 'Maison Solène' }),
    defineField({ name: 'whatsapp', title: 'WhatsApp (como deve aparecer, ex: +353 87 000 0000)', type: 'string', group: 'brand' }),
    defineField({ name: 'email', title: 'E-mail de contato', type: 'string', group: 'brand' }),
    defineField({ name: 'addressLine', title: 'Endereço (rua e número)', type: 'string', group: 'brand' }),
    defineField({ name: 'addressNote', title: 'Nota do endereço', type: 'localeString', group: 'brand' }),
    defineField({ name: 'hoursLine', title: 'Horário principal', type: 'localeString', group: 'brand' }),
    defineField({ name: 'hoursNote', title: 'Nota de horário (ex: domingo)', type: 'localeString', group: 'brand' }),
    defineField({ name: 'footerTagline', title: 'Linha do rodapé', type: 'localeString', group: 'brand' }),

    // -------- Home --------
    defineField({ name: 'heroMedia', title: 'Foto/vídeo de abertura', type: 'siteMedia', group: 'home' }),
    defineField({ name: 'heroEyebrow', title: 'Selo acima do título', type: 'localeString', group: 'home' }),
    defineField({ name: 'heroTitlePt', title: 'Título — Português (pode usar <br /> para quebrar linha)', type: 'string', group: 'home' }),
    defineField({ name: 'heroTitleEn', title: 'Título — English (pode usar <br /> para quebrar linha)', type: 'string', group: 'home' }),
    defineField({ name: 'heroSubtitle', title: 'Subtítulo', type: 'localeText', group: 'home' }),

    defineField({ name: 'houseIntroEyebrow', title: '"01 — A casa" — selo', type: 'localeString', group: 'home' }),
    defineField({ name: 'houseIntroParagraph', title: '"01 — A casa" — parágrafo', type: 'localeText', group: 'home' }),
    defineField({
      name: 'stats',
      title: 'Números (ex: 04 suítes, 60\' sessão mínima)',
      type: 'array',
      group: 'home',
      of: [
        {
          type: 'object',
          name: 'stat',
          fields: [
            defineField({ name: 'number', title: 'Número', type: 'string' }),
            defineField({ name: 'label', title: 'Legenda', type: 'localeString' }),
          ],
          preview: { select: { title: 'number', subtitle: 'label.pt' } },
        },
      ],
      validation: (r) => r.max(3),
    }),

    defineField({ name: 'massagesEyebrow', title: '"02 — Massagens" — selo', type: 'localeString', group: 'home' }),
    defineField({
      name: 'massages',
      title: 'Massagens',
      type: 'array',
      group: 'home',
      of: [{ type: 'massage' }],
      validation: (r) => r.max(4),
    }),

    defineField({ name: 'videoBannerQuote', title: 'Faixa de vídeo — frase', type: 'localeText', group: 'home' }),
    defineField({ name: 'videoBannerCaption', title: 'Faixa de vídeo — legenda pequena', type: 'localeString', group: 'home' }),
    defineField({ name: 'videoBannerMedia', title: 'Faixa de vídeo — mídia', type: 'siteMedia', group: 'home' }),

    defineField({
      name: 'homeGallery',
      title: 'Galeria (3 fotos/vídeos)',
      type: 'array',
      group: 'home',
      of: [{ type: 'siteMedia' }],
      validation: (r) => r.max(3),
    }),

    // -------- House --------
    defineField({ name: 'houseHeroMedia', title: 'Foto/vídeo de abertura', type: 'siteMedia', group: 'house' }),
    defineField({ name: 'houseHeroEyebrow', title: 'Selo', type: 'localeString', group: 'house' }),
    defineField({ name: 'houseHeroTitle', title: 'Título', type: 'localeString', group: 'house' }),
    defineField({ name: 'houseHeroSubtitle', title: 'Subtítulo', type: 'localeText', group: 'house' }),

    defineField({ name: 'timelineEyebrow', title: '"01 — O percurso" — selo', type: 'localeString', group: 'house' }),
    defineField({ name: 'timelineNote', title: '"01 — O percurso" — nota à direita', type: 'localeString', group: 'house' }),
    defineField({
      name: 'timelineSteps',
      title: 'Etapas do percurso',
      type: 'array',
      group: 'house',
      of: [{ type: 'timelineStep' }],
      validation: (r) => r.max(4),
    }),

    defineField({ name: 'quoteText', title: 'Frase em destaque', type: 'localeText', group: 'house' }),

    defineField({
      name: 'houseGallery',
      title: 'Galeria (3 fotos/vídeos)',
      type: 'array',
      group: 'house',
      of: [{ type: 'siteMedia' }],
      validation: (r) => r.max(3),
    }),

    defineField({ name: 'rulesEyebrow', title: '"02 — Regras da casa" — selo', type: 'localeString', group: 'house' }),
    defineField({ name: 'rulesNote', title: '"02 — Regras da casa" — nota à direita', type: 'localeString', group: 'house' }),
    defineField({ name: 'rulesIntro', title: 'Frase de introdução das regras', type: 'localeText', group: 'house' }),
    defineField({
      name: 'houseRules',
      title: 'Regras (5)',
      type: 'array',
      group: 'house',
      of: [{ type: 'houseRule' }],
      validation: (r) => r.max(5),
    }),

    defineField({ name: 'faqEyebrow', title: '"03 — Perguntas frequentes" — selo', type: 'localeString', group: 'house' }),
    defineField({
      name: 'faq',
      title: 'Perguntas frequentes',
      type: 'array',
      group: 'house',
      of: [{ type: 'faqItem' }],
    }),

    // -------- Rates --------
    defineField({ name: 'ratesEyebrow', title: 'Selo', type: 'localeString', group: 'rates' }),
    defineField({ name: 'ratesTitle', title: 'Título', type: 'localeString', group: 'rates' }),

    defineField({ name: 'eveningRitualMedia', title: 'Ritual noturno — mídia', type: 'siteMedia', group: 'rates' }),
    defineField({ name: 'eveningRitualQuote', title: 'Ritual noturno — frase', type: 'localeText', group: 'rates' }),
    defineField({ name: 'eveningRitualLabel', title: 'Ritual noturno — legenda (ex: Ritual Noturno · 90 min · €260)', type: 'localeString', group: 'rates' }),

    defineField({ name: 'additionsEyebrow', title: '"Acréscimos" — selo', type: 'localeString', group: 'rates' }),
    defineField({
      name: 'additions',
      title: 'Acréscimos',
      type: 'array',
      group: 'rates',
      of: [{ type: 'addition' }],
      validation: (r) => r.max(3),
    }),

    defineField({ name: 'paymentTitle', title: 'Pagamento — título', type: 'localeString', group: 'rates' }),
    defineField({ name: 'paymentBody', title: 'Pagamento — texto', type: 'localeText', group: 'rates' }),
    defineField({ name: 'cancellationTitle', title: 'Cancelamento — título', type: 'localeString', group: 'rates' }),
    defineField({ name: 'cancellationBody', title: 'Cancelamento — texto', type: 'localeText', group: 'rates' }),

    // -------- Booking --------
    defineField({ name: 'bookingEyebrow', title: 'Selo', type: 'localeString', group: 'booking' }),
    defineField({ name: 'bookingTitle', title: 'Título', type: 'localeString', group: 'booking' }),
    defineField({ name: 'bookingSidebarMedia', title: 'Foto/vídeo lateral', type: 'siteMedia', group: 'booking' }),
    defineField({ name: 'bookingBeforeSendNote', title: 'Nota "Antes de enviar"', type: 'localeText', group: 'booking' }),
    defineField({ name: 'bookingConfirmation', title: 'Mensagem de confirmação após enviar', type: 'localeString', group: 'booking' }),
  ],
  preview: {
    prepare() {
      return { title: 'Conteúdo do site' }
    },
  },
})
