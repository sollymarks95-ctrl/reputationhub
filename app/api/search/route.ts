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

  // Substring match on title/excerpt/category, not full-text search.
  // Postgres websearch_to_tsquery requires complete words/stems — typing
  // "uk ali" (mid-word, e.g. while live-typing "UK Aliyah") matches nothing
  // under full-text search even though "UK Aliyah..." is an obvious match.
  // ILIKE %term% matches any substring at any point in the word, which is
  // what both live-as-you-type search and a normal "search this site" box
  // actually need.
  //
  // Title matches are fetched first and ranked above excerpt/category-only
  // matches — a search dropdown showing titles should surface articles
  // whose TITLE contains the term before ones that merely mention it in
  // passing in the excerpt.
  const cols = 'id, title, slug, excerpt, category, tags, cover_image_url, published_at, read_time_minutes, author_name, news_site_id'

  let titleQuery = getDb().from('news_articles')
    .select(cols)
    .eq('status', 'published')
    .ilike('title', `%${q}%`)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (site) titleQuery = titleQuery.eq('news_site_id', site.id)
  if (category) titleQuery = titleQuery.eq('category', category)
  const { data: titleMatches, error: titleError } = await titleQuery
  if (titleError) return NextResponse.json({ results: [], query: q, error: titleError.message })

  let results = titleMatches || []

  if (results.length < limit) {
    const haveIds = results.map(r => r.id)
    let restQuery = getDb().from('news_articles')
      .select(cols)
      .eq('status', 'published')
      .or(`excerpt.ilike.%${q}%,category.ilike.%${q}%`)
      .order('published_at', { ascending: false })
      .limit(limit - results.length)
    if (site) restQuery = restQuery.eq('news_site_id', site.id)
    if (category) restQuery = restQuery.eq('category', category)
    if (haveIds.length) restQuery = restQuery.not('id', 'in', `(${haveIds.join(',')})`)
    const { data: restMatches } = await restQuery
    results = results.concat(restMatches || [])
  }

  return NextResponse.json({ results, query: q })
}
