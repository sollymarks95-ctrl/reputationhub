'use client'
import { useState } from 'react'

export default function NewsletterInline({ siteId, siteName, primaryColor, dark }: {
  siteId: string; siteName: string; primaryColor: string; dark?: boolean
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const [msg, setMsg] = useState('')
  const p = primaryColor

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) { setStatus('err'); setMsg('Enter a valid email address.'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, siteId, siteName })
      })
      const data = await res.json()
      if (res.ok) { setStatus('ok'); setMsg('✅ You\'re subscribed! Great to have you.'); setEmail('') }
      else { setStatus('err'); setMsg(data.error || 'Something went wrong, please try again.') }
    } catch { setStatus('err'); setMsg('Connection error — please try again.') }
  }

  if (dark) return (
    <form onSubmit={submit}>
      {status === 'ok' ? (
        <div style={{ background:'rgba(255,255,255,0.15)', color:'#fff', padding:'10px 14px', borderRadius:4, fontSize:13, fontWeight:700, textAlign:'center' }}>{msg}</div>
      ) : (
        <>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
            style={{ width:'100%', padding:'9px 12px', border:'none', borderRadius:4, fontSize:13, marginBottom:6, fontFamily:'sans-serif', outline:'none' }} />
          {status==='err' && <p style={{ color:'#fca5a5', fontSize:11, marginBottom:4 }}>{msg}</p>}
          <button type="submit" disabled={status==='loading'}
            style={{ width:'100%', background:'#111', color:'#fff', border:'none', padding:'9px', fontWeight:800, fontSize:12, borderRadius:4, cursor:'pointer', letterSpacing:'0.05em', fontFamily:'sans-serif' }}>
            {status==='loading'?'SUBSCRIBING...':'GET FREE ACCESS →'}
          </button>
        </>
      )}
    </form>
  )

  // Light inline version (inside article)
  return (
    <div style={{ background:`linear-gradient(135deg,${p}12,${p}06)`, border:`1px solid ${p}25`, borderRadius:6, padding:'22px 24px', margin:'28px 0', fontFamily:'sans-serif' }}>
      <div style={{ fontWeight:900, fontSize:17, color:'#111', marginBottom:5 }}>📧 Get the Daily Briefing from {siteName}</div>
      <p style={{ fontSize:13, color:'#6b7280', marginBottom:14, lineHeight:1.6 }}>Our editors curate the most important stories every morning. Join 50,000+ professionals who start their day with {siteName}.</p>
      <form onSubmit={submit} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {status==='ok' ? (
          <div style={{ width:'100%', background:'#dcfce7', color:'#16a34a', padding:'10px 14px', borderRadius:4, fontSize:13, fontWeight:700 }}>{msg}</div>
        ) : (
          <>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
              style={{ flex:1, minWidth:200, padding:'10px 14px', border:'1px solid #e5e7eb', borderRadius:4, fontSize:13, fontFamily:'sans-serif', outline:'none' }} />
            <button type="submit" disabled={status==='loading'}
              style={{ background:p, color:'#fff', border:'none', padding:'10px 20px', borderRadius:4, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'sans-serif', whiteSpace:'nowrap' }}>
              {status==='loading'?'Subscribing...':'Subscribe Free →'}
            </button>
          </>
        )}
      </form>
      {status==='err' && <p style={{ color:'#ef4444', fontSize:12, marginTop:6 }}>{msg}</p>}
      <p style={{ fontSize:11, color:'#9ca3af', marginTop:8 }}>No spam. Unsubscribe any time.</p>
    </div>
  )
}
