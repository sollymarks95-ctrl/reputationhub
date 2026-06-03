import TrackView from '@/app/components/TrackView'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import DynamicTemplate from '@/app/components/templates/DynamicTemplate'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]
  const db = getDb()
  const { data: site } = await db.from('news_sites')
    .select('name,description,noindex,tagline,template_config,category,slug')
    .eq('domain', host).single()

  const siteName = site?.name || 'Financial Intelligence'
  const tagline = site?.template_config?.tagline || site?.description || 'Financial news, analysis and market intelligence'
  const canonical = host ? `https://${host}` : 'https://rephuby.com'
  const category = site?.template_config?.category || site?.category || 'Finance'
  const noindex = site?.noindex ?? true

  return {
    title: `${siteName} — ${tagline}`,
    description: tagline,
    robots: noindex ? 'noindex,nofollow' : 'index,follow',
    alternates: { canonical },
    openGraph: {
      title: `${siteName} — ${tagline}`,
      description: tagline,
      url: canonical,
      siteName,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} — ${tagline}`,
      description: tagline,
    },
    other: {
      'article:section': category,
    }
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

  // Fetch articles for this site
  const { data: articles } = await db
    .from('news_articles')
    .select('id,title,slug,excerpt,category,author_name,published_at,read_time_minutes')
    .eq('news_site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30)

  const siteUrl = site?.domain ? `https://${site.domain}` : 'https://rephuby.com'
  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: site?.name || 'Financial Intelligence',
    url: siteUrl,
    description: site?.template_config?.tagline || site?.description || 'Financial news and market intelligence',
    logo: { '@type': 'ImageObject', url: `https://rephuby.com/favicon.ico` },
  }
  return (
    <>
      <TrackView siteSlug={site.slug} siteDomain={site.domain || host} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
      <DynamicTemplate site={site} articles={articles || []} />
    </>
  )
}
