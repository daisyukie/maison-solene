export type MediaUrlInfo =
  | { type: 'vimeo'; videoId: string; embedUrl: string }
  | { type: 'youtube'; videoId: string; embedUrl: string }
  | { type: 'video'; url: string }
  | { type: 'image'; url: string }
  | { type: 'none' }

export function parseMediaUrl(rawUrl?: string): MediaUrlInfo {
  if (!rawUrl || !rawUrl.trim()) return { type: 'none' }
  const url = rawUrl.trim()

  // 1. Vimeo match (e.g. https://vimeo.com/1215661617 or https://player.vimeo.com/video/1215661617)
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1]
    return {
      type: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&autopause=0&background=1&quality=1080p&title=0&byline=0&portrait=0`,
    }
  }

  // 2. YouTube match (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1]
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0`,
    }
  }

  // 3. Direct video file match
  if (
    /\.(mp4|webm|mov|mkv)($|\?)/i.test(url) ||
    url.includes('video') ||
    url.startsWith('data:video/') ||
    url.includes('blob.vercel-storage.com')
  ) {
    return { type: 'video', url }
  }

  // 4. Image or Data URL
  return { type: 'image', url }
}
