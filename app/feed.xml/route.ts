import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// ── Virality scoring ──────────────────────────────────────────────────────────
// Two signals combined:
//
// 1. TREND MATCH (0–60 pts): article title/excerpt overlaps with topics already
//    pulled from Google Trends + Reddit + news RSS by cron-trends and stored in
//    the trending_topics table. Each matched trending keyword contributes its
//    stored score (normalised 0–10) so high-search-volume terms count more.
//
// 2. REAL VIEWS (0–30 pts): actual page_view counts recorded by track-view.
//    Capped at 30 pts to stop a single viral outlier from drowning the rest.
//
// 3. FRESHNESS (0–10 pts): articles published in the last 24 h get a recency
//    bonus — trending content decays fast, so fresh articles on hot topics
//    are a better bet than stale ones on the same topic.
//
// Total max = 100 pts. Top 10 articles by score go into the feed.

function trendScore(article: any, trendingPhrases: { topic: string; score: number }[]): number {
  const haystack = `${article.title} ${article.excerpt || ''}`.toLowerCase()
  let pts = 0
  for (const { topic, score } of trendingPhrases) {
    // Match any word of the trend phrase that is ≥ 4 chars (skip filler words)
    const words = topic.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 4)
    if (words.some((w: string) => haystack.includes(w))) {
      pts += Math.min(score || 5, 10) // each matched trend contributes up to 10 pts
    }
  }
  return Math.min(pts, 60) // cap at 60
}

function viewScore(views: number): number {
  // Logarithmic: 1 view → ~3 pts, 10 views → ~10 pts, 100 views → ~20 pts, 1000+ views → 30 pts
  if (!views || views <= 0) return 0
  return Math.min(Math.round(Math.log10(views + 1) * 10), 30)
}

function freshnessScore(publishedAt: string): number {
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000
  if (ageHours <= 24)  return 10
  if (ageHours <= 48)  return 6
  if (ageHours <= 72)  return 3
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

  // ── Fetch candidates: last 7 days (wider pool = better trend matching) ───
  const { data: siteRow } = await db.from('news_sites').select('id').eq('slug', siteSlug).single()
  const siteId = siteRow?.id
  if (!siteId) return new NextResponse('Site not found', { status: 404 })

  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [{ data: articles }, { data: trending }] = await Promise.all([
    db.from('news_articles')
      .select('id, title, slug, excerpt, body, published_at, category, tags, author_name, views')
      .eq('status', 'published')
      .eq('news_site_id', siteId)
      .gte('published_at', since7d)
      .order('published_at', { ascending: false })
      .limit(100), // pool of candidates to score

    db.from('trending_topics')
      .select('topic, score')
      .eq('site_slug', siteSlug)
      .gte('date', new Date(Date.now() - 3 * 86_400_000).toISOString().split('T')[0]) // last 3 days of trends
      .order('score', { ascending: false })
      .limit(200),
  ])

  const trendingPhrases = (trending || []) as { topic: string; score: number }[]

  // ── Score every article ────────────────────────────────────────────────────
  const scored = (articles || []).map((a: any) => ({
    ...a,
    _score: trendScore(a, trendingPhrases) + viewScore(a.views || 0) + freshnessScore(a.published_at),
    _trendPts: trendScore(a, trendingPhrases),
    _viewPts:  viewScore(a.views || 0),
    _freshPts: freshnessScore(a.published_at),
  }))

  // Sort by score desc, take top 10
  const top10 = scored
    .sort((a: any, b: any) => b._score - a._score)
    .slice(0, 10)

  // ── Build RSS ──────────────────────────────────────────────────────────────
  const escape = (s: string) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const stripHtml = (s: string) => (s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()

  const items = top10.map((a: any) => {
    const url  = `${base}/article/${siteSlug}/${a.slug}`
    const desc = escape(a.excerpt || stripHtml(a.body || '').slice(0, 300))
    const fullBody = (a.body || '').replace(/]]>/g, ']]]]><![CDATA[>')
    const cats = [a.category, ...(a.tags || [])].filter(Boolean).slice(0, 3)
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
      <!-- virality score: ${a._score}/100 (trends:${a._trendPts} views:${a._viewPts} freshness:${a._freshPts}) -->
    </item>`
  }).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escape(meta.name)} — Trending Now</title>
    <link>${base}</link>
    <description>Top ${top10.length} articles most likely to go viral — ranked by Google Trends match, real reader traffic, and freshness. ${escape(meta.desc)}</description>
    <language>en-GB</language>
    <category>${escape(meta.category)}</category>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    <managingEditor>contact@${meta.domain} (Solly Marks)</managingEditor>
    <webMaster>contact@${meta.domain} (Solly Marks)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
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
      'Cache-Control': 'public, max-age=1800, s-maxage=1800', // refresh every 30 min
    }
  })
}
