import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Build HeyGen multi-scene payload with broker screenshots as backgrounds
function buildScenes(scriptParts: Record<string,string>, avatarId: string, voiceId: string, facts: any, aspectRatio: '16:9'|'9:16') {
  const isMobile = aspectRatio === '9:16'
  // Background images — use real URLs from research or professional dark backgrounds
  const backgrounds = {
    hook:       { type: 'color', value: '#0a0f1e' },   // dark navy for hook
    regulation: { type: 'color', value: '#0d1b2a' },   // deep blue for regulation
    platform:   { type: 'color', value: '#111827' },   // dark for platform
    verdict:    { type: 'color', value: '#0a0f1e' },   // dark navy for verdict
  }

  // Overlay text on each scene for key facts
  const scenes = [
    // Scene 1: Hook — avatar center, dark bg
    {
      character: { type: 'avatar', avatar_id: avatarId, avatar_style: isMobile ? 'closeup' : 'normal' },
      voice: { type: 'elevenlabs', voice_id: voiceId, speed: 1.05, pitch: 1 },
      background: backgrounds.hook,
      ...(isMobile ? {} : { title: { content: `${facts.brokerName || ''} Review ${new Date().getFullYear()}`, font_family: 'Inter', font_size: 36, font_color: '#ffffff', bold: true, italic: false, left: 50, top: 10, width: 900 } })
    },
    // Scene 2: Regulation — with reg details overlay
    {
      character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
      voice: { type: 'elevenlabs', voice_id: voiceId, speed: 1.0, pitch: 1 },
      background: backgrounds.regulation,
      ...(isMobile ? {} : { title: { content: `Regulation: ${facts.regulation || 'See video'}`, font_family: 'Inter', font_size: 24, font_color: '#10b981', bold: true, italic: false, left: 50, top: 10, width: 900 } })
    },
    // Scene 3: Platform & Fees
    {
      character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
      voice: { type: 'elevenlabs', voice_id: voiceId, speed: 1.0, pitch: 1 },
      background: backgrounds.platform,
      ...(isMobile ? {} : { title: { content: `Spreads: ${facts.spreads || '—'} | Min Deposit: ${facts.minDeposit || '—'}`, font_family: 'Inter', font_size: 24, font_color: '#f59e0b', bold: true, italic: false, left: 50, top: 10, width: 900 } })
    },
    // Scene 4: Verdict — closeup
    {
      character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'closeup' },
      voice: { type: 'elevenlabs', voice_id: voiceId, speed: 0.98, pitch: 1 },
      background: backgrounds.verdict,
    }
  ]

  return scenes
}

export async function POST(req: NextRequest) {
  const { avatarId, voiceId, brokerName, topic } = await req.json()
  const db = getDb()
  const { data: keys } = await db.from('system_api_keys').select('key_name, key_value')
    .in('key_name', ['HEYGEN_KEY','ANTHROPIC_API_KEY','HEYGEN_BEN_AVATAR_ID','ELEVENLABS_BEN_VOICE_ID'])
  const km: Record<string,string> = {}
  for (const r of keys || []) km[r.key_name] = r.key_value
  const HEYGEN = km.HEYGEN_KEY || ''
  const ANTHROPIC = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  const AVATAR = avatarId || km.HEYGEN_BEN_AVATAR_ID || '8cda690a684542e0817593096ea5461d'
  const VOICE = voiceId || km.ELEVENLABS_BEN_VOICE_ID || ''
  if (!HEYGEN || !ANTHROPIC || !VOICE) return NextResponse.json({ error: 'Missing keys' })

  // Step 1: Research
  const researchRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json','x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: `Search for real facts about "${brokerName || topic}" broker. Return JSON only: { brokerName, regulation, regRef, spreads, minDeposit, platform, warnings, founded, country, website, trustScore }` }]
    }), signal: AbortSignal.timeout(45000),
  })
  const resData = await researchRes.json()
  let facts: any = { brokerName }
  try { const m = (resData.content||[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('').match(/\{[\s\S]*?\}/); if(m) facts={...facts,...JSON.parse(m[0])} } catch {}

  // Step 2: Generate script with 4 clear scene breaks
  const scriptRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json','x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 2000,
      messages: [{ role: 'user', content: `Write a natural 2-min YouTube broker review script for Ben reviewing "${facts.brokerName || brokerName}".
Facts: regulation=${facts.regulation}, regRef=${facts.regRef}, spreads=${facts.spreads}, minDeposit=${facts.minDeposit}, platform=${facts.platform}, warnings=${facts.warnings}

Write 4 sections separated by ===SCENE===:

SECTION 1 (0:00-0:15, ~35 words): Energetic hook. "Hey traders, Ben here from Verivex. Today I'm reviewing ${facts.brokerName} — and honestly what I found is..."

SECTION 2 (0:15-0:40, ~65 words): Regulation check. Mention exact reg body + reference number. Sound relieved/concerned based on what you found. "So the first thing I always check is regulation..."

SECTION 3 (0:40-1:30, ~110 words): Platform, spreads, deposits, user experience. Specific numbers. Natural reactions. "When I actually logged in..."

SECTION 4 (1:30-2:00, ~60 words): Clear verdict + thumbs up or down + "Subscribe for a new broker review every single day"

Rules: Pure spoken words. Contractions. Real reactions. SPECIFIC numbers from facts. NO stage directions.
Return ONLY the 4 sections separated by ===SCENE===` }]
    }), signal: AbortSignal.timeout(30000),
  })
  const sData = await scriptRes.json()
  const fullScript = (sData.content||[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('').trim()
  const parts = fullScript.split('===SCENE===').map((s:string) => s.trim()).filter(Boolean)
  const scriptParts = { hook: parts[0]||'', regulation: parts[1]||'', platform: parts[2]||'', verdict: parts[3]||'' }

  // Step 3: Submit BOTH formats to HeyGen in parallel
  async function submitVideo(aspectRatio: '16:9'|'9:16') {
    const scenes = buildScenes(scriptParts, AVATAR, VOICE, facts, aspectRatio)
    
    const payload = {
      video_inputs: scenes.map((scene, i) => ({
        character: { type: 'avatar', avatar_id: scene.character.avatar_id, avatar_style: scene.character.avatar_style },
        voice: { type: 'elevenlabs', voice_id: scene.voice.voice_id, speed: scene.voice.speed },
        background: scene.background,
        text_overlay: scene.title ? {
          text: scene.title.content,
          font_family: 'Inter',
          font_size: scene.title.font_size,
          font_color: scene.title.font_color,
          bold: scene.title.bold,
          position: { x: 0.05, y: 0.05 },
          width: 0.9,
        } : undefined,
        input_text: Object.values(scriptParts)[i] || '',
      })),
      aspect_ratio: aspectRatio,
      test: false,
    }

    const r = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const d = await r.json()
    return { ok: r.ok, video_id: d.data?.video_id, error: d.error, aspect: aspectRatio }
  }

  const [yt, mobile] = await Promise.all([
    submitVideo('16:9'),
    submitVideo('9:16'),
  ])

  const ytTitle = `${facts.brokerName || brokerName} Review ${new Date().getFullYear()} — Is It Safe? | Verivex`
  const ytDesc = `Honest review of ${facts.brokerName || brokerName} by Ben from Verivex.
Regulation: ${facts.regulation || 'see video'} | Spreads: ${facts.spreads || 'see video'} | Min deposit: ${facts.minDeposit || 'see video'}

📊 Full review: https://verivex.co/reviews/${(brokerName||'').toLowerCase().replace(/\s+/g,'-')}
🔔 Subscribe for a new broker review every single day

#BrokerReview #${(brokerName||'').replace(/\s+/g,'')} #Verivex #ForexBroker #Trading`

  return NextResponse.json({
    ok: yt.ok || mobile.ok,
    youtube_video_id: yt.video_id,
    mobile_video_id: mobile.video_id,
    script: fullScript,
    facts,
    youtube_title: ytTitle,
    youtube_description: ytDesc,
    message: `✅ 2 videos submitted:\n• YouTube 16:9 (desktop): ${yt.video_id || yt.error}\n• Mobile 9:16 (Shorts/Reels/TikTok): ${mobile.video_id || mobile.error}\nReady in HeyGen in ~5 min`
  })
}
