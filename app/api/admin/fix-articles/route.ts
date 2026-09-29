import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getArticleImage } from '@/app/lib/articleImages'

export const dynamic = 'force-dynamic'

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

  // Real site IDs from DB
  const { data: dbSites } = await db
    .from('news_sites')
    .select('id, slug, name, domain')
    .in('slug', JEWISH_SLUGS)

  if (!dbSites?.length) {
    return NextResponse.json({ error: 'No Jewish sites found in DB' })
  }

  const realIds = dbSites.map(s => s.id)

  // Find ALL articles from these sites in any status - last 24h
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: articles24h } = await db
    .from('news_articles')
    .select('id, title, status, news_site_id, published_at')
    .in('news_site_id', realIds)
    .gte('published_at', since24h)
    .order('published_at', { ascending: false })
    .limit(200)

  // Also find any articles with author_name = Solly Marks in last 24h
  // that might have wrong site_id (orphaned)
  const { data: allRecent } = await db
    .from('news_articles')
    .select('id, title, status, news_site_id, published_at, author_name')
    .eq('author_name', 'Solly Marks')
    .gte('published_at', since24h)
    .order('published_at', { ascending: false })
    .limit(200)

  const validIdSet = new Set(realIds)
  const orphaned = (allRecent || []).filter(a => !validIdSet.has(a.news_site_id))

  // Force publish all valid articles that aren't published
  const notPublished = (articles24h || []).filter(a => a.status !== 'published')
  let fixedStatus = 0
  for (const a of notPublished) {
    const { error } = await db.from('news_articles')
      .update({ status: 'published' })
      .eq('id', a.id)
    if (!error) fixedStatus++
  }

  // Re-assign orphaned articles round-robin to real sites
  let fixedOrphans = 0
  for (let i = 0; i < orphaned.length; i++) {
    const site = dbSites[i % dbSites.length]
    const { error } = await db.from('news_articles')
      .update({ news_site_id: site.id, status: 'published' })
      .eq('id', orphaned[i].id)
    if (!error) fixedOrphans++
  }

  // Final count per site
  const summary = []
  for (const s of dbSites) {
    const { count } = await db.from('news_articles')
      .select('id', { count: 'exact', head: true })
      .eq('news_site_id', s.id)
      .eq('status', 'published')
      .gte('published_at', since24h)

    const { data: titles } = await db.from('news_articles')
      .select('title, slug')
      .eq('news_site_id', s.id)
      .eq('status', 'published')
      .gte('published_at', since24h)
      .order('published_at', { ascending: false })
      .limit(5)

    summary.push({
      slug: s.slug,
      domain: s.domain,
      id: s.id,
      articles_today: count || 0,
      latest_titles: (titles || []).map(t => ({
        title: t.title?.slice(0, 70),
        url: `https://${s.domain}/article/${s.slug}/${t.slug}`
      }))
    })
  }

  // ── Fix broken images (source.unsplash.com is dead since 2022) ────────────
  const { data: brokenImgArticles } = await db
    .from('news_articles')
    .select('id, title, slug, category, cover_image_url')
    .in('news_site_id', realIds)
    .or('cover_image_url.like.%source.unsplash.com%,cover_image_url.is.null,cover_image_url.eq.')
    .limit(50)

  let fixedImages = 0
  const siteMap = Object.fromEntries(dbSites.map(s => [s.id, s.domain]))
  for (const a of brokenImgArticles || []) {
    try {
      // Find the site domain for this article (we need to look up its site)
      const { data: artSite } = await db.from('news_articles')
        .select('news_site_id').eq('id', a.id).single()
      const domain = artSite ? siteMap[artSite.news_site_id] || 'aliyatoday.com' : 'aliyatoday.com'
      const newImg = await getArticleImage(a.category || 'News', a.slug || a.id, domain, a.title || '')
      const { error } = await db.from('news_articles')
        .update({ cover_image_url: newImg })
        .eq('id', a.id)
      if (!error) fixedImages++
    } catch { /* skip */ }
  }

  return NextResponse.json({
    ok: true,
    orphaned_found: orphaned.length,
    orphaned_fixed: fixedOrphans,
    status_fixed: fixedStatus,
    images_fixed: fixedImages,
    sites: summary,
  })
}
