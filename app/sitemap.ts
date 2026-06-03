import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

function getDb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'') }

// All 5 indexable portals
const SITE_DOMAINS: Record<string, string> = {
  'global-trade-wire':  'https://nex-wire.com',
  'finance-terminal':   'https://finvexx.com',
  'business-pulse':     'https://bizplezx.com',
  'gold-markets-today': 'https://aurexhq.com',
  'trust-score':        'https://verivex.co',
}

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return []

  const db = getDb()
  const [{ data: articles }, { data: sites }] = await Promise.all([
    db.from('news_articles')
      .select('slug, news_site_id, published_at, news_sites!inner(slug)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(2000),
    db.from('news_sites').select('slug, updated_at').eq('is_live', true).eq('noindex', false),
  ])

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
