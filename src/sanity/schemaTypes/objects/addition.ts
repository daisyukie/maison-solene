import { defineType, defineField } from 'sanity'

export const addition = defineType({
  name: 'addition',
  title: 'Acréscimo',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'localeString' }),
    defineField({ name: 'value', title: 'Valor (ex: €260 ou −15%)', type: 'localeString' }),
    defineField({ name: 'body', title: 'Texto', type: 'localeText' }),
  ],
  preview: {
    select: { title: 'title.pt', subtitle: 'value.pt' },
  },
})
