'use client'
import { useState, useEffect, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────
interface SiteStat { slug:string; name:string; domain:string; color:string; icon:string; articles:number; todayArticles:number; subscribers:number; latest:{slug:string;title:string;published_at:string;category:string}[] }
interface Stats { totals:{articles:number;today:number;subscribers:number}; sites:SiteStat[]; recentSubscribers:{email:string;site_slug:string;subscribed_at:string}[] }
interface Article { id:string; slug:string; title:string; category:string; author_name:string; published_at:string; siteSlug:string; siteName:string; siteDomain:string; siteColor:string; url:string }
interface Post { site:string; siteSlug:string; siteDomain:string; siteColor:string; siteIcon:string; article:{title:string;url:string}; postBody:string; fullPost:string }

const TONES = ['Warm & Personal','Informative','Direct & Punchy','Question Hook','Storytelling']
const SITE_ICONS:Record<string,string> = { 'jewish-news-now':'📰','jewish-property-report':'🏠','aliya-today':'✈️' }
const SITE_COLORS:Record<string,string> = { 'jewish-news-now':'#1a56b0','jewish-property-report':'#0a7c4e','aliya-today':'#c47d1a' }
const SITES = [
  {slug:'jewish-news-now',name:'Jewish News Now',domain:'jewishnewsnow.com',color:'#1a56b0',icon:'📰'},
  {slug:'jewish-property-report',name:'Jewish Property Report',domain:'jewishpropertyreport.com',color:'#0a7c4e',icon:'🏠'},
  {slug:'aliya-today',name:'Aliya Today',domain:'aliyatoday.com',color:'#c47d1a',icon:'✈️'},
]

function fmt(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'}) }
function fmtDate(d:string){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) }

export default function AliyaAdmin() {
  const [tab, setTab] = useState<'overview'|'articles'|'posts'|'links'|'analytics'|'api'|'linkbuilding'>('overview')
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState(false)
  const [stats, setStats] = useState<Stats|null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [artTotal, setArtTotal] = useState(0)
  const [artPage, setArtPage] = useState(1)
  const [artPages, setArtPages] = useState(1)
  const [artLoading, setArtLoading] = useState(false)
  const [artSite, setArtSite] = useState('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [generating, setGenerating] = useState(false)
  const [tone, setTone] = useState('Warm & Personal')
  const [copied, setCopied] = useState<string|null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState(30)

  // Auth
  useEffect(()=>{ if(typeof window!=='undefined'&&sessionStorage.getItem('aliya_admin')==='ok') setAuth(true) },[])
  function login(){ if(pw==='Mini95!!'){ sessionStorage.setItem('aliya_admin','ok'); document.cookie='aliya_admin_session=1;path=/;max-age=31536000;SameSite=Lax'; setAuth(true) } else { setPwErr(true); setTimeout(()=>setPwErr(false),2000) } }

  // Stats
  const loadStats = useCallback(async()=>{ setStatsLoading(true); try{ const r=await fetch('/api/aliya-admin/stats'); setStats(await r.json()) }finally{ setStatsLoading(false) } },[])
  useEffect(()=>{ if(auth) loadStats() },[auth,loadStats])

  // Articles
  const loadArticles = useCallback(async(page:number,site:string)=>{
    setArtLoading(true)
    try {
      const r = await fetch(`/api/aliya-admin/articles?page=${page}&site=${site}`)
      const d = await r.json()
      setArticles(d.articles||[]); setArtTotal(d.total||0); setArtPage(d.page||1); setArtPages(d.totalPages||1)
    } finally { setArtLoading(false) }
  },[])
  useEffect(()=>{ if(auth&&tab==='articles') loadArticles(artPage,artSite) },[auth,tab,artPage,artSite,loadArticles])

  const loadAnalytics = useCallback(async(days:number)=>{
    setAnalyticsLoading(true)
    try {
      const r = await fetch('/api/aliya-admin/analytics?days='+days)
      setAnalytics(await r.json())
    } finally { setAnalyticsLoading(false) }
  },[])
  useEffect(()=>{ if(auth&&tab==='analytics') loadAnalytics(analyticsDays) },[auth,tab,analyticsDays,loadAnalytics])

  async function generatePosts(){
    setGenerating(true)
    try {
      const r = await fetch('/api/aliya-admin/posts',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tone}) })
      const d = await r.json()
      setPosts(d.posts||[])
    } finally { setGenerating(false) }
  }

  function copy(id:string,text:string){ navigator.clipboard.writeText(text); setCopied(id); setTimeout(()=>setCopied(null),2000) }

  // ── Login ─────────────────────────────────────────────────────────────────
  if(!auth) return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 48px',width:360,boxShadow:'0 4px 24px rgba(0,0,0,.08)',textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>✈️</div>
        <h1 style={{fontSize:22,fontWeight:900,color:'#111',margin:'0 0 4px'}}>AliyaToday Admin</h1>
        <p style={{color:'#6b7280',fontSize:13,marginBottom:24}}>sollymarks95@gmail.com</p>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}
          style={{width:'100%',padding:'11px 14px',border:`1px solid ${pwErr?'#ef4444':'#d1d5db'}`,borderRadius:8,fontSize:14,fontFamily:'Inter,sans-serif',outline:'none',boxSizing:'border-box',marginBottom:10}}/>
        {pwErr && <p style={{color:'#ef4444',fontSize:12,margin:'0 0 10px'}}>Wrong password</p>}
        <button onClick={login} style={{width:'100%',background:'#c47d1a',color:'#fff',border:'none',borderRadius:8,padding:'11px',fontWeight:800,fontSize:14,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Enter</button>
      </div>
    </div>
  )

  const NAV = [{id:'overview' as const,label:'Overview',icon:'📊'},{id:'articles' as const,label:'All Articles',icon:'📝'},{id:'posts' as const,label:'FB Post Generator',icon:'📲'},{id:'links' as const,label:'Pinned Links',icon:'📌'},{id:'analytics' as const,label:'Traffic Analytics',icon:'📈'},{id:'api' as const,label:'API & RSS',icon:'🔌'},{id:'linkbuilding' as const,label:'Link Building',icon:'🔗'}]

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'Inter,sans-serif',background:'#f8fafc'}}>
      {/* Sidebar */}
      <aside style={{width:220,background:'#111',color:'#fff',padding:'24px 0',position:'fixed',top:0,left:0,height:'100vh',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'0 20px 24px',borderBottom:'1px solid #222'}}>
          <div style={{fontSize:24,marginBottom:4}}>✈️</div>
          <div style={{fontWeight:900,fontSize:15,color:'#fff'}}>AliyaToday Admin</div>
          <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>Jewish Project Dashboard</div>
        </div>
        <nav style={{flex:1,padding:'16px 0'}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 20px',background:tab===n.id?'#c47d1a':'none',border:'none',color:tab===n.id?'#fff':'#9ca3af',fontWeight:tab===n.id?700:500,fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:'Inter,sans-serif'}}>
              <span style={{fontSize:16}}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{padding:'16px 20px',borderTop:'1px solid #222'}}>
          <a href="https://www.facebook.com/groups/1620082289091191" target="_blank" rel="noopener" style={{display:'block',background:'#1877f2',color:'#fff',borderRadius:7,padding:'8px 14px',fontSize:12,fontWeight:700,textDecoration:'none',textAlign:'center',marginBottom:10}}>👥 Facebook Group</a>
          {SITES.map(s=><a key={s.slug} href={`https://${s.domain}`} target="_blank" rel="noopener" style={{display:'block',fontSize:11,color:'#6b7280',textDecoration:'none',padding:'2px 0'}}>→ {s.domain}</a>)}
        </div>
      </aside>

      {/* Main */}
      <main style={{marginLeft:220,flex:1,padding:'28px 32px'}}>

        {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
        {tab==='overview' && (
          <>
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:24,fontWeight:900,color:'#111',margin:0}}>Overview</h1>
              <p style={{color:'#6b7280',fontSize:13,marginTop:4}}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
            </div>
            {statsLoading ? <div style={{color:'#9ca3af'}}>Loading...</div> : stats && (
              <>
                {/* Totals */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28}}>
                  {[
                    {label:'Total Articles',val:stats.totals.articles,sub:`${stats.totals.today} today`,icon:'📝'},
                    {label:'Subscribers',val:stats.totals.subscribers,sub:'across all 3 sites',icon:'📧'},
                    {label:'Sites Live',val:3,sub:'jewishnewsnow · jpr · aliyatoday',icon:'🌐'},
                  ].map(s=>(
                    <div key={s.label} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>{s.label}</div>
                          <div style={{fontSize:32,fontWeight:900,color:'#111'}}>{s.val}</div>
                          <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>{s.sub}</div>
                        </div>
                        <span style={{fontSize:28}}>{s.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Per-site */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28}}>
                  {stats.sites.map(site=>(
                    <div key={site.slug} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
                      <div style={{borderTop:`3px solid ${site.color}`,padding:'18px 20px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                          <span style={{fontSize:20}}>{site.icon}</span>
                          <div>
                            <div style={{fontWeight:800,fontSize:13,color:'#111'}}>{site.name}</div>
                            <a href={`https://${site.domain}`} target="_blank" rel="noopener" style={{fontSize:11,color:site.color}}>{site.domain}</a>
                          </div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
                          {[{l:'Articles',v:site.articles},{l:'Today',v:site.todayArticles},{l:'Subs',v:site.subscribers}].map(m=>(
                            <div key={m.l} style={{background:'#f9fafb',borderRadius:7,padding:'10px 8px',textAlign:'center'}}>
                              <div style={{fontWeight:900,fontSize:20,color:site.color}}>{m.v}</div>
                              <div style={{fontSize:10,color:'#9ca3af',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em'}}>{m.l}</div>
                            </div>
                          ))}
                        </div>
                        {/* Latest articles */}
                        <div style={{borderTop:'1px solid #f3f4f6',paddingTop:10}}>
                          <div style={{fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Latest</div>
                          {site.latest.slice(0,3).map(a=>(
                            <div key={a.slug} style={{marginBottom:6}}>
                              <a href={`https://${site.domain}/article/${site.slug}/${a.slug}`} target="_blank" rel="noopener"
                                style={{fontSize:11,fontWeight:700,color:'#111',textDecoration:'none',lineHeight:1.3,display:'block'}}>
                                {a.title.substring(0,60)}{a.title.length>60?'…':''}
                              </a>
                              <div style={{fontSize:10,color:'#9ca3af'}}>{fmt(a.published_at)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Recent subscribers */}
                {stats.recentSubscribers.length>0 && (
                  <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'14px 20px',borderBottom:'1px solid #e5e7eb',fontWeight:800,fontSize:13,color:'#111'}}>📧 Recent Subscribers</div>
                    {stats.recentSubscribers.map((s,i)=>{
                      const site = stats.sites.find(st=>st.slug===s.site_slug)
                      return (
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 20px',borderBottom:i<stats.recentSubscribers.length-1?'1px solid #f3f4f6':'none'}}>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <span style={{fontSize:16}}>{site?.icon||'📧'}</span>
                            <div>
                              <div style={{fontSize:13,fontWeight:600,color:'#111'}}>{s.email}</div>
                              <div style={{fontSize:11,color:'#9ca3af'}}>{site?.name}</div>
                            </div>
                          </div>
                          <div style={{fontSize:11,color:'#9ca3af'}}>{fmt(s.subscribed_at)}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── ALL ARTICLES ──────────────────────────────────────────────────*/}
        {tab==='articles' && (
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
              <div>
                <h1 style={{fontSize:24,fontWeight:900,color:'#111',margin:0}}>All Articles</h1>
                <p style={{color:'#6b7280',fontSize:13,marginTop:4}}>{artTotal} published articles · Page {artPage} of {artPages}</p>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[{v:'all',l:'All Sites'},...SITES.map(s=>({v:s.slug,l:s.icon+' '+s.name}))].map(o=>(
                  <button key={o.v} onClick={()=>{setArtSite(o.v);setArtPage(1)}}
                    style={{padding:'7px 14px',borderRadius:8,border:'1px solid '+(artSite===o.v?'#c47d1a':'#e5e7eb'),background:artSite===o.v?'#c47d1a':'#fff',color:artSite===o.v?'#fff':'#374151',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            {artLoading ? <div style={{color:'#9ca3af',padding:40,textAlign:'center'}}>Loading...</div> : (
              <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
                {/* Header row */}
                <div style={{display:'grid',gridTemplateColumns:'40px 1fr 90px 100px 100px',gap:0,padding:'10px 16px',background:'#f9fafb',borderBottom:'1px solid #e5e7eb',fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.05em'}}>
                  <div>#</div><div>Article</div><div>Site</div><div>Category</div><div>Published</div>
                </div>
                {articles.map((a,i)=>(
                  <div key={a.id} style={{display:'grid',gridTemplateColumns:'40px 1fr 90px 100px 100px',gap:0,padding:'10px 16px',borderBottom:'1px solid #f3f4f6',alignItems:'center',background:i%2===0?'#fff':'#fafafa'}}>
                    <div style={{fontSize:11,color:'#9ca3af',fontWeight:700}}>{((artPage-1)*50)+i+1}</div>
                    <div>
                      <a href={a.url} target="_blank" rel="noopener"
                        style={{fontSize:12,fontWeight:700,color:'#111',textDecoration:'none',display:'block',lineHeight:1.4}}>
                        {a.title.substring(0,80)}{a.title.length>80?'…':''}
                      </a>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:3}}>
                        <span style={{fontSize:10,color:'#9ca3af',fontFamily:'monospace',wordBreak:'break-all'}}>{a.url}</span>
                        <button onClick={()=>copy(`url-${a.id}`,a.url)} style={{flexShrink:0,fontSize:10,padding:'2px 7px',borderRadius:4,border:'1px solid #e5e7eb',background:copied===`url-${a.id}`?'#16a34a':'#f9fafb',color:copied===`url-${a.id}`?'#fff':'#374151',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                          {copied===`url-${a.id}`?'✅':'copy'}
                        </button>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:a.siteColor,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.siteName.split(' ')[0]}</div>
                    <div style={{fontSize:11,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.category}</div>
                    <div style={{fontSize:11,color:'#6b7280',whiteSpace:'nowrap'}}>{fmtDate(a.published_at)}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Pagination */}
            <div style={{display:'flex',gap:8,marginTop:16,justifyContent:'center',alignItems:'center'}}>
              <button onClick={()=>setArtPage(p=>Math.max(1,p-1))} disabled={artPage<=1||artLoading}
                style={{padding:'8px 16px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',fontSize:13,cursor:artPage<=1?'not-allowed':'pointer',opacity:artPage<=1?.5:1,fontFamily:'Inter,sans-serif'}}>← Prev</button>
              <span style={{fontSize:13,color:'#374151',fontWeight:600}}>{artPage} / {artPages}</span>
              <button onClick={()=>setArtPage(p=>Math.min(artPages,p+1))} disabled={artPage>=artPages||artLoading}
                style={{padding:'8px 16px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',fontSize:13,cursor:artPage>=artPages?'not-allowed':'pointer',opacity:artPage>=artPages?.5:1,fontFamily:'Inter,sans-serif'}}>Next →</button>
            </div>
          </>
        )}

        {/* ── FB POST GENERATOR ─────────────────────────────────────────────*/}
        {tab==='posts' && (
          <>
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:24,fontWeight:900,color:'#111',margin:0}}>Facebook Post Generator</h1>
              <p style={{color:'#6b7280',fontSize:13,marginTop:4}}>Generate 3 viral posts from today's latest articles. Copy and paste straight to Facebook.</p>
            </div>
            <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap',alignItems:'center'}}>
              <select value={tone} onChange={e=>setTone(e.target.value)} style={{padding:'10px 14px',border:'1px solid #d1d5db',borderRadius:8,fontSize:13,fontFamily:'Inter,sans-serif',background:'#fff',cursor:'pointer'}}>
                {TONES.map(t=><option key={t}>{t}</option>)}
              </select>
              <button onClick={generatePosts} disabled={generating}
                style={{background:'#c47d1a',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:800,fontSize:14,cursor:generating?'not-allowed':'pointer',opacity:generating?.7:1,fontFamily:'Inter,sans-serif'}}>
                {generating?'✨ Generating...':'✨ Generate 3 Posts'}
              </button>
            </div>
            {posts.length>0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:20}}>
                {posts.map((p,i)=>(
                  <div key={i} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
                    <div style={{background:p.siteColor+'12',borderBottom:`1px solid ${p.siteColor}30`,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:22}}>{SITE_ICONS[p.siteSlug]||'📰'}</span>
                        <div>
                          <div style={{fontWeight:800,fontSize:14,color:'#111'}}>{p.site}</div>
                          <a href={p.article.url} target="_blank" rel="noopener" style={{fontSize:11,color:p.siteColor}}>{p.article.title.substring(0,55)}…</a>
                        </div>
                      </div>
                      <button onClick={()=>copy(`post-${i}`,p.fullPost)}
                        style={{background:copied===`post-${i}`?'#16a34a':p.siteColor,color:'#fff',border:'none',borderRadius:7,padding:'8px 18px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap'}}>
                        {copied===`post-${i}`?'✅ Copied!':'📋 Copy Post + Link'}
                      </button>
                    </div>
                    <div style={{padding:'20px',whiteSpace:'pre-wrap',fontSize:15,lineHeight:1.8,color:'#111',fontFamily:'Georgia,serif'}}>{p.postBody}</div>
                    <div style={{margin:'0 20px 18px',background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                      <span style={{fontSize:12,color:'#6b7280',wordBreak:'break-all',fontFamily:'monospace'}}>👉 {p.article.url}</span>
                      <button onClick={()=>copy(`link-${i}`,p.article.url)}
                        style={{background:copied===`link-${i}`?'#16a34a':'#f3f4f6',color:copied===`link-${i}`?'#fff':'#374151',border:'1px solid #e5e7eb',borderRadius:5,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'Inter,sans-serif'}}>
                        {copied===`link-${i}`?'✅':'Copy link'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'60px 20px',color:'#9ca3af'}}>
                <div style={{fontSize:48,marginBottom:12}}>📲</div>
                <div style={{fontSize:16,fontWeight:700,color:'#374151',marginBottom:6}}>Ready when you are</div>
                <div style={{fontSize:13}}>Pick a tone and hit Generate</div>
              </div>
            )}
          </>
        )}

        {/* ── PINNED LINKS ──────────────────────────────────────────────────*/}
        {tab==='links' && (
          <>
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:24,fontWeight:900,color:'#111',margin:0}}>Pinned Links</h1>
              <p style={{color:'#6b7280',fontSize:13,marginTop:4}}>Your 3 must-share guides for the Facebook group</p>
            </div>
            {/* FB Group */}
            <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden',marginBottom:20}}>
              <div style={{padding:'16px 20px',background:'#f0fdf4',borderBottom:'1px solid #86efac',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:'#15803d'}}>👥 Facebook Community Group</div>
                  <div style={{fontSize:12,color:'#16a34a'}}>facebook.com/groups/1620082289091191</div>
                </div>
                <button onClick={()=>copy('fbg','https://www.facebook.com/groups/1620082289091191')} style={{background:copied==='fbg'?'#16a34a':'#16a34a',color:'#fff',border:'none',borderRadius:7,padding:'7px 16px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                  {copied==='fbg'?'✅ Copied!':'📋 Copy'}
                </button>
              </div>
            </div>
            {/* Top articles */}
            {[
              {emoji:'💰',label:'Aliyah Cost Breakdown 2026',url:'https://aliyatoday.com/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six'},
              {emoji:'🏥',label:'Kupat Holim Guide 2026',url:'https://aliyatoday.com/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile'},
              {emoji:'📋',label:'Aliyah Checklist 2026',url:'https://aliyatoday.com/article/aliya-today/2026-06-14-aliyah-checklist-2026-disclosure-timeline-splits-winners-losers'},
            ].map((l,i)=>(
              <div key={i} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden',marginBottom:12}}>
                <div style={{padding:'16px 20px',display:'flex',gap:14,alignItems:'flex-start'}}>
                  <div style={{background:'#c47d1a',color:'#fff',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,flexShrink:0,marginTop:2}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <span style={{fontSize:18}}>{l.emoji}</span>
                      <span style={{fontWeight:800,fontSize:14,color:'#111'}}>{l.label}</span>
                    </div>
                    <div style={{fontSize:12,color:'#6b7280',fontFamily:'monospace',wordBreak:'break-all',marginBottom:10}}>{l.url}</div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>copy(`p-${i}`,l.url)} style={{background:copied===`p-${i}`?'#16a34a':'#c47d1a',color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{copied===`p-${i}`?'✅ Copied!':'📋 Copy URL'}</button>
                      <a href={l.url} target="_blank" rel="noopener" style={{background:'#f3f4f6',color:'#374151',border:'1px solid #e5e7eb',borderRadius:6,padding:'6px 14px',fontWeight:600,fontSize:12,textDecoration:'none'}}>Preview →</a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Full group description */}
            <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:800,fontSize:14,color:'#111'}}>📋 Facebook Group Description (copy-ready)</span>
                <button onClick={()=>copy('desc',`🇮🇱 Welcome to Our Aliyah Community!\n\nYour home for honest, up-to-date guidance on making Aliyah in 2026.\n\n📌 Must-Read Resources:\n\n💰 Aliyah Cost Breakdown 2026:\nhttps://aliyatoday.com/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six\n\n🏥 Kupat Holim Guide 2026:\nhttps://aliyatoday.com/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile\n\n📋 Aliyah Checklist 2026:\nhttps://aliyatoday.com/article/aliya-today/2026-06-14-aliyah-checklist-2026-disclosure-timeline-splits-winners-losers\n\nMore daily guides 👉 AliyaToday.com\n\nAsk questions. Share your story. Help each other home. 🕍`)}
                  style={{background:copied==='desc'?'#16a34a':'#111',color:'#fff',border:'none',borderRadius:7,padding:'8px 16px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                  {copied==='desc'?'✅ Copied!':'📋 Copy All'}
                </button>
              </div>
              <div style={{padding:'20px',whiteSpace:'pre-wrap',fontSize:13,lineHeight:1.9,color:'#374151',fontFamily:'Georgia,serif',background:'#fafafa'}}>
{`🇮🇱 Welcome to Our Aliyah Community!

Your home for honest, up-to-date guidance on making Aliyah in 2026.

📌 Must-Read Resources:

💰 Aliyah Cost Breakdown 2026:
https://aliyatoday.com/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six

🏥 Kupat Holim Guide 2026:
https://aliyatoday.com/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile

📋 Aliyah Checklist 2026:
https://aliyatoday.com/article/aliya-today/2026-06-14-aliyah-checklist-2026-disclosure-timeline-splits-winners-losers

More daily guides 👉 AliyaToday.com

Ask questions. Share your story. Help each other home. 🕍`}
              </div>
            </div>
          </>
        )}

        {/* ── TRAFFIC ANALYTICS ────────────────────────────────────────────────*/}
        {tab==='analytics' && (
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
              <div>
                <h1 style={{fontSize:24,fontWeight:900,color:'#111',margin:0}}>Traffic Analytics</h1>
                <p style={{color:'#6b7280',fontSize:13,marginTop:4}}>All 3 Jewish sites combined — jewishnewsnow.com · jewishpropertyreport.com · aliyatoday.com</p>
              </div>
              <div style={{display:'flex',gap:8}}>
                {[7,14,30,90].map(d=>(
                  <button key={d} onClick={()=>{setAnalyticsDays(d);loadAnalytics(d)}}
                    style={{padding:'7px 14px',borderRadius:8,border:'1px solid '+(analyticsDays===d?'#c47d1a':'#e5e7eb'),background:analyticsDays===d?'#c47d1a':'#fff',color:analyticsDays===d?'#fff':'#374151',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            {analyticsLoading ? (
              <div style={{textAlign:'center',padding:60,color:'#9ca3af'}}>
                <div style={{fontSize:32,marginBottom:12}}>📊</div>
                <div style={{fontSize:15,fontWeight:700,color:'#374151'}}>Loading analytics...</div>
              </div>
            ) : !analytics ? null : (
              <>
                {/* KPI cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
                  {[
                    {label:`Total Views (${analyticsDays}d)`,val:analytics.total.toLocaleString(),icon:'👁',color:'#1a56b0'},
                    {label:'Today',val:analytics.todayViews.toLocaleString(),icon:'🌅',color:'#c47d1a'},
                    {label:'Yesterday',val:analytics.yesterdayViews.toLocaleString(),icon:'📅',color:'#0a7c4e'},
                    {label:'Daily Growth',val:(analytics.growthPct>=0?'+':'')+analytics.growthPct+'%',icon:analytics.growthPct>=0?'📈':'📉',color:analytics.growthPct>=0?'#16a34a':'#dc2626'},
                  ].map(k=>(
                    <div key={k.label} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'18px 20px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>{k.label}</div>
                          <div style={{fontSize:28,fontWeight:900,color:k.color}}>{k.val}</div>
                        </div>
                        <span style={{fontSize:24}}>{k.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Daily chart (simple bar) */}
                <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
                  <div style={{fontWeight:800,fontSize:14,color:'#111',marginBottom:16}}>📅 Daily Views — Last {analyticsDays} Days</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:3,height:80,overflow:'hidden'}}>
                    {(() => {
                      const max = Math.max(...(analytics.daily||[]).map((d:any)=>d.views), 1)
                      return (analytics.daily||[]).map((d:any,i:number)=>(
                        <div key={i} title={d.date+': '+d.views+' views'} style={{flex:1,minWidth:2,background:'#c47d1a',borderRadius:2,height:Math.max(2,Math.round(d.views/max*76))+'px',opacity:.8,cursor:'default'}} />
                      ))
                    })()}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:'#9ca3af'}}>
                    <span>{(analytics.daily||[])[0]?.date}</span>
                    <span>{(analytics.daily||[])[(analytics.daily||[]).length-1]?.date}</span>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                  {/* By Site */}
                  <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'14px 20px',borderBottom:'1px solid #e5e7eb',fontWeight:800,fontSize:13,color:'#111'}}>🌐 Views by Site</div>
                    {(analytics.bySite||[]).map((s:any)=>(
                      <div key={s.slug} style={{padding:'12px 20px',borderBottom:'1px solid #f3f4f6'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <div>
                            <span style={{fontWeight:700,fontSize:13,color:s.color}}>{s.domain}</span>
                          </div>
                          <span style={{fontWeight:800,fontSize:14,color:'#111'}}>{s.views.toLocaleString()}</span>
                        </div>
                        <div style={{background:'#f3f4f6',borderRadius:4,height:6,overflow:'hidden'}}>
                          <div style={{background:s.color,height:'100%',width:s.pct+'%',borderRadius:4,transition:'width .3s'}} />
                        </div>
                        <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>{s.pct}% of total</div>
                      </div>
                    ))}
                  </div>

                  {/* By Device */}
                  <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'14px 20px',borderBottom:'1px solid #e5e7eb',fontWeight:800,fontSize:13,color:'#111'}}>📱 Device Split</div>
                    {(analytics.byDevice||[]).map((d:any)=>(
                      <div key={d.device} style={{padding:'14px 20px',borderBottom:'1px solid #f3f4f6'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <span style={{fontWeight:700,fontSize:13,color:'#374151',textTransform:'capitalize'}}>{d.device==='desktop'?'🖥 Desktop':d.device==='mobile'?'📱 Mobile':'📟 Tablet'}</span>
                          <span style={{fontWeight:800,fontSize:14,color:'#111'}}>{d.views.toLocaleString()}</span>
                        </div>
                        <div style={{background:'#f3f4f6',borderRadius:4,height:6}}>
                          <div style={{background:'#c47d1a',height:'100%',width:d.pct+'%',borderRadius:4}} />
                        </div>
                        <div style={{fontSize:11,color:'#9ca3af',marginTop:3}}>{d.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Countries */}
                <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden',marginBottom:20}}>
                  <div style={{padding:'14px 20px',borderBottom:'1px solid #e5e7eb',fontWeight:800,fontSize:13,color:'#111'}}>🌍 Top Countries</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                    {(analytics.byCountry||[]).map((c:any,i:number)=>(
                      <div key={c.country} style={{padding:'10px 20px',borderBottom:'1px solid #f3f4f6',borderRight:i%2===0?'1px solid #f3f4f6':'none',display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:20,flexShrink:0}}>{c.flag}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontWeight:700,fontSize:13,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</span>
                            <span style={{fontWeight:800,fontSize:13,color:'#374151',flexShrink:0,marginLeft:8}}>{c.views}</span>
                          </div>
                          <div style={{background:'#f3f4f6',borderRadius:3,height:4,marginTop:4}}>
                            <div style={{background:'#1a56b0',height:'100%',width:c.pct+'%',borderRadius:3}} />
                          </div>
                          <div style={{fontSize:10,color:'#9ca3af',marginTop:2}}>{c.pct}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Articles */}
                <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden',marginBottom:20}}>
                  <div style={{padding:'14px 20px',borderBottom:'1px solid #e5e7eb',fontWeight:800,fontSize:13,color:'#111'}}>🔥 Top Articles by Views</div>
                  {(analytics.topArticles||[]).length===0 ? (
                    <div style={{padding:32,textAlign:'center',color:'#9ca3af',fontSize:13}}>No article views tracked yet</div>
                  ) : (analytics.topArticles||[]).map((a:any,i:number)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 20px',borderBottom:'1px solid #f3f4f6'}}>
                      <div style={{fontWeight:900,fontSize:18,color:'#e5e7eb',width:28,textAlign:'center',flexShrink:0}}>#{i+1}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <a href={a.url} target="_blank" rel="noopener" style={{fontWeight:700,fontSize:13,color:'#111',textDecoration:'none',display:'block',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {a.title}
                        </a>
                        <div style={{fontSize:11,color:a.color,fontWeight:600,marginTop:2}}>{a.domain}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontWeight:900,fontSize:16,color:'#111'}}>{a.views}</div>
                        <div style={{fontSize:10,color:'#9ca3af'}}>views</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Referrers */}
                {(analytics.byReferrer||[]).length>0 && (
                  <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'14px 20px',borderBottom:'1px solid #e5e7eb',fontWeight:800,fontSize:13,color:'#111'}}>🔗 Top Traffic Sources</div>
                    {(analytics.byReferrer||[]).map((r:any,i:number)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 20px',borderBottom:'1px solid #f3f4f6'}}>
                        <span style={{fontSize:13,fontWeight:600,color:'#374151'}}>{r.referrer}</span>
                        <span style={{fontSize:13,fontWeight:800,color:'#111'}}>{r.views} views</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── API & RSS Tab ───────────────────────────────────────────────── */}
        {tab==='api' && (
          <APITab />
        )}
      </main>
    </div>
  )
}

const API_KEY = 'AT-live-9f2e4b7c3a1d8e6f5b0c2a4d7e9f1b3c'
const BASE    = 'https://aliyatoday.com'

function CopyBox({ label, value, mono=true }: { label:string; value:string; mono?:boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>{label}</div>
      <div style={{display:'flex',gap:8,alignItems:'stretch'}}>
        <div style={{flex:1,background:'#1e293b',borderRadius:8,padding:'12px 16px',fontSize:13,color:'#e2e8f0',fontFamily:mono?'monospace':'inherit',wordBreak:'break-all',lineHeight:1.5}}>
          {value}
        </div>
        <button onClick={()=>{ navigator.clipboard.writeText(value); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
          style={{flexShrink:0,background:copied?'#10b981':'#c47d1a',color:'#fff',border:'none',borderRadius:8,padding:'0 16px',fontWeight:700,fontSize:12,cursor:'pointer',transition:'background .2s'}}>
          {copied?'✓ Copied':'Copy'}
        </button>
      </div>
    </div>
  )
}

function EndpointBlock({ method, path, desc, params, example }: { method:string; path:string; desc:string; params:{name:string;type:string;desc:string}[]; example:string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:10,overflow:'hidden',marginBottom:12}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:'flex',gap:12,alignItems:'center',padding:'14px 18px',cursor:'pointer',background:'#fff'}}>
        <span style={{background:'#10b981',color:'#fff',borderRadius:4,padding:'2px 8px',fontWeight:800,fontSize:11,letterSpacing:'.05em'}}>{method}</span>
        <span style={{fontFamily:'monospace',fontWeight:700,fontSize:13,color:'#111',flex:1}}>{path}</span>
        <span style={{fontSize:12,color:'#6b7280'}}>{desc}</span>
        <span style={{fontSize:14,color:'#9ca3af'}}>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <div style={{background:'#f9fafb',borderTop:'1px solid #e5e7eb',padding:'16px 18px'}}>
          {params.length>0 && (
            <div style={{marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:12,color:'#374151',marginBottom:8}}>Parameters</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#f3f4f6'}}>
                  <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#6b7280',borderRadius:4}}>Name</th>
                  <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#6b7280'}}>Type</th>
                  <th style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#6b7280'}}>Description</th>
                </tr></thead>
                <tbody>
                  {params.map(p=>(
                    <tr key={p.name} style={{borderTop:'1px solid #e5e7eb'}}>
                      <td style={{padding:'7px 10px',fontFamily:'monospace',fontWeight:700,color:'#c47d1a'}}>{p.name}</td>
                      <td style={{padding:'7px 10px',color:'#6b7280'}}>{p.type}</td>
                      <td style={{padding:'7px 10px',color:'#374151'}}>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{fontWeight:700,fontSize:12,color:'#374151',marginBottom:6}}>Example Response</div>
          <pre style={{background:'#1e293b',color:'#e2e8f0',borderRadius:8,padding:'14px',fontSize:11,overflow:'auto',maxHeight:280,margin:0}}>{example}</pre>
        </div>
      )}
    </div>
  )
}

{tab==='linkbuilding' && <LinkBuildingTab />}

function APITab() {
  return (
    <div>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#2d1a00,#1a0f00)',borderRadius:12,padding:'24px 28px',marginBottom:24,color:'#fff'}}>
        <div style={{fontSize:22,fontWeight:900,marginBottom:6}}>🔌 AliyaToday API & RSS</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.6)'}}>Connect AliyaToday content to any 3rd-party tool — Zapier, Make, n8n, CMS, custom apps.</div>
      </div>

      {/* API Key */}
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:14,color:'#111',marginBottom:4}}>🔑 Your API Key</div>
        <div style={{fontSize:12,color:'#6b7280',marginBottom:14}}>Include this in every request as a Bearer token or query param. Keep it private.</div>
        <CopyBox label="API Key" value={API_KEY} />
        <CopyBox label="Authorization Header" value={`Authorization: Bearer ${API_KEY}`} />
      </div>

      {/* Endpoints */}
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:14,color:'#111',marginBottom:16}}>📡 REST Endpoints</div>

        <EndpointBlock
          method="GET"
          path={`${BASE}/api/v1/aliya-today/articles`}
          desc="Fetch latest articles"
          params={[
            {name:'limit',   type:'number',  desc:'Results per page (1–100, default 20)'},
            {name:'page',    type:'number',  desc:'Page number, 1-indexed (default 1)'},
            {name:'category',type:'string',  desc:'Filter by category e.g. Housing, Ulpan, Process'},
            {name:'q',       type:'string',  desc:'Keyword search in title + excerpt'},
            {name:'from',    type:'ISO date',desc:'Published on or after (e.g. 2026-06-01)'},
            {name:'to',      type:'ISO date',desc:'Published on or before'},
            {name:'full',    type:'0|1',     desc:'Pass 1 to include full article body (default: excerpt only)'},
          ]}
          example={`{
  "ok": true,
  "total": 842,
  "page": 1,
  "limit": 20,
  "totalPages": 43,
  "articles": [
    {
      "id": "...",
      "slug": "2026-06-22-buying-apartment-israel-guide",
      "title": "Buying an Apartment in Israel: The 2026 Complete Guide",
      "excerpt": "Step-by-step walkthrough of the buying process...",
      "category": "Housing",
      "tags": ["real estate","housing","mortgage"],
      "author": "Solly Marks",
      "published_at": "2026-06-22T07:02:11.000Z",
      "read_time_minutes": 8,
      "cover_image_url": "https://...",
      "url": "https://aliyatoday.com/article/aliya-today/2026-06-22-buying-apartment-israel-guide"
    }
  ]
}`}
        />

        <div style={{marginTop:12}}>
          <CopyBox label="Quick test (latest 5 articles)" value={`${BASE}/api/v1/aliya-today/articles?api_key=${API_KEY}&limit=5`} />
          <CopyBox label="Filter by category" value={`${BASE}/api/v1/aliya-today/articles?api_key=${API_KEY}&category=Housing&limit=10`} />
          <CopyBox label="Keyword search" value={`${BASE}/api/v1/aliya-today/articles?api_key=${API_KEY}&q=ulpan&limit=10`} />
          <CopyBox label="With full body" value={`${BASE}/api/v1/aliya-today/articles?api_key=${API_KEY}&limit=5&full=1`} />
        </div>
      </div>

      {/* RSS Feed */}
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:14,color:'#111',marginBottom:4}}>📰 RSS Feed</div>
        <div style={{fontSize:12,color:'#6b7280',marginBottom:14}}>Standard RSS 2.0 feed — use in any RSS reader, aggregator, or tool that supports feeds (Feedly, Zapier, Make, n8n, WordPress, etc). No auth required.</div>
        <CopyBox label="RSS Feed URL" value={`${BASE}/feed.xml`} />
        <a href={`${BASE}/feed.xml`} target="_blank" rel="noopener"
          style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f97316',color:'#fff',borderRadius:8,padding:'10px 18px',textDecoration:'none',fontWeight:700,fontSize:12,marginTop:4}}>
          📡 Open Live Feed
        </a>
      </div>

      {/* Integration snippets */}
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px'}}>
        <div style={{fontWeight:800,fontSize:14,color:'#111',marginBottom:16}}>⚙️ Integration Examples</div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>JavaScript / Node.js</div>
          <pre style={{background:'#1e293b',color:'#e2e8f0',borderRadius:8,padding:'14px',fontSize:11,overflow:'auto',margin:0}}>{`const res = await fetch('${BASE}/api/v1/aliya-today/articles?limit=10', {
  headers: { 'Authorization': 'Bearer ${API_KEY}' }
})
const { articles } = await res.json()
articles.forEach(a => console.log(a.title, a.url))`}</pre>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Python</div>
          <pre style={{background:'#1e293b',color:'#e2e8f0',borderRadius:8,padding:'14px',fontSize:11,overflow:'auto',margin:0}}>{`import requests
r = requests.get(
    '${BASE}/api/v1/aliya-today/articles',
    headers={'Authorization': 'Bearer ${API_KEY}'},
    params={'limit': 10, 'category': 'Housing'}
)
for a in r.json()['articles']:
    print(a['title'], a['url'])`}</pre>
        </div>

        <div>
          <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Zapier / Make / n8n — HTTP Request node</div>
          <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:'14px',fontSize:12,color:'#374151',lineHeight:1.7}}>
            <b>URL:</b> <code style={{background:'#e5e7eb',padding:'1px 6px',borderRadius:4}}>{BASE}/api/v1/aliya-today/articles</code><br/>
            <b>Method:</b> GET<br/>
            <b>Headers:</b> <code style={{background:'#e5e7eb',padding:'1px 6px',borderRadius:4}}>Authorization: Bearer {API_KEY}</code><br/>
            <b>Query params:</b> <code style={{background:'#e5e7eb',padding:'1px 6px',borderRadius:4}}>limit=20</code> (add category, q, from/to as needed)
          </div>
        </div>
      </div>
    </div>
  )
}

// ── LINK BUILDING TAB ────────────────────────────────────────────────────────
function LinkBuildingTab() {
  const [subTab, setSubTab] = useState<'toi'|'reddit'|'haro'|'outreach'>('toi')
  const A = '#c47d1a'

  return (
    <div style={{padding:'24px 28px'}}>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:20,fontWeight:900,color:'#111',margin:'0 0 4px'}}>🔗 Link Building Console</h2>
        <p style={{fontSize:13,color:'#6b7280',margin:0}}>Generate, draft and track backlink opportunities for AliyaToday.com</p>
      </div>

      {/* Sub tabs */}
      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {([
          {id:'toi',label:'📰 Times of Israel',desc:'Draft blog posts'},
          {id:'reddit',label:'👾 Reddit',desc:'r/aliyah replies'},
          {id:'haro',label:'📡 HARO / Media',desc:'Journalist pitches'},
          {id:'outreach',label:'🤝 Outreach CRM',desc:'Community contacts'},
        ] as const).map(t => (
          <button key={t.id} onClick={()=>setSubTab(t.id)}
            style={{padding:'10px 18px',borderRadius:10,border:`2px solid ${subTab===t.id?A:'#e5e7eb'}`,background:subTab===t.id?A:'#fff',color:subTab===t.id?'#fff':'#374151',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            {t.label}
            <span style={{display:'block',fontSize:10,fontWeight:400,opacity:0.8}}>{t.desc}</span>
          </button>
        ))}
      </div>

      {subTab==='toi'  && <TOITab />}
      {subTab==='reddit' && <RedditTab />}
      {subTab==='haro' && <HAROTab />}
      {subTab==='outreach' && <OutreachTab />}
    </div>
  )
}

function TOITab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [artIdx, setArtIdx] = useState(0)

  async function generate() {
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/aliya-admin/linkbuilding', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'draft_toi',articleIndex:artIdx}) })
      setResult(await r.json())
    } finally { setLoading(false) }
  }

  function copy() { if(result?.draft){ navigator.clipboard.writeText(result.draft); setCopied(true); setTimeout(()=>setCopied(false),2000) } }

  return (
    <div>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:15,color:'#111',marginBottom:8}}>📰 Times of Israel Blog Post Drafter</div>
        <p style={{fontSize:13,color:'#6b7280',margin:'0 0 16px',lineHeight:1.6}}>
          TOI lets anyone publish in their Blogs section — free, instant, high-authority backlink. Each post links back to AliyaToday.com.
          <a href="https://blogs.timesofisrael.com/wp-login.php" target="_blank" rel="noopener" style={{color:'#c47d1a',marginLeft:6,fontWeight:700}}>Open TOI Blog Editor →</a>
        </p>

        {result?.topArticles && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:8}}>Choose article to base post on:</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {result.topArticles.map((a:any,i:number) => (
                <label key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',background:artIdx===i?'#fef3c7':'#f9fafb',border:`1px solid ${artIdx===i?'#c47d1a':'#e5e7eb'}`,borderRadius:8,cursor:'pointer'}}>
                  <input type="radio" name="article" checked={artIdx===i} onChange={()=>setArtIdx(i)} style={{marginTop:2}} />
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#111'}}>{a.title}</div>
                    <div style={{fontSize:11,color:'#9ca3af'}}>{a.category} · {a.views||0} views</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <button onClick={generate} disabled={loading}
          style={{background:'#c47d1a',color:'#fff',border:'none',padding:'12px 24px',borderRadius:10,fontWeight:800,fontSize:14,cursor:'pointer',opacity:loading?0.7:1,fontFamily:'Inter,sans-serif'}}>
          {loading ? '✍️ Drafting post...' : '✍️ Generate TOI Blog Post'}
        </button>
      </div>

      {result?.draft && (
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:800,fontSize:14,color:'#111'}}>Draft ready — based on: {result.article?.title}</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={copy} style={{background:copied?'#16a34a':'#f3f4f6',color:copied?'#fff':'#374151',border:'none',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                {copied?'✅ Copied!':'📋 Copy All'}
              </button>
              <a href="https://blogs.timesofisrael.com/wp-login.php" target="_blank" rel="noopener"
                style={{background:'#1a56b0',color:'#fff',border:'none',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',textDecoration:'none'}}>
                📤 Open TOI Editor
              </a>
            </div>
          </div>
          <pre style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:'16px',fontSize:13,lineHeight:1.7,whiteSpace:'pre-wrap',fontFamily:'Georgia,serif',color:'#111',margin:0,maxHeight:500,overflow:'auto'}}>
            {result.draft}
          </pre>
          <div style={{marginTop:12,padding:'10px 14px',background:'#fef3c7',borderRadius:8,fontSize:12,color:'#92400e'}}>
            💡 Paste this into TOI Blog Editor → Add tags: aliyah, israel, immigration, olim → Publish. Link goes live immediately.
          </div>
        </div>
      )}
    </div>
  )
}

function RedditTab() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [copied, setCopied] = useState<string|null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const A = '#c47d1a'

  async function scan() {
    setLoading(true); setData(null)
    try {
      const r = await fetch('/api/aliya-admin/linkbuilding', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'reddit_daily'}) })
      setData(await r.json())
    } finally { setLoading(false) }
  }

  async function markDone(o: any) {
    setDone(prev => new Set([...prev, o.post_id]))
    await fetch('/api/aliya-admin/linkbuilding', { method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'reddit_mark_done', postId:o.post_id, postTitle:o.post_title, subreddit:o.subreddit}) })
  }

  async function loadHistory() {
    const r = await fetch('/api/aliya-admin/linkbuilding', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'reddit_history'}) })
    const d = await r.json(); setHistory(d.history||[])
  }

  function copy(id: string, text: string) { navigator.clipboard.writeText(text); setCopied(id); setTimeout(()=>setCopied(null), 2500) }

  const PRIORITY_COLOR: Record<string,string> = { aliyah:'#ff4500', MovingToIsrael:'#ff6b35', israelexpatriates:'#e85d04', Israel:'#1a56b0', Jewish:'#2563eb', expats:'#6b7280' }

  return (
    <div>
      {/* Header */}
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:'#111',marginBottom:4}}>👾 Daily Reddit Briefing</div>
            <div style={{fontSize:13,color:'#6b7280',lineHeight:1.5}}>
              Scans <strong>r/aliyah · r/MovingToIsrael · r/israelexpatriates · r/Israel · r/Jewish · r/expats</strong> for posts where you can help and earn a natural backlink. Fresh posts only — already-replied posts are skipped automatically.
            </div>
          </div>
          <button onClick={()=>{setShowHistory(!showHistory); if(!showHistory) loadHistory()}}
            style={{background:'#f3f4f6',color:'#374151',border:'none',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',whiteSpace:'nowrap',marginLeft:16}}>
            {showHistory ? '← Back' : '📋 History'}
          </button>
        </div>
        <button onClick={scan} disabled={loading}
          style={{background:'#ff4500',color:'#fff',border:'none',padding:'14px 32px',borderRadius:10,fontWeight:900,fontSize:15,cursor:'pointer',opacity:loading?0.7:1,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:10}}>
          {loading ? <><span style={{display:'inline-block',width:16,height:16,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />Scanning all subreddits + drafting replies...</> : '🔍 Get Today&apos;s Opportunities'}
        </button>
        {data && (
          <div style={{marginTop:12,fontSize:12,color:'#9ca3af'}}>
            Last scan: {new Date(data.generatedAt).toLocaleTimeString()} · Scanned {data.totalScanned} posts · {data.opportunities?.length||0} opportunities found
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* History view */}
      {showHistory && (
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
          <div style={{fontWeight:800,fontSize:14,color:'#111',marginBottom:12}}>Posts You've Already Replied To</div>
          {history.length === 0 ? (
            <div style={{color:'#9ca3af',fontSize:13}}>No history yet. Start replying to posts and mark them done.</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {history.map((h:any,i:number) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#f9fafb',borderRadius:8,border:'1px solid #e5e7eb'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#374151'}}>{h.post_title}</div>
                    <div style={{fontSize:11,color:'#9ca3af'}}>r/{h.subreddit} · {new Date(h.used_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                  </div>
                  <span style={{fontSize:11,background:'#dcfce7',color:'#16a34a',padding:'3px 10px',borderRadius:20,fontWeight:700}}>✓ Done</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {data?.opportunities?.length === 0 && !showHistory && (
        <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:12,padding:'32px',textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:12}}>🎉</div>
          <div style={{fontWeight:700,fontSize:15,color:'#374151',marginBottom:4}}>All caught up!</div>
          <div style={{fontSize:13,color:'#9ca3af'}}>No new high-relevance posts right now. Check back in a few hours.</div>
        </div>
      )}

      {/* Opportunity cards */}
      {!showHistory && data?.opportunities?.map((o:any, i:number) => {
        const isDone = done.has(o.post_id)
        return (
          <div key={o.post_id} style={{background: isDone ? '#f9fafb' : '#fff', border:`1px solid ${isDone?'#e5e7eb':'#d1d5db'}`, borderRadius:12, padding:'20px 24px', marginBottom:16, opacity:isDone?0.6:1, transition:'opacity 0.3s'}}>

            {/* Post header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <div style={{flex:1,marginRight:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                  <span style={{background: (PRIORITY_COLOR[o.subreddit]||'#6b7280')+'20', color: PRIORITY_COLOR[o.subreddit]||'#6b7280', padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>
                    r/{o.subreddit}
                  </span>
                  <span style={{background:'#fef3c7',color:'#92400e',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>
                    Relevance {o.relevance}/10
                  </span>
                  {o.article_url && (
                    <span style={{background:'#dcfce7',color:'#16a34a',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>
                      🔗 Link included
                    </span>
                  )}
                </div>
                <div style={{fontWeight:800,fontSize:15,color:'#111',lineHeight:1.4,marginBottom:4}}>{o.post_title}</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>{o.why}</div>
              </div>
              <a href={o.post_url} target="_blank" rel="noopener"
                style={{background:'#ff4500',color:'#fff',padding:'10px 18px',borderRadius:8,fontWeight:700,fontSize:13,textDecoration:'none',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}}>
                Open Post →
              </a>
            </div>

            {/* Reply box */}
            <div style={{background:'#f8f9fa',border:'1px solid #e5e7eb',borderRadius:10,padding:'16px',marginBottom:12,position:'relative'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Your Reply — ready to paste</div>
              <div style={{fontSize:14,lineHeight:1.8,color:'#1f2937',whiteSpace:'pre-wrap',fontFamily:'system-ui'}}>{o.reply}</div>
              {o.article_url && (
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid #e5e7eb',fontSize:12,color:'#9ca3af'}}>
                  Links to: <a href={o.article_url} target="_blank" rel="noopener" style={{color:'#c47d1a',fontWeight:600}}>{o.article_title || o.article_url}</a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>copy(`reply-${o.post_id}`, o.reply)}
                style={{background: copied===`reply-${o.post_id}` ? '#16a34a' : A, color:'#fff',border:'none',padding:'10px 20px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                {copied===`reply-${o.post_id}` ? '✅ Copied!' : '📋 Copy Reply'}
              </button>
              <a href={o.post_url} target="_blank" rel="noopener"
                style={{background:'#f3f4f6',color:'#374151',border:'none',padding:'10px 20px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',textDecoration:'none',display:'inline-flex',alignItems:'center'}}>
                💬 Open Thread
              </a>
              {!isDone && (
                <button onClick={()=>markDone(o)}
                  style={{background:'#dcfce7',color:'#16a34a',border:'1px solid #bbf7d0',padding:'10px 20px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif',marginLeft:'auto'}}>
                  ✓ Mark as Posted
                </button>
              )}
              {isDone && (
                <span style={{padding:'10px 16px',fontSize:13,color:'#16a34a',fontWeight:700,marginLeft:'auto'}}>✅ Posted</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HAROTab() {
  const [query, setQuery] = useState('')
  const [pub, setPub] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    if(!query.trim()) return
    setLoading(true); setDraft('')
    try {
      const r = await fetch('/api/aliya-admin/linkbuilding', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'haro_draft',query,publication:pub,deadline}) })
      const d = await r.json()
      setDraft(d.draft||'')
    } finally { setLoading(false) }
  }

  function copy(){ navigator.clipboard.writeText(draft); setCopied(true); setTimeout(()=>setCopied(false),2000) }

  return (
    <div>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:15,color:'#111',marginBottom:8}}>📡 HARO / Connectively Pitch Drafter</div>
        <p style={{fontSize:13,color:'#6b7280',margin:'0 0 16px',lineHeight:1.6}}>
          Paste a journalist query from HARO/Connectively and get a pitch drafted as Solly Marks in seconds.
          <a href="https://www.connectively.us/" target="_blank" rel="noopener" style={{color:'#c47d1a',marginLeft:6,fontWeight:700}}>Open Connectively →</a>
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Journalist Query *</div>
            <textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder="Paste the journalist's query here..." rows={4}
              style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,fontFamily:'system-ui',resize:'vertical',outline:'none',boxSizing:'border-box'}} />
          </div>
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Publication</div>
              <input value={pub} onChange={e=>setPub(e.target.value)} placeholder="e.g. Forbes, Haaretz, JTA"
                style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box'}} />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>Deadline</div>
              <input value={deadline} onChange={e=>setDeadline(e.target.value)} placeholder="e.g. Today 5pm EST"
                style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box'}} />
            </div>
          </div>
          <button onClick={generate} disabled={loading||!query.trim()}
            style={{background:'#c47d1a',color:'#fff',border:'none',padding:'12px 24px',borderRadius:10,fontWeight:800,fontSize:14,cursor:'pointer',opacity:(loading||!query.trim())?0.6:1,alignSelf:'flex-start',fontFamily:'Inter,sans-serif'}}>
            {loading?'✍️ Drafting pitch...':'✍️ Draft Pitch'}
          </button>
        </div>
      </div>

      {draft && (
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:800,fontSize:14,color:'#111'}}>Pitch Ready</div>
            <button onClick={copy} style={{background:copied?'#16a34a':'#f3f4f6',color:copied?'#fff':'#374151',border:'none',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer'}}>
              {copied?'✅ Copied!':'📋 Copy Pitch'}
            </button>
          </div>
          <pre style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:'16px',fontSize:13,lineHeight:1.7,whiteSpace:'pre-wrap',fontFamily:'Georgia,serif',color:'#111',margin:0}}>
            {draft}
          </pre>
          <div style={{marginTop:12,padding:'10px 14px',background:'#fef3c7',borderRadius:8,fontSize:12,color:'#92400e'}}>
            💡 Replace [your@email.com] with your real email before sending. Send directly via Connectively or HARO reply link.
          </div>
        </div>
      )}
    </div>
  )
}

function OutreachTab() {
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('Jewish community organisation')
  const [contactName, setContactName] = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [records, setRecords] = useState<any[]>([])
  const [recLoading, setRecLoading] = useState(false)
  const [contactEmail, setContactEmail] = useState('')

  const ORG_TYPES = ['Synagogue','Chabad House','JCC / Jewish Community Center','Jewish Federation','Aliyah organisation','Jewish school / Yeshiva','Jewish newsletter','Jewish charity','Jewish student union','Other']
  const STATUS_COLORS:Record<string,string> = { drafted:'#6b7280', sent:'#1a56b0', replied:'#c47d1a', linked:'#16a34a', declined:'#ef4444' }

  useEffect(()=>{ loadRecords() },[])

  async function loadRecords(){
    setRecLoading(true)
    try { const r = await fetch('/api/aliya-admin/linkbuilding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get_outreach'})}); const d = await r.json(); setRecords(d.records||[]) }
    finally { setRecLoading(false) }
  }

  async function generate(){
    if(!orgName.trim()) return
    setLoading(true); setDraft('')
    try {
      const r = await fetch('/api/aliya-admin/linkbuilding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'outreach_email',orgName,orgType,contactName})})
      const d = await r.json(); setDraft(d.email||'')
    } finally { setLoading(false) }
  }

  async function save(status='drafted'){
    setSaving(true)
    try {
      await fetch('/api/aliya-admin/linkbuilding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_outreach',orgName,orgType,contactEmail,platform:'email',status,notes:draft})})
      setSaved(true); setTimeout(()=>setSaved(false),2000); loadRecords()
    } finally { setSaving(false) }
  }

  function copy(){ navigator.clipboard.writeText(draft); setCopied(true); setTimeout(()=>setCopied(false),2000) }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      {/* Left — drafter */}
      <div>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px',marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:15,color:'#111',marginBottom:8}}>🤝 Community Outreach Email</div>
          <p style={{fontSize:13,color:'#6b7280',margin:'0 0 16px',lineHeight:1.6}}>Draft personalised outreach emails to Jewish organisations to get AliyaToday.com listed in their resources.</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Organisation Name *</div>
              <input value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="e.g. Chabad of Manhattan"
                style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box'}} />
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Organisation Type</div>
              <select value={orgType} onChange={e=>setOrgType(e.target.value)}
                style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',background:'#fff',boxSizing:'border-box'}}>
                {ORG_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Contact Name</div>
                <input value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Rabbi Smith (optional)"
                  style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box'}} />
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Contact Email</div>
                <input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} placeholder="contact@org.com"
                  style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid #d1d5db',fontSize:13,outline:'none',boxSizing:'border-box'}} />
              </div>
            </div>
            <button onClick={generate} disabled={loading||!orgName.trim()}
              style={{background:'#c47d1a',color:'#fff',border:'none',padding:'12px 20px',borderRadius:10,fontWeight:800,fontSize:13,cursor:'pointer',opacity:(loading||!orgName.trim())?0.6:1,fontFamily:'Inter,sans-serif'}}>
              {loading?'✍️ Drafting...':'✍️ Draft Email'}
            </button>
          </div>
        </div>

        {draft && (
          <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px'}}>
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
              <button onClick={copy} style={{background:copied?'#16a34a':'#f3f4f6',color:copied?'#fff':'#374151',border:'none',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                {copied?'✅ Copied':'📋 Copy'}
              </button>
              <button onClick={()=>save('sent')} disabled={saving}
                style={{background:'#1a56b0',color:'#fff',border:'none',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',opacity:saving?0.7:1}}>
                {saving?'Saving...':saved?'✅ Saved':'📤 Mark as Sent'}
              </button>
              <button onClick={()=>save('drafted')} disabled={saving}
                style={{background:'#f3f4f6',color:'#374151',border:'none',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                💾 Save Draft
              </button>
            </div>
            <pre style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:'14px',fontSize:12,lineHeight:1.7,whiteSpace:'pre-wrap',fontFamily:'Georgia,serif',color:'#111',margin:0,maxHeight:400,overflow:'auto'}}>
              {draft}
            </pre>
          </div>
        )}
      </div>

      {/* Right — CRM tracker */}
      <div>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'20px 24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:15,color:'#111'}}>📋 Outreach Tracker</div>
            <button onClick={loadRecords} style={{background:'#f3f4f6',color:'#374151',border:'none',padding:'6px 12px',borderRadius:8,fontWeight:700,fontSize:11,cursor:'pointer'}}>↻ Refresh</button>
          </div>
          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
            {(['sent','replied','linked','declined'] as const).map(s=>(
              <div key={s} style={{textAlign:'center',padding:'10px 8px',background:'#f9fafb',borderRadius:8,border:'1px solid #e5e7eb'}}>
                <div style={{fontSize:18,fontWeight:900,color:STATUS_COLORS[s]}}>{records.filter(r=>r.status===s).length}</div>
                <div style={{fontSize:10,color:'#9ca3af',textTransform:'capitalize'}}>{s}</div>
              </div>
            ))}
          </div>
          {recLoading ? (
            <div style={{textAlign:'center',padding:'20px',color:'#9ca3af',fontSize:13}}>Loading...</div>
          ) : records.length === 0 ? (
            <div style={{textAlign:'center',padding:'20px',color:'#9ca3af',fontSize:13}}>No outreach tracked yet. Draft and save emails to track them here.</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:500,overflow:'auto'}}>
              {records.map((r:any,i:number)=>(
                <div key={i} style={{padding:'12px 14px',background:'#f9fafb',borderRadius:8,border:'1px solid #e5e7eb'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:'#111'}}>{r.org_name}</div>
                      <div style={{fontSize:11,color:'#9ca3af'}}>{r.org_type} {r.contact_email?`· ${r.contact_email}`:''}</div>
                    </div>
                    <span style={{background:STATUS_COLORS[r.status]+'20',color:STATUS_COLORS[r.status],padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,textTransform:'capitalize',whiteSpace:'nowrap'}}>
                      {r.status}
                    </span>
                  </div>
                  <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>{new Date(r.updated_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
