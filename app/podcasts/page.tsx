import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const DOMAIN_TO_SLUG: Record<string, string> = {
  'nex-wire.com':   'global-trade-wire',
  'finvexx.com':    'finance-terminal',
  'bizplezx.com':   'business-pulse',
  'aurexhq.com':    'gold-markets-today',
  'verivex.co':     'trust-score',
  'invexhuby.com':  'invest-data',
  'signalixx.com':  'market-radar',
  'execvex.com':    'executive-network',
  'cryptoxos.com':  'crypto-hub',
}

const SITE_META: Record<string, { name: string; color: string; home: string }> = {
  'global-trade-wire':  { name: 'Nex-Wire Intelligence', color: '#E03131', home: '/' },
  'finance-terminal':   { name: 'Finvexx Markets',       color: '#1971C2', home: '/' },
  'business-pulse':     { name: 'Bizplexz Executive',    color: '#6741D9', home: '/' },
  'gold-markets-today': { name: 'AurexHQ',               color: '#B08700', home: '/' },
  'trust-score':        { name: 'Verivex Trust',         color: '#00B67A', home: '/' },
  'invest-data':        { name: 'InvexHuby',             color: '#0EA5E9', home: '/' },
  'market-radar':       { name: 'Signalixx',             color: '#7C3AED', home: '/' },
  'executive-network':  { name: 'ExecVex',               color: '#DC2626', home: '/' },
  'crypto-hub':         { name: 'CryptoXos',             color: '#F97316', home: '/' },
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  const host = (h.get('host') || '').replace(/^www\./, '').split(':')[0]
  const slug = DOMAIN_TO_SLUG[host] || 'global-trade-wire'
  const meta = SITE_META[slug] || SITE_META['global-trade-wire']
  return {
    title: `Podcast — ${meta.name}`,
    description: `Expert audio episodes from ${meta.name} — in-depth market analysis, expert interviews and financial intelligence.`,
    robots: 'index, follow',
  }
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default async function PodcastPage() {
  const h = await headers()
  const host = (h.get('host') || '').replace(/^www\./, '').split(':')[0]
  const slug = DOMAIN_TO_SLUG[host] || 'global-trade-wire'
  const meta = SITE_META[slug] || SITE_META['global-trade-wire']
  const p = meta.color

  const { data: episodes } = await getDb()
    .from('podcast_scripts')
    .select('*')
    .eq('site_slug', slug)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const eps = episodes || []

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#0d0d0d', color: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0 }
        a { text-decoration: none; color: inherit }
        .ep-card { background: #181818; border: 1px solid #2a2a2a; border-radius: 12px; padding: 28px; transition: border-color .2s }
        .ep-card:hover { border-color: ${p}55 }
        .play-btn { width: 52px; height: 52px; border-radius: 50%; background: ${p}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform .15s }
        .play-btn:hover { transform: scale(1.08) }
        .progress { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #333; outline: none; cursor: pointer }
        .progress::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${p}; cursor: pointer }
        @media(max-width:640px) { .ep-grid { padding: 16px !important } .ep-card { padding: 18px } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e1e1e', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: p, letterSpacing: '.04em' }}>
            ← {meta.name}
          </Link>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>Podcast</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, #111 0%, ${p}18 100%)`, borderBottom: '1px solid #1e1e1e', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, background: p, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🎙</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: p, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Podcast Series</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>{eps[0]?.show_name || `${meta.name} Podcast`}</h1>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>In-depth expert interviews on markets, strategy and financial intelligence.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#64748b' }}>
            <span>🎧 {eps.length} Episodes</span>
            <span>⏱ ~{Math.round(eps.reduce((s, e: any) => s + (e.duration_minutes || 20), 0) / Math.max(eps.length, 1))} min avg</span>
            <span>📅 New episodes weekly</span>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="ep-grid" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {eps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#475569' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎙</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Episodes Coming Soon</div>
            <div style={{ fontSize: 14 }}>New episodes are produced weekly. Check back soon.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {eps.map((ep: any, i: number) => (
              <div key={ep.id} className="ep-card">
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  {/* Episode number */}
                  <div style={{ minWidth: 36, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '.08em', textTransform: 'uppercase' }}>EP</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: p, lineHeight: 1 }}>{ep.episode_number || i + 1}</div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, color: '#f1f5f9' }}>{ep.title}</h2>
                    
                    {ep.guest_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: p + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{ep.guest_name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{ep.guest_role}</div>
                        </div>
                      </div>
                    )}

                    {ep.topic && (
                      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>
                        {ep.topic}
                      </p>
                    )}

                    {/* Meta + Player */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {ep.audio_url ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#111', borderRadius: 8, padding: '10px 14px' }}>
                          <AudioPlayer src={ep.audio_url} color={p} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a1a1a', borderRadius: 8, padding: '8px 14px', border: `1px solid ${p}33` }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#64748b' }}>Audio in production</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#475569', alignItems: 'center', flexShrink: 0 }}>
                        <span>⏱ {ep.duration_minutes || 20} min</span>
                        <span>📅 {timeAgo(ep.created_at)}</span>
                        <span style={{ color: '#64748b' }}>Host: {ep.host_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AudioPlayer({ src, color }: { src: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <button className="play-btn" style={{ background: color }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
      </button>
      <div style={{ flex: 1 }}>
        <input type="range" defaultValue="0" min="0" max="100" className="progress" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 2 }}>
          <span>0:00</span><span>--:--</span>
        </div>
      </div>
    </div>
  )
}
