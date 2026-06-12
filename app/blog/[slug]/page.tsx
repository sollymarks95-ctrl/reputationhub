import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const SITE_ID = '35579979-ca5e-476f-bd75-9be5910fe29b'

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const db = getDb()
  const { data: a } = await db.from('news_articles').select('title,excerpt').eq('slug', slug).eq('news_site_id', SITE_ID).single()
  if (!a) return { title: 'Not Found' }
  return {
    title: a.title,
    description: a.excerpt || a.title,
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: { title: a.title, description: a.excerpt || '', type: 'article', siteName: 'RepHuby Intelligence' },
  }
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = getDb()
  const { data: a } = await db
    .from('news_articles')
    .select('id,title,slug,excerpt,body,author,published_at,tags')
    .eq('slug', slug).eq('news_site_id', SITE_ID).eq('status', 'published').single()
  if (!a) notFound()

  // Related articles
  const { data: related } = await db
    .from('news_articles')
    .select('id,title,slug,excerpt')
    .eq('news_site_id', SITE_ID).eq('status', 'published')
    .neq('slug', slug).order('published_at', { ascending: false }).limit(4)

  const date = new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const readTime = Math.ceil((a.body || '').replace(/<[^>]+>/g, '').split(' ').length / 200)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt,
    datePublished: a.published_at,
    dateModified: a.published_at,
    author: { '@type': 'Person', name: a.author || 'RepHuby Intelligence Editorial' },
    publisher: {
      '@type': 'Organization',
      name: 'RepHuby Intelligence',
      url: 'https://rephuby.com',
      logo: { '@type': 'ImageObject', url: 'https://rephuby.com/favicon.ico' }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://rephuby.com/blog/${a.slug}` },
    about: { '@type': 'Thing', name: 'Broker Reputation Management' },
    keywords: 'broker reputation management, forex broker reputation, crypto reputation management',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#F1F5F9', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        .prose h2{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin:36px 0 14px;color:#F1F5F9}
        .prose h3{font-size:19px;font-weight:700;margin:28px 0 10px;color:#E2E8F0}
        .prose p{font-size:16px;line-height:1.8;color:#94A3B8;margin-bottom:18px}
        .prose ul,.prose ol{padding-left:24px;margin-bottom:18px}
        .prose li{font-size:16px;line-height:1.7;color:#94A3B8;margin-bottom:6px}
        .prose table{width:100%;border-collapse:collapse;margin:28px 0;font-size:14px}
        .prose th{background:rgba(14,165,233,0.12);padding:11px 14px;text-align:left;font-weight:700;color:#F1F5F9;border:1px solid rgba(255,255,255,0.1)}
        .prose td{padding:10px 14px;color:#94A3B8;border:1px solid rgba(255,255,255,0.07)}
        .prose tr:nth-child(even) td{background:rgba(255,255,255,0.02)}
        .prose a{color:#0EA5E9;text-decoration:underline}
        .prose strong{color:#F1F5F9;font-weight:600}
        .related-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:18px;transition:all .2s;display:block}
        .related-card:hover{border-color:rgba(14,165,233,0.3);transform:translateY(-2px)}
      `}</style>

      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/" style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 900 }}>
          Rep<span style={{ background: 'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Huby</span>
        </Link>
        <Link href="/blog" style={{ fontSize: 13, color: '#64748B' }}>← Blog</Link>
        <div style={{ marginLeft: 'auto' }}>
          <a href="https://t.me/Benrephuby" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#0EA5E9', padding: '6px 16px', border: '1px solid rgba(14,165,233,0.35)', borderRadius: 8 }}>Talk to Us →</a>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '52px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, fontSize: 13, color: '#475569', marginBottom: 28 }}>
          <Link href="/" style={{ color: '#475569' }}>RepHuby</Link>
          <span>/</span>
          <Link href="/blog" style={{ color: '#475569' }}>Blog</Link>
          <span>/</span>
          <span style={{ color: '#94A3B8' }}>Guide</span>
        </div>

        {/* Article header */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 100, fontSize: 11, fontWeight: 600, color: '#0EA5E9', marginBottom: 18 }}>
            REPUTATION STRATEGY
          </span>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20, color: '#F1F5F9' }}>
            {a.title}
          </h1>
          {a.excerpt && (
            <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.65, marginBottom: 24, borderLeft: '3px solid #0EA5E9', paddingLeft: 16 }}>
              {a.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#475569', flexWrap: 'wrap' }}>
            <span>By {a.author || 'RepHuby Intelligence Editorial'}</span>
            <span>{date}</span>
            <span>{readTime} min read</span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 40 }} />

        {/* Article body */}
        <div className="prose" dangerouslySetInnerHTML={{ __html: a.body || '' }} />

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '48px 0' }} />

        {/* CTA */}
        <div style={{ padding: '36px', background: 'linear-gradient(135deg,rgba(14,165,233,0.08),rgba(129,140,248,0.04))', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 14, textAlign: 'center', marginBottom: 48 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Want This Done For Your Brand?</h3>
          <p style={{ color: '#64748B', marginBottom: 20, fontSize: 14 }}>We'll review your broker or crypto brand's current reputation position and show you exactly what's possible.</p>
          <a href="https://t.me/Benrephuby" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#0EA5E9,#818CF8)', borderRadius: 100, color: '#fff', fontWeight: 700, fontSize: 14 }}>
            Talk to Us on Telegram →
          </a>
        </div>

        {/* Related */}
        {related && related.length > 0 && (
          <div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 20 }}>More Reputation Guides</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {related.map((r: any) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="related-card">
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 8, color: '#E2E8F0' }}>{r.title}</div>
                  {r.excerpt && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.excerpt}</div>}
                  <div style={{ marginTop: 10, fontSize: 12, color: '#0EA5E9', fontWeight: 600 }}>Read →</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
