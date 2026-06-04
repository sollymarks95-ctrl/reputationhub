import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]
  const base = `https://${host}`

  const db = getDb()

  // Get this domain's site slug
  const { data: site } = await db
    .from('news_sites')
    .select('slug, name, updated_at, noindex')
    .eq('domain', host)
    .single()

  if (!site || site.noindex) return []

  // Get all published articles for this site — up to 5000
  const { data: articles } = await db
    .from('news_articles')
    .select('slug, published_at, title, category')
    .eq('news_site_id', (
      await db.from('news_sites').select('id').eq('domain', host).single()
    ).data?.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5000)

  const urls: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: base,
      lastModified: new Date(site.updated_at || Date.now()),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
  ]

  // Category pages
  const categories = [...new Set((articles || []).map((a: any) => a.category).filter(Boolean))]
  for (const cat of categories.slice(0, 20)) {
    urls.push({
      url: `${base}/category/${cat.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    })
  }

  // Articles
  for (const a of (articles || [])) {
    if (!a.slug) continue
    urls.push({
      url: `${base}/article/${site.slug}/${a.slug}`,
      lastModified: new Date(a.published_at),
      changeFrequency: 'never',
      priority: 0.8,
    })
  }

  return urls
}
