'use client'
import React, { useState, useEffect, useRef } from 'react'

// CONFIRMED WORKING avatar IDs on this HeyGen account (verified June 2026)
const AVATARS = [
  { id: 'Tyler-insuit-20220721',   label: 'Tyler',  desc: 'Male · Business suit',    emoji: '👨‍💼' },
  { id: 'Anna_public_3_20240108',  label: 'Anna',   desc: 'Female · Professional',   emoji: '👩‍💼' },
]

const BACKGROUNDS = [
  { id: 'dark_studio',    label: 'Dark Studio',    emoji: '🎙' },
  { id: 'podcast_room',   label: 'Podcast Room',   emoji: '🎚' },
  { id: 'broadcast_desk', label: 'Broadcast Desk', emoji: '📡' },
  { id: 'blue_office',    label: 'Blue Office',    emoji: '🏢' },
  { id: 'dark_bokeh',     label: 'Dark Bokeh',     emoji: '✨' },
]

const G = '#10B981'

export default function VideoStudio({ allPodcasts }: { allPodcasts: any[] }) {
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null)
  const [hostAvatarId,    setHostAvatarId]    = useState('Tyler-insuit-20220721')
  const [guestAvatarId,   setGuestAvatarId]   = useState('Anna_public_3_20240108')
  const [studioBg,        setStudioBg]        = useState('dark_studio')
  const [generating,      setGenerating]      = useState(false)
  const [currentJob,      setCurrentJob]      = useState<any>(null)
  const [lastResult,      setLastResult]      = useState<any>(null)
  const [videos,          setVideos]          = useState<any[]>([])
  const [loadingVideos,   setLoadingVideos]   = useState(false)
  const [previewId,       setPreviewId]       = useState<string|null>(null)
  const pollRef = useRef<any>(null)

  useEffect(() => { loadVideos() }, [])

  // Poll every 6s when a job is active
  useEffect(() => {
    if (!currentJob?.id || currentJob.done) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/admin/video-status?job_id=${currentJob.id}`)
        if (!res.ok) return
        const data = await res.json()
        setCurrentJob(data)
        if (data.done) { clearInterval(pollRef.current); loadVideos() }
      } catch {}
    }, 6000)
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
    if (!selectedEpisode) return alert('Pick an episode first')
    if (!selectedEpisode.audio_url) return alert('This episode has no audio yet — generate audio first from the Podcasts tab')
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
      const data = await res.json()
      if (data.error) { alert(`Error: ${data.error}`); setGenerating(false); return }
      setLastResult(data)
      setCurrentJob({ id: data.video_job_id, status: 'rendering', progress_pct: 15, done: false,
        current_step: 'Step 1/2: HeyGen rendering talking heads (5–15 min)…', pipeline_phase: 'heygen_render' })
    } catch (e: any) { alert(`Error: ${e.message}`) }
    setGenerating(false)
  }

  const withAudio = allPodcasts.filter((p: any) => p.audio_url)
  const pct       = currentJob?.progress_pct || 10

  // Phase indicators
  const phase = currentJob?.pipeline_phase || ''
  const phases = [
    { key: 'heygen_render', label: 'HeyGen Render',       done: ['shotstack','complete'].includes(phase), active: phase==='heygen_render' },
    { key: 'shotstack',     label: 'Shotstack Composite', done: ['complete'].includes(phase),              active: phase==='shotstack' },
    { key: 'complete',      label: 'Done',                done: phase==='complete' || currentJob?.status==='ready', active: false },
  ]

  const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20, marginBottom:16 }

  return (
    <div style={{ padding:24 }}>
      <div style={{ fontSize:18, fontWeight:800, color:'#F1F5F9', marginBottom:4 }}>🎬 AI Video Studio</div>
      <div style={{ fontSize:12, color:'#475569', marginBottom:24 }}>
        HeyGen talking heads → Shotstack 3-camera broadcast composite · 9:16 for Reels/TikTok
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* LEFT: Configure */}
        <div>

          {/* Episode selector */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:'#94A3B8', marginBottom:10 }}>📻 SELECT EPISODE</div>
            {withAudio.length === 0
              ? <div style={{ fontSize:12, color:'#64748b' }}>No episodes with audio. Go to Podcasts tab → Generate Audio first.</div>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:220, overflowY:'auto' }}>
                  {withAudio.map((ep: any) => (
                    <button key={ep.id} onClick={() => setSelectedEpisode(ep)}
                      style={{ textAlign:'left', padding:'10px 14px', borderRadius:8, cursor:'pointer', border:'none',
                        background: selectedEpisode?.id===ep.id ? `${G}22` : 'rgba(255,255,255,0.03)',
                        borderLeft: `3px solid ${selectedEpisode?.id===ep.id ? G : 'transparent'}` }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#F1F5F9', marginBottom:2 }}>
                        {ep.title || `Episode ${ep.episode_number}`}
                      </div>
                      <div style={{ fontSize:10, color:'#64748b' }}>
                        {ep.site_slug} · {ep.duration_minutes||5} min · 🎙 audio ready
                      </div>
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Avatar picker */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:'#94A3B8', marginBottom:10 }}>👥 AVATARS (verified working)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {(['host','guest'] as const).map(role => {
                const val = role==='host' ? hostAvatarId : guestAvatarId
                const set = role==='host' ? setHostAvatarId : setGuestAvatarId
                return (
                  <div key={role}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase' }}>
                      {role==='host' ? '🎙 HOST (CAM 1)' : '🎤 GUEST (CAM 2)'}
                    </div>
                    {AVATARS.map(av => (
                      <button key={av.id} onClick={() => set(av.id)}
                        style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 10px', marginBottom:5,
                          borderRadius:7, cursor:'pointer', border:'none',
                          background: val===av.id ? `${G}22` : 'rgba(255,255,255,0.03)',
                          outline: val===av.id ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize:14 }}>{av.emoji}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:'#F1F5F9', marginLeft:6 }}>{av.label}</span>
                        <div style={{ fontSize:10, color:'#64748b', marginLeft:24 }}>{av.desc}</div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
            {hostAvatarId === guestAvatarId && (
              <div style={{ fontSize:10, color:'#F59E0B', marginTop:8, padding:'6px 10px', background:'rgba(245,158,11,0.1)', borderRadius:6 }}>
                ⚠ Same avatar for host + guest — they'll look identical. Consider different avatars.
              </div>
            )}
          </div>

          {/* Background */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:'#94A3B8', marginBottom:10 }}>🖼 STUDIO BACKGROUND</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {BACKGROUNDS.map(bg => (
                <button key={bg.id} onClick={() => setStudioBg(bg.id)}
                  style={{ padding:'6px 12px', borderRadius:7, cursor:'pointer', border:'none', fontSize:12,
                    background: studioBg===bg.id ? `${G}22` : 'rgba(255,255,255,0.04)',
                    outline: studioBg===bg.id ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.06)',
                    color: studioBg===bg.id ? G : '#94A3B8' }}>
                  {bg.emoji} {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={generating || !selectedEpisode}
            style={{ width:'100%', padding:'14px', borderRadius:10, border:'none', cursor: (generating||!selectedEpisode)?'not-allowed':'pointer',
              fontWeight:800, fontSize:14, color:'#fff',
              background: (generating||!selectedEpisode) ? '#1e293b' : `linear-gradient(135deg, ${G}, #0EA5E9)`,
              opacity: !selectedEpisode ? 0.5 : 1 }}>
            {generating ? '⏳ Submitting to HeyGen…' : '🎬 Generate Podcast Video'}
          </button>

          {/* HeyGen Video Podcast shortcut */}
          <div style={{...card, borderColor:`${G}33`, marginTop:8}}>
            <div style={{fontSize:12,fontWeight:800,color:'#94A3B8',marginBottom:8}}>
              🎙 HEYGEN VIDEO PODCAST (1-CLICK)
            </div>
            <div style={{fontSize:11,color:'#64748b',marginBottom:10,lineHeight:1.5}}>
              Skip the pipeline — upload your script PDF directly to HeyGen and get a polished 2-avatar video podcast in minutes.
            </div>
            {selectedEpisode ? (
              <div style={{display:'flex',gap:8}}>
                <button
                  onClick={() => window.open(`/api/admin/podcast-pdf?id=${selectedEpisode.id}`, '_blank')}
                  style={{flex:1,padding:'9px',borderRadius:7,border:`1px solid ${G}`,background:`${G}18`,color:G,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                  📄 Download Script PDF
                </button>
                <button
                  onClick={() => window.open('https://labs.heygen.com/video-podcast', '_blank')}
                  style={{flex:1,padding:'9px',borderRadius:7,border:'1px solid #64748b',background:'rgba(255,255,255,0.04)',color:'#94A3B8',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                  🚀 Open HeyGen →
                </button>
              </div>
            ) : (
              <div style={{fontSize:11,color:'#475569'}}>← Select an episode above first</div>
            )}
          </div>

          {!selectedEpisode && (
            <div style={{ fontSize:11, color:'#475569', textAlign:'center', marginTop:8 }}>
              Select an episode with audio to enable
            </div>
          )}
        </div>

        {/* RIGHT: Status + library */}
        <div>

          {/* Active job progress */}
          {currentJob && (
            <div style={{ ...card, borderColor: currentJob.status==='failed' ? '#EF444444' : `${G}44` }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#F1F5F9', marginBottom:12 }}>
                {currentJob.status==='ready' ? '✅ Video Ready!' : currentJob.status==='failed' ? '❌ Failed' : '⏳ Rendering…'}
              </div>

              {/* Phase indicators */}
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                {phases.map((p, i) => (
                  <div key={p.key} style={{ display:'flex', alignItems:'center', gap:4, flex:1 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, flexShrink:0,
                      background: p.done ? G : p.active ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                      color: p.done||p.active ? '#fff' : '#64748b' }}>
                      {p.done ? '✓' : i+1}
                    </div>
                    <div style={{ fontSize:10, color: p.done ? G : p.active ? '#F59E0B' : '#64748b', lineHeight:1.2 }}>{p.label}</div>
                    {i<phases.length-1 && <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)', margin:'0 4px' }}/>}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden', marginBottom:10 }}>
                <div style={{ height:'100%', width:`${pct}%`, borderRadius:3, transition:'width 2s',
                  background: currentJob.status==='failed' ? '#EF4444' : `linear-gradient(90deg,${G},#0EA5E9)` }} />
              </div>

              <div style={{ fontSize:11, color:'#94A3B8', marginBottom:8 }}>
                {currentJob.current_step || `Rendering… ${pct}%`}
              </div>

              {currentJob.status==='failed' && (
                <div style={{ fontSize:11, color:'#EF4444', background:'rgba(239,68,68,0.1)', padding:'8px 12px', borderRadius:6 }}>
                  {currentJob.current_step}
                </div>
              )}

              {currentJob.status==='ready' && currentJob.video_916_url && (
                <div style={{ marginTop:12 }}>
                  <video src={currentJob.video_916_url} controls style={{ width:'100%', borderRadius:8, maxHeight:300 }} />
                  <a href={currentJob.video_916_url} download>
                    <button style={{ marginTop:8, width:'100%', padding:'8px', borderRadius:7, background:`${G}22`, border:`1px solid ${G}44`, color:G, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      ⬇ Download 9:16
                    </button>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Previous videos */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#94A3B8' }}>📚 VIDEO LIBRARY</div>
              <button onClick={loadVideos} style={{ fontSize:10, color:'#64748b', background:'none', border:'none', cursor:'pointer' }}>↻ Refresh</button>
            </div>

            {loadingVideos
              ? <div style={{ fontSize:12, color:'#64748b' }}>Loading…</div>
              : videos.length === 0
                ? <div style={{ fontSize:12, color:'#64748b' }}>No videos yet. Generate your first one!</div>
                : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:500, overflowY:'auto' }}>
                    {videos.map((v: any) => {
                      const hasVideo = v.video_916_url || v.video_169_url
                      const statusColor = v.status==='ready' ? G : v.status==='failed' ? '#EF4444' : '#F59E0B'
                      return (
                        <div key={v.id} style={{ padding:'12px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid rgba(255,255,255,0.06)` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {v.episode_title || 'Podcast Video'}
                              </div>
                              <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
                                {v.site_slug} · {new Date(v.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <span style={{ fontSize:9, padding:'2px 8px', borderRadius:99, fontWeight:700, flexShrink:0, marginLeft:8,
                              background:`${statusColor}22`, color:statusColor }}>
                              {v.status}
                            </span>
                          </div>

                          {v.status === 'rendering' && (
                            <>
                              <div style={{ fontSize:10, color:'#94A3B8', marginBottom:6 }}>{v.current_step}</div>
                              <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${v.progress_pct||10}%`, background:G, transition:'width 1s' }} />
                              </div>
                            </>
                          )}

                          {hasVideo && (
                            <div style={{ marginTop:8 }}>
                              {previewId === v.id ? (
                                <div>
                                  <video src={v.video_916_url || v.video_169_url} controls autoPlay
                                    style={{ width:'100%', borderRadius:6, maxHeight:280 }} />
                                  <button onClick={() => setPreviewId(null)}
                                    style={{ width:'100%', marginTop:4, padding:'5px', borderRadius:6, background:'rgba(255,255,255,0.05)', border:'none', color:'#64748b', fontSize:11, cursor:'pointer' }}>
                                    ✕ Close
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display:'flex', gap:6 }}>
                                  <button onClick={() => setPreviewId(v.id)}
                                    style={{ flex:1, padding:'6px', borderRadius:6, background:`${G}22`, border:`1px solid ${G}44`, color:G, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                    ▶ Preview
                                  </button>
                                  {v.video_916_url && (
                                    <a href={v.video_916_url} download style={{ flex:1 }}>
                                      <button style={{ width:'100%', padding:'6px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#94A3B8', fontSize:11, cursor:'pointer' }}>
                                        ⬇ 9:16
                                      </button>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── REVIEW VIDEO GENERATOR ──────────────────────────────────────────────────
export function ReviewVideoGenerator() {
  const [avatars, setAvatars] = React.useState<any[]>([])
  const [voices, setVoices] = React.useState<any[]>([])
  const [avatarId, setAvatarId] = React.useState('')
  const [voiceId, setVoiceId] = React.useState('')
  const [topic, setTopic] = React.useState('forex broker regulation FCA ASIC CySEC 2026')
  const [brokerName, setBrokerName] = React.useState('')
  const [generating, setGenerating] = React.useState(false)
  const [result, setResult] = React.useState<any>(null)
  const [script, setScript] = React.useState('')
  const [loadingAssets, setLoadingAssets] = React.useState(true)

  React.useEffect(() => {
    // Load avatars + voices in parallel
    Promise.all([
      fetch('/api/admin/heygen-avatars').then(r => r.json()),
      fetch('/api/admin/elevenlabs-voices').then(r => r.json()),
    ]).then(([avatarData, voiceData]) => {
      const avs = avatarData?.data?.avatars || avatarData?.avatars || []
      const vcs = voiceData?.voices || []
      setAvatars(avs)
      setVoices(vcs)
      // Ben's custom avatar — always select first
      const BEN_ID = '8cda690a684542e0817593096ea5461d'
      const ben = avs.find((a: any) => a.avatar_id === BEN_ID)
      if (ben) setAvatarId(BEN_ID)
      else {
        const custom = avs.find((a: any) => !a.avatar_id?.includes('public') && !a.avatar_id?.includes('Anna') && !a.avatar_id?.includes('Tyler'))
        if (custom) setAvatarId(custom.avatar_id)
      }
      // Ben's voice — always select first
      const BEN_VOICE = 'xMTIubkjc8KMDoYdz4bQ'
      const benVoice = vcs.find((v: any) => v.voice_id === BEN_VOICE)
      if (benVoice) setVoiceId(BEN_VOICE)
      else {
        const custom = vcs.find((v: any) => v.category === 'cloned' || v.category === 'professional')
        if (custom) setVoiceId(custom.voice_id)
      }
      setLoadingAssets(false)
    }).catch(() => setLoadingAssets(false))
  }, [])

  const resultRef = React.useRef<HTMLDivElement>(null)
  const [genStatus, setGenStatus] = React.useState('')

  async function generate() {
    if (!avatarId) return alert('Select an avatar first')
    if (!voiceId) return alert('Select a voice first')
    if (!brokerName && !topic) return alert('Enter a broker name')
    setGenerating(true); setResult(null); setScript(''); setGenStatus('🔍 Researching broker on the web...')
    try {
      // Step 1 indicator
      setTimeout(() => setGenStatus('✍️ Writing natural review script...'), 8000)
      setTimeout(() => setGenStatus('🎬 Submitting to HeyGen (both formats)...'), 25000)
      setTimeout(() => setGenStatus('⏳ Almost done — generating 2 videos...'), 45000)

      const res = await fetch('/api/admin/generate-review-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarId, voiceId, topic, brokerName, hostName: 'Ben' })
      })
      const data = await res.json()
      setResult(data)
      if (data.script) setScript(data.script)
      setGenStatus('')
      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setResult({ error: String(e) })
      setGenStatus('')
    }
    setGenerating(false)
  }

  const [queue, setQueue] = React.useState<any[]>([])
  React.useEffect(() => {
    fetch('/api/admin/video-reviews').then(r => r.json()).then(d => setQueue(d.videos || []))
  }, [result])

  return (
    <div style={{ display:'grid', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div className="syne" style={{ fontSize:18, fontWeight:900 }}>🎥 Review Video Generator</div>
        <div style={{ fontSize:11, color:'#475569' }}>Talking head · Ben avatar · ElevenLabs voice · Web-researched script</div>
      </div>

      {loadingAssets ? (
        <div style={{ padding:32, textAlign:'center', color:'#475569' }}>Loading avatars and voices from HeyGen + ElevenLabs...</div>
      ) : (
        <>
          {/* Avatar Selection */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Host Avatar</div>
            {avatars.length === 0 ? (
              <div style={{ fontSize:12, color:'#ef4444' }}>No avatars found — check HeyGen API key</div>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {avatars.map((a: any) => (
                  <button key={a.avatar_id} onClick={() => setAvatarId(a.avatar_id)}
                    style={{ padding:'8px 14px', borderRadius:8, border:`2px solid ${avatarId === a.avatar_id ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                      background: avatarId === a.avatar_id ? '#10b98120' : 'transparent',
                      color: avatarId === a.avatar_id ? '#10b981' : '#94a3b8', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                    {a.avatar_name || a.avatar_id?.slice(0,20)}
                    {a.avatar_id === '8cda690a684542e0817593096ea5461d' &&
                      <span style={{ marginLeft:6, fontSize:9, background:'#f59e0b', color:'#000', padding:'1px 5px', borderRadius:3 }}>👤 BEN</span>}
                    {!a.avatar_id?.includes('public') && !a.avatar_id?.includes('Anna') && !a.avatar_id?.includes('Tyler') && a.avatar_id !== '8cda690a684542e0817593096ea5461d' &&
                      <span style={{ marginLeft:6, fontSize:9, background:'#10b981', color:'#fff', padding:'1px 5px', borderRadius:3 }}>CUSTOM</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Selection */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Ben's Voice (ElevenLabs)</div>
            {voices.length === 0 ? (
              <div style={{ fontSize:12, color:'#ef4444' }}>No voices found — check ElevenLabs API key</div>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {voices.map((v: any) => (
                  <button key={v.voice_id} onClick={() => setVoiceId(v.voice_id)}
                    style={{ padding:'8px 14px', borderRadius:8, border:`2px solid ${voiceId === v.voice_id ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                      background: voiceId === v.voice_id ? '#6366f120' : 'transparent',
                      color: voiceId === v.voice_id ? '#6366f1' : '#94a3b8', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                    {v.name}
                    {v.voice_id === 'xMTIubkjc8KMDoYdz4bQ' &&
                      <span style={{ marginLeft:6, fontSize:9, background:'#f59e0b', color:'#000', padding:'1px 5px', borderRadius:3 }}>🎙 BEN</span>}
                    {(v.category === 'cloned' || v.category === 'professional') && v.voice_id !== 'xMTIubkjc8KMDoYdz4bQ' &&
                      <span style={{ marginLeft:6, fontSize:9, background:'#6366f1', color:'#fff', padding:'1px 5px', borderRadius:3 }}>CUSTOM</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Topic / Broker */}
          <div className="card" style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Broker Name (optional)</div>
              <input value={brokerName} onChange={e => setBrokerName(e.target.value)}
                placeholder="e.g. eToro, XM, Pepperstone..."
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'8px 10px', color:'inherit', fontSize:13 }} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Topic (if no broker)</div>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'8px 10px', color:'inherit', fontSize:13 }} />
            </div>
          </div>

          {/* Generate Button */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={generate} disabled={generating}
              className="btn b-green" style={{ padding:'14px 32px', fontSize:14, fontWeight:700 }}>
              {generating ? '⏳ Working...' : '🎬 Generate Review Video (2 formats)'}
            </button>
            {generating && genStatus && (
              <div style={{ fontSize:12, color:'#f59e0b', fontWeight:600, padding:'8px 14px', background:'rgba(245,158,11,0.08)', borderRadius:6 }}>
                {genStatus}
                <div style={{ fontSize:10, color:'#475569', marginTop:3 }}>This takes 60-90 seconds — please wait...</div>
              </div>
            )}
          </div>

          {/* Script + Production Guide */}
          {script && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* Spoken Script */}
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#10b981', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
                  🎙 Spoken Script — Send to HeyGen
                </div>
                <pre style={{ fontSize:12, lineHeight:1.8, color:'#e2e8f0', whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>{script.split('===PRODUCTION GUIDE===')[0]?.replace('===SCRIPT===','').trim()}</pre>
              </div>
              {/* Production Guide */}
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
                  🎬 Production Guide — Screenshots to Overlay
                </div>
                <pre style={{ fontSize:12, lineHeight:1.9, color:'#cbd5e1', whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>
                  {(script.split('===PRODUCTION GUIDE===')[1] || '').trim()}
                </pre>
              </div>
            </div>
          )}

          {/* Result */}
          <div ref={resultRef} />
          {result && (
            <div className="card" style={{ padding:16, borderLeft:`3px solid ${result.error ? '#ef4444' : '#10b981'}` }}>
              {result.error ? (
                <div>
                  <div style={{ color:'#ef4444', fontSize:13, marginBottom:8 }}>❌ {result.error}</div>
                  {result.heygen_response && <pre style={{ fontSize:10, color:'#94a3b8', background:'rgba(0,0,0,0.3)', padding:8, borderRadius:4, overflow:'auto', maxHeight:120 }}>{JSON.stringify(result.heygen_response, null, 2)}</pre>}
                </div>
              ) : (
                <div>
                  <div style={{ color:'#10b981', fontWeight:700, fontSize:14, marginBottom:12 }}>✅ Video Generating in HeyGen!</div>
                  {result.word_count && <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>📝 {result.word_count} words ≈ {Math.round(result.word_count/130)} minutes</div>}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#6366f1', marginBottom:6 }}>🖥️ YOUTUBE DESKTOP (16:9)</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>ID: <code style={{ color:'#f1f5f9', fontSize:10 }}>{result.youtube_video_id}</code></div>
                      <div style={{ fontSize:10, color:'#475569', marginTop:4 }}>Full-length review · YouTube upload</div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#ec4899', marginBottom:6 }}>📱 MOBILE VERTICAL (9:16)</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>ID: <code style={{ color:'#f1f5f9', fontSize:10 }}>{result.mobile_video_id}</code></div>
                      <div style={{ fontSize:10, color:'#475569', marginTop:4 }}>YouTube Shorts · Instagram Reels · TikTok</div>
                    </div>
                  </div>
                  <div style={{ marginTop:12, padding:10, background:'rgba(99,102,241,0.08)', borderRadius:6 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#6366f1', marginBottom:4 }}>📋 YouTube Title & Description — Ready to Copy</div>
                    <div style={{ fontSize:11, color:'#f1f5f9', fontWeight:600 }}>{result.youtube_title}</div>
                    <pre style={{ fontSize:10, color:'#94a3b8', whiteSpace:'pre-wrap', marginTop:6, fontFamily:'inherit' }}>{result.youtube_description}</pre>
                  </div>
                  <div style={{ fontSize:11, color:'#475569', marginTop:10 }}>⏱ Video ready in HeyGen dashboard in ~5-10 minutes</div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Video Queue */}
      {queue.length > 0 && (
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
            📼 Video Queue ({queue.length} videos — daily auto-generation)
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {queue.slice(0,10).map((v: any) => (
              <div key={v.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:12, alignItems:'center', padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{v.broker_name}</div>
                  <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{v.youtube_title}</div>
                  <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{new Date(v.created_at).toLocaleDateString('en-GB')}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4,
                  background: v.status === 'processing' ? '#f59e0b20' : v.status === 'completed' ? '#10b98120' : '#6366f120',
                  color: v.status === 'processing' ? '#f59e0b' : v.status === 'completed' ? '#10b981' : '#6366f1' }}>
                  {v.status === 'processing' ? '⏳ Processing' : v.status === 'completed' ? '✅ Ready' : v.status}
                </span>
                {v.heygen_video_url && (
                  <a href={v.heygen_video_url} target="_blank" rel="noopener noreferrer" className="btn b-green" style={{ fontSize:10, padding:'4px 10px' }}>
                    ⬇ Download
                  </a>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#475569', marginTop:10 }}>
            New video generated automatically every day at 13:00 Israel time (10:00 UTC)
          </div>
        </div>
      )}
    </div>
  )
}
