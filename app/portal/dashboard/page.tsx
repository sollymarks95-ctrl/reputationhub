import { supabase } from '@/lib/supabase'
import PortalDashboard from './PortalDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const CLIENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

  const [
    { data: client },
    { data: rankings },
    { data: content },
    { data: podcasts },
    { data: activity },
    { data: reports },
    { data: coverage },
  ] = await Promise.all([
    supabase.from('portal_clients').select('*').eq('id', CLIENT_ID).single(),
    supabase.from('portal_rankings').select('*').eq('client_id', CLIENT_ID).order('current_position'),
    supabase.from('portal_content').select('*').eq('client_id', CLIENT_ID).order('published_at', { ascending: false }).limit(20),
    supabase.from('portal_podcasts').select('*').eq('client_id', CLIENT_ID).order('episode_number', { ascending: false }),
    supabase.from('portal_activity').select('*').eq('client_id', CLIENT_ID).order('created_at', { ascending: false }).limit(10),
    supabase.from('portal_reports').select('*').eq('client_id', CLIENT_ID).order('report_month', { ascending: false }).limit(3),
    supabase.from('portal_site_coverage').select('*').eq('client_id', CLIENT_ID).order('articles_published', { ascending: false }),
  ])

  return (
    <PortalDashboard
      client={client}
      rankings={rankings || []}
      content={content || []}
      podcasts={podcasts || []}
      activity={activity || []}
      reports={reports || []}
      coverage={coverage || []}
    />
  )
}
