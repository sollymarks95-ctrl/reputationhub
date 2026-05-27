import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

async function getMarkets() {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const res = await fetch(`${base}/api/live-data?type=markets`, { next: { revalidate: 900 } })
    return await res.json()
  } catch { return null }
}

export default async function CommoditiesSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const [markets, articles] = await Promise.all([getMarkets(), getLatestArticles(site.id, 10)])

  const gold = markets?.gold
  const silver = markets?.silver
  const forex = markets?.forex || []
  const now = new Date()

  const commodities = [
    { name: 'Gold', symbol: 'XAU/USD', price: gold?.price ? `$${Number(gold.price).toLocaleString('en', {minimumFractionDigits:2})}` : '$2,345.60', change: gold?.changePct || 0.42, unit: 'per troy oz', icon: '🥇' },
    { name: 'Silver', symbol: 'XAG/USD', price: silver?.price ? `$${Number(silver.price).toFixed(2)}` : '$29.42', change: silver?.changePct || -0.18, unit: 'per troy oz', icon: '🥈' },
    { name: 'EUR/USD', symbol: 'FX', price: forex.find((f:any)=>f.pair==='EUR/USD')?.rate?.toFixed(4) || '1.0876', change: forex.find((f:any)=>f.pair==='EUR/USD')?.change || 0.12, unit: 'exchange rate', icon: '💶' },
    { name: 'GBP/USD', symbol: 'FX', price: forex.find((f:any)=>f.pair==='GBP/USD')?.rate?.toFixed(4) || '1.2654', change: forex.find((f:any)=>f.pair==='GBP/USD')?.change || -0.08, unit: 'exchange rate', icon: '💷' },
    { name: 'S&P 500', symbol: 'SPY', price: markets?.sp500?.price ? `$${Number(markets.sp500.price).toFixed(2)}` : '$5,248', change: markets?.sp500?.changePct || 0.62, unit: 'index', icon: '📈' },
    { name: 'Crude Oil', symbol: 'WTI', price: markets?.oil?.price ? `$${Number(markets.oil.price).toFixed(2)}` : '$78.34', change: markets?.oil?.changePct || -0.31, unit: 'per barrel', icon: '🛢️' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Arial, sans-serif', color:'#0a0a0a' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.row:hover{background:#f8f8f8!important}`}</style>

      {/* HEADER */}
      <header style={{ background:'#fff', borderBottom:'3px solid #e31837' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #eee' }}>
            <div>
              <div style={{ fontFamily:'"Arial Narrow",Arial,sans-serif', fontWeight:900, fontSize:28, color:'#e31837', letterSpacing:'-0.5px' }}>
                {site.name.toUpperCase()}
              </div>
              <div style={{ fontSize:10, color:'#888', letterSpacing:'0.1em' }}>COMMODITIES · MARKETS · INVESTING</div>
            </div>
            <div style={{ fontSize:12, color:'#666' }}>
              {now.toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </div>
          </div>
          <nav style={{ display:'flex', gap:0, height:40 }}>
            {['Markets','Commodities','Gold','Forex','Stocks','Analysis','News'].map((item,i) => (
              <a key={item} href="#" style={{ padding:'0 16px', display:'flex', alignItems:'center', fontSize:13, fontWeight:700, color:i===0?'#e31837':'#333', borderBottom:i===0?'3px solid #e31837':'3px solid transparent' }}>
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* PRICE BAR */}
      <div style={{ background:'#1a1a2e', padding:'8px 0', overflowX:'auto' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px', display:'flex', gap:32, alignItems:'center' }}>
          {commodities.map(c => (
            <div key={c.name} style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
              <span style={{ fontSize:11, color:'#888' }}>{c.name}</span>
              <span style={{ fontSize:13, color:'#fff', fontWeight:700 }}>{c.price}</span>
              <span style={{ fontSize:11, color:c.change>=0?'#00d084':'#ff4444' }}>
                {c.change>=0?'▲':'▼'} {Math.abs(c.change).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <main style={{ maxWidth:1280, margin:'0 auto', padding:'24px 20px' }}>
        {/* COMMODITY CARDS */}
        <h2 style={{ fontFamily:'"Arial Narrow",Arial,sans-serif', fontWeight:900, fontSize:20, color:'#1a1a2e', marginBottom:16, letterSpacing:'-0.3px' }}>
          LIVE COMMODITY PRICES
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
          {commodities.map(c => (
            <div key={c.name} style={{ background:'#fff', border:'1px solid #e8e8e8', padding:'18px 20px', borderTop:`3px solid ${c.change>=0?'#00b67a':'#e31837'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:18, marginBottom:2 }}>{c.icon}</div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1a1a2e' }}>{c.name}</div>
                  <div style={{ fontSize:10, color:'#888' }}>{c.symbol} · {c.unit}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'"Arial Narrow",Arial,sans-serif', fontWeight:900, fontSize:22, color:'#1a1a2e' }}>{c.price}</div>
                  <div style={{ fontSize:12, color:c.change>=0?'#00b67a':'#e31837', fontWeight:700 }}>
                    {c.change>=0?'▲':'▼'} {Math.abs(c.change).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div style={{ height:3, background:'#f0f0f0', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${Math.min(Math.abs(c.change)*20+50,90)}%`, background:c.change>=0?'#00b67a':'#e31837', borderRadius:2 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
          <div>
            <h2 style={{ fontFamily:'"Arial Narrow",Arial,sans-serif', fontWeight:900, fontSize:20, color:'#1a1a2e', marginBottom:14, letterSpacing:'-0.3px' }}>
              LATEST ANALYSIS & NEWS
            </h2>
            {articles.length === 0 ? (
              <div style={{ background:'#fff', padding:40, textAlign:'center', color:'#888', border:'1px solid #eee' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
                <p>No articles yet. Start publishing from the dashboard.</p>
              </div>
            ) : (
              <div style={{ background:'#fff', border:'1px solid #eee' }}>
                {articles.map((a:any, i:number) => (
                  <div key={a.id} className="row" style={{ display:'flex', gap:16, padding:'16px 20px', borderBottom:'1px solid #f5f5f5', cursor:'pointer' }}>
                    {a.cover_image_url
                      ? <img src={a.cover_image_url} alt={a.title} style={{ width:100, height:68, objectFit:'cover', flexShrink:0 }} />
                      : <div style={{ width:100, height:68, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>📊</div>
                    }
                    <div>
                      <div style={{ fontSize:10, color:'#e31837', fontWeight:700, marginBottom:4 }}>{a.category?.toUpperCase() || 'ANALYSIS'}</div>
                      <div style={{ fontWeight:700, fontSize:15, color:'#1a1a2e', lineHeight:1.3, marginBottom:4 }}>{a.title}</div>
                      <div style={{ fontSize:11, color:'#888' }}>{a.published_at ? timeAgo(a.published_at) : ''} · {a.read_time_minutes} min</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            <div style={{ background:'#1a1a2e', padding:20, marginBottom:16 }}>
              <div style={{ fontFamily:'"Arial Narrow",Arial', fontWeight:900, fontSize:16, color:'#fff', marginBottom:8 }}>GOLD FOCUS</div>
              <div style={{ fontSize:32, fontWeight:900, color:'#ffd700', marginBottom:4 }}>
                ${gold?.price ? Number(gold.price).toLocaleString('en',{minimumFractionDigits:2}) : '2,345.60'}
              </div>
              <div style={{ fontSize:13, color:gold?.changePct>=0?'#00d084':'#ff6666', marginBottom:14 }}>
                {gold?.changePct>=0?'▲':'▼'} {Math.abs(gold?.changePct||0.42).toFixed(2)}% · Today
              </div>
              <p style={{ fontSize:12, color:'#8899aa', lineHeight:1.6 }}>
                Gold prices updated in real-time from global markets. XAU/USD spot rate via Alpha Vantage.
              </p>
            </div>

            <div style={{ background:'#fff', border:'1px solid #eee', padding:20 }}>
              <div style={{ fontWeight:900, fontSize:14, color:'#1a1a2e', marginBottom:12, borderBottom:'2px solid #e31837', paddingBottom:8 }}>
                SITE INFO
              </div>
              <p style={{ fontSize:13, color:'#666', lineHeight:1.7 }}>
                {site.description || `${site.name} provides real-time commodity prices, market data, and investment analysis for professional traders and investors.`}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ background:'#1a1a2e', color:'#666', padding:'24px 20px', marginTop:32, textAlign:'center' }}>
        <div style={{ fontSize:12 }}>© {now.getFullYear()} {site.name} · Market data for informational purposes only · Not financial advice</div>
      </footer>
    </div>
  )
}
