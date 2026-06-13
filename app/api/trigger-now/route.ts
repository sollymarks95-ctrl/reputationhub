import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic  = 'force-dynamic'
export const maxDuration = 300

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const ADMIN = 'RepHuby2026!Secure'
const BASE  = 'https://rephuby.com'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('pass') !== ADMIN)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createClient(DBURL, ANON)
  const { data } = await db.from('system_api_keys').select('key_value').eq('key_name','CRON_SECRET').single()
  const secret = data?.key_value || process.env.CRON_SECRET || ''
  const batch  = parseInt(req.nextUrl.searchParams.get('batch') || '2')
  const sites  = ['jewish-news-now','jewish-property-report','aliya-today','rephuby-intelligence']
  const fired: string[] = []

  for (const site of sites) {
    const url = `${BASE}/api/cron-site?site=${site}&batch=${batch}&secret=${encodeURIComponent(secret)}`
    fetch(url, { headers:{ Authorization:`Bearer ${secret}` } }).catch(()=>null)
    fired.push(site)
    await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({ ok:true, fired, batch, note:'cron-site functions running independently — check DB in 3 mins' })
}
