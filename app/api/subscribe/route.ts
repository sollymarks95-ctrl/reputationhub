import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
)

export async function POST(req: NextRequest) {
  const { email, site_slug, site_name, source } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!site_slug) {
    return NextResponse.json({ error: 'Site required' }, { status: 400 })
  }

  const db = getDb()

  // Get site info if not provided
  let sName = site_name
  if (!sName) {
    const { data: site } = await db.from('news_sites').select('name').eq('slug', site_slug).single()
    sName = site?.name || site_slug
  }

  const ip_country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null

  const { error } = await db.from('newsletter_subscribers').upsert({
    email: email.toLowerCase().trim(),
    site_slug,
    site_name: sName,
    source: source || 'footer',
    status: 'active',
    ip_country,
    subscribed_at: new Date().toISOString(),
  }, { onConflict: 'email,site_slug', ignoreDuplicates: false })

  if (error) {
    // Duplicate = already subscribed
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, message: 'Already subscribed!' })
    }
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Subscribed! Welcome to the community.' })
}

// Admin: get subscribers
export async function GET(req: NextRequest) {
  const site = req.nextUrl.searchParams.get('site')
  const db = getDb()

  let q = db.from('newsletter_subscribers')
    .select('id, email, site_slug, site_name, source, status, ip_country, subscribed_at')
    .eq('status', 'active')
    .order('subscribed_at', { ascending: false })

  if (site) q = q.eq('site_slug', site)

  const { data, error } = await q.limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by site
  const bysite: Record<string, any[]> = {}
  for (const sub of data || []) {
    if (!bysite[sub.site_slug]) bysite[sub.site_slug] = []
    bysite[sub.site_slug].push(sub)
  }

  return NextResponse.json({
    total: (data || []).length,
    by_site: bysite,
    subscribers: data || []
  })
}
