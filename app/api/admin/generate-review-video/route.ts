import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: NextRequest) {
  const { avatarId, voiceId, topic, brokerName, hostName = 'Ben' } = await req.json()
  if (!avatarId || !voiceId) return NextResponse.json({ error: 'Missing avatarId or voiceId' })

  const db = getDb()
  const keys = await db.from('system_api_keys')
    .select('key_name, key_value')
    .in('key_name', ['HEYGEN_KEY','ANTHROPIC_API_KEY','ELEVENLABS_KEY'])

  const km: Record<string,string> = {}
  for (const r of keys.data || []) km[r.key_name] = r.key_value

  const HEYGEN = km.HEYGEN_KEY || ''
  const ANTHROPIC = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  if (!HEYGEN || !ANTHROPIC) return NextResponse.json({ error: 'Missing API keys' })

  // Step 1: Generate script with web search
  const scriptRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for current information about ${brokerName ? `${brokerName} broker regulation` : topic || 'forex broker regulation FCA ASIC CySEC 2026'} and write a 2-minute YouTube talking head review script.

The host is ${hostName}, speaking directly to camera for Verivex - an independent broker review platform.

Script format:
- Conversational, engaging YouTube style
- 250-300 words (about 2 minutes when spoken)
- Start with a hook: "Hey traders, I'm ${hostName} from Verivex..."
- Cover: what regulators found/said, what it means for traders, is this broker/topic safe
- End with: "Like and subscribe for daily broker intelligence"
- NO stage directions, NO [pause], NO brackets — pure spoken words only
- Reference specific real facts found from web search

Return ONLY the script text, nothing else.`
      }]
    }),
    signal: AbortSignal.timeout(60000),
  })

  const scriptData = await scriptRes.json()
  const script = (scriptData.content || [])
    .filter((c: any) => c.type === 'text')
    .map((c: any) => c.text)
    .join('')
    .trim()

  if (!script) return NextResponse.json({ error: 'Script generation failed' })

  // Step 2: Submit to HeyGen
  const videoRes = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: avatarId,
          avatar_style: 'normal',
        },
        voice: {
          type: 'elevenlabs',
          voice_id: voiceId,
          speed: 1.0,
        },
        background: {
          type: 'color',
          value: '#0f172a'
        }
      }],
      input_text: script,
      aspect_ratio: '16:9',
      test: false,
    })
  })

  const videoData = await videoRes.json()

  // Save to DB for tracking
  await db.from('system_api_keys').upsert({
    key_name: `VIDEO_JOB_${Date.now()}`,
    key_value: JSON.stringify({
      video_id: videoData.data?.video_id,
      topic: topic || brokerName,
      script: script.slice(0, 500),
      status: 'processing',
      created_at: new Date().toISOString()
    })
  })

  return NextResponse.json({
    ok: videoRes.ok,
    video_id: videoData.data?.video_id,
    script,
    status: videoData.data?.status || videoData.error,
    message: 'Video submitted to HeyGen — check status in 2-5 minutes'
  })
}
