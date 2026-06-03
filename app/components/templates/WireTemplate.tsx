'use client'
import React, { useState } from 'react'


const IMGS = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1526628953301-3cd9e37dc0d7?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1518183214770-9cffbec72538?w=1200&q=80&fm=jpg',
  'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=1200&q=80&fm=jpg',
]
function slugHash(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}
const getImg = (a: any, i: number) => {
  if (a?.cover_image_url && a.cover_image_url.startsWith('http')) return a.cover_image_url
  const hash = a?.slug ? slugHash(a.slug) : i
  return IMGS[hash % IMGS.length]
}

const SITE_META: Record<string, {name:string;domain:string;color:string;tagline:string}> = {
  'global-trade-wire': {name:'Nex-Wire', domain:'nex-wire.com',   color:'#E03131', tagline:'Global Trade & Market Intelligence'},
  'press-central':     {name:'PresxWire',domain:'presxwire.com',  color:'#DC2626', tagline:'Press Releases & Corporate Announcements'},
}

const SECTIONS = ['All','Markets','Trade','Analysis','Technology','Business']
const SEC_FILTER: Record<string,string[]> = {
  'Markets':   ['markets','equities','stocks'],
  'Trade':     ['trade','supply chain','export','import'],
  'Analysis':  ['analysis','research','outlook','report'],
  'Technology':['technology','tech','digital','fintech','blockchain'],
  'Business':  ['business','corporate','company','enterprise'],
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now()-new Date(d).getTime())/1000)
  if(s<3600) return `${Math.floor(s/60)}m ago`
  if(s<86400) return `${Math.floor(s/3600)}h ago`
  return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'})
}

function Newsletter({siteName,p}:any) {
  const [email,setEmail]=useState('');const [done,setDone]=useState(false)
  async function sub(e:React.FormEvent){e.preventDefault();try{await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,siteName})})}catch{}setDone(true)}
  return done
    ?<div style={{padding:'12px 18px',background:`${p}15`,border:`1px solid ${p}`,fontFamily:'Inter,sans-serif',fontSize:14,fontWeight:700,color:p}}>✓ Subscribed! First briefing tomorrow.</div>
    :<form onSubmit={sub} style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <input value={email} onChange={(e:any)=>setEmail(e.target.value)} type="email" placeholder="Your email address" required
        style={{flex:1,padding:'10px 16px',border:'1px solid #ddd',fontFamily:'Inter,sans-serif',fontSize:13,outline:'none',minWidth:200}}/>
      <button type="submit" style={{padding:'10px 22px',background:p,color:'#fff',border:'none',fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:13,cursor:'pointer'}}>Subscribe Free</button>
    </form>
}
export default function WireTemplate({ articles=[], site, siteSlug, primaryColor , searchParams}:any) {
  const [section, setSection] = useState('All')
  const meta = SITE_META[siteSlug] || {name:site?.name||'Nex-Wire',domain:'nex-wire.com',color:'#E03131',tagline:'Global Intelligence'}
  const p = primaryColor || meta.color

  const [searchQ, setSearchQ] = useState(((searchParams as any)?.q as string) || '')

  // Filter by section: exact category match first, then keyword match in title
  const filtered = section === 'All'
    ? articles
    : articles.filter((a:any) => {
        const cat = (a.category || '').toLowerCase().trim()
        const title = (a.title || '').toLowerCase()
        const sec = section.toLowerCase()
        const kws = SEC_FILTER[section] || [sec]
        // Match if category equals the section name OR keywords appear in title
        return cat === sec || cat.startsWith(sec) || kws.some((k:string) => title.includes(k))
      })

  // Search query overrides section filter
  const visible = searchQ.trim()
    ? articles.filter((a:any) => `${a.title} ${a.excerpt||''} ${a.category||''} ${(a.tags||[]).join(' ')}`.toLowerCase().includes(searchQ.toLowerCase()))
    : filtered

  const hero=visible[0]; const top=visible.slice(1,5); const grid=visible.slice(5,25)

  return (
    <div style={{fontFamily:'Georgia,"Times New Roman",serif',background:'#fff',color:'#111',minHeight:'100vh'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit} img{max-width:100%;display:block}
        .whl{font-family:'Playfair Display',serif;font-weight:800;line-height:1.2;color:#111}
        .wcard:hover .whl{text-decoration:underline;text-underline-offset:3px}
        .wmeta{font-family:Inter,sans-serif;font-size:11px;color:#888;margin-top:6px}
        .wcat{font-family:Inter,sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${p};border-left:3px solid ${p};padding-left:6px;margin-bottom:8px;display:block}
        .snav button{font-family:Inter,sans-serif;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:10px 14px;border:none;background:none;cursor:pointer;color:#777;border-bottom:2px solid transparent}
        .snav button.on,.snav button:hover{color:${p};border-bottom-color:${p}}
        .tkr{animation:wtick 45s linear infinite;display:flex;gap:0;white-space:nowrap}
        @keyframes wtick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .flink{font-family:Inter,sans-serif;font-size:12px;color:#666}
        .flink:hover{color:${p}}}

        @media(max-width:768px){
          .whero{grid-template-columns:1fr!important}
          .wgrid{grid-template-columns:1fr!important}
          .wtop{grid-template-columns:1fr!important}
          .wsidebar{display:none!important}
          .snav{overflow-x:auto;flex-wrap:nowrap}
          .snav button{font-size:10px!important;padding:8px 10px!important;white-space:nowrap}
          h1{font-size:24px!important}
          .wlayout{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* Search bar */}
      <div style={{background:'#f5f5f5',borderBottom:'1px solid #e5e7eb',padding:'8px 20px',display:'flex',alignItems:'center',gap:10,fontFamily:'Inter,sans-serif'}}>
        <input value={searchQ} onChange={(e:any)=>setSearchQ(e.target.value)}
          placeholder="🔍 Search articles by keyword..." 
          style={{flex:1,maxWidth:400,padding:'8px 14px',border:'1px solid #ddd',fontSize:13,outline:'none',borderRadius:2}}
        />
        {searchQ && <button onClick={()=>setSearchQ('')} style={{background:'none',border:'none',cursor:'pointer',color:'#999',fontWeight:700,fontSize:13}}>✕ Clear</button>}
        {searchQ && <span style={{fontSize:12,color:'#666'}}>{visible.length} result{visible.length!==1?'s':''}</span>}
      </div>
      {/* Breaking ticker */}
      <div style={{background:p,color:'#fff',height:32,display:'flex',alignItems:'center',overflow:'hidden'}}>
        <div style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:800,letterSpacing:'.12em',padding:'0 16px',background:'rgba(0,0,0,0.25)',height:'100%',display:'flex',alignItems:'center',flexShrink:0}}>LIVE</div>
        <div style={{overflow:'hidden',flex:1}}>
          <div className="tkr">
            {[...articles.slice(0,8),...articles.slice(0,8)].map((a:any,i:number)=>(
              <span key={i} style={{fontFamily:'Inter,sans-serif',fontSize:12,padding:'0 28px',borderRight:'1px solid rgba(255,255,255,0.2)'}}>▸ {a?.title?.slice(0,70)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 28px'}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',padding:'16px 0 12px',borderBottom:`3px solid #111`}}>
          {/* Clickable logo */}
          <a href="/">
            <div style={{fontFamily:'Playfair Display,serif',fontSize:50,fontWeight:900,letterSpacing:'-0.03em',lineHeight:1}}>
              {meta.name.includes('-')
                ? <>{meta.name.split('-')[0]}<span style={{color:p}}>-</span>{meta.name.split('-')[1]}</>
                : <>{meta.name.slice(0,-3)}<span style={{color:p}}>{meta.name.slice(-3)}</span></>
              }
            </div>
            <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#888',marginTop:4}}>{meta.domain} · {meta.tagline}</div>
          </a>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:700,background:p,color:'#fff',padding:'3px 10px',borderRadius:2,letterSpacing:'.06em',marginBottom:6,display:'inline-block'}}>● LIVE</div>
            <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#888'}}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
            <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'#aaa',marginTop:2}}>{articles.length} stories today</div>
          </div>
        </div>
        {/* Section nav */}
        <nav className="snav" style={{display:'flex',flexWrap:'wrap',borderBottom:'1px solid #eee'}}>
          {SECTIONS.map(s => {
          const cnt = s === 'All' ? articles.length : articles.filter((a:any) => {
            const cat = (a.category||'').toLowerCase().trim()
            const kws = SEC_FILTER[s] || [s.toLowerCase()]
            return cat === s.toLowerCase() || kws.some((k:string) => (a.title||'').toLowerCase().includes(k) || cat.includes(k))
          }).length
          return (
            <button key={s} onClick={()=>setSection(s)} className={section===s?'on':''}>
              {s}{s!=='All' && cnt>0 && <span style={{marginLeft:4,fontSize:9,opacity:.7}}>({cnt})</span>}
            </button>
          )
        })}
        </nav>
      </div>

      {/* Content */}
      <div style={{maxWidth:1280,margin:'0 auto',padding:'28px'}}>
        {/* Hero + sidebar */}
        {hero && (
          <div className="whero" style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:32,marginBottom:32,paddingBottom:28,borderBottom:'3px double #ddd'}}>
            <a href={`/article/${siteSlug}/${hero.slug}`} className="wcard" style={{display:'block'}}>
              <img referrerPolicy="no-referrer" crossOrigin="anonymous" src={getImg(hero,0)} alt={hero.title} style={{width:'100%',height:340,objectFit:'cover',marginBottom:16}} onError={(e:any)=>{const fb=IMGS[Math.floor(Math.random()*IMGS.length)];e.currentTarget.onerror=null;e.currentTarget.src=fb}}/>
              <span className="wcat">{hero.category||'Analysis'}</span>
              <div className="whl" style={{fontSize:34,marginBottom:10}}>{hero.title}</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:16,color:'#444',lineHeight:1.7}}>{hero.excerpt?.slice(0,200)}</div>
              <div className="wmeta">{hero.author_name||'Editorial'} · {timeAgo(hero.published_at)} · {hero.read_time_minutes||4} min</div>
            </a>
            <div>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'#999',marginBottom:10,paddingBottom:6,borderBottom:'2px solid #111'}}>Top Stories</div>
              {top.map((a:any,i:number)=>(
                <a key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="wcard" style={{display:'flex',gap:10,paddingBottom:12,marginBottom:12,borderBottom:'1px solid #eee'}}>
                  <img referrerPolicy="no-referrer" crossOrigin="anonymous" src={getImg(a,i+1)} alt={a.title} style={{width:80,height:56,objectFit:'cover',flexShrink:0}} onError={(e:any)=>{const fb=IMGS[Math.floor(Math.random()*IMGS.length)];e.currentTarget.onerror=null;e.currentTarget.src=fb}}/>
                  <div>
                    <span className="wcat" style={{fontSize:9}}>{a.category}</span>
                    <div className="whl" style={{fontSize:15}}>{a.title}</div>
                    <div className="wmeta">{timeAgo(a.published_at)}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'#999',marginBottom:18,paddingBottom:6,borderBottom:'2px solid #111'}}>Latest Intelligence</div>
        <div className="wgrid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24,marginBottom:48}}>
          {grid.map((a:any,i:number)=>(
            <a key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="wcard" style={{display:'block'}}>
              <img referrerPolicy="no-referrer" crossOrigin="anonymous" src={getImg(a,i+5)} alt={a.title} style={{width:'100%',height:130,objectFit:'cover',marginBottom:10}} onError={(e:any)=>{const fb=IMGS[Math.floor(Math.random()*IMGS.length)];e.currentTarget.onerror=null;e.currentTarget.src=fb}}/>
              <span className="wcat" style={{fontSize:9}}>{a.category}</span>
              <div className="whl" style={{fontSize:16,marginBottom:5}}>{a.title}</div>
              <div className="wmeta">{timeAgo(a.published_at)}</div>
            </a>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{background:'#f5f5f3',border:`2px solid ${p}`,padding:'28px 32px',marginBottom:32}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:800,marginBottom:6}}>Free Daily Briefing from {meta.name}</div>
          <div style={{fontFamily:'Inter,sans-serif',fontSize:14,color:'#555',marginBottom:16}}>Top market intelligence stories delivered every morning. Join 50,000+ professionals.</div>
          <Newsletter siteName={meta.name} p={p}/>
        </div>
      </div>

      {/* Legal footer */}
      <div style={{background:'#111',color:'#555',padding:'28px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:24,marginBottom:20}}>
            <div>
              <a href="/"><div style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:900,color:'#fff',marginBottom:8}}>{meta.name}</div></a>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:12,color:'#555',lineHeight:1.7,maxWidth:380}}>
                {meta.tagline}. Content is for informational purposes only and does not constitute financial or investment advice.
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 32px'}}>
              {[['About','/legal/about'],['Privacy Policy','/legal/privacy'],['Terms of Service','/legal/terms'],['Risk Disclaimer','/legal/disclaimer'],['Advertise','/legal/advertise'],['Contact','https://t.me/rephub_intelligence']].map(([l,h])=>(
                <a key={l} href={h} className="flink">{l}</a>
              ))}
            </div>
          </div>
          <div style={{borderTop:'1px solid #222',paddingTop:16,fontFamily:'Inter,sans-serif',fontSize:11,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>

            {/* Cross-portal intelligence network */}
            
            <span>© {new Date().getFullYear()} {meta.domain} · All Rights Reserved</span>
            <span style={{color:'#444',maxWidth:560}}>Risk Warning: Financial markets carry substantial risk. Past performance does not guarantee future results. Always seek professional financial advice.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
