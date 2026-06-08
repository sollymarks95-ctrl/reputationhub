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
    const { brokerName, topic } = await req.json()
    const db = getDb()

    const { data: keys } = await db.from('system_api_keys').select('key_name,key_value')
      .in('key_name', ['HEYGEN_KEY','ANTHROPIC_API_KEY','HEYGEN_BEN_AVATAR_ID'])
    const km: Record<string,string> = {}
    for (const r of keys || []) km[r.key_name] = r.key_value

    const HEYGEN = km.HEYGEN_KEY || ''
    const ANTH   = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
    const AVATAR = km.HEYGEN_BEN_AVATAR_ID || '8cda690a684542e0817593096ea5461d'
    const subject = brokerName || topic || 'eToro'

    if (!HEYGEN || !ANTH) return NextResponse.json({ ok:false, error:'Missing API keys' })

    // STEP 1: Generate FULL 5-minute script (650+ words)
    const sRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json','x-api-key':ANTH,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 2000,
        tools: [{ type:'web_search_20250305', name:'web_search' }],
        messages: [{ role:'user', content:
`Search for detailed real information about "${subject}" broker — regulation licence number, spreads, fees, minimum deposit, platform, user complaints, awards, any warnings.

Write a FULL 5-minute YouTube broker review script for Ben from Verivex.
Target: 650-700 words (5 minutes at 130 words/minute).

STRUCTURE — cover ALL sections:

[HOOK - 30 seconds]
Energetic, tease the verdict. "Hey traders, Ben here from Verivex — today I'm doing a full deep dive on ${subject}..."

[WHO ARE THEY - 45 seconds]  
Company background, founded year, headquarters, how many users/clients, what markets they cover.

[REGULATION CHECK - 60 seconds]
Exact regulatory body + licence reference number. What protection traders get. Is it safe? Any regulatory warnings found?

[PLATFORM & TOOLS - 60 seconds]
Which platform (MT4/MT5/proprietary)? Mobile app quality? Tools available. What traders actually experience when they log in.

[FEES & SPREADS - 45 seconds]
Specific numbers — spread on EUR/USD, commission per lot, minimum deposit, withdrawal fees, inactivity fee. How it compares to competition.

[PROS & CONS - 45 seconds]
2-3 genuine positives, 2 genuine negatives or things to watch out for. Be honest — credibility comes from balance.

[FINAL VERDICT - 45 seconds]
Clear thumbs up or thumbs down with specific reasons. Who is this broker best for?

[CALL TO ACTION - 30 seconds]
"If this review helped, hit subscribe — I post a new broker review every single day. Drop a comment below: which broker should I review next?"

RULES:
- Pure spoken words only — no stage directions, no brackets, no asterisks
- Natural conversational tone — contractions, "honestly", "look", "actually" 
- Reference REAL specific facts from web search (licence numbers, exact spreads)
- Sound like someone who genuinely tested the broker
Return ONLY the script.` }]
      }),
      signal: AbortSignal.timeout(60000),
    })

    const sData = await sRes.json()
    const script = (sData.content||[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('').trim()
    if (!script || script.length < 200) return NextResponse.json({ ok:false, error:`Script failed: ${JSON.stringify(sData).slice(0,300)}` })

    // STEP 2: Submit to HeyGen
    // Ben's avatar is a "talking_photo" (UUID format custom avatar)
    const heygenPayload = {
      video_inputs: [{
        character: {
          type: 'talking_photo',
          talking_photo_id: AVATAR,
        },
        voice: {
          type: 'text',
          voice_id: 'en-US-GuyNeural',
          speed: 1.0,
          pitch: 0,
        },
        background: { type: 'color', value: '#0f172a' },
      }],
      input_text: script,
      aspect_ratio: '16:9',
      test: false,
    }

    console.log('[HeyGen] Sending to:', 'https://api.heygen.com/v2/video/generate')
    console.log('[HeyGen] Avatar:', AVATAR, '| Script words:', script.split(' ').length)

    const hRes = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(heygenPayload),
    })

    const hData = await hRes.json()
    console.log('[HeyGen] Status:', hRes.status, '| Response:', JSON.stringify(hData))

    const videoId = hData?.data?.video_id

    // Mobile 9:16
    let mobileId: string|null = null
    if (videoId) {
      const mRes = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...heygenPayload, aspect_ratio: '9:16' }),
      })
      const mData = await mRes.json()
      mobileId = mData?.data?.video_id || null
      console.log('[HeyGen] Mobile:', JSON.stringify(mData))
    }

    return NextResponse.json({
      ok: !!videoId,
      youtube_video_id: videoId || null,
      mobile_video_id: mobileId,
      script,
      word_count: script.split(' ').length,
      heygen_status: hRes.status,
      heygen_response: hData,
      youtube_title: `${subject} Review 2026 — Full Honest Analysis | Verivex`,
      youtube_description: `Full ${subject} review by Ben from Verivex. Regulation, fees, platform, pros & cons.\n\n📊 Full review: https://verivex.co\n🔔 Subscribe for daily broker reviews`,
      message: videoId
        ? `✅ Video generating! ${script.split(' ').length} words (~${Math.round(script.split(' ').length/130)} min). Check HeyGen in 5-10 min.`
        : `❌ HeyGen error (${hRes.status}): ${hData?.message || hData?.code || JSON.stringify(hData)}`,
    })

  } catch (err: any) {
    console.error('[Error]', err)
    return NextResponse.json({ ok:false, error: err?.message || String(err) })
  }
}
