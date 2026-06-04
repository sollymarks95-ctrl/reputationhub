import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}
export async function OPTIONS() { return new NextResponse(null, { headers: CORS }) }

const BKGS: Record<string, string> = {
  dark_studio:    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80&fm=jpg',
  podcast_room:   'https://images.unsplash.com/photo-1478737270197-3a37b4c58e32?w=1920&q=80&fm=jpg',
  broadcast_desk: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=1920&q=80&fm=jpg',
  blue_office:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80&fm=jpg',
  dark_bokeh:     'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80&fm=jpg',
}

// ─── Submit HeyGen avatar talking head job ───────────────────────────────────
// Uses HeyGen's built-in ultra-realistic avatars — no photo upload needed
async function submitHeygenAvatar(opts: {
  avatarId: string
  audioUrl: string
  heygenKey: string
  bgUrl: string
}): Promise<string | null> {
  const { avatarId, audioUrl, heygenKey, bgUrl } = opts
  try {
    const r = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': heygenKey },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'audio',
            audio_url: audioUrl,
          },
          background: {
            type: 'image',
            url: bgUrl,
          },
        }],
        dimension: { width: 1280, height: 720 },
        caption: false,
      }),
      signal: AbortSignal.timeout(20000),
    })
    const d = await r.json().catch(() => ({}))
    console.log('[heygen:avatar:submit]', JSON.stringify(d).slice(0, 200))
    if (!r.ok) throw new Error(`HeyGen ${r.status}: ${JSON.stringify(d).slice(0,150)}`)
    return d?.data?.video_id || null
  } catch (e: any) {
    console.error('[heygen:avatar:submit]', e.message)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const body = await req.json()
    const { episode_id, studio_bg = 'dark_studio', host_avatar_id, guest_avatar_id } = body

    if (!episode_id) return NextResponse.json({ error: 'episode_id required' }, { status: 400, headers: CORS })

    const { data: ep } = await sb.from('podcast_scripts').select('*').eq('id', episode_id).single()
    if (!ep) return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: CORS })
    if (!ep.audio_url) return NextResponse.json({ error: 'Generate audio first' }, { status: 400, headers: CORS })

    const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
    const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

    const { data: site } = await sb.from('news_sites').select('name,template_config').eq('slug', ep.site_slug).single()
    const accent  = (site as any)?.template_config?.primary || '#10B981'

    const bgUrl      = BKGS[studio_bg] || BKGS.dark_studio
    const duration   = (ep.duration_minutes || 5) * 60

    // HeyGen avatar IDs (ultra-realistic built-in avatars)
    const hk            = km.HEYGEN_KEY
    // Use avatar IDs from request body first, then DB config, then defaults
    const hostAvatarId  = host_avatar_id  || km.HEYGEN_HOST_AVATAR_ID  || 'Tyler-insuit-20220721'
    const guestAvatarId = guest_avatar_id || km.HEYGEN_GUEST_AVATAR_ID || 'Wayne-insuit-20220819'

    if (!hk) return NextResponse.json({ error: 'HEYGEN_KEY not set' }, { status: 400, headers: CORS })

    // Create job record
    const { data: job, error: jobErr } = await sb.from('podcast_videos').insert({
      episode_id, client_id: ep.client_id || null, site_slug: ep.site_slug,
      status: 'rendering', pipeline_phase: 'heygen_render',
      current_step: 'Step 1/2: HeyGen rendering ultra-realistic talking heads…', progress_pct: 10,
      host_name: ep.host_name || 'Host', guest_name: ep.guest_name || 'Guest',
      episode_title: ep.title,
      studio_bg, portal_accent: accent, audio_url: ep.audio_url, duration_seconds: duration,
    }).select('id').single()

    if (jobErr || !job) return NextResponse.json({ error: `DB: ${jobErr?.message}` }, { status: 500, headers: CORS })

    // Submit BOTH HeyGen avatar jobs in parallel
    const [hostJobId, guestJobId] = await Promise.all([
      submitHeygenAvatar({ avatarId: hostAvatarId,  audioUrl: ep.audio_url, heygenKey: hk, bgUrl }),
      submitHeygenAvatar({ avatarId: guestAvatarId, audioUrl: ep.audio_url, heygenKey: hk, bgUrl }),
    ])

    if (!hostJobId || !guestJobId) {
      const err = `HeyGen submit failed — host: ${!!hostJobId}, guest: ${!!guestJobId}. Check avatar IDs in system_api_keys.`
      await sb.from('podcast_videos').update({ status: 'failed', current_step: err }).eq('id', job.id)
      return NextResponse.json({ error: err, video_job_id: job.id }, { status: 400, headers: CORS })
    }

    await sb.from('podcast_videos').update({
      heygen_host_job_id:  hostJobId,
      heygen_guest_job_id: guestJobId,
      current_step: 'Step 1/2: HeyGen rendering both avatars (5-15 min)…', progress_pct: 20,
    }).eq('id', job.id)

    return NextResponse.json({
      success: true,
      video_job_id: job.id,
      engine: 'heygen-avatars → shotstack',
      host_avatar:  hostAvatarId,
      guest_avatar: guestAvatarId,
      heygen_host_job_id:  hostJobId,
      heygen_guest_job_id: guestJobId,
      note: 'Both HeyGen avatar jobs submitted. Poll /api/admin/video-status — Shotstack auto-composites when done.',
    }, { headers: CORS })

  } catch (err: any) {
    console.error('[generate-video]', err)
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS })
  }
}
