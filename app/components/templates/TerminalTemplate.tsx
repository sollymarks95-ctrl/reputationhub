'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'


const IMGS = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  'https://images.unsplash.com/photo-1526628953301-3cd9e37dc0d7?w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80',
]
const img = (a: any, i: number) => a.cover_image_url || IMGS[i % IMGS.length]

const TICKERS = [
  { sym:'EUR/USD', price:'1.0842', chg:'+0.12%', up:true },
  { sym:'GBP/USD', price:'1.2718', chg:'-0.08%', up:false },
  { sym:'XAU/USD', price:'2,341.5', chg:'+0.94%', up:true },
  { sym:'BTC/USD', price:'67,420', chg:'+2.31%', up:true },
  { sym:'S&P 500', price:'5,287.6', chg:'+0.42%', up:true },
  { sym:'WTI OIL', price:'78.34', chg:'-0.67%', up:false },
  { sym:'USD/JPY', price:'157.42', chg:'+0.18%', up:true },
  { sym:'NASDAQ', price:'18,724', chg:'+0.61%', up:true },
]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })
}


function Newsletter({ siteId, siteName, accent }: any) {
  const [email, setEmail] = React.useState('')
  const [done, setDone] = React.useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try { await fetch('/api/newsletter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, siteId, siteName }) }) } catch {}
    setDone(true)
  }
  return done
    ? <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12, color:accent, padding:'10px 14px', border:`1px solid ${accent}`, borderRadius:2 }}>✓ SUBSCRIBED — DAILY BRIEFING ACTIVE</div>
    : <form onSubmit={submit} style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" required
          style={{ flex:1, padding:'9px 14px', background:'#1C2333', border:'1px solid #30363D', color:'#C9D1D9', fontFamily:'IBM Plex Mono,monospace', fontSize:12, outline:'none', minWidth:200 }} />
        <button type="submit" style={{ padding:'9px 18px', background:accent, color:'#000', border:'none', fontFamily:'IBM Plex Mono,monospace', fontWeight:700, fontSize:12, cursor:'pointer' }}>SUBSCRIBE</button>
      </form>
}

export default function TerminalTemplate({ articles = [], site, routePrefix, siteSlug, primaryColor }: any) {
  const [tick, setTick] = useState(0)
  const p = primaryColor || site?.primary_color || '#00C805'
  const isFinvexx = siteSlug === 'finance-terminal'
  const isSignalix = siteSlug === 'market-radar'
  const accent = isFinvexx ? '#00C805' : isSignalix ? '#F59E0B' : '#0EA5E9'
  const siteName = site?.name || 'FINVEXX'
  const domain = isFinvexx ? 'finvexx.com' : isSignalix ? 'signalix.com' : 'invexhub.com'

  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 3000); return () => clearInterval(t) }, [])

  const hero = articles[0]
  const cols = [articles.slice(1,6), articles.slice(6,11), articles.slice(11,16)]

  return (
    <div style={{ fontFamily:"'IBM Plex Mono','Courier New',monospace", background:'#0A0E17', color:'#C9D1D9', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        .term-row:hover{background:rgba(255,255,255,0.04)}
        .term-price-up{color:#00C805}
        .term-price-dn{color:#FF4B4B}
        .blink{animation:blink 1.2s step-end infinite}
        @keyframes blink{50%{opacity:0}}
        .ticker-scroll{animation:tscroll 35s linear infinite}
        @keyframes tscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @media(max-width:768px){.term-cols{grid-template-columns:1fr!important}}
      `}</style>

      {/* Ticker bar */}
      <div style={{ background:'#0D1117', borderBottom:`1px solid ${accent}30`, overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, fontWeight:700, color:accent, padding:'0 14px', borderRight:`1px solid ${accent}30`, flexShrink:0, height:'100%', display:'flex', alignItems:'center', letterSpacing:'.06em' }}>
          {domain.toUpperCase().split('.')[0]} <span className="blink" style={{ marginLeft:4 }}>▮</span>
        </div>
        <div style={{ overflow:'hidden', flex:1 }}>
          <div className="ticker-scroll" style={{ display:'flex', gap:0, whiteSpace:'nowrap' }}>
            {[...TICKERS, ...TICKERS].map((t, i) => (
              <span key={i} style={{ padding:'0 20px', borderRight:`1px solid #1C2333`, fontSize:11, display:'inline-flex', gap:10, alignItems:'center' }}>
                <span style={{ color:'#8B949E' }}>{t.sym}</span>
                <span style={{ color:t.up?'#00C805':'#FF4B4B', fontWeight:700 }}>{t.price}</span>
                <span style={{ color:t.up?'#00C805':'#FF4B4B', fontSize:10 }}>{t.chg}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ background:'#0D1117', borderBottom:`1px solid #1C2333`, padding:'12px 24px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:28, fontWeight:700, letterSpacing:'-0.02em' }}>
              <span style={{ color:'#C9D1D9' }}>{siteName.slice(0,-2)}</span>
              <span style={{ color:accent }}>{siteName.slice(-2)}</span>
            </div>
            <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10, color:'#444D56', borderLeft:`1px solid #1C2333`, paddingLeft:16, lineHeight:1.5 }}>
              <div>{domain}</div>
              <div style={{ color:accent }}>{new Date().toISOString().slice(0,19).replace('T',' ')} UTC</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {['LIVE','MARKETS','ANALYSIS','SIGNALS','DATA'].map(tab => (
              <div key={tab} style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10, fontWeight:700, padding:'5px 12px', border:`1px solid #1C2333`, color:'#666', letterSpacing:'.06em', cursor:'pointer' }}>{tab}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'20px 24px' }}>
        {/* Price board */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:1, marginBottom:20, background:'#1C2333' }}>
          {TICKERS.map((t, i) => (
            <div key={i} style={{ background:'#0A0E17', padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:9, color:'#444D56', marginBottom:3, letterSpacing:'.08em' }}>{t.sym}</div>
              <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:14, fontWeight:700, color:t.up?'#00C805':'#FF4B4B' }}>{t.price}</div>
              <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10, color:t.up?'#00C805':'#FF4B4B' }}>{t.chg}</div>
            </div>
          ))}
        </div>

        {/* Hero + columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr', gap:1, background:'#1C2333' }}>
          {/* Hero */}
          {hero && (
            <Link href={`/article/${siteSlug}/${hero.slug}`} style={{ display:'block', background:'#0D1117', padding:20 }}>
              <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:9, fontWeight:700, color:accent, letterSpacing:'.1em', marginBottom:8, textTransform:'uppercase' }}>{hero.category} · FEATURED</div>
              {hero.cover_image_url && <img src={img(hero,0)} alt={hero.title} style={{ width:'100%', height:200, objectFit:'cover', marginBottom:14, border:`1px solid #1C2333` }} />}
              <div style={{ fontFamily:'IBM Plex Sans,sans-serif', fontSize:20, fontWeight:700, color:'#F0F6FC', lineHeight:1.3, marginBottom:10 }}>{hero.title}</div>
              <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12, color:'#8B949E', lineHeight:1.6 }}>{hero.excerpt?.slice(0,200)}</div>
              <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10, color:'#444D56', marginTop:10 }}>{hero.author_name} · {timeAgo(hero.published_at)}</div>
            </Link>
          )}
          {/* 3 columns */}
          {cols.map((col, ci) => (
            <div key={ci} style={{ background:'#0D1117' }}>
              <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:9, fontWeight:700, color:'#444D56', letterSpacing:'.1em', padding:'10px 16px', borderBottom:'1px solid #1C2333' }}>
                {ci===0?'LATEST':ci===1?'ANALYSIS':'SIGNALS'}
              </div>
              {col.map((a: any) => (
                <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="term-row" style={{ display:'block', padding:'12px 16px', borderBottom:'1px solid #0D1117' }}>
                  <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:9, color:accent, marginBottom:4, letterSpacing:'.06em' }}>{a.category?.toUpperCase()}</div>
                  <div style={{ fontFamily:'IBM Plex Sans,sans-serif', fontSize:13, fontWeight:600, color:'#C9D1D9', lineHeight:1.4, marginBottom:4 }}>{a.title}</div>
                  <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10, color:'#444D56' }}>{timeAgo(a.published_at)}</div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>


        {/* Newsletter */}
        <div style={{ background:'#0D1117', border:`1px solid ${accent}30`, padding:'24px', marginTop:24 }}>
          <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:13, fontWeight:700, color:accent, marginBottom:6, letterSpacing:'.06em' }}>▸ SUBSCRIBE TO DAILY INTELLIGENCE BRIEFING</div>
          <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'#8B949E', marginBottom:14 }}>Market signals, analysis and data — delivered 07:00 UTC every trading day</div>
          <Newsletter siteId={site?.id} siteName={siteName} accent={accent} />
        </div>

      {/* Footer */}
      <div style={{ background:'#0D1117', borderTop:'1px solid #1C2333', padding:'20px 24px', marginTop:30, fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'#444D56', textAlign:'center' }}>
        {domain.toUpperCase()} · PROFESSIONAL FINANCIAL INTELLIGENCE · © {new Date().getFullYear()} REPHUBY INTELLIGENCE NETWORK
      </div>
    </div>
  )
}
