import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CORS = { 'Access-Control-Allow-Origin':'*' }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Studio backgrounds (free Pexels/Unsplash video URLs) ──
const STUDIO_BACKGROUNDS: Record<string, string> = {
  dark_studio:    'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_25fps.mp4',
  podcast_room:   'https://videos.pexels.com/video-files/4125584/4125584-uhd_2560_1440_30fps.mp4',
  broadcast_desk: 'https://videos.pexels.com/video-files/856975/856975-hd_1920_1080_25fps.mp4',
  blue_office:    'https://videos.pexels.com/video-files/1391599/1391599-hd_1920_1080_30fps.mp4',
  dark_bokeh:     'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_25fps.mp4',
}

// ── Build Creatomate source JSON for different formats ──
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
  script_lines: { speaker: string; text: string }[]
  duration: number
}) {
  const { format, audio_url, host_photo, guest_photo, host_name, guest_name,
          episode_title, portal_name, accent_color, bg_url, duration } = opts

  const isVertical  = format === '9:16'
  const isSquare    = format === '1:1'
  const width       = isVertical ? 1080 : isSquare ? 1080 : 1920
  const height      = isVertical ? 1920 : isSquare ? 1080 : 1080

  // Avatar layout positions
  const avatarSize  = isVertical ? 380 : isSquare ? 300 : 340
  const avatarY     = isVertical ? '38%' : '42%'
  const hostX       = isVertical ? '30%' : '28%'
  const guestX      = isVertical ? '70%' : '72%'
  const captionY    = isVertical ? '72%' : '80%'
  const titleY      = isVertical ? '18%' : '12%'
  const titleSize   = isVertical ? 44 : isSquare ? 38 : 42
  const captionSize = isVertical ? 46 : isSquare ? 38 : 42
  const nameSize    = isVertical ? 28 : isSquare ? 24 : 26

  return {
    output_format: 'mp4',
    width,
    height,
    frame_rate: 30,
    duration,
    background_color: '#0B0F19',
    elements: [
      // ── Studio background ──
      {
        type: 'video',
        source: bg_url,
        volume: 0,
        loop: true,
        fit: 'cover',
        opacity: 0.35,
        color_filter: 'dark',
        time: 0,
        duration,
      },
      // ── Dark gradient overlay ──
      {
        type: 'shape',
        shape: 'rectangle',
        fill_color: 'rgba(11,15,25,0.55)',
        width: '100%',
        height: '100%',
        x_alignment: '50%',
        y_alignment: '50%',
      },
      // ── Podcast audio ──
      {
        type: 'audio',
        source: audio_url,
        duration,
        volume: 1,
      },
      // ── Portal name (top) ──
      {
        type: 'text',
        text: portal_name.toUpperCase(),
        font_size: 22,
        font_weight: '800',
        font_family: 'Inter',
        fill_color: accent_color,
        letter_spacing: '0.12em',
        x_alignment: '50%',
        y_alignment: '0%',
        y: isVertical ? '6%' : '5%',
        x: '50%',
        width: `${width * 0.8}px`,
      },
      // ── Episode title ──
      {
        type: 'text',
        text: episode_title,
        font_size: titleSize,
        font_weight: '900',
        font_family: 'Inter',
        fill_color: '#FFFFFF',
        x_alignment: '50%',
        y_alignment: '0%',
        y: titleY,
        x: '50%',
        width: `${width * 0.82}px`,
        text_wrap: true,
        line_height: 1.2,
      },
      // ── Host avatar circle ──
      {
        type: 'image',
        source: host_photo,
        width: avatarSize,
        height: avatarSize,
        x: hostX,
        y: avatarY,
        x_alignment: '50%',
        y_alignment: '50%',
        border_radius: avatarSize / 2,
        border_width: 5,
        border_color: accent_color,
        fit: 'cover',
      },
      // ── Host name label ──
      {
        type: 'text',
        text: host_name,
        font_size: nameSize,
        font_weight: '700',
        font_family: 'Inter',
        fill_color: '#FFFFFF',
        x: hostX,
        x_alignment: '50%',
        y: avatarY,
        y_alignment: '0%',
        y_offset: (avatarSize / 2) + 14,
      },
      {
        type: 'text',
        text: 'HOST',
        font_size: nameSize - 8,
        font_weight: '800',
        font_family: 'Inter',
        fill_color: accent_color,
        letter_spacing: '0.1em',
        x: hostX,
        x_alignment: '50%',
        y: avatarY,
        y_alignment: '0%',
        y_offset: (avatarSize / 2) + 14 + nameSize + 4,
      },
      // ── Divider line ──
      {
        type: 'shape',
        shape: 'rectangle',
        fill_color: `${accent_color}60`,
        width: 2,
        height: avatarSize * 0.7,
        x: '50%',
        y: avatarY,
        x_alignment: '50%',
        y_alignment: '50%',
      },
      // ── Guest avatar circle ──
      {
        type: 'image',
        source: guest_photo,
        width: avatarSize,
        height: avatarSize,
        x: guestX,
        y: avatarY,
        x_alignment: '50%',
        y_alignment: '50%',
        border_radius: avatarSize / 2,
        border_width: 5,
        border_color: '#818CF8',
        fit: 'cover',
      },
      // ── Guest name label ──
      {
        type: 'text',
        text: guest_name,
        font_size: nameSize,
        font_weight: '700',
        font_family: 'Inter',
        fill_color: '#FFFFFF',
        x: guestX,
        x_alignment: '50%',
        y: avatarY,
        y_alignment: '0%',
        y_offset: (avatarSize / 2) + 14,
      },
      {
        type: 'text',
        text: 'GUEST',
        font_size: nameSize - 8,
        font_weight: '800',
        font_family: 'Inter',
        fill_color: '#818CF8',
        letter_spacing: '0.1em',
        x: guestX,
        x_alignment: '50%',
        y: avatarY,
        y_alignment: '0%',
        y_offset: (avatarSize / 2) + 14 + nameSize + 4,
      },
      // ── Caption background strip ──
      {
        type: 'shape',
        shape: 'rectangle',
        fill_color: 'rgba(0,0,0,0.75)',
        width: '88%',
        height: isVertical ? 180 : 140,
        x: '50%',
        y: captionY,
        x_alignment: '50%',
        y_alignment: '50%',
        border_radius: 12,
      },
      // ── Auto captions from audio ──
      {
        type: 'subtitles',
        source: audio_url,
        x: '50%',
        y: captionY,
        width: `${width * 0.82}px`,
        height: isVertical ? 170 : 130,
        x_alignment: '50%',
        y_alignment: '50%',
        font_size: captionSize,
        font_weight: '700',
        font_family: 'Inter',
        fill_color: '#FFFFFF',
        line_height: 1.3,
        text_alignment: 'center',
        highlight_color: accent_color,
      },
      // ── Bottom branding bar ──
      {
        type: 'shape',
        shape: 'rectangle',
        fill_color: accent_color,
        width: '100%',
        height: isVertical ? 8 : 6,
        x: '50%',
        y: '100%',
        x_alignment: '50%',
        y_alignment: '100%',
      },
    ]
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      episode_id,
      host_photo_url,
      guest_photo_url,
      studio_bg = 'dark_studio',
      formats = ['9:16', '16:9', '1:1'],
    } = body

    // ── 1. Fetch episode data ──
    const { data: episode, error: epErr } = await supabase
      .from('podcast_scripts')
      .select('*')
      .eq('id', episode_id)
      .single()

    if (epErr || !episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: CORS })

    // ── 2. Get API keys ──
    const { data: keys } = await supabase
      .from('system_api_keys')
      .select('key_name, key_value')
      .in('key_name', ['ELEVENLABS_KEY', 'CREATOMATE_KEY', 'HEYGEN_KEY'])
      .eq('is_active', true)

    const keyMap = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))
    const creatomateKey = keyMap.CREATOMATE_KEY

    if (!creatomateKey || creatomateKey === 'REPLACE_WITH_KEY') {
      return NextResponse.json({ error: 'Creatomate API key not configured. Add it in Settings → API Keys.' }, { status: 400, headers: CORS })
    }

    // ── 3. Get portal info ──
    const { data: site } = await supabase
      .from('news_sites')
      .select('name, template_config')
      .eq('slug', episode.site_slug)
      .single()

    const accentColor = (site as any)?.template_config?.primary || '#10B981'
    const portalName  = (site as any)?.name || episode.show_name || 'RepHuby'

    // ── 4. Get avatar photos ──
    const { data: avatars } = await supabase
      .from('podcast_avatars')
      .select('*')
      .eq('site_slug', episode.site_slug)
      .eq('is_active', true)

    const hostAvatar  = avatars?.find((a: any) => a.role === 'host')
    const guestAvatar = avatars?.find((a: any) => a.role === 'guest')

    const hostPhoto  = host_photo_url  || hostAvatar?.photo_url  || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fm=jpg'
    const guestPhoto = guest_photo_url || guestAvatar?.photo_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&fm=jpg'

    // ── 5. Create video job record ──
    const { data: videoJob, error: vjErr } = await supabase
      .from('podcast_videos')
      .insert({
        episode_id,
        client_id:      episode.client_id,
        site_slug:      episode.site_slug,
        status:         'compositing',
        current_step:   'Sending to Creatomate renderer',
        progress_pct:   20,
        host_name:      episode.host_name,
        guest_name:     episode.guest_name,
        episode_title:  episode.title,
        host_photo_url: hostPhoto,
        guest_photo_url: guestPhoto,
        studio_bg,
        portal_accent:  accentColor,
        audio_url:      episode.audio_url,
      })
      .select()
      .single()

    if (vjErr) throw new Error(vjErr.message)

    // ── 6. Parse script for lines ──
    const scriptLines: { speaker: string; text: string }[] = []
    const lines = (episode.script || '').split('\n').filter(Boolean)
    for (const line of lines) {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0 && colonIdx < 40) {
        const speaker = line.slice(0, colonIdx).trim()
        const text    = line.slice(colonIdx + 1).trim().replace(/\[.*?\]/g, '').trim()
        if (text) scriptLines.push({ speaker, text })
      }
    }

    const bgUrl      = STUDIO_BACKGROUNDS[studio_bg] || STUDIO_BACKGROUNDS.dark_studio
    const duration   = episode.duration_minutes ? episode.duration_minutes * 60 : 300 // default 5 min

    const commonOpts = {
      audio_url:     episode.audio_url,
      host_photo:    hostPhoto,
      guest_photo:   guestPhoto,
      host_name:     episode.host_name  || 'Host',
      guest_name:    episode.guest_name || 'Guest',
      episode_title: episode.title      || 'Episode',
      portal_name:   portalName,
      accent_color:  accentColor,
      bg_url:        bgUrl,
      script_lines:  scriptLines,
      duration,
    }

    // ── 7. Submit Creatomate renders ──
    const renderJobs: Record<string, string> = {}
    const formatMap: Record<string, string> = { '16:9': '16:9', '9:16': '9:16', '1:1': '1:1' }

    for (const fmt of (formats as ('16:9' | '9:16' | '1:1')[])) {
      if (!formatMap[fmt]) continue
      const source = buildCreatomateSource({ ...commonOpts, format: fmt as '16:9' | '9:16' | '1:1' })

      const renderRes = await fetch('https://api.creatomate.com/v1/renders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${creatomateKey}`,
        },
        body: JSON.stringify({ source }),
      })

      if (!renderRes.ok) {
        const errText = await renderRes.text()
        console.error('Creatomate error', renderRes.status, errText)
        continue
      }

      const renderData = await renderRes.json()
      const jobId = Array.isArray(renderData) ? renderData[0]?.id : renderData?.id
      if (jobId) renderJobs[fmt] = jobId
    }

    // ── 8. Save Creatomate job IDs ──
    await supabase
      .from('podcast_videos')
      .update({
        creatomate_169_id: renderJobs['16:9'] || null,
        creatomate_916_id: renderJobs['9:16'] || null,
        creatomate_11_id:  renderJobs['1:1']  || null,
        status:            'rendering',
        current_step:      'Rendering video formats',
        progress_pct:      40,
        duration_seconds:  duration,
      })
      .eq('id', videoJob.id)

    return NextResponse.json({
      success: true,
      video_job_id: videoJob.id,
      render_jobs: renderJobs,
      status: 'rendering',
      message: `Rendering ${Object.keys(renderJobs).length} format(s). Poll /api/admin/video-status?job_id=${videoJob.id} for progress.`,
    }, { headers: CORS })

  } catch (e: any) {
    console.error('generate-video error', e)
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
