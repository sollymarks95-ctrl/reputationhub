import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export const maxDuration = 55
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string,string> = Object.fromEntries((keys||[]).map((k:any)=>[k.key_name,k.key_value]))
  const hk = km.HEYGEN_KEY

  // Try v1 endpoint — lighter than v2
  const r = await fetch('https://api.heygen.com/v1/avatar.list', {
    headers: { 'X-Api-Key': hk },
    signal: AbortSignal.timeout(30000),
  })
  const text = await r.text()
  let data: any = {}
  try { data = JSON.parse(text) } catch {}
  
  const avatars = data?.data?.avatars || data?.data?.talking_photo || data?.data || []
  return NextResponse.json({ 
    status: r.status, 
    count: Array.isArray(avatars) ? avatars.length : 0,
    sample: Array.isArray(avatars) ? avatars.slice(0, 20) : avatars,
    raw_keys: data?.data ? Object.keys(data.data) : [],
  }, { headers: CORS })
}
