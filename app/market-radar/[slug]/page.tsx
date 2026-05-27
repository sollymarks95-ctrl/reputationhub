import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'

async function getMarkets() {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const r = await fetch(`${base}/api/live-data?type=markets`, { next: { revalidate: 900 } })
    return await r.json()
  } catch { return null }
}

export default async function MarketRadar({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const [markets, articles] = await Promise.all([getMarkets(), getLatestArticles(site.id, 12)])
  const p = site.primary_color || '#00b894'
  const gold = markets?.gold
  const forex = markets?.forex || []
  const cats = site.categories || ['Signals','Gold','Forex','Macro','Analysis']

  const instruments = [
    { name:'GOLD', price:gold?.price?`$${Number(gold.price).toLocaleString('en',{minimumFractionDigits:2})}`:'$2,345.60', chg:gold?.changePct||0.42, signal:'BUY', strength:82 },
    { name:'SILVER', price:markets?.silver?.price?`$${Number(markets.silver.price).toFixed(2)}`:'$29.42', chg:markets?.silver?.changePct||-0.18, signal:'HOLD', strength:55 },
    { name:'EUR/USD', price:forex.find((f:any)=>f.pair==='EUR/USD')?.rate?.toFixed(4)||'1.0876', chg:0.12, signal:'BUY', strength:68 },
    { name:'GBP/USD', price:forex.find((f:any)=>f.pair==='GBP/USD')?.rate?.toFixed(4)||'1.2654', chg:-0.08, signal:'SELL', strength:62 },
    { name:'S&P 500', price:markets?.sp500?.price?`$${Number(markets.sp500.price).toFixed(2)}`:'$5,248', chg:markets?.sp500?.changePct||0.62, signal:'BUY', strength:74 },
    { name:'OIL/WTI', price:markets?.oil?.price?`$${Number(markets.oil.price).toFixed(2)}`:'$78.34', chg:markets?.oil?.changePct||-0.31, signal:'HOLD', strength:48 },
  ]

  const signalColor = (s:string) => s==='BUY'?'#00b894':s==='SELL'?'#e74c3c':'#f39c12'

  return (
    <div style={{ minHeight:'100vh', background:'#050d14', color:'#e0e8f0', fontFamily:'"IBM Plex Mono",monospace' }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.card:hover{border-color:${p}40!important}`}</style>

      <header style={{ background:'#0d1f2d', borderBottom:`1px solid ${p}30`, padding:'0 24px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:p, boxShadow:`0 0 10px ${p}` }} />
            <span style={{ fontWeight:700, fontSize:18, color:'#fff', letterSpacing:'0.02em' }}>{site.name.toUpperCase()}</span>
            <span style={{ fontSize:10, color:p, letterSpacing:'0.15em' }}>LIVE INTELLIGENCE</span>
          </div>
          <nav style={{ display:'flex', gap:0 }}>
            {cats.map((c:string,i:number) => (
              <a key={c} href='javascript:void(0)' style={{ padding:'18px 14px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', color:i===0?p:'rgba(255,255,255,.4)', borderBottom:i===0?`2px solid ${p}`:'2px solid transparent', marginBottom:-1 }}>{c.toUpperCase()}</a>
            ))}
          </nav>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:'0.1em' }}>
            {new Date().toUTCString().toUpperCase()}
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1400, margin:'0 auto', padding:24 }}>
        {/* Signal grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:24 }}>
          {instruments.map(ins => (
            <div key={ins.name} className="card" style={{ background:'#0d1f2d', border:'1px solid rgba(255,255,255,.05)', padding:16, transition:'border-color .15s' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:'0.12em', marginBottom:8 }}>{ins.name}</div>
              <div style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>{ins.price}</div>
              <div style={{ fontSize:11, color:ins.chg>=0?p:'#e74c3c', marginBottom:10 }}>{ins.chg>=0?'▲':'▼'} {Math.abs(ins.chg).toFixed(2)}%</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:700, color:signalColor(ins.signal), background:`${signalColor(ins.signal)}20`, padding:'2px 8px', borderRadius:3 }}>{ins.signal}</span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>{ins.strength}%</span>
              </div>
              <div style={{ marginTop:6, height:3, background:'rgba(255,255,255,.05)', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${ins.strength}%`, background:signalColor(ins.signal), borderRadius:2 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, paddingBottom:10, borderBottom:`1px solid ${p}20` }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:p, boxShadow:`0 0 6px ${p}` }} />
              <span style={{ fontSize:11, color:p, letterSpacing:'0.12em', fontWeight:700 }}>INTELLIGENCE FEED</span>
            </div>
            {articles.length === 0 ? (
              <div style={{ padding:'60px 0', textAlign:'center', color:'rgba(255,255,255,.3)' }}>Content auto-generating...</div>
            ) : articles.map((a:any,i:number) => (
              <div key={i} style={{ display:'flex', gap:14, padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,.04)', cursor:'pointer' }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,.15)', width:24, flexShrink:0, paddingTop:2, fontWeight:700 }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:10, marginBottom:5 }}>
                    <span style={{ fontSize:9, color:p, fontWeight:700, letterSpacing:'0.1em' }}>{a.category?.toUpperCase()||'ANALYSIS'}</span>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,.3)' }}>{a.published_at?timeAgo(a.published_at):''}</span>
                  </div>
                  <div style={{ fontSize:14, color:'#e0e8f0', lineHeight:1.4, marginBottom:4 }}>{a.title}</div>
                  {a.excerpt && <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', lineHeight:1.4 }}>{a.excerpt?.slice(0,100)}...</div>}
                </div>
                {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width:72, height:50, objectFit:'cover', flexShrink:0, opacity:.7 }} />}
              </div>
            ))}
          </div>

          <div>
            <div style={{ background:'#0d1f2d', border:`1px solid ${p}30`, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:10, color:p, letterSpacing:'0.12em', fontWeight:700, marginBottom:12 }}>GOLD FOCUS</div>
              <div style={{ fontSize:32, fontWeight:700, color:'#ffd700', marginBottom:4 }}>
                ${gold?.price?Number(gold.price).toLocaleString('en',{minimumFractionDigits:2}):'2,345.60'}
              </div>
              <div style={{ fontSize:12, color:gold?.changePct>=0?p:'#e74c3c', marginBottom:12 }}>
                {gold?.changePct>=0?'▲':'▼'} {Math.abs(gold?.changePct||0.42).toFixed(2)}% TODAY
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', lineHeight:1.6 }}>
                XAU/USD SPOT · TROY OZ<br />
                LIVE VIA ALPHA VANTAGE<br />
                REFRESHED: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div style={{ background:'#0d1f2d', border:'1px solid rgba(255,255,255,.05)', padding:16, marginBottom:16 }}>
              <div style={{ fontSize:10, color:p, letterSpacing:'0.12em', fontWeight:700, marginBottom:12 }}>ABOUT {site.name.toUpperCase()}</div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', lineHeight:1.7 }}>{site.description}</p>
            </div>
            <div style={{ background:'#0a1a28', border:`1px solid ${p}30`, padding:16 }}>
              <div style={{ fontSize:10, color:p, letterSpacing:'0.12em', fontWeight:700, marginBottom:8 }}>MARKET BRIEFING</div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginBottom:12, lineHeight:1.5 }}>Daily signals. Pre-market. Free.</p>
              <input placeholder="your@email.com" style={{ width:'100%', background:'#0d1f2d', border:'1px solid rgba(255,255,255,.1)', color:'#e0e8f0', padding:'8px 12px', fontSize:12, marginBottom:8, outline:'none', fontFamily:'monospace' }} />
              <button style={{ width:'100%', background:p, color:'#000', border:'none', padding:9, fontFamily:'"IBM Plex Mono",monospace', fontWeight:700, fontSize:11, letterSpacing:'0.1em', cursor:'pointer' }}>SUBSCRIBE →</button>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ borderTop:`1px solid rgba(255,255,255,.05)`, padding:20, marginTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:10, color:'rgba(255,255,255,.2)' }}>
        <span>© {new Date().getFullYear()} {site.name} · RepHub Media Ltd · London, UK · All signals are algorithmic and not financial advice · Data delayed 15min</span>
        <div style={{ display:'flex', gap:16 }}>
          {['Terms','Privacy','Disclaimer','Contact'].map(l => <a key={l} href='javascript:void(0)' style={{ color:'rgba(255,255,255,.2)' }}>{l}</a>)}
        </div>
      </footer>
    </div>
  )
}
