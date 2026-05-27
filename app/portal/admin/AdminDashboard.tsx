'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

const SITE_ROUTES: Record<string,string> = {
  'global-trade-wire':'news','finance-terminal':'finance','gold-markets-today':'commodities',
  'business-pulse':'magazine','trust-score':'reviews-hub','company-pedia':'wiki',
  'press-central':'pressroom','invest-data':'investdb','trade-board':'forum',
  'global-trade-assoc':'association','executive-network':'executive','market-radar':'market-radar',
}

const ADMIN_NAV = [
  { icon:'🏠', label:'Overview',    id:'overview'  },
  { icon:'👥', label:'Clients',     id:'clients'   },
  { icon:'📰', label:'All Content', id:'content'   },
  { icon:'📊', label:'Rankings',    id:'rankings'  },
  { icon:'🌐', label:'12 Portals',  id:'portals'   },
  { icon:'🎙', label:'Podcasts',    id:'podcasts'  },
  { icon:'📧', label:'Subscribers', id:'subs'      },
  { icon:'⚙️', label:'Settings',    id:'settings'  },
]

export default function AdminDashboard({ clients, allContent, allRankings, allPodcasts, allActivity, sites, totalArticles, totalSubscribers }: any) {
  const [tab, setTab] = useState('overview')
  const [clock, setClock] = useState('')
  const router = useRouter()

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' })), 1000)
    setClock(new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' }))
    return () => clearInterval(t)
  }, [])

  // Auth guard
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('rephub_session') || '{}')
      if (s.role !== 'superadmin') router.push('/portal')
    } catch { router.push('/portal') }
  }, [])

  function logout() {
    localStorage.removeItem('rephub_session')
    router.push('/portal')
  }

  const page1Rankings = allRankings.filter((r: any) => r.current_position <= 10)
  const publishedPodcasts = allPodcasts.filter((p: any) => p.status === 'published')
  const totalViews = allContent.reduce((s: number, c: any) => s + (c.views || 0), 0)

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0B0F19', fontFamily:"'DM Sans',sans-serif", color:'#F1F5F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .nav-b{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:#64748b;transition:all .2s;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
        .nav-b:hover{background:rgba(255,255,255,0.05);color:#F1F5F9}
        .nav-b.on{background:rgba(239,68,68,0.15);color:#EF4444;font-weight:700;border:1px solid rgba(239,68,68,0.25)}
        .card{background:linear-gradient(135deg,#141B2D,#1C2333);border:1px solid rgba(255,255,255,0.08);border-radius:12px}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:700}
        .bg{background:rgba(16,185,129,0.15);color:#10B981;border:1px solid rgba(16,185,129,0.3)}
        .bb{background:rgba(14,165,233,0.15);color:#0EA5E9;border:1px solid rgba(14,165,233,0.3)}
        .br{background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.3)}
        .by{background:rgba(245,158,11,0.15);color:#F59E0B;border:1px solid rgba(245,158,11,0.3)}
        .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .2s}
        .b-pri{background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff}
        .b-blu{background:linear-gradient(135deg,#0EA5E9,#818CF8);color:#fff}
        .b-ghost{background:rgba(255,255,255,0.06);color:#94A3B8;border:1px solid rgba(255,255,255,0.10)}
        .b-ghost:hover{border-color:#0EA5E9;color:#0EA5E9}
        .trow:hover{background:rgba(255,255,255,0.025)}
        @media(max-width:768px){.adm-sidebar{width:60px!important} .adm-label{display:none!important}}
      `}</style>

      {/* ─ SIDEBAR ─ */}
      <aside className="adm-sidebar" style={{ width:240, background:'#0D1117', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', position:'fixed', top:0, bottom:0, left:0, zIndex:50 }}>
        {/* Logo */}
        <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <Link href="https://rephuby.com">
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:900 }}>
              Rep<span style={{ background:'linear-gradient(135deg,#EF4444,#DC2626)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Hub</span>
            </div>
          </Link>
          <div style={{ fontSize:10, color:'#EF4444', marginTop:2, fontWeight:700, letterSpacing:'0.08em' }} className="adm-label">⚙ ADMIN COMMAND CENTER</div>
        </div>

        {/* Admin profile */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:10, alignItems:'center' }} className="adm-label">
          <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#EF4444,#DC2626)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16 }}>S</div>
          <div>
            <div style={{ fontWeight:700, fontSize:13 }}>Solly</div>
            <div style={{ fontSize:10, color:'#475569' }}>Super Admin · RepHub</div>
          </div>
        </div>

        {/* System health */}
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }} className="adm-label">
          <div style={{ fontSize:10, fontWeight:700, color:'#475569', letterSpacing:'0.06em', marginBottom:8 }}>SYSTEM STATUS</div>
          {[
            { label:'12 Portals', status:'Online', color:'#10B981' },
            { label:'Cron Job', status:'7:00 AM ✓', color:'#10B981' },
            { label:'AI Engine', status:'Active', color:'#10B981' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
              <span style={{ color:'#64748b' }}>{s.label}</span>
              <span style={{ color:s.color, fontWeight:700 }}>● {s.status}</span>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px', overflow:'auto' }}>
          {ADMIN_NAV.map(n => (
            <button key={n.id} className={`nav-b ${tab===n.id?'on':''}`} onClick={() => setTab(n.id)}>
              <span style={{ fontSize:16 }}>{n.icon}</span>
              <span className="adm-label">{n.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/portal/dashboard">
            <button className="btn b-ghost" style={{ width:'100%', justifyContent:'center', marginBottom:8, fontSize:12 }} className="adm-label">
              👤 View Client Portal
            </button>
          </Link>
          <button onClick={logout} style={{ width:'100%', padding:'8px', background:'transparent', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#EF4444', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─ MAIN ─ */}
      <main style={{ marginLeft:240, flex:1, overflowY:'auto' }}>

        {/* Top bar */}
        <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(13,17,23,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800 }}>
            {ADMIN_NAV.find(n => n.id === tab)?.icon} {ADMIN_NAV.find(n => n.id === tab)?.label}
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981', animation:'pulse 1.5s ease-in-out infinite' }}></div>
              <span style={{ color:'#10B981', fontWeight:700 }}>All Systems Live</span>
              <span style={{ color:'#334155', margin:'0 4px' }}>·</span>
              <span style={{ color:'#475569', fontFamily:'monospace' }}>{clock}</span>
            </div>
            <Link href="https://rephuby.com" target="_blank">
              <button className="btn b-ghost" style={{ fontSize:12 }}>View Site ↗</button>
            </Link>
          </div>
        </div>

        <div style={{ padding:'28px' }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              {/* KPIs */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
                {[
                  { label:'Active Clients', value:clients.length, icon:'👥', color:'#EF4444', sub:'On RepHub network' },
                  { label:'Articles Published', value:totalArticles.toLocaleString(), icon:'📰', color:'#0EA5E9', sub:'Across all 12 portals' },
                  { label:'Newsletter Subscribers', value:totalSubscribers.toLocaleString(), icon:'📧', color:'#10B981', sub:'Total opt-in emails' },
                  { label:'Content Pieces', value:allContent.length, icon:'🎯', color:'#F59E0B', sub:'For active clients' },
                ].map(k => (
                  <div key={k.label} className="card" style={{ padding:'20px 22px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:26 }}>{k.icon}</span>
                      <span style={{ width:10, height:10, borderRadius:'50%', background:k.color, display:'block', marginTop:4, animation:'pulse 2s ease-in-out infinite' }}></span>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:900, color:k.color, lineHeight:1, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{k.label}</div>
                    <div style={{ fontSize:12, color:'#475569' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
                {/* 12 Portal Stats */}
                <div className="card" style={{ padding:24 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:16 }}>🌐 12-Portal Network Status</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {sites.map((site: any) => (
                      <Link key={site.id} href={`https://rephuby.com/${SITE_ROUTES[site.slug]||'news'}/${site.slug}`} target="_blank">
                        <div style={{ display:'flex', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:`1px solid ${site.primary_color}30`, borderLeft:`3px solid ${site.primary_color}`, borderRadius:8, cursor:'pointer' }}>
                          <div style={{ width:32, height:32, borderRadius:6, background:`${site.primary_color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:14, color:site.primary_color, flexShrink:0 }}>
                            {site.name.charAt(0)}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:13, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{site.name}</div>
                            <div style={{ fontSize:11 }}><span style={{ color:'#10B981' }}>● Live</span> <span style={{ color:'#475569' }}>· {site.site_type}</span></div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Live Activity */}
                <div className="card" style={{ padding:24 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:16 }}>⚡ Recent Activity</div>
                  {allActivity.slice(0,8).map((a: any, i: number) => (
                    <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>
                        {a.type==='rank_improved'?'🚀':a.type==='article_published'?'📰':a.type==='podcast_ready'?'🎙':'✨'}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
                        <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>{timeAgo(a.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="card" style={{ padding:24 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:16 }}>⚡ Quick Actions</div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <Link href="/api/cron-update" target="_blank"><button className="btn b-blu">🤖 Trigger AI Article Generation</button></Link>
                  <a href="https://supabase.com/dashboard/project/gykxxhxsakxhfuutgobb" target="_blank"><button className="btn b-ghost">🗄 Open Supabase DB</button></a>
                  <a href="https://vercel.com/sollymarks95-ctrl/reputationhub" target="_blank"><button className="btn b-ghost">🚀 Open Vercel Dashboard</button></a>
                  <a href="https://t.me/rephub_intelligence" target="_blank"><button className="btn b-ghost">📱 Telegram Channel</button></a>
                  <Link href="https://rephuby.com/sitemap.xml" target="_blank"><button className="btn b-ghost">🗺 Sitemap</button></Link>
                </div>
              </div>
            </div>
          )}

          {/* ── CLIENTS ── */}
          {tab === 'clients' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div style={{ fontSize:14, color:'#64748b' }}>{clients.length} active client{clients.length!==1?'s':''}</div>
                <a href="https://t.me/rephub_intelligence" target="_blank"><button className="btn b-pri">+ Onboard New Client</button></a>
              </div>
              {clients.map((c: any) => (
                <div key={c.id} className="card" style={{ padding:24, marginBottom:14 }}>
                  <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:16 }}>
                    <div style={{ width:52, height:52, borderRadius:10, background:`linear-gradient(135deg,${c.primary_color||'#0EA5E9'},#1d4ed8)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22 }}>
                      {c.company_name.charAt(0)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>{c.company_name}</div>
                      <div style={{ display:'flex', gap:10, marginTop:4, flexWrap:'wrap', fontSize:12, color:'#64748b' }}>
                        {c.website_url && <a href={c.website_url} target="_blank" style={{ color:'#0EA5E9' }}>{c.website_url}</a>}
                        <span>· {c.regulation}</span>
                        <span>· {c.tier?.toUpperCase()} tier</span>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:40, fontWeight:900, color:c.primary_color||'#0EA5E9', lineHeight:1 }}>{c.brand_score}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>Brand Score</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                    {[
                      { label:'Content', value:allContent.filter((x:any)=>x.client_id===c.id).length },
                      { label:'Page 1 Keywords', value:allRankings.filter((x:any)=>x.client_id===c.id&&x.current_position<=10).length },
                      { label:'Podcasts', value:allPodcasts.filter((x:any)=>x.client_id===c.id&&x.status==='published').length },
                      { label:'AM', value:c.account_manager?.split('—')[0]?.trim()||'RepHub' },
                    ].map(m => (
                      <div key={m.label} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:8, textAlign:'center' }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:'#F1F5F9' }}>{m.value}</div>
                        <div style={{ fontSize:11, color:'#475569' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CONTENT ── */}
          {tab === 'content' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div className="card" style={{ overflow:'hidden' }}>
                <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800 }}>All Client Content ({allContent.length})</div>
                  <span style={{ fontSize:13, color:'#475569' }}>Total views: {totalViews?.toLocaleString()}</span>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                    <thead>
                      <tr style={{ background:'rgba(255,255,255,0.02)', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                        {['Title','Portal','Type','Published','Views','Authority'].map(h => <th key={h} style={{ padding:'10px 14px', textAlign:'left' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {allContent.map((c: any, i: number) => (
                        <tr key={i} className="trow" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                          <td style={{ padding:'10px 14px', maxWidth:300 }}>
                            <a href={c.article_url} target="_blank">
                              <div style={{ fontWeight:600, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                            </a>
                          </td>
                          <td style={{ padding:'10px 14px' }}><span style={{ color:'#0EA5E9', fontWeight:700, fontSize:12 }}>{c.portal_name}</span></td>
                          <td style={{ padding:'10px 14px' }}><span className={`badge ${c.content_type==='analysis'?'bb':c.content_type==='press_release'?'by':c.content_type==='interview'?'bg':'bb'}`}>{c.content_type}</span></td>
                          <td style={{ padding:'10px 14px', color:'#64748b', fontSize:12 }}>{timeAgo(c.published_at)}</td>
                          <td style={{ padding:'10px 14px', fontWeight:700, color:'#94A3B8' }}>{c.views?.toLocaleString()}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ width:60, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${c.backlink_value}%`, background:'linear-gradient(90deg,#0EA5E9,#10B981)', borderRadius:2 }}></div>
                              </div>
                              <span style={{ fontSize:11, color:'#64748b' }}>{c.backlink_value}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── RANKINGS ── */}
          {tab === 'rankings' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
                {[
                  { label:'Page 1 Keywords', value:page1Rankings.length, color:'#10B981', icon:'🏆' },
                  { label:'Top 3 Rankings', value:allRankings.filter((r:any)=>r.current_position<=3).length, color:'#F59E0B', icon:'🥇' },
                  { label:'Total Tracked', value:allRankings.length, color:'#0EA5E9', icon:'📊' },
                ].map(k => (
                  <div key={k.label} className="card" style={{ padding:'20px 24px', display:'flex', gap:16, alignItems:'center' }}>
                    <div style={{ width:52, height:52, borderRadius:12, background:`${k.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{k.icon}</div>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:38, fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>
                      <div style={{ fontSize:13, color:'#94A3B8', marginTop:2 }}>{k.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:24 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:16 }}>All Keyword Rankings</div>
                {allRankings.map((r: any, i: number) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 80px 100px', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                    <span style={{ fontWeight:600 }}>{r.keyword}</span>
                    <span style={{ fontSize:12, color:'#0EA5E9', fontWeight:600 }}>{r.portal_name}</span>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:900, color:r.current_position<=3?'#10B981':r.current_position<=10?'#F59E0B':'#EF4444' }}>#{r.current_position}</span>
                    <span style={{ color:r.current_position<r.previous_position?'#10B981':'#EF4444', fontSize:12, fontWeight:700 }}>
                      {r.current_position<r.previous_position?`▲ from #${r.previous_position}`:`▼ from #${r.previous_position}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PORTALS ── */}
          {tab === 'portals' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                {sites.map((site: any) => (
                  <div key={site.id} className="card" style={{ padding:20 }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
                      <div style={{ width:44, height:44, borderRadius:10, background:`linear-gradient(135deg,${site.primary_color}40,${site.primary_color}20)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18, color:site.primary_color }}>
                        {site.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16 }}>{site.name}</div>
                        <div style={{ fontSize:11, color:'#475569' }}>{site.site_type}</div>
                      </div>
                      <span className="badge bg" style={{ marginLeft:'auto' }}>● Live</span>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <Link href={`https://rephuby.com/${SITE_ROUTES[site.slug]||'news'}/${site.slug}`} target="_blank">
                        <button className="btn b-ghost" style={{ fontSize:12 }}>View Site ↗</button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PODCASTS ── */}
          {tab === 'podcasts' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
                {allPodcasts.map((ep: any, i: number) => (
                  <div key={i} className="card" style={{ padding:22 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:11, color:'#475569', fontWeight:700 }}>EP. {ep.episode_number}</span>
                      <span className={`badge ${ep.status==='published'?'bg':ep.status==='generating'?'by':'bb'}`}>
                        {ep.status==='generating'?'⟳ Generating':ep.status==='published'?'✓ Live':ep.status}
                      </span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:15, marginBottom:8, lineHeight:1.3 }}>{ep.title}</div>
                    {ep.description && <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>{ep.description?.slice(0,120)}...</div>}
                    <div style={{ display:'flex', gap:6, marginTop:12 }}>
                      {ep.duration_minutes>0 && <span className="badge bb">⏱ {ep.duration_minutes}min</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === 'settings' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                {[
                  { title:'🌐 Domain', value:'rephuby.com', sub:'Live on Vercel. Custom domain verified.', action:'Open Vercel', href:'https://vercel.com' },
                  { title:'🗄 Database', value:'Supabase (EU)', sub:'gykxxhxsakxhfuutgobb · eu-central-1', action:'Open DB', href:'https://supabase.com/dashboard/project/gykxxhxsakxhfuutgobb' },
                  { title:'🤖 AI Cron', value:'Daily 7:00 AM IST', sub:'36 articles/day across 12 portals', action:'Trigger Now', href:'/api/cron-update' },
                  { title:'📧 Newsletter', value:'Email Capture', sub:'All emails stored in newsletter_subscribers', action:'View Table', href:'https://supabase.com' },
                ].map(s => (
                  <div key={s.title} className="card" style={{ padding:24 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:8 }}>{s.title}</div>
                    <div style={{ fontFamily:'monospace', fontSize:14, color:'#0EA5E9', marginBottom:6 }}>{s.value}</div>
                    <div style={{ fontSize:12, color:'#475569', marginBottom:16 }}>{s.sub}</div>
                    <a href={s.href} target="_blank"><button className="btn b-ghost" style={{ fontSize:13 }}>{s.action} ↗</button></a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
