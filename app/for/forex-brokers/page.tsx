import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Forex Broker Reputation Management — RepHuby Intelligence',
  description: 'RepHuby Intelligence manages the online reputation of forex brokers through 14 financial editorial portals, 150+ daily articles, and verified broker reviews across FCA, CySEC, and ASIC regulated markets.',
  keywords: 'forex broker reputation management, broker reputation management, forex broker online reputation, broker review management, forex brand reputation, FCA broker reputation, regulated broker reviews',
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  openGraph: {
    title: 'Forex Broker Reputation Management | RepHuby Intelligence',
    description: '14 financial editorial portals. 150+ daily articles. Verified broker reviews. The reputation infrastructure trusted by regulated forex brokers.',
    type: 'website',
  }
}

const STATS = [
  { value: '14', label: 'Editorial Portals' },
  { value: '150+', label: 'Daily Articles' },
  { value: '585+', label: 'Verified Reviews' },
  { value: '2,000+', label: 'Published Articles' },
]

const PORTALS = [
  { name: 'VERIVEX', domain: 'verivex.co', desc: 'Verified broker safety scores and regulatory reviews', color: '#0CA678' },
  { name: 'FINVEXX', domain: 'finvexx.com', desc: 'Financial markets data and forex analysis', color: '#0EA5E9' },
  { name: 'FXVEXX', domain: 'fxvexx.com', desc: 'FX broker intelligence and regulatory compliance reporting', color: '#0CA678' },
  { name: 'SIGNALIXX', domain: 'signalixx.com', desc: 'Market signals, trading strategies, and platform analysis', color: '#7C3AED' },
]

export default function ForexBrokersPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#F1F5F9', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        h1,h2,h3{font-family:'Syne',sans-serif}
        .card{background:linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:28px}
      `}</style>

      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 900 }}>
          Rep<span style={{ background: 'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Huby</span>
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <Link href="/insights" style={{ fontSize: 13, color: '#94A3B8' }}>Intelligence Hub</Link>
          <Link href="/for/crypto-exchanges" style={{ fontSize: 13, color: '#94A3B8' }}>Crypto Exchanges</Link>
          <Link href="/portal" style={{ fontSize: 13, color: '#0EA5E9', padding: '6px 16px', border: '1px solid rgba(14,165,233,0.35)', borderRadius: 8 }}>Client Portal</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ display: 'inline-flex', gap: 8, padding: '5px 14px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#0EA5E9', marginBottom: 24 }}>
            FOREX BROKER REPUTATION MANAGEMENT
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24 }}>
            The Reputation Infrastructure<br />
            <span style={{ background: 'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Forex Brokers Trust
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.65 }}>
            RepHuby Intelligence publishes daily editorial content across 14 financial portals, positioning regulated forex brokers as trusted authorities in the eyes of Google, Perplexity, and ChatGPT.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#0EA5E9,#818CF8)', borderRadius: 100, color: '#fff', fontWeight: 700, fontSize: 16 }}>
              Get Started →
            </a>
            <Link href="/insights" style={{ padding: '14px 32px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, color: '#F1F5F9', fontWeight: 600, fontSize: 16 }}>
              View Intelligence Hub
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 72 }}>
          {STATS.map(s => (
            <div key={s.value} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 900, fontFamily: "'Syne',sans-serif", background: 'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 40, textAlign: 'center' }}>How Forex Broker Reputation Management Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {[
              { step: '01', title: 'Editorial Content at Scale', body: 'We publish 10-30 articles per portal per day across 14 financial portals. Your broker appears as a trusted reference in news about regulation, markets, and industry analysis — not as an ad.' },
              { step: '02', title: 'Verified Review Infrastructure', body: 'Verivex.co publishes verified broker reviews with detailed regulatory scoring (FCA, CySEC, ASIC). 585+ reviews already live. Google trusts structured, schema-marked review content.' },
              { step: '03', title: 'AI Engine Optimisation', body: 'Each article is built with structured data (FinancialService schema, FAQPage, mentions) so Perplexity, ChatGPT, and Google AI Overviews cite your brand as the authoritative answer.' },
              { step: '04', title: 'Consistent Entity Memory', body: 'The same authoritative description of your broker appears across 14 independent editorial sources. AI models build brand memory from repeated consistent facts — making you the default recommendation.' },
            ].map(item => (
              <div key={item.step} className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0EA5E9', marginBottom: 12 }}>{item.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Portals */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8 }}>Dedicated Forex & Broker Portals</h2>
          <p style={{ color: '#64748B', marginBottom: 32 }}>Your brand featured across the portals most relevant to regulated forex brokers:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {PORTALS.map(p => (
              <a key={p.domain} href={`https://${p.domain}`} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'block' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color, marginBottom: 8, letterSpacing: '.05em' }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{p.desc}</div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#475569' }}>{p.domain} ↗</div>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ — targets PAA */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 32 }}>Forex Broker Reputation Management — FAQ</h2>
          {[
            { q: 'What is forex broker reputation management?', a: 'Forex broker reputation management is the practice of building, monitoring, and protecting a broker\'s online presence across review sites, editorial publications, and AI search engines. It involves generating positive editorial coverage, managing verified reviews, and ensuring the broker appears as a trusted authority in search results.' },
            { q: 'How long does it take to improve a forex broker\'s online reputation?', a: 'With RepHuby\'s publishing infrastructure, new editorial content appears within 24 hours. Search rankings improve over 60-90 days as Google indexes the content. AI engine citations (Perplexity, ChatGPT) typically update faster — often within 30 days of consistent publishing.' },
            { q: 'Can reputation management help a regulated forex broker get more clients?', a: 'Yes. Traders searching for regulated forex brokers research online before depositing. A broker that appears as the trusted editorial recommendation across multiple financial portals and AI engines converts at significantly higher rates than one buried in paid ads.' },
            { q: 'How does RepHuby differ from traditional ORM agencies?', a: 'Traditional ORM agencies suppress negative content reactively. RepHuby builds proactive editorial infrastructure — 14 financial portals publishing 150+ daily articles — that establishes your broker as a genuine market authority before any crisis occurs.' },
          ].map(item => (
            <details key={item.q} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 0' }}>
              <summary style={{ fontSize: 16, fontWeight: 600, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                {item.q} <span style={{ color: '#0EA5E9' }}>+</span>
              </summary>
              <p style={{ marginTop: 14, fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{item.a}</p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '56px 32px', background: 'linear-gradient(135deg,rgba(14,165,233,0.08),rgba(16,185,129,0.05))', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 16 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>Ready to Own Your Reputation?</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 32 }}>Join regulated brokers who appear as the trusted authority across 14 financial portals and AI search engines.</p>
          <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '15px 40px', background: 'linear-gradient(135deg,#0EA5E9,#818CF8)', borderRadius: 100, color: '#fff', fontWeight: 700, fontSize: 17 }}>
            Talk to Us on Telegram →
          </a>
        </div>
      </div>
    </div>
  )
}
