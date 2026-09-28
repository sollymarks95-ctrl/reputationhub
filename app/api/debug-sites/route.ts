import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
  )

  const host = (req.headers.get('host') || '').replace(/^www\./, '').split(':')[0]
  const siteParam = req.nextUrl.searchParams.get('_site') || ''

  // Check all 3 Jewish site slugs
  const slugs = ['aliya-today', 'jewish-news-now', 'jewish-property-report']
  const { data: bySlug, error: e1 } = await db
    .from('news_sites')
    .select('id,slug,domain,name')
    .in('slug', slugs)

  // Check by the incoming host
  const { data: byDomain, error: e2 } = await db
    .from('news_sites')
    .select('id,slug,domain,name')
    .eq('domain', host)
    .single()

  return NextResponse.json({
    host,
    siteParam,
    bySlug: bySlug || null,
    bySlugError: e1?.message || null,
    byDomain: byDomain || null,
    byDomainError: e2?.message || null,
    middleware_slug_via_header: req.headers.get('x-site-slug'),
    env_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  })
}
