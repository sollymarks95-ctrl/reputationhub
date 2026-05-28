'use client'
import { useState } from 'react'

const IMGS = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
  'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=800&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'https://images.unsplash.com/photo-1526628953301-3cd9e37dc0d7?w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80',
  'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80',
]
function slugHash(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}
const getImg = (a: any, i: number) => {
  if (a?.cover_image_url && !a.cover_image_url.includes('unsplash.com/photo-1578574')) return a.cover_image_url
  const hash = a?.slug ? slugHash(a.slug) : i
  return IMGS[hash % IMGS.length]
}

const SITE_META: Record<string, {name:string;domain:string;color:string;tagline:string}> = {
  'global-trade-wire': {name:'Nex-Wire', domain:'nex-wire.com',   color:'#E03131', tagline:'Global Trade & Market Intelligence'},
  'press-central':     {name:'PresxWire',domain:'presxwire.com',  color:'#DC2626', tagline:'Press Releases & Corporate Announcements'},
}

const SECTIONS = ['All','Markets','Trade','Finance','Commodities','Analysis','Opinion','Policy']
const SEC_FILTER: Record<string,string[]> = {
  'Markets':['markets','stocks','equities'],'Trade':['trade','global','supply'],
  'Finance':['finance','banking','rates'],'Commodities':['gold','oil','commodities','silver'],
  'Analysis':['analysis','research','outlook'],'Opinion':['opinion','editorial','perspective'],
  'Policy':['policy','federal','central bank','regulation'],
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
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Your email address" required
        style={{flex:1,padding:'10px 16px',border:'1px solid #ddd',fontFamily:'Inter,sans-serif',fontSize:13,outline:'none',minWidth:200}}/>
      <button type="submit" style={{padding:'10px 22px',background:p,color:'#fff',border:'none',fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:13,cursor:'pointer'}}>Subscribe Free</button>
    </form>
}

export default function WireTemplate({ articles=[], site, siteSlug, primaryColor }:any) {
  const [section, setSection] = useState('All')
  const meta = SITE_META[siteSlug] || {name:site?.name||'Nex-Wire',domain:'nex-wire.com',color:'#E03131',tagline:'Global Intelligence'}
  const p = primaryColor || meta.color

  const keywords = SEC_FILTER[section] || []
  const filtered = keywords.length ? articles.filter((a:any) => keywords.some(k=>`${a.title} ${a.category} ${a.excerpt}`.toLowerCase().includes(k))) : articles
  const visible = filtered.length > 1 ? filtered : articles

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
          .wgrid{grid-template-columns:repeat(2,1fr)!important}
          .wtop{grid-template-columns:1fr!important}
          .snav{overflow-x:auto;flex-wrap:nowrap}
          .snav button{font-size:10px!important;padding:8px 10px!important;white-space:nowrap}
          h1{font-size:28px!important}
        }
      `}</style>

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
          {SECTIONS.map(s=><button key={s} onClick={()=>setSection(s)} className={section===s?'on':''}>{s}</button>)}
        </nav>
      </div>

      {/* Content */}
      <div style={{maxWidth:1280,margin:'0 auto',padding:'28px'}}>
        {/* Hero + sidebar */}
        {hero && (
          <div className="whero" style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:32,marginBottom:32,paddingBottom:28,borderBottom:'3px double #ddd'}}>
            <a href={`/article/${siteSlug}/${hero.slug}`} className="wcard" style={{display:'block'}}>
              <img src={getImg(hero,0)} alt={hero.title} style={{width:'100%',height:340,objectFit:'cover',marginBottom:16}}/>
              <span className="wcat">{hero.category||'Analysis'}</span>
              <div className="whl" style={{fontSize:34,marginBottom:10}}>{hero.title}</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:16,color:'#444',lineHeight:1.7}}>{hero.excerpt?.slice(0,200)}</div>
              <div className="wmeta">{hero.author_name||'Editorial'} · {timeAgo(hero.published_at)} · {hero.read_time_minutes||4} min</div>
            </a>
            <div>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:10,fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'#999',marginBottom:10,paddingBottom:6,borderBottom:'2px solid #111'}}>Top Stories</div>
              {top.map((a:any,i:number)=>(
                <a key={a.id} href={`/article/${siteSlug}/${a.slug}`} className="wcard" style={{display:'flex',gap:10,paddingBottom:12,marginBottom:12,borderBottom:'1px solid #eee'}}>
                  <img src={getImg(a,i+1)} alt={a.title} style={{width:80,height:56,objectFit:'cover',flexShrink:0}}/>
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
              <img src={getImg(a,i+5)} alt={a.title} style={{width:'100%',height:130,objectFit:'cover',marginBottom:10}}/>
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
            <span>© {new Date().getFullYear()} {meta.domain} · All Rights Reserved</span>
            <span style={{color:'#444',maxWidth:560}}>Risk Warning: Financial markets carry substantial risk. Past performance does not guarantee future results. Always seek professional financial advice.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
