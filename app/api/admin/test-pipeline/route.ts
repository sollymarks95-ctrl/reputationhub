import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  // Supabase created INSIDE handler — not at module level
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: Record<string, any> = {}

  // Get API keys
  const { data: keys } = await sb.from('system_api_keys')
    .select('key_name, key_value, is_active')
    .eq('is_active', true)
  const km: Record<string, string> = Object.fromEntries(
    (keys || []).map((k: any) => [k.key_name, k.key_value])
  )

  // 1. ElevenLabs
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': km.ELEVENLABS_KEY || '' },
      signal: AbortSignal.timeout(8000)
    })
    const d = await r.json()
    results.elevenlabs = {
      ok: r.ok,
      voices: d.voices?.length || 0,
      message: r.ok ? `✅ ${d.voices?.length} voices` : `❌ ${r.status}`
    }
  } catch (e: any) { results.elevenlabs = { ok: false, message: `❌ ${e.message}` } }

  // 2. HeyGen
  try {
    const r = await fetch('https://api.heygen.com/v2/avatars?limit=5', {
      headers: { 'X-Api-Key': km.HEYGEN_KEY || '' },
      signal: AbortSignal.timeout(10000)
    })
    const d = await r.json()
    const avs = d?.data?.avatars || []
    results.heygen = {
      ok: r.ok,
      avatars: avs.length,
      message: r.ok ? `✅ ${avs.length} avatars` : `❌ ${JSON.stringify(d).slice(0,80)}`
    }
  } catch (e: any) { results.heygen = { ok: false, message: `❌ ${e.message}` } }

  // 3. Creatomate
  const ck = km.CREATOMATE_KEY
  if (ck && ck !== 'REPLACE_WITH_KEY') {
    try {
      const r = await fetch('https://api.nextcut.io/v1/renders?limit=1', {
        headers: { 'Authorization': `Bearer ${ck}` },
        signal: AbortSignal.timeout(8000)
      })
      results.creatomate = { ok: r.ok, message: r.ok ? '✅ Connected' : `❌ ${r.status}` }
    } catch (e: any) { results.creatomate = { ok: false, message: `❌ ${e.message}` } }
  } else {
    results.creatomate = { ok: false, message: '⚠️ No key — add CREATOMATE_KEY to system_api_keys' }
  }

  // 4. Audio check
  try {
    const { data: ep } = await sb.from('podcast_scripts')
      .select('id, title, audio_url, host_name')
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1).single()
    if (ep?.audio_url) {
      const r = await fetch(ep.audio_url, { method: 'HEAD', signal: AbortSignal.timeout(6000) })
      const kb = Math.round(parseInt(r.headers.get('content-length') || '0') / 1024)
      results.audio = {
        ok: r.ok, title: ep.title, audio_url: ep.audio_url,
        message: r.ok ? `✅ Audio accessible (${kb}KB)` : `❌ ${r.status}`
      }
    } else {
      results.audio = { ok: false, message: '⚠️ No episodes with audio' }
    }
  } catch (e: any) { results.audio = { ok: false, message: `❌ ${e.message}` } }

  const ready = !!(results.elevenlabs?.ok && results.audio?.ok)
  return NextResponse.json({
    ready,
    note: ready ? '🟢 Core pipeline ready' : '🔴 Check services',
    results
  }, { headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
