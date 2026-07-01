import Link from 'next/link'

const P = '#c47d1a'

const TOOLS = [
  {
    href: '/calculators/aliyah-cost',
    emoji: '💰',
    title: 'Aliyah Cost Calculator',
    desc: 'Estimate your first six months of costs — flights, temporary housing, setup and buffer — based on your family size and city.',
  },
  {
    href: '/calculators/sal-klita',
    emoji: '🏛️',
    title: 'Sal Klita Calculator',
    desc: "Estimate your absorption basket payments based on age, family size and number of children.",
  },
  {
    href: '/calculators/best-city',
    emoji: '🗺️',
    title: 'Best City for Olim Quiz',
    desc: 'Answer a few quick questions about budget, family and lifestyle to get a personalized city recommendation.',
  },
]

export default function CalculatorsHub() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>Free Tools</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Aliyah Calculators &amp; Tools</h1>
        <p style={{ fontSize: 15, color: '#5c4a2e', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Practical, interactive tools to help you plan the financial and logistical side of making Aliyah. Estimates only — always confirm exact numbers with the official authorities.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {TOOLS.map(t => (
          <Link key={t.href} href={t.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderRadius: 12, padding: 26, height: '100%', transition: 'box-shadow .2s' }}>
              <div style={{ fontSize: 34, marginBottom: 12 }}>{t.emoji}</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#1a0f00' }}>{t.title}</h2>
              <p style={{ fontSize: 13.5, color: '#6b5a3e', lineHeight: 1.6 }}>{t.desc}</p>
              <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 800, color: P }}>Try it →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
