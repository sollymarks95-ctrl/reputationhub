import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin | RepHuby Intelligence', robots: 'noindex, nofollow' }

// Hardcoded so admin ALWAYS shows all 12 portals even if DB is slow
const ALL_SITES = [
  { id:'4d048bde-1dcd-4891-8434-a7960ab9d3ae', name:'NEX-WIRE',   slug:'global-trade-wire',  primary_color:'#c0392b', site_type:'news'        },
  { id:'48bed332-6525-4d76-aaa5-6d10a5112d77', name:'FINVEXX',    slug:'finance-terminal',   primary_color:'#1a73e8', site_type:'finance'     },
  { id:'3b440202-e1c3-4f54-8a4e-65cf7e7dbfe1', name:'AUREXHQ',   slug:'gold-markets-today', primary_color:'#d4a017', site_type:'commodities' },
  { id:'c0f14745-8189-444d-af09-39d7248fa319', name:'BIZPLEZX',   slug:'business-pulse',     primary_color:'#7c3aed', site_type:'magazine'    },
  { id:'6ae7e692-bce9-489d-b835-87dcba9ffc47', name:'VERIVEX',   slug:'trust-score',        primary_color:'#059669', site_type:'reviews'     },
  { id:'aa04790b-9aed-4fa9-867d-3481adc828c5', name:'BIZPEDIA',  slug:'company-pedia',      primary_color:'#0369a1', site_type:'wiki'        },
  { id:'104ceccb-e3d0-4979-85be-b7297abb7f90', name:'PRESXWIRE', slug:'press-central',      primary_color:'#dc2626', site_type:'pressroom'   },
  { id:'1cd6688f-bec9-4d1b-a024-80952bf31a21', name:'INVEXHUB',  slug:'invest-data',        primary_color:'#0f766e', site_type:'investdb'    },
  { id:'d020965e-d84d-4c9e-a068-d3b90f6902d0', name:'TRADVEX',   slug:'trade-board',        primary_color:'#ea580c', site_type:'forum'       },
  { id:'1972c09e-a68e-4997-b2a8-00756ead609c', name:'CERTIVADE', slug:'global-trade-assoc', primary_color:'#1d4ed8', site_type:'association' },
  { id:'64a6087d-480f-4040-9df1-ad020faf5796', name:'EXECVEX',   slug:'executive-network',  primary_color:'#4f46e5', site_type:'executive'   },
  { id:'27fdf1e6-8c0c-4591-ae9b-5a2c5cacee22', name:'SIGNALIX',  slug:'market-radar',       primary_color:'#b91c1c', site_type:'markets'     },
]

async function getData() {
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const [clients, content, rankings, podcasts, activity, articleCount, subCount, reviewsData, pendingReviews, businessInquiries] = await Promise.all([
    sb.from('portal_clients').select('*').order('created_at', { ascending: false }),
    sb.from('portal_content').select('*').order('published_at', { ascending: false }).limit(50),
    sb.from('portal_rankings').select('*').order('current_position'),
    sb.from('podcast_scripts').select('*').order('created_at', { ascending: false }),
    sb.from('portal_activity').select('*').order('created_at', { ascending: false }).limit(25),
    sb.from('news_articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
    sb.from('verivex_reviews').select('*').order('created_at', { ascending: false }).limit(100),
    sb.from('verivex_reviews').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    sb.from('business_inquiries').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  return {
    clients: clients.data || [],
    allContent: content.data || [],
    allRankings: rankings.data || [],
    allPodcasts: podcasts.data || [],
    allActivity: activity.data || [],
    totalArticles: articleCount.count || 0,
    totalSubscribers: subCount.count || 0,
    allReviews: reviewsData.data || [],
    pendingReviews: pendingReviews.data || [],
    businessInquiries: businessInquiries.data || [],
  }
}

export default async function AdminPage() {
  const data = await getData()
  return <AdminDashboard {...data} sites={ALL_SITES} />
}
