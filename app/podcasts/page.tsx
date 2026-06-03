import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PORTALS: Record<string, { slug: string; name: string; color: string }> = {
  'nex-wire.com':   { slug: 'global-trade-wire',  name: 'Nex-Wire Intelligence', color: '#E03131' },
  'finvexx.com':    { slug: 'finance-terminal',   name: 'Finvexx Markets',        color: '#1971C2' },
  'bizplezx.com':   { slug: 'business-pulse',     name: 'Bizplezx Executive',     color: '#6741D9' },
  'aurexhq.com':    { slug: 'gold-markets-today', name: 'AurexHQ',                color: '#B08700' },
  'verivex.co':     { slug: 'trust-score',        name: 'Verivex Trust',          color: '#00B67A' },
  'invexhuby.com':  { slug: 'invest-data',        name: 'InvexHuby',              color: '#0EA5E9' },
  'signalixx.com':  { slug: 'market-radar',       name: 'Signalixx',              color: '#7C3AED' },
  'execvex.com':    { slug: 'executive-network',  name: 'ExecVex',                color: '#DC2626' },
  'cryptoxos.com':  { slug: 'crypto-hub',         name: 'CryptoXos',              color: '#F97316' },
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  const host = (h.get('host') || '').replace(/^www\./, '').split(':')[0]
  const p = PORTALS[host] || PORTALS['nex-wire.com']
  return {
    title: `Podcast — ${p.name}`,
    description: `Expert audio episodes from ${p.name}. In-depth market analysis, expert interviews and financial intelligence.`,
    robots: 'index, follow',
    alternates: { canonical: `https://${host}/podcasts` },
  }
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function PodcastPage() {
  const h = await headers()
  const host = (h.get('host') || '').replace(/^www\./, '').split(':')[0]
  const p = PORTALS[host] || PORTALS['nex-wire.com']

  const { data: episodes } = await db()
    .from('podcast_scripts')
    .select('*')
    .eq('site_slug', p.slug)
    .eq('status', 'published')
    .order('episode_number')

  const eps = episodes || []

  return (
    <div style={{ fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", background: '#fff', color: '#111827', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0 }
        a { text-decoration: none; color: inherit }
        body { background: #fff }
        .ep-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px 28px; transition: border-color .18s, box-shadow .18s }
        .ep-card:hover { border-color: ${p.color}55; box-shadow: 0 2px 16px ${p.color}12 }
        audio { accent-color: ${p.color}; width: 100%; height: 34px }
        .wave { display: inline-flex; gap: 2px; align-items: flex-end; height: 16px; vertical-align: middle; margin-right: 6px }
        .wave span { width: 3px; border-radius: 1px; background: ${p.color}; animation: wv 1.1s infinite ease-in-out }
        .wave span:nth-child(2){ animation-delay:.15s }
        .wave span:nth-child(3){ animation-delay:.3s }
        @keyframes wv { 0%,100%{height:3px} 50%{height:13px} }
        @media(max-width:640px){ .ep-card{ padding: 16px 18px } }
      `}</style>

      {/* Top bar — white with portal colour accent */}
      <div style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: p.color, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>←</span> {p.name}
          </Link>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '.1em', textTransform: 'uppercase' }}>Podcast</div>
        </div>
      </div>

      {/* Hero — white with subtle coloured top border */}
      <div style={{ borderTop: `3px solid ${p.color}`, borderBottom: '1px solid #f3f4f6', background: '#fafafa', padding: '36px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ width: 64, height: 64, background: p.color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🎙</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>{p.name} · Podcast</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 8 }}>
              {eps[0]?.show_name || `${p.name} Podcast`}
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 12 }}>
              Expert interviews on markets, strategy and financial intelligence. New episodes every week.
            </p>
            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#9ca3af' }}>
              <span>🎧 {eps.length} Episode{eps.length !== 1 ? 's' : ''}</span>
              {eps.length > 0 && <span>⏱ ~{Math.round(eps.reduce((s: number, e: any) => s + (e.duration_minutes || 20), 0) / eps.length)} min avg</span>}
              <span>📅 Weekly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Episode list */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        {eps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎙</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Episodes Coming Soon</div>
            <div style={{ fontSize: 14 }}>New episodes are produced weekly. Check back soon.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {eps.map((ep: any, i: number) => (
              <div key={ep.id} className="ep-card">
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>

                  {/* Episode number */}
                  <div style={{ textAlign: 'center', minWidth: 48, flexShrink: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: p.color, letterSpacing: '.1em', textTransform: 'uppercase' }}>EP</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: p.color, lineHeight: 1 }}>{ep.episode_number || i + 1}</div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.4, marginBottom: 6 }}>{ep.title}</h2>

                    {ep.guest_name && (
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{ep.guest_name}</span>
                        <span>·</span><span>{ep.guest_role}</span>
                        {ep.duration_minutes && <><span>·</span><span style={{ color: '#9ca3af' }}>⏱ {ep.duration_minutes} min</span></>}
                        <span>·</span><span style={{ color: '#9ca3af' }}>{timeAgo(ep.created_at)}</span>
                      </div>
                    )}

                    {ep.topic && (
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65, marginBottom: 14 }}>{ep.topic}</p>
                    )}

                    {/* Audio player */}
                    {(ep.audio_url || ep.mp3_url) ? (
                      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
                        <audio controls src={ep.audio_url || ep.mp3_url} preload="none" />
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>Audio coming soon</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #f3f4f6', padding: '20px 24px', marginTop: 16 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: p.color }}>← Back to {p.name}</Link>
          <span style={{ fontSize: 11, color: '#d1d5db' }}>© {new Date().getFullYear()} {p.name}</span>
        </div>
      </div>
    </div>
  )
}
