import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

const DOMAIN_MAP: Record<string, string> = {
  // Jewish portals
  'aliya-today':            'https://aliyatoday.com',
  'jewish-news-now':        'https://jewishnewsnow.com',
  'jewish-property-report': 'https://jewishpropertyreport.com',
  // Finance portals
  'global-trade-wire':      'https://nex-wire.com',
  'finance-terminal':       'https://finvexx.com',
  'business-pulse':         'https://bizplezx.com',
  'gold-markets-today':     'https://aurexhq.com',
  'trust-score':            'https://verivex.co',
  'invest-data':            'https://invexhuby.com',
  'market-radar':           'https://signalixx.com',
  'executive-network':      'https://execvex.com',
  'crypto-hub':             'https://cryptoxos.com',
}

const SITEMAPS = Object.values(DOMAIN_MAP).map(d => `${d}/sitemap.xml`)

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
    || req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== (process.env.CRON_SECRET || 'rephub-cron-2025-secure')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
  )

  // Collect ALL published article URLs across all 3 Jewish portals
  const urls: string[] = []
  const stats: Record<string, number> = {}

  for (const [slug, base] of Object.entries(DOMAIN_MAP)) {
    const { data: site } = await db
      .from('news_sites')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!site) { stats[slug] = 0; continue }

    const { data: arts } = await db
      .from('news_articles')
      .select('slug')
      .eq('news_site_id', site.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5000)

    for (const a of arts || []) {
      if (a.slug) urls.push(`${base}/article/${slug}/${a.slug}`)
    }
    stats[slug] = (arts || []).length

    // Include key static pages
    urls.push(base + '/')
    urls.push(base + '/author/solly-marks')
    urls.push(base + '/about')
  }

  const results: Record<string, unknown> = {
    article_count: stats,
    total_urls: urls.length,
  }

  // ── IndexNow — submit per-domain (host must match URLs in the batch) ────────
  const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'rephuby2024'
  let indexNowOk = 0

  for (const [slug, base] of Object.entries(DOMAIN_MAP)) {
    const domainHost = base.replace('https://', '')
    const domainUrls = urls.filter(u => u.startsWith(base))
    if (!domainUrls.length) continue

    // Submit in chunks of 100
    for (let i = 0; i < domainUrls.length; i += 100) {
      const chunk = domainUrls.slice(i, i + 100)
      try {
        const r = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: domainHost,
            key: INDEXNOW_KEY,
            keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
            urlList: chunk,
          }),
          signal: AbortSignal.timeout(15000),
        })
        if (r.ok || r.status === 202) indexNowOk += chunk.length
      } catch { /* continue on timeout */ }
    }
  }
  results.indexnow = `${indexNowOk}/${urls.length} URLs submitted to IndexNow`

  // ── Ping Google + Bing with sitemap URLs ─────────────────────────────────
  let googleOk = 0, bingOk = 0
  for (const sm of SITEMAPS) {
    try {
      const [g, b] = await Promise.allSettled([
        fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sm)}`, {
          signal: AbortSignal.timeout(8000),
        }),
        fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sm)}`, {
          signal: AbortSignal.timeout(8000),
        }),
      ])
      if (g.status === 'fulfilled') googleOk++
      if (b.status === 'fulfilled') bingOk++
    } catch { /* continue */ }
  }
  results.google_sitemaps = `${googleOk}/${SITEMAPS.length} pinged`
  results.bing_sitemaps   = `${bingOk}/${SITEMAPS.length} pinged`

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...results })
}
