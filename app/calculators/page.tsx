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
        <p style={{ fontSize: 15, color: '#5c4a2e', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
          Practical, interactive tools to help you plan the financial and logistical side of making Aliyah. These give you a fast, personalized starting number — for the full context behind each figure, read the <Link href="/article/aliya-today/2026-07-01-how-to-make-aliyah-2026-complete-step-by-step-guide" style={{ color: P, fontWeight: 700 }}>complete Aliyah guide</Link>. Estimates only — always confirm exact numbers with the official authorities.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 44 }}>
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

      <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderRadius: 12, padding: '28px 30px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>How These Tools Fit Into Your Aliyah Plan</h2>
        <p style={{ fontSize: 14, color: '#5c4a2e', lineHeight: 1.7, marginBottom: 14 }}>
          The <strong>Aliyah Cost Calculator</strong> gives you a first-six-months number by family size and city — pair it with the full <Link href="/article/aliya-today/2026-06-22-cost-of-making-aliyah-2026-complete-budget-for-single-couple-family-olim" style={{ color: P, fontWeight: 700 }}>Cost of Making Aliyah 2026</Link> guide for the single/couple/family breakdown, rent deposits, and the shipping-vs-buying math behind the numbers.
        </p>
        <p style={{ fontSize: 14, color: '#5c4a2e', lineHeight: 1.7, marginBottom: 14 }}>
          The <strong>Sal Klita Calculator</strong> estimates your absorption basket by household — the full <Link href="/article/aliya-today/2026-06-22-sal-klita-2026-the-complete-guide" style={{ color: P, fontWeight: 700 }}>Sal Klita 2026 Guide</Link> covers eligibility, the real payment schedule (it's not a lump sum), and how to apply.
        </p>
        <p style={{ fontSize: 14, color: '#5c4a2e', lineHeight: 1.7 }}>
          The <strong>Best City for Olim Quiz</strong> gives you a personalized city match — see the full <Link href="/article/aliya-today/2026-07-01-best-cities-for-olim-2026-the-complete-comparison-guide" style={{ color: P, fontWeight: 700 }}>Best Cities for Olim comparison</Link> for rent, community, jobs and schools across all nine cities side by side, or browse every guide on the <Link href="/guides" style={{ color: P, fontWeight: 700 }}>All Guides</Link> page.
        </p>
      </div>
    </div>
  )
}
