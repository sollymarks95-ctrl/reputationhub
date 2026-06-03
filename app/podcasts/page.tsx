import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PORTALS: Record<string, {
  slug: string; name: string; color: string; dark: boolean;
  font: string; bg: string; text: string; border: string; navBg: string; navText: string
}> = {
  'nex-wire.com':   { slug:'global-trade-wire',  name:'Nex-Wire Intelligence',    color:'#E03131', dark:false, font:"'Georgia','Times New Roman',serif", bg:'#fff',    text:'#111',    border:'#e5e7eb', navBg:'#111',    navText:'#fff' },
  'finvexx.com':    { slug:'finance-terminal',   name:'Finvexx Markets',          color:'#1971C2', dark:true,  font:"'IBM Plex Mono',monospace",         bg:'#0a0a0a', text:'#f1f5f9', border:'#1e1e1e', navBg:'#111',    navText:'#f1f5f9' },
  'bizplezx.com':   { slug:'business-pulse',     name:'Bizplezx Executive',       color:'#6741D9', dark:false, font:"'Playfair Display',Georgia,serif",   bg:'#fff',    text:'#111',    border:'#e5e7eb', navBg:'#111',    navText:'#fff' },
  'aurexhq.com':    { slug:'gold-markets-today', name:'AurexHQ',                  color:'#B08700', dark:false, font:"'DM Serif Display',Georgia,serif",   bg:'#F8F6F0', text:'#1A1A1A', border:'#e8e0d0', navBg:'#1A1A1A', navText:'#F8F6F0' },
  'verivex.co':     { slug:'trust-score',        name:'Verivex Trust',            color:'#00B67A', dark:false, font:"'Inter',system-ui,sans-serif",       bg:'#f8fafc', text:'#0f172a', border:'#e2e8f0', navBg:'#00B67A', navText:'#fff' },
  'invexhuby.com':  { slug:'invest-data',        name:'InvexHuby',                color:'#0EA5E9', dark:true,  font:"'Inter',system-ui,sans-serif",       bg:'#0d0d0d', text:'#f1f5f9', border:'#1e1e1e', navBg:'#111',    navText:'#f1f5f9' },
  'signalixx.com':  { slug:'market-radar',       name:'Signalixx',                color:'#7C3AED', dark:true,  font:"'Inter',system-ui,sans-serif",       bg:'#0d0d0d', text:'#f1f5f9', border:'#1e1e1e', navBg:'#111',    navText:'#f1f5f9' },
  'execvex.com':    { slug:'executive-network',  name:'ExecVex',                  color:'#DC2626', dark:true,  font:"'Inter',system-ui,sans-serif",       bg:'#0d0d0d', text:'#f1f5f9', border:'#1e1e1e', navBg:'#111',    navText:'#f1f5f9' },
  'cryptoxos.com':  { slug:'crypto-hub',         name:'CryptoXos',                color:'#F97316', dark:true,  font:"'Inter',system-ui,sans-serif",       bg:'#0d0d0d', text:'#f1f5f9', border:'#1e1e1e', navBg:'#111',    navText:'#f1f5f9' },
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
  const muted = p.dark ? '#64748b' : '#6b7280'
  const cardBg = p.dark ? '#181818' : p.bg === '#F8F6F0' ? '#fff' : '#f8fafc'
  const cardBorder = p.dark ? '#2a2a2a' : p.border

  return (
    <div style={{ fontFamily: p.font, background: p.bg, color: p.text, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;600;700&family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0 }
        a { text-decoration: none; color: inherit }
        .ep-card { background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 8px; padding: 24px; transition: border-color .2s, box-shadow .2s }
        .ep-card:hover { border-color: ${p.color}55; box-shadow: 0 2px 12px ${p.color}15 }
        .wave { display: flex; gap: 3px; align-items: flex-end; height: 20px }
        .wave span { width: 3px; border-radius: 2px; background: ${p.color}; animation: wave 1.2s infinite ease-in-out }
        .wave span:nth-child(2) { animation-delay: .15s }
        .wave span:nth-child(3) { animation-delay: .3s }
        .wave span:nth-child(4) { animation-delay: .45s }
        @keyframes wave { 0%,100%{height:4px} 50%{height:16px} }
        audio { accent-color: ${p.color} }
      `}</style>

      {/* Top nav — mirrors portal header style */}
      <div style={{ background: p.navBg, borderBottom: `1px solid ${p.dark ? '#1e1e1e' : p.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <Link href="/" style={{ fontFamily: p.font, fontSize: 14, fontWeight: 800, color: p.color, letterSpacing: '.04em', display: 'flex', alignItems: 'center', gap: 8 }}>
            ← {p.name}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="wave"><span /><span /><span /><span /></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: p.navText, opacity: .7, letterSpacing: '.1em', textTransform: 'uppercase' }}>Podcast</span>
          </div>
        </div>
      </div>

      {/* Hero banner — matches portal color palette */}
      <div style={{ background: `linear-gradient(135deg, ${p.dark ? '#111' : p.navBg} 0%, ${p.color}22 100%)`, borderBottom: `1px solid ${p.dark ? '#1e1e1e' : p.border}`, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, background: p.color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🎙</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>{p.name} · Podcast Series</div>
            <h1 style={{ fontFamily: p.font, fontSize: 26, fontWeight: 800, lineHeight: 1.2, color: p.dark ? '#f1f5f9' : p.text, marginBottom: 8 }}>
              {eps[0]?.show_name || `${p.name} Podcast`}
            </h1>
            <p style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>Expert interviews on markets, strategy and financial intelligence.</p>
            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: muted, marginTop: 12 }}>
              <span>🎧 {eps.length} Episodes</span>
              {eps.length > 0 && <span>⏱ ~{Math.round(eps.reduce((s: number, e: any) => s + (e.duration_minutes || 20), 0) / eps.length)} min avg</span>}
              <span>📅 Weekly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Episode list */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>
        {eps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: muted }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎙</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Episodes Coming Soon</div>
            <div style={{ fontSize: 14 }}>New episodes are produced weekly.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {eps.map((ep: any, i: number) => (
              <div key={ep.id} className="ep-card">
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  {/* Episode number pill */}
                  <div style={{ background: p.color + '18', border: `1px solid ${p.color}44`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: p.color, letterSpacing: '.1em', textTransform: 'uppercase' }}>EP</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: p.color, lineHeight: 1 }}>{ep.episode_number || i + 1}</div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontFamily: p.font, fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: p.dark ? '#f1f5f9' : p.text, marginBottom: 8 }}>{ep.title}</h2>

                    {ep.guest_name && (
                      <div style={{ fontSize: 13, color: muted, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: p.dark ? '#94a3b8' : '#374151' }}>{ep.guest_name}</span>
                        <span>·</span>
                        <span>{ep.guest_role}</span>
                        {ep.duration_minutes && <><span>·</span><span>⏱ {ep.duration_minutes} min</span></>}
                      </div>
                    )}

                    {ep.topic && (
                      <p style={{ fontSize: 13, color: muted, lineHeight: 1.65, marginBottom: 14 }}>{ep.topic}</p>
                    )}

                    {/* Audio */}
                    {(ep.audio_url || ep.mp3_url) ? (
                      <div style={{ background: p.dark ? '#111' : p.bg === '#F8F6F0' ? '#f0ebe0' : '#f1f5f9', borderRadius: 6, padding: '10px 14px' }}>
                        <audio controls src={ep.audio_url || ep.mp3_url} style={{ width: '100%', height: 32 }} preload="none" />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: p.dark ? '#1a1a1a' : '#f8f9fa', borderRadius: 6, border: `1px solid ${p.color}22`, width: 'fit-content' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                        <span style={{ fontSize: 12, color: muted }}>Audio coming soon · {timeAgo(ep.created_at)}</span>
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
      <div style={{ borderTop: `1px solid ${p.dark ? '#1e1e1e' : p.border}`, padding: '20px 24px', marginTop: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: p.color }}>← Back to {p.name}</Link>
          <span style={{ fontSize: 11, color: muted }}>© {new Date().getFullYear()} {p.name}</span>
        </div>
      </div>
    </div>
  )
}
