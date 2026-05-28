import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSiteConfig, pickGuestVoice } from '@/app/lib/podcast-config'

export const runtime = 'nodejs'
export const maxDuration = 300

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function getKey(name: string): Promise<string> {
  if (process.env[name]) return process.env[name]!
  const { data } = await sb.from('system_api_keys').select('key_value').eq('key_name', name).eq('is_active', true).single()
  return data?.key_value || ''
}

// ── HOST: Always the same voice (deep, authoritative) ─────────────────────

// ── GUEST voice pool — different voices for different guests ──────────────
// Hash guest name → consistent voice every time (same guest = same voice)
const GUEST_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',   gender: 'f', desc: 'Professional, confident' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',     gender: 'm', desc: 'Warm, authoritative' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi',     gender: 'f', desc: 'Strong, clear' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold',   gender: 'm', desc: 'Deep, powerful' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli',     gender: 'f', desc: 'Friendly, articulate' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni',   gender: 'm', desc: 'Well-rounded, natural' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',    gender: 'f', desc: 'Polished, composed' },
  { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace',    gender: 'f', desc: 'Calm, measured' },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde',    gender: 'm', desc: 'Deep, seasoned' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',   gender: 'm', desc: 'British, authoritative' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy',  gender: 'f', desc: 'Pleasant, clear' },
  { id: 'wViXBPUzp2ZZixB1xQuM', name: 'Patrick',  gender: 'm', desc: 'Confident, smooth' },
]

// Deterministic hash — same guest name always gets same voice
function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff
  return h
}

function getGuestVoice(guestName: string) {
  const idx = hashName(guestName.toLowerCase().trim()) % GUEST_VOICES.length
  return GUEST_VOICES[idx]
}

const HOST_SETTINGS  = { stability: 0.55, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true }
const GUEST_SETTINGS = { stability: 0.42, similarity_boost: 0.82, style: 0.50, use_speaker_boost: true }

// Natural reactions for realism
const HOST_REACTIONS  = ['Right.', 'Exactly.', "That's a key point.", 'Go on.', 'Interesting.', 'Absolutely.']
const GUEST_REACTIONS = ['Look,', "Here's the thing —", 'And you know what?', 'Right, so —', 'Exactly right.', "Yeah, and here's why —"]

function cleanText(text: string): string {
  return text
    .replace(/^(HOST|GUEST)[:\s]*/i, '')
    .replace(/\[([^\]]+)\]/g, '').replace(/\(([^)]+)\)/g, '')
    .replace(/\*([^*]+)\*/g, '$1').replace(/#{1,3}\s/g, '')
    .replace(/\s{2,}/g, ' ').trim()
}

function parseScript(script: string): Array<{ speaker: 'host' | 'guest'; text: string }> {
  const lines: Array<{ speaker: 'host' | 'guest'; text: string }> = []
  const parts = script.split(/\n(?=HOST:|GUEST:)/i)
  for (const part of parts) {
    const t = part.trim()
    if (!t || t.length < 5) continue
    if (/^HOST:/i.test(t)) {
      const text = cleanText(t.replace(/^HOST:\s*/i, ''))
      if (text.length > 10) lines.push({ speaker: 'host', text })
    } else if (/^GUEST:/i.test(t)) {
      const text = cleanText(t.replace(/^GUEST:\s*/i, ''))
      if (text.length > 10) lines.push({ speaker: 'guest', text })
    } else if (lines.length > 0) {
      const cleaned = cleanText(t)
      if (cleaned.length > 5) lines[lines.length - 1].text += ' ' + cleaned
    }
  }
  if (!lines.some(l => l.speaker === 'guest')) {
    const sents = script.match(/[^.!?]+[.!?]+/g) || [script]
    return sents.map((s, i) => ({ speaker: i % 2 === 0 ? 'host' as const : 'guest' as const, text: cleanText(s) }))
  }
  return lines.filter(l => l.text.length > 10)
}

async function speak(text: string, voiceId: string, settings: object, apiKey: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: settings }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) { console.error('EL error:', res.status, await res.text()); return null }
    return Buffer.from(await res.arrayBuffer())
  } catch (e) { console.error('speak error:', e); return null }
}

export async function POST(req: NextRequest) {
  try {
    const { script, podcastId, title, clientId, guestName = 'Sarah', guestGender = 'auto', siteSlug = '' } = await req.json() as any
    const elKey = await getKey('ELEVENLABS_KEY')
    if (!elKey) return NextResponse.json({ error: 'ElevenLabs key not configured' }, { status: 400 })
    if (!script)  return NextResponse.json({ error: 'Script required' }, { status: 400 })

    const guestVoice = getGuestVoice(guestName)
    console.log(`Host: Adam (always) | Guest "${guestName}": ${guestVoice.name} (${guestVoice.id})`)

    const segments = parseScript(script)
    const buffers: Buffer[] = []

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      if (seg.text.trim().length < 5) continue

      // Add natural micro-reactions every 4-5 exchanges
      if (i > 0 && i % 5 === 0 && seg.speaker !== segments[i-1]?.speaker) {
        const reactions = seg.speaker === 'host' ? HOST_REACTIONS : GUEST_REACTIONS
        const reaction = reactions[Math.floor(Math.random() * reactions.length)]
        const voiceId = seg.speaker === 'host' ? hostVoiceId : guestVoice.id
        const settings = seg.speaker === 'host' ? HOST_SETTINGS : GUEST_SETTINGS
        const rbVoice = seg.speaker === 'host' ? hostVoiceId : guestVoice.id
        const rb = await speak(reaction, rbVoice, { stability:0.35, similarity_boost:0.82, style:0.6, use_speaker_boost:true }, elKey)
        if (rb) buffers.push(rb)
      }

      const voiceId = seg.speaker === 'host' ? hostVoiceId : guestVoice.id
      const settings = seg.speaker === 'host' ? HOST_SETTINGS : GUEST_SETTINGS
      const audio = await speak(seg.text, voiceId, settings, elKey)
      if (audio) buffers.push(audio)
    }

    if (buffers.length === 0) return NextResponse.json({ error: 'No audio generated' }, { status: 500 })

    const combined = Buffer.concat(buffers)
    const fileName = `podcast-${podcastId || Date.now()}-${Date.now().toString(36)}.mp3`

    const { data: upload, error: uploadErr } = await sb.storage.from('podcasts')
      .upload(fileName, combined, { contentType: 'audio/mpeg', cacheControl: '31536000', upsert: true })
    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

    const { data: urlData } = sb.storage.from('podcasts').getPublicUrl(fileName)
    const audioUrl = urlData.publicUrl

    if (podcastId) {
      await sb.from('podcast_scripts').update({
        audio_url: audioUrl, status: 'ready',
        duration_seconds: Math.round(combined.length / 24000),
      }).eq('id', podcastId)
    }
    if (clientId) {
      await sb.from('portal_activity').insert({
        client_id: clientId, type: 'podcast_ready',
        description: `Audio: "${title || 'Episode'}" — Host: ${siteConfig.hostName} (${guestVoice.name})`,
      })
    }

    return NextResponse.json({
      success: true, audioUrl, fileName,
      segments: segments.length,
      sizeKb: Math.round(combined.length / 1024),
      voices: { host: `${siteConfig.hostName} — consistent for ${siteConfig.domain}`, guest: `${guestVoice.name} — matched to "${guestName}"` },
    })
  } catch (e: any) {
    console.error('generate-audio error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
