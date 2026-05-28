'use client'
import { useState } from 'react'
import Link from 'next/link'

const IMGS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
]
const img = (a: any, i: number) => a.cover_image_url && !a.cover_image_url.includes('unsplash') ? a.cover_image_url : IMGS[i % IMGS.length]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)} min ago`
  if (s < 86400) return `${Math.floor(s/3600)} hours ago`
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'long' })
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
    ? <div style={{ padding:'14px 18px', background:'rgba(255,255,255,0.15)', borderRadius:4, fontSize:14, fontWeight:600, color:'#fff' }}>✓ Subscribed! First issue tomorrow morning.</div>
    : <form onSubmit={submit} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Your work email" required
          style={{ flex:1, padding:'11px 16px', border:'none', fontFamily:'Inter,sans-serif', fontSize:13, minWidth:200, outline:'none' }} />
        <button type="submit" disabled={loading}
          style={{ padding:'11px 22px', background:p, color:'#fff', border:'none', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
          {loading ? 'Joining...' : 'Join Free →'}
        </button>
      </form>
}

export default function MagazineTemplate({ articles = [], site, siteSlug, primaryColor }: any) {
  const [activeSection, setActiveSection] = useState('All')
  const p = primaryColor || '#6741D9'
  const isBiz = siteSlug === 'business-pulse'
  const siteName = site?.name || (isBiz ? 'BIZPLEZX' : 'EXECVEX')
  const domain = isBiz ? 'bizplezx.com' : 'execvex.com'
  const tagline = isBiz ? 'Business Strategy & Innovation Intelligence' : 'Executive Leadership & Career Intelligence'
  const SECTIONS = ['All', 'Strategy', 'Leadership', 'Innovation', 'Finance', 'Markets', 'Interviews']

  const filtered = activeSection === 'All' ? articles : articles.filter((a: any) => (a.category||'').toLowerCase().includes(activeSection.toLowerCase()))
  const hero = filtered[0]
  const featured = filtered.slice(1, 4)
  const list = filtered.slice(4, 14)

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:'#FAFAF8', color:'#1A1A1A', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit} img{max-width:100%;display:block}
        .mhl{font-family:'Playfair Display',Georgia,serif;font-weight:800;line-height:1.2;color:#1A1A1A}
        .mcard:hover .mhl{color:${p}}
        .mmeta{font-family:Inter,sans-serif;font-size:11px;color:#888;font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin-top:8px}
        .mcat{font-family:Inter,sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${p};margin-bottom:8px}
        .mnav button{font-family:Inter,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:11px 16px;border:none;background:none;cursor:pointer;color:#888;border-bottom:2px solid transparent}
        .mnav button.on{color:${p};border-bottom-color:${p}}
        .mnav button:hover{color:${p}}
        @media(max-width:768px){.mhero{grid-template-columns:1fr!important}.m3{grid-template-columns:1fr!important}.m2{grid-template-columns:1fr!important}}
      `}</style>

      {/* Top stripe */}
      <div style={{ background:p, color:'#fff', fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'.06em', padding:'7px 28px', display:'flex', justifyContent:'space-between' }}>
        <span>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
        <span>{domain} · Premium Business Intelligence</span>
      </div>

      {/* Masthead */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'18px 28px 0', borderBottom:'3px solid #1A1A1A' }}>
        <div style={{ textAlign:'center', padding:'14px 0 16px', borderBottom:'1px solid #ddd', marginBottom:10 }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:60, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1 }}>
            {siteName.slice(0,-1)}<span style={{color:p}}>{siteName.slice(-1)}</span>
          </div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:13, color:'#888', marginTop:6, fontStyle:'italic' }}>{tagline}</div>
        </div>
        <nav className="mnav" style={{ display:'flex', justifyContent:'center', flexWrap:'wrap' }}>
          {SECTIONS.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} className={activeSection===s?'on':''}>{s}</button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px 28px' }}>
        {/* Hero */}
        {hero && (
          <div className="mhero mcard" style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:44, marginBottom:48, paddingBottom:40, borderBottom:'1px solid #ddd' }}>
            <div>
              <div className="mcat">{hero.category}</div>
              <Link href={`/article/${siteSlug}/${hero.slug}`}><div className="mhl" style={{ fontSize:40, marginBottom:14 }}>{hero.title}</div></Link>
              <div style={{ fontFamily:'Georgia,serif', fontSize:16, color:'#444', lineHeight:1.75 }}>{hero.excerpt?.slice(0,240)}</div>
              <div className="mmeta">By {hero.author_name||'Editorial'} · {timeAgo(hero.published_at)} · {hero.read_time_minutes||5} min read</div>
              <Link href={`/article/${siteSlug}/${hero.slug}`} style={{ display:'inline-block', marginTop:16, fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:700, color:p, borderBottom:`2px solid ${p}`, paddingBottom:2 }}>Read Full Article →</Link>
            </div>
            <Link href={`/article/${siteSlug}/${hero.slug}`}><img src={img(hero,0)} alt={hero.title} style={{ width:'100%', height:340, objectFit:'cover' }} /></Link>
          </div>
        )}

        {/* 3-col featured */}
        <div className="m3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, marginBottom:48, paddingBottom:40, borderBottom:'1px solid #ddd' }}>
          {featured.map((a: any, i: number) => (
            <div key={a.id} className="mcard">
              <Link href={`/article/${siteSlug}/${a.slug}`}><img src={img(a,i+1)} alt={a.title} style={{ width:'100%', height:190, objectFit:'cover', marginBottom:12 }} /></Link>
              <div className="mcat">{a.category}</div>
              <Link href={`/article/${siteSlug}/${a.slug}`}><div className="mhl" style={{ fontSize:20, marginBottom:8 }}>{a.title}</div></Link>
              <div style={{ fontFamily:'Georgia,serif', fontSize:13, color:'#555', lineHeight:1.6 }}>{a.excerpt?.slice(0,110)}</div>
              <div className="mmeta">{timeAgo(a.published_at)}</div>
            </div>
          ))}
        </div>

        {/* List */}
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', color:'#999', marginBottom:18, paddingBottom:6, borderBottom:'2px solid #1A1A1A' }}>Latest Analysis</div>
        <div className="m2" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20, marginBottom:48 }}>
          {list.map((a: any, i: number) => (
            <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="mcard" style={{ display:'flex', gap:16, paddingBottom:18, borderBottom:'1px solid #ddd' }}>
              <img src={img(a,i+4)} alt={a.title} style={{ width:100, height:70, objectFit:'cover', flexShrink:0 }} />
              <div>
                <div className="mcat" style={{ fontSize:9, marginBottom:4 }}>{a.category}</div>
                <div className="mhl" style={{ fontSize:16, marginBottom:4 }}>{a.title}</div>
                <div className="mmeta" style={{ margin:0 }}>{timeAgo(a.published_at)}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{ background:`linear-gradient(135deg,${p},${p}CC)`, padding:'32px', borderRadius:4, marginBottom:32 }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:26, fontWeight:800, color:'#fff', marginBottom:6 }}>Get the {siteName} Morning Brief</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'rgba(255,255,255,0.8)', marginBottom:20 }}>Top business intelligence, strategy insights, and executive interviews every morning.</div>
          <Newsletter siteId={site?.id} siteName={siteName} p="#1A1A1A" />
        </div>
      </div>

      <footer style={{ background:'#1A1A1A', color:'#666', padding:'20px 28px', fontFamily:'Inter,sans-serif', fontSize:11, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <span style={{ color:'#fff', fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:16 }}>{siteName}</span>
        <span>© {new Date().getFullYear()} {domain} · RepHuby Intelligence Network</span>
      </footer>
    </div>
  )
}
