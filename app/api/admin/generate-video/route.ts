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

// ─── Background themes ───────────────────────────────────────────────────────
const BKGS: Record<string, { url: string, overlay: string, opacity: number }> = {
  dark_studio:    { url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80&fm=jpg', overlay: '#000000', opacity: 0.68 },
  podcast_room:   { url: 'https://images.unsplash.com/photo-1478737270197-3a37b4c58e32?w=1920&q=80&fm=jpg', overlay: '#05102A', opacity: 0.58 },
  broadcast_desk: { url: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=1920&q=80&fm=jpg', overlay: '#000A1E', opacity: 0.62 },
  blue_office:    { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80&fm=jpg', overlay: '#001432', opacity: 0.55 },
  dark_bokeh:     { url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80&fm=jpg', overlay: '#050014', opacity: 0.72 },
}

// ─── Guest avatar pool ───────────────────────────────────────────────────────
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
  return pool[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length]
}

// ─── 3-Camera live podcast builder ──────────────────────────────────────────
// Real camera cuts: hero alternates host/guest every CUT_INTERVAL seconds
// PIP (picture-in-picture): other person, bottom-right corner
// Lower thirds: name card updates with each camera switch
// Broadcast chrome: ● LIVE badge, CAM number, portal name, episode title
function buildLivePodcast(opts: {
  format: '16:9' | '9:16' | '1:1'
  audio_url: string
  host_photo: string
  guest_photo: string
  host_name: string
  guest_name: string
  episode_title: string
  portal_name: string
  accent: string
  studio_bg: string
  duration: number
}) {
  const { format, audio_url, host_photo, guest_photo, host_name, guest_name,
          episode_title, portal_name, accent, studio_bg, duration } = opts

  const bg      = BKGS[studio_bg] || BKGS.dark_studio
  const isVert  = format === '9:16'
  const isSquare = format === '1:1'
  const dur     = Math.min(duration, 240) // cap 4 min so JSON stays manageable
  const CUT     = 20 // seconds per camera shot

  // Build alternating cut list
  type Cut = { t: number; len: number; hero: 'host' | 'guest' }
  const cuts: Cut[] = []
  let t = 0; let heroIsHost = true
  while (t < dur) {
    cuts.push({ t, len: Math.min(CUT, dur - t), hero: heroIsHost ? 'host' : 'guest' })
    t += CUT; heroIsHost = !heroIsHost
  }

  // Shorthand for switching transition direction
  const camTransition = (i: number, hero: 'host' | 'guest') =>
    i > 0 ? { transition: { in: hero === 'host' ? 'wipeRight' : 'wipeLeft', duration: 0.4 } } : {}

  const fadeIn = (i: number) => i > 0 ? { transition: { in: 'fade', duration: 0.3 } } : {}

  const tracks: any[] = []

  if (!isVert) {
    // ── 16:9 / 1:1 — Broadcast news desk layout ────────────────────────────
    //
    //  ┌─────────────────────────────────────────────────────────┐
    //  │ ●LIVE  NEX-WIRE                         CAM 1   HH:MM  │
    //  │                                                          │
    //  │         ┌──────────────────────┐   ┌──────────┐        │
    //  │         │                      │   │          │        │
    //  │         │   HERO CAMERA        │   │ PIP CAM  │        │
    //  │         │ (host or guest, big) │   │ (other)  │        │
    //  │         │                      │   │          │        │
    //  │         └──────────────────────┘   └──────────┘        │
    //  │                                                          │
    //  │  ▎ James Hart                          HOST             │
    //  │  ▎ Nex-Wire Global Trade Intelligence                   │
    //  │  ─────────────────────────────────────────────────────  │
    //  │  BRICS Payment Rail: De-Dollarization Reality Check     │
    //  └─────────────────────────────────────────────────────────┘

    const heroX    = isSquare ? -0.07 : -0.10
    const heroY    = 0.02
    const heroSc   = isSquare ? 0.62 : 0.68
    const pipX     = isSquare ?  0.34 :  0.36
    const pipSc    = isSquare ? 0.26  : 0.24

    // Layer: Hero camera (alternating, main subject)
    tracks.push({
      clips: cuts.map((c, i) => ({
        asset: { type: 'image', src: c.hero === 'host' ? host_photo : guest_photo, fit: 'cover' },
        start: c.t, length: c.len,
        position: 'center', offset: { x: heroX, y: heroY }, scale: heroSc,
        ...camTransition(i, c.hero),
      }))
    })

    // Layer: PIP camera (opposite person, bottom-right)
    tracks.push({
      clips: cuts.map((c, i) => ({
        asset: { type: 'image', src: c.hero === 'host' ? guest_photo : host_photo, fit: 'cover' },
        start: c.t, length: c.len,
        position: 'center', offset: { x: pipX, y: heroY }, scale: pipSc,
        ...fadeIn(i),
      }))
    })

    // Layer: PIP label (CAM 1 / CAM 2)
    tracks.push({
      clips: cuts.map((c, i) => ({
        asset: {
          type: 'html',
          html: `<p style="color:white;font-family:'Courier New',monospace;font-size:12px;font-weight:700;background:rgba(0,0,0,0.7);padding:3px 8px;border-radius:2px">● ${c.hero === 'host' ? 'CAM 2' : 'CAM 1'}</p>`,
          width: 90, height: 28, background: 'transparent',
        },
        start: c.t, length: c.len,
        position: 'center', offset: { x: pipX, y: heroY + pipSc * 0.38 + 0.01 },
        ...fadeIn(i),
      }))
    })

    // Layer: Lower third name card (changes with camera)
    tracks.push({
      clips: cuts.map((c, i) => {
        const isH   = c.hero === 'host'
        const name  = isH ? host_name : guest_name
        const role  = isH ? 'HOST' : 'GUEST'
        const color = isH ? accent : '#818CF8'
        return {
          asset: {
            type: 'html',
            html: `<div style="border-left:5px solid ${color};background:linear-gradient(90deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0) 100%);padding:10px 40px 10px 16px">
              <p style="color:white;font-family:Arial,sans-serif;font-size:${isSquare?20:22}px;font-weight:900;margin:0;text-shadow:0 1px 4px rgba(0,0,0,0.8)">${name}</p>
              <p style="color:${color};font-family:Arial,sans-serif;font-size:12px;font-weight:700;margin:0;letter-spacing:0.1em;margin-top:2px">${role} · ${portal_name.toUpperCase()}</p>
            </div>`,
            width: 480, height: 72, background: 'transparent',
          },
          start: c.t, length: c.len,
          position: 'bottomLeft', offset: { x: 0.08, y: 0.17 },
          ...fadeIn(i),
        }
      })
    })

    // Layer: Hero CAM label (top of hero frame)
    tracks.push({
      clips: cuts.map((c, i) => ({
        asset: {
          type: 'html',
          html: `<p style="color:white;font-family:'Courier New',monospace;font-size:12px;font-weight:700;background:rgba(0,0,0,0.75);padding:3px 8px;border-radius:2px">● ${c.hero === 'host' ? 'CAM 1' : 'CAM 2'}</p>`,
          width: 90, height: 28, background: 'transparent',
        },
        start: c.t, length: c.len,
        position: 'center', offset: { x: heroX - heroSc * 0.38, y: heroY + heroSc * 0.38 + 0.01 },
        ...fadeIn(i),
      }))
    })

    // Layer: Episode title strip (bottom)
    tracks.push({
      clips: [{ asset: {
        type: 'html',
        html: `<div style="background:rgba(0,0,0,0.82);padding:8px 24px;border-top:2px solid ${accent}">
          <p style="color:white;font-family:Arial,sans-serif;font-size:${isSquare?16:18}px;font-weight:700;margin:0;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${episode_title.slice(0,80)}</p>
        </div>`,
        width: isSquare ? 900 : 1600, height: 52, background: 'transparent',
      }, start: 0, length: dur, position: 'bottom', offset: { y: 0.02 } }]
    })

    // Layer: LIVE badge + portal name (top-left)
    tracks.push({
      clips: [{ asset: {
        type: 'html',
        html: `<div style="display:flex;align-items:center;gap:12px">
          <div style="background:#DC2626;padding:5px 12px;border-radius:3px;display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;background:white;border-radius:50%"></div>
            <span style="color:white;font-family:Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:0.1em">LIVE</span>
          </div>
          <span style="color:${accent};font-family:Arial,sans-serif;font-size:14px;font-weight:800;letter-spacing:0.08em;text-shadow:0 1px 4px rgba(0,0,0,0.8)">${portal_name.toUpperCase()}</span>
        </div>`,
        width: 420, height: 36, background: 'transparent',
      }, start: 0, length: dur, position: 'topLeft', offset: { x: 0.03, y: -0.04 } }]
    })

    // Layer: Colour accent bar (bottom edge)
    tracks.push({
      clips: [{ asset: { type: 'html',
        html: `<div style="background:${accent};width:100%;height:5px"></div>`,
        width: 1920, height: 6, background: 'transparent',
      }, start: 0, length: dur, position: 'bottom' }]
    })

  } else {
    // ── 9:16 vertical — Reels / TikTok layout ──────────────────────────────
    //
    //  ┌───────────────────────┐
    //  │  ●LIVE  NEX-WIRE      │
    //  │                       │
    //  │  ┌─────────────────┐  │
    //  │  │                 │  │
    //  │  │  HERO CAMERA    │  │  ← alternates host/guest
    //  │  │  (large)        │  │
    //  │  │                 │  │
    //  │  └─────────────────┘  │
    //  │                       │
    //  │  ▎ James Hart   CAM1  │  ← lower third + cam label
    //  │  ▎ HOST               │
    //  │                       │
    //  │  ┌───────────────┐    │
    //  │  │  Episode title│    │
    //  │  └───────────────┘    │
    //  │          ┌────────┐   │
    //  │          │ PIP    │   │  ← small bottom-right PIP
    //  │          └────────┘   │
    //  └───────────────────────┘

    // Hero (alternating, fills most of the screen)
    tracks.push({
      clips: cuts.map((c, i) => ({
        asset: { type: 'image', src: c.hero === 'host' ? host_photo : guest_photo, fit: 'cover' },
        start: c.t, length: c.len,
        position: 'center', offset: { x: 0, y: 0.15 }, scale: 0.85,
        ...camTransition(i, c.hero),
      }))
    })

    // PIP (small bottom-right)
    tracks.push({
      clips: cuts.map((c, i) => ({
        asset: { type: 'image', src: c.hero === 'host' ? guest_photo : host_photo, fit: 'cover' },
        start: c.t, length: c.len,
        position: 'bottomRight', offset: { x: -0.05, y: 0.14 }, scale: 0.24,
        ...fadeIn(i),
      }))
    })

    // Lower third (name + role)
    tracks.push({
      clips: cuts.map((c, i) => {
        const isH = c.hero === 'host'
        const name = isH ? host_name : guest_name
        const role = isH ? 'HOST' : 'GUEST'
        const color = isH ? accent : '#818CF8'
        return {
          asset: {
            type: 'html',
            html: `<div style="border-left:5px solid ${color};background:rgba(0,0,0,0.85);padding:10px 20px 10px 14px">
              <p style="color:white;font-family:Arial,sans-serif;font-size:28px;font-weight:900;margin:0">${name}</p>
              <p style="color:${color};font-family:Arial,sans-serif;font-size:14px;font-weight:700;margin:0;letter-spacing:0.1em">${role} · ${portal_name.toUpperCase()}</p>
            </div>`,
            width: 700, height: 76, background: 'transparent',
          },
          start: c.t, length: c.len,
          position: 'center', offset: { x: 0, y: -0.22 },
          ...fadeIn(i),
        }
      })
    })

    // Episode title
    tracks.push({
      clips: [{ asset: {
        type: 'html',
        html: `<div style="background:rgba(0,0,0,0.85);padding:12px 20px;border-top:3px solid ${accent}">
          <p style="color:white;font-family:Arial,sans-serif;font-size:28px;font-weight:900;margin:0;text-align:center;line-height:1.3">${episode_title.slice(0,60)}</p>
        </div>`,
        width: 900, height: 110, background: 'transparent',
      }, start: 0, length: dur, position: 'bottom', offset: { y: 0.16 } }]
    })

    // LIVE + portal name
    tracks.push({
      clips: [{ asset: {
        type: 'html',
        html: `<div style="display:flex;align-items:center;gap:10px">
          <div style="background:#DC2626;padding:5px 12px;border-radius:3px;display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;background:white;border-radius:50%"></div>
            <span style="color:white;font-family:Arial,sans-serif;font-size:14px;font-weight:900;letter-spacing:0.1em">LIVE</span>
          </div>
          <span style="color:${accent};font-family:Arial,sans-serif;font-size:15px;font-weight:800;letter-spacing:0.08em">${portal_name.toUpperCase()}</span>
        </div>`,
        width: 500, height: 38, background: 'transparent',
      }, start: 0, length: dur, position: 'topLeft', offset: { x: 0.04, y: -0.04 } }]
    })

    // Bottom accent bar
    tracks.push({
      clips: [{ asset: { type: 'html',
        html: `<div style="background:${accent};width:100%;height:6px"></div>`,
        width: 1080, height: 8, background: 'transparent',
      }, start: 0, length: dur, position: 'bottom' }]
    })
  }

  // ── Overlay (dark tint — applied before talent layers) ──
  tracks.push({
    clips: [{ asset: { type: 'html',
      html: `<div style="background:${bg.overlay};width:100%;height:100%;opacity:${bg.opacity}"></div>`,
      width: isVert ? 1080 : 1920, height: isVert ? 1920 : 1080, background: 'transparent',
    }, start: 0, length: dur, position: 'center', opacity: bg.opacity }]
  })

  // ── Background (bottom layer) ──
  tracks.push({
    clips: [{ asset: { type: 'image', src: bg.url, fit: 'cover' },
      start: 0, length: dur, position: 'center', opacity: 1 }]
  })

  return {
    timeline: {
      soundtrack: { src: audio_url, effect: 'fadeOut' },
      background: '#080C14',
      tracks, // Shotstack renders tracks top→bottom; last track is visually bottom
    },
    output: {
      format: 'mp4',
      resolution: 'hd',        // 1280×720 (or 720×1280 for portrait)
      aspectRatio,
      fps: 25,
    },
  }

  function aspectRatio() { return format === '9:16' ? '9:16' : format === '1:1' ? '1:1' : '16:9' }
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const body = await req.json()
    const { episode_id, host_photo_url, guest_photo_url, studio_bg = 'dark_studio', formats = ['9:16', '16:9'] } = body

    if (!episode_id) return NextResponse.json({ error: 'episode_id required' }, { status: 400, headers: CORS })

    const { data: episode } = await sb.from('podcast_scripts').select('*').eq('id', episode_id).single()
    if (!episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: CORS })
    if (!episode.audio_url) return NextResponse.json({ error: 'Generate audio first' }, { status: 400, headers: CORS })

    const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
    const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

    const { data: site } = await sb.from('news_sites').select('name,template_config').eq('slug', episode.site_slug).single()
    const accent     = (site as any)?.template_config?.primary || '#10B981'
    const portalName = (site as any)?.name || 'RepHuby'

    const { data: avRows } = await sb.from('podcast_avatars').select('*').eq('site_slug', episode.site_slug).eq('is_active', true)
    const hostPhoto  = host_photo_url  || avRows?.find((a: any) => a.role === 'host')?.photo_url
      || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fm=jpg'
    const guestName  = episode.guest_name || 'Guest'
    const guestP     = guest_photo_url || guestPhoto(guestName)
    const duration   = (episode.duration_minutes || 5) * 60

    const { data: job, error: jobErr } = await sb.from('podcast_videos').insert({
      episode_id, client_id: episode.client_id || null, site_slug: episode.site_slug,
      status: 'rendering', current_step: 'Building 3-camera live broadcast…', progress_pct: 10,
      host_name: episode.host_name || 'Host', guest_name: guestName,
      episode_title: episode.title, host_photo_url: hostPhoto, guest_photo_url: guestP,
      studio_bg, portal_accent: accent, audio_url: episode.audio_url, duration_seconds: duration,
    }).select('id').single()

    if (jobErr || !job) return NextResponse.json({ error: `DB error: ${jobErr?.message}` }, { status: 500, headers: CORS })

    const ssKey = km.SHOTSTACK_KEY
    const ssEnv = km.SHOTSTACK_ENV || 'v1'

    if (ssKey?.length > 5) {
      const renderJobs: Record<string, string> = {}
      const errors: string[] = []

      const results = await Promise.allSettled(
        (formats as ('16:9' | '9:16' | '1:1')[]).map(async (fmt) => {
          const edit = buildLivePodcast({
            format: fmt, audio_url: episode.audio_url,
            host_photo: hostPhoto, guest_photo: guestP,
            host_name: episode.host_name || 'Host', guest_name: guestName,
            episode_title: episode.title, portal_name: portalName,
            accent, studio_bg, duration,
          })
          const r = await fetch(`https://api.shotstack.io/edit/${ssEnv}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': ssKey },
            body: JSON.stringify(edit),
            signal: AbortSignal.timeout(25000),
          })
          const text = await r.text()
          if (!r.ok) throw new Error(`Shotstack ${fmt}: HTTP ${r.status} — ${text.slice(0, 300)}`)
          const id = JSON.parse(text)?.response?.id
          if (!id) throw new Error(`Shotstack ${fmt}: no render ID — ${text.slice(0, 200)}`)
          return { fmt, id }
        })
      )

      for (const r of results) {
        if (r.status === 'fulfilled') renderJobs[r.value.fmt] = r.value.id
        else { console.error('[video]', (r as any).reason?.message); errors.push((r as any).reason?.message || 'error') }
      }

      if (Object.keys(renderJobs).length > 0) {
        await sb.from('podcast_videos').update({
          creatomate_169_id: renderJobs['16:9'] || null,
          creatomate_916_id: renderJobs['9:16'] || null,
          creatomate_11_id:  renderJobs['1:1']  || null,
          current_step: `Rendering ${Object.keys(renderJobs).length}/${formats.length} format(s) — camera cuts every 20s`,
          progress_pct: 30,
        }).eq('id', job.id)
        return NextResponse.json({
          success: true, video_job_id: job.id, engine: `shotstack-${ssEnv}`,
          render_jobs: renderJobs, host_photo: hostPhoto, guest_photo: guestP,
          formats_submitted: Object.keys(renderJobs),
          ...(errors.length ? { formats_failed: errors } : {}),
        }, { headers: CORS })
      }
      const errMsg = errors.join(' | ')
      await sb.from('podcast_videos').update({ status: 'failed', current_step: errMsg.slice(0, 200) }).eq('id', job.id)
      return NextResponse.json({ error: `Shotstack failed: ${errMsg}`, video_job_id: job.id }, { status: 400, headers: CORS })
    }

    // HeyGen fallback
    const hk = km.HEYGEN_KEY
    if (hk) {
      const fmt = (formats as string[]).includes('9:16') ? '9:16' : '16:9'
      const bg  = BKGS[studio_bg] || BKGS.dark_studio
      const r   = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': hk },
        body: JSON.stringify({
          video_inputs: [{ character: { type: 'talking_photo', talking_photo_url: hostPhoto },
            voice: { type: 'audio', audio_url: episode.audio_url },
            background: { type: 'image', url: bg.url } }],
          dimension: fmt === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
          caption: true, title: episode.title?.slice(0, 80),
        }),
        signal: AbortSignal.timeout(25000),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d?.data?.video_id) {
        await sb.from('podcast_videos').update({ heygen_host_job_id: d.data.video_id, current_step: 'HeyGen rendering (single host)', progress_pct: 40 }).eq('id', job.id)
        return NextResponse.json({ success: true, video_job_id: job.id, engine: 'heygen', heygen_video_id: d.data.video_id }, { headers: CORS })
      }
      const he = JSON.stringify(d).slice(0, 200)
      await sb.from('podcast_videos').update({ status: 'failed', current_step: `HeyGen: ${he}` }).eq('id', job.id)
      return NextResponse.json({ error: `HeyGen failed: ${he}`, video_job_id: job.id }, { status: 400, headers: CORS })
    }

    return NextResponse.json({ error: 'No renderer. SHOTSTACK_KEY not in system_api_keys.' }, { status: 400, headers: CORS })
  } catch (err: any) {
    console.error('[generate-video] fatal:', err)
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS })
  }
}
