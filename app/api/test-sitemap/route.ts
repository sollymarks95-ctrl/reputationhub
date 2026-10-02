export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

// Proxy-fetches /sitemap.xml for a given domain so you can test without GSC
// Usage: https://rephuby.com/api/test-sitemap?domain=jewishnewsnow.com
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'pass ?domain=jewishnewsnow.com' })

  try {
    const res = await fetch(`https://${domain}/sitemap.xml`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Googlebot test)' },
      signal: AbortSignal.timeout(30000),
    })
    const text = await res.text()
    return new NextResponse(JSON.stringify({
      status: res.status,
      contentType: res.headers.get('content-type'),
      length: text.length,
      preview: text.slice(0, 500),
      urlCount: (text.match(/<loc>/g) || []).length,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
