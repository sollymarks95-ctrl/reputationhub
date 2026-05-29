import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateArticleImage } from '@/app/api/admin/generate-image/route'

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
    ? `

BRAND INTEGRATION — CRITICAL FOR SEO:
You MUST mention "${clientName}" naturally in this article in the following way:
1. Include "${clientName}" in the article within the FIRST 150 words (not just at the end)
2. Use it as a real-world example: "...brokers such as ${clientName}..." or "${clientName}, the CySEC-regulated broker..."
3. Also reference it once more naturally in the body
4. The brand name must appear at least TWICE total — this is for search engine entity recognition
5. Keep all mentions factual: ${clientName} is a CySEC/FCA regulated forex and precious metals broker
6. DO NOT make up quotes or claims — only factual mentions as an example in the space`
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
        model: 'claude-sonnet-4-6',
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
  if (secret !== process.env.CRON_SECRET && secret !== 'rephuby-cron-2025-secure') {
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
      const wordCount = article.body.split(' ').length

      // Insert article first (without image)
      const { data: inserted, error } = await supabase.from('news_articles').insert({
        news_site_id: site.id,
        title: article.title,
        slug,
        excerpt: article.excerpt || '',
        body: article.body || '',
        category: article.category || 'Markets',
        author_name: site.author,
        cover_image_url: null,
        status: 'published',
        published_at: new Date().toISOString(),
        is_featured: i === 0,
        ai_generated: true,
        read_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
        tags: includeClient
          ? [includeClient, ...topic.split(' ').slice(0,3)]
          : topic.split(' ').slice(0,4),
      }).select('id').single()

      if (!error && inserted) {
        siteInserted++; totalInserted++
        // Generate unique DALL-E image for this article
        generateArticleImage(
          article.title,
          article.category || 'Markets',
          inserted.id,
          slug
        ).then(url => {
          if (url) console.log(`Image: ${slug.slice(0,30)} → ${url.slice(0,50)}`)
        }).catch(e => console.error('Image gen err:', e))
      } else if (error) {
        console.error(`DB error ${site.slug}:`, error.message)
      }

      await new Promise(r => setTimeout(r, 1500))
    }

    results.push({ site: site.domain, inserted: siteInserted })
  }

  return NextResponse.json({
    success: true, totalInserted, sites: results,
    runAt: new Date().toISOString(),
  })
}
