import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export const maxDuration = 55
const CORS = { 'Access-Control-Allow-Origin': '*' }

// Common HeyGen built-in avatar IDs to probe
const PROBE_IDS = [
  'Tyler-insuit-20220721',
  'Anna_public_3_20240108',
  'Thomas_public_2_20240108',  
  'Abigail-20230731',
  'Briana-20230712',
  'Joshua_public_expressive_20231025',
  'Eric_public_pro2_20230707',
  'Monica_public_pro2_20230707',
  'Susan-inblouse-20230123',
  'Daniel-insuit-20230328',
]

const AUDIO = 'https://gykxxhxsakxhfuutgobb.supabase.co/storage/v1/object/public/podcasts/podcast-1780496051429.mp3'
const BG    = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=640&q=60&fm=jpg'

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string,string> = Object.fromEntries((keys||[]).map((k:any)=>[k.key_name,k.key_value]))
  const hk = km.HEYGEN_KEY

  // Test each avatar ID by submitting a real job
  const results = await Promise.all(
    PROBE_IDS.map(async (avatarId) => {
      try {
        const r = await fetch('https://api.heygen.com/v2/video/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': hk },
          body: JSON.stringify({
            video_inputs: [{
              character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
              voice:     { type: 'audio', audio_url: AUDIO },
              background:{ type: 'image', url: BG },
            }],
            dimension: { width: 720, height: 1280 },
            caption: false,
          }),
          signal: AbortSignal.timeout(15000),
        })
        const d = await r.json().catch(() => ({}))
        const works = r.status === 200 && !!d?.data?.video_id
        return { avatarId, status: r.status, works, video_id: d?.data?.video_id || null, error: works ? null : JSON.stringify(d).slice(0,100) }
      } catch(e:any) {
        return { avatarId, status: 0, works: false, video_id: null, error: e.message }
      }
    })
  )

  const working = results.filter(r => r.works)
  return NextResponse.json({ working, all: results }, { headers: CORS })
}
