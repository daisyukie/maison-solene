import { defineType, defineField } from 'sanity'

export const media = defineType({
  name: 'siteMedia',
  title: 'Foto ou vídeo',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      description: 'Usada como imagem de fundo, ou como capa do vídeo abaixo.',
    }),
    defineField({
      name: 'video',
      title: 'Vídeo',
      type: 'file',
      options: { accept: 'video/*' },
    }),
    defineField({
      name: 'hint',
      title: 'Legenda de referência',
      type: 'string',
      description: 'Texto mostrado apenas enquanto não há foto/vídeo — ajuda a lembrar o que capturar aqui.',
    }),
  ],
  preview: {
    select: { media: 'image', title: 'hint' },
  },
})
