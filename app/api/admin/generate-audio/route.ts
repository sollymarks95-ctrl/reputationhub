import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// ElevenLabs voices — ultra realistic
const VOICES = {
  host:  'pNInz6obpgDQGcFmaJgB',  // Adam — deep authoritative male
  guest: '21m00Tcm4TlvDq8ikWAM',  // Rachel — confident professional female
}

// Voice settings per speaker type for maximum naturalness
const VOICE_SETTINGS = {
  host: { stability: 0.42, similarity_boost: 0.82, style: 0.48, use_speaker_boost: true },
  guest: { stability: 0.38, similarity_boost: 0.80, style: 0.55, use_speaker_boost: true },
}

// Natural reactions to inject between lines for realism
const HOST_REACTIONS = ['Right.', 'Exactly.', 'Interesting.', 'Go on.', "That's a key point.", 'Absolutely.']
const GUEST_REACTIONS = ["Yeah, and...", "Look,", "Here's the thing —", "Exactly right.", "And you know what's interesting?", "Right, so —"]

function cleanText(text: string): string {
  return text
    .replace(/^(HOST|GUEST)[:\s]*/i, '')
    .replace(/\[([^\]]+)\]/g, '')
    .replace(/\(([^)]+)\)/g, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,3}\s/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parseScript(script: string): Array<{ speaker: 'host' | 'guest'; text: string }> {
  const lines: Array<{ speaker: 'host' | 'guest'; text: string }> = []
  const parts = script.split(/\n(?=HOST:|GUEST:)/i)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || trimmed.length < 5) continue
    if (/^HOST:/i.test(trimmed)) {
      const text = cleanText(trimmed.replace(/^HOST:\s*/i, ''))
      if (text.length > 10) lines.push({ speaker: 'host', text })
    } else if (/^GUEST:/i.test(trimmed)) {
      const text = cleanText(trimmed.replace(/^GUEST:\s*/i, ''))
      if (text.length > 10) lines.push({ speaker: 'guest', text })
    } else if (lines.length > 0) {
      const cleaned = cleanText(trimmed)
      if (cleaned.length > 5) lines[lines.length - 1].text += ' ' + cleaned
    }
  }
  if (!lines.some(l => l.speaker === 'guest')) {
    const sents = script.match(/[^.!?]+[.!?]+/g) || [script]
    return sents.map((s, i) => ({ speaker: i % 2 === 0 ? 'host' : 'guest', text: cleanText(s) }))
  }
  return lines.filter(l => l.text.length > 10)
}

async function speak(text: string, speaker: 'host' | 'guest', apiKey: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[speaker]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: VOICE_SETTINGS[speaker],
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) { console.error('EL error:', res.status, await res.text()); return null }
    return Buffer.from(await res.arrayBuffer())
  } catch (e) { console.error('speak error:', e); return null }
}

// Post-process with Descript: Studio Sound + Captions + Video
async function descriptProcess(audioUrl: string, title: string, transcriptHint: string, descriptKey: string): Promise<{ projectUrl?: string; projectId?: string } | null> {
  try {
    // Step 1: Import audio into Descript project
    const importRes = await fetch('https://descriptapi.com/v1/jobs/import/project_media', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${descriptKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_name: title,
        add_media: { 'podcast_audio.mp3': { url: audioUrl } },
        add_compositions: [{ name: title, clips: [{ media: 'podcast_audio.mp3' }] }]
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!importRes.ok) { console.error('Descript import error:', importRes.status); return null }
    const importData = await importRes.json()
    const projectId = importData.project_id
    if (!projectId) return null
    
    // Wait for import to process
    await new Promise(r => setTimeout(r, 8000))

    // Step 2: Apply Studio Sound + captions via Underlord AI agent
    const agentRes = await fetch('https://descriptapi.com/v1/jobs/agent', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${descriptKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        prompt: `This is a professional financial podcast called "${title}". 
1. Apply Studio Sound to enhance audio quality, reduce background noise, and make both speakers sound like they are in a professional broadcast studio.
2. Add clean, professional captions/subtitles in white text.
3. Make sure the audio levels are balanced between the two speakers.
4. The result should sound and look like a premium Bloomberg or CNBC podcast production.`
      }),
      signal: AbortSignal.timeout(120000),
    })
    if (!agentRes.ok) { console.error('Descript agent error:', agentRes.status); return null }
    const agentData = await agentRes.json()
    
    return {
      projectId,
      projectUrl: agentData.result?.project_url || `https://web.descript.com/${projectId}`,
    }
  } catch (e) { console.error('Descript error:', e); return null }
}

export async function POST(req: NextRequest) {
  try {
    const { script, podcastId, title, clientId } = await req.json()
    const elKey = await getKey('ELEVENLABS_KEY')
    const descKey = await getKey('DESCRIPT_KEY')
    if (!elKey) return NextResponse.json({ error: 'ElevenLabs key missing' }, { status: 400 })
    if (!script) return NextResponse.json({ error: 'Script required' }, { status: 400 })

    const segments = parseScript(script)
    console.log(`Generating ${segments.length} segments...`)

    // Generate all audio segments
    const buffers: Buffer[] = []
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      if (seg.text.trim().length < 5) continue
      
      // Add subtle natural reactions between every 3-4 exchanges
      if (i > 0 && i % 4 === 0 && seg.speaker !== segments[i-1].speaker) {
        const reactions = seg.speaker === 'host' ? HOST_REACTIONS : GUEST_REACTIONS
        const reaction = reactions[Math.floor(Math.random() * reactions.length)]
        const rb = await speak(reaction, seg.speaker, elKey)
        if (rb) buffers.push(rb)
      }
      
      const audio = await speak(seg.text, seg.speaker, elKey)
      if (audio) buffers.push(audio)
    }

    if (buffers.length === 0) return NextResponse.json({ error: 'No audio generated' }, { status: 500 })

    const combined = Buffer.concat(buffers)
    const fileName = `podcast-${podcastId || Date.now()}-${Date.now().toString(36)}.mp3`

    // Upload to Supabase Storage
    const { data: upload, error: uploadErr } = await sb.storage.from('podcasts')
      .upload(fileName, combined, { contentType: 'audio/mpeg', cacheControl: '31536000', upsert: true })
    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

    const { data: urlData } = sb.storage.from('podcasts').getPublicUrl(fileName)
    const audioUrl = urlData.publicUrl

    // Update DB
    if (podcastId) {
      await sb.from('podcast_scripts').update({
        audio_url: audioUrl, status: 'ready',
        duration_seconds: Math.round(combined.length / 24000),
      }).eq('id', podcastId)
    }

    // Post-process with Descript in background (don't block response)
    let descriptResult = null
    if (descKey) {
      const podTitle = title || 'Trading Edge Podcast'
      descriptResult = await descriptProcess(audioUrl, podTitle, script.slice(0, 500), descKey)
      if (descriptResult?.projectId && podcastId) {
        await sb.from('podcast_scripts').update({
          status: 'polished',
        }).eq('id', podcastId)
      }
    }

    if (clientId) {
      await sb.from('portal_activity').insert({
        client_id: clientId, type: 'podcast_ready',
        description: `Podcast: ${title || 'Episode'} — ${Math.round(combined.length / 1024)}KB`,
      })
    }

    return NextResponse.json({
      success: true, audioUrl, fileName,
      segments: segments.length,
      sizeKb: Math.round(combined.length / 1024),
      descript: descriptResult ? {
        projectUrl: descriptResult.projectUrl,
        projectId: descriptResult.projectId,
        message: 'Studio Sound + captions applied in Descript',
      } : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
