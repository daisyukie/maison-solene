import { defineType, defineField } from 'sanity'

export const timelineStep = defineType({
  name: 'timelineStep',
  title: 'Etapa do percurso',
  type: 'object',
  fields: [
    defineField({ name: 'kicker', title: 'Texto pequeno (ex: 23:05 · a rua)', type: 'localeString' }),
    defineField({ name: 'title', title: 'Título', type: 'localeString' }),
    defineField({ name: 'body', title: 'Texto', type: 'localeText' }),
    defineField({ name: 'media', title: 'Foto ou vídeo', type: 'siteMedia' }),
  ],
  preview: {
    select: { title: 'title.pt', media: 'media.image' },
  },
})
