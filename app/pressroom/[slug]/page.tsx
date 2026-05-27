import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PressRoom({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const articles = await getLatestArticles(site.id, 16)
  const p = site.primary_color || '#003087'
  const cats = site.categories || ['Press Releases', 'Announcements', 'Corporate', 'Markets']

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Arial, sans-serif', color: '#000' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.row:hover{background:#f5f5f5}`}</style>

      {/* HEADER */}
      <header>
        <div style={{ background: p, padding: '12px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px' }}>{site.name.toUpperCase()}</div>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Submit PR', 'Browse', 'Subscribe', 'Login'].map(i => (
                <a key={i} href="#" style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: 600 }}>{i}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd', padding: '0 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
            {['All News', ...cats.slice(0,5)].map((c,i) => (
              <a key={c} href="#" style={{ padding: '10px 16px', fontSize: 13, fontWeight: i===0?700:400, color: i===0?p:'#333', borderBottom: i===0?`3px solid ${p}`:'3px solid transparent', marginBottom: -2 }}>
                {c}
              </a>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #000' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Latest Press Releases</h2>
              <div style={{ fontSize: 12, color: '#666' }}>Updated: {new Date().toLocaleTimeString()}</div>
            </div>
            {articles.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#888' }}>Auto-generating press releases — check back soon.</div>
            ) : articles.map((a: any, i: number) => (
              <div key={i} className="row" style={{ display: 'flex', gap: 16, padding: '14px 8px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                <div style={{ width: 3, background: i<3?p:'#ddd', flexShrink: 0, borderRadius: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, background: `${p}15`, color: p, padding: '2px 8px', fontWeight: 700 }}>{a.category || 'ANNOUNCEMENT'}</span>
                    <span style={{ fontSize: 10, color: '#888' }}>{a.published_at ? new Date(a.published_at).toLocaleDateString('en-GB') : 'Today'}</span>
                    <span style={{ fontSize: 10, color: '#888' }}>{a.read_time_minutes} min read</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#000' }}>{a.title}</div>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{a.excerpt?.slice(0,120)}...</p>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>Source: {a.author_name || 'Corporate'} · {a.published_at ? timeAgo(a.published_at) : ''}</div>
                </div>
                {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width: 90, height: 60, objectFit: 'cover', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
          <div>
            <div style={{ background: '#f5f5f5', border: '1px solid #ddd', padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, borderBottom: '2px solid '+p, paddingBottom: 8 }}>SUBMIT A PRESS RELEASE</div>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 14 }}>Reach thousands of journalists, editors and investors with your announcement.</p>
              <button style={{ width: '100%', background: p, color: '#fff', border: 'none', padding: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>GET STARTED →</button>
            </div>
            <div style={{ border: '1px solid #ddd', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, borderBottom: '2px solid '+p, paddingBottom: 8, marginBottom: 14 }}>ABOUT {site.name.toUpperCase()}</div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{site.description}</p>
              <div style={{ marginTop: 14, fontSize: 12, color: '#333' }}>
                <div style={{ marginBottom: 6 }}>📧 press@presscentral.io</div>
                <div>📞 +44 20 7946 0958</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ background: '#1a1a1a', color: '#aaa', padding: '40px 24px 20px', marginTop: 32 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, marginBottom: 28 }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{site.name}</div>
              <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>{site.description}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {['𝕏','in','f','✈'].map((ic,i) => <a key={i} href="#" style={{ width: 28, height: 28, borderRadius: 3, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>{ic}</a>)}
              </div>
            </div>
            {[['Services',['Submit PR','Media Monitoring','Distribution','Analytics']],['Company',['About Us','Careers','Contact','Partners']],['Legal',['Terms','Privacy','Cookies','GDPR']]].map(([t,ls]:any) => (
              <div key={t}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing:'0.1em' }}>{t.toUpperCase()}</div>
                {ls.map((l:string) => <a key={l} href="#" style={{ display:'block', fontSize:12, color:'#666', marginBottom:6 }}>{l}</a>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid #333', paddingTop:16, fontSize:11, color:'#555', display:'flex', justifyContent:'space-between' }}>
            <span>© {new Date().getFullYear()} {site.name} · RepHub Media Ltd · 71-75 Shelton Street, London WC2H 9JQ · VAT: GB 123456789</span>
            <span>Terms · Privacy · Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
