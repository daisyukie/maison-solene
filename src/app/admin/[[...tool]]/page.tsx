import StudioClient from '@/components/StudioClient'

export const dynamic = 'force-static'
export { metadata, viewport } from 'next-sanity/studio'

export default function AdminPage() {
  return <StudioClient />
}
