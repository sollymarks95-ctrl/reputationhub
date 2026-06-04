'use client'
import { useState, useEffect, useRef } from 'react'

const STUDIO_BKGS = [
  { id:'dark_studio',    label:'Dark Studio',    thumb:'🎙' },
  { id:'podcast_room',   label:'Podcast Room',   thumb:'🎤' },
  { id:'broadcast_desk', label:'Broadcast Desk', thumb:'📺' },
  { id:'blue_office',    label:'Blue Office',    thumb:'🏢' },
  { id:'dark_bokeh',     label:'Dark Bokeh',     thumb:'✨' },
]
const FORMATS = [
  { id:'9:16',  label:'9:16',  sub:'Reels · TikTok · Shorts', icon:'📱' },
  { id:'16:9',  label:'16:9',  sub:'YouTube · Website',        icon:'🖥' },
  { id:'1:1',   label:'1:1',   sub:'Instagram Square',          icon:'⬛' },
]

// Same guest photo logic as server (deterministic)
const MALE_PHOTOS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&q=80&fm=jpg',
]
const FEMALE_PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=80&fm=jpg',
]
const FEMALE_NAMES = new Set(['sarah','emma','julia','lisa','maria','anna','natalie','sophie',
  'claire','jessica','jennifer','rachel','laura','emily','diana','olivia','ava','isabelle',
  'priya','fatima','aisha','sana','mei','yuki','clara','nina','hannah','grace','victoria','leila'])

function resolveGuestPhoto(name: string): string {
  const first = (name?.split(' ')[0] || '').toLowerCase()
  const pool = FEMALE_NAMES.has(first) ? FEMALE_PHOTOS : MALE_PHOTOS
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length
  return pool[hash]
}

// Permanent host photos per portal
const HOST_PHOTOS: Record<string, string> = {
  'global-trade-wire': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&fm=jpg',
  'finance-terminal':  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80&fm=jpg',
  'business-pulse':    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80&fm=jpg',
  'gold-markets-today':'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&q=80&fm=jpg',
  'trust-score':       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&fm=jpg',
  'invest-data':       'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80&fm=jpg',
  'market-radar':      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80&fm=jpg',
  'executive-network': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&fm=jpg',
  'crypto-hub':        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fm=jpg',
}

export default function VideoStudio({ allPodcasts }: { allPodcasts: any[] }) {
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null)
  const [studioBg, setStudioBg]     = useState('dark_studio')
  const [formats, setFormats]       = useState<string[]>(['9:16', '16:9'])
  const [hostPhoto, setHostPhoto]   = useState('')
  const [guestPhoto, setGuestPhoto] = useState('')
  const [generating, setGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<any>(null)
  const [videos, setVideos]         = useState<any[]>([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [lastResult, setLastResult] = useState<any>(null)
  const [previewId, setPreviewId] = useState<string|null>(null)
  const [previewUrl, setPreviewUrl] = useState<string|null>(null)
  const pollRef = useRef<NodeJS.Timeout>()

  useEffect(() => { loadVideos() }, [])

  // Auto-fill avatar URLs when episode changes
  useEffect(() => {
    if (!selectedEpisode) return
    const site = selectedEpisode.site_slug || ''
    const host = HOST_PHOTOS[site] || HOST_PHOTOS['global-trade-wire']
    const guest = resolveGuestPhoto(selectedEpisode.guest_name || 'Guest')
    setHostPhoto(host)
    setGuestPhoto(guest)
  }, [selectedEpisode])

  useEffect(() => {
    if (!currentJob?.id || currentJob.done) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/video-status?job_id=${currentJob.id}`)
        if (!res.ok) return
        const data = await res.json()
        setCurrentJob(data)
        if (data.done) { clearInterval(pollRef.current); loadVideos() }
      } catch {}
    }, 4000)
    return () => clearInterval(pollRef.current)
  }, [currentJob?.id, currentJob?.done])

  async function loadVideos() {
    setLoadingVideos(true)
    try {
      const res = await fetch('/api/admin/list-videos')
      if (res.ok) { const d = await res.json(); setVideos(d.videos || []) }
    } catch {}
    setLoadingVideos(false)
  }

  async function handleGenerate() {
    if (!selectedEpisode?.audio_url) return alert('Select an episode with audio first')
    if (!formats.length) return alert('Select at least one format')
    setGenerating(true)
    setCurrentJob(null)
    setLastResult(null)
    try {
      const res = await fetch('/api/admin/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episode_id:      selectedEpisode.id,
          studio_bg:       studioBg,
          formats,
          host_photo_url:  hostPhoto || undefined,
          guest_photo_url: guestPhoto || undefined,
        }),
      })
      let data: any = {}
      const text = await res.text()
      try { data = JSON.parse(text) } catch { 
        alert(`Server error: ${text.slice(0, 200)}`)
        setGenerating(false)
        return
      }
      if (data.error) { alert(data.error); setGenerating(false); return }
      setLastResult(data)
      setCurrentJob({ id: data.video_job_id, status: 'rendering', progress_pct: 20, done: false })
    } catch (e: any) {
      alert(`Network error: ${e.message}`)
    }
    setGenerating(false)
  }

  const hasAudio = allPodcasts.filter((p: any) => p.audio_url)
  const G = '#10B981', P = '#6366F1'
  const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20 }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>

      {/* ── LEFT: STUDIO BUILDER ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        <div style={card}>
          <div style={{ fontSize:18, fontWeight:800, color:'#F1F5F9', marginBottom:4 }}>🎬 AI Video Studio</div>
          <div style={{ fontSize:13, color:'#64748b' }}>
            ElevenLabs audio → 3-Camera Studio composite → Social formats (9:16 Reels, 16:9 YouTube, 1:1 Instagram)
          </div>
        </div>

        {/* Step 1 — Episode */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:G, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>01 — Select Episode</div>
          {hasAudio.length === 0
            ? <div style={{ fontSize:13, color:'#64748b' }}>No episodes with audio. Generate audio in the Podcasts tab first.</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {hasAudio.slice(0,8).map((ep: any) => (
                  <button key={ep.id} onClick={() => setSelectedEpisode(ep)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8,
                      border:`1px solid ${selectedEpisode?.id === ep.id ? G : 'rgba(255,255,255,0.08)'}`,
                      background:selectedEpisode?.id === ep.id ? `${G}12` : 'rgba(255,255,255,0.02)',
                      cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontSize:18 }}>🎙</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ep.title || `Episode ${ep.episode_number}`}
                      </div>
                      <div style={{ fontSize:11, color:'#64748b' }}>{ep.host_name} × {ep.guest_name} · {ep.site_slug}</div>
                    </div>
                    {ep.audio_url && <span style={{ fontSize:11, color:G, fontWeight:700, flexShrink:0 }}>🔊 Ready</span>}
                  </button>
                ))}
              </div>
          }
        </div>

        {/* Step 2 — Avatars (auto-filled, editable) */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:G, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>02 — Avatars (3-Camera)</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Host */}
            <div>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:8, fontWeight:700 }}>📷 CAM 1 — HOST (permanent)</div>
              {hostPhoto && (
                <img src={hostPhoto} alt="Host" style={{ width:64, height:64, borderRadius:32, objectFit:'cover', border:`2px solid ${G}`, marginBottom:8, display:'block' }} />
              )}
              <div style={{ fontSize:11, color:'#475569', marginBottom:4 }}>
                {selectedEpisode ? `${selectedEpisode.host_name || 'Host'} · auto-selected for ${selectedEpisode.site_slug}` : 'Select episode to auto-fill'}
              </div>
              <input value={hostPhoto} onChange={e => setHostPhoto(e.target.value)} placeholder="Override URL (optional)"
                style={{ width:'100%', padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)',
                  background:'rgba(0,0,0,0.3)', color:'#94A3B8', fontSize:11 }} />
            </div>
            {/* Guest */}
            <div>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:8, fontWeight:700 }}>📷 CAM 2 — GUEST (per episode)</div>
              {guestPhoto && (
                <img src={guestPhoto} alt="Guest" style={{ width:64, height:64, borderRadius:32, objectFit:'cover', border:'2px solid #818CF8', marginBottom:8, display:'block' }} />
              )}
              <div style={{ fontSize:11, color:'#475569', marginBottom:4 }}>
                {selectedEpisode ? `${selectedEpisode.guest_name || 'Guest'} · auto-selected` : 'Select episode to auto-fill'}
              </div>
              <input value={guestPhoto} onChange={e => setGuestPhoto(e.target.value)} placeholder="Override URL (optional)"
                style={{ width:'100%', padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)',
                  background:'rgba(0,0,0,0.3)', color:'#94A3B8', fontSize:11 }} />
            </div>
          </div>
          <div style={{ marginTop:10, fontSize:11, color:'#334155', background:'rgba(16,185,129,0.06)', padding:'8px 12px', borderRadius:6 }}>
            📹 3-camera layout: CAM 1 (host left) · CAM MID (wide both) · CAM 2 (guest right) — side-angle studio style
          </div>
        </div>

        {/* Step 3 — Background */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:G, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>03 — Studio Background</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {STUDIO_BKGS.map(bg => (
              <button key={bg.id} onClick={() => setStudioBg(bg.id)}
                style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${studioBg === bg.id ? G : 'rgba(255,255,255,0.1)'}`,
                  background: studioBg === bg.id ? `${G}15` : 'rgba(255,255,255,0.02)', cursor:'pointer', color: studioBg === bg.id ? G : '#94A3B8', fontSize:13 }}>
                {bg.thumb} {bg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4 — Formats */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:G, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>04 — Export Formats</div>
          <div style={{ display:'flex', gap:8 }}>
            {FORMATS.map(f => {
              const on = formats.includes(f.id)
              return (
                <button key={f.id} onClick={() => setFormats(prev => on ? prev.filter(x => x !== f.id) : [...prev, f.id])}
                  style={{ flex:1, padding:'10px 8px', borderRadius:8,
                    border:`1px solid ${on ? G : 'rgba(255,255,255,0.1)'}`,
                    background: on ? `${G}15` : 'rgba(255,255,255,0.02)',
                    cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:18 }}>{f.icon}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: on ? G : '#94A3B8' }}>{f.label}</div>
                  <div style={{ fontSize:10, color:'#475569' }}>{f.sub}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Generate button */}
        <button onClick={handleGenerate}
          disabled={!selectedEpisode?.audio_url || formats.length === 0 || generating}
          style={{ padding:'16px', borderRadius:10, border:'none', cursor:'pointer', fontSize:16, fontWeight:800,
            background: generating ? '#1E293B' : `linear-gradient(135deg, ${G}, #0EA5E9)`,
            color: generating ? '#475569' : '#fff', letterSpacing:'.05em', transition:'all .2s' }}>
          {generating ? '⏳ Submitting to Nextcut...' : '🎬 Generate Video Podcast'}
        </button>

        {/* Progress */}
        {currentJob && !currentJob.done && (
          <div style={{ ...card, borderColor:`${G}44` }}>
            <div style={{ fontSize:13, fontWeight:800, color:G, marginBottom:12 }}>🎬 Generating Talking Head Video...</div>
            {/* 3-phase progress */}
            {[
              { label:'1. HeyGen: Upload Avatars',     done: (currentJob.progress_pct||0) >= 25 },
              { label:'2. HeyGen: Render Talking Heads (5-15 min)', done: (currentJob.progress_pct||0) >= 55 },
              { label:'3. Shotstack: 3-Camera Composite', done: (currentJob.progress_pct||0) >= 100 },
            ].map((phase, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:20, height:20, borderRadius:10, flexShrink:0,
                  background: phase.done ? G : (currentJob.progress_pct||0) > i*25 ? `${G}44` : 'rgba(255,255,255,0.05)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>
                  {phase.done ? '✓' : i+1}
                </div>
                <div style={{ fontSize:12, color: phase.done ? G : '#64748b', fontWeight: phase.done ? 700 : 400 }}>{phase.label}</div>
              </div>
            ))}
            <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:4, overflow:'hidden', marginTop:8 }}>
              <div style={{ height:'100%', width:`${currentJob.progress_pct || 10}%`, background:`linear-gradient(90deg,${G},#0EA5E9)`, borderRadius:4, transition:'width 1s' }} />
            </div>
            <div style={{ fontSize:11, color:'#475569', marginTop:6, fontStyle:'italic' }}>{currentJob.current_step || 'Processing...'}</div>
            <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>⏱ Total time: ~10-20 minutes. Page will update automatically.</div>
          </div>
        )}

        {lastResult?.formats_submitted && (
          <div style={{ ...card, borderColor:`${G}44` }}>
            <div style={{ fontSize:13, color:G, fontWeight:700 }}>✅ Submitted to Nextcut</div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
              Formats: {lastResult.formats_submitted.join(', ')} · Job: {lastResult.video_job_id?.slice(0,8)}...
            </div>
            {lastResult.formats_failed?.length > 0 && (
              <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>⚠️ Failed: {lastResult.formats_failed.join('; ')}</div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: VIDEO LIBRARY ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#F1F5F9' }}>📹 Video Library</div>
            <button onClick={loadVideos} style={{ fontSize:12, color:G, background:'none', border:`1px solid ${G}44`, borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>↻ Refresh</button>
          </div>
          {loadingVideos
            ? <div style={{ fontSize:13, color:'#64748b' }}>Loading...</div>
            : videos.length === 0
              ? <div style={{ fontSize:13, color:'#64748b' }}>No videos yet. Generate your first above.</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {videos.map((v: any) => {
                    const hasAny = v.video_916_url || v.video_169_url || v.video_11_url
                    return (
                    <div key={v.id} style={{ padding:'14px', borderRadius:10, border:`1px solid ${previewId===v.id?G:'rgba(255,255,255,0.07)'}`, background:'rgba(255,255,255,0.02)', transition:'border-color .2s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {v.episode_title || 'Untitled'}
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4,
                          background: v.status==='ready'?`${G}22`:v.status==='failed'?'#EF444422':'rgba(255,255,255,0.05)',
                          color: v.status==='ready'?G:v.status==='failed'?'#EF4444':'#94A3B8', marginLeft:8, flexShrink:0 }}>
                          {v.status}
                        </span>
                      </div>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>
                        {v.host_name} × {v.guest_name} · {v.site_slug}
                      </div>
                      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                        {v.host_photo_url && <img src={v.host_photo_url} style={{ width:36,height:36,borderRadius:18,objectFit:'cover',border:`2px solid ${G}` }} />}
                        {v.guest_photo_url && <img src={v.guest_photo_url} style={{ width:36,height:36,borderRadius:18,objectFit:'cover',border:'2px solid #818CF8' }} />}
                        <div style={{ fontSize:10, color:'#475569', alignSelf:'center' }}>CAM 1 · CAM 2</div>
                      </div>
                      {v.current_step && v.status !== 'ready' && (
                        <div style={{ fontSize:11, color:'#64748b', marginBottom:6, fontStyle:'italic' }}>{v.current_step}</div>
                      )}
                      {v.status !== 'ready' && (
                        <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
                          <div style={{ height:'100%', width:`${v.progress_pct||0}%`, background:`linear-gradient(90deg,${G},#0EA5E9)`, transition:'width .5s' }} />
                        </div>
                      )}
                      {/* Inline video preview */}
                      {previewId === v.id && previewUrl && (
                        <div style={{ marginBottom:10, borderRadius:8, overflow:'hidden', background:'#000' }}>
                          <video src={previewUrl} controls autoPlay style={{ width:'100%', maxHeight:220, display:'block' }} />
                        </div>
                      )}
                      {/* Actions */}
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                        {hasAny && (
                          <button onClick={() => {
                            const url = v.video_169_url || v.video_916_url || v.video_11_url
                            if (previewId === v.id) { setPreviewId(null); setPreviewUrl(null) }
                            else { setPreviewId(v.id); setPreviewUrl(url) }
                          }} style={{ fontSize:11, color: previewId===v.id ? '#F59E0B' : '#10B981', background: previewId===v.id ? '#F59E0B15' : '#10B98115', padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer', fontWeight:700 }}>
                            {previewId===v.id ? '✕ Close' : '▶ Preview'}
                          </button>
                        )}
                        {v.video_916_url && <a href={v.video_916_url} download target="_blank" style={{ fontSize:11, color:G, background:`${G}15`, padding:'4px 10px', borderRadius:6, textDecoration:'none', fontWeight:700 }}>⬇ 9:16</a>}
                        {v.video_169_url && <a href={v.video_169_url} download target="_blank" style={{ fontSize:11, color:'#0EA5E9', background:'#0EA5E915', padding:'4px 10px', borderRadius:6, textDecoration:'none', fontWeight:700 }}>⬇ 16:9</a>}
                        {v.video_11_url  && <a href={v.video_11_url}  download target="_blank" style={{ fontSize:11, color:'#A78BFA', background:'#A78BFA15', padding:'4px 10px', borderRadius:6, textDecoration:'none', fontWeight:700 }}>⬇ 1:1</a>}
                        {v.error_msg && <div style={{ fontSize:10, color:'#EF4444', width:'100%', marginTop:4 }}>❌ {v.error_msg?.slice(0,120)}</div>}
                      </div>
                    </div>
                    )
                  })}
                </div>
          }
        </div>
      </div>
    </div>
  )
}
