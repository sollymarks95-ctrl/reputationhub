'use client'
import React from 'react'
// DynamicTemplate — 9 completely different archetypes, zero sites look alike
// Driven by site.template_config JSON from DB

import { useState, useEffect } from 'react'

function gf(f: string) {
  const m: Record<string,string> = {
    serif: '"Georgia","Times New Roman",serif',
    mono: '"IBM Plex Mono","Courier New",monospace',
    display: '"Playfair Display",Georgia,serif',
    condensed: '"Arial Narrow",Arial,sans-serif',
    sans: '"Inter","Helvetica Neue",Arial,sans-serif',
  }
  return m[f] || m.sans
}

export default function DynamicTemplate({ site, articles }: { site: any; articles: any[] }) {
  const cfg = site.template_config || {}
  const archetype = cfg.archetype || 'editorial'
  const p = cfg.primary || '#1a56db'
  const font = gf(cfg.font || 'sans')
  const slug = site.slug

  const props = { site, articles, p, font, slug }
  const map: Record<string, any> = {
    editorial: Editorial, tech: Tech, wire: Wire,
    dashboard: Dashboard, magazine: Magazine, minimal: Minimal,
    newspaper: Newspaper, research: Research, grid: Grid,
  }
  const Comp = map[archetype] || Editorial
  return <Comp {...props} />
}

// ─── 1. EDITORIAL — NYT/Guardian serif ───────────────────────────────────────
function Editorial({ site, articles, p, font, slug }: any) {
  const [cat, setCat] = useState('All')
  const hero = articles[0], cols = articles.slice(1,7), sidebar = articles.slice(7,12)
  return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:gf('display'), color:'#111' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .ed-nav a:hover{color:${p}}.ed-card h3:hover{color:${p}}
      @media(max-width:768px){.ed-main{flex-direction:column!important}.ed-cols{grid-template-columns:1fr!important}}`}</style>
      {/* Masthead */}
      <div style={{ borderBottom:`1px solid #ddd`, padding:'8px 0', textAlign:'center', fontSize:11, color:'#888', letterSpacing:'0.15em', textTransform:'uppercase' }}>
        {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
      </div>
      <div style={{ textAlign:'center', padding:'20px 24px 12px', borderBottom:`4px double #111` }}>
        <a href="/"><div style={{ fontSize:56, fontWeight:900, letterSpacing:'-3px', lineHeight:1 }}>{site.name}</div></a>
        <div style={{ fontSize:12, color:'#666', marginTop:6, fontStyle:'italic' }}>{site.tagline || 'Independent Financial Journalism'}</div>
      </div>
      {/* Nav */}
      <div className="ed-nav" style={{ borderBottom:'1px solid #ddd', background:'#fafafa' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', gap:24, overflow:'auto' }}>
          {['All','Markets','Economy','Investing','Policy','Opinion'].map(c => (
            <button key={c} onClick={()=>setCat(c)} style={{ padding:'10px 0', background:'none', border:'none', borderBottom:cat===c?`2px solid ${p}`:'2px solid transparent', color:cat===c?p:'#555', fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px' }}>
        {/* Hero + sidebar */}
        <div className="ed-main" style={{ display:'flex', gap:32, borderBottom:'1px solid #ddd', paddingBottom:32, marginBottom:32 }}>
          {hero && (
            <div style={{ flex:2 }}>
              <div style={{ fontSize:10, fontWeight:800, color:p, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:10 }}>{hero.category} · Lead Story</div>
              <a href={`/article/${slug}/${hero.slug}`}><h1 style={{ fontSize:40, fontWeight:900, lineHeight:1.1, marginBottom:14 }}>{hero.title}</h1></a>
              <p style={{ fontSize:17, lineHeight:1.75, color:'#333', borderLeft:`3px solid ${p}`, paddingLeft:16 }}>{hero.excerpt}</p>
              <div style={{ marginTop:14, fontSize:12, color:'#888' }}>By <strong>{hero.author_name}</strong> · {new Date(hero.published_at).toLocaleDateString('en-GB',{day:'numeric',month:'long'})}</div>
            </div>
          )}
          <div style={{ flex:1, borderLeft:'1px solid #ddd', paddingLeft:24 }}>
            <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', borderBottom:`2px solid #111`, paddingBottom:8, marginBottom:14 }}>Also Today</div>
            {sidebar.map((a: any) => (
              <div key={a.id} style={{ paddingBottom:12, marginBottom:12, borderBottom:'1px solid #eee' }}>
                <a href={`/article/${slug}/${a.slug}`}><div style={{ fontSize:14, fontWeight:700, lineHeight:1.4 }}>{a.title}</div></a>
                <div style={{ fontSize:11, color:'#888', marginTop:3 }}>{a.author_name}</div>
              </div>
            ))}
          </div>
        </div>
        {/* 3-col grid */}
        <div className="ed-cols" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:28 }}>
          {cols.map((a: any) => (
            <div key={a.id} style={{ borderTop:`3px solid ${p}`, paddingTop:14 }}>
              <div style={{ fontSize:9, fontWeight:800, color:p, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>{a.category}</div>
              <a href={`/article/${slug}/${a.slug}`}><h3 className="ed-card" style={{ fontSize:18, fontWeight:800, lineHeight:1.3, marginBottom:8 }}><span style={{ transition:'color .15s' }}>{a.title}</span></h3></a>
              <p style={{ fontSize:13, color:'#555', lineHeight:1.65 }}>{a.excerpt?.slice(0,110)}…</p>
            </div>
          ))}
        </div>
      </div>
      <footer style={{ borderTop:`3px double #111`, padding:'16px 24px', textAlign:'center', fontSize:11, color:'#888', marginTop:40 }}>
        © {new Date().getFullYear()} {site.name} · All rights reserved
      </footer>
    </div>
  )
}

// ─── 2. TECH — dark, card grid ───────────────────────────────────────────────
function Tech({ site, articles, p, font, slug }: any) {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', fontFamily:font, color:'#e2e8f0' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .tc{background:#111827;border:1px solid #1e293b;transition:all .2s;display:block;padding:20px}
      .tc:hover{border-color:${p};transform:translateY(-2px)}
      .tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1px;background:#1e293b}
      @media(max-width:768px){.tg{grid-template-columns:1fr}}`}</style>
      <div style={{ background:'#020617', borderBottom:`2px solid ${p}` }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <a href="/"><span style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'0.08em' }}>{site.name.toUpperCase()}</span></a>
          <div style={{ display:'flex', gap:20 }}>
            {['Markets','Tech','AI','Crypto','Data'].map(c => (
              <a key={c} href={`/?category=${c}`} style={{ color:'#94a3b8', fontSize:12, fontWeight:600 }}>{c}</a>
            ))}
          </div>
        </div>
      </div>
      {articles[0] && (
        <div style={{ background:`linear-gradient(135deg,#020617 60%,${p}18)`, padding:'56px 24px', borderBottom:'1px solid #1e293b' }}>
          <div style={{ maxWidth:860, margin:'0 auto' }}>
            <span style={{ background:p, color:'#fff', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:2, textTransform:'uppercase', letterSpacing:'0.1em' }}>{articles[0].category}</span>
            <a href={`/article/${slug}/${articles[0].slug}`}><h1 style={{ fontSize:44, fontWeight:900, color:'#f8fafc', lineHeight:1.08, margin:'16px 0' }}>{articles[0].title}</h1></a>
            <p style={{ fontSize:16, color:'#94a3b8', lineHeight:1.7 }}>{articles[0].excerpt}</p>
            <div style={{ marginTop:16, fontSize:12, color:'#475569' }}>{articles[0].author_name} · {new Date(articles[0].published_at).toLocaleDateString()}</div>
          </div>
        </div>
      )}
      <div className="tg" style={{ maxWidth:1400, margin:'0 auto' }}>
        {articles.slice(1,13).map((a: any) => (
          <a key={a.id} className="tc" href={`/article/${slug}/${a.slug}`}>
            <div style={{ fontSize:9, color:p, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>{a.category}</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0', lineHeight:1.4, marginBottom:8 }}>{a.title}</div>
            <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>{a.excerpt?.slice(0,90)}…</div>
            <div style={{ fontSize:11, color:'#334155', marginTop:12 }}>{a.author_name} · {new Date(a.published_at).toLocaleDateString()}</div>
          </a>
        ))}
      </div>
      <footer style={{ borderTop:'1px solid #1e293b', padding:'20px 24px', textAlign:'center', fontSize:11, color:'#334155', marginTop:2 }}>
        © {new Date().getFullYear()} {site.name}
      </footer>
    </div>
  )
}

// ─── 3. WIRE — Reuters/AP dense ticker ───────────────────────────────────────
function Wire({ site, articles, p, font, slug }: any) {
  return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:font, color:'#111' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .wi:hover{background:#f9fafb}.wi{border-bottom:1px solid #eee;padding:10px 0;display:flex;gap:14px;align-items:flex-start}
      @media(max-width:768px){.wcols{flex-direction:column!important}}`}</style>
      <div style={{ background:p, padding:'8px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/"><span style={{ color:'#fff', fontWeight:900, fontSize:20, letterSpacing:'0.05em' }}>{site.name} WIRE</span></a>
        <span style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>{new Date().toUTCString()}</span>
      </div>
      <div style={{ background:'#f5f5f5', borderBottom:'1px solid #ddd', padding:'5px 24px', display:'flex', gap:20 }}>
        {['BREAKING','MARKETS','ECONOMY','FX','COMMODITIES','CRYPTO'].map(c => (
          <a key={c} href={`/?category=${c}`} style={{ fontSize:11, fontWeight:800, color:'#333', textTransform:'uppercase' }}>{c}</a>
        ))}
      </div>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'16px 24px' }}>
        <div className="wcols" style={{ display:'flex', gap:32 }}>
          <div style={{ flex:2 }}>
            {articles.slice(0,18).map((a: any, i: number) => (
              <div key={a.id} className="wi">
                <div style={{ width:34, height:34, background:i===0?p:'#f1f5f9', borderRadius:4, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:i===0?'#fff':p }}>{i+1}</div>
                <div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                    <span style={{ background:p, color:'#fff', fontSize:8, fontWeight:800, padding:'1px 5px', borderRadius:2, textTransform:'uppercase' }}>{a.category}</span>
                    <span style={{ fontSize:10, color:'#999' }}>{new Date(a.published_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <a href={`/article/${slug}/${a.slug}`}><div style={{ fontSize:13, fontWeight:700, lineHeight:1.4 }}>{a.title}</div></a>
                  {i<3 && <div style={{ fontSize:12, color:'#666', marginTop:3, lineHeight:1.5 }}>{a.excerpt?.slice(0,100)}…</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ border:'1px solid #e5e7eb', padding:14 }}>
              <div style={{ fontWeight:800, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:`2px solid ${p}`, paddingBottom:6, marginBottom:12 }}>Top Stories</div>
              {articles.slice(0,5).map((a: any, i: number) => (
                <div key={a.id} style={{ display:'flex', gap:8, marginBottom:10, paddingBottom:10, borderBottom:'1px solid #f0f0f0' }}>
                  <span style={{ fontSize:18, fontWeight:900, color:p, lineHeight:1 }}>{i+1}</span>
                  <a href={`/article/${slug}/${a.slug}`}><div style={{ fontSize:12, lineHeight:1.4 }}>{a.title}</div></a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer style={{ borderTop:`2px solid ${p}`, padding:'12px 24px', textAlign:'center', fontSize:11, color:'#888' }}>© {new Date().getFullYear()} {site.name} Wire Service</footer>
    </div>
  )
}

// ─── 4. DASHBOARD — data/KPI cards ───────────────────────────────────────────
function Dashboard({ site, articles, p, font, slug }: any) {
  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', fontFamily:font, color:'#1e293b' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .dc{background:#fff;border:1px solid #e2e8f0;borderRadius:8px;padding:20px;transition:box-shadow .15s}
      .dc:hover{box-shadow:0 4px 20px rgba(0,0,0,.08)}
      .dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}
      @media(max-width:768px){.dg{grid-template-columns:1fr}}`}</style>
      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, background:p, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:14 }}>{site.name[0]}</div>
            <a href="/"><span style={{ fontWeight:800, fontSize:17 }}>{site.name}</span></a>
          </div>
          <div style={{ display:'flex', gap:8, overflowX:'auto' }}>
            {['All','Markets','Economy','AI','Policy'].map(c => (
              <a key={c} href={c==='All'?'/':`/?category=${c}`} style={{ padding:'5px 12px', background:'#f1f5f9', color:'#64748b', borderRadius:6, fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>{c}</a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'20px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[['Published Today',String(Math.floor(Math.random()*20+10))],['Sources Tracked','47'],['Categories','12'],['Last Updated',new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})]].map(([l,v])=>(
            <div key={l} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'14px 18px' }}>
              <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{l}</div>
              <div style={{ fontSize:22, fontWeight:800, color:p }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="dg">
          {articles.slice(0,12).map((a: any) => (
            <div key={a.id} className="dc">
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ background:`${p}18`, color:p, fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:4, textTransform:'uppercase' }}>{a.category}</span>
                <span style={{ fontSize:10, color:'#94a3b8' }}>{new Date(a.published_at).toLocaleDateString()}</span>
              </div>
              <a href={`/article/${slug}/${a.slug}`}><div style={{ fontSize:14, fontWeight:700, color:'#0f172a', lineHeight:1.4, marginBottom:8 }}>{a.title}</div></a>
              <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>{a.excerpt?.slice(0,90)}…</div>
              <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid #f1f5f9', fontSize:11, color:'#94a3b8' }}>{a.author_name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 5. MAGAZINE — glossy hero ────────────────────────────────────────────────
function Magazine({ site, articles, p, font, slug }: any) {
  const hero = articles[0], feat = articles.slice(1,4), rest = articles.slice(4,12)
  return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:font }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .mf{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
      .mr{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
      @media(max-width:768px){.mf,.mr{grid-template-columns:1fr!important}}`}</style>
      <header style={{ padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`3px solid ${p}` }}>
        <a href="/"><div style={{ fontSize:30, fontWeight:900, letterSpacing:'-1px', fontFamily:gf('display') }}>{site.name}</div></a>
        <div style={{ display:'flex', gap:16 }}>{['Features','Finance','Markets','Life'].map(c=><a key={c} href={`/?category=${c}`} style={{ color:'#555', fontSize:13, fontWeight:600 }}>{c}</a>)}</div>
      </header>
      {hero && (
        <div style={{ background:`linear-gradient(to right, #0f172a 55%, ${p}cc)`, color:'#fff', padding:'72px 24px' }}>
          <div style={{ maxWidth:760 }}>
            <span style={{ background:'rgba(255,255,255,.2)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.1em' }}>{hero.category}</span>
            <a href={`/article/${slug}/${hero.slug}`}><h1 style={{ fontSize:54, fontWeight:900, lineHeight:1.04, margin:'16px 0 18px', fontFamily:gf('display') }}>{hero.title}</h1></a>
            <p style={{ fontSize:18, lineHeight:1.7, opacity:.85 }}>{hero.excerpt}</p>
            <div style={{ marginTop:20, fontSize:13, opacity:.6 }}>By {hero.author_name}</div>
          </div>
        </div>
      )}
      <div style={{ maxWidth:1200, margin:'36px auto', padding:'0 24px' }}>
        <div className="mf" style={{ marginBottom:36 }}>
          {feat.map((a: any, i: number) => (
            <div key={a.id} style={{ borderTop:`4px solid ${[p,'#f59e0b','#10b981'][i]}`, paddingTop:14 }}>
              <div style={{ fontSize:10, color:[p,'#f59e0b','#10b981'][i], fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>{a.category}</div>
              <a href={`/article/${slug}/${a.slug}`}><h3 style={{ fontSize:19, fontWeight:800, lineHeight:1.3, fontFamily:gf('display'), marginBottom:8 }}>{a.title}</h3></a>
              <p style={{ fontSize:13, color:'#555', lineHeight:1.6 }}>{a.excerpt?.slice(0,120)}…</p>
            </div>
          ))}
        </div>
        <div style={{ height:1, background:'#e5e7eb', marginBottom:28 }} />
        <div className="mr">
          {rest.map((a: any) => (
            <div key={a.id}>
              <div style={{ fontSize:9, color:p, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>{a.category}</div>
              <a href={`/article/${slug}/${a.slug}`}><div style={{ fontSize:14, fontWeight:700, lineHeight:1.4, color:'#111' }}>{a.title}</div></a>
              <div style={{ fontSize:11, color:'#999', marginTop:5 }}>{a.author_name}</div>
            </div>
          ))}
        </div>
      </div>
      <footer style={{ background:'#0f172a', color:'#94a3b8', padding:'20px 24px', textAlign:'center', fontSize:12, marginTop:36 }}>
        {site.name} © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

// ─── 6. MINIMAL — Medium/Substack blog ───────────────────────────────────────
function Minimal({ site, articles, p, font, slug }: any) {
  return (
    <div style={{ minHeight:'100vh', background:'#fffef9', fontFamily:font, color:'#1a1a1a' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .mi{padding:28px 0;border-bottom:1px solid #f0ede8}.mi h2:hover{color:${p}}`}</style>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'0 24px' }}>
        <header style={{ padding:'30px 0 20px', borderBottom:'1px solid #f0ede8' }}>
          <a href="/"><div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.5px' }}>{site.name}</div></a>
          <div style={{ fontSize:14, color:'#888', marginTop:3 }}>{site.tagline || 'Thoughtful analysis for serious investors'}</div>
        </header>
        {articles.slice(0,14).map((a: any) => (
          <div key={a.id} className="mi">
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:p, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700, flexShrink:0 }}>{(a.author_name||'A').charAt(0)}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600 }}>{a.author_name}</div>
                <div style={{ fontSize:11, color:'#999' }}>{new Date(a.published_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
              </div>
            </div>
            <a href={`/article/${slug}/${a.slug}`}><h2 style={{ fontSize:21, fontWeight:800, lineHeight:1.3, marginBottom:8, transition:'color .15s' }}>{a.title}</h2></a>
            <p style={{ fontSize:14, color:'#555', lineHeight:1.7, marginBottom:10 }}>{a.excerpt?.slice(0,150)}…</p>
            <div style={{ display:'flex', gap:10, alignItems:'center', fontSize:11, color:'#999' }}>
              <span style={{ background:`${p}15`, color:p, padding:'2px 8px', borderRadius:10, fontWeight:600 }}>{a.category}</span>
              <span>{a.read_time_minutes||4} min read</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 7. NEWSPAPER — broadsheet 3-col ─────────────────────────────────────────
function Newspaper({ site, articles, p, font, slug }: any) {
  const cols = [articles.slice(0,3), articles.slice(3,6), articles.slice(6,9)]
  return (
    <div style={{ minHeight:'100vh', background:'#f7f3e9', fontFamily:gf('serif'), color:'#1a1a1a' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .nc{display:grid;grid-template-columns:1fr 1px 1fr 1px 1fr;gap:0}
      .nd{background:#bbb}
      @media(max-width:768px){.nc{grid-template-columns:1fr!important}.nd{display:none!important}}`}</style>
      <header style={{ borderBottom:'3px double #333', textAlign:'center', padding:'16px 24px 10px' }}>
        <a href="/"><div style={{ fontSize:52, fontWeight:900, fontFamily:gf('display'), letterSpacing:'-3px', lineHeight:1 }}>{site.name}</div></a>
        <div style={{ borderTop:'1px solid #999', borderBottom:'1px solid #999', padding:'4px 0', margin:'8px 0', fontSize:11, color:'#666', display:'flex', justifyContent:'space-between' }}>
          <span>Est. {new Date().getFullYear()}</span>
          <span style={{ textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700 }}>{site.tagline || 'Independent Financial Reporting'}</span>
          <span>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</span>
        </div>
      </header>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px 24px' }}>
        <div className="nc">
          {cols.map((colArts, ci) => (
            <>
              {ci > 0 && <div key={`d${ci}`} className="nd" />}
              <div key={ci} style={{ padding:'0 20px' }}>
                {colArts.map((a: any, ai: number) => (
                  <div key={a.id} style={{ paddingBottom:16, marginBottom:16, borderBottom:ai<2?'1px solid #ccc':'none' }}>
                    {ai===0&&ci===0&&<div style={{ fontSize:10, fontWeight:700, color:p, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>LEAD STORY</div>}
                    <a href={`/article/${slug}/${a.slug}`}><h2 style={{ fontSize:ai===0&&ci===0?24:17, fontWeight:800, lineHeight:1.25, fontFamily:gf('display'), marginBottom:8 }}>{a.title}</h2></a>
                    {(ai===0||ci===0)&&<p style={{ fontSize:13, lineHeight:1.65, color:'#444' }}>{a.excerpt?.slice(0,ai===0?190:110)}…</p>}
                    <div style={{ fontSize:11, color:'#888', marginTop:6, fontStyle:'italic' }}>By {a.author_name}</div>
                  </div>
                ))}
              </div>
            </>
          ))}
        </div>
      </div>
      <footer style={{ borderTop:'2px solid #999', marginTop:28, padding:'12px 24px', textAlign:'center', fontSize:11, color:'#666' }}>{site.name} · Daily Financial News · {new Date().getFullYear()}</footer>
    </div>
  )
}

// ─── 8. RESEARCH — academic/report ───────────────────────────────────────────
function Research({ site, articles, p, font, slug }: any) {
  return (
    <div style={{ minHeight:'100vh', background:'#f8f9fa', fontFamily:font, color:'#212529' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .ri{display:grid;grid-template-columns:72px 1fr;gap:18px;padding:18px 0;border-bottom:1px solid #dee2e6;align-items:start}
      @media(max-width:768px){.ri{grid-template-columns:1fr}}`}</style>
      <div style={{ background:'#fff', borderBottom:`4px solid ${p}`, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'18px 24px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ background:p, color:'#fff', fontWeight:900, fontSize:18, padding:'7px 12px', borderRadius:4 }}>{site.name.substring(0,2).toUpperCase()}</div>
          <div>
            <a href="/"><div style={{ fontWeight:800, fontSize:19 }}>{site.name} Research</div></a>
            <div style={{ fontSize:12, color:'#6c757d' }}>{site.description||'Independent Financial Research & Analysis'}</div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1000, margin:'28px auto', padding:'0 24px' }}>
        <div style={{ background:'#fff', border:'1px solid #dee2e6', borderLeft:`4px solid ${p}`, padding:'14px 18px', marginBottom:28, borderRadius:'0 4px 4px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, color:p, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Research Brief</div>
          <div style={{ fontSize:14, color:'#495057', lineHeight:1.6 }}>{articles[0]?.excerpt||'Latest research and analysis across global financial markets.'}</div>
        </div>
        {articles.slice(0,15).map((a: any, i: number) => (
          <div key={a.id} className="ri">
            <div style={{ textAlign:'center', padding:'8px', background:`${p}10`, borderRadius:4 }}>
              <div style={{ fontSize:17, fontWeight:900, color:p }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize:9, color:'#6c757d', textTransform:'uppercase', marginTop:2 }}>{a.category?.slice(0,6)}</div>
            </div>
            <div>
              <a href={`/article/${slug}/${a.slug}`}><h3 style={{ fontSize:15, fontWeight:700, lineHeight:1.4, color:'#212529', marginBottom:5 }}>{a.title}</h3></a>
              <p style={{ fontSize:12, color:'#6c757d', lineHeight:1.6, marginBottom:6 }}>{a.excerpt?.slice(0,130)}…</p>
              <div style={{ fontSize:10, color:'#adb5bd' }}>{a.author_name} · {new Date(a.published_at).toLocaleDateString('en-GB')} · {a.read_time_minutes||4} min</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 9. GRID — Pinterest masonry ─────────────────────────────────────────────
function Grid({ site, articles, p, font, slug }: any) {
  const palette = ['#dbeafe','#dcfce7','#fef3c7','#fce7f3','#ede9fe','#ffedd5','#f0fdf4','#fef9c3']
  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', fontFamily:font }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}
      .gm{columns:3 290px;column-gap:14px}
      .gc{break-inside:avoid;margin-bottom:14px;border-radius:12px;overflow:hidden;transition:transform .15s;display:block}
      .gc:hover{transform:translateY(-3px)}
      @media(max-width:768px){.gm{columns:1}}`}</style>
      <header style={{ background:'#fff', padding:'14px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.1)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <a href="/"><div style={{ fontWeight:900, fontSize:20, color:p }}>{site.name}</div></a>
        <div style={{ display:'flex', gap:6 }}>
          {['All','Markets','Tech','Economy'].map(c=>(
            <a key={c} href={c==='All'?'/':`/?category=${c}`} style={{ padding:'5px 12px', borderRadius:20, background:c==='All'?p:'#f1f5f9', color:c==='All'?'#fff':'#64748b', fontSize:12, fontWeight:600 }}>{c}</a>
          ))}
        </div>
      </header>
      <div style={{ maxWidth:1400, margin:'20px auto', padding:'0 20px' }}>
        <div className="gm">
          {articles.slice(0,15).map((a: any, i: number) => (
            <a key={a.id} className="gc" href={`/article/${slug}/${a.slug}`} style={{ background:i===0?p:palette[i%palette.length] }}>
              <div style={{ padding:18 }}>
                <div style={{ fontSize:9, fontWeight:700, color:i===0?'rgba(255,255,255,.7)':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>{a.category}</div>
                <div style={{ fontSize:i===0?20:14, fontWeight:800, lineHeight:1.35, color:i===0?'#fff':'#1e293b', marginBottom:6 }}>{a.title}</div>
                {(i===0||i%5===0)&&<div style={{ fontSize:12, lineHeight:1.6, color:i===0?'rgba(255,255,255,.8)':'#475569' }}>{a.excerpt?.slice(0,100)}…</div>}
                <div style={{ fontSize:10, color:i===0?'rgba(255,255,255,.55)':'#94a3b8', marginTop:8 }}>{a.author_name}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
