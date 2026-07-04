import { getNewsSite, getLatestArticles } from '@/lib/news'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const DOMAIN_MAP: Record<string,string> = {
  'global-trade-wire':'https://nex-wire.com','finance-terminal':'https://finvexx.com',
  'business-pulse':'https://bizplezx.com','gold-markets-today':'https://aurexhq.com',
  'trust-score':'https://verivex.co','invest-data':'https://invexhuby.com',
  'market-radar':'https://signalixx.com','executive-network':'https://execvex.com',
  'crypto-hub':'https://cryptoxos.com','fx-vexx':'https://fxvexx.com',
  'trade-hub-iq':'https://tradehubiq.com','aliya-today':'https://aliyatoday.com',
  'jewish-news-now':'https://jewishnewsnow.com','jewish-property-report':'https://jewishpropertyreport.com',
  'copy-trade-iq':'https://copyvexx.com','expat-invest-iq':'https://expatinvestiq.com',
  'rephuby-intelligence':'https://rephuby.com',
}

export async function generateMetadata({ params }: { params: Promise<{ site: string; cat: string }> }): Promise<Metadata> {
  const { site: siteSlug, cat } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) return {}
  const BASE = DOMAIN_MAP[siteSlug] || 'https://rephuby.com'
  const catLabel = decodeURIComponent(cat).replace(/-/g, ' ')
  const catTitleCase = catLabel.replace(/\b\w/g, l => l.toUpperCase())
  return {
    title: `${catTitleCase} — ${site.name}`,
    description: `Browse all ${catTitleCase} articles from ${site.name}. Expert analysis, guides, and intelligence on ${catLabel}.`,
    alternates: { canonical: `${BASE}/article/${siteSlug}/category/${cat}` },
    robots: 'index, follow',
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ site: string; cat: string }> }) {
  const { site: siteSlug, cat } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) notFound()

  const catLabel = decodeURIComponent(cat).replace(/-/g, ' ')
  const allArticles = await getLatestArticles(site.id, 200)
  const articles = allArticles.filter((a: any) =>
    (a.category || '').toLowerCase().replace(/\s+/g, '-') === cat.toLowerCase() ||
    (a.category || '').toLowerCase().includes(catLabel.toLowerCase())
  )

  const BASE = DOMAIN_MAP[siteSlug] || 'https://rephuby.com'
  const p = site.primary_color || '#1a56b0'
  const isJewish = ['aliya-today','jewish-news-now','jewish-property-report'].includes(siteSlug)

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.name, item: BASE },
      { '@type': 'ListItem', position: 2, name: decodeURIComponent(cat).replace(/-/g,' ').replace(/\b\w/g, l => l.toUpperCase()), item: `${BASE}/article/${siteSlug}/category/${cat}` },
    ]
  }

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${decodeURIComponent(cat).replace(/-/g,' ').replace(/\b\w/g, l => l.toUpperCase())} — ${site.name}`,
    url: `${BASE}/article/${siteSlug}/category/${cat}`,
    description: `All ${catLabel} articles from ${site.name}`,
    publisher: { '@type': 'NewsMediaOrganization', name: site.name, url: BASE },
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })

  return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:'system-ui,sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:`3px solid ${p}`, padding:'16px 20px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <Link href={`${BASE}/`} style={{ color:p, fontWeight:800, fontSize:18, textDecoration:'none' }}>
            ← {site.name}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>
        {/* Category hero */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'inline-block', background:`${p}15`, color:p, padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
            Category
          </div>
          <h1 style={{ fontSize:36, fontWeight:900, color:'#111', margin:'0 0 8px', lineHeight:1.2 }}>
            {decodeURIComponent(cat).replace(/-/g,' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
          <p style={{ color:'#666', fontSize:15, margin:0 }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''} · {site.name}
          </p>
        </div>

        {articles.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#888' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📰</div>
            <div style={{ fontSize:18, fontWeight:700 }}>No articles yet in this category</div>
            <div style={{ marginTop:8 }}><Link href={`${BASE}/`} style={{ color:p }}>Browse all articles →</Link></div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:24 }}>
            <style>{`.cat-card{transition:box-shadow .2s}.cat-card:hover{box-shadow:0 4px 20px rgba(0,0,0,0.1)}`}</style>
            {articles.map((a: any) => (
              <Link key={a.id} href={`${BASE}/article/${siteSlug}/${a.slug}`} className="cat-card"
                style={{ background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #e8e8e8', display:'block', textDecoration:'none', color:'inherit' }}
              >
                {a.cover_image_url && (
                  <div style={{ height:180, overflow:'hidden' }}>
                    <img src={a.cover_image_url} alt={a.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                  </div>
                )}
                <div style={{ padding:'16px 18px' }}>
                  <div style={{ fontSize:11, color:p, fontWeight:700, textTransform:'uppercase', marginBottom:8, letterSpacing:0.5 }}>
                    {a.category}
                  </div>
                  <h2 style={{ fontSize:16, fontWeight:800, color:'#111', margin:'0 0 8px', lineHeight:1.4 }}>
                    {a.title}
                  </h2>
                  {a.excerpt && (
                    <p style={{ fontSize:13, color:'#666', margin:'0 0 12px', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {a.excerpt}
                    </p>
                  )}
                  <div style={{ fontSize:11, color:'#999', display:'flex', gap:12, alignItems:'center' }}>
                    {isJewish && <span>Solly Marks</span>}
                    {isJewish && <span>·</span>}
                    <span>{fmt(a.published_at)}</span>
                    {a.read_time_minutes && <><span>·</span><span>{a.read_time_minutes} min read</span></>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
