'use client'
import { useState } from 'react'
import Link from 'next/link'

// Varied images so articles never look the same
const IMGS = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
  'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://images.unsplash.com/photo-1526628953301-3cd9e37dc0d7?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=800&q=80',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
]
const img = (a: any, i: number) => a.cover_image_url || IMGS[i % IMGS.length]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

function Newsletter({ siteId, siteName, p }: any) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try { await fetch('/api/newsletter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, siteId, siteName }) }) } catch {}
    setDone(true); setLoading(false)
  }
  return done
    ? <div style={{ padding:'16px 20px', background:`${p}15`, border:`1px solid ${p}`, borderRadius:4, fontSize:14, color:p, fontFamily:'Inter,sans-serif', fontWeight:600 }}>✓ You're subscribed! Daily briefing on the way.</div>
    : <form onSubmit={submit} style={{ display:'flex', gap:8, maxWidth:460, flexWrap:'wrap' }}>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Your email address" required
          style={{ flex:1, padding:'10px 14px', border:'1px solid #ccc', fontFamily:'Inter,sans-serif', fontSize:13, outline:'none', minWidth:200 }} />
        <button type="submit" disabled={loading}
          style={{ padding:'10px 20px', background:p, color:'#fff', border:'none', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
          {loading ? 'Subscribing...' : 'Subscribe Free →'}
        </button>
      </form>
}

export default function WireTemplate({ articles = [], site, siteSlug, primaryColor }: any) {
  const [activeSection, setActiveSection] = useState('All')
  const p = primaryColor || site?.primary_color || '#C00000'
  const siteName = site?.name || 'NEX-WIRE'
  const domain = siteSlug === 'global-trade-wire' ? 'nex-wire.com' : 'presxwire.com'
  const SECTIONS = ['All', 'Markets', 'Trade', 'Finance', 'Commodities', 'Analysis', 'Opinion']

  const filtered = activeSection === 'All' ? articles : articles.filter((a: any) => (a.category||'').toLowerCase().includes(activeSection.toLowerCase()))
  const hero = filtered[0]
  const top  = filtered.slice(1, 5)
  const grid = filtered.slice(5, 21)

  return (
    <div style={{ fontFamily:'Georgia,"Times New Roman",serif', background:'#fff', color:'#111', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit} img{max-width:100%;display:block}
        .whl{font-family:'Playfair Display',serif;font-weight:800;line-height:1.2;color:#111}
        .wcard:hover .whl{text-decoration:underline;text-underline-offset:3px}
        .wmeta{font-family:Inter,sans-serif;font-size:11px;color:#888;margin-top:6px}
        .wcat{font-family:Inter,sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${p};border-left:3px solid ${p};padding-left:6px;margin-bottom:8px}
        .wnav button{font-family:Inter,sans-serif;font-size:12px;font-weight:600;padding:10px 16px;border:none;background:none;cursor:pointer;color:#555;letter-spacing:.02em;text-transform:uppercase}
        .wnav button:hover,.wnav button.active{color:${p};border-bottom:2px solid ${p}}
        .ticker-run{animation:wtick 40s linear infinite;display:flex;gap:0;white-space:nowrap}
        @keyframes wtick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @media(max-width:768px){.whero{grid-template-columns:1fr!important}.wgrid{grid-template-columns:1fr!important}.wtop{grid-template-columns:1fr!important}}
      `}</style>

      {/* Breaking ticker */}
      <div style={{ background:p, color:'#fff', height:32, display:'flex', alignItems:'center', overflow:'hidden' }}>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:800, letterSpacing:'.12em', padding:'0 16px', background:'rgba(0,0,0,0.25)', height:'100%', display:'flex', alignItems:'center', flexShrink:0 }}>BREAKING</div>
        <div style={{ overflow:'hidden', flex:1 }}>
          <div className="ticker-run">
            {[...articles.slice(0,8),...articles.slice(0,8)].map((a: any, i: number) => (
              <span key={i} style={{ fontFamily:'Inter,sans-serif', fontSize:12, padding:'0 28px', borderRight:'1px solid rgba(255,255,255,0.2)' }}>▸ {a?.title?.slice(0,72)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div style={{ padding:'14px 28px', borderBottom:`3px solid #111`, maxWidth:1280, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:48, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1 }}>
              {siteName.includes('-')
                ? <>{siteName.split('-')[0]}<span style={{color:p}}>-</span>{siteName.split('-')[1]}</>
                : siteName}
            </div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#888', marginTop:5 }}>{domain} · {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, background:p, color:'#fff', padding:'3px 10px', borderRadius:2, letterSpacing:'.06em', marginBottom:6 }}>● LIVE</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#666' }}>{articles.length} stories published today</div>
          </div>
        </div>
        {/* Section nav */}
        <nav className="wnav" style={{ display:'flex', flexWrap:'wrap', borderTop:'1px solid #e5e5e5', paddingTop:2 }}>
          {SECTIONS.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} className={activeSection===s?'active':''} style={{color: activeSection===s ? p : '#555'}}>{s}</button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'28px' }}>
        {/* Hero + sidebar */}
        {hero && (
          <div className="whero" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:32, marginBottom:36, paddingBottom:32, borderBottom:'3px double #ddd' }}>
            <Link href={`/article/${siteSlug}/${hero.slug}`} className="wcard" style={{ display:'block' }}>
              <img src={img(hero,0)} alt={hero.title} style={{ width:'100%', height:340, objectFit:'cover', marginBottom:16 }} />
              <div className="wcat">{hero.category || 'Analysis'}</div>
              <div className="whl" style={{ fontSize:34, marginBottom:10 }}>{hero.title}</div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:16, color:'#444', lineHeight:1.7, marginBottom:8 }}>{hero.excerpt?.slice(0,200)}</div>
              <div className="wmeta">{hero.author_name || 'Editorial'} · {timeAgo(hero.published_at)} · {hero.read_time_minutes||4} min</div>
            </Link>
            <div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'#999', marginBottom:10, paddingBottom:6, borderBottom:'2px solid #111' }}>Top Stories</div>
              {top.map((a: any, i: number) => (
                <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="wcard" style={{ display:'block', paddingBottom:12, marginBottom:12, borderBottom:'1px solid #eee' }}>
                  <div style={{ display:'flex', gap:10 }}>
                    <img src={img(a,i+1)} alt={a.title} style={{ width:72, height:52, objectFit:'cover', flexShrink:0 }} />
                    <div>
                      <div className="wcat" style={{ fontSize:9 }}>{a.category}</div>
                      <div className="whl" style={{ fontSize:15 }}>{a.title}</div>
                      <div className="wmeta">{timeAgo(a.published_at)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'#999', marginBottom:18, paddingBottom:6, borderBottom:'2px solid #111' }}>Latest Intelligence</div>
        <div className="wgrid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, marginBottom:48 }}>
          {grid.map((a: any, i: number) => (
            <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="wcard" style={{ display:'block' }}>
              <img src={img(a,i+5)} alt={a.title} style={{ width:'100%', height:130, objectFit:'cover', marginBottom:10 }} />
              <div className="wcat" style={{ fontSize:9 }}>{a.category}</div>
              <div className="whl" style={{ fontSize:16, marginBottom:5 }}>{a.title}</div>
              <div className="wmeta">{timeAgo(a.published_at)}</div>
            </Link>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{ background:'#f5f5f3', border:`2px solid ${p}`, padding:'28px 32px', marginBottom:32 }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:800, marginBottom:6 }}>Daily Market Intelligence — Free Briefing</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'#555', marginBottom:16 }}>Get the top {siteName} stories delivered every morning. 50,000+ professionals subscribe.</div>
          <Newsletter siteId={site?.id} siteName={siteName} p={p} />
        </div>
      </div>

      <footer style={{ background:'#111', color:'#555', padding:'20px 28px', fontFamily:'Inter,sans-serif', fontSize:11, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <span style={{ color:'#fff', fontFamily:'Playfair Display,serif', fontWeight:700 }}>{siteName}</span>
        <span>© {new Date().getFullYear()} {domain} · RepHuby Intelligence Network</span>
      </footer>
    </div>
  )
}
