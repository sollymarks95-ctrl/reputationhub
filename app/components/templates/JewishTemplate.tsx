'use client'
import React from 'react'


// ─── Shared Newsletter Subscribe Form ───
function SubscribeForm({ siteSlug, siteName, accent }: { siteSlug: string; siteName: string; accent: string }) {
  const [email, setEmail] = React.useState('')
  const [state, setState] = React.useState<'idle'|'loading'|'done'|'error'>('idle')
  const [msg, setMsg] = React.useState('')

  const submit = async () => {
    if (!email.includes('@')) { setMsg('Enter a valid email'); setState('error'); return }
    setState('loading')
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, site_slug: siteSlug, site_name: siteName, source: 'inline-form' })
      })
      const d = await r.json()
      if (d.ok) { setState('done'); setMsg(d.message || 'Subscribed!') }
      else { setState('error'); setMsg(d.error || 'Something went wrong') }
    } catch { setState('error'); setMsg('Connection error — try again') }
  }

  if (state === 'done') return (
    <div style={{ textAlign:'center', padding:'20px', background:`${accent}15`, borderRadius:10, border:`1px solid ${accent}40` }}>
      <div style={{ fontSize:28, marginBottom:8 }}>✉️</div>
      <div style={{ fontWeight:800, color:accent, fontSize:16 }}>{msg}</div>
      <div style={{ fontSize:12, color:'#666', marginTop:4 }}>Check your inbox for your first newsletter</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', gap:8 }}>
        <input
          type="email" placeholder="your@email.com" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ flex:1, padding:'12px 16px', borderRadius:8, border:`1px solid ${state==='error' ? '#ef4444' : '#e0e0e0'}`, fontSize:14, outline:'none', fontFamily:'inherit' }}
        />
        <button onClick={submit} disabled={state==='loading'}
          style={{ background:accent, color:'#fff', border:'none', padding:'12px 20px', borderRadius:8, fontSize:14, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap', opacity:state==='loading'?.7:1 }}>
          {state==='loading' ? '...' : 'Subscribe →'}
        </button>
      </div>
      {state==='error' && <div style={{ fontSize:12, color:'#ef4444' }}>{msg}</div>}
      <div style={{ fontSize:11, color:'#999' }}>Free · No spam · Unsubscribe anytime</div>
    </div>
  )
}

// ─── Jewish News Now ─── Bold breaking-news daily paper
function JewishNewsNow({ site, articles }: { site: any; articles: any[] }) {
  const [cat, setCat] = React.useState('All')
  const P = '#1a56b0'
  const cats = ['All','Israel','Diaspora','Community','Culture','World','Opinion']
  const filtered = cat === 'All' ? articles : articles.filter((a: any) => a.category?.toLowerCase().includes(cat.toLowerCase()))
  const hero = filtered[0]
  const rest = filtered.filter((a: any) => a.id !== hero?.id)
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const img = (a: any, i: number) => a?.cover_image_url?.startsWith('http') ? a.cover_image_url :
    ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
     'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80',
     'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
     'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
     'https://images.unsplash.com/photo-1565118531796-763e5082d113?w=800&q=80',
    ][i % 5]

  return (<>
    <style>{`
      *{box-sizing:border-box;margin:0;padding:0}body{background:#fff;font-family:'Times New Roman',Georgia,serif}
      .jnn-wrap{max-width:1200px;margin:0 auto;padding:0 20px}
      .jnn-mob{display:none}.jnn-desk{display:block}
      a{text-decoration:none;color:inherit}a:hover{color:${P}}
      @media(max-width:768px){.jnn-mob{display:block}.jnn-desk{display:none}.jnn-wrap{padding:0 14px}}
    `}</style>

    {/* Masthead — broadsheet style */}
    <div style={{ borderBottom: '4px solid #000', padding: '12px 0 0' }}>
      <div className="jnn-wrap">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; EST. 2026
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-1px', color: '#000', lineHeight: 1, fontFamily: 'Georgia, serif' }}>
            JEWISH NEWS NOW
          </h1>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4, fontStyle: 'italic' }}>The Jewish World, Today</div>
        </div>
        {/* Category bar */}
        <div className="jnn-desk" style={{ display: 'flex', justifyContent: 'center', gap: 0, borderBottom: '1px solid #000', marginBottom: 0 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ background: cat === c ? '#000' : 'transparent', color: cat === c ? '#fff' : '#000', border: 'none', padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
              {c}
            </button>
          ))}
        </div>
        {/* Mobile cats */}
        <div className="jnn-mob" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0', borderBottom: '1px solid #000' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ background: cat === c ? '#000' : '#f5f5f5', color: cat === c ? '#fff' : '#000', border: 'none', padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3, whiteSpace: 'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Main content */}
    <div className="jnn-wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      {/* Hero — newspaper front page layout */}
      {hero && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 340px', gap: '0 24px', marginBottom: 32, paddingBottom: 32, borderBottom: '2px solid #000' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: P, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>{hero.category || 'Israel'}</div>
            <a href={`/article/jewish-news-now/${hero.slug}`}>
              <h2 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.1, color: '#000', marginBottom: 12 }}>{hero.title}</h2>
            </a>
            {hero.excerpt && <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, marginBottom: 12, borderLeft: `4px solid ${P}`, paddingLeft: 12 }}>{hero.excerpt?.slice(0, 200)}</p>}
            <div style={{ fontSize: 11, color: '#666' }}>By {hero.author_name || 'Staff Reporter'} · {fmt(hero.published_at)}</div>
          </div>
          <div style={{ background: '#000' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rest.slice(0, 4).map((a: any, i: number) => (
              <a key={a.id} href={`/article/jewish-news-now/${a.slug}`}
                style={{ paddingBottom: 16, borderBottom: i < 3 ? '1px solid #ddd' : 'none' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: P, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{a.category || cats[1 + i]}</div>
                <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: '#000' }}>{a.title}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{fmt(a.published_at)}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 32px' }}>
        {rest.slice(4, 19).map((a: any, i: number) => (
          <a key={a.id} href={`/article/jewish-news-now/${a.slug}`}
            style={{ display: 'block', paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #ddd' }}>
            <img src={img(a, i+2)} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', marginBottom: 10 }} />
            <div style={{ fontSize: 9, fontWeight: 900, color: P, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>{a.category || cats[1 + (i % 5)]}</div>
            <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3, color: '#000', marginBottom: 6 }}>{a.title}</div>
            <div style={{ fontSize: 10, color: '#888' }}>{a.author_name} · {fmt(a.published_at)}</div>
          </a>
        ))}
      </div>
    </div>

    {/* Newsletter Banner */}
    <div style={{ background: '#f5f5f5', borderTop: '3px solid #000', padding: '40px 0' }}>
      <div className="jnn-wrap" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#1a56b0', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>✉ Daily Newsletter</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#000', marginBottom: 8, fontFamily: 'Georgia, serif' }}>Jewish World Briefing — Every Morning</h2>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>The day's most important Jewish and Israel news, curated and delivered before 8am.</p>
        <SubscribeForm siteSlug="jewish-news-now" siteName="Jewish News Now" accent="#1a56b0" />
      </div>
    </div>
    <footer style={{ background: '#000', color: '#999', padding: '28px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'Georgia', marginBottom: 6 }}>JEWISH NEWS NOW</div>
      <div style={{ fontSize: 11, marginBottom: 12 }}>The Jewish World, Today</div>
      <div style={{ fontSize: 11, display: 'flex', justifyContent: 'center', gap: 20 }}>
        <a href="/legal/privacy" style={{ color: '#999' }}>Privacy</a>
        <a href="/legal/terms" style={{ color: '#999' }}>Terms</a>
      </div>
      <div style={{ fontSize: 10, color: '#555', marginTop: 12 }}>© {new Date().getFullYear()} Jewish News Now</div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center', marginTop:14, fontSize:11, color:'#444' }}>
        {['https://verivex.co|Verivex','https://finvexx.com|Finvexx','https://nex-wire.com|Nex-Wire','https://aurexhq.com|AurexHQ','https://signalixx.com|Signalixx','https://cryptoxos.com|CryptoXos'].map(l=>{ const[u,n]=l.split('|'); return <a key={n} href={u} target="_blank" rel="noopener" style={{color:'#444'}}>{n}</a> })}
      </div>
    </footer>

    <style>{`@media(max-width:768px){
      div[style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important}
      div[style*="grid-template-columns: 1fr 1px 340px"]{grid-template-columns:1fr!important}
      h2[style*="font-size: 38"]{font-size:26px!important}
      h1[style*="font-size: 52"]{font-size:32px!important}
    }`}</style>
  </>)
}

// ─── Jewish Property Report ─── Clean real estate portal
function JewishPropertyReport({ site, articles }: { site: any; articles: any[] }) {
  const [cat, setCat] = React.useState('All')
  const P = '#0a7c4e'
  const cats = ['All','Tel Aviv','Jerusalem','Haifa','Market','Investing','Guides','Legal']
  const filtered = cat === 'All' ? articles : articles.filter((a: any) => a.category?.toLowerCase().includes(cat.toLowerCase()))
  const hero = filtered[0]
  const rest = filtered.filter((a: any) => a.id !== hero?.id)
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const img = (a: any, i: number) => a?.cover_image_url?.startsWith('http') ? a.cover_image_url :
    ['https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
     'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80',
     'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
     'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
     'https://images.unsplash.com/photo-1565623006062-8d4d3d08db5f?w=800&q=80',
    ][i % 5]

  return (<>
    <style>{`
      *{box-sizing:border-box;margin:0;padding:0}body{background:#f7f9f7;font-family:'Inter',system-ui,sans-serif}
      .jpr-wrap{max-width:1200px;margin:0 auto;padding:0 24px}
      .jpr-mob{display:none}.jpr-desk{display:block}
      a{text-decoration:none;color:inherit}
      @media(max-width:768px){.jpr-mob{display:block}.jpr-desk{display:none}.jpr-wrap{padding:0 16px}}
    `}</style>

    {/* Header — property portal style */}
    <header style={{ background: '#fff', borderBottom: '1px solid #e2e8e2', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <div className="jpr-wrap" style={{ padding: '14px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: P, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>🏠</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.3px' }}>Jewish<span style={{ color: P }}>Property</span>Report</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>Israeli Real Estate Intelligence</div>
            </div>
          </a>
          <div className="jpr-desk" style={{ display: 'flex', gap: 6 }}>
            {cats.slice(1, 6).map(c => (
              <button key={c} onClick={() => setCat(c === cat ? 'All' : c)}
                style={{ background: cat === c ? P : 'transparent', color: cat === c ? '#fff' : '#555', border: `1px solid ${cat === c ? P : '#e0e0e0'}`, padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        {/* Ticker bar */}
        <div style={{ background: P, color: '#fff', margin: '12px -24px -1px', padding: '8px 24px', fontSize: 11, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: 9, background: '#fff', color: P, padding: '1px 6px', borderRadius: 2, letterSpacing: '.08em', flexShrink: 0 }}>MARKET UPDATE</span>
          <span>{articles[0]?.title}</span>
        </div>
      </div>
    </header>

    <div className="jpr-wrap" style={{ paddingTop: 28, paddingBottom: 60 }}>
      {/* Featured property articles */}
      {hero && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 36, paddingBottom: 36, borderBottom: `3px solid ${P}` }}>
          <a href={`/article/jewish-property-report/${hero.slug}`}>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <img src={img(hero, 0)} alt="" style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 10 }} />
              <div style={{ position: 'absolute', top: 12, left: 12, background: P, color: '#fff', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {hero.category || 'Market Report'}
              </div>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', lineHeight: 1.3, marginBottom: 10 }}>{hero.title}</h2>
            {hero.excerpt && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{hero.excerpt?.slice(0, 150)}</p>}
            <div style={{ fontSize: 11, color: '#888', marginTop: 10 }}>{hero.author_name} · {fmt(hero.published_at)}</div>
          </a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${P}` }}>
              TOP REPORTS
            </div>
            {rest.slice(0, 5).map((a: any, i: number) => (
              <a key={a.id} href={`/article/jewish-property-report/${a.slug}`}
                style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid #e5eee5', alignItems: 'flex-start' }}>
                <img src={img(a, i+1)} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, color: P, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{a.category || cats[1 + i]}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#222', lineHeight: 1.3 }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 3 }}>{fmt(a.published_at)}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {rest.slice(5, 20).map((a: any, i: number) => (
          <a key={a.id} href={`/article/jewish-property-report/${a.slug}`}
            style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', border: '1px solid #e5eee5' }}>
            <img src={img(a, i+6)} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 9, color: P, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{a.category || cats[1 + (i % 6)]}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', lineHeight: 1.35, flex: 1 }}>{a.title}</div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 10 }}>{fmt(a.published_at)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>

    {/* Newsletter Banner */}
    <div style={{ background: '#f0faf5', borderTop: '3px solid #0a7c4e', padding: '40px 0' }}>
      <div className="jpr-wrap" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#0a7c4e', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>🏠 Property Intelligence</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', marginBottom: 8 }}>Israeli Property Market — Weekly Report</h2>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>Prices, yields, legal updates and investment opportunities — every Sunday for diaspora buyers.</p>
        <SubscribeForm siteSlug="jewish-property-report" siteName="Jewish Property Report" accent="#0a7c4e" />
      </div>
    </div>
    <footer style={{ background: '#0a2e1e', color: '#888', padding: '32px 0 20px', marginTop: 8 }}>
      <div className="jpr-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>🏠 JewishPropertyReport</div>
            <div style={{ fontSize: 11 }}>Israeli Real Estate Intelligence for the Global Jewish Community</div>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
            {cats.slice(1, 5).map(c => <a key={c} href={`/?cat=${c}`} style={{ color: '#888' }}>{c}</a>)}
            <a href="/legal/privacy" style={{ color: '#888' }}>Privacy</a>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1a3a2a', paddingTop: 16, fontSize: 10, color: '#444' }}>© {new Date().getFullYear()} Jewish Property Report</div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:12, fontSize:11 }}>
          <span style={{ color:'#999', fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', marginRight:4 }}>Network: </span>
          <a href="https://verivex.co" target="_blank" rel="noopener" style={{ color:'#888' }}>Verivex</a>
          <a href="https://finvexx.com" target="_blank" rel="noopener" style={{ color:'#888' }}>Finvexx</a>
          <a href="https://nex-wire.com" target="_blank" rel="noopener" style={{ color:'#888' }}>Nex-Wire</a>
          <a href="https://aurexhq.com" target="_blank" rel="noopener" style={{ color:'#888' }}>AurexHQ</a>
          <a href="https://signalixx.com" target="_blank" rel="noopener" style={{ color:'#888' }}>Signalixx</a>
          <a href="https://cryptoxos.com" target="_blank" rel="noopener" style={{ color:'#888' }}>CryptoXos</a>
        </div>
      </div>
    </footer>

    <style>{`@media(max-width:768px){
      div[style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important}
      div[style*="grid-template-columns: 2fr 1fr"]{grid-template-columns:1fr!important}
    }`}</style>
  </>)
}

// ─── Aliya Today ─── Warm magazine / immigrant guide
function AliyaToday({ site, articles }: { site: any; articles: any[] }) {
  const [cat, setCat] = React.useState('All')
  const P = '#c47d1a'
  const cats = ['All','Process','Housing','Ulpan','Benefits','Culture','Community','Tips']
  const filtered = cat === 'All' ? articles : articles.filter((a: any) => a.category?.toLowerCase().includes(cat.toLowerCase()))
  const hero = filtered[0]
  const rest = filtered.filter((a: any) => a.id !== hero?.id)
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const img = (a: any, i: number) => a?.cover_image_url?.startsWith('http') ? a.cover_image_url :
    ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
     'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
     'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80',
     'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
     'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    ][i % 5]

  return (<>
    <style>{`
      *{box-sizing:border-box;margin:0;padding:0}body{background:#fff8f0;font-family:'Georgia',serif}
      .at-wrap{max-width:1180px;margin:0 auto;padding:0 24px}
      .at-mob{display:none}.at-desk{display:block}
      a{text-decoration:none;color:inherit}a:hover{opacity:.85}
      @media(max-width:768px){.at-mob{display:block}.at-desk{display:none}.at-wrap{padding:0 16px}}
    `}</style>

    {/* Header — warm welcoming magazine */}
    <header style={{ background: 'linear-gradient(135deg, #2d1a00 0%, #1a0f00 100%)', padding: '0 0 0' }}>
      <div className="at-wrap">
        {/* Top strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.1)', fontSize: 11, color: 'rgba(255,255,255,.5)' }}>
          <span>✡ Your Journey Home to Israel</span>
          <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>✈️</div>
            <div>
              <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: '-1px', lineHeight: 1 }}>
                Aliya<span style={{ color: P }}>Today</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 3, fontStyle: 'italic' }}>Your Complete Guide to Making Aliya</div>
            </div>
          </a>
          {/* Step progress bar */}
          <div className="at-desk" style={{ display: 'flex', gap: 2 }}>
            {['Decide', 'Apply', 'Prepare', 'Land', 'Absorb'].map((step, i) => (
              <div key={step} style={{ background: i === 0 ? P : 'rgba(255,255,255,.15)', color: '#fff', padding: '6px 14px', borderRadius: 4, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 18, background: i === 0 ? '#fff' : 'rgba(255,255,255,.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: P, flexShrink: 0 }}>{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>
        {/* Category nav */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,.1)' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ background: 'transparent', border: 'none', borderBottom: cat === c ? `3px solid ${P}` : '3px solid transparent', color: cat === c ? '#fff' : 'rgba(255,255,255,.5)', padding: '12px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: '.02em' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </header>

    <div className="at-wrap" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {/* Hero — full width with warm overlay */}
      {hero && (
        <div style={{ marginBottom: 40 }}>
          <a href={`/article/aliya-today/${hero.slug}`} style={{ display: 'block', position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 0 }}>
            <img src={img(hero, 0)} alt={hero.title} style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(45,26,0,.9) 0%, rgba(45,26,0,.1) 60%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 32 }}>
              <span style={{ background: P, color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12, display: 'inline-block' }}>
                ✡ {hero.category || 'Aliya Guide'}
              </span>
              <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.2, maxWidth: 700, fontFamily: 'Georgia, serif' }}>{hero.title}</h2>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 10 }}>By {hero.author_name} · {fmt(hero.published_at)}</div>
            </div>
          </a>
        </div>
      )}

      {/* Magazine grid — 2 big + 4 small */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {rest.slice(0, 2).map((a: any, i: number) => (
          <a key={a.id} href={`/article/aliya-today/${a.slug}`}
            style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 3px 16px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column' }}>
            <img src={img(a, i+1)} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
            <div style={{ padding: 20, flex: 1 }}>
              <span style={{ background: `${P}20`, color: P, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>{a.category || cats[1 + i]}</span>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1a0f00', lineHeight: 1.3, marginTop: 10, marginBottom: 8, fontFamily: 'Georgia, serif' }}>{a.title}</h3>
              {a.excerpt && <p style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>{a.excerpt?.slice(0, 120)}</p>}
              <div style={{ fontSize: 10, color: '#999', marginTop: 12 }}>{fmt(a.published_at)}</div>
            </div>
          </a>
        ))}
      </div>

      {/* 4-column smaller cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        {rest.slice(2, 10).map((a: any, i: number) => (
          <a key={a.id} href={`/article/aliya-today/${a.slug}`}
            style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column' }}>
            <img src={img(a, i+3)} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
            <div style={{ padding: 12, flex: 1 }}>
              <div style={{ fontSize: 8, color: P, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>{a.category || cats[1 + (i % 6)]}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0f00', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{a.title}</div>
              <div style={{ fontSize: 9, color: '#999', marginTop: 6 }}>{fmt(a.published_at)}</div>
            </div>
          </a>
        ))}
      </div>

      {/* List format for remaining */}
      {rest.length > 10 && (
        <div style={{ borderTop: `3px solid ${P}`, paddingTop: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: '#1a0f00', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 20, fontFamily: 'Georgia, serif' }}>
            More Aliya Guides
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
            {rest.slice(10).map((a: any, i: number) => (
              <a key={a.id} href={`/article/aliya-today/${a.slug}`}
                style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0e8e0', alignItems: 'flex-start' }}>
                <img src={img(a, i+11)} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, color: P, fontWeight: 800, textTransform: 'uppercase', marginBottom: 3 }}>{a.category || cats[1 + (i % 6)]}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0f00', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{a.title}</div>
                  <div style={{ fontSize: 9, color: '#999', marginTop: 3 }}>{fmt(a.published_at)}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Newsletter Banner */}
    <div style={{ background: '#fff8f0', borderTop: '3px solid #c47d1a', padding: '40px 0' }}>
      <div className="at-wrap" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#c47d1a', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>✈️ Aliya Insider</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1a0f00', marginBottom: 8, fontFamily: 'Georgia, serif' }}>The Aliya Newsletter — For Serious Olim</h2>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>Step-by-step guides, new benefits, housing tips and community updates — weekly for those planning their move.</p>
        <SubscribeForm siteSlug="aliya-today" siteName="Aliya Today" accent="#c47d1a" />
      </div>
    </div>
    <footer style={{ background: '#2d1a00', color: '#888', padding: '32px 0 20px' }}>
      <div className="at-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: 4 }}>✈️ AliyaToday</div>
            <p style={{ fontSize: 12, color: '#666', maxWidth: 300, lineHeight: 1.6 }}>Your complete guide to making Aliya and building your life in Israel.</p>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
            <div>
              {cats.slice(1, 5).map(c => <div key={c} style={{ marginBottom: 6 }}><a href={`/?cat=${c}`} style={{ color: '#777' }}>{c}</a></div>)}
            </div>
            <div>
              {cats.slice(5).map(c => <div key={c} style={{ marginBottom: 6 }}><a href={`/?cat=${c}`} style={{ color: '#777' }}>{c}</a></div>)}
              <div><a href="/legal/privacy" style={{ color: '#777' }}>Privacy</a></div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #3a2010', paddingTop: 16, fontSize: 10, color: '#444' }}>© {new Date().getFullYear()} AliyaToday · Your Journey Home</div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:12, fontSize:11 }}>
          <span style={{ color:'#999', fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', marginRight:4 }}>Network: </span>
          <a href="https://verivex.co" target="_blank" rel="noopener" style={{ color:'#888' }}>Verivex</a>
          <a href="https://finvexx.com" target="_blank" rel="noopener" style={{ color:'#888' }}>Finvexx</a>
          <a href="https://nex-wire.com" target="_blank" rel="noopener" style={{ color:'#888' }}>Nex-Wire</a>
          <a href="https://aurexhq.com" target="_blank" rel="noopener" style={{ color:'#888' }}>AurexHQ</a>
          <a href="https://signalixx.com" target="_blank" rel="noopener" style={{ color:'#888' }}>Signalixx</a>
          <a href="https://cryptoxos.com" target="_blank" rel="noopener" style={{ color:'#888' }}>CryptoXos</a>
        </div>
      </div>
    </footer>

    <style>{`@media(max-width:768px){
      div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
      div[style*="grid-template-columns: repeat(4"]{grid-template-columns:1fr 1fr!important}
      div[style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important}
    }`}</style>
  </>)
}

// ─── ROUTER ───
export default function JewishTemplate({ site, articles }: { site: any; articles: any[] }) {
  const slug = site?.slug || ''
  if (slug === 'jewish-news-now')        return <JewishNewsNow site={site} articles={articles} />
  if (slug === 'jewish-property-report') return <JewishPropertyReport site={site} articles={articles} />
  if (slug === 'aliya-today')            return <AliyaToday site={site} articles={articles} />
  return <JewishNewsNow site={site} articles={articles} />
}
