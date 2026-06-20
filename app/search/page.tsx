import { supabase } from '@/lib/supabase'
import { SITES, ID_TO_SLUG, homeHref, resolveSite, slugForSite } from '@/app/lib/sites'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Per-site quick categories shown on the empty (no-query) state, so the search
// page feels native to whichever portal it was opened from rather than dumping
// visitors into the generic cross-network browse grid.
const SITE_CATEGORIES: Record<string, string[]> = {
  'aliya-today': ['Process', 'Housing', 'Ulpan', 'Benefits', 'Culture', 'Community', 'Tips'],
}

export async function generateMetadata({ searchParams }: { searchParams?: Promise<{ q?: string; site?: string }> }) {
  const sp = searchParams ? await searchParams : {}
  const site = resolveSite(sp.site)
  const label = site ? site.name : 'RepHuby'
  return { title: `Search: ${sp.q || ''} | ${label}`, description: `Search articles on ${label}`, robots: 'noindex' }
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string; site?: string; category?: string }> }) {
  const sp = searchParams ? await searchParams : {}
  const q = (sp.q || '').trim()
  const site = resolveSite(sp.site)
  const siteSlug = site ? slugForSite(site) : ''
  const accent = site?.accent || '#3b82f6'
  let results: any[] = []

  if (q.length >= 2) {
    let query = supabase.from('news_articles')
      .select('id, title, slug, excerpt, category, cover_image_url, published_at, read_time_minutes, author_name, news_site_id')
      .eq('status', 'published')
    if (site) query = query.eq('news_site_id', site.id)
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,category.ilike.%${q}%`)
    const { data } = await query.order('published_at', { ascending: false }).limit(30)
    results = data || []
  }

  // Only fetch the cross-network site grid when we're not already scoped to one site.
  const { data: allSites } = site ? { data: null } : await supabase.from('news_sites').select('id,name,primary_color').eq('is_live', true).order('name')

  const quickCats = siteSlug ? SITE_CATEGORIES[siteSlug] : null

  return (
    <div style={{ minHeight: '100vh', background: site ? '#fff8f0' : '#f8f8f8', fontFamily: site ? 'Georgia, serif' : 'sans-serif' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}`}</style>

      <header style={{ background: site ? 'linear-gradient(135deg, #2d1a00 0%, #1a0f00 100%)' : '#111827', padding: '16px 24px', borderBottom: `3px solid ${accent}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Link href={site ? homeHref(siteSlug) : '/'}>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 12, fontFamily: site ? 'Georgia, serif' : 'sans-serif' }}>
              {site ? `${site.emoji} Search ${site.name}` : '🌐 RepHuby Global Search'}
            </div>
          </Link>
          <form action="/search" method="GET">
            {site && <input type="hidden" name="site" value={siteSlug} />}
            <div style={{ display: 'flex', gap: 8 }}>
              <input name="q" defaultValue={q} placeholder="Search articles, guides, analysis..." autoFocus
                style={{ flex: 1, padding: '12px 16px', borderRadius: 6, border: 'none', fontSize: 15, outline: 'none' }} />
              <button type="submit" style={{ background: accent, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Search
              </button>
            </div>
          </form>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        {q.length >= 2 ? (
          <>
            <div style={{ marginBottom: 20, fontSize: 14, color: '#6b7280' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "<strong style={{ color: '#111' }}>{q}</strong>"
              {site ? ` on ${site.name}` : ''}
            </div>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>No results found</div>
                <p style={{ color: '#6b7280', marginTop: 8 }}>Try different keywords{site ? '' : ', or browse our sites below'}</p>
              </div>
            ) : results.map((art: any) => {
              const resultSlug = ID_TO_SLUG[art.news_site_id] || 'global-trade-wire'
              return (
                <Link key={art.id} href={`/article/${resultSlug}/${art.slug}`}>
                  <div style={{ display: 'flex', gap: 16, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16, marginBottom: 12, cursor: 'pointer' }}>
                    {art.cover_image_url && <img src={art.cover_image_url} alt="" style={{ width: 120, height: 84, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      {art.category && <span style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{art.category}</span>}
                      <h3 style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: '4px 0 6px', lineHeight: 1.35, fontFamily: 'Georgia, serif' }}>{art.title}</h3>
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>{art.excerpt?.slice(0, 160)}...</p>
                      <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', gap: 12 }}>
                        <span>By {art.author_name || 'Editorial'}</span>
                        <span>·</span>
                        <span>{art.published_at ? new Date(art.published_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                        <span>·</span>
                        <span>{art.read_time_minutes || 5} min</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </>
        ) : site ? (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#1a0f00', fontFamily: 'Georgia, serif' }}>
              {site.emoji} Search {site.name}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Type a keyword above, or jump to a topic:</p>
            {quickCats && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {quickCats.map(c => (
                  <Link key={c} href={`/search?site=${siteSlug}&q=${encodeURIComponent(c)}`}>
                    <div style={{ background: '#fff', border: `2px solid ${accent}40`, borderRadius: 20, padding: '10px 20px', fontWeight: 700, fontSize: 13, color: accent, cursor: 'pointer' }}>
                      {c}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: '#374151' }}>Browse All Publications</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {allSites?.map((s: any) => {
                const slug = ID_TO_SLUG[s.id]
                return (
                  <Link key={s.id} href={slug ? homeHref(slug) : '/'}>
                    <div style={{ background: '#fff', border: `2px solid ${s.primary_color || '#e5e7eb'}`, borderRadius: 8, padding: 16, cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ width: 36, height: 36, background: s.primary_color || '#3b82f6', borderRadius: 6, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>
                        {s.name.charAt(0)}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{s.name}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
