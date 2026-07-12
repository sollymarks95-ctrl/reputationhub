import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
  )
}

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const client = req.nextUrl.searchParams.get('client') || 'etoro'

  // textSearch uses the existing GIN index on search_vector (title+excerpt+body+
  // category+author_name) instead of ilike('body', ...), which was a full-table
  // scan of every article's HTML body and could blow past the anon role's 3s
  // statement_timeout. Never revert to ilike('body', ...) here.
  const [{ data, error }, { data: sites, error: sitesErr }] = await Promise.all([
    getDb()
      .from('news_articles')
      .select('id, title, excerpt, published_at, cover_image_url, slug, news_site_id, category')
      .textSearch('search_vector', client, { type: 'plain' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50),
    getDb().from('news_sites').select('id, slug, domain'),
  ])

  if (error) console.error('client/articles query error:', error.message)
  if (sitesErr) console.error('client/articles sites query error:', sitesErr.message)

  // Dynamic site lookup — covers ALL live portals, not a hardcoded 5-entry map
  // that silently produced broken /article/undefined/ URLs for the other 6.
  const siteById: Record<string, { slug: string; domain: string }> = {}
  ;(sites || []).forEach((s: any) => { siteById[s.id] = s })

  const articles = (data || []).map((a: any) => {
    const site = siteById[a.news_site_id]
    const portalSlug = site?.slug || ''
    const domain = site?.domain ? `https://${site.domain}` : 'https://rephuby.com'
    return { ...a, portal: portalSlug, url: `${domain}/article/${portalSlug}/${a.slug}` }
  })

  return NextResponse.json({ articles }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
