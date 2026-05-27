import { getNewsSite, getArticle, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ site: string; slug: string }> }) {
  const { site: siteSlug, slug } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) return {}
  const article = await getArticle(site.id, slug)
  if (!article) return {}
  return {
    title: `${article.title} | ${site.name}`,
    description: article.excerpt,
    openGraph: { title: article.title, description: article.excerpt, images: article.cover_image_url ? [article.cover_image_url] : [] },
    robots: 'index, follow',
  }
}

const ROUTE_MAP: Record<string, string> = {
  'global-trade-wire': 'news', 'finance-terminal': 'finance', 'gold-markets-today': 'commodities',
  'business-pulse': 'magazine', 'trust-score': 'reviews-hub', 'company-pedia': 'wiki',
  'press-central': 'pressroom', 'invest-data': 'investdb', 'trade-board': 'forum',
  'global-trade-assoc': 'association', 'executive-network': 'executive', 'market-radar': 'market-radar',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function ArticlePage({ params }: { params: Promise<{ site: string; slug: string }> }) {
  const { site: siteSlug, slug } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) notFound()
  const [article, allArticles] = await Promise.all([
    getArticle(site.id, slug),
    getLatestArticles(site.id, 20)
  ])
  if (!article) notFound()

  const p = site.primary_color || '#c0392b'
  const routePrefix = ROUTE_MAP[siteSlug] || 'news'
  const related = allArticles.filter((a: any) => a.slug !== slug).slice(0, 6)
  const sidebarArticles = allArticles.filter((a: any) => a.slug !== slug).slice(0, 8)
  
  // Parse body paragraphs and inject internal links
  const paragraphs = (article.body || '').split('\n\n').filter(Boolean)
  
  // Get unique categories for navigation
  const cats = [...new Set(allArticles.map((a: any) => a.category).filter(Boolean))].slice(0, 7)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', fontFamily: '"Georgia", "Times New Roman", serif', color: '#1a1a1a' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        a:hover{text-decoration:underline}
        .art-body p{margin-bottom:1.4em;line-height:1.85;font-size:18px;color:#2c2c2c}
        .art-body h2{font-size:22px;font-weight:700;margin:2em 0 0.8em;color:#111;font-family:sans-serif}
        .art-body h3{font-size:19px;font-weight:700;margin:1.6em 0 0.6em;color:#111;font-family:sans-serif}
        .art-body blockquote{border-left:4px solid ${p};padding:12px 20px;margin:1.5em 0;background:#fafafa;font-style:italic;font-size:19px;color:#444}
        .art-body .inline-link{color:${p};font-weight:600}
        .art-body .inline-link:hover{text-decoration:underline}
        .art-body ul{margin:1em 0 1em 2em;line-height:1.8;font-size:17px}
        .art-body li{margin-bottom:0.4em}
        @media(max-width:768px){
          .main-grid{grid-template-columns:1fr!important}
          .sidebar{display:none!important}
          .art-body p{font-size:16px!important}
        }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: '#111', color: '#aaa', padding: '6px 24px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{formatDate(article.published_at || new Date().toISOString())}</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ cursor: 'pointer' }}>Markets</span>
          <span style={{ cursor: 'pointer' }}>Analysis</span>
          <span style={{ cursor: 'pointer' }}>Subscribe</span>
        </div>
      </div>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: `4px solid ${p}`, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: 1260, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href={`/${routePrefix}/${siteSlug}`}>
              <div style={{ fontWeight: 900, fontSize: 28, color: p, letterSpacing: '-1px', fontFamily: 'sans-serif' }}>{site.name}</div>
            </Link>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ background: '#f0f0f0', borderRadius: 4, padding: '6px 14px', fontSize: 13, fontFamily: 'sans-serif', cursor: 'pointer' }}>🔍 Search</div>
              <div style={{ background: p, color: '#fff', borderRadius: 4, padding: '6px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'sans-serif', cursor: 'pointer' }}>Subscribe</div>
            </div>
          </div>
          {/* CATEGORY NAV */}
          <nav style={{ borderTop: '1px solid #eee', height: 40, display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
            <Link href={`/${routePrefix}/${siteSlug}`}>
              <span style={{ padding: '4px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'sans-serif', color: p, borderBottom: `2px solid ${p}`, whiteSpace: 'nowrap' }}>Home</span>
            </Link>
            {cats.map((cat: string) => (
              <Link key={cat} href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                <span style={{ padding: '4px 12px', fontSize: 13, fontFamily: 'sans-serif', color: '#444', whiteSpace: 'nowrap', cursor: 'pointer' }}>{cat}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '8px 24px' }}>
        <div style={{ maxWidth: 1260, margin: '0 auto', fontSize: 12, fontFamily: 'sans-serif', color: '#666', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href={`/${routePrefix}/${siteSlug}`} style={{ color: p }}>Home</Link>
          <span>›</span>
          {article.category && (
            <>
              <Link href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(article.category)}`} style={{ color: p }}>{article.category}</Link>
              <span>›</span>
            </>
          )}
          <span style={{ color: '#888' }}>{article.title.substring(0, 50)}...</span>
        </div>
      </div>

      <div style={{ maxWidth: 1260, margin: '0 auto', padding: '32px 24px' }}>
        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>

          {/* MAIN ARTICLE */}
          <main>
            {/* CATEGORY + BREAKING BADGE */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, fontFamily: 'sans-serif', alignItems: 'center' }}>
              {article.category && (
                <Link href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(article.category)}`}>
                  <span style={{ background: p, color: '#fff', padding: '3px 10px', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', borderRadius: 3 }}>{article.category.toUpperCase()}</span>
                </Link>
              )}
              {article.is_breaking && (
                <span style={{ background: '#e74c3c', color: '#fff', padding: '3px 10px', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', borderRadius: 3 }}>BREAKING</span>
              )}
            </div>

            {/* HEADLINE */}
            <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.5px', fontFamily: 'sans-serif', color: '#111' }}>
              {article.title}
            </h1>

            {/* STANDFIRST / EXCERPT */}
            {article.excerpt && (
              <p style={{ fontSize: 20, color: '#444', lineHeight: 1.6, marginBottom: 20, fontWeight: 400, borderLeft: `4px solid ${p}`, paddingLeft: 16, fontStyle: 'italic' }}>
                {article.excerpt}
              </p>
            )}

            {/* AUTHOR + META BAR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #111', fontFamily: 'sans-serif', flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${p}, #111)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                {(article.author_name || 'E').charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>By {article.author_name || 'Editorial Team'}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {site.name} · {article.published_at ? formatShortDate(article.published_at) : 'Today'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888', marginRight: 8 }}>⏱ {article.read_time_minutes || 5} min read</span>
                {['Share', 'Save', 'Print'].map(action => (
                  <button key={action} onClick={() => {}} style={{ padding: '5px 12px', border: '1px solid #ddd', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 4, color: '#444' }}>{action}</button>
                ))}
              </div>
            </div>

            {/* COVER IMAGE */}
            {article.cover_image_url && (
              <figure style={{ marginBottom: 28 }}>
                <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', maxHeight: 500, objectFit: 'cover', display: 'block', borderRadius: 4 }} />
                <figcaption style={{ fontSize: 12, color: '#888', marginTop: 6, fontFamily: 'sans-serif', fontStyle: 'italic', textAlign: 'center' }}>{site.name} / Editorial</figcaption>
              </figure>
            )}

            {/* ARTICLE BODY */}
            <div className="art-body" style={{ background: '#fff', padding: '32px 36px', borderRadius: 4, marginBottom: 4 }}>
              {paragraphs.map((para: string, i: number) => {
                if (para.startsWith('##')) return <h2 key={i}>{para.replace(/^##\s*/, '')}</h2>
                if (para.startsWith('#')) return <h2 key={i}>{para.replace(/^#\s*/, '')}</h2>
                if (para.startsWith('>')) return <blockquote key={i}>{para.replace(/^>\s*/, '')}</blockquote>
                if (para.startsWith('- ') || para.startsWith('* ')) {
                  const items = para.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '))
                  return <ul key={i}>{items.map((item, j) => <li key={j}>{item.replace(/^[-*]\s*/, '')}</li>)}</ul>
                }
                if (para.toUpperCase() === para && para.length < 80 && para.trim()) {
                  return <h3 key={i}>{para}</h3>
                }
                return <p key={i}>{para}</p>
              })}
            </div>

            {/* TAGS */}
            {article.tags && article.tags.length > 0 && (
              <div style={{ background: '#fff', padding: '16px 36px', borderTop: '1px solid #eee', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontFamily: 'sans-serif', borderRadius: '0 0 4px 4px' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topics:</span>
                {article.tags.map((tag: string) => (
                  <Link key={tag} href={`/${routePrefix}/${siteSlug}?tag=${encodeURIComponent(tag)}`}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: p, border: `1px solid ${p}`, padding: '3px 10px', borderRadius: 3, cursor: 'pointer' }}>{tag}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* AUTHOR BIO BOX */}
            <div style={{ background: '#fff', border: `2px solid ${p}`, borderRadius: 4, padding: '24px', marginTop: 24, fontFamily: 'sans-serif' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${p}, #111)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28, flexShrink: 0 }}>
                  {(article.author_name || 'E').charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#111', marginBottom: 4 }}>{article.author_name || 'Editorial Team'}</div>
                  <div style={{ fontSize: 12, color: p, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{site.name} Correspondent</div>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                    {article.author_name || 'The editorial team'} at {site.name} provides expert analysis and breaking news coverage across global markets, trade intelligence, and business strategy. Our journalists combine deep industry expertise with rigorous reporting standards to deliver actionable intelligence for business leaders worldwide.
                  </p>
                </div>
              </div>
            </div>

            {/* MORE FROM THIS SITE */}
            {related.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <h2 style={{ fontFamily: 'sans-serif', fontSize: 22, fontWeight: 900, marginBottom: 20, paddingBottom: 12, borderBottom: `3px solid ${p}` }}>
                  More from {site.name}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {related.slice(0, 4).map((rel: any) => (
                    <Link key={rel.slug} href={`/article/${siteSlug}/${rel.slug}`}>
                      <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                        {rel.cover_image_url && <img src={rel.cover_image_url} alt={rel.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />}
                        <div style={{ padding: 14 }}>
                          {rel.category && <span style={{ fontSize: 10, fontWeight: 800, color: p, letterSpacing: '0.06em', fontFamily: 'sans-serif' }}>{rel.category.toUpperCase()}</span>}
                          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginTop: 6, marginBottom: 6, fontFamily: 'sans-serif', color: '#111' }}>{rel.title}</div>
                          <div style={{ fontSize: 11, color: '#888', fontFamily: 'sans-serif' }}>{rel.published_at ? timeAgo(rel.published_at) : ''}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* SIDEBAR */}
          <aside className="sidebar" style={{ position: 'sticky', top: 120 }}>
            {/* NEWSLETTER */}
            <div style={{ background: p, borderRadius: 4, padding: 20, marginBottom: 20, color: '#fff', fontFamily: 'sans-serif' }}>
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>📧 Daily Briefing</div>
              <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 14, lineHeight: 1.5 }}>Get the most important stories from {site.name} delivered to your inbox every morning.</p>
              <input placeholder="your@email.com" style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: 4, fontSize: 13, marginBottom: 8, fontFamily: 'sans-serif' }} />
              <button style={{ width: '100%', background: '#111', color: '#fff', border: 'none', padding: '10px', fontWeight: 800, fontSize: 13, borderRadius: 4, cursor: 'pointer', fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>SUBSCRIBE FREE →</button>
            </div>

            {/* LATEST ARTICLES */}
            <div style={{ background: '#fff', borderRadius: 4, padding: 20, marginBottom: 20, border: '1px solid #eee' }}>
              <h3 style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: 16, paddingBottom: 10, marginBottom: 14, borderBottom: `3px solid ${p}`, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111' }}>
                Latest
              </h3>
              {sidebarArticles.slice(0, 6).map((rel: any, i: number) => (
                <Link key={i} href={`/article/${siteSlug}/${rel.slug}`}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: i < 5 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer' }}>
                    {rel.cover_image_url && <img src={rel.cover_image_url} alt="" style={{ width: 76, height: 54, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                    <div>
                      {rel.category && <span style={{ fontSize: 10, fontWeight: 800, color: p, letterSpacing: '0.06em', fontFamily: 'sans-serif' }}>{rel.category.toUpperCase()}</span>}
                      <div style={{ fontFamily: 'sans-serif', fontWeight: 700, fontSize: 13, lineHeight: 1.35, color: '#111', marginTop: 2 }}>{rel.title}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4, fontFamily: 'sans-serif' }}>{rel.published_at ? timeAgo(rel.published_at) : ''}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* MOST READ */}
            <div style={{ background: '#fff', borderRadius: 4, padding: 20, marginBottom: 20, border: '1px solid #eee' }}>
              <h3 style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: 16, paddingBottom: 10, marginBottom: 14, borderBottom: `3px solid ${p}`, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111' }}>
                Most Read
              </h3>
              {sidebarArticles.slice(1, 6).map((rel: any, i: number) => (
                <Link key={i} href={`/article/${siteSlug}/${rel.slug}`}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#ddd', lineHeight: 1, flexShrink: 0, fontFamily: 'sans-serif' }}>{i + 1}</span>
                    <div style={{ fontFamily: 'sans-serif', fontWeight: 700, fontSize: 13, lineHeight: 1.35, color: '#111' }}>{rel.title}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* TOPICS */}
            <div style={{ background: '#fff', borderRadius: 4, padding: 20, border: '1px solid #eee' }}>
              <h3 style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: 16, paddingBottom: 10, marginBottom: 14, borderBottom: `3px solid ${p}`, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111' }}>Topics</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cats.map((cat: string) => (
                  <Link key={cat} href={`/${routePrefix}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: p, border: `1px solid ${p}`, padding: '4px 12px', borderRadius: 3, fontFamily: 'sans-serif', cursor: 'pointer', display: 'block' }}>{cat}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#111', color: '#888', padding: '40px 24px 20px', marginTop: 48, fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: 1260, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 12 }}>{site.name}</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#aaa' }}>{site.tagline || 'Global business intelligence and market analysis.'}</p>
            </div>
            {[
              { title: 'Coverage', links: cats.slice(0, 4).map((c: string) => ({ label: c, href: `/${routePrefix}/${siteSlug}?category=${encodeURIComponent(c)}` })) },
              { title: 'Company', links: [{ label: 'About', href: `/${routePrefix}/${siteSlug}` }, { label: 'Contact', href: `/${routePrefix}/${siteSlug}` }, { label: 'Advertise', href: `/${routePrefix}/${siteSlug}` }, { label: 'Subscribe', href: `/${routePrefix}/${siteSlug}` }] },
              { title: 'Legal', links: [{ label: 'Privacy Policy', href: `/${routePrefix}/${siteSlug}` }, { label: 'Terms of Use', href: `/${routePrefix}/${siteSlug}` }, { label: 'Cookie Policy', href: `/${routePrefix}/${siteSlug}` }, { label: 'Disclaimer', href: `/${routePrefix}/${siteSlug}` }] }
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.title}</div>
                {col.links.map((link) => (
                  <Link key={link.label} href={link.href}>
                    <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8, cursor: 'pointer' }}>{link.label}</div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#666' }}>
            <span>© {new Date().getFullYear()} {site.name} · RepHub Intelligence Ltd · 71-75 Shelton Street, London WC2H 9JQ</span>
            <span>Regulated information for professional use only</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
