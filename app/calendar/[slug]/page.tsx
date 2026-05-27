import { getNewsSite } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const ROUTE_MAP: Record<string,string> = {
  'global-trade-wire':'news','finance-terminal':'finance','gold-markets-today':'commodities',
  'business-pulse':'magazine','trust-score':'reviews-hub','company-pedia':'wiki',
  'press-central':'pressroom','invest-data':'investdb','trade-board':'forum',
  'global-trade-assoc':'association','executive-network':'executive','market-radar':'market-radar',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  return { title: `Economic Calendar | ${site?.name}`, description: 'Real-time economic events calendar — central bank decisions, GDP, CPI, employment data', robots: 'index, follow' }
}

export default async function CalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site) notFound()
  const p = site.primary_color || '#c0392b'
  const route = ROUTE_MAP[slug] || 'news'

  const tvCalendarConfig = JSON.stringify({
    colorTheme: 'light', isTransparent: false, width: '100%', height: '100%',
    locale: 'en', importanceFilter: '-1,0,1',
    countryFilter: 'us,eu,gb,jp,cn,ca,au,ch,nz,sg'
  })

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', fontFamily:'sans-serif', display:'flex', flexDirection:'column' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}`}</style>

      <header style={{ background:'#fff', borderBottom:`3px solid ${p}`, padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Link href={`/${route}/${slug}`}><div style={{ fontWeight:900, fontSize:22, color:p }}>{site.name}</div></Link>
          <span style={{ color:'#9ca3af', fontSize:13 }}>/ Economic Calendar</span>
        </div>
        <div style={{ display:'flex', gap:12, fontSize:13, color:'#6b7280' }}>
          <Link href={`/${route}/${slug}`}><span style={{ cursor:'pointer' }}>← News</span></Link>
          <Link href={`/charts/${slug}`}><span style={{ cursor:'pointer' }}>Charts</span></Link>
        </div>
      </header>

      <div style={{ background:`linear-gradient(90deg,${p},#1e293b)`, color:'#fff', padding:'20px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <h1 style={{ fontSize:26, fontWeight:900, marginBottom:4 }}>📅 Economic Calendar</h1>
          <p style={{ fontSize:14, opacity:0.8 }}>Real-time global macro events — central bank decisions, inflation data, employment reports & more</p>
        </div>
      </div>

      <div style={{ flex:1, maxWidth:1200, margin:'0 auto', width:'100%', padding:'20px' }}>
        <div className="tradingview-widget-container" style={{ height:'calc(100vh - 200px)', minHeight:600, borderRadius:8, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.1)' }}>
          <iframe
            src={`https://s.tradingview.com/external-embedding/embed-widget-events.html?${encodeURIComponent(tvCalendarConfig)}`}
            style={{ width:'100%', height:'100%', border:'none' }}
            title="Economic Calendar"
          />
        </div>
      </div>

      <footer style={{ background:'#0f172a', color:'#475569', padding:'16px 24px', textAlign:'center', fontSize:12 }}>
        <span>Economic data provided by TradingView · {site.name} © {new Date().getFullYear()} · </span>
        <Link href={`/${route}/${slug}`}><span style={{ color:p, cursor:'pointer' }}>Back to {site.name}</span></Link>
      </footer>
    </div>
  )
}
