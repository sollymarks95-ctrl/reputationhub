'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SiteStat {
  slug: string; name: string; domain: string; color: string; icon: string
  articles: number; todayArticles: number; subscribers: number
  latest: { slug: string; title: string; excerpt: string; published_at: string; category: string }[]
}

interface Stats {
  totals: { articles: number; today: number; subscribers: number }
  sites: SiteStat[]
  recentSubscribers: { email: string; site_slug: string; subscribed_at: string }[]
}

interface GeneratedPost {
  site: string; siteSlug: string; siteDomain: string; siteColor: string; siteIcon: string
  article: { slug: string; title: string; excerpt: string; url: string; published_at: string }
  postBody: string; fullPost: string; tone: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TONES = ['Warm & Personal', 'Informative', 'Direct & Punchy', 'Question Hook', 'Storytelling']

const MANDATORY_LINKS = [
  { emoji: '💰', label: 'Aliyah Cost Breakdown 2026', url: 'https://aliyatoday.com/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six' },
  { emoji: '🏥', label: 'Kupat Holim Guide 2026', url: 'https://aliyatoday.com/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile' },
  { emoji: '📋', label: 'Aliyah Checklist 2026', url: 'https://aliyatoday.com/article/aliya-today/2026-06-14-aliyah-checklist-2026-disclosure-timeline-splits-winners-losers' },
]

const FB_GROUP = 'https://www.facebook.com/groups/1620082289091191'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string) { return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', ...style }}>{children}</div>
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AliyaAdminPage() {
  const [tab, setTab] = useState<'overview' | 'articles' | 'posts' | 'links'>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<GeneratedPost[]>([])
  const [generating, setGenerating] = useState(false)
  const [tone, setTone] = useState('Warm & Personal')
  const [copied, setCopied] = useState<string | null>(null)
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState(false)

  // Simple password gate
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('aliya_admin') === 'ok') setAuth(true)
  }, [])

  function login() {
    if (pw === (process.env.NEXT_PUBLIC_ALIYA_ADMIN_PW || 'aliya2026')) {
      sessionStorage.setItem('aliya_admin', 'ok')
      setAuth(true)
    } else {
      setPwErr(true)
      setTimeout(() => setPwErr(false), 2000)
    }
  }

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/aliya-admin/stats')
      const data = await res.json()
      setStats(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (auth) loadStats() }, [auth, loadStats])

  async function generatePosts() {
    setGenerating(true)
    try {
      const res = await fetch('/api/aliya-admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone }),
      })
      const data = await res.json()
      setPosts(data.posts || [])
    } finally {
      setGenerating(false)
    }
  }

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Password Gate ─────────────────────────────────────────────────────────

  if (!auth) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', width: 360, boxShadow: '0 4px 24px rgba(0,0,0,.08)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✈️</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 4px' }}>AliyaToday Admin</h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>Staff access only</p>
        <input
          type="password" placeholder="Password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ width: '100%', padding: '11px 14px', border: `1px solid ${pwErr ? '#ef4444' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
        />
        {pwErr && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 10px' }}>Incorrect password</p>}
        <button onClick={login} style={{ width: '100%', background: '#c47d1a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Enter
        </button>
      </div>
    </div>
  )

  // ── Sidebar ───────────────────────────────────────────────────────────────

  const NAV = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'articles' as const, label: 'Articles', icon: '📝' },
    { id: 'posts'    as const, label: 'FB Post Generator', icon: '📲' },
    { id: 'links'   as const, label: 'Pinned Links', icon: '📌' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: '#111', color: '#fff', padding: '24px 0', position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>✈️</div>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#fff' }}>AliyaToday</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Admin Dashboard</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', background: tab === n.id ? '#c47d1a' : 'none',
              border: 'none', color: tab === n.id ? '#fff' : '#9ca3af',
              fontWeight: tab === n.id ? 700 : 500, fontSize: 13,
              cursor: 'pointer', textAlign: 'left', borderRadius: 0, fontFamily: 'Inter, sans-serif'
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #222' }}>
          <a href={FB_GROUP} target="_blank" rel="noopener" style={{ display: 'block', background: '#1877f2', color: '#fff', borderRadius: 7, padding: '8px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
            👥 Facebook Group
          </a>
          <div style={{ marginTop: 10 }}>
            {['aliyatoday.com','jewishnewsnow.com','jewishpropertyreport.com'].map(d => (
              <a key={d} href={`https://${d}`} target="_blank" rel="noopener" style={{ display: 'block', fontSize: 11, color: '#6b7280', textDecoration: 'none', padding: '2px 0' }}>
                → {d}
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: '28px 32px' }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: 0 }}>Overview</h1>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>

            {loading ? <div style={{ color: '#9ca3af' }}>Loading...</div> : stats && (
              <>
                {/* Top stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                  {[
                    { label: 'Total Articles', value: stats.totals.articles, icon: '📝', sub: `${stats.totals.today} published today` },
                    { label: 'Total Subscribers', value: stats.totals.subscribers, icon: '📧', sub: 'across all 3 sites' },
                    { label: 'FB Group', value: 'Join', icon: '👥', sub: 'facebook.com/groups/...', link: FB_GROUP },
                  ].map(s => (
                    <Card key={s.label}>
                      <div style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{s.label}</div>
                            {s.link ? (
                              <a href={s.link} target="_blank" rel="noopener" style={{ fontSize: 26, fontWeight: 900, color: '#1877f2', textDecoration: 'none' }}>{s.value}</a>
                            ) : (
                              <div style={{ fontSize: 32, fontWeight: 900, color: '#111' }}>{s.value}</div>
                            )}
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.sub}</div>
                          </div>
                          <span style={{ fontSize: 28 }}>{s.icon}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Per-site breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                  {stats.sites.map(site => (
                    <Card key={site.slug}>
                      <div style={{ borderTop: `3px solid ${site.color}`, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                          <span style={{ fontSize: 20 }}>{site.icon}</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#111' }}>{site.name}</div>
                            <a href={`https://${site.domain}`} target="_blank" rel="noopener" style={{ fontSize: 11, color: site.color }}>{site.domain}</a>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          {[
                            { label: 'Articles', val: site.articles },
                            { label: 'Today', val: site.todayArticles },
                            { label: 'Subs', val: site.subscribers },
                          ].map(m => (
                            <div key={m.label} style={{ background: '#f9fafb', borderRadius: 7, padding: '10px 8px', textAlign: 'center' }}>
                              <div style={{ fontWeight: 900, fontSize: 20, color: site.color }}>{m.val}</div>
                              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</div>
                            </div>
                          ))}
                        </div>
                        {/* Latest article */}
                        {site.latest[0] && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Latest</div>
                            <a href={`https://${site.domain}/article/${site.slug}/${site.latest[0].slug}`} target="_blank" rel="noopener" style={{ fontSize: 12, fontWeight: 700, color: '#111', textDecoration: 'none', lineHeight: 1.4, display: 'block' }}>
                              {site.latest[0].title}
                            </a>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{fmt(site.latest[0].published_at)}</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Recent subscribers */}
                {stats.recentSubscribers.length > 0 && (
                  <Card>
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 800, fontSize: 13, color: '#111' }}>📧 Recent Subscribers</div>
                    <div style={{ padding: '8px 0' }}>
                      {stats.recentSubscribers.map((s, i) => {
                        const site = stats.sites.find(st => st.slug === s.site_slug)
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: i < stats.recentSubscribers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 16 }}>{site?.icon || '📧'}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{s.email}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{site?.name}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(s.subscribed_at)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* ── ARTICLES TAB ── */}
        {tab === 'articles' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: 0 }}>Articles</h1>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Latest published articles across all 3 Jewish sites</p>
            </div>

            {loading ? <div style={{ color: '#9ca3af' }}>Loading...</div> : stats?.sites.map(site => (
              <Card key={site.slug} style={{ marginBottom: 20 }}>
                <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{site.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{site.name}</span>
                  <span style={{ marginLeft: 'auto', background: site.color + '18', color: site.color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{site.articles} total</span>
                </div>
                {site.latest.map((a, i) => (
                  <div key={a.slug} style={{ padding: '14px 20px', borderBottom: i < site.latest.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <a href={`https://${site.domain}/article/${site.slug}/${a.slug}`} target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 700, color: '#111', textDecoration: 'none', lineHeight: 1.45, display: 'block', marginBottom: 3 }}>
                        {a.title}
                      </a>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{a.excerpt?.substring(0, 100)}…</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: site.color, background: site.color + '12', padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>{a.category}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(a.published_at)}</div>
                    </div>
                  </div>
                ))}
              </Card>
            ))}
          </>
        )}

        {/* ── FB POSTS TAB ── */}
        {tab === 'posts' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: 0 }}>Facebook Post Generator</h1>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Generate today's 3 posts — one per site — then copy and paste straight into Facebook.</p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={tone} onChange={e => setTone(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', background: '#fff', cursor: 'pointer' }}>
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
              <button onClick={generatePosts} disabled={generating} style={{ background: '#c47d1a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}>
                {generating ? '✨ Generating...' : '✨ Generate Today\'s 3 Posts'}
              </button>
            </div>

            {/* Posts */}
            {posts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {posts.map((p, i) => (
                  <Card key={i}>
                    {/* Header */}
                    <div style={{ background: p.siteColor + '12', borderBottom: `1px solid ${p.siteColor}30`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{p.siteIcon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{p.site}</div>
                          <a href={p.article.url} target="_blank" rel="noopener" style={{ fontSize: 11, color: p.siteColor }}>
                            {p.article.title.substring(0, 55)}…
                          </a>
                        </div>
                      </div>
                      <button onClick={() => copy(`post-${i}`, p.fullPost)} style={{ background: copied === `post-${i}` ? '#16a34a' : p.siteColor, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                        {copied === `post-${i}` ? '✅ Copied!' : '📋 Copy Post + Link'}
                      </button>
                    </div>
                    {/* Post body */}
                    <div style={{ padding: '20px', whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8, color: '#111', fontFamily: 'Georgia, serif' }}>
                      {p.postBody}
                    </div>
                    {/* Link preview */}
                    <div style={{ margin: '0 20px 18px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#6b7280', wordBreak: 'break-all', fontFamily: 'monospace' }}>👉 {p.article.url}</span>
                      <button onClick={() => copy(`link-${i}`, p.article.url)} style={{ background: copied === `link-${i}` ? '#16a34a' : '#f3f4f6', color: copied === `link-${i}` ? '#fff' : '#374151', border: '1px solid #e5e7eb', borderRadius: 5, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
                        {copied === `link-${i}` ? '✅' : 'Copy link'}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📲</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Ready when you are</div>
                <div style={{ fontSize: 13 }}>Choose a tone and generate your 3 daily posts</div>
              </div>
            )}
          </>
        )}

        {/* ── PINNED LINKS TAB ── */}
        {tab === 'links' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: 0 }}>Pinned Links</h1>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>The 3 mandatory article links for your Facebook group description</p>
            </div>

            {/* Group description block */}
            <Card style={{ marginBottom: 24 }}>
              <div style={{ padding: '16px 20px', background: '#f0fdf4', borderBottom: '1px solid #86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#15803d' }}>👥 Facebook Group</div>
                  <a href={FB_GROUP} target="_blank" rel="noopener" style={{ fontSize: 12, color: '#16a34a' }}>{FB_GROUP}</a>
                </div>
                <button onClick={() => copy('fbgroup', FB_GROUP)} style={{ background: copied === 'fbgroup' ? '#16a34a' : '#16a34a', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {copied === 'fbgroup' ? '✅ Copied!' : '📋 Copy Link'}
                </button>
              </div>
            </Card>

            {/* Mandatory links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {MANDATORY_LINKS.map((l, i) => (
                <Card key={i}>
                  <div style={{ padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ background: '#c47d1a', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>{l.emoji}</span>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{l.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 12 }}>{l.url}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => copy(`mandatory-${i}`, l.url)} style={{ background: copied === `mandatory-${i}` ? '#16a34a' : '#c47d1a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                          {copied === `mandatory-${i}` ? '✅ Copied!' : '📋 Copy URL'}
                        </button>
                        <a href={l.url} target="_blank" rel="noopener" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 14px', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
                          Preview →
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Copy-ready group description */}
            <Card>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>📋 Full Group Description (copy-ready)</span>
                <button onClick={() => copy('groupdesc', `🇮🇱 Welcome to Our Aliyah Community!\n\nThis group is your home for honest, up-to-date guidance on making Aliyah in 2026.\n\n📌 Must-Read Resources:\n\n💰 Aliyah Cost Breakdown 2026:\nhttps://aliyatoday.com/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six\n\n🏥 Kupat Holim Guide 2026:\nhttps://aliyatoday.com/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile\n\n📋 Aliyah Checklist 2026:\nhttps://aliyatoday.com/article/aliya-today/2026-06-14-aliyah-checklist-2026-disclosure-timeline-splits-winners-losers\n\nMore daily guides 👉 AliyaToday.com\n\nAsk questions. Share your story. Help each other home. 🕍`)} style={{ background: copied === 'groupdesc' ? '#16a34a' : '#111', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {copied === 'groupdesc' ? '✅ Copied!' : '📋 Copy All'}
                </button>
              </div>
              <div style={{ padding: '20px', whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.9, color: '#374151', fontFamily: 'Georgia, serif', background: '#fafafa' }}>
{`🇮🇱 Welcome to Our Aliyah Community!

This group is your home for honest, up-to-date guidance on making Aliyah in 2026.

📌 Must-Read Resources:

💰 Aliyah Cost Breakdown 2026:
https://aliyatoday.com/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six

🏥 Kupat Holim Guide 2026:
https://aliyatoday.com/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile

📋 Aliyah Checklist 2026:
https://aliyatoday.com/article/aliya-today/2026-06-14-aliyah-checklist-2026-disclosure-timeline-splits-winners-losers

More daily guides 👉 AliyaToday.com

Ask questions. Share your story. Help each other home. 🕍`}
              </div>
            </Card>
          </>
        )}

      </main>
    </div>
  )
}
