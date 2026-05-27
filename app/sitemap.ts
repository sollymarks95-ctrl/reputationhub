import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const BASE = 'https://rephuby.com'
const ROUTES: Record<string,string> = {
  'global-trade-wire':'news','finance-terminal':'finance','gold-markets-today':'commodities',
  'business-pulse':'magazine','trust-score':'reviews-hub','company-pedia':'wiki',
  'press-central':'pressroom','invest-data':'investdb','trade-board':'forum',
  'global-trade-assoc':'association','executive-network':'executive','market-radar':'market-radar',
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: sites } = await supabase.from('news_sites').select('slug,updated_at').eq('is_live',true)
  const { data: articles } = await supabase.from('news_articles').select('slug,news_site_id,published_at,updated_at').eq('status','published').order('published_at',{ascending:false}).limit(500)
  const { data: siteMap } = await supabase.from('news_sites').select('id,slug')
  const idToSlug: Record<string,string> = {}
  siteMap?.forEach((s:any) => { idToSlug[s.id] = s.slug })

  const siteUrls: MetadataRoute.Sitemap = sites?.map((s:any) => ({
    url: `${BASE}/${ROUTES[s.slug]||'news'}/${s.slug}`,
    lastModified: s.updated_at || new Date().toISOString(),
    changeFrequency: 'daily', priority: 0.9,
  })) || []

  const articleUrls: MetadataRoute.Sitemap = articles?.map((a:any) => {
    const sSlug = idToSlug[a.news_site_id] || 'global-trade-wire'
    return { url: `${BASE}/article/${sSlug}/${a.slug}`, lastModified: a.updated_at || a.published_at || new Date().toISOString(), changeFrequency: 'weekly', priority: 0.7 }
  }) || []

  return [{ url: BASE, lastModified: new Date().toISOString(), changeFrequency: 'daily', priority: 1.0 }, ...siteUrls, ...articleUrls]
}
