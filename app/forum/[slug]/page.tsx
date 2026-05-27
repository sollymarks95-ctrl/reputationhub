import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'

export default async function ForumSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const articles = await getLatestArticles(site.id, 20)
  const p = site.primary_color || '#e74c3c'
  const cats = site.categories || ['All','Trading','Markets','Analysis','News','Community']
  const votes = [234,189,156,142,98,87,76,65,54,43,32,28,21,18,15,12,10,8,7,5]

  return (
    <div style={{ minHeight:'100vh', background:'#dae0e6', fontFamily:'Verdana,sans-serif', color:'#1c1c1c' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.post:hover{border-color:#898989!important}`}</style>
      <header style={{ background:'#fff', borderBottom:'1px solid #edeff1', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px', height:48, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <div style={{ background:p, width:32, height:32, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'#fff', fontSize:16 }}>⬆</div>
            <span style={{ fontWeight:800, fontSize:18, color:'#1c1c1c' }}>{site.name}</span>
          </div>
          <div style={{ flex:1, maxWidth:600 }}>
            <input placeholder={`Search ${site.name}...`} style={{ width:'100%', border:'1px solid #edeff1', borderRadius:20, padding:'7px 16px', fontSize:14, background:'#f6f7f8', outline:'none' }} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ background:p, color:'#fff', border:'none', borderRadius:20, padding:'6px 16px', fontWeight:700, fontSize:13, cursor:'pointer' }}>Post</button>
            <button style={{ background:'transparent', color:p, border:`1px solid ${p}`, borderRadius:20, padding:'6px 16px', fontWeight:700, fontSize:13, cursor:'pointer' }}>Log In</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'1fr 312px', gap:20 }}>
        <div>
          {/* Category tabs */}
          <div style={{ background:'#fff', border:'1px solid #edeff1', borderRadius:4, padding:'8px 12px', marginBottom:12, display:'flex', gap:4 }}>
            {cats.map((c:string,i:number) => (
              <button key={c} style={{ padding:'6px 12px', borderRadius:20, border:'none', background:i===0?p:'transparent', color:i===0?'#fff':'#555', fontWeight:i===0?700:400, fontSize:13, cursor:'pointer' }}>{c}</button>
            ))}
          </div>
          {articles.length === 0 ? (
            <div style={{ background:'#fff', border:'1px solid #edeff1', borderRadius:4, padding:'60px 0', textAlign:'center', color:'#888', fontSize:14 }}>
              Content auto-generating — check back soon!
            </div>
          ) : articles.map((a:any, i:number) => (
            <div key={i} className="post" style={{ background:'#fff', border:'1px solid #ccc', borderRadius:4, marginBottom:8, display:'flex', transition:'border-color .15s' }}>
              {/* Vote column */}
              <div style={{ width:40, background:'#f8f9fa', display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 4px', gap:2, borderRadius:'4px 0 0 4px' }}>
                <div style={{ color:p, fontSize:16, cursor:'pointer', fontWeight:700 }}>▲</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#1c1c1c' }}>{votes[i]||Math.floor(Math.random()*200)}</div>
                <div style={{ color:'#888', fontSize:16, cursor:'pointer' }}>▼</div>
              </div>
              {/* Content */}
              <div style={{ flex:1, padding:'8px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:p, display:'inline-block' }} />
                  <span style={{ fontSize:12, color:'#555' }}>t/{a.category?.toLowerCase().replace(/\s/g,'_') || 'trade'}</span>
                  <span style={{ fontSize:12, color:'#888' }}>· Posted by u/market_watcher · {a.published_at ? timeAgo(a.published_at) : 'Now'}</span>
                </div>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:6, lineHeight:1.3 }}>{a.title}</div>
                {a.excerpt && <p style={{ fontSize:13, color:'#3c3c3c', lineHeight:1.5, marginBottom:8 }}>{a.excerpt?.slice(0,140)}...</p>}
                <div style={{ display:'flex', gap:12 }}>
                  {[['💬', `${Math.floor(Math.random()*80)+5} Comments`], ['🔗', 'Share'], ['💾', 'Save'], ['⚑', 'Report']].map(([icon, label]) => (
                    <button key={String(label)} style={{ background:'none', border:'none', fontSize:11, color:'#888', fontWeight:700, cursor:'pointer', padding:'4px 6px', borderRadius:2, display:'flex', alignItems:'center', gap:3 }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width:80, height:70, objectFit:'cover', borderRadius:'0 4px 4px 0', flexShrink:0, alignSelf:'center', margin:'0 8px 0 0' }} />}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background:`linear-gradient(${p},${p}dd)`, borderRadius:4, padding:12, marginBottom:12, color:'#fff' }}>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>Welcome to {site.name}</div>
            <p style={{ fontSize:12, opacity:.9, lineHeight:1.5, marginBottom:10 }}>{site.description}</p>
            <div style={{ display:'flex', gap:8 }}>
              <button style={{ flex:1, background:'#fff', color:p, border:'none', borderRadius:20, padding:'8px', fontWeight:700, fontSize:12, cursor:'pointer' }}>Join Community</button>
              <button style={{ flex:1, background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,.5)', borderRadius:20, padding:'8px', fontWeight:700, fontSize:12, cursor:'pointer' }}>Create Post</button>
            </div>
          </div>
          <div style={{ background:'#fff', border:'1px solid #edeff1', borderRadius:4, padding:12 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10, paddingBottom:8, borderBottom:'1px solid #edeff1' }}>COMMUNITY STATS</div>
            {[['Members','12.4K'],['Online Now','342'],['Posts Today','89'],['Topics',cats.length.toString()]].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                <span style={{ color:'#555' }}>{k}</span>
                <span style={{ fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={{ background:'#1a1a1a', color:'#666', padding:'24px', marginTop:20, textAlign:'center' }}>
        <div style={{ fontSize:11, marginBottom:8 }}>{site.name} · Community Guidelines · Privacy Policy · Terms of Service · Content Policy</div>
        <div style={{ fontSize:11 }}>© {new Date().getFullYear()} {site.name} · RepHub Media Ltd · London, UK · All posts are user/AI generated for informational purposes</div>
      </footer>
    </div>
  )
}
