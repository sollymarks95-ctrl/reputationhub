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
]

export async function GET(req: NextRequest) {
  const { data: rows } = await db.from('news_articles')
    .select('news_site_id, published_at, body')
    .gte('published_at', new Date(Date.now() - 7 * 86400000).toISOString())
    .eq('status', 'published')

  const { data: siteRows } = await db.from('news_sites')
    .select('id, slug')
    .in('slug', SITES.map(s => s.slug))

  const siteMap: Record<string, string> = {}
  for (const s of siteRows || []) siteMap[s.id] = s.slug

  const today = new Date().toISOString().split('T')[0]
  const stats: Record<string, { today: number; week: number; avgPerDay: number; lastBody: number }> = {}
  
  for (const s of SITES) stats[s.slug] = { today: 0, week: 0, avgPerDay: 0, lastBody: 0 }

  for (const r of rows || []) {
    const slug = siteMap[r.news_site_id]
    if (!slug || !stats[slug]) continue
    stats[slug].week++
    if (r.published_at.startsWith(today)) stats[slug].today++
    if (r.body?.length > stats[slug].lastBody) stats[slug].lastBody = r.body.length
  }

  for (const slug of Object.keys(stats)) {
    stats[slug].avgPerDay = Math.round(stats[slug].week / 7 * 10) / 10
  }

  const totalToday = Object.values(stats).reduce((s, x) => s + x.today, 0)
  const sitesOnTarget = Object.values(stats).filter(x => x.today >= TARGET_PER_DAY).length
  const sitesWithArticles = Object.values(stats).filter(x => x.today > 0).length

  const results = SITES.map(s => {
    const st = stats[s.slug]
    const status = st.today >= TARGET_PER_DAY ? '✅' : st.today >= 10 ? '🟡' : st.today > 0 ? '🔴' : '❌'
    return {
      domain: s.domain,
      type: s.type,
      today: st.today,
      avg7d: st.avgPerDay,
      target: TARGET_PER_DAY,
      status,
      avgWordCount: Math.round(st.lastBody / 5),
    }
  })

  return NextResponse.json({
    generated: new Date().toISOString(),
    summary: {
      totalToday,
      targetTotal: TARGET_PER_DAY * 14,
      pctOfTarget: Math.round(totalToday / (TARGET_PER_DAY * 14) * 100),
      sitesOnTarget,
      sitesWithArticles,
      totalSites: 14,
    },
    cronSchedule: ['01:00 UTC','07:00 UTC','13:00 UTC','18:00 UTC','22:00 UTC'],
    sites: results,
  })
}
