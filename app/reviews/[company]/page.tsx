'use client'
import { useState, useEffect, use } from 'react'

const GREEN = '#00B67A'

function Stars({ rating, size = 18, interactive = false, onRate }: any) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= (interactive ? (hover||rating) : Math.round(rating)) ? GREEN : '#E8E8E8'}
          style={{ cursor: interactive ? 'pointer' : 'default', transition:'fill .1s' }}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate && onRate(s)}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

const LOGO_DOMAINS: Record<string,string> = {
  'etoro': 'etoro.com', 'ic-markets': 'icmarkets.com', 'pepperstone': 'pepperstone.com',
  'xm': 'xm.com', 'ftmo': 'ftmo.com', 'binance': 'binance.com', 'coinbase': 'coinbase.com',
  'interactive-brokers': 'interactivebrokers.com', 'plus500': 'plus500.com', 'myforexfunds': 'myforexfunds.com',
}

function CompanyLogo({ slug, name, size = 48 }: any) {
  const [err, setErr] = useState(false)
  const domain = LOGO_DOMAINS[slug]
  return domain && !err ? (
    <img src={`https://logo.clearbit.com/${domain}`} alt={name}
      style={{ width:size, height:size, borderRadius:8, objectFit:'contain', background:'#f8f8f8', border:'1px solid #eee' }}
      onError={() => setErr(true)} />
  ) : (
    <div style={{ width:size, height:size, borderRadius:8, background:GREEN, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:size*0.35 }}>
      {name.charAt(0)}
    </div>
  )
}

export default function ReviewPage({ params }: { params: Promise<{ company: string }> | { company: string } }) {
  // Support both Next.js 14 (sync) and 15 (async) params
  const resolvedParams = typeof (params as any).then === 'function' ? use(params as Promise<{ company: string }>) : params as { company: string }
  const company = resolvedParams.company

  const [reviews, setReviews] = useState<any[]>([])
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterRating, setFilterRating] = useState(0)
  const [form, setForm] = useState({ reviewer_name:'', reviewer_location:'', rating:0, title:'', review_text:'', trading_experience:'intermediate' })

  useEffect(() => {
    Promise.all([
      fetch(`/api/reviews?slug=${company}`).then(r => r.json()),
      fetch(`/api/verivex/companies`).then(r => r.json()),
    ]).then(([rv, co]) => {
      setReviews(rv.reviews || [])
      const found = (co.companies || []).find((c: any) => c.slug === company)
      setCompanyInfo(found)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [company])

  const companyName = companyInfo?.name || company.split('-').map((w:string) => w.charAt(0).toUpperCase()+w.slice(1)).join(' ')
  const avgRating = reviews.length ? reviews.reduce((s,r) => s+r.rating, 0) / reviews.length : 0
  const dist = [5,4,3,2,1].map(s => ({ stars:s, count: reviews.filter(r=>r.rating===s).length }))
  const filtered = filterRating ? reviews.filter(r => r.rating===filterRating) : reviews
  const ratingLabel = avgRating >= 4.5 ? 'Excellent' : avgRating >= 4 ? 'Great' : avgRating >= 3 ? 'Good' : avgRating > 0 ? 'Average' : ''

  async function submit(e: any) {
    e.preventDefault()
    if (!form.rating) return alert('Please select a star rating')
    if (form.review_text.length < 50) return alert('Review must be at least 50 characters')
    setSubmitting(true)
    const res = await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, company_name: companyName, company_slug: company }) })
    const d = await res.json()
    if (d.success) { setSubmitted(true); setShowForm(false); setForm({ reviewer_name:'', reviewer_location:'', rating:0, title:'', review_text:'', trading_experience:'intermediate' }) }
    else alert(d.error || 'Error submitting')
    setSubmitting(false)
  }

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#F4F6F8', minHeight:'100vh', color:'#191919' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.inp{width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;outline:none;transition:border .2s;background:#fff}.inp:focus{border-color:${GREEN};box-shadow:0 0 0 3px ${GREEN}20}@media(max-width:700px){.flex-wrap{flex-direction:column!important}.grid2{grid-template-columns:1fr!important}}`}</style>

      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'1px solid #E8E8E8', padding:'14px 24px', display:'flex', alignItems:'center', gap:16, position:'sticky', top:0, zIndex:100 }}>
        <a href="/" style={{ fontWeight:900, fontSize:20, color:'#191919' }}>VERI<span style={{ color:GREEN }}>VEX</span></a>
        <div style={{ flex:1 }}/>
        <button onClick={() => setShowForm(true)} style={{ background:GREEN, color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          ✍️ Write a Review
        </button>
      </header>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 24px' }}>

        {/* Company header */}
        <div style={{ background:'#fff', borderRadius:12, padding:32, marginBottom:24, border:'1px solid #E8E8E8' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:20, marginBottom:24 }} className="flex-wrap">
            <CompanyLogo slug={company} name={companyName} size={72} />
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                <h1 style={{ fontSize:28, fontWeight:900 }}>{companyName}</h1>
                {companyInfo?.is_verified && <span style={{ background:`${GREEN}15`, color:GREEN, fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:100, border:`1px solid ${GREEN}40` }}>✓ Verified</span>}
              </div>
              {companyInfo?.regulation && <div style={{ fontSize:13, color:'#888', marginBottom:8 }}>{companyInfo.regulation}</div>}
              {companyInfo?.description && <div style={{ fontSize:14, color:'#555', lineHeight:1.6, marginBottom:8 }}>{companyInfo.description}</div>}
              {companyInfo?.website && (
                <a href={companyInfo.website} target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#0EA5E9', fontWeight:600, marginTop:4 }}>
                  🌐 {companyInfo.website.replace('https://www.','').replace('https://','')} ↗
                </a>
              )}
            </div>
            <div style={{ textAlign:'center', background:`${GREEN}08`, border:`1px solid ${GREEN}30`, borderRadius:12, padding:'20px 28px', flexShrink:0 }}>
              <div style={{ fontSize:48, fontWeight:900, color:GREEN, lineHeight:1 }}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
              <Stars rating={avgRating} size={20} />
              {ratingLabel && <div style={{ fontSize:14, fontWeight:700, color:GREEN, marginTop:6 }}>{ratingLabel}</div>}
              <div style={{ fontSize:12, color:'#888', marginTop:4 }}>{reviews.length} reviews</div>
            </div>
          </div>

          {/* Rating distribution */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }} className="grid2">
            <div>
              {dist.map(d => (
                <div key={d.stars} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, cursor:'pointer' }}
                  onClick={() => setFilterRating(filterRating===d.stars ? 0 : d.stars)}>
                  <div style={{ display:'flex', alignItems:'center', gap:4, width:50, flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:filterRating===d.stars?700:400, color:filterRating===d.stars?GREEN:'#555' }}>{d.stars} star</span>
                  </div>
                  <div style={{ flex:1, height:8, background:'#f0f0f0', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${reviews.length ? d.count/reviews.length*100 : 0}%`, height:'100%', background:GREEN, borderRadius:4, transition:'width .5s' }}/>
                  </div>
                  <span style={{ fontSize:12, color:'#888', width:20, textAlign:'right' }}>{d.count}</span>
                </div>
              ))}
              {filterRating > 0 && <button onClick={() => setFilterRating(0)} style={{ fontSize:12, color:GREEN, background:'none', border:'none', cursor:'pointer', fontWeight:600, marginTop:4 }}>Clear filter ×</button>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {companyInfo?.regulation && ['FCA','CySEC','ASIC'].filter(r => companyInfo.regulation.includes(r)).map((r:string) => (
                <div key={r} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                  <span style={{ color:GREEN }}>✅</span> <span>{r} Regulated</span>
                </div>
              ))}
              <div style={{ fontSize:13, color:'#555', display:'flex', alignItems:'center', gap:8 }}><span style={{ color:GREEN }}>✅</span> Segregated Client Funds</div>
              <div style={{ fontSize:13, color:'#555', display:'flex', alignItems:'center', gap:8 }}><span style={{ color:GREEN }}>✅</span> Independently Reviewed</div>
            </div>
          </div>
        </div>

        {/* Success banner */}
        {submitted && (
          <div style={{ background:'#f0fdf8', border:`1px solid ${GREEN}`, borderRadius:8, padding:16, marginBottom:20, display:'flex', gap:12 }}>
            <span style={{ fontSize:20 }}>✅</span>
            <div><div style={{ fontWeight:700, color:GREEN }}>Review submitted!</div><div style={{ fontSize:13, color:'#555' }}>Your review will appear after moderation (within 24h).</div></div>
          </div>
        )}

        {/* Write review form */}
        {showForm && (
          <div style={{ background:'#fff', border:`2px solid ${GREEN}`, borderRadius:12, padding:28, marginBottom:24 }}>
            <h2 style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>Review {companyName}</h2>
            <p style={{ fontSize:13, color:'#888', marginBottom:20 }}>Published after moderation · Helps other traders make informed decisions</p>
            <form onSubmit={submit}>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:8 }}>Your Rating *</label>
                <Stars rating={form.rating} size={36} interactive onRate={(v:number) => setForm(f=>({...f,rating:v}))} />
                {form.rating > 0 && <span style={{ fontSize:13, color:GREEN, marginTop:6, display:'block', fontWeight:600 }}>
                  {['','Poor','Fair','Good','Very Good','Excellent'][form.rating]}
                </span>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }} className="grid2">
                <div><label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:6 }}>Name *</label><input className="inp" placeholder="e.g. James R." value={form.reviewer_name} onChange={e=>setForm(f=>({...f,reviewer_name:e.target.value}))} required/></div>
                <div><label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:6 }}>Location</label><input className="inp" placeholder="e.g. London, UK" value={form.reviewer_location} onChange={e=>setForm(f=>({...f,reviewer_location:e.target.value}))}/></div>
              </div>
              <div style={{ marginBottom:14 }}><label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:6 }}>Review Title *</label><input className="inp" placeholder="Summarise your experience" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/></div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:6 }}>Your Review * <span style={{ fontWeight:400, color:'#aaa' }}>(min 50 chars)</span></label>
                <textarea className="inp" rows={5} placeholder="Describe withdrawals, platform, support, execution quality..." value={form.review_text} onChange={e=>setForm(f=>({...f,review_text:e.target.value}))} required style={{ resize:'vertical' }}/>
                <div style={{ fontSize:11, marginTop:4, color:form.review_text.length>=50?GREEN:'#bbb' }}>{form.review_text.length} / 50 minimum</div>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:6 }}>Experience Level</label>
                <select className="inp" value={form.trading_experience} onChange={e=>setForm(f=>({...f,trading_experience:e.target.value}))} style={{ background:'#fff' }}>
                  <option value="beginner">Beginner (under 1 year)</option>
                  <option value="intermediate">Intermediate (1–3 years)</option>
                  <option value="professional">Professional (3+ years)</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={submitting} style={{ flex:1, padding:'12px', background:GREEN, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:submitting?'not-allowed':'pointer', opacity:submitting?.7:1, fontFamily:'inherit' }}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding:'12px 20px', background:'#fff', border:'1px solid #ddd', borderRadius:8, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              </div>
              <p style={{ fontSize:11, color:'#aaa', textAlign:'center', marginTop:10 }}>By submitting you confirm this reflects your genuine experience.</p>
            </form>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontSize:18, fontWeight:700 }}>Reviews ({filtered.length})</h2>
            {!showForm && <button onClick={() => setShowForm(true)} style={{ background:GREEN, color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>✍️ Write a Review</button>}
          </div>

          {loading ? <div style={{ textAlign:'center', padding:60, color:'#888' }}>Loading reviews...</div>
          : filtered.length === 0 ? (
            <div style={{ background:'#fff', border:'1px solid #E8E8E8', borderRadius:12, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📝</div>
              <div style={{ fontWeight:700, marginBottom:8 }}>No reviews yet</div>
              <div style={{ fontSize:13, color:'#888', marginBottom:20 }}>Be the first to review {companyName}</div>
              <button onClick={() => setShowForm(true)} style={{ background:GREEN, color:'#fff', border:'none', borderRadius:8, padding:'10px 24px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Write First Review</button>
            </div>
          ) : filtered.map((r:any) => (
            <div key={r.id} style={{ background:'#fff', border:'1px solid #E8E8E8', borderRadius:10, padding:24, marginBottom:12, transition:'box-shadow .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)')}
              onMouseLeave={e=>(e.currentTarget.style.boxShadow='none')}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <Stars rating={r.rating} size={16} />
                    <span style={{ fontSize:13, fontWeight:700, color:r.rating>=4?GREEN:r.rating<=2?'#EF4444':'#F59E0B' }}>
                      {r.rating===5?'Excellent':r.rating===4?'Great':r.rating===3?'Good':r.rating===2?'Fair':'Poor'}
                    </span>
                    {r.verified && <span style={{ fontSize:11, background:`${GREEN}15`, color:GREEN, border:`1px solid ${GREEN}30`, padding:'2px 8px', borderRadius:100, fontWeight:600 }}>✓ Verified</span>}
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:700 }}>{r.title}</h3>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{r.reviewer_name}</div>
                  {r.reviewer_location && <div style={{ fontSize:12, color:'#888' }}>{r.reviewer_location}</div>}
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
                </div>
              </div>
              <p style={{ fontSize:14, lineHeight:1.75, color:'#444' }}>{r.review_text}</p>
              {r.trading_experience && <div style={{ marginTop:10, fontSize:12, color:'#aaa' }}>Experience: <span style={{ color:'#666', fontWeight:600, textTransform:'capitalize' }}>{r.trading_experience}</span></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
