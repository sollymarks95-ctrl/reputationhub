import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import DynamicTemplate from '@/app/components/templates/DynamicTemplate'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]
  const db = getDb()
  const { data: site } = await db.from('news_sites').select('name,description,noindex').eq('domain', host).single()
  return {
    title: site?.name || 'Financial News',
    description: site?.description || 'Financial news and analysis',
    robots: site?.noindex ? 'noindex,nofollow' : 'index,follow',
  }
}

export default async function DynamicSitePage() {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]
  const db = getDb()

  const { data: site } = await db
    .from('news_sites')
    .select('*')
    .eq('domain', host)
    .single()

  if (!site) return notFound()

  // Fetch articles for this site
  const { data: articles } = await db
    .from('news_articles')
    .select('id,title,slug,excerpt,category,author_name,published_at,read_time_minutes')
    .eq('news_site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30)

  return <DynamicTemplate site={site} articles={articles || []} />
}
