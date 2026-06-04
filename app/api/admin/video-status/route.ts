import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

const BKGS: Record<string, string> = {
  dark_studio:    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80&fm=jpg',
  podcast_room:   'https://images.unsplash.com/photo-1478737270197-3a37b4c58e32?w=1920&q=80&fm=jpg',
  broadcast_desk: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=1920&q=80&fm=jpg',
  blue_office:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80&fm=jpg',
  dark_bokeh:     'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80&fm=jpg',
}

async function buildShotstackComposite(job: any, km: Record<string,string>) {
  const ssKey = km.SHOTSTACK_KEY
  const ssEnv = km.SHOTSTACK_ENV || 'v1'
  const accent  = job.portal_accent || '#10B981'
  const bgUrl   = BKGS[job.studio_bg] || BKGS.dark_studio
  const dur     = 90 // 90s social clip
  const CUT     = 18
  const ar      = '16:9'

  type Cut = { t: number; len: number; hero: 'host' | 'guest' }
  const cuts: Cut[] = []
  let t = 0; let hostHero = true
  while (t < dur) {
    cuts.push({ t, len: Math.min(CUT, dur - t), hero: hostHero ? 'host' : 'guest' })
    t += CUT; hostHero = !hostHero
  }

  const wipe = (i: number, hero: 'host' | 'guest') =>
    i > 0 ? { transition: { in: hero === 'host' ? 'wipeRight' : 'wipeLeft' } } : {}
  const fade = (i: number) =>
    i > 0 ? { transition: { in: 'fade' } } : {}

  const safeTitle  = (job.episode_title || '').slice(0, 72).replace(/[<>"'&]/g, ' ')
  const safePortal = (job.site_slug || 'rephuby').toUpperCase().replace(/[<>"'&]/g, ' ')
  const safeHost   = (job.host_name || 'Host').replace(/[<>"'&]/g, ' ')
  const safeGuest  = (job.guest_name || 'Guest').replace(/[<>"'&]/g, ' ')
  const hv = job.heygen_host_video_url
  const gv = job.heygen_guest_video_url

  const tracks: any[] = [
    // Hero talking head video
    { clips: cuts.map((c, i) => ({
        asset: { type: 'video', src: c.hero === 'host' ? hv : gv, trim: c.t },
        start: c.t, length: c.len,
        position: 'center', offset: { x: -0.10, y: 0.02 }, scale: 0.68,
        ...wipe(i, c.hero),
      }))
    },
    // PIP talking head
    { clips: cuts.map((c, i) => ({
        asset: { type: 'video', src: c.hero === 'host' ? gv : hv, trim: c.t },
        start: c.t, length: c.len,
        position: 'center', offset: { x: 0.36, y: 0.02 }, scale: 0.24,
        ...fade(i),
      }))
    },
    // Lower third
    { clips: cuts.map((c, i) => {
        const isH = c.hero === 'host'
        const name = isH ? safeHost : safeGuest
        const role = isH ? 'HOST' : 'GUEST'
        const col  = isH ? accent : '#818CF8'
        return {
          asset: {
            type: 'html',
            html: `<div style="border-left:5px solid ${col};background:rgba(0,0,0,0.85);padding:10px 32px 10px 14px"><p style="color:#fff;font-family:Arial,sans-serif;font-size:22px;font-weight:900;margin:0">${name}</p><p style="color:${col};font-family:Arial,sans-serif;font-size:12px;font-weight:700;margin:0;letter-spacing:0.1em">${role} - ${safePortal}</p></div>`,
            width: 460, height: 68, background: 'transparent',
          },
          start: c.t, length: c.len,
          position: 'bottomLeft', offset: { x: 0.08, y: 0.15 },
          ...fade(i),
        }
      })
    },
    // Episode title
    { clips: [{ asset: {
          type: 'html',
          html: `<div style="background:rgba(0,0,0,0.85);border-top:3px solid ${accent};padding:8px 24px"><p style="color:#fff;font-family:Arial,sans-serif;font-size:17px;font-weight:700;margin:0;text-align:center">${safeTitle}</p></div>`,
          width: 1560, height: 50, background: 'transparent',
        }, start: 0, length: dur, position: 'bottom', offset: { y: 0.02 } }]
    },
    // LIVE badge
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
    // Background
    { clips: [{ asset: { type: 'image', src: bgUrl }, start: 0, length: dur, opacity: 0.15 }] },
  ]

  const edit = {
    timeline: {
      soundtrack: { src: job.audio_url, effect: 'fadeOut' },
      background: '#111827',
      tracks,
    },
    output: { format: 'mp4', resolution: 'hd', aspectRatio: ar, fps: 25 },
  }

  const r = await fetch(`https://api.shotstack.io/edit/${ssEnv}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ssKey },
    body: JSON.stringify(edit),
    signal: AbortSignal.timeout(25000),
  })
  const text = await r.text()
  if (!r.ok) {
    console.error('[shotstack:composite]', r.status, text.slice(0, 400))
    return null
  }
  const id = JSON.parse(text)?.response?.id
  console.log('[shotstack:composite] submitted', id)
  return id
}

export async function GET(req: NextRequest) {
  const job_id = req.nextUrl.searchParams.get('job_id')
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400, headers: CORS })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: job } = await sb.from('podcast_videos').select('*').eq('id', job_id).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404, headers: CORS })

  if (job.status === 'ready' || job.status === 'failed') {
    return NextResponse.json({ ...job, done: true }, { headers: CORS })
  }

  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

  const phase = job.pipeline_phase || 'heygen_render'

  // ── Phase: HeyGen rendering ───────────────────────────────────────────────
  if (phase === 'heygen_render') {
    const hk = km.HEYGEN_KEY
    if (!hk) return NextResponse.json({ ...job, done: false }, { headers: CORS })

    const [hostStatus, guestStatus] = await Promise.all([
      pollHeyGen(job.heygen_host_job_id, hk),
      pollHeyGen(job.heygen_guest_job_id, hk),
    ])

    const hostDone  = hostStatus?.status === 'completed'
    const guestDone = guestStatus?.status === 'completed'
    const hostFail  = hostStatus?.status === 'failed'
    const guestFail = guestStatus?.status === 'failed'

    if (hostFail || guestFail) {
      await sb.from('podcast_videos').update({
        status: 'failed',
        current_step: `HeyGen failed — host: ${hostStatus?.status}, guest: ${guestStatus?.status}`,
      }).eq('id', job_id)
      return NextResponse.json({ ...job, status: 'failed', done: true }, { headers: CORS })
    }

    const pct = Math.round(30 + (((hostDone ? 1 : 0) + (guestDone ? 1 : 0)) / 2) * 20)
    if (!hostDone || !guestDone) {
      await sb.from('podcast_videos').update({
        progress_pct: pct,
        current_step: `Step 2/3: HeyGen rendering… host: ${hostStatus?.status || '?'}, guest: ${guestStatus?.status || '?'}`,
      }).eq('id', job_id)
      return NextResponse.json({ ...job, progress_pct: pct, done: false }, { headers: CORS })
    }

    // Both HeyGen jobs done → save video URLs → submit Shotstack
    const hostUrl  = hostStatus?.video_url
    const guestUrl = guestStatus?.video_url

    await sb.from('podcast_videos').update({
      heygen_host_video_url:  hostUrl,
      heygen_guest_video_url: guestUrl,
      pipeline_phase: 'shotstack',
      current_step: 'Step 3/3: Submitting to Shotstack compositor…', progress_pct: 55,
    }).eq('id', job_id)

    // Submit Shotstack composite
    const updatedJob = { ...job, heygen_host_video_url: hostUrl, heygen_guest_video_url: guestUrl }
    const ssRenderId = await buildShotstackComposite(updatedJob, km)

    if (!ssRenderId) {
      await sb.from('podcast_videos').update({ status: 'failed', current_step: 'Shotstack composite failed' }).eq('id', job_id)
      return NextResponse.json({ ...job, status: 'failed', done: true }, { headers: CORS })
    }

    await sb.from('podcast_videos').update({
      creatomate_169_id: ssRenderId,
      current_step: 'Step 3/3: Shotstack compositing 3-camera layout…', progress_pct: 65,
    }).eq('id', job_id)

    return NextResponse.json({ ...job, pipeline_phase: 'shotstack', progress_pct: 65, done: false }, { headers: CORS })
  }

  // ── Phase: Shotstack compositing ─────────────────────────────────────────
  if (phase === 'shotstack' && job.creatomate_169_id) {
    const ssKey = km.SHOTSTACK_KEY
    const ssEnv = km.SHOTSTACK_ENV || 'v1'

    try {
      const r = await fetch(`https://api.shotstack.io/edit/${ssEnv}/renders/${job.creatomate_169_id}`, {
        headers: { 'x-api-key': ssKey },
        signal: AbortSignal.timeout(8000),
      })
      if (!r.ok) return NextResponse.json({ ...job, done: false }, { headers: CORS })
      const d = await r.json()
      const status = d?.response?.status
      const url    = d?.response?.url

      if (status === 'done' && url) {
        await sb.from('podcast_videos').update({
          video_169_url: url, status: 'ready', pipeline_phase: 'complete',
          current_step: '✅ Done — 3-camera talking head video ready!', progress_pct: 100,
        }).eq('id', job_id)
        const { data: upd } = await sb.from('podcast_videos').select('*').eq('id', job_id).single()
        return NextResponse.json({ ...upd, done: true }, { headers: CORS })
      }
      if (status === 'failed') {
        await sb.from('podcast_videos').update({ status: 'failed', current_step: 'Shotstack composite failed' }).eq('id', job_id)
        return NextResponse.json({ ...job, status: 'failed', done: true }, { headers: CORS })
      }
    } catch {}
  }

  return NextResponse.json({ ...job, done: false }, { headers: CORS })
}

async function pollHeyGen(videoId: string | null, key: string) {
  if (!videoId) return null
  try {
    const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': key },
      signal: AbortSignal.timeout(8000),
    })
    const d = await r.json()
    return d?.data || null
  } catch { return null }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
