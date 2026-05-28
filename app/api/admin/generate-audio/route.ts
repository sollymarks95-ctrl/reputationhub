import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function getElevenLabsKey(): Promise<string> {
  if (process.env.ELEVENLABS_KEY) return process.env.ELEVENLABS_KEY
  const { data } = await sb.from('system_api_keys').select('key_value').eq('key_name', 'ELEVENLABS_KEY').eq('is_active', true).single()
  return data?.key_value || ''
}

// Professional ElevenLabs voice IDs
const VOICES = {
  host:  'pNInz6obpgDQGcFmaJgB',  // Adam - deep professional male
  guest: '21m00Tcm4TlvDq8ikWAM',  // Rachel - professional female
}

async function generateSpeech(text: string, voiceId: string, apiKey: string): Promise<Buffer | null> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.85,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('ElevenLabs error:', res.status, err)
    return null
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Clean text before speech - remove stage directions, speaker labels, formatting
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/^(HOST|GUEST)[:\s]*/i, '')          // strip any remaining speaker labels
    .replace(/\[([^\]]+)\]/g, '')                  // remove [stage directions]
    .replace(/\(([^)]+)\)/g, '')                    // remove (parenthetical notes)  
    .replace(/\*([^*]+)\*/g, '$1')                  // remove *emphasis* markers
    .replace(/#{1,3}\s/g, '')                       // remove markdown headers
    .replace(/\s{2,}/g, ' ')                        // collapse multiple spaces
    .trim()
}

// Parse multi-speaker script: HOST: ... GUEST: ... lines
function parseScript(script: string): Array<{ speaker: 'host' | 'guest'; text: string }> {
  const lines: Array<{ speaker: 'host' | 'guest'; text: string }> = []
  
  // Split on newlines where next line starts with HOST: or GUEST:
  const parts = script.split(/\n(?=HOST:|GUEST:)/i)
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || trimmed.length < 5) continue
    
    if (/^HOST:/i.test(trimmed)) {
      const text = cleanTextForSpeech(trimmed.replace(/^HOST:\s*/i, ''))
      if (text.length > 5) lines.push({ speaker: 'host', text })
    } else if (/^GUEST:/i.test(trimmed)) {
      const text = cleanTextForSpeech(trimmed.replace(/^GUEST:\s*/i, ''))
      if (text.length > 5) lines.push({ speaker: 'guest', text })
    } else if (lines.length > 0) {
      // Continuation of previous speaker
      const cleaned = cleanTextForSpeech(trimmed)
      if (cleaned.length > 5) {
        lines[lines.length - 1].text += ' ' + cleaned
      }
    } else {
      const cleaned = cleanTextForSpeech(trimmed)
      if (cleaned.length > 5) lines.push({ speaker: 'host', text: cleaned })
    }
  }

  // Fallback: split evenly if no speaker tags found
  if (!lines.some(l => l.speaker === 'guest')) {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script]
    return sentences.map((s, i) => ({
      speaker: i % 2 === 0 ? 'host' : 'guest',
      text: cleanTextForSpeech(s),
    }))
  }

  return lines.filter(l => l.text.length > 10)
}

export async function POST(req: NextRequest) {
  try {
    const { script, podcastId, title, clientId } = await req.json()

    const apiKey = await getElevenLabsKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs key not configured' }, { status: 400 })
    }

    if (!script) {
      return NextResponse.json({ error: 'Script required' }, { status: 400 })
    }

    // Parse into speaker segments
    const segments = parseScript(script)
    console.log(`Generating ${segments.length} speech segments...`)

    // Generate audio for each segment
    const audioBuffers: Buffer[] = []
    for (const seg of segments) {
      if (seg.text.trim().length < 5) continue
      const voiceId = seg.speaker === 'host' ? VOICES.host : VOICES.guest
      const audio = await generateSpeech(seg.text, voiceId, apiKey)
      if (audio) audioBuffers.push(audio)
    }

    if (audioBuffers.length === 0) {
      return NextResponse.json({ error: 'No audio generated' }, { status: 500 })
    }

    // Concatenate all MP3 buffers
    const combined = Buffer.concat(audioBuffers)

    // Upload to Supabase Storage
    const fileName = `podcast-${podcastId || Date.now()}-${Date.now().toString(36)}.mp3`
    const { data: upload, error: uploadError } = await sb.storage
      .from('podcasts')
      .upload(fileName, combined, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = sb.storage.from('podcasts').getPublicUrl(fileName)
    const audioUrl = urlData.publicUrl

    // Update podcast record in DB
    if (podcastId) {
      await sb.from('podcast_scripts').update({
        audio_url: audioUrl,
        status: 'ready',
        duration_seconds: Math.round(combined.length / 24000), // rough estimate
      }).eq('id', podcastId)
    }

    // Log activity
    if (clientId) {
      await sb.from('portal_activity').insert({
        client_id: clientId,
        type: 'podcast_ready',
        description: `Podcast audio generated: ${title || 'Episode'}`,
      })
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      fileName,
      segments: segments.length,
      sizeKb: Math.round(combined.length / 1024),
      message: `${segments.length} segments generated with 2 professional voices`,
    })
  } catch (e: any) {
    console.error('generate-audio error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
