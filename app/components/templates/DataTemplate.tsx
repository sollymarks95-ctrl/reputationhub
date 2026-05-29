'use client'
import CookieBanner from '@/app/components/CookieBanner'
import Link from 'next/link'
import { useState } from 'react'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) }

const COMMODITY_DATA = [
  { name:'Gold (XAU)', price:'2,341.50', unit:'oz', chg:'+0.94%', up:true },
  { name:'Silver (XAG)', price:'29.84', unit:'oz', chg:'+1.12%', up:true },
  { name:'Crude Oil', price:'78.34', unit:'bbl', chg:'-0.67%', up:false },
  { name:'Nat. Gas', price:'2.18', unit:'MMBtu', chg:'-1.24%', up:false },
  { name:'Copper', price:'4.52', unit:'lb', chg:'+0.33%', up:true },
  { name:'Platinum', price:'1,012.40', unit:'oz', chg:'+0.58%', up:true },
  { name:'Palladium', price:'985.20', unit:'oz', chg:'+0.21%', up:true },
]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'})
}

const NAV_TABS = ['Overview','Prices','Analysis','Reports','Standards','Archive']

export default function DataTemplate({ articles = [], site, routePrefix, siteSlug, primaryColor }: any) {
  const [activeTab, setActiveTab] = useState('Overview')
  const p = primaryColor || '#B08700'
  const isAurex = siteSlug === 'gold-markets-today'
  const siteName = site?.name || (isAurex ? 'AUREXHQ' : 'CERTIVADE')
  const domain = isAurex ? 'aurexhq.com' : 'certivade.com'
  const tagline = isAurex ? 'Precious Metals & Commodities Intelligence' : 'Trade Standards & Regulatory Intelligence'

  const hero = articles[0]
  const side = articles.slice(1, 7)
  const table = articles.slice(7, 20)

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#F8F6F0', color:'#2D2D2D', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit} img{max-width:100%;display:block}
        .data-row:hover{background:#F0EBE0!important}
        .data-hl{font-family:'DM Serif Display',Georgia,serif;color:#1A1A1A;line-height:1.3}
        .data-cat{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${p};margin-bottom:8px}
        .data-link:hover .data-hl{color:${p}!important}
        .up{color:#16A34A!important;font-weight:700}
        .dn{color:#DC2626!important;font-weight:700}
        .nav-tab{cursor:pointer;font-weight:600;font-size:12px;color:#666;padding:12px 18px;border-bottom:2px solid transparent;white-space:nowrap;letter-spacing:.03em;transition:color .15s,border-color .15s;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit}
        .nav-tab:hover{color:#1A1A1A;border-bottom-color:#999}
        .nav-tab.active{color:${p};border-bottom-color:${p};font-weight:700}
        .ticker-scroll{animation:ticker 30s linear infinite}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @media(max-width:768px){.data-layout{grid-template-columns:1fr!important}.data-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Header */}
      <div style={{ background:'#1A1A1A', borderBottom:`4px solid ${p}` }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              {/* Logo text */}
              <div>
                <div style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.04em', color:'#fff', fontFamily:'DM Serif Display,serif' }}>
                  {siteName.slice(0,siteName.length-2)}<span style={{color:p}}>{siteName.slice(-2)}</span>
                </div>
                <div style={{ fontSize:10, color:'#888', marginTop:2, letterSpacing:'.04em', textTransform:'uppercase' }}>{tagline}</div>
              </div>
            </div>
            <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
              <div style={{ fontSize:10, color:'#888', letterSpacing:'.04em' }}>{new Date().toUTCString().slice(0,-7)} GMT</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:p, display:'inline-block' }}/>
                <span style={{ fontSize:10, color:p, fontWeight:700, letterSpacing:'.06em' }}>LIVE MARKETS</span>
              </div>
            </div>
          </div>

          {/* Commodity ticker */}
          <div style={{ borderTop:'1px solid #2D2D2D', overflow:'hidden', position:'relative' }}>
            <div style={{ display:'flex', padding:'0' }}>
              {COMMODITY_DATA.map((c,i) => (
                <div key={i} style={{ padding:'8px 24px', borderRight:'1px solid #2D2D2D', flexShrink:0, minWidth:140 }}>
                  <div style={{ fontSize:9, color:'#888', marginBottom:2, textTransform:'uppercase', letterSpacing:'.06em' }}>{c.name}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{c.price} <span style={{ fontSize:9, color:'#aaa' }}>USD/{c.unit}</span></div>
                  <div className={c.up?'up':'dn'} style={{ fontSize:10 }}>{c.chg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E0D5', position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', gap:0 }}>
          {NAV_TABS.map(n => (
            <button key={n} className={`nav-tab${activeTab===n?' active':''}`} onClick={() => setActiveTab(n)}>
              {n}
            </button>
          ))}
          <div style={{ flex:1 }}/>
          <div style={{ fontSize:11, color:'#888', borderLeft:'1px solid #E5E0D5', paddingLeft:16, marginLeft:8 }}>
            {articles.length} articles
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1 }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 24px' }}>
          {/* Main grid */}
          <div className="data-layout" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24, marginBottom:28 }}>
            {/* Hero article */}
            <div>
              {hero && (
                <Link href={`/article/${siteSlug}/${hero.slug}`} className="data-link" style={{ display:'block', background:'#fff', border:'1px solid #E5E0D5', marginBottom:24 }}>
                  {hero.cover_image_url && (
                    <img src={hero.cover_image_url} alt={hero.title} style={{ width:'100%', height:300, objectFit:'cover' }} />
                  )}
                  <div style={{ padding:24 }}>
                    <div className="data-cat">{hero.category}</div>
                    <h1 className="data-hl" style={{ fontSize:26, marginBottom:12 }}>{hero.title}</h1>
                    <p style={{ fontSize:14, color:'#666', lineHeight:1.7, marginBottom:14 }}>{hero.excerpt?.slice(0,300)}</p>
                    <div style={{ fontSize:11, color:'#888', borderTop:'1px solid #E5E0D5', paddingTop:12, display:'flex', justifyContent:'space-between' }}>
                      <span>{hero.author_name}</span>
                      <span>{fmtDate(hero.published_at)} · {hero.read_time_minutes||4} min read</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Secondary articles grid */}
              <div className="data-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {side.slice(0,4).map((a: any) => (
                  <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="data-link" style={{ display:'block', background:'#fff', border:'1px solid #E5E0D5' }}>
                    {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} style={{ width:'100%', height:160, objectFit:'cover' }}/>}
                    <div style={{ padding:16 }}>
                      <div className="data-cat" style={{ marginBottom:6 }}>{a.category}</div>
                      <h3 className="data-hl" style={{ fontSize:15, marginBottom:8 }}>{a.title}</h3>
                      <div style={{ fontSize:11, color:'#888' }}>{timeAgo(a.published_at)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {/* Live prices card */}
              <div style={{ background:'#1A1A1A', color:'#fff', padding:20, marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:p, marginBottom:14 }}>Live Prices</div>
                {COMMODITY_DATA.slice(0,5).map((c,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #2D2D2D' }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#fff' }}>{c.name}</div>
                      <div style={{ fontSize:10, color:'#888' }}>USD/{c.unit}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{c.price}</div>
                      <div className={c.up?'up':'dn'} style={{ fontSize:11 }}>{c.chg}</div>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize:10, color:'#555', marginTop:12, textAlign:'center' }}>Indicative prices · Not financial advice</div>
              </div>

              {/* Side articles */}
              {side.slice(4,7).map((a: any) => (
                <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="data-link" style={{ display:'flex', gap:12, padding:'14px 0', borderBottom:'1px solid #E5E0D5', alignItems:'flex-start' }}>
                  {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width:80, height:60, objectFit:'cover', flexShrink:0 }}/>}
                  <div>
                    <div className="data-cat">{a.category}</div>
                    <div className="data-hl" style={{ fontSize:13, marginBottom:4 }}>{a.title}</div>
                    <div style={{ fontSize:10, color:'#888' }}>{timeAgo(a.published_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Article table */}
          {table.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #E5E0D5' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #E5E0D5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#1A1A1A' }}>Latest Articles</div>
                <div style={{ fontSize:11, color:'#888' }}>{table.length} articles</div>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #E5E0D5' }}>
                    {['Headline','Category','Author','Published','Read'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#888', letterSpacing:'.06em', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.map((a: any, i: number) => (
                    <tr key={a.id} className="data-row" style={{ borderBottom:'1px solid #EEE8DD', background: i%2===0?'#fff':'#FAFAF8' }}>
                      <td style={{ padding:'12px 16px', maxWidth:360 }}>
                        <Link href={`/article/${siteSlug}/${a.slug}`} className="data-link">
                          <div className="data-hl" style={{ fontSize:13 }}>{a.title}</div>
                        </Link>
                      </td>
                      <td style={{ padding:'12px 16px' }}><span className="data-cat" style={{ marginBottom:0 }}>{a.category}</span></td>
                      <td style={{ padding:'12px 16px', fontSize:11, color:'#666', whiteSpace:'nowrap' }}>{a.author_name}</td>
                      <td style={{ padding:'12px 16px', fontSize:11, color:'#888', whiteSpace:'nowrap' }}>{timeAgo(a.published_at)}</td>
                      <td style={{ padding:'12px 16px', color:'#888', fontSize:11 }}>{a.read_time_minutes||4}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background:'#1a1a1a', color:'#555', padding:'20px 24px', marginTop:0, fontSize:12, textAlign:'center' }}>
        <div style={{ maxWidth:1300, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <span style={{ color:'#444' }}>{siteName} · {domain} · © {new Date().getFullYear()} · Not financial advice · All prices indicative</span>
          <div style={{ display:'flex', gap:20 }}>
            {[['Privacy','/legal/privacy'],['Terms','/legal/terms'],['Cookies','/legal/cookies']].map(([l,h])=>(
              <a key={l} href={h} style={{ color:'#555', transition:'color .15s' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
      <CookieBanner primaryColor={primaryColor || '#B08700'} />
    </div>
  )
}
