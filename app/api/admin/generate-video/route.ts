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

const MALE_PHOTOS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80&fm=jpg',
]
const FEMALE_PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80&fm=jpg',
]
const FEMALE = new Set(['sarah','emma','julia','lisa','maria','anna','natalie','sophie',
  'claire','jessica','rachel','laura','emily','diana','priya','fatima','aisha','leila'])

function guestPhoto(name: string): string {
  const first = (name?.split(' ')[0] || '').toLowerCase()
  const pool = FEMALE.has(first) ? FEMALE_PHOTOS : MALE_PHOTOS
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length
  return pool[hash]
}

// ─── Shotstack timeline builder (validated against their v1 API) ──────────────
// Docs: https://shotstack.io/docs/api/
// Auth: x-api-key header
// Endpoint: POST https://api.shotstack.io/edit/{env}/render
// Status:   GET  https://api.shotstack.io/edit/{env}/renders/{id}
function buildShotstackEdit(opts: {
  format: '16:9' | '9:16' | '1:1'
  audio_url: string
  host_photo: string
  guest_photo: string
  host_name: string
  guest_name: string
  episode_title: string
  portal_name: string
  accent: string
  bg_url: string
  duration: number
}) {
  const { format, audio_url, host_photo, guest_photo, host_name, guest_name,
          episode_title, portal_name, accent, bg_url, duration } = opts

  const isVert = format === '9:16'

  // Shotstack valid resolutions: preview|mobile|sd|hd|1080|4k
  // For portrait use hd + aspectRatio: "9:16" → gives 720x1280
  const resolution  = 'hd'
  const aspectRatio = format === '9:16' ? '9:16' : format === '1:1' ? '1:1' : '16:9'

  const dur = Math.min(duration, 300) // cap at 5 min for now (Shotstack limits)

  // HTML clip helper — circular avatar frame
  const avatarClip = (src: string, x: number, y: number, scale: number, color: string, label: string, labelY: number) => [
    // Avatar image
    {
      asset: { type: 'image', src, fit: 'cover' },
      start: 0, length: dur,
      position: 'center',
      offset: { x, y },
      scale,
      opacity: 1,
    },
    // Name label via html
    {
      asset: {
        type: 'html',
        html: `<p style="color:white;font-family:Arial,sans-serif;font-size:${isVert?28:22}px;font-weight:700;text-align:center;white-space:nowrap;text-shadow:0 2px 8px rgba(0,0,0,0.8)">${label}</p>`,
        width: isVert ? 600 : 400,
        height: isVert ? 60 : 50,
        background: 'transparent',
      },
      start: 0, length: dur,
      position: 'center',
      offset: { x, y: labelY },
    },
  ]

  const tracks: any[] = []

  if (isVert) {
    // 9:16 stacked layout: host top, guest bottom
    tracks.push(
      // Portal name
      { clips: [{ asset: { type: 'html',
        html: `<p style="color:${accent};font-family:Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,0.6)">${portal_name}</p>`,
        width: 900, height: 50, background: 'transparent' },
        start: 0, length: dur, position: 'top', offset: { y: -0.04 } }] },
      // Episode title
      { clips: [{ asset: { type: 'html',
        html: `<p style="color:white;font-family:Arial,sans-serif;font-size:38px;font-weight:900;text-align:center;line-height:1.2;text-shadow:0 3px 10px rgba(0,0,0,0.8)">${episode_title.slice(0, 70)}</p>`,
        width: 900, height: 200, background: 'transparent' },
        start: 0, length: dur, position: 'top', offset: { y: -0.12 } }] },
      // Host section
      { clips: [{ asset: { type: 'image', src: host_photo, fit: 'cover' },
        start: 0, length: dur, position: 'center', offset: { x: 0, y: 0.22 }, scale: 0.35 }] },
      { clips: [{ asset: { type: 'html',
        html: `<p style="color:white;font-family:Arial,sans-serif;font-size:28px;font-weight:700;text-align:center;text-shadow:0 2px 8px rgba(0,0,0,0.9)">${host_name} <span style="color:${accent};font-size:18px">HOST</span></p>`,
        width: 700, height: 60, background: 'transparent' },
        start: 0, length: dur, position: 'center', offset: { x: 0, y: 0.04 } }] },
      // Divider
      { clips: [{ asset: { type: 'html',
        html: `<div style="background:${accent};width:100%;height:4px;opacity:0.6"></div>`,
        width: 800, height: 10, background: 'transparent' },
        start: 0, length: dur, position: 'center', offset: { x: 0, y: -0.04 } }] },
      // Guest section
      { clips: [{ asset: { type: 'image', src: guest_photo, fit: 'cover' },
        start: 0, length: dur, position: 'center', offset: { x: 0, y: -0.22 }, scale: 0.35 }] },
      { clips: [{ asset: { type: 'html',
        html: `<p style="color:white;font-family:Arial,sans-serif;font-size:28px;font-weight:700;text-align:center;text-shadow:0 2px 8px rgba(0,0,0,0.9)">${guest_name} <span style="color:#818CF8;font-size:18px">GUEST</span></p>`,
        width: 700, height: 60, background: 'transparent' },
        start: 0, length: dur, position: 'center', offset: { x: 0, y: -0.38 } }] },
    )
  } else {
    // 16:9 / 1:1 — 3-camera cinematic layout
    const xOff = format === '1:1' ? 0.22 : 0.27
    const sc   = format === '1:1' ? 0.22 : 0.20
    const scMid = format === '1:1' ? 0.17 : 0.16

    tracks.push(
      // Portal name
      { clips: [{ asset: { type: 'html',
        html: `<p style="color:${accent};font-family:Arial,sans-serif;font-size:18px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,0.6)">${portal_name}</p>`,
        width: 1400, height: 40, background: 'transparent' },
        start: 0, length: dur, position: 'top', offset: { y: -0.04 } }] },
      // Episode title
      { clips: [{ asset: { type: 'html',
        html: `<p style="color:white;font-family:Arial,sans-serif;font-size:40px;font-weight:900;text-align:center;line-height:1.2;text-shadow:0 3px 10px rgba(0,0,0,0.8)">${episode_title.slice(0, 75)}</p>`,
        width: 1400, height: 140, background: 'transparent' },
        start: 0, length: dur, position: 'top', offset: { y: -0.12 } }] },
      // CAM labels
      { clips: [{ asset: { type: 'html',
        html: `<div style="display:flex;gap:80px;font-family:monospace;font-size:14px;font-weight:700"><span style="color:${accent}">● CAM 1</span><span style="color:#94A3B8">● CAM MID</span><span style="color:#818CF8">● CAM 2</span></div>`,
        width: 500, height: 28, background: 'transparent' },
        start: 0, length: dur, position: 'center', offset: { x: 0, y: 0.36 } }] },
      // Host avatar (left, CAM-1)
      { clips: [{ asset: { type: 'image', src: host_photo, fit: 'cover' },
        start: 0, length: dur, position: 'center', offset: { x: -xOff, y: 0.10 }, scale: sc }] },
      { clips: [{ asset: { type: 'html',
        html: `<p style="color:white;font-family:Arial,sans-serif;font-size:20px;font-weight:700;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,0.8)">${host_name}</p>`,
        width: 360, height: 40, background: 'transparent' },
        start: 0, length: dur, position: 'center', offset: { x: -xOff, y: -0.06 } }] },
      // Host mid (small, center-left)
      { clips: [{ asset: { type: 'image', src: host_photo, fit: 'cover' },
        start: 0, length: dur, position: 'center', offset: { x: -0.08, y: 0.10 }, scale: scMid, opacity: 0.85 }] },
      // Guest mid (small, center-right)
      { clips: [{ asset: { type: 'image', src: guest_photo, fit: 'cover' },
        start: 0, length: dur, position: 'center', offset: { x: 0.08, y: 0.10 }, scale: scMid, opacity: 0.85 }] },
      // Guest avatar (right, CAM-2)
      { clips: [{ asset: { type: 'image', src: guest_photo, fit: 'cover' },
        start: 0, length: dur, position: 'center', offset: { x: xOff, y: 0.10 }, scale: sc }] },
      { clips: [{ asset: { type: 'html',
        html: `<p style="color:white;font-family:Arial,sans-serif;font-size:20px;font-weight:700;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,0.8)">${guest_name}</p>`,
        width: 360, height: 40, background: 'transparent' },
        start: 0, length: dur, position: 'center', offset: { x: xOff, y: -0.06 } }] },
    )
  }

  // Background always at bottom
  tracks.push({
    clips: [{
      asset: { type: 'image', src: bg_url, fit: 'cover' },
      start: 0, length: dur, opacity: 0.28,
    }]
  })

  return {
    timeline: {
      soundtrack: { src: audio_url, effect: 'fadeOut' },
      background: '#080C14',
      tracks,
    },
    output: {
      format: 'mp4',
      resolution,
      aspectRatio,
      fps: 25,
    },
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const body = await req.json()
    const { episode_id, host_photo_url, guest_photo_url, studio_bg = 'dark_studio', formats = ['9:16', '16:9'] } = body

    if (!episode_id) return NextResponse.json({ error: 'episode_id required' }, { status: 400, headers: CORS })

    const { data: episode } = await sb.from('podcast_scripts').select('*').eq('id', episode_id).single()
    if (!episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: CORS })
    if (!episode.audio_url) return NextResponse.json({ error: 'Episode has no audio — generate audio first' }, { status: 400, headers: CORS })

    const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
    const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

    const { data: site } = await sb.from('news_sites').select('name,template_config').eq('slug', episode.site_slug).single()
    const accent     = (site as any)?.template_config?.primary || '#10B981'
    const portalName = (site as any)?.name || 'RepHuby'

    const { data: avatarRows } = await sb.from('podcast_avatars').select('*').eq('site_slug', episode.site_slug).eq('is_active', true)
    const hostPhoto  = host_photo_url || avatarRows?.find((a: any) => a.role === 'host')?.photo_url
      || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fm=jpg'
    const guestName  = episode.guest_name || 'Guest'
    const guestP     = guest_photo_url || guestPhoto(guestName)
    const bgUrl      = BKGS[studio_bg] || BKGS.dark_studio
    const duration   = (episode.duration_minutes || 5) * 60

    const { data: job, error: jobErr } = await sb.from('podcast_videos').insert({
      episode_id, client_id: episode.client_id || null, site_slug: episode.site_slug,
      status: 'rendering', current_step: 'Submitting to Shotstack', progress_pct: 10,
      host_name: episode.host_name || 'Host', guest_name: guestName,
      episode_title: episode.title, host_photo_url: hostPhoto, guest_photo_url: guestP,
      studio_bg, portal_accent: accent, audio_url: episode.audio_url, duration_seconds: duration,
    }).select('id').single()

    if (jobErr || !job) return NextResponse.json({ error: `DB error: ${jobErr?.message}` }, { status: 500, headers: CORS })

    // ── Shotstack ────────────────────────────────────────────────────────────
    const ssKey = km.SHOTSTACK_KEY
    const ssEnv = km.SHOTSTACK_ENV || 'v1'

    if (ssKey && ssKey.length > 5) {
      const renderJobs: Record<string, string> = {}
      const errors: string[] = []

      const results = await Promise.allSettled(
        (formats as ('16:9' | '9:16' | '1:1')[]).map(async (fmt) => {
          const edit = buildShotstackEdit({
            format: fmt, audio_url: episode.audio_url,
            host_photo: hostPhoto, guest_photo: guestP,
            host_name: episode.host_name || 'Host', guest_name: guestName,
            episode_title: episode.title, portal_name: portalName,
            accent, bg_url: bgUrl, duration,
          })
          const r = await fetch(`https://api.shotstack.io/edit/${ssEnv}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': ssKey },
            body: JSON.stringify(edit),
            signal: AbortSignal.timeout(20000),
          })
          const text = await r.text()
          if (!r.ok) throw new Error(`Shotstack ${fmt}: HTTP ${r.status} — ${text.slice(0, 300)}`)
          const d = JSON.parse(text)
          const id = d?.response?.id
          if (!id) throw new Error(`Shotstack ${fmt}: no render ID — ${text.slice(0, 200)}`)
          return { fmt, id }
        })
      )

      for (const r of results) {
        if (r.status === 'fulfilled') renderJobs[r.value.fmt] = r.value.id
        else {
          console.error('[generate-video] Shotstack error:', (r as any).reason?.message)
          errors.push((r as any).reason?.message || 'Unknown')
        }
      }

      if (Object.keys(renderJobs).length > 0) {
        await sb.from('podcast_videos').update({
          creatomate_169_id: renderJobs['16:9'] || null,
          creatomate_916_id: renderJobs['9:16'] || null,
          creatomate_11_id:  renderJobs['1:1']  || null,
          current_step: `Rendering ${Object.keys(renderJobs).length}/${formats.length} format(s) via Shotstack (${ssEnv})`,
          progress_pct: 30,
        }).eq('id', job.id)
        return NextResponse.json({
          success: true, video_job_id: job.id, engine: `shotstack-${ssEnv}`,
          render_jobs: renderJobs, host_photo: hostPhoto, guest_photo: guestP,
          formats_submitted: Object.keys(renderJobs),
          formats_failed: errors.length ? errors : undefined,
        }, { headers: CORS })
      }
      // All failed — return the actual Shotstack error
      const errDetail = errors.join(' | ')
      await sb.from('podcast_videos').update({ status: 'failed', current_step: `Shotstack error: ${errDetail.slice(0,200)}` }).eq('id', job.id)
      return NextResponse.json({ error: `Shotstack rendering failed: ${errDetail}`, video_job_id: job.id }, { status: 400, headers: CORS })
    }

    // ── HeyGen fallback ──────────────────────────────────────────────────────
    const hk = km.HEYGEN_KEY
    if (hk) {
      const fmt = (formats as string[]).includes('9:16') ? '9:16' : '16:9'
      const r = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': hk },
        body: JSON.stringify({
          video_inputs: [{ character: { type: 'talking_photo', talking_photo_url: hostPhoto },
            voice: { type: 'audio', audio_url: episode.audio_url },
            background: { type: 'image', url: bgUrl } }],
          dimension: fmt === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
          caption: true, title: episode.title?.slice(0, 80),
        }),
        signal: AbortSignal.timeout(25000),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d?.data?.video_id) {
        await sb.from('podcast_videos').update({ heygen_host_job_id: d.data.video_id, current_step: 'HeyGen rendering', progress_pct: 40 }).eq('id', job.id)
        return NextResponse.json({ success: true, video_job_id: job.id, engine: 'heygen', heygen_video_id: d.data.video_id }, { headers: CORS })
      }
      const heyErr = JSON.stringify(d).slice(0, 200)
      await sb.from('podcast_videos').update({ status: 'failed', current_step: `HeyGen error: ${heyErr}` }).eq('id', job.id)
      return NextResponse.json({ error: `HeyGen failed: ${heyErr}`, video_job_id: job.id }, { status: 400, headers: CORS })
    }

    return NextResponse.json({ error: 'No renderer. Add SHOTSTACK_KEY to system_api_keys.' }, { status: 400, headers: CORS })
  } catch (err: any) {
    console.error('[generate-video] fatal:', err)
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS })
  }
}
