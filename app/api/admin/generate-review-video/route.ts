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
  const db = getDb()
  const { data: keys } = await db.from('system_api_keys').select('key_name, key_value')
    .in('key_name', ['HEYGEN_KEY','ANTHROPIC_API_KEY','HEYGEN_BEN_AVATAR_ID'])
  const km: Record<string,string> = {}
  for (const r of keys || []) km[r.key_name] = r.key_value
  const HEYGEN = km.HEYGEN_KEY || ''
  const ANTHROPIC = km.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  const resolvedAvatarId = avatarId || km.HEYGEN_BEN_AVATAR_ID || '8cda690a684542e0817593096ea5461d'
  if (!HEYGEN || !ANTHROPIC) return NextResponse.json({ error: 'Missing keys' })

  // Step 1: Research broker with web search — get REAL data
  const researchRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json','x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01','anthropic-beta':'web-search-2025-03-05' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: `Search for real current information about "${brokerName || topic}" broker:
1. Exact regulatory licences (FCA number, ASIC number, CySEC etc)
2. Spread/fee data (specific numbers from their website)
3. Minimum deposit
4. Platform (MT4/MT5/own platform)
5. Any FCA/ASIC warnings or user complaints
6. Founded year and HQ country
7. Screenshot-worthy pages (regulation page URL, fee page URL)

Return as JSON: { regulation: "FCA (ref: 123456)", spreads: "from 0.6 pips", minDeposit: "$100", platform: "MT5", warnings: "none found", founded: "2010", country: "UK", regUrl: "https://...", feeUrl: "https://..." }`
      }]
    }),
    signal: AbortSignal.timeout(45000),
  })
  const resData = await researchRes.json()
  let brokerFacts: any = {}
  const resText = (resData.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('')
  try {
    const m = resText.match(/\{[\s\S]*\}/)
    if (m) brokerFacts = JSON.parse(m[0])
  } catch {}

  // Step 2: Generate a NATURAL, multi-segment script with emotion cues
  const scriptRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json','x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 2000,
      messages: [{ role: 'user', content: `Write a natural, engaging 2-minute YouTube broker review script for ${hostName} reviewing ${brokerName || topic}.

Broker facts from research:
${JSON.stringify(brokerFacts, null, 2)}

SCRIPT RULES — make it feel HUMAN and GENUINE:
- Natural speech patterns — use "so", "look", "honestly", "right", "actually", contractions
- Add genuine reactions: surprise at fees, relief at regulation, concern at spreads
- Reference SPECIFIC numbers from the research (regulation ref number, exact spreads, deposit)
- Sound like someone who actually tested this — "when I logged in...", "what I noticed was..."
- Vary pace — quick excited sections, slower thoughtful sections
- NO stage directions, NO [smiles], NO brackets — pure spoken words only
- 260-280 words for 2 minutes

STRUCTURE (label each section with ### for our production team):
### HOOK (0:00-0:15) — energetic open, tease the verdict
### REGULATION CHECK (0:15-0:35) — specific licence details, ref number
### PLATFORM & FEES (0:35-1:05) — spreads, deposit, platform honest opinion
### USER EXPERIENCE (1:05-1:35) — what trading with them is actually like
### VERDICT (1:35-2:00) — clear recommendation, call to action

Return ONLY the script with ### section labels.` }]
    }),
    signal: AbortSignal.timeout(30000),
  })
  const sData = await scriptRes.json()
  const fullScript = (sData.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim()

  // Extract clean spoken script (remove ### labels for HeyGen)
  const spokenScript = fullScript.replace(/###[^\n]*/g, '').replace(/\n{3,}/g, '\n\n').trim()

  // Step 3: Build multi-scene HeyGen video
  const scenes: any[] = [
    // Scene 1: Hook — avatar closeup, excited
    {
      video_inputs: [{
        character: { type: 'avatar', avatar_id: resolvedAvatarId, avatar_style: 'closeup' },
        voice: { type: 'elevenlabs', voice_id: voiceId, speed: 1.05 },
        background: { type: 'color', value: '#0f172a' }
      }],
      input_text: spokenScript.split('REGULATION CHECK')[0]?.replace(/HOOK[^\n]*/,'').trim() || spokenScript.slice(0, 80),
    },
    // Scene 2: Regulation — avatar with overlay feel
    {
      video_inputs: [{
        character: { type: 'avatar', avatar_id: resolvedAvatarId, avatar_style: 'normal' },
        voice: { type: 'elevenlabs', voice_id: voiceId, speed: 1.0 },
        background: { type: 'color', value: '#0f1f2e' }
      }],
      input_text: spokenScript.split('REGULATION CHECK')[1]?.split('PLATFORM')[0]?.trim() || spokenScript.slice(80, 180),
    },
    // Scene 3: Platform & Fees
    {
      video_inputs: [{
        character: { type: 'avatar', avatar_id: resolvedAvatarId, avatar_style: 'normal' },
        voice: { type: 'elevenlabs', voice_id: voiceId, speed: 1.0 },
        background: { type: 'color', value: '#0a1628' }
      }],
      input_text: spokenScript.split('PLATFORM')[1]?.split('USER EXPERIENCE')[0]?.trim() || spokenScript.slice(180, 280),
    },
    // Scene 4: Verdict — closeup, direct
    {
      video_inputs: [{
        character: { type: 'avatar', avatar_id: resolvedAvatarId, avatar_style: 'closeup' },
        voice: { type: 'elevenlabs', voice_id: voiceId, speed: 0.98 },
        background: { type: 'color', value: '#0f172a' }
      }],
      input_text: spokenScript.split('VERDICT')[1]?.trim() || spokenScript.slice(-100),
    }
  ].filter(s => s.input_text && s.input_text.length > 10)

  // Use simple single-scene if parsing fails
  const videoPayload = scenes.length >= 2 ? { scenes } : {
    video_inputs: [{
      character: { type: 'avatar', avatar_id: resolvedAvatarId, avatar_style: 'normal' },
      voice: { type: 'elevenlabs', voice_id: voiceId, speed: 1.0 },
      background: { type: 'color', value: '#0f172a' }
    }],
    input_text: spokenScript,
  }

  const videoRes = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...videoPayload, aspect_ratio: '16:9', test: false })
  })
  const videoData = await videoRes.json()

  return NextResponse.json({
    ok: videoRes.ok,
    video_id: videoData.data?.video_id,
    script: fullScript,  // with section labels for reference
    spoken_script: spokenScript,
    broker_facts: brokerFacts,
    scenes_count: scenes.length,
    youtube_title: `${brokerName} Review ${new Date().getFullYear()} — Honest Look | Verivex`,
    youtube_description: `Honest ${brokerName} review by Ben from Verivex. Regulation: ${brokerFacts.regulation || 'see video'}. Spreads: ${brokerFacts.spreads || 'see video'}. Min deposit: ${brokerFacts.minDeposit || 'see video'}.\n\n📊 Full review: https://verivex.co/reviews/${(brokerName||'').toLowerCase().replace(/\s+/g,'-')}\n🔔 Subscribe for daily broker reviews\n\n#BrokerReview #${(brokerName||'').replace(/\s+/g,'')} #Verivex #ForexBroker`,
    message: videoRes.ok ? `Video submitted — ${scenes.length} scenes — ready in HeyGen in ~5 min` : videoData.error
  })
}
