import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteParam = searchParams.get('site')
  const JEWISH = ['jewish-news-now', 'jewish-property-report', 'aliya-today']
  const sites = siteParam ? [siteParam] : JEWISH
  const secret = process.env.CRON_SECRET!

  const results = []

  for (const slug of sites) {
    try {
      const url = `https://rephuby.com/api/cron-site?site=${slug}&batch=0&secret=${encodeURIComponent(secret)}`
      const r = await fetch(url, { signal: AbortSignal.timeout(290000) })
      const text = await r.text()
      let json: any
      try { json = JSON.parse(text) } catch { json = { raw: text.slice(0, 1000) } }
      results.push({ slug, status: r.status, result: json })
    } catch (e: any) {
      results.push({ slug, error: e.message })
    }
  }

  return NextResponse.json({ ok: true, ran: results })
}
