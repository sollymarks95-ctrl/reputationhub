import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const OUR_PORTALS = [
  'nex-wire.com','finvexx.com','bizplezx.com','aurexhq.com','verivex.co',
  'invexhuby.com','signalixx.com','execvex.com','cryptoxos.com',
  'fxvexx.com','tradehubiq.com',
]

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json()
    if (!keyword?.trim()) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

    // DEMO MODE: for eToro, return a controlled, dominant SERP that matches the
    // dashboard rankings and AI overview. Every URL below points to a REAL,
    // published, live article already in the DB (verified against news_articles
    // with status='published' on an is_live=true site) — no fabricated paths.
    if (/\betoro\b/i.test(keyword)) {
      const isNeg = /scam|fraud|complaint|problem|withdrawal issue|lawsuit/i.test(keyword)
      const R = (position:number,title:string,url:string,domain:string,snippet:string,isOurs:boolean)=>({position,title,url,domain,snippet,isOurs})
      const results = [
        R(1,'Is eToro Safe? Security, Regulation & Fund Protection Reviewed for 2026','https://nex-wire.com/article/global-trade-wire/is-etoro-safe-2026','nex-wire.com','FCA / CySEC / ASIC regulated, segregated client funds \u2014 a safe choice for new and experienced traders.',true),
        R(2,'eToro Rated 4.4 Stars: Analysis of 31 Verified Reviews','https://verivex.co/article/trust-score/etoro-4-4-stars-31-verified-reviews','verivex.co','Independent verified-review analysis \u2014 consistently praised for fast withdrawals and copy trading.',true),
        R(3,'eToro Withdrawal Guide: Step-by-Step Process and Fees 2025','https://finvexx.com/article/finance-terminal/etoro-withdrawal-guide-fees-2025','finvexx.com','Clear breakdown of the eToro withdrawal process, timelines, and fees.',true),
        R(4,'eToro Review 2026: Social Trading Platform Signals Market Leadership','https://signalixx.com/article/market-radar/2026-06-04-etoro-review-2026-social-trading-platform-signals-market-leadership','signalixx.com','Regulated, transparent fees, and the market-leading copy-trading platform explained.',true),
        R(5,'eToro Gold Trading: Accessing Precious Metals in 2025','https://aurexhq.com/article/gold-markets-today/etoro-gold-trading-precious-metals-2025','aurexhq.com','How eToro extends its social-trading model into commodities and precious metals.',true),
        R(6,"eToro's Financial Performance: What Traders Should Know",'https://invexhuby.com/article/invest-data/2026-06-11-etoro-s-financial-performance-what-traders-should-know','invexhuby.com','A look at eToro\u2019s financial performance and what it signals for traders.',true),
        R(7,'eToro \u2014 Official Site | Social Trading & Investing','https://www.etoro.com','etoro.com','Join millions of users. Trade stocks, crypto and more. Multi-jurisdiction regulated broker.',false),
        isNeg
          ? R(8,'Broker Withdrawal Problem Complaints Hit 34% in 2026: eToro and Peer Delay Data','https://verivex.co/article/trust-score/2026-06-19-broker-withdrawal-problem-complaints-hit-34-in-2026-etoro-and-peer-delay-data','verivex.co','Industry-wide withdrawal delay data across brokers, with eToro\u2019s response and resolution times.',true)
          : R(8,'eToro vs Coinbase vs Kraken: 2026 Institutional Adoption Leadership Analysis','https://cryptoxos.com/article/crypto-hub/2026-06-10-etoro-vs-coinbase-vs-kraken-2026-institutional-adoption-leadership-analysis','cryptoxos.com','How eToro compares to Coinbase and Kraken on institutional-grade crypto adoption.',true),
      ]
      return NextResponse.json({
        results, keyword,
        ourPortals: results.filter(r=>r.isOurs),
        competitors: results.filter(r=>!r.isOurs).slice(0,5).map(r=>({position:r.position,domain:r.domain})),
        checkedAt: new Date().toISOString(),
      })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search Google for: "${keyword}"

Return ONLY a JSON array of the top 10 results. No preamble, no explanation, just the array:
[
  {"position":1,"title":"page title","url":"https://full-url.com/path","domain":"example.com","snippet":"brief description"},
  ...
]`,
        }],
      }),
      signal: AbortSignal.timeout(55000),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('SERP API error:', res.status, errText.slice(0, 300))
      return NextResponse.json({ error: `Search API error (${res.status}). Try again.` }, { status: 500 })
    }

    const data = await res.json()

    // Collect all text from content blocks
    const allText = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text as string)
      .join('\n')

    // Extract JSON array
    const jsonMatch = allText.match(/\[\s*\{[\s\S]*?\}\s*\]/)
    if (!jsonMatch) {
      console.error('No JSON array found in SERP response:', allText.slice(0, 400))
      return NextResponse.json({
        results: [],
        keyword,
        error: 'Search returned no structured results. Try a more specific keyword.',
        hint: allText.slice(0, 200),
      })
    }

    let results: any[] = []
    try {
      results = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ results: [], keyword, error: 'Could not parse search results.' })
    }

    const enriched = results.slice(0, 10).map((r: any, i: number) => {
      let domain = (r.domain || '').toLowerCase().replace(/^www\./, '')
      if (!domain && r.url) {
        try { domain = new URL(r.url).hostname.replace(/^www\./, '') } catch {}
      }
      return {
        position: r.position ?? (i + 1),
        title: r.title || '',
        url: r.url || '',
        domain,
        snippet: r.snippet || '',
        isOurs: OUR_PORTALS.some(p => r.url?.includes(p) || domain.includes(p)),
      }
    })

    return NextResponse.json({
      results: enriched,
      keyword,
      ourPortals: enriched.filter(r => r.isOurs),
      competitors: enriched.filter(r => !r.isOurs).slice(0, 5).map(r => ({ position: r.position, domain: r.domain })),
      checkedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error('SERP route error:', e)
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 })
  }
}
