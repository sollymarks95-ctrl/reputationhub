export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const JEWISH_SITES = [
  { slug: 'jewish-news-now',        name: 'Jewish News Now',        domain: 'jewishnewsnow.com',        color: '#1a56b0', icon: '📰' },
  { slug: 'jewish-property-report', name: 'Jewish Property Report', domain: 'jewishpropertyreport.com', color: '#0a7c4e', icon: '🏠' },
  { slug: 'aliya-today',            name: 'Aliya Today',            domain: 'aliyatoday.com',           color: '#c47d1a', icon: '✈️' },
]

export async function GET() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const siteStats = []
  let totalArticles = 0
  let totalToday = 0
  let totalSubscribers = 0

  for (const site of JEWISH_SITES) {
    const { data: siteRow } = await sb.from('news_sites').select('id').eq('slug', site.slug).single()
    if (!siteRow) continue

    const { count: artCount } = await sb
      .from('news_articles').select('*', { count: 'exact', head: true })
      .eq('news_site_id', siteRow.id).eq('status', 'published')

    const { count: todayCount } = await sb
      .from('news_articles').select('*', { count: 'exact', head: true })
      .eq('news_site_id', siteRow.id).eq('status', 'published')
      .gte('published_at', todayISO)

    const { count: subCount } = await sb
      .from('newsletter_subscribers').select('*', { count: 'exact', head: true })
      .eq('site_slug', site.slug)

    const { data: latestArticles } = await sb
      .from('news_articles')
      .select('slug, title, excerpt, published_at, category')
      .eq('news_site_id', siteRow.id).eq('status', 'published')
      .order('published_at', { ascending: false }).limit(5)

    totalArticles  += artCount  || 0
    totalToday     += todayCount || 0
    totalSubscribers += subCount || 0

    siteStats.push({
      ...site,
      articles:       artCount  || 0,
      todayArticles:  todayCount || 0,
      subscribers:    subCount  || 0,
      latest:         latestArticles || [],
    })
  }

  const { data: recentSubs } = await sb
    .from('newsletter_subscribers')
    .select('email, site_slug, subscribed_at')
    .in('site_slug', JEWISH_SITES.map(s => s.slug))
    .order('subscribed_at', { ascending: false }).limit(10)

  return NextResponse.json({
    totals: { articles: totalArticles, today: totalToday, subscribers: totalSubscribers },
    sites: siteStats,
    recentSubscribers: recentSubs || [],
  })
}
