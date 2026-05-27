'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── MARKET SEED DATA ──────────────────────────────────────────────────────────
const INDICES = [
  { name:'S&P 500', price:5248.35, change:15.23, pct:0.29, flag:'🇺🇸', hi:5271.20, lo:5224.10 },
  { name:'Dow Jones', price:39127.80, change:-45.20, pct:-0.12, flag:'🇺🇸', hi:39240.10, lo:38980.50 },
  { name:'Nasdaq', price:16340.87, change:87.45, pct:0.54, flag:'🇺🇸', hi:16420.30, lo:16200.10 },
  { name:'DAX', price:18482.35, change:132.48, pct:0.72, flag:'🇩🇪', hi:18540.20, lo:18310.80 },
  { name:'FTSE 100', price:8205.47, change:-23.12, pct:-0.28, flag:'🇬🇧', hi:8245.30, lo:8180.20 },
  { name:'Nikkei 225', price:38890.32, change:245.67, pct:0.64, flag:'🇯🇵', hi:39050.00, lo:38620.50 },
  { name:'CAC 40', price:8087.45, change:43.21, pct:0.54, flag:'🇫🇷', hi:8120.30, lo:8040.10 },
  { name:'Hang Seng', price:18230.52, change:-124.30, pct:-0.68, flag:'🇭🇰', hi:18420.80, lo:18180.40 },
]
const COMMODITIES = [
  { name:'Gold', price:2387.40, change:12.80, pct:0.54, month:'Aug 26', flag:'🟡' },
  { name:'Silver', price:29.45, change:-0.32, pct:-1.07, month:'Jul 26', flag:'⚪' },
  { name:'Crude Oil WTI', price:78.92, change:0.45, pct:0.57, month:'Jul 26', flag:'🛢️' },
  { name:'Brent Oil', price:81.40, change:0.62, pct:0.77, month:'Aug 26', flag:'🛢️' },
  { name:'Natural Gas', price:2.84, change:-0.08, pct:-2.74, month:'Jul 26', flag:'🔥' },
  { name:'Copper', price:4.67, change:0.08, pct:1.74, month:'Jul 26', flag:'🔶' },
  { name:'US Wheat', price:626.60, change:-7.25, pct:-1.17, month:'Jul 26', flag:'🌾' },
  { name:'US Soybeans', price:1184.75, change:-2.30, pct:-0.19, month:'Jul 26', flag:'🫘' },
]
const CURRENCIES = [
  { pair:'EUR/USD', price:1.0892, change:-0.0023, pct:-0.21 },
  { pair:'GBP/USD', price:1.2735, change:0.0047, pct:0.37 },
  { pair:'USD/JPY', price:156.82, change:0.34, pct:0.22 },
  { pair:'USD/CHF', price:0.9012, change:-0.0018, pct:-0.20 },
  { pair:'AUD/USD', price:0.6623, change:0.0031, pct:0.47 },
  { pair:'USD/CAD', price:1.3645, change:-0.0024, pct:-0.18 },
  { pair:'NZD/USD', price:0.6124, change:0.0015, pct:0.25 },
  { pair:'USD/CNY', price:7.2450, change:0.0180, pct:0.25 },
]
const STOCKS = [
  { name:'Apple Inc.', symbol:'AAPL', price:189.84, change:2.34, pct:1.25, flag:'🇺🇸', cap:'2.97T' },
  { name:'Microsoft', symbol:'MSFT', price:420.53, change:-1.87, pct:-0.44, flag:'🇺🇸', cap:'3.12T' },
  { name:'NVIDIA Corp', symbol:'NVDA', price:887.65, change:23.45, pct:2.72, flag:'🇺🇸', cap:'2.19T' },
  { name:'Tesla Inc.', symbol:'TSLA', price:182.47, change:4.23, pct:2.37, flag:'🇺🇸', cap:'580B' },
  { name:'Exxon Mobil', symbol:'XOM', price:149.81, change:-5.11, pct:-3.30, flag:'🇺🇸', cap:'612B' },
  { name:'Amazon.com', symbol:'AMZN', price:185.32, change:-0.89, pct:-0.48, flag:'🇺🇸', cap:'1.96T' },
  { name:'Alphabet A', symbol:'GOOGL', price:171.45, change:1.23, pct:0.72, flag:'🇺🇸', cap:'2.14T' },
  { name:'Meta Platforms', symbol:'META', price:494.50, change:3.21, pct:0.65, flag:'🇺🇸', cap:'1.26T' },
]
const CALENDAR = [
  { time:'08:30', country:'🇺🇸', event:'Initial Jobless Claims', impact:'high', actual:'220K', forecast:'225K', prev:'218K' },
  { time:'10:00', country:'🇺🇸', event:'ISM Manufacturing PMI', impact:'high', actual:'', forecast:'49.8', prev:'49.2' },
  { time:'14:00', country:'🇪🇺', event:'ECB Interest Rate Decision', impact:'high', actual:'', forecast:'4.50%', prev:'4.50%' },
  { time:'15:30', country:'🇬🇧', event:'BoE Governor Speech', impact:'medium', actual:'', forecast:'', prev:'' },
  { time:'16:00', country:'🇺🇸', event:'Crude Oil Inventories', impact:'medium', actual:'', forecast:'-1.8M', prev:'-2.4M' },
  { time:'19:00', country:'🇺🇸', event:'FOMC Meeting Minutes', impact:'high', actual:'', forecast:'', prev:'' },
]

function liveUpdate<T extends { price: number; change: number; pct: number }>(prev: T[]): T[] {
  return prev.map(item => {
    const delta = (Math.random() - 0.49) * item.price * 0.0003
    const newPrice = Math.max(item.price + delta, 0.0001)
    const newChange = item.change + delta
    return { ...item, price: newPrice, change: newChange, pct: (newChange / newPrice) * 100 }
  })
}

function PriceBadge({ price, pct, dec = 2 }: { price: number; pct: number; dec?: number }) {
  const [flash, setFlash] = useState('')
  const prev = useRef(price)
  useEffect(() => {
    if (Math.abs(price - prev.current) > 0.00001) {
      setFlash(price > prev.current ? 'up' : 'dn')
      const t = setTimeout(() => setFlash(''), 700)
      prev.current = price; return () => clearTimeout(t)
    }
  }, [price])
  const up = pct >= 0
  return (
    <span style={{ color: up ? '#16a34a' : '#dc2626', fontWeight: 700,
      background: flash === 'up' ? '#dcfce7' : flash === 'dn' ? '#fee2e2' : 'transparent',
      padding:'1px 4px', borderRadius:2, transition:'background 0.7s' }}>
      {price.toFixed(dec)}
    </span>
  )
}

function NewsletterForm({ siteId, siteName, p }: { siteId?: string; siteName?: string; p: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [msg, setMsg] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) { setStatus('err'); setMsg('Please enter a valid email.'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, siteId, siteName }) })
      const data = await res.json()
      if (res.ok) { setStatus('ok'); setMsg('✅ Subscribed! Check your inbox.'); setEmail('') }
      else { setStatus('err'); setMsg(data.error || 'Please try again.') }
    } catch { setStatus('err'); setMsg('Connection error — please try again.') }
  }
  return (
    <form onSubmit={submit}>
      {status === 'ok' ? (
        <div style={{ background:'#dcfce7', color:'#16a34a', padding:'12px 14px', borderRadius:6, fontSize:13, fontWeight:700, textAlign:'center' }}>{msg}</div>
      ) : (
        <>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email"
            style={{ width:'100%', padding:'10px 12px', border:'none', borderRadius:4, fontSize:13, marginBottom:8, fontFamily:'sans-serif', outline:'none' }} />
          {status === 'err' && <p style={{ color:'#fca5a5', fontSize:11, marginBottom:6 }}>{msg}</p>}
          <button type="submit" disabled={status === 'loading'}
            style={{ width:'100%', background:'#111', color:'#fff', border:'none', padding:'10px', fontWeight:800, fontSize:12, borderRadius:4, cursor:'pointer', letterSpacing:'0.05em' }}>
            {status === 'loading' ? 'SUBSCRIBING...' : 'GET FREE DAILY BRIEFING →'}
          </button>
          <p style={{ fontSize:10, color: 'rgba(255,255,255,0.5)', textAlign:'center', marginTop:6 }}>No spam. Unsubscribe anytime.</p>
        </>
      )}
    </form>
  )
}

function SearchBar({ routePrefix, siteSlug }: { routePrefix: string; siteSlug: string }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
        const data = await res.json()
        setResults(data.results || [])
        setOpen(true)
      } catch {}
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  function go(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim()) { router.push(`/search?q=${encodeURIComponent(q.trim())}`); setOpen(false) }
  }

  return (
    <div ref={ref} style={{ position:'relative', flex:1, minWidth:200, maxWidth:400 }}>
      <form onSubmit={go} style={{ display:'flex', gap:6 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search markets, news, companies..."
          style={{ flex:1, padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6, fontSize:13, fontFamily:'sans-serif', outline:'none', background:'#f9fafb' }} />
        <button type="submit" style={{ background:'#374151', color:'#fff', border:'none', padding:'8px 14px', borderRadius:6, fontSize:13, cursor:'pointer' }}>🔍</button>
      </form>
      {open && results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:200, overflow:'hidden' }}>
          {results.map((art:any,i:number) => (
            <Link key={i} href={`/article/${siteSlug}/${art.slug}`} onClick={() => { setOpen(false); setQ('') }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #f3f4f6', cursor:'pointer', display:'flex', gap:10, alignItems:'flex-start' }}>
                {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width:44, height:32, objectFit:'cover', borderRadius:3, flexShrink:0 }} />}
                <div>
                  <div style={{ fontSize:12, color:'#6b7280', fontWeight:600 }}>{art.category?.toUpperCase()}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#111', lineHeight:1.3 }}>{art.title?.slice(0,70)}</div>
                </div>
              </div>
            </Link>
          ))}
          <Link href={`/search?q=${encodeURIComponent(q)}`} onClick={() => setOpen(false)}>
            <div style={{ padding:'10px 14px', fontSize:12, color:'#3b82f6', fontWeight:700, textAlign:'center', background:'#f9fafb' }}>
              See all results for "{q}" →
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function LiveMarketDashboard({ articles, site, routePrefix, siteSlug, primaryColor, searchParams }: {
  articles: any[], site: any, routePrefix: string, siteSlug: string, primaryColor: string, searchParams?: any
}) {
  const p = primaryColor || '#c0392b'
  const [tab, setTab] = useState('Indices')
  const [screenerTab, setScreenerTab] = useState('Most Active')
  const [indices, setIndices] = useState(INDICES)
  const [commodities, setCommodities] = useState(COMMODITIES)
  const [currencies, setCurrencies] = useState(CURRENCIES)
  const [stocks, setStocks] = useState(STOCKS)
  const [time, setTime] = useState('')
  const sp = searchParams || {}
  const filtered = sp.category ? articles.filter((a:any) => a.category === sp.category) : articles
  const cats = [...new Set(articles.map((a:any) => a.category).filter(Boolean))]
  const hero = filtered[0]
  const secondary = filtered.slice(1,5)
  const rest = filtered.slice(5)
  const trending = articles.slice(0,6)
  const opinions = articles.filter((a:any) => ['Analysis','Opinion','Research','Signals','Strategy'].includes(a.category)).slice(0,4)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})),1000)
    setTime(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    return () => clearInterval(t)
  },[])

  useEffect(() => {
    const t = setInterval(() => {
      setIndices(liveUpdate)
      setCommodities(liveUpdate)
      setCurrencies(liveUpdate)
      setStocks(liveUpdate)
    }, 2000)
    return () => clearInterval(t)
  },[])

  const tabData: Record<string,any[]> = { Indices:indices, Stocks:stocks, Commodities:commodities, Currencies:currencies }
  const TICKER = [...indices.map(i=>({l:i.name,v:i.price,p:i.pct})),...commodities.map(c=>({l:c.name,v:c.price,p:c.pct})),...currencies.map(c=>({l:c.pair,v:c.price,p:c.pct}))]

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', fontFamily:'sans-serif' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        .card{background:#fff;border-radius:6px;border:1px solid #e5e7eb;overflow:hidden}
        .mrow{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;cursor:pointer}
        .mrow:hover{background:#fafafa}
        .imp-h{background:#fee2e2;color:#dc2626;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:800}
        .imp-m{background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:800}
        .imp-l{background:#dcfce7;color:#16a34a;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:800}
        .tab-b{background:none;border:none;cursor:pointer;padding:8px 14px;font-size:13px;font-weight:600;color:#6b7280;border-bottom:2px solid transparent;white-space:nowrap;font-family:sans-serif}
        .tab-b.on{color:${p};border-bottom-color:${p}}
        .tab-b:hover{color:${p}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @media(max-width:768px){.sidebar{display:none!important}.two-col{grid-template-columns:1fr!important}.hero-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* TOP BAR */}
      <div style={{ background:'#0f172a', color:'#94a3b8', fontSize:11, padding:'5px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
        <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ color:'#ef4444', fontWeight:800, fontSize:12 }}>⬤ LIVE</span>
          <span>{new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
          <span style={{ color:'#4ade80', fontFamily:'monospace' }}>{time}</span>
        </div>
        <div style={{ display:'flex', gap:14 }}>
          <Link href="/search"><span style={{ cursor:'pointer', color:'#cbd5e1' }}>🔍 Search</span></Link>
          <Link href={`/${routePrefix}/${siteSlug}?category=Markets`}><span style={{ cursor:'pointer', color:'#cbd5e1' }}>Markets</span></Link>
          <Link href={`/${routePrefix}/${siteSlug}?category=Analysis`}><span style={{ cursor:'pointer', color:'#cbd5e1' }}>Analysis</span></Link>
          <Link href={`/${routePrefix}/${siteSlug}?category=Trade`}><span style={{ cursor:'pointer', color:'#cbd5e1' }}>Trade</span></Link>
        </div>
      </div>

      {/* HEADER */}
      <header style={{ background:'#fff', borderBottom:`3px solid ${p}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, height:58, justifyContent:'space-between' }}>
            <Link href={`/${routePrefix}/${siteSlug}`}>
              <div style={{ fontWeight:900, fontSize:26, color:p, letterSpacing:'-1px', whiteSpace:'nowrap' }}>{site.name}</div>
            </Link>
            <SearchBar routePrefix={routePrefix} siteSlug={siteSlug} />
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <Link href="/search"><button style={{ padding:'7px 12px', background:'#f3f4f6', border:'none', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:'sans-serif' }}>Sign In</button></Link>
              <button onClick={() => document.getElementById('newsletter-modal')?.classList.toggle('hidden')}
                style={{ background:p, color:'#fff', border:'none', borderRadius:5, padding:'7px 14px', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'sans-serif', whiteSpace:'nowrap' }}>
                Subscribe Free
              </button>
            </div>
          </div>
          {/* NAV */}
          <nav style={{ borderTop:'1px solid #f3f4f6', display:'flex', gap:0, overflowX:'auto', height:40 }}>
            {['Markets','News','Analysis','Charts','Technical','Calendar','Screener','Tools','Academy'].map(n => (
              <Link key={n} href={n==='Calendar'?`/calendar/${siteSlug}`:n==='Screener'?`/${routePrefix}/${siteSlug}#screener`:n==='Charts'?`/charts/${siteSlug}`:n==='Academy'?`/academy/${siteSlug}`:n==='Tools'?`/${routePrefix}/${siteSlug}#screener`:`/${routePrefix}/${siteSlug}?category=${n==='News'?'Trade':n}`}>
                <span style={{ padding:'0 12px', height:40, display:'flex', alignItems:'center', fontSize:13, fontWeight:500, color:'#374151', whiteSpace:'nowrap', cursor:'pointer' }}>{n}</span>
              </Link>
            ))}
          </nav>
          {/* CATEGORY STRIP */}
          <div style={{ background:'#f9fafb', borderTop:'1px solid #e5e7eb', display:'flex', gap:0, overflowX:'auto', height:34 }}>
            <Link href={`/${routePrefix}/${siteSlug}`}>
              <span style={{ padding:'0 12px', height:34, display:'flex', alignItems:'center', fontSize:12, fontWeight:!sp.category?800:400, color:!sp.category?p:'#6b7280', borderBottom:!sp.category?`2px solid ${p}`:'none', whiteSpace:'nowrap' }}>All</span>
            </Link>
            {cats.slice(0,10).map((cat:string) => (
              <Link key={cat} href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                <span style={{ padding:'0 12px', height:34, display:'flex', alignItems:'center', fontSize:12, fontWeight:sp.category===cat?800:400, color:sp.category===cat?p:'#6b7280', borderBottom:sp.category===cat?`2px solid ${p}`:'none', whiteSpace:'nowrap' }}>{cat}</span>
              </Link>
            ))}
            <span style={{ marginLeft:'auto', padding:'0 12px', height:34, display:'flex', alignItems:'center', fontSize:12, color:'#ef4444', fontWeight:700, whiteSpace:'nowrap' }}>🔴 LIVE</span>
          </div>
        </div>
      </header>

      {/* LIVE TICKER TAPE */}
      <div style={{ background:'#1e293b', color:'#fff', overflow:'hidden', padding:'7px 0', borderBottom:'1px solid #374151' }}>
        <div style={{ display:'flex', animation:'ticker 90s linear infinite', whiteSpace:'nowrap' }}>
          {[...TICKER,...TICKER].map((item,i) => (
            <span key={i} style={{ padding:'0 18px', fontSize:12, display:'inline-flex', gap:6, alignItems:'center' }}>
              <span style={{ color:'#94a3b8' }}>{item.l}</span>
              <span style={{ fontFamily:'monospace', fontWeight:700 }}>{item.v.toFixed(item.v>100?2:4)}</span>
              <span style={{ color:item.p>=0?'#4ade80':'#f87171', fontSize:11 }}>{item.p>=0?'▲':'▼'}{Math.abs(item.p).toFixed(2)}%</span>
              <span style={{ color:'#334155' }}>│</span>
            </span>
          ))}
        </div>
      </div>

      {/* BREAKING BANNER */}
      {hero && (
        <div style={{ background:`linear-gradient(90deg,${p}20,${p}08)`, borderBottom:`1px solid ${p}30`, padding:'8px 20px' }}>
          <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ background:'#ef4444', color:'#fff', padding:'2px 8px', borderRadius:3, fontSize:10, fontWeight:900, letterSpacing:'0.06em', flexShrink:0 }}>BREAKING</span>
            <Link href={`/article/${siteSlug}/${hero.slug}`}>
              <span style={{ fontSize:13, fontWeight:600, color:'#111', cursor:'pointer' }}>{hero.title}</span>
            </Link>
            <span style={{ fontSize:11, color:'#9ca3af', whiteSpace:'nowrap', marginLeft:'auto' }}>Just now</span>
          </div>
        </div>
      )}

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'20px' }}>
        <div className="two-col" style={{ display:'grid', gridTemplateColumns:'1fr 330px', gap:20 }}>

          {/* MAIN CONTENT */}
          <main>
            {/* HERO + SECONDARY */}
            {hero && (
              <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:20 }}>
                <Link href={`/article/${siteSlug}/${hero.slug}`}>
                  <div className="card" style={{ cursor:'pointer' }}>
                    {hero.cover_image_url && <img src={hero.cover_image_url} alt={hero.title} style={{ width:'100%', height:320, objectFit:'cover', display:'block' }} loading="eager" />}
                    <div style={{ padding:18 }}>
                      {hero.category && <span style={{ background:p, color:'#fff', padding:'2px 8px', fontSize:9, fontWeight:800, borderRadius:2, letterSpacing:'0.06em' }}>{hero.category.toUpperCase()}</span>}
                      <h1 style={{ fontSize:24, fontWeight:900, lineHeight:1.2, margin:'10px 0 10px', color:'#111', fontFamily:'Georgia,serif' }}>{hero.title}</h1>
                      <p style={{ color:'#4b5563', lineHeight:1.6, fontSize:14, marginBottom:12 }}>{hero.excerpt}</p>
                      <div style={{ fontSize:11, color:'#9ca3af', display:'flex', gap:12, flexWrap:'wrap' }}>
                        <span>By <strong style={{color:'#374151'}}>{hero.author_name||'Editorial'}</strong></span>
                        <span>{hero.published_at?new Date(hero.published_at).toLocaleDateString('en-GB',{month:'short',day:'numeric',year:'numeric'}):''}</span>
                        <span style={{color:p,fontWeight:600}}>Read full story →</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ fontWeight:800, fontSize:12, textTransform:'uppercase', letterSpacing:'0.06em', color:'#374151', paddingBottom:8, borderBottom:`2px solid ${p}` }}>Top Stories</div>
                  {secondary.map((art:any) => (
                    <Link key={art.slug} href={`/article/${siteSlug}/${art.slug}`}>
                      <div className="card" style={{ display:'flex', gap:10, padding:12, cursor:'pointer' }}>
                        {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width:76, height:54, objectFit:'cover', borderRadius:3, flexShrink:0 }} loading="lazy" />}
                        <div>
                          {art.category && <span style={{ fontSize:9, fontWeight:800, color:p, letterSpacing:'0.06em' }}>{art.category.toUpperCase()}</span>}
                          <div style={{ fontWeight:700, fontSize:13, lineHeight:1.3, marginTop:3, color:'#111', fontFamily:'Georgia,serif' }}>{art.title}</div>
                          <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>By {art.author_name||'Editorial'} · {art.published_at?new Date(art.published_at).toLocaleDateString('en-GB',{month:'short',day:'numeric'}):''}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE MARKETS */}
            <div id="markets" className="card" style={{ marginBottom:20 }}>
              <div style={{ padding:'14px 16px 0', borderBottom:'1px solid #e5e7eb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <h2 style={{ fontSize:16, fontWeight:800, color:'#111', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ display:'inline-block', width:8, height:8, background:'#ef4444', borderRadius:'50%', animation:'pulse 1.5s infinite' }}></span>
                    Markets Live
                  </h2>
                  <Link href={`/${routePrefix}/${siteSlug}?category=Markets`}><span style={{ fontSize:12, color:p, fontWeight:600 }}>All markets ›</span></Link>
                </div>
                <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
                  {['Indices','Stocks','Commodities','Currencies','ETFs','Crypto'].map(t => (
                    <button key={t} className={`tab-b ${tab===t?'on':''}`} onClick={() => setTab(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'7px 14px', background:'#f9fafb', fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #e5e7eb' }}>
                  <span>Name</span><span style={{textAlign:'right'}}>Last</span><span style={{textAlign:'right'}}>High</span><span style={{textAlign:'right'}}>Low</span><span style={{textAlign:'right'}}>Chg%</span>
                </div>
                {(tabData[tab]||indices).slice(0,8).map((item:any,i:number) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'9px 14px', borderBottom:'1px solid #f3f4f6', fontSize:13, alignItems:'center' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:7, fontWeight:600 }}>
                      <span>{item.flag||'🌐'}</span><span style={{color:'#111'}}>{item.name||item.pair||item.symbol}</span>
                    </span>
                    <span style={{textAlign:'right'}}><PriceBadge price={item.price} pct={item.pct} dec={item.price>100?2:4} /></span>
                    <span style={{textAlign:'right',color:'#9ca3af',fontSize:12}}>{(item.hi||item.price*1.002).toFixed(2)}</span>
                    <span style={{textAlign:'right',color:'#9ca3af',fontSize:12}}>{(item.lo||item.price*0.998).toFixed(2)}</span>
                    <span style={{textAlign:'right',color:item.pct>=0?'#16a34a':'#dc2626',fontWeight:700,fontSize:12}}>{item.pct>=0?'+':''}{item.pct.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TRADINGVIEW CHART */}
            <div id="chart" className="card" style={{ marginBottom:20, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h2 style={{ fontSize:15, fontWeight:800 }}>📈 Live Chart</h2>
                <div style={{ display:'flex', gap:6 }}>
                  {['1D','1W','1M','3M','1Y'].map(r => (
                    <button key={r} style={{ padding:'3px 10px', background:r==='1D'?'#111':'#f3f4f6', color:r==='1D'?'#fff':'#374151', border:'none', borderRadius:4, fontSize:11, fontWeight:600, cursor:'pointer' }}>{r}</button>
                  ))}
                </div>
              </div>
              <iframe src="https://s.tradingview.com/widgetembed/?frameElementId=tv_c1&symbol=CAPITALCOM%3AGOLD&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=1&timezone=exchange&show_popup_button=1"
                style={{ width:'100%', height:380, border:'none', display:'block' }} title="Live Chart" allow="fullscreen" />
            </div>

            {/* WORLD INDICES + COMMODITIES */}
            <div className="two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              <div className="card">
                <div style={{ padding:'12px 14px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:800, fontSize:14 }}>🌍 World Indices</span>
                  <Link href={`/${routePrefix}/${siteSlug}?category=Markets`}><span style={{ fontSize:11, color:p }}>View all ›</span></Link>
                </div>
                {indices.slice(0,6).map((item,i) => (
                  <div key={i} className="mrow">
                    <span style={{ display:'flex', gap:7, alignItems:'center', fontWeight:600 }}><span>{item.flag}</span><span>{item.name}</span></span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#111' }}>{item.price.toFixed(2)}</div>
                      <div style={{ color:item.pct>=0?'#16a34a':'#dc2626', fontSize:11, fontWeight:600 }}>{item.pct>=0?'+':''}{item.pct.toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{ padding:'12px 14px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:800, fontSize:14 }}>⚡ Commodities</span>
                  <Link href={`/${routePrefix}/${siteSlug}?category=Commodities`}><span style={{ fontSize:11, color:p }}>View all ›</span></Link>
                </div>
                {commodities.slice(0,6).map((item,i) => (
                  <div key={i} className="mrow">
                    <div><div style={{ fontWeight:600, fontSize:13 }}>{item.flag} {item.name}</div><div style={{ fontSize:11, color:'#9ca3af' }}>{item.month}</div></div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#111' }}>{item.price.toFixed(2)}</div>
                      <div style={{ color:item.pct>=0?'#16a34a':'#dc2626', fontSize:11, fontWeight:600 }}>{item.pct>=0?'+':''}{item.pct.toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ANALYSIS & OPINION — NO AVATARS */}
            {opinions.length > 0 && (
              <div className="card" style={{ marginBottom:20 }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h2 style={{ fontSize:15, fontWeight:800 }}>💡 Analysis & Opinion</h2>
                  <Link href={`/${routePrefix}/${siteSlug}?category=Analysis`}><span style={{ fontSize:12, color:p, fontWeight:600 }}>Show more ›</span></Link>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                  {opinions.map((art:any,i:number) => (
                    <Link key={art.slug} href={`/article/${siteSlug}/${art.slug}`}>
                      <div style={{ padding:'14px 16px', borderBottom:i<2?'1px solid #f3f4f6':'none', borderRight:i%2===0?'1px solid #f3f4f6':'none', cursor:'pointer', display:'flex', gap:12 }}>
                        {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width:60, height:44, objectFit:'cover', borderRadius:4, flexShrink:0 }} loading="lazy" />}
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, lineHeight:1.35, color:'#111', fontFamily:'Georgia,serif', marginBottom:5 }}>{art.title}</div>
                          <div style={{ fontSize:11, color:'#6b7280' }}>
                            {art.published_at?`${Math.max(0,Math.floor((Date.now()-new Date(art.published_at).getTime())/3600000))}h ago`:''} · By <span style={{color:p,fontWeight:600}}>{art.author_name||'Editorial'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ARTICLE FEED */}
            <div className="card" style={{ marginBottom:20 }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                <h2 style={{ fontSize:15, fontWeight:800 }}>{sp.category||'Latest News'}</h2>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <Link href={`/${routePrefix}/${siteSlug}`}><span style={{ fontSize:11, padding:'3px 10px', background:!sp.category?p:'#f3f4f6', color:!sp.category?'#fff':'#374151', borderRadius:12, fontWeight:600, cursor:'pointer' }}>All</span></Link>
                  {cats.slice(0,5).map((cat:string) => (
                    <Link key={cat} href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                      <span style={{ fontSize:11, padding:'3px 10px', background:sp.category===cat?p:'#f3f4f6', color:sp.category===cat?'#fff':'#374151', borderRadius:12, fontWeight:600, cursor:'pointer' }}>{cat}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {rest.map((art:any) => (
                <Link key={art.slug} href={`/article/${siteSlug}/${art.slug}`}>
                  <div style={{ display:'flex', gap:16, padding:'14px 16px', borderBottom:'1px solid #f3f4f6', cursor:'pointer' }}>
                    {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width:136, height:92, objectFit:'cover', borderRadius:5, flexShrink:0 }} loading="lazy" />}
                    <div style={{ flex:1 }}>
                      {art.category && <span style={{ fontSize:9, fontWeight:800, color:p, letterSpacing:'0.06em', textTransform:'uppercase' }}>{art.category}</span>}
                      <h3 style={{ fontWeight:800, fontSize:16, lineHeight:1.3, margin:'4px 0 6px', color:'#111', fontFamily:'Georgia,serif' }}>{art.title}</h3>
                      <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, marginBottom:8 }}>{art.excerpt}</p>
                      <div style={{ fontSize:11, color:'#9ca3af', display:'flex', gap:10 }}>
                        <span>By <strong style={{color:'#374151'}}>{art.author_name||'Editorial'}</strong></span>
                        <span>·</span>
                        <span>{art.published_at?new Date(art.published_at).toLocaleDateString('en-GB',{month:'short',day:'numeric',year:'numeric'}):''}</span>
                        <span>·</span>
                        <span>⏱ {art.read_time_minutes||5} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* MARKET SCREENER */}
            <div id="screener" className="card" style={{ marginBottom:20 }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                <h2 style={{ fontSize:15, fontWeight:800 }}>🔍 Market Screener</h2>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Most Active','Top Gainers','Top Losers','All-Time High'].map(t => (
                    <button key={t} onClick={() => setScreenerTab(t)} style={{ padding:'3px 10px', background:screenerTab===t?p:'#f3f4f6', color:screenerTab===t?'#fff':'#374151', border:'none', borderRadius:10, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'sans-serif' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'7px 14px', background:'#f9fafb', fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #e5e7eb' }}>
                <span>Name</span><span style={{textAlign:'right'}}>Price</span><span style={{textAlign:'right'}}>Chg%</span><span style={{textAlign:'right'}}>Volume</span><span style={{textAlign:'right'}}>Rating</span>
              </div>
              {stocks.map((s:any,i:number) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'9px 14px', borderBottom:'1px solid #f3f4f6', fontSize:13, alignItems:'center' }}>
                  <span style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span>{s.flag}</span>
                    <div><div style={{ fontWeight:700, color:'#111', fontSize:13 }}>{s.symbol}</div><div style={{ fontSize:11, color:'#9ca3af' }}>{s.name}</div></div>
                  </span>
                  <span style={{ textAlign:'right', fontFamily:'monospace', fontWeight:700 }}>${s.price.toFixed(2)}</span>
                  <span style={{ textAlign:'right', color:s.pct>=0?'#16a34a':'#dc2626', fontWeight:700 }}>{s.pct>=0?'+':''}{s.pct.toFixed(2)}%</span>
                  <span style={{ textAlign:'right', color:'#9ca3af', fontSize:12 }}>{(Math.random()*50+10).toFixed(1)}M</span>
                  <span style={{ textAlign:'right' }}>
                    <span style={{ background:s.pct>=1?'#dcfce7':s.pct>-0.5?'#fef3c7':'#fee2e2', color:s.pct>=1?'#16a34a':s.pct>-0.5?'#92400e':'#dc2626', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>
                      {s.pct>=1?'Buy':s.pct>=-0.5?'Neutral':'Sell'}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/* REAL ECONOMIC CALENDAR - TradingView */}
            <div id="calendar" className="card" style={{ marginBottom:20, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h2 style={{ fontSize:15, fontWeight:800 }}>📅 Economic Calendar</h2>
                <a href={`/calendar/${siteSlug}`} style={{ fontSize:12, color:p, fontWeight:600, textDecoration:'none' }}>Full calendar ›</a>
              </div>
              <iframe
                src="https://s.tradingview.com/external-embedding/embed-widget-events.html?%7B%22colorTheme%22%3A%22light%22%2C%22isTransparent%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22locale%22%3A%22en%22%2C%22importanceFilter%22%3A%22-1%2C0%2C1%22%2C%22countryFilter%22%3A%22us%2Ceu%2Cgb%2Cjp%2Ccn%2Cca%2Cau%22%7D"
                style={{ width:'100%', height:400, border:'none', display:'block' }}
                title="Economic Calendar"
              />
            </div>


          </main>

          {/* SIDEBAR */}
          <aside className="sidebar">
            {/* NEWSLETTER */}
            <div style={{ background:`linear-gradient(135deg,${p},#1e293b)`, borderRadius:6, padding:18, marginBottom:14, color:'#fff' }}>
              <div style={{ fontWeight:900, fontSize:16, marginBottom:6 }}>📧 Free Daily Briefing</div>
              <p style={{ fontSize:12, opacity:0.85, lineHeight:1.6, marginBottom:14 }}>Top stories from {site.name} every morning. Join 50,000+ subscribers.</p>
              <NewsletterForm siteId={site.id} siteName={site.name} p={p} />
            </div>

            {/* FOREX RATES */}
            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:800, fontSize:13 }}>💱 Forex Rates</span>
                <Link href={`/${routePrefix}/${siteSlug}?category=Forex`}><span style={{ fontSize:11, color:p }}>All ›</span></Link>
              </div>
              {currencies.slice(0,6).map((c:any,i:number) => (
                <div key={i} className="mrow">
                  <span style={{ fontWeight:600, fontSize:13 }}>{c.pair}</span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'monospace', fontSize:12, fontWeight:700 }}><PriceBadge price={c.price} pct={c.pct} dec={4} /></div>
                    <div style={{ color:c.pct>=0?'#16a34a':'#dc2626', fontSize:11, fontWeight:600 }}>{c.pct>=0?'+':''}{c.pct.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* TRENDING — NO AVATARS */}
            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #e5e7eb' }}>
                <span style={{ fontWeight:800, fontSize:13 }}>🔥 Trending Now</span>
              </div>
              {trending.map((art:any,i:number) => (
                <Link key={i} href={`/article/${siteSlug}/${art.slug}`}>
                  <div style={{ display:'flex', gap:10, padding:'10px 14px', borderBottom:'1px solid #f3f4f6', cursor:'pointer', alignItems:'flex-start' }}>
                    <span style={{ fontSize:18, fontWeight:900, color:'#e5e7eb', lineHeight:1, minWidth:22, flexShrink:0 }}>{i+1}</span>
                    <div>
                      {art.category && <span style={{ fontSize:9, fontWeight:800, color:p, letterSpacing:'0.06em' }}>{art.category.toUpperCase()}</span>}
                      <div style={{ fontWeight:600, fontSize:13, lineHeight:1.4, color:'#111', marginTop:2 }}>{art.title}</div>
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>By {art.author_name||'Editorial'}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* MINI CHART */}
            <div className="card" style={{ marginBottom:14, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #e5e7eb' }}>
                <span style={{ fontWeight:800, fontSize:13 }}>Gold (XAU/USD)</span>
              </div>
              <iframe src="https://s.tradingview.com/widgetembed/?frameElementId=tv_mini2&symbol=FOREXCOM%3AXAUUSD&interval=60&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=3&timezone=exchange"
                style={{ width:'100%', height:200, border:'none', display:'block' }} title="Gold Mini Chart" />
            </div>

            {/* TOPICS */}
            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #e5e7eb' }}>
                <span style={{ fontWeight:800, fontSize:13 }}>Browse Topics</span>
              </div>
              <div style={{ padding:14, display:'flex', flexWrap:'wrap', gap:6 }}>
                {cats.map((cat:string) => (
                  <Link key={cat} href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                    <span style={{ fontSize:12, fontWeight:600, color:p, border:`1px solid ${p}20`, background:`${p}10`, padding:'4px 12px', borderRadius:3, cursor:'pointer', display:'inline-block' }}>{cat}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* SEARCH */}
            <div className="card" style={{ padding:14 }}>
              <div style={{ fontWeight:800, fontSize:13, marginBottom:10 }}>🔍 Search Articles</div>
              <SearchBar routePrefix={routePrefix} siteSlug={siteSlug} />
              <Link href="/search"><div style={{ fontSize:12, color:p, textAlign:'center', marginTop:8, fontWeight:600, cursor:'pointer' }}>Advanced search →</div></Link>
            </div>
          </aside>
        </div>
      </div>

      {/* FULL FOOTER */}
      <footer style={{ background:'#0f172a', color:'#64748b', marginTop:40 }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'40px 20px 20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:32, marginBottom:32, flexWrap:'wrap' }}>
            <div>
              <Link href={`/${routePrefix}/${siteSlug}`}><div style={{ fontWeight:900, fontSize:22, color:'#fff', marginBottom:10 }}>{site.name}</div></Link>
              <p style={{ fontSize:13, lineHeight:1.7, color:'#475569', maxWidth:260, marginBottom:16 }}>{site.tagline||'Professional intelligence and market analysis for global business.'}</p>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Newsletter</div>
                <NewsletterForm siteId={site.id} siteName={site.name} p={p} />
              </div>
            </div>
            {[
              { title:'Coverage', links: cats.slice(0,5).map((c:string) => ({ label:c, href:`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(c)}` })) },
              { title:'Markets', links:[{label:'World Indices',href:`/${routePrefix}/${siteSlug}#markets`},{label:'Commodities',href:`/${routePrefix}/${siteSlug}?category=Commodities`},{label:'Currencies',href:`/${routePrefix}/${siteSlug}?category=Forex`},{label:'Screener',href:`/${routePrefix}/${siteSlug}#screener`},{label:'Calendar',href:`/${routePrefix}/${siteSlug}#calendar`}] },
              { title:'Company', links:[{label:'About Us',href:`/${routePrefix}/${siteSlug}`},{label:'Our Journalists',href:`/${routePrefix}/${siteSlug}`},{label:'Advertise',href:`/${routePrefix}/${siteSlug}`},{label:'Contact',href:`/${routePrefix}/${siteSlug}`},{label:'Privacy Policy',href:`/${routePrefix}/${siteSlug}`},{label:'Terms of Use',href:`/${routePrefix}/${siteSlug}`}] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight:700, fontSize:11, color:'#94a3b8', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.08em' }}>{col.title}</div>
                {col.links.map((l:any) => <Link key={l.label} href={l.href}><div style={{ fontSize:13, color:'#475569', marginBottom:8, cursor:'pointer' }}>{l.label}</div></Link>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid #1e293b', paddingTop:20, marginBottom:16 }}>
            <p style={{ fontSize:11, color:'#334155', lineHeight:1.8, marginBottom:10 }}>
              <strong style={{color:'#475569'}}>Risk Disclosure:</strong> Trading in financial instruments and/or cryptocurrencies involves high risks including the risk of losing some, or all, of your investment amount. Prices of cryptocurrencies are extremely volatile and may be affected by external factors. Before deciding to trade, you should be fully informed of the risks and costs, carefully consider your investment objectives, level of experience, and risk appetite, and seek professional advice where needed.
            </p>
            <p style={{ fontSize:11, color:'#334155', lineHeight:1.8 }}>
              The data contained in this website is not necessarily real-time nor accurate. All CFDs (stocks, indexes, futures) and Forex prices are not provided by exchanges but rather by market makers, and so prices may not be accurate and may differ from the actual market price. {site.name} will not accept liability for any loss or damage as a result of your trading, or your reliance on the information contained within this website.
            </p>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid #1e293b', flexWrap:'wrap', gap:8 }}>
            <span style={{ fontSize:12, color:'#334155' }}>© {new Date().getFullYear()} {site.name} · RepHub Intelligence Ltd · All Rights Reserved</span>
            <div style={{ display:'flex', gap:16 }}>
              {['Terms','Privacy','Risk Warning','Cookies','Sitemap'].map(l => (
                <Link key={l} href={l==='Sitemap'?'/sitemap.xml':`/${routePrefix}/${siteSlug}`}><span style={{ fontSize:11, color:'#334155', cursor:'pointer' }}>{l}</span></Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
