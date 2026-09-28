import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// All live portals — add new domains here as they go live
const PORTALS = [
  // Jewish network
  'https://aliyatoday.com/sitemap.xml',
  'https://jewishnewsnow.com/sitemap.xml',
  'https://jewishpropertyreport.com/sitemap.xml',
  // Finance network
  'https://nex-wire.com/sitemap.xml',
  'https://finvexx.com/sitemap.xml',
  'https://bizplezx.com/sitemap.xml',
  'https://aurexhq.com/sitemap.xml',
  'https://verivex.co/sitemap.xml',
  'https://invexhuby.com/sitemap.xml',
  'https://signalixx.com/sitemap.xml',
  'https://execvex.com/sitemap.xml',
  'https://cryptoxos.com/sitemap.xml',
]

export async function GET() {
  const now = new Date().toISOString()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PORTALS.map(loc => `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`).join('\n')}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
