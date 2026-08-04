import { defineType, defineField } from 'sanity'

export const houseRule = defineType({
  name: 'houseRule',
  title: 'Regra da casa',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'localeString' }),
    defineField({ name: 'body', title: 'Texto', type: 'localeText' }),
  ],
  preview: {
    select: { title: 'title.pt' },
  },
})
