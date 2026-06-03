import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSiteConfig, pickPortalGuestVoice, SITE_PODCAST_CONFIG as PODCAST_CFG } from '@/app/lib/podcast-config'

export const runtime = 'nodejs'
export const maxDuration = 300

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' }

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function getKey(name: string) {
  if (process.env[name]) return process.env[name]!
  const { data } = await db().from('system_api_keys').select('key_value').eq('key_name', name).eq('is_active', true).single()
  return data?.key_value || ''
}

async function speak(text: string, voiceId: string, apiKey: string): Promise<Buffer | null> {
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({
        text: text.slice(0, 2000),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.45, similarity_boost: 0.72, style: 0.38, use_speaker_boost: true }
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) { console.error('EL error', r.status); return null }
    return Buffer.from(await r.arrayBuffer())
  } catch (e) { console.error('speak err', e); return null }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, clientBrand, siteSlug, hostName, guestName, guestRole, topic, title, episodeNumber, durationMinutes, guestGender } = body
    const duration = parseInt(durationMinutes) || 5

    const [elKey, anthKey] = await Promise.all([
      getKey('ELEVENLABS_KEY'),
      Promise.resolve(process.env.ANTHROPIC_API_KEY || '')
    ])

    if (!elKey) return NextResponse.json({ error: 'ElevenLabs key not configured' }, { status: 400, headers: CORS })
    if (!anthKey) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 400, headers: CORS })

    const cfg = getSiteConfig(siteSlug || 'global-trade-wire')
    const HOST = hostName || cfg.hostName
    const GUEST = guestName || 'James Richardson'
    // Per-portal voice assignment: never repeat same voice within a portal
    const guestVoice = pickPortalGuestVoice(siteSlug || 'global-trade-wire', parseInt(episodeNumber) || 1)
    const targetWords = duration * 140

    // STEP 1: Generate script with Claude
    console.log(`Generating ${duration}-min script: ${HOST} interviews ${GUEST}`)
    const scriptRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: Math.min(targetWords * 6, 8000),
        system: `You write ultra-realistic podcast scripts that sound like REAL recorded conversations — not scripted, not corporate. Think Joe Rogan, Lex Fridman, How I Built This. Natural human dialogue.`,
        messages: [{
          role: 'user',
          content: `Write a ${duration}-minute podcast conversation. Make it sound like a REAL recording — messy, human, alive.

HOST: ${HOST} (${PODCAST_CFG[siteSlug || 'trust-score']?.hostRole || 'podcast host'})
GUEST: ${GUEST} (${guestRole || 'industry expert'})
TOPIC: ${topic || `${clientBrand?.name || 'markets and strategy'} — deep dive`}
${clientBrand ? `
CLIENT CONTEXT: ${clientBrand.name} (${clientBrand.website}). Regulated by ${clientBrand.regulation || 'multiple authorities'}. Weave naturally 2-3 times as part of genuine discussion — never as an ad.` : ''}

BANNED OPENINGS — NEVER write any of these:
❌ "Welcome to [show name]..."
❌ "Hi, I'm [host] and this is [show]..."
❌ "Today on [show]..."
❌ "I'm [host], your host..."
❌ "Today I have with me [guest] from [company] who is a [role]..."
❌ Any formal self-introduction of host or guest by name at the start
❌ Any statement of what the show is about at the start

INSTEAD — start in the MIDDLE of a thought, mid-conversation energy. Examples:
✅ HOST: "So I was reading this report on my flight over and — actually, tell me your honest take first. Is this real or is it noise?"
✅ HOST: "Okay, three things happened last week that I can't stop thinking about. You saw the numbers?"
✅ HOST: "Right so — before we get into anything else, I have to ask you something."
✅ HOST: "Look, I've been skeptical about this for a while. Talk me out of it."

RULES FOR NATURALISM:
1. COLD OPEN — jump straight in, no intro at all, host says something that implies they already started talking
2. FILLER WORDS: "you know", "I mean", "honestly", "right?", "look —", "here's the thing"
3. INTERRUPTIONS: host cuts in "—wait, hold on", "—okay but", "—sorry, say that again"
4. LAUGHTER: [laughs] [both laugh] [chuckles] — minimum 5 times throughout
5. SELF-CORRECTIONS: "I was going to say — actually no, scratch that"
6. TANGENTS that get pulled back: "anyway — where were we"
7. REAL PUSHBACK: host disagrees hard at least once "I don't buy that. Here's why—"
8. PERSONAL story from guest — a moment of failure, doubt, or surprise
9. HOST stays curious and slightly skeptical throughout
10. ZERO corporate speak: no "synergies", "leverage", "ecosystem", "journey", "absolutely", "great question", "certainly", "touch base", "circle back"
11. Guest NEVER introduces themselves — listener already knows who they are

Format: "${HOST}: ..." and "${GUEST}: ..." on separate lines.
Target ~${targetWords} words.

BEGIN NOW with the host already mid-thought:`
        }]
      }),
      signal: AbortSignal.timeout(120000),
    })

    if (!scriptRes.ok) {
      const err = await scriptRes.text()
      console.error('Claude error:', scriptRes.status, err)
      return NextResponse.json({ error: `Script generation failed: ${scriptRes.status}` }, { status: 500, headers: CORS })
    }

    const scriptData = await scriptRes.json()
    const script = scriptData.content?.[0]?.text?.trim() || ''
    if (!script) return NextResponse.json({ error: 'Empty script from Claude' }, { status: 500, headers: CORS })
    console.log(`Script: ${script.split(' ').length} words`)

    // STEP 2: Parse script into segments
    const segments: Array<{ speaker: 'host' | 'guest'; text: string }> = []
    const hostRe = new RegExp(`^${HOST}:`, 'i')
    const guestRe = new RegExp(`^${GUEST}:`, 'i')
    for (const line of script.split('\n')) {
      const t = line.trim()
      if (!t || t.length < 5) continue
      if (hostRe.test(t)) segments.push({ speaker: 'host', text: t.replace(hostRe, '').trim() })
      else if (guestRe.test(t)) segments.push({ speaker: 'guest', text: t.replace(guestRe, '').trim() })
      else if (/^(HOST|GUEST):/i.test(t)) {
        const isHost = /^HOST:/i.test(t)
        segments.push({ speaker: isHost ? 'host' : 'guest', text: t.replace(/^(HOST|GUEST):\s*/i, '').trim() })
      }
    }

    if (segments.length === 0) {
      // fallback: split by sentences
      const sents = script.match(/[^.!?]+[.!?]+/g) || [script]
      sents.forEach((s, i) => segments.push({ speaker: i % 2 === 0 ? 'host' : 'guest', text: s.trim() }))
    }

    console.log(`${segments.length} segments. Host voice: ${cfg.hostVoiceId}, Guest: ${guestVoice.name}`)

    // STEP 3: Generate audio (process sequentially, max 20 segments for speed)
    const maxSegs = Math.min(segments.length, 20)
    const buffers: Buffer[] = []
    const silShort = Buffer.alloc(8000, 0) // 0.5s silence at 16kbps
    const silLong = Buffer.alloc(12000, 0) // 0.75s silence

    for (let i = 0; i < maxSegs; i++) {
      const seg = segments[i]
      const voiceId = seg.speaker === 'host' ? cfg.hostVoiceId : guestVoice.id
      const buf = await speak(seg.text, voiceId, elKey)
      if (buf) {
        if (i > 0) buffers.push(segments[i - 1]?.speaker !== seg.speaker ? silLong : silShort)
        buffers.push(buf)
      }
      await new Promise(r => setTimeout(r, 150))
    }

    if (buffers.length === 0) return NextResponse.json({ error: 'No audio generated — ElevenLabs failed' }, { status: 500, headers: CORS })

    const mp3 = Buffer.concat(buffers)
    const fileName = `podcast-${Date.now()}.mp3`

    // STEP 4: Upload to Supabase storage
    const { error: upErr } = await db().storage.from('podcasts').upload(fileName, mp3, {
      contentType: 'audio/mpeg', cacheControl: '31536000', upsert: true
    })
    if (upErr) return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500, headers: CORS })

    const { data: urlData } = db().storage.from('podcasts').getPublicUrl(fileName)
    const audioUrl = urlData.publicUrl

    // STEP 5: Save to portal_podcasts
    await db().from('portal_podcasts').insert({
      title: title || `${cfg.showName} — Episode ${episodeNumber || 1}`,
      script,
      audio_url: audioUrl,
      status: 'published',
      client_id: clientId || null,
      site_slug: siteSlug || null,
      host_name: HOST,
      guest_name: GUEST,
      episode_number: parseInt(episodeNumber) || 1,
      duration_seconds: duration * 60,
    })

    // Upsert podcast_scripts: update if exists, create if not
    const { data: existingScript } = await db()
      .from('podcast_scripts')
      .select('id')
      .eq('site_slug', siteSlug || '')
      .eq('episode_number', parseInt(episodeNumber) || 1)
      .maybeSingle()

    if (existingScript?.id) {
      await db()
        .from('podcast_scripts')
        .update({ audio_url: audioUrl, script, status: 'published' })
        .eq('id', existingScript.id)
    } else {
      // Create new episode record
      await db().from('podcast_scripts').insert({
        site_slug: siteSlug || null,
        episode_number: parseInt(episodeNumber) || 1,
        title: title || `${cfg.showName} — Episode ${episodeNumber || 1}`,
        script,
        audio_url: audioUrl,
        status: 'published',
        host_name: HOST,
        show_name: cfg.showName,
        guest_name: GUEST,
        guest_role: guestRole || 'Guest',
        topic: topic || null,
        duration_minutes: duration,
        duration_seconds: duration * 60,
        client_id: clientId || null,
        word_count: script.split(/\s+/).length,
      })
    }

    return NextResponse.json({
      ok: true,
      audioUrl,
      script,
      host: HOST,
      guest: GUEST,
      segments: segments.length,
      words: script.split(' ').length,
    }, { headers: CORS })

  } catch (e: any) {
    console.error('generate-podcast error:', e)
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS })
  }
}
