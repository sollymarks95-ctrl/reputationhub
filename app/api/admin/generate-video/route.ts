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

const BKGS: Record<string, { url: string; overlay: string; opacity: number }> = {
  dark_studio:    { url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80&fm=jpg', overlay: '#000000', opacity: 0.65 },
  podcast_room:   { url: 'https://images.unsplash.com/photo-1478737270197-3a37b4c58e32?w=1920&q=80&fm=jpg', overlay: '#05102A', opacity: 0.55 },
  broadcast_desk: { url: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=1920&q=80&fm=jpg', overlay: '#000A1E', opacity: 0.60 },
  blue_office:    { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80&fm=jpg', overlay: '#001432', opacity: 0.52 },
  dark_bokeh:     { url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80&fm=jpg', overlay: '#050014', opacity: 0.70 },
}

const MALE_P = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&fm=jpg',
]
const FEMALE_P = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fm=jpg',
]
const FEMALE = new Set(['sarah','emma','julia','lisa','maria','anna','natalie','sophie','claire','jessica','rachel','laura','emily'])
function autoGuest(name: string) {
  const first = (name?.split(' ')[0] || '').toLowerCase()
  const pool = FEMALE.has(first) ? FEMALE_P : MALE_P
  return pool[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length]
}

// ─── Build Shotstack live podcast edit ───────────────────────────────────────
function buildEdit(opts: {
  format: '16:9' | '9:16' | '1:1'
  audioUrl: string
  hostPhoto: string
  guestPhoto: string
  hostName: string
  guestName: string
  title: string
  portal: string
  accent: string
  studioBg: string
  duration: number
}) {
  const { format, audioUrl, hostPhoto, guestPhoto, hostName, guestName,
          title, portal, accent, studioBg, duration } = opts

  const bg       = BKGS[studioBg] || BKGS.dark_studio
  const isVert   = format === '9:16'
  const dur      = Math.min(duration, 180) // 3 min cap — keeps clip count sane
  const CUT      = 18                      // seconds per camera shot
  const safeTitle = title.slice(0, 72).replace(/[<>"'&]/g, ' ')
  const safePortal = portal.toUpperCase().replace(/[<>"'&]/g, ' ')
  const safeHost   = hostName.replace(/[<>"'&]/g, ' ')
  const safeGuest  = guestName.replace(/[<>"'&]/g, ' ')

  // ─── Compute aspect ratio string (NOT a function ref) ───────────────────
  const ar: string = format === '9:16' ? '9:16' : format === '1:1' ? '1:1' : '16:9'

  // ─── Camera cut list ─────────────────────────────────────────────────────
  type Cut = { t: number; len: number; hero: 'host' | 'guest' }
  const cuts: Cut[] = []
  let t = 0; let hostHero = true
  while (t < dur) {
    cuts.push({ t, len: Math.min(CUT, dur - t), hero: hostHero ? 'host' : 'guest' })
    t += CUT; hostHero = !hostHero
  }

  // transition helper — NO duration property (not valid in Shotstack)
  const wipe = (i: number, hero: 'host' | 'guest') =>
    i > 0 ? { transition: { in: hero === 'host' ? 'wipeRight' : 'wipeLeft' } } : {}
  const fade = (i: number) =>
    i > 0 ? { transition: { in: 'fade' } } : {}

  const tracks: any[] = []

  if (!isVert) {
    // ── 16:9 broadcast layout ────────────────────────────────────────────
    // Hero: centre-left large. PIP: centre-right small. Lower third + LIVE badge.

    tracks.push(
      // Hero camera (alternates host/guest with wipe transition)
      { clips: cuts.map((c, i) => ({
          asset: { type: 'image', src: c.hero === 'host' ? hostPhoto : guestPhoto, fit: 'cover' },
          start: c.t, length: c.len,
          position: 'center', offset: { x: -0.10, y: 0.02 }, scale: 0.68,
          ...wipe(i, c.hero),
        }))
      },

      // PIP camera (opposite person, fades)
      { clips: cuts.map((c, i) => ({
          asset: { type: 'image', src: c.hero === 'host' ? guestPhoto : hostPhoto, fit: 'cover' },
          start: c.t, length: c.len,
          position: 'center', offset: { x: 0.36, y: 0.02 }, scale: 0.24,
          ...fade(i),
        }))
      },

      // Lower third: name card switches with camera
      { clips: cuts.map((c, i) => {
          const isH  = c.hero === 'host'
          const name = isH ? safeHost : safeGuest
          const role = isH ? 'HOST' : 'GUEST'
          const col  = isH ? accent : '#818CF8'
          return {
            asset: {
              type: 'html',
              html: `<div style="border-left:5px solid ${col};background:rgba(0,0,0,0.82);padding:10px 32px 10px 14px"><p style="color:#fff;font-family:Arial,sans-serif;font-size:22px;font-weight:900;margin:0">${name}</p><p style="color:${col};font-family:Arial,sans-serif;font-size:12px;font-weight:700;margin:0;letter-spacing:0.1em">${role} - ${safePortal}</p></div>`,
              width: 460, height: 68, background: 'transparent',
            },
            start: c.t, length: c.len,
            position: 'bottomLeft', offset: { x: 0.08, y: 0.15 },
            ...fade(i),
          }
        })
      },

      // CAM label on hero (updates per cut)
      { clips: cuts.map((c, i) => ({
          asset: {
            type: 'html',
            html: `<p style="color:#fff;font-family:monospace;font-size:12px;font-weight:700;background:rgba(0,0,0,0.75);padding:3px 8px">LIVE CAM ${c.hero === 'host' ? '1' : '2'}</p>`,
            width: 110, height: 26, background: 'transparent',
          },
          start: c.t, length: c.len,
          position: 'bottomLeft', offset: { x: 0.08, y: 0.32 },
          ...fade(i),
        }))
      },

      // Episode title strip — static, full duration
      { clips: [{ asset: {
            type: 'html',
            html: `<div style="background:rgba(0,0,0,0.85);border-top:3px solid ${accent};padding:8px 24px"><p style="color:#fff;font-family:Arial,sans-serif;font-size:17px;font-weight:700;margin:0;text-align:center">${safeTitle}</p></div>`,
            width: 1560, height: 50, background: 'transparent',
          }, start: 0, length: dur, position: 'bottom', offset: { y: 0.02 } }]
      },

      // LIVE badge + portal name — static
      { clips: [{ asset: {
            type: 'html',
            html: `<div style="display:flex;align-items:center;gap:12px"><div style="background:#DC2626;padding:5px 11px;display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;background:#fff;border-radius:50%"></div><span style="color:#fff;font-family:Arial,sans-serif;font-size:13px;font-weight:900">LIVE</span></div><span style="color:${accent};font-family:Arial,sans-serif;font-size:14px;font-weight:800">${safePortal}</span></div>`,
            width: 400, height: 36, background: 'transparent',
          }, start: 0, length: dur, position: 'topLeft', offset: { x: 0.03, y: -0.04 } }]
      },

      // Accent bar
      { clips: [{ asset: { type: 'html', html: `<div style="background:${accent};width:100%;height:5px"></div>`, width: 1920, height: 6, background: 'transparent' },
          start: 0, length: dur, position: 'bottom' }]
      },
    )

  } else {
    // ── 9:16 Reels layout ────────────────────────────────────────────────
    tracks.push(
      // Hero (full screen, alternates)
      { clips: cuts.map((c, i) => ({
          asset: { type: 'image', src: c.hero === 'host' ? hostPhoto : guestPhoto, fit: 'cover' },
          start: c.t, length: c.len,
          position: 'center', offset: { x: 0, y: 0.12 }, scale: 0.88,
          ...wipe(i, c.hero),
        }))
      },

      // PIP (bottom-right)
      { clips: cuts.map((c, i) => ({
          asset: { type: 'image', src: c.hero === 'host' ? guestPhoto : hostPhoto, fit: 'cover' },
          start: c.t, length: c.len,
          position: 'bottomRight', offset: { x: -0.04, y: 0.16 }, scale: 0.26,
          ...fade(i),
        }))
      },

      // Lower third name card
      { clips: cuts.map((c, i) => {
          const isH  = c.hero === 'host'
          const name = isH ? safeHost : safeGuest
          const role = isH ? 'HOST' : 'GUEST'
          const col  = isH ? accent : '#818CF8'
          return {
            asset: {
              type: 'html',
              html: `<div style="border-left:5px solid ${col};background:rgba(0,0,0,0.85);padding:10px 20px 10px 14px"><p style="color:#fff;font-family:Arial,sans-serif;font-size:28px;font-weight:900;margin:0">${name}</p><p style="color:${col};font-family:Arial,sans-serif;font-size:14px;font-weight:700;margin:0;letter-spacing:0.08em">${role}</p></div>`,
              width: 700, height: 76, background: 'transparent',
            },
            start: c.t, length: c.len,
            position: 'center', offset: { x: 0, y: -0.22 },
            ...fade(i),
          }
        })
      },

      // Episode title
      { clips: [{ asset: {
            type: 'html',
            html: `<div style="background:rgba(0,0,0,0.85);border-top:3px solid ${accent};padding:12px 20px"><p style="color:#fff;font-family:Arial,sans-serif;font-size:26px;font-weight:900;margin:0;text-align:center;line-height:1.3">${safeTitle.slice(0, 55)}</p></div>`,
            width: 940, height: 106, background: 'transparent',
          }, start: 0, length: dur, position: 'bottom', offset: { y: 0.16 } }]
      },

      // LIVE + portal name
      { clips: [{ asset: {
            type: 'html',
            html: `<div style="display:flex;align-items:center;gap:10px"><div style="background:#DC2626;padding:5px 11px;display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;background:#fff;border-radius:50%"></div><span style="color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:900">LIVE</span></div><span style="color:${accent};font-family:Arial,sans-serif;font-size:15px;font-weight:800">${safePortal}</span></div>`,
            width: 500, height: 38, background: 'transparent',
          }, start: 0, length: dur, position: 'topLeft', offset: { x: 0.04, y: -0.04 } }]
      },

      // Accent bar
      { clips: [{ asset: { type: 'html', html: `<div style="background:${accent};width:100%;height:6px"></div>`, width: 1080, height: 8, background: 'transparent' },
          start: 0, length: dur, position: 'bottom' }]
      },
    )
  }

  // Background + dark overlay (last 2 tracks = bottom visual layers)
  tracks.push(
    // Dark overlay
    { clips: [{ asset: { type: 'image', src: bg.url, fit: 'cover' },
        start: 0, length: dur, opacity: bg.opacity }]
    },
    // Background image (full opacity, drawn first)
    { clips: [{ asset: { type: 'image', src: bg.url, fit: 'cover' },
        start: 0, length: dur, opacity: 1.0 }]
    },
  )

  return {
    timeline: {
      soundtrack: { src: audioUrl, effect: 'fadeOut' },
      background: '#080C14',
      tracks,
    },
    output: {
      format: 'mp4',
      resolution: 'hd',
      aspectRatio: ar,    // ← plain string, NOT a function reference
      fps: 25,
    },
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const body = await req.json()
    const { episode_id, host_photo_url, guest_photo_url, studio_bg = 'dark_studio', formats = ['9:16', '16:9'] } = body

    if (!episode_id) return NextResponse.json({ error: 'episode_id required' }, { status: 400, headers: CORS })

    const { data: ep } = await sb.from('podcast_scripts').select('*').eq('id', episode_id).single()
    if (!ep) return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: CORS })
    if (!ep.audio_url) return NextResponse.json({ error: 'Generate audio first' }, { status: 400, headers: CORS })

    const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
    const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

    const { data: site } = await sb.from('news_sites').select('name,template_config').eq('slug', ep.site_slug).single()
    const accent  = (site as any)?.template_config?.primary || '#10B981'
    const portal  = (site as any)?.name || 'RepHuby'

    const { data: avRows } = await sb.from('podcast_avatars').select('*').eq('site_slug', ep.site_slug).eq('is_active', true)
    const hostPhoto = host_photo_url  || avRows?.find((a: any) => a.role === 'host')?.photo_url
      || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fm=jpg'
    const guestName = ep.guest_name || 'Guest'
    const guestP    = guest_photo_url || autoGuest(guestName)
    const duration  = (ep.duration_minutes || 5) * 60

    const { data: job, error: jobErr } = await sb.from('podcast_videos').insert({
      episode_id, client_id: ep.client_id || null, site_slug: ep.site_slug,
      status: 'rendering', current_step: 'Submitting to Shotstack…', progress_pct: 10,
      host_name: ep.host_name || 'Host', guest_name: guestName,
      episode_title: ep.title, host_photo_url: hostPhoto, guest_photo_url: guestP,
      studio_bg, portal_accent: accent, audio_url: ep.audio_url, duration_seconds: duration,
    }).select('id').single()

    if (jobErr || !job) return NextResponse.json({ error: `DB: ${jobErr?.message}` }, { status: 500, headers: CORS })

    const ssKey = km.SHOTSTACK_KEY
    const ssEnv = km.SHOTSTACK_ENV || 'v1'

    if (ssKey?.length > 5) {
      const renderJobs: Record<string, string> = {}
      const errors: string[] = []

      const results = await Promise.allSettled(
        (formats as ('16:9' | '9:16' | '1:1')[]).map(async (fmt) => {
          const edit = buildEdit({
            format: fmt, audioUrl: ep.audio_url,
            hostPhoto, guestPhoto: guestP,
            hostName: ep.host_name || 'Host', guestName,
            title: ep.title, portal, accent, studioBg: studio_bg, duration,
          })
          const r = await fetch(`https://api.shotstack.io/edit/${ssEnv}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': ssKey },
            body: JSON.stringify(edit),
            signal: AbortSignal.timeout(25000),
          })
          const text = await r.text()
          if (!r.ok) {
            // Log full error so we can read it
            console.error(`[shotstack:${fmt}] ${r.status}`, text.slice(0, 800))
            throw new Error(`HTTP ${r.status}: ${text.slice(0, 400)}`)
          }
          const d = JSON.parse(text)
          const id = d?.response?.id
          if (!id) throw new Error(`No render ID: ${text.slice(0, 200)}`)
          console.log(`[shotstack:${fmt}] submitted render ${id}`)
          return { fmt, id }
        })
      )

      for (const r of results) {
        if (r.status === 'fulfilled') renderJobs[r.value.fmt] = r.value.id
        else errors.push((r as any).reason?.message || 'error')
      }

      if (Object.keys(renderJobs).length > 0) {
        await sb.from('podcast_videos').update({
          creatomate_169_id: renderJobs['16:9'] || null,
          creatomate_916_id: renderJobs['9:16'] || null,
          creatomate_11_id:  renderJobs['1:1']  || null,
          current_step: `Rendering ${Object.keys(renderJobs).length}/${formats.length} format(s) — 3-camera cuts every ${18}s`,
          progress_pct: 35,
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
      const bgUrl = (BKGS[studio_bg] || BKGS.dark_studio).url
      const r = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': hk },
        body: JSON.stringify({
          video_inputs: [{ character: { type: 'talking_photo', talking_photo_url: hostPhoto },
            voice: { type: 'audio', audio_url: ep.audio_url },
            background: { type: 'image', url: bgUrl } }],
          dimension: fmt === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
          caption: true,
        }),
        signal: AbortSignal.timeout(25000),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d?.data?.video_id) {
        await sb.from('podcast_videos').update({ heygen_host_job_id: d.data.video_id, current_step: 'HeyGen rendering', progress_pct: 40 }).eq('id', job.id)
        return NextResponse.json({ success: true, video_job_id: job.id, engine: 'heygen' }, { headers: CORS })
      }
      const he = JSON.stringify(d).slice(0, 200)
      await sb.from('podcast_videos').update({ status: 'failed', current_step: `HeyGen: ${he}` }).eq('id', job.id)
      return NextResponse.json({ error: `HeyGen failed: ${he}`, video_job_id: job.id }, { status: 400, headers: CORS })
    }

    return NextResponse.json({ error: 'No renderer. Add SHOTSTACK_KEY to system_api_keys.' }, { status: 400, headers: CORS })

  } catch (err: any) {
    console.error('[generate-video] fatal:', err)
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS })
  }
}
