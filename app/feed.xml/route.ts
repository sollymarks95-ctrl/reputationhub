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

export async function GET(req: NextRequest) {
  const host = (req.headers.get('host') || '').replace(':3000','').replace('www.','')
  
  // Find which site this request is for
  let siteSlug = ''
  for (const [slug, meta] of Object.entries(SITE_META)) {
    if (meta.domain === host || meta.domain.replace('www.','') === host) {
      siteSlug = slug; break
    }
  }
  
  // Fallback: try x-site-slug header set by middleware
  if (!siteSlug) siteSlug = req.headers.get('x-site-slug') || 'global-trade-wire'
  
  const meta = SITE_META[siteSlug] || SITE_META['global-trade-wire']
  const base = `https://${meta.domain}`

  // Get latest 50 articles
  const { data: articles } = await db
    .from('news_articles')
    .select('title, slug, excerpt, body, published_at, category, tags, author_name')
    .eq('status', 'published')
    .eq('news_site_id', 
      (await db.from('news_sites').select('id').eq('slug', siteSlug).single()).data?.id
    )
    .order('published_at', { ascending: false })
    .limit(50)

  const escape = (s: string) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const stripHtml = (s: string) => (s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()

  const items = (articles || []).map(a => {
    const url = `${base}/article/${siteSlug}/${a.slug}`
    const desc = escape(a.excerpt || stripHtml(a.body || '').slice(0, 300))
    const cats = [a.category, ...(a.tags || [])].filter(Boolean).slice(0,3)
    return `
    <item>
      <title>${escape(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${desc}</description>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      <author>contact@${meta.domain} (${escape(a.author_name || 'Solly Marks')})</author>
      ${cats.map(c => `<category>${escape(c)}</category>`).join('')}
      <source url="${base}/feed.xml">${escape(meta.name)}</source>
    </item>`
  }).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escape(meta.name)}</title>
    <link>${base}</link>
    <description>${escape(meta.desc)}</description>
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
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    }
  })
}
