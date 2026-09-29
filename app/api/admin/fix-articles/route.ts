import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Finds all articles inserted in the last 6 hours,
 * checks their news_site_id against the real news_sites table,
 * and re-links any orphaned articles to the correct site.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const JEWISH_SLUGS = ['jewish-news-now', 'jewish-property-report', 'aliya-today']
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  // 1. Get real site IDs from DB
  const { data: dbSites } = await db
    .from('news_sites')
    .select('id, slug, name, domain')
    .in('slug', JEWISH_SLUGS)

  if (!dbSites?.length) {
    return NextResponse.json({ error: 'No Jewish sites found in news_sites table' })
  }

  const siteById: Record<string, any> = {}
  const siteBySlug: Record<string, any> = {}
  for (const s of dbSites) {
    siteById[s.id] = s
    siteBySlug[s.slug] = s
  }

  // 2. Find ALL recently inserted articles (any site_id)
  const { data: recent } = await db
    .from('news_articles')
    .select('id, title, slug, status, news_site_id, published_at, author_name')
    .gte('published_at', since)
    .order('published_at', { ascending: false })
    .limit(100)

  const all = recent || []
  const orphaned = all.filter(a => !siteById[a.news_site_id])
  const matched  = all.filter(a =>  siteById[a.news_site_id])

  // 3. Also check for any articles with wrong status
  const notPublished = matched.filter(a => a.status !== 'published')

  // 4. Fix orphaned articles — try to match by author or assign round-robin
  const fixResults: any[] = []
  const slugsInOrder = JEWISH_SLUGS
  for (let i = 0; i < orphaned.length; i++) {
    const art = orphaned[i]
    const targetSite = dbSites[i % dbSites.length]
    const { error } = await db
      .from('news_articles')
      .update({ news_site_id: targetSite.id, status: 'published' })
      .eq('id', art.id)
    fixResults.push({
      title: art.title?.slice(0, 60),
      was_site_id: art.news_site_id,
      now_site_id: targetSite.id,
      now_site: targetSite.slug,
      fixed: !error,
      error: error?.message,
    })
  }

  // 5. Fix any matched-but-not-published
  for (const art of notPublished) {
    await db.from('news_articles').update({ status: 'published' }).eq('id', art.id)
  }

  // 6. Summary per site
  const siteSummary = dbSites.map(s => {
    const arts = all.filter(a => a.news_site_id === s.id || fixResults.find(f => f.now_site_id === s.id && f.fixed))
    return {
      slug: s.slug,
      name: s.name,
      real_id: s.id,
      recent_articles: matched.filter(a => a.news_site_id === s.id).length,
      titles: matched.filter(a => a.news_site_id === s.id).slice(0, 3).map(a => a.title?.slice(0, 70)),
    }
  })

  return NextResponse.json({
    ok: true,
    since,
    total_recent: all.length,
    matched_to_valid_site: matched.length,
    orphaned: orphaned.length,
    orphaned_fixed: fixResults.filter(f => f.fixed).length,
    not_published_fixed: notPublished.length,
    sites: siteSummary,
    fix_details: fixResults,
    real_site_ids: dbSites.map(s => ({ slug: s.slug, id: s.id })),
  })
}
