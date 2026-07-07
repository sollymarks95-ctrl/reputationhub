import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'

const SITE_ID = '9cfd54a9-5e1c-414c-8fe1-12b779013fca'
const P = '#c47d1a'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
  )
}

export const metadata: Metadata = {
  title: 'All Aliyah Guides — Browse by Topic, Country & City',
  description: 'Every AliyaToday guide organized in one place: the Start Here roadmap, country-specific guides (USA, UK, Canada, France, South Africa, Australia), city guides, and topic guides (Process, Documents, Benefits, Money, Housing, Ulpan, Health, Jobs, Security).',
  keywords: 'aliyah guides, moving to israel guide, aliyah checklist, best cities for olim, aliyah from usa, aliyah from uk, aliyah from south africa',
  robots: 'index,follow',
  openGraph: {
    title: 'All Aliyah Guides | AliyaToday',
    description: 'Every AliyaToday guide organized by topic, country and city — Start Here roadmap, country guides, city guides and more.',
    siteName: 'AliyaToday',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Aliyah Guides | AliyaToday',
    description: 'Every AliyaToday guide organized by topic, country and city.',
    site: '@aliyatoday',
  },
}

const TOPIC_ORDER = ['Start Here', 'Process', 'Documents', 'Benefits', 'Money', 'Housing', 'Ulpan', 'Health', 'Jobs', 'Security', 'Community']
const TOPIC_LABEL: Record<string, string> = {
  'Start Here': '🗺️ Start Here',
  Process: '📋 Process & Applications',
  Documents: '🪪 Documents & ID',
  Benefits: '💸 Benefits & Sal Klita',
  Money: '💰 Cost & Money',
  Housing: '🏠 Housing',
  Ulpan: '🗣️ Ulpan & Hebrew',
  Health: '🏥 Health & Kupat Holim',
  Jobs: '💼 Jobs & Work',
  Security: '🛡️ Security',
  Community: '👥 Community & Cities',
}

export default async function GuidesHub() {
  const db = getDb()
  const { data: articles } = await db
    .from('news_articles')
    .select('title, slug, category, excerpt')
    .eq('news_site_id', SITE_ID)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const all = articles || []
  const countryGuides = all.filter(a => a.category === 'Country Guides')
  const byTopic: Record<string, typeof all> = {}
  for (const cat of TOPIC_ORDER) {
    byTopic[cat] = all.filter(a => a.category === cat)
  }

  const cityGuides = all.filter(a => a.category === 'City Guides')
  const communityOther = byTopic['Community']

  // Catch-all: any published guide whose category isn't rendered in a section
  // above must still appear here, so new guides (e.g. a new country guide) are
  // never silently dropped from All Guides regardless of how they're categorised.
  const SHOWN = new Set<string>(['Country Guides', 'City Guides', ...TOPIC_ORDER])
  const otherGuides = all.filter(a => !SHOWN.has((a.category || '').trim()))

  return (
    <div style={{ minHeight: '100vh', background: '#f6f2ea', fontFamily: 'Georgia, serif', color: '#1a0f00' }}>
      <header style={{ background: 'linear-gradient(135deg, #2d1a00 0%, #1a0f00 100%)', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>✈️</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
              Aliya<span style={{ color: P }}>Today</span>
            </div>
          </Link>
          <nav style={{ display: 'flex', gap: 18, fontSize: 13 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,.75)', textDecoration: 'none' }}>Home</Link>
            <Link href="/guides" style={{ color: P, fontWeight: 800, textDecoration: 'none' }}>Guides</Link>
            <Link href="/calculators" style={{ color: 'rgba(255,255,255,.75)', textDecoration: 'none' }}>Calculators</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>Browse Everything</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 10 }}>All Aliyah Guides</h1>
          <p style={{ fontSize: 14.5, color: '#5c4a2e', maxWidth: 600, lineHeight: 1.6 }}>
            Every guide on AliyaToday, organized by topic, country of origin, and city — so you can find exactly what you need without scrolling through a news feed.
          </p>
        </div>

        {/* COUNTRY GUIDES */}
        <Section title="🌍 Aliyah From Your Country" articles={countryGuides} />

        {/* CITY GUIDES */}
        <Section title="🏙️ Best Cities for Olim" articles={cityGuides} />

        {/* TOPIC SECTIONS */}
        {TOPIC_ORDER.filter(c => c !== 'Community' && byTopic[c]?.length > 0).map(cat => (
          <Section key={cat} title={TOPIC_LABEL[cat] || cat} articles={byTopic[cat]} />
        ))}

        {communityOther.length > 0 && <Section title="👥 Community" articles={communityOther} />}

        {/* CATCH-ALL: any guide not shown above (future-proofs new categories) */}
        {otherGuides.length > 0 && <Section title="📚 More Guides" articles={otherGuides} />}

        {/* CALCULATORS CROSS-LINK */}
        <div style={{ background: '#2d1a00', borderRadius: 12, padding: 24, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Prefer a Tool?</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Try the Aliyah Cost Calculator, Sal Klita Calculator, or Best City Quiz</div>
          </div>
          <Link href="/calculators" style={{ padding: '11px 22px', borderRadius: 8, background: P, color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Open Calculators →
          </Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, articles }: { title: string; articles: { title: string; slug: string; excerpt: string | null }[] }) {
  if (!articles || articles.length === 0) return null
  return (
    <div style={{ marginBottom: 30 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #e2d8c8' }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {articles.map(a => (
          <Link key={a.slug} href={`/article/aliya-today/${a.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderRadius: 8, padding: '14px 16px', height: '100%' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>{a.title}</div>
              {a.excerpt && <div style={{ fontSize: 12, color: '#8a7a5c', lineHeight: 1.5 }}>{a.excerpt.slice(0, 90)}{a.excerpt.length > 90 ? '…' : ''}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
