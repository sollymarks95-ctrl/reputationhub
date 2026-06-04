import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))
  const hk = km.HEYGEN_KEY

  const AUDIO = 'https://gykxxhxsakxhfuutgobb.supabase.co/storage/v1/object/public/podcasts/podcast-1780496051429.mp3'
  const BG = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&q=80&fm=jpg'

  // Check remaining credits first
  const credits = await fetch('https://api.heygen.com/v2/user/remaining_quota', {
    headers: { 'X-Api-Key': hk },
    signal: AbortSignal.timeout(8000),
  }).then(r => r.json()).catch((e) => ({ error: e.message }))

  // Try submitting Tyler normal
  const r = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': hk },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: 'avatar', avatar_id: 'Tyler-insuit-20220721', avatar_style: 'normal' },
        voice: { type: 'audio', audio_url: AUDIO },
        background: { type: 'image', url: BG },
      }],
      dimension: { width: 720, height: 1280 },
      caption: false,
    }),
    signal: AbortSignal.timeout(30000),
  })
  const submitResult = await r.json().catch(() => ({ parse_error: true }))

  return NextResponse.json({
    key_prefix: hk?.slice(0, 8) + '...',
    credits,
    submit_status: r.status,
    submit_result: submitResult,
  }, { headers: CORS })
}
