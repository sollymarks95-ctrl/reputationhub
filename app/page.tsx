import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = {
  title: 'RepHub Intelligence — Global Markets & Trade News Network',
  description: 'Professional market intelligence across 12 global publications covering commodity trading, financial markets, trade finance, and business strategy.',
  robots: 'index, follow',
}

const SITE_COLORS: Record<string, string> = {
  'global-trade-wire':'#c0392b','finance-terminal':'#1a56db','gold-markets-today':'#b7791f',
  'business-pulse':'#1e7e34','trust-score':'#6c2bd9','company-pedia':'#0694a2',
  'press-central':'#dc2626','invest-data':'#1e40af','trade-board':'#065f46',
  'global-trade-assoc':'#92400e','executive-network':'#4a1d96','market-radar':'#b91c1c',
}
const ROUTES: Record<string,string> = {
  'global-trade-wire':'news','finance-terminal':'finance','gold-markets-today':'commodities',
  'business-pulse':'magazine','trust-score':'reviews-hub','company-pedia':'wiki',
  'press-central':'pressroom','invest-data':'investdb','trade-board':'forum',
  'global-trade-assoc':'association','executive-network':'executive','market-radar':'market-radar',
}
const DESCRIPTIONS: Record<string,string> = {
  'global-trade-wire':'Global trade news, supply chains & international commerce',
  'finance-terminal':'Financial markets, forex, equities & investment analysis',
  'gold-markets-today':'Precious metals, commodities & mining intelligence',
  'business-pulse':'Business strategy, leadership & corporate intelligence',
  'trust-score':'B2B reputation, company reviews & trust research',
  'company-pedia':'Company profiles, industry knowledge & trade reference',
  'press-central':'Corporate press releases & official announcements',
  'invest-data':'Investment deals, private equity & M&A intelligence',
  'trade-board':'Trade community, market debates & professional Q&A',
  'global-trade-assoc':'Trade certification, compliance & industry standards',
  'executive-network':'Executive careers, CEO profiles & leadership news',
  'market-radar':'Market signals, technical analysis & price intelligence',
}

export default async function HomePage() {
  const { data: sites } = await supabase.from('news_sites').select('*').eq('is_live', true).order('name')
  const { count: totalArticles } = await supabase.from('news_articles').select('*', { count: 'exact', head: true }).eq('status', 'published')

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'sans-serif', color: '#fff' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}a:hover{opacity:0.85}`}</style>

      {/* HEADER */}
      <header style={{ background: '#111827', borderBottom: '1px solid #1e293b', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 24, color: '#fff', letterSpacing: '-0.5px' }}>🌐 RepHub Intelligence</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, color: '#94a3b8' }}>
          <Link href="/search"><span style={{ cursor: 'pointer' }}>🔍 Search</span></Link>
          <Link href="/charts"><span style={{ cursor: 'pointer' }}>📈 Charts</span></Link>
          <Link href="/academy"><span style={{ cursor: 'pointer' }}>🎓 Academy</span></Link>
          <Link href="/legal/about"><span style={{ cursor: 'pointer' }}>About</span></Link>
        </div>
      </header>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '60px 24px', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Professional Intelligence Network</div>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Global Markets & Trade Intelligence
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>
            12 professional publications covering commodity trading, financial markets, trade finance, and business strategy. Trusted by 200,000+ business professionals worldwide.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/news/global-trade-wire">
              <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 6, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                Start Reading →
              </button>
            </Link>
            <Link href="/search">
              <button style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px 24px', borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                🔍 Search All Publications
              </button>
            </Link>
          </div>
          <div style={{ marginTop: 24, fontSize: 13, color: '#475569' }}>
            <span style={{ color: '#4ade80', fontWeight: 700 }}>{totalArticles || 0}+ articles</span> published · <span style={{ color: '#4ade80', fontWeight: 700 }}>36 new</span> articles daily · <span style={{ color: '#4ade80', fontWeight: 700 }}>Live</span> market data
          </div>
        </div>
      </div>

      {/* PUBLICATIONS GRID */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '48px 24px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: '#fff' }}>Our Publications</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Choose your publication or search across all 12 for specific topics.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {sites?.map((site: any) => {
            const route = ROUTES[site.slug] || 'news'
            const color = SITE_COLORS[site.slug] || site.primary_color || '#3b82f6'
            return (
              <Link key={site.id} href={`/${route}/${site.slug}`}>
                <div style={{ background: '#1e293b', border: `1px solid #334155`, borderRadius: 8, padding: 20, cursor: 'pointer', transition: 'border-color 0.2s', borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 17, color: '#fff', marginBottom: 6 }}>{site.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>
                        {DESCRIPTIONS[site.slug] || site.tagline || 'Professional intelligence and market analysis'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ background: `${color}20`, color: color, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 3, letterSpacing: '0.06em' }}>
                          {site.site_type?.toUpperCase() || 'NEWS'}
                        </span>
                        <span style={{ fontSize: 11, color: '#475569' }}>Live coverage</span>
                      </div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                      {site.name.charAt(0)}
                    </div>
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
                    <span style={{ color }}>{site.name} →</span>
                    <span>Read all articles</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <footer style={{ background: '#111827', borderTop: '1px solid #1e293b', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#475569' }}>© {new Date().getFullYear()} RepHub Intelligence Ltd · All Rights Reserved</span>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            {[{l:'About',h:'/legal/about'},{l:'Privacy',h:'/legal/privacy'},{l:'Terms',h:'/legal/terms'},{l:'Risk Warning',h:'/legal/risk-warning'},{l:'Cookies',h:'/legal/cookies'},{l:'Contact',h:'/legal/contact'},{l:'Advertise',h:'/legal/advertise'}].map(({l,h}) => (
              <Link key={l} href={h}><span style={{ color: '#475569', cursor: 'pointer' }}>{l}</span></Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
