import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getArticleImage } from '@/app/lib/articleImages'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

// Service role key bypasses RLS
function getDb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'') }

// Hardcoded core portals (always run, never removed)
const CORE_SITES = [
  { id:'4d048bde-1dcd-4891-8434-a7960ab9d3ae', name:'Nex-Wire Intelligence', slug:'global-trade-wire', domain:'nex-wire.com', author:'David Hart', topics:[
    'EUR/USD exchange rate today analysis','gold price today market update','Federal Reserve interest rate decision latest','global trade breaking news today','oil price Brent crude today','Bitcoin cryptocurrency market today',
    'GBP USD British pound analysis today','S&P 500 stock market today','China trade economic policy latest','forex market volatility today','emerging markets currency outlook today','US dollar index DXY today',
    'commodity markets overview today','geopolitical risk financial markets today','central bank policy update today','inflation data economic report today','treasury bond yields market today','Asian markets overnight update',
    'European markets open today','Wall Street pre-market analysis today','crude oil OPEC supply news today','natural gas energy market today','copper metals industrial outlook today','cryptocurrency altcoin market today',
    'trade balance economic data today','retail sales consumer data today','manufacturing PMI economic today','jobless claims unemployment today','housing market real estate today','mergers acquisitions deal news today',
  ]},
  { id:'48bed332-6525-4d76-aaa5-6d10a5112d77', name:'Finvexx Markets', slug:'finance-terminal', domain:'finvexx.com', author:'Marcus Webb', topics:[
    'S&P 500 market analysis today','Federal Reserve monetary policy latest','gold investment strategy today','corporate earnings results today','social trading platform regulation today','Bitcoin ETF institutional flows today',
    'hedge fund market positioning latest','EUR USD technical analysis today','crude oil price forecast today','financial sector regulation news today','emerging market currencies today','interest rate impact markets today',
    'equity market outlook today','bond yields treasury today','financial technology news today','IPO stock market listings today','dividend stocks analysis today','options trading market today',
    'short selling hedge funds today','quantitative easing central banks today','banking sector earnings today','insurance financial news today','asset management fund flows today','derivatives futures markets today',
    'currency war dollar policy today','semiconductor tech stocks today','energy stocks oil gas today','healthcare biotech stocks today','consumer spending retail stocks today','transportation logistics stocks today',
  ]},
  { id:'c0f14745-8189-444d-af09-39d7248fa319', name:'Bizplezx Executive', slug:'business-pulse', domain:'bizplezx.com', author:'Claire Sterling', topics:[
    'fintech banking industry news today','AI artificial intelligence financial services','financial sector M&A today','ESG sustainable finance news today','financial regulation compliance today','digital banking transformation today',
    'executive leadership strategy news today','private equity venture capital today','financial technology startup funding today','corporate governance news today','wealth management industry today','payments industry innovation today',
    'open banking news today','financial services consumer trends today','insurtech insurance technology today','blockchain enterprise business today','digital assets institutional adoption today','regtech compliance technology today',
    'neobank challenger bank news today','embedded finance news today','financial inclusion global trends today','cross-border payments news today','buy-now-pay-later industry today','robo-advisor wealth tech today',
    'cryptocurrency exchange regulation today','data privacy financial services today','cybersecurity financial sector today','cloud banking infrastructure today','API economy financial services today','sustainability green bonds today',
  ]},
  { id:'3b440202-e1c3-4f54-8a4e-65cf7e7dbfe1', name:'AurexHQ', slug:'gold-markets-today', domain:'aurexhq.com', author:'James Calloway', topics:[
    'gold price today spot market','silver price today analysis','precious metals market overview today','gold ETF institutional flows today','central bank gold reserves latest','gold vs inflation hedge today',
    'platinum price today analysis','palladium rhodium prices today','gold mining stocks news today','commodity markets gold outlook today','gold technical analysis forecast today','silver industrial demand today',
    'gold futures options market today','physical gold demand today','gold refining industry news today','gold royalty streaming companies today','gold exploration discovery news today','China gold demand imports today',
    'India gold market jewellery today','Middle East gold buying today','gold lease rates LBMA today','gold options volatility today','gold seasonal patterns today','gold currency correlation today',
    'gold geopolitical safe haven today','gold supply mine production today','gold recycling scrap market today','gold standard debate economics today','gold silver ratio today','precious metals ETF flows today',
  ]},
  { id:'6ae7e692-bce9-489d-b835-87dcba9ffc47', name:'Verivex Trust', slug:'trust-score', domain:'verivex.co', author:'Anna Reid', topics:[
    'social trading platform regulation 2026','CySEC FCA regulated brokers today','broker regulation news today','regulated vs unregulated platform','investor protection regulation news','broker withdrawal process today',
    'financial watchdog enforcement today','safe trading platform checklist 2026','trading platform review methodology','financial consumer protection news today','FCA regulated platform news today','ASIC regulated broker update today',
    'broker license verification today','financial ombudsman complaints today','trading platform transparency today','broker segregated funds protection today','financial regulation MiFID II today','investor compensation scheme news today',
    'platform security trading today','KYC AML compliance news today','trading platform fee comparison today','broker execution quality standards today','financial dispute resolution today','trading platform risk warnings today',
    'social trading copy trading regulation','CFD leverage regulation update today','forex regulation global update today','binary options regulation today','trading app regulation news today','financial advisor regulation today',
  ]},
]

// Dynamically load ALL active sites from DB and merge with core portals
async function getAllSites() {
  const db = getDb()
  const { data: dbSites } = await db
    .from('news_sites')
    .select('id,name,slug,domain,topics,template_config')
    .eq('is_active', true)
    .not('topics', 'is', null)
    .limit(200)
  
  if (!dbSites || dbSites.length === 0) return CORE_SITES
  
  const coreSlugSet = new Set(CORE_SITES.map((s: any) => s.slug))
  
  const dynamicSites = dbSites
    .filter((s: any) => !coreSlugSet.has(s.slug) && s.topics && s.topics.length > 0)
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      domain: s.domain,
      author: 'Editorial Team',
      topics: s.topics || [],
    }))
  
  return [...CORE_SITES, ...dynamicSites]
}

const PORTAL_URLS: Record<string,string> = {
  'nex-wire.com':   'https://nex-wire.com',
  'finvexx.com':    'https://finvexx.com',
  'bizplezx.com':   'https://bizplezx.com',
  'aurexhq.com':    'https://aurexhq.com',
  'verivex.co':     'https://verivex.co',
  'signalix.com':   'https://signalix.com',
  'tradvex.com':    'https://tradvex.com',
  'invexhub.com':   'https://invexhub.com',
  'presxwire.com':  'https://presxwire.com',
  'bizpedia.com':   'https://bizpedia.com',
  'certivade.com':  'https://certivade.com',
  'execvex.com':    'https://execvex.com',
}

function slugify(s: string) {
  const d = new Date()
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)+'-'+ts
}

async function getActiveClients() {
  const { data } = await getDb().from('portal_clients')
    .select('id,company_name,brand_slug,regulation,industry,website_url')
    .eq('is_active', true).limit(20)
  return data || []
}

async function getCrossPortalLinks(clientName: string, excludeSiteId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await getDb().from('news_articles')
    .select('title,slug,news_site_id')
    .ilike('body', `%${clientName}%`)
    .eq('status','published')
    .gte('published_at', today+'T00:00:00')
    .neq('news_site_id', excludeSiteId)
    .limit(3)
  if (!data || data.length === 0) return []
  return data.map((a:any) => {
    const site = CORE_SITES.find((s:any) => s.id === a.news_site_id)
    if (!site) return null
    const base = PORTAL_URLS[site.domain] || 'https://rephuby.com'
    return { title: a.title, url: `${base}/article/${site.slug}/${a.slug}`, portal: site.name }
  }).filter(Boolean) as any[]
}

async function writeArticle(site: any, topic: string, client: any, crossLinks: any[]): Promise<any> {
  const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
  const base = PORTAL_URLS[site.domain] || 'https://rephuby.com'

  const crossLinkBlock = crossLinks.length > 0
    ? `\n\nNaturally reference 1-2 of these related articles from our partner publications:\n${crossLinks.map(l=>`- "${l.title}" (${l.portal}): ${l.url}`).join('\n')}\nWeave in as: "As ${crossLinks[0]?.portal} reported..." or "According to ${crossLinks[0]?.portal}..."`
    : ''

  const brandNote = client
    ? `\n\nEDITORIAL NOTE: Somewhere in the article, include ONE natural reference to "${client.company_name}" as an example of a firm in this space. Brief and factual — like a journalist citing a real company. E.g. "...platforms such as ${client.company_name}, which operates under FCA, CySEC and ASIC regulation..." Do NOT make it promotional.${crossLinkBlock}`
    : crossLinkBlock

  const prompt = `Search for the latest real news about: "${topic}"

Write a 750-900 word professional financial news article using ONLY verified information from search results.

Rules:
- Real prices and data from search only — never invent numbers
- Bloomberg/Reuters quality — factual, authoritative, neutral
- Strong SEO headline with main keyword in the title
- No bullet points in body — flowing paragraphs only
- Include a "What This Means" or "Outlook" section near the end
- 3-5 relevant tags for this topic${brandNote}

Return ONLY valid JSON (no markdown, no backticks):
{"title":"...","excerpt":"...","body":"...","category":"Markets","tags":["tag1","tag2","tag3"],"cover_image_url":"https://..."}

For cover_image_url: find a direct image URL from your search results (jpg/png from a news site, financial publication, or stock photo). Must be a real https:// image URL from search results. If none found use "".`

  // Retry up to 3 times with backoff for rate limits / overloads
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json','x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `You are a senior financial journalist for ${site.name} (${base}). Today is ${today}. Write REAL verified financial news. Output valid JSON only.`,
        messages: [{ role:'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(80000),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('Anthropic API error:', res.status, errText.slice(0,300))
      return null
    }
    const data = await res.json()
    const text = (data.content||[]).filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('')
    const clean = text.replace(/```json|```/g,'').trim()
    const start = clean.indexOf('{'); const end = clean.lastIndexOf('}')
    if (start===-1||end===-1) return null
    const parsed = JSON.parse(clean.slice(start,end+1))
    if (!parsed.title||!parsed.body) return null
    return parsed
  } catch(e) {
    console.error('writeArticle error:', topic, (e as Error).message)
    return null
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') || req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && secret !== 'REDACTED_CRON_SECRET') {
    return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  }

  // 5 batches per day × 6 articles per portal = 30 articles/portal/day
  const batch = parseInt(req.nextUrl.searchParams.get('batch') || '0')
  const BATCH_SIZE = 6
  const batchStart = batch * BATCH_SIZE
  const batchEnd = batchStart + BATCH_SIZE

  let clients = await getActiveClients()
  // Hardcoded fallback — cron must ALWAYS run regardless of DB client query
  if (clients.length === 0) {
    clients = [{ id:'a1b2c3d4-0000-0000-0000-000000000001', company_name:'eToro', brand_slug:'etoro', regulation:'FCA, CySEC, ASIC', industry:'social trading', website_url:'https://www.etoro.com' }]
  }

  const results: any[] = []
  let totalInserted = 0

  const ALL_SITES = CORE_SITES

  // Write articles for ALL sites in PARALLEL per topic round
  // Each round: all 5 portals write the same topic index simultaneously
  // Time: BATCH_SIZE rounds × (API_time + delay) = ~80s total ✅
  const siteCounters: Record<string, number> = {}
  ALL_SITES.forEach((s: any) => { siteCounters[s.slug] = 0 })

  for (let i = 0; i < BATCH_SIZE; i++) {
    const globalIndex = batchStart + i
    const isBrandArticle = (globalIndex % 3 === 0)
    const client = isBrandArticle ? clients[0] : null
    const crossLinks = isBrandArticle ? await getCrossPortalLinks(client, ALL_SITES) : []

    // Write topic i for ALL sites simultaneously
    await Promise.all(ALL_SITES.map(async (site: any) => {
      const topic = site.topics[batchStart + i]
      if (!topic) return

      const article = await writeArticle(site, topic, client, crossLinks)
      if (!article) { console.log(`Skipped: ${site.slug} / ${topic}`); return }

      const slug = slugify(article.title)
      const { data: existing } = await getDb().from('news_articles').select('id').eq('slug', slug).single()
      if (existing) return

      const { data: inserted, error } = await getDb().from('news_articles').insert({
        news_site_id: site.id,
        title: article.title,
        slug,
        excerpt: article.excerpt || '',
        body: article.body || '',
        category: article.category || 'Markets',
        tags: Array.isArray(article.tags) ? article.tags : [],
        author_name: site.author,
        cover_image_url: getArticleImage(article.category || 'Markets', slug),
        status: 'published',
        published_at: new Date().toISOString(),
        is_featured: i === 0 && batchStart === 0,
        ai_generated: true,
        read_time_minutes: Math.ceil((article.body || '').split(' ').length / 200),
      }).select().single()

      if (error) { console.error('Insert error:', error.message); return }
      if (!inserted) return

      totalInserted++
      siteCounters[site.slug] = (siteCounters[site.slug] || 0) + 1

      // Sync brand articles to portal_content
      if (inserted.id && isBrandArticle && clients[0]) {
        const PMAP: Record<string,{name:string,domain:string}> = {
          'global-trade-wire':  { name:'Nex-Wire',  domain:'nex-wire.com' },
          'finance-terminal':   { name:'Finvexx',   domain:'finvexx.com' },
          'business-pulse':     { name:'Bizplezx',  domain:'bizplezx.com' },
          'gold-markets-today': { name:'AurexHQ',   domain:'aurexhq.com' },
          'trust-score':        { name:'Verivex',   domain:'verivex.co' },
        }
        const pInfo = PMAP[site.slug]
        if (pInfo) {
          const articleUrl = `https://${pInfo.domain}/article/${site.slug}/${slug}`
          const contentType = article.category?.toLowerCase().includes('review') ? 'review' : 'article'
          await getDb().from('portal_content').insert({
            client_id: clients[0].id,
            portal_name: pInfo.name,
            portal_domain: pInfo.domain,
            news_article_id: inserted.id,
            title: article.title,
            article_url: articleUrl,
            content_type: contentType,
            published_at: new Date().toISOString(),
            views: 0,
            backlink_value: 65,
            status: 'live',
          }).then(() => {}).catch(() => {})
        }
      }
    }))

    // Brief pause between rounds to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000))
  }

  // Build results from counters
  ALL_SITES.forEach((site: any) => {
    results.push({ site: site.name, inserted: siteCounters[site.slug] || 0 })
  })

  return NextResponse.json({
    message: `Batch ${batch} complete — ${totalInserted} articles across ${ALL_SITES.length} portals`,
    results,
    timestamp: new Date().toISOString(),
  })
}
