import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function InvestDB({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const [articles] = await Promise.all([getLatestArticles(site.id, 10)])
  const { data: clients } = await supabase.from('clients').select('*').eq('status','active').limit(12)
  const companies = clients || []
  const p = site.primary_color || '#146aff'
  const cats = site.categories || ['All', 'Trading', 'Technology', 'Finance', 'Manufacturing']

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7fa', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color:'#1d1d1f' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.card:hover{box-shadow:0 8px 30px rgba(0,0,0,.12);transform:translateY(-2px)}`}</style>

      {/* HEADER */}
      <header style={{ background:'#fff', borderBottom:'1px solid #e8e8ed', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', gap:32 }}>
          <div style={{ fontWeight:800, fontSize:22, color:p, letterSpacing:'-0.5px' }}>{site.name}</div>
          <nav style={{ display:'flex', gap:0, flex:1 }}>
            {cats.slice(0,6).map((c:string,i:number) => (
              <a key={c} href="#" style={{ padding:'20px 14px', fontSize:13, fontWeight:600, color:i===0?p:'#555', borderBottom:i===0?`2px solid ${p}`:'2px solid transparent', marginBottom:-1 }}>{c}</a>
            ))}
          </nav>
          <div style={{ display:'flex', gap:8 }}>
            <input placeholder="Search companies..." style={{ border:'1px solid #d1d1d6', borderRadius:20, padding:'7px 16px', fontSize:13, width:220, outline:'none' }} />
            <button style={{ background:p, color:'#fff', border:'none', borderRadius:20, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Search</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1280, margin:'0 auto', padding:'32px 24px' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
          {[['12,000+','Companies Tracked'],['$2.4T','Total Market Cap'],['50+','Countries'],['Real-Time','Data Updates']].map(([n,l]) => (
            <div key={l} style={{ background:'#fff', border:'1px solid #e8e8ed', borderRadius:12, padding:'20px 24px' }}>
              <div style={{ fontSize:28, fontWeight:900, color:p, letterSpacing:'-1px' }}>{n}</div>
              <div style={{ fontSize:13, color:'#888', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24 }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontSize:20, fontWeight:800 }}>Company Profiles</h2>
              <span style={{ fontSize:13, color:'#888' }}>{companies.length > 0 ? `${companies.length} companies` : 'Growing database'}</span>
            </div>
            {companies.length === 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
                {Array.from({length:6}).map((_,i) => (
                  <div key={i} className="card" style={{ background:'#fff', border:'1px solid #e8e8ed', borderRadius:12, padding:20, transition:'all .2s', cursor:'pointer' }}>
                    <div style={{ display:'flex', gap:14, marginBottom:14 }}>
                      <div style={{ width:48, height:48, borderRadius:10, background:`${p}15`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:20, color:p }}>
                        {['A','B','C','D','E','F'][i]}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>Company {String.fromCharCode(65+i)}</div>
                        <div style={{ fontSize:12, color:'#888' }}>Global · Trading</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      {['Verified','Active'].map(tag => <span key={tag} style={{ fontSize:10, background:`${p}10`, color:p, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{tag}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
                {companies.map((c:any,i:number) => (
                  <div key={i} className="card" style={{ background:'#fff', border:'1px solid #e8e8ed', borderRadius:12, padding:20, transition:'all .2s', cursor:'pointer' }}>
                    <div style={{ display:'flex', gap:14, marginBottom:12 }}>
                      <div style={{ width:44, height:44, borderRadius:10, background:`${p}15`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:p }}>
                        {c.company_name?.charAt(0)||'?'}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{c.company_name}</div>
                        <div style={{ fontSize:11, color:'#888' }}>{c.country||'Global'} · {c.industry||'Business'}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, background:`${p}10`, color:p, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>✓ Verified</span>
                      <span style={{ fontSize:10, background:'rgba(16,185,129,.1)', color:'#10b981', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>Active</span>
                      {c.plan === 'premium' && <span style={{ fontSize:10, background:'rgba(245,158,11,.1)', color:'#f59e0b', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>Premium</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* News feed */}
            {articles.length > 0 && (
              <div style={{ marginTop:32 }}>
                <h2 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Intelligence Feed</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {articles.map((a:any,i:number) => (
                    <div key={i} style={{ background:'#fff', border:'1px solid #e8e8ed', borderRadius:12, padding:16, display:'flex', gap:14, cursor:'pointer' }}>
                      {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width:80, height:56, objectFit:'cover', borderRadius:8, flexShrink:0 }} />}
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:p, fontWeight:700, marginBottom:4 }}>{a.category?.toUpperCase()}</div>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:4, lineHeight:1.3 }}>{a.title}</div>
                        <div style={{ fontSize:11, color:'#888' }}>{a.published_at ? timeAgo(a.published_at) : ''} · {a.read_time_minutes} min</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background:'#fff', border:'1px solid #e8e8ed', borderRadius:12, padding:20, marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14, paddingBottom:10, borderBottom:`2px solid ${p}` }}>About {site.name}</div>
              <p style={{ fontSize:13, color:'#555', lineHeight:1.7 }}>{site.description}</p>
            </div>
            <div style={{ background:p, borderRadius:12, padding:20, color:'#fff' }}>
              <div style={{ fontWeight:800, fontSize:16, marginBottom:8 }}>Track Any Company</div>
              <p style={{ fontSize:13, opacity:.85, marginBottom:16, lineHeight:1.5 }}>Get real-time alerts, funding updates and market intelligence.</p>
              <input placeholder="Enter email" style={{ width:'100%', background:'rgba(255,255,255,.2)', border:'1px solid rgba(255,255,255,.3)', borderRadius:8, padding:'10px 14px', color:'#fff', fontSize:13, marginBottom:10, outline:'none' }} />
              <button style={{ width:'100%', background:'#fff', color:p, border:'none', borderRadius:8, padding:10, fontWeight:800, fontSize:13, cursor:'pointer' }}>GET STARTED FREE →</button>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ background:'#1d1d1f', color:'#888', padding:'40px 24px 20px', marginTop:40 }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:32, marginBottom:28 }}>
            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:18, marginBottom:10 }}>{site.name}</div>
              <p style={{ fontSize:12, lineHeight:1.7 }}>{site.description}</p>
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                {['𝕏','in','f','✈'].map((ic,i) => <a key={i} href="#" style={{ width:30, height:30, borderRadius:8, background:'#333', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11 }}>{ic}</a>)}
              </div>
            </div>
            {[['Data',['Company Profiles','Market Data','Funding Rounds','API Access']],['Legal',['Terms','Privacy','Data Policy','Cookies']],['Company',['About','Careers','Contact','Press']]].map(([t,ls]:any) => (
              <div key={t}><div style={{ fontSize:10, fontWeight:800, color:'#fff', marginBottom:12, letterSpacing:'0.1em' }}>{t.toUpperCase()}</div>{ls.map((l:string) => <a key={l} href="#" style={{ display:'block', fontSize:12, color:'#666', marginBottom:6 }}>{l}</a>)}</div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid #333', paddingTop:16, fontSize:11, color:'#555', display:'flex', justifyContent:'space-between' }}>
            <span>© {new Date().getFullYear()} {site.name} · RepHub Media Ltd · London, UK · All data provided for informational purposes only</span>
            <span>Terms · Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
