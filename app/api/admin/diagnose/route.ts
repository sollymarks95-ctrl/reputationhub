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

  const SLUGS = ['jewish-news-now', 'jewish-property-report', 'aliya-today']
  const todayUTC = new Date(); todayUTC.setUTCHours(0,0,0,0)
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString()

  // 1. Site status
  const { data: sites } = await db
    .from('news_sites')
    .select('id,slug,name,is_live,domain')
    .in('slug', SLUGS)

  const siteStats = []
  for (const s of sites || []) {
    const { count: total } = await db.from('news_articles')
      .select('id',{count:'exact',head:true})
      .eq('news_site_id', s.id).eq('status','published')
    const { count: today } = await db.from('news_articles')
      .select('id',{count:'exact',head:true})
      .eq('news_site_id', s.id).eq('status','published')
      .gte('published_at', todayUTC.toISOString())
    const { count: week } = await db.from('news_articles')
      .select('id',{count:'exact',head:true})
      .eq('news_site_id', s.id).eq('status','published')
      .gte('published_at', weekAgo)
    const { data: latest } = await db.from('news_articles')
      .select('title,published_at,status')
      .eq('news_site_id', s.id)
      .order('published_at',{ascending:false}).limit(1)

    siteStats.push({
      slug: s.slug, name: s.name, is_live: s.is_live,
      articles_total: total||0, articles_today: today||0, articles_this_week: week||0,
      latest_article: latest?.[0] || null
    })
  }

  // 2. Check API keys in DB
  const { data: keys } = await db
    .from('system_api_keys')
    .select('key_name,key_value')
    .in('key_name', ['ANTHROPIC_API_KEY','SHOTSTACK_KEY'])

  const keyStatus: any = {}
  for (const k of keys||[]) {
    keyStatus[k.key_name] = k.key_value ? `set (${k.key_value.slice(0,12)}...)` : 'MISSING'
  }

  // 3. Env var check
  const envCheck = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? `set (${(process.env.ANTHROPIC_API_KEY||'').slice(0,12)}...)` : 'MISSING',
    CRON_SECRET: process.env.CRON_SECRET ? 'set' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
  }

  // 4. Check vercel cron config
  const { data: pendingArticles } = await db
    .from('news_articles')
    .select('id,title,status,published_at')
    .in('status', ['draft','pending'])
    .order('published_at',{ascending:false})
    .limit(5)

  return NextResponse.json({
    sites: siteStats,
    db_api_keys: keyStatus,
    env_vars: envCheck,
    pending_articles: pendingArticles||[],
    now_utc: new Date().toISOString(),
    daily_cap: 15,
  }, { status: 200 })
}
