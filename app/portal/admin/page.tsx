import { supabase } from '@/lib/supabase'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Dashboard | RepHub Intelligence', robots: 'noindex, nofollow' }

export default async function AdminPage() {
  const [
    { data: clients },
    { data: allContent },
    { data: allRankings },
    { data: allPodcasts },
    { data: allActivity },
    { data: sites },
    { count: totalArticles },
    { count: totalSubscribers },
  ] = await Promise.all([
    supabase.from('portal_clients').select('*').order('created_at', { ascending: false }),
    supabase.from('portal_content').select('*').order('published_at', { ascending: false }).limit(30),
    supabase.from('portal_rankings').select('*').order('current_position'),
    supabase.from('portal_podcasts').select('*').order('created_at', { ascending: false }),
    supabase.from('portal_activity').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('news_sites').select('id, name, slug, primary_color, site_type').eq('is_live', true).order('name'),
    supabase.from('news_articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
  ])

  return (
    <AdminDashboard
      clients={clients || []}
      allContent={allContent || []}
      allRankings={allRankings || []}
      allPodcasts={allPodcasts || []}
      allActivity={allActivity || []}
      sites={sites || []}
      totalArticles={totalArticles || 0}
      totalSubscribers={totalSubscribers || 0}
    />
  )
}
