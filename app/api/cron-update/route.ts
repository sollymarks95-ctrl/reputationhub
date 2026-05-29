import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cron must use service role key to bypass RLS — anon key can't read portal_clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
import { generateArticleImage } from '@/app/api/admin/generate-image/route'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

// 3 live portals — 30 topics each split into 3 batches of 10 (morning / midday / afternoon)
const ALL_SITES = [
  { id:'4d048bde-1dcd-4891-8434-a7960ab9d3ae', name:'Nex-Wire Intelligence', slug:'global-trade-wire', domain:'nex-wire.com', author:'David Hart', topics:[
    'EUR/USD exchange rate today analysis','gold price today market update','Federal Reserve interest rate decision latest','global trade breaking news today','oil price Brent crude today',
    'Bitcoin cryptocurrency market today','GBP USD British pound analysis today','S&P 500 stock market today','China trade economic policy latest','forex market volatility today',
    'emerging markets currency outlook today','US dollar index DXY today','commodity markets overview today','geopolitical risk financial markets today','central bank policy update today',
    'inflation data economic report today','treasury bond yields market today','Asian markets overnight update','European markets open today','Wall Street pre-market analysis today',
    'crude oil OPEC supply news today','natural gas energy market today','copper metals industrial outlook today','cryptocurrency altcoin market today','trade balance economic data today',
    'retail sales consumer data today','manufacturing PMI economic today','jobless claims unemployment today','housing market real estate today','mergers acquisitions deal news today',
  ]},
  { id:'48bed332-6525-4d76-aaa5-6d10a5112d77', name:'Finvexx Markets', slug:'finance-terminal', domain:'finvexx.com', author:'Marcus Webb', topics:[
    'S&P 500 market analysis today','Federal Reserve monetary policy latest','gold investment strategy today','corporate earnings results today','social trading platform regulation today',
    'Bitcoin ETF institutional flows today','hedge fund market positioning latest','EUR USD technical analysis today','crude oil price forecast today','financial sector regulation news today',
    'emerging market currencies today','interest rate impact markets today','equity market outlook today','bond yields treasury today','financial technology news today',
    'IPO stock market listings today','dividend stocks analysis today','options trading market today','short selling hedge funds today','quantitative easing central banks today',
    'banking sector earnings results today','insurance sector financial news today','asset management fund flows today','derivatives futures markets today','currency war dollar policy today',
    'semiconductor tech stocks today','energy stocks oil gas today','healthcare biotech stocks today','consumer spending retail stocks today','transportation logistics stocks today',
  ]},
  { id:'c0f14745-8189-444d-af09-39d7248fa319', name:'Bizplezx Executive', slug:'business-pulse', domain:'bizplezx.com', author:'Claire Sterling', topics:[
    'fintech banking industry news today','AI artificial intelligence financial services','financial sector M&A today','ESG sustainable finance news today','financial regulation compliance today',
    'digital banking transformation today','executive leadership strategy news today','private equity venture capital today','financial technology startup funding today','corporate governance news today',
    'wealth management industry today','payments industry innovation today','open banking news today','financial services consumer trends today','insurtech insurance technology today',
    'blockchain enterprise business today','digital assets institutional adoption today','regtech compliance technology today','neobank challenger bank news today','embedded finance news today',
    'financial inclusion global trends today','cross-border payments news today','buy-now-pay-later industry today','robo-advisor wealth tech today','cryptocurrency exchange regulation today',
    'data privacy financial services today','cybersecurity financial sector today','cloud banking infrastructure today','API economy financial services today','sustainability finance green bonds today',
  ]},
]

// Portal cross-reference map — used for inter-portal linking
const PORTAL_URLS: Record<string, string> = {
  'nex-wire.com':   'https://nex-wire.com',
  'finvexx.com':    'https://finvexx.com',
  'bizplezx.com':   'https://bizplezx.com',
  'aurexhq.com':    'https://rephuby.com/commodities/gold-markets-today',
  'verivex.co':     'https://rephuby.com/reviews-hub/trust-score',
  'bizpedia.com':   'https://rephuby.com/wiki/company-pedia',
  'presxwire.com':  'https://rephuby.com/pressroom/press-central',
  'invexhub.com':   'https://rephuby.com/investdb/invest-data',
  'tradvex.com':    'https://rephuby.com/forum/trade-board',
  'certivade.com':  'https://rephuby.com/association/global-trade-assoc',
  'execvex.com':    'https://rephuby.com/executive/executive-network',
  'signalix.com':   'https://rephuby.com/market-radar/market-radar',
}

function slugify(s: string) {
  const d = new Date()
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)+'-'+ts
}

async function getActiveClients() {
  const { data } = await supabase.from('portal_clients')
    .select('id,company_name,brand_slug,regulation,industry,website_url')
    .eq('is_active', true).limit(20)
  return data || []
}

// Get today's articles from other portals mentioning this client — for cross-linking
async function getCrossPortalLinks(clientName: string, excludeSiteId: string): Promise<Array<{title:string, url:string, portal:string}>> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase.from('news_articles')
    .select('title, slug, news_site_id')
    .ilike('body', `%${clientName}%`)
    .eq('status', 'published')
    .gte('published_at', today + 'T00:00:00')
    .neq('news_site_id', excludeSiteId)
    .limit(4)
  if (!data || data.length === 0) return []
  return data.map((a: any) => {
    const site = ALL_SITES.find(s => s.id === a.news_site_id)
    if (!site) return null
    const baseUrl = PORTAL_URLS[site.domain] || `https://rephuby.com`
    return { title: a.title, url: `${baseUrl}/article/${site.slug}/${a.slug}`, portal: site.name }
  }).filter(Boolean) as any[]
}

async function writeArticle(site: typeof ALL_SITES[0], topic: string, client: any, crossLinks: Array<{title:string,url:string,portal:string}>): Promise<any> {
  const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
  const clientDomain = PORTAL_URLS[site.domain] || `https://rephuby.com`

  const crossLinkBlock = crossLinks.length > 0
    ? `\n\nCROSS-PORTAL LINKS (include these naturally in the article body):
${crossLinks.map(l => `- "${l.title}" covered by ${l.portal}: ${l.url}`).join('\n')}
Weave 1-2 of these as natural in-text references: "As ${crossLinks[0]?.portal} reported..." or "According to analysis from ${crossLinks[0]?.portal}..."`
    : ''

  // 20% of articles mention brand — the rest are pure credible financial journalism
  const brandSection = client ? `

EDITORIAL NOTE — BRAND MENTION (natural, non-promotional):
Somewhere in the article body, include ONE natural reference to "${client.company_name}" as a real-world example of a firm in this space. Example: "...platforms such as ${client.company_name}, which operates under FCA, CySEC and ASIC regulation..." Keep it brief, factual, editorial — like a journalist would cite any named firm. Do NOT make the article about them. Do NOT use promotional language.
${crossLinkBlock}` : ''

  const prompt = `Search for the latest real news about: "${topic}"

Write a 750-900 word professional financial news article using ONLY verified information from search results.

ARTICLE RULES:
- Real prices/data from search only — never invent numbers
- Bloomberg/Reuters quality — factual, authoritative, neutral
- Strong SEO headline with main keyword in the title
- No bullet points in article body — flowing paragraphs only
- Include a "What This Means" section near the end
- Tags: 3-5 relevant keywords for this topic${brandSection}

Return ONLY valid JSON (no markdown, no backticks):
{"title":"...","excerpt":"...","body":"...","category":"Markets","tags":["tag1","tag2","tag3"]}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-api-key':ANTHROPIC, 'anthropic-version':'2023-06-01', 'anthropic-beta':'web-search-2025-03-05' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        tools: [{ type:'web_search_20250305', name:'web_search' }],
        system: `You are a senior financial journalist for ${site.name} (${clientDomain}). Today is ${today}. Write REAL, verified financial news. Output valid JSON only — no markdown, no backticks.`,
        messages: [{ role:'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(90000),
    })
    const data = await res.json()
    const text = (data.content||[]).filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('')
    const clean = text.replace(/```json|```/g,'').trim()
    const start = clean.indexOf('{'); const end = clean.lastIndexOf('}')
    if (start===-1||end===-1) return null
    const parsed = JSON.parse(clean.slice(start,end+1))
    if (!parsed.title||!parsed.body) return null
    return parsed
  } catch(e) { console.error('writeArticle error:', topic, e); return null }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') || req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && secret !== 'REDACTED_CRON_SECRET') {
    return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  }

  // batch=0 (morning), batch=1 (midday), batch=2 (afternoon)
  // Each batch generates topics [batch*10 to batch*10+9] per portal = 10 articles
  const batch = parseInt(req.nextUrl.searchParams.get('batch') || '0')
  const batchStart = batch * 10
  const batchEnd = batchStart + 10

  const clients = await getActiveClients()
  if (clients.length === 0) return NextResponse.json({ error:'No active clients' }, { status:400 })

  const results: any[] = []
  let totalInserted = 0
  const todayStr = new Date().toISOString().split('T')[0]

  for (const site of ALL_SITES) {
    let siteInserted = 0
    const batchTopics = site.topics.slice(batchStart, batchEnd)

    for (let i = 0; i < batchTopics.length; i++) {
      const topic = batchTopics[i]
      const globalIndex = batchStart + i  // position across full day's 30 articles

      // 20% of articles mention brand (every 5th across full day's 30)
      const isBrandArticle = (globalIndex % 5 === 1)
      const client = isBrandArticle ? clients[0] : null

      // Cross-portal links only when writing a brand article
      const crossLinks = isBrandArticle
        ? await getCrossPortalLinks(client!.company_name, site.id)
        : []

      const article = await writeArticle(site, topic, client, crossLinks)
      if (!article) { console.log(`Skipped: ${topic}`); continue }

      const slug = slugify(article.title)

      // Check for duplicate slug today
      const { data: existing } = await supabase.from('news_articles')
        .select('id').eq('slug', slug).single()
      if (existing) { console.log(`Duplicate slug: ${slug}`); continue }

      const { data: inserted, error } = await supabase.from('news_articles').insert({
        news_site_id: site.id,
        title: article.title,
        slug,
        excerpt: article.excerpt || '',
        body: article.body || '',
        category: article.category || 'Markets',
        tags: Array.isArray(article.tags) ? article.tags : [],
        author_name: site.author,
        cover_image_url: null,
        status: 'published',
        published_at: new Date().toISOString(),
        is_featured: i === 0,
        ai_generated: true,
      }).select().single()

      if (error) { console.error('Insert error:', error.message); continue }

      siteInserted++
      totalInserted++

      // Generate DALL-E image in background
      if (inserted?.id) {
        generateArticleImage(inserted.id, article.title, article.category)
          .then(url => { if (url) supabase.from('news_articles').update({ cover_image_url: url }).eq('id', inserted.id) })
          .catch(() => {})
      }

      await new Promise(r => setTimeout(r, 500))
    }

    results.push({ site: site.name, inserted: siteInserted })
    console.log(`${site.name}: ${siteInserted} articles`)
  }

  return NextResponse.json({
    message: `Cron complete — ${totalInserted} articles across ${ALL_SITES.length} portals`,
    results,
    clients: clients.map(c => c.company_name),
    timestamp: new Date().toISOString(),
  })
}
