import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function ExecutiveNetwork({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const [articles] = await Promise.all([getLatestArticles(site.id, 10)])
  const { data: clients } = await supabase.from('clients').select('*').limit(8)
  const members = clients || []
  const p = site.primary_color || '#0a66c2'
  const cats = site.categories || ['All','Finance','Technology','Operations','Strategy','Markets']

  return (
    <div style={{ minHeight:'100vh', background:'#f3f2ef', fontFamily:'"Segoe UI",Arial,sans-serif', color:'#000' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.card:hover{box-shadow:0 4px 12px rgba(0,0,0,.15)}`}</style>
      <header style={{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,.15)', position:'sticky', top:0, zIndex:100, padding:'0 24px' }}>
        <div style={{ maxWidth:1128, margin:'0 auto', height:52, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontWeight:900, fontSize:26, color:p, letterSpacing:'-1px', fontFamily:'"Arial Black",sans-serif' }}>{site.name.split(' ').map((w:string)=>w[0]).join('')}</div>
          <div style={{ flex:1, maxWidth:300 }}>
            <input placeholder="Search" style={{ width:'100%', background:'#eef3f8', border:'none', borderRadius:4, padding:'8px 12px', fontSize:14, outline:'none' }} />
          </div>
          <nav style={{ display:'flex', gap:0, marginLeft:16 }}>
            {['Home','Network','Intelligence','Articles','Events'].map((c,i) => (
              <a key={c} href="#" style={{ padding:'14px 12px', fontSize:12, fontWeight:600, color:i===0?p:'rgba(0,0,0,.6)', borderBottom:i===0?`2px solid ${p}`:'2px solid transparent', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <span style={{ fontSize:18 }}>{['🏠','👥','📊','✍️','📅'][i]}</span>
                {c}
              </a>
            ))}
          </nav>
          <button style={{ background:p, color:'#fff', border:'none', borderRadius:24, padding:'8px 20px', fontWeight:700, fontSize:14, cursor:'pointer', marginLeft:8 }}>Join Free</button>
        </div>
      </header>

      <main style={{ maxWidth:1128, margin:'0 auto', padding:'24px', display:'grid', gridTemplateColumns:'226px 1fr 300px', gap:24 }}>
        {/* Left sidebar */}
        <div>
          <div className="card" style={{ background:'#fff', border:'1px solid rgba(0,0,0,.15)', borderRadius:8, overflow:'hidden', transition:'box-shadow .2s', marginBottom:12 }}>
            <div style={{ height:56, background:`linear-gradient(${p},${p}99)` }} />
            <div style={{ padding:'0 16px 16px', textAlign:'center', marginTop:-28 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:p, border:'2px solid #fff', margin:'0 auto 8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:22 }}>E</div>
              <div style={{ fontWeight:700, fontSize:15 }}>Executive Profile</div>
              <div style={{ fontSize:12, color:'rgba(0,0,0,.6)', marginTop:2 }}>Professional Member</div>
              <div style={{ borderTop:'1px solid rgba(0,0,0,.1)', marginTop:12, paddingTop:12, fontSize:12, color:p, fontWeight:700, textAlign:'left' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:'rgba(0,0,0,.6)' }}>Network Views</span><span>248</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'rgba(0,0,0,.6)' }}>Connections</span><span>500+</span>
                </div>
              </div>
            </div>
          </div>
          {cats.slice(1).map((c:string) => <a key={c} href="#" style={{ display:'block', padding:'10px 12px', fontSize:13, color:'rgba(0,0,0,.7)', background:'#fff', borderBottom:'1px solid #f0f0f0', fontWeight:600 }}>{c}</a>)}
        </div>

        {/* Feed */}
        <div>
          {articles.length === 0 ? (
            <div className="card" style={{ background:'#fff', border:'1px solid rgba(0,0,0,.15)', borderRadius:8, padding:'60px 0', textAlign:'center', color:'#888', transition:'box-shadow .2s' }}>Content auto-generating...</div>
          ) : articles.map((a:any,i:number) => (
            <div key={i} className="card" style={{ background:'#fff', border:'1px solid rgba(0,0,0,.15)', borderRadius:8, padding:16, marginBottom:12, transition:'box-shadow .2s' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:p, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>E</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{a.author_name || 'Editorial Team'}</div>
                  <div style={{ fontSize:11, color:'rgba(0,0,0,.6)' }}>{a.category} · {a.published_at ? timeAgo(a.published_at) : 'Now'}</div>
                </div>
              </div>
              {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width:'100%', maxHeight:240, objectFit:'cover', borderRadius:4, marginBottom:10, display:'block' }} />}
              <div style={{ fontWeight:700, fontSize:16, marginBottom:6, lineHeight:1.3 }}>{a.title}</div>
              <p style={{ fontSize:14, color:'rgba(0,0,0,.7)', lineHeight:1.5 }}>{a.excerpt?.slice(0,150)}...</p>
              <div style={{ borderTop:'1px solid rgba(0,0,0,.1)', marginTop:12, paddingTop:10, display:'flex', gap:16 }}>
                {['👍 Like','💬 Comment','↗ Share','📤 Send'].map(action => (
                  <button key={action} style={{ background:'none', border:'none', fontSize:13, color:'rgba(0,0,0,.6)', fontWeight:600, cursor:'pointer', padding:'4px 8px' }}>{action}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right sidebar */}
        <div>
          <div className="card" style={{ background:'#fff', border:'1px solid rgba(0,0,0,.15)', borderRadius:8, padding:16, marginBottom:16, transition:'box-shadow .2s' }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Add to your network</div>
            {(members.length > 0 ? members : Array.from({length:4}).map((_,i)=>({id:i,company_name:['Alpha Corp','Global Ltd','TechTrade','Nexus'][i],country:'Global'}))).slice(0,4).map((m:any,i:number) => (
              <div key={i} style={{ display:'flex', gap:10, marginBottom:12, alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:p, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, flexShrink:0 }}>{m.company_name?.charAt(0)||'?'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{m.company_name}</div>
                  <div style={{ fontSize:11, color:'rgba(0,0,0,.6)' }}>{m.country || 'Global'}</div>
                </div>
                <button style={{ border:`1px solid ${p}`, background:'transparent', color:p, borderRadius:20, padding:'4px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>Connect</button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ background:'rgba(0,0,0,.85)', color:'rgba(255,255,255,.5)', padding:'24px', marginTop:20, textAlign:'center' }}>
        <div style={{ maxWidth:1128, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:10, flexWrap:'wrap' }}>
            {['About','Accessibility','Help Center','Privacy & Terms','Ad Choices','Advertising','Business Services','Get the app'].map(l => <a key={l} href="#" style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>{l}</a>)}
          </div>
          <div style={{ fontSize:11 }}>© {new Date().getFullYear()} {site.name} · RepHub Media Ltd · London, UK</div>
        </div>
      </footer>
    </div>
  )
}
