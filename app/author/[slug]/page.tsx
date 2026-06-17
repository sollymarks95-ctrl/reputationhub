import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DOMAIN_MAP: Record<string,string> = {
  'global-trade-wire':     'https://nex-wire.com',
  'finance-terminal':      'https://finvexx.com',
  'business-pulse':        'https://bizplezx.com',
  'gold-markets-today':    'https://aurexhq.com',
  'trust-score':           'https://verivex.co',
  'invest-data':           'https://invexhuby.com',
  'market-radar':          'https://signalixx.com',
  'executive-network':     'https://execvex.com',
  'crypto-hub':            'https://cryptoxos.com',
  'fx-vexx':               'https://fxvexx.com',
  'trade-hub-iq':          'https://tradehubiq.com',
  'aliya-today':           'https://aliyatoday.com',
  'jewish-news-now':       'https://jewishnewsnow.com',
  'jewish-property-report':'https://jewishpropertyreport.com',
  'rephuby-intelligence':  'https://rephuby.com',
}

// Author profiles — real E-E-A-T data
const AUTHORS: Record<string, {
  name: string; title: string; bio: string; expertise: string[];
  linkedin?: string; twitter?: string; website?: string;
  avatar: string; yearsExp: number;
}> = {
  'solly-marks': {
    name: 'Solly Marks',
    title: 'Publisher & Media Buyer',
    bio: 'Solly Marks is an Israeli entrepreneur, media buyer, and publisher with over a decade of experience in direct-response advertising, digital media, and content strategy. Based in Ashdod, Israel, he operates multiple content networks and digital brands spanning finance, real estate, and aliyah guidance — reaching hundreds of thousands of readers monthly across his portfolio of 14+ publications. His finance portals cover global markets, trade intelligence, cryptocurrency, and executive strategy. His Jewish-focused publications — AliyaToday.com, JewishNewsNow.com, and JewishPropertyReport.com — are dedicated to the English-speaking Jewish diaspora worldwide.',
    expertise: ['Digital Media', 'Direct Response Marketing', 'Financial Content', 'Aliyah & Israeli Real Estate', 'SEO & Content Strategy', 'Cryptocurrency Markets'],
    linkedin: 'https://www.linkedin.com/in/solly-marks',
    website: 'https://rephuby.com',
    avatar: 'SM',
    yearsExp: 10,
  },
  'editorial-team': {
    name: 'Editorial Team',
    title: 'Research & Analysis Team',
    bio: 'Our editorial team consists of experienced financial analysts, market researchers, and content specialists dedicated to delivering accurate, timely intelligence across global markets.',
    expertise: ['Financial Analysis', 'Market Research', 'Economic Commentary'],
    avatar: 'ET',
    yearsExp: 5,
  }
}

async function getSiteFromRequest(): Promise<{ siteSlug: string; domain: string } | null> {
  // Get all active sites to determine which site is serving this request
  const { data } = await db.from('news_sites').select('slug, domain').eq('status', 'active').limit(50)
  return null // site determined by domain header
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = AUTHORS[slug]
  if (!author) return { title: 'Author Not Found' }
  return {
    title: `${author.name} — ${author.title}`,
    description: author.bio.slice(0, 155),
    openGraph: {
      title: `${author.name} — ${author.title}`,
      description: author.bio.slice(0, 155),
      type: 'profile',
    },
  }
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = AUTHORS[slug]
  if (!author) notFound()

  // Get articles by this author across all sites
  const { data: articles } = await db
    .from('news_articles')
    .select('id, title, slug, excerpt, published_at, category, news_site_id, news_sites!inner(slug, domain, name)')
    .ilike('author_name', `%${author.name.split(' ')[0]}%`)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(24)

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.title,
    description: author.bio,
    url: `https://rephuby.com/author/${slug}`,
    sameAs: [
      author.linkedin,
      author.twitter,
      author.website,
    ].filter(Boolean),
    knowsAbout: author.expertise,
    worksFor: {
      '@type': 'Organization',
      name: 'RepHuby Intelligence Network',
      url: 'https://rephuby.com',
    },
  }

  const bg = '#f3f4f6'
  const card = '#ffffff'
  const primary = '#1a56db'
  const text = '#111827'
  const textSub = '#6b7280'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <div style={{ background: bg, minHeight: '100vh', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

        {/* HEADER */}
        <div style={{ background: primary, padding: '16px 0' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 14, opacity: 0.8 }}>← Home</Link>
          </div>
        </div>

        {/* AUTHOR HERO */}
        <div style={{ background: card, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 40px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: '50%', background: primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 32, fontWeight: 700, flexShrink: 0
            }}>
              {author.avatar}
            </div>
            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: text }}>{author.name}</h1>
              <p style={{ margin: '0 0 12px', fontSize: 15, color: primary, fontWeight: 600 }}>{author.title}</p>
              <p style={{ margin: '0 0 20px', fontSize: 15, color: textSub, lineHeight: 1.7, maxWidth: 640 }}>{author.bio}</p>

              {/* Expertise tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {author.expertise.map(e => (
                  <span key={e} style={{
                    background: '#eff6ff', color: primary, fontSize: 12,
                    padding: '4px 10px', borderRadius: 20, fontWeight: 500
                  }}>{e}</span>
                ))}
              </div>

              {/* Social links */}
              <div style={{ display: 'flex', gap: 12 }}>
                {author.linkedin && (
                  <a href={author.linkedin} target="_blank" rel="noopener noreferrer"
                    style={{ color: primary, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                    LinkedIn ↗
                  </a>
                )}
                {author.website && (
                  <a href={author.website} target="_blank" rel="noopener noreferrer"
                    style={{ color: primary, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                    Website ↗
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ flexShrink: 0, textAlign: 'center', background: bg, borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: primary }}>{articles?.length || 0}+</div>
              <div style={{ fontSize: 12, color: textSub, fontWeight: 500 }}>Articles</div>
              <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, color: primary }}>14</div>
              <div style={{ fontSize: 12, color: textSub, fontWeight: 500 }}>Publications</div>
              <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, color: primary }}>{author.yearsExp}+</div>
              <div style={{ fontSize: 12, color: textSub, fontWeight: 500 }}>Years Exp.</div>
            </div>
          </div>
        </div>

        {/* ARTICLES */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: text }}>
            Recent Articles by {author.name}
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {(articles || []).map((article: any) => {
              const site = article.news_sites
              const siteDomain = DOMAIN_MAP[site?.slug] || `https://${site?.domain}`
              const articleUrl = `${siteDomain}/article/${site?.slug}/${article.slug}`
              return (
                <a key={article.id} href={articleUrl}
                  style={{ display: 'block', background: card, borderRadius: 12, padding: '20px 24px', textDecoration: 'none', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 11, color: primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {site?.name} · {article.category}
                      </span>
                      <h3 style={{ margin: '6px 0 8px', fontSize: 16, fontWeight: 700, color: text, lineHeight: 1.4 }}>
                        {article.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: textSub, lineHeight: 1.5 }}>
                        {article.excerpt?.slice(0, 120)}
                      </p>
                    </div>
                    <div style={{ fontSize: 12, color: textSub, flexShrink: 0 }}>
                      {new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>

          {(!articles || articles.length === 0) && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: textSub }}>
              Articles loading — check back soon.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
