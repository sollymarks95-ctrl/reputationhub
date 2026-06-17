import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'ExpatInvestIQ — Investing Intelligence for Expats Worldwide',
    description: 'The definitive investing guide for expats. Best brokers, tax implications, FBAR, HMRC, portfolio strategy and platform reviews for international investors.',
    robots: 'noindex,nofollow',
    alternates: { canonical: 'https://expatinvestiq.com' },
    openGraph: { title: 'ExpatInvestIQ', description: 'Investing Intelligence for Expats', type: 'website', url: 'https://expatinvestiq.com' }
  }
}

const REGIONS = [
  { flag: '🇺🇸', name: 'US Expats', tag: 'FBAR · FATCA' },
  { flag: '🇬🇧', name: 'UK Expats', tag: 'HMRC · ISA' },
  { flag: '🇮🇱', name: 'Israel Olim', tag: '10yr Tax Exemption' },
  { flag: '🌍', name: 'Global', tag: 'All Expats' },
]

export default async function ExpatInvestIQHome() {
  const { data: articles } = await db
    .from('news_articles')
    .select('id, title, slug, excerpt, category, published_at, news_sites!inner(slug)')
    .eq('news_sites.slug', 'expat-invest-iq')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(16)

  const featured = articles?.[0]
  const rest = articles?.slice(1) || []

  const bg = '#f8f7f4'
  const card = '#ffffff'
  const accent = '#0f5e6b'
  const accentLight = '#e6f4f6'
  const gold = '#c8963e'
  const text = '#1a1a2e'
  const sub = '#64748b'
  const border = '#e2e8f0'

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Georgia',serif", color: text }}>

      {/* TOP BAR */}
      <div style={{ background: accent, color: '#fff', padding: '8px 24px', fontSize: 12 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <span>🌍 Investing intelligence for expats in 140+ countries</span>
          <span style={{ fontFamily: 'system-ui' }}>eToro · Interactive Brokers · Saxo · Degiro</span>
        </div>
      </div>

      {/* NAV */}
      <nav style={{ background: card, borderBottom: `2px solid ${accent}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 68 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '-0.02em', lineHeight: 1 }}>
              ExpatInvest<span style={{ color: gold }}>IQ</span>
            </div>
            <div style={{ fontSize: 10, color: sub, fontFamily: 'system-ui', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Cross-Border Investment Intelligence</div>
          </div>
          <div style={{ display: 'flex', gap: 28, fontSize: 14, color: sub, fontFamily: 'system-ui' }}>
            {['Brokers', 'Tax Guides', 'Strategy', 'Country Guides', 'About'].map(t => (
              <span key={t} style={{ cursor: 'pointer', color: sub }}>{t}</span>
            ))}
          </div>
        </div>
      </nav>

      {/* REGION TABS */}
      <div style={{ background: accentLight, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', gap: 12 }}>
          {REGIONS.map(r => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: card, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
              <span style={{ fontSize: 18 }}>{r.flag}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: text, fontFamily: 'system-ui' }}>{r.name}</div>
                <div style={{ fontSize: 10, color: sub, fontFamily: 'system-ui' }}>{r.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        {/* HERO */}
        {featured && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, marginBottom: 48 }}>
            <a href={`/article/expat-invest-iq/${featured.slug}`}
              style={{ display: 'block', background: card, border: `1px solid ${border}`, borderRadius: 4, padding: '36px 40px', textDecoration: 'none', borderLeft: `5px solid ${accent}` }}>
              <div style={{ fontSize: 11, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'system-ui' }}>
                {featured.category} · Featured Analysis
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: text, lineHeight: 1.35, marginBottom: 16 }}>{featured.title}</h1>
              <p style={{ fontSize: 16, color: sub, lineHeight: 1.7, fontFamily: 'system-ui', marginBottom: 24 }}>{featured.excerpt?.slice(0, 180)}</p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontFamily: 'system-ui' }}>
                <span style={{ background: accent, color: '#fff', padding: '10px 22px', borderRadius: 4, fontSize: 13, fontWeight: 600 }}>Read Full Guide</span>
                <span style={{ fontSize: 12, color: sub }}>By Solly Marks · {new Date(featured.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </a>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: accent, color: '#fff', borderRadius: 4, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, opacity: 0.7, fontFamily: 'system-ui' }}>QUICK EXPAT GUIDE</div>
                {['Best brokers for expats 2026','FBAR filing for expat investors','Tax-efficient investing abroad','eToro for international investors','Currency risk guide for expats'].map(t => (
                  <div key={t} style={{ fontSize: 13, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.15)', fontFamily: 'system-ui', cursor: 'pointer' }}>→ {t}</div>
                ))}
              </div>
              <div style={{ background: card, border: `1px solid ${gold}`, borderRadius: 4, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: gold, marginBottom: 8, fontFamily: 'system-ui' }}>⭐ Editor's Pick</div>
                <div style={{ fontSize: 12, color: sub, lineHeight: 1.6, fontFamily: 'system-ui' }}>eToro is our top-rated broker for expats — available in 140 countries, FCA/CySEC/ASIC regulated, multi-currency accounts.</div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION HEADER */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24, paddingBottom: 12, borderBottom: `2px solid ${text}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: text, margin: 0 }}>Latest Intelligence</h2>
          <span style={{ fontSize: 12, color: sub, fontFamily: 'system-ui' }}>Expat investing guides, broker reviews & tax analysis</span>
        </div>

        {/* ARTICLE LIST */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {rest.slice(0, 12).map((article: any, i: number) => (
            <a key={article.id} href={`/article/expat-invest-iq/${article.slug}`}
              style={{ display: 'block', padding: '20px 16px', textDecoration: 'none', borderBottom: `1px solid ${border}`, borderRight: i % 2 === 0 ? `1px solid ${border}` : 'none' }}>
              <div style={{ fontSize: 10, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'system-ui' }}>{article.category}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: text, lineHeight: 1.4, marginBottom: 8 }}>{article.title}</h3>
              <p style={{ fontSize: 13, color: sub, lineHeight: 1.55, marginBottom: 10, fontFamily: 'system-ui' }}>{article.excerpt?.slice(0, 110)}...</p>
              <div style={{ fontSize: 11, color: sub, fontFamily: 'system-ui' }}>
                Solly Marks · {new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
            </a>
          ))}
        </div>

        {rest.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: sub, fontFamily: 'system-ui' }}>
            Guides loading — check back in a few hours.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ background: accent, color: '#fff', padding: '32px 24px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>ExpatInvest<span style={{ color: gold }}>IQ</span></div>
            <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>Cross-border investment intelligence for expats and international investors worldwide.</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12, opacity: 0.6, fontFamily: 'system-ui' }}>GUIDES</div>
            {['Best Expat Brokers','Tax Implications','FBAR Guide','Currency Risk','Portfolio Strategy'].map(t => (
              <div key={t} style={{ fontSize: 13, marginBottom: 6, opacity: 0.8, fontFamily: 'system-ui' }}>{t}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12, opacity: 0.6, fontFamily: 'system-ui' }}>LEGAL</div>
            {[['About', '/about'], ['Privacy Policy', '/legal/privacy'], ['Terms', '/legal/terms'], ['RSS Feed', '/feed.xml']].map(([t, href]) => (
              <div key={t}><a href={href} style={{ fontSize: 13, marginBottom: 6, opacity: 0.8, fontFamily: 'system-ui', color: '#fff', textDecoration: 'none', display: 'block' }}>{t}</a></div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '24px auto 0', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 12, opacity: 0.6, fontFamily: 'system-ui' }}>
          © 2026 ExpatInvestIQ · Solly Marks · Investment analysis for informational purposes only
        </div>
      </footer>
    </div>
  )
}
