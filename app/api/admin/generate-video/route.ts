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

// ─── Studio backgrounds ───────────────────────────────────────────────────────
const BKGS: Record<string, string> = {
  dark_studio:    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80&fm=jpg',
  podcast_room:   'https://images.unsplash.com/photo-1478737270197-3a37b4c58e32?w=1920&q=80&fm=jpg',
  broadcast_desk: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=1920&q=80&fm=jpg',
  blue_office:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80&fm=jpg',
  dark_bokeh:     'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80&fm=jpg',
}

// ─── 3-Camera cinematic composition ──────────────────────────────────────────
// Layout: [CAM-1 HOST | CAM-MID BOTH | CAM-2 GUEST]
// Simulates 3 cameras on set — side angles + center wide shot
function buildSource(opts: {
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
  const W = isVert ? 1080 : 1920
  const H = isVert ? 1920 : 1080

  // For vertical (9:16): stack layout — host top, guest bottom, captions middle
  // For horizontal (16:9/1:1): 3-camera side-by-side layout
  if (isVert) {
    const aSize = 340
    return {
      output_format: 'mp4', width: W, height: H, frame_rate: 30, duration,
      background_color: '#080C14',
      elements: [
        // BG
        { type:'image', source:bg_url, fit:'cover', opacity:0.3, width:'100%', height:'100%', x_alignment:'50%', y_alignment:'50%' },
        { type:'shape', shape:'rectangle', fill_color:'rgba(8,12,20,0.65)', width:'100%', height:'100%', x_alignment:'50%', y_alignment:'50%' },
        // Audio
        { type:'audio', source:audio_url, volume:1 },
        // Portal name
        { type:'text', text:portal_name.toUpperCase(), font_family:'Inter', font_size:22, font_weight:'800',
          fill_color:accent, letter_spacing:'0.14em', x:'50%', y:'4%', x_alignment:'50%', y_alignment:'0%', width:'900px' },
        // Episode title
        { type:'text', text:episode_title, font_family:'Inter', font_size:40, font_weight:'900',
          fill_color:'#FFFFFF', x:'50%', y:'9%', x_alignment:'50%', y_alignment:'0%', width:'900px',
          text_wrap:true, line_height:1.25 },
        // CAM-1 label (host)
        { type:'text', text:'● CAM 1', font_family:'Inter Mono', font_size:18, font_weight:'700',
          fill_color:accent, x:'8%', y:'32%', x_alignment:'0%', y_alignment:'0%', width:'200px' },
        // Host avatar
        { type:'image', source:host_photo, width:aSize, height:aSize,
          x:'50%', y:'37%', x_alignment:'50%', y_alignment:'50%',
          border_radius:aSize/2, border_width:6, border_color:accent, fit:'cover' },
        // Host name
        { type:'text', text:host_name, font_family:'Inter', font_size:28, font_weight:'700',
          fill_color:'#FFFFFF', x:'50%', x_alignment:'50%', y:'37%', y_alignment:'0%',
          y_offset:(aSize/2)+16, width:'600px', text_alignment:'center' },
        { type:'text', text:'HOST', font_family:'Inter', font_size:16, font_weight:'600',
          fill_color:`${accent}99`, x:'50%', x_alignment:'50%', y:'37%', y_alignment:'0%',
          y_offset:(aSize/2)+48, width:'600px', text_alignment:'center', letter_spacing:'0.12em' },
        // Divider
        { type:'shape', shape:'rectangle', fill_color:accent, width:'80%', height:2, x:'50%', y:'58%', x_alignment:'50%', y_alignment:'50%', opacity:0.4 },
        // CAM-2 label (guest)
        { type:'text', text:'● CAM 2', font_family:'Inter Mono', font_size:18, font_weight:'700',
          fill_color:'#818CF8', x:'8%', y:'60%', x_alignment:'0%', y_alignment:'0%', width:'200px' },
        // Guest avatar
        { type:'image', source:guest_photo, width:aSize, height:aSize,
          x:'50%', y:'67%', x_alignment:'50%', y_alignment:'50%',
          border_radius:aSize/2, border_width:6, border_color:'#818CF8', fit:'cover' },
        // Guest name
        { type:'text', text:guest_name, font_family:'Inter', font_size:28, font_weight:'700',
          fill_color:'#FFFFFF', x:'50%', x_alignment:'50%', y:'67%', y_alignment:'0%',
          y_offset:(aSize/2)+16, width:'600px', text_alignment:'center' },
        { type:'text', text:'GUEST', font_family:'Inter', font_size:16, font_weight:'600',
          fill_color:'#818CF899', x:'50%', x_alignment:'50%', y:'67%', y_alignment:'0%',
          y_offset:(aSize/2)+48, width:'600px', text_alignment:'center', letter_spacing:'0.12em' },
        // Caption strip
        { type:'shape', shape:'rectangle', fill_color:'rgba(0,0,0,0.82)', width:'96%', height:160,
          x:'50%', y:'87%', x_alignment:'50%', y_alignment:'50%', border_radius:14 },
        { type:'subtitles', source:audio_url, x:'50%', y:'87%', width:'92%', height:150,
          x_alignment:'50%', y_alignment:'50%', font_size:46, font_weight:'800', font_family:'Inter',
          fill_color:'#FFFFFF', highlight_color:accent, text_alignment:'center', line_height:1.3 },
        // Bottom bar
        { type:'shape', shape:'rectangle', fill_color:accent, width:'100%', height:8, x:'50%', y:'100%', x_alignment:'50%', y_alignment:'100%' },
      ]
    }
  }

  // ── Horizontal 3-camera layout (16:9 / 1:1) ──────────────────────────────
  // Panel widths: CAM1=28% | DIVIDER | CAM-MID=44% | DIVIDER | CAM2=28%
  const panelH = Math.round(H * 0.52)
  const avatarSm = 220  // side cameras
  const avatarMid = 260 // centre wide shot

  return {
    output_format: 'mp4', width: W, height: H, frame_rate: 30, duration,
    background_color: '#080C14',
    elements: [
      // BG
      { type:'image', source:bg_url, fit:'cover', opacity:0.25, width:'100%', height:'100%', x_alignment:'50%', y_alignment:'50%' },
      { type:'shape', shape:'rectangle', fill_color:'rgba(8,12,20,0.70)', width:'100%', height:'100%', x_alignment:'50%', y_alignment:'50%' },
      // Audio
      { type:'audio', source:audio_url, volume:1 },

      // ── Camera panel backgrounds ──
      // CAM-1 (host left panel)
      { type:'shape', shape:'rectangle', fill_color:'rgba(255,255,255,0.025)', width:`${Math.round(W*0.29)}px`, height:`${panelH}px`,
        x:'14.5%', y:'54%', x_alignment:'50%', y_alignment:'50%', border_radius:16 },
      { type:'shape', shape:'rectangle', fill_color:'transparent', width:`${Math.round(W*0.29)}px`, height:`${panelH}px`,
        x:'14.5%', y:'54%', x_alignment:'50%', y_alignment:'50%', border_radius:16,
        border_width:2, border_color:`${accent}66` },

      // CAM-MID (centre wide)
      { type:'shape', shape:'rectangle', fill_color:'rgba(255,255,255,0.04)', width:`${Math.round(W*0.38)}px`, height:`${panelH}px`,
        x:'50%', y:'54%', x_alignment:'50%', y_alignment:'50%', border_radius:16 },
      { type:'shape', shape:'rectangle', fill_color:'transparent', width:`${Math.round(W*0.38)}px`, height:`${panelH}px`,
        x:'50%', y:'54%', x_alignment:'50%', y_alignment:'50%', border_radius:16,
        border_width:2, border_color:`${accent}44` },

      // CAM-2 (guest right panel)
      { type:'shape', shape:'rectangle', fill_color:'rgba(255,255,255,0.025)', width:`${Math.round(W*0.29)}px`, height:`${panelH}px`,
        x:'85.5%', y:'54%', x_alignment:'50%', y_alignment:'50%', border_radius:16 },
      { type:'shape', shape:'rectangle', fill_color:'transparent', width:`${Math.round(W*0.29)}px`, height:`${panelH}px`,
        x:'85.5%', y:'54%', x_alignment:'50%', y_alignment:'50%', border_radius:16,
        border_width:2, border_color:'#818CF866' },

      // ── CAM labels ──
      { type:'text', text:'● CAM 1', font_family:'Courier New', font_size:14, font_weight:'700',
        fill_color:accent, x:'3%', y:'29%', x_alignment:'0%', y_alignment:'50%', width:'160px' },
      { type:'text', text:'● CAM MID', font_family:'Courier New', font_size:14, font_weight:'700',
        fill_color:'#94A3B8', x:'50%', y:'29%', x_alignment:'50%', y_alignment:'50%', width:'160px' },
      { type:'text', text:'● CAM 2', font_family:'Courier New', font_size:14, font_weight:'700',
        fill_color:'#818CF8', x:'88%', y:'29%', x_alignment:'0%', y_alignment:'50%', width:'160px' },

      // ── Portal name (top) ──
      { type:'text', text:portal_name.toUpperCase(), font_family:'Inter', font_size:20, font_weight:'800',
        fill_color:accent, letter_spacing:'0.14em', x:'50%', y:'4%', x_alignment:'50%', y_alignment:'50%', width:'1400px' },

      // ── Episode title (below portal name) ──
      { type:'text', text:episode_title, font_family:'Inter', font_size:44, font_weight:'900',
        fill_color:'#FFFFFF', x:'50%', y:'12%', x_alignment:'50%', y_alignment:'50%',
        width:'1440px', text_wrap:true, line_height:1.2, text_alignment:'center' },

      // ── Host avatar (CAM-1 left panel) ──
      { type:'image', source:host_photo, width:avatarSm, height:avatarSm,
        x:'14.5%', y:'51%', x_alignment:'50%', y_alignment:'50%',
        border_radius:avatarSm/2, border_width:5, border_color:accent, fit:'cover' },
      { type:'text', text:host_name, font_family:'Inter', font_size:22, font_weight:'700',
        fill_color:'#FFFFFF', x:'14.5%', x_alignment:'50%', y:'51%', y_alignment:'0%',
        y_offset:(avatarSm/2)+10, width:'400px', text_alignment:'center' },
      { type:'text', text:'HOST', font_family:'Inter', font_size:13, font_weight:'700',
        fill_color:`${accent}BB`, x:'14.5%', x_alignment:'50%', y:'51%', y_alignment:'0%',
        y_offset:(avatarSm/2)+36, width:'400px', text_alignment:'center', letter_spacing:'0.14em' },

      // ── Both avatars (CAM-MID centre) ──
      { type:'image', source:host_photo, width:avatarMid, height:avatarMid,
        x:'37%', y:'51%', x_alignment:'50%', y_alignment:'50%',
        border_radius:avatarMid/2, border_width:4, border_color:accent, fit:'cover', opacity:0.85 },
      { type:'image', source:guest_photo, width:avatarMid, height:avatarMid,
        x:'63%', y:'51%', x_alignment:'50%', y_alignment:'50%',
        border_radius:avatarMid/2, border_width:4, border_color:'#818CF8', fit:'cover', opacity:0.85 },
      // Vs divider in mid
      { type:'shape', shape:'rectangle', fill_color:`${accent}55`, width:2, height:Math.round(avatarMid*0.65),
        x:'50%', y:'51%', x_alignment:'50%', y_alignment:'50%' },

      // ── Guest avatar (CAM-2 right panel) ──
      { type:'image', source:guest_photo, width:avatarSm, height:avatarSm,
        x:'85.5%', y:'51%', x_alignment:'50%', y_alignment:'50%',
        border_radius:avatarSm/2, border_width:5, border_color:'#818CF8', fit:'cover' },
      { type:'text', text:guest_name, font_family:'Inter', font_size:22, font_weight:'700',
        fill_color:'#FFFFFF', x:'85.5%', x_alignment:'50%', y:'51%', y_alignment:'0%',
        y_offset:(avatarSm/2)+10, width:'400px', text_alignment:'center' },
      { type:'text', text:'GUEST', font_family:'Inter', font_size:13, font_weight:'700',
        fill_color:'#818CF8BB', x:'85.5%', x_alignment:'50%', y:'51%', y_alignment:'0%',
        y_offset:(avatarSm/2)+36, width:'400px', text_alignment:'center', letter_spacing:'0.14em' },

      // ── Auto captions (bottom strip) ──
      { type:'shape', shape:'rectangle', fill_color:'rgba(0,0,0,0.85)', width:'96%', height:120,
        x:'50%', y:'90%', x_alignment:'50%', y_alignment:'50%', border_radius:12 },
      { type:'subtitles', source:audio_url, x:'50%', y:'90%', width:'94%', height:112,
        x_alignment:'50%', y_alignment:'50%', font_size:40, font_weight:'800', font_family:'Inter',
        fill_color:'#FFFFFF', highlight_color:accent, text_alignment:'center', line_height:1.3 },

      // ── Bottom accent bar ──
      { type:'shape', shape:'rectangle', fill_color:accent, width:'100%', height:6,
        x:'50%', y:'100%', x_alignment:'50%', y_alignment:'100%' },
    ]
  }
}

// ─── Guest avatar auto-selection ──────────────────────────────────────────────
// Deterministic hash of name → always same photo for same guest
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
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80&fm=jpg',
]
const FEMALE_NAMES = new Set(['sarah','emma','julia','lisa','maria','anna','natalie','sophie',
  'claire','jessica','jennifer','rachel','laura','emily','diana','olivia','ava','isabelle',
  'priya','fatima','aisha','sana','mei','yuki','clara','nina','hannah','grace','victoria','leila'])

function guestPhoto(name: string): string {
  const first = (name?.split(' ')[0] || '').toLowerCase()
  const isFemale = FEMALE_NAMES.has(first)
  const pool = isFemale ? FEMALE_PHOTOS : MALE_PHOTOS
  // Simple hash: sum char codes mod pool length
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length
  return pool[hash]
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Always return valid JSON — never crash silently
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await req.json()
    const {
      episode_id, host_photo_url, guest_photo_url,
      studio_bg = 'dark_studio', formats = ['9:16', '16:9']
    } = body

    if (!episode_id) return NextResponse.json({ error: 'episode_id required' }, { status: 400, headers: CORS })

    // Get episode
    const { data: episode, error: epErr } = await supabase
      .from('podcast_scripts').select('*').eq('id', episode_id).single()
    if (epErr || !episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: CORS })
    if (!episode.audio_url) return NextResponse.json({ error: 'Episode has no audio_url. Generate audio first.' }, { status: 400, headers: CORS })

    // Get API keys
    const { data: keys } = await supabase.from('system_api_keys')
      .select('key_name, key_value').eq('is_active', true)
    const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

    // Portal config
    const { data: site } = await supabase.from('news_sites')
      .select('name, template_config').eq('slug', episode.site_slug).single()
    const accent     = (site as any)?.template_config?.primary || '#10B981'
    const portalName = (site as any)?.name || episode.show_name || 'RepHuby'

    // ── Avatar resolution ──────────────────────────────────────────────────
    // Host: always from podcast_avatars table (permanent per portal)
    // Guest: auto-select from curated pool, deterministic per name
    const { data: avatarRows } = await supabase.from('podcast_avatars')
      .select('*').eq('site_slug', episode.site_slug).eq('is_active', true)

    const hostPhoto = host_photo_url
      || avatarRows?.find((a: any) => a.role === 'host')?.photo_url
      || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fm=jpg' // James Hart default

    const guestName = episode.guest_name || 'Guest'
    const resolvedGuest = guest_photo_url
      || avatarRows?.find((a: any) => a.role === 'guest')?.photo_url
      || guestPhoto(guestName)

    const bgUrl   = BKGS[studio_bg] || BKGS.dark_studio
    const duration = (episode.duration_minutes || 5) * 60

    // Create job record
    const { data: job, error: jobErr } = await supabase.from('podcast_videos').insert({
      episode_id,
      client_id:      episode.client_id || null,
      site_slug:      episode.site_slug,
      status:         'rendering',
      current_step:   'Submitting to Nextcut renderer',
      progress_pct:   10,
      host_name:      episode.host_name || 'Host',
      guest_name:     guestName,
      episode_title:  episode.title,
      host_photo_url: hostPhoto,
      guest_photo_url:resolvedGuest,
      studio_bg,
      portal_accent:  accent,
      audio_url:      episode.audio_url,
      duration_seconds: duration,
    }).select('id').single()

    if (jobErr || !job) {
      console.error('Job insert error:', jobErr)
      return NextResponse.json({ error: `DB insert failed: ${jobErr?.message}` }, { status: 500, headers: CORS })
    }

    const nextcutKey = km.CREATOMATE_KEY
    if (!nextcutKey || nextcutKey === 'REPLACE_WITH_KEY') {
      await supabase.from('podcast_videos').update({
        status: 'failed', current_step: 'No Nextcut key configured', progress_pct: 0,
      }).eq('id', job.id)
      return NextResponse.json({ error: 'CREATOMATE_KEY not set in system_api_keys' }, { status: 400, headers: CORS })
    }

    // ── Submit ALL formats to Nextcut in parallel ──────────────────────────
    const formatKeys = formats as ('16:9' | '9:16' | '1:1')[]

    const renderResults = await Promise.allSettled(
      formatKeys.map(async (fmt) => {
        const source = buildSource({
          format: fmt, audio_url: episode.audio_url,
          host_photo: hostPhoto, guest_photo: resolvedGuest,
          host_name: episode.host_name || 'Host', guest_name: guestName,
          episode_title: episode.title, portal_name: portalName,
          accent, bg_url: bgUrl, duration,
        })
        // Nextcut: /render-video endpoint, apikey auth header (Supabase-style)
        // Key format: {account_id_uuid}-{secret_uuid} — split at char 37
        const ncAccountId = nextcutKey.split('-').slice(0,5).join('-')  // first UUID (36 chars)
        const ncSecret    = nextcutKey.split('-').slice(5).join('-')    // second UUID (36 chars)
        const r = await fetch('https://api.nextcut.io/render-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ncSecret}`,
            'apikey': nextcutKey,
            'x-account-id': ncAccountId,
          },
          body: JSON.stringify({ source }),
          signal: AbortSignal.timeout(20000),
        })
        const text = await r.text()
        if (!r.ok) throw new Error(`Nextcut ${r.status}: ${text.slice(0, 200)}`)
        const d = JSON.parse(text)
        const id = Array.isArray(d) ? d[0]?.id : d?.id
        if (!id) throw new Error(`Nextcut returned no render ID: ${text.slice(0, 100)}`)
        return { fmt, id }
      })
    )

    const renderJobs: Record<string, string> = {}
    const errors: string[] = []
    for (const r of renderResults) {
      if (r.status === 'fulfilled') renderJobs[r.value.fmt] = r.value.id
      else errors.push(r.reason?.message || 'Unknown error')
    }

    if (Object.keys(renderJobs).length === 0) {
      await supabase.from('podcast_videos').update({
        status: 'failed',
        current_step: `Nextcut rejected all formats: ${errors.join(' | ')}`,
      }).eq('id', job.id)
      return NextResponse.json({
        error: `Nextcut rendering failed: ${errors.join(', ')}`,
        video_job_id: job.id,
      }, { status: 400, headers: CORS })
    }

    await supabase.from('podcast_videos').update({
      creatomate_169_id: renderJobs['16:9'] || null,
      creatomate_916_id: renderJobs['9:16'] || null,
      creatomate_11_id:  renderJobs['1:1']  || null,
      current_step: `Rendering ${Object.keys(renderJobs).length}/${formatKeys.length} format(s) via Nextcut`,
      progress_pct: 30,
    }).eq('id', job.id)

    return NextResponse.json({
      success: true,
      video_job_id: job.id,
      engine: 'nextcut',
      render_jobs: renderJobs,
      host_photo: hostPhoto,
      guest_photo: resolvedGuest,
      formats_submitted: Object.keys(renderJobs),
      formats_failed: errors.length > 0 ? errors : undefined,
    }, { headers: CORS })

  } catch (err: any) {
    console.error('generate-video fatal:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500, headers: CORS }
    )
  }
}
