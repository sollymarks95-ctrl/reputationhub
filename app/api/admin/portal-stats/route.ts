import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Get all sites
  const { data: sites } = await sb
    .from('news_sites')
    .select('id,name,slug,domain,noindex,is_live,is_active,template_config,primary_color')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (!sites?.length) return NextResponse.json({ portals: [] }, { headers: CORS })

  // Get article counts per site: total, today, this week
  const now = new Date()
  const dayAgo  = new Date(now.getTime() - 86400000).toISOString()
  const weekAgo = new Date(now.getTime() - 7*86400000).toISOString()

  const { data: articles } = await sb
    .from('news_articles')
    .select('news_site_id, published_at, title, slug, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // Build stats map
  const stats: Record<string, { total: number; today: number; week: number; latest_title: string | null; latest_date: string | null }> = {}
  for (const s of sites) stats[s.id] = { total: 0, today: 0, week: 0, latest_title: null, latest_date: null }

  for (const a of (articles || [])) {
    const stat = stats[a.news_site_id]
    if (!stat) continue
    stat.total++
    const pub = a.published_at || a.created_at
    if (pub >= dayAgo)  stat.today++
    if (pub >= weekAgo) stat.week++
    if (!stat.latest_title) { stat.latest_title = a.title; stat.latest_date = pub }
  }

  const portals = sites.map(s => ({
    id:           s.id,
    name:         s.name,
    slug:         s.slug,
    domain:       s.domain,
    is_live:      s.is_live,
    noindex:      s.noindex,
    primary_color: s.template_config?.primary || s.primary_color || '#6366f1',
    ...stats[s.id],
  }))

  return NextResponse.json({ portals }, { headers: CORS })
}
