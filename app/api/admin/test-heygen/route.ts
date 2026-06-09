import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'

export async function GET() {
  const db = createClient('https://gykxxhxsakxhfuutgobb.supabase.co', ANON)
  const { data } = await db.from('system_api_keys').select('key_value').eq('key_name','HEYGEN_KEY').single()
  const key = data?.key_value || ''

  // Check remaining credits — fastest API call
  const r = await fetch('https://api.heygen.com/v2/user/remaining_quota', {
    headers: { 'X-Api-Key': key },
    signal: AbortSignal.timeout(8000)
  })
  const d = await r.json()

  return NextResponse.json({
    http_status: r.status,
    key_preview: key.slice(0,20)+'...',
    heygen_response: d,
    credits_ok: r.status === 200,
    error: d?.message || d?.error || null
  })
}
