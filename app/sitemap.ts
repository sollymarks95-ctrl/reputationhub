import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

function getDb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'') }

const SITE_DOMAINS: Record<string, string> = {
  'global-trade-wire':  'https://nex-wire.com',
  'finance-terminal':   'https://finvexx.com',
  'business-pulse':     'https://bizplezx.com',
}

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // During build, env vars aren't available — return empty
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return []
  }
  const { data: articles } = await getDb()
    .from('news_articles')
    .select('slug, news_site_id, published_at, news_sites!inner(slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(500)

  const { data: sites } = await getDb()
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
