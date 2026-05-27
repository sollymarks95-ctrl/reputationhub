import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'
export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const articles = await getLatestArticles(site.id, 12)
  const type = 'pressroom'
  return <div data-type={type} style={{ minHeight: '100vh' }}>
    <p style={{padding:40,textAlign:'center',color:'#888'}}>
      {site.name} — {type} template loading...
    </p>
  </div>
}
