export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== (process.env.CRON_SECRET || 'rephub-cron-2025-secure')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
  )

  const SLUGS = ['aliya-today', 'jewish-news-now', 'jewish-property-report']
  const results: Record<string, any> = {}

  for (const slug of SLUGS) {
    const { data: before } = await db.from('news_sites')
      .select('id, slug, is_live, noindex, is_active')
      .eq('slug', slug).single()

    if (!before) { results[slug] = 'NOT FOUND in DB'; continue }

    const { error } = await db.from('news_sites')
      .update({ is_live: true, noindex: false, is_active: true })
      .eq('slug', slug)

    results[slug] = error
      ? `ERROR: ${error.message}`
      : `OK (was: is_live=${before.is_live}, noindex=${before.noindex})`
  }

  return NextResponse.json({ fixed: results })
}
