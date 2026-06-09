import { createClient } from '@supabase/supabase-js'
import PortalDashboard from './PortalDashboard'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
  )
}

export default async function DashboardPage() {
  const CLIENT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'
  const sb = getDb()

  const [
    { data: client },
    { data: rankings },
    { data: content },
    { data: podcasts },
    { data: activity },
    { data: reports },
    { data: coverage },
    { data: reviews },
  ] = await Promise.all([
    sb.from('portal_clients').select('*').eq('id', CLIENT_ID).single(),
    sb.from('portal_rankings').select('*').eq('client_id', CLIENT_ID).order('current_position'),
    sb.from('portal_content').select('*').eq('client_id', CLIENT_ID).order('published_at', { ascending: false }).limit(500),
    sb.from('podcast_scripts').select('*').eq('client_id', CLIENT_ID).eq('status', 'published').order('site_slug').order('episode_number'),
    sb.from('portal_activity').select('*').eq('client_id', CLIENT_ID).order('created_at', { ascending: false }).limit(10),
    sb.from('portal_reports').select('*').eq('client_id', CLIENT_ID).order('report_month', { ascending: false }).limit(3),
    sb.from('portal_site_coverage').select('*').eq('client_id', CLIENT_ID).order('articles_published', { ascending: false }),
    sb.from('verivex_reviews').select('*').eq('company_slug', 'etoro').order('created_at', { ascending: false }).limit(50),
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
      reviews={reviews || []}
    />
  )
}
