import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveSite } from '@/app/lib/sites'
function getDb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'') }


export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  const siteParam = req.nextUrl.searchParams.get('site') || ''
  const site = resolveSite(siteParam) // accepts either a slug ("aliya-today") or a raw news_site_id uuid
  const category = req.nextUrl.searchParams.get('category') || ''
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 50)

  if (q.length < 2) return NextResponse.json({ results: [], query: q })

  let query = getDb().from('news_articles')
    .select('id, title, slug, excerpt, category, tags, cover_image_url, published_at, read_time_minutes, author_name, news_site_id')
    .eq('status', 'published')
    .limit(limit)

  if (site) query = query.eq('news_site_id', site.id)
  if (category) query = query.eq('category', category)
  
  // Use full-text search
  query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })

  const { data, error } = await query.order('published_at', { ascending: false })
  if (error) {
    // Fallback to ilike if full-text fails
    let fallbackQuery = getDb().from('news_articles')
      .select('id, title, slug, excerpt, category, cover_image_url, published_at, read_time_minutes, author_name, news_site_id')
      .eq('status', 'published')
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .limit(limit)
    if (site) fallbackQuery = fallbackQuery.eq('news_site_id', site.id)
    const { data: fallback } = await fallbackQuery
    return NextResponse.json({ results: fallback || [], query: q })
  }
  return NextResponse.json({ results: data || [], query: q })
}
