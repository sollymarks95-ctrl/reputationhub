'use client'

import { useState, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Article {
  slug: string
  title: string
  excerpt: string
  category: string
  published_at: string
  site_slug: string
  site_name: string
  site_domain: string
}

interface Post {
  site: string
  siteIcon: string
  siteColor: string
  article: Article
  post: string
  tone: string
}

// ── Site config ───────────────────────────────────────────────────────────────

const JEWISH_SITES = [
  { slug: 'jewish-news-now',      name: 'Jewish News Now',      domain: 'jewishnewsnow.com',      icon: '📰', color: '#1a56b0' },
  { slug: 'jewish-property-report', name: 'Jewish Property Report', domain: 'jewishpropertyreport.com', icon: '🏠', color: '#0a7c4e' },
  { slug: 'aliya-today',          name: 'Aliya Today',          domain: 'aliyatoday.com',          icon: '✈️', color: '#c47d1a' },
]

const TONES = ['Informative', 'Warm & Personal', 'Direct & Punchy', 'Question Hook', 'Storytelling']

// ── Facebook Group Description ─────────────────────────────────────────────

const GROUP_DESCRIPTION = `🇮🇱 Welcome to Our Aliyah Community!

This group is your home for honest, up-to-date guidance on making Aliya in 2026.

📌 Must-Read Resources (bookmark these):

💰 Aliyah Cost Breakdown 2026 — What it ACTUALLY costs from pre-arrival to Month 6:
https://aliyatoday.com/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six

🏥 Kupat Holim Guide — Which health fund is right for your family:
https://aliyatoday.com/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile

📋 The 2026 Aliyah Checklist — Disclosure timeline, winners & losers:
https://aliyatoday.com/article/aliya-today/2026-06-14-aliyah-checklist-2026-disclosure-timeline-splits-winners-losers

More daily guides 👉 AliyaToday.com

Ask questions. Share your story. Help each other home. 🕍`

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function JewishPostsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [groupDescCopied, setGroupDescCopied] = useState(false)
  const [selectedTone, setSelectedTone] = useState('Warm & Personal')
  const [tab, setTab] = useState<'posts' | 'group'>('posts')
  const [error, setError] = useState<string | null>(null)

  // Load today's latest article from each site
  useEffect(() => {
    loadArticles()
  }, [])

  async function loadArticles() {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/jewish-posts-articles')
      if (!res.ok) throw new Error('Failed to load articles')
      const data = await res.json()
      setArticles(data.articles || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function generatePosts() {
    if (!articles.length) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/jewish-posts-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: articles.slice(0, 3), tone: selectedTone })
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  function copyPost(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function copyGroupDesc() {
    navigator.clipboard.writeText(GROUP_DESCRIPTION)
    setGroupDescCopied(true)
    setTimeout(() => setGroupDescCopied(false), 2000)
  }

  const siteFor = (slug: string) => JEWISH_SITES.find(s => s.slug === slug)

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 32 }}>🕍</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: 0 }}>Jewish Posts</h1>
        </div>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
          Daily Facebook posts for your Jewish community groups — copy, personalise, post.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 28 }}>
        {(['posts', 'group'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 22px', fontWeight: 700, fontSize: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? '#111' : '#6b7280',
            borderBottom: tab === t ? '2px solid #111' : '2px solid transparent',
            marginBottom: -2, fontFamily: 'Inter, sans-serif'
          }}>
            {t === 'posts' ? '📲 Daily Posts' : '👥 Group Description'}
          </button>
        ))}
      </div>

      {/* ── DAILY POSTS TAB ── */}
      {tab === 'posts' && (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <select value={selectedTone} onChange={e => setSelectedTone(e.target.value)} style={{
              padding: '9px 14px', border: '1px solid #d1d5db', borderRadius: 7,
              fontSize: 13, fontFamily: 'Inter, sans-serif', background: '#fff', cursor: 'pointer'
            }}>
              {TONES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={generatePosts} disabled={generating || loading || !articles.length} style={{
              background: '#111', color: '#fff', border: 'none', borderRadius: 7,
              padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.7 : 1, fontFamily: 'Inter, sans-serif'
            }}>
              {generating ? '✨ Generating...' : '✨ Generate Today\'s Posts'}
            </button>
            <button onClick={loadArticles} disabled={loading} style={{
              background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 7,
              padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}>
              🔄 Refresh Articles
            </button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Today's Articles Preview */}
          {articles.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                Today's Source Articles
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {articles.slice(0, 3).map(a => {
                  const site = siteFor(a.site_slug)
                  return (
                    <div key={a.slug} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px', borderLeft: `3px solid ${site?.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 16 }}>{site?.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: site?.color, textTransform: 'uppercase', letterSpacing: '.06em' }}>{site?.name}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111', lineHeight: 1.4, marginBottom: 4 }}>{a.title}</div>
                      <a href={`https://${a.site_domain}/article/${a.site_slug}/${a.slug}`} target="_blank" rel="noopener" style={{ fontSize: 11, color: site?.color }}>View article →</a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              Loading articles...
            </div>
          )}

          {/* Generated Posts */}
          {posts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {posts.map((p, i) => {
                const site = siteFor(p.article.site_slug)
                const url = `https://${p.article.site_domain}/article/${p.article.site_slug}/${p.article.slug}`
                const fullPost = p.post + `\n\n👉 ${url}`
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                    {/* Card header */}
                    <div style={{ background: site?.color + '12', borderBottom: `1px solid ${site?.color}30`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{site?.icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{site?.name}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>Post {i + 1} · {p.tone}</div>
                        </div>
                      </div>
                      <button onClick={() => copyPost(`post-${i}`, fullPost)} style={{
                        background: copied === `post-${i}` ? '#16a34a' : site?.color,
                        color: '#fff', border: 'none', borderRadius: 6,
                        padding: '7px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                      }}>
                        {copied === `post-${i}` ? '✅ Copied!' : '📋 Copy Post'}
                      </button>
                    </div>
                    {/* Post body */}
                    <div style={{ padding: '20px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.75, color: '#374151', fontFamily: 'Georgia, serif' }}>
                      {p.post}
                    </div>
                    {/* Link preview */}
                    <div style={{ margin: '0 20px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6b7280', wordBreak: 'break-all' }}>{url}</span>
                      <a href={url} target="_blank" rel="noopener" style={{ fontSize: 12, color: site?.color, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 12 }}>Preview →</a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!posts.length && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Ready to generate</div>
              <div style={{ fontSize: 14 }}>Choose a tone and click "Generate Today's Posts"</div>
            </div>
          )}
        </>
      )}

      {/* ── GROUP DESCRIPTION TAB ── */}
      {tab === 'group' && (
        <div>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d', marginBottom: 4 }}>📌 Facebook Group Description</div>
            <div style={{ fontSize: 13, color: '#166534' }}>Copy this and paste it into your Facebook group's "About" / Description section. It includes the 3 mandatory links pointing to AliyaToday.com</div>
          </div>

          {/* Top 3 Links Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { num: '1', emoji: '💰', title: 'Aliyah Cost Breakdown 2026', desc: 'Pre-arrival to month 6 costs — every oleh needs this', url: 'https://aliyatoday.com/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six' },
              { num: '2', emoji: '🏥', title: 'Kupat Holim Guide 2026', desc: 'Which health fund is right for you — must choose within 90 days', url: 'https://aliyatoday.com/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile' },
              { num: '3', emoji: '📋', title: 'Aliyah Checklist 2026', desc: 'Disclosure timeline & what determines winners vs losers', url: 'https://aliyatoday.com/article/aliya-today/2026-06-14-aliyah-checklist-2026-disclosure-timeline-splits-winners-losers' },
            ].map(l => (
              <div key={l.num} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, borderTop: '3px solid #c47d1a' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ background: '#c47d1a', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{l.num}</span>
                  <span style={{ fontSize: 18 }}>{l.emoji}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 4 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.5 }}>{l.desc}</div>
                <a href={l.url} target="_blank" rel="noopener" style={{ fontSize: 11, color: '#c47d1a', fontWeight: 600, wordBreak: 'break-all' }}>View article →</a>
              </div>
            ))}
          </div>

          {/* Description Preview */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>📋 Group Description Text</span>
              <button onClick={copyGroupDesc} style={{
                background: groupDescCopied ? '#16a34a' : '#111', color: '#fff',
                border: 'none', borderRadius: 6, padding: '7px 16px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
              }}>
                {groupDescCopied ? '✅ Copied!' : '📋 Copy All'}
              </button>
            </div>
            <div style={{ padding: '20px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.85, color: '#374151', fontFamily: 'Georgia, serif' }}>
              {GROUP_DESCRIPTION}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
