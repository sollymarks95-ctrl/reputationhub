import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
  )
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const db = getDb()
  const { data: site, error: siteErr } = await db
    .from('news_sites').select('*').eq('slug', slug).single()

  if (siteErr || !site) {
    return NextResponse.json({ error: siteErr?.message || 'not found' }, { status: 404 })
  }

  const { data: articles } = await db
    .from('news_articles')
    .select('id,title,slug,excerpt,category,author_name,published_at,read_time_minutes,cover_image_url')
    .eq('news_site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30)

  return NextResponse.json({ site, articles: articles || [] }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  })
}
