import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 3600  // Cache 1 hour

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REDACTED_SUPABASE_ANON_KEY'
)

const DOMAIN_TO_SLUG: Record<string, { slug: string; base: string }> = {
  'nex-wire.com':   { slug: 'global-trade-wire', base: 'https://nex-wire.com' },
  'finvexx.com':    { slug: 'finance-terminal',  base: 'https://finvexx.com' },
  'bizplezx.com':   { slug: 'business-pulse',    base: 'https://bizplezx.com' },
  'rephuby.com':    { slug: '',                  base: 'https://rephuby.com' },
}

function xmlEscape(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function url(loc: string, lastmod: string, priority: string, freq: string) {
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

export async function GET(req: NextRequest) {
  const host = (req.headers.get('host') || 'rephuby.com').replace(/:\d+$/, '').replace(/^www\./, '')
  const cfg = DOMAIN_TO_SLUG[host]

  const today = new Date().toISOString().split('T')[0]

  let urls: string[] = []

  if (cfg?.slug) {
    // Custom domain — only show this domain's content
    const base = cfg.base
    const siteSlug = cfg.slug

    // Get site info
    const { data: site } = await sb
      .from('news_sites').select('id, updated_at').eq('slug', siteSlug).single()

    // Homepage
    urls.push(url(`${base}/`, today, '1.0', 'daily'))

    if (site) {
      // All published articles for this site
      const { data: articles } = await sb
        .from('news_articles')
        .select('slug, published_at, category')
        .eq('news_site_id', site.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1000)

      for (const a of articles || []) {
        const lastmod = (a.published_at || today).split('T')[0]
        urls.push(url(`${base}/article/${siteSlug}/${a.slug}`, lastmod, '0.8', 'never'))
      }
    }
  } else {
    // rephuby.com — portal index pages only (articles redirect to real domains)
    urls.push(url('https://rephuby.com/', today, '1.0', 'daily'))
    urls.push(url('https://rephuby.com/portal', today, '0.3', 'monthly'))
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
    },
  })
}
