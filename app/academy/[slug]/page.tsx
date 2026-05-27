import { getNewsSite } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const ROUTE_MAP: Record<string,string> = {
  'global-trade-wire':'news','finance-terminal':'finance','gold-markets-today':'commodities',
  'business-pulse':'magazine','trust-score':'reviews-hub','company-pedia':'wiki',
  'press-central':'pressroom','invest-data':'investdb','trade-board':'forum',
  'global-trade-assoc':'association','executive-network':'executive','market-radar':'market-radar',
}

const COURSES = [
  { icon:'📊', title:'Technical Analysis Fundamentals', level:'Beginner', lessons:12, coming:true },
  { icon:'💱', title:'Forex Trading Masterclass', level:'Intermediate', lessons:18, coming:true },
  { icon:'🛢️', title:'Commodity Markets Deep Dive', level:'Intermediate', lessons:15, coming:true },
  { icon:'📈', title:'Portfolio Risk Management', level:'Advanced', lessons:10, coming:true },
  { icon:'🏭', title:'Trade Finance Essentials', level:'Beginner', lessons:14, coming:true },
  { icon:'🤖', title:'Algorithmic Trading Basics', level:'Advanced', lessons:20, coming:true },
  { icon:'🌍', title:'Global Macro Investing', level:'Intermediate', lessons:16, coming:true },
  { icon:'⚡', title:'Energy Markets & Trading', level:'Intermediate', lessons:12, coming:true },
]

export default async function AcademyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site) notFound()
  const p = site.primary_color || '#c0392b'
  const route = ROUTE_MAP[slug] || 'news'

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', fontFamily:'sans-serif' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}`}</style>

      <header style={{ background:'#fff', borderBottom:`3px solid ${p}`, padding:'0 24px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <Link href={`/${route}/${slug}`}><div style={{ fontWeight:900, fontSize:24, color:p }}>{site.name}</div></Link>
        <div style={{ display:'flex', gap:16, alignItems:'center', fontSize:13, color:'#6b7280' }}>
          <Link href={`/${route}/${slug}`}><span style={{ cursor:'pointer' }}>News</span></Link>
          <Link href={`/charts/${slug}`}><span style={{ cursor:'pointer' }}>Charts</span></Link>
          <span style={{ color:p, fontWeight:700 }}>Academy</span>
        </div>
      </header>

      {/* HERO */}
      <div style={{ background:`linear-gradient(135deg,${p},#1e293b)`, color:'#fff', padding:'64px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
          <h1 style={{ fontSize:42, fontWeight:900, marginBottom:16, lineHeight:1.15 }}>{site.name} Academy</h1>
          <p style={{ fontSize:18, opacity:0.85, lineHeight:1.7, marginBottom:28 }}>
            Professional courses on trading, investing, commodity markets, and global finance — built by industry practitioners for serious learners.
          </p>
          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'12px 32px', fontSize:15, fontWeight:700 }}>
              🚀 Launching Q3 2025
            </div>
            <p style={{ fontSize:12, opacity:0.6 }}>Sign up to be notified when courses go live</p>
          </div>
        </div>
      </div>

      {/* NOTIFY FORM */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'32px 24px' }}>
        <div style={{ maxWidth:480, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Get early access</h2>
          <p style={{ fontSize:14, color:'#6b7280', marginBottom:20 }}>Be first to know when Academy launches. Free access for early subscribers.</p>
          <form action="/api/newsletter" method="POST" style={{ display:'flex', gap:8 }}>
            <input name="email" type="email" placeholder="your@email.com" required
              style={{ flex:1, padding:'11px 14px', border:'1px solid #e5e7eb', borderRadius:5, fontSize:14, outline:'none', fontFamily:'sans-serif' }} />
            <input type="hidden" name="siteName" value={`${site.name} Academy`} />
            <button type="submit" style={{ background:p, color:'#fff', border:'none', borderRadius:5, padding:'11px 20px', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'sans-serif', whiteSpace:'nowrap' }}>
              Notify Me →
            </button>
          </form>
        </div>
      </div>

      {/* COURSES PREVIEW */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 24px' }}>
        <h2 style={{ fontSize:24, fontWeight:900, marginBottom:8, textAlign:'center' }}>Upcoming Courses</h2>
        <p style={{ fontSize:14, color:'#6b7280', textAlign:'center', marginBottom:32 }}>World-class curriculum built by practitioners with decades of market experience.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {COURSES.map((c,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:8, border:'1px solid #e5e7eb', padding:20, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:12, right:12, background:'#f3f4f6', color:'#6b7280', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>COMING SOON</div>
              <div style={{ fontSize:32, marginBottom:12 }}>{c.icon}</div>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#111', marginBottom:6, lineHeight:1.3 }}>{c.title}</h3>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <span style={{ background:`${p}15`, color:p, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{c.level}</span>
                <span style={{ background:'#f3f4f6', color:'#6b7280', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600 }}>{c.lessons} lessons</span>
              </div>
              <div style={{ width:'100%', height:4, background:'#f3f4f6', borderRadius:2 }}>
                <div style={{ width:'0%', height:4, background:p, borderRadius:2 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background:'#0f172a', color:'#64748b', padding:'24px', textAlign:'center', marginTop:40 }}>
        <Link href={`/${route}/${slug}`}><div style={{ fontWeight:900, fontSize:18, color:'#fff', marginBottom:6 }}>{site.name}</div></Link>
        <p style={{ fontSize:12 }}>Academy · Professional Financial Education · Launching Q3 2025</p>
      </footer>
    </div>
  )
}
