import { getNewsSite, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

async function getTopClients(siteId: string) {
  const { data } = await supabase.from('client_profiles').select('*,clients(*)').eq('status','active').limit(12)
  return data || []
}

export default async function ReviewsSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getNewsSite(slug)
  if (!site || !site.is_live) notFound()
  const [articles, profiles] = await Promise.all([getLatestArticles(site.id, 8), getTopClients(site.id)])
  const p = site.primary_color || '#27ae60'

  const mockCompanies = profiles.length > 0 ? profiles : Array.from({length:8}, (_,i) => ({
    id: i, is_verified: true, trust_score: 4.2 + (i%3)*0.2, is_featured: i<3,
    clients: { company_name: ['Alpha Trading Co','Global Imports Ltd','TechTrade Inc','Nexus Wholesale','Prime Distributors','Euro Commerce','Asia Pacific Trade','Metro Suppliers'][i], country: ['UAE','UK','USA','Germany','Israel','France','Singapore','Italy'][i], industry: 'Trading' }
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: '"Helvetica Neue",Arial,sans-serif', color: '#191919' }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}a{text-decoration:none;color:inherit}.card:hover{box-shadow:0 4px 20px rgba(0,0,0,.1);transform:translateY(-2px)}`}</style>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={`/reviews-hub/${slug}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: p, width: 32, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16 }}>★</div>
              <span style={{ fontWeight: 800, fontSize: 22, color: '#191919', letterSpacing: '-0.5px' }}>{site.name}</span>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 400, margin: '0 32px' }}>
            <input placeholder="Search companies..." style={{ flex: 1, border: '2px solid #e8e8e8', borderRadius: 4, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'sans-serif' }} />
            <button style={{ background: p, color: '#fff', border: 'none', borderRadius: 4, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Search</button>
          </div>
          <nav style={{ display: 'flex', gap: 24 }}>
            {['Categories', 'Write Review', 'For Business', 'About'].map(i => (
              <a key={i} href="#" style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{i}</a>
            ))}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg, ${p}, ${p}bb)`, padding: '60px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-1px' }}>
          Trusted Business Reviews
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,.85)', marginBottom: 28 }}>
          {site.description || 'Independent verified reviews for global businesses'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 28 }}>
          {[['500K+','Reviews'],['12K+','Companies'],['50+','Countries'],['4.8','Avg Rating']].map(([n,l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>{n}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Top Rated Companies</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 48 }}>
          {mockCompanies.slice(0,8).map((p_: any, i: number) => {
            const c = p_.clients
            const score = p_.trust_score || 4.2
            return (
              <div key={i} className="card" style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: 20, cursor: 'pointer', transition: 'all .2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: `${p}18`, border: `1px solid ${p}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: p }}>{c?.company_name?.charAt(0)||'?'}</div>
                  {p_.is_verified && <span style={{ fontSize: 10, background: `${p}15`, color: p, padding: '3px 8px', borderRadius: 20, fontWeight: 700, alignSelf: 'flex-start' }}>✓ VERIFIED</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c?.company_name || 'Company'}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{c?.country || 'Global'} · {c?.industry || 'Business'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#f0b429', fontSize: 14 }}>{'★'.repeat(Math.round(score))}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{score.toFixed(1)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Latest reviews/news */}
        {articles.length > 0 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Latest Reports</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {articles.slice(0,4).map((a: any, i: number) => (
                <div key={i} className="card" style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: 20, transition: 'all .2s', display: 'flex', gap: 14 }}>
                  {a.cover_image_url && <img src={a.cover_image_url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', flexShrink: 0, borderRadius: 4 }} />}
                  <div>
                    <div style={{ fontSize: 10, color: p, fontWeight: 700, marginBottom: 4 }}>{a.category?.toUpperCase()}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{a.published_at ? timeAgo(a.published_at) : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ background: '#191919', color: '#aaa', padding: '40px 24px 20px', marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{site.name}</div>
              <p style={{ fontSize: 12, lineHeight: 1.7, color: '#666' }}>{site.description}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {['𝕏','in','f','📷'].map((ic,i) => <a key={i} href="#" style={{ width: 30, height: 30, borderRadius: 4, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11 }}>{ic}</a>)}
              </div>
            </div>
            {[['For Businesses',['Claim Your Profile','Business Solutions','Advertise','API Access']],['Legal',['Terms of Use','Privacy Policy','Cookie Policy','Disclaimers']],['Support',['Help Center','Contact','About Us','Careers']]].map(([title, links]: any) => (
              <div key={title}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '0.1em' }}>{title.toUpperCase()}</div>
                {links.map((l: string) => <a key={l} href="#" style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6 }}>{l}</a>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: 16, fontSize: 11, color: '#555', display: 'flex', justifyContent: 'space-between' }}>
            <span>© {new Date().getFullYear()} {site.name} · RepHub Media Ltd · 71-75 Shelton Street, London WC2H 9JQ</span>
            <span>All reviews independently verified</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
