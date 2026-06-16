import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// ALL 321 sites are open to Google and AI engines — no DB check needed
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/portal/', '/admin/'],
      },
      // AI engine bots — explicit allow for AEO/GEO (Perplexity, ChatGPT, Gemini)
      { userAgent: 'GPTBot',            allow: '/' },
      { userAgent: 'Google-Extended',   allow: '/' },
      { userAgent: 'PerplexityBot',     allow: '/' },
      { userAgent: 'ClaudeBot',         allow: '/' },
      { userAgent: 'anthropic-ai',      allow: '/' },
      { userAgent: 'CCBot',             allow: '/' },
      { userAgent: 'Amazonbot',         allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'YouBot',            allow: '/' },
      { userAgent: 'Bytespider',        allow: '/' },
      { userAgent: 'Diffbot',           allow: '/' },
    ],
    sitemap: `https://${host}/sitemap.xml`,
    host:    `https://${host}`,
  }
}
