import { getNewsSite, getLatestArticles, getFeaturedArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

async function getLiveNews() {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const r = await fetch(`${base}/api/live-data?type=topnews`, { next: { revalidate: 600 } })
    return await r.json()
  } catch { return [] }
}

export default async function MagazineSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const [featured, latest, liveNews] = await Promise.all([
    getFeaturedArticles(site.id, 5),
    getLatestArticles(site.id, 12),
    getLiveNews()
  ])
  const p = site.primary_color || '#c0392b'
  const hero = featured[0] || latest[0]
  const grid = [...featured.slice(1), ...latest].slice(0, 6)
  const allNews = [...latest, ...liveNews.slice(0, 6)]
  const cats = site.categories || ['Business', 'Leadership', 'Markets', 'Innovation']

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '"Helvetica Neue", Arial, sans-serif', color: '#111' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.hov:hover h2,.hov:hover h3{color:${p}!important}.hov:hover{opacity:.92}`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+3:wght@300;400;600;700&display=swap" rel="stylesheet" />

      {/* TOP BAR */}
      <div style={{ background: p, padding: '8px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Subscribe', 'Newsletter', 'Advertise'].map(i => (
              <a key={i} href="#" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, letterSpacing: '0.06em' }}>{i.toUpperCase()}</a>
            ))}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header style={{ borderBottom: '3px solid #111', padding: '20px 0 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 900, fontSize: 52, letterSpacing: '-2px', color: '#111', lineHeight: 1 }}>
              {site.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: '#888', letterSpacing: '0.2em', marginTop: 6, fontWeight: 600 }}>
              {site.tagline?.toUpperCase() || 'BUSINESS · LEADERSHIP · MARKETS'}
            </div>
          </div>
          <nav style={{ display: 'flex', justifyContent: 'center', gap: 0, borderTop: '1px solid #ddd', paddingTop: 0 }}>
            {['Home', ...cats].map((c, i) => (
              <a key={c} href="#" style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: i === 0 ? p : '#333', borderTop: i === 0 ? `3px solid ${p}` : '3px solid transparent', marginTop: -1 }}>
                {c.toUpperCase()}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {!hero ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
            <p style={{ fontSize: 18 }}>Content auto-generating — check back soon.</p>
          </div>
        ) : (
          <>
            {/* HERO */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, marginBottom: 40, borderBottom: '2px solid #111', paddingBottom: 32 }}>
              <Link href={`/magazine/${slug}/article/${hero.slug}`} className="hov">
                <div style={{ paddingRight: 32 }}>
                  {hero.cover_image_url ? <img src={hero.cover_image_url} alt="" style={{ width: '100%', height: 380, objectFit: 'cover', marginBottom: 20, display: 'block' }} />
                    : <div style={{ width: '100%', height: 380, background: `linear-gradient(135deg, #111, ${p}88)`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>📰</div>}
                  <div style={{ fontSize: 11, color: p, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>{hero.category?.toUpperCase()}</div>
                  <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 36, fontWeight: 900, lineHeight: 1.2, marginBottom: 14, transition: 'color .15s' }}>{hero.title}</h2>
                  <p style={{ fontSize: 16, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>{hero.excerpt}</p>
                  <div style={{ fontSize: 12, color: '#999' }}>By {hero.author_name} · {hero.published_at ? timeAgo(hero.published_at) : 'Now'} · {hero.read_time_minutes} min</div>
                </div>
              </Link>
              <div style={{ borderLeft: '1px solid #eee', paddingLeft: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: '#888', marginBottom: 16 }}>TOP STORIES</div>
                {allNews.slice(0, 5).map((a: any, i: number) => (
                  <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 10, color: p, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>{a.category?.toUpperCase() || 'BUSINESS'}</div>
                    <div style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: '#111' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{a.published_at ? timeAgo(a.published_at) : a.publishedAt ? timeAgo(a.publishedAt) : ''}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28, marginBottom: 40 }}>
              {grid.slice(0, 6).map((a: any, i: number) => (
                <Link key={i} href={`/magazine/${slug}/article/${a.slug || '#'}`} className="hov">
                  <div>
                    {a.cover_image_url ? <img src={a.cover_image_url} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', marginBottom: 12 }} />
                      : <div style={{ width: '100%', height: 180, background: `${p}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 12 }}>📊</div>}
                    <div style={{ fontSize: 10, color: p, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>{a.category?.toUpperCase() || 'BUSINESS'}</div>
                    <h3 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 18, fontWeight: 700, lineHeight: 1.3, transition: 'color .15s', marginBottom: 8 }}>{a.title}</h3>
                    <div style={{ fontSize: 12, color: '#999' }}>{a.published_at ? timeAgo(a.published_at) : ''}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ background: '#111', color: '#aaa', marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 12 }}>{site.name}</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#777' }}>{site.description}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                {['𝕏', 'in', 'f', '📷'].map((icon, i) => (
                  <a key={i} href="#" style={{ width: 32, height: 32, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, textDecoration: 'none' }}>{icon}</a>
                ))}
              </div>
            </div>
            {[
              { title: 'Sections', links: cats.slice(0, 5) },
              { title: 'Company', links: ['About Us', 'Advertise', 'Careers', 'Contact', 'Privacy Policy'] },
              { title: 'Follow Us', links: ['Twitter / X', 'LinkedIn', 'Facebook', 'Newsletter', 'RSS Feed'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: '#fff', marginBottom: 16 }}>{title.toUpperCase()}</div>
                {links.map(l => <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: '#777', marginBottom: 8, textDecoration: 'none' }}>{l}</a>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #222', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555' }}>
            <span>© {new Date().getFullYear()} {site.name}. All rights reserved. RepHub Media Ltd, 71-75 Shelton Street, London WC2H 9JQ</span>
            <span>Terms · Privacy · Cookies · Disclaimer</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
