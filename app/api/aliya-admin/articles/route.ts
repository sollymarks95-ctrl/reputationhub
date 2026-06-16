export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const JEWISH_SITES = [
  { slug: 'jewish-news-now',        name: 'Jewish News Now',        domain: 'jewishnewsnow.com',        color: '#1a56b0' },
  { slug: 'jewish-property-report', name: 'Jewish Property Report', domain: 'jewishpropertyreport.com', color: '#0a7c4e' },
  { slug: 'aliya-today',            name: 'Aliya Today',            domain: 'aliyatoday.com',           color: '#c47d1a' },
]

export async function GET(req: NextRequest) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA')
  const { searchParams } = new URL(req.url)
  const page     = parseInt(searchParams.get('page') || '1')
  const perPage  = 50
  const siteFilter = searchParams.get('site') || 'all'
  const from = (page - 1) * perPage

  const siteRows = await Promise.all(JEWISH_SITES.map(s => sb.from('news_sites').select('id,slug').eq('slug', s.slug).single()))
  const siteMap: Record<string,string> = {}
  siteRows.forEach(r => { if (r.data) siteMap[r.data.slug] = r.data.id })

  const targetIds = siteFilter !== 'all' && siteMap[siteFilter]
    ? [siteMap[siteFilter]]
    : Object.values(siteMap)

  const { data, count } = await sb
    .from('news_articles')
    .select('id, slug, title, category, author_name, published_at, news_site_id', { count: 'exact' })
    .eq('status', 'published')
    .in('news_site_id', targetIds)
    .order('published_at', { ascending: false })
    .range(from, from + perPage - 1)

  const idToSite: Record<string, typeof JEWISH_SITES[0]> = {}
  JEWISH_SITES.forEach(s => { if (siteMap[s.slug]) idToSite[siteMap[s.slug]] = s })

  const articles = (data || []).map(a => {
    const s = idToSite[a.news_site_id]
    return { ...a, siteSlug: s?.slug, siteName: s?.name, siteDomain: s?.domain, siteColor: s?.color,
      url: `https://${s?.domain}/article/${s?.slug}/${a.slug}` }
  })

  return NextResponse.json({ articles, total: count || 0, page, perPage, totalPages: Math.ceil((count||0)/perPage) })
}
