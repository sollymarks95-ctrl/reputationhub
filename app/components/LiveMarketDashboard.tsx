'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const SEED_DATA = {
  indices: [
    { name: 'S&P 500', price: 5248.35, change: 15.23, pct: 0.29, flag: '🇺🇸', hi: 5271.20, lo: 5224.10 },
    { name: 'Dow Jones', price: 39127.80, change: -45.20, pct: -0.12, flag: '🇺🇸', hi: 39240.10, lo: 38980.50 },
    { name: 'Nasdaq', price: 16340.87, change: 87.45, pct: 0.54, flag: '🇺🇸', hi: 16420.30, lo: 16200.10 },
    { name: 'DAX', price: 18482.35, change: 132.48, pct: 0.72, flag: '🇩🇪', hi: 18540.20, lo: 18310.80 },
    { name: 'FTSE 100', price: 8205.47, change: -23.12, pct: -0.28, flag: '🇬🇧', hi: 8245.30, lo: 8180.20 },
    { name: 'Nikkei 225', price: 38890.32, change: 245.67, pct: 0.64, flag: '🇯🇵', hi: 39050.00, lo: 38620.50 },
    { name: 'CAC 40', price: 8087.45, change: 43.21, pct: 0.54, flag: '🇫🇷', hi: 8120.30, lo: 8040.10 },
    { name: 'Hang Seng', price: 18230.52, change: -124.30, pct: -0.68, flag: '🇭🇰', hi: 18420.80, lo: 18180.40 },
  ],
  commodities: [
    { name: 'Gold', price: 2387.40, change: 12.80, pct: 0.54, unit: 'oz', month: 'Aug 26' },
    { name: 'Silver', price: 29.45, change: -0.32, pct: -1.07, unit: 'oz', month: 'Jul 26' },
    { name: 'Crude Oil WTI', price: 78.92, change: 0.45, pct: 0.57, unit: 'bbl', month: 'Jul 26' },
    { name: 'Brent Oil', price: 81.40, change: 0.62, pct: 0.77, unit: 'bbl', month: 'Aug 26' },
    { name: 'Natural Gas', price: 2.84, change: -0.08, pct: -2.74, unit: 'MMBtu', month: 'Jul 26' },
    { name: 'Copper', price: 4.67, change: 0.08, pct: 1.74, unit: 'lb', month: 'Jul 26' },
    { name: 'US Soybeans', price: 1184.75, change: -0.02, pct: -0.02, unit: 'bu', month: 'Jul 26' },
    { name: 'US Wheat', price: 626.60, change: -7.25, pct: -1.17, unit: 'bu', month: 'Jul 26' },
  ],
  currencies: [
    { pair: 'EUR/USD', price: 1.0892, change: -0.0023, pct: -0.21, bid: 1.0891, ask: 1.0893 },
    { pair: 'GBP/USD', price: 1.2735, change: 0.0047, pct: 0.37, bid: 1.2734, ask: 1.2736 },
    { pair: 'USD/JPY', price: 156.82, change: 0.34, pct: 0.22, bid: 156.81, ask: 156.83 },
    { pair: 'USD/CHF', price: 0.9012, change: -0.0018, pct: -0.20, bid: 0.9011, ask: 0.9013 },
    { pair: 'AUD/USD', price: 0.6623, change: 0.0031, pct: 0.47, bid: 0.6622, ask: 0.6624 },
    { pair: 'USD/CAD', price: 1.3645, change: -0.0024, pct: -0.18, bid: 1.3644, ask: 1.3646 },
    { pair: 'NZD/USD', price: 0.6124, change: 0.0015, pct: 0.25, bid: 0.6123, ask: 0.6125 },
    { pair: 'USD/CNY', price: 7.2450, change: 0.0180, pct: 0.25, bid: 7.2448, ask: 7.2452 },
  ],
  stocks: [
    { name: 'Apple Inc.', symbol: 'AAPL', price: 189.84, change: 2.34, pct: 1.25, flag: '🇺🇸', cap: '2.97T' },
    { name: 'Microsoft', symbol: 'MSFT', price: 420.53, change: -1.87, pct: -0.44, flag: '🇺🇸', cap: '3.12T' },
    { name: 'NVIDIA Corp', symbol: 'NVDA', price: 887.65, change: 23.45, pct: 2.72, flag: '🇺🇸', cap: '2.19T' },
    { name: 'Tesla Inc.', symbol: 'TSLA', price: 182.47, change: 4.23, pct: 2.37, flag: '🇺🇸', cap: '580B' },
    { name: 'Exxon Mobil', symbol: 'XOM', price: 149.81, change: -5.11, pct: -3.30, flag: '🇺🇸', cap: '612B' },
    { name: 'Amazon.com', symbol: 'AMZN', price: 185.32, change: -0.89, pct: -0.48, flag: '🇺🇸', cap: '1.96T' },
    { name: 'Alphabet A', symbol: 'GOOGL', price: 171.45, change: 1.23, pct: 0.72, flag: '🇺🇸', cap: '2.14T' },
    { name: 'Meta Platforms', symbol: 'META', price: 494.50, change: 3.21, pct: 0.65, flag: '🇺🇸', cap: '1.26T' },
  ],
  calendar: [
    { time: '08:30', country: '🇺🇸', event: 'Initial Jobless Claims', impact: 'high', actual: '220K', forecast: '225K', prev: '218K' },
    { time: '10:00', country: '🇺🇸', event: 'ISM Manufacturing PMI', impact: 'high', actual: '', forecast: '49.8', prev: '49.2' },
    { time: '14:00', country: '🇪🇺', event: 'ECB Interest Rate Decision', impact: 'high', actual: '', forecast: '4.50%', prev: '4.50%' },
    { time: '15:30', country: '🇬🇧', event: 'BoE Gov Bailey Speaks', impact: 'medium', actual: '', forecast: '', prev: '' },
    { time: '16:00', country: '🇺🇸', event: 'Crude Oil Inventories', impact: 'medium', actual: '', forecast: '-1.8M', prev: '-2.4M' },
    { time: '19:00', country: '🇺🇸', event: 'FOMC Minutes', impact: 'high', actual: '', forecast: '', prev: '' },
  ],
  analysts: [
    { name: 'Sarah Mitchell', title: 'Chief Market Analyst', initials: 'SM', color: '#1a73e8', rating: 4.9, followers: '12.4K' },
    { name: 'James Thornton', title: 'Senior Economist', initials: 'JT', color: '#e53935', rating: 4.7, followers: '8.2K' },
    { name: 'Emma Hartley', title: 'FX Strategist', initials: 'EH', color: '#43a047', rating: 4.8, followers: '10.1K' },
    { name: 'Dr. Michael Wong', title: 'Quantitative Analyst', initials: 'MW', color: '#fb8c00', rating: 4.6, followers: '6.8K' },
  ]
}

const TICKER_ITEMS = [
  ...SEED_DATA.indices.map(i => ({ label: i.name, price: i.price, pct: i.pct })),
  ...SEED_DATA.commodities.map(c => ({ label: c.name, price: c.price, pct: c.pct })),
  ...SEED_DATA.currencies.map(c => ({ label: c.pair, price: c.price, pct: c.pct })),
]

function PriceCell({ value, pct, decimals = 2 }: { value: number, pct: number, decimals?: number }) {
  const [flash, setFlash] = useState('')
  const prev = useRef(value)
  useEffect(() => {
    if (value !== prev.current) {
      setFlash(value > prev.current ? 'up' : 'down')
      const t = setTimeout(() => setFlash(''), 600)
      prev.current = value
      return () => clearTimeout(t)
    }
  }, [value])
  const isUp = pct >= 0
  return (
    <span style={{ color: isUp ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: 13,
      background: flash === 'up' ? '#dcfce7' : flash === 'down' ? '#fee2e2' : 'transparent',
      transition: 'background 0.6s', padding: '2px 4px', borderRadius: 2 }}>
      {value.toFixed(decimals)}
    </span>
  )
}

function ChangeCell({ change, pct, decimals = 2 }: { change: number, pct: number, decimals?: number }) {
  const isUp = pct >= 0
  return (
    <span style={{ color: isUp ? '#16a34a' : '#dc2626', fontSize: 13, fontWeight: 600 }}>
      {isUp ? '+' : ''}{change.toFixed(decimals)} ({isUp ? '+' : ''}{pct.toFixed(2)}%)
    </span>
  )
}

export default function LiveMarketDashboard({
  articles, site, routePrefix, siteSlug, primaryColor, searchParams
}: {
  articles: any[], site: any, routePrefix: string, siteSlug: string, primaryColor: string, searchParams?: any
}) {
  const p = primaryColor || '#c0392b'
  const [tab, setTab] = useState('Indices')
  const [indices, setIndices] = useState(SEED_DATA.indices)
  const [commodities, setCommodities] = useState(SEED_DATA.commodities)
  const [currencies, setCurrencies] = useState(SEED_DATA.currencies)
  const [stocks, setStocks] = useState(SEED_DATA.stocks)
  const [tickerPos, setTickerPos] = useState(0)
  const [flashItems, setFlashItems] = useState<Record<string, boolean>>({})
  const [currentTime, setCurrentTime] = useState('')
  const [screenerTab, setScreenerTab] = useState('Most Active')
  const cats = [...new Set(articles.map((a: any) => a.category).filter(Boolean))]
  const sp = searchParams || {}
  const filtered = sp.category ? articles.filter((a: any) => a.category === sp.category) : articles

  // Live time
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Simulate live price updates
  useEffect(() => {
    const update = () => {
      setIndices(prev => prev.map(item => {
        const delta = (Math.random() - 0.48) * item.price * 0.0003
        const newPrice = Math.max(item.price + delta, item.price * 0.95)
        const newChange = item.change + delta
        return { ...item, price: newPrice, change: newChange, pct: (newChange / (newPrice - newChange)) * 100 }
      }))
      setCommodities(prev => prev.map(item => {
        const delta = (Math.random() - 0.48) * item.price * 0.0004
        const newPrice = Math.max(item.price + delta, 0.1)
        return { ...item, price: newPrice, change: item.change + delta, pct: ((item.change + delta) / newPrice) * 100 }
      }))
      setCurrencies(prev => prev.map(item => {
        const delta = (Math.random() - 0.48) * item.price * 0.0002
        return { ...item, price: item.price + delta, change: item.change + delta, pct: item.pct + (Math.random() - 0.5) * 0.02 }
      }))
      setStocks(prev => prev.map(item => {
        const delta = (Math.random() - 0.48) * item.price * 0.0003
        const newPrice = Math.max(item.price + delta, 1)
        return { ...item, price: newPrice, change: item.change + delta, pct: ((item.change + delta) / newPrice) * 100 }
      }))
    }
    const t = setInterval(update, 2000)
    return () => clearInterval(t)
  }, [])

  // Ticker scrolling
  useEffect(() => {
    const t = setInterval(() => setTickerPos(p => p - 1), 30)
    return () => clearInterval(t)
  }, [])

  const tabData: Record<string, any[]> = { Indices: indices, Stocks: stocks, Commodities: commodities, Currencies: currencies }
  const hero = filtered[0]
  const secondary = filtered.slice(1, 5)
  const rest = filtered.slice(5)
  const trending = [...articles].slice(0, 5)
  const opinions = articles.filter((a: any) => ['Analysis', 'Opinion', 'Research', 'Signals'].includes(a.category)).slice(0, 4)

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#1a1a1a', background: '#f8f8f8' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        a:hover{color:${p}}
        .tab-btn{background:none;border:none;cursor:pointer;padding:8px 16px;font-size:13px;font-weight:600;color:#555;border-bottom:2px solid transparent;white-space:nowrap}
        .tab-btn.active{color:${p};border-bottom-color:${p}}
        .tab-btn:hover{color:${p}}
        .market-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px}
        .market-row:hover{background:#fafafa}
        .impact-high{background:#fee2e2;color:#dc2626;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:800}
        .impact-medium{background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:800}
        .impact-low{background:#dcfce7;color:#16a34a;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:800}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .ticker-wrap{overflow:hidden;white-space:nowrap;background:#111;color:#fff}
        .ticker-inner{display:inline-block;animation:marquee 120s linear infinite}
        @keyframes pulse{0%{opacity:1}50%{opacity:0.6}100%{opacity:1}}
        .live-dot{display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:50%;animation:pulse 1.5s infinite;margin-right:6px}
        .card{background:#fff;border-radius:4px;border:1px solid #e8e8e8;overflow:hidden}
        .section-title{font-size:18px;font-weight:800;color:#111;padding-bottom:8px;border-bottom:2px solid ${p};margin-bottom:16px;display:flex;align-items:center;justify-content:space-between}
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: '#111827', color: '#9ca3af', fontSize: 11, padding: '5px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>📡 LIVE MARKETS</span>
          <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: 12 }}>{currentTime}</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {['Global Markets', 'Economic Calendar', 'Broker Reviews', 'Technical Tools'].map(l => (
            <span key={l} style={{ cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </div>

      {/* MAIN NAV */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 60, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Link href={`/${routePrefix}/${siteSlug}`}>
                <div style={{ fontWeight: 900, fontSize: 26, color: p, letterSpacing: '-1px', whiteSpace: 'nowrap' }}>{site.name}</div>
              </Link>
              <div style={{ background: '#f3f4f6', borderRadius: 20, display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 8, flex: 1, minWidth: 240 }}>
                <span style={{ fontSize: 14, color: '#9ca3af' }}>🔍</span>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>Search markets, news, analysis...</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280', cursor: 'pointer', padding: '6px 10px' }}>Sign In</span>
              <div style={{ background: '#f59e0b', color: '#fff', borderRadius: 4, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>Get Pro — 50% OFF</div>
            </div>
          </div>
          {/* NAV LINKS */}
          <nav style={{ borderTop: '1px solid #f3f4f6', display: 'flex', gap: 0, overflowX: 'auto', height: 40 }}>
            {['Markets', 'News', 'Analysis', 'Charts', 'Technical', 'Economic Calendar', 'Screener', 'Brokers', 'Academy'].map(n => (
              <Link key={n} href={`/${routePrefix}/${siteSlug}`}>
                <span style={{ padding: '0 14px', height: 40, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', cursor: 'pointer', borderBottom: n === 'Markets' ? `2px solid ${p}` : 'none', color: n === 'Markets' ? p : '#374151' }}>{n}</span>
              </Link>
            ))}
          </nav>
          {/* SUB NAV */}
          <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 0, overflowX: 'auto', height: 36 }}>
            {cats.slice(0, 10).map(cat => (
              <Link key={cat} href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                <span style={{ padding: '0 14px', height: 36, display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: sp.category === cat ? 800 : 400, color: sp.category === cat ? p : '#6b7280', whiteSpace: 'nowrap', borderBottom: sp.category === cat ? `2px solid ${p}` : 'none' }}>{cat}</span>
              </Link>
            ))}
            <span style={{ padding: '0 14px', height: 36, display: 'flex', alignItems: 'center', fontSize: 12, color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap' }}>🔴 LIVE MARKETS</span>
          </div>
        </div>
      </header>

      {/* TICKER TAPE */}
      <div className="ticker-wrap" style={{ padding: '8px 0', borderBottom: '2px solid #374151' }}>
        <div className="ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: 'inline-block', padding: '0 20px', fontSize: 12 }}>
              <span style={{ color: '#9ca3af', marginRight: 4 }}>{item.label}</span>
              <span style={{ color: '#fff', fontFamily: 'monospace', marginRight: 4 }}>{item.price.toFixed(2)}</span>
              <span style={{ color: item.pct >= 0 ? '#4ade80' : '#f87171', fontSize: 11 }}>
                {item.pct >= 0 ? '▲' : '▼'} {Math.abs(item.pct).toFixed(2)}%
              </span>
              <span style={{ color: '#374151', marginLeft: 12 }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>

        {/* BREAKING NEWS BANNER */}
        <div style={{ background: `linear-gradient(135deg, ${p}15, ${p}08)`, border: `1px solid ${p}30`, borderRadius: 4, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 900, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>BREAKING</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{hero?.title || 'Markets update: Global indices mixed as central banks signal continued caution on rate cuts'}</span>
          <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>Just now</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div>

            {/* HERO + TOP STORIES */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
              {hero && (
                <Link href={`/article/${siteSlug}/${hero.slug}`}>
                  <div className="card" style={{ cursor: 'pointer' }}>
                    {hero.cover_image_url && <img src={hero.cover_image_url} alt={hero.title} style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }} />}
                    <div style={{ padding: 20 }}>
                      {hero.category && <span style={{ background: p, color: '#fff', padding: '2px 8px', fontSize: 10, fontWeight: 800, borderRadius: 2, letterSpacing: '0.05em' }}>{hero.category.toUpperCase()}</span>}
                      <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.25, marginTop: 10, marginBottom: 10, color: '#111', fontFamily: 'Georgia, serif' }}>{hero.title}</h1>
                      <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginBottom: 12 }}>{hero.excerpt}</p>
                      <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span>By <strong style={{ color: '#374151' }}>{hero.author_name || 'Editorial'}</strong></span>
                        <span>·</span>
                        <span>{hero.published_at ? new Date(hero.published_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'Today'}</span>
                        <span>·</span>
                        <span>{hero.read_time_minutes || 5} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, borderBottom: `2px solid ${p}`, marginBottom: 4 }}>Top Stories</div>
                {secondary.map((art: any) => (
                  <Link key={art.slug} href={`/article/${siteSlug}/${art.slug}`}>
                    <div className="card" style={{ display: 'flex', gap: 10, padding: 12, cursor: 'pointer' }}>
                      {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width: 80, height: 58, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                      <div>
                        {art.category && <span style={{ fontSize: 9, fontWeight: 800, color: p, letterSpacing: '0.06em' }}>{art.category.toUpperCase()}</span>}
                        <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.35, marginTop: 3, color: '#111', fontFamily: 'Georgia, serif' }}>{art.title}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{art.author_name || 'Editorial'} · {art.published_at ? new Date(art.published_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : ''}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* LIVE MARKETS SECTION */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ padding: '16px 20px 0', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>
                    <span className="live-dot"></span>Markets <span style={{ fontSize: 12, color: p, fontWeight: 600 }}>LIVE</span>
                  </h2>
                  <Link href={`/${routePrefix}/${siteSlug}`}><span style={{ fontSize: 12, color: p, fontWeight: 600 }}>See all markets ›</span></Link>
                </div>
                <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
                  {['Indices', 'Stocks', 'Commodities', 'Currencies', 'ETFs', 'Crypto'].map(t => (
                    <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                {/* TABLE HEADER */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Name</span><span style={{ textAlign: 'right' }}>Last</span><span style={{ textAlign: 'right' }}>High</span><span style={{ textAlign: 'right' }}>Low</span><span style={{ textAlign: 'right' }}>Chg %</span>
                </div>
                {(tab === 'Indices' ? indices : tab === 'Stocks' ? stocks : tab === 'Commodities' ? commodities : currencies).slice(0, 8).map((item: any, i: number) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 13, alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{item.flag || '🌐'}</span>
                      <span style={{ fontWeight: 600, color: '#111' }}>{item.name || item.pair}</span>
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      <PriceCell value={item.price} pct={item.pct} decimals={item.price > 1000 ? 2 : item.price > 10 ? 2 : 4} />
                    </span>
                    <span style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{item.hi?.toFixed(2) || (item.price * 1.003).toFixed(2)}</span>
                    <span style={{ textAlign: 'right', color: '#6b7280', fontSize: 12 }}>{item.lo?.toFixed(2) || (item.price * 0.997).toFixed(2)}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ color: item.pct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: 12 }}>
                        {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(2)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TRADINGVIEW CHART */}
            <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>📈 Live Chart</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map(p => (
                    <button key={p} style={{ padding: '3px 10px', background: p === '1D' ? '#111' : '#f3f4f6', color: p === '1D' ? '#fff' : '#374151', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
                  ))}
                </div>
              </div>
              <iframe
                src="https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=CAPITALCOM%3AGOLD&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=1&timezone=exchange&show_popup_button=1"
                style={{ width: '100%', height: 400, border: 'none', display: 'block' }}
                title="TradingView Chart"
                allow="fullscreen"
              />
            </div>

            {/* WORLD INDICES TABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="card">
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>🌍 World Indices</span>
                  <Link href={`/${routePrefix}/${siteSlug}`}><span style={{ fontSize: 12, color: p }}>View all ›</span></Link>
                </div>
                {indices.slice(0, 6).map((item, i) => (
                  <div key={i} className="market-row">
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{item.flag}</span>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{item.price.toFixed(2)}</div>
                      <div style={{ color: item.pct >= 0 ? '#16a34a' : '#dc2626', fontSize: 11, fontWeight: 600 }}>
                        {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(2)}%
                      </div>
                    </span>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>⚡ Commodities</span>
                  <Link href={`/${routePrefix}/${siteSlug}`}><span style={{ fontSize: 12, color: p }}>View all ›</span></Link>
                </div>
                {commodities.slice(0, 6).map((item, i) => (
                  <div key={i} className="market-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.month}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{item.price.toFixed(2)}</div>
                      <div style={{ color: item.pct >= 0 ? '#16a34a' : '#dc2626', fontSize: 11, fontWeight: 600 }}>
                        {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ANALYSIS & OPINION */}
            {opinions.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800 }}>💡 Analysis & Opinion</h2>
                  <Link href={`/${routePrefix}/${siteSlug}?category=Analysis`}><span style={{ fontSize: 12, color: p, fontWeight: 600 }}>Show more analysis ›</span></Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {opinions.map((art: any, i: number) => {
                    const analyst = SEED_DATA.analysts[i % SEED_DATA.analysts.length]
                    return (
                      <Link key={art.slug} href={`/article/${siteSlug}/${art.slug}`}>
                        <div style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none', borderRight: i % 2 === 0 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer' }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: analyst.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                            {art.author_name ? art.author_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : analyst.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, color: '#111', fontFamily: 'Georgia, serif', marginBottom: 6 }}>{art.title}</div>
                            <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span>{art.published_at ? `${Math.floor((Date.now() - new Date(art.published_at).getTime()) / 3600000)} hours ago` : ''}</span>
                              <span>·</span>
                              <span>By <span style={{ color: p, fontWeight: 600 }}>{art.author_name || analyst.name}</span></span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* MORE ARTICLES */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>{sp.category || 'Latest News'}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {cats.slice(0, 5).map(cat => (
                    <Link key={cat} href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                      <span style={{ fontSize: 11, padding: '3px 10px', background: sp.category === cat ? p : '#f3f4f6', color: sp.category === cat ? '#fff' : '#374151', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>{cat}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {rest.map((art: any) => (
                <Link key={art.slug} href={`/article/${siteSlug}/${art.slug}`}>
                  <div style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                    {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width: 140, height: 96, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      {art.category && <span style={{ fontSize: 10, fontWeight: 800, color: p, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{art.category}</span>}
                      <h3 style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3, marginTop: 4, marginBottom: 6, color: '#111', fontFamily: 'Georgia, serif' }}>{art.title}</h3>
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>{art.excerpt}</p>
                      <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', gap: 10 }}>
                        <span>By <strong style={{ color: '#374151' }}>{art.author_name || 'Editorial'}</strong></span>
                        <span>·</span>
                        <span>{art.published_at ? new Date(art.published_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                        <span>·</span>
                        <span>⏱ {art.read_time_minutes || 5} min</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* SCREENER */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>🔍 Market Screener</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Most Active', 'Top Gainers', 'Top Losers', 'All-Time High'].map(t => (
                    <button key={t} onClick={() => setScreenerTab(t)} style={{ padding: '4px 12px', background: screenerTab === t ? p : '#f3f4f6', color: screenerTab === t ? '#fff' : '#374151', border: 'none', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '8px 16px', background: '#f9fafb', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e5e7eb' }}>
                  <span>Name</span><span style={{ textAlign: 'right' }}>Price</span><span style={{ textAlign: 'right' }}>Chg%</span><span style={{ textAlign: 'right' }}>Volume</span><span style={{ textAlign: 'right' }}>Market Cap</span><span style={{ textAlign: 'right' }}>Rating</span>
                </div>
                {stocks.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 13, alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{s.flag}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#111' }}>{s.symbol}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.name}</div>
                      </div>
                    </span>
                    <span style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>${s.price.toFixed(2)}</span>
                    <span style={{ textAlign: 'right', color: s.pct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%</span>
                    <span style={{ textAlign: 'right', color: '#6b7280' }}>{(Math.random() * 50 + 10).toFixed(1)}M</span>
                    <span style={{ textAlign: 'right', color: '#6b7280' }}>{s.cap}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ background: s.pct >= 0 ? '#dcfce7' : s.pct > -1 ? '#fef3c7' : '#fee2e2', color: s.pct >= 0 ? '#16a34a' : s.pct > -1 ? '#92400e' : '#dc2626', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                        {s.pct >= 1 ? 'Buy' : s.pct >= -0.5 ? 'Neutral' : 'Sell'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ECONOMIC CALENDAR */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>📅 Economic Calendar</h2>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Today · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 30px 1fr 80px 80px 80px', padding: '8px 16px', background: '#f9fafb', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e5e7eb', gap: 8 }}>
                  <span>Time</span><span>Country</span><span>Event</span><span style={{ textAlign: 'right' }}>Actual</span><span style={{ textAlign: 'right' }}>Forecast</span><span style={{ textAlign: 'right' }}>Previous</span>
                </div>
                {SEED_DATA.calendar.map((ev, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 30px 1fr 80px 80px 80px', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', fontSize: 13, gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', color: '#374151', fontWeight: 600 }}>{ev.time}</span>
                    <span>{ev.country}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`impact-${ev.impact}`}>{ev.impact.toUpperCase()}</span>
                      <span style={{ fontWeight: 600, color: '#111' }}>{ev.event}</span>
                    </span>
                    <span style={{ textAlign: 'right', fontWeight: 700, color: ev.actual ? '#16a34a' : '#9ca3af' }}>{ev.actual || '--'}</span>
                    <span style={{ textAlign: 'right', color: '#6b7280' }}>{ev.forecast || '--'}</span>
                    <span style={{ textAlign: 'right', color: '#6b7280' }}>{ev.prev || '--'}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <div>
            {/* FOREX RATES */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>💱 Forex Rates</span>
                <Link href={`/${routePrefix}/${siteSlug}`}><span style={{ fontSize: 11, color: p }}>All pairs ›</span></Link>
              </div>
              {currencies.slice(0, 6).map((c: any, i: number) => (
                <div key={i} className="market-row">
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.pair}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{c.price.toFixed(4)}</div>
                    <div style={{ color: c.pct >= 0 ? '#16a34a' : '#dc2626', fontSize: 11 }}>{c.pct >= 0 ? '+' : ''}{c.pct.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* TRENDING */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>🔥 Trending Now</span>
              </div>
              {trending.map((art: any, i: number) => (
                <Link key={i} href={`/article/${siteSlug}/${art.slug}`}>
                  <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#d1d5db', lineHeight: 1, minWidth: 24, flexShrink: 0 }}>{i + 1}</span>
                    <div>
                      {art.category && <span style={{ fontSize: 9, fontWeight: 800, color: p, letterSpacing: '0.06em' }}>{art.category.toUpperCase()}</span>}
                      <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4, color: '#111', marginTop: 2 }}>{art.title}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{art.author_name || 'Editorial'}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* ANALYSTS */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>👤 Top Analysts</span>
              </div>
              {SEED_DATA.analysts.map((analyst, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: analyst.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{analyst.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{analyst.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{analyst.title}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>⭐ {analyst.rating} · {analyst.followers} followers</div>
                  </div>
                  <button style={{ background: p, color: '#fff', border: 'none', borderRadius: 4, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Follow</button>
                </div>
              ))}
            </div>

            {/* NEWSLETTER */}
            <div style={{ background: `linear-gradient(135deg, #1e293b, #0f172a)`, borderRadius: 4, padding: 20, marginBottom: 16, color: '#fff' }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>📧 Market Intelligence</div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>Get {site.name}''s daily briefing — top stories, market moves, and analysis delivered before markets open.</p>
              <input placeholder="your@email.com" style={{ width: '100%', padding: '10px', border: '1px solid #334155', borderRadius: 4, fontSize: 12, marginBottom: 8, background: '#1e293b', color: '#fff', outline: 'none' }} />
              <button style={{ width: '100%', background: p, color: '#fff', border: 'none', padding: '10px', fontWeight: 800, fontSize: 12, borderRadius: 4, cursor: 'pointer', letterSpacing: '0.05em' }}>SUBSCRIBE FREE →</button>
              <p style={{ fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 8 }}>50,000+ subscribers · Unsubscribe anytime</p>
            </div>

            {/* MINI CHART SIDEBAR */}
            <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>Gold Spot Price</span>
              </div>
              <iframe
                src="https://s.tradingview.com/widgetembed/?frameElementId=tv_mini&symbol=FOREXCOM%3AXAUUSD&interval=60&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=3&timezone=exchange"
                style={{ width: '100%', height: 220, border: 'none', display: 'block' }}
                title="Gold Chart"
              />
            </div>

          </div>
        </div>
      </div>

      {/* FULL FOOTER - Investing.com style */}
      <footer style={{ background: '#1e293b', color: '#94a3b8', marginTop: 48 }}>
        {/* FOOTER TOP */}
        <div style={{ background: '#0f172a', padding: '32px 24px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 32, marginBottom: 24 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 12 }}>{site.name}</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#64748b', maxWidth: 280, marginBottom: 16 }}>{site.tagline || 'Professional intelligence and market analysis for business leaders worldwide.'}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['f', 'X', 'in', '▶'].map(s => (
                    <div key={s} style={{ width: 32, height: 32, background: '#334155', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{s}</div>
                  ))}
                </div>
              </div>
              {[
                { title: 'Markets', links: ['World Indices', 'Commodities', 'Currencies', 'Equities', 'Bonds', 'Crypto'] },
                { title: 'News', links: ['Breaking News', 'Economic News', 'Market Analysis', 'Company News', 'Geopolitics'] },
                { title: 'Tools', links: ['Stock Screener', 'Economic Calendar', 'Earnings Calendar', 'Technical Analysis', 'Portfolio Tracker'] },
                { title: 'Company', links: ['About Us', 'Careers', 'Press Room', 'Advertise', 'Contact Us', 'Help & Support'] }
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#e2e8f0', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.title}</div>
                  {col.links.map(l => (
                    <Link key={l} href={`/${routePrefix}/${siteSlug}`}>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, cursor: 'pointer' }}>{l}</div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RISK DISCLAIMER */}
        <div style={{ background: '#0a0f1a', padding: '24px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.8, marginBottom: 12 }}>
              <strong style={{ color: '#64748b' }}>Risk Disclosure:</strong> Trading in financial instruments and/or cryptocurrencies involves high risks including the risk of losing some, or all, of your investment amount, and may not be suitable for all investors. Prices of cryptocurrencies are extremely volatile and may be affected by external factors such as financial, regulatory or political events. Trading on margin increases the financial risks.
            </p>
            <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.8, marginBottom: 12 }}>
              Before deciding to trade in financial instrument or cryptocurrencies you should be fully informed of the risks and costs associated with trading the financial markets, carefully consider your investment objectives, level of experience, and risk appetite, and seek professional advice where needed.
            </p>
            <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.8, marginBottom: 16 }}>
              <strong style={{ color: '#64748b' }}>{site.name}</strong> would like to remind you that the data contained in this website is not necessarily real-time nor accurate. All CFDs (stocks, indexes, futures) and Forex prices are not provided by exchanges but rather by market makers, and so prices may not be accurate and may differ from the actual market price. The data and prices on this website may not necessarily be provided by any market or exchange, but may be provided by market makers, and so prices may not be accurate.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #1e293b', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#334155' }}>© {new Date().getFullYear()} {site.name} · RepHub Intelligence Ltd · All Rights Reserved</span>
              <div style={{ display: 'flex', gap: 20 }}>
                {['Terms and Conditions', 'Privacy Policy', 'Risk Warning', 'Cookie Policy'].map(l => (
                  <Link key={l} href={`/${routePrefix}/${siteSlug}`}>
                    <span style={{ fontSize: 12, color: '#475569', cursor: 'pointer' }}>{l}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
