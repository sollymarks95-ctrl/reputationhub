import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
)

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || ''
  const authHeader = req.headers.get('authorization')
  const urlSecret = req.nextUrl.searchParams.get('secret')
  if (authHeader !== ('Bearer ' + cronSecret) && urlSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const { data: keys } = await db.from('system_api_keys').select('key_name, key_value')
    .in('key_name', ['HEYGEN_KEY','ANTHROPIC_API_KEY','ELEVENLABS_KEY','HEYGEN_BEN_AVATAR_ID','ELEVENLABS_BEN_VOICE_ID'])
  const km: Record<string,string> = {}
  for (const r of keys || []) km[r.key_name] = r.key_value

  const HEYGEN = km.HEYGEN_KEY || ''
  const ANTHROPIC = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  const ELEVENLABS = km.ELEVENLABS_KEY || ''
  const AVATAR_ID = km.HEYGEN_BEN_AVATAR_ID || '8cda690a684542e0817593096ea5461d'
  let VOICE_ID = km.ELEVENLABS_BEN_VOICE_ID || ''

  if (!HEYGEN || !ANTHROPIC) return NextResponse.json({ error: 'Missing API keys' })

  // Auto-detect voice if not saved
  if (!VOICE_ID && ELEVENLABS) {
    const vRes = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': ELEVENLABS } })
    const vData = await vRes.json()
    const voices = vData.voices || []
    const cloned = voices.find((v: any) => v.category === 'cloned' || v.category === 'professional') || voices[0]
    if (cloned) {
      VOICE_ID = cloned.voice_id
      await db.from('system_api_keys').upsert({ key_name: 'ELEVENLABS_BEN_VOICE_ID', key_value: VOICE_ID })
    }
  }
  if (!VOICE_ID) return NextResponse.json({ error: 'No voice ID' })

  // Pick next broker
  const { data: reviewed } = await db.from('video_reviews').select('broker_slug').order('created_at', { ascending: false }).limit(50)
  const recentSlugs = new Set((reviewed || []).map((r: any) => r.broker_slug))
  const { data: companies } = await db.from('verivex_companies').select('slug, name, category, regulation').eq('is_active', true).order('created_at', { ascending: true })
  const broker = (companies || []).find((c: any) => !recentSlugs.has(c.slug)) || companies?.[0]
  if (!broker) return NextResponse.json({ error: 'No brokers' })

  // Research broker
  const researchRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json','x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: `Search for real facts about "${broker.name}" broker. Return JSON: { regulation, regRef, spreads, minDeposit, platform, warnings, founded, country, website }` }]
    }),
    signal: AbortSignal.timeout(40000),
  })
  const resData = await researchRes.json()
  let facts: any = {}
  try { const m = (resData.content||[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('').match(/\{[\s\S]*\}/); if(m) facts=JSON.parse(m[0]) } catch {}

  // Generate natural script + production guide
  const scriptRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json','x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 2500,
      messages: [{ role: 'user', content: `Write a complete YouTube broker review package for "${broker.name}".

Broker facts: ${JSON.stringify(facts)}

PART 1 — SPOKEN SCRIPT (for Ben's avatar video):
- 260-280 words, 2 minutes
- Genuine, conversational tone — "honestly", "look", "actually", contractions
- Specific numbers: reg reference, exact spreads, exact deposit
- Sound like someone who tested it: "when I opened the account...", "one thing I noticed..."  
- Real reactions: excited about good things, concerned about bad things
- Hook opens with energy, verdict ends with clear thumbs up/down
- End: "Drop a comment below with which broker to review next"
- PURE SPOKEN WORDS ONLY — no stage directions

PART 2 — PRODUCTION GUIDE (for video editing):
List 6-8 specific screenshots to overlay at exact timestamps:
Format: [0:15] Screenshot: FCA register showing ${broker.name} licence number
Include: homepage, regulation page, platform screenshot, fee/spread page, withdrawal page, any warning notices

Return format:
===SCRIPT===
[the spoken script here]
===PRODUCTION GUIDE===
[0:00-0:10] SCENE: Ben closeup, energetic
[0:10] SCREENSHOT: ${broker.name} homepage — show the platform landing page
[0:20] SCREENSHOT: FCA/regulator page showing licence
[0:35] SCREENSHOT: Trading platform (MT4/MT5/own platform)
[0:50] SCREENSHOT: Spreads/fees page showing exact numbers
[1:10] SCREENSHOT: Deposit/withdrawal page
[1:25] SCREENSHOT: Any trust badges or awards on their site
[1:35-2:00] SCENE: Ben closeup, direct verdict to camera
[YOUTUBE TITLE]: ...
[YOUTUBE DESCRIPTION]: ...
[TAGS]: ...` }]
    }),
    signal: AbortSignal.timeout(30000),
  })
  const sData = await scriptRes.json()
  const fullOutput = (sData.content||[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('').trim()

  // Parse script vs production guide
  const scriptPart = fullOutput.split('===PRODUCTION GUIDE===')[0]?.replace('===SCRIPT===','').trim() || fullOutput
  const guidePart = fullOutput.split('===PRODUCTION GUIDE===')[1]?.trim() || ''
  const titleMatch = guidePart.match(/\[YOUTUBE TITLE\]:\s*(.+)/)
  const descMatch = guidePart.match(/\[YOUTUBE DESCRIPTION\]:\s*([\s\S]+?)\[TAGS\]/)
  const ytTitle = titleMatch?.[1]?.trim() || `${broker.name} Review ${new Date().getFullYear()} — Honest Look | Verivex`
  const ytDesc = descMatch?.[1]?.trim() || `Honest ${broker.name} review. Full analysis on Verivex.`

  // Submit BOTH formats in parallel — 16:9 (YouTube) + 9:16 (Shorts/Reels/TikTok)
  async function submitFormat(ratio: string) {
    const r = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_inputs: [{
          character: AVATAR_ID.includes('-') && AVATAR_ID.length < 40
          ? { type: 'avatar', avatar_id: AVATAR_ID, avatar_style: ratio === '9:16' ? 'closeup' : 'normal' }
          : { type: 'talking_photo', talking_photo_id: AVATAR_ID },
          voice: { type: 'elevenlabs', voice_id: VOICE_ID, speed: 1.0 },
          background: { type: 'color', value: '#0f172a' }
        }],
        input_text: scriptPart,
        aspect_ratio: ratio,
        test: false,
      })
    })
    const d = await r.json()
    return d.data?.video_id
  }
  const [ytVideoId, mobileVideoId] = await Promise.all([submitFormat('16:9'), submitFormat('9:16')])
  const videoData = { data: { video_id: ytVideoId } }

  await db.from('video_reviews').insert({
    broker_slug: broker.slug,
    broker_name: broker.name,
    heygen_video_id: ytVideoId,
    heygen_mobile_video_id: mobileVideoId,
    script: fullOutput,
    status: 'processing',
    youtube_title: ytTitle,
    youtube_description: ytDesc,
  })

  return NextResponse.json({ ok: true, broker: broker.name, youtube_video_id: ytVideoId, mobile_video_id: mobileVideoId, message: '2 videos processing in HeyGen' })
}
