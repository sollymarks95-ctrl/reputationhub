import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const revalidate = 900

export const metadata: Metadata = {
  title: 'Reputation Management Blog — Broker & Crypto Brand Strategy',
  description: 'Expert guides on broker reputation management, crypto exchange brand strategy, AI engine optimisation for financial brands, and online review management for regulated brokers.',
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  openGraph: {
    title: 'RepHuby Intelligence Blog — Reputation Management Guides',
    description: 'Practitioner guides on forex broker reputation, crypto brand management, AI engine optimisation, and review management strategies.',
    type: 'website',
  }
}

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

export default async function BlogPage() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON)
  const { data: articles } = await db
    .from('news_articles')
    .select('id,title,slug,excerpt,published_at,author')
    .eq('news_site_id', '35579979-ca5e-476f-bd75-9be5910fe29b')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#F1F5F9', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        .card{background:linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:28px;transition:all .2s;display:block}
        .card:hover{border-color:rgba(14,165,233,0.4);transform:translateY(-3px)}
      `}</style>

      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 900 }}>
          Rep<span style={{ background: 'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Huby</span>
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/insights" style={{ fontSize: 13, color: '#94A3B8' }}>Intelligence Hub</Link>
          <Link href="/for/forex-brokers" style={{ fontSize: 13, color: '#94A3B8' }}>Forex Brokers</Link>
          <Link href="/for/crypto-exchanges" style={{ fontSize: 13, color: '#94A3B8' }}>Crypto</Link>
          <Link href="/portal" style={{ fontSize: 13, color: '#0EA5E9', padding: '6px 16px', border: '1px solid rgba(14,165,233,0.35)', borderRadius: 8 }}>Client Portal</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', padding: '4px 14px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#0EA5E9', marginBottom: 16 }}>
            REPUTATION MANAGEMENT GUIDES
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, marginBottom: 16 }}>
            Broker & Crypto Reputation<br />Management Blog
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.65, maxWidth: 560 }}>
            Practitioner guides on building, protecting, and scaling the online reputation of regulated forex brokers, crypto exchanges, and financial brands.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(!articles || articles.length === 0) && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              First articles publishing today — check back shortly.
            </div>
          )}
          {(articles || []).map((a: any) => (
            <Link key={a.id} href={`/blog/${a.slug}`} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0EA5E9', padding: '3px 10px', background: 'rgba(14,165,233,0.1)', borderRadius: 100 }}>
                  Reputation Strategy
                </span>
                <span style={{ fontSize: 11, color: '#475569' }}>
                  {new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, marginBottom: 10, color: '#F1F5F9' }}>{a.title}</h2>
              {a.excerpt && <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.55 }}>{a.excerpt}</p>}
              <div style={{ marginTop: 16, fontSize: 13, color: '#0EA5E9', fontWeight: 600 }}>Read guide →</div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 64, padding: '40px', background: 'linear-gradient(135deg,rgba(14,165,233,0.08),rgba(129,140,248,0.04))', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 14, textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Ready to Build Your Reputation?</h2>
          <p style={{ color: '#64748B', marginBottom: 24, fontSize: 15 }}>Talk to us on Telegram — we'll review your brand's current Google position for free.</p>
          <a href="https://t.me/Benrephuby" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '13px 32px', background: 'linear-gradient(135deg,#0EA5E9,#818CF8)', borderRadius: 100, color: '#fff', fontWeight: 700, fontSize: 15 }}>
            Message Us on Telegram →
          </a>
        </div>
      </div>
    </div>
  )
}
