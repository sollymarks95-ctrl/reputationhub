import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const REPHUBY_ID = '35579979-ca5e-476f-bd75-9be5910fe29b'

const xe = (s: string) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const u  = (loc: string, freq: string, pri: string, lm?: string) =>
  `  <url>\n    <loc>${xe(loc)}</loc>${lm?`\n    <lastmod>${lm}</lastmod>`:''}\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`

const HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
}

export async function GET(req: NextRequest) {
  const host  = (req.headers.get('host') || '').replace(/^www\./, '').split(':')[0]
  const base  = `https://${host}`
  const today = new Date().toISOString().split('T')[0]
  const db    = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||ANON)
  const empty = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`

  try {
    // ── rephuby.com — blog URL format ───────────────────────────────────────
    if (host === 'rephuby.com') {
      const entries = [
        u(`${base}/`,                     'daily',  '1.0', today),
        u(`${base}/blog`,                 'daily',  '0.9', today),
        u(`${base}/insights`,             'daily',  '0.9', today),
        u(`${base}/for/forex-brokers`,    'weekly', '0.9'),
        u(`${base}/for/crypto-exchanges`, 'weekly', '0.9'),
      ]
      const { data: arts } = await db.from('news_articles')
        .select('slug,published_at').eq('news_site_id', REPHUBY_ID)
        .eq('status','published').order('published_at',{ascending:false}).limit(500)
      for (const a of arts||[]) {
        if (a.slug) entries.push(u(`${base}/blog/${a.slug}`, 'never', '0.9',
          new Date(a.published_at).toISOString().split('T')[0]))
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`
      return new NextResponse(xml, { status:200, headers:HEADERS })
    }

    // ── All other portals ────────────────────────────────────────────────────
    const { data: site } = await db.from('news_sites').select('id,slug,noindex').eq('domain',host).single()
    if (!site) return new NextResponse(empty, { status:200, headers:HEADERS })
    // ALL sites are now open to indexing — noindex flag ignored for sitemap

    const { data: arts } = await db.from('news_articles')
      .select('slug,published_at,category').eq('news_site_id',site.id)
      .eq('status','published').order('published_at',{ascending:false}).limit(5000)

    const isJewishSite = ['aliyatoday.com','jewishnewsnow.com','jewishpropertyreport.com'].includes(host)

    const entries = [u(`${base}/`, 'daily', '1.0', today)]

    // Author page — Jewish sites have named author (Solly Marks), helps E-E-A-T
    if (isJewishSite) {
      entries.push(u(`${base}/author/solly-marks`, 'monthly', '0.8', today))
    }

    // About page
    entries.push(u(`${base}/about`, 'monthly', '0.7'))

    // Category pages — topical hubs for SEO
    const cats = [...new Set((arts||[]).map((a: any) => a.category).filter(Boolean))]
    for (const cat of cats) {
      entries.push(u(`${base}/article/${site.slug}/category/${encodeURIComponent(String(cat).toLowerCase())}`, 'daily', '0.8', today))
    }
    for (const a of arts||[]) {
      if (!a.slug) continue
      entries.push(u(`${base}/article/${site.slug}/${a.slug}`, 'never', '0.8',
        new Date(a.published_at).toISOString().split('T')[0]))
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`
    return new NextResponse(xml, { status:200, headers:HEADERS })

  } catch {
    return new NextResponse(empty, { status:200, headers:HEADERS })
  }
}
