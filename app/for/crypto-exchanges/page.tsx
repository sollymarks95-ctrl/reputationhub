import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Crypto Exchange Reputation Management — RepHuby Intelligence',
  description: 'RepHuby Intelligence manages the online reputation of crypto exchanges and blockchain projects through 14 financial editorial portals, daily crypto market coverage, and verified platform reviews.',
  keywords: 'crypto reputation management, crypto exchange reputation, blockchain reputation management, cryptocurrency reputation, crypto brand management, crypto exchange reviews, DeFi reputation management',
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  openGraph: {
    title: 'Crypto Exchange & Blockchain Reputation Management | RepHuby',
    description: 'Build trust for your crypto exchange with 14 editorial portals, 150+ daily articles, and AI-optimised content that positions you as the authoritative voice in crypto.',
    type: 'website',
  }
}

export default function CryptoExchangesPage() {
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
          <Link href="/for/forex-brokers" style={{ fontSize: 13, color: '#94A3B8' }}>Forex Brokers</Link>
          <Link href="/portal" style={{ fontSize: 13, color: '#0EA5E9', padding: '6px 16px', border: '1px solid rgba(14,165,233,0.35)', borderRadius: 8 }}>Client Portal</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ display: 'inline-flex', gap: 8, padding: '5px 14px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#F97316', marginBottom: 24 }}>
            CRYPTO REPUTATION MANAGEMENT
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24 }}>
            Crypto Exchanges Need<br />
            <span style={{ background: 'linear-gradient(135deg,#F97316,#EAB308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Real Editorial Authority
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.65 }}>
            In an industry defined by trust, RepHuby Intelligence builds the editorial infrastructure that makes crypto exchanges, DeFi platforms, and blockchain projects the trusted recommendation across Google, AI engines, and financial media.
          </p>
          <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', background: 'linear-gradient(135deg,#F97316,#EAB308)', borderRadius: 100, color: '#000', fontWeight: 700, fontSize: 16 }}>
            Get Started →
          </a>
        </div>

        {/* Portals for crypto */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 32 }}>Crypto-Focused Editorial Portals</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {[
              { name: 'CRYPTOXOS', domain: 'cryptoxos.com', desc: 'On-chain research, DeFi analysis, protocol reviews, and crypto market intelligence', color: '#F97316' },
              { name: 'INVEXHUBY', domain: 'invexhuby.com', desc: 'Institutional investment intelligence covering crypto assets, tokenomics, and portfolio strategy', color: '#0EA5E9' },
              { name: 'TRADEHUBIQ', domain: 'tradehubiq.com', desc: 'Platform and exchange reviews for retail crypto traders', color: '#3B5BDB' },
              { name: 'VERIVEX', domain: 'verivex.co', desc: 'Trust scores and verified reviews for crypto platforms and brokers', color: '#0CA678' },
            ].map(p => (
              <a key={p.domain} href={`https://${p.domain}`} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'block' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color, marginBottom: 8, letterSpacing: '.05em' }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{p.desc}</div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#475569' }}>{p.domain} ↗</div>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 32 }}>Crypto Reputation Management — FAQ</h2>
          {[
            { q: 'Why does a crypto exchange need reputation management?', a: 'Crypto traders research extensively before depositing funds. A single negative article, unaddressed community complaint, or absence from AI search recommendations can cost an exchange millions in lost deposits. Proactive editorial infrastructure ensures your exchange appears as the trusted, regulated choice across every search touchpoint.' },
            { q: 'How does RepHuby build trust for crypto exchanges?', a: 'RepHuby publishes daily editorial content across dedicated crypto portals (Cryptoxos, InvexHuby, TradeHubIQ), featuring your exchange in market analysis, protocol reviews, and industry news. Combined with structured review data and AI entity optimisation, your brand becomes the recommendation that Google and AI engines serve to high-intent traders.' },
            { q: 'Can RepHuby help a crypto exchange rank on Google?', a: 'Yes. Our portals target low-competition, high-intent crypto keywords across 14 independent domains. As each portal builds topical authority, articles featuring your exchange accumulate ranking power. Clients typically see organic mentions appearing in search within 60-90 days.' },
            { q: 'Does RepHuby work for DeFi protocols and blockchain projects?', a: 'Yes — RepHuby works with any financial brand that needs credibility building. DeFi protocols, Layer 1 blockchains, NFT platforms, and Web3 projects all benefit from consistent editorial coverage that positions them as legitimate, technically credible projects in a space where trust is scarce.' },
          ].map(item => (
            <details key={item.q} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 0' }}>
              <summary style={{ fontSize: 16, fontWeight: 600, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                {item.q} <span style={{ color: '#F97316' }}>+</span>
              </summary>
              <p style={{ marginTop: 14, fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{item.a}</p>
            </details>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '56px 32px', background: 'linear-gradient(135deg,rgba(249,115,22,0.08),rgba(234,179,8,0.05))', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 16 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>Build Your Exchange's Editorial Authority</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 32 }}>150+ daily articles across 14 portals. Your crypto brand as the trusted answer on Google and AI engines.</p>
          <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '15px 40px', background: 'linear-gradient(135deg,#F97316,#EAB308)', borderRadius: 100, color: '#000', fontWeight: 700, fontSize: 17 }}>
            Talk to Us on Telegram →
          </a>
        </div>
      </div>
    </div>
  )
}
