import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

const LIVE_SITES = [
  {
    id: '4d048bde-1dcd-4891-8434-a7960ab9d3ae',
    name: 'Nex-Wire Intelligence', slug: 'global-trade-wire', domain: 'nex-wire.com',
    author: 'David Hart', clientSlot: 4,
    topics: [
      'EUR/USD exchange rate today latest',
      'gold price today record high analysis',
      'Bitcoin price today market analysis',
      'oil price today Strait of Hormuz latest news',
      'US Federal Reserve interest rate decision latest',
      'GBP USD British pound exchange rate today',
      'China trade policy latest news 2026',
      'forex market volatility today analysis',
      'S&P 500 stock market today performance',
      'global trade news today latest',
    ],
  },
  {
    id: '48bed332-6525-4d76-aaa5-6d10a5112d77',
    name: 'Finvexx Markets', slug: 'finance-terminal', domain: 'finvexx.com',
    author: 'Marcus Webb', clientSlot: 5,
    topics: [
      'S&P 500 market analysis today',
      'Federal Reserve monetary policy latest news',
      'gold investment analysis today',
      'Bitcoin ETF institutional flows latest',
      'corporate earnings financial sector today',
      'forex broker regulation news today',
      'EUR USD technical analysis today',
      'hedge fund market positioning latest',
      'crude oil price forecast today',
      'emerging market currencies news today',
    ],
  },
  {
    id: 'c0f14745-8189-444d-af09-39d7248fa319',
    name: 'Bizplezx Executive', slug: 'business-pulse', domain: 'bizplezx.com',
    author: 'Claire Sterling', clientSlot: 3,
    topics: [
      'fintech banking industry news today',
      'AI financial services latest developments',
      'financial sector mergers acquisitions news today',
      'fintech startup funding latest news',
      'ESG sustainable finance news today',
      'financial services regulation news today',
      'executive leadership business strategy news',
      'digital assets corporate treasury latest',
      'private equity financial deals today',
      'financial technology innovation news today',
    ],
  },
]

const COVERS = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526628953301-3cd9e37dc0d7?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200&auto=format&fit=crop&q=80',
]

function slugify(s: string) {
  const d = new Date()
  const ts = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55) + '-' + ts
}

async function getActiveClients() {
  const { data } = await supabase.from('portal_clients').select('id, company_name').limit(10)
  return data || []
}

async function writeArticle(
  siteName: string,
  author: string,
  searchTopic: string,
  clientName?: string,
): Promise<{ title:string; body:string; excerpt:string; category:string } | null> {
  const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })

  const clientLine = clientName
    ? `\n\nAt the end of the article, include one natural sentence mentioning ${clientName} as an example of a firm operating in this space. Keep it factual and brief — one sentence only, no quotes, no hype.`
    : ''

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are a senior financial journalist writing for ${siteName}. Today is ${today}. Your job is to search for and report REAL, ACCURATE, VERIFIED financial news. Never invent data, prices, or quotes. Only write what you can verify from search results.`,
        messages: [{
          role: 'user',
          content: `Search the web for the latest real news about: "${searchTopic}"

Then write a 750-900 word professional financial news article using ONLY what you found in your search.

RULES — non-negotiable:
1. ONLY use real prices and data from your search results — no made-up numbers
2. ONLY quote real institutions (Goldman Sachs, JPMorgan, Federal Reserve, ECB, Bloomberg, Reuters) — never invent quotes from fake people
3. If you cite a statistic, it must come from a real source you found
4. Bloomberg/Reuters quality writing — concise, factual, no hype
5. Strong headline based on the real news you found
6. No bullet points in the article body${clientLine}

Return ONLY valid JSON with no markdown fences:
{"title":"...","category":"Markets|Analysis|Business|Crypto|Forex|Commodities","excerpt":"one accurate sentence","body":"article text with newlines between paragraphs"}`
        }]
      }),
      signal: AbortSignal.timeout(90000),
    })

    if (!res.ok) { console.error('Claude error:', res.status); return null }
    const data = await res.json()

    const textBlocks = (data.content || []).filter((b: any) => b.type === 'text')
    const raw = textBlocks[textBlocks.length - 1]?.text?.trim() || ''
    const clean = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/,'').trim()

    const parsed = JSON.parse(clean)
    if (!parsed.title || !parsed.body) return null
    return parsed
  } catch (e) {
    console.error('writeArticle error for', searchTopic, ':', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') || req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && secret !== 'REDACTED_CRON_SECRET') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clients = await getActiveClients()
  const clientName = clients[0]?.company_name || null
  const results: any[] = []
  let totalInserted = 0

  for (const site of LIVE_SITES) {
    let siteInserted = 0

    for (let i = 0; i < site.topics.length; i++) {
      const topic = site.topics[i]
      const includeClient = (i === site.clientSlot && clientName) ? clientName : undefined

      const article = await writeArticle(site.name, site.author, topic, includeClient)
      if (!article) { console.log(`Skipped: ${topic}`); continue }

      const slug = slugify(article.title)
      const cover = COVERS[Math.floor(Math.random() * COVERS.length)]
      const wordCount = article.body.split(' ').length

      const { error } = await supabase.from('news_articles').insert({
        news_site_id: site.id,
        title: article.title,
        slug,
        excerpt: article.excerpt || '',
        body: article.body || '',
        category: article.category || 'Markets',
        author_name: site.author,
        cover_image_url: cover,
        status: 'published',
        published_at: new Date().toISOString(),
        is_featured: i === 0,
        ai_generated: true,
        read_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
        tags: includeClient
          ? [includeClient, ...topic.split(' ').slice(0,3)]
          : topic.split(' ').slice(0,4),
      })

      if (!error) { siteInserted++; totalInserted++ }
      else console.error(`DB error ${site.slug}:`, error.message)

      await new Promise(r => setTimeout(r, 2000))
    }

    results.push({ site: site.domain, inserted: siteInserted })
  }

  return NextResponse.json({
    success: true, totalInserted, sites: results,
    runAt: new Date().toISOString(),
  })
}
