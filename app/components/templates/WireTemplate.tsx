'use client'
import { useState } from 'react'
import Link from 'next/link'

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

export default function WireTemplate({ articles = [], site, routePrefix, siteSlug, primaryColor }: any) {
  const [menuOpen, setMenuOpen] = useState(false)
  const p = primaryColor || site?.primary_color || '#C00000'
  const siteName = site?.name || 'Nex-Wire'
  const domain = siteSlug === 'global-trade-wire' ? 'nex-wire.com' : siteSlug === 'press-central' ? 'presxwire.com' : 'rephuby.com'

  const hero = articles[0]
  const top  = articles.slice(1, 5)
  const rest = articles.slice(5, 17)

  const SECTIONS = ['Markets','Trade','Finance','Commodities','Analysis','Opinion']

  return (
    <div style={{ fontFamily:'Georgia,"Times New Roman",serif', background:'#fff', color:'#111', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Source+Serif+4:wght@400;600&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        img{max-width:100%;display:block}
        .wire-cat{font-family:Inter,sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${p};border-left:3px solid ${p};padding-left:7px;margin-bottom:8px}
        .wire-headline{font-family:'Playfair Display',serif;font-weight:800;line-height:1.2;color:#111}
        .wire-sub{font-family:'Source Serif 4',serif;color:#444;line-height:1.6}
        .wire-meta{font-family:Inter,sans-serif;font-size:11px;color:#888;margin-top:6px}
        .wire-card:hover .wire-headline{text-decoration:underline;text-underline-offset:2px}
        .wire-divider{border:none;border-top:1px solid #e5e5e5;margin:16px 0}
        .breaking-tick{animation:tickscroll 40s linear infinite}
        @keyframes tickscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .nav-link{font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:#111;padding:0 14px;letter-spacing:.01em;white-space:nowrap;border-right:1px solid #e5e5e5}
        .nav-link:hover{color:${p}}
        .nav-link:last-child{border-right:none}
        @media(max-width:768px){.wire-grid{grid-template-columns:1fr!important}.wire-top{grid-template-columns:1fr!important}.hide-mob{display:none!important}}
      `}</style>

      {/* Breaking news ticker */}
      <div style={{ background:p, color:'#fff', overflow:'hidden', height:32, display:'flex', alignItems:'center' }}>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', padding:'0 16px', background:'rgba(0,0,0,0.25)', height:'100%', display:'flex', alignItems:'center', flexShrink:0 }}>LIVE</div>
        <div style={{ overflow:'hidden', flex:1 }}>
          <div className="breaking-tick" style={{ display:'flex', gap:40, whiteSpace:'nowrap' }}>
            {[...articles.slice(0,6), ...articles.slice(0,6)].map((a: any, i: number) => (
              <span key={i} style={{ fontFamily:'Inter,sans-serif', fontSize:12, padding:'0 24px' }}>
                ▸ {a?.title?.slice(0,70)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div style={{ borderBottom:`3px solid #111`, padding:'0 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ padding:'14px 0 10px', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:42, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1, color:'#111' }}>
                {siteName.includes('-')
                  ? <><span>{siteName.split('-')[0]}</span><span style={{color:p}}>-</span><span>{siteName.split('-')[1]}</span></>
                  : siteName}
              </div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#666', marginTop:4, letterSpacing:'.04em' }}>
                {domain} · {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </div>
            </div>
            <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, background:p, color:'#fff', padding:'3px 10px', borderRadius:2, fontWeight:700, letterSpacing:'.06em' }}>LIVE MARKET DATA</div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#444' }}>{articles.length} articles published today</div>
            </div>
          </div>
          {/* Nav */}
          <nav style={{ display:'flex', borderTop:'1px solid #e5e5e5', overflowX:'auto' }}>
            {SECTIONS.map(s => <a key={s} href="#" className="nav-link" style={{ padding:'10px 14px', display:'block' }}>{s}</a>)}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        {/* Hero + top stories */}
        <div className="wire-top" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:28, marginBottom:32, paddingBottom:32, borderBottom:'3px double #e5e5e5' }}>
          {/* Hero */}
          {hero && (
            <Link href={`/${routePrefix}/${siteSlug}/${hero.slug}`} className="wire-card">
              {hero.cover_image_url && (
                <img src={hero.cover_image_url} alt={hero.title} style={{ width:'100%', height:340, objectFit:'cover', marginBottom:16 }} />
              )}
              <div className="wire-cat">{hero.category || 'Analysis'}</div>
              <div className="wire-headline" style={{ fontSize:32 }}>{hero.title}</div>
              <div className="wire-sub" style={{ fontSize:16, marginTop:10 }}>{hero.excerpt?.slice(0,180)}</div>
              <div className="wire-meta">{hero.author_name || 'Editorial Team'} · {timeAgo(hero.published_at)} · {hero.read_time_minutes || 4} min read</div>
            </Link>
          )}
          {/* Right column top stories */}
          <div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'#999', marginBottom:12, paddingBottom:6, borderBottom:'2px solid #111' }}>Top Stories</div>
            {top.map((a: any, i: number) => (
              <Link key={a.id} href={`/${routePrefix}/${siteSlug}/${a.slug}`} className="wire-card" style={{ display:'block', paddingBottom:12, marginBottom:12, borderBottom:'1px solid #e5e5e5' }}>
                <div className="wire-cat" style={{ fontSize:9 }}>{a.category}</div>
                <div className="wire-headline" style={{ fontSize:16 }}>{a.title}</div>
                <div className="wire-meta">{timeAgo(a.published_at)}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Article grid */}
        <div style={{ marginBottom:16, fontFamily:'Inter,sans-serif', fontSize:10, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'#999', paddingBottom:6, borderBottom:'2px solid #111' }}>Latest Intelligence</div>
        <div className="wire-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24 }}>
          {rest.map((a: any) => (
            <Link key={a.id} href={`/${routePrefix}/${siteSlug}/${a.slug}`} className="wire-card" style={{ display:'block' }}>
              {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} style={{ width:'100%', height:140, objectFit:'cover', marginBottom:10 }} />}
              <div className="wire-cat" style={{ fontSize:9 }}>{a.category}</div>
              <div className="wire-headline" style={{ fontSize:16, marginBottom:6 }}>{a.title}</div>
              <div className="wire-meta">{timeAgo(a.published_at)}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:'#111', color:'#fff', padding:'28px 24px', marginTop:40 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:900 }}>{siteName}</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#666' }}>© {new Date().getFullYear()} {domain} · RepHuby Intelligence Network</div>
        </div>
      </div>
    </div>
  )
}
