import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DOMAIN_MAP: Record<string,string> = {
  'global-trade-wire':'https://nex-wire.com','finance-terminal':'https://finvexx.com',
  'business-pulse':'https://bizplezx.com','gold-markets-today':'https://aurexhq.com',
  'trust-score':'https://verivex.co','invest-data':'https://invexhuby.com',
  'market-radar':'https://signalixx.com','executive-network':'https://execvex.com',
  'crypto-hub':'https://cryptoxos.com','fx-vexx':'https://fxvexx.com',
  'trade-hub-iq':'https://tradehubiq.com','aliya-today':'https://aliyatoday.com',
  'jewish-news-now':'https://jewishnewsnow.com','jewish-property-report':'https://jewishpropertyreport.com',
  'rephuby-intelligence':'https://rephuby.com',
}

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') || req.headers.get('authorization')?.replace('Bearer ','')
  if (secret !== (process.env.CRON_SECRET||'')) return NextResponse.json({ error:'Unauthorized' },{ status:401 })

  const { data: articles } = await db
    .from('news_articles')
    .select('slug, news_site_id, news_sites!inner(slug)')
    .eq('status','published')
    .gte('published_at', new Date(Date.now() - 25*60*60*1000).toISOString())
    .order('published_at', { ascending: false })
    .limit(100)

  const urls: string[] = []
  for (const a of (articles||[])) {
    const site = (a as any).news_sites
    const base = DOMAIN_MAP[site?.slug]
    if (base) urls.push(`${base}/article/${site.slug}/${a.slug}`)
  }

  const results: Record<string,string> = {}

  // IndexNow — instant Bing + Yandex + Seznam
  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'nex-wire.com',
        key: process.env.INDEXNOW_KEY || 'rephuby2024',
        keyLocation: 'https://nex-wire.com/rephuby2024.txt',
        urlList: urls.slice(0,100)
      }),
      signal: AbortSignal.timeout(10000)
    })
    results.indexnow = `${r.status}`
  } catch { results.indexnow = 'error' }

  // Google sitemap pings — all 14 sites
  let googleOk = 0
  for (const base of Object.values(DOMAIN_MAP)) {
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(base+'/sitemap.xml')}`, { signal: AbortSignal.timeout(4000) })
      googleOk++
    } catch {}
  }
  results.google = `${googleOk} sitemaps pinged`

  // Bing sitemap pings
  let bingOk = 0
  for (const base of Object.values(DOMAIN_MAP)) {
    try {
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(base+'/sitemap.xml')}`, { signal: AbortSignal.timeout(4000) })
      bingOk++
    } catch {}
  }
  results.bing = `${bingOk} sitemaps pinged`

  return NextResponse.json({ ok: true, articles_pinged: urls.length, results })
}
