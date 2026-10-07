import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Triggers the article cron for a specific site or all sites.
// Usage: POST /api/admin/fire-articles?secret=...&slug=aliya-today
//        POST /api/admin/fire-articles?secret=...          (all sites)
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== (process.env.CRON_SECRET || 'rephub-cron-2025-secure')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = req.nextUrl.searchParams.get('slug') || ''
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rephuby.com'

  // Fire the main cron, optionally filtered to one site
  const cronUrl = slug
    ? `${baseUrl}/api/cron-site?secret=${process.env.CRON_SECRET || 'rephub-cron-2025-secure'}&site=${slug}`
    : `${baseUrl}/api/cron-site?secret=${process.env.CRON_SECRET || 'rephub-cron-2025-secure'}`

  try {
    // Fire and don't wait — cron takes minutes, return immediately
    fetch(cronUrl, { method: 'GET' }).catch(() => {})
    return NextResponse.json({
      ok: true,
      message: slug ? `Article generation started for ${slug}` : 'Article generation started for all sites',
      cronUrl,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
