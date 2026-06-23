import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SITE_META: Record<string, { name: string; domain: string; desc: string; category: string }> = {
  'global-trade-wire':     { name:'Nex-Wire', domain:'nex-wire.com', desc:'Global trade intelligence, market analysis and financial news', category:'Finance' },
  'finance-terminal':      { name:'Finvexx', domain:'finvexx.com', desc:'Financial markets, investment analysis and economic intelligence', category:'Finance' },
  'business-pulse':        { name:'Bizplezx', domain:'bizplezx.com', desc:'Business strategy, market intelligence and executive analysis', category:'Business' },
  'gold-markets-today':    { name:'AurexHQ', domain:'aurexhq.com', desc:'Gold, silver and commodities market analysis and pricing', category:'Commodities' },
  'trust-score':           { name:'Verivex', domain:'verivex.co', desc:'Broker reviews, financial ratings and trust intelligence', category:'Finance' },
  'invest-data':           { name:'InvexHuby', domain:'invexhuby.com', desc:'Investment data, portfolio strategy and market research', category:'Investing' },
  'market-radar':          { name:'Signalixx', domain:'signalixx.com', desc:'Trading signals, technical analysis and market alerts', category:'Trading' },
  'executive-network':     { name:'ExecVex', domain:'execvex.com', desc:'Executive strategy, leadership intelligence and C-suite analysis', category:'Business' },
  'crypto-hub':            { name:'CryptoXos', domain:'cryptoxos.com', desc:'Cryptocurrency analysis, blockchain intelligence and DeFi coverage', category:'Crypto' },
  'fx-vexx':               { name:'FXVexx', domain:'fxvexx.com', desc:'Forex markets, currency analysis and FX trading intelligence', category:'Forex' },
  'trade-hub-iq':          { name:'TradeHubIQ', domain:'tradehubiq.com', desc:'Trade finance, import-export intelligence and global commerce', category:'Trade' },
  'aliya-today':           { name:'AliyaToday', domain:'aliyatoday.com', desc:'Practical aliyah guides, real costs, and step-by-step advice for English-speaking Jews moving to Israel', category:'Aliyah' },
  'jewish-news-now':       { name:'JewishNewsNow', domain:'jewishnewsnow.com', desc:'Breaking news and analysis for the global Jewish community and Israel watchers', category:'Jewish News' },
  'jewish-property-report':{ name:'JewishPropertyReport', domain:'jewishpropertyreport.com', desc:'Israeli real estate prices, buyer guides and property market data for diaspora Jewish investors', category:'Real Estate' },
  'copy-trade-iq':         { name:'CopyVexx', domain:'copyvexx.com', desc:'Copy trading strategies, social trading guides and platform reviews for retail investors worldwide', category:'Copy Trading' },
  'expat-invest-iq':       { name:'ExpatInvestIQ', domain:'expatinvestiq.com', desc:'Investing guides for expats and international investors — brokers, tax, platforms and strategies', category:'Expat Investing' },
  'rephuby-intelligence':  { name:'RepHuby', domain:'rephuby.com', desc:'Reputation intelligence for financial brands and institutional analysis', category:'Finance' },
}

// Seed queries per site — fed into SearchAPI to get real People Also Ask + Related Searches
const SEED_QUERIES: Record<string, string[]> = {
  'aliya-today':            ['making aliyah 2026', 'how to make aliyah', 'aliyah process israel'],
  'jewish-news-now':        ['jewish news today', 'israel news 2026', 'antisemitism latest'],
  'jewish-property-report': ['israel real estate 2026', 'buy apartment israel', 'tel aviv property prices'],
  'global-trade-wire':      ['global trade news today', 'forex markets today', 'stock market news'],
  'finance-terminal':       ['financial markets today', 'investment news 2026', 'market analysis'],
  'business-pulse':         ['business news today', 'executive strategy', 'corporate news'],
  'gold-markets-today':     ['gold price today', 'commodities markets', 'silver price'],
  'trust-score':            ['best broker reviews 2026', 'regulated brokers', 'forex broker comparison'],
  'invest-data':            ['investment strategies 2026', 'portfolio management', 'stock picks'],
  'market-radar':           ['trading signals today', 'technical analysis', 'market alerts'],
  'executive-network':      ['executive leadership news', 'CEO strategy', 'business intelligence'],
  'crypto-hub':             ['crypto news today', 'bitcoin price', 'ethereum 2026'],
  'fx-vexx':                ['forex trading today', 'currency exchange rates', 'fx market news'],
  'trade-hub-iq':           ['trade finance news', 'import export news', 'global commerce'],
  'copy-trade-iq':          ['copy trading platforms 2026', 'best copy trading', 'social trading'],
  'expat-invest-iq':        ['expat investing guide', 'offshore investment 2026', 'invest abroad'],
  'rephuby-intelligence':   ['financial brand reputation', 'fintech news', 'financial services'],
}

// Fetch real Google search intent via SearchAPI.io
// Returns the actual queries people are typing — People Also Ask + Related Searches
async function fetchRealSearchQueries(siteSlug: string, apiKey: string): Promise<string[]> {
  const seeds = SEED_QUERIES[siteSlug] || ['news today']
  const allQueries: string[] = []

  // Run 2 seed queries in parallel (cost-efficient — each returns ~20 real queries)
  const results = await Promise.allSettled(seeds.slice(0, 2).map(async seed => {
    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: seed,
        api_key: apiKey,
        gl: 'us',
        hl: 'en',
        num: '10', // we don't need organic results, just PAA + related
      })
      const r = await fetch(`https://www.searchapi.io/api/v1/search?${params}`, {
        signal: AbortSignal.timeout(12000),
      })
      if (!r.ok) return []
      const data = await r.json()

      const queries: string[] = []
      // People Also Ask — highest intent, real questions people search
      for (const paa of (data.related_questions || [])) {
        if (paa.question) queries.push(paa.question.toLowerCase())
      }
      // Related Searches — high-volume adjacent queries
      for (const rs of (data.related_searches || [])) {
        if (rs.query) queries.push(rs.query.toLowerCase())
      }
      return queries
    } catch { return [] }
  }))

  for (const r of results) {
    if (r.status === 'fulfilled') allQueries.push(...r.value)
  }

  return [...new Set(allQueries)] // dedupe
}

// Score how well an article matches real search queries
// Returns 0–70 pts based on how many query words appear in title/excerpt
function searchIntentScore(article: any, realQueries: string[]): number {
  const haystack = `${article.title} ${article.excerpt || ''}`.toLowerCase()
  let pts = 0

  for (const query of realQueries) {
    const words = query.split(/\s+/).filter((w: string) => w.length >= 4)
    const matched = words.filter((w: string) => haystack.includes(w))
    if (matched.length >= 2) pts += 10      // strong match — multiple words hit
    else if (matched.length === 1) pts += 4  // weak match — one word hit
    if (pts >= 70) break                     // cap at 70
  }

  return Math.min(pts, 70)
}

function viewScore(views: number): number {
  if (!views || views <= 0) return 0
  return Math.min(Math.round(Math.log10(views + 1) * 10), 20)
}

function freshnessScore(publishedAt: string): number {
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000
  if (ageHours <= 24) return 10
  if (ageHours <= 48) return 6
  if (ageHours <= 72) return 3
  return 0
}

export async function GET(req: NextRequest) {
  const host = (req.headers.get('host') || '').replace(':3000','').replace('www.','')

  let siteSlug = ''
  for (const [slug, meta] of Object.entries(SITE_META)) {
    if (meta.domain === host || meta.domain.replace('www.','') === host) {
      siteSlug = slug; break
    }
  }
  if (!siteSlug) siteSlug = req.headers.get('x-site-slug') || 'global-trade-wire'

  const meta = SITE_META[siteSlug] || SITE_META['global-trade-wire']
  const base = `https://${meta.domain}`

  // ── Resolve SearchAPI key ──────────────────────────────────────────────────
  let apiKey = process.env.SEARCHAPI_KEY || process.env.SERPAPI_KEY || ''
  if (!apiKey) {
    const { data } = await db.from('system_api_keys')
      .select('key_value')
      .in('key_name', ['SEARCHAPI_KEY', 'SERPAPI_KEY'])
      .eq('is_active', true)
      .limit(1).single()
    apiKey = data?.key_value || ''
  }

  // ── Fetch articles (last 7 days) + real search queries in parallel ─────────
  const { data: siteRow } = await db.from('news_sites').select('id').eq('slug', siteSlug).single()
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [{ data: articles }, realQueries] = await Promise.all([
    db.from('news_articles')
      .select('id, title, slug, excerpt, body, published_at, category, tags, author_name, views')
      .eq('status', 'published')
      .eq('news_site_id', siteRow?.id)
      .gte('published_at', since7d)
      .order('published_at', { ascending: false })
      .limit(100),
    apiKey ? fetchRealSearchQueries(siteSlug, apiKey) : Promise.resolve([]),
  ])

  // ── Score every article ────────────────────────────────────────────────────
  const scored = (articles || []).map((a: any) => {
    const intentPts  = searchIntentScore(a, realQueries)
    const viewPts    = viewScore(a.views || 0)
    const freshPts   = freshnessScore(a.published_at)
    return { ...a, _score: intentPts + viewPts + freshPts, _intentPts: intentPts, _viewPts: viewPts, _freshPts: freshPts }
  })

  const top10 = scored
    .sort((a: any, b: any) => b._score - a._score)
    .slice(0, 10)

  // ── Build RSS ──────────────────────────────────────────────────────────────
  const escape    = (s: string) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const stripHtml = (s: string) => (s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()

  const queryPreview = realQueries.slice(0, 5).map(q => escape(q)).join('; ')

  const items = top10.map((a: any) => {
    const url      = `${base}/article/${siteSlug}/${a.slug}`
    const desc     = escape(a.excerpt || stripHtml(a.body || '').slice(0, 300))
    const fullBody = (a.body || '').replace(/]]>/g, ']]]]><![CDATA[>')
    const cats     = [a.category, ...(a.tags || [])].filter(Boolean).slice(0, 3)
    return `
    <item>
      <title>${escape(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${desc}</description>
      <content:encoded><![CDATA[${fullBody}]]></content:encoded>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      <author>contact@${meta.domain} (${escape(a.author_name || 'Solly Marks')})</author>
      ${cats.map((c: string) => `<category>${escape(c)}</category>`).join('')}
      <source url="${base}/feed.xml">${escape(meta.name)}</source>
      <!-- score:${a._score} intent:${a._intentPts} views:${a._viewPts} fresh:${a._freshPts} -->
    </item>`
  }).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Real search queries used for ranking: ${queryPreview} -->
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escape(meta.name)} — Most Searched Now</title>
    <link>${base}</link>
    <description>Top ${top10.length} articles ranked by what people are actually searching on Google right now — real People Also Ask + Related Searches matched to content. ${escape(meta.desc)}</description>
    <language>en-GB</language>
    <category>${escape(meta.category)}</category>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    <managingEditor>contact@${meta.domain} (Solly Marks)</managingEditor>
    <webMaster>contact@${meta.domain} (Solly Marks)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>30</ttl>
    <image>
      <url>https://picsum.photos/seed/${siteSlug}/144/144</url>
      <title>${escape(meta.name)}</title>
      <link>${base}</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    }
  })
}
