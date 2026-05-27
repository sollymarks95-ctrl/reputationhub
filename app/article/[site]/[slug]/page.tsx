import { getNewsSite, getArticle, getLatestArticles, timeAgo } from '@/lib/news'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import NewsletterInline from '@/app/components/NewsletterInline'

const ROUTE_MAP: Record<string, string> = {
  'global-trade-wire':'news','finance-terminal':'finance','gold-markets-today':'commodities',
  'business-pulse':'magazine','trust-score':'reviews-hub','company-pedia':'wiki',
  'press-central':'pressroom','invest-data':'investdb','trade-board':'forum',
  'global-trade-assoc':'association','executive-network':'executive','market-radar':'market-radar',
}

export async function generateMetadata({ params }: { params: Promise<{ site: string; slug: string }> }): Promise<Metadata> {
  const { site: siteSlug, slug } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) return {}
  const article = await getArticle(site.id, slug)
  if (!article) return {}
  const BASE = 'https://rephuby.com'
  const route = ROUTE_MAP[siteSlug] || 'news'
  return {
    title: `${article.title} | ${site.name}`,
    description: article.excerpt,
    keywords: article.tags?.join(', '),
    authors: [{ name: article.author_name || site.name }],
    openGraph: {
      title: article.title, description: article.excerpt,
      images: article.cover_image_url ? [{ url: article.cover_image_url, width: 1200, height: 630 }] : [],
      type: 'article', publishedTime: article.published_at,
      authors: [article.author_name || site.name], siteName: site.name,
    },
    twitter: { card: 'summary_large_image', title: article.title, description: article.excerpt, images: article.cover_image_url ? [article.cover_image_url] : [] },
    robots: 'index, follow',
    alternates: { canonical: `${BASE}/article/${siteSlug}/${slug}` },
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
}
function formatShort(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'numeric' })
}
function readTime(body: string) {
  return Math.max(1, Math.ceil((body || '').split(' ').length / 200))
}

export default async function ArticlePage({ params }: { params: Promise<{ site: string; slug: string }> }) {
  const { site: siteSlug, slug } = await params
  const site = await getNewsSite(siteSlug)
  if (!site) notFound()
  const [article, allArticles] = await Promise.all([
    getArticle(site.id, slug),
    getLatestArticles(site.id, 24)
  ])
  if (!article) notFound()

  const p = site.primary_color || '#c0392b'
  const route = ROUTE_MAP[siteSlug] || 'news'
  const related = allArticles.filter((a: any) => a.slug !== slug).slice(0, 8)
  const cats = [...new Set(allArticles.map((a: any) => a.category).filter(Boolean))].slice(0, 8)
  const paragraphs = (article.body || '').split('\n\n').filter(Boolean)
  const BASE = 'https://rephuby.com'

  // JSON-LD Structured Data for SEO & AI agents
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.cover_image_url ? [article.cover_image_url] : [],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: { '@type': 'Person', name: article.author_name || 'Editorial Team' },
    publisher: {
      '@type': 'Organization', name: site.name,
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}/article/${siteSlug}/${slug}` },
    keywords: article.tags?.join(', '),
    articleSection: article.category,
    wordCount: (article.body || '').split(' ').length,
    timeRequired: `PT${readTime(article.body)}M`,
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', fontFamily:'"Georgia","Times New Roman",serif', color:'#1a1a1a' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        a:hover{color:${p}}
        .body p{margin-bottom:1.5em;line-height:1.9;font-size:18px;color:#222}
        .body h2{font-size:22px;font-weight:800;margin:2em 0 0.8em;color:#111;font-family:sans-serif;border-left:4px solid ${p};padding-left:12px}
        .body h3{font-size:19px;font-weight:700;margin:1.6em 0 0.6em;color:#111;font-family:sans-serif}
        .body blockquote{border-left:4px solid ${p};padding:14px 20px;margin:1.8em 0;background:#fafafa;font-style:italic;font-size:19px;color:#555;border-radius:0 4px 4px 0}
        .body ul,.body ol{margin:1em 0 1em 2em;line-height:1.8;font-size:17px}
        .body li{margin-bottom:0.5em}
        .body a{color:${p};font-weight:600;text-decoration:underline}
        @media(max-width:900px){.layout{grid-template-columns:1fr!important}.sidebar{display:none!important}.art-body{padding:20px!important}}
      `}</style>

      {/* TOP BAR */}
      <div style={{ background:'#0f172a', color:'#64748b', padding:'5px 20px', fontSize:11, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span>{formatDate(article.published_at || new Date().toISOString())}</span>
        <div style={{ display:'flex', gap:14 }}>
          <Link href="/search"><span style={{ cursor:'pointer', color:'#94a3b8' }}>🔍 Search</span></Link>
          <Link href={`/${route}/${siteSlug}`}><span style={{ cursor:'pointer', color:'#94a3b8' }}>Home</span></Link>
          <Link href={`/${route}/${siteSlug}?category=Markets`}><span style={{ cursor:'pointer', color:'#94a3b8' }}>Markets</span></Link>
        </div>
      </div>

      {/* HEADER */}
      <header style={{ background:'#fff', borderBottom:`4px solid ${p}`, position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth:1260, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ height:58, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Link href={`/${route}/${siteSlug}`}>
              <div style={{ fontWeight:900, fontSize:26, color:p, letterSpacing:'-1px' }}>{site.name}</div>
            </Link>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <Link href="/search">
                <div style={{ background:'#f3f4f6', borderRadius:5, padding:'6px 14px', fontSize:13, fontFamily:'sans-serif', cursor:'pointer', color:'#374151' }}>🔍 Search</div>
              </Link>
              <Link href={`/${route}/${siteSlug}`}>
                <div style={{ background:p, color:'#fff', borderRadius:5, padding:'6px 16px', fontSize:13, fontWeight:700, fontFamily:'sans-serif', cursor:'pointer' }}>Subscribe Free</div>
              </Link>
            </div>
          </div>
          <nav style={{ borderTop:'1px solid #f3f4f6', height:38, display:'flex', alignItems:'center', gap:0, overflowX:'auto' }}>
            <Link href={`/${route}/${siteSlug}`}>
              <span style={{ padding:'0 14px', height:38, display:'flex', alignItems:'center', fontSize:13, fontWeight:800, color:p, borderBottom:`2px solid ${p}`, whiteSpace:'nowrap' }}>Home</span>
            </Link>
            {cats.map((cat: string) => (
              <Link key={cat} href={`/${route}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                <span style={{ padding:'0 14px', height:38, display:'flex', alignItems:'center', fontSize:13, fontFamily:'sans-serif', color:'#4b5563', whiteSpace:'nowrap' }}>{cat}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'8px 20px' }}>
        <div style={{ maxWidth:1260, margin:'0 auto', fontSize:12, fontFamily:'sans-serif', color:'#9ca3af', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <Link href={`/${route}/${siteSlug}`} style={{ color:p }}>Home</Link>
          <span>›</span>
          {article.category && <>
            <Link href={`/${route}/${siteSlug}?category=${encodeURIComponent(article.category)}`} style={{ color:p }}>{article.category}</Link>
            <span>›</span>
          </>}
          <span style={{ color:'#9ca3af' }}>{article.title.substring(0,55)}...</span>
        </div>
      </div>

      <div style={{ maxWidth:1260, margin:'0 auto', padding:'28px 20px' }}>
        <div className="layout" style={{ display:'grid', gridTemplateColumns:'1fr 330px', gap:28 }}>

          {/* ARTICLE */}
          <main>
            {/* CATEGORY + BREAKING */}
            <div style={{ display:'flex', gap:8, marginBottom:12, fontFamily:'sans-serif', alignItems:'center' }}>
              {article.category && (
                <Link href={`/${route}/${siteSlug}?category=${encodeURIComponent(article.category)}`}>
                  <span style={{ background:p, color:'#fff', padding:'3px 10px', fontSize:10, fontWeight:900, letterSpacing:'0.08em', borderRadius:3, textTransform:'uppercase' }}>{article.category}</span>
                </Link>
              )}
              {article.is_breaking && <span style={{ background:'#ef4444', color:'#fff', padding:'3px 10px', fontSize:10, fontWeight:900, borderRadius:3, letterSpacing:'0.08em' }}>BREAKING</span>}
            </div>

            {/* HEADLINE */}
            <h1 style={{ fontSize:38, fontWeight:900, lineHeight:1.15, marginBottom:14, letterSpacing:'-0.5px', fontFamily:'sans-serif', color:'#111' }}>
              {article.title}
            </h1>

            {/* STANDFIRST */}
            {article.excerpt && (
              <p style={{ fontSize:20, color:'#374151', lineHeight:1.65, marginBottom:18, fontWeight:400, borderLeft:`4px solid ${p}`, paddingLeft:14, fontStyle:'italic' }}>
                {article.excerpt}
              </p>
            )}

            {/* AUTHOR META — NO AVATAR IMAGE */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, paddingBottom:14, borderBottom:'2px solid #111', fontFamily:'sans-serif', flexWrap:'wrap' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,${p},#1e293b)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:16, flexShrink:0 }}>
                {(article.author_name || 'E').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#111' }}>By {article.author_name || 'Editorial Team'}</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>
                  {site.name} · {article.published_at ? formatShort(article.published_at) : 'Today'}
                </div>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#9ca3af' }}>⏱ {readTime(article.body)} min read</span>
                <span style={{ fontSize:12, color:'#9ca3af' }}>· {(article.body||'').split(' ').length} words</span>
              </div>
            </div>

            {/* COVER IMAGE */}
            {article.cover_image_url && (
              <figure style={{ marginBottom:26 }}>
                <img src={article.cover_image_url} alt={article.title} style={{ width:'100%', maxHeight:480, objectFit:'cover', display:'block', borderRadius:4 }} loading="eager" />
                <figcaption style={{ fontSize:11, color:'#9ca3af', marginTop:6, fontFamily:'sans-serif', fontStyle:'italic', textAlign:'center' }}>
                  {site.name} Editorial · {article.category || 'News'}
                </figcaption>
              </figure>
            )}

            {/* ARTICLE BODY */}
            <div className="body" style={{ background:'#fff', padding:'28px 32px', borderRadius:4, marginBottom:4 }}>
              {paragraphs.map((para: string, i: number) => {
                if (para.startsWith('##') || para.startsWith('# ')) return <h2 key={i}>{para.replace(/^#{1,3}\s*/, '')}</h2>
                if (para.startsWith('>')) return <blockquote key={i}>{para.replace(/^>\s*/, '')}</blockquote>
                if (para.startsWith('- ') || para.startsWith('* ')) {
                  const items = para.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '))
                  return <ul key={i}>{items.map((item, j) => <li key={j}>{item.replace(/^[-*]\s*/, '')}</li>)}</ul>
                }
                if (para.toUpperCase() === para && para.length < 80 && para.trim().length > 3) return <h3 key={i}>{para}</h3>
                return <p key={i}>{para}</p>
              })}
            </div>

            {/* TAGS */}
            {article.tags && article.tags.length > 0 && (
              <div style={{ background:'#fff', padding:'14px 32px', borderTop:'1px solid #f3f4f6', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', fontFamily:'sans-serif', borderRadius:'0 0 4px 4px' }}>
                <span style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>Topics:</span>
                {article.tags.map((tag: string) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                    <span style={{ fontSize:12, fontWeight:600, color:p, border:`1px solid ${p}30`, background:`${p}08`, padding:'3px 10px', borderRadius:3, cursor:'pointer' }}>{tag}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* NEWSLETTER INLINE */}
            <NewsletterInline siteId={site.id} siteName={site.name} primaryColor={p} />

            {/* AUTHOR BIO — NO AVATAR IMAGE, JUST INITIAL */}
            <div style={{ background:'#fff', border:`2px solid ${p}20`, borderLeft:`4px solid ${p}`, borderRadius:4, padding:'20px 24px', marginTop:20, fontFamily:'sans-serif' }}>
              <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg,${p},#1e293b)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:22, flexShrink:0 }}>
                  {(article.author_name || 'E').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:'#111' }}>{article.author_name || 'Editorial Team'}</div>
                  <div style={{ fontSize:11, color:p, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>{site.name} Correspondent · {article.category || 'Markets'}</div>
                  <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.65 }}>
                    {article.author_name || 'The editorial team'} at {site.name} delivers expert analysis and breaking coverage across global markets, trade intelligence, and business strategy — combining deep industry expertise with rigorous reporting standards to provide actionable intelligence for business leaders worldwide.
                  </p>
                </div>
              </div>
            </div>

            {/* MORE ARTICLES */}
            {related.length > 0 && (
              <div style={{ marginTop:32 }}>
                <h2 style={{ fontFamily:'sans-serif', fontSize:20, fontWeight:900, marginBottom:18, paddingBottom:10, borderBottom:`3px solid ${p}` }}>
                  More from {site.name}
                </h2>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {related.slice(0,4).map((rel: any) => (
                    <Link key={rel.slug} href={`/article/${siteSlug}/${rel.slug}`}>
                      <div style={{ background:'#fff', borderRadius:4, overflow:'hidden', border:'1px solid #e5e7eb', cursor:'pointer' }}>
                        {rel.cover_image_url && <img src={rel.cover_image_url} alt={rel.title} style={{ width:'100%', height:130, objectFit:'cover', display:'block' }} loading="lazy" />}
                        <div style={{ padding:12 }}>
                          {rel.category && <span style={{ fontSize:9, fontWeight:900, color:p, letterSpacing:'0.08em', fontFamily:'sans-serif', textTransform:'uppercase' }}>{rel.category}</span>}
                          <div style={{ fontSize:14, fontWeight:700, lineHeight:1.3, marginTop:4, marginBottom:5, fontFamily:'sans-serif', color:'#111' }}>{rel.title}</div>
                          <div style={{ fontSize:11, color:'#9ca3af', fontFamily:'sans-serif', display:'flex', gap:8 }}>
                            <span>By {rel.author_name || 'Editorial'}</span>
                            <span>·</span>
                            <span>{rel.read_time_minutes || 5} min</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* SIDEBAR */}
          <aside className="sidebar" style={{ position:'sticky', top:110, alignSelf:'start' }}>
            {/* NEWSLETTER */}
            <div style={{ background:`linear-gradient(135deg,${p},#1e293b)`, borderRadius:6, padding:18, marginBottom:14, color:'#fff', fontFamily:'sans-serif' }}>
              <div style={{ fontWeight:900, fontSize:16, marginBottom:6 }}>📧 Free Daily Briefing</div>
              <p style={{ fontSize:12, opacity:0.85, lineHeight:1.6, marginBottom:14 }}>Top stories from {site.name} every morning. 50,000+ subscribers.</p>
              <NewsletterInlineDark siteId={site.id} siteName={site.name} p={p} />
            </div>

            {/* LATEST */}
            <div style={{ background:'#fff', borderRadius:6, padding:16, marginBottom:14, border:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:'0.06em', paddingBottom:10, marginBottom:12, borderBottom:`3px solid ${p}`, fontFamily:'sans-serif' }}>Latest</div>
              {related.slice(0,5).map((rel: any, i: number) => (
                <Link key={i} href={`/article/${siteSlug}/${rel.slug}`}>
                  <div style={{ display:'flex', gap:10, marginBottom:12, paddingBottom:12, borderBottom:i<4?'1px solid #f3f4f6':'none', cursor:'pointer' }}>
                    {rel.cover_image_url && <img src={rel.cover_image_url} alt="" style={{ width:70, height:50, objectFit:'cover', borderRadius:3, flexShrink:0 }} loading="lazy" />}
                    <div>
                      {rel.category && <span style={{ fontSize:9, fontWeight:900, color:p, letterSpacing:'0.06em', fontFamily:'sans-serif', textTransform:'uppercase' }}>{rel.category}</span>}
                      <div style={{ fontFamily:'sans-serif', fontWeight:700, fontSize:13, lineHeight:1.3, color:'#111', marginTop:2 }}>{rel.title}</div>
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:3, fontFamily:'sans-serif' }}>{rel.published_at ? timeAgo(rel.published_at) : ''}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* MOST READ — numbered, no avatars */}
            <div style={{ background:'#fff', borderRadius:6, padding:16, marginBottom:14, border:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:'0.06em', paddingBottom:10, marginBottom:12, borderBottom:`3px solid ${p}`, fontFamily:'sans-serif' }}>Most Read</div>
              {related.slice(0,5).map((rel: any, i: number) => (
                <Link key={i} href={`/article/${siteSlug}/${rel.slug}`}>
                  <div style={{ display:'flex', gap:10, marginBottom:12, paddingBottom:12, borderBottom:i<4?'1px solid #f3f4f6':'none', cursor:'pointer', alignItems:'flex-start' }}>
                    <span style={{ fontSize:24, fontWeight:900, color:'#e5e7eb', lineHeight:1, flexShrink:0, minWidth:28, fontFamily:'sans-serif' }}>{i+1}</span>
                    <div style={{ fontFamily:'sans-serif', fontWeight:700, fontSize:13, lineHeight:1.35, color:'#111' }}>{rel.title}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* TOPICS */}
            <div style={{ background:'#fff', borderRadius:6, padding:16, marginBottom:14, border:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:'0.06em', paddingBottom:10, marginBottom:12, borderBottom:`3px solid ${p}`, fontFamily:'sans-serif' }}>Topics</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {cats.map((cat: string) => (
                  <Link key={cat} href={`/${route}/${siteSlug}?category=${encodeURIComponent(cat)}`}>
                    <span style={{ fontSize:12, fontWeight:600, color:p, border:`1px solid ${p}30`, background:`${p}08`, padding:'4px 12px', borderRadius:3, fontFamily:'sans-serif', cursor:'pointer', display:'block' }}>{cat}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* SEARCH */}
            <div style={{ background:'#fff', borderRadius:6, padding:16, border:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10, fontFamily:'sans-serif' }}>Search</div>
              <form action="/search" method="GET" style={{ display:'flex', gap:6 }}>
                <input name="q" placeholder="Search articles..." style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:4, fontSize:13, fontFamily:'sans-serif', outline:'none' }} />
                <button type="submit" style={{ background:p, color:'#fff', border:'none', borderRadius:4, padding:'8px 12px', cursor:'pointer', fontFamily:'sans-serif', fontWeight:700, fontSize:13 }}>→</button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background:'#0f172a', color:'#64748b', padding:'40px 20px 20px', marginTop:40, fontFamily:'sans-serif' }}>
        <div style={{ maxWidth:1260, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:28, marginBottom:28 }}>
            <div>
              <Link href={`/${route}/${siteSlug}`}><div style={{ fontWeight:900, fontSize:20, color:'#fff', marginBottom:10 }}>{site.name}</div></Link>
              <p style={{ fontSize:13, lineHeight:1.7, color:'#475569' }}>{site.tagline || 'Global business intelligence and market analysis.'}</p>
            </div>
            {[
              { title:'Coverage', links: cats.slice(0,5).map((c: string) => ({ label:c, href:`/${route}/${siteSlug}?category=${encodeURIComponent(c)}` })) },
              { title:'Company', links:[{label:'About Us',href:'/legal/about'},{label:'Our Team',href:'/legal/about'},{label:'Contact Us',href:'/legal/contact'},{label:'Advertise',href:'/legal/advertise'}] },
              { title:'Legal', links:[{label:'Privacy Policy',href:'/legal/privacy'},{label:'Terms of Use',href:'/legal/terms'},{label:'Risk Warning',href:'/legal/risk-warning'},{label:'Cookie Policy',href:'/legal/cookies'},{label:'Sitemap',href:'/sitemap.xml'}] }
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight:700, fontSize:11, color:'#94a3b8', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.08em' }}>{col.title}</div>
                {col.links.map((l: any) => <Link key={l.label} href={l.href}><div style={{ fontSize:13, color:'#475569', marginBottom:8 }}>{l.label}</div></Link>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid #1e293b', paddingTop:16, fontSize:11, color:'#334155', lineHeight:1.8, marginBottom:12 }}>
            <strong style={{color:'#475569'}}>Risk Disclosure:</strong> Trading in financial instruments involves high risks. Prices may not be real-time or accurate. {site.name} does not accept liability for losses resulting from reliance on information provided. Content is for informational purposes only and does not constitute investment advice.
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #1e293b', paddingTop:14, flexWrap:'wrap', gap:8 }}>
            <span style={{ fontSize:12, color:'#334155' }}>© {new Date().getFullYear()} {site.name} · RepHub Intelligence Ltd · All Rights Reserved</span>
            <div style={{ display:'flex', gap:14 }}>
              {[{l:'Privacy',h:'/legal/privacy'},{l:'Terms',h:'/legal/terms'},{l:'Risk Warning',h:'/legal/risk-warning'},{l:'Cookies',h:'/legal/cookies'},{l:'Sitemap',h:'/sitemap.xml'}].map(({l,h}) => (
                <Link key={l} href={h}><span style={{ fontSize:11, color:'#334155', cursor:'pointer' }}>{l}</span></Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Sidebar newsletter (dark version) — server-safe wrapper
function NewsletterInlineDark({ siteId, siteName, p }: { siteId: string; siteName: string; p: string }) {
  return <NewsletterInline siteId={siteId} siteName={siteName} primaryColor={p} dark />
}
