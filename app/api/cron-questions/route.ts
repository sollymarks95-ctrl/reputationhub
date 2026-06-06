import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic  = 'force-dynamic'
export const maxDuration = 300

const CORS = { 'Access-Control-Allow-Origin': '*' }

// High-volume question topics per portal — targeting PAA boxes and long-tail search
const QUESTION_TOPICS: Record<string, string[]> = {
  'trust-score': [
    'Is eToro regulated and safe to use',
    'How to check if a forex broker is regulated',
    'What is FCA regulation for forex brokers',
    'How to spot a forex broker scam',
    'What does CySEC regulated mean for traders',
    'How to get money back from a forex scam',
    'What is a prop trading firm and are they safe',
    'Is Pepperstone a legitimate broker',
    'What is ASIC regulation for Australian brokers',
    'How to verify a broker licence number',
    'What is negative balance protection in forex',
    'What is segregated funds in forex trading',
  ],
  'finance-terminal': [
    'How does forex trading work for beginners',
    'What is a pip in forex trading',
    'What is leverage in forex trading and how does it work',
    'What is the best currency pair for beginners',
    'How do interest rates affect forex markets',
    'What is the spread in forex trading',
    'How does the Federal Reserve affect currency markets',
    'What is a forex swap and how is it calculated',
    'What is a currency carry trade',
    'How to read a forex economic calendar',
    'What is hedging in forex trading',
    'How does central bank intervention affect exchange rates',
  ],
  'crypto-hub': [
    'Is Bitcoin a good investment in 2026',
    'How does Ethereum staking work',
    'What is DeFi and how does it work',
    'How to buy Bitcoin safely for the first time',
    'What is a crypto wallet and how does it work',
    'What is a Layer 2 blockchain solution',
    'What causes crypto prices to go up and down',
    'What is a rug pull in crypto',
    'How does Bitcoin halving affect price',
    'What is the difference between Bitcoin and Ethereum',
    'What is a stablecoin and how does it maintain its peg',
    'How to avoid crypto scams in 2026',
  ],
  'market-radar': [
    'What is RSI in trading and how to use it',
    'How does MACD indicator work',
    'What is a moving average crossover signal',
    'What is support and resistance in trading',
    'How to read candlestick charts for beginners',
    'What is Bollinger Bands indicator',
    'What is the difference between trading and investing',
    'What is a head and shoulders chart pattern',
    'How to use Fibonacci retracement levels',
    'What is volume in stock trading and why does it matter',
    'What is the VIX index and what does it measure',
    'What is options flow and how to trade it',
  ],
  'invest-data': [
    'What is an ETF and how does it work',
    'How to build an investment portfolio from scratch',
    'What is dollar cost averaging in investing',
    'What is the difference between stocks and bonds',
    'What is a hedge fund and how does it invest',
    'How does compound interest work in investing',
    'What is a dividend stock and how do dividends work',
    'What is private equity and how does it generate returns',
    'What is factor investing and does it work',
    'How to invest in index funds for beginners',
    'What is the Sharpe ratio and how is it calculated',
    'What is risk-adjusted return in portfolio management',
  ],
  'gold-markets-today': [
    'How is the gold price determined',
    'Why does the oil price go up and down',
    'What affects silver prices today',
    'What is the relationship between gold and the dollar',
    'How to invest in gold for beginners',
    'What is OPEC and how does it control oil prices',
    'What is the Baltic Dry Index',
    'Why is copper called the doctor of the economy',
    'How do commodity futures contracts work',
    'What is contango and backwardation in futures markets',
    'How does inflation affect gold prices',
    'What is lithium used for and why is it valuable',
  ],
  'global-trade-wire': [
    'What is a letter of credit in trade finance',
    'How does trade finance work for importers',
    'What is supply chain finance and how does it work',
    'What is the difference between FOB and CIF shipping terms',
    'How does SWIFT work for international payments',
    'What is a bill of lading in shipping',
    'What is forfaiting in trade finance',
    'How do tariffs affect international trade',
    'What is cross-border payment and why is it expensive',
    'What is the Belt and Road Initiative',
    'How does documentary collection work in trade',
    'What is export credit insurance',
  ],
  'executive-network': [
    'What does a CEO actually do day to day',
    'How does mergers and acquisitions work',
    'What is a board of directors and what do they do',
    'What is ESG investing and why do companies care',
    'How is executive compensation structured',
    'What is activist investing and how does it work',
    'What is a corporate spin-off and why do companies do it',
    'How do private equity firms make money',
    'What is a leveraged buyout',
    'What is corporate governance and why does it matter',
    'How does a company go public through an IPO',
    'What is a CFO responsible for in a company',
  ],
  'business-pulse': [
    'How to read a company earnings report',
    'What is EBITDA and why does it matter',
    'What is market capitalisation and how is it calculated',
    'What is a stock buyback and why do companies do it',
    'How do interest rates affect stock markets',
    'What is a profit margin and what is a good one',
    'What is the difference between revenue and profit',
    'How does inflation affect business profits',
    'What is a recession and how does it affect businesses',
    'What is working capital and why is it important',
    'How do companies value themselves for acquisition',
    'What is a dividend payout ratio',
  ],
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

async function generateQuestionArticle(
  question: string,
  site: any
): Promise<any> {
  const today = new Date().toISOString().split('T')[0]

  const prompt = `You are a senior financial journalist at ${site.name} (${site.tagline}).

Write a comprehensive, SEO-optimised article that directly answers this question:
"${question}"

REQUIREMENTS:
- Title: Rephrase the question as a definitive headline (e.g. "What Is RSI? A Complete Guide for Traders")
- Length: 600-900 words
- Structure: Lead paragraph (answers the question in 2 sentences), then 4-5 subheadings with detailed explanations
- Tone: Expert, authoritative, clear — written for finance professionals and serious retail traders
- Date: ${today}
- Include specific data points, percentages, real examples where relevant
- End with a "Key Takeaways" bullet list (3-4 points)
- DO NOT use generic filler — every sentence must add value
- Write as if for ${site.name}: ${site.tagline}

RESPOND IN JSON:
{
  "title": "SEO headline (60-70 chars, includes main keyword)",
  "excerpt": "Meta description (150-160 chars, includes keyword, answers the question)",
  "category": "one of: Analysis | Education | Markets | Regulation | Technology | Strategy | Commodities",
  "tags": ["tag1","tag2","tag3","tag4"],
  "body": "Full HTML article body (use <h2>, <h3>, <p>, <ul>, <li>, <strong> — NO <h1>)",
  "faq": [
    {"q": "Related question 1?", "a": "Direct answer in 2-3 sentences."},
    {"q": "Related question 2?", "a": "Direct answer in 2-3 sentences."},
    {"q": "Related question 3?", "a": "Direct answer in 2-3 sentences."}
  ]
}`

  const apiKey = process.env.ANTHROPIC_API_KEY
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(45000),
  })
  const rd = await resp.json()
  const raw = rd?.content?.[0]?.text || ''
  const clean = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in response')
  return JSON.parse(clean.slice(start, end + 1))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== 'REDACTED_CRON_SECRET') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })
  }

  const targetSlug = searchParams.get('site') // optional — run one site at a time
  const db     = getDb()
  const today  = new Date().toISOString().split('T')[0]
  const results: any[] = []

  // Get sites to process
  const { data: sites } = await db
    .from('news_sites')
    .select('id, slug, name, tagline, domain')
    .eq('is_active', true)
    .eq('is_live', true)
    .in('slug', targetSlug ? [targetSlug] : Object.keys(QUESTION_TOPICS))

  if (!sites?.length) return NextResponse.json({ ok: false, message: 'No sites found' }, { headers: CORS })

  for (const site of sites) {
    const questions = QUESTION_TOPICS[site.slug] || []
    let inserted = 0, skipped = 0

    for (const question of questions) {
      const slug = `${slugify(question)}-explained-${today}`

      // Skip if already exists
      const { data: exists } = await db
        .from('news_articles')
        .select('id')
        .eq('slug', slug)
        .single()
      if (exists) { skipped++; continue }

      try {
        const art = await generateQuestionArticle(question, site)
        const faqSchema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: (art.faq || []).map((f: any) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }

        await db.from('news_articles').insert({
          news_site_id:   site.id,
          title:          art.title,
          slug,
          excerpt:        art.excerpt,
          body:           art.body,
          category:       art.category || 'Education',
          tags:           art.tags || [],
          status:         'published',
          article_type:   'news',
          author_name:    `${site.name} Editorial`,
          portal_name:    site.name,
          published_at:   new Date().toISOString(),
          read_time_minutes: 5,
          seo_title:      art.title,
          seo_description: art.excerpt,
          faq_schema:     faqSchema,
          is_featured:    false,
          source_question: question, // track which question spawned this article
        })
        inserted++
        console.log(`[questions] ${site.slug}: "${art.title}"`)

        // Small delay between articles
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))
      } catch (e: any) {
        console.error(`[questions] error for "${question}":`, e.message)
        skipped++
      }
    }

    results.push({ site: site.slug, inserted, skipped, total: questions.length })
  }

  return NextResponse.json({ ok: true, results, total_inserted: results.reduce((s,r)=>s+r.inserted,0) }, { headers: CORS })
}
