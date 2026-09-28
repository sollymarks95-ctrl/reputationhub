import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/admin/backfill
 * Fires multiple article batches in parallel to quickly populate all 3 Jewish sites.
 * Use after a Supabase pause/restore to catch up on missing articles.
 *
 * Body: { batches?: number }  — how many batches to fire per site (default 3)
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET || ''
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not set in Vercel env' }, { status: 500 })
  }

  const { batches = 3 } = await req.json().catch(() => ({}))
  const sites = ['jewish-news-now', 'jewish-property-report', 'aliya-today']
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://rephuby.com'

  const fired: string[] = []
  const errors: string[] = []

  // Fire all sites × all batches in parallel — fire-and-forget
  const calls = sites.flatMap(site =>
    Array.from({ length: batches }, (_, b) => ({ site, batch: b }))
  )

  await Promise.all(
    calls.map(async ({ site, batch }) => {
      const url = `${base}/api/cron-site?site=${site}&batch=${batch}&secret=${encodeURIComponent(secret)}`
      try {
        // Fire and forget — cron-site runs independently as its own function
        fetch(url, {
          headers: { Authorization: `Bearer ${secret}` },
          signal: AbortSignal.timeout(5000),
        }).catch(() => null)
        fired.push(`${site}:batch${batch}`)
      } catch (e: any) {
        errors.push(`${site}:batch${batch} — ${e.message}`)
      }
    })
  )

  const totalArticles = sites.length * batches * 5 // 5 articles per batch
  return NextResponse.json({
    ok: true,
    fired: fired.length,
    errors,
    estimatedArticles: totalArticles,
    note: `Fired ${fired.length} batch jobs. ~${totalArticles} articles generating across all 3 sites. Check sites in 5-10 min.`,
    jobs: fired,
  })
}
