import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string,string> = Object.fromEntries((keys||[]).map((k:any)=>[k.key_name,k.key_value]))
  const hk = km.HEYGEN_KEY

  // Check credits
  const credits = await fetch('https://api.heygen.com/v2/user/remaining_quota', {
    headers: { 'X-Api-Key': hk }, signal: AbortSignal.timeout(10000),
  }).then(r=>r.json()).catch(e=>({ error: e.message }))

  // Poll one of our recent failed job IDs to see exact error
  const recentJobId = '22c1b4144ebe46d6ab04bb8a1c47b0ad' // Tyler from most recent user-triggered job
  const poll = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${recentJobId}`, {
    headers: { 'X-Api-Key': hk }, signal: AbortSignal.timeout(10000),
  }).then(r=>r.json()).catch(e=>({ error: e.message }))

  return NextResponse.json({ credits, recent_job_status: poll }, { headers: CORS })
}
