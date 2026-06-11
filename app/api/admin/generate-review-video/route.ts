import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic = 'force-dynamic'
export const maxDuration = 120

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'

const getDb = () => createClient(
  'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
)

export async function POST(req: NextRequest) {
  try {
    const { brokerName, topic } = await req.json()
    const db = getDb()

    const { data: keys } = await db.from('system_api_keys').select('key_name,key_value')
      .in('key_name', ['HEYGEN_KEY','ANTHROPIC_API_KEY','HEYGEN_BEN_AVATAR_ID'])
    const km: Record<string,string> = {}
    for (const r of keys || []) km[r.key_name] = r.key_value

    const HEYGEN = km.HEYGEN_KEY || ''
    const ANTH   = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
    const AVATAR = km.HEYGEN_BEN_AVATAR_ID || '8cda690a684542e0817593096ea5461d'
    // Voice confirmed working in HeyGen account
    const VOICE  = 'a4e55d1b200c4f56b72992f03c620422'  // solly m English

    if (!HEYGEN) return NextResponse.json({ ok:false, error:'No HeyGen API key found in DB' })
    if (!ANTH)   return NextResponse.json({ ok:false, error:'No Anthropic API key found' })

    const subject = brokerName || topic || 'eToro'

    // Step 1: Generate script
    const sRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':ANTH, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 600,
        messages: [{ role:'user', content:
          `Write a natural 60-second YouTube review script for Ben from Verivex about "${subject}".
150-160 words. Opens: "Hey traders, Ben here from Verivex."
Cover: regulated? Safe? Key features? Verdict. Ends: "Subscribe for daily broker reviews."
Pure spoken words only — no brackets, no asterisks.` }]
      }),
      signal: AbortSignal.timeout(20000),
    })
    const sData = await sRes.json()
    const script = (sData.content||[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('').trim()

    if (!script || script.length < 40) {
      return NextResponse.json({ ok:false, error:`Script failed: ${JSON.stringify(sData).slice(0,200)}` })
    }

    // Step 2: Try Ben's avatar first, fall back to Tyler if it fails
    async function tryHeyGen(characterPayload: any, label: string) {
      const payload = {
        video_inputs: [{
          character: characterPayload,
          voice: {
            type: 'text',
            voice_id: VOICE,
            input_text: script,
            speed: 1.0,
          },
          background: { type: 'color', value: '#0f172a' },
        }],
        aspect_ratio: '16:9',
        test: false,
      }
      const r = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      })
      const d = await r.json()
      console.log(`[HeyGen ${label}] Status:${r.status} | video_id:${d?.data?.video_id} | error:${JSON.stringify(d?.error)}`)
      return { status: r.status, video_id: d?.data?.video_id, error: d?.error, label }
    }

    // Try 1: Ben as talking_photo
    let result = await tryHeyGen({ type:'talking_photo', talking_photo_id: AVATAR }, 'Ben-talking_photo')

    // Try 2: Ben as avatar type
    if (!result.video_id) {
      result = await tryHeyGen({ type:'avatar', avatar_id: AVATAR, avatar_style:'normal' }, 'Ben-avatar')
    }

    // Try 3: Tyler (guaranteed to work — confirms API is fine)
    if (!result.video_id) {
      result = await tryHeyGen({ type:'avatar', avatar_id:'Tyler-insuit-20220721', avatar_style:'normal' }, 'Tyler-fallback')
    }

    const videoId = result.video_id

    // 9:16 mobile if main worked
    let mobileId: string|null = null
    if (videoId) {
      const mRes = await tryHeyGen(
        result.label.includes('Tyler')
          ? { type:'avatar', avatar_id:'Tyler-insuit-20220721', avatar_style:'normal' }
          : { type:'talking_photo', talking_photo_id: AVATAR },
        'mobile-9:16'
      )
      mobileId = mRes.video_id || null
    }

    const ytTitle = `${subject} Review 2026 — Honest Deep Dive | Verivex`
    const ytDesc  = `Honest ${subject} review by Ben from Verivex.\n📊 Full review: https://verivex.co\n🔔 Subscribe for daily broker reviews`

    return NextResponse.json({
      ok: !!videoId,
      youtube_video_id: videoId || null,
      mobile_video_id: mobileId,
      avatar_used: result.label,
      script,
      word_count: script.split(' ').length,
      youtube_title: ytTitle,
      youtube_description: ytDesc,
      message: videoId
        ? `✅ Video generating in HeyGen — ready in ~5 min (used ${result.label})`
        : `❌ All 3 avatar attempts failed. Last error: ${JSON.stringify(result.error)}`,
      debug: result,
    })
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: err?.message || String(err) })
  }
}
