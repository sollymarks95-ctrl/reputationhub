import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic  = 'force-dynamic'
export const runtime  = 'nodejs'

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

const xe = (s:string) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const ue = (loc:string,freq:string,pri:string,lastmod?:string) =>
  `  <url>\n    <loc>${xe(loc)}</loc>${lastmod?`\n    <lastmod>${lastmod}</lastmod>`:''}\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`

export async function GET(req: NextRequest) {
  const host = (req.headers.get('host')||'').replace(/^www\./,'').split(':')[0]
  const base = `https://${host}`
  const today = new Date().toISOString().split('T')[0]
  const hdrs  = { 'Content-Type':'application/xml; charset=utf-8', 'Cache-Control':'public, s-maxage=3600, stale-while-revalidate=86400' }

  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||ANON)
    const { data: site } = await db.from('news_sites').select('id,slug,noindex').eq('domain',host).single()

    if (!site || site.noindex) {
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,{status:200,headers:hdrs})
    }

    const { data: articles } = await db.from('news_articles')
      .select('slug,published_at').eq('news_site_id',site.id).eq('status','published')
      .order('published_at',{ascending:false}).limit(5000)

    const entries = [ue(`${base}/`,'daily','1.0',today)]
    for (const a of articles||[]) {
      if (!a.slug) continue
      const lm = a.published_at ? new Date(a.published_at).toISOString().split('T')[0] : today
      entries.push(ue(`${base}/article/${site.slug}/${a.slug}`,'never','0.8',lm))
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`
    return new NextResponse(xml,{status:200,headers:hdrs})

  } catch {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url></urlset>`,{status:200,headers:hdrs})
  }
}
