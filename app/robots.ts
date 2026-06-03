import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

// Domain → sitemap mapping for all 5 indexed portals
const SITEMAP_MAP: Record<string, string> = {
  'nex-wire.com':   'https://nex-wire.com/sitemap.xml',
  'finvexx.com':    'https://finvexx.com/sitemap.xml',
  'bizplezx.com':   'https://bizplezx.com/sitemap.xml',
  'aurexhq.com':    'https://aurexhq.com/sitemap.xml',
  'verivex.co':     'https://verivex.co/sitemap.xml',
}

// Noindex portals — block all crawlers
const NOINDEX_DOMAINS = new Set([
  'invexhuby.com', 'signalixx.com', 'execvex.com', 'cryptoxos.com',
  'rephuby.com',
])

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]

  if (NOINDEX_DOMAINS.has(host)) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  const sitemapUrl = SITEMAP_MAP[host] || `https://${host}/sitemap.xml`

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/portal/'],
      },
      {
        // Block AI scrapers that don't respect content
        userAgent: ['GPTBot', 'Google-Extended', 'CCBot', 'anthropic-ai'],
        disallow: '/',
      },
    ],
    sitemap: sitemapUrl,
    host: `https://${host}`,
  }
}
