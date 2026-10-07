import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'rephub-cron-2025-secure') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = req.nextUrl.searchParams.get('slug') || 'aliya-today'

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  // Test 1: List all site slugs
  const { data: allSites, error: allErr } = await db
    .from('news_sites')
    .select('id, slug, name, status')
    .limit(20)

  // Test 2: Direct slug lookup
  const { data: site, error: siteErr } = await db
    .from('news_sites')
    .select('id, slug, name, status')
    .eq('slug', slug)
    .single()

  // Test 3: Count articles for this site if found
  let articleCount = null
  let articleErr = null
  if (site?.id) {
    const r = await db
      .from('news_articles')
      .select('id', { count: 'exact', head: true })
      .eq('news_site_id', site.id)
      .eq('status', 'published')
    articleCount = r.count
    articleErr = r.error?.message
  }

  return NextResponse.json({
    env: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (len:' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'MISSING',
    },
    allSites: allSites || null,
    allSitesError: allErr?.message || null,
    siteQuery: { slug, found: !!site, site: site || null, error: siteErr?.message || null },
    articles: { count: articleCount, error: articleErr },
  })
}
