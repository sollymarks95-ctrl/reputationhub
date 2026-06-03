import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const CLIENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [brandArticles, brandMentions, dofollowLinks, pageViews] = await Promise.all([
    // Brand articles (portal_content = articles explicitly created for eToro)
    db().from('portal_content')
      .select('portal_name, site_slug, title, article_url, published_at, status')
      .eq('client_id', CLIENT_ID)
      .order('published_at', { ascending: false })
      .limit(200),

    // Brand mentions: news_articles that mention eToro in body (last 30d)
    db().from('news_articles')
      .select('id, title, slug, published_at, news_site_id')
      .ilike('body', '%etoro%')
      .gte('published_at', since)
      .limit(500),

    // Dofollow links: articles with actual <a href> linking to etoro.com
    db().from('news_articles')
      .select('id, title, slug, published_at, news_site_id')
      .ilike('body', '%href%etoro.com%')
      .gte('published_at', since)
      .limit(500),

    // Page views (kept for analytics tab detail, not shown in overview)
    db().from('page_views')
      .select('site_slug, created_at, device')
      .gte('created_at', since),
  ])

  const ba = brandArticles.data || []
  const bm = brandMentions.data || []
  const dl = dofollowLinks.data || []
  const pv = pageViews.data || []

  // Portals that have brand articles
  const portalsWithContent = [...new Set(ba.map((a: any) => a.portal_name))].length

  // Brand mentions by portal (from news_articles mentioning eToro)
  const mentionsByPortal: Record<string, number> = {}
  bm.forEach((a: any) => {
    const siteId = a.news_site_id || 'unknown'
    mentionsByPortal[siteId] = (mentionsByPortal[siteId] || 0) + 1
  })

  // Daily brand mentions (for chart in analytics tab)
  const dailyMentions: Record<string, number> = {}
  bm.forEach((a: any) => {
    const day = a.published_at?.split('T')[0]
    if (day) dailyMentions[day] = (dailyMentions[day] || 0) + 1
  })

  // Page views breakdown for analytics tab (internal use)
  const dailyPageViews: Record<string, number> = {}
  pv.forEach((v: any) => {
    const day = v.created_at?.split('T')[0]
    if (day) dailyPageViews[day] = (dailyPageViews[day] || 0) + 1
  })

  return NextResponse.json({
    // === CLIENT-FACING BRAND METRICS (used in Overview KPIs) ===
    brandArticles: ba.length,              // articles explicitly created for eToro
    brandMentions: bm.length,             // total articles mentioning eToro (30d)
    dofollowLinks: dl.length,             // articles with <a href> to etoro.com (30d)
    portalsActive: portalsWithContent,    // portals covering eToro

    // === DETAILED DATA (used in Analytics tab) ===
    topArticles: ba.slice(0, 20).map((a: any) => ({
      title: a.title,
      url: a.article_url,
      portal: a.portal_name,
      date: a.published_at,
    })),
    dailyMentions: Object.entries(dailyMentions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),

    // === ADMIN-ONLY (page views — not shown in client Overview) ===
    totalPageViews: pv.length,
    dailyPageViews: Object.entries(dailyPageViews)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, views]) => ({ date, views })),
  })
}
