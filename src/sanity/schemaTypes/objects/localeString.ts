import { defineType, defineField } from 'sanity'

export const localeString = defineType({
  name: 'localeString',
  title: 'Texto (PT/EN)',
  type: 'object',
  fields: [
    defineField({ name: 'pt', title: 'Português', type: 'string' }),
    defineField({ name: 'en', title: 'English', type: 'string' }),
  ],
  preview: {
    select: { title: 'pt' },
  },
})
