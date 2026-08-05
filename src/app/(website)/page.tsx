import { getSiteContent } from '@/lib/contentStore'
import SiteClient from '@/components/SiteClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const content = getSiteContent()
  return <SiteClient content={content} />
}
