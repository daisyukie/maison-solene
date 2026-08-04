import { client } from '@/sanity/lib/client'
import { SITE_CONTENT_QUERY } from '@/sanity/lib/queries'
import type { SiteContent } from '@/sanity/lib/types'
import SiteClient from '@/components/SiteClient'

// Content is edited rarely (via /admin) — a short revalidation window keeps
// pages fast while still picking up publishes without a redeploy.
export const revalidate = 60

export default async function HomePage() {
  const content = await client.fetch<SiteContent | null>(SITE_CONTENT_QUERY)

  if (!content) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0809',
          color: '#EDE6DD',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: 24,
        }}
      >
        Conteúdo ainda não foi publicado. Acesse /admin para preencher o site.
      </main>
    )
  }

  return <SiteClient content={content} />
}
