'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const GREEN = '#00B67A'
const DARK = '#191919'

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? GREEN : '#E8E8E8'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function RatingBadge({ rating }: { rating: number }) {
  const label = rating >= 4.5 ? 'Excellent' : rating >= 4 ? 'Great' : rating >= 3.5 ? 'Good' : rating >= 3 ? 'Average' : 'Poor'
  const bg = rating >= 4 ? GREEN : rating >= 3 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ background: bg, color:'#fff', fontWeight:800, fontSize:13, padding:'4px 10px', borderRadius:4, display:'inline-block' }}>
      {label}
    </div>
  )
}

function CompanyCard({ company, reviewCount, avgRating }: any) {
  return (
    <a href={`/reviews/${company.slug}`} style={{ textDecoration:'none', color:'inherit' }}>
      <div style={{ border:'1px solid #E8E8E8', borderRadius:8, padding:20, background:'#fff', transition:'all .2s', cursor:'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ width:44, height:44, borderRadius:8, background:company.logo_color||GREEN, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:15, flexShrink:0 }}>
            {company.logo_letter || company.name.charAt(0)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:6 }}>
              {company.name}
              {company.is_verified && <span style={{ fontSize:11, color:GREEN }}>✓</span>}
            </div>
            <div style={{ fontSize:11, color:'#888', marginTop:1 }}>{company.regulation}</div>
          </div>
          <RatingBadge rating={avgRating || 0} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <Stars rating={avgRating || 0} />
          <span style={{ fontSize:13, fontWeight:700 }}>{avgRating ? avgRating.toFixed(1) : '—'}</span>
          <span style={{ fontSize:12, color:'#888' }}>· {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ fontSize:12, color:'#666', lineHeight:1.5 }}>{company.description}</div>
        <div style={{ marginTop:12, fontSize:12, color:GREEN, fontWeight:600 }}>Read reviews →</div>
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
      fetch('/api/verivex/companies').then(r => r.json()),
      fetch('/api/verivex/stats').then(r => r.json()),
    ]).then(([co, stats]) => {
      setCompanies(co.companies || [])
      setReviewStats(stats.stats || {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const CATS = [
    { id:'all', label:'All Reviews' },
    { id:'forex', label:'Forex Brokers' },
    { id:'crypto', label:'Crypto Exchanges' },
    { id:'prop', label:'Prop Firms' },
    { id:'regulated', label:'Regulated Brokers' },
  ]

  const filtered = companies.filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const featured = companies.filter(c => c.is_featured)

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#F4F6F8', color:DARK, minHeight:'100vh' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        .inp{padding:12px 16px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;outline:none;width:100%;background:#fff}
        .inp:focus{border-color:${GREEN};box-shadow:0 0 0 3px ${GREEN}20}
        @media(max-width:768px){.grid3{grid-template-columns:1fr!important}.grid2{grid-template-columns:1fr!important}.hide-m{display:none!important}}
      `}</style>

      {/* eToro banner */}
      <div style={{ background:'#f0fdf8', borderBottom:`2px solid ${GREEN}`, padding:'10px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
        <span style={{ fontSize:13, color:'#333' }}>📊 <strong>eToro</strong> — 4.5/5 from 284,000+ verified reviews</span>
        <a href="/reviews/etoro" style={{ background:GREEN, color:'#fff', padding:'6px 16px', borderRadius:6, fontSize:12, fontWeight:700 }}>Read Reviews & Share Your Experience →</a>
      </div>

      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'1px solid #E8E8E8', padding:'12px 0', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', gap:20 }}>
          <a href="/" style={{ fontWeight:900, fontSize:22, color:DARK, flexShrink:0 }}>
            VERI<span style={{ color:GREEN }}>VEX</span>
          </a>
          <div style={{ flex:1, maxWidth:500 }}>
            <input className="inp" placeholder="🔍 Search company or broker..." value={search} onChange={e => setSearch(e.target.value)} style={{ height:40, fontSize:13 }} />
          </div>
          <div className="hide-m" style={{ display:'flex', gap:6 }}>
            <a href="/reviews/etoro" style={{ fontSize:13, fontWeight:600, color:'#555', padding:'8px 14px', borderRadius:6, border:'1px solid #ddd', background:'#fff' }}>For Businesses</a>
            <a href="/reviews/etoro" style={{ fontSize:13, fontWeight:700, color:'#fff', padding:'8px 16px', borderRadius:6, background:GREEN }}>Write a Review</a>
          </div>
        </div>

        {/* Category nav */}
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', gap:4, marginTop:10, overflowX:'auto', paddingBottom:2 }}>
          {CATS.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ padding:'6px 16px', borderRadius:100, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'inherit', whiteSpace:'nowrap', transition:'all .15s',
                background: activeCategory === cat.id ? DARK : '#F4F6F8',
                color: activeCategory === cat.id ? '#fff' : '#555' }}>
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        {/* Hero stats */}
        <div style={{ background:`linear-gradient(135deg,${DARK},#2d3748)`, borderRadius:16, padding:'40px 48px', marginBottom:32, color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24 }}>
          <div>
            <h1 style={{ fontSize:32, fontWeight:900, marginBottom:8 }}>Trusted Broker Reviews</h1>
            <p style={{ fontSize:15, color:'#94A3B8', maxWidth:480 }}>Real reviews from real traders. Every broker independently verified. Powered by Verivex Trust Intelligence.</p>
            <a href="/reviews/etoro" style={{ display:'inline-block', marginTop:16, background:GREEN, color:'#fff', padding:'12px 24px', borderRadius:8, fontWeight:700, fontSize:14 }}>Browse All Reviews</a>
          </div>
          <div style={{ display:'flex', gap:40 }}>
            {[['284,000+','Verified Reviews'],['1,200+','Brokers Profiled'],['4.2/5','Avg Trust Score'],['63','Countries']].map(([v,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:900, color:GREEN }}>{v}</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured + All companies */}
        {!search && activeCategory === 'all' && featured.length > 0 && (
          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:20, fontWeight:700, marginBottom:16 }}>⭐ Featured Platforms</h2>
            <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {featured.map(co => (
                <CompanyCard key={co.id} company={co} reviewCount={reviewStats[co.slug]?.count || 0} avgRating={reviewStats[co.slug]?.avg || 0} />
              ))}
            </div>
          </div>
        )}

        {/* Filtered list */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontSize:20, fontWeight:700 }}>
              {search ? `Results for "${search}"` : CATS.find(c=>c.id===activeCategory)?.label}
              <span style={{ fontSize:14, fontWeight:400, color:'#888', marginLeft:8 }}>({filtered.length})</span>
            </h2>
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:60, color:'#888' }}>Loading companies...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'#888' }}>No results found</div>
          ) : (
            <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {filtered.map(co => (
                <CompanyCard key={co.id} company={co} reviewCount={reviewStats[co.slug]?.count || 0} avgRating={reviewStats[co.slug]?.avg || 0} />
              ))}
            </div>
          )}
        </div>

        {/* Latest articles */}
        {articles.length > 0 && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, marginBottom:16 }}>📰 Latest Reports & Analysis</h2>
            <div className="grid2" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
              {articles.slice(0,4).map((a: any) => (
                <a key={a.slug} href={`/article/${siteSlug}/${a.slug}`} style={{ border:'1px solid #E8E8E8', borderRadius:8, overflow:'hidden', background:'#fff', display:'block', transition:'box-shadow .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
                  {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} style={{ width:'100%', height:140, objectFit:'cover' }} />}
                  <div style={{ padding:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:GREEN, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>{a.category}</div>
                    <div style={{ fontSize:15, fontWeight:700, lineHeight:1.4, marginBottom:6 }}>{a.title}</div>
                    <div style={{ fontSize:12, color:'#888' }}>{a.author_name} · {new Date(a.published_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background:DARK, color:'#94A3B8', padding:'32px 24px', marginTop:48, textAlign:'center' }}>
        <div style={{ fontWeight:900, fontSize:20, color:'#fff', marginBottom:8 }}>VERI<span style={{ color:GREEN }}>VEX</span></div>
        <div style={{ fontSize:12 }}>Independent broker reviews · verivex.co · All reviews moderated for authenticity</div>
      </footer>
    </div>
  )
}
