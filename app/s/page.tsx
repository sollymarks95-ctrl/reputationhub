import TrackView from '@/app/components/TrackView'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import DynamicTemplate from '@/app/components/templates/DynamicTemplate'
import JewishTemplate from '@/app/components/templates/JewishTemplate'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]
  const db = getDb()
  const { data: site } = await db.from('news_sites')
    .select('name,description,seo_description,noindex,tagline,template_config,category,slug,domain,primary_color')
    .eq('domain', host).single()

  const siteName  = site?.name || 'Financial Intelligence'
  const tagline   = site?.tagline || site?.template_config?.tagline || site?.description || 'Financial news, analysis and market intelligence'
  const canonical = `https://${host}`
  const noindex   = site?.noindex ?? true

  // Rich SEO title with keywords
  const seoTitle = `${siteName} — ${tagline}`
  // AI-optimised description: direct, factual, answers "what is X"
  const seoDesc  = site?.seo_description || `${siteName} provides ${tagline.toLowerCase()}. Expert financial journalism, daily market analysis and breaking news for finance professionals.`

  return {
    title: { default: seoTitle, template: `%s | ${siteName}` },
    description: seoDesc,
    robots: noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    alternates: { canonical },
    keywords: `${tagline}, financial news, market intelligence, finance, ${site?.category || 'markets'}`,
    authors: [{ name: siteName, url: canonical }],
    creator: siteName,
    publisher: siteName,
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: canonical,
      siteName,
      type: 'website',
      locale: 'en_US',
    },
    icons: {
      icon: site?.slug === 'fx-vexx'      ? '/icon-fxvexx.svg' :
            site?.slug === 'trade-hub-iq' ? '/icon-tradehubiq.svg' :
            site?.slug === 'global-trade-wire' ? '/icon-nexwire.svg' :
            site?.slug === 'finance-terminal'  ? '/icon-finvexx.svg' :
            site?.slug === 'business-pulse'    ? '/icon-bizplezx.svg' :
            site?.slug === 'executive-network' ? '/icon-execvex.svg' :
            site?.slug === 'crypto-hub'        ? '/icon-cryptoxos.svg' :
            '/icon-rephuby.svg',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDesc,
      site: `@${(siteName || '').toLowerCase().replace(/\s/g,'')}`,
    },
    other: {
      'article:section': site?.category || 'Finance',
      // AI engine hints
      'ai-content-type': 'financial-news',
      'ai-update-frequency': 'hourly',
      'ai-language': 'en',
    },
  }
}

export default async function DynamicSitePage() {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]
  const db = getDb()

  const { data: site } = await db
    .from('news_sites')
    .select('*')
    .eq('domain', host)
    .single()

  if (!site) return notFound()

  const { data: articles } = await db
    .from('news_articles')
    .select('id,title,slug,excerpt,category,author_name,published_at,read_time_minutes,cover_image_url')
    .eq('news_site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30)

  const siteUrl = `https://${host}`
  const tagline = site?.tagline || site?.template_config?.tagline || site?.description || 'Financial news and market intelligence'

  // Rich JSON-LD: WebSite + NewsMediaOrganization + BreadcrumbList
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: siteUrl,
      description: tagline,
      inLanguage: 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: site.name,
      url: siteUrl,
      description: tagline,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.ico`, width: 512, height: 512 },
      sameAs: [],
      publishingPrinciples: `${siteUrl}/about`,
      missionCoveragePrioritiesPolicy: `${siteUrl}/about`,
    },
    // ItemList of latest articles — helps AI engines understand content
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Latest from ${site.name}`,
      url: siteUrl,
      itemListElement: (articles || []).slice(0, 10).map((a: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${siteUrl}/article/${site.slug}/${a.slug}`,
        name: a.title,
      })),
    },
  ]

  return (
    <>
      <TrackView siteSlug={site.slug} siteDomain={host} />
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      {['jewish-news-now','jewish-property-report','aliya-today'].includes(site.slug)
        ? <JewishTemplate site={site} articles={articles || []} />
        : <DynamicTemplate site={site} articles={articles || []} />}
    </>
  )
}
