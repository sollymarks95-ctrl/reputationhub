import { getNewsSite, getLatestArticles } from '@/lib/news'
import { notFound } from 'next/navigation'
import LiveMarketDashboard from '@/app/components/LiveMarketDashboard'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site) return {}
  return {
    title: site.seo_title || `${site.name} — Global Markets & News`,
    description: site.tagline || `Professional market intelligence and news from ${site.name}`,
    robots: 'index, follow',
    openGraph: { title: site.name, description: site.tagline }
  }
}

export default async function NewsSitePage({
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
  const p = site.primary_color || '#c0392b'

  return (
    <LiveMarketDashboard
      articles={articles}
      site={site}
      routePrefix="news"
      siteSlug={slug}
      primaryColor={p}
      searchParams={sp}
    />
  )
}
