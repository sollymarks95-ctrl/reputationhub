import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, site_slug, site_name, source } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const db = getDb()
    const ip_country = req.headers.get('x-vercel-ip-country') || null

    // Simple insert — no upsert complexity
    const { error } = await db.from('newsletter_subscribers').insert({
      email:       email.toLowerCase().trim(),
      site_slug:   site_slug || 'unknown',
      site_name:   site_name || site_slug || 'unknown',
      source:      source || 'footer',
      status:      'active',
      ip_country,
      subscribed_at: new Date().toISOString(),
    })

    if (error) {
      // Duplicate = already subscribed
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, message: 'Already subscribed!' })
      }
      console.error('[subscribe] DB error:', error.message, error.code)
      return NextResponse.json({ error: 'Could not save — ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Subscribed! Welcome.' })
  } catch(e: any) {
    console.error('[subscribe] Error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

// Admin read
export async function GET(req: NextRequest) {
  const site = req.nextUrl.searchParams.get('site')
  const db = getDb()

  let q = db.from('newsletter_subscribers')
    .select('id, email, site_slug, site_name, source, status, ip_country, subscribed_at')
    .eq('status', 'active')
    .order('subscribed_at', { ascending: false })
    .limit(1000)

  if (site) q = (q as any).eq('site_slug', site)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const bysite: Record<string, any[]> = {}
  for (const sub of (data || [])) {
    const k = sub.site_slug || 'unknown'
    if (!bysite[k]) bysite[k] = []
    bysite[k].push(sub)
  }

  return NextResponse.json({ total: (data||[]).length, by_site: bysite, subscribers: data || [] })
}
