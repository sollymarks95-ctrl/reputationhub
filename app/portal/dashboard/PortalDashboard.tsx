'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const NAV = [
  { icon:'🏠', label:'Dashboard',   id:'overview'  },
  { icon:'⭐', label:'Reviews',     id:'reviews'   },
  { icon:'📊', label:'Rankings',    id:'rankings'  },
  { icon:'📰', label:'Content',     id:'content'   },
  { icon:'🎙', label:'Podcasts',    id:'podcasts'  },
  { icon:'🌐', label:'Coverage',    id:'coverage'  },
  { icon:'📈', label:'Reports',     id:'reports'   },
]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

export default function PortalDashboard({ client, rankings, content, podcasts, activity, reports, coverage, reviews = [] }: any) {
  const [tab, setTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const p = client?.primary_color || '#0EA5E9'

  useEffect(() => {
    try {
      const s = localStorage.getItem('rh_admin') || localStorage.getItem('rephuby_session') || localStorage.getItem('portal_demo') || '{}'
      setUser(JSON.parse(s))
    } catch {}
  }, [])

  function logout() {
    localStorage.removeItem('portal_demo'); localStorage.removeItem('rh_admin'); localStorage.removeItem('rephuby_session')
    router.push('/portal')
  }

  const page1 = rankings.filter((r: any) => r.current_position <= 10).length
  const totalViews = content.reduce((s: number, c: any) => s + (c.views || 0), 0)
  const totalArticles = content.length
  const latestReport = reports[0]
  const avgRating = reviews.length ? (reviews.reduce((s:number,r:any)=>s+r.rating,0)/reviews.length).toFixed(1) : '0'
  const totalReviews = reviews.length
  const positiveReviews = reviews.filter((r:any)=>r.rating>=4).length
  const activeSites = coverage.filter((s:any)=>s.is_active).length
  const suppressedNegatives = activity.filter((a:any)=>a.type==='suppression').length

  const isAdminUser = user?.role === 'superadmin' || user?.email === 'sollymarks95@gmail.com'

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0B0F19', fontFamily:"'DM Sans',sans-serif", color:'#F1F5F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes wave{0%{height:4px}100%{height:22px}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:#64748b;transition:all .2s;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
        .nav-item:hover{background:rgba(255,255,255,0.05);color:#F1F5F9}
        .nav-item.active{background:linear-gradient(135deg,${p}20,${p}10);color:${p};font-weight:700;border:1px solid ${p}30}
        .card{background:linear-gradient(135deg,#141B2D,#1C2333);border:1px solid rgba(255,255,255,0.08);border-radius:12px}
        .metric-card{padding:20px 24px;animation:slideIn .3s ease}
        .badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700}
        .badge-green{background:#10B98118;border:1px solid #10B98140;color:#10B981}
        .badge-blue{background:#0EA5E918;border:1px solid #0EA5E940;color:#0EA5E9}
        .badge-gold{background:#F59E0B18;border:1px solid #F59E0B40;color:#F59E0B}
        .badge-red{background:#EF444418;border:1px solid #EF444440;color:#EF4444}
        .badge-purple{background:#818CF818;border:1px solid #818CF840;color:#818CF8}
        .row{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
        .row:last-child{border-bottom:none}
        .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .2s}
        .btn-primary{background:linear-gradient(135deg,${p},#818CF8);color:#fff}
        .btn-primary:hover{opacity:.9;transform:translateY(-1px)}
        .btn-ghost{background:rgba(255,255,255,0.06);color:#94A3B8;border:1px solid rgba(255,255,255,0.1)}
        .btn-ghost:hover{border-color:${p};color:${p}}
        @media(max-width:768px){.sidebar{width:60px!important}.sidebar .nav-label{display:none!important}.sidebar .logo-text{display:none!important}}
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar" style={{ width:240, background:'linear-gradient(180deg,#111827,#0B0F19)', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', position:'fixed', top: isAdminUser ? 44 : 0, bottom:0, left:0, zIndex:50 }}>
        <div style={{ padding:'20px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/">
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:900, letterSpacing:'-0.03em' }}>
              Rep<span style={{ background:'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }} className="logo-text">Huby</span>
            </div>
          </Link>
          <div style={{ fontSize:10, color:'#475569', marginTop:2, letterSpacing:'0.06em' }} className="logo-text">CLIENT PORTAL</div>
        </div>

        {/* Client info */}
        <div style={{ padding:'16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:`linear-gradient(135deg,${p},#1d4ed8)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, flexShrink:0 }}>
              {client?.company_name?.charAt(0) || 'A'}
            </div>
            <div className="logo-text">
              <div style={{ fontWeight:700, fontSize:13, color:'#F1F5F9' }}>{client?.company_name || 'Your Brand'}</div>
              <div style={{ fontSize:11, color:'#475569' }}>{client?.tier?.toUpperCase()} PLAN</div>
            </div>
          </div>
        </div>

        {/* Brand Score */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }} className="logo-text">
          <div style={{ fontSize:10, fontWeight:700, color:'#475569', letterSpacing:'0.06em', marginBottom:8 }}>BRAND AUTHORITY SCORE</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:900, color:p }}>{client?.brand_score || 84}</div>
            <div>
              <div style={{ fontSize:11, color:'#10B981', fontWeight:700 }}>▲ +12 this month</div>
              <div style={{ fontSize:10, color:'#475569' }}>out of 100</div>
            </div>
          </div>
          <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:4, marginTop:8, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${client?.brand_score || 84}%`, background:`linear-gradient(90deg,${p},#10B981)`, borderRadius:4, transition:'width .5s' }}></div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px', overflow:'auto' }}>
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
              <span style={{ fontSize:16 }}>{n.icon}</span>
              <span className="nav-label logo-text">{n.label}</span>
            </button>
          ))}
        </nav>

        {/* Admin switcher — shown for admin email */}
        {(user?.role === 'superadmin' || user?.email === 'sollymarks95@gmail.com') && (
          <div style={{ padding:'8px 12px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <a href="/portal/admin" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(220,38,38,0.1))', border:'1px solid rgba(239,68,68,0.4)', borderRadius:8, textDecoration:'none', cursor:'pointer' }}>
              <span style={{ fontSize:18 }}>⚙️</span>
              <div className="logo-text">
                <div style={{ fontWeight:700, fontSize:13, color:'#EF4444' }}>Admin Dashboard</div>
                <div style={{ fontSize:10, color:'#EF444480' }}>Switch to admin view</div>
              </div>
              <span style={{ marginLeft:'auto', fontSize:14, color:'#EF4444' }}>→</span>
            </a>
          </div>
        )}

        {/* Bottom */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:11, color:'#475569', marginBottom:6 }} className="logo-text">Account Manager</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#0EA5E9,#10B981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>S</div>
            <div className="logo-text" style={{ fontSize:12, color:'#94A3B8' }}>{client?.account_manager || 'RepHuby Team'}</div>
          </div>
          <a href="https://t.me/rephub_intelligence" target="_blank">
            <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginBottom:8, fontSize:12 }}>
              📱 Message on Telegram
            </button>
          </a>
          <button onClick={logout} style={{ width:'100%', padding:'8px', background:'transparent', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, color:'#475569', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ marginLeft:240, flex:1, overflowY:'auto', minHeight:'100vh', marginTop: isAdminUser ? 44 : 0 }}>

        {/* TOP BAR */}
        <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(11,15,25,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>
              {tab === 'overview' && '🏠 Dashboard Overview'}
              {tab === 'reviews' && '⭐ Verivex Reviews'}
              {tab === 'rankings' && '📊 Google Rankings'}
              {tab === 'content' && '📰 Published Content'}
              {tab === 'podcasts' && '🎙 AI Podcasts'}
              {tab === 'coverage' && '🌐 Portal Coverage'}
              {tab === 'reports' && '📈 Monthly Reports'}
            </h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#10B981' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981', animation:'pulse 1.5s ease-in-out infinite' }}></div>
              Live · {new Date().toLocaleString('en-GB', { hour:'2-digit', minute:'2-digit' })}
            </div>
            <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${p},#1d4ed8)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14 }}>
              {user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        </div>

        <div style={{ padding:'28px' }}>

          {/* ══ OVERVIEW ══════════════════════════════════════════════ */}
                    {tab === 'reviews' && (
            <div>
              {/* Review stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
                {[
                  { label:'Total Reviews', value:reviews.length, color:'#10B981' },
                  { label:'Average Rating', value: reviews.length ? (reviews.reduce((s:number,r:any)=>s+r.rating,0)/reviews.length).toFixed(1)+'★' : 'N/A', color:'#F59E0B' },
                  { label:'5★ Reviews', value:reviews.filter((r:any)=>r.rating===5).length, color:'#6366F1' },
                  { label:'Verified Reviews', value:reviews.filter((r:any)=>r.verified_email).length, color:'#0EA5E9' },
                ].map((s:any) => (
                  <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'20px 18px' }}>
                    <div style={{ fontSize:24, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
                    <div style={{ fontSize:12, color:'#94A3B8' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Reviews list */}
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>eToro — All Verivex Reviews</div>
                  <a href="https://verivex.co/reviews/etoro" target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#0EA5E9', textDecoration:'none' }}>View on Verivex →</a>
                </div>
                {reviews.length === 0 ? (
                  <div style={{ padding:40, textAlign:'center', color:'#64748B' }}>No reviews yet</div>
                ) : reviews.map((r:any) => (
                  <div key={r.id} style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:16, alignItems:'flex-start' }}>
                    <div style={{ flexShrink:0 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#0EA5E9)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14 }}>
                        {(r.reviewer_name||'A')[0].toUpperCase()}
                      </div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700, fontSize:13 }}>{r.reviewer_name || 'Anonymous'}</span>
                        <span style={{ color:'#F59E0B', fontSize:13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                        {r.verified_email && <span style={{ fontSize:10, background:'rgba(16,185,129,0.15)', color:'#10B981', padding:'2px 8px', borderRadius:4, fontWeight:600 }}>✓ Verified</span>}
                        {r.is_pinned && <span style={{ fontSize:10, background:'rgba(99,102,241,0.15)', color:'#6366F1', padding:'2px 8px', borderRadius:4, fontWeight:600 }}>📌 Featured</span>}
                        <span style={{ fontSize:11, color:'#64748B', marginLeft:'auto' }}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', marginBottom:4 }}>{r.title}</div>
                      <div style={{ fontSize:12, color:'#94A3B8', lineHeight:1.6 }}>{r.body?.slice(0,200)}{(r.body||'').length>200?'...':''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

{tab === 'overview' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              {/* KPI Row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
                {[
                  { label:'Articles Published', value:content.length, sub:`Across ${activeSites} portals`, icon:'📰', color:'#0EA5E9', change:`${coverage.filter((s:any)=>s.is_active).length} sites active` },
                  { label:'Keywords on Page 1', value:page1, sub:`of ${rankings.length} tracked`, icon:'🎯', color:'#10B981', change:`${rankings.filter((r:any)=>r.current_position===1).length} in #1 position` },
                  { label:'Verivex Reviews', value:totalReviews, sub:`${avgRating}★ average rating`, icon:'⭐', color:'#F59E0B', change:`${positiveReviews} positive (${totalReviews ? Math.round(positiveReviews/totalReviews*100) : 0}%)` },
                  { label:'Negative Suppressed', value:suppressedNegatives, sub:'Results pushed down', icon:'🛡', color:'#818CF8', change:'Page 1 protected' },
                ].map(k => (
                  <div key={k.label} className="card metric-card">
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:24 }}>{k.icon}</span>
                      <span style={{ fontSize:11, color:'#10B981', fontWeight:700 }}>{k.change}</span>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:900, color:k.color, lineHeight:1, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#F1F5F9' }}>{k.label}</div>
                    <div style={{ fontSize:12, color:'#475569' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Main grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, marginBottom:20 }}>
                {/* Rank Tracker */}
                <div className="card" style={{ padding:24 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800 }}>🎯 Google Rank Tracker</h3>
                    <button className="btn btn-ghost" onClick={() => setTab('rankings')} style={{ fontSize:12 }}>View All →</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 60px 80px', gap:0, padding:'6px 0', fontSize:11, fontWeight:700, color:'#475569', letterSpacing:'0.04em', borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:4 }}>
                    <span>KEYWORD</span><span>PORTAL</span><span style={{textAlign:'right'}}>POS</span><span style={{textAlign:'right'}}>PREV</span>
                  </div>
                  {rankings.slice(0,8).map((r: any, i: number) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 60px 80px', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                      <span style={{ color:'#F1F5F9', fontWeight:500 }}>{r.keyword}</span>
                      <span style={{ fontSize:11, color:'#475569' }}>{r.portal_name}</span>
                      <span style={{ textAlign:'right' }}>
                        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:900, color:r.current_position<=3?'#10B981':r.current_position<=10?'#F59E0B':'#EF4444' }}>#{r.current_position}</span>
                      </span>
                      <span style={{ textAlign:'right' }}>
                        {r.current_position < r.previous_position
                          ? <span style={{ color:'#10B981', fontSize:11, fontWeight:700 }}>▲ was #{r.previous_position}</span>
                          : <span style={{ color:'#EF4444', fontSize:11, fontWeight:700 }}>▼ was #{r.previous_position}</span>
                        }
                      </span>
                    </div>
                  ))}
                </div>

                {/* Activity Feed */}
                <div className="card" style={{ padding:24 }}>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:20 }}>⚡ Live Activity</h3>
                  {activity.map((a: any, i: number) => (
                    <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:a.type==='rank_improved'?'#10B98120':a.type==='article_published'?'#0EA5E920':a.type==='podcast_ready'?'#818CF820':'#F59E0B20', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>
                        {a.type==='rank_improved'?'🚀':a.type==='article_published'?'📰':a.type==='podcast_ready'?'🎙':a.type==='report_ready'?'📊':'✨'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, color:'#F1F5F9', fontSize:12, marginBottom:2, lineHeight:1.4 }}>{a.title}</div>
                        <div style={{ fontSize:11, color:'#475569' }}>{timeAgo(a.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content + Podcasts row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
                {/* Recent Content */}
                <div className="card" style={{ padding:24 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800 }}>📰 Recently Published</h3>
                    <button className="btn btn-ghost" onClick={() => setTab('content')} style={{ fontSize:12 }}>View All →</button>
                  </div>
                  {content.slice(0,5).map((c: any, i: number) => (
                    <div key={i} style={{ display:'flex', gap:14, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', alignItems:'center' }}>
                      <div style={{ width:36, height:36, borderRadius:6, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                        {c.content_type==='article'?'📄':c.content_type==='analysis'?'📊':c.content_type==='press_release'?'📢':c.content_type==='interview'?'🎤':'📰'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:'#F1F5F9', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ fontSize:11, color:p, fontWeight:700 }}>{c.portal_name}</span>
                          <span style={{ fontSize:11, color:'#475569' }}>· {timeAgo(c.published_at)}</span>
                          <span style={{ fontSize:11, color:'#64748b' }}>· {c.views?.toLocaleString()} views</span>
                        </div>
                      </div>
                      <a href={c.article_url} target="_blank" style={{ fontSize:11, color:p, fontWeight:700, whiteSpace:'nowrap' }}>Live ↗</a>
                    </div>
                  ))}
                </div>

                {/* Podcasts */}
                <div className="card" style={{ padding:24 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800 }}>🎙 AI Podcasts</h3>
                    <button className="btn btn-ghost" onClick={() => setTab('podcasts')} style={{ fontSize:12 }}>All Eps →</button>
                  </div>
                  {podcasts.map((ep: any, i: number) => (
                    <div key={i} style={{ padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:11, color:'#475569', fontWeight:700 }}>EPISODE {ep.episode_number}</span>
                        <span className={`badge ${ep.status==='published'?'badge-green':ep.status==='generating'?'badge-gold':'badge-blue'}`}>
                          {ep.status === 'generating' ? '⟳ Generating' : ep.status === 'published' ? '✓ Live' : ep.status}
                        </span>
                      </div>
                      <div style={{ fontWeight:600, fontSize:13, color:'#F1F5F9', marginBottom:4, lineHeight:1.3 }}>{ep.title}</div>
                      {ep.status === 'generating' ? (
                        <div style={{ height:20, display:'flex', alignItems:'center', gap:2 }}>
                          {Array.from({length:16}).map((_,j) => (
                            <div key={j} style={{ width:3, borderRadius:2, background:'#F59E0B', animation:`wave ${0.6+Math.random()*0.6}s ease-in-out ${j*0.06}s infinite alternate`, height:Math.floor(Math.random()*14+4) }} />
                          ))}
                          <span style={{ fontSize:10, color:'#F59E0B', marginLeft:6 }}>Generating...</span>
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
                          <span style={{ fontSize:10, padding:'2px 8px', background:'#1DB95420', border:'1px solid #1DB95440', borderRadius:4, color:'#1DB954' }}>🎵 Spotify</span>
                          <span style={{ fontSize:10, padding:'2px 8px', background:'#FF000020', border:'1px solid #FF000040', borderRadius:4, color:'#FF6B6B' }}>▶ YouTube</span>
                          <span style={{ fontSize:10, padding:'2px 8px', background:'#94A3B820', border:'1px solid #94A3B840', borderRadius:4, color:'#94A3B8' }}>{ep.duration_minutes}min</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ RANKINGS ══════════════════════════════════════════════ */}
          {tab === 'rankings' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
                {[
                  { label:'Page 1 Keywords', value:page1, color:'#10B981', icon:'🏆' },
                  { label:'Top 3 Rankings', value:rankings.filter((r:any)=>r.current_position<=3).length, color:'#F59E0B', icon:'🥇' },
                  { label:'Threats Neutralised', value:rankings.filter((r:any)=>r.current_position>10&&r.previous_position<=10).length, color:'#0EA5E9', icon:'🛡' },
                ].map(k => (
                  <div key={k.label} className="card metric-card" style={{ display:'flex', gap:16, alignItems:'center' }}>
                    <div style={{ width:52, height:52, borderRadius:12, background:`${k.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{k.icon}</div>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>
                      <div style={{ fontSize:13, color:'#94A3B8', marginTop:2 }}>{k.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:20 }}>All Tracked Keywords</h3>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 80px 100px 1fr', padding:'8px 0', fontSize:11, fontWeight:700, color:'#475569', letterSpacing:'0.04em', borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:4, textTransform:'uppercase' }}>
                  <span>Keyword</span><span>Portal</span><span style={{textAlign:'center'}}>Position</span><span style={{textAlign:'center'}}>Change</span><span>Status</span>
                </div>
                {rankings.map((r: any, i: number) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 80px 100px 1fr', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                    <span style={{ fontWeight:600, color:'#F1F5F9' }}>{r.keyword}</span>
                    <span style={{ fontSize:12, color:p, fontWeight:600 }}>{r.portal_name}</span>
                    <div style={{ textAlign:'center' }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:900, color:r.current_position<=3?'#10B981':r.current_position<=10?'#F59E0B':'#EF4444' }}>#{r.current_position}</span>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      {r.current_position < r.previous_position
                        ? <span style={{ color:'#10B981', fontWeight:700, fontSize:12 }}>▲ +{r.previous_position - r.current_position}</span>
                        : r.current_position > r.previous_position
                        ? <span style={{ color:'#EF4444', fontWeight:700, fontSize:12 }}>▼ {r.current_position - r.previous_position}</span>
                        : <span style={{ color:'#475569', fontSize:12 }}>→ same</span>
                      }
                    </div>
                    <span className={`badge ${r.current_position<=3?'badge-green':r.current_position<=10?'badge-gold':'badge-red'}`}>
                      {r.current_position<=3?'🏆 Top 3':r.current_position<=10?'✓ Page 1':'Page 2+'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CONTENT ════════════════════════════════════════════════ */}
          {tab === 'content' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
                {[
                  { label:'Total Published', value:content.length, color:'#0EA5E9' },
                  { label:'Total Views', value:totalViews.toLocaleString(), color:'#10B981' },
                  { label:'Avg Backlink Value', value:Math.round(content.reduce((s:number,c:any)=>s+(c.backlink_value||0),0)/content.length||0)+'%', color:'#F59E0B' },
                  { label:'Portals Active', value:new Set(content.map((c:any)=>c.portal_name)).size, color:'#818CF8' },
                ].map(k => (
                  <div key={k.label} className="card metric-card" style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:900, color:k.color }}>{k.value}</div>
                    <div style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ overflow:'hidden' }}>
                <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800 }}>All Published Content</h3>
                  <div style={{ display:'flex', gap:8 }}>
                    <span className="badge badge-green">{content.filter((c:any)=>c.status==='live').length} Live</span>
                  </div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                    <thead>
                      <tr style={{ background:'rgba(255,255,255,0.02)', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                        {['Title','Portal','Type','Published','Views','Authority','Status'].map(h => (
                          <th key={h} style={{ padding:'10px 14px', textAlign:h==='Views'?'right':'left', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {content.map((c: any, i: number) => (
                        <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                          <td style={{ padding:'12px 14px', maxWidth:280 }}>
                            <div style={{ fontWeight:600, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                          </td>
                          <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                            <span style={{ color:p, fontWeight:700, fontSize:12 }}>{c.portal_name}</span>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <span className={`badge ${c.content_type==='analysis'?'badge-blue':c.content_type==='press_release'?'badge-gold':c.content_type==='interview'?'badge-purple':'badge-green'}`}>
                              {c.content_type}
                            </span>
                          </td>
                          <td style={{ padding:'12px 14px', color:'#64748b', fontSize:12, whiteSpace:'nowrap' }}>{timeAgo(c.published_at)}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, color:'#94A3B8' }}>{c.views?.toLocaleString()}</td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden', minWidth:60 }}>
                                <div style={{ height:'100%', width:`${c.backlink_value}%`, background:`linear-gradient(90deg,${p},#10B981)`, borderRadius:2 }}></div>
                              </div>
                              <span style={{ fontSize:11, color:'#64748b', minWidth:30 }}>{c.backlink_value}%</span>
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <a href={c.article_url} target="_blank"><span className="badge badge-green">● Live ↗</span></a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ COVERAGE ══════════════════════════════════════════════ */}
          {tab === 'coverage' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div className="card" style={{ padding:24, marginBottom:20 }}>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, marginBottom:16 }}>🌐 12-Portal Network Coverage</h3>
                <p style={{ fontSize:14, color:'#64748b', marginBottom:20 }}>Your content is distributed across {coverage.filter((c:any)=>c.is_active).length} active portals, generating backlinks and building authority from multiple directions.</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
                  {coverage.map((site: any, i: number) => (
                    <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${site.is_active?site.primary_color+'40':'rgba(255,255,255,0.06)'}`, borderLeft:`4px solid ${site.is_active?site.primary_color:'#334155'}`, borderRadius:10, padding:'14px 16px', display:'flex', gap:14, alignItems:'center' }}>
                      <div style={{ width:40, height:40, borderRadius:8, background:`linear-gradient(135deg,${site.primary_color}40,${site.primary_color}20)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:16, color:site.primary_color, flexShrink:0 }}>
                        {(() => {
                const abbrs: Record<string,string> = {'Nex-Wire':'NW','NEX-WIRE':'NW','Finvexx':'FX','FINVEXX':'FX','AurexHQ':'AX','AUREXHQ':'AX','Bizplex':'BP','BIZPLEX':'BP','Verivex':'VX','VERIVEX':'VX','Bizpedia':'BZ','BIZPEDIA':'BZ','PresxWire':'PW','PRESXWIRE':'PW','InvexHub':'IH','INVEXHUB':'IH','Tradvex':'TV','TRADVEX':'TV','Certivade':'CV','CERTIVADE':'CV','Execvex':'EV','EXECVEX':'EV','Signalix':'SX','SIGNALIX':'SX'}
                return abbrs[site.site_name] || site.site_name?.slice(0,2)?.toUpperCase()
              })()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:'#F1F5F9' }}>{site.site_name}</div>
                        <div style={{ display:'flex', gap:8, marginTop:4, alignItems:'center', flexWrap:'wrap' }}>
                          <span style={{ fontSize:11, color:site.primary_color, fontWeight:700 }}>{site.articles_published} articles</span>
                          {site.last_published_at && <span style={{ fontSize:11, color:'#475569' }}>· last {timeAgo(site.last_published_at)}</span>}
                        </div>
                      </div>
                      <span className={site.is_active ? 'badge badge-green' : 'badge badge-red'}>{site.is_active ? '✓ Active' : 'Inactive'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ PODCASTS ══════════════════════════════════════════════ */}
          {tab === 'podcasts' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
                {podcasts.map((ep: any, i: number) => (
                  <div key={i} className="card" style={{ padding:24 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:11, color:'#475569', fontWeight:700, letterSpacing:'0.06em' }}>EPISODE {ep.episode_number}</div>
                        <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginTop:4, lineHeight:1.2 }}>{ep.title}</h3>
                      </div>
                      <span className={`badge ${ep.status==='published'?'badge-green':ep.status==='generating'?'badge-gold':'badge-blue'}`} style={{ flexShrink:0, marginLeft:10 }}>
                        {ep.status === 'generating' ? '⟳ Generating...' : ep.status === 'published' ? '✓ Published' : ep.status}
                      </span>
                    </div>
                    {ep.description && <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:16 }}>{ep.description}</p>}
                    
                    {/* Audio Player or Waveform */}
                    {ep.mp3_url ? (
                      <div style={{ marginBottom:16 }}>
                        <audio controls style={{ width:'100%', borderRadius:8, background:'#0B0F19', outline:'none' }} src={ep.mp3_url}>
                          Your browser does not support the audio element.
                        </audio>
                        <a href={ep.mp3_url} download style={{ display:'inline-block', marginTop:6, fontSize:11, color:'#0EA5E9', textDecoration:'none' }}>
                          ⬇ Download MP3
                        </a>
                      </div>
                    ) : (
                      <div style={{ height:48, display:'flex', alignItems:'center', gap:2, background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'0 12px', marginBottom:16 }}>
                        {Array.from({length:40}).map((_,j) => (
                          <div key={j} style={{ width:3, borderRadius:2, background:ep.status==='generating'?'#F59E0B':'#0EA5E9', opacity:ep.status==='generating'?0.7:0.6, animation:`wave ${0.4+0.8*((j*7)%10)/10}s ease-in-out ${j*0.04}s infinite alternate`, height:8+20*((j*13)%10)/10 }} />
                        ))}
                      </div>
                    )}

                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {ep.duration_minutes > 0 && <span className="badge badge-blue">⏱ {ep.duration_minutes} min</span>}
                      {ep.status === 'published' && <>
                        <span style={{ fontSize:11, padding:'3px 10px', background:'#1DB95420', border:'1px solid #1DB95440', borderRadius:6, color:'#1DB954' }}>🎵 Spotify</span>
                        <span style={{ fontSize:11, padding:'3px 10px', background:'#FF000020', border:'1px solid #FF000040', borderRadius:6, color:'#FF6B6B' }}>▶ YouTube</span>
                        <span style={{ fontSize:11, padding:'3px 10px', background:'#94A3B820', border:'1px solid #94A3B840', borderRadius:6, color:'#94A3B8' }}>🎙 Apple Podcasts</span>
                      </>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ REPORTS ════════════════════════════════════════════════ */}
          {tab === 'reports' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              {reports.map((rep: any, i: number) => (
                <div key={i} className="card" style={{ padding:28, marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                    <div>
                      <div style={{ fontSize:11, color:'#475569', fontWeight:700, letterSpacing:'0.06em' }}>MONTHLY REPORT</div>
                      <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginTop:2 }}>
                        {new Date(rep.report_month).toLocaleDateString('en-GB', { month:'long', year:'numeric' })}
                      </h3>
                    </div>
                    <button className="btn btn-primary" style={{ fontSize:13 }}>📥 Download PDF</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:16 }}>
                    {[
                      { label:'Articles', value:rep.articles_published, icon:'📰', color:'#0EA5E9' },
                      { label:'Page 1 Keywords', value:rep.keywords_page1, icon:'🎯', color:'#10B981' },
                      { label:'Avg Position', value:`#${rep.avg_position}`, icon:'📊', color:'#F59E0B' },
                      { label:'Podcasts', value:rep.podcasts_published, icon:'🎙', color:'#818CF8' },
                      { label:'Est. Reach', value:`${(rep.estimated_reach/1000).toFixed(0)}K`, icon:'👁', color:'#10B981' },
                      { label:'Brand Score +', value:`+${rep.brand_score_change}`, icon:'⬆', color:'#F59E0B' },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign:'center', padding:'16px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 }}>
                        <div style={{ fontSize:24, marginBottom:6 }}>{m.icon}</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:900, color:m.color, lineHeight:1 }}>{m.value}</div>
                        <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
