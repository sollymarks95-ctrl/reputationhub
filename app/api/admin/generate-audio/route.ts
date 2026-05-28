import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { episodeId, script, voiceId } = await req.json()
    if (!script) return NextResponse.json({ error: 'No script provided' }, { status: 400 })

    const { data: elRow } = await supabase.from('system_api_keys').select('key_value').eq('key_name', 'ELEVENLABS_KEY').eq('is_active', true).single()
    const elevenKey = elRow?.key_value || process.env.ELEVENLABS_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    // Extract spoken lines only
    const spokenText = script
      .split('\n')
      .filter((l: string) => /^(HOST|GUEST|[A-Z ]+):\s/.test(l))
      .map((l: string) => l.replace(/^[A-Z ]+:\s*/, ''))
      .join(' ')
      .slice(0, 4000)

    let audioUrl: string | null = null
    let provider = 'none'

    // Try ElevenLabs
    if (elevenKey) {
      const voiceMap: Record<string,string> = { male_professional: 'pNInz6obpgDQGcFmaJgB', female_professional: '21m00Tcm4TlvDq8ikWAM', male_authoritative: 'VR6AewLTigWG4xSOukaG' }
      const selectedVoice = voiceMap[voiceId || 'male_professional'] || 'pNInz6obpgDQGcFmaJgB'
      try {
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'xi-api-key': elevenKey },
          body: JSON.stringify({ text: spokenText, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.71, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } })
        })
        if (r.ok) {
          const buf = await r.arrayBuffer()
          // Upload to Supabase Storage
          const filename = `podcast_${episodeId || Date.now()}.mp3`
          const { data: upload } = await supabase.storage.from('podcasts').upload(filename, buf, { contentType: 'audio/mpeg', upsert: true })
          if (upload) {
            const { data: { publicUrl } } = supabase.storage.from('podcasts').getPublicUrl(filename)
            audioUrl = publicUrl
          }
          provider = 'elevenlabs'
        }
      } catch {}
    }

    // Fallback: OpenAI TTS
    if (!audioUrl && openaiKey) {
      const voiceOptions: Record<string,string> = { male_professional: 'echo', female_professional: 'nova', male_authoritative: 'onyx' }
      try {
        const r = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'tts-1-hd', input: spokenText.slice(0, 4096), voice: voiceOptions[voiceId || 'male_professional'] || 'echo', response_format: 'mp3' })
        })
        if (r.ok) {
          const buf = await r.arrayBuffer()
          const filename = `podcast_${episodeId || Date.now()}_openai.mp3`
          const { data: upload } = await supabase.storage.from('podcasts').upload(filename, buf, { contentType: 'audio/mpeg', upsert: true })
          if (upload) {
            const { data: { publicUrl } } = supabase.storage.from('podcasts').getPublicUrl(filename)
            audioUrl = publicUrl
          }
          provider = 'openai'
        }
      } catch {}
    }

    const status = audioUrl ? 'audio_ready' : 'script_ready'
    if (episodeId) {
      await supabase.from('podcast_scripts').update({ status, audio_url: audioUrl, updated_at: new Date().toISOString() }).eq('id', episodeId)
    }

    return NextResponse.json({
      success: true, audioUrl, provider, status,
      message: audioUrl ? `Audio generated via ${provider}` : 'No API key configured — add ELEVENLABS_KEY or ensure OPENAI_API_KEY is set in Vercel env vars'
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
