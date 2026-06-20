import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TARGET_PER_DAY = 30
const SITES = [
  { slug: 'global-trade-wire',      domain: 'nex-wire.com',              type: 'finance' },
  { slug: 'finance-terminal',       domain: 'finvexx.com',               type: 'finance' },
  { slug: 'trust-score',            domain: 'verivex.co',                type: 'finance' },
  { slug: 'gold-markets-today',     domain: 'aurexhq.com',               type: 'finance' },
  { slug: 'invest-data',            domain: 'invexhuby.com',             type: 'finance' },
  { slug: 'business-pulse',         domain: 'bizplezx.com',              type: 'finance' },
  { slug: 'market-radar',           domain: 'signalixx.com',             type: 'finance' },
  { slug: 'executive-network',      domain: 'execvex.com',               type: 'finance' },
  { slug: 'crypto-hub',             domain: 'cryptoxos.com',             type: 'finance' },
  { slug: 'fx-vexx',                domain: 'fxvexx.com',                type: 'finance' },
  { slug: 'trade-hub-iq',           domain: 'tradehubiq.com',            type: 'finance' },
  { slug: 'copy-trade-iq',       domain: 'copyvexx.com',      type: 'finance' },
  { slug: 'expat-invest-iq',     domain: 'expatinvestiq.com',    type: 'finance' },
  { slug: 'aliya-today',            domain: 'aliyatoday.com',            type: 'jewish' },
  { slug: 'jewish-news-now',        domain: 'jewishnewsnow.com',         type: 'jewish' },
  { slug: 'jewish-property-report', domain: 'jewishpropertyreport.com',  type: 'jewish' },
  { slug: 'rephuby-intelligence',   domain: 'rephuby.com',               type: 'rephuby' },
]

export async function GET(req: NextRequest) {
  // PREVIOUS BUG: this endpoint used to fetch all news_articles rows for the
  // last 7 days across all 17 sites (no .order(), no pagination) and count
  // client-side. Supabase/PostgREST caps unbounded selects at ~1000 rows, and
  // with 450+ articles/day network-wide that cap was hit well inside the 7-day
  // window — silently truncating to mostly-old rows and making "today" counts
  // wildly wrong (some sites showed near-zero despite genuinely publishing
  // 13-14+ articles that day, verified directly against the live site).
  //
  // Fixed by running one indexed COUNT query per site per window instead of
  // transferring and counting rows client-side — exact, and cheap at this
  // table size.
  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0)
  const weekStart = new Date(Date.now() - 7 * 86400000)

  const { data: siteRows } = await db.from('news_sites')
    .select('id, slug')
    .in('slug', SITES.map(s => s.slug))
  const idBySlug: Record<string, string> = {}
  for (const s of siteRows || []) idBySlug[s.slug] = s.id

  const results = await Promise.all(SITES.map(async (s) => {
    const siteId = idBySlug[s.slug]
    if (!siteId) return { domain: s.domain, type: s.type, today: 0, avg7d: 0, target: TARGET_PER_DAY, status: '❓', avgWordCount: 0, error: 'site not found in news_sites table' }

    const [{ count: today }, { count: week }, { data: latest }] = await Promise.all([
      db.from('news_articles').select('id', { count: 'exact', head: true })
        .eq('news_site_id', siteId).eq('status', 'published')
        .gte('published_at', todayStart.toISOString()),
      db.from('news_articles').select('id', { count: 'exact', head: true })
        .eq('news_site_id', siteId).eq('status', 'published')
        .gte('published_at', weekStart.toISOString()),
      db.from('news_articles').select('body')
        .eq('news_site_id', siteId).eq('status', 'published')
        .order('published_at', { ascending: false }).limit(1),
    ])

    const todayCount = today || 0
    const avgPerDay = Math.round((week || 0) / 7 * 10) / 10
    const status = todayCount >= TARGET_PER_DAY ? '✅' : todayCount >= 15 ? '🟡' : todayCount > 0 ? '🔴' : '❌'
    const lastBodyLen = latest?.[0]?.body?.length || 0

    return {
      domain: s.domain,
      type: s.type,
      today: todayCount,
      avg7d: avgPerDay,
      target: TARGET_PER_DAY,
      status,
      avgWordCount: Math.round(lastBodyLen / 5),
    }
  }))

  const totalToday = results.reduce((s, x) => s + (x.today || 0), 0)
  const sitesOnTarget = results.filter(x => (x.today || 0) >= TARGET_PER_DAY).length
  const sitesWithArticles = results.filter(x => (x.today || 0) > 0).length

  return NextResponse.json({
    generated: new Date().toISOString(),
    summary: {
      totalToday,
      targetTotal: TARGET_PER_DAY * SITES.length,
      pctOfTarget: Math.round(totalToday / (TARGET_PER_DAY * SITES.length) * 100),
      sitesOnTarget,
      sitesWithArticles,
      totalSites: SITES.length,
    },
    cronSchedule: ['01:00 UTC','07:00 UTC','13:00 UTC','18:00 UTC','22:00 UTC'],
    sites: results,
  })
}
