'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const PORTALS = [
  { slug:'global-trade-wire', name:'Nex-Wire', domain:'nex-wire.com', color:'#0ea5e9' },
  { slug:'finance-terminal', name:'Finvexx', domain:'finvexx.com', color:'#10b981' },
  { slug:'business-pulse', name:'Bizplezx', domain:'bizplezx.com', color:'#8b5cf6' },
  { slug:'gold-markets-today', name:'AurexHQ', domain:'aurexhq.com', color:'#f59e0b' },
  { slug:'trust-score', name:'Verivex', domain:'verivex.co', color:'#ef4444' },
  { slug:'invest-data', name:'InvexHuby', domain:'invexhuby.com', color:'#14b8a6' },
  { slug:'market-radar', name:'Signalixx', domain:'signalixx.com', color:'#f43f5e' },
  { slug:'executive-network', name:'ExecVex', domain:'execvex.com', color:'#1d4ed8' },
  { slug:'crypto-hub', name:'CryptoXos', domain:'cryptoxos.com', color:'#f97316' },
]

const NAV = [
  { icon:'⚡', label:'Overview', id:'overview' },
  { icon:'📰', label:'Articles', id:'articles' },
  { icon:'📊', label:'Analytics', id:'analytics' },
  { icon:'🎙', label:'Podcasts', id:'podcasts' },
  { icon:'🔍', label:'Rankings', id:'rankings' },
  { icon:'🌐', label:'Coverage', id:'coverage' },
  { icon:'⭐', label:'Reviews', id:'reviews' },
]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}
function fmtNum(n: number) {
  if (n >= 1000) return (n/1000).toFixed(1) + 'k'
  return String(n)
}

export default function PortalDashboard({ client, content = [], podcasts = [], reviews = [], coverage = [] }: any) {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  
  // Rankings state
  const [keyword, setKeyword] = useState('')
  const [serpResults, setSerpResults] = useState<any>(null)
  const [serpLoading, setSerpLoading] = useState(false)
  const [serpError, setSerpError] = useState('')
  const [savedKeywords] = useState(['eToro review', 'eToro broker', 'eToro trading platform', 'eToro fees', 'is eToro safe'])
  
  // Podcast player
  const [playingPod, setPlayingPod] = useState<string | null>(null)

  const p = client?.primary_color || '#0ea5e9'

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true)
    try {
      const r = await fetch('/api/client/analytics?days=30')
      const d = await r.json()
      setAnalytics(d)
    } catch {}
    setLoadingAnalytics(false)
  }, [])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    router.refresh()
    setLastRefresh(new Date())
    setTimeout(() => setRefreshing(false), 1000)
  }

  const checkRankings = async (kw: string) => {
    if (!kw.trim()) return
    setSerpLoading(true)
    setSerpError('')
    setSerpResults(null)
    try {
      const r = await fetch('/api/client/serp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw }),
      })
      const d = await r.json()
      if (d.error) setSerpError(d.error)
      else setSerpResults(d)
    } catch (e: any) {
      setSerpError(e.message)
    }
    setSerpLoading(false)
  }

  const totalArticles = content.length
  const totalViews = analytics?.totalArticleViews || 0
  const totalPageViews = analytics?.totalPageViews || 0
  const portalsActive = new Set(content.map((c: any) => c.portal_name)).size
  const podcastCount = podcasts.length
  const avgRating = reviews.length ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'

  const BG = '#070d1a'
  const CARD = '#0e1628'
  const BORDER = 'rgba(255,255,255,0.08)'

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:BG, fontFamily:"'Inter',sans-serif", color:'#f1f5f9' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
        .nav-b{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:#64748b;transition:all .15s;border:none;background:none;width:100%;text-align:left;font-family:inherit}
        .nav-b:hover{background:rgba(255,255,255,0.05);color:#94a3b8}
        .nav-b.on{background:rgba(14,165,233,0.12);color:#38bdf8;font-weight:600}
        .kpi{background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:20px 24px;transition:transform .2s}
        .kpi:hover{transform:translateY(-2px)}
        .card{background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:20px}
        .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
        .btn-primary{background:${p};color:#fff}
        .btn-ghost{background:rgba(255,255,255,0.06);color:#94a3b8;border:1px solid rgba(255,255,255,0.1)}
        .btn-ghost:hover{border-color:${p};color:${p}}
        .inp{width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#f1f5f9;font-size:13px;font-family:inherit;outline:none;transition:border .15s}
        .inp:focus{border-color:${p}}
        .tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700}
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade{animation:fadeIn .3s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .portal-tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:rgba(14,165,233,0.15);color:#38bdf8}
        table{width:100%;border-collapse:collapse}
        th{text-align:left;font-size:11px;font-weight:600;color:#475569;padding:8px 12px;border-bottom:1px solid ${BORDER};text-transform:uppercase;letter-spacing:.05em}
        td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px}
        tr:hover td{background:rgba(255,255,255,0.02)}
        .bar{height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden}
        .bar-fill{height:100%;border-radius:2px;transition:width .5s ease}
        audio{width:100%;height:32px}
        audio::-webkit-media-controls-panel{background:rgba(255,255,255,0.05)}
      `}</style>

      {/* Sidebar */}
      <div style={{ width:220, background:'#080f1e', borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', flexShrink:0 }}>
        <div style={{ padding:'20px 16px 16px', borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${p},${p}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
              {client?.logo_emoji || '🌐'}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'#f1f5f9' }}>{client?.company_name || 'eToro'}</div>
              <div style={{ fontSize:11, color:'#475569' }}>Intelligence Portal</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
          {NAV.map(n => (
            <button key={n.id} className={`nav-b${tab===n.id?' on':''}`} onClick={() => setTab(n.id)}>
              <span style={{ fontSize:15 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'12px 16px', borderTop:`1px solid ${BORDER}` }}>
          <div style={{ fontSize:10, color:'#334155', marginBottom:4 }}>
            Last sync: {lastRefresh.toLocaleTimeString()}
          </div>
          <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', fontSize:12, padding:'7px 12px' }} onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <span className="spin">⟳</span> : '⟳'} {refreshing ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflow:'auto' }}>
        {/* Header */}
        <div style={{ padding:'20px 32px', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(8,15,30,0.8)', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:10 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, color:'#f1f5f9' }}>
              {NAV.find(n=>n.id===tab)?.icon} {NAV.find(n=>n.id===tab)?.label}
            </h1>
            <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>
              {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#10b981', background:'rgba(16,185,129,0.12)', padding:'4px 10px', borderRadius:6 }}>● Live</span>
            <button className="btn btn-primary" onClick={handleRefresh} disabled={refreshing} style={{ fontSize:12, padding:'7px 14px' }}>
              {refreshing ? <span className="spin">⟳</span> : '⟳'} {refreshing ? 'Syncing…' : 'Refresh All'}
            </button>
          </div>
        </div>

        <div style={{ padding:'28px 32px' }} className="fade">

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <div>
              {/* KPI Grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
                {[
                  { label:'Total Article Views', value: fmtNum(totalViews), sub:'across all portals', icon:'👁', color:'#0ea5e9' },
                  { label:'Page Views (30d)', value: fmtNum(totalPageViews), sub:'real visitors tracked', icon:'📊', color:'#10b981' },
                  { label:'Articles Published', value: totalArticles, sub:`on ${portalsActive} portals`, icon:'📰', color:'#8b5cf6' },
                  { label:'Podcasts Created', value: podcastCount, sub:'episodes produced', icon:'🎙', color:'#f59e0b' },
                ].map(k => (
                  <div key={k.label} className="kpi">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em' }}>{k.label}</div>
                      <span style={{ fontSize:18 }}>{k.icon}</span>
                    </div>
                    <div style={{ fontSize:32, fontWeight:900, color:'#f1f5f9', lineHeight:1 }}>{k.value}</div>
                    <div style={{ fontSize:11, color:'#475569', marginTop:6 }}>{k.sub}</div>
                    <div style={{ height:2, background:`${k.color}30`, borderRadius:1, marginTop:12 }}>
                      <div style={{ width:'65%', height:'100%', background:k.color, borderRadius:1 }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Two column: Recent Articles + Portal Status */}
              <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20 }}>
                <div className="card">
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:16, display:'flex', justifyContent:'space-between' }}>
                    Latest Coverage
                    <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>setTab('articles')}>View all →</button>
                  </div>
                  {content.slice(0,6).map((c: any, i: number) => {
                    const port = PORTALS.find(p => p.name === c.portal_name)
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:`${port?.color || '#475569'}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:port?.color || '#475569', flexShrink:0 }}>
                          {(port?.name || 'P').slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <a href={c.article_url} target="_blank" rel="noopener" style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {c.article_title}
                          </a>
                          <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>
                            {c.portal_name} · {timeAgo(c.published_at)}
                          </div>
                        </div>
                        <a href={c.article_url} target="_blank" rel="noopener" style={{ fontSize:11, color:p, flexShrink:0 }}>↗</a>
                      </div>
                    )
                  })}
                </div>

                <div className="card">
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Portal Coverage</div>
                  {PORTALS.map(port => {
                    const count = content.filter((c: any) => c.portal_name === port.name).length
                    const maxCount = Math.max(...PORTALS.map(p2 => content.filter((c: any) => c.portal_name === p2.name).length), 1)
                    return (
                      <div key={port.slug} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, color:'#94a3b8' }}>{port.name}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:port.color }}>{count}</span>
                        </div>
                        <div className="bar">
                          <div className="bar-fill" style={{ width:`${(count/maxCount)*100}%`, background:port.color }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ARTICLES ═══ */}
          {tab === 'articles' && (
            <div className="fade">
              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>
                  All Brand Articles — {totalArticles} published
                </div>
                <div style={{ fontSize:12, color:'#475569' }}>Every article mentioning your brand across all 9 portals. Sorted by most recent.</div>
              </div>
              <div className="card" style={{ overflowX:'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Portal</th>
                      <th>Published</th>
                      <th style={{textAlign:'right'}}>Views</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.map((c: any, i: number) => {
                      const port = PORTALS.find(p => p.name === c.portal_name)
                      return (
                        <tr key={i}>
                          <td style={{ maxWidth:320 }}>
                            <div style={{ fontSize:13, fontWeight:500, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {c.article_title}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, background:`${port?.color || '#475569'}20`, color:port?.color || '#94a3b8' }}>
                              {c.portal_name}
                            </span>
                          </td>
                          <td style={{ color:'#64748b', fontSize:12 }}>{fmtDate(c.published_at)}</td>
                          <td style={{ textAlign:'right', fontWeight:700, color:'#38bdf8' }}>
                            {c.news_articles?.views || 0}
                          </td>
                          <td>
                            <a href={c.article_url} target="_blank" rel="noopener" style={{ fontSize:11, color:p, fontWeight:600 }}>
                              View ↗
                            </a>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ ANALYTICS ═══ */}
          {tab === 'analytics' && (
            <div className="fade">
              {loadingAnalytics && (
                <div style={{ textAlign:'center', padding:40, color:'#475569' }}>
                  <span className="spin" style={{ display:'inline-block', fontSize:24 }}>⟳</span>
                  <div style={{ marginTop:8 }}>Loading analytics…</div>
                </div>
              )}
              {analytics && (
                <div>
                  {/* KPIs */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
                    {[
                      { label:'Page Views (30d)', value: fmtNum(analytics.totalPageViews) },
                      { label:'Article Views', value: fmtNum(analytics.totalArticleViews) },
                      { label:'Top Country', value: analytics.countries?.[0]?.country || '—' },
                    ].map(k => (
                      <div key={k.label} className="kpi" style={{ padding:'16px 20px' }}>
                        <div style={{ fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>{k.label}</div>
                        <div style={{ fontSize:28, fontWeight:900, color:p }}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    {/* Top articles by views */}
                    <div className="card">
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Top Articles by Views</div>
                      {(analytics.topArticles || []).slice(0,8).map((a: any, i: number) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <a href={a.url} target="_blank" rel="noopener" style={{ fontSize:12, fontWeight:500, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>
                              {a.title}
                            </a>
                            <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{a.portal}</div>
                          </div>
                          <span style={{ fontSize:13, fontWeight:700, color:'#38bdf8', marginLeft:12, flexShrink:0 }}>{fmtNum(a.views)}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      {/* By portal */}
                      <div className="card" style={{ marginBottom:20 }}>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Views by Portal</div>
                        {(analytics.byPortal || []).slice(0,6).map((b: any, i: number) => {
                          const port = PORTALS.find(p2 => p2.slug === b.slug)
                          const max = analytics.byPortal?.[0]?.views || 1
                          return (
                            <div key={i} style={{ marginBottom:10 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                                <span style={{ fontSize:12, color:'#94a3b8' }}>{port?.name || b.slug}</span>
                                <span style={{ fontSize:12, fontWeight:700, color:port?.color || '#94a3b8' }}>{b.views}</span>
                              </div>
                              <div className="bar">
                                <div className="bar-fill" style={{ width:`${(b.views/max)*100}%`, background:port?.color || p }}/>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Devices */}
                      <div className="card">
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Device Split</div>
                        <div style={{ display:'flex', gap:16 }}>
                          {Object.entries(analytics.devices || {}).map(([d, v]: [string, any]) => (
                            <div key={d} style={{ flex:1, textAlign:'center' }}>
                              <div style={{ fontSize:22 }}>{d==='mobile'?'📱':d==='tablet'?'📟':'🖥'}</div>
                              <div style={{ fontSize:20, fontWeight:800, color:p, marginTop:4 }}>{v}</div>
                              <div style={{ fontSize:10, color:'#475569', textTransform:'capitalize' }}>{d}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daily chart */}
                  {analytics.daily?.length > 0 && (
                    <div className="card" style={{ marginTop:20 }}>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Daily Page Views (30 days)</div>
                      <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:80 }}>
                        {analytics.daily.slice(-30).map((d: any) => {
                          const max = Math.max(...analytics.daily.map((x: any) => x.views), 1)
                          return (
                            <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                              <div title={`${d.date}: ${d.views} views`} style={{ width:'100%', height:`${Math.max(4,(d.views/max)*72)}px`, background:p, borderRadius:'2px 2px 0 0', opacity:.8, cursor:'default' }}/>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ PODCASTS ═══ */}
          {tab === 'podcasts' && (
            <div className="fade">
              <div className="card" style={{ marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>
                  🎙 {podcastCount} Podcast{podcastCount !== 1 ? 's' : ''} Produced
                </div>
                <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>
                  All episodes are published on your portal network. Download MP3 or share the live URL.
                </div>
              </div>
              {podcasts.length === 0 ? (
                <div className="card" style={{ textAlign:'center', padding:40, color:'#475569' }}>
                  No podcasts published yet. Generate one from the Admin panel.
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {podcasts.map((pod: any, i: number) => (
                    <div key={pod.id} className="card" style={{ border:`1px solid rgba(14,165,233,0.15)` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:'#f1f5f9', marginBottom:4 }}>
                            {pod.title || `Episode ${i+1}`}
                          </div>
                          <div style={{ fontSize:11, color:'#475569' }}>
                            Hosted by {pod.host_name} · Guest: {pod.guest_name}
                            {pod.duration_minutes ? ` · ${pod.duration_minutes} min` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:'rgba(16,185,129,0.15)', color:'#10b981', fontWeight:600, flexShrink:0 }}>
                          ✓ Published
                        </span>
                      </div>

                      {/* Audio player */}
                      {pod.mp3_url && (
                        <div style={{ marginBottom:12 }}>
                          <audio controls src={pod.mp3_url} style={{ width:'100%', height:36 }} preload="none">
                            Your browser does not support audio playback.
                          </audio>
                        </div>
                      )}

                      <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>
                        Published: {fmtDate(pod.published_at || pod.created_at)}
                      </div>

                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {pod.mp3_url && (
                          <a href={pod.mp3_url} download={`${pod.title || 'podcast'}.mp3`} target="_blank" rel="noopener">
                            <button className="btn btn-ghost" style={{ fontSize:11, padding:'6px 12px' }}>
                              ⬇ Download MP3
                            </button>
                          </a>
                        )}
                        {/* Show live portal URLs */}
                        {PORTALS.filter(port => !pod.news_site_id || true).slice(0,3).map(port => (
                          <a key={port.slug} href={`https://${port.domain}`} target="_blank" rel="noopener">
                            <button className="btn btn-ghost" style={{ fontSize:10, padding:'5px 10px' }}>
                              🌐 {port.name}
                            </button>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ RANKINGS / LIVE SEARCH ═══ */}
          {tab === 'rankings' && (
            <div className="fade">
              <div className="card" style={{ marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>🔍 Live Search Rankings</div>
                <div style={{ fontSize:12, color:'#475569', marginBottom:16 }}>
                  Check real-time Google results for any keyword. See where your brand ranks and what competitors we're displacing.
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <input
                    className="inp"
                    placeholder='Enter keyword e.g. "eToro review 2026"'
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && checkRankings(keyword)}
                  />
                  <button className="btn btn-primary" onClick={() => checkRankings(keyword)} disabled={serpLoading || !keyword.trim()} style={{ whiteSpace:'nowrap' }}>
                    {serpLoading ? <span className="spin">⟳</span> : '🔍'} {serpLoading ? 'Checking…' : 'Check Now'}
                  </button>
                </div>

                {/* Quick keywords */}
                <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'#475569' }}>Quick check:</span>
                  {savedKeywords.map(kw => (
                    <button key={kw} className="btn btn-ghost" style={{ fontSize:11, padding:'4px 10px' }}
                      onClick={() => { setKeyword(kw); checkRankings(kw) }}>
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {serpLoading && (
                <div className="card" style={{ textAlign:'center', padding:40 }}>
                  <span className="spin" style={{ display:'inline-block', fontSize:28, color:p }}>⟳</span>
                  <div style={{ marginTop:12, color:'#64748b' }}>Searching Google for <strong style={{color:'#f1f5f9'}}>"{keyword}"</strong>…</div>
                  <div style={{ fontSize:11, color:'#334155', marginTop:4 }}>Live search takes 5–15 seconds</div>
                </div>
              )}

              {serpError && (
                <div className="card" style={{ background:'rgba(239,68,68,0.08)', borderColor:'rgba(239,68,68,0.2)', color:'#fca5a5' }}>
                  Error: {serpError}
                </div>
              )}

              {serpResults && (
                <div className="fade">
                  {/* Summary */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
                    <div className="kpi">
                      <div style={{ fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Your Portals Found</div>
                      <div style={{ fontSize:36, fontWeight:900, color:'#10b981' }}>
                        {serpResults.results?.filter((r: any) => r.isOurs).length || 0}
                      </div>
                      <div style={{ fontSize:11, color:'#475569' }}>in top 10 results</div>
                    </div>
                    <div className="kpi">
                      <div style={{ fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Competitors Found</div>
                      <div style={{ fontSize:36, fontWeight:900, color:'#f59e0b' }}>
                        {serpResults.results?.filter((r: any) => !r.isOurs).length || 0}
                      </div>
                      <div style={{ fontSize:11, color:'#475569' }}>other domains</div>
                    </div>
                    <div className="kpi">
                      <div style={{ fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Checked At</div>
                      <div style={{ fontSize:16, fontWeight:700, color:'#f1f5f9', marginTop:4 }}>
                        {new Date(serpResults.checkedAt).toLocaleTimeString()}
                      </div>
                      <div style={{ fontSize:11, color:'#475569' }}>live result</div>
                    </div>
                  </div>

                  {/* Results table */}
                  <div className="card">
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      Results for "{serpResults.keyword}"
                      <button className="btn btn-ghost" style={{fontSize:11,padding:'5px 10px'}} onClick={() => checkRankings(serpResults.keyword)}>
                        ⟳ Re-check
                      </button>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th style={{width:40}}>#</th>
                          <th>Title</th>
                          <th>Domain</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(serpResults.results || []).map((r: any, i: number) => (
                          <tr key={i} style={{ background: r.isOurs ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                            <td style={{ fontWeight:700, color: r.isOurs ? '#10b981' : '#475569' }}>{r.position || i+1}</td>
                            <td>
                              <a href={r.url} target="_blank" rel="noopener" style={{ color: r.isOurs ? '#6ee7b7' : '#e2e8f0', fontWeight: r.isOurs ? 600 : 400, fontSize:13 }}>
                                {r.title}
                              </a>
                              {r.snippet && <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{r.snippet?.slice(0,100)}…</div>}
                            </td>
                            <td style={{ fontSize:12, color:'#64748b' }}>{r.domain || (r.url ? new URL(r.url).hostname : '—')}</td>
                            <td>
                              {r.isOurs ? (
                                <span className="tag" style={{ background:'rgba(16,185,129,0.15)', color:'#10b981' }}>✓ Our Portal</span>
                              ) : (
                                <span className="tag" style={{ background:'rgba(100,116,139,0.15)', color:'#64748b' }}>Competitor</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ COVERAGE ═══ */}
          {tab === 'coverage' && (
            <div className="fade">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {PORTALS.map(port => {
                  const articles = content.filter((c: any) => c.portal_name === port.name)
                  const latest = articles[0]
                  return (
                    <div key={port.slug} className="card" style={{ border:`1px solid ${port.color}20`, position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, background:`${port.color}08`, borderRadius:'50%', filter:'blur(20px)' }}/>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <div style={{ width:36, height:36, borderRadius:8, background:`${port.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:port.color }}>
                          {port.name.slice(0,2).toUpperCase()}
                        </div>
                        <span className="tag" style={{ background: articles.length > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.1)', color: articles.length > 0 ? '#10b981' : '#475569' }}>
                          {articles.length > 0 ? '✓ Active' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontWeight:700, fontSize:14, color:'#f1f5f9', marginBottom:2 }}>{port.name}</div>
                      <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>{port.domain}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:10 }}>
                        <span style={{ color:'#64748b' }}>Articles published</span>
                        <span style={{ fontWeight:700, color:port.color }}>{articles.length}</span>
                      </div>
                      {latest && (
                        <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>
                          Last: {timeAgo(latest.published_at)}
                        </div>
                      )}
                      <a href={`https://${port.domain}`} target="_blank" rel="noopener">
                        <button className="btn btn-ghost" style={{ fontSize:11, padding:'6px 12px', width:'100%', justifyContent:'center' }}>
                          🌐 Visit Portal ↗
                        </button>
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ═══ REVIEWS ═══ */}
          {tab === 'reviews' && (
            <div className="fade">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
                {[
                  { label:'Avg Rating', value: avgRating, icon:'⭐' },
                  { label:'Total Reviews', value: reviews.length, icon:'💬' },
                  { label:'Positive (4★+)', value: reviews.filter((r: any) => r.rating >= 4).length, icon:'✅' },
                ].map(k => (
                  <div key={k.label} className="kpi">
                    <div style={{ fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>{k.label}</div>
                    <div style={{ fontSize:36, fontWeight:900, color:p }}>{k.icon} {k.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Verivex Trust Reviews</div>
                {reviews.slice(0,20).map((r: any, i: number) => (
                  <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{r.reviewer_name || 'Anonymous'}</span>
                      <div style={{ display:'flex', gap:2 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : '#1e293b', fontSize:14 }}>★</span>)}
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6 }}>{r.review_text}</div>
                    <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>{timeAgo(r.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
