import { getNewsSite } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  return { title: `Live Charts | ${site?.name || 'RepHub'}`, description: 'Real-time financial charts powered by TradingView — stocks, forex, commodities, indices', robots: 'index, follow' }
}

const ROUTE_MAP: Record<string,string> = {
  'global-trade-wire':'news','finance-terminal':'finance','gold-markets-today':'commodities',
  'business-pulse':'magazine','trust-score':'reviews-hub','company-pedia':'wiki',
  'press-central':'pressroom','invest-data':'investdb','trade-board':'forum',
  'global-trade-assoc':'association','executive-network':'executive','market-radar':'market-radar',
}

const POPULAR_SYMBOLS = [
  { label:'Gold', sym:'CAPITALCOM:GOLD' }, { label:'S&P 500', sym:'SPX' }, { label:'Bitcoin', sym:'BITSTAMP:BTCUSD' },
  { label:'EUR/USD', sym:'EURUSD' }, { label:'Crude Oil', sym:'TVC:USOIL' }, { label:'Nasdaq', sym:'NASDAQ:QQQ' },
  { label:'NVIDIA', sym:'NASDAQ:NVDA' }, { label:'Apple', sym:'NASDAQ:AAPL' }, { label:'GBP/USD', sym:'GBPUSD' },
  { label:'Silver', sym:'TVC:SILVER' }, { label:'Copper', sym:'CAPITALCOM:COPPER' }, { label:'Natural Gas', sym:'CAPITALCOM:NATURALGAS' },
  { label:'USD/JPY', sym:'USDJPY' }, { label:'Dow Jones', sym:'DJ:DJI' }, { label:'FTSE 100', sym:'LSE:UKX' },
  { label:'DAX', sym:'XETR:DAX' }, { label:'Nikkei', sym:'TOKYO:NI225' }, { label:'Ethereum', sym:'BITSTAMP:ETHUSD' },
]

export default async function ChartsPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams?: Promise<{ sym?: string, theme?: string }> }) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const site = await getNewsSite(slug)
  if (!site) notFound()
  const p = site.primary_color || '#c0392b'
  const route = ROUTE_MAP[slug] || 'news'
  const sym = sp.sym || 'CAPITALCOM:GOLD'
  const theme = sp.theme || 'light'

  const tvConfig = JSON.stringify({
    autosize: true, symbol: sym, interval: 'D', timezone: 'Europe/London',
    theme, style: '1', locale: 'en', toolbar_bg: '#f1f3f6',
    enable_publishing: false, allow_symbol_change: true, watchlist: ['CAPITALCOM:GOLD','SPX','EURUSD','TVC:USOIL','BITSTAMP:BTCUSD'],
    details: true, hotlist: true, calendar: true, show_popup_button: true,
    popup_width: '1000', popup_height: '650', save_image: true,
    container_id: 'tv_advanced_chart'
  })

  return (
    <div style={{ minHeight:'100vh', background:'#111827', fontFamily:'sans-serif', display:'flex', flexDirection:'column' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}a:hover{opacity:.8}`}</style>

      {/* HEADER */}
      <header style={{ background:'#0f172a', borderBottom:`3px solid ${p}`, padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <Link href={`/${route}/${slug}`}>
            <div style={{ fontWeight:900, fontSize:22, color:p }}>{site.name}</div>
          </Link>
          <span style={{ color:'#475569', fontSize:13 }}>/ Live Charts</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Link href={`/${route}/${slug}`}><span style={{ color:'#94a3b8', fontSize:13, cursor:'pointer' }}>← Back to News</span></Link>
          <Link href={`/charts/${slug}?sym=${sym}&theme=${theme==='light'?'dark':'light'}`}>
            <button style={{ background:'#1e293b', color:'#94a3b8', border:'1px solid #334155', borderRadius:4, padding:'6px 12px', fontSize:12, cursor:'pointer', fontFamily:'sans-serif' }}>
              {theme==='light'?'🌙 Dark':'☀️ Light'}
            </button>
          </Link>
        </div>
      </header>

      {/* QUICK SYMBOLS */}
      <div style={{ background:'#1e293b', borderBottom:'1px solid #334155', padding:'0 20px', height:40, display:'flex', alignItems:'center', gap:6, overflowX:'auto', flexShrink:0 }}>
        {POPULAR_SYMBOLS.map(({ label, sym: s }) => (
          <Link key={s} href={`/charts/${slug}?sym=${encodeURIComponent(s)}&theme=${theme}`}>
            <span style={{ padding:'4px 12px', borderRadius:4, background:sym===s?p:'transparent', color:sym===s?'#fff':'#94a3b8', fontSize:12, fontWeight:sym===s?700:400, cursor:'pointer', whiteSpace:'nowrap', border:sym===s?'none':'1px solid #334155' }}>
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* TRADINGVIEW ADVANCED CHART */}
      <div style={{ flex:1, minHeight:0 }}>
        <div className="tradingview-widget-container" style={{ height:'100%', width:'100%' }}>
          <div id="tv_advanced_chart" style={{ height:'calc(100vh - 100px)', width:'100%' }}></div>
          <script type="text/javascript" src="https://s3.tradingview.com/tv.js" async></script>
          <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `
            (function() {
              function init() {
                if (typeof TradingView !== 'undefined') {
                  new TradingView.widget(${tvConfig});
                } else {
                  setTimeout(init, 200);
                }
              }
              init();
            })();
          ` }} />
        </div>
      </div>

      {/* FOOTER BAR */}
      <div style={{ background:'#0f172a', borderTop:'1px solid #1e293b', padding:'8px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:11, color:'#475569' }}>Charts powered by TradingView · Data for informational purposes only · Not investment advice</span>
        <div style={{ display:'flex', gap:12 }}>
          {['Markets','News','Screener'].map(l => (
            <Link key={l} href={`/${route}/${slug}${l==='Screener'?'#screener':l==='News'?'':''}`}>
              <span style={{ fontSize:12, color:'#64748b', cursor:'pointer' }}>{l}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
