import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sites } = await supabase.from('news_sites').select('*').eq('is_live', true)
  if (!sites?.length) return NextResponse.json({ message: 'No live sites' })

  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  const results = []

  for (const site of sites) {
    try {
      const res = await fetch(`${base}/api/seed-articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site.id,
          siteType: site.site_type || 'news',
          siteName: site.name,
          categories: site.categories || ['Business', 'Markets', 'Analysis'],
          targetCount: 15,
          daysBack: 1,
        })
      })
      const data = await res.json()
      results.push({ site: site.name, inserted: data.inserted || 0 })
    } catch (e: any) {
      results.push({ site: site.name, error: e.message })
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    total: results.reduce((a, r) => a + (r.inserted || 0), 0),
    results
  })
}
