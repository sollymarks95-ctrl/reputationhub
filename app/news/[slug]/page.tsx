import { getNewsSite, getLatestArticles } from '@/lib/news'
import { notFound } from 'next/navigation'
import SiteRenderer from '@/app/components/SiteRenderer'
import type { Metadata } from 'next'

const BASE = 'https://rephuby.com'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site) return {}
  const canonicalBase = slug === 'global-trade-wire' ? 'https://nex-wire.com' : `https://rephuby.com/news/${slug}`
  const url = `${BASE}/news/${slug}`
  return {
    title: site.seo_title || `Nex-Wire — Global Trade & Market Intelligence`,
    description: site.tagline || `${site.name} provides professional intelligence on global trade markets news intelligence.`,
    keywords: `${site.name}, global, trade, markets, news, intelligence, market analysis, intelligence`,
    robots: 'index, follow',
    icons: {
      icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='#E03131'/><text y='.9em' font-size='60' font-family='Arial' font-weight='bold' fill='white' x='50%' text-anchor='middle' dominant-baseline='middle' dy='.1em'>N</text></svg>`,
    },
    alternates: { canonical: url },
    openGraph: {
      title: 'Nex-Wire — Global Trade & Market Intelligence',
      description: site.tagline,
      url, type: 'website', siteName: site.name,
      images: [{ url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200', width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: 'summary_large_image', title: site.name, description: site.tagline },
    other: { 'application-name': site.name, 'news_keywords': 'Global Trade Markets News Intelligence' },
  }
}

export default async function SitePage({
  params, searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ category?: string }>
}) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  let site = await getNewsSite(slug)
  if (!site && slug === 'global-trade-wire') {
    site = { id:'4d048bde-1dcd-4891-8434-a7960ab9d3ae', name:'Nex-Wire', slug:'global-trade-wire', primary_color:'#E03131', site_type:'news', tagline:'Global Trade & Markets Intelligence', is_live:true, seo_title:'Nex-Wire — Global Trade Intelligence' } as any
  }
  if (!site) notFound()
  const articles = await getLatestArticles(site.id, 60)
  const p = site.primary_color || '#c0392b'

  // JSON-LD structured data for AI agents and search engines
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: site.name,
      description: site.tagline,
      url: `${BASE}/news/${slug}`,
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png`, width: 280, height: 60 },
      publishingPrinciples: `${BASE}/legal/about`,
      ethicsPolicy: `${BASE}/legal/terms`,
      masthead: `${BASE}/legal/about`,
      correctionsPolicy: `${BASE}/legal/contact`,
      contactPoint: { '@type': 'ContactPoint', contactType: 'editorial', email: 'editorial@rephub.com', url: `${BASE}/legal/contact` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: `${BASE}/news/${slug}`,
      description: site.tagline,
      inLanguage: 'en-GB',
      publisher: { '@type': 'Organization', name: 'RepHuby Intelligence Ltd', url: BASE },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${BASE}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'RepHuby Intelligence', item: BASE },
        { '@type': 'ListItem', position: 2, name: site.name, item: `${BASE}/news/${slug}` },
      ],
    },
  ]

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <SiteRenderer
        articles={articles}
        site={site}
        routePrefix="news"
        siteSlug={slug}
        primaryColor={p}
        searchParams={sp}
      />
    </>
  )
}
