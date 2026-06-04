import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string,string> = Object.fromEntries((keys||[]).map((k:any)=>[k.key_name,k.key_value]))
  const hk = km.HEYGEN_KEY
  if (!hk) return NextResponse.json({ error: 'No HEYGEN_KEY' }, { status: 400, headers: CORS })

  const r = await fetch('https://api.heygen.com/v2/avatars', {
    headers: { 'X-Api-Key': hk },
    signal: AbortSignal.timeout(12000),
  })
  const d = await r.json().catch(() => ({}))
  const avatars = (d?.data?.avatars || []).map((a: any) => ({
    id:      a.avatar_id,
    name:    a.avatar_name,
    gender:  a.gender,
    preview: a.preview_image_url,
  }))
  return NextResponse.json({ total: avatars.length, avatars }, { headers: CORS })
}
