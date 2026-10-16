export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Strips HTML tags and returns plain-text word count
function wordCount(html: string): number {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // dry=1 → audit only (default). dry=0 → actually set thin articles to draft.
  const dry = searchParams.get('dry') !== '0'
  // threshold param — articles below this word count are flagged (default 900)
  const threshold = parseInt(searchParams.get('threshold') || '900', 10)
  // site param — filter to one site slug (optional). Omit to audit ALL sites.
  const siteFilter = searchParams.get('site') || null

  let sitesQuery = db.from('news_sites').select('id, slug, name')
  if (siteFilter) sitesQuery = sitesQuery.eq('slug', siteFilter)

  const { data: sites } = await sitesQuery

  if (!sites?.length) return NextResponse.json({ error: 'No sites found' })

  const results: Record<string, { site: string; total: number; thin: number; thinArticles: { slug: string; words: number; title: string }[] }> = {}
  let totalThin = 0

  for (const site of sites) {
    // Fetch all published articles with their body
    const { data: articles } = await db
      .from('news_articles')
      .select('id, slug, title, body, published_at')
      .eq('news_site_id', site.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    const thin: { id: string; slug: string; words: number; title: string }[] = []
    for (const a of articles || []) {
      const wc = wordCount(a.body || '')
      if (wc < threshold) {
        thin.push({ id: a.id, slug: a.slug, words: wc, title: a.title || '' })
      }
    }

    results[site.slug] = {
      site: site.name,
      total: articles?.length || 0,
      thin: thin.length,
      thinArticles: thin.map(({ slug, words, title }) => ({ slug, words, title })),
    }

    totalThin += thin.length

    // If not dry-run → set thin articles to draft so Google stops crawling them
    if (!dry && thin.length > 0) {
      const ids = thin.map(a => a.id)
      await db
        .from('news_articles')
        .update({ status: 'draft' })
        .in('id', ids)
    }
  }

  return NextResponse.json({
    threshold,
    dry,
    action: dry ? 'audit only — pass dry=0 to depublish thin articles' : `depublished ${totalThin} thin articles`,
    totalThin,
    results,
  }, { status: 200 })
}
