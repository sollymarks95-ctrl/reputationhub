'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const GREEN = '#00B67A'

function StarRating({ rating, size = 20 }: { rating: number, size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? '#00B67A' : '#E8E8E8'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function StarInput({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={36} height={36} viewBox="0 0 24 24"
          fill={s <= (hover || value) ? '#00B67A' : '#E8E8E8'}
          style={{ cursor: 'pointer', transition: 'fill .15s' }}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      {(hover || value) > 0 && (
        <span style={{ marginLeft: 8, fontSize: 14, color: '#555', alignSelf: 'center' }}>
          {['','Poor','Fair','Good','Very Good','Excellent'][hover || value]}
        </span>
      )}
    </div>
  )
}

export default function ReviewPage({ params }: { params: { company: string } }) {
  const company = params.company
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterRating, setFilterRating] = useState(0)
  const [form, setForm] = useState({ reviewer_name: '', reviewer_location: '', rating: 0, title: '', review_text: '', trading_experience: 'intermediate' })

  useEffect(() => {
    fetch(`/api/reviews?slug=${company}`)
      .then(r => r.json())
      .then(d => { setReviews(d.reviews || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [company])

  const companyName = reviews[0]?.company_name || company.charAt(0).toUpperCase() + company.slice(1)
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0'
  const dist = [5,4,3,2,1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length }))
  const filtered = filterRating ? reviews.filter(r => r.rating === filterRating) : reviews

  async function submitReview(e: any) {
    e.preventDefault()
    if (!form.rating) { alert('Please select a star rating'); return }
    if (form.review_text.length < 50) { alert('Review must be at least 50 characters'); return }
    setSubmitting(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, company_name: companyName, company_slug: company })
    })
    const d = await res.json()
    if (d.success) { setSubmitted(true); setShowForm(false) }
    else alert(d.error || 'Error submitting review')
    setSubmitting(false)
  }

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', color: '#191919', minHeight: '100vh' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .inp{width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:inherit;outline:none;transition:border .2s}
        .inp:focus{border-color:#00B67A}
        .btn{padding:12px 24px;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:14px;font-family:inherit;transition:all .2s}
        .btn-green{background:#00B67A;color:#fff}
        .btn-green:hover{background:#009e6a}
        .btn-outline{background:#fff;color:#00B67A;border:2px solid #00B67A}
        .btn-outline:hover{background:#f0fdf8}
        .review-card{border:1px solid #E8E8E8;border-radius:8px;padding:24px;margin-bottom:16px;transition:box-shadow .2s}
        .review-card:hover{box-shadow:0 4px 20px rgba(0,0,0,0.08)}
        @media(max-width:768px){.grid{grid-template-columns:1fr!important}.hide-mobile{display:none!important}}
      `}</style>

      {/* Header */}
      <header style={{ background: '#191919', padding: '14px 0', borderBottom: '3px solid #00B67A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>
            VERI<span style={{ color: '#00B67A' }}>VEX</span>
          </Link>
          <button className="btn btn-green" onClick={() => setShowForm(true)} style={{ fontSize: 13 }}>
            ✍️ Write a Review
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        {/* Company overview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, marginBottom: 40, alignItems: 'start' }} className="grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#00B67A,#004f35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 28 }}>
                {companyName.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{companyName}</h1>
                <div style={{ fontSize: 13, color: '#666' }}>FCA · CySEC · ASIC Regulated Platform</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: GREEN }}>{avgRating}</div>
              <div>
                <StarRating rating={Math.round(parseFloat(avgRating))} size={24} />
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{reviews.length} verified reviews</div>
              </div>
            </div>
            {/* Rating distribution */}
            <div style={{ maxWidth: 400 }}>
              {dist.map(d => (
                <div key={d.stars} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, cursor: 'pointer' }}
                  onClick={() => setFilterRating(filterRating === d.stars ? 0 : d.stars)}>
                  <span style={{ fontSize: 12, width: 40, color: filterRating === d.stars ? GREEN : '#555', fontWeight: filterRating === d.stars ? 700 : 400 }}>{d.stars} star</span>
                  <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${reviews.length ? (d.count / reviews.length * 100) : 0}%`, height: '100%', background: GREEN, borderRadius: 4, transition: 'width .5s' }} />
                  </div>
                  <span style={{ fontSize: 12, width: 20, color: '#888' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          <div style={{ background: '#f8fffe', border: '2px solid #00B67A', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>Verified Platform</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4, marginBottom: 16 }}>Regulation confirmed · Reviews moderated</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['✅ FCA Regulated (UK)','✅ CySEC Regulated (EU)','✅ ASIC Regulated (AU)','✅ Segregated Client Funds'].map(b => (
                <div key={b} style={{ fontSize: 13, color: '#333', textAlign: 'left' }}>{b}</div>
              ))}
            </div>
            <button className="btn btn-green" style={{ width: '100%', marginTop: 16 }} onClick={() => setShowForm(true)}>
              Rate {companyName}
            </button>
          </div>
        </div>

        {/* Submitted success banner */}
        {submitted && (
          <div style={{ background: '#f0fdf8', border: '1px solid #00B67A', borderRadius: 8, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#00B67A' }}>Review submitted successfully!</div>
              <div style={{ fontSize: 13, color: '#555' }}>Your review will appear within 24 hours after moderation.</div>
            </div>
          </div>
        )}

        {/* Filter bar */}
        {filterRating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 16px', background: '#f8fffe', border: '1px solid #00B67A', borderRadius: 8 }}>
            <span style={{ fontSize: 13 }}>Showing {filterRating}-star reviews ({filtered.length})</span>
            <button onClick={() => setFilterRating(0)} style={{ background: 'none', border: 'none', color: '#00B67A', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Clear filter ×</button>
          </div>
        )}

        {/* Reviews list */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              {filterRating ? `${filterRating}-Star Reviews` : 'All Reviews'}
              <span style={{ fontSize: 14, fontWeight: 400, color: '#888', marginLeft: 8 }}>({filtered.length})</span>
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading reviews...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>No reviews yet. Be the first!</div>
          ) : (
            filtered.map((r: any) => (
              <div key={r.id} className="review-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <StarRating rating={r.rating} size={16} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: r.rating >= 4 ? GREEN : r.rating <= 2 ? '#EF4444' : '#F59E0B' }}>
                        {r.rating === 5 ? 'Excellent' : r.rating === 4 ? 'Very Good' : r.rating === 3 ? 'Good' : r.rating === 2 ? 'Fair' : 'Poor'}
                      </span>
                      {r.verified && (
                        <span style={{ fontSize: 11, background: '#f0fdf8', color: GREEN, border: '1px solid #00B67A30', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{r.title}</h3>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.reviewer_name}</div>
                    {r.reviewer_location && <div style={{ fontSize: 12, color: '#888' }}>{r.reviewer_location}</div>}
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#444' }}>{r.review_text}</p>
                {r.trading_experience && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#888' }}>
                    Experience level: <span style={{ fontWeight: 600, color: '#555', textTransform: 'capitalize' }}>{r.trading_experience}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* CTA to write review */}
        {!showForm && (
          <div style={{ background: '#f8fffe', border: '1px solid #00B67A', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Share your experience with {companyName}</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Help other traders make informed decisions. Your honest review matters.</p>
            <button className="btn btn-green" style={{ padding: '14px 32px', fontSize: 15 }} onClick={() => setShowForm(true)}>
              Write a Review
            </button>
          </div>
        )}

        {/* Submit review form */}
        {showForm && (
          <div style={{ border: '2px solid #00B67A', borderRadius: 12, padding: 32, background: '#fff' }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Review {companyName}</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Your review will be published after moderation (usually within 24 hours).</p>

            <form onSubmit={submitReview}>
              {/* Star rating */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Overall Rating *</label>
                <StarInput value={form.rating} onChange={v => setForm(f => ({...f, rating: v}))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="grid">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Your Name *</label>
                  <input className="inp" placeholder="e.g. James R." value={form.reviewer_name} onChange={e => setForm(f => ({...f, reviewer_name: e.target.value}))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Location (optional)</label>
                  <input className="inp" placeholder="e.g. London, UK" value={form.reviewer_location} onChange={e => setForm(f => ({...f, reviewer_location: e.target.value}))} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Review Title *</label>
                <input className="inp" placeholder="Summarise your experience in one line" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Your Review * <span style={{ fontWeight: 400, color: '#888' }}>(min 50 characters)</span></label>
                <textarea className="inp" rows={5} placeholder="Describe your experience — platform usability, withdrawals, customer support, regulation, etc." value={form.review_text} onChange={e => setForm(f => ({...f, review_text: e.target.value}))} required style={{ resize: 'vertical' }} />
                <div style={{ fontSize: 12, color: form.review_text.length >= 50 ? GREEN : '#aaa', marginTop: 4 }}>{form.review_text.length}/50 characters minimum</div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Trading Experience</label>
                <select className="inp" value={form.trading_experience} onChange={e => setForm(f => ({...f, trading_experience: e.target.value}))} style={{ background: '#fff' }}>
                  <option value="beginner">Beginner (under 1 year)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="professional">Professional (3+ years)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-green" disabled={submitting} style={{ flex: 1, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              </div>

              <p style={{ fontSize: 12, color: '#aaa', marginTop: 12, textAlign: 'center' }}>
                By submitting you confirm this is your genuine experience. Reviews are moderated before publishing.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
