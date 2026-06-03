export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CORS = { 'Access-Control-Allow-Origin': '*' }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  const results: Record<string, any> = {}

  // ── Get API keys ──
  const { data: keys } = await sb.from('system_api_keys')
    .select('key_name, key_value, is_active')
    .eq('is_active', true)

  const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

  // ── 1. Test ElevenLabs ──
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': km.ELEVENLABS_KEY || '' },
      signal: AbortSignal.timeout(8000)
    })
    const d = await r.json()
    results.elevenlabs = {
      ok: r.ok,
      status: r.status,
      voices: d.voices?.length || 0,
      message: r.ok ? `✅ Connected — ${d.voices?.length} voices available` : `❌ ${d.detail || r.status}`
    }
  } catch (e: any) {
    results.elevenlabs = { ok: false, message: `❌ ${e.message}` }
  }

  // ── 2. Test HeyGen ──
  try {
    const r = await fetch('https://api.heygen.com/v2/avatars?limit=5', {
      headers: { 'X-Api-Key': km.HEYGEN_KEY || '' },
      signal: AbortSignal.timeout(10000)
    })
    const d = await r.json()
    const avatars = d?.data?.avatars || []
    results.heygen = {
      ok: r.ok,
      status: r.status,
      avatars: avatars.length,
      first_avatar: avatars[0] ? { id: avatars[0].avatar_id, name: avatars[0].avatar_name } : null,
      message: r.ok
        ? `✅ Connected — ${avatars.length} avatars available`
        : `❌ ${JSON.stringify(d).slice(0, 100)}`
    }
  } catch (e: any) {
    results.heygen = { ok: false, message: `❌ ${e.message}` }
  }

  // ── 3. Test Creatomate ──
  const creatomateKey = km.CREATOMATE_KEY
  if (creatomateKey && creatomateKey !== 'REPLACE_WITH_KEY') {
    try {
      const r = await fetch('https://api.creatomate.com/v1/renders?limit=1', {
        headers: { 'Authorization': `Bearer ${creatomateKey}` },
        signal: AbortSignal.timeout(8000)
      })
      results.creatomate = {
        ok: r.ok,
        status: r.status,
        message: r.ok ? '✅ Connected — ready to render' : `❌ HTTP ${r.status}`
      }
    } catch (e: any) {
      results.creatomate = { ok: false, message: `❌ ${e.message}` }
    }
  } else {
    results.creatomate = { ok: false, message: '⚠️ No key — add CREATOMATE_KEY to system_api_keys' }
  }

  // ── 4. Test audio URL from latest episode ──
  try {
    const { data: ep } = await sb.from('podcast_scripts')
      .select('id, title, audio_url, host_name')
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (ep?.audio_url) {
      const r = await fetch(ep.audio_url, { method: 'HEAD', signal: AbortSignal.timeout(6000) })
      results.audio = {
        ok: r.ok,
        episode_id: ep.id,
        episode_title: ep.title,
        host: ep.host_name,
        audio_url: ep.audio_url,
        content_length: r.headers.get('content-length'),
        content_type: r.headers.get('content-type'),
        message: r.ok ? `✅ Audio accessible (${Math.round(parseInt(r.headers.get('content-length')||'0')/1024)}KB)` : `❌ HTTP ${r.status}`
      }
    } else {
      results.audio = { ok: false, message: '⚠️ No episodes with audio yet' }
    }
  } catch (e: any) {
    results.audio = { ok: false, message: `❌ ${e.message}` }
  }

  const allOk = results.elevenlabs?.ok && results.heygen?.ok && results.audio?.ok
  return NextResponse.json({
    ready: allOk,
    note: allOk ? '🟢 Pipeline ready — HeyGen + ElevenLabs connected. Add CREATOMATE_KEY for full video compositing.' : '🔴 Some services need attention',
    results
  }, { headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
