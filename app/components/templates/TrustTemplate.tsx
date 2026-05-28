'use client'
import Link from 'next/link'

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)} min ago`
  if (s < 86400) return `${Math.floor(s/3600)} hours ago`
  return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'})
}

const STATS = [
  { label:'Verified Reviews', value:'284,000+', icon:'✅' },
  { label:'Brokers Profiled', value:'1,200+', icon:'🏦' },
  { label:'Avg Trust Score', value:'4.2/5', icon:'⭐' },
  { label:'Countries Covered', value:'63', icon:'🌍' },
]

export default function TrustTemplate({ articles = [], site, routePrefix, siteSlug }: any) {
  const GREEN = '#00B67A'; const DARK = '#191919'
  const siteName = site?.name || 'VERIVEX'

  const hero = articles[0]
  const cards = articles.slice(1, 13)

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#fff', color:'#191919', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit} img{max-width:100%;display:block}
        .trust-card{border:1px solid #E8E8E8;border-radius:4px;padding:20px;transition:all .2s;background:#fff}
        .trust-card:hover{border-color:${GREEN};box-shadow:0 2px 12px rgba(0,182,122,0.1)}
        .star{color:${GREEN};font-size:16px}
        .trust-tag{display:inline-block;background:${GREEN}15;color:${GREEN};font-size:10px;font-weight:700;padding:2px 8px;border-radius:2px;letter-spacing:.06em;text-transform:uppercase}
        .trust-nav a{font-size:13px;font-weight:600;color:#666;padding:12px 16px;display:block;white-space:nowrap}
        .trust-nav a:hover{color:${GREEN}}
        @media(max-width:768px){.trust-grid{grid-template-columns:repeat(2,1fr)!important}.trust-hero{grid-template-columns:1fr!important}.trust-stats{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:'1px solid #E8E8E8', position:'sticky', top:0, background:'#fff', zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.04em' }}>
              <span style={{ color:DARK }}>VERI</span><span style={{ color:GREEN }}>VEX</span>
            </div>
            <div style={{ fontSize:11, color:'#888', borderLeft:'1px solid #E8E8E8', paddingLeft:12 }}>verivex.co · Verified Financial Reviews</div>
          </div>
          <div style={{ display:'flex', gap:24, alignItems:'center' }}>
            <div style={{ display:'flex', gap:2 }}>{'★★★★★'.split('').map((s,i) => <span key={i} className="star">{s}</span>)}</div>
            <div style={{ fontSize:12, color:'#888' }}>Trusted by 50,000+ traders</div>
          </div>
        </div>
        <nav className="trust-nav" style={{ borderTop:'1px solid #E8E8E8', background:'#FAFAFA' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', overflowX:'auto' }}>
            {['All Reviews','Forex Brokers','Crypto Exchanges','Prop Firms','Regulated Brokers','Latest Reports'].map(n => (
              <a key={n} href="#">{n}</a>
            ))}
          </div>
        </nav>
      </div>

      {/* Trust stats */}
      <div style={{ background:'#F8FBF9', borderBottom:'1px solid #E8E8E8', padding:'20px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div className="trust-stats" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign:'center', padding:'14px', background:'#fff', border:'1px solid #E8E8E8', borderRadius:4 }}>
                <div style={{ fontSize:28 }}>{s.icon}</div>
                <div style={{ fontSize:24, fontWeight:800, color:GREEN, marginTop:4 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        {/* Hero */}
        {hero && (
          <Link href={`/article/${siteSlug}/${hero.slug}`} style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:32, marginBottom:36, paddingBottom:36, borderBottom:'1px solid #E8E8E8' }} className="trust-hero">
            <div>
              <div className="trust-tag" style={{ marginBottom:12 }}>{hero.category}</div>
              <div style={{ fontSize:34, fontWeight:800, lineHeight:1.2, color:DARK, marginBottom:14, letterSpacing:'-0.02em' }}>{hero.title}</div>
              <div style={{ fontSize:16, color:'#555', lineHeight:1.65 }}>{hero.excerpt?.slice(0,200)}</div>
              <div style={{ marginTop:14, display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ display:'flex', gap:2 }}>{'★★★★☆'.split('').map((s,i) => <span key={i} className="star" style={{fontSize:14}}>{s}</span>)}</div>
                <span style={{ fontSize:12, fontWeight:700, color:GREEN }}>4.1/5</span>
                <span style={{ fontSize:12, color:'#888' }}>· {timeAgo(hero.published_at)}</span>
              </div>
            </div>
            {hero.cover_image_url && <img src={hero.cover_image_url} alt={hero.title} style={{ width:'100%', height:240, objectFit:'cover', borderRadius:4, border:'1px solid #E8E8E8' }} />}
          </Link>
        )}

        {/* Grid */}
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', color:'#888', marginBottom:16 }}>Latest Reviews & Analysis</div>
        <div className="trust-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {cards.map((a: any) => (
            <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="trust-card" style={{ display:'block' }}>
              <div className="trust-tag" style={{ marginBottom:10 }}>{a.category}</div>
              <div style={{ fontSize:16, fontWeight:700, color:DARK, lineHeight:1.3, marginBottom:10 }}>{a.title}</div>
              <div style={{ display:'flex', gap:2, marginBottom:8 }}>
                {'★★★★★'.split('').map((s,i) => <span key={i} style={{ color:GREEN, fontSize:12 }}>{s}</span>)}
              </div>
              <div style={{ fontSize:12, color:'#888' }}>{timeAgo(a.published_at)} · {a.read_time_minutes||3} min read</div>
            </Link>
          ))}
        </div>
      </div>

      <footer style={{ background:DARK, color:'#555', padding:'20px', marginTop:40, fontFamily:'Inter,sans-serif', fontSize:11, textAlign:'center' }}>
        VERIVEX · verivex.co · © {new Date().getFullYear()} Financial Intelligence Network
      </footer>
    </div>
  )
}
