import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const SITE_ID = '35579979-ca5e-476f-bd75-9be5910fe29b'

const xe = (s: string) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const u  = (loc: string, freq: string, pri: string) =>
  `  <url>\n    <loc>${xe(loc)}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`

export async function GET() {
  const entries: string[] = [
    u('https://rephuby.com/', 'daily', '1.0'),
    u('https://rephuby.com/blog', 'daily', '0.9'),
    u('https://rephuby.com/insights', 'daily', '0.9'),
    u('https://rephuby.com/for/forex-brokers', 'weekly', '0.9'),
    u('https://rephuby.com/for/crypto-exchanges', 'weekly', '0.9'),
  ]

  // Add blog articles
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
    )
    const { data: articles } = await db
      .from('news_articles')
      .select('slug, published_at')
      .eq('news_site_id', SITE_ID)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)
    for (const a of articles || []) {
      if (a.slug) entries.push(u(`https://rephuby.com/blog/${a.slug}`, 'never', '0.9'))
    }
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
