import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Financial Intelligence Hub — Latest Broker & Crypto News',
  description: 'Daily intelligence from 14 financial editorial portals covering forex broker reviews, crypto markets, commodities, trade finance, and global investment intelligence.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'RepHuby Intelligence Hub — 150+ Daily Financial Articles',
    description: 'The latest from our 14 financial editorial portals. Broker reviews, crypto markets, commodities, forex, and investment intelligence.',
    type: 'website',
  }
}

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

const PORTAL_LABELS: Record<string, { label: string; color: string; domain: string }> = {
  'global-trade-wire':   { label: 'Trade Intelligence', color: '#1971C2', domain: 'nex-wire.com' },
  'finance-terminal':    { label: 'Financial Markets',  color: '#0EA5E9', domain: 'finvexx.com' },
  'gold-markets-today':  { label: 'Commodities',        color: '#B08700', domain: 'aurexhq.com' },
  'business-pulse':      { label: 'Business Strategy',  color: '#6741D9', domain: 'bizplezx.com' },
  'trust-score':         { label: 'Broker Reviews',     color: '#0CA678', domain: 'verivex.co' },
  'invest-data':         { label: 'Investment Intel',   color: '#0EA5E9', domain: 'invexhuby.com' },
  'market-radar':        { label: 'Market Signals',     color: '#7C3AED', domain: 'signalixx.com' },
  'executive-network':   { label: 'Executive Network',  color: '#3B5BDB', domain: 'execvex.com' },
  'crypto-hub':          { label: 'Crypto Markets',     color: '#F97316', domain: 'cryptoxos.com' },
  'fx-vexx':             { label: 'FX & Brokers',       color: '#0CA678', domain: 'fxvexx.com' },
  'trade-hub-iq':        { label: 'Platform Reviews',   color: '#3B5BDB', domain: 'tradehubiq.com' },
  'jewish-news-now':     { label: 'Jewish News',        color: '#2563EB', domain: 'jewishnewsnow.com' },
  'jewish-property-report': { label: 'Israel Property', color: '#059669', domain: 'jewishpropertyreport.com' },
  'aliya-today':         { label: 'Aliya Guide',        color: '#7C3AED', domain: 'aliyatoday.com' },
}

export default async function InsightsPage() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON)
  const { data: articles } = await db
    .from('news_articles')
    .select('id,title,slug,excerpt,article_type,published_at,news_site_id,news_sites(slug,domain)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(60)

  const categoryCounts: Record<string, number> = {}
  for (const a of articles || []) {
    const siteSlug = (a.news_sites as any)?.slug || ''
    categoryCounts[siteSlug] = (categoryCounts[siteSlug] || 0) + 1
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#F1F5F9', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        .card{background:linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;transition:all .2s}
        .card:hover{border-color:rgba(255,255,255,0.2);transform:translateY(-3px)}
        .tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:.05em}
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 900 }}>
          Rep<span style={{ background: 'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Huby</span>
        </Link>
        <span style={{ color: '#475569', fontSize: 13 }}>Intelligence Hub</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <Link href="/for/forex-brokers" style={{ fontSize: 13, color: '#94A3B8' }}>Forex Brokers</Link>
          <Link href="/for/crypto-exchanges" style={{ fontSize: 13, color: '#94A3B8' }}>Crypto Exchanges</Link>
          <Link href="/portal" style={{ fontSize: 13, color: '#0EA5E9', padding: '6px 16px', border: '1px solid rgba(14,165,233,0.35)', borderRadius: 8 }}>Client Portal</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#0EA5E9', marginBottom: 16 }}>
            ● LIVE INTELLIGENCE FEED
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
            Financial Intelligence Hub
          </h1>
          <p style={{ fontSize: 17, color: '#94A3B8', maxWidth: 600, lineHeight: 1.6 }}>
            Daily analysis from 14 editorial portals covering forex broker regulation, crypto markets, commodities, trade finance, and global investment intelligence.
          </p>
        </div>

        {/* Article grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 20 }}>
          {(articles || []).map((article: any) => {
            const site = article.news_sites as any
            const siteSlug = site?.slug || ''
            const siteDomain = site?.domain || ''
            const portal = PORTAL_LABELS[siteSlug]
            const articleUrl = `https://${siteDomain}/article/${siteSlug}/${article.slug}`
            const date = new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

            return (
              <a key={article.id} href={articleUrl} target="_blank" rel="noopener noreferrer" className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="tag" style={{ background: `${portal?.color || '#475569'}20`, color: portal?.color || '#94A3B8', border: `1px solid ${portal?.color || '#475569'}30` }}>
                    {portal?.label || siteSlug}
                  </span>
                  <span style={{ fontSize: 11, color: '#475569' }}>{date}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 10, color: '#F1F5F9' }}>
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.excerpt}
                  </p>
                )}
                <div style={{ marginTop: 14, fontSize: 12, color: '#0EA5E9', fontWeight: 600 }}>
                  {siteDomain} →
                </div>
              </a>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 80, textAlign: 'center', padding: '48px', background: 'linear-gradient(135deg,rgba(14,165,233,0.08),rgba(129,140,248,0.05))', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 16 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
            Manage Your Brand's Reputation
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
            RepHuby Intelligence publishes 150+ daily articles across 14 financial portals. Get your broker or crypto exchange featured as the trusted authority.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/for/forex-brokers" style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#0EA5E9,#818CF8)', borderRadius: 100, color: '#fff', fontWeight: 700, fontSize: 15 }}>
              Forex Brokers →
            </Link>
            <Link href="/for/crypto-exchanges" style={{ padding: '13px 28px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, color: '#F1F5F9', fontWeight: 600, fontSize: 15 }}>
              Crypto Exchanges →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
