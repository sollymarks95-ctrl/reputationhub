import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  const todayUTC = new Date(); todayUTC.setUTCHours(0,0,0,0)

  const { data: sites, error } = await db
    .from('news_sites')
    .select('id, slug, name, is_live, domain')
    .in('slug', JEWISH_SLUGS)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const report: any[] = []

  for (const site of sites || []) {
    const { count: todayCount } = await db
      .from('news_articles')
      .select('id', { count: 'exact', head: true })
      .eq('news_site_id', site.id)
      .eq('status', 'published')
      .gte('published_at', todayUTC.toISOString())

    const { count: totalCount } = await db
      .from('news_articles')
      .select('id', { count: 'exact', head: true })
      .eq('news_site_id', site.id)
      .eq('status', 'published')

    let fixed = false
    if (!site.is_live) {
      const { error: upErr } = await db
        .from('news_sites')
        .update({ is_live: true })
        .eq('slug', site.slug)
      fixed = !upErr
    }

    report.push({
      slug: site.slug,
      name: site.name,
      domain: site.domain,
      was_live: site.is_live,
      now_live: site.is_live || fixed,
      fixed_live: fixed,
      articles_today: todayCount || 0,
      articles_total: totalCount || 0,
    })
  }

  let triggerResult = null
  if (searchParams.get('trigger') === '1') {
    const BASE = 'https://rephuby.com'
    const secret = process.env.CRON_SECRET || ''
    const results = await Promise.allSettled(
      JEWISH_SLUGS.map(slug =>
        fetch(`${BASE}/api/cron-site?site=${slug}&batch=0&secret=${encodeURIComponent(secret)}`, {
          signal: AbortSignal.timeout(120000),
        }).then(r => r.json()).catch((e: Error) => ({ error: e.message }))
      )
    )
    triggerResult = JEWISH_SLUGS.map((slug, i) => ({
      slug,
      result: results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value : { error: (results[i] as PromiseRejectedResult).reason?.message }
    }))
  }

  return NextResponse.json({
    ok: true,
    sites: report,
    trigger: triggerResult,
    next_steps: triggerResult
      ? 'Generation triggered. Check the sites in ~2 minutes.'
      : 'Add ?trigger=1 to this URL to also generate articles immediately.',
  })
}
