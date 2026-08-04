import type { StructureResolver } from 'sanity/structure'

// Single-document site: skip the generic type list and go straight to the one
// "siteContent" document, editable as a singleton (no create/delete).
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Conteúdo')
    .items([
      S.listItem()
        .title('Site — Maison Solène')
        .id('siteContent')
        .child(
          S.document()
            .schemaType('siteContent')
            .documentId('siteContent')
        ),
    ])
