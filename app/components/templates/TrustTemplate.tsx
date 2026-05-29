'use client'
import CookieBanner from '@/app/components/CookieBanner'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const GREEN = '#00B67A'
const DARK = '#191919'

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const full = Math.floor(rating), half = rating % 1 >= 0.5
  return (
    <div style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= full ? GREEN : (s === full+1 && half) ? 'url(#half)' : '#E8E8E8'}>
          <defs><linearGradient id="half"><stop offset="50%" stopColor={GREEN}/><stop offset="50%" stopColor="#E8E8E8"/></linearGradient></defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function TrustBadge({ rating }: { rating: number }) {
  const cfg = rating >= 4.5 ? { label:'Excellent', bg:'#00B67A' }
    : rating >= 4 ? { label:'Great', bg:'#73CF11' }
    : rating >= 3.5 ? { label:'Good', bg:'#FFCE00', color:'#333' }
    : rating >= 3 ? { label:'Average', bg:'#FF8622' }
    : rating > 0 ? { label:'Poor', bg:'#FF3722' }
    : { label:'New', bg:'#aaa' }
  return <div style={{ background:cfg.bg, color:(cfg as any).color||'#fff', fontWeight:800, fontSize:12, padding:'4px 10px', borderRadius:4 }}>{cfg.label}</div>
}

function CompanyCard({ company, reviewCount, avgRating }: any) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <a href={`/reviews/${company.slug}`} style={{ textDecoration:'none', color:'inherit', display:'block' }}>
      <div style={{ border:'1px solid #E2E8F0', borderRadius:12, padding:0, background:'#fff', transition:'all .2s', overflow:'hidden', height:'100%' }}
        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow='0 8px 30px rgba(0,0,0,0.12)';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow='none';(e.currentTarget as HTMLElement).style.transform='none'}}>

        {/* Card header */}
        <div style={{ padding:'20px 20px 0' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
            {/* Logo — served via our proxy for reliability */}
            <div style={{ width:56, height:56, borderRadius:10, overflow:'hidden', border:'1px solid #E2E8F0', flexShrink:0, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:4 }}>
              {company.logo_url && !imgErr ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  width={48} height={48}
                  style={{ width:48, height:48, objectFit:'contain', display:'block', maxWidth:'100%' }}
                  onError={(e) => {
                    const t = e.currentTarget
                    // Try DuckDuckGo favicon as fallback
                    if (!t.dataset.tried2) {
                      t.dataset.tried2 = '1'
                      t.src = `https://icons.duckduckgo.com/ip3/${company.slug === 'etoro' ? 'etoro.com' : company.slug === 'ic-markets' ? 'icmarkets.com' : company.slug === 'interactive-brokers' ? 'interactivebrokers.com' : company.slug + '.com'}.ico`
                    } else {
                      setImgErr(true)
                    }
                  }}
                />
              ) : (
                <div style={{ width:48, height:48, borderRadius:8, background:company.logo_color||GREEN, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:18 }}>
                  {company.logo_letter||company.name.charAt(0)}
                </div>
              )}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontWeight:800, fontSize:16, color:DARK }}>{company.name}</span>
                {company.is_verified && <svg width={16} height={16} viewBox="0 0 24 24" fill={GREEN}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
              </div>
              {company.tagline && <div style={{ fontSize:12, color:'#64748B', marginTop:2, lineHeight:1.4 }}>{company.tagline}</div>}
            </div>
            <TrustBadge rating={avgRating} />
          </div>

          {/* Rating row */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <Stars rating={avgRating} size={15} />
            <span style={{ fontSize:14, fontWeight:800, color:DARK }}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
            <span style={{ fontSize:12, color:'#94A3B8' }}>· {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Meta info */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
            {company.regulation && (
              <span style={{ fontSize:11, fontWeight:600, color:GREEN, background:'#f0fdf8', border:'1px solid #bbf7d0', padding:'2px 8px', borderRadius:100 }}>
                ✓ {company.regulation.split('/')[0].trim()}
              </span>
            )}
            {company.headquarters && (
              <span style={{ fontSize:11, color:'#64748B' }}>📍 {company.headquarters}</span>
            )}
            {company.founded && (
              <span style={{ fontSize:11, color:'#64748B' }}>🗓 Since {company.founded}</span>
            )}
          </div>

          {/* Description */}
          <p style={{ fontSize:13, color:'#475569', lineHeight:1.6, marginBottom:16, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {company.description}
          </p>
        </div>

        {/* Card footer */}
        <div style={{ borderTop:'1px solid #F1F5F9', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#FAFBFC' }}>
          <span style={{ fontSize:13, fontWeight:700, color:GREEN }}>Read {reviewCount} reviews →</span>
          {company.website && (
            <span onClick={e=>{e.preventDefault();e.stopPropagation();window.open(company.website,'_blank')}}
              style={{ fontSize:12, color:'#64748B', padding:'4px 10px', border:'1px solid #E2E8F0', borderRadius:6, cursor:'pointer', background:'#fff', display:'flex', alignItems:'center', gap:4 }}>
              🌐 Visit site
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

export default function TrustTemplate({ articles = [], site, siteSlug }: any) {
  const [companies, setCompanies] = useState<any[]>([])
  const [reviewStats, setReviewStats] = useState<Record<string,{count:number,avg:number}>>({})
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/verivex/companies').then(r=>r.json()),
      fetch('/api/verivex/stats').then(r=>r.json()),
    ]).then(([co,stats])=>{
      setCompanies(co.companies||[])
      setReviewStats(stats.stats||{})
      setLoading(false)
    }).catch(()=>setLoading(false))
  },[])

  const CATS = [
    {id:'all',label:'All Reviews',icon:'⭐'},
    {id:'forex',label:'Forex Brokers',icon:'📈'},
    {id:'crypto',label:'Crypto Exchanges',icon:'₿'},
    {id:'prop',label:'Prop Firms',icon:'🏦'},
    {id:'regulated',label:'Regulated Brokers',icon:'✅'},
  ]

  const filtered = companies.filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // SEO: structured data
  const aggregateRating = {
    '@context':'https://schema.org',
    '@type':'WebSite',
    name: site?.name || 'Verivex',
    url: 'https://verivex.co',
    description: 'Independent verified broker reviews and trust scores',
    potentialAction: { '@type':'SearchAction', target:'https://verivex.co/reviews/{search_term_string}', 'query-input':'required name=search_term_string' }
  }

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#F4F6F8', color:DARK, minHeight:'100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRating) }} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        .srch{padding:10px 16px 10px 40px;border:1px solid #E2E8F0;border-radius:10px;font-size:14px;font-family:inherit;outline:none;width:100%;background:#fff;transition:all .2s}
        .srch:focus{border-color:${GREEN};box-shadow:0 0 0 3px ${GREEN}20}
        .cat-btn{padding:7px 18px;border-radius:100px;border:1.5px solid #E2E8F0;cursor:pointer;font-weight:600;font-size:13px;font-family:inherit;white-space:nowrap;transition:all .15s;background:#fff;color:#475569}
        .cat-btn.active{background:${DARK};color:#fff;border-color:${DARK}}
        .cat-btn:hover:not(.active){border-color:${GREEN};color:${GREEN}}
        @media(max-width:768px){.grid3{grid-template-columns:1fr!important}.hide-m{display:none!important}.hero-flex{flex-direction:column!important}}
      `}</style>

      {/* eToro top banner */}
      <div style={{ background:'linear-gradient(135deg,#004f35,#00B67A)', padding:'10px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
        <span style={{ fontSize:13, color:'#fff' }}>📊 <strong>eToro</strong> — 4.5★ · FCA / CySEC / ASIC Regulated · 284,000+ verified reviews</span>
        <a href="/reviews/etoro" style={{ background:'#fff', color:GREEN, padding:'6px 16px', borderRadius:6, fontSize:12, fontWeight:800 }}>Read Reviews →</a>
      </div>

      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'14px 0', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', gap:16 }}>
          <a href="/" style={{ fontWeight:900, fontSize:22, color:DARK, flexShrink:0, letterSpacing:'-0.02em' }}>
            VERI<span style={{ color:GREEN }}>VEX</span>
            <span style={{ fontSize:10, fontWeight:600, color:'#94A3B8', marginLeft:6, letterSpacing:0 }}>Trust Intelligence</span>
          </a>
          <div style={{ flex:1, maxWidth:480, position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15 }}>🔍</span>
            <input className="srch" placeholder="Search broker or platform..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="hide-m" style={{ display:'flex', gap:8, alignItems:'center' }}>
            <a href="/reviews/etoro" style={{ fontSize:13, color:'#475569', padding:'8px 14px', border:'1px solid #E2E8F0', borderRadius:8 }}>For Businesses</a>
            <a href="/reviews/etoro" style={{ fontSize:13, fontWeight:700, color:'#fff', padding:'9px 18px', borderRadius:8, background:GREEN }}>✍️ Write a Review</a>
          </div>
        </div>
        {/* Category tabs */}
        <div style={{ maxWidth:1200, margin:'12px auto 0', padding:'0 24px', display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
          {CATS.map(cat => (
            <button key={cat.id} onClick={()=>setActiveCategory(cat.id)}
              className={`cat-btn${activeCategory===cat.id?' active':''}`}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        {/* Hero */}
        {!search && activeCategory === 'all' && (
          <div style={{ background:`linear-gradient(135deg,${DARK} 60%,#1e3a2f)`, borderRadius:16, padding:'40px 48px', marginBottom:32, color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24 }} className="hero-flex">
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:GREEN, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10 }}>Independent · Verified · Trusted</div>
              <h1 style={{ fontSize:36, fontWeight:900, lineHeight:1.1, marginBottom:12 }}>Find a Broker<br/>You Can Trust</h1>
              <p style={{ fontSize:15, color:'#94A3B8', maxWidth:420, lineHeight:1.7 }}>Real reviews from real traders. Every platform independently verified against FCA, CySEC and ASIC regulatory registers.</p>
              <a href="/reviews/etoro" style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:20, background:GREEN, color:'#fff', padding:'12px 24px', borderRadius:8, fontWeight:700, fontSize:14 }}>
                Browse All Reviews
              </a>
            </div>
            <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
              {[['284K+','Verified Reviews'],['1,200+','Brokers Profiled'],['4.2★','Avg Trust Score'],['63','Countries']].map(([v,l])=>(
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:32, fontWeight:900, color:GREEN }}>{v}</div>
                  <div style={{ fontSize:12, color:'#64748B', marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Company grid */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:DARK }}>
              {search ? `Results for "${search}"` : CATS.find(c=>c.id===activeCategory)?.label || 'All Reviews'}
              <span style={{ fontSize:14, fontWeight:400, color:'#94A3B8', marginLeft:8 }}>({filtered.length} platforms)</span>
            </h2>
            {search && <button onClick={()=>setSearch('')} style={{ fontSize:12, color:GREEN, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Clear ×</button>}
          </div>

          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }} className="grid3">
              {[1,2,3,4,5,6].map(i=>(
                <div key={i} style={{ border:'1px solid #E2E8F0', borderRadius:12, padding:20, background:'#fff', height:200 }}>
                  <div style={{ width:52, height:52, borderRadius:10, background:'#F1F5F9', marginBottom:12 }}/>
                  <div style={{ height:14, background:'#F1F5F9', borderRadius:4, marginBottom:8, width:'70%' }}/>
                  <div style={{ height:10, background:'#F1F5F9', borderRadius:4, width:'50%' }}/>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'#94A3B8' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
              <div style={{ fontWeight:600 }}>No results found for "{search}"</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, alignItems:'start' }} className="grid3">
              {filtered.map(co=>(
                <CompanyCard key={co.id} company={co}
                  reviewCount={reviewStats[co.slug]?.count||0}
                  avgRating={reviewStats[co.slug]?.avg||0} />
              ))}
            </div>
          )}
        </div>

        {/* Articles section */}
        {articles.length > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:DARK }}>📰 Regulation & Market Reports</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }} className="grid3">
              {articles.slice(0,4).map((a:any)=>(
                <a key={a.slug} href={`/article/${siteSlug}/${a.slug}`}
                  style={{ border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden', background:'#fff', display:'block', transition:'all .2s' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(0,0,0,0.1)';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow='none';(e.currentTarget as HTMLElement).style.transform='none'}}>
                  {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} style={{ width:'100%', height:150, objectFit:'cover' }}/>}
                  <div style={{ padding:18 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:GREEN, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>{a.category||'Analysis'}</div>
                    <div style={{ fontSize:15, fontWeight:700, lineHeight:1.4, marginBottom:8, color:DARK }}>{a.title}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontSize:12, color:'#94A3B8' }}>{a.author_name}</div>
                      <div style={{ fontSize:12, color:'#94A3B8' }}>{new Date(a.published_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background:DARK, color:'#64748B', padding:'40px 24px', marginTop:48 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:32 }} className="grid3">
          <div>
            <div style={{ fontWeight:900, fontSize:22, color:'#fff', marginBottom:8 }}>VERI<span style={{ color:GREEN }}>VEX</span></div>
            <p style={{ fontSize:13, lineHeight:1.7 }}>Independent broker reviews and trust intelligence. All reviews moderated for authenticity.</p>
          </div>
          <div>
            <div style={{ fontWeight:700, color:'#94A3B8', fontSize:12, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Top Reviewed</div>
            {['etoro','ic-markets','pepperstone','ftmo','binance'].map(s=>(
              <a key={s} href={`/reviews/${s}`} style={{ display:'block', fontSize:13, color:'#64748B', marginBottom:6, textTransform:'capitalize' }}>
                {s.replace(/-/g,' ')}
              </a>
            ))}
          </div>
          <div>
            <div style={{ fontWeight:700, color:'#94A3B8', fontSize:12, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Categories</div>
            {[['forex','Forex Brokers'],['crypto','Crypto Exchanges'],['prop','Prop Firms'],['regulated','Regulated Brokers']].map(([id,label])=>(
              <div key={id} style={{ fontSize:13, color:'#64748B', marginBottom:6, cursor:'pointer' }}>{label}</div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth:1200, margin:'24px auto 0', paddingTop:20, borderTop:'1px solid #1e293b', textAlign:'center', fontSize:12 }}>
          © 2025 Verivex Trust Intelligence · verivex.co · Reviews moderated for authenticity
        </div>
        <div style={{ maxWidth:1200, margin:'12px auto 0', paddingTop:12, borderTop:'1px solid #1e293b', display:'flex', justifyContent:'center', gap:24 }}>
          {[['Privacy Policy','/legal/privacy'],['Terms of Service','/legal/terms'],['Cookie Policy','/legal/cookies'],['For Businesses','/for-businesses']].map(([l,h])=>(
            <a key={l} href={h} style={{ fontSize:11, color:'#475569' }}>{l}</a>
          ))}
        </div>
      </footer>
      {/* ── "We're Verivex" section ── */}
      <div style={{ background:'#C8F0D8', padding:'48px 24px', marginTop:0 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', gap:40, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:260 }}>
            <h2 style={{ fontSize:32, fontWeight:900, color:'#191919', marginBottom:12 }}>We're Verivex</h2>
            <p style={{ fontSize:15, color:'#1a5c35', lineHeight:1.7, maxWidth:460, marginBottom:24 }}>
              We're a review platform that's open to everyone. Our vision is to become the universal symbol of trust in trading — empowering people to invest with confidence, and helping companies improve.
            </p>
            <a href="/for-businesses" style={{ display:'inline-block', background:'#191919', color:'#fff', padding:'12px 24px', borderRadius:100, fontWeight:700, fontSize:14, textDecoration:'none' }}>
              What we do
            </a>
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ background:'#1a5c35', borderRadius:16, padding:28, color:'#fff' }}>
              <div style={{ fontWeight:800, fontSize:16, marginBottom:8 }}>📊 Our 2025 Trust Report has landed!</div>
              <p style={{ fontSize:13, color:'#86efac', lineHeight:1.6, marginBottom:16 }}>Find out which actions we've taken to protect traders and promote trust on our platform.</p>
              <a href="/legal/privacy" style={{ display:'inline-block', background:'transparent', color:'#fff', border:'2px solid #fff', padding:'8px 20px', borderRadius:100, fontWeight:700, fontSize:13, textDecoration:'none' }}>
                Take a look
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── "Help millions make the right choice" section ── */}
      <div style={{ background:'#F5EFE8', padding:'48px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', gap:40, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:260 }}>
            <h2 style={{ fontSize:28, fontWeight:900, color:'#191919', marginBottom:12 }}>Help millions make the right choice</h2>
            <p style={{ fontSize:14, color:'#64748B', lineHeight:1.7, marginBottom:24 }}>Share your experience on Verivex, where reviews make a difference for traders worldwide.</p>
            <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <a href="/reviews/etoro" style={{ display:'inline-block', background:'#191919', color:'#fff', padding:'11px 24px', borderRadius:100, fontWeight:700, fontSize:14, textDecoration:'none' }}>
                Write a review
              </a>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                {[
                  { icon:'G', color:'#4285F4', label:'Google' },
                  { icon:'f', color:'#1877F2', label:'Facebook' },
                  { icon:'', color:'#000', label:'Apple' },
                ].map(s => (
                  <div key={s.label} style={{ width:36, height:36, borderRadius:100, border:'2px solid #E2E8F0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:s.color, cursor:'pointer' }} title={`Sign in with ${s.label}`}>
                    {s.label === 'Apple' ? '🍎' : s.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ flex:1, minWidth:280, display:'flex', gap:12, justifyContent:'flex-end' }}>
            {[
              { emoji:'🌊', bg:'#87CEEB', text:'Trader from 63+ countries' },
              { emoji:'💻', bg:'#F0F4FF', text:'Reviews verified daily' },
              { emoji:'😊', bg:'#FFF0E0', text:'284k+ verified reviews' },
            ].map(card => (
              <div key={card.text} style={{ width:110, background:card.bg, borderRadius:16, padding:'20px 14px', textAlign:'center', fontSize:12, color:'#475569', flexShrink:0 }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{card.emoji}</div>
                {card.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <CookieBanner primaryColor='#00B67A' />
    </div>
  )
}
