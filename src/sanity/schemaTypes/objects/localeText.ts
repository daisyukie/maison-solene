import { defineType, defineField } from 'sanity'

export const localeText = defineType({
  name: 'localeText',
  title: 'Texto longo (PT/EN)',
  type: 'object',
  fields: [
    defineField({ name: 'pt', title: 'Português', type: 'text', rows: 3 }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 3 }),
  ],
  preview: {
    select: { title: 'pt' },
  },
})
