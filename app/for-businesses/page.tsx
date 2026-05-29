'use client'
import { useState } from 'react'

const GREEN = '#00B67A'

export default function ForBusinessesPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ company:'', website:'', name:'', email:'', message:'' })

  async function submit(e: any) {
    e.preventDefault()
    // Send to admin via email
    await fetch('/api/verivex/business-inquiry', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)
    })
    setSent(true)
  }

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", minHeight:'100vh', background:'#F4F6F8', color:'#191919' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.inp{width:100%;padding:11px 14px;border:1px solid #E2E8F0;border-radius:8px;font-size:14px;font-family:inherit;outline:none;transition:all .2s;background:#fff}.inp:focus{border-color:${GREEN};box-shadow:0 0 0 3px ${GREEN}18}`}</style>

      <header style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/" style={{ fontWeight:900, fontSize:20, color:'#191919' }}>VERI<span style={{ color:GREEN }}>VEX</span></a>
        <a href="/" style={{ fontSize:13, color:'#475569' }}>← Back to reviews</a>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'60px 24px' }}>
        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontSize:11, fontWeight:700, color:GREEN, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>For Business Owners</div>
          <h1 style={{ fontSize:42, fontWeight:900, lineHeight:1.1, marginBottom:16 }}>Claim & Manage<br/>Your Company Profile</h1>
          <p style={{ fontSize:16, color:'#64748B', maxWidth:540, margin:'0 auto', lineHeight:1.7 }}>
            Take control of your brand reputation on Verivex. Claim your profile, respond to reviews, and build trust with thousands of traders.
          </p>
        </div>

        {/* Features */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:56 }}>
          {[
            { icon:'🏢', title:'Claim Your Profile', desc:'Verify ownership of your company listing. Add your official description, regulation details, website and team information.' },
            { icon:'💬', title:'Respond to Reviews', desc:'Publicly respond to customer reviews — both positive and negative. Show transparency and commitment to client satisfaction.' },
            { icon:'📊', title:'Analytics Dashboard', desc:'See how many traders are viewing your profile, reading your reviews, and clicking through to your website each month.' },
            { icon:'✅', title:'Verified Badge', desc:'Get a verified business badge on your profile. Increases trust and click-through rates from potential clients.' },
            { icon:'🔔', title:'Review Alerts', desc:'Get notified instantly when a new review is posted about your company. Never miss client feedback again.' },
            { icon:'📈', title:'Trust Score Reporting', desc:'Monthly trust score reports showing your rating trend, sentiment analysis, and comparison with competitors.' },
          ].map(f => (
            <div key={f.title} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:24 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>{f.icon}</div>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>{f.title}</div>
              <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start' }}>
          <div>
            <h2 style={{ fontSize:28, fontWeight:800, marginBottom:12 }}>Get Started Today</h2>
            <p style={{ fontSize:14, color:'#64748B', lineHeight:1.7, marginBottom:24 }}>Fill in the form and our team will reach out within 24 hours to verify your company and set up your business account.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[['Free to claim','Your basic profile listing is always free'],['Verified in 24h','Fast identity verification process'],['No long contracts','Monthly or annual plans, cancel anytime']].map(([t,d]) => (
                <div key={t} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ color:GREEN, fontSize:18, marginTop:1 }}>✓</span>
                  <div><div style={{ fontWeight:600, fontSize:14 }}>{t}</div><div style={{ fontSize:12, color:'#64748B' }}>{d}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:16, padding:32 }}>
            {sent ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
                <h3 style={{ fontSize:20, fontWeight:800, color:GREEN, marginBottom:8 }}>Request Received!</h3>
                <p style={{ fontSize:14, color:'#64748B' }}>Our team will contact you at {form.email} within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>Claim Your Company Profile</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div><label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Company Name *</label>
                    <input className="inp" placeholder="e.g. eToro" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} required /></div>
                  <div><label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Company Website *</label>
                    <input className="inp" type="url" placeholder="https://yourcompany.com" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} required /></div>
                  <div><label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Your Name *</label>
                    <input className="inp" placeholder="Full name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required /></div>
                  <div><label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Work Email *</label>
                    <input className="inp" type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required /></div>
                  <div><label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Message (optional)</label>
                    <textarea className="inp" rows={3} placeholder="Anything you'd like us to know..." value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} style={{ resize:'vertical' }} /></div>
                  <button type="submit" style={{ background:GREEN, color:'#fff', border:'none', borderRadius:8, padding:'13px', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
                    Request Business Access →
                  </button>
                </div>
                <p style={{ fontSize:11, color:'#94A3B8', marginTop:12, textAlign:'center' }}>Free to get started · Response within 24 hours</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
