import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const hdrs = await headers()
  const host = (hdrs.get('host') || 'rephuby.com').replace(/:\d+$/, '').replace(/^www\./, '')

  const DOMAIN_SITEMAPS: Record<string, string> = {
    'nex-wire.com':  'https://nex-wire.com/sitemap.xml',
    'finvexx.com':   'https://finvexx.com/sitemap.xml',
    'bizplezx.com':  'https://bizplezx.com/sitemap.xml',
    'aurexhq.com':   'https://aurexhq.com/sitemap.xml',
    'verivex.co':    'https://verivex.co/sitemap.xml',
    'bizpedia.com':  'https://bizpedia.com/sitemap.xml',
    'presxwire.com': 'https://presxwire.com/sitemap.xml',
    'invexhub.com':  'https://invexhub.com/sitemap.xml',
    'tradvex.com':   'https://tradvex.com/sitemap.xml',
    'certivade.com': 'https://certivade.com/sitemap.xml',
    'execvex.com':   'https://execvex.com/sitemap.xml',
    'signalix.com':  'https://signalix.com/sitemap.xml',
  }

  const sitemap = DOMAIN_SITEMAPS[host]
    ? [DOMAIN_SITEMAPS[host]]
    : Object.values(DOMAIN_SITEMAPS)

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/faq/', '/article/', '/search'],
        disallow: ['/portal/', '/api/'],
      },
      // Explicitly allow all AI crawlers — critical for AI engine optimization
      { userAgent: 'GPTBot',        allow: '/' },
      { userAgent: 'Claude-Web',    allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Googlebot',     allow: '/' },
      { userAgent: 'Bingbot',       allow: '/' },
      { userAgent: 'anthropic-ai',  allow: '/' },
      { userAgent: 'CCBot',         allow: '/' },
    ],
    sitemap,
  }
}
