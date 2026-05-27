import { getNewsSite, getLatestArticles } from '@/lib/news'
import { notFound } from 'next/navigation'
import LiveMarketDashboard from '@/app/components/LiveMarketDashboard'
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const site = await getNewsSite(slug); if (!site) return {}
  return { title: site.seo_title || site.name, description: site.tagline, robots: 'index, follow' }
}
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams?: Promise<{ category?: string }> }) {
  const { slug } = await params; const sp = searchParams ? await searchParams : {}
  const site = await getNewsSite(slug); if (!site) notFound()
  const articles = await getLatestArticles(site.id, 60)
  return <LiveMarketDashboard articles={articles} site={site} routePrefix="pressroom" siteSlug={slug} primaryColor={site.primary_color || '#dc2626'} searchParams={sp} />
}
