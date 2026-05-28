'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PORTALS = [
  { name:'NEX-WIRE',  abbr:'NW', domain:'nex-wire.com',   slug:'global-trade-wire',  color:'#E03131', accent:'#FF6B6B', route:'news'        },
  { name:'FINVEXX',   abbr:'FX', domain:'finvexx.com',    slug:'finance-terminal',   color:'#1971C2', accent:'#74C0FC', route:'finance'     },
  { name:'AUREXHQ',   abbr:'AX', domain:'aurexhq.com',    slug:'gold-markets-today', color:'#B08700', accent:'#FFD43B', route:'commodities' },
  { name:'BIZPLEX',   abbr:'BP', domain:'bizplex.co',     slug:'business-pulse',     color:'#6741D9', accent:'#B197FC', route:'magazine'    },
  { name:'VERIVEX',   abbr:'VX', domain:'verivex.co',     slug:'trust-score',        color:'#0CA678', accent:'#63E6BE', route:'reviews-hub' },
  { name:'BIZPEDIA',  abbr:'BZ', domain:'bizpedia.com',   slug:'company-pedia',      color:'#1864AB', accent:'#74C0FC', route:'wiki'        },
  { name:'PRESXWIRE', abbr:'PW', domain:'presxwire.com',  slug:'press-central',      color:'#C92A2A', accent:'#FF8787', route:'pressroom'   },
  { name:'INVEXHUB',  abbr:'IH', domain:'invexhub.com',   slug:'invest-data',        color:'#0B6E4F', accent:'#63E6BE', route:'investdb'    },
  { name:'TRADVEX',   abbr:'TV', domain:'tradvex.com',    slug:'trade-board',        color:'#D9480F', accent:'#FFA94D', route:'forum'       },
  { name:'CERTIVADE', abbr:'CV', domain:'certivade.com',  slug:'global-trade-assoc', color:'#1864AB', accent:'#A5D8FF', route:'association' },
  { name:'EXECVEX',   abbr:'EV', domain:'execvex.com',    slug:'executive-network',  color:'#3B5BDB', accent:'#BAC8FF', route:'executive'   },
  { name:'SIGNALIX',  abbr:'SX', domain:'signalix.com',   slug:'market-radar',       color:'#A61E4D', accent:'#F783AC', route:'market-radar'},
]

const NAV = [
  { icon:'🏠', label:'Overview',    id:'overview'  },
  { icon:'➕', label:'Onboard Client', id:'onboard' },
  { icon:'👥', label:'Clients',     id:'clients'   },
  { icon:'✍️', label:'Generate Content', id:'content' },
  { icon:'🎙', label:'Podcasts',    id:'podcasts'  },
  { icon:'📊', label:'Rankings',    id:'rankings'  },
  { icon:'🌐', label:'12 Portals',  id:'portals'   },
  { icon:'📧', label:'Subscribers', id:'subs'      },
  { icon:'⚙️', label:'API Keys',    id:'settings'  },
]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`
}

function Spinner() { return <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> }

export default function AdminDashboard({ clients, allContent, allRankings, allPodcasts, allActivity, sites, totalArticles, totalSubscribers }: any) {
  const [tab, setTab] = useState('overview')
  const [clock, setClock] = useState('')
  const [subs, setSubs] = useState<any[]>([])
  const router = useRouter()

  // Content generation state
  const [genClient, setGenClient] = useState('')
  const [genPortal, setGenPortal] = useState('')
  const [genType, setGenType] = useState('analysis')
  const [genTopic, setGenTopic] = useState('')
  const [genResult, setGenResult] = useState<any>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')
  const [publishLoading, setPublishLoading] = useState(false)
  const [publishDone, setPublishDone] = useState('')

  // Podcast state
  const [podClient, setPodClient] = useState('')
  const [podEpNum, setPodEpNum] = useState('')
  const [podTitle, setPodTitle] = useState('')
  const [podGuest, setPodGuest] = useState('')
  const [podRole, setPodRole] = useState('')
  const [podTopic, setPodTopic] = useState('')
  const [podDuration, setPodDuration] = useState('20')
  const [podScript, setPodScript] = useState('')
  const [podLoading, setPodLoading] = useState(false)
  const [podAudioLoading, setPodAudioLoading] = useState(false)
  const [podEpisodeId, setPodEpisodeId] = useState('')
  const [podAudio, setPodAudio] = useState('')
  const [podVoice, setPodVoice] = useState('male_professional')
  const [podMsg, setPodMsg] = useState('')

  // Rankings state
  const [rankClient, setRankClient] = useState('')
  const [rankKw, setRankKw] = useState('')
  const [rankChecking, setRankChecking] = useState(false)
  const [rankResult, setRankResult] = useState<any>(null)
  const [checkAllLoading, setCheckAllLoading] = useState(false)
  const [checkAllProgress, setCheckAllProgress] = useState(0)

  // Onboard state
  const [ob, setOb] = useState({ companyName:'', websiteUrl:'', regulation:'', tier:'pro', primaryColor:'#0EA5E9', ceoName:'', accountManager:'Sarah Chen — RepHuby', keywords:'', negativeUrls:'', brandVoice:'professional' })
  const [obLoading, setObLoading] = useState(false)
  const [obResult, setObResult] = useState<any>(null)

  // API Keys state
  const [apiKeys, setApiKeys] = useState({ SERPAPI_KEY:'', ELEVENLABS_KEY:'', HEYGEN_KEY:'', OPENAI_KEY:'' })
  const [keyStatus, setKeyStatus] = useState<any[]>([])
  const [keysSaved, setKeysSaved] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})), 1000)
    setClock(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('rephuby_session') || localStorage.getItem('rephub_session') || '{}'); if (s.role !== 'superadmin') router.push('/portal') } catch { router.push('/portal') }
  }, [])

  useEffect(() => {
    if (tab === 'subs') fetch('/api/admin/get-subscribers').then(r => r.json()).then(d => setSubs(d.subscribers || []))
    if (tab === 'settings') fetch('/api/admin/save-api-keys').then(r => r.json()).then(d => setKeyStatus(d.keys || []))
  }, [tab])

  const getClientBrokerName = (id: string) => clients.find((c: any) => c.id === id)?.company_name || ''
  const getClientRegulation = (id: string) => clients.find((c: any) => c.id === id)?.regulation || ''

  async function generateContent(e: React.FormEvent) {
    e.preventDefault()
    setGenLoading(true); setGenError(''); setGenResult(null); setPublishDone('')
    try {
      const portal = PORTALS.find(p => p.slug === genPortal)
      const r = await fetch('/api/admin/generate-content', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ clientId: genClient, portalSlug: genPortal, portalName: portal?.name, articleType: genType, topic: genTopic, brokerName: getClientBrokerName(genClient), regulation: getClientRegulation(genClient), ceoName: '' }) })
      const d = await r.json()
      if (d.error) { setGenError(d.error); } else { setGenResult(d) }
    } catch (e: any) { setGenError(e.message) }
    setGenLoading(false)
  }

  async function publishContent() {
    if (!genResult) return
    setPublishLoading(true)
    const portal = PORTALS.find(p => p.slug === genPortal)
    const r = await fetch('/api/admin/publish-content', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ jobId: genResult.job?.id, clientId: genClient, title: genResult.title, body: genResult.body, portalSlug: genPortal, portalName: portal?.name, articleType: genType, authorName: `${getClientBrokerName(genClient)} Editorial` }) })
    const d = await r.json()
    setPublishDone(d.url || '')
    setPublishLoading(false)
  }

  async function generateScript(e: React.FormEvent) {
    e.preventDefault()
    setPodLoading(true); setPodScript(''); setPodMsg(''); setPodAudio('')
    const r = await fetch('/api/admin/generate-script', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ clientId: podClient, episodeNumber: parseInt(podEpNum)||1, title: podTitle, guestName: podGuest, guestRole: podRole, topic: podTopic, brokerName: getClientBrokerName(podClient), regulation: getClientRegulation(podClient), durationMinutes: parseInt(podDuration)||20 }) })
    const d = await r.json()
    if (d.script) { setPodScript(d.script); setPodEpisodeId(d.episodeId || '') }
    else setPodMsg(d.error || 'Failed to generate script')
    setPodLoading(false)
  }

  async function generateAudio() {
    if (!podScript) return
    setPodAudioLoading(true); setPodMsg('')
    const r = await fetch('/api/admin/generate-audio', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ episodeId: podEpisodeId, script: podScript, voiceId: podVoice }) })
    const d = await r.json()
    setPodMsg(d.message || '')
    if (d.audioUrl && d.audioUrl.startsWith('http')) setPodAudio(d.audioUrl)
    setPodAudioLoading(false)
  }

  async function checkSingleRanking() {
    if (!rankClient || !rankKw) return
    setRankChecking(true); setRankResult(null)
    const r = await fetch('/api/admin/check-rankings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ clientId: rankClient, keyword: rankKw }) })
    const d = await r.json()
    setRankResult(d)
    setRankChecking(false)
  }

  async function checkAllRankings() {
    if (!rankClient) return
    setCheckAllLoading(true)
    const clientRankings = allRankings.filter((r: any) => r.client_id === rankClient)
    let done = 0
    for (const r of clientRankings) {
      await fetch('/api/admin/check-rankings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ clientId: rankClient, keyword: r.keyword }) })
      done++; setCheckAllProgress(Math.round((done / clientRankings.length) * 100))
    }
    setCheckAllLoading(false); setCheckAllProgress(0)
    router.refresh()
  }

  async function onboardClient(e: React.FormEvent) {
    e.preventDefault()
    setObLoading(true); setObResult(null)
    const r = await fetch('/api/admin/onboard-client', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...ob, keywords: ob.keywords.split('\n').filter(Boolean), negativeUrls: ob.negativeUrls.split('\n').filter(Boolean) }) })
    const d = await r.json()
    setObResult(d); setObLoading(false)
    if (d.success) router.refresh()
  }

  async function saveApiKeys(e: React.FormEvent) {
    e.preventDefault(); setKeysSaved(false)
    await fetch('/api/admin/save-api-keys', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(apiKeys) })
    setKeysSaved(true)
    setTimeout(() => setKeysSaved(false), 3000)
  }

  const page1 = allRankings.filter((r: any) => r.current_position > 0 && r.current_position <= 10).length
  const totalViews = allContent.reduce((s: number, c: any) => s + (c.views || 0), 0)

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0B0F19', fontFamily:"'DM Sans',system-ui,sans-serif", color:'#F1F5F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .syne{font-family:'Syne',sans-serif}
        .nav-b{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:#64748b;transition:all .2s;border:none;background:none;width:100%;text-align:left;font-family:inherit}
        .nav-b:hover{background:rgba(255,255,255,0.05);color:#F1F5F9}
        .nav-b.on{background:rgba(239,68,68,0.15);color:#EF4444;font-weight:700;border:1px solid rgba(239,68,68,0.2)}
        .card{background:linear-gradient(135deg,#141B2D,#1C2333);border:1px solid rgba(255,255,255,0.08);border-radius:12px}
        .inp{width:100%;padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#F1F5F9;font-size:13px;font-family:inherit;outline:none;transition:border .2s}
        .inp:focus{border-color:#0EA5E9}
        .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .2s;white-space:nowrap}
        .b-blue{background:linear-gradient(135deg,#0EA5E9,#818CF8);color:#fff}
        .b-blue:hover{opacity:.9;transform:translateY(-1px)}
        .b-green{background:linear-gradient(135deg,#10B981,#059669);color:#fff}
        .b-green:hover{opacity:.9}
        .b-red{background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff}
        .b-gold{background:linear-gradient(135deg,#F59E0B,#F97316);color:#000;font-weight:700}
        .b-ghost{background:rgba(255,255,255,0.06);color:#94A3B8;border:1px solid rgba(255,255,255,0.1)}
        .b-ghost:hover{border-color:#0EA5E9;color:#0EA5E9}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:700}
        .bg{background:rgba(16,185,129,0.15);color:#10B981;border:1px solid rgba(16,185,129,0.3)}
        .bb{background:rgba(14,165,233,0.15);color:#0EA5E9;border:1px solid rgba(14,165,233,0.3)}
        .br{background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.3)}
        .by{background:rgba(245,158,11,0.15);color:#F59E0B;border:1px solid rgba(245,158,11,0.3)}
        .trow:hover{background:rgba(255,255,255,0.025)}
        textarea{font-family:'DM Sans',system-ui,sans-serif;resize:vertical}
        select.inp option{background:#1C2333;color:#F1F5F9}
        label{display:block;font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:5px}
        @media(max-width:768px){.adm-sidebar{width:52px!important}.adm-label{display:none!important}}
      `}</style>

      {/* ─── SIDEBAR ─── */}
      <aside className="adm-sidebar" style={{ width:220, background:'#0D1117', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', position:'fixed', top:0, bottom:0, left:0, zIndex:50, overflow:'hidden' }}>
        <div style={{ padding:'16px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <Link href="https://rephuby.com">
            <div className="syne" style={{ fontSize:20, fontWeight:900 }}>Rep<span style={{ background:'linear-gradient(135deg,#EF4444,#F97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Huby</span></div>
          </Link>
          <div className="adm-label" style={{ fontSize:9, color:'#EF4444', fontWeight:800, letterSpacing:'.1em', marginTop:2 }}>⚙ ADMIN · COMMAND CENTER</div>
        </div>
        <div className="adm-label" style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ width:32, height:32, borderRadius:7, background:'linear-gradient(135deg,#EF4444,#DC2626)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, flexShrink:0 }}>S</div>
          <div><div style={{ fontWeight:700, fontSize:12 }}>Solly</div><div style={{ fontSize:10, color:'#475569' }}>Super Admin</div></div>
        </div>
        {/* System status */}
        <div className="adm-label" style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {[['12 Portals','Online','#10B981'],['Daily Cron','07:00 ✓','#10B981'],['AI Engine','Active','#10B981'],['DB','Connected','#10B981']].map(([l,s,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
              <span style={{ color:'#64748b' }}>{l}</span><span style={{ color:c, fontWeight:700 }}>● {s}</span>
            </div>
          ))}
        </div>
        <nav style={{ flex:1, padding:'6px', overflow:'auto' }}>
          {NAV.map(n => (
            <button key={n.id} className={`nav-b ${tab===n.id?'on':''}`} onClick={() => setTab(n.id)}>
              <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
              <span className="adm-label">{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer">
            <button className="btn b-ghost" style={{ width:'100%', justifyContent:'center', marginBottom:7, fontSize:11 }}>
              <span className="adm-label">📱 Telegram Channel</span>
            </button>
          </a>
          <button onClick={() => { localStorage.removeItem('rephuby_session'); router.push('/portal') }}
            style={{ width:'100%', padding:'7px', background:'transparent', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, color:'#EF4444', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
            <span className="adm-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main style={{ marginLeft:220, flex:1, overflowY:'auto', minHeight:'100vh' }}>
        {/* Top bar */}
        <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(13,17,23,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'11px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 className="syne" style={{ fontSize:17, fontWeight:800 }}>{NAV.find(n=>n.id===tab)?.icon} {NAV.find(n=>n.id===tab)?.label}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:14, fontSize:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, color:'#10B981' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', animation:'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontFamily:'monospace' }}>{clock}</span>
            </div>
            <Link href="https://rephuby.com" target="_blank"><button className="btn b-ghost" style={{ fontSize:11 }}>View Site ↗</button></Link>
          </div>
        </div>

        <div style={{ padding:'24px' }}>

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[{l:'Active Clients',v:clients.length,i:'👥',c:'#EF4444'},{l:'Articles Live',v:totalArticles?.toLocaleString(),i:'📰',c:'#0EA5E9'},{l:'Newsletter Subs',v:totalSubscribers,i:'📧',c:'#10B981'},{l:'Page 1 Keywords',v:page1,i:'🎯',c:'#F59E0B'}].map(k => (
                  <div key={k.l} className="card" style={{ padding:'18px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><span style={{ fontSize:22 }}>{k.i}</span><div style={{ width:8, height:8, borderRadius:'50%', background:k.c, animation:'pulse 2s ease-in-out infinite', marginTop:4 }} /></div>
                    <div className="syne" style={{ fontSize:32, fontWeight:900, color:k.c, lineHeight:1, marginBottom:3 }}>{k.v}</div>
                    <div style={{ fontSize:13, color:'#94A3B8' }}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
                {/* Portal grid */}
                <div className="card" style={{ padding:20 }}>
                  <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>🌐 12-Portal Network</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {sites.map((s: any) => {
                      const p = PORTALS.find(p => p.slug === s.slug)
                      return (
                        <Link key={s.id} href={`https://rephuby.com/${p?.route||'news'}/${s.slug}`} target="_blank">
                          <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:`1px solid ${s.primary_color}30`, borderLeft:`3px solid ${s.primary_color}`, borderRadius:8 }}>
                            <div style={{ fontWeight:700, fontSize:12, color:'#F1F5F9' }}>{s.name}</div>
                            <div style={{ fontSize:10, color:'#10B981', marginTop:2 }}>● Live</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
                {/* Activity */}
                <div className="card" style={{ padding:20 }}>
                  <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>⚡ Activity</div>
                  {allActivity.slice(0,8).map((a: any, i: number) => (
                    <div key={i} style={{ display:'flex', gap:8, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{a.type==='rank_improved'?'🚀':a.type==='article_published'?'📰':a.type==='podcast_ready'?'🎙':a.type==='portal_activated'?'✅':'⚡'}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, color:'#F1F5F9', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
                        <div style={{ fontSize:10, color:'#475569' }}>{timeAgo(a.created_at)} ago</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Quick actions */}
              <div className="card" style={{ padding:18 }}>
                <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:12 }}>⚡ Quick Actions</div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <button className="btn b-blue" onClick={() => setTab('onboard')}>➕ Onboard New Client</button>
                  <button className="btn b-green" onClick={() => setTab('content')}>✍️ Generate Article</button>
                  <button className="btn b-gold" onClick={() => setTab('podcasts')}>🎙 Create Podcast</button>
                  <button className="btn b-ghost" onClick={() => setTab('rankings')}>📊 Check Rankings</button>
                  <a href="/api/cron-update" target="_blank"><button className="btn b-ghost">🤖 Trigger Daily Articles</button></a>
                  <a href="https://supabase.com/dashboard/project/gykxxhxsakxhfuutgobb" target="_blank"><button className="btn b-ghost">🗄 Supabase DB</button></a>
                </div>
              </div>
            </div>
          )}

          {/* ══ ONBOARD CLIENT ══ */}
          {tab === 'onboard' && (
            <div style={{ animation:'slideIn .3s ease', maxWidth:720 }}>
              {obResult?.success ? (
                <div className="card" style={{ padding:28, textAlign:'center' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                  <div className="syne" style={{ fontSize:22, fontWeight:800, color:'#10B981', marginBottom:8 }}>{obResult.client.company_name} Onboarded!</div>
                  <div style={{ fontSize:14, color:'#64748b', marginBottom:20 }}>{obResult.portalsAssigned} portals activated · {obResult.keywordsAdded} keywords tracking · {obResult.client.tier?.toUpperCase()} plan</div>
                  <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, padding:14, marginBottom:20, fontSize:13, color:'#94A3B8', textAlign:'left' }}>
                    <strong style={{color:'#10B981'}}>Auto-generated keywords:</strong><br/>
                    {obResult.keywords?.map((k: string) => <span key={k} style={{ display:'inline-block', margin:'2px 4px', padding:'2px 8px', background:'rgba(255,255,255,0.06)', borderRadius:4, fontSize:11 }}>{k}</span>)}
                  </div>
                  <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button className="btn b-green" onClick={() => setTab('content')}>Generate First Articles →</button>
                    <button className="btn b-ghost" onClick={() => { setObResult(null); setOb({...ob, companyName:'', websiteUrl:'', ceoName:'', keywords:'', negativeUrls:''}) }}>Onboard Another</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding:28 }}>
                  <div className="syne" style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>➕ Onboard New Client</div>
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:24 }}>Creates client profile, assigns portals, generates brand keywords, and sets up full tracking dashboard.</p>
                  <form onSubmit={onboardClient}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      {[
                        {k:'companyName',l:'Broker / Company Name *',ph:'e.g. Apex Markets FX',full:false},
                        {k:'websiteUrl',l:'Website URL',ph:'https://apexmarkets.com',full:false},
                        {k:'regulation',l:'Regulation',ph:'e.g. CySEC / FCA / ASIC',full:false},
                        {k:'ceoName',l:'CEO / Key Contact Name',ph:'e.g. Alex Chen',full:false},
                        {k:'accountManager',l:'Account Manager',ph:'Sarah Chen — RepHuby',full:false},
                      ].map(f => (
                        <div key={f.k} style={{ gridColumn:f.full?'1/-1':'auto' }}>
                          <label>{f.l}</label>
                          <input className="inp" value={(ob as any)[f.k]} onChange={e => setOb({...ob,[f.k]:e.target.value})} placeholder={f.ph} required={f.k==='companyName'} />
                        </div>
                      ))}
                      <div>
                        <label>Plan Tier</label>
                        <select className="inp" value={ob.tier} onChange={e => setOb({...ob,tier:e.target.value})}>
                          <option value="starter">Starter ($5,000/mo) — 5 portals</option>
                          <option value="pro">Pro ($9,500/mo) — All 12 portals</option>
                          <option value="enterprise">Enterprise — Custom</option>
                        </select>
                      </div>
                      <div>
                        <label>Brand Color</label>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <input type="color" value={ob.primaryColor} onChange={e => setOb({...ob,primaryColor:e.target.value})} style={{ width:44, height:36, border:'none', background:'none', cursor:'pointer' }} />
                          <input className="inp" value={ob.primaryColor} onChange={e => setOb({...ob,primaryColor:e.target.value})} style={{ flex:1 }} />
                        </div>
                      </div>
                      <div style={{ gridColumn:'1/-1' }}>
                        <label>Brand Keywords (one per line — or leave blank for auto-generation)</label>
                        <textarea className="inp" value={ob.keywords} onChange={e => setOb({...ob,keywords:e.target.value})} placeholder={"apex markets review\napex markets scam\napex markets legit"} rows={4} />
                      </div>
                      <div style={{ gridColumn:'1/-1' }}>
                        <label>Negative URLs to Bury (one per line — links currently ranking that we need to push down)</label>
                        <textarea className="inp" value={ob.negativeUrls} onChange={e => setOb({...ob,negativeUrls:e.target.value})} placeholder={"https://forexpeacearmy.com/...\nhttps://reddit.com/..."} rows={3} />
                      </div>
                    </div>
                    <button type="submit" className="btn b-red" style={{ marginTop:20, padding:'12px 28px', fontSize:14 }} disabled={obLoading}>
                      {obLoading ? <><Spinner/> Onboarding...</> : '✅ Onboard Client & Activate Portals →'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ══ CONTENT GENERATOR ══ */}
          {tab === 'content' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'400px 1fr', gap:20, alignItems:'start' }}>
                <div className="card" style={{ padding:22 }}>
                  <div className="syne" style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>✍️ Generate Article</div>
                  <form onSubmit={generateContent}>
                    <div style={{ marginBottom:12 }}>
                      <label>Client</label>
                      <select className="inp" value={genClient} onChange={e => setGenClient(e.target.value)} required>
                        <option value="">— Select Client —</option>
                        {clients.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <label>Portal to Publish On</label>
                      <select className="inp" value={genPortal} onChange={e => setGenPortal(e.target.value)} required>
                        <option value="">— Select Portal —</option>
                        {PORTALS.map(p => <option key={p.slug} value={p.slug}>{p.name} ({p.route})</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <label>Article Type</label>
                      <select className="inp" value={genType} onChange={e => setGenType(e.target.value)}>
                        <option value="analysis">Market Analysis</option>
                        <option value="interview">CEO / Expert Interview</option>
                        <option value="review">Broker Review</option>
                        <option value="press_release">Press Release</option>
                        <option value="research">Research Report</option>
                      </select>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <label>Topic / Brief</label>
                      <textarea className="inp" value={genTopic} onChange={e => setGenTopic(e.target.value)} placeholder={"e.g. EUR/USD Q3 outlook and impact on retail traders\n\nor: CEO interview about new Tier-1 liquidity providers\n\nor: Company expansion into MENA markets"} rows={4} required />
                    </div>
                    {genError && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, padding:'9px 12px', fontSize:12, color:'#EF4444', marginBottom:12 }}>{genError}</div>}
                    <button type="submit" className="btn b-blue" style={{ width:'100%', justifyContent:'center', padding:'11px' }} disabled={genLoading}>
                      {genLoading ? <><Spinner/> Generating with Claude AI...</> : '🤖 Generate Article →'}
                    </button>
                  </form>
                </div>

                {/* Preview */}
                <div>
                  {!genResult && !genLoading && (
                    <div className="card" style={{ padding:40, textAlign:'center', color:'#475569' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>✍️</div>
                      <div style={{ fontSize:14 }}>Generated article will appear here for review before publishing</div>
                    </div>
                  )}
                  {genLoading && (
                    <div className="card" style={{ padding:40, textAlign:'center' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                        <div style={{ width:32, height:32, border:'3px solid rgba(14,165,233,0.2)', borderTopColor:'#0EA5E9', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                        <div style={{ color:'#94A3B8', fontSize:14 }}>Claude is writing your article...</div>
                        <div style={{ fontSize:12, color:'#475569' }}>Professional journalism quality · 600-800 words</div>
                      </div>
                    </div>
                  )}
                  {genResult && (
                    <div className="card" style={{ padding:22 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                        <div>
                          <div className="syne" style={{ fontSize:15, fontWeight:800 }}>Preview — {genResult.wordCount} words</div>
                          <div style={{ fontSize:11, color:'#64748b' }}>Review before publishing to {PORTALS.find(p=>p.slug===genPortal)?.name}</div>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          {publishDone ? (
                            <a href={publishDone} target="_blank" rel="noopener noreferrer"><button className="btn b-green">✅ View Live Article ↗</button></a>
                          ) : (
                            <button className="btn b-green" onClick={publishContent} disabled={publishLoading}>
                              {publishLoading ? <><Spinner/> Publishing...</> : '🚀 Publish to Portal →'}
                            </button>
                          )}
                          <button className="btn b-ghost" onClick={() => setGenResult(null)}>Regenerate</button>
                        </div>
                      </div>
                      {/* Editable title */}
                      <div style={{ marginBottom:12 }}>
                        <label>Title (editable)</label>
                        <input className="inp" value={genResult.title} onChange={e => setGenResult({...genResult, title:e.target.value})} style={{ fontWeight:700, fontSize:14 }} />
                      </div>
                      {/* Editable body */}
                      <div>
                        <label>Article Body (editable)</label>
                        <textarea className="inp" value={genResult.body} onChange={e => setGenResult({...genResult, body:e.target.value})} rows={18} style={{ fontSize:13, lineHeight:1.7 }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ PODCASTS ══ */}
          {tab === 'podcasts' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap:20, alignItems:'start' }}>
                <div className="card" style={{ padding:22 }}>
                  <div className="syne" style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>🎙 AI Podcast Studio</div>
                  <form onSubmit={generateScript}>
                    <div style={{ marginBottom:12 }}>
                      <label>Client</label>
                      <select className="inp" value={podClient} onChange={e => setPodClient(e.target.value)} required>
                        <option value="">— Select Client —</option>
                        {clients.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                      </select>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <div><label>Episode #</label><input className="inp" value={podEpNum} onChange={e => setPodEpNum(e.target.value)} placeholder="7" type="number" min="1" /></div>
                      <div><label>Duration (min)</label><input className="inp" value={podDuration} onChange={e => setPodDuration(e.target.value)} placeholder="20" type="number" /></div>
                    </div>
                    <div style={{ marginBottom:10 }}><label>Episode Title</label><input className="inp" value={podTitle} onChange={e => setPodTitle(e.target.value)} placeholder="Q3 Market Outlook & Strategy" required /></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <div><label>Guest Name</label><input className="inp" value={podGuest} onChange={e => setPodGuest(e.target.value)} placeholder="Alex Chen" /></div>
                      <div><label>Guest Role</label><input className="inp" value={podRole} onChange={e => setPodRole(e.target.value)} placeholder="CEO" /></div>
                    </div>
                    <div style={{ marginBottom:14 }}><label>Topic / Key Points</label><textarea className="inp" value={podTopic} onChange={e => setPodTopic(e.target.value)} rows={3} placeholder={"EUR/USD outlook, US Fed policy impact,\nwhy our clients trust us, trading tools"} required /></div>
                    <button type="submit" className="btn b-blue" style={{ width:'100%', justifyContent:'center' }} disabled={podLoading}>
                      {podLoading ? <><Spinner/> Writing Script...</> : '📝 Generate Podcast Script →'}
                    </button>
                  </form>

                  {/* Audio generation */}
                  {podScript && (
                    <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                      <label>Voice Style</label>
                      <select className="inp" value={podVoice} onChange={e => setPodVoice(e.target.value)} style={{ marginBottom:10 }}>
                        <option value="male_professional">Male — Professional (ElevenLabs/OpenAI)</option>
                        <option value="female_professional">Female — Professional</option>
                        <option value="male_authoritative">Male — Authoritative</option>
                      </select>
                      <button className="btn b-gold" style={{ width:'100%', justifyContent:'center' }} onClick={generateAudio} disabled={podAudioLoading}>
                        {podAudioLoading ? <><Spinner/> Generating Audio...</> : '🎵 Generate Audio →'}
                      </button>
                      {podMsg && <div style={{ marginTop:8, padding:'8px 12px', background:'rgba(255,255,255,0.05)', borderRadius:6, fontSize:11, color:'#94A3B8' }}>{podMsg}</div>}
                      {podAudio && (
                        <div style={{ marginTop:10 }}>
                          <audio controls style={{ width:'100%', borderRadius:6, background:'#0B0F19' }} src={podAudio}/>
                          <a href={podAudio} target="_blank" rel="noopener noreferrer"><button className="btn b-green" style={{ width:'100%', justifyContent:'center', marginTop:8, fontSize:12 }}>⬇️ Download MP3</button></a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Script editor */}
                <div className="card" style={{ padding:22 }}>
                  {!podScript && !podLoading ? (
                    <div style={{ padding:'60px 20px', textAlign:'center', color:'#475569' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>🎙</div>
                      <div style={{ fontSize:14 }}>Fill the form and click Generate Script to create a professional podcast episode script</div>
                    </div>
                  ) : podLoading ? (
                    <div style={{ padding:'60px 20px', textAlign:'center' }}>
                      <div style={{ width:36, height:36, border:'3px solid rgba(245,158,11,0.2)', borderTopColor:'#F59E0B', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 16px' }} />
                      <div style={{ color:'#94A3B8', fontSize:14 }}>Claude is writing your podcast script...</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                        <div>
                          <div className="syne" style={{ fontSize:14, fontWeight:800 }}>Episode Script — {podScript.split(' ').length} words (~{Math.round(podScript.split(' ').length/130)} min)</div>
                          <div style={{ fontSize:11, color:'#64748b' }}>Edit freely before generating audio</div>
                        </div>
                        <button className="btn b-ghost" style={{ fontSize:11 }} onClick={() => { navigator.clipboard.writeText(podScript) }}>📋 Copy</button>
                      </div>
                      <textarea
                        className="inp"
                        value={podScript}
                        onChange={e => setPodScript(e.target.value)}
                        rows={26}
                        style={{ fontSize:12, lineHeight:1.7, fontFamily:'monospace' }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Past episodes */}
              {allPodcasts.length > 0 && (
                <div className="card" style={{ padding:20, marginTop:20 }}>
                  <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>Past Episodes</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                    {allPodcasts.map((ep: any, i: number) => (
                      <div key={i} style={{ padding:'14px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:11, color:'#475569', fontWeight:700 }}>EP.{ep.episode_number}</span>
                          <span className={`badge ${ep.status==='published'?'bg':ep.status==='audio_ready'?'bb':ep.status==='script_ready'?'by':'br'}`}>{ep.status}</span>
                        </div>
                        <div style={{ fontWeight:600, fontSize:13, color:'#F1F5F9', marginBottom:4 }}>{ep.title}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>{ep.guest_name} · {ep.duration_seconds ? `${Math.round(ep.duration_seconds/60)}min` : 'TBD'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ RANKINGS ══ */}
          {tab === 'rankings' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20, marginBottom:20 }}>
                <div className="card" style={{ padding:20 }}>
                  <div className="syne" style={{ fontSize:15, fontWeight:800, marginBottom:14 }}>📊 Check Rankings</div>
                  <div style={{ marginBottom:12 }}>
                    <label>Client</label>
                    <select className="inp" value={rankClient} onChange={e => setRankClient(e.target.value)}>
                      <option value="">— Select Client —</option>
                      {clients.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label>Single Keyword</label>
                    <input className="inp" value={rankKw} onChange={e => setRankKw(e.target.value)} placeholder="apex markets review" />
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                    <button className="btn b-blue" style={{ flex:1, justifyContent:'center' }} onClick={checkSingleRanking} disabled={rankChecking || !rankClient || !rankKw}>
                      {rankChecking ? <><Spinner/> Checking...</> : '🔍 Check This Keyword'}
                    </button>
                  </div>
                  <button className="btn b-ghost" style={{ width:'100%', justifyContent:'center' }} onClick={checkAllRankings} disabled={checkAllLoading || !rankClient}>
                    {checkAllLoading ? <><Spinner/> {checkAllProgress}% done...</> : '🔄 Check ALL Keywords for Client'}
                  </button>
                  {checkAllLoading && (
                    <div style={{ marginTop:10, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${checkAllProgress}%`, background:'linear-gradient(90deg,#0EA5E9,#10B981)', borderRadius:3, transition:'width .3s' }} />
                    </div>
                  )}

                  {rankResult && (
                    <div style={{ marginTop:14, padding:14, background:rankResult.position<=10?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)', border:`1px solid ${rankResult.position<=10?'rgba(16,185,129,0.3)':'rgba(245,158,11,0.3)'}`, borderRadius:8 }}>
                      <div className="syne" style={{ fontSize:28, fontWeight:900, color:rankResult.position<=3?'#10B981':rankResult.position<=10?'#F59E0B':'#EF4444' }}>#{rankResult.position}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:rankResult.improved?'#10B981':'#94A3B8' }}>{rankResult.improved?`▲ Improved from #${rankResult.previousPosition}`:`Was #${rankResult.previousPosition}`}</div>
                      {rankResult.url && <div style={{ fontSize:10, color:'#64748b', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rankResult.url}</div>}
                      {!rankResult.usedRealApi && <div style={{ fontSize:10, color:'#F59E0B', marginTop:6 }}>⚠ Demo data — add SERPAPI_KEY in Settings for real rankings</div>}
                    </div>
                  )}

                  <div style={{ marginTop:16, padding:'10px 12px', background:'rgba(255,255,255,0.04)', borderRadius:8, fontSize:11, color:'#475569' }}>
                    <strong style={{color:'#94A3B8'}}>Real rankings:</strong> Add your SerpApi key in Settings → check any keyword live on Google.
                  </div>
                </div>

                {/* Rankings table */}
                <div className="card" style={{ overflow:'hidden' }}>
                  <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between' }}>
                    <div className="syne" style={{ fontSize:14, fontWeight:800 }}>All Rankings ({allRankings.length} keywords)</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <span className="badge bg">{page1} Page 1</span>
                      <span className="badge bb">{allRankings.filter((r:any)=>r.current_position>0&&r.current_position<=3).length} Top 3</span>
                    </div>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                      <thead><tr style={{ background:'rgba(255,255,255,0.02)', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.04em' }}>
                        {['Keyword','Client','Portal','Position','Change','Status'].map(h => <th key={h} style={{ padding:'8px 14px', textAlign:'left' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {allRankings.map((r: any, i: number) => (
                          <tr key={i} className="trow" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
                            <td style={{ padding:'9px 14px', fontWeight:600 }}>{r.keyword}</td>
                            <td style={{ padding:'9px 14px', color:'#64748b', fontSize:11 }}>{getClientBrokerName(r.client_id)}</td>
                            <td style={{ padding:'9px 14px', color:'#0EA5E9', fontSize:11 }}>{r.portal_name||'—'}</td>
                            <td style={{ padding:'9px 14px' }}><span className="syne" style={{ fontSize:18, fontWeight:900, color:r.current_position<=3?'#10B981':r.current_position<=10?'#F59E0B':r.current_position>0?'#EF4444':'#475569' }}>#{r.current_position||'?'}</span></td>
                            <td style={{ padding:'9px 14px', fontSize:11, fontWeight:700 }}>
                              {r.current_position > 0 && r.previous_position > 0
                                ? r.current_position < r.previous_position
                                  ? <span style={{color:'#10B981'}}>▲ +{r.previous_position-r.current_position}</span>
                                  : r.current_position > r.previous_position
                                  ? <span style={{color:'#EF4444'}}>▼ {r.current_position-r.previous_position}</span>
                                  : <span style={{color:'#475569'}}>→</span>
                                : <span style={{color:'#475569'}}>New</span>
                              }
                            </td>
                            <td style={{ padding:'9px 14px' }}>
                              <span className={`badge ${r.current_position<=3?'bg':r.current_position<=10?'bb':r.current_position>0?'br':'by'}`}>
                                {r.current_position<=3?'🏆 Top 3':r.current_position<=10?'✓ Page 1':r.current_position>0?'Page 2+':'Unchecked'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CLIENTS ══ */}
          {tab === 'clients' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ fontSize:13, color:'#64748b' }}>{clients.length} active client{clients.length!==1?'s':''}</div>
                <button className="btn b-red" onClick={() => setTab('onboard')}>➕ Onboard New Client</button>
              </div>
              {clients.map((c: any) => (
                <div key={c.id} className="card" style={{ padding:22, marginBottom:14 }}>
                  <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:14 }}>
                    <div style={{ width:48, height:48, borderRadius:10, background:`linear-gradient(135deg,${c.primary_color||'#0EA5E9'},#1d4ed8)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20, flexShrink:0 }}>
                      {c.company_name?.charAt(0)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div className="syne" style={{ fontSize:18, fontWeight:800 }}>{c.company_name}</div>
                      <div style={{ display:'flex', gap:10, marginTop:3, fontSize:12, color:'#64748b', flexWrap:'wrap' }}>
                        {c.website_url && <a href={c.website_url} target="_blank" rel="noopener noreferrer" style={{ color:'#0EA5E9' }}>{c.website_url}</a>}
                        <span>· {c.regulation}</span>
                        <span>· <span className="badge bb">{c.tier?.toUpperCase()}</span></span>
                        <span>· AM: {c.account_manager}</span>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div className="syne" style={{ fontSize:38, fontWeight:900, color:c.primary_color||'#0EA5E9', lineHeight:1 }}>{c.brand_score}</div>
                      <div style={{ fontSize:10, color:'#475569' }}>Brand Score</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:12 }}>
                    {[
                      {l:'Content',v:allContent.filter((x:any)=>x.client_id===c.id).length,c:'#0EA5E9'},
                      {l:'Page 1 KW',v:allRankings.filter((x:any)=>x.client_id===c.id&&x.current_position>0&&x.current_position<=10).length,c:'#10B981'},
                      {l:'Podcasts',v:allPodcasts.filter((x:any)=>x.client_id===c.id&&x.status==='published').length,c:'#F59E0B'},
                      {l:'Total KW',v:allRankings.filter((x:any)=>x.client_id===c.id).length,c:'#818CF8'},
                    ].map(m => (
                      <div key={m.l} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:8, textAlign:'center' }}>
                        <div className="syne" style={{ fontSize:24, fontWeight:800, color:m.c }}>{m.v}</div>
                        <div style={{ fontSize:11, color:'#475569' }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button className="btn b-blue" style={{ fontSize:12 }} onClick={() => { setGenClient(c.id); setTab('content') }}>✍️ Generate Article</button>
                    <button className="btn b-gold" style={{ fontSize:12 }} onClick={() => { setPodClient(c.id); setTab('podcasts') }}>🎙 Create Podcast</button>
                    <button className="btn b-ghost" style={{ fontSize:12 }} onClick={() => { setRankClient(c.id); setTab('rankings') }}>📊 Check Rankings</button>
                    <Link href="/portal/dashboard"><button className="btn b-ghost" style={{ fontSize:12 }}>👁 View Client Portal</button></Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ PORTALS ══ */}
          {tab === 'portals' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                {sites.map((site: any) => {
                  const p = PORTALS.find(p => p.slug === site.slug)
                  return (
                    <div key={site.id} className="card" style={{ padding:20 }}>
                      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                        <div style={{ width:42, height:42, borderRadius:9, background:`${site.primary_color}30`, border:`1px solid ${site.primary_color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18, color:site.primary_color }}>
                          {site.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:14, letterSpacing:'-0.03em' }}>
                            {(() => {
                              const pp = PORTALS.find(p => p.slug === site.slug)
                              if (!pp) return site.name
                              if (pp.name.includes('-')) return <><span style={{color:'#F1F5F9'}}>{pp.name.split('-')[0]}</span><span style={{color:pp.color}}>-</span><span style={{color:pp.accent}}>{pp.name.split('-')[1]}</span></>
                              if (pp.name.endsWith('XX')) return <><span style={{color:'#F1F5F9'}}>{pp.name.slice(0,-2)}</span><span style={{color:pp.color}}>XX</span></>
                              const mid = Math.ceil(pp.name.length/2)
                              return <><span style={{color:'#F1F5F9'}}>{pp.name.slice(0,mid)}</span><span style={{color:pp.color}}>{pp.name.slice(mid)}</span></>
                            })()}
                          </div>
                          <div style={{ fontSize:10, color:site.primary_color, marginTop:2 }}>{PORTALS.find(p=>p.slug===site.slug)?.domain || site.site_type}</div>
                        </div>
                        <span className="badge bg" style={{ marginLeft:'auto' }}>● Live</span>
                      </div>
                      <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>/{p?.route}/{site.slug}</div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <Link href={`https://rephuby.com/${p?.route||'news'}/${site.slug}`} target="_blank">
                          <button className="btn b-ghost" style={{ fontSize:11 }}>View Site ↗</button>
                        </Link>
                        <button className="btn b-blue" style={{ fontSize:11 }} onClick={() => { setGenPortal(site.slug); setTab('content') }}>Write Article</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══ SUBSCRIBERS ══ */}
          {tab === 'subs' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div className="card" style={{ overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between' }}>
                  <div className="syne" style={{ fontSize:15, fontWeight:800 }}>📧 Newsletter Subscribers ({subs.length})</div>
                  <button className="btn b-ghost" style={{ fontSize:12 }} onClick={() => {
                    const csv = ['Email,Site,Date'].concat(subs.map((s: any) => `${s.email},${s.site_name||''},${s.subscribed_at}`)).join('\n')
                    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'subscribers.csv'; a.click()
                  }}>⬇️ Export CSV</button>
                </div>
                {subs.length === 0 ? (
                  <div style={{ padding:'40px 20px', textAlign:'center', color:'#475569', fontSize:14 }}>No subscribers yet — newsletter forms are live on all 12 portal sites</div>
                ) : (
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'rgba(255,255,255,0.02)', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase' }}>
                      {['Email','Portal','Subscribed'].map(h => <th key={h} style={{ padding:'8px 14px', textAlign:'left' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {subs.map((s: any, i: number) => (
                        <tr key={i} className="trow" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                          <td style={{ padding:'9px 14px', fontWeight:600 }}>{s.email}</td>
                          <td style={{ padding:'9px 14px', color:'#0EA5E9', fontSize:12 }}>{s.site_name || 'RepHuby'}</td>
                          <td style={{ padding:'9px 14px', color:'#64748b', fontSize:11 }}>{s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ══ API KEYS / SETTINGS ══ */}
          {tab === 'settings' && (
            <div style={{ animation:'slideIn .3s ease', maxWidth:680 }}>
              <div className="card" style={{ padding:24, marginBottom:16 }}>
                <div className="syne" style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>⚙️ API Keys & Integrations</div>
                <p style={{ fontSize:13, color:'#64748b', marginBottom:22 }}>Stored securely in database. Required for live rank checking, real podcast audio generation, and video interviews.</p>
                <form onSubmit={saveApiKeys}>
                  {[
                    { k:'SERPAPI_KEY', l:'SerpApi Key', desc:'Google ranking checks — $50/mo for 5,000 searches', link:'https://serpapi.com', placeholder:'serpapi_key_xxxxxxxx', icon:'📊' },
                    { k:'ELEVENLABS_KEY', l:'ElevenLabs API Key', desc:'Premium AI voice generation for podcasts — $22/mo', link:'https://elevenlabs.io', placeholder:'xxxxxxxxx...', icon:'🎙' },
                    { k:'OPENAI_KEY', l:'OpenAI API Key', desc:'TTS audio fallback + GPT-4 (already set in Vercel env)', link:'https://platform.openai.com', placeholder:'sk-proj-...', icon:'🤖' },
                    { k:'HEYGEN_KEY', l:'HeyGen API Key', desc:'AI video talking head generation for video interviews — $29/mo', link:'https://heygen.com', placeholder:'xxxxxxxxx...', icon:'🎬' },
                  ].map(k => {
                    const existing = keyStatus.find((s: any) => s.key_name === k.k)
                    return (
                      <div key={k.k} style={{ marginBottom:18, padding:'16px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ fontSize:20 }}>{k.icon}</span>
                            <div>
                              <div style={{ fontWeight:700, fontSize:13, color:'#F1F5F9' }}>{k.l}</div>
                              <div style={{ fontSize:11, color:'#64748b' }}>{k.desc}</div>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            {existing?.is_active ? <span className="badge bg">✓ Active</span> : <span className="badge br">Not Set</span>}
                            <a href={k.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#0EA5E9' }}>Get key ↗</a>
                          </div>
                        </div>
                        <input
                          className="inp"
                          type="password"
                          placeholder={existing?.is_active ? '••••••••••••••••••• (set)' : k.placeholder}
                          value={(apiKeys as any)[k.k]}
                          onChange={e => setApiKeys({...apiKeys, [k.k]: e.target.value})}
                          style={{ fontFamily:'monospace', fontSize:12 }}
                        />
                      </div>
                    )
                  })}
                  <button type="submit" className="btn b-green" style={{ padding:'12px 28px', fontSize:14 }}>
                    {keysSaved ? '✅ Keys Saved!' : '💾 Save API Keys →'}
                  </button>
                </form>
              </div>

              {/* Infrastructure info */}
              <div className="card" style={{ padding:20 }}>
                <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>🏗 Infrastructure</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    {t:'Domain',v:'rephuby.com',l:'https://vercel.com',i:'🌐'},
                    {t:'Database',v:'Supabase EU',l:'https://supabase.com/dashboard/project/gykxxhxsakxhfuutgobb',i:'🗄'},
                    {t:'Hosting',v:'Vercel (auto-deploy)',l:'https://vercel.com/sollymarks95-ctrl/reputationhub',i:'🚀'},
                    {t:'AI Cron',v:'Daily 7:00 AM IST',l:'/api/cron-update',i:'🤖'},
                  ].map(s => (
                    <a key={s.t} href={s.l} target="_blank" rel="noopener noreferrer">
                      <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.04)', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize:16, marginBottom:4 }}>{s.i}</div>
                        <div style={{ fontWeight:700, fontSize:13, color:'#F1F5F9' }}>{s.t}</div>
                        <div style={{ fontSize:11, color:'#0EA5E9' }}>{s.v}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
