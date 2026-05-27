import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sites } = await supabase.from('news_sites').select('*').eq('is_live', true)
  if (!sites?.length) return NextResponse.json({ message: 'No live sites' })

  const results = []
  for (const site of sites) {
    try {
      const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
      const res = await fetch(`${base}/api/auto-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site.id,
          siteType: site.site_type || 'news',
          brandName: site.target_brand || '',
          newsQuery: site.niche || 'global business trade finance',
          categories: site.categories,
        })
      })
      const data = await res.json()
      results.push({ site: site.name, generated: data.generated || 0 })
    } catch (e: any) {
      results.push({ site: site.name, error: e.message })
    }
  }

  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), results })
}
