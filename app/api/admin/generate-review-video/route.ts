import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function callAnthropic(key: string, body: any, timeout = 45000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  })
  const d = await res.json()
  return (d.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim()
}

export async function POST(req: NextRequest) {
  const { avatarId, voiceId, brokerName, topic } = await req.json()
  const db = getDb()

  const { data: keys } = await db.from('system_api_keys').select('key_name, key_value')
    .in('key_name', ['HEYGEN_KEY', 'ANTHROPIC_API_KEY', 'HEYGEN_BEN_AVATAR_ID'])
  const km: Record<string, string> = {}
  for (const r of keys || []) km[r.key_name] = r.key_value

  const HEYGEN  = km.HEYGEN_KEY || ''
  const ANTH    = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  const AVATAR  = avatarId || km.HEYGEN_BEN_AVATAR_ID || '8cda690a684542e0817593096ea5461d'

  if (!HEYGEN || !ANTH) return NextResponse.json({ ok: false, error: 'Missing API keys in Supabase' })

  const subject = brokerName || topic || 'forex broker regulation'

  // Generate script directly — no web search for speed (< 15s)
  const script = await callAnthropic(ANTH, {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content:
      `Write a natural 90-second YouTube broker review script for Ben from Verivex reviewing "${subject}".

Rules:
- 200-230 words spoken naturally
- Open: "Hey traders, Ben here from Verivex."  
- Cover: is it regulated, which body, is it safe, key features, verdict
- Sound human: use "honestly", "look", contractions, genuine reactions
- End: "Subscribe for a new broker review every single day."
- ONLY spoken words — no stage directions, no brackets, nothing else
Return ONLY the script.` }]
  }, 25000)

  if (!script || script.length < 50) return NextResponse.json({ ok: false, error: 'Script generation failed' })

  // Submit to HeyGen — 16:9 YouTube
  const payload16 = {
    video_inputs: [{
      character: { type: 'avatar', avatar_id: AVATAR, avatar_style: 'normal' },
      voice: { type: 'text', voice_id: 'en-US-GuyNeural', speed: 1.0, pitch: 0 },
      background: { type: 'color', value: '#0f172a' },
    }],
    input_text: script,
    aspect_ratio: '16:9',
    test: false,
  }

  const r16 = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload16),
    signal: AbortSignal.timeout(15000),
  })
  const d16 = await r16.json()
  const videoId = d16?.data?.video_id

  // Submit 9:16 in background (don't await — keeps response fast)
  let mobileId: string | null = null
  if (videoId) {
    const r9 = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload16, aspect_ratio: '9:16',
        video_inputs: [{ ...payload16.video_inputs[0], character: { ...payload16.video_inputs[0].character, avatar_style: 'closeup' } }]
      }),
      signal: AbortSignal.timeout(10000),
    })
    const d9 = await r9.json()
    mobileId = d9?.data?.video_id || null
  }

  console.log('[HeyGen 16:9]', JSON.stringify(d16))

  if (!videoId) {
    return NextResponse.json({
      ok: false,
      error: d16?.message || d16?.error || 'HeyGen did not return a video_id — check API key or credits',
      heygen_raw: d16,
      script,
    })
  }

  const ytTitle = `${subject} Review ${new Date().getFullYear()} — Is It Safe? | Verivex`
  const ytDesc  = `Honest ${subject} review by Ben from Verivex.\n\n📊 Full review: https://verivex.co\n🔔 Subscribe for daily broker reviews\n\n#BrokerReview #Verivex #ForexBroker`

  return NextResponse.json({
    ok: true,
    youtube_video_id: videoId,
    mobile_video_id: mobileId,
    script,
    youtube_title: ytTitle,
    youtube_description: ytDesc,
    message: `✅ ${mobileId ? '2 videos' : '1 video'} generating in HeyGen — ready in ~5 minutes`,
  })
}
