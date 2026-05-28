import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/portal/', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
    ],
    sitemap: [
      'https://nex-wire.com/sitemap.xml',
      'https://finvexx.com/sitemap.xml',
      'https://bizplezx.com/sitemap.xml',
    ],
  }
}
