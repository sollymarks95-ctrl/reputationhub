import { getNewsSite, getArticlesByCategory, getArticleCountByCategory, getLatestArticles } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 1800

const DOMAIN_MAP: Record<string, string> = {
  'global-trade-wire':   'https://nex-wire.com',
  'finance-terminal':    'https://finvexx.com',
  'business-pulse':      'https://bizplezx.com',
  'gold-markets-today':  'https://aurexhq.com',
  'trust-score':         'https://verivex.co',
  'invest-data':         'https://invexhuby.com',
  'market-radar':        'https://signalixx.com',
  'executive-network':   'https://execvex.com',
  'crypto-hub':          'https://cryptoxos.com',
  'fx-vexx':             'https://fxvexx.com',
  'trade-hub-iq':        'https://tradehubiq.com',
  'jewish-news-now':     'https://jewishnewsnow.com',
  'jewish-property-report': 'https://jewishpropertyreport.com',
  'aliya-today':         'https://aliyatoday.com',
}

export async function generateMetadata({ params }: { params: Promise<{ site: string; cat: string }> }): Promise<Metadata> {
  const { site: siteSlug, cat } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) return {}
  const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g,' ')
  const base = DOMAIN_MAP[siteSlug] || `https://rephuby.com`
  return {
    title: `${catLabel} — ${site.name}`,
    description: `Latest ${catLabel} coverage from ${site.name}. ${site.tagline || ''}`,
    robots: site.noindex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large',
    alternates: { canonical: `${base}/article/${siteSlug}/category/${cat}` },
    openGraph: {
      title: `${catLabel} — ${site.name}`,
      description: `All ${catLabel} articles from ${site.name}`,
      type: 'website', siteName: site.name, url: `${base}/article/${siteSlug}/category/${cat}`,
    },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ site: string; cat: string }> }) {
  const { site: siteSlug, cat } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) notFound()

  const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g,' ')
  const base     = DOMAIN_MAP[siteSlug] || 'https://rephuby.com'
  const articles = await getArticlesByCategory(site.id, catLabel, 30)
  const totalCount = await getArticleCountByCategory(site.id, catLabel)
  const latest   = await getLatestArticles(site.id, 6)
  const color    = site.primary_color || '#1971C2'

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.name, item: base },
      { '@type': 'ListItem', position: 2, name: catLabel, item: `${base}/article/${siteSlug}/category/${cat}` },
    ]
  })

  const collectionSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${catLabel} — ${site.name}`,
    url: `${base}/article/${siteSlug}/category/${cat}`,
    description: `All ${catLabel} articles from ${site.name}`,
    publisher: { '@type': 'Organization', name: site.name, url: base },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.slice(0, 10).map((a: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${base}/article/${siteSlug}/${a.slug}`,
        name: a.title,
      }))
    }
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: collectionSchema }} />
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ background: color, color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: '#fff', fontWeight: 900, fontSize: 18, textDecoration: 'none' }}>{site.name}</Link>
          <span style={{ opacity: .5 }}>›</span>
          <span style={{ fontWeight: 700 }}>{catLabel}</span>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
          {/* Main — article list */}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#111' }}>{catLabel}</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
              {totalCount > articles.length
                ? `Showing ${articles.length} of ${totalCount} articles`
                : `${totalCount} articles`} · {site.name}
            </p>

            {articles.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#999', background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0' }}>
                No articles in this category yet — check back soon.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {articles.map((a: any) => (
                <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} style={{ display: 'flex', gap: 16, background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e8e8e8', textDecoration: 'none', transition: 'box-shadow .15s' }}>
                  {a.cover_image_url && (
                    <img src={a.cover_image_url} alt={a.title} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} loading="lazy" />
                  )}
                  <div>
                    <div style={{ fontSize: 11, color: color, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{catLabel}</div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1.35, marginBottom: 6 }}>{a.title}</h2>
                    {a.excerpt && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.excerpt}</p>}
                    <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                      {a.author_name} · {new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar — latest + network */}
          <aside>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${color}` }}>
                Latest from {site.name}
              </div>
              {latest.map((a: any) => (
                <Link key={a.id} href={`/article/${siteSlug}/${a.slug}`} style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.35, marginBottom: 3 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                </Link>
              ))}
            </div>

            {/* Network portals */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#333', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                RepHuby Network
              </div>
              {Object.entries(DOMAIN_MAP).filter(([k]) => k !== siteSlug).slice(0, 6).map(([slug, domain]) => (
                <a key={slug} href={domain} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 13, color: '#555', padding: '6px 0', borderBottom: '1px solid #f5f5f5', textDecoration: 'none' }}>
                  {domain.replace('https://','').replace('www.','')} ↗
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
