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
const FEMALE = new Set(['sarah','emma','julia','lisa','maria','anna','natalie','sophie',
  'claire','jessica','rachel','laura','emily','diana','priya','fatima'])
function autoGuest(name: string) {
  const first = (name?.split(' ')[0] || '').toLowerCase()
  const pool = FEMALE.has(first) ? FEMALE_P : MALE_P
  return pool[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length]
}

// ─── Upload a photo URL to HeyGen to get a talking_photo_id ─────────────────
async function uploadTalkingPhoto(photoUrl: string, heygenKey: string): Promise<string | null> {
  try {
    const r = await fetch('https://api.heygen.com/v1/talking_photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': heygenKey },
      body: JSON.stringify({ url: photoUrl }),
      signal: AbortSignal.timeout(15000),
    })
    const d = await r.json()
    console.log('[heygen:upload]', JSON.stringify(d).slice(0, 200))
    return d?.data?.talking_photo_id || null
  } catch (e: any) {
    console.error('[heygen:upload] error:', e.message)
    return null
  }
}

// ─── Submit HeyGen talking head video job ────────────────────────────────────
async function submitHeygenVideo(
  talkingPhotoId: string,
  audioUrl: string,
  heygenKey: string,
  format: '9:16' | '16:9'
): Promise<string | null> {
  try {
    const dim = format === '9:16'
      ? { width: 720, height: 1280 }
      : { width: 1280, height: 720 }
    const r = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': heygenKey },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'talking_photo',
            talking_photo_id: talkingPhotoId,
            scale: 1.0,
          },
          voice: {
            type: 'audio',
            audio_url: audioUrl,
          },
          background: { type: 'color', value: '#111827' },
        }],
        dimension: dim,
        caption: false,
      }),
      signal: AbortSignal.timeout(20000),
    })
    const d = await r.json()
    console.log('[heygen:submit]', JSON.stringify(d).slice(0, 200))
    return d?.data?.video_id || null
  } catch (e: any) {
    console.error('[heygen:submit] error:', e.message)
    return null
  }
}

// ─── Shotstack composite: takes two actual video URLs from HeyGen ─────────────
// Real talking heads now! Host video + Guest video combined into broadcast layout
function buildShotstackComposite(opts: {
  format: '16:9' | '9:16' | '1:1'
  audioUrl: string
  hostVideoUrl: string
  guestVideoUrl: string
  hostName: string
  guestName: string
  title: string
  portal: string
  accent: string
  studioBg: string
  duration: number
}) {
  const { format, audioUrl, hostVideoUrl, guestVideoUrl, hostName, guestName,
          title, portal, accent, studioBg, duration } = opts

  const bgUrl   = BKGS[studioBg] || BKGS.dark_studio
  const isVert  = format === '9:16'
  const dur     = Math.min(duration, 90) // 90s — tight social format
  const CUT     = 18
  const ar: string = format === '9:16' ? '9:16' : format === '1:1' ? '1:1' : '16:9'

  // Camera cut schedule
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

  const safeTitle  = title.slice(0, 72).replace(/[<>"'&]/g, ' ')
  const safePortal = portal.toUpperCase().replace(/[<>"'&]/g, ' ')
  const safeHost   = hostName.replace(/[<>"'&]/g, ' ')
  const safeGuest  = guestName.replace(/[<>"'&]/g, ' ')

  const tracks: any[] = []

  if (!isVert) {
    // ── 16:9 — Real talking head broadcast layout ─────────────────────────
    // Hero: actual HeyGen talking head video, switches between host/guest
    // PIP: the other person's talking head, small corner
    tracks.push(
      // HERO talking head video (alternates)
      { clips: cuts.map((c, i) => ({
          asset: {
            type: 'video',
            src: c.hero === 'host' ? hostVideoUrl : guestVideoUrl,
            trim: c.t,
          },
          start: c.t, length: c.len,
          position: 'center', offset: { x: -0.10, y: 0.02 }, scale: 0.68,
          ...wipe(i, c.hero),
        }))
      },
      // PIP talking head video (opposite person)
      { clips: cuts.map((c, i) => ({
          asset: {
            type: 'video',
            src: c.hero === 'host' ? guestVideoUrl : hostVideoUrl,
            trim: c.t,
          },
          start: c.t, length: c.len,
          position: 'center', offset: { x: 0.36, y: 0.02 }, scale: 0.24,
          ...fade(i),
        }))
      },
      // Lower third — name card switches with camera
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
      // Episode title strip
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
    )
  } else {
    // ── 9:16 Reels — Full screen hero talking head ────────────────────────
    tracks.push(
      { clips: cuts.map((c, i) => ({
          asset: {
            type: 'video',
            src: c.hero === 'host' ? hostVideoUrl : guestVideoUrl,
            trim: c.t,
          },
          start: c.t, length: c.len,
          position: 'center', offset: { x: 0, y: 0.12 }, scale: 0.88,
          ...wipe(i, c.hero),
        }))
      },
      { clips: cuts.map((c, i) => ({
          asset: {
            type: 'video',
            src: c.hero === 'host' ? guestVideoUrl : hostVideoUrl,
            trim: c.t,
          },
          start: c.t, length: c.len,
          position: 'bottomRight', offset: { x: -0.04, y: 0.16 }, scale: 0.26,
          ...fade(i),
        }))
      },
      { clips: cuts.map((c, i) => {
          const isH = c.hero === 'host'
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
      { clips: [{ asset: {
            type: 'html',
            html: `<div style="background:rgba(0,0,0,0.85);border-top:3px solid ${accent};padding:12px 20px"><p style="color:#fff;font-family:Arial,sans-serif;font-size:26px;font-weight:900;margin:0;text-align:center;line-height:1.3">${safeTitle.slice(0,55)}</p></div>`,
            width: 940, height: 106, background: 'transparent',
          }, start: 0, length: dur, position: 'bottom', offset: { y: 0.16 } }]
      },
      { clips: [{ asset: {
            type: 'html',
            html: `<div style="display:flex;align-items:center;gap:10px"><div style="background:#DC2626;padding:5px 11px;display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;background:#fff;border-radius:50%"></div><span style="color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:900">LIVE</span></div><span style="color:${accent};font-family:Arial,sans-serif;font-size:15px;font-weight:800">${safePortal}</span></div>`,
            width: 500, height: 38, background: 'transparent',
          }, start: 0, length: dur, position: 'topLeft', offset: { x: 0.04, y: -0.04 } }]
      },
      { clips: [{ asset: { type: 'html', html: `<div style="background:${accent};width:100%;height:6px"></div>`, width: 1080, height: 8, background: 'transparent' },
          start: 0, length: dur, position: 'bottom' }]
      },
    )
  }

  // Background (subtle — behind the talking head videos)
  tracks.push({
    clips: [{ asset: { type: 'image', src: bgUrl },
        start: 0, length: dur, opacity: 0.15 }]
  })

  return {
    timeline: {
      soundtrack: { src: audioUrl, effect: 'fadeOut' },
      background: '#111827',
      tracks,
    },
    output: { format: 'mp4', resolution: 'hd', aspectRatio: ar, fps: 25 },
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

    // Create job record
    const { data: job, error: jobErr } = await sb.from('podcast_videos').insert({
      episode_id, client_id: ep.client_id || null, site_slug: ep.site_slug,
      status: 'rendering', pipeline_phase: 'heygen_upload',
      current_step: 'Step 1/3: Uploading avatars to HeyGen…', progress_pct: 10,
      host_name: ep.host_name || 'Host', guest_name: guestName,
      episode_title: ep.title, host_photo_url: hostPhoto, guest_photo_url: guestP,
      studio_bg, portal_accent: accent, audio_url: ep.audio_url, duration_seconds: duration,
    }).select('id').single()

    if (jobErr || !job) return NextResponse.json({ error: `DB: ${jobErr?.message}` }, { status: 500, headers: CORS })

    const hk = km.HEYGEN_KEY
    if (!hk) return NextResponse.json({ error: 'HEYGEN_KEY not in system_api_keys' }, { status: 400, headers: CORS })

    // ── Step 1: Upload photos to HeyGen → get talking_photo_ids ─────────────
    // Check cache first (podcast_avatars table)
    const hostAvRow  = avRows?.find((a: any) => a.role === 'host')
    const cachedHostId = hostAvRow?.heygen_talking_photo_id

    let hostTalkingPhotoId = cachedHostId
    if (!hostTalkingPhotoId) {
      hostTalkingPhotoId = await uploadTalkingPhoto(hostPhoto, hk)
      if (hostTalkingPhotoId && hostAvRow?.id) {
        // Cache for next time
        await sb.from('podcast_avatars').update({ heygen_talking_photo_id: hostTalkingPhotoId }).eq('id', hostAvRow.id)
      }
    }

    const guestTalkingPhotoId = await uploadTalkingPhoto(guestP, hk)

    if (!hostTalkingPhotoId || !guestTalkingPhotoId) {
      const errMsg = `HeyGen photo upload failed — host: ${!!hostTalkingPhotoId}, guest: ${!!guestTalkingPhotoId}`
      await sb.from('podcast_videos').update({ status: 'failed', current_step: errMsg }).eq('id', job.id)
      return NextResponse.json({ error: errMsg, video_job_id: job.id }, { status: 400, headers: CORS })
    }

    // ── Step 2: Submit HeyGen talking head video jobs ────────────────────────
    const fmt = (formats as string[]).includes('16:9') ? '16:9' : '9:16'
    await sb.from('podcast_videos').update({
      pipeline_phase: 'heygen_render',
      current_step: 'Step 2/3: HeyGen generating talking head videos…', progress_pct: 25,
      heygen_host_talking_photo_id: hostTalkingPhotoId,
      heygen_guest_talking_photo_id: guestTalkingPhotoId,
    }).eq('id', job.id)

    const [hostJobId, guestJobId] = await Promise.all([
      submitHeygenVideo(hostTalkingPhotoId, ep.audio_url, hk, fmt as '16:9' | '9:16'),
      submitHeygenVideo(guestTalkingPhotoId, ep.audio_url, hk, fmt as '16:9' | '9:16'),
    ])

    if (!hostJobId || !guestJobId) {
      const errMsg = `HeyGen video submit failed — host: ${!!hostJobId}, guest: ${!!guestJobId}`
      await sb.from('podcast_videos').update({ status: 'failed', current_step: errMsg }).eq('id', job.id)
      return NextResponse.json({ error: errMsg, video_job_id: job.id }, { status: 400, headers: CORS })
    }

    await sb.from('podcast_videos').update({
      heygen_host_job_id:  hostJobId,
      heygen_guest_job_id: guestJobId,
      current_step: 'Step 2/3: HeyGen rendering talking heads (takes 5-15 min)…', progress_pct: 30,
    }).eq('id', job.id)

    return NextResponse.json({
      success: true,
      video_job_id: job.id,
      engine: 'heygen → shotstack',
      phase: 'heygen_render',
      heygen_host_job_id:  hostJobId,
      heygen_guest_job_id: guestJobId,
      note: 'HeyGen rendering both talking heads. Poll /api/admin/video-status to track. Shotstack composite auto-triggers when both complete.',
    }, { headers: CORS })

  } catch (err: any) {
    console.error('[generate-video] fatal:', err)
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS })
  }
}
