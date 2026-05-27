'use client'
import TopBar from '@/components/TopBar'
import { Globe, Users, Star, FileText, Video, TrendingUp, ArrowUpRight, Activity } from 'lucide-react'

const stats = [
  { label: 'Active Sites', value: '0', icon: Globe, color: 'var(--accent)', change: '+0' },
  { label: 'Total Clients', value: '0', icon: Users, color: 'var(--green)', change: '+0' },
  { label: 'Reviews Managed', value: '0', icon: Star, color: 'var(--yellow)', change: '+0' },
  { label: 'Content Published', value: '0', icon: FileText, color: 'var(--purple)', change: '+0' },
  { label: 'YouTube Videos', value: '0', icon: Video, color: '#ef4444', change: '+0' },
  { label: 'Page 1 Assets', value: '0', icon: TrendingUp, color: 'var(--green)', change: '+0' },
]

const platforms = [
  { name: 'Trustpilot', status: 'Not connected', color: 'var(--yellow)' },
  { name: 'Google Reviews', status: 'Not connected', color: 'var(--accent)' },
  { name: 'Facebook', status: 'Not connected', color: '#1877f2' },
  { name: 'YouTube', status: 'Not connected', color: '#ef4444' },
]

export default function Dashboard() {
  return (
    <div>
      <TopBar
        title="Overview"
        subtitle="Welcome to RepHub — your global reputation OS"
      />
      <div style={{ padding: 28 }}>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 28
        }}>
          {stats.map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="card animate-in" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{
                  fontSize: 11, fontFamily: 'Syne', fontWeight: 600,
                  color: 'var(--green)',
                  display: 'flex', alignItems: 'center', gap: 2
                }}>
                  <ArrowUpRight size={11} />
                  {change}
                </div>
              </div>
              <div style={{ fontSize: 30, fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-0.04em' }}>
                {value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
          {/* Activity Feed */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Activity size={15} color="var(--accent)" />
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>Activity Feed</h3>
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '60px 0',
              color: 'var(--text-2)', fontSize: 13
            }}>
              <Activity size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No activity yet. Add your first client to get started.</p>
            </div>
          </div>

          {/* Platform Status */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, marginBottom: 20 }}>
              Platform Connections
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {platforms.map(({ name, status, color }) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-3)',
                  borderRadius: 8, border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13 }}>{name}</span>
                  </div>
                  <span className="badge badge-yellow">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
