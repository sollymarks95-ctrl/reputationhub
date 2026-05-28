import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

// ── SITE CONFIGS ──────────────────────────────────────────────────────────────
const LIVE_SITES = [
  {
    id: '4d048bde-1dcd-4891-8434-a7960ab9d3ae',
    name: 'Nex-Wire Intelligence', slug: 'global-trade-wire', domain: 'nex-wire.com',
    voice: 'David Hart, Senior Markets Editor',
    topics: [
      'EUR/USD outlook Federal Reserve ECB divergence 2026',
      'gold price record high $4400 central bank buying 2026',
      'Bitcoin $76000 support institutional flows ETF 2026',
      'Strait of Hormuz oil market geopolitical risk 2026',
      'US tariff trade policy emerging markets impact 2026',
      'GBP/USD Bank of England rate decision 2026',
      'China currency yuan devaluation trade war 2026',
      'commodity markets oil copper agricultural 2026',
      'forex volatility S&P 500 correlation analysis 2026',
      'global trade supply chain disruption shipping 2026',
    ],
    // Article 5 (index 4) naturally mentions the client
    clientSlot: 4,
  },
  {
    id: '48bed332-6525-4d76-aaa5-6d10a5112d77',
    name: 'Finvexx Markets', slug: 'finance-terminal', domain: 'finvexx.com',
    voice: 'Marcus Webb, Chief Markets Analyst',
    topics: [
      'S&P 500 technical analysis Q2 2026 support resistance',
      'Federal Reserve rate hold 3.5% impact bond markets',
      'gold all time high $4404 portfolio allocation strategy',
      'Bitcoin institutional adoption BlackRock ETF flows 2026',
      'corporate earnings Q2 2026 financial sector outlook',
      'forex broker industry regulation CySEC FCA ASIC 2026',
      'EUR/USD trade strategy divergence analysis 2026',
      'hedge fund positioning risk-off rotation 2026',
      'oil price $63 OPEC+ Hormuz strategic reserves 2026',
      'emerging market currencies Indian rupee Brazilian real 2026',
    ],
    clientSlot: 5,
  },
  {
    id: 'c0f14745-8189-444d-af09-39d7248fa319',
    name: 'Bizplezx Executive', slug: 'business-pulse', domain: 'bizplezx.com',
    voice: 'Claire Sterling, Editorial Director',
    topics: [
      'fintech digital banking transformation strategy 2026',
      'AI automation financial services business impact 2026',
      'M&A deal activity financial sector Q2 2026',
      'startup venture capital fintech funding 2026',
      'ESG sustainable finance investment trends 2026',
      'regulated financial services growth strategy 2026',
      'executive leadership CFO priorities 2026',
      'digital asset institutional adoption corporate treasury',
      'private equity financial services deals 2026',
      'customer retention strategy financial services firms 2026',
    ],
    clientSlot: 3,
  },
]

// ── ACTIVE CLIENTS to weave in naturally ─────────────────────────────────────
async function getActiveClients() {
  const { data } = await supabase
    .from('portal_clients')
    .select('id, company_name')
    .limit(10)
  return data || []
}

// ── COVER IMAGES ──────────────────────────────────────────────────────────────
const COVERS = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&q=80',
  'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
  'https://images.unsplash.com/photo-1526628953301-3cd9e37dc0d7?w=1200&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=1200&q=80',
  'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
]

function slugify(s: string) {
  const d = new Date(); const ts = `${d.getMonth()+1}-${d.getDate()}`
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) + '-' + ts
}

// ── WRITE ONE ARTICLE ─────────────────────────────────────────────────────────
async function writeArticle(
  siteName: string,
  authorVoice: string,
  topic: string,
  clientMention?: string,   // if set, weave this company into the article naturally
): Promise<{ title:string; body:string; excerpt:string; category:string } | null> {
  const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })

  const clientInstruction = clientMention
    ? `\n\nIMPORTANT: Naturally include ${clientMention} as an example, a quoted source, or a named market participant in the article. Make the mention feel organic and editorial — never promotional or advertorial. Example approaches: quote their spokesperson, cite their market data, mention them as an example of a firm navigating the topic.`
    : ''

  const prompt = `Write a professional 750-900 word financial news article for ${siteName}.
Author voice: ${authorVoice}
Topic: ${topic}
Today's date: ${today}

REQUIREMENTS:
- Start with a strong, specific headline (no "Breaking:", no clickbait)
- First paragraph must hook the reader with the most newsworthy fact
- Use REAL current data: Gold ~$4,404/oz, BTC ~$76,210, EUR/USD ~1.1124, Oil ~$63, S&P 500 ~5,842
- Quote named sources (analysts, executives, regulatory officials — can be plausible)  
- Include at least 2 specific statistics or data points
- Natural paragraph breaks, no bullet points in the body
- Professional financial journalism tone — not corporate marketing
- End with an analytical conclusion or forward-looking statement
- SEO: Include topic keywords naturally throughout${clientInstruction}

OUTPUT FORMAT — respond with only valid JSON, no markdown fences:
{"title":"...","category":"Markets|Analysis|Business|Crypto|Forex|Commodities","excerpt":"...one sentence...","body":"...full article text with \\n\\n between paragraphs..."}`

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
        max_tokens: 2000,
        tools: [{ type:'web_search_20250305', name:'web_search' }],
        messages: [{ role:'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) return null
    const data = await res.json()

    // Get the last text block (after any tool use)
    const textBlocks = data.content?.filter((b: any) => b.type === 'text') || []
    const raw = textBlocks[textBlocks.length - 1]?.text?.trim() || ''

    // Parse JSON — strip any accidental fences
    const clean = raw.replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim()
    const parsed = JSON.parse(clean)
    return parsed
  } catch (e) {
    console.error('writeArticle error:', e)
    return null
  }
}

// ── MAIN CRON HANDLER ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') || req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && secret !== 'REDACTED_CRON_SECRET') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clients = await getActiveClients()
  const results: any[] = []
  let totalInserted = 0

  for (const site of LIVE_SITES) {
    let siteInserted = 0

    for (let i = 0; i < site.topics.length; i++) {
      const topic = site.topics[i]

      // On the client slot: weave in the first active client naturally
      const clientMention = (i === site.clientSlot && clients.length > 0)
        ? clients[0].company_name
        : undefined

      const article = await writeArticle(site.name, site.voice, topic, clientMention)
      if (!article) continue

      const slug = slugify(article.title || topic)
      const cover = COVERS[Math.floor(Math.random() * COVERS.length)]

      const { error } = await supabase.from('news_articles').insert({
        news_site_id: site.id,
        title: article.title,
        slug,
        excerpt: article.excerpt || '',
        body: article.body || '',
        category: article.category || 'Markets',
        author_name: site.voice.split(',')[0],
        cover_image_url: cover,
        status: 'published',
        published_at: new Date().toISOString(),
        is_featured: i === 0,   // first article of the day = featured
        ai_generated: true,
        read_time_minutes: Math.ceil((article.body?.split(' ').length || 750) / 200),
        tags: clientMention
          ? [clientMention, ...topic.split(' ').slice(0,3)]
          : topic.split(' ').slice(0,4),
      })

      if (!error) { siteInserted++; totalInserted++ }
      else console.error(`Insert error ${site.slug}:`, error.message)

      // Small delay between articles to be kind to the API
      await new Promise(r => setTimeout(r, 1500))
    }

    results.push({ site: site.domain, inserted: siteInserted, clientMentionAt: site.clientSlot + 1 })
  }

  return NextResponse.json({
    success: true,
    totalInserted,
    sites: results,
    runAt: new Date().toISOString(),
    message: `${totalInserted} articles published. Each site has 1 natural client mention at article #${LIVE_SITES.map(s=>s.clientSlot+1).join('/')}.`
  })
}
