import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSiteConfig, pickGuestVoice } from '@/app/lib/podcast-config'

export const runtime = 'nodejs'
export const maxDuration = 300

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function getKey(name: string) {
  if (process.env[name]) return process.env[name]!
  const { data } = await sb.from('system_api_keys').select('key_value').eq('key_name', name).eq('is_active', true).single()
  return data?.key_value || ''
}

const HOST_SETTINGS  = { stability:0.55, similarity_boost:0.85, style:0.35, use_speaker_boost:true }
const GUEST_SETTINGS = { stability:0.42, similarity_boost:0.82, style:0.50, use_speaker_boost:true }

function cleanText(text: string) {
  return text
    .replace(/^(HOST|GUEST)[:\s]*/i, '')
    .replace(/\[([^\]]+)\]/g, '').replace(/\(([^)]+)\)/g, '')
    .replace(/\*([^*]+)\*/g, '$1').replace(/#{1,3}\s/g, '')
    .replace(/\s{2,}/g, ' ').trim()
}

function parseScript(script: string, hostName = 'HOST', guestName = 'GUEST') {
  const lines: Array<{ speaker: 'host'|'guest'; text: string }> = []
  const hostRe = new RegExp(`^(HOST|${hostName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}):`, 'i')
  const guestRe = new RegExp(`^(GUEST|${guestName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}):`, 'i')
  const anyNameRe = /^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)*):/

  for (const part of script.split(/\n(?=[A-Z])/)) {
    const t = part.trim()
    if (!t || t.length < 5) continue
    if (hostRe.test(t)) {
      const text = cleanText(t.replace(hostRe, ''))
      if (text.length > 10) lines.push({ speaker: 'host', text })
    } else if (guestRe.test(t)) {
      const text = cleanText(t.replace(guestRe, ''))
      if (text.length > 10) lines.push({ speaker: 'guest', text })
    } else if (anyNameRe.test(t) && lines.length > 0) {
      const text = cleanText(t.replace(anyNameRe, ''))
      if (text.length > 10) {
        const last = lines[lines.length-1].speaker
        lines.push({ speaker: last === 'host' ? 'guest' : 'host', text })
      }
    } else if (lines.length > 0) {
      const cleaned = cleanText(t)
      if (cleaned.length > 5) lines[lines.length-1].text += ' ' + cleaned
    }
  }
  if (!lines.some(l => l.speaker === 'guest')) {
    const sents = script.match(/[^.!?]+[.!?]+/g) || [script]
    return sents.map((s, i) => ({ speaker: i%2===0 ? 'host' as const : 'guest' as const, text: cleanText(s) }))
  }
  return lines.filter(l => l.text.length > 10)
}

async function speak(text: string, voiceId: string, settings: object, apiKey: string): Promise<Buffer|null> {
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({ text, model_id:'eleven_multilingual_v2', voice_settings: settings }),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) { console.error('EL', r.status, voiceId); return null }
    return Buffer.from(await r.arrayBuffer())
  } catch(e) { console.error('speak err:', e); return null }
}

// Process in parallel batches of 5 — fits 20-min podcast in ~120s
async function processBatch(
  segments: Array<{ speaker:'host'|'guest'; text:string }>,
  hostVoiceId: string,
  guestVoiceId: string,
  apiKey: string,
  batchSize = 5
): Promise<Buffer[]> {
  const results: Array<Buffer|null> = new Array(segments.length).fill(null)
  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((seg, j) => {
        const voiceId = seg.speaker === 'host' ? hostVoiceId : guestVoiceId
        const settings = seg.speaker === 'host' ? HOST_SETTINGS : GUEST_SETTINGS
        return speak(seg.text, voiceId, settings, apiKey)
      })
    )
    batchResults.forEach((buf, j) => { results[i + j] = buf })
    // Brief pause between batches to avoid rate limits
    if (i + batchSize < segments.length) await new Promise(r => setTimeout(r, 300))
  }
  return results.filter((b): b is Buffer => b !== null)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as any
    const { script, podcastId, title, clientId } = body
    const guestName: string = body.guestName || 'Sarah'
    const guestGender: string = body.guestGender || 'auto'
    const siteSlug: string = body.siteSlug || ''
    const hName: string = body.hostName || 'HOST'

    const elKey = await getKey('ELEVENLABS_KEY')
    if (!elKey) return NextResponse.json({ error:'ElevenLabs key not configured' }, { status:400 })
    if (!script) return NextResponse.json({ error:'Script required' }, { status:400 })

    const siteConfig = getSiteConfig(siteSlug)
    const hostVoiceId = siteConfig.hostVoiceId
    const guestVoice = pickGuestVoice(guestName, guestGender as any)

    console.log(`Generating: site=${siteSlug} host=${siteConfig.hostName}(${hostVoiceId}) guest=${guestName}(${guestVoice.name})`)

    const segments = parseScript(script, hName, guestName)
    console.log(`${segments.length} segments — processing in parallel batches`)

    const buffers = await processBatch(segments, hostVoiceId, guestVoice.id, elKey, 5)

    if (buffers.length === 0) return NextResponse.json({ error:'No audio generated — check ElevenLabs key' }, { status:500 })

    const combined = Buffer.concat(buffers)
    const fileName = `podcast-${podcastId || Date.now()}-${Date.now().toString(36)}.mp3`

    const { error: upErr } = await sb.storage.from('podcasts')
      .upload(fileName, combined, { contentType:'audio/mpeg', cacheControl:'31536000', upsert:true })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status:500 })

    const { data: urlData } = sb.storage.from('podcasts').getPublicUrl(fileName)
    const audioUrl = urlData.publicUrl

    if (podcastId) {
      await sb.from('podcast_scripts').update({ audio_url:audioUrl, status:'ready' }).eq('id', podcastId)
      // Also upsert into portal_podcasts with the mp3_url for playback
      const epNum = parseInt(title?.match(/\d+/)?.[0] || '1')
      const { data: existing } = await sb.from('portal_podcasts').select('id').eq('client_id', clientId).eq('title', title||'Episode').maybeSingle()
      if (existing?.id) {
        await sb.from('portal_podcasts').update({ mp3_url: audioUrl, status:'published', script: script?.substring(0,500) }).eq('id', existing.id)
      } else {
        await sb.from('portal_podcasts').insert({
          client_id: clientId,
          title: title || 'Podcast Episode',
          description: `AI podcast with ${guestName||'guest'}`,
          duration_minutes: Math.round((combined.length / 1024 / 128) * 8 / 60) || 20,
          status: 'published',
          mp3_url: audioUrl,
          host_name: siteConfig.hostName,
          guest_name: guestName || 'Guest',
          script: script?.substring(0,500),
          published_at: new Date().toISOString()
        })
      }
    }
    if (clientId) await sb.from('portal_activity').insert({ client_id:clientId, type:'podcast_ready', description:`Audio: ${title||'Episode'}` })

    return NextResponse.json({
      success: true, audioUrl, fileName,
      segments: buffers.length,
      sizeKb: Math.round(combined.length/1024),
      voices: {
        host: `${siteConfig.hostName} — ${siteConfig.domain}`,
        guest: `${guestVoice.name} — matched to "${guestName}"`,
      },
    })
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status:500 })
  }
}
