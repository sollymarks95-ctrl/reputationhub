import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const PORTAL_DOMAINS: Record<string, string> = {
  'global-trade-wire': 'nex-wire.com',
  'finance-terminal': 'finvexx.com',
  'business-pulse': 'bizplezx.com',
  'gold-markets-today': 'aurexhq.com',
  'trust-score': 'verivex.co',
  'invest-data': 'invexhuby.com',
  'market-radar': 'signalixx.com',
  'executive-network': 'execvex.com',
  'crypto-hub': 'cryptoxos.com',
}

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [pageViews, articleViews, recentArticles] = await Promise.all([
    // Page views by site and day
    db().from('page_views')
      .select('site_slug, created_at, device, country, referrer')
      .gte('created_at', since),

    // Article views from news_articles (client brand articles)
    db().from('portal_content')
      .select('portal_name, article_title, article_url, published_at, news_articles(views, slug)')
      .eq('client_id', 'a1b2c3d4-0000-0000-0000-000000000001')
      .order('published_at', { ascending: false })
      .limit(200),

    // Recent articles
    db().from('portal_content')
      .select('portal_name, article_title, article_url, published_at')
      .eq('client_id', 'a1b2c3d4-0000-0000-0000-000000000001')
      .order('published_at', { ascending: false })
      .limit(10),
  ])

  const pv = pageViews.data || []
  const av = articleViews.data || []

  // Aggregate by day
  const dailyMap: Record<string, number> = {}
  pv.forEach((v: any) => {
    const day = v.created_at?.split('T')[0]
    if (day) dailyMap[day] = (dailyMap[day] || 0) + 1
  })

  // By portal
  const portalMap: Record<string, number> = {}
  pv.forEach((v: any) => {
    const s = v.site_slug || 'unknown'
    portalMap[s] = (portalMap[s] || 0) + 1
  })

  // Device split
  const deviceMap: Record<string, number> = {}
  pv.forEach((v: any) => { deviceMap[v.device || 'desktop'] = (deviceMap[v.device || 'desktop'] || 0) + 1 })

  // Country
  const countryMap: Record<string, number> = {}
  pv.forEach((v: any) => { countryMap[v.country || 'Unknown'] = (countryMap[v.country || 'Unknown'] || 0) + 1 })

  // Article views total
  const totalArticleViews = av.reduce((s: number, a: any) => s + (a.news_articles?.views || 0), 0)
  const topArticles = av
    .map((a: any) => ({ title: a.article_title, url: a.article_url, portal: a.portal_name, views: a.news_articles?.views || 0, date: a.published_at }))
    .sort((x: any, y: any) => y.views - x.views)
    .slice(0, 20)

  return NextResponse.json({
    totalPageViews: pv.length,
    totalArticleViews,
    topArticles,
    daily: Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, views]) => ({ date, views })),
    byPortal: Object.entries(portalMap).map(([slug, views]) => ({ slug, domain: PORTAL_DOMAINS[slug] || slug, views })).sort((a, b) => b.views - a.views),
    devices: deviceMap,
    countries: Object.entries(countryMap).sort(([,a],[,b]) => b-a).slice(0, 10).map(([country, views]) => ({ country, views })),
    recentArticles: recentArticles.data || [],
  })
}
