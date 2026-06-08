import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { brokerName, topic } = body
    const db = getDb()

    // Get keys
    const { data: keys } = await db.from('system_api_keys').select('key_name,key_value')
      .in('key_name', ['HEYGEN_KEY','ANTHROPIC_API_KEY','HEYGEN_BEN_AVATAR_ID'])
    const km: Record<string,string> = {}
    for (const r of keys || []) km[r.key_name] = r.key_value

    const HEYGEN = km.HEYGEN_KEY || ''
    const ANTH   = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
    const AVATAR = km.HEYGEN_BEN_AVATAR_ID || '8cda690a684542e0817593096ea5461d'

    if (!HEYGEN) return NextResponse.json({ ok:false, error:'No HeyGen key found' })
    if (!ANTH)   return NextResponse.json({ ok:false, error:'No Anthropic key found' })

    const subject = brokerName || topic || 'forex broker regulation'

    // Generate script — fast with Haiku
    const sRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','x-api-key':ANTH,'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 600,
        messages: [{ role:'user', content:
          `Write a natural 60-second YouTube review script for Ben from Verivex about "${subject}".
150-170 words. Starts: "Hey traders, Ben here from Verivex."
Covers: is it regulated, safe to use, verdict. Ends: "Subscribe for daily broker reviews."
Pure spoken words only — no brackets, no asterisks, nothing else.` }]
      }),
      signal: AbortSignal.timeout(20000),
    })
    const sData = await sRes.json()
    const script = (sData.content||[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('').trim()

    if (!script || script.length < 40) {
      return NextResponse.json({ ok:false, error:`Script failed: ${JSON.stringify(sData).slice(0,200)}` })
    }

    // Try HeyGen — first with talking_photo (custom avatar), fallback to standard avatar
    async function tryHeyGen(characterPayload: any, ratio: string) {
      const payload = {
        video_inputs: [{
          character: characterPayload,
          voice: { type:'text', voice_id:'en-US-GuyNeural', speed:1.0 },
          background: { type:'color', value:'#0f172a' },
        }],
        input_text: script,
        aspect_ratio: ratio,
        test: false,
      }
      const r = await fetch('https://api.heygen.com/v2/video/generate', {
        method:'POST',
        headers: { 'X-Api-Key':HEYGEN, 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      })
      const d = await r.json()
      return d
    }

    // Try talking_photo first (Ben's personal avatar)
    let d16 = await tryHeyGen({ type:'talking_photo', talking_photo_id: AVATAR }, '16:9')
    console.log('[HeyGen talking_photo]', JSON.stringify(d16))

    // If talking_photo fails, try as regular avatar
    if (!d16?.data?.video_id) {
      d16 = await tryHeyGen({ type:'avatar', avatar_id: AVATAR, avatar_style:'normal' }, '16:9')
      console.log('[HeyGen avatar fallback]', JSON.stringify(d16))
    }

    // If still failing, try with a known working avatar (Tyler) to test the key
    if (!d16?.data?.video_id) {
      d16 = await tryHeyGen({ type:'avatar', avatar_id:'Tyler-insuit-20220721', avatar_style:'normal' }, '16:9')
      console.log('[HeyGen Tyler test]', JSON.stringify(d16))
    }

    const videoId = d16?.data?.video_id

    // Mobile 9:16
    let mobileId: string|null = null
    if (videoId) {
      const d9 = await tryHeyGen(
        { type:'talking_photo', talking_photo_id: AVATAR },
        '9:16'
      )
      mobileId = d9?.data?.video_id || null
    }

    return NextResponse.json({
      ok: !!videoId,
      youtube_video_id: videoId || null,
      mobile_video_id: mobileId,
      script,
      heygen_error: videoId ? null : (d16?.message || d16?.error || JSON.stringify(d16)),
      youtube_title: `${subject} Review 2026 — Is It Safe? | Verivex`,
      youtube_description: `Honest review by Ben from Verivex.\n📊 https://verivex.co\n🔔 Subscribe for daily broker reviews`,
      message: videoId ? `✅ Video generating in HeyGen — ready in ~5 min` : `❌ HeyGen error — see heygen_error`,
    })
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: err?.message || String(err) })
  }
}
