import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CopyVexx — Copy Trading Intelligence & Social Investing Analysis',
    description: 'Expert copy trading strategies, platform reviews, and social investing analysis. Follow top traders, understand the risks, and build your copy portfolio.',
    robots: 'noindex,nofollow',
    alternates: { canonical: 'https://copyvexx.com' },
    icons: { icon: '/icon-copyvexx.svg' },
    openGraph: { title: 'CopyVexx', description: 'Copy Trading Intelligence', type: 'website', url: 'https://copyvexx.com' }
  }
}

export default async function CopyVexxHome({ params }: { params: Promise<{ slug: string }> }) {
  const { data: articles } = await db
    .from('news_articles')
    .select('id, title, slug, excerpt, category, published_at, news_sites!inner(slug)')
    .eq('news_sites.slug', 'copy-trade-iq')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(18)

  const featured = articles?.[0]
  const rest = articles?.slice(1) || []

  const bg = '#0a0f1e'
  const card = '#111827'
  const border = '#1e2d45'
  const accent = '#3b82f6'
  const accentGlow = '#60a5fa'
  const text = '#f1f5f9'
  const sub = '#94a3b8'
  const green = '#22c55e'

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: text }}>

      {/* NAV */}
      <nav style={{ borderBottom: `1px solid ${border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>CV</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>Copy<span style={{ color: accent }}>Vexx</span></span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: sub }}>
            {['Copy Trading','Social Investing','Platform Reviews','Strategy'].map(t => (
              <span key={t} style={{ cursor: 'pointer' }}>{t}</span>
            ))}
          </div>
          <div style={{ background: accent, color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
            Start Copying
          </div>
        </div>
      </nav>

      {/* HERO TICKER */}
      <div style={{ background: '#0d1526', borderBottom: `1px solid ${border}`, padding: '8px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 32, fontSize: 12, color: sub }}>
          {[['eToro', '+2.4%', true], ['ZuluTrade', '+1.1%', true], ['NAGA', '-0.3%', false], ['Covesting', '+3.7%', true], ['Copy Index', '+1.8%', true]].map(([name, val, up]: any) => (
            <span key={name} style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: sub }}>{name} </span>
              <span style={{ color: up ? green : '#ef4444', fontWeight: 600 }}>{val}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        {/* HERO SECTION */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1e2d45', border: `1px solid ${border}`, padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: green, boxShadow: `0 0 6px ${green}` }}></div>
            <span style={{ fontSize: 12, color: sub, fontWeight: 500 }}>Live Copy Trading Analysis</span>
          </div>

          {featured ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
              <a href={`/article/copy-trade-iq/${featured.slug}`} style={{ display: 'block', background: `linear-gradient(135deg, #111827 0%, #0d1526 100%)`, border: `1px solid ${border}`, borderRadius: 16, padding: 32, textDecoration: 'none', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`, pointerEvents: 'none' }}></div>
                <div style={{ fontSize: 11, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Featured Analysis</div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: text, lineHeight: 1.3, marginBottom: 16, letterSpacing: '-0.02em' }}>{featured.title}</h1>
                <p style={{ fontSize: 15, color: sub, lineHeight: 1.65, marginBottom: 20 }}>{featured.excerpt?.slice(0, 160)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ background: accent, color: '#fff', padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Read Analysis →</span>
                  <span style={{ fontSize: 12, color: sub }}>{new Date(featured.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              </a>

              {/* SIDEBAR STATS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 12, color: sub, marginBottom: 8, fontWeight: 500 }}>TOP COPY PLATFORMS</div>
                  {[['eToro','35M+ users','Social Leader'],['ZuluTrade','2M+ users','Signal Provider'],['NAGA','1M+ users','Copy CFDs'],['Covesting','Beta','DeFi Copy']].map(([name, users, type]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${border}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{name}</div>
                        <div style={{ fontSize: 11, color: sub }}>{users}</div>
                      </div>
                      <span style={{ fontSize: 11, background: '#1e2d45', color: accent, padding: '3px 8px', borderRadius: 4 }}>{type}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: `linear-gradient(135deg, ${accent}20, #8b5cf620)`, border: `1px solid ${accent}40`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 6 }}>New to Copy Trading?</div>
                  <div style={{ fontSize: 12, color: sub, lineHeight: 1.5, marginBottom: 12 }}>Read our beginner guide to picking the right traders to copy.</div>
                  <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>Start with the basics →</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ color: sub }}>Articles loading — check back shortly.</div>
            </div>
          )}
        </div>

        {/* CATEGORIES */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {['All','Copy Trading','Social Investing','Platform Reviews','Strategy','Risk Management','eToro','Beginners'].map((cat, i) => (
            <span key={cat} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: i === 0 ? accent : 'transparent', color: i === 0 ? '#fff' : sub, border: `1px solid ${i === 0 ? accent : border}` }}>{cat}</span>
          ))}
        </div>

        {/* ARTICLE GRID */}
        <div style={{ marginBottom: 16, fontSize: 13, color: sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest Intelligence</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {rest.slice(0, 12).map((article: any) => (
            <a key={article.id} href={`/article/copy-trade-iq/${article.slug}`}
              style={{ display: 'block', background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20, textDecoration: 'none', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: 10, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{article.category}</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: text, lineHeight: 1.45, marginBottom: 10 }}>{article.title}</h3>
              <p style={{ fontSize: 12, color: sub, lineHeight: 1.55, marginBottom: 12 }}>{article.excerpt?.slice(0, 90)}...</p>
              <div style={{ fontSize: 11, color: sub }}>{new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </a>
          ))}
        </div>

        {rest.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: sub }}>
            Articles loading — check back in a few hours.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: '24px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: sub }}>
          <span>© 2026 CopyVexx · Copy Trading Intelligence · Solly Marks</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/about" style={{ color: sub, textDecoration: 'none' }}>About</a>
            <a href="/legal/privacy" style={{ color: sub, textDecoration: 'none' }}>Privacy</a>
            <a href="/feed.xml" style={{ color: sub, textDecoration: 'none' }}>RSS</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
