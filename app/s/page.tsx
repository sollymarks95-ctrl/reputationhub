import TrackView from '@/app/components/TrackView'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import DynamicTemplate from '@/app/components/templates/DynamicTemplate'
import JewishTemplate from '@/app/components/templates/JewishTemplate'
import type { Metadata } from 'next'

const SITE_ICON_MAP: Record<string, string> = {
  'global-trade-wire':      '/icon-nexwire.svg',
  'finance-terminal':       '/icon-finvexx.svg',
  'trust-score':            '/icon-verivex.svg',
  'gold-markets-today':     '/icon-aurexhq.svg',
  'invest-data':            '/icon-invexhuby.svg',
  'business-pulse':         '/icon-bizplezx.svg',
  'market-radar':           '/icon-signalixx.svg',
  'executive-network':      '/icon-execvex.svg',
  'crypto-hub':             '/icon-cryptoxos.svg',
  'fx-vexx':                '/icon-fxvexx.svg',
  'trade-hub-iq':           '/icon-tradehubiq.svg',
  'aliya-today':            '/icon-aliya-today.svg',
  'jewish-news-now':        '/icon-jewish-news-now.svg',
  'jewish-property-report': '/icon-jewish-property-report.svg',
  'copy-trade-iq':          '/icon-copyvexx.svg',
  'expat-invest-iq':        '/icon-expatinvestiq.svg',
  'rephuby-intelligence':   '/icon-rephuby.svg',
}

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

  // Niche-targeted SEO per site
  const NICHE_KW: Record<string, string> = {
    'aliya-today': 'making aliyah, aliyah guide 2026, how to make aliyah, nefesh bnefesh, aliyah checklist, move to israel, aliyah process, olim advice',
    'jewish-news-now': 'jewish news, israel news today, jewish community news, jewish world news, israel breaking news 2026',
    'jewish-property-report': 'israel real estate, buy property in israel, israel apartments, tel aviv property market, invest in israel, israel housing',
  }
  const nicheKw = NICHE_KW[site?.slug||''] || ''

  const seoTitle = site?.slug && ['aliya-today','jewish-news-now','jewish-property-report'].includes(site.slug)
    ? `${siteName} — ${tagline} | Solly Marks`
    : `${siteName} — ${tagline}`

  const seoDesc = site?.seo_description || (
    site?.slug === 'aliya-today' ? 'The complete guide to making Aliyah in 2026. Step-by-step advice on the process, costs, health funds, bank accounts, ulpan and life in Israel — written by Solly Marks.'
    : site?.slug === 'jewish-news-now' ? 'Breaking Jewish news from Israel and around the world. Daily coverage of Israel, Jewish communities, politics and culture — updated every day by Solly Marks.'
    : site?.slug === 'jewish-property-report' ? 'Israeli real estate news and investment guides for diaspora buyers. Property prices, legal requirements, neighborhoods and market trends — by Solly Marks.'
    : `${siteName} provides ${tagline.toLowerCase()}. Expert financial journalism, daily market analysis and breaking news for finance professionals.`
  )

  const isJewish = ['aliya-today','jewish-news-now','jewish-property-report'].includes(site?.slug||'')

  return {
    title: { default: seoTitle, template: `%s | ${siteName}` },
    description: seoDesc,
    robots: noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    alternates: { canonical },
    keywords: nicheKw || `${tagline}, financial news, market intelligence, finance, ${site?.category || 'markets'}`,
    authors: [{ name: isJewish ? 'Solly Marks' : siteName, url: isJewish ? canonical : canonical }],
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
      icon: SITE_ICON_MAP[site?.slug || ''] || '/icon-rephuby.svg',
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
