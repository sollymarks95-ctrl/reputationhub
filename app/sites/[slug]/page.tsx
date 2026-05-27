import { getSiteBySlug, getSiteClients } from '@/lib/site'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function SiteHomepage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const site = await getSiteBySlug(slug)
  if (!site || !site.is_live) notFound()

  const profiles = await getSiteClients(site.id)

  const primary = site.primary_color || '#2563eb'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: primary, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne', fontWeight: 800, color: '#fff', fontSize: 16
            }}>
              {site.name.charAt(0)}
            </div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
              {site.name}
            </span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {['Directory', 'Industries', 'About', 'Contact'].map(item => (
              <a key={item} href="#" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
                {item}
              </a>
            ))}
            <a href="#list" style={{
              background: primary, color: '#fff',
              padding: '8px 18px', borderRadius: 8,
              fontSize: 13, fontFamily: 'Syne', fontWeight: 700,
              textDecoration: 'none'
            }}>
              List Your Business
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{
        background: `linear-gradient(135deg, #0f172a 0%, #1e293b 50%, ${primary}22 100%)`,
        padding: '90px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.08) 0%, transparent 50%)',
        }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${primary}22`, border: `1px solid ${primary}44`,
            borderRadius: 20, padding: '4px 14px', marginBottom: 24,
            fontSize: 12, color: primary, fontFamily: 'Syne', fontWeight: 700,
            letterSpacing: '0.06em'
          }}>
            ● VERIFIED GLOBAL DIRECTORY
          </div>
          <h1 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 54,
            color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em',
            marginBottom: 20
          }}>
            {site.tagline || `The World's Most Trusted ${site.niche || 'Business'} Directory`}
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 40, lineHeight: 1.6 }}>
            {site.description || `Verified, reviewed, and trusted companies — all in one place. Find the right partner with confidence.`}
          </p>

          {/* Search bar */}
          <div style={{
            display: 'flex', gap: 0, maxWidth: 560, margin: '0 auto',
            background: '#fff', borderRadius: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            <input
              placeholder="Search companies, industries..."
              style={{
                flex: 1, padding: '16px 20px', border: 'none', outline: 'none',
                fontSize: 15, fontFamily: 'DM Sans', color: '#0f172a',
                background: 'transparent'
              }}
            />
            <button style={{
              background: primary, color: '#fff',
              border: 'none', padding: '16px 28px',
              fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              Search →
            </button>
          </div>

          {/* Trust stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 48 }}>
            {[
              { num: `${profiles.length || '0'}+`, label: 'Verified Companies' },
              { num: '50+', label: 'Countries' },
              { num: '4.8★', label: 'Avg Rating' },
              { num: '100%', label: 'Verified' },
            ].map(({ num, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: '#fff' }}>{num}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRY FILTERS */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {['All', 'Import/Export', 'Manufacturing', 'Wholesale', 'Distribution', 'Logistics', 'Technology', 'Finance'].map((cat, i) => (
            <button key={cat} style={{
              padding: '7px 16px', borderRadius: 20, whiteSpace: 'nowrap',
              border: `1px solid ${i === 0 ? primary : '#e2e8f0'}`,
              background: i === 0 ? primary : 'transparent',
              color: i === 0 ? '#fff' : '#64748b',
              fontFamily: 'Syne', fontWeight: 600, fontSize: 12,
              cursor: 'pointer'
            }}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* LISTINGS */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: '#0f172a' }}>
            {profiles.length > 0 ? `${profiles.length} Verified Companies` : 'Verified Companies'}
          </h2>
          <select style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 13, color: '#64748b', fontFamily: 'DM Sans',
            background: '#fff', outline: 'none'
          }}>
            <option>Sort by: Top Rated</option>
            <option>Sort by: Most Reviews</option>
            <option>Sort by: Newest</option>
          </select>
        </div>

        {profiles.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: '#94a3b8', fontSize: 16
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <p>No companies listed yet. Be the first to get verified.</p>
            <a href="#list" style={{
              display: 'inline-block', marginTop: 20,
              background: primary, color: '#fff',
              padding: '12px 24px', borderRadius: 8,
              fontFamily: 'Syne', fontWeight: 700,
              textDecoration: 'none', fontSize: 14
            }}>
              List Your Business
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {profiles.map((profile: any) => {
              const client = profile.clients
              return (
                <Link
                  key={profile.id}
                  href={`/company/${profile.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff', borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    padding: 24, cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = primary
                    el.style.boxShadow = `0 8px 30px ${primary}22`
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = '#e2e8f0'
                    el.style.boxShadow = 'none'
                    el.style.transform = 'translateY(0)'
                  }}
                  >
                    {profile.is_featured && (
                      <div style={{
                        position: 'absolute', top: 14, right: 14,
                        background: `${primary}18`, color: primary,
                        fontSize: 10, fontFamily: 'Syne', fontWeight: 700,
                        padding: '3px 8px', borderRadius: 4,
                        letterSpacing: '0.06em'
                      }}>
                        FEATURED
                      </div>
                    )}

                    {/* Logo / Avatar */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 10,
                      background: `${primary}15`,
                      border: `2px solid ${primary}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Syne', fontWeight: 800, color: primary, fontSize: 20,
                      marginBottom: 14
                    }}>
                      {client?.company_name?.charAt(0) || '?'}
                    </div>

                    <h3 style={{
                      fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
                      color: '#0f172a', marginBottom: 6
                    }}>
                      {client?.company_name}
                    </h3>

                    {profile.is_verified && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        color: '#10b981', fontSize: 12, fontWeight: 600,
                        marginBottom: 10
                      }}>
                        ✓ Verified Business
                      </div>
                    )}

                    <p style={{
                      fontSize: 13, color: '#64748b', marginBottom: 14,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden'
                    }}>
                      {profile.bio || client?.description || 'Verified and trusted business.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {client?.industry && (
                          <span style={{
                            fontSize: 11, fontFamily: 'Syne', fontWeight: 600,
                            color: '#64748b', background: '#f1f5f9',
                            padding: '3px 8px', borderRadius: 4
                          }}>
                            {client.industry}
                          </span>
                        )}
                        {client?.country && (
                          <span style={{
                            fontSize: 11, color: '#94a3b8',
                            display: 'flex', alignItems: 'center', gap: 3
                          }}>
                            📍 {client.country}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 13, fontFamily: 'Syne', fontWeight: 700,
                        color: '#f59e0b'
                      }}>
                        {profile.trust_score > 0 ? `★ ${profile.trust_score}` : '★ New'}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* WHY TRUST US */}
      <section style={{ background: '#0f172a', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, color: '#fff', marginBottom: 12 }}>
            Why businesses trust {site.name}
          </h2>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 52 }}>
            Every listing is verified, reviewed, and monitored 24/7 by our AI engine
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { icon: '🔍', title: 'AI Verified', desc: 'Every company is verified by our AI engine before listing' },
              { icon: '⭐', title: 'Real Reviews', desc: 'Only authentic reviews from verified customers' },
              { icon: '🌍', title: 'Global Network', desc: 'Companies from 50+ countries in one directory' },
              { icon: '🔄', title: 'Live Updates', desc: 'Profiles and reviews updated in real-time' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: '#1e293b', borderRadius: 14,
                border: '1px solid #334155', padding: 28,
                textAlign: 'left'
              }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#fff', fontSize: 16, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="list" style={{ padding: '80px 24px', textAlign: 'center', background: '#fff' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, color: '#0f172a', marginBottom: 14 }}>
            Get your business listed today
          </h2>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32 }}>
            Join hundreds of verified companies and start getting found by global buyers
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <input placeholder="Your company email" style={{
              flex: 1, padding: '14px 18px', border: '1px solid #e2e8f0',
              borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'DM Sans'
            }} />
            <button style={{
              background: primary, color: '#fff', border: 'none',
              padding: '14px 24px', borderRadius: 8,
              fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              Get Listed →
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0f172a', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, color: '#fff', fontSize: 18, marginBottom: 8 }}>
            {site.name}
          </div>
          <p style={{ color: '#475569', fontSize: 13, marginBottom: 24 }}>
            {site.seo_description || 'The global standard for business verification and trust.'}
          </p>
          <div style={{ color: '#334155', fontSize: 12 }}>
            © {new Date().getFullYear()} {site.name}. All rights reserved. Powered by RepHub.
          </div>
        </div>
      </footer>
    </div>
  )
}
