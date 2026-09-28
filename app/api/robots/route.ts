import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Active domains only — 3 Jewish sites + RepHuby
const SITEMAPS: Record<string, string> = {
  'aliyatoday.com':           'https://aliyatoday.com/sitemap.xml',
  'jewishnewsnow.com':        'https://jewishnewsnow.com/sitemap.xml',
  'jewishpropertyreport.com': 'https://jewishpropertyreport.com/sitemap.xml',
  'rephuby.com':              'https://rephuby.com/sitemap.xml',
}

export async function GET(req: NextRequest) {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .replace(/:\d+$/, '').replace(/^www\./, '')

  const sitemap = SITEMAPS[host] || `https://${host}/sitemap.xml`

  // All 4 active sites are fully indexable — no noindex domains remain
  const content = `User-agent: *
Allow: /
Disallow: /portal/
Disallow: /api/
Disallow: /aliya-admin

# ── Google ──────────────────────────────────────────────
User-agent: Googlebot
Allow: /
Disallow: /portal/
Disallow: /api/
Disallow: /aliya-admin

User-agent: Googlebot-Image
Allow: /

# ── Google AI (SGE / AI Overviews) ──────────────────────
User-agent: Google-Extended
Allow: /

# ── OpenAI / ChatGPT ────────────────────────────────────
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

# ── Perplexity ───────────────────────────────────────────
User-agent: PerplexityBot
Allow: /

# ── Anthropic / Claude ───────────────────────────────────
User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

# ── Microsoft / Bing / Copilot ───────────────────────────
User-agent: Bingbot
Allow: /

User-agent: msnbot
Allow: /

# ── Apple ────────────────────────────────────────────────
User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

# ── Meta AI ──────────────────────────────────────────────
User-agent: FacebookBot
Allow: /

# ── Cohere / Command R ───────────────────────────────────
User-agent: cohere-ai
Allow: /

# ── Common AI research crawlers ──────────────────────────
User-agent: Diffbot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${sitemap}
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    }
  })
}
