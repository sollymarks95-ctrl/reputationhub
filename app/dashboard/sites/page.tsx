'use client'
import { useState, useEffect } from 'react'
import TopBar from '@/components/TopBar'
import { Globe, ExternalLink, Settings, Plus, CheckCircle, XCircle, PencilLine } from 'lucide-react'
import { supabase, type Site } from '@/lib/supabase'

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', domain: '', slug: '', tagline: '',
    niche: '', primary_color: '#3b82f6', seo_title: '', seo_description: ''
  })

  useEffect(() => {
    fetchSites()
  }, [])

  async function fetchSites() {
    const { data } = await supabase.from('sites').select('*').order('created_at', { ascending: false })
    setSites(data || [])
    setLoading(false)
  }

  async function createSite() {
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-')
    await supabase.from('sites').insert([{ ...form, slug }])
    setShowModal(false)
    setForm({ name: '', domain: '', slug: '', tagline: '', niche: '', primary_color: '#3b82f6', seo_title: '', seo_description: '' })
    fetchSites()
  }

  async function toggleLive(site: Site) {
    await supabase.from('sites').update({ is_live: !site.is_live }).eq('id', site.id)
    fetchSites()
  }

  return (
    <div>
      <TopBar
        title="Sites"
        subtitle="Manage your global directory network"
        action={{ label: 'Add Site', onClick: () => setShowModal(true) }}
      />
      <div style={{ padding: 28 }}>
        {loading ? (
          <div style={{ color: 'var(--text-2)', textAlign: 'center', padding: 60 }}>Loading...</div>
        ) : sites.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <Globe size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 8 }}>No sites yet</h3>
            <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>Add your first directory site to get started</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add First Site
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {sites.map(site => (
              <div key={site.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: `${site.primary_color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${site.primary_color}40`
                    }}>
                      <Globe size={20} color={site.primary_color} />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>{site.name}</h3>
                      <a href={`https://${site.domain}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {site.domain} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                  <span className={`badge ${site.is_live ? 'badge-green' : 'badge-yellow'}`}>
                    {site.is_live ? '● Live' : '○ Draft'}
                  </span>
                </div>

                {site.tagline && (
                  <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>{site.tagline}</p>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {site.niche && <span className="badge badge-blue">{site.niche}</span>}
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                    <Settings size={13} /> Manage
                  </button>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                    <PencilLine size={13} /> Edit
                  </button>
                  <button
                    className={site.is_live ? 'btn-ghost' : 'btn-primary'}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => toggleLive(site)}
                  >
                    {site.is_live ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    {site.is_live ? 'Unpublish' : 'Go Live'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-in" style={{ width: 520, padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, marginBottom: 24 }}>Add New Site</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6, fontFamily: 'Syne', fontWeight: 600 }}>Site Name</label>
                <input placeholder="e.g. Trade Verify" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6, fontFamily: 'Syne', fontWeight: 600 }}>Domain</label>
                <input placeholder="e.g. tradeverify.com" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6, fontFamily: 'Syne', fontWeight: 600 }}>Tagline</label>
                <input placeholder="Short description" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6, fontFamily: 'Syne', fontWeight: 600 }}>Niche / Industry</label>
                <input placeholder="e.g. Trading Companies" value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6, fontFamily: 'Syne', fontWeight: 600 }}>SEO Title</label>
                <input placeholder="Page title for Google" value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6, fontFamily: 'Syne', fontWeight: 600 }}>SEO Description</label>
                <textarea placeholder="Meta description" rows={3} value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6, fontFamily: 'Syne', fontWeight: 600 }}>Brand Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                    style={{ width: 44, height: 44, padding: 2, cursor: 'pointer', borderRadius: 8 }} />
                  <input value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} style={{ flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={createSite}>
                <Plus size={14} /> Create Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
