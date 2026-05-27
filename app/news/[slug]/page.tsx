import { getNewsSite, getFeaturedArticles, getLatestArticles, getBreakingNews, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function NewsSiteHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()

  const [featured, latest, breaking] = await Promise.all([
    getFeaturedArticles(site.id, 6),
    getLatestArticles(site.id, 16),
    getBreakingNews(site.id),
  ])

  const hero = featured[0]
  const secondaryFeatured = featured.slice(1, 4)
  const sideArticles = latest.slice(0, 8)
  const primary = site.primary_color || '#bb1919'
  const categories = site.categories || ['World', 'Business', 'Technology', 'Markets']

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f2', fontFamily: "'Georgia', serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .article-card:hover h3 { color: ${primary}; }
        .nav-link:hover { color: ${primary} !important; }
        .breaking-ticker { animation: ticker 30s linear infinite; }
        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: '#1a1a1a', padding: '6px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#999', fontFamily: 'Arial, sans-serif' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Sign In', 'Subscribe', 'Newsletter'].map(item => (
              <a key={item} href="#" style={{ fontSize: 11, color: '#999', fontFamily: 'Arial, sans-serif' }} className="nav-link">{item}</a>
            ))}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: `4px solid ${primary}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Link href={`/news/${slug}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div style={{
                  background: primary, color: '#fff',
                  fontFamily: 'Arial Black, sans-serif', fontWeight: 900,
                  fontSize: 28, padding: '4px 10px', letterSpacing: '-0.5px'
                }}>
                  {site.name.split(' ').map((w: string) => w.charAt(0)).join('').slice(0, 3).toUpperCase()}
                </div>
                <div style={{
                  background: '#1a1a1a', color: '#fff',
                  fontFamily: 'Arial Black, sans-serif', fontWeight: 900,
                  fontSize: 28, padding: '4px 10px', letterSpacing: '-0.5px'
                }}>
                  {site.name.toUpperCase()}
                </div>
              </div>
            </Link>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#666', fontFamily: 'Arial, sans-serif' }}>{site.tagline || 'Global Business & Trade News'}</div>
            </div>
          </div>

          {/* NAV */}
          <nav style={{ display: 'flex', gap: 0, borderTop: '1px solid #e5e5e5', paddingTop: 12 }}>
            {['Home', ...categories].map((cat, i) => (
              <a key={cat} href={cat === 'Home' ? `/news/${slug}` : `/news/${slug}/category/${cat.toLowerCase()}`}
                className="nav-link"
                style={{
                  padding: '6px 14px', fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: 700,
                  color: i === 0 ? primary : '#1a1a1a',
                  borderBottom: i === 0 ? `3px solid ${primary}` : '3px solid transparent',
                  display: 'inline-block'
                }}>
                {cat}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* BREAKING NEWS TICKER */}
      {breaking.length > 0 && (
        <div style={{ background: primary, overflow: 'hidden', height: 32, display: 'flex', alignItems: 'center' }}>
          <div style={{
            background: '#1a1a1a', color: '#fff', padding: '0 14px', height: '100%',
            display: 'flex', alignItems: 'center',
            fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 11,
            letterSpacing: '0.08em', whiteSpace: 'nowrap', flexShrink: 0
          }}>
            BREAKING
          </div>
          <div style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
            <div className="breaking-ticker" style={{ whiteSpace: 'nowrap', color: '#fff', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
              {breaking.map((b: any, i: number) => (
                <span key={b.slug}>
                  <Link href={`/news/${slug}/article/${b.slug}`} style={{ color: '#fff' }}>
                    {b.title}
                  </Link>
                  {i < breaking.length - 1 && <span style={{ margin: '0 24px', opacity: 0.5 }}>●</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>

        {latest.length === 0 ? (
          /* EMPTY STATE */
          <div style={{ background: '#fff', borderRadius: 4, padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📰</div>
            <h2 style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 28, color: '#1a1a1a', marginBottom: 12 }}>
              No articles published yet
            </h2>
            <p style={{ color: '#666', fontSize: 16, marginBottom: 24 }}>
              Go to the dashboard to publish your first article and it will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>

            {/* LEFT — Main stories */}
            <div>
              {/* HERO STORY */}
              {hero && (
                <Link href={`/news/${slug}/article/${hero.slug}`}>
                  <div className="article-card" style={{
                    background: '#fff', marginBottom: 20, cursor: 'pointer',
                    borderBottom: `3px solid ${primary}`
                  }}>
                    {hero.cover_image_url ? (
                      <img src={hero.cover_image_url} alt={hero.title}
                        style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: 420, background: `linear-gradient(135deg, #1a1a1a, ${primary}66)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: 80 }}>📰</span>
                      </div>
                    )}
                    <div style={{ padding: '20px 24px 24px' }}>
                      {hero.is_breaking && (
                        <div style={{
                          display: 'inline-block', background: primary, color: '#fff',
                          fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: 900,
                          padding: '2px 8px', marginBottom: 10, letterSpacing: '0.06em'
                        }}>
                          BREAKING
                        </div>
                      )}
                      {hero.category && (
                        <div style={{ fontSize: 12, color: primary, fontFamily: 'Arial, sans-serif', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>
                          {hero.category.toUpperCase()}
                        </div>
                      )}
                      <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 32, color: '#1a1a1a', lineHeight: 1.2, marginBottom: 12, transition: 'color 0.15s' }}>
                        {hero.title}
                      </h2>
                      <p style={{ color: '#444', fontSize: 16, lineHeight: 1.6, marginBottom: 14 }}>
                        {hero.excerpt}
                      </p>
                      <div style={{ fontSize: 12, color: '#888', fontFamily: 'Arial, sans-serif' }}>
                        By {hero.author_name} · {hero.published_at ? timeAgo(hero.published_at) : ''} · {hero.read_time_minutes} min read
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* SECONDARY FEATURED — 3 column */}
              {secondaryFeatured.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 20 }}>
                  {secondaryFeatured.map((article: any) => (
                    <Link key={article.id} href={`/news/${slug}/article/${article.slug}`}>
                      <div className="article-card" style={{ background: '#fff', cursor: 'pointer' }}>
                        {article.cover_image_url ? (
                          <img src={article.cover_image_url} alt={article.title}
                            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: 160, background: `linear-gradient(135deg, #2a2a2a, ${primary}44)` }} />
                        )}
                        <div style={{ padding: '12px 14px 16px' }}>
                          {article.category && (
                            <div style={{ fontSize: 10, color: primary, fontFamily: 'Arial, sans-serif', fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em' }}>
                              {article.category.toUpperCase()}
                            </div>
                          )}
                          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, transition: 'color 0.15s' }}>
                            {article.title}
                          </h3>
                          <div style={{ fontSize: 11, color: '#888', fontFamily: 'Arial, sans-serif', marginTop: 8 }}>
                            {article.published_at ? timeAgo(article.published_at) : ''}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* MORE STORIES */}
              <div style={{ background: '#fff', padding: '16px 20px' }}>
                <h2 style={{
                  fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 16,
                  color: '#1a1a1a', borderBottom: `3px solid ${primary}`,
                  paddingBottom: 10, marginBottom: 16, letterSpacing: '-0.02em'
                }}>
                  More Stories
                </h2>
                {latest.slice(4).map((article: any, i: number) => (
                  <Link key={article.id} href={`/news/${slug}/article/${article.slug}`}>
                    <div className="article-card" style={{
                      display: 'flex', gap: 14, paddingBottom: 14,
                      marginBottom: 14, cursor: 'pointer',
                      borderBottom: i < latest.slice(4).length - 1 ? '1px solid #e5e5e5' : 'none'
                    }}>
                      {article.cover_image_url ? (
                        <img src={article.cover_image_url} alt={article.title}
                          style={{ width: 100, height: 68, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 100, height: 68, background: '#e5e5e5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📰</div>
                      )}
                      <div style={{ flex: 1 }}>
                        {article.category && (
                          <div style={{ fontSize: 10, color: primary, fontFamily: 'Arial, sans-serif', fontWeight: 700, marginBottom: 4, letterSpacing: '0.06em' }}>
                            {article.category.toUpperCase()}
                          </div>
                        )}
                        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, transition: 'color 0.15s' }}>
                          {article.title}
                        </h3>
                        <div style={{ fontSize: 11, color: '#888', fontFamily: 'Arial, sans-serif', marginTop: 6 }}>
                          {article.published_at ? timeAgo(article.published_at) : ''} · {article.read_time_minutes} min read
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div>
              {/* Most Read */}
              <div style={{ background: '#fff', padding: '16px 20px', marginBottom: 20 }}>
                <h3 style={{
                  fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 14,
                  borderBottom: `3px solid ${primary}`, paddingBottom: 10, marginBottom: 14,
                  letterSpacing: '-0.01em'
                }}>
                  Most Read
                </h3>
                {sideArticles.map((article: any, i: number) => (
                  <Link key={article.id} href={`/news/${slug}/article/${article.slug}`}>
                    <div className="article-card" style={{
                      display: 'flex', gap: 12, marginBottom: 14,
                      paddingBottom: 14, cursor: 'pointer',
                      borderBottom: i < sideArticles.length - 1 ? '1px solid #e5e5e5' : 'none'
                    }}>
                      <div style={{
                        fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 28,
                        color: '#e5e5e5', width: 28, flexShrink: 0, lineHeight: 1
                      }}>
                        {i + 1}
                      </div>
                      <h4 style={{
                        fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700,
                        color: '#1a1a1a', lineHeight: 1.3, transition: 'color 0.15s'
                      }}>
                        {article.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Newsletter signup */}
              <div style={{ background: '#1a1a1a', padding: '20px', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff', marginBottom: 8 }}>
                  Daily Briefing
                </h3>
                <p style={{ fontSize: 13, color: '#999', marginBottom: 16, lineHeight: 1.5 }}>
                  Get the top stories in global trade and business — every morning.
                </p>
                <input placeholder="Your email address" style={{
                  width: '100%', padding: '10px 14px', border: 'none',
                  fontSize: 13, marginBottom: 10, fontFamily: 'Arial, sans-serif'
                }} />
                <button style={{
                  width: '100%', background: primary, color: '#fff', border: 'none',
                  padding: '10px', fontFamily: 'Arial, sans-serif', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em'
                }}>
                  SUBSCRIBE FREE
                </button>
              </div>

              {/* Categories */}
              <div style={{ background: '#fff', padding: '16px 20px' }}>
                <h3 style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 14, borderBottom: `3px solid ${primary}`, paddingBottom: 10, marginBottom: 14 }}>
                  Browse by Topic
                </h3>
                {categories.map((cat: string) => (
                  <Link key={cat} href={`/news/${slug}/category/${cat.toLowerCase()}`}>
                    <div style={{
                      padding: '10px 0', borderBottom: '1px solid #e5e5e5',
                      fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 700,
                      color: '#1a1a1a', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer'
                    }}>
                      {cat} <span style={{ color: primary }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ background: '#1a1a1a', marginTop: 40, padding: '40px 20px 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
            <div style={{ background: primary, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: 20, padding: '3px 8px' }}>
              {site.name.split(' ').map((w: string) => w.charAt(0)).join('').slice(0, 3).toUpperCase()}
            </div>
            <div style={{ background: '#fff', color: '#1a1a1a', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: 20, padding: '3px 8px' }}>
              {site.name.toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
            {categories.slice(0, 5).map((cat: string) => (
              <a key={cat} href={`/news/${slug}/category/${cat.toLowerCase()}`}
                style={{ color: '#999', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>{cat}</a>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </span>
            <span style={{ color: '#444', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
              Terms · Privacy · Cookies
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
