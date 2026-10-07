import TrackView from '@/app/components/TrackView'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import DynamicTemplate from '@/app/components/templates/DynamicTemplate'
import JewishTemplate from '@/app/components/templates/JewishTemplate'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ─── Static site config — no DB call needed for metadata ───────────────────
const SITE_META: Record<string, { name: string; desc: string; domain: string; icon: string }> = {
  'aliya-today':            { name: 'AliyaToday', desc: 'The complete guide to making Aliyah in 2026. Step-by-step advice on the process, costs, health funds, bank accounts, ulpan and life in Israel — written by Solly Marks.', domain: 'aliyatoday.com', icon: '/icon-aliya-today.svg' },
  'jewish-news-now':        { name: 'Jewish News Now', desc: 'Breaking Jewish news from Israel and around the world. Daily coverage of Israel, Jewish communities, politics and culture — updated every day by Solly Marks.', domain: 'jewishnewsnow.com', icon: '/icon-jewish-news-now.svg' },
  'jewish-property-report': { name: 'Jewish Property Report', desc: 'Israeli real estate news and investment guides for diaspora buyers. Property prices, legal requirements, neighborhoods and market trends — by Solly Marks.', domain: 'jewishpropertyreport.com', icon: '/icon-jewish-property-report.svg' },
  'global-trade-wire':      { name: 'Global Trade Wire', desc: 'Global trade and market intelligence for finance professionals.', domain: 'nex-wire.com', icon: '/icon-nexwire.svg' },
  'finance-terminal':       { name: 'Finance Terminal', desc: 'Financial markets and investment intelligence.', domain: 'finvexx.com', icon: '/icon-finvexx.svg' },
  'business-pulse':         { name: 'Business Pulse', desc: 'Business strategy and innovation intelligence.', domain: 'bizplezx.com', icon: '/icon-bizplezx.svg' },
  'gold-markets-today':     { name: 'Gold Markets Today', desc: 'Precious metals and commodities intelligence.', domain: 'aurexhq.com', icon: '/icon-aurexhq.svg' },
  'trust-score':            { name: 'Trust Score', desc: 'Verified reviews and broker intelligence.', domain: 'verivex.co', icon: '/icon-verivex.svg' },
  'invest-data':            { name: 'Invest Data', desc: 'Investment intelligence and fund analysis.', domain: 'invexhuby.com', icon: '/icon-invexhuby.svg' },
  'market-radar':           { name: 'Market Radar', desc: 'Market signals and technical analysis.', domain: 'signalixx.com', icon: '/icon-signalixx.svg' },
  'executive-network':      { name: 'Executive Network', desc: 'Executive leadership and career intelligence.', domain: 'execvex.com', icon: '/icon-execvex.svg' },
  'crypto-hub':             { name: 'Crypto Hub', desc: 'Crypto markets and digital asset intelligence.', domain: 'cryptoxos.com', icon: '/icon-cryptoxos.svg' },
}

const CANONICAL_DOMAIN: Record<string, string> = {
  'aliya-today':            'https://aliyatoday.com',
  'jewish-news-now':        'https://jewishnewsnow.com',
  'jewish-property-report': 'https://jewishpropertyreport.com',
  'global-trade-wire':      'https://nex-wire.com',
  'finance-terminal':       'https://finvexx.com',
  'business-pulse':         'https://bizplezx.com',
  'gold-markets-today':     'https://aurexhq.com',
  'trust-score':            'https://verivex.co',
  'invest-data':            'https://invexhuby.com',
  'market-radar':           'https://signalixx.com',
  'executive-network':      'https://execvex.com',
  'crypto-hub':             'https://cryptoxos.com',
  'fx-vexx':                'https://fxvexx.com',
  'trade-hub-iq':           'https://tradehubiq.com',
  'copy-trade-iq':          'https://copyvexx.com',
  'expat-invest-iq':        'https://expatinvestiq.com',
  'rephuby-intelligence':   'https://rephuby.com',
}

// ─── Supabase ───────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL  || SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON
  )
}

// Promise.race timeout — reliable cross-environment alternative to AbortSignal
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>(res => setTimeout(() => res(null), ms))])
}

// React cache() — deduplicates across generateMetadata + page component
const fetchPageData = cache(async (siteSlug: string) => {
  try {
    const db = getDb()
    const siteRes = await withTimeout(
      db.from('news_sites').select('*').eq('slug', siteSlug).single().then(r => r.data),
      8000
    )
    if (!siteRes) return { site: null, articles: [] as any[] }

    const articlesRes = await withTimeout(
      db.from('news_articles')
        .select('id,title,slug,excerpt,category,author_name,published_at,read_time_minutes,cover_image_url')
        .eq('news_site_id', siteRes.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(30)
        .then(r => r.data),
      6000
    )
    return { site: siteRes, articles: articlesRes || [] }
  } catch {
    return { site: null, articles: [] as any[] }
  }
})

// ─── generateMetadata — ZERO DB calls, uses static config ──────────────────
export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ _site?: string }> }
): Promise<Metadata> {
  const sp   = await searchParams
  const slug = sp._site || ''
  const m    = SITE_META[slug]
  if (!m) return { title: 'Financial Intelligence' }

  const JEWISH = ['aliya-today','jewish-news-now','jewish-property-report']
  const canonical = CANONICAL_DOMAIN[slug] || `https://${m.domain}`
  const noindex   = JEWISH.includes(slug) ? false : true

  const NICHE_KW: Record<string,string> = {
    'aliya-today':            'making aliyah, aliyah guide 2026, how to make aliyah, nefesh bnefesh, aliyah checklist, move to israel, aliyah process, olim advice',
    'jewish-news-now':        'jewish news, israel news today, jewish community news, jewish world news, israel breaking news 2026',
    'jewish-property-report': 'israel real estate, buy property in israel, israel apartments, tel aviv property market, invest in israel, israel housing',
  }

  const title = JEWISH.includes(slug) ? `${m.name} — ${m.desc.slice(0,60)} | Solly Marks` : `${m.name} — Financial Intelligence`

  return {
    title: { default: title, template: `%s | ${m.name}` },
    description: m.desc,
    robots: noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    alternates: { canonical },
    keywords: NICHE_KW[slug] || `${m.name}, financial news, market intelligence`,
    authors: [{ name: JEWISH.includes(slug) ? 'Solly Marks' : m.name, url: canonical }],
    openGraph: { title, description: m.desc, url: canonical, siteName: m.name, type: 'website', locale: 'en_US' },
    icons: { icon: m.icon },
    twitter: { card: 'summary_large_image', title, description: m.desc },
  }
}

// ─── Page component ─────────────────────────────────────────────────────────
export default async function DynamicSitePage(
  { searchParams }: { searchParams: Promise<{ _site?: string }> }
) {
  const sp       = await searchParams
  const siteSlug = sp._site || ''
  if (!siteSlug) return notFound()

  const { site, articles } = await fetchPageData(siteSlug)

  // DB timed out server-side — render client-side loader that fetches via API
  if (!site) {
    return (
      <>
        <div id="__site_loader" style={{ fontFamily: 'Georgia,serif', minHeight: '100vh', background: siteSlug === 'aliya-today' ? '#fff8f0' : '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✈️</div>
            <h1 style={{ fontSize: 28, color: '#333', marginBottom: 12 }}>Loading…</h1>
            <p style={{ color: '#666', fontSize: 16 }}>Fetching content…</p>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  fetch('/api/site-data?slug=${siteSlug}')
    .then(function(r){return r.json()})
    .then(function(d){
      if(d && d.site){ window.location.reload(); }
      else { setTimeout(function(){ window.location.reload(); }, 3000); }
    })
    .catch(function(){ setTimeout(function(){ window.location.reload(); }, 3000); });
})();
        ` }} />
      </>
    )
  }

  const siteUrl = CANONICAL_DOMAIN[site.slug] || `https://${site.domain}`
  const host    = siteUrl.replace('https://', '')
  const tagline = site.tagline || site.template_config?.tagline || site.description || 'Financial news and market intelligence'

  const schemas = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: siteUrl, description: tagline, inLanguage: 'en',
      potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={search_term_string}` }, 'query-input': 'required name=search_term_string' } },
    { '@context': 'https://schema.org', '@type': 'NewsMediaOrganization', name: site.name, url: siteUrl, description: tagline,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.ico`, width: 512, height: 512 }, sameAs: [] },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: `Latest from ${site.name}`, url: siteUrl,
      itemListElement: (articles || []).slice(0, 10).map((a: any, i: number) => ({
        '@type': 'ListItem', position: i + 1, url: `${siteUrl}/article/${site.slug}/${a.slug}`, name: a.title })) },
  ]

  const JEWISH = ['jewish-news-now','jewish-property-report','aliya-today']

  return (
    <>
      <TrackView siteSlug={site.slug} siteDomain={host} />
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      {JEWISH.includes(site.slug)
        ? <JewishTemplate site={site} articles={articles || []} />
        : <DynamicTemplate site={site} articles={articles || []} />}
    </>
  )
}
