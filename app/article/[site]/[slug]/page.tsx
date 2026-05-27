import { getNewsSite, getArticle, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function UniversalArticle({ params }: { params: Promise<{ site: string; slug: string }> }) {
  const { site: siteSlug, slug } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) notFound()
  const [article, related] = await Promise.all([
    getArticle(site.id, slug),
    getLatestArticles(site.id, 5)
  ])
  if (!article) notFound()

  const p = site.primary_color || '#c0392b'
  const relatedFiltered = related.filter((r: any) => r.slug !== slug).slice(0, 4)

  // Detect site type for proper back link
  const siteTypeRoutes: Record<string, string> = {
    'news': 'news', 'finance': 'finance', 'commodities': 'commodities',
    'magazine': 'magazine', 'reviews': 'reviews-hub', 'wiki': 'wiki',
    'pressroom': 'pressroom', 'investdb': 'investdb', 'forum': 'forum',
    'association': 'association', 'executive': 'executive', 'markets': 'market-radar'
  }
  const siteType = site.site_type || 'news'
  const routePrefix = siteTypeRoutes[siteType] || 'news'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: '"Helvetica Neue", Arial, sans-serif', color: '#111' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}`}</style>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: `3px solid ${p}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={`/${routePrefix}/${siteSlug}`}>
            <div style={{ fontWeight: 900, fontSize: 22, color: p, letterSpacing: '-0.5px' }}>
              ← {site.name}
            </div>
          </Link>
          <div style={{ fontSize: 12, color: '#888' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
        {/* ARTICLE */}
        <article>
          {article.category && (
            <div style={{ fontSize: 12, color: p, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 12 }}>
              {article.category.toUpperCase()}
            </div>
          )}
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.5px' }}>
            {article.title}
          </h1>
          {article.excerpt && (
            <p style={{ fontSize: 18, color: '#444', lineHeight: 1.6, marginBottom: 20, borderLeft: `4px solid ${p}`, paddingLeft: 16, fontStyle: 'italic' }}>
              {article.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #111' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: p, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
              {article.author_name?.charAt(0) || 'E'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{article.author_name || 'Editorial Team'}</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {article.published_at ? new Date(article.published_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} · {article.read_time_minutes} min read
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {['Share', 'Save'].map(a => (
                <button key={a} style={{ padding: '6px 14px', border: '1px solid #ddd', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 4 }}>{a}</button>
              ))}
            </div>
          </div>

          {article.cover_image_url && (
            <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', maxHeight: 460, objectFit: 'cover', display: 'block', marginBottom: 28, borderRadius: 4 }} />
          )}

          <div style={{ background: '#fff', padding: '32px', lineHeight: 1.8, fontSize: 17, color: '#222', borderRadius: 4 }}>
            {(article.body || '').split('\n\n').map((para: string, i: number) => (
              <p key={i} style={{ marginBottom: 20 }}>{para}</p>
            ))}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div style={{ background: '#fff', padding: '16px', marginTop: 2, borderTop: '1px solid #eee', display: 'flex', gap: 8, flexWrap: 'wrap', borderRadius: '0 0 4px 4px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#888' }}>TOPICS:</span>
              {article.tags.map((tag: string) => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 700, color: p, border: `1px solid ${p}`, padding: '3px 10px', borderRadius: 4 }}>{tag}</span>
              ))}
            </div>
          )}
        </article>

        {/* SIDEBAR */}
        <aside>
          {relatedFiltered.length > 0 && (
            <div style={{ background: '#fff', padding: 20, marginBottom: 16, borderRadius: 4, border: '1px solid #eee' }}>
              <h3 style={{ fontWeight: 800, fontSize: 14, borderBottom: `2px solid ${p}`, paddingBottom: 10, marginBottom: 16 }}>More Stories</h3>
              {relatedFiltered.map((rel: any, i: number) => (
                <Link key={i} href={`/article/${siteSlug}/${rel.slug}`}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}>
                    {rel.cover_image_url && <img src={rel.cover_image_url} alt="" style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: '#111' }}>{rel.title}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{rel.published_at ? timeAgo(rel.published_at) : ''}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div style={{ background: p, borderRadius: 4, padding: 20, color: '#fff' }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Newsletter</div>
            <p style={{ fontSize: 13, opacity: .85, marginBottom: 14 }}>Get the latest from {site.name} delivered daily.</p>
            <input placeholder="Your email" style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 4, fontSize: 13, marginBottom: 8 }} />
            <button style={{ width: '100%', background: '#fff', color: p, border: 'none', padding: 10, fontWeight: 800, fontSize: 13, borderRadius: 4, cursor: 'pointer' }}>SUBSCRIBE →</button>
          </div>
        </aside>
      </main>

      <footer style={{ background: '#111', color: '#666', padding: '24px', marginTop: 32, textAlign: 'center', fontSize: 12 }}>
        © {new Date().getFullYear()} {site.name} · RepHub Media Ltd · 71-75 Shelton Street, London WC2H 9JQ · Terms · Privacy · Cookies
      </footer>
    </div>
  )
}
