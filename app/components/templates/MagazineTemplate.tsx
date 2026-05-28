'use client'
import Link from 'next/link'

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)} min ago`
  if (s < 86400) return `${Math.floor(s/3600)} hours ago`
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'long' })
}

export default function MagazineTemplate({ articles = [], site, routePrefix, siteSlug, primaryColor }: any) {
  const p = primaryColor || '#6741D9'
  const isExec = siteSlug === 'executive-network'
  const siteName = site?.name || (isExec ? 'EXECVEX' : 'BIZPLEZX')
  const domain = isExec ? 'execvex.com' : 'bizplezx.com'
  const tagline = isExec ? 'Executive Intelligence & Leadership' : 'Business Strategy & Innovation'

  const hero = articles[0]
  const featured = articles.slice(1, 4)
  const list = articles.slice(4, 12)

  return (
    <div style={{ fontFamily:"'Libre Baskerville',Georgia,serif", background:'#FAFAF8', color:'#1A1A1A', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Libre+Franklin:wght@300;400;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit} img{max-width:100%;display:block}
        .mag-hl{font-family:'Playfair Display',Georgia,serif;font-weight:700;line-height:1.2;color:#1A1A1A}
        .mag-sub{font-family:'Libre Baskerville',Georgia,serif;color:#444;line-height:1.7}
        .mag-meta{font-family:'Libre Franklin',sans-serif;font-size:11px;color:#888;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
        .mag-cat{font-family:'Libre Franklin',sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${p}}
        .mag-card:hover .mag-hl{color:${p}}
        .mag-nav a{font-family:'Libre Franklin',sans-serif;font-size:12px;font-weight:700;color:#1A1A1A;letter-spacing:.04em;text-transform:uppercase;padding:0 16px;border-right:1px solid #ddd}
        .mag-nav a:last-child{border-right:none}
        .mag-nav a:hover{color:${p}}
        @media(max-width:768px){.mag-hero{grid-template-columns:1fr!important}.mag-3col{grid-template-columns:1fr!important}.mag-2col{grid-template-columns:1fr!important}}
      `}</style>

      {/* Top bar */}
      <div style={{ background:p, color:'#fff', padding:'6px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'Libre Franklin,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>
          {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </div>
        <div style={{ fontFamily:'Libre Franklin,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>
          {domain} · Premium Business Intelligence
        </div>
      </div>

      {/* Masthead */}
      <div style={{ borderBottom:'3px solid #1A1A1A', padding:'20px 24px 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', padding:'16px 0 20px', borderBottom:'1px solid #ddd', marginBottom:12 }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:56, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1, color:'#1A1A1A' }}>
              {siteName.slice(0,-1)}<span style={{ color:p }}>{siteName.slice(-1)}</span>
            </div>
            <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:13, color:'#888', marginTop:6, fontStyle:'italic' }}>{tagline}</div>
          </div>
          <nav className="mag-nav" style={{ display:'flex', justifyContent:'center', padding:'8px 0' }}>
            {['Strategy','Leadership','Innovation','Finance','Markets','Opinion','Interviews'].map(n => (
              <a key={n} href="#">{n}</a>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
        {/* Hero */}
        {hero && (
          <Link href={`/${routePrefix}/${siteSlug}/${hero.slug}`} className="mag-card" style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:40, marginBottom:48, paddingBottom:40, borderBottom:'1px solid #ddd' }} >
            <div>
              <div className="mag-cat" style={{ marginBottom:14 }}>{hero.category}</div>
              <div className="mag-hl" style={{ fontSize:40, marginBottom:16 }}>{hero.title}</div>
              <div className="mag-sub" style={{ fontSize:16 }}>{hero.excerpt?.slice(0,220)}</div>
              <div className="mag-meta" style={{ marginTop:16 }}>By {hero.author_name || 'Editorial Team'} · {timeAgo(hero.published_at)} · {hero.read_time_minutes || 5} min read</div>
            </div>
            <div>
              {hero.cover_image_url && <img src={hero.cover_image_url} alt={hero.title} style={{ width:'100%', height:320, objectFit:'cover' }} />}
            </div>
          </Link>
        )}

        {/* 3 featured */}
        <div className="mag-3col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, marginBottom:48, paddingBottom:40, borderBottom:'1px solid #ddd' }}>
          {featured.map((a: any) => (
            <Link key={a.id} href={`/${routePrefix}/${siteSlug}/${a.slug}`} className="mag-card" style={{ display:'block' }}>
              {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} style={{ width:'100%', height:200, objectFit:'cover', marginBottom:14 }} />}
              <div className="mag-cat" style={{ marginBottom:8 }}>{a.category}</div>
              <div className="mag-hl" style={{ fontSize:20, marginBottom:10 }}>{a.title}</div>
              <div className="mag-sub" style={{ fontSize:14 }}>{a.excerpt?.slice(0,120)}</div>
              <div className="mag-meta" style={{ marginTop:10 }}>{timeAgo(a.published_at)}</div>
            </Link>
          ))}
        </div>

        {/* List */}
        <div style={{ fontFamily:'Libre Franklin,sans-serif', fontSize:10, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', color:'#888', marginBottom:20, paddingBottom:8, borderBottom:'2px solid #1A1A1A' }}>Latest Analysis</div>
        <div className="mag-2col" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:24 }}>
          {list.map((a: any) => (
            <Link key={a.id} href={`/${routePrefix}/${siteSlug}/${a.slug}`} className="mag-card" style={{ display:'flex', gap:16, paddingBottom:20, borderBottom:'1px solid #ddd' }}>
              {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} style={{ width:100, height:70, objectFit:'cover', flexShrink:0 }} />}
              <div>
                <div className="mag-cat" style={{ marginBottom:5, fontSize:9 }}>{a.category}</div>
                <div className="mag-hl" style={{ fontSize:15, marginBottom:5 }}>{a.title}</div>
                <div className="mag-meta">{timeAgo(a.published_at)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <footer style={{ background:'#1A1A1A', color:'#888', padding:'24px', marginTop:40, fontFamily:'Libre Franklin,sans-serif', fontSize:11, textAlign:'center', letterSpacing:'.04em' }}>
        {siteName} · {domain} · © {new Date().getFullYear()} RepHuby Intelligence Network
      </footer>
    </div>
  )
}
