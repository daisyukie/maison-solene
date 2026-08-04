import { defineType, defineField } from 'sanity'

export const massage = defineType({
  name: 'massage',
  title: 'Massagem',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Nome', type: 'localeString' }),
    defineField({
      name: 'homeDescription',
      title: 'Descrição (página inicial, mais longa)',
      type: 'localeText',
    }),
    defineField({
      name: 'rateDescription',
      title: 'Descrição (página de valores, mais curta)',
      type: 'localeText',
    }),
    defineField({ name: 'duration1', title: 'Duração 1 (ex: 60\')', type: 'string' }),
    defineField({ name: 'duration2', title: 'Duração 2 (ex: 90\')', type: 'string' }),
    defineField({ name: 'price1', title: 'Preço na duração 1 (ex: €120)', type: 'string' }),
    defineField({ name: 'price2', title: 'Preço na duração 2 (ex: €165)', type: 'string' }),
    defineField({ name: 'media', title: 'Foto ou vídeo', type: 'siteMedia' }),
  ],
  preview: {
    select: { title: 'title.pt', media: 'media.image' },
  },
})
