import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Maison Solène — Casa de Massagem em Dublin',
  description:
    'Uma casa de massagem discreta em Dublin. Mãos quentes, luz baixa e uma hora que pertence inteiramente a você. Somente com hora marcada.',
}

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Tenor+Sans&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
