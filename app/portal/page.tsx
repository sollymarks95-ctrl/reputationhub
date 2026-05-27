'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAIL = 'sollymarks95@gmail.com'
const ADMIN_PASS = 'Mini95!!'

export default function PortalLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your credentials.'); return }
    setLoading(true); setError('')

    const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL && password === ADMIN_PASS

    // Simulate auth delay
    await new Promise(r => setTimeout(r, 900))

    try {
      localStorage.setItem('rephuby_session', JSON.stringify({
        email: email.toLowerCase().trim(),
        name: isAdmin ? 'Solly' : email.split('@')[0],
        role: isAdmin ? 'superadmin' : 'client',
        client_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        logged_in_at: Date.now(),
      }))
    } catch {}

    router.push(isAdmin ? '/portal/admin' : '/portal/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0B0F19', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        input,button,select{font-family:'DM Sans',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .inp:focus{border-color:#0EA5E9!important;box-shadow:0 0 0 3px rgba(14,165,233,0.15)}
      `}</style>

      {/* BG effects */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 60% at 50% 0%,#0EA5E918,transparent),radial-gradient(ellipse 50% 50% at 80% 90%,#10B98110,transparent)' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'52px 52px', maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent)' }} />

      <div style={{ width:'100%', maxWidth:440, position:'relative', padding:'0 20px', animation:'fadeUp .4s ease' }}>
        {/* Card */}
        <div style={{ background:'linear-gradient(145deg,#141B2D,#1C2333)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:20, overflow:'hidden', boxShadow:'0 40px 120px rgba(0,0,0,0.7)' }}>
          {/* Top glow line */}
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,#0EA5E9,#10B981,transparent)' }} />

          <div style={{ padding:'40px 36px 36px' }}>
            {/* Logo */}
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <Link href="https://rephuby.com">
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:900, letterSpacing:'-0.03em' }}>
                  Rep<span style={{ background:'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Huby</span>
                </span>
              </Link>
              <div style={{ fontSize:11, color:'#475569', marginTop:3, letterSpacing:'0.08em', textTransform:'uppercase' }}>Client Intelligence Portal</div>
            </div>

            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:'#F1F5F9', textAlign:'center', marginBottom:6 }}>Welcome Back</h1>
            <p style={{ fontSize:13, color:'#475569', textAlign:'center', marginBottom:28 }}>Sign in to your brand authority dashboard</p>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#EF4444', marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>Email Address</label>
                <input
                  className="inp"
                  value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="you@yourbroker.com" required
                  style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, color:'#F1F5F9', fontSize:14, outline:'none', transition:'all .2s' }}
                />
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.06em', textTransform:'uppercase' }}>Password</label>
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ fontSize:11, color:'#0EA5E9', background:'none', border:'none', cursor:'pointer' }}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  className="inp"
                  value={password} onChange={e => setPassword(e.target.value)}
                  type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                  style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, color:'#F1F5F9', fontSize:14, outline:'none', transition:'all .2s' }}
                />
              </div>

              <button
                type="submit" disabled={loading}
                style={{ width:'100%', padding:'14px', background:loading?'#1e293b':'linear-gradient(135deg,#0EA5E9,#818CF8)', border:'none', borderRadius:8, color:'#fff', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .3s' }}
              >
                {loading
                  ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>Signing in...</>
                  : '→ Sign In to Portal'
                }
              </button>
            </form>

            <div style={{ marginTop:20, padding:'12px 14px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)', borderRadius:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#10B981', letterSpacing:'0.08em', marginBottom:4 }}>🔑 DEMO ACCESS</div>
              <div style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>Enter any email + password to preview the client portal. Use <strong style={{color:'#94A3B8'}}>sollymarks95@gmail.com</strong> for admin access.</div>
            </div>

            <div style={{ marginTop:20, textAlign:'center', fontSize:13, color:'#475569' }}>
              Not a client yet? {' '}
              <a href="https://t.me/rephub_intelligence" target="_blank" style={{ color:'#0EA5E9', fontWeight:600 }}>
                Talk to us on Telegram →
              </a>
            </div>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#334155' }}>
          <Link href="https://rephuby.com" style={{ color:'#475569' }}>← Back to rephuby.com</Link>
          <span style={{ margin:'0 12px', color:'#1e293b' }}>·</span>
          <Link href="https://rephuby.com/legal/privacy" style={{ color:'#475569' }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
