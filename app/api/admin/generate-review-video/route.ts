import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: NextRequest) {
  const { avatarId, voiceId, brokerName, topic } = await req.json()
  const db = getDb()

  const { data: keys } = await db.from('system_api_keys').select('key_name, key_value')
    .in('key_name', ['HEYGEN_KEY','ANTHROPIC_API_KEY','HEYGEN_BEN_AVATAR_ID','ELEVENLABS_BEN_VOICE_ID'])
  const km: Record<string,string> = {}
  for (const r of keys || []) km[r.key_name] = r.key_value

  const HEYGEN   = km.HEYGEN_KEY || ''
  const ANTHROPIC = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  const AVATAR   = avatarId  || km.HEYGEN_BEN_AVATAR_ID || '8cda690a684542e0817593096ea5461d'
  const VOICE    = voiceId   || km.ELEVENLABS_BEN_VOICE_ID || 'xMTIubkjc8KMDoYdz4bQ'

  if (!HEYGEN)    return NextResponse.json({ ok:false, error:'No HeyGen key' })
  if (!ANTHROPIC) return NextResponse.json({ ok:false, error:'No Anthropic key' })

  const subject = brokerName || topic || 'forex broker regulation 2026'

  // Step 1: Research + Script
  const scriptRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'x-api-key': ANTHROPIC,
      'anthropic-version':'2023-06-01',
      'anthropic-beta':'web-search-2025-03-05'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools: [{ type:'web_search_20250305', name:'web_search' }],
      messages: [{ role:'user', content:
        `Search for current facts about "${subject}" — regulation, licence numbers, spreads, deposit, warnings.

Write a natural 90-second YouTube broker review script for Ben from Verivex.
Rules:
- 200-230 words (90 seconds when spoken at normal pace)
- Opens: "Hey traders, Ben here from Verivex."
- References REAL specific facts found from web search
- Natural conversational tone — contractions, genuine reactions
- Covers: regulated or not, which body, key fees, verdict
- Closes: "Drop a comment with which broker to review next — and subscribe for daily broker intel."
- PURE SPOKEN WORDS ONLY — no brackets, no stage directions, no asterisks
Return ONLY the script text.`
      }]
    }),
    signal: AbortSignal.timeout(60000),
  })

  const sData = await scriptRes.json()
  const script = (sData.content||[])
    .filter((c:any) => c.type === 'text')
    .map((c:any) => c.text)
    .join('').trim()

  if (!script || script.length < 50) {
    return NextResponse.json({ ok:false, error:'Script generation failed', debug: sData })
  }

  // Step 2: Submit to HeyGen — simple single scene, proven format
  const heygenPayload = {
    video_inputs: [{
      character: {
        type: 'avatar',
        avatar_id: AVATAR,
        avatar_style: 'normal',
      },
      voice: {
        type: 'elevenlabs',
        voice_id: VOICE,
        speed: 1.0,
      },
      background: {
        type: 'color',
        value: '#0f172a',
      },
    }],
    input_text: script,
    aspect_ratio: '16:9',
    test: false,
  }

  console.log('[HeyGen] Submitting payload:', JSON.stringify({ avatar: AVATAR, voice: VOICE, scriptLen: script.length }))

  const heygenRes = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(heygenPayload),
  })

  const heygenData = await heygenRes.json()
  console.log('[HeyGen] Response:', JSON.stringify(heygenData))

  const videoId = heygenData?.data?.video_id

  // Step 3: Also generate 9:16 mobile version
  let mobileVideoId = null
  if (videoId) {
    const mobileRes = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...heygenPayload,
        aspect_ratio: '9:16',
        video_inputs: [{
          ...heygenPayload.video_inputs[0],
          character: { ...heygenPayload.video_inputs[0].character, avatar_style: 'closeup' },
        }],
      }),
    })
    const mobileData = await mobileRes.json()
    mobileVideoId = mobileData?.data?.video_id
    console.log('[HeyGen] Mobile:', JSON.stringify(mobileData))
  }

  const ytTitle = `${brokerName || subject} Review ${new Date().getFullYear()} — Is It Safe? | Verivex`
  const ytDesc  = `Honest review by Ben from Verivex.\n\n📊 Full review: https://verivex.co/reviews/${(brokerName||'').toLowerCase().replace(/\s+/g,'-')}\n🔔 Subscribe for daily broker reviews\n\n#BrokerReview #Verivex #${(brokerName||'').replace(/\s+/g,'')}`

  return NextResponse.json({
    ok: !!videoId,
    youtube_video_id: videoId,
    mobile_video_id: mobileVideoId,
    script,
    youtube_title: ytTitle,
    youtube_description: ytDesc,
    heygen_raw: heygenData,
    error: videoId ? null : (heygenData?.message || heygenData?.error || 'HeyGen did not return a video_id'),
    message: videoId
      ? `✅ ${mobileVideoId ? '2 videos' : '1 video'} processing in HeyGen — ready in ~5 min`
      : '❌ HeyGen rejected the request — see error',
  })
}
