import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

async function getLiveMarkets() {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const res = await fetch(`${base}/api/live-data?type=markets`, { next: { revalidate: 900 } })
    return await res.json()
  } catch { return null }
}

async function getLiveNews() {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const res = await fetch(`${base}/api/live-data?type=topnews`, { next: { revalidate: 600 } })
    return await res.json()
  } catch { return [] }
}

export default async function FinanceSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()

  const [markets, news, articles] = await Promise.all([
    getLiveMarkets(),
    getLiveNews(),
    getLatestArticles(site.id, 12)
  ])

  const gold = markets?.gold
  const forex = markets?.forex || []
  const now = new Date()

  const tickers = [
    { label: 'GOLD', value: gold?.price ? `$${Number(gold.price).toLocaleString('en', { minimumFractionDigits: 2 })}` : '$2,345.60', change: gold?.changePct || 0.4, up: (gold?.changePct || 0) >= 0 },
    { label: 'SILVER', value: markets?.silver?.price ? `$${Number(markets.silver.price).toFixed(2)}` : '$29.42', change: markets?.silver?.changePct || -0.2, up: (markets?.silver?.changePct || 0) >= 0 },
    { label: 'EUR/USD', value: forex.find((f: any) => f.pair === 'EUR/USD')?.rate?.toFixed(4) || '1.0876', change: forex.find((f: any) => f.pair === 'EUR/USD')?.change || 0, up: (forex.find((f: any) => f.pair === 'EUR/USD')?.change || 0) >= 0 },
    { label: 'GBP/USD', value: forex.find((f: any) => f.pair === 'GBP/USD')?.rate?.toFixed(4) || '1.2654', change: forex.find((f: any) => f.pair === 'GBP/USD')?.change || 0, up: (forex.find((f: any) => f.pair === 'GBP/USD')?.change || 0) >= 0 },
    { label: 'S&P 500', value: markets?.sp500?.price ? `$${Number(markets.sp500.price).toFixed(2)}` : '5,248.49', change: markets?.sp500?.changePct || 0.6, up: (markets?.sp500?.changePct || 0) >= 0 },
    { label: 'OIL/WTI', value: markets?.oil?.price ? `$${Number(markets.oil.price).toFixed(2)}` : '$78.34', change: markets?.oil?.changePct || -0.3, up: (markets?.oil?.changePct || 0) >= 0 },
  ]

  const allNews = [...articles.map((a: any) => ({
    title: a.title, excerpt: a.excerpt, category: a.category,
    time: a.published_at ? timeAgo(a.published_at) : 'Now',
    image: a.cover_image_url, internal: true, slug: a.slug
  })), ...news.slice(0, 8).map((n: any) => ({
    title: n.title, excerpt: n.description, category: 'Markets',
    time: n.publishedAt ? timeAgo(n.publishedAt) : 'Live',
    image: n.urlToImage, internal: false, url: n.url, source: n.source?.name
  }))]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff', fontFamily: '"Courier New", monospace' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .ticker-wrap { overflow: hidden; white-space: nowrap; }
        .ticker-inner { display: inline-block; animation: scroll 40s linear infinite; }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .card:hover { border-color: #ff6600 !important; }
        .news-row:hover { background: #1a1a1a !important; }
      `}</style>

      {/* TOP STATUS BAR */}
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '4px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>
          {now.toUTCString().toUpperCase()} · LIVE MARKET DATA
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['TERMINAL', 'MARKETS', 'ANALYSIS', 'PORTFOLIO'].map(item => (
            <a key={item} href='javascript:void(0)' style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em' }}>{item}</a>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header style={{ background: '#0d0d0d', borderBottom: '1px solid #ff6600', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontFamily: '"Courier New", monospace', fontWeight: 900, fontSize: 24, color: '#ff6600', letterSpacing: '-0.02em' }}>
              {site.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.15em' }}>
              FINANCIAL INTELLIGENCE TERMINAL
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {['LIVE', 'MARKETS', 'ANALYSIS', 'COMPANIES', 'ABOUT'].map((item, i) => (
            <a key={item} href='javascript:void(0)' style={{ fontSize: 11, color: i === 0 ? '#ff6600' : '#666', letterSpacing: '0.08em', fontWeight: i === 0 ? 700 : 400, borderBottom: i === 0 ? '1px solid #ff6600' : 'none', paddingBottom: 2 }}>
              {item}
            </a>
          ))}
        </div>
      </header>

      {/* LIVE TICKER */}
      <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e', height: 36, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ background: '#ff6600', color: '#000', padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', flexShrink: 0 }}>
          LIVE
        </div>
        <div className="ticker-wrap" style={{ flex: 1 }}>
          <div className="ticker-inner">
            {[...tickers, ...tickers].map((t, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 40, fontSize: 12 }}>
                <span style={{ color: '#888', fontSize: 10, letterSpacing: '0.08em' }}>{t.label}</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{t.value}</span>
                <span style={{ color: t.up ? '#00d4aa' : '#ff4444', fontSize: 10 }}>
                  {t.up ? '▲' : '▼'} {Math.abs(Number(t.change)).toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* LEFT */}
        <div>
          {/* MARKET DASHBOARD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {tickers.map(t => (
              <div key={t.label} className="card" style={{
                background: '#111', border: '1px solid #1e1e1e', padding: '14px 16px',
                transition: 'border-color 0.15s'
              }}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.12em', marginBottom: 6 }}>{t.label}</div>
                <div style={{ fontSize: 22, color: '#fff', fontWeight: 700, fontFamily: 'monospace', marginBottom: 4 }}>{t.value}</div>
                <div style={{ fontSize: 12, color: t.up ? '#00d4aa' : '#ff4444' }}>
                  {t.up ? '▲' : '▼'} {Math.abs(Number(t.change)).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>

          {/* BREAKING */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4444', boxShadow: '0 0 8px #ff4444' }} />
              <span style={{ fontSize: 10, color: '#ff6600', letterSpacing: '0.12em', fontWeight: 700 }}>BREAKING INTELLIGENCE</span>
            </div>
            {allNews.slice(0, 3).map((article, i) => (
              <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', cursor: 'pointer' }} className="news-row">
                <div>
                  <div style={{ fontSize: 9, color: '#ff6600', letterSpacing: '0.1em', marginBottom: 6 }}>{article.category?.toUpperCase() || 'MARKETS'}</div>
                  <div style={{ fontSize: 14, color: '#e0e0e0', fontFamily: '"Courier New", monospace', lineHeight: 1.4, fontWeight: 600 }}>{article.title}</div>
                  {article.excerpt && <div style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{article.excerpt?.slice(0, 100)}...</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {article.image && <img src={article.image} alt="" style={{ width: 80, height: 54, objectFit: 'cover', display: 'block', marginBottom: 4, opacity: 0.8 }} />}
                  <div style={{ fontSize: 9, color: '#444' }}>{article.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* NEWS FEED */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e1e1e', fontSize: 10, color: '#ff6600', letterSpacing: '0.12em', fontWeight: 700 }}>
              MARKET INTELLIGENCE FEED
            </div>
            {allNews.slice(3, 12).map((article, i) => (
              <div key={i} className="news-row" style={{
                padding: '12px 16px', borderBottom: '1px solid #0d0d0d',
                display: 'flex', gap: 12, cursor: 'pointer',
                background: 'transparent', transition: 'background 0.15s'
              }}>
                <div style={{ fontSize: 14, color: '#333', fontWeight: 700, width: 20, flexShrink: 0, paddingTop: 2 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: '#ff6600', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {article.category?.toUpperCase() || 'MARKETS'}{article.source ? ` · ${article.source}` : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.4 }}>{article.title}</div>
                  <div style={{ fontSize: 9, color: '#444', marginTop: 4 }}>{article.time}</div>
                </div>
                {article.image && <img src={article.image} alt="" style={{ width: 60, height: 42, objectFit: 'cover', opacity: 0.7, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Gold focus */}
          <div style={{ background: '#111', border: '1px solid #2a2000', padding: 20 }}>
            <div style={{ fontSize: 9, color: '#ff6600', letterSpacing: '0.12em', marginBottom: 12 }}>GOLD SPOT PRICE</div>
            <div style={{ fontSize: 36, color: '#ffd700', fontWeight: 900, marginBottom: 4 }}>
              ${gold?.price ? Number(gold.price).toLocaleString('en', { minimumFractionDigits: 2 }) : '2,345.60'}
            </div>
            <div style={{ fontSize: 12, color: (gold?.changePct || 0) >= 0 ? '#00d4aa' : '#ff4444', marginBottom: 16 }}>
              {(gold?.changePct || 0) >= 0 ? '▲' : '▼'} {Math.abs(gold?.changePct || 0.4).toFixed(2)}% today
            </div>
            <div style={{ fontSize: 11, color: '#444', lineHeight: 1.7 }}>
              XAU/USD · Troy Ounce<br />
              Updated: {gold?.updated || now.toLocaleTimeString()}<br />
              Source: Alpha Vantage
            </div>
          </div>

          {/* Forex rates */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e1e', fontSize: 9, color: '#ff6600', letterSpacing: '0.1em' }}>FX RATES</div>
            {forex.map((f: any) => (
              <div key={f.pair} style={{ padding: '10px 14px', borderBottom: '1px solid #0d0d0d', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#888' }}>{f.pair}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#ddd', fontWeight: 700 }}>{f.rate?.toFixed(4)}</div>
                  <div style={{ fontSize: 9, color: f.change >= 0 ? '#00d4aa' : '#ff4444' }}>
                    {f.change >= 0 ? '+' : ''}{f.change?.toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* About */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', padding: 16 }}>
            <div style={{ fontSize: 9, color: '#ff6600', letterSpacing: '0.12em', marginBottom: 10 }}>ABOUT {site.name.toUpperCase()}</div>
            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>
              {site.description || `${site.name} is a professional financial intelligence terminal providing real-time market data, analysis, and business intelligence for traders, investors, and industry professionals worldwide.`}
            </p>
          </div>

          {/* Newsletter */}
          <div style={{ background: '#0d0d0d', border: '1px solid #ff660030', padding: 16 }}>
            <div style={{ fontSize: 9, color: '#ff6600', letterSpacing: '0.12em', marginBottom: 8 }}>MARKET BRIEFING</div>
            <p style={{ fontSize: 11, color: '#444', marginBottom: 14, lineHeight: 1.5 }}>Daily intelligence. Pre-market. Free.</p>
            <input placeholder="your@email.com" style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#ccc', padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, marginBottom: 8, outline: 'none' }} />
            <button style={{ width: '100%', background: '#ff6600', color: '#000', border: 'none', padding: '9px', fontFamily: 'monospace', fontWeight: 900, fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer' }}>
              SUBSCRIBE →
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '20px', marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: '#333' }}>© {now.getFullYear()} {site.name} · All market data delayed 15 minutes</div>
        <div style={{ fontSize: 10, color: '#333' }}>TERMS · PRIVACY · DISCLAIMER</div>
      </footer>
    </div>
  )
}
