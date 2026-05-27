import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function WikiSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const articles = await getLatestArticles(site.id, 20)
  const p = site.primary_color || '#3366cc'
  const cats = site.categories || ['Companies', 'Industry', 'Finance', 'People']

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '"Linux Libertine","Georgia",serif', color: '#202122' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{color:${p};text-decoration:none}.wa:hover{text-decoration:underline}`}</style>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #a2a9b1' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg, ${p}, ${p}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 20 }}>
              {site.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#202122', fontFamily: '"Linux Libertine",Georgia,serif' }}>{site.name}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{site.tagline || 'The Free Business Encyclopedia'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            <input placeholder="Search articles..." style={{ border: '1px solid #a2a9b1', padding: '6px 12px', fontSize: 13, width: 220, fontFamily: 'sans-serif', outline: 'none' }} />
            <button style={{ background: '#f8f9fa', border: '1px solid #a2a9b1', borderLeft: 'none', padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Go</button>
          </div>
        </div>
        <nav style={{ background: '#f8f9fa', borderTop: '1px solid #a2a9b1', padding: '0 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
            {['Main Page', ...cats].map((c, i) => (
              <a key={c} href='javascript:void(0)' className="wa" style={{ padding: '8px 14px', fontSize: 13, color: i === 0 ? '#202122' : p, borderBottom: i === 0 ? '3px solid #202122' : '3px solid transparent', background: i === 0 ? '#fff' : 'transparent', marginBottom: -1, display: 'inline-block', fontFamily: 'sans-serif' }}>{c}</a>
            ))}
          </div>
        </nav>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32 }}>
        <div>
          {/* Featured article */}
          <div style={{ border: '1px solid #a2a9b1', padding: 20, marginBottom: 24, background: '#f8f9fa' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#202122', borderBottom: '1px solid #a2a9b1', paddingBottom: 8, marginBottom: 12, fontFamily: 'sans-serif' }}>
              📌 Featured Article
            </div>
            {articles[0] ? (
              <div style={{ display: 'flex', gap: 16 }}>
                {articles[0].cover_image_url && <img src={articles[0].cover_image_url} alt="" style={{ width: 120, height: 90, objectFit: 'cover', float: 'right', marginLeft: 16, flexShrink: 0 }} />}
                <div>
                  <Link href={`/article/${slug}/${articles[0].slug}`} className="wa">
                    <div style={{ fontFamily: '"Linux Libertine",Georgia,serif', fontSize: 22, fontWeight: 700, color: p, marginBottom: 8 }}>{articles[0].title}</div>
                  </Link>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: '#202122' }}>{articles[0].excerpt}</p>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 8, fontFamily: 'sans-serif' }}>Published: {articles[0].published_at ? new Date(articles[0].published_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}</div>
                </div>
              </div>
            ) : <p style={{ fontSize: 14, color: '#555' }}>Content auto-generating — check back soon.</p>}
          </div>

          {/* All articles as wiki entries */}
          <div style={{ border: '1px solid #a2a9b1' }}>
            <div style={{ background: '#f8f9fa', padding: '8px 16px', borderBottom: '1px solid #a2a9b1', fontSize: 13, fontWeight: 700, fontFamily: 'sans-serif', display: 'flex', justifyContent: 'space-between' }}>
              <span>Recent Entries</span>
              <span style={{ color: '#555', fontWeight: 400 }}>{articles.length} articles</span>
            </div>
            {articles.slice(1).map((a: any, i: number) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #eaecf0', display: 'flex', gap: 12 }}>
                <div style={{ fontSize: 22, color: '#a2a9b1', fontWeight: 700, width: 30, flexShrink: 0, fontFamily: 'sans-serif', paddingTop: 2 }}>
                  {String(i + 2).padStart(2, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#555', fontFamily: 'sans-serif', marginBottom: 3 }}>{a.category || 'Business'} · {a.published_at ? timeAgo(a.published_at) : ''}</div>
                  <Link href={`/article/${slug}/${a.slug}`} className="wa">
                    <div style={{ fontSize: 16, fontWeight: 700, color: p, marginBottom: 4 }}>{a.title}</div>
                  </Link>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{a.excerpt?.slice(0, 120)}...</p>
                </div>
                {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width: 80, height: 56, objectFit: 'cover', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <div>
          <div style={{ border: '1px solid #a2a9b1', marginBottom: 16 }}>
            <div style={{ background: '#f8f9fa', padding: '8px 12px', borderBottom: '1px solid #a2a9b1', fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif' }}>ABOUT {site.name.toUpperCase()}</div>
            <div style={{ padding: 12 }}>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#555' }}>{site.description}</p>
              <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'sans-serif' }}>
                <div><strong>Articles:</strong> {articles.length}</div>
                <div><strong>Language:</strong> English</div>
                <div><strong>Updated:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          <div style={{ border: '1px solid #a2a9b1', marginBottom: 16 }}>
            <div style={{ background: '#f8f9fa', padding: '8px 12px', borderBottom: '1px solid #a2a9b1', fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif' }}>CATEGORIES</div>
            <div style={{ padding: 12 }}>
              {cats.map((c: string) => <a key={c} href='javascript:void(0)' className="wa" style={{ display: 'block', fontSize: 13, color: p, marginBottom: 6 }}>📁 {c}</a>)}
            </div>
          </div>
          <div style={{ border: '1px solid #a2a9b1' }}>
            <div style={{ background: '#f8f9fa', padding: '8px 12px', borderBottom: '1px solid #a2a9b1', fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif' }}>TOOLS</div>
            <div style={{ padding: 12 }}>
              {['What links here', 'Related changes', 'Cite this page', 'Print/export', 'RSS Feed'].map(t => <a key={t} href='javascript:void(0)' className="wa" style={{ display: 'block', fontSize: 13, color: p, marginBottom: 6 }}>{t}</a>)}
            </div>
          </div>
        </div>
      </main>

      <footer style={{ background: '#f8f9fa', borderTop: '1px solid #a2a9b1', marginTop: 32, padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 12 }}>
            {['Privacy Policy', 'Terms of Use', 'About', 'Disclaimers', 'Contact'].map(l => <a key={l} href='javascript:void(0)' className="wa" style={{ fontSize: 12, color: p }}>{l}</a>)}
          </div>
          <p style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
            Text is available under the <a href='javascript:void(0)' style={{ color: p }}>Creative Commons Attribution License</a>. {site.name} is operated by RepHub Media Ltd, 71-75 Shelton Street, London WC2H 9JQ. Content is auto-generated for informational purposes only.
          </p>
          <p style={{ fontSize: 11, color: '#888', marginTop: 6 }}>© {new Date().getFullYear()} {site.name} · Not affiliated with Wikimedia Foundation</p>
        </div>
      </footer>
    </div>
  )
}
