'use client'
import { useState, useEffect, useRef } from 'react'

const STUDIO_BKGS = [
  { id:'dark_studio',    label:'Dark Studio',    thumb:'🎙' },
  { id:'podcast_room',   label:'Podcast Room',   thumb:'🎤' },
  { id:'broadcast_desk', label:'Broadcast Desk', thumb:'📺' },
  { id:'blue_office',    label:'Blue Office',    thumb:'🏢' },
  { id:'dark_bokeh',     label:'Dark Bokeh',     thumb:'✨' },
]

// HeyGen ultra-realistic built-in avatars for financial news context
const HEYGEN_AVATARS = [
  { id:'Tyler-insuit-20220721',       name:'Tyler',   gender:'M', desc:'✅ Confirmed working' },
  { id:'Eric_public_pro2_20230707',   name:'Eric',    gender:'M', desc:'May need plan upgrade' },
  { id:'Daniel_public_pro2_20230706', name:'Daniel',  gender:'M', desc:'Male, business casual' },
  { id:'Joshua_public_expressive_20231025', name:'Joshua', gender:'M', desc:'Male, expressive' },
  { id:'Susan_expressive_2024112501', name:'Susan',   gender:'F', desc:'Female, professional' },
  { id:'Ula_expressive_20240529',     name:'Ula',     gender:'F', desc:'Female, expressive' },
  { id:'Anna_expressive_20240412',    name:'Anna',    gender:'F', desc:'Female, warm' },
  { id:'Abigail_expressive_20240201', name:'Abigail', gender:'F', desc:'Female, authoritative' },
]

export default function VideoStudio({ allPodcasts }: { allPodcasts: any[] }) {
  const [selectedEpisode, setSelectedEpisode]   = useState<any>(null)
  const [studioBg, setStudioBg]                 = useState('dark_studio')
  const [hostAvatarId, setHostAvatarId]         = useState('Tyler-insuit-20220721')
  const [guestAvatarId, setGuestAvatarId]       = useState('Tyler-insuit-20220721')
  const [generating, setGenerating]             = useState(false)
  const [currentJob, setCurrentJob]             = useState<any>(null)
  const [videos, setVideos]                     = useState<any[]>([])
  const [loadingVideos, setLoadingVideos]       = useState(true)
  const [lastResult, setLastResult]             = useState<any>(null)
  const [previewId, setPreviewId]               = useState<string|null>(null)
  const [previewUrl, setPreviewUrl]             = useState<string|null>(null)
  const pollRef = useRef<NodeJS.Timeout>()

  useEffect(() => { loadVideos() }, [])

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
    }, 6000) // poll every 6s — HeyGen takes time
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
    setGenerating(true); setCurrentJob(null); setLastResult(null)
    try {
      const res = await fetch('/api/admin/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episode_id:      selectedEpisode.id,
          studio_bg:       studioBg,
          host_avatar_id:  hostAvatarId,
          guest_avatar_id: guestAvatarId,
        }),
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch { alert(`Server error: ${text.slice(0,200)}`); setGenerating(false); return }
      if (data.error) { alert(data.error); setGenerating(false); return }
      setLastResult(data)
      setCurrentJob({ id: data.video_job_id, status: 'rendering', progress_pct: 15, done: false,
        current_step: 'Step 1/2: HeyGen rendering talking heads…', pipeline_phase: 'heygen_render' })
    } catch (e: any) { alert(`Error: ${e.message}`) }
    setGenerating(false)
  }

  const hasAudio = allPodcasts.filter((p: any) => p.audio_url)
  const G = '#10B981'

  const phaseLabel = (job: any) => {
    const phase = job?.pipeline_phase || ''
    const pct   = job?.progress_pct || 0
    if (phase === 'heygen_render' || pct < 55) return 'heygen'
    if (phase === 'shotstack' || pct < 95) return 'shotstack'
    return 'done'
  }

  const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20 }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>

      {/* LEFT: STUDIO BUILDER */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        <div style={card}>
          <div style={{ fontSize:18, fontWeight:800, color:'#F1F5F9', marginBottom:4 }}>🎬 AI Video Studio</div>
          <div style={{ fontSize:12, color:'#64748b' }}>
            HeyGen ultra-realistic avatars → lip-synced to podcast audio → Shotstack 3-camera broadcast composite
          </div>
        </div>

        {/* Step 1: Episode */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:G, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>01 — Select Episode</div>
          {hasAudio.length === 0
            ? <div style={{ fontSize:13, color:'#64748b' }}>No episodes with audio yet.</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {hasAudio.slice(0, 8).map((ep: any) => (
                  <button key={ep.id} onClick={() => setSelectedEpisode(ep)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, textAlign:'left', cursor:'pointer',
                      border:`1px solid ${selectedEpisode?.id === ep.id ? G : 'rgba(255,255,255,0.08)'}`,
                      background: selectedEpisode?.id === ep.id ? `${G}12` : 'rgba(255,255,255,0.02)' }}>
                    <span style={{ fontSize:18 }}>🎙</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ep.title || `Episode ${ep.episode_number}`}
                      </div>
                      <div style={{ fontSize:11, color:'#64748b' }}>{ep.host_name} × {ep.guest_name} · {ep.site_slug}</div>
                    </div>
                    <span style={{ fontSize:11, color:G, fontWeight:700, flexShrink:0 }}>🔊 Ready</span>
                  </button>
                ))}
              </div>
          }
        </div>

        {/* Step 2: Avatar selection */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:G, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:4 }}>02 — HeyGen Avatars</div>
          <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>Ultra-realistic AI presenters — lip-synced to podcast audio</div>

          {(['host','guest'] as const).map(role => {
            const currentId = role === 'host' ? hostAvatarId : guestAvatarId
            const setId     = role === 'host' ? setHostAvatarId : setGuestAvatarId
            const label     = role === 'host' ? 'HOST (CAM 1)' : 'GUEST (CAM 2)'
            const color     = role === 'host' ? G : '#818CF8'
            const current   = HEYGEN_AVATARS.find(a => a.id === currentId)
            return (
              <div key={role} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color, marginBottom:8 }}>📷 {label}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {HEYGEN_AVATARS.map(av => (
                    <button key={av.id} onClick={() => setId(av.id)}
                      style={{ padding:'5px 10px', borderRadius:6, fontSize:11, cursor:'pointer',
                        border:`1px solid ${currentId === av.id ? color : 'rgba(255,255,255,0.08)'}`,
                        background: currentId === av.id ? `${color}18` : 'rgba(255,255,255,0.02)',
                        color: currentId === av.id ? color : '#94A3B8', fontWeight: currentId === av.id ? 700 : 400 }}>
                      {av.gender === 'M' ? '👨' : '👩'} {av.name}
                    </button>
                  ))}
                </div>
                {current && (
                  <div style={{ fontSize:10, color:'#475569', marginTop:4 }}>
                    {current.name} — {current.desc}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Step 3: Background */}
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:800, color:G, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>03 — Studio Background</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {STUDIO_BKGS.map(bg => (
              <button key={bg.id} onClick={() => setStudioBg(bg.id)}
                style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:13,
                  border:`1px solid ${studioBg === bg.id ? G : 'rgba(255,255,255,0.1)'}`,
                  background: studioBg === bg.id ? `${G}15` : 'rgba(255,255,255,0.02)',
                  color: studioBg === bg.id ? G : '#94A3B8' }}>
                {bg.thumb} {bg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate */}
        <button onClick={handleGenerate}
          disabled={!selectedEpisode?.audio_url || generating}
          style={{ padding:'16px', borderRadius:10, border:'none', cursor:'pointer', fontSize:16, fontWeight:800, letterSpacing:'.05em', transition:'all .2s',
            background: generating ? '#1E293B' : `linear-gradient(135deg, ${G}, #0EA5E9)`,
            color: generating ? '#475569' : '#fff' }}>
          {generating ? '⏳ Submitting to HeyGen…' : '🎬 Generate Talking Head Video'}
        </button>

        {/* Progress — 3 phases */}
        {currentJob && !currentJob.done && (
          <div style={{ ...card, borderColor:`${G}44` }}>
            <div style={{ fontSize:13, fontWeight:800, color:G, marginBottom:14 }}>🎬 Generating…</div>

            {[
              { key:'heygen',    label:'1. HeyGen: Render Talking Heads',   note:'5-15 min' },
              { key:'shotstack', label:'2. Shotstack: 3-Camera Composite',  note:'2-3 min'  },
              { key:'done',      label:'3. Done — Video Ready',             note:''         },
            ].map((phase, i) => {
              const active = phaseLabel(currentJob) === phase.key
              const done   = ['done','shotstack','heygen'].indexOf(phaseLabel(currentJob)) > i || currentJob.done
              return (
                <div key={phase.key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:22, height:22, borderRadius:11, flexShrink:0, fontSize:11, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: done ? G : active ? `${G}44` : 'rgba(255,255,255,0.06)',
                    color: done || active ? '#fff' : '#475569' }}>
                    {done ? '✓' : i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:12, fontWeight: active||done ? 700 : 400, color: done ? G : active ? '#F1F5F9' : '#64748b' }}>
                      {phase.label}
                    </span>
                    {phase.note && !done && (
                      <span style={{ fontSize:10, color:'#475569', marginLeft:6 }}>{phase.note}</span>
                    )}
                  </div>
                </div>
              )
            })}

            <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:4, overflow:'hidden', marginTop:8 }}>
              <div style={{ height:'100%', width:`${currentJob.progress_pct || 10}%`, background:`linear-gradient(90deg,${G},#0EA5E9)`, transition:'width 2s' }} />
            </div>
            <div style={{ fontSize:11, color:'#475569', marginTop:6, fontStyle:'italic' }}>{currentJob.current_step || 'Processing…'}</div>
            <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>⏱ Total ~10-20 min · page polls every 6s automatically</div>
          </div>
        )}

        {lastResult?.heygen_host_job_id && !currentJob?.done && (
          <div style={{ ...card, borderColor:`${G}44` }}>
            <div style={{ fontSize:12, color:G, fontWeight:700 }}>✅ HeyGen jobs submitted</div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
              Host: {lastResult.host_avatar} · Guest: {lastResult.guest_avatar}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: VIDEO LIBRARY */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#F1F5F9' }}>📹 Video Library</div>
            <button onClick={loadVideos} style={{ fontSize:12, color:G, background:'none', border:`1px solid ${G}44`, borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>↻</button>
          </div>

          {loadingVideos
            ? <div style={{ fontSize:13, color:'#64748b' }}>Loading…</div>
            : videos.length === 0
              ? <div style={{ fontSize:13, color:'#64748b' }}>No videos yet. Generate your first above.</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {videos.map((v: any) => {
                    const hasAny = v.video_916_url || v.video_169_url || v.video_11_url
                    return (
                      <div key={v.id} style={{ padding:'14px', borderRadius:10, border:`1px solid ${previewId===v.id?G:'rgba(255,255,255,0.07)'}`, background:'rgba(255,255,255,0.02)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {v.episode_title || 'Untitled'}
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, marginLeft:8, flexShrink:0,
                            background: v.status==='ready'?`${G}22`:v.status==='failed'?'#EF444422':'rgba(255,255,255,0.05)',
                            color: v.status==='ready'?G:v.status==='failed'?'#EF4444':'#94A3B8' }}>
                            {v.status}
                          </span>
                        </div>
                        <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>{v.host_name} × {v.guest_name} · {v.site_slug}</div>
                        {v.current_step && v.status !== 'ready' && (
                          <div style={{ fontSize:10, color:'#475569', marginBottom:6, fontStyle:'italic' }}>{v.current_step}</div>
                        )}
                        {v.status !== 'ready' && (
                          <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
                            <div style={{ height:'100%', width:`${v.progress_pct||0}%`, background:`linear-gradient(90deg,${G},#0EA5E9)`, transition:'width 1s' }} />
                          </div>
                        )}
                        {previewId === v.id && previewUrl && (
                          <div style={{ marginBottom:10, borderRadius:8, overflow:'hidden', background:'#000' }}>
                            <video src={previewUrl} controls autoPlay style={{ width:'100%', maxHeight:220, display:'block' }} />
                          </div>
                        )}
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                          {hasAny && (
                            <button onClick={() => {
                              const url = v.video_916_url || v.video_169_url || v.video_11_url
                              if (previewId===v.id) { setPreviewId(null); setPreviewUrl(null) }
                              else { setPreviewId(v.id); setPreviewUrl(url) }
                            }} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer',
                              color: previewId===v.id?'#F59E0B':G, background: previewId===v.id?'#F59E0B15':`${G}15` }}>
                              {previewId===v.id?'✕ Close':'▶ Preview'}
                            </button>
                          )}
                          {v.video_169_url && <a href={v.video_169_url} download target="_blank" style={{ fontSize:11, color:G, background:`${G}15`, padding:'4px 10px', borderRadius:6, textDecoration:'none', fontWeight:700 }}>⬇ 16:9</a>}
                          {v.video_916_url && <a href={v.video_916_url} download target="_blank" style={{ fontSize:11, color:'#0EA5E9', background:'#0EA5E915', padding:'4px 10px', borderRadius:6, textDecoration:'none', fontWeight:700 }}>⬇ 9:16</a>}
                          {v.error_msg && <div style={{ fontSize:10, color:'#EF4444', width:'100%' }}>❌ {v.error_msg?.slice(0,120)}</div>}
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
