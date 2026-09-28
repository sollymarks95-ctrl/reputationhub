import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Server-side trigger — reads CRON_SECRET from env (not exposed to client).
// Called by the admin dashboard "Generate Articles Now" button.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET || ''
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured in Vercel env' }, { status: 500 })
  }

  const { sites, batch = 0 } = await req.json().catch(() => ({}))
  const targetSites: string[] = sites || ['jewish-news-now', 'jewish-property-report', 'aliya-today']

  const base = 'https://rephuby.com'
  const results: Record<string, any> = {}

  // Fire all sites in parallel — cron-site runs independently per site
  await Promise.all(
    targetSites.map(async (site) => {
      try {
        const r = await fetch(
          `${base}/api/cron-site?site=${site}&batch=${batch}&secret=${encodeURIComponent(secret)}`,
          { headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(10000) }
        )
        results[site] = r.ok ? 'fired' : `HTTP ${r.status}`
      } catch (e: any) {
        results[site] = `error: ${e.message}`
      }
    })
  )

  return NextResponse.json({ ok: true, batch, results, note: 'Articles generating in background — check sites in 3-5 min' })
}
