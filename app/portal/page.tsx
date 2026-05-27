'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PortalLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    // Demo login — any email/password works for demo
    if (email && password) {
      // Store demo session
      localStorage.setItem('portal_demo', JSON.stringify({ email, name: email.split('@')[0], client_id: 'a1b2c3d4-0000-0000-0000-000000000001' }))
      setTimeout(() => router.push('/portal/dashboard'), 800)
    } else {
      setError('Please enter your credentials.'); setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0B0F19', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        input{font-family:'DM Sans',sans-serif}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Background */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 60% at 50% 0%,#0EA5E918,transparent),radial-gradient(ellipse 40% 40% at 80% 80%,#10B98110,transparent)' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px', maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent)' }} />

      {/* Card */}
      <div style={{ background:'linear-gradient(135deg,#141B2D,#1C2333)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'48px 40px', width:'100%', maxWidth:440, position:'relative', boxShadow:'0 40px 100px rgba(0,0,0,0.6)' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,#0EA5E9,transparent)' }} />

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <Link href="/">
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:900, letterSpacing:'-0.03em', display:'inline-block' }}>
              Rep<span style={{ background:'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Hub</span>
            </div>
          </Link>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Client Intelligence Portal</div>
        </div>

        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:'#F1F5F9', marginBottom:8, textAlign:'center' }}>Welcome Back</h1>
        <p style={{ fontSize:14, color:'#64748b', textAlign:'center', marginBottom:32 }}>Sign in to your brand authority dashboard</p>

        {error && <div style={{ background:'#EF444415', border:'1px solid #EF4444', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#EF4444', marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#94A3B8', marginBottom:6, letterSpacing:'0.04em' }}>EMAIL ADDRESS</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ceo@yourbroker.com" required
              style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#F1F5F9', fontSize:14, outline:'none' }} />
          </div>
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#94A3B8', letterSpacing:'0.04em' }}>PASSWORD</label>
              <span style={{ fontSize:12, color:'#0EA5E9', cursor:'pointer' }}>Forgot password?</span>
            </div>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required
              style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#F1F5F9', fontSize:14, outline:'none' }} />
          </div>

          <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#0EA5E9,#818CF8)', border:'none', borderRadius:8, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></div> Signing in...</> : 'Sign In to Portal →'}
          </button>
        </form>

        <div style={{ marginTop:24, padding:'14px 16px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#10B981', marginBottom:4, letterSpacing:'0.06em' }}>DEMO ACCESS</div>
          <div style={{ fontSize:12, color:'#64748b' }}>Enter any email + password to preview the client portal with demo data.</div>
        </div>

        <div style={{ marginTop:24, textAlign:'center', fontSize:13, color:'#475569' }}>
          Not a client yet?{' '}
          <a href="https://t.me/rephub_intelligence" target="_blank" style={{ color:'#0EA5E9', fontWeight:600 }}>Contact us on Telegram →</a>
        </div>
      </div>
    </div>
  )
}
