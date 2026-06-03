import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*' }

const STUDIO_BACKGROUNDS: Record<string, string> = {
  dark_studio:    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80&fm=jpg',
  podcast_room:   'https://images.unsplash.com/photo-1478737270197-3a37b4c58e32?w=1920&q=80&fm=jpg',
  broadcast_desk: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=1920&q=80&fm=jpg',
  blue_office:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80&fm=jpg',
  dark_bokeh:     'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80&fm=jpg',
}

// Build Creatomate JSON source for studio composite video
function buildCreatomateSource(opts: {
  format: '16:9' | '9:16' | '1:1'
  audio_url: string
  host_photo: string
  guest_photo: string
  host_name: string
  guest_name: string
  episode_title: string
  portal_name: string
  accent_color: string
  bg_url: string
  duration: number
}) {
  const { format, audio_url, host_photo, guest_photo, host_name, guest_name,
          episode_title, portal_name, accent_color, bg_url, duration } = opts

  const isVertical = format === '9:16'
  const isSquare   = format === '1:1'
  const width      = isVertical ? 1080 : 1920
  const height     = isVertical ? 1920 : 1080
  const avatarSize = isVertical ? 360  : 320
  const avatarY    = isVertical ? '38%' : '42%'
  const titleSize  = isVertical ? 44 : 40
  const capSize    = isVertical ? 46 : 40

  return {
    output_format: 'mp4',
    width, height,
    frame_rate: 30,
    duration,
    background_color: '#0B0F19',
    elements: [
      // Studio background
      { type: 'image', source: bg_url, fit: 'cover', opacity: 0.35, width: '100%', height: '100%', x_alignment: '50%', y_alignment: '50%' },
      // Overlay
      { type: 'shape', shape: 'rectangle', fill_color: 'rgba(11,15,25,0.55)', width: '100%', height: '100%', x_alignment: '50%', y_alignment: '50%' },
      // Audio
      { type: 'audio', source: audio_url, duration, volume: 1 },
      // Portal name top
      { type: 'text', text: portal_name.toUpperCase(), font_size: 20, font_weight: '800', font_family: 'Inter', fill_color: accent_color, letter_spacing: '0.12em', x: '50%', y: isVertical ? '6%' : '5%', x_alignment: '50%', y_alignment: '0%', width: `${Math.round(width * 0.8)}px` },
      // Episode title
      { type: 'text', text: episode_title, font_size: titleSize, font_weight: '900', font_family: 'Inter', fill_color: '#FFFFFF', x: '50%', y: isVertical ? '16%' : '11%', x_alignment: '50%', y_alignment: '0%', width: `${Math.round(width * 0.82)}px`, text_wrap: true, line_height: 1.2 },
      // Host avatar
      { type: 'image', source: host_photo, width: avatarSize, height: avatarSize, x: isVertical ? '30%' : '28%', y: avatarY, x_alignment: '50%', y_alignment: '50%', border_radius: avatarSize / 2, border_width: 5, border_color: accent_color, fit: 'cover' },
      // Host label
      { type: 'text', text: host_name, font_size: 24, font_weight: '700', font_family: 'Inter', fill_color: '#FFFFFF', x: isVertical ? '30%' : '28%', x_alignment: '50%', y: avatarY, y_alignment: '0%', y_offset: (avatarSize / 2) + 14 },
      // Divider
      { type: 'shape', shape: 'rectangle', fill_color: `${accent_color}60`, width: 2, height: Math.round(avatarSize * 0.7), x: '50%', y: avatarY, x_alignment: '50%', y_alignment: '50%' },
      // Guest avatar
      { type: 'image', source: guest_photo, width: avatarSize, height: avatarSize, x: isVertical ? '70%' : '72%', y: avatarY, x_alignment: '50%', y_alignment: '50%', border_radius: avatarSize / 2, border_width: 5, border_color: '#818CF8', fit: 'cover' },
      // Guest label
      { type: 'text', text: guest_name, font_size: 24, font_weight: '700', font_family: 'Inter', fill_color: '#FFFFFF', x: isVertical ? '70%' : '72%', x_alignment: '50%', y: avatarY, y_alignment: '0%', y_offset: (avatarSize / 2) + 14 },
      // Caption strip bg
      { type: 'shape', shape: 'rectangle', fill_color: 'rgba(0,0,0,0.75)', width: '88%', height: isVertical ? 180 : 140, x: '50%', y: isVertical ? '74%' : '80%', x_alignment: '50%', y_alignment: '50%', border_radius: 12 },
      // Auto captions
      { type: 'subtitles', source: audio_url, x: '50%', y: isVertical ? '74%' : '80%', width: `${Math.round(width * 0.82)}px`, height: isVertical ? 170 : 130, x_alignment: '50%', y_alignment: '50%', font_size: capSize, font_weight: '700', font_family: 'Inter', fill_color: '#FFFFFF', line_height: 1.3, text_alignment: 'center', highlight_color: accent_color },
      // Bottom accent bar
      { type: 'shape', shape: 'rectangle', fill_color: accent_color, width: '100%', height: isVertical ? 8 : 6, x: '50%', y: '100%', x_alignment: '50%', y_alignment: '100%' },
    ]
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await req.json()
    const { episode_id, host_photo_url, guest_photo_url, studio_bg = 'dark_studio', formats = ['9:16', '16:9'] } = body

    // Get episode
    const { data: episode, error: epErr } = await supabase
      .from('podcast_scripts').select('*').eq('id', episode_id).single()
    if (epErr || !episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: CORS })

    // Get API keys
    const { data: keys } = await supabase
      .from('system_api_keys').select('key_name, key_value')
      .in('key_name', ['CREATOMATE_KEY', 'HEYGEN_KEY']).eq('is_active', true)
    const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

    // Get portal info
    const { data: site } = await supabase.from('news_sites').select('name, template_config').eq('slug', episode.site_slug).single()
    const accent = (site as any)?.template_config?.primary || '#10B981'
    const portalName = (site as any)?.name || episode.show_name || 'RepHuby'

    // Get avatars
    const { data: avatars } = await supabase.from('podcast_avatars').select('*').eq('site_slug', episode.site_slug).eq('is_active', true)
    const hostPhoto  = host_photo_url  || avatars?.find((a: any) => a.role === 'host')?.photo_url  || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fm=jpg'
    const guestPhoto = guest_photo_url || avatars?.find((a: any) => a.role === 'guest')?.photo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&fm=jpg'

    // Create job record
    const { data: job } = await supabase.from('podcast_videos').insert({
      episode_id, client_id: episode.client_id, site_slug: episode.site_slug,
      status: 'rendering', current_step: 'Submitting to renderer', progress_pct: 10,
      host_name: episode.host_name, guest_name: episode.guest_name,
      episode_title: episode.title, host_photo_url: hostPhoto, guest_photo_url: guestPhoto,
      studio_bg, portal_accent: accent, audio_url: episode.audio_url,
      duration_seconds: (episode.duration_minutes || 5) * 60,
    }).select().single()

    const duration = (episode.duration_minutes || 5) * 60
    const bgUrl = STUDIO_BACKGROUNDS[studio_bg] || STUDIO_BACKGROUNDS.dark_studio
    const renderJobs: Record<string, string> = {}

    // ── Try Creatomate first ──
    const creatomateKey = km.CREATOMATE_KEY
    if (creatomateKey && creatomateKey !== 'REPLACE_WITH_KEY') {
      for (const fmt of (formats as ('16:9' | '9:16' | '1:1')[])) {
        const source = buildCreatomateSource({
          format: fmt, audio_url: episode.audio_url,
          host_photo: hostPhoto, guest_photo: guestPhoto,
          host_name: episode.host_name || 'Host', guest_name: episode.guest_name || 'Guest',
          episode_title: episode.title, portal_name: portalName,
          accent_color: accent, bg_url: bgUrl, duration,
        })
        const r = await fetch('https://api.nextcut.io/v1/renders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${creatomateKey}` },
          body: JSON.stringify({ source }),
        })
        if (r.ok) {
          const d = await r.json()
          const jobId = Array.isArray(d) ? d[0]?.id : d?.id
          if (jobId) renderJobs[fmt] = jobId
        }
      }
      await supabase.from('podcast_videos').update({
        creatomate_169_id: renderJobs['16:9'] || null,
        creatomate_916_id: renderJobs['9:16'] || null,
        creatomate_11_id:  renderJobs['1:1']  || null,
        current_step: `Rendering ${Object.keys(renderJobs).length} format(s) via Creatomate`,
        progress_pct: 30,
      }).eq('id', (job as any).id)

      return NextResponse.json({ success: true, video_job_id: (job as any).id, engine: 'creatomate', render_jobs: renderJobs }, { headers: CORS })
    }

    // ── Fallback: HeyGen talking photo ──
    const heygenKey = km.HEYGEN_KEY
    if (heygenKey) {
      // Use HeyGen v2 video.generate with audio voice + avatar
      const heygenPayload = {
        video_inputs: [{
          character: { type: 'talking_photo', talking_photo_url: hostPhoto },
          voice: { type: 'audio', audio_url: episode.audio_url },
          background: { type: 'image', url: bgUrl },
        }],
        dimension: formats.includes('9:16') ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
        caption: true,
        title: episode.title?.slice(0, 80),
      }

      const heyRes = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': heygenKey },
        body: JSON.stringify(heygenPayload),
      })
      const heyData = await heyRes.json()

      if (heyRes.ok && heyData?.data?.video_id) {
        await supabase.from('podcast_videos').update({
          heygen_host_job_id: heyData.data.video_id,
          current_step: 'HeyGen generating talking head video',
          progress_pct: 40,
        }).eq('id', (job as any).id)
        return NextResponse.json({ success: true, video_job_id: (job as any).id, engine: 'heygen', heygen_video_id: heyData.data.video_id }, { headers: CORS })
      } else {
        // HeyGen failed — update job with error details
        await supabase.from('podcast_videos').update({
          status: 'failed',
          error_msg: `HeyGen: ${JSON.stringify(heyData).slice(0, 200)}`,
          current_step: 'Failed — add Creatomate key for full video',
        }).eq('id', (job as any).id)
        return NextResponse.json({
          error: 'No video renderer configured. Add CREATOMATE_KEY to system_api_keys.',
          heygen_response: heyData,
          video_job_id: (job as any).id,
        }, { status: 400, headers: CORS })
      }
    }

    return NextResponse.json({ error: 'No renderer available. Add CREATOMATE_KEY or ensure HEYGEN_KEY is active.' }, { status: 400, headers: CORS })

  } catch (e: any) {
    console.error('generate-video error', e)
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
