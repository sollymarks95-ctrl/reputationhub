import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string,string> = Object.fromEntries((keys||[]).map((k:any)=>[k.key_name,k.key_value]))
  const hk = km.HEYGEN_KEY

  // Fetch first page of avatars with longer timeout
  const r = await fetch('https://api.heygen.com/v2/avatars?limit=50', {
    headers: { 'X-Api-Key': hk },
    signal: AbortSignal.timeout(40000),
  })
  const d = await r.json()
  return NextResponse.json({ status: r.status, avatars: d?.data?.avatars || d?.data || d }, { headers: CORS })
}
