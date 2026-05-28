import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
)

const SITE_DOMAINS: Record<string, string> = {
  'global-trade-wire':  'https://nex-wire.com',
  'finance-terminal':   'https://finvexx.com',
  'business-pulse':     'https://bizplezx.com',
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: articles } = await sb
    .from('news_articles')
    .select('slug, news_site_id, published_at, news_sites!inner(slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(500)

  const { data: sites } = await sb
    .from('news_sites')
    .select('slug, updated_at')
    .eq('is_live', true)

  const homepages: MetadataRoute.Sitemap = (sites || [])
    .filter(s => SITE_DOMAINS[s.slug])
    .map(s => ({
      url: SITE_DOMAINS[s.slug] + '/',
      lastModified: new Date(s.updated_at || Date.now()),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    }))

  const articlePages: MetadataRoute.Sitemap = (articles || [])
    .map((a: any) => {
      const siteSlug = a.news_sites?.slug
      const domain = SITE_DOMAINS[siteSlug]
      if (!domain) return null
      return {
        url: `${domain}/article/${siteSlug}/${a.slug}`,
        lastModified: new Date(a.published_at),
        changeFrequency: 'never' as const,
        priority: 0.8,
      }
    })
    .filter(Boolean) as MetadataRoute.Sitemap

  return [...homepages, ...articlePages]
}
