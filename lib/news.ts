import { supabase } from './supabase'

export async function getNewsSite(slug: string) {
  const { data } = await supabase
    .from('news_sites')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

export async function getFeaturedArticles(siteId: string, limit = 5) {
  const { data } = await supabase
    .from('news_articles')
    .select('*')
    .eq('news_site_id', siteId)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getArticlesByCategory(siteId: string, category: string, limit = 8) {
  // Case-insensitive match — DB categories are Title Case (e.g. "Shipping and Logistics")
  // but the [cat] URL slug only capitalizes the first letter ("Shipping and logistics"),
  // so an exact match would silently return 0 rows for multi-word categories.
  const { data } = await supabase
    .from('news_articles')
    .select('*')
    .eq('news_site_id', siteId)
    .eq('status', 'published')
    .ilike('category', category)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getArticleCountByCategory(siteId: string, category: string) {
  const { count } = await supabase
    .from('news_articles')
    .select('*', { count: 'exact', head: true })
    .eq('news_site_id', siteId)
    .eq('status', 'published')
    .ilike('category', category)
  return count || 0
}

export async function getTotalArticleCount(siteId: string) {
  const { count } = await supabase
    .from('news_articles')
    .select('*', { count: 'exact', head: true })
    .eq('news_site_id', siteId)
    .eq('status', 'published')
  return count || 0
}

export async function getTodayArticleCount(siteId: string) {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('news_articles')
    .select('*', { count: 'exact', head: true })
    .eq('news_site_id', siteId)
    .eq('status', 'published')
    .gte('published_at', startOfDay.toISOString())
  return count || 0
}

// Real DB count for a homepage section nav item — matches articles whose
// category contains any of the section's keywords (case-insensitive),
// so the displayed number reflects ALL published articles, not just the
// most-recent-60 sample used for the article feed.
export async function getSectionArticleCount(siteId: string, keywords: string[]) {
  if (!keywords.length) return 0
  const orFilter = keywords.map(k => `category.ilike.%${k}%`).join(',')
  const { count } = await supabase
    .from('news_articles')
    .select('*', { count: 'exact', head: true })
    .eq('news_site_id', siteId)
    .eq('status', 'published')
    .or(orFilter)
  return count || 0
}

export async function getLatestArticles(siteId: string, limit = 20) {
  const { data } = await supabase
    .from('news_articles')
    .select('*')
    .eq('news_site_id', siteId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getArticle(siteId: string, slug: string) {
  const { data } = await supabase
    .from('news_articles')
    .select('*')
    .eq('news_site_id', siteId)
    .eq('slug', slug)
    .single()
  return data
}

export async function getBreakingNews(siteId: string) {
  const { data } = await supabase
    .from('news_articles')
    .select('title, slug')
    .eq('news_site_id', siteId)
    .eq('status', 'published')
    .eq('is_breaking', true)
    .order('published_at', { ascending: false })
    .limit(5)
  return data || []
}

export function timeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
