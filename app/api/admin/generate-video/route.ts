import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}

const BKGS: Record<string, string> = {
  dark_studio:    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80&fm=jpg',
  podcast_room:   'https://images.unsplash.com/photo-1478737270197-3a37b4c58e32?w=1920&q=80&fm=jpg',
  broadcast_desk: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=1920&q=80&fm=jpg',
  blue_office:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80&fm=jpg',
  dark_bokeh:     'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80&fm=jpg',
}

// ─── Guest avatar auto-selection ─────────────────────────────────────────────
const MALE_PHOTOS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&q=80&fm=jpg',
]
const FEMALE_PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&q=80&fm=jpg',
]
const FEMALE_NAMES = new Set(['sarah','emma','julia','lisa','maria','anna','natalie','sophie',
  'claire','jessica','jennifer','rachel','laura','emily','diana','olivia','priya','fatima',
  'aisha','sana','mei','yuki','clara','nina','hannah','grace','victoria','leila'])

function resolveGuestPhoto(name: string): string {
  const first = (name?.split(' ')[0] || '').toLowerCase()
  const pool = FEMALE_NAMES.has(first) ? FEMALE_PHOTOS : MALE_PHOTOS
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length
  return pool[hash]
}

// ─── Build Shotstack timeline ─────────────────────────────────────────────────
// POST https://api.shotstack.io/edit/stage/render  (sandbox – free, watermarked)
// POST https://api.shotstack.io/edit/v1/render     (production – paid)
// Auth: x-api-key: {key}
// Status: GET https://api.shotstack.io/edit/{env}/renders/{id}
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

  const isVert  = format === '9:16'
  const isSquare = format === '1:1'

  // Shotstack resolutions: hd=1280x720, 1080=1920x1080, portrait-hd=720x1280
  const resolution = isVert ? 'portrait-hd' : '1080'
  const aspectRatio = format === '9:16' ? '9:16' : format === '1:1' ? '1:1' : '16:9'

  // Positions: "center" with x/y offset (-1 to 1 relative)
  // For 16:9: host left (x=-0.27), CAM-MID both at center, guest right (x=0.27)
  // For 9:16: host top (y=0.2), guest bottom (y=-0.2)

  const tracks: any[] = []

  if (isVert) {
    // ── 9:16 vertical layout ──────────────────────────────────────────────
    tracks.push(
      // Host avatar (top)
      { clips: [{ asset: { type: 'image', src: host_photo }, start: 0, length: duration,
          position: 'center', offset: { x: 0, y: 0.22 }, scale: 0.38, fit: 'cover',
          border: { color: accent, width: 5, radius: 50 } }] },
      // Guest avatar (bottom)
      { clips: [{ asset: { type: 'image', src: guest_photo }, start: 0, length: duration,
          position: 'center', offset: { x: 0, y: -0.22 }, scale: 0.38, fit: 'cover',
          border: { color: '#818CF8', width: 5, radius: 50 } }] },
      // Host name
      { clips: [{ asset: { type: 'html',
          html: `<p style="color:white;font-family:'Inter',sans-serif;font-size:32px;font-weight:700;text-align:center;white-space:nowrap">${host_name} <span style="color:${accent};font-size:20px;font-weight:800;letter-spacing:0.1em">HOST</span></p>`,
          width: 700, height: 60, position: 'center' },
          start: 0, length: duration, position: 'center', offset: { x: 0, y: 0.05 } }] },
      // Guest name
      { clips: [{ asset: { type: 'html',
          html: `<p style="color:white;font-family:'Inter',sans-serif;font-size:32px;font-weight:700;text-align:center;white-space:nowrap">${guest_name} <span style="color:#818CF8;font-size:20px;font-weight:800;letter-spacing:0.1em">GUEST</span></p>`,
          width: 700, height: 60, position: 'center' },
          start: 0, length: duration, position: 'center', offset: { x: 0, y: -0.37 } }] },
    )
  } else {
    // ── 16:9 / 1:1 horizontal 3-camera layout ────────────────────────────
    const avatarScale = isSquare ? 0.22 : 0.20
    const midScale    = isSquare ? 0.18 : 0.17
    const xOff        = isSquare ? 0.24 : 0.28

    tracks.push(
      // Host avatar (left CAM-1)
      { clips: [{ asset: { type: 'image', src: host_photo }, start: 0, length: duration,
          position: 'center', offset: { x: -xOff, y: 0.10 }, scale: avatarScale, fit: 'cover',
          border: { color: accent, width: 5, radius: 50 } }] },
      // Host name (below host avatar)
      { clips: [{ asset: { type: 'html',
          html: `<p style="color:white;font-family:'Inter',sans-serif;font-size:22px;font-weight:700;text-align:center">${host_name}</p>`,
          width: 380, height: 40 },
          start: 0, length: duration, position: 'center', offset: { x: -xOff, y: -0.08 } }] },
      // Host mid (center-left small)
      { clips: [{ asset: { type: 'image', src: host_photo }, start: 0, length: duration,
          position: 'center', offset: { x: -0.08, y: 0.10 }, scale: midScale, fit: 'cover',
          opacity: 0.85, border: { color: accent, width: 3, radius: 50 } }] },
      // Guest mid (center-right small)
      { clips: [{ asset: { type: 'image', src: guest_photo }, start: 0, length: duration,
          position: 'center', offset: { x: 0.08, y: 0.10 }, scale: midScale, fit: 'cover',
          opacity: 0.85, border: { color: '#818CF8', width: 3, radius: 50 } }] },
      // Guest avatar (right CAM-2)
      { clips: [{ asset: { type: 'image', src: guest_photo }, start: 0, length: duration,
          position: 'center', offset: { x: xOff, y: 0.10 }, scale: avatarScale, fit: 'cover',
          border: { color: '#818CF8', width: 5, radius: 50 } }] },
      // Guest name
      { clips: [{ asset: { type: 'html',
          html: `<p style="color:white;font-family:'Inter',sans-serif;font-size:22px;font-weight:700;text-align:center">${guest_name}</p>`,
          width: 380, height: 40 },
          start: 0, length: duration, position: 'center', offset: { x: xOff, y: -0.08 } }] },
      // CAM labels
      { clips: [{ asset: { type: 'html',
          html: `<div style="display:flex;gap:120px;font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:${accent}"><span>● CAM 1</span><span style="color:#94A3B8">● CAM MID</span><span style="color:#818CF8">● CAM 2</span></div>`,
          width: 600, height: 30 },
          start: 0, length: duration, position: 'center', offset: { x: 0, y: 0.32 } }] },
    )
  }

  // Common tracks (portal name, title, divider, accent bar)
  tracks.push(
    // Portal name (top)
    { clips: [{ asset: { type: 'html',
        html: `<p style="color:${accent};font-family:'Inter',sans-serif;font-size:${isVert?22:18}px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;text-align:center">${portal_name}</p>`,
        width: isVert ? 900 : 1400, height: 40 },
        start: 0, length: duration, position: 'top', offset: { y: -0.04 } }] },
    // Episode title
    { clips: [{ asset: { type: 'html',
        html: `<p style="color:white;font-family:'Inter',sans-serif;font-size:${isVert?40:42}px;font-weight:900;text-align:center;line-height:1.2">${episode_title.slice(0, 80)}</p>`,
        width: isVert ? 940 : 1400, height: isVert ? 180 : 140 },
        start: 0, length: duration, position: 'top', offset: { y: isVert ? -0.13 : -0.11 } }] },
    // Background (bottom layer)
    { clips: [{ asset: { type: 'image', src: bg_url },
        start: 0, length: duration, fit: 'cover', opacity: 0.25 }] },
  )

  return {
    timeline: {
      soundtrack: { src: audio_url, volume: 1, effect: 'fadeOut' },
      background: '#080C14',
      tracks,
    },
    output: {
      format: 'mp4',
      resolution,
      aspectRatio,
      fps: 30,
    },
  }
}

// ─── POST /api/admin/generate-video ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await req.json()
    const { episode_id, host_photo_url, guest_photo_url,
            studio_bg = 'dark_studio', formats = ['9:16', '16:9'] } = body

    if (!episode_id) return NextResponse.json({ error: 'episode_id required' }, { status: 400, headers: CORS })

    const { data: episode, error: epErr } = await supabase
      .from('podcast_scripts').select('*').eq('id', episode_id).single()
    if (epErr || !episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: CORS })
    if (!episode.audio_url) return NextResponse.json({ error: 'Episode has no audio. Generate audio first.' }, { status: 400, headers: CORS })

    // API keys
    const { data: keys } = await supabase.from('system_api_keys')
      .select('key_name, key_value').eq('is_active', true)
    const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

    // Portal config
    const { data: site } = await supabase.from('news_sites')
      .select('name, template_config').eq('slug', episode.site_slug).single()
    const accent     = (site as any)?.template_config?.primary || '#10B981'
    const portalName = (site as any)?.name || episode.show_name || 'RepHuby'

    // Avatars
    const { data: avatarRows } = await supabase.from('podcast_avatars')
      .select('*').eq('site_slug', episode.site_slug).eq('is_active', true)
    const hostPhoto = host_photo_url
      || avatarRows?.find((a: any) => a.role === 'host')?.photo_url
      || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fm=jpg'
    const guestName = episode.guest_name || 'Guest'
    const guestPhoto = guest_photo_url
      || resolveGuestPhoto(guestName)

    const bgUrl    = BKGS[studio_bg] || BKGS.dark_studio
    const duration = (episode.duration_minutes || 5) * 60

    // Create DB job record
    const { data: job, error: jobErr } = await supabase.from('podcast_videos').insert({
      episode_id, client_id: episode.client_id || null, site_slug: episode.site_slug,
      status: 'rendering', current_step: 'Submitting to Shotstack renderer', progress_pct: 10,
      host_name: episode.host_name || 'Host', guest_name: guestName,
      episode_title: episode.title, host_photo_url: hostPhoto, guest_photo_url: guestPhoto,
      studio_bg, portal_accent: accent, audio_url: episode.audio_url, duration_seconds: duration,
    }).select('id').single()

    if (jobErr || !job) return NextResponse.json({ error: `DB insert failed: ${jobErr?.message}` }, { status: 500, headers: CORS })

    // ── Try Shotstack first ────────────────────────────────────────────────
    const shotstackKey = km.SHOTSTACK_KEY
    if (shotstackKey && shotstackKey.length > 5) {
      // sandbox = free (watermarked) | v1 = production (paid)
      const env = km.SHOTSTACK_ENV || 'stage'  // set to 'v1' for production
      const renderJobs: Record<string, string> = {}
      const errors: string[] = []

      const results = await Promise.allSettled(
        (formats as ('16:9' | '9:16' | '1:1')[]).map(async (fmt) => {
          const edit = buildShotstackEdit({
            format: fmt, audio_url: episode.audio_url,
            host_photo: hostPhoto, guest_photo: guestPhoto,
            host_name: episode.host_name || 'Host', guest_name: guestName,
            episode_title: episode.title, portal_name: portalName,
            accent, bg_url: bgUrl, duration,
          })
          const r = await fetch(`https://api.shotstack.io/edit/${env}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': shotstackKey },
            body: JSON.stringify(edit),
            signal: AbortSignal.timeout(20000),
          })
          const text = await r.text()
          if (!r.ok) throw new Error(`Shotstack ${r.status}: ${text.slice(0, 200)}`)
          const d = JSON.parse(text)
          const id = d?.response?.id
          if (!id) throw new Error(`No render ID: ${text.slice(0, 100)}`)
          return { fmt, id }
        })
      )

      for (const r of results) {
        if (r.status === 'fulfilled') renderJobs[r.value.fmt] = r.value.id
        else errors.push((r as any).reason?.message || 'Unknown')
      }

      if (Object.keys(renderJobs).length > 0) {
        await supabase.from('podcast_videos').update({
          creatomate_169_id: renderJobs['16:9'] || null,
          creatomate_916_id: renderJobs['9:16'] || null,
          creatomate_11_id:  renderJobs['1:1']  || null,
          current_step: `Rendering ${Object.keys(renderJobs).length} format(s) via Shotstack (${env})`,
          progress_pct: 30,
        }).eq('id', job.id)

        return NextResponse.json({
          success: true, video_job_id: job.id, engine: 'shotstack',
          env, render_jobs: renderJobs, host_photo: hostPhoto, guest_photo: guestPhoto,
          formats_submitted: Object.keys(renderJobs),
          formats_failed: errors.length > 0 ? errors : undefined,
        }, { headers: CORS })
      }
      // Fall through to HeyGen if all Shotstack failed
      console.warn('Shotstack failed for all formats:', errors)
    }

    // ── HeyGen fallback (single talking-head) ─────────────────────────────
    const heygenKey = km.HEYGEN_KEY
    if (heygenKey) {
      const fmt = (formats as string[]).includes('9:16') ? '9:16' : '16:9'
      const payload = {
        video_inputs: [{
          character: { type: 'talking_photo', talking_photo_url: hostPhoto },
          voice: { type: 'audio', audio_url: episode.audio_url },
          background: { type: 'image', url: bgUrl },
        }],
        dimension: fmt === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
        caption: true,
        title: episode.title?.slice(0, 80),
      }
      const heyRes = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': heygenKey },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      })
      const heyData = await heyRes.json().catch(() => ({}))
      if (heyRes.ok && heyData?.data?.video_id) {
        await supabase.from('podcast_videos').update({
          heygen_host_job_id: heyData.data.video_id,
          current_step: 'HeyGen generating talking-head video (single host, auto-captions)',
          progress_pct: 40,
        }).eq('id', job.id)
        return NextResponse.json({
          success: true, video_job_id: job.id, engine: 'heygen',
          heygen_video_id: heyData.data.video_id, host_photo: hostPhoto,
          note: 'Single host view via HeyGen. Add SHOTSTACK_KEY for 3-camera composite.',
        }, { headers: CORS })
      }
      // HeyGen also failed
      await supabase.from('podcast_videos').update({
        status: 'failed',
        current_step: `HeyGen error: ${JSON.stringify(heyData).slice(0, 100)}`,
      }).eq('id', job.id)
      return NextResponse.json({
        error: 'Video rendering failed. Add SHOTSTACK_KEY (shotstack.io) to system_api_keys.',
        heygen_error: heyData, video_job_id: job.id,
      }, { status: 400, headers: CORS })
    }

    return NextResponse.json({
      error: 'No video renderer available. Add SHOTSTACK_KEY (shotstack.io) — free sandbox at shotstack.io/register',
      video_job_id: job.id,
    }, { status: 400, headers: CORS })

  } catch (err: any) {
    console.error('generate-video fatal:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500, headers: CORS })
  }
}
