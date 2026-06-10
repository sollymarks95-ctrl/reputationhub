'use client'
import React from 'react'

interface JewishTemplateProps {
  site: any
  articles: any[]
}

const JEWISH_SLUGS = ['jewish-news-now', 'jewish-property-report', 'aliya-today']

// Category labels per portal
const CATS: Record<string, string[]> = {
  'jewish-news-now':        ['All', 'Israel', 'Diaspora', 'Community', 'Culture', 'World'],
  'jewish-property-report': ['All', 'Tel Aviv', 'Jerusalem', 'Market', 'Investing', 'Guides'],
  'aliya-today':            ['All', 'Process', 'Housing', 'Culture', 'Community', 'Tips'],
}

export default function JewishTemplate({ site, articles }: JewishTemplateProps) {
  const [cat, setCat]     = React.useState('All')
  const [open, setOpen]   = React.useState(false)
  const slug              = site?.slug || ''
  const P                 = site?.primary_color || '#1a56b0'
  const cats              = CATS[slug] || ['All', 'News', 'Features', 'Guides']
  const filtered          = cat === 'All' ? articles : articles.filter((a: any) => a.category?.toLowerCase().includes(cat.toLowerCase()))
  const hero              = filtered[0]
  const rest              = filtered.filter((a: any) => a.id !== hero?.id)
  const featured          = rest.slice(0, 3)
  const grid              = rest.slice(3)
  const isProperty        = slug === 'jewish-property-report'
  const isAliya           = slug === 'aliya-today'

  const img = (a: any, i: number) => {
    if (a?.cover_image_url?.startsWith('http')) return a.cover_image_url
    const imgs = [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', // Jerusalem
      'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80', // Tel Aviv
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80', // Israel flag
      'https://images.unsplash.com/photo-1565118531796-763e5082d113?w=800&q=80', // Old city
      'https://images.unsplash.com/photo-1559894524-5b7a9e38a39d?w=800&q=80', // Menorah
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', // Community
    ]
    return imgs[i % imgs.length]
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#f9f6f0;font-family:'Georgia',serif}
        .jt-wrap{max-width:1280px;margin:0 auto;padding:0 24px}
        .jt-mobile{display:none}
        .jt-desktop{display:block}
        a{text-decoration:none;color:inherit}
        a:hover{opacity:.8}
        .jt-tag{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:3px 8px;border-radius:2px;background:${P};color:#fff;margin-bottom:8px}
        .jt-tag-outline{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border:1px solid ${P};color:${P};border-radius:2px;margin-bottom:6px}
        @media(max-width:768px){
          .jt-mobile{display:block}
          .jt-desktop{display:none}
          .jt-wrap{padding:0 16px}
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background: '#fff', borderBottom: `3px solid ${P}`, boxShadow: '0 2px 8px rgba(0,0,0,.07)' }}>
        <div className="jt-wrap">
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e8e0d0', fontSize: 11, color: '#888' }}>
            <span>✡ {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span style={{ display: 'flex', gap: 16 }}>
              <a href="/legal/privacy" style={{ color: '#888' }}>Privacy</a>
              <a href="/about" style={{ color: '#888' }}>About</a>
            </span>
          </div>

          {/* Masthead */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0 14px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: P,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#fff', flexShrink: 0
              }}>✡</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.5px', lineHeight: 1.1, fontFamily: 'Georgia, serif' }}>
                  {site?.name}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2, letterSpacing: '.04em' }}>{site?.tagline}</div>
              </div>
            </a>

            {/* Desktop nav */}
            <nav className="jt-desktop" style={{ display: 'flex', gap: 4 }}>
              {cats.slice(1).map(c => (
                <button key={c} onClick={() => setCat(c === cat ? 'All' : c)}
                  style={{ background: cat === c ? P : 'transparent', color: cat === c ? '#fff' : '#333', border: `1px solid ${cat === c ? P : '#ddd'}`, padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  {c}
                </button>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button className="jt-mobile" onClick={() => setOpen(!open)}
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#333', padding: 4 }}>
              {open ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile nav */}
          {open && (
            <div className="jt-mobile" style={{ borderTop: `1px solid #e8e0d0`, padding: '12px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cats.map(c => (
                <button key={c} onClick={() => { setCat(c); setOpen(false) }}
                  style={{ background: cat === c ? P : '#f5f0e8', color: cat === c ? '#fff' : '#333', border: 'none', padding: '8px 14px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Category pill bar (desktop) */}
          <div className="jt-desktop" style={{ display: 'flex', gap: 24, borderTop: '1px solid #e8e0d0', padding: '10px 0' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: cat === c ? 800 : 500, color: cat === c ? P : '#555', cursor: 'pointer', borderBottom: cat === c ? `2px solid ${P}` : '2px solid transparent', paddingBottom: 6, fontFamily: 'Georgia, serif' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      {hero && (
        <div style={{ background: '#1a1a1a', marginBottom: 32 }}>
          <div className="jt-wrap">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0, minHeight: 380 }}>
              {/* Hero image */}
              <a href={`/article/${slug}/${hero.slug}`} style={{ display: 'block', overflow: 'hidden', position: 'relative' }}>
                <img src={img(hero, 0)} alt={hero.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: .85 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
                  <span className="jt-tag">{hero.category || cats[1]}</span>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.25, fontFamily: 'Georgia, serif' }}>{hero.title}</h1>
                  <p style={{ fontSize: 12, color: '#ddd', marginTop: 8 }}>{hero.author_name} · {fmt(hero.published_at)}</p>
                </div>
              </a>

              {/* Hero sidebar — top 3 stories */}
              <div style={{ background: '#111', padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: P, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 14 }}>Latest Stories</div>
                {featured.map((a: any, i: number) => (
                  <a key={a.id} href={`/article/${slug}/${a.slug}`}
                    style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: i < 2 ? '1px solid #2a2a2a' : 'none', alignItems: 'flex-start' }}>
                    <img src={img(a, i+1)} alt="" style={{ width: 70, height: 52, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 9, color: P, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{a.category || cats[1]}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e0d0', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{a.title}</div>
                      <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{fmt(a.published_at)}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className="jt-wrap" style={{ paddingBottom: 60 }}>

        {/* Breaking bar */}
        {articles.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: P, color: '#fff', padding: '10px 16px', borderRadius: 6, marginBottom: 28, fontSize: 12 }}>
            <span style={{ fontWeight: 900, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', background: '#fff', color: P, padding: '2px 8px', borderRadius: 3, flexShrink: 0 }}>LIVE</span>
            <span style={{ fontWeight: 600 }}>{articles[0]?.title}</span>
          </div>
        )}

        {/* 3-column article grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, marginBottom: 48 }}>
          {grid.slice(0, 12).map((a: any, i: number) => (
            <a key={a.id} href={`/article/${slug}/${a.slug}`}
              style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #e8e0d0', paddingBottom: 20 }}>
              <img src={img(a, i+4)} alt={a.title}
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 4, marginBottom: 12 }} />
              <div className="jt-tag-outline">{a.category || cats[1 + (i % (cats.length - 1))]}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.35, marginBottom: 8, fontFamily: 'Georgia, serif' }}>{a.title}</h3>
              {a.excerpt && <p style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 8 }}>{a.excerpt?.slice(0, 100)}…</p>}
              <div style={{ fontSize: 10, color: '#999', marginTop: 'auto', paddingTop: 8 }}>
                {a.author_name || 'Staff Reporter'} · {fmt(a.published_at)}
              </div>
            </a>
          ))}
        </div>

        {/* More articles — compact list */}
        {grid.length > 12 && (
          <div style={{ borderTop: `3px solid ${P}`, paddingTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a', marginBottom: 20, fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '.06em' }}>More Stories</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 40px' }}>
              {grid.slice(12).map((a: any, i: number) => (
                <a key={a.id} href={`/article/${slug}/${a.slug}`}
                  style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid #e8e0d0', alignItems: 'flex-start' }}>
                  <img src={img(a, i+16)} alt="" style={{ width: 80, height: 58, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 9, color: P, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{a.category || cats[1]}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{fmt(a.published_at)}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1a1a1a', color: '#aaa', padding: '40px 0 24px', marginTop: 20 }}>
        <div className="jt-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>✡</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif' }}>{site?.name}</span>
              </div>
              <p style={{ fontSize: 12, color: '#666', maxWidth: 320, lineHeight: 1.7 }}>{site?.tagline}</p>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Sections</div>
                {cats.slice(1, 5).map(c => <div key={c} style={{ fontSize: 12, marginBottom: 6 }}><a href={`/?cat=${c}`} style={{ color: '#888' }}>{c}</a></div>)}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Legal</div>
                <div style={{ fontSize: 12, marginBottom: 6 }}><a href="/legal/privacy" style={{ color: '#888' }}>Privacy Policy</a></div>
                <div style={{ fontSize: 12 }}><a href="/legal/terms" style={{ color: '#888' }}>Terms</a></div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 18, fontSize: 11, color: '#444', display: 'flex', justifyContent: 'space-between' }}>
            <span>© {new Date().getFullYear()} {site?.name}. All rights reserved.</span>
            <span>✡</span>
          </div>
        </div>
      </footer>

      {/* ── MOBILE OVERRIDE CSS ── */}
      <style>{`
        @media(max-width:768px){
          .jt-wrap section,
          .jt-wrap>div>div[style*="grid-template-columns: repeat(3"]{
            grid-template-columns:1fr!important
          }
          .jt-wrap>div>div[style*="grid-template-columns: 1fr 380px"]{
            grid-template-columns:1fr!important
          }
          .jt-wrap>div>div[style*="grid-template-columns: repeat(2"]{
            grid-template-columns:1fr!important
          }
        }
      `}</style>
    </>
  )
}
