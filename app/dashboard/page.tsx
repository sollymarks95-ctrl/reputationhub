'use client'
import { useState, useEffect } from 'react'
import TopBar from '@/components/TopBar'
import { Globe, Users, Star, FileText, Video, TrendingUp, ArrowUpRight, Activity, ArrowDownRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ sites: 0, clients: 0, reviews: 0, content: 0, videos: 0, mrr: 0 })
  const [recentReviews, setRecentReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ count: sites }, { count: clients }, { count: reviews }, { count: content }, { count: videos }, { data: clientData }] = await Promise.all([
        supabase.from('sites').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('content').select('*', { count: 'exact', head: true }),
        supabase.from('youtube_videos').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('monthly_fee'),
      ])
      const mrr = (clientData || []).reduce((a: number, c: any) => a + Number(c.monthly_fee), 0)
      setStats({ sites: sites || 0, clients: clients || 0, reviews: reviews || 0, content: content || 0, videos: videos || 0, mrr })
      const { data: rev } = await supabase.from('reviews').select('*, clients(company_name)').order('created_at', { ascending: false }).limit(5)
      setRecentReviews(rev || [])
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Active Sites', value: stats.sites, icon: Globe, color: 'var(--accent)' },
    { label: 'Total Clients', value: stats.clients, icon: Users, color: 'var(--green)' },
    { label: 'Reviews', value: stats.reviews, icon: Star, color: 'var(--yellow)' },
    { label: 'Content', value: stats.content, icon: FileText, color: 'var(--purple)' },
    { label: 'Videos', value: stats.videos, icon: Video, color: '#ef4444' },
    { label: 'MRR', value: `$${stats.mrr.toLocaleString()}`, icon: TrendingUp, color: 'var(--green)' },
  ]

  const sentimentColor: Record<string, string> = { positive: 'var(--green)', neutral: 'var(--yellow)', negative: '#ef4444' }

  return (
    <div>
      <TopBar title="Overview" subtitle="RepHub — Global Reputation OS" />
      <div style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card animate-in" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
              </div>
              <div style={{ fontSize: 30, fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-0.04em' }}>{loading ? '—' : value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Star size={15} color="var(--yellow)" />
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>Recent Reviews</h3>
            </div>
            {recentReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-2)', fontSize: 13 }}>
                <Activity size={32} style={{ marginBottom: 12, opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                No reviews yet. Add clients and import reviews to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentReviews.map((r: any) => (
                  <div key={r.id} style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{r.clients?.company_name || 'Unknown'}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? 'var(--yellow)' : 'var(--border)', fontSize: 12 }}>★</span>)}
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{r.review_text?.slice(0, 100)}{r.review_text?.length > 100 ? '…' : ''}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: sentimentColor[r.sentiment] }}>● {r.sentiment}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{r.platform}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, marginBottom: 20 }}>Quick Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Avg Review Rating', value: '—' },
                { label: 'Response Rate', value: '—' },
                { label: 'Content This Month', value: stats.content },
                { label: 'Active Campaigns', value: '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{loading ? '—' : value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
