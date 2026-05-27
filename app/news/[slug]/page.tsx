import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site) return {}
  return { title: site.seo_title || site.name, description: site.tagline, robots: 'index, follow' }
}

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }) }

export default async function NewsSitePage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams?: Promise<{ category?: string }> }) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const site = await getNewsSite(slug)
  if (!site) notFound()

  const articles = await getLatestArticles(site.id, 50)
  const p = site.primary_color || '#c0392b'
  
  const cats = [...new Set(articles.map((a: any) => a.category).filter(Boolean))]
  const filtered = sp.category ? articles.filter((a: any) => a.category === sp.category) : articles
  const hero = filtered[0]
  const secondary = filtered.slice(1, 4)
  const rest = filtered.slice(4)
  const trending = [...articles].sort(() => Math.random() - 0.5).slice(0, 5)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}a:hover{color:${p}}`}</style>

      {/* TOP BAR */}
      <div style={{ background: '#111', color: '#aaa', padding: '6px 24px', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
        <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <div style={{ display: 'flex', gap: 16 }}><span>Markets</span><span>Economy</span><span>Analysis</span><span>Subscribe</span></div>
      </div>

      {/* MASTHEAD */}
      <header style={{ background: '#fff', borderBottom: `4px solid ${p}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1260, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href={`/news/${slug}`}><div style={{ fontWeight: 900, fontSize: 32, color: p, letterSpacing: '-1px' }}>{site.name}</div></Link>
            <div style={{ textAlign: 'center', display: 'none' }}>
              <div style={{ fontSize: 11, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase' }}>The world's leading</div>
              <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>{site.tagline}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: '#f0f0f0', borderRadius: 4, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#444' }}>🔍</div>
              <div style={{ background: p, color: '#fff', borderRadius: 4, padding: '7px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Subscribe</div>
            </div>
          </div>
          {/* NAV */}
          <nav style={{ borderTop: '1px solid #eee', height: 44, display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
            <Link href={`/news/${slug}`}><span style={{ padding: '0 16px', height: 44, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 800, color: '#fff', background: p, whiteSpace: 'nowrap' }}>All News</span></Link>
            {cats.slice(0, 8).map((cat: string) => (
              <Link key={cat} href={`/news/${slug}?category=${encodeURIComponent(cat)}`}>
                <span style={{ padding: '0 16px', height: 44, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: sp.category === cat ? 800 : 500, color: sp.category === cat ? p : '#333', borderBottom: sp.category === cat ? `3px solid ${p}` : 'none', whiteSpace: 'nowrap' }}>{cat}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 1260, margin: '0 auto', padding: '24px' }}>

        {!hero && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Content loading...</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Fresh articles are generated daily at 7am.</div>
          </div>
        )}

        {hero && (
          <>
            {/* HERO + TOP STORIES */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
              {/* HERO */}
              <Link href={`/article/${slug}/${hero.slug}`}>
                <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  {hero.cover_image_url && <img src={hero.cover_image_url} alt={hero.title} style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }} />}
                  <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                      {hero.category && <span style={{ background: p, color: '#fff', padding: '3px 8px', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', borderRadius: 2 }}>{hero.category.toUpperCase()}</span>}
                      {hero.is_breaking && <span style={{ background: '#e74c3c', color: '#fff', padding: '3px 8px', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', borderRadius: 2 }}>BREAKING</span>}
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, marginBottom: 12, color: '#111', fontFamily: 'Georgia, serif' }}>{hero.title}</h1>
                    <p style={{ color: '#555', lineHeight: 1.6, fontSize: 15, marginBottom: 14 }}>{hero.excerpt}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#888' }}>
                      <span>By <strong>{hero.author_name || 'Editorial'}</strong> · {hero.published_at ? formatDate(hero.published_at) : ''}</span>
                      <span style={{ color: p, fontWeight: 700 }}>Read full story →</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* RIGHT COLUMN - TOP STORIES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#111', paddingBottom: 10, borderBottom: `3px solid ${p}` }}>Top Stories</div>
                {secondary.map((art: any) => (
                  <Link key={art.slug} href={`/article/${slug}/${art.slug}`}>
                    <div style={{ display: 'flex', gap: 12, background: '#fff', padding: 14, borderRadius: 4, border: '1px solid #e8e8e8', cursor: 'pointer' }}>
                      {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width: 90, height: 66, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                      <div>
                        {art.category && <span style={{ fontSize: 10, fontWeight: 800, color: p, letterSpacing: '0.06em' }}>{art.category.toUpperCase()}</span>}
                        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginTop: 4, color: '#111', fontFamily: 'Georgia, serif' }}>{art.title}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{art.published_at ? timeAgo(art.published_at) : ''}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* MAIN CONTENT + SIDEBAR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
              {/* ARTICLE GRID */}
              <div>
                <div style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#111', paddingBottom: 10, borderBottom: `3px solid ${p}`, marginBottom: 20 }}>
                  {sp.category ? sp.category : 'Latest News'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {rest.map((art: any, i: number) => (
                    <Link key={art.slug} href={`/article/${slug}/${art.slug}`}>
                      <div style={{ display: 'flex', gap: 20, padding: '20px 0', borderBottom: '1px solid #e8e8e8', cursor: 'pointer', background: 'transparent' }}>
                        {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width: 160, height: 110, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                        <div style={{ flex: 1 }}>
                          {art.category && <span style={{ fontSize: 10, fontWeight: 800, color: p, letterSpacing: '0.06em' }}>{art.category.toUpperCase()}</span>}
                          <h3 style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.3, marginTop: 6, marginBottom: 8, color: '#111', fontFamily: 'Georgia, serif' }}>{art.title}</h3>
                          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 10 }}>{art.excerpt}</p>
                          <div style={{ fontSize: 12, color: '#888', display: 'flex', gap: 12 }}>
                            <span>By <strong>{art.author_name || 'Editorial'}</strong></span>
                            <span>{art.published_at ? formatDate(art.published_at) : ''}</span>
                            <span>⏱ {art.read_time_minutes || 5} min</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* SIDEBAR */}
              <div>
                {/* TRENDING */}
                <div style={{ background: '#fff', borderRadius: 4, padding: 20, marginBottom: 20, border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: 10, marginBottom: 14, borderBottom: `3px solid ${p}` }}>🔥 Trending</div>
                  {trending.map((art: any, i: number) => (
                    <Link key={i} href={`/article/${slug}/${art.slug}`}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: '#ddd', lineHeight: 1, flexShrink: 0, minWidth: 28 }}>{i + 1}</span>
                        <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, color: '#111' }}>{art.title}</div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* NEWSLETTER */}
                <div style={{ background: `linear-gradient(135deg, ${p}, #111)`, borderRadius: 4, padding: 20, marginBottom: 20, color: '#fff' }}>
                  <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>📧 Free Newsletter</div>
                  <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginBottom: 14 }}>Top stories from {site.name} delivered daily to your inbox. Join 50,000+ subscribers.</p>
                  <input placeholder="Enter your email" style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 4, fontSize: 13, marginBottom: 8 }} />
                  <button style={{ width: '100%', background: '#fff', color: p, border: 'none', padding: '10px', fontWeight: 900, fontSize: 13, borderRadius: 4, cursor: 'pointer', letterSpacing: '0.05em' }}>GET FREE ACCESS →</button>
                </div>

                {/* CATEGORIES */}
                <div style={{ background: '#fff', borderRadius: 4, padding: 20, border: '1px solid #e8e8e8' }}>
                  <div style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: 10, marginBottom: 14, borderBottom: `3px solid ${p}` }}>Browse Topics</div>
                  {cats.map((cat: string) => (
                    <Link key={cat} href={`/news/${slug}?category=${encodeURIComponent(cat)}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: sp.category === cat ? p : '#333' }}>
                        <span>{cat}</span>
                        <span style={{ color: '#aaa' }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#111', color: '#888', padding: '40px 24px 20px', marginTop: 48 }}>
        <div style={{ maxWidth: 1260, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 24, color: '#fff', marginBottom: 10 }}>{site.name}</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#aaa', maxWidth: 280 }}>{site.tagline || 'Professional intelligence and analysis for global business.'}</p>
            </div>
            {[
              { title: 'News', links: cats.slice(0, 5).map((c: string) => ({ label: c, href: `/news/${slug}?category=${encodeURIComponent(c)}` })) },
              { title: 'Company', links: [{ label: 'About Us', href: `/news/${slug}` }, { label: 'Our Team', href: `/news/${slug}` }, { label: 'Contact', href: `/news/${slug}` }, { label: 'Advertise', href: `/news/${slug}` }] },
              { title: 'Legal', links: [{ label: 'Privacy Policy', href: `/news/${slug}` }, { label: 'Terms of Use', href: `/news/${slug}` }, { label: 'Cookie Policy', href: `/news/${slug}` }, { label: 'Disclaimer', href: `/news/${slug}` }] }
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.title}</div>
                {col.links.map(l => <Link key={l.label} href={l.href}><div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>{l.label}</div></Link>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: 20, fontSize: 12, color: '#555', display: 'flex', justifyContent: 'space-between' }}>
            <span>© {new Date().getFullYear()} {site.name} · RepHub Intelligence Ltd · All rights reserved</span>
            <span>Independent journalism · No bias · No agenda</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
