import { getNewsSite, getLatestArticles } from '@/lib/news'
import { notFound } from 'next/navigation'
import LiveMarketDashboard from '@/app/components/LiveMarketDashboard'
import type { Metadata } from 'next'

const BASE = 'https://rephuby.com'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site) return {}
  const url = `${BASE}/finance/${slug}`
  return {
    title: site.seo_title || `${site.name} — Financial Markets Forex Investment Analysis`,
    description: site.tagline || `${site.name} provides professional intelligence on financial markets forex investment analysis.`,
    keywords: `${site.name}, financial, markets, forex, investment, analysis, market analysis, intelligence`,
    robots: 'index, follow',
    alternates: { canonical: url },
    openGraph: {
      title: site.seo_title || site.name,
      description: site.tagline,
      url, type: 'website', siteName: site.name,
      images: [{ url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200', width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: 'summary_large_image', title: site.name, description: site.tagline },
    other: { 'application-name': site.name, 'news_keywords': 'Financial Markets Forex Investment Analysis' },
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
  const site = await getNewsSite(slug)
  if (!site) notFound()
  const articles = await getLatestArticles(site.id, 60)
  const p = site.primary_color || '#1a73e8'

  // JSON-LD structured data for AI agents and search engines
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: site.name,
      description: site.tagline,
      url: `${BASE}/finance/${slug}`,
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
      url: `${BASE}/finance/${slug}`,
      description: site.tagline,
      inLanguage: 'en-GB',
      publisher: { '@type': 'Organization', name: 'RepHub Intelligence Ltd', url: BASE },
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
        { '@type': 'ListItem', position: 1, name: 'RepHub Intelligence', item: BASE },
        { '@type': 'ListItem', position: 2, name: site.name, item: `${BASE}/finance/${slug}` },
      ],
    },
  ]

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <LiveMarketDashboard
        articles={articles}
        site={site}
        routePrefix="finance"
        siteSlug={slug}
        primaryColor={p}
        searchParams={sp}
      />
    </>
  )
}
