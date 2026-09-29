import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const JEWISH_SLUGS = ['jewish-news-now', 'jewish-property-report', 'aliya-today']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const results: any[] = []

  for (const slug of JEWISH_SLUGS) {
    // Exact same query as page.tsx
    const { data: site, error: siteErr } = await db
      .from('news_sites')
      .select('*')
      .eq('slug', slug)
      .single()

    if (siteErr || !site) {
      results.push({ slug, error: `site lookup failed: ${siteErr?.message}` })
      continue
    }

    // Exact same articles query as page.tsx
    const { data: articles, error: artErr } = await db
      .from('news_articles')
      .select('id,title,slug,excerpt,category,author_name,published_at,read_time_minutes,cover_image_url')
      .eq('news_site_id', site.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(30)

    // Also check total in table regardless of status
    const { count: totalCount } = await db
      .from('news_articles')
      .select('id', { count: 'exact', head: true })
      .eq('news_site_id', site.id)

    // Check recent inserts (last 7 days, any status)
    const { data: recentAny } = await db
      .from('news_articles')
      .select('id,title,status,published_at')
      .eq('news_site_id', site.id)
      .gte('published_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(5)

    results.push({
      slug,
      site_id: site.id,
      site_is_live: site.is_live,
      site_domain: site.domain,
      articles_from_page_query: articles?.length ?? 0,
      article_query_error: artErr?.message ?? null,
      total_articles_in_db: totalCount,
      recent_articles_any_status: recentAny?.map(a => ({
        title: a.title?.slice(0, 50),
        status: a.status,
        published_at: a.published_at,
      })),
      first_article_title: articles?.[0]?.title ?? null,
    })
  }

  return NextResponse.json({ ok: true, checked_at: new Date().toISOString(), results })
}
