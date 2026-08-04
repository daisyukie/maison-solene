import { defineType, defineField } from 'sanity'

export const faqItem = defineType({
  name: 'faqItem',
  title: 'Pergunta frequente',
  type: 'object',
  fields: [
    defineField({ name: 'question', title: 'Pergunta', type: 'localeString' }),
    defineField({ name: 'answer', title: 'Resposta', type: 'localeText' }),
  ],
  preview: {
    select: { title: 'question.pt' },
  },
})
