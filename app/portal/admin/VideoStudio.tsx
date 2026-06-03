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

export default function VideoStudio({ allPodcasts }: { allPodcasts: any[] }) {
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null)
  const [studioBg, setStudioBg] = useState('dark_studio')
  const [formats, setFormats] = useState<string[]>(['9:16', '16:9'])
  const [hostPhoto, setHostPhoto] = useState('')
  const [guestPhoto, setGuestPhoto] = useState('')
  const [generating, setGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const pollRef = useRef<NodeJS.Timeout>()

  // Load existing videos
  useEffect(() => {
    loadVideos()
  }, [])

  // Poll for job progress
  useEffect(() => {
    if (!currentJob?.id || currentJob.done) return
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/admin/video-status?job_id=${currentJob.id}`)
      const data = await res.json()
      setCurrentJob(data)
      if (data.done) {
        clearInterval(pollRef.current)
        loadVideos()
      }
    }, 4000)
    return () => clearInterval(pollRef.current)
  }, [currentJob?.id, currentJob?.done])

  async function loadVideos() {
    setLoadingVideos(true)
    try {
      const res = await fetch('/api/admin/list-videos')
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos || [])
      }
    } catch {}
    setLoadingVideos(false)
  }

  async function handleGenerate() {
    if (!selectedEpisode || !selectedEpisode.audio_url) return
    if (formats.length === 0) return alert('Select at least one format')
    setGenerating(true)
    setCurrentJob(null)
    try {
      const res = await fetch('/api/admin/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episode_id: selectedEpisode.id,
          studio_bg:  studioBg,
          formats,
          host_photo_url:  hostPhoto || undefined,
          guest_photo_url: guestPhoto || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); setGenerating(false); return }
      setCurrentJob({ id: data.video_job_id, status: 'rendering', progress_pct: 20, done: false })
    } catch (e: any) {
      alert(e.message)
    }
    setGenerating(false)
  }

  const hasAudio = allPodcasts.filter((p: any) => p.audio_url)

  const G = '#10B981'
  const P = '#6366F1'
  const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20 }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>

      {/* ── LEFT: STUDIO BUILDER ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Header */}
        <div style={card}>
          <div style={{ fontSize:18, fontWeight:800, color:'#F1F5F9', marginBottom:4 }}>🎬 AI Video Studio</div>
          <div style={{ fontSize:13, color:'#64748b' }}>
            ElevenLabs audio → Studio composite → Social formats (9:16 Reels, 16:9 YouTube, 1:1 Instagram)
          </div>
        </div>

        {/* STEP 1 — Select episode */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:G, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>01 — Select Episode</div>
          {hasAudio.length === 0 ? (
            <div style={{ fontSize:13, color:'#64748b' }}>No episodes with audio yet. Generate audio first in the Podcasts tab.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {hasAudio.slice(0,8).map((ep: any) => (
                <button key={ep.id} onClick={() => setSelectedEpisode(ep)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, border:`1px solid ${selectedEpisode?.id === ep.id ? G : 'rgba(255,255,255,0.08)'}`, background:selectedEpisode?.id === ep.id ? `${G}12` : 'rgba(255,255,255,0.02)', cursor:'pointer', textAlign:'left' }}>
                  <span style={{ fontSize:18 }}>🎙</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ep.title || `Episode ${ep.episode_number}`}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{ep.host_name} × {ep.guest_name} · {ep.site_slug}</div>
                  </div>
                  {selectedEpisode?.id === ep.id && <span style={{ color:G, fontSize:16 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* STEP 2 — Avatar photos */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:P, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>02 — Avatar Photos</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Host Photo URL', val:hostPhoto, set:setHostPhoto, name:'Host', color:G },
              { label:'Guest Photo URL', val:guestPhoto, set:setGuestPhoto, name:'Guest', color:P },
            ].map(({ label, val, set, name, color }) => (
              <div key={name}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:6, fontWeight:600 }}>{label}</div>
                {val ? (
                  <div style={{ position:'relative', marginBottom:8 }}>
                    <img src={val} alt={name} style={{ width:'100%', height:80, objectFit:'cover', borderRadius:8, border:`2px solid ${color}` }} onError={(e: any) => { e.currentTarget.style.display='none' }} />
                    <button onClick={() => set('')} style={{ position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.6)', border:'none', borderRadius:4, color:'#fff', fontSize:11, padding:'2px 6px', cursor:'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ width:'100%', height:80, borderRadius:8, border:`2px dashed ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:8 }}>👤</div>
                )}
                <input value={val} onChange={e => set(e.target.value)}
                  placeholder="https://... photo URL"
                  style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#F1F5F9', fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#475569', marginTop:8 }}>
            Leave blank to use default portal avatars. Must be a public HTTPS image URL.
          </div>
        </div>

        {/* STEP 3 — Studio background */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:'#F59E0B', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>03 — Studio Background</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
            {STUDIO_BKGS.map(bg => (
              <button key={bg.id} onClick={() => setStudioBg(bg.id)}
                style={{ padding:'12px 8px', borderRadius:8, border:`2px solid ${studioBg === bg.id ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`, background:studioBg === bg.id ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:22 }}>{bg.thumb}</span>
                <span style={{ fontSize:9, color:'#94a3b8', fontWeight:600, textAlign:'center' }}>{bg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 4 — Output formats */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:'#E879F9', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>04 — Output Formats</div>
          <div style={{ display:'flex', gap:8 }}>
            {FORMATS.map(fmt => {
              const isOn = formats.includes(fmt.id)
              return (
                <button key={fmt.id}
                  onClick={() => setFormats(prev => isOn ? prev.filter(f => f !== fmt.id) : [...prev, fmt.id])}
                  style={{ flex:1, padding:'12px 8px', borderRadius:8, border:`2px solid ${isOn ? '#E879F9' : 'rgba(255,255,255,0.08)'}`, background:isOn ? 'rgba(232,121,249,0.1)' : 'rgba(255,255,255,0.02)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:22 }}>{fmt.icon}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:isOn ? '#E879F9' : '#94a3b8' }}>{fmt.label}</span>
                  <span style={{ fontSize:9, color:'#64748b', textAlign:'center', lineHeight:1.3 }}>{fmt.sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Generate button */}
        <button onClick={handleGenerate}
          disabled={!selectedEpisode?.audio_url || generating || formats.length === 0}
          style={{ padding:'16px', borderRadius:12, border:'none', background: (!selectedEpisode?.audio_url || generating || formats.length === 0) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366F1,#10B981)', color:'#fff', fontWeight:800, fontSize:16, cursor: (!selectedEpisode?.audio_url || generating) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          {generating ? '⏳ Submitting...' : '🎬 Generate Video'}
        </button>

        {/* Progress tracker */}
        {currentJob && (
          <div style={{ ...card, border:`1px solid ${currentJob.status === 'ready' ? G : currentJob.status === 'failed' ? '#EF4444' : P}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color: currentJob.status === 'ready' ? G : currentJob.status === 'failed' ? '#EF4444' : '#F1F5F9' }}>
                {currentJob.status === 'ready' ? '✅ Complete!' : currentJob.status === 'failed' ? '❌ Failed' : '⏳ Rendering...'}
              </span>
              <span style={{ fontSize:12, color:'#64748b' }}>{currentJob.progress_pct || 0}%</span>
            </div>
            <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.1)', overflow:'hidden', marginBottom:10 }}>
              <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${P},${G})`, width:`${currentJob.progress_pct || 0}%`, transition:'width .5s' }}/>
            </div>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>{currentJob.current_step || 'Processing...'}</div>

            {/* Video previews */}
            {[
              { url:currentJob.video_916_url, label:'📱 9:16 Reels',    fmt:'9:16' },
              { url:currentJob.video_169_url, label:'🖥 16:9 YouTube',  fmt:'16:9' },
              { url:currentJob.video_11_url,  label:'⬛ 1:1 Instagram', fmt:'1:1'  },
            ].filter(v => v.url).map(v => (
              <div key={v.fmt} style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, fontWeight:600 }}>{v.label}</div>
                <video src={v.url} controls style={{ width:'100%', borderRadius:8, maxHeight:160 }} />
                <a href={v.url} download target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:6, fontSize:12, color:G, fontWeight:600, textDecoration:'none' }}>
                  ⬇ Download {v.fmt} MP4
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: VIDEO LIBRARY ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ ...card, padding:'16px 20px' }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#F1F5F9', marginBottom:4 }}>📚 Video Library</div>
          <div style={{ fontSize:12, color:'#64748b' }}>All generated videos across portals</div>
        </div>

        {loadingVideos ? (
          <div style={{ ...card, textAlign:'center', padding:40, color:'#64748b' }}>Loading...</div>
        ) : videos.length === 0 ? (
          <div style={{ ...card, textAlign:'center', padding:40 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎬</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#F1F5F9', marginBottom:6 }}>No videos yet</div>
            <div style={{ fontSize:13, color:'#64748b' }}>Generate your first AI podcast video using the studio on the left.</div>
          </div>
        ) : (
          videos.map((v: any) => (
            <div key={v.id} style={{ ...card }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#F1F5F9', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.episode_title || 'Untitled Episode'}</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>{v.site_slug} · {v.host_name} × {v.guest_name}</div>
                </div>
                <span style={{ fontSize:11, padding:'3px 8px', borderRadius:100, fontWeight:700,
                  background: v.status === 'ready' ? `${G}18` : v.status === 'failed' ? '#EF444418' : '#6366F118',
                  color:      v.status === 'ready' ? G          : v.status === 'failed' ? '#EF4444'   : P,
                  border: `1px solid ${v.status === 'ready' ? `${G}44` : v.status === 'failed' ? '#EF444444' : `${P}44`}`,
                  flexShrink:0
                }}>
                  {v.status === 'ready' ? '✓ Ready' : v.status === 'failed' ? '✗ Failed' : '⏳ ' + (v.status || 'pending')}
                </span>
              </div>

              {/* Progress bar if rendering */}
              {v.status === 'rendering' && (
                <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden', marginBottom:10 }}>
                  <div style={{ height:'100%', background:`linear-gradient(90deg,${P},${G})`, width:`${v.progress_pct || 30}%`, transition:'width .5s' }}/>
                </div>
              )}

              {/* Video links */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { url:v.video_916_url, label:'📱 Reels' },
                  { url:v.video_169_url, label:'🖥 YouTube' },
                  { url:v.video_11_url,  label:'⬛ Square' },
                ].filter(f => f.url).map(f => (
                  <a key={f.label} href={f.url} target="_blank" rel="noopener noreferrer" download
                    style={{ fontSize:11, padding:'5px 12px', borderRadius:6, background:`${G}12`, border:`1px solid ${G}30`, color:G, fontWeight:700, textDecoration:'none' }}>
                    ⬇ {f.label}
                  </a>
                ))}
                {v.audio_url && (
                  <a href={v.audio_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, padding:'5px 12px', borderRadius:6, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', color:P, fontWeight:700, textDecoration:'none' }}>
                    🎧 Audio
                  </a>
                )}
              </div>

              {/* Video previews for ready videos */}
              {v.status === 'ready' && v.video_916_url && (
                <div style={{ marginTop:12 }}>
                  <video src={v.video_916_url} controls style={{ width:'100%', borderRadius:8, maxHeight:200 }} />
                </div>
              )}

              <div style={{ fontSize:10, color:'#334155', marginTop:8 }}>
                {new Date(v.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
