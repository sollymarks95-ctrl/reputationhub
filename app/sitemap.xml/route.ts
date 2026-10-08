import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'
export const maxDuration = 60

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const REPHUBY_ID = '35579979-ca5e-476f-bd75-9be5910fe29b'

const xe = (s: string) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

/** Standard sitemap <url> entry */
function u(loc: string, freq: string, pri: string, lm?: string) {
  return `  <url>
    <loc>${xe(loc)}</loc>${lm ? `\n    <lastmod>${lm}</lastmod>` : ''}
    <changefreq>${freq}</changefreq>
    <priority>${pri}</priority>
  </url>`
}

/**
 * Google News sitemap entry — gets new articles indexed within minutes.
 * Only valid for articles published within the last 2 days.
 */
function newsEntry(
  loc: string,
  title: string,
  pubIso: string,
  pubName: string,
  category: string,
  tags: string[] = []
) {
  const d = new Date(pubIso)
  const iso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  const lm  = iso.split('T')[0]
  const kw  = [category, ...tags].filter(Boolean).slice(0, 10).join(', ')
  return `  <url>
    <loc>${xe(loc)}</loc>
    <lastmod>${lm}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.9</priority>
    <news:news>
      <news:publication>
        <news:name>${xe(pubName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${iso}</news:publication_date>
      <news:title>${xe(title)}</news:title>
      <news:keywords>${xe(kw)}</news:keywords>
    </news:news>
  </url>`
}

const HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
}

const JEWISH_SITES: Record<string, { name: string; slug: string }> = {
  'aliyatoday.com':           { name: 'Aliya Today', slug: 'aliya-today' },
  'jewishnewsnow.com':        { name: 'Jewish News Now', slug: 'jewish-news-now' },
  'jewishpropertyreport.com': { name: 'Jewish Property Report', slug: 'jewish-property-report' },
}

export async function GET(req: NextRequest) {
  // x-site-slug is set by middleware (more reliable than x-forwarded-host on Vercel)
  const siteSlug = req.headers.get('x-site-slug') || ''
  // derive host from x-forwarded-host, falling back to x-site-slug reverse-lookup
  const rawHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  const host  = rawHost.replace(/^www\./, '').replace(/:\d+$/, '')
    || Object.entries(JEWISH_SITES).find(([,v]) => v.slug === siteSlug)?.[0]
    || ''
  const base  = `https://${host}`
  const today = new Date().toISOString().split('T')[0]
  const nowMs = Date.now()
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

  const db    = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
  )
  const empty = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`

  try {
    // ── rephuby.com ──────────────────────────────────────────────────────────
    if (host === 'rephuby.com') {
      const entries = [
        u(`${base}/`,                     'daily',  '1.0', today),
        u(`${base}/blog`,                 'daily',  '0.9', today),
        u(`${base}/insights`,             'daily',  '0.9', today),
        u(`${base}/for/forex-brokers`,    'weekly', '0.9'),
        u(`${base}/for/crypto-exchanges`, 'weekly', '0.9'),
      ]
      const { data: arts } = await db.from('news_articles')
        .select('slug,published_at').eq('news_site_id', REPHUBY_ID)
        .eq('status','published').order('published_at',{ascending:false}).limit(500)
      for (const a of arts || []) {
        if (a.slug) entries.push(u(
          `${base}/blog/${a.slug}`, 'never', '0.8',
          new Date(a.published_at).toISOString().split('T')[0]
        ))
      }
      const xml = xmlDoc(entries)
      return new NextResponse(xml, { status: 200, headers: HEADERS })
    }

    // ── Jewish portals ───────────────────────────────────────────────────────
    const jewishCfg = JEWISH_SITES[host] || Object.values(JEWISH_SITES).find(v => v.slug === siteSlug) || null
    if (jewishCfg) {
      // Look up by slug first (more reliable than domain — domain format in DB may vary)
      // Fall back to domain lookup for safety
      const { data: site } = siteSlug
        ? await db.from('news_sites').select('id,slug').eq('slug', siteSlug).single()
        : await db.from('news_sites').select('id,slug').eq('domain', host).single()

      const entries: string[] = [
        u(`${base}/`, 'daily', '1.0', today),
        u(`${base}/author/solly-marks`, 'monthly', '0.8', today),
        u(`${base}/about`, 'monthly', '0.7'),
        u(`${base}/archive`, 'daily', '0.8', today),
        u(`${base}/legal/privacy`, 'yearly', '0.4'),
        u(`${base}/legal/terms`, 'yearly', '0.4'),
        u(`${base}/legal/disclaimer`, 'yearly', '0.4'),
      ]

      if (site) {
        const { data: arts } = await db.from('news_articles')
          .select('slug,title,published_at,updated_at,category,tags')
          .eq('news_site_id', site.id)
          .eq('status','published')
          .order('published_at', { ascending: false })
          .limit(5000)

        const cats = new Set<string>()

        for (const a of arts || []) {
          if (!a.slug) continue
          const loc = `${base}/article/${site.slug}/${a.slug}`
          const pubMs = new Date(a.published_at || today).getTime()
          const isRecent = (nowMs - pubMs) < TWO_DAYS_MS

          if (isRecent) {
            // Google News extension — crawled within minutes
            entries.push(newsEntry(
              loc,
              a.title || '',
              a.published_at,
              jewishCfg.name,
              a.category || 'Israel',
              a.tags || []
            ))
          } else {
            entries.push(u(
              loc, 'never', '0.8',
              new Date(a.updated_at || a.published_at || today).toISOString().split('T')[0]
            ))
          }

          if (a.category) cats.add(a.category)
        }

        // Category hub pages — topical authority signals
        // Use hyphens (not %20) to match the category page URL filter
        for (const cat of cats) {
          const catSlug = cat.toLowerCase().replace(/\s+/g, '-')
          entries.push(u(
            `${base}/article/${site.slug}/category/${encodeURIComponent(catSlug)}`,
            'daily', '0.8', today
          ))
        }
      }

      const xml = xmlDoc(entries, true)
      return new NextResponse(xml, { status: 200, headers: HEADERS })
    }

    // ── All other portals (finvexx, nex-wire, etc.) ──────────────────────────
    const { data: site } = siteSlug
      ? await db.from('news_sites').select('id,slug,name,noindex').eq('slug', siteSlug).single()
      : await db.from('news_sites').select('id,slug,name,noindex').eq('domain', host).single()
    if (!site) return new NextResponse(empty, { status: 200, headers: HEADERS })

    // If this portal is marked noindex in the DB, return a minimal sitemap
    // (just the homepage) — article URLs are noindex so no point listing them
    if (site.noindex) {
      const xml = xmlDoc([u(`${base}/`, 'daily', '1.0', today)])
      return new NextResponse(xml, { status: 200, headers: HEADERS })
    }

    const { data: arts } = await db.from('news_articles')
      .select('slug,published_at,updated_at,category')
      .eq('news_site_id', site.id)
      .eq('status','published')
      .order('published_at', { ascending: false })
      .limit(5000)

    const entries: string[] = [u(`${base}/`, 'daily', '1.0', today)]
    const cats = new Set<string>()

    for (const a of arts || []) {
      if (!a.slug) continue
      entries.push(u(
        `${base}/article/${site.slug}/${a.slug}`, 'never', '0.8',
        new Date(a.updated_at || a.published_at || today).toISOString().split('T')[0]
      ))
      if (a.category) cats.add(a.category)
    }
    // Use hyphens (not %20) to match the category page URL filter
    for (const cat of cats) {
      const catSlug = cat.toLowerCase().replace(/\s+/g, '-')
      entries.push(u(
        `${base}/article/${site.slug}/category/${encodeURIComponent(catSlug)}`,
        'daily', '0.7', today
      ))
    }

    return new NextResponse(xmlDoc(entries), { status: 200, headers: HEADERS })

  } catch (err) {
    console.error('[sitemap] error:', err)
    return new NextResponse(empty, { status: 200, headers: HEADERS })
  }
}

function xmlDoc(entries: string[], includeNews = false) {
  const nsNews = includeNews
    ? '\n        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'
    : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${nsNews}
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`
}
