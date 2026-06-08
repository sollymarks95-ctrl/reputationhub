import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
  if (!VOICE_ID) return NextResponse.json({ error: 'No ElevenLabs voice found — save ELEVENLABS_BEN_VOICE_ID in system_api_keys' })
  const { data: reviewed } = await db.from('video_reviews').select('broker_slug').order('created_at', { ascending: false }).limit(50)
  const recentSlugs = new Set((reviewed || []).map((r: any) => r.broker_slug))
  const { data: companies } = await db.from('verivex_companies').select('slug, name, category, regulation').eq('is_active', true).order('created_at', { ascending: true })
  const broker = (companies || []).find((c: any) => !recentSlugs.has(c.slug)) || companies?.[0]
  if (!broker) return NextResponse.json({ error: 'No brokers' })
  const scriptRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-2025-03-05' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: `Search for current info about "${broker.name}" broker — regulation, warnings, FCA/ASIC/CySEC licence, complaints, recent news.\n\nWrite a 90-second YouTube talking head script for Ben from Verivex.\nRULES: Pure spoken words only. 200-230 words. Hook: "Hey traders, Ben here from Verivex...". Cover: regulated? Which body? Safe? Issues found? Clear verdict. End: "Comment which broker to review next. Like and subscribe — new review every day."\nReturn ONLY the script.` }]
    }),
    signal: AbortSignal.timeout(60000),
  })
  const scriptData = await scriptRes.json()
  const script = (scriptData.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim()
  if (!script) return NextResponse.json({ error: 'Script failed' })
  const videoRes = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': HEYGEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{ character: { type: 'avatar', avatar_id: AVATAR_ID, avatar_style: 'normal' }, voice: { type: 'elevenlabs', voice_id: VOICE_ID, speed: 1.0 }, background: { type: 'color', value: '#0f172a' } }],
      input_text: script, aspect_ratio: '16:9', test: false,
    })
  })
  const videoData = await videoRes.json()
  const videoId = videoData.data?.video_id
  await db.from('video_reviews').insert({
    broker_slug: broker.slug, broker_name: broker.name,
    heygen_video_id: videoId, script, status: 'processing',
    youtube_title: `${broker.name} Review 2026 — Is It Safe? | Verivex`,
    youtube_description: `Ben from Verivex reviews ${broker.name}. Is it regulated? FCA? ASIC? CySEC? Watch before you trade.\n\n🔔 Subscribe for daily broker reviews\n📊 Full review: https://verivex.co/reviews/${broker.slug}\n\n#BrokerReview #Verivex #${broker.name.replace(/\s+/g,'')}`,
  })
  return NextResponse.json({ ok: true, broker: broker.name, video_id: videoId, message: 'Processing in HeyGen — ready in ~5 min' })
}
