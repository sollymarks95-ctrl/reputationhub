import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function AssociationSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const [articles] = await Promise.all([getLatestArticles(site.id, 8)])
  const { data: clients } = await supabase.from('clients').select('*').limit(12)
  const members = clients || []
  const p = site.primary_color || '#1a3c6e'
  const gold = '#c5952a'

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'"Merriweather",Georgia,serif', color:'#1a1a2e' }}>
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}`}</style>

      {/* TOP */}
      <div style={{ background:p, padding:'6px 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,.7)', fontFamily:'"Open Sans",Arial,sans-serif', letterSpacing:'0.04em' }}>
          <span>THE OFFICIAL TRADE CERTIFICATION BODY · EST. 2018</span>
          <div style={{ display:'flex', gap:20 }}>
            {['Member Login','Apply Now','Contact'].map(i => <a key={i} href='javascript:void(0)' style={{ color:'rgba(255,255,255,.8)' }}>{i}</a>)}
          </div>
        </div>
      </div>

      <header style={{ background:'#fff', borderBottom:`4px solid ${gold}`, padding:'16px 0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg,${p},${p}bb)`, border:`3px solid ${gold}`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'serif', fontWeight:900, fontSize:24 }}>
              {site.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
            </div>
            <div>
              <div style={{ fontFamily:'"Merriweather",Georgia,serif', fontWeight:900, fontSize:20, color:p, lineHeight:1.2 }}>{site.name.toUpperCase()}</div>
              <div style={{ fontSize:11, color:gold, fontFamily:'"Open Sans",sans-serif', letterSpacing:'0.1em', marginTop:2 }}>{site.tagline?.toUpperCase() || 'CERTIFIED · VERIFIED · TRUSTED'}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ background:gold, color:'#fff', border:'none', padding:'10px 20px', fontFamily:'"Open Sans",sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>APPLY FOR MEMBERSHIP</button>
            <button style={{ background:'transparent', color:p, border:`2px solid ${p}`, padding:'10px 20px', fontFamily:'"Open Sans",sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>VERIFY A MEMBER</button>
          </div>
        </div>
        <nav style={{ borderTop:`1px solid #e0e8f0`, marginTop:14 }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', display:'flex', gap:0 }}>
            {['Home','Member Directory','Certification','Standards','Resources','About Us'].map((c,i) => (
              <a key={c} href='javascript:void(0)' style={{ padding:'10px 18px', fontSize:13, fontWeight:700, fontFamily:'"Open Sans",sans-serif', color:i===0?p:'#555', borderBottom:i===0?`3px solid ${gold}`:'3px solid transparent', marginBottom:-1 }}>{c}</a>
            ))}
          </div>
        </nav>
      </header>

      {/* HERO BANNER */}
      <div style={{ background:`linear-gradient(135deg,${p} 0%,#2c5282 100%)`, padding:'48px 24px', textAlign:'center' }}>
        <div style={{ display:'inline-block', background:gold, color:'#fff', padding:'4px 16px', fontSize:11, fontFamily:'"Open Sans",sans-serif', fontWeight:700, letterSpacing:'0.15em', marginBottom:16 }}>
          OFFICIAL CERTIFICATION BODY
        </div>
        <h1 style={{ fontFamily:'"Merriweather",serif', fontWeight:900, fontSize:40, color:'#fff', marginBottom:12, lineHeight:1.2 }}>
          The Global Standard for Trade Certification
        </h1>
        <p style={{ color:'rgba(255,255,255,.8)', fontSize:16, marginBottom:28, fontFamily:'"Open Sans",sans-serif' }}>
          {site.description}
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:40 }}>
          {[['1,200+','Certified Members'],['50+','Countries'],['ISO 9001','Accredited'],['Since 2018','Established']].map(([n,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:900, color:gold }}>{n}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', fontFamily:'"Open Sans",sans-serif', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <main style={{ maxWidth:1200, margin:'0 auto', padding:'40px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:40 }}>
          {[
            {icon:'🏆', title:'Certification Program', desc:'Full accreditation for qualifying global trade companies. ISO-aligned standards.'},
            {icon:'🔍', title:'Verify a Member', desc:'Instantly verify any certified member using our live verification system.'},
            {icon:'📋', title:'Member Directory', desc:'Browse our complete directory of certified and verified global trade members.'},
          ].map(({icon,title,desc}) => (
            <div key={title} style={{ background:'#fff', border:`1px solid #e0e8f0`, borderTop:`3px solid ${gold}`, padding:24 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>{icon}</div>
              <h3 style={{ fontFamily:'"Merriweather",serif', fontWeight:700, fontSize:17, color:p, marginBottom:8 }}>{title}</h3>
              <p style={{ fontFamily:'"Open Sans",sans-serif', fontSize:13, color:'#555', lineHeight:1.7 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Member directory */}
        <div style={{ background:'#fff', border:'1px solid #e0e8f0', marginBottom:32 }}>
          <div style={{ background:p, color:'#fff', padding:'14px 20px', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontFamily:'"Open Sans",sans-serif', fontWeight:700, fontSize:15 }}>CERTIFIED MEMBER DIRECTORY</span>
            <span style={{ fontFamily:'"Open Sans",sans-serif', fontSize:13, opacity:.8 }}>{members.length || '1,200+'} Active Members</span>
          </div>
          <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {(members.length > 0 ? members : Array.from({length:6}).map((_,i)=>({id:i,company_name:['Alpha Trade Corp','Global Imports Ltd','TechTrade Inc','Nexus Commerce','Prime Distributors','Euro Trade'][i],country:['UAE','UK','USA','Germany','France','Singapore'][i],industry:'Trading'}))).slice(0,9).map((m:any,i:number) => (
              <div key={i} style={{ border:'1px solid #e0e8f0', padding:14, display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:`${p}15`, border:`1px solid ${gold}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:p, flexShrink:0 }}>
                  {m.company_name?.charAt(0)||'?'}
                </div>
                <div>
                  <div style={{ fontFamily:'"Open Sans",sans-serif', fontWeight:700, fontSize:13 }}>{m.company_name}</div>
                  <div style={{ fontFamily:'"Open Sans",sans-serif', fontSize:11, color:'#888' }}>✓ Certified · {m.country||'Global'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* News */}
        {articles.length > 0 && (
          <div>
            <h2 style={{ fontFamily:'"Merriweather",serif', fontWeight:900, fontSize:22, color:p, marginBottom:20, paddingBottom:10, borderBottom:`3px solid ${gold}` }}>Association News & Updates</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
              {articles.slice(0,4).map((a:any,i:number) => (
                <div key={i} style={{ background:'#fff', border:'1px solid #e0e8f0', padding:20, display:'flex', gap:14 }}>
                  {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width:80,height:60,objectFit:'cover',flexShrink:0 }} />}
                  <div>
                    <div style={{ fontFamily:'"Open Sans",sans-serif', fontSize:10, color:gold, fontWeight:700, marginBottom:4 }}>{a.category?.toUpperCase()||'NEWS'}</div>
                    <div style={{ fontFamily:'"Merriweather",serif', fontWeight:700, fontSize:14, lineHeight:1.3, marginBottom:4 }}>{a.title}</div>
                    <div style={{ fontFamily:'"Open Sans",sans-serif', fontSize:11, color:'#888' }}>{a.published_at?timeAgo(a.published_at):''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ background:p, color:'rgba(255,255,255,.7)', padding:'40px 24px 20px', marginTop:40 }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:32 }}>
            <div>
              <div style={{ color:gold, fontFamily:'"Merriweather",serif', fontWeight:900, fontSize:18, marginBottom:10 }}>{site.name}</div>
              <p style={{ fontSize:12, lineHeight:1.8, marginBottom:14 }}>{site.description}</p>
              <div style={{ fontFamily:'"Open Sans",sans-serif', fontSize:12 }}>
                <div style={{ marginBottom:4 }}>📍 71-75 Shelton Street, London WC2H 9JQ</div>
                <div style={{ marginBottom:4 }}>✉️ info@globaltradeassoc.org</div>
                <div>📞 +44 20 7946 0958</div>
              </div>
            </div>
            {[['Quick Links',['Member Directory','Apply for Membership','Verify a Member','Standards & Criteria','Contact Us']],['Legal',['Terms of Use','Privacy Policy','Cookie Policy','Accreditation Policy','Complaints Procedure']],['Social',['Twitter / X','LinkedIn','Facebook','Newsletter','RSS Feed']]].map(([t,ls]:any) => (
              <div key={t}>
                <div style={{ color:gold, fontFamily:'"Open Sans",sans-serif', fontWeight:700, fontSize:12, letterSpacing:'0.1em', marginBottom:12 }}>{t.toUpperCase()}</div>
                {ls.map((l:string) => <a key={l} href='javascript:void(0)' style={{ display:'block', fontSize:12, color:'rgba(255,255,255,.6)', marginBottom:6 }}>{l}</a>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop:`1px solid rgba(255,255,255,.15)`, paddingTop:16, fontFamily:'"Open Sans",sans-serif', fontSize:11, display:'flex', justifyContent:'space-between' }}>
            <span>© {new Date().getFullYear()} {site.name} · RepHub Media Ltd · Registered in England & Wales · Company No. 12345678 · VAT: GB 987654321</span>
            <span>Terms · Privacy · Accreditation</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
