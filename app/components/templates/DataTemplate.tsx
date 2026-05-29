'use client'
import CookieBanner from '@/app/components/CookieBanner'
import Link from 'next/link'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) }

const COMMODITY_DATA = [
  { name:'Gold (XAU)', price:'2,341.50', unit:'USD/oz', chg:'+0.94%', up:true },
  { name:'Silver (XAG)', price:'29.84', unit:'USD/oz', chg:'+1.12%', up:true },
  { name:'Crude Oil (WTI)', price:'78.34', unit:'USD/bbl', chg:'-0.67%', up:false },
  { name:'Natural Gas', price:'2.18', unit:'USD/MMBtu', chg:'-1.24%', up:false },
  { name:'Copper', price:'4.52', unit:'USD/lb', chg:'+0.33%', up:true },
  { name:'Platinum', price:'1,012.40', unit:'USD/oz', chg:'+0.58%', up:true },
]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'})
}

export default function DataTemplate({ articles = [], site, routePrefix, siteSlug, primaryColor }: any) {
  const p = primaryColor || '#B08700'
  const isAurex = siteSlug === 'gold-markets-today'
  const siteName = site?.name || (isAurex ? 'AUREXHQ' : 'CERTIVADE')
  const domain = isAurex ? 'aurexhq.com' : 'certivade.com'
  const tagline = isAurex ? 'Precious Metals & Commodities Intelligence' : 'Trade Standards & Regulatory Intelligence'

  const hero = articles[0]
  const side = articles.slice(1, 7)
  const table = articles.slice(7, 20)

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#F8F6F0', color:'#2D2D2D', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit} img{max-width:100%;display:block}
        .data-row:hover{background:#F0EBE0}
        .data-hl{font-family:'DM Serif Display',Georgia,serif;color:#1A1A1A;line-height:1.3}
        .data-cat{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${p};margin-bottom:8px}
        .data-link:hover .data-hl{color:${p}}
        .up{color:#16A34A;font-weight:700}
        .dn{color:#DC2626;font-weight:700}
        @media(max-width:768px){.data-layout{grid-template-columns:1fr!important}.data-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Header */}
      <div style={{ background:'#1A1A1A', borderBottom:`4px solid ${p}` }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0' }}>
            <div>
              <div style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.04em', color:'#fff', fontFamily:'DM Serif Display,serif' }}>
                {siteName.slice(0,siteName.length-2)}<span style={{color:p}}>{siteName.slice(-2)}</span>
              </div>
              <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{domain} · {tagline}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'#888' }}>{new Date().toUTCString().slice(0,-7)} GMT</div>
              <div style={{ fontSize:11, color:p, fontWeight:600, marginTop:2 }}>● LIVE DATA</div>
            </div>
          </div>
          {/* Commodity ticker */}
          <div style={{ display:'flex', borderTop:'1px solid #333', overflowX:'auto', paddingBottom:2 }}>
            {COMMODITY_DATA.map((c,i) => (
              <div key={i} style={{ padding:'8px 20px', borderRight:'1px solid #333', flexShrink:0 }}>
                <div style={{ fontSize:10, color:'#888', marginBottom:2 }}>{c.name}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{c.price} <span style={{ fontSize:10 }}>{c.unit}</span></div>
                <div className={c.up?'up':'dn'} style={{ fontSize:10 }}>{c.chg}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E0D5', padding:'0 24px' }}>
        <div style={{ maxWidth:1300, margin:'0 auto', display:'flex', overflowX:'auto' }}>
          {['Overview','Prices','Analysis','Reports','Standards','Archive'].map(n => (
            <a key={n} href="#" style={{ fontWeight:600, fontSize:12, color:'#666', padding:'10px 16px', borderBottom:`2px solid transparent`, whiteSpace:'nowrap', letterSpacing:'.02em' }}>
              {n}
            </a>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1300, margin:'0 auto', padding:'24px' }}>
        {/* Main layout */}
        <div className="data-layout" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:28, marginBottom:28 }}>
          {/* Hero */}
          {hero && (
            <Link href={`/article/${siteSlug}/${hero.slug}`} className="data-link" style={{ display:'block', background:'#fff', border:'1px solid #E5E0D5', padding:24 }}>
              {hero.cover_image_url && <img src={hero.cover_image_url} alt={hero.title} style={{ width:'100%', height:280, objectFit:'cover', marginBottom:18, border:'1px solid #E5E0D5' }} />}
              <div className="data-cat">{hero.category}</div>
              <div className="data-hl" style={{ fontSize:28, marginBottom:12 }}>{hero.title}</div>
              <div style={{ fontSize:15, color:'#555', lineHeight:1.65 }}>{hero.excerpt?.slice(0,250)}</div>
              <div style={{ marginTop:14, fontSize:11, color:'#888', borderTop:'1px solid #E5E0D5', paddingTop:12 }}>
                {hero.author_name} · {fmtDate(hero.published_at)} · {hero.read_time_minutes||4} min
              </div>
            </Link>
          )}
          {/* Sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#888', padding:'10px 14px', background:'#fff', border:'1px solid #E5E0D5', borderBottom:'2px solid '+p }}>
              Latest Reports
            </div>
            {side.map((a: any) => (
              <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="data-link data-row" style={{ display:'flex', gap:12, padding:'12px 14px', background:'#fff', border:'1px solid #E5E0D5', borderTop:'none' }}>
                {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} style={{ width:60, height:44, objectFit:'cover', flexShrink:0, border:'1px solid #E5E0D5' }} />}
                <div>
                  <div className="data-cat" style={{ fontSize:9, marginBottom:3 }}>{a.category}</div>
                  <div className="data-hl" style={{ fontSize:13, marginBottom:3 }}>{a.title}</div>
                  <div style={{ fontSize:10, color:'#888' }}>{timeAgo(a.published_at)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Article table */}
        <div style={{ background:'#fff', border:'1px solid #E5E0D5' }}>
          <div style={{ padding:'10px 16px', borderBottom:'2px solid '+p, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#444' }}>Intelligence Archive</span>
            <span style={{ fontSize:10, color:'#888' }}>{articles.length} reports</span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F8F6F0', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#888' }}>
                {['Title','Category','Author','Published','Read'].map(h => (
                  <th key={h} style={{ padding:'8px 14px', textAlign:'left', borderBottom:'1px solid #E5E0D5', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map((a: any, i: number) => (
                <tr key={a.id} className="data-row" style={{ borderBottom:'1px solid #E5E0D5', fontSize:13 }}>
                  <td style={{ padding:'10px 14px', maxWidth:360 }}>
                    <Link href={`/article/${siteSlug}/${a.slug}`} style={{ fontWeight:600, color:'#1A1A1A' }}>{a.title}</Link>
                  </td>
                  <td style={{ padding:'10px 14px', whiteSpace:'nowrap' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:p, background:p+'15', padding:'2px 8px', borderRadius:2 }}>{a.category}</span>
                  </td>
                  <td style={{ padding:'10px 14px', color:'#666', fontSize:12, whiteSpace:'nowrap' }}>{a.author_name}</td>
                  <td style={{ padding:'10px 14px', color:'#888', fontSize:11, whiteSpace:'nowrap' }}>{fmtDate(a.published_at)}</td>
                  <td style={{ padding:'10px 14px', color:'#888', fontSize:11 }}>{a.read_time_minutes||4}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer style={{ background:'#1A1A1A', padding:'20px 24px', marginTop:30, fontFamily:'Inter,sans-serif', fontSize:11, color:'#555', textAlign:'center' }}>
        {siteName} · {domain} · © {new Date().getFullYear()} Financial Intelligence Ltd
      </footer>
    </div>

      {/* Legal footer */}
      <footer style={{ background:'#1a1a1a', color:'#666', padding:'20px 24px', marginTop:32, textAlign:'center', fontSize:12 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <span>© 2025 {site?.name || 'AurexHQ'} · All content for informational purposes only · Not financial advice</span>
          <div style={{ display:'flex', gap:16 }}>
            {[['Privacy','/legal/privacy'],['Terms','/legal/terms'],['Cookies','/legal/cookies']].map(([l,h])=>(
              <a key={l} href={h} style={{ color:'#888', textDecoration:'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
      <CookieBanner primaryColor={primaryColor || '#B08700'} />
    </div>
  )
}