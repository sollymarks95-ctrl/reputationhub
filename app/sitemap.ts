import { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const host = (headersList.get('host') || 'rephuby.com').replace(/^www\./, '').split(':')[0]
  const base = `https://${host}`
  const now  = new Date()

  const supabase = db()

  // Get site record
  const { data: site } = await supabase
    .from('news_sites')
    .select('id, slug, noindex, updated_at')
    .eq('domain', host)
    .single()

  // Noindexed sites get empty sitemap
  if (!site || site.noindex) return []

  const isRephuby = host === 'rephuby.com'

  if (isRephuby) {
    // rephuby.com — static pages + blog articles
    const { data: articles } = await supabase
      .from('news_articles')
      .select('slug, published_at')
      .eq('news_site_id', site.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)

    const staticPages: MetadataRoute.Sitemap = [
      { url: `${base}/`,                    lastModified: now, changeFrequency: 'hourly',  priority: 1.0 },
      { url: `${base}/blog`,                lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
      { url: `${base}/insights`,            lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
      { url: `${base}/for/forex-brokers`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
      { url: `${base}/for/crypto-exchanges`,lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    ]

    const articlePages: MetadataRoute.Sitemap = (articles || []).map(a => ({
      url:             `${base}/blog/${a.slug}`,
      lastModified:    new Date(a.published_at),
      changeFrequency: 'never' as const,
      priority:        0.9,
    }))

    return [...staticPages, ...articlePages]
  }

  // All other portals — articles at /article/[site-slug]/[article-slug]
  const { data: articles } = await supabase
    .from('news_articles')
    .select('slug, published_at, category')
    .eq('news_site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5000)

  const cats = [...new Set((articles || []).map((a: any) => a.category).filter(Boolean))]

  return [
    { url: `${base}/`,  lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    ...cats.slice(0, 20).map(cat => ({
      url: `${base}/category/${cat.toLowerCase()}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...(articles || []).filter(a => a.slug).map(a => ({
      url:             `${base}/article/${site.slug}/${a.slug}`,
      lastModified:    new Date(a.published_at),
      changeFrequency: 'never' as const,
      priority:        0.8,
    })),
  ]
}
