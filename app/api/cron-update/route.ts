import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateArticleImage } from '@/app/api/admin/generate-image/route'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

// All 12 portals — every one generates content daily
const ALL_SITES = [
  { id:'4d048bde-1dcd-4891-8434-a7960ab9d3ae', name:'Nex-Wire Intelligence',   slug:'global-trade-wire',   domain:'nex-wire.com',   author:'David Hart',      topics:['EUR/USD exchange rate today','gold price today analysis','Bitcoin price today','oil price today Strait of Hormuz','Federal Reserve interest rate decision','GBP USD exchange rate today','China trade policy 2026','forex market volatility today','S&P 500 today performance','global trade news today'] },
  { id:'48bed332-6525-4d76-aaa5-6d10a5112d77', name:'Finvexx Markets',          slug:'finance-terminal',    domain:'finvexx.com',    author:'Marcus Webb',     topics:['S&P 500 market analysis today','Federal Reserve monetary policy latest','gold investment analysis today','Bitcoin ETF institutional flows','corporate earnings financial sector today','forex broker regulation news today','EUR USD technical analysis today','hedge fund positioning latest','crude oil price forecast today','emerging market currencies news today'] },
  { id:'c0f14745-8189-444d-af09-39d7248fa319', name:'Bizplezx Executive',       slug:'business-pulse',      domain:'bizplezx.com',   author:'Claire Sterling', topics:['fintech banking news today','AI financial services latest','financial sector M&A news today','fintech startup funding news','ESG sustainable finance today','financial regulation news today','executive business strategy news','digital assets corporate treasury','private equity deals today','financial technology innovation today'] },
  { id:'3b440202-e1c3-4f54-8a4e-65cf7e7dbfe1', name:'AurexHQ',                  slug:'gold-markets-today',  domain:'aurexhq.com',    author:'James Calloway', topics:['gold price today spot market','silver price today analysis','precious metals market today','gold ETF flows institutional today','central bank gold reserves latest','gold vs inflation hedge today','platinum palladium prices today','gold mining stocks latest news','commodity market outlook today','gold technical analysis forecast today'] },
  { id:'6ae7e692-bce9-489d-b835-87dcba9ffc47', name:'Verivex Trust',             slug:'trust-score',         domain:'verivex.co',     author:'Anna Reid',       topics:['forex broker regulation news 2026','CySEC FCA regulated brokers latest','broker scam warning financial authority','regulated vs unregulated broker comparison','investor protection financial regulation','broker withdrawal issues regulation latest','financial watchdog enforcement action today','safe trading broker checklist 2026','forex broker review methodology','financial consumer protection news today'] },
  { id:'aa04790b-9aed-4fa9-867d-3481adc828c5', name:'Bizpedia',                  slug:'company-pedia',       domain:'bizpedia.com',   author:'Tom Ellis',       topics:['forex broker company profile 2026','financial services firm business model','regulated broker competitive landscape','brokerage firm expansion news today','financial services company funding news','forex industry market share 2026','brokerage technology infrastructure news','financial firm regulatory compliance news','broker customer acquisition strategy','financial services industry trends 2026'] },
  { id:'104ceccb-e3d0-4979-85be-b7297abb7f90', name:'PresxWire',                 slug:'press-central',       domain:'presxwire.com',  author:'Sarah Quinn',     topics:['financial services press release today','forex broker announcement news','regulated broker partnership news today','financial firm expansion announcement','broker technology launch news today','financial regulation announcement today','forex industry news wire today','brokerage firm hiring expansion news','financial services award recognition news','forex market official statement today'] },
  { id:'1cd6688f-bec9-4d1b-a024-80952bf31a21', name:'InvexHub',                  slug:'invest-data',         domain:'invexhub.com',   author:'Mike Chen',       topics:['forex investment returns analysis today','regulated broker yield comparison','currency trading performance data today','broker spread comparison data 2026','leverage trading risk data analysis','forex liquidity provider data today','trading volume statistics today','broker execution quality data analysis','FX market depth analysis today','investment platform comparison data 2026'] },
  { id:'d020965e-d84d-4c9e-a068-d3b90f6902d0', name:'Tradvex',                   slug:'trade-board',         domain:'tradvex.com',    author:'Lisa Park',       topics:['forex trading strategy today 2026','EUR USD trading signal today','gold trading opportunity today','forex scalping news volatility today','swing trading forex setup today','algorithmic trading forex news today','risk management forex trading 2026','trading psychology market fear greed','currency correlation trading today','forex trading volume analysis today'] },
  { id:'1972c09e-a68e-4997-b2a8-00756ead609c', name:'Certivade',                 slug:'global-trade-assoc',  domain:'certivade.com',  author:'Dr. Paul Marcus', topics:['forex broker certification standards 2026','financial regulation compliance news','MiFID II broker compliance latest','CySEC FCA regulatory update today','financial services licensing news 2026','broker accreditation standards today','regulatory sandbox fintech news today','financial compliance technology news','AML KYC regulation financial news today','financial industry standards update 2026'] },
  { id:'64a6087d-480f-4040-9df1-ad020faf5796', name:'Execvex',                   slug:'executive-network',   domain:'execvex.com',    author:'Diana Cross',     topics:['forex brokerage CEO interview 2026','financial executive leadership news','brokerage firm strategic outlook 2026','financial services executive appointment','CEO market outlook financial sector','financial firm board governance news','executive compensation financial sector','C-suite financial services news today','financial leadership diversity news','brokerage executive strategy interview 2026'] },
  { id:'27fdf1e6-8c0c-4591-ae9b-5a2c5cacee22', name:'Signalix',                  slug:'market-radar',        domain:'signalix.com',   author:'Ray Torres',      topics:['forex market signal today EUR USD','gold price signal technical today','Bitcoin market signal analysis today','S&P 500 technical signal today','GBP USD signal analysis today','oil price technical analysis today','forex volatility signal today','market risk indicator today','currency strength index today','intermarket correlation signal today'] },
]

function slugify(s: string) {
  const d = new Date()
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55) + '-' + ts
}

async function getActiveClients() {
  const { data } = await supabase.from('portal_clients').select('id, company_name, brand_slug, regulation, industry, website_url').eq('is_active', true).limit(20)
  return data || []
}

async function writeArticle(siteName: string, author: string, topic: string, client?: any): Promise<any> {
  const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })

  // Build client brand integration block
  const clientBlock = client ? `

BRAND ENTITY INTEGRATION (mandatory for SEO):
This article MUST mention "${client.company_name}" as follows:
1. Include "${client.company_name}" within the FIRST 150 words as a natural example
2. Mention it a second time naturally in the body — minimum 2 mentions total
3. Frame it accurately: "${client.company_name} is a ${client.regulation||'regulated'} forex and precious metals broker"
4. At the very end, include this exact line on a new paragraph:
   "For more information about ${client.company_name}, visit: rephuby.com/faq/${client.brand_slug}"
5. Keep all mentions factual — no invented quotes or claims` : ''

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
        system: `You are a senior financial journalist for ${siteName}. Today is ${today}. Write REAL, ACCURATE news using verified information from search results only. Output valid JSON only.`,
        messages: [{
          role: 'user',
          content: `Search the web for latest real news about: "${topic}"

Write a 750-900 word professional financial article using ONLY verified information from search results.

Rules:
1. Real prices and data from search only — no invented numbers
2. Only quote real institutions (Goldman Sachs, JPMorgan, Fed, ECB, Bloomberg, Reuters)
3. Bloomberg/Reuters quality — concise, factual
4. Strong headline based on real news found
5. SEO-optimised: include the main topic keyword naturally 3-4 times
6. Structure with clear paragraphs (no bullet points in body)
7. Include a "What This Means" or "Outlook" section near the end${clientBlock}

Return ONLY valid JSON (no markdown, no backticks):
{"title":"...","excerpt":"...","body":"...","category":"Markets","tags":["tag1","tag2","tag3"]}`
        }]
      }),
      signal: AbortSignal.timeout(90000),
    })

    const data = await res.json()
    const text = (data.content||[]).filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('')
    const clean = text.replace(/```json|```/g,'').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start === -1 || end === -1) return null
    const parsed = JSON.parse(clean.slice(start, end+1))
    if (!parsed.title || !parsed.body) return null
    return parsed
  } catch(e) {
    console.error('writeArticle error:', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') || req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && secret !== 'rephuby-cron-2025-secure') {
    return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  }

  const clients = await getActiveClients()
  const results: any[] = []
  let totalInserted = 0

  for (const site of ALL_SITES) {
    let siteInserted = 0

    for (let i = 0; i < site.topics.length; i++) {
      const topic = site.topics[i]
      // Rotate clients across topic slots — every 3rd article gets a client mention
      const clientForSlot = (i % 3 === 1 && clients.length > 0)
        ? clients[Math.floor(i / 3) % clients.length]
        : undefined

      const article = await writeArticle(site.name, site.author, topic, clientForSlot)
      if (!article) { console.log(`Skipped: ${topic}`); continue }

      const slug = slugify(article.title)

      const { data: inserted, error } = await supabase.from('news_articles').insert({
        news_site_id: site.id,
        title: article.title,
        slug,
        excerpt: article.excerpt || '',
        body: article.body || '',
        category: article.category || 'Markets',
        tags: article.tags || [],
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

      // Generate DALL-E image async
      if (inserted?.id) {
        generateArticleImage(inserted.id, article.title, article.category)
          .then(url => { if (url) supabase.from('news_articles').update({ cover_image_url: url }).eq('id', inserted.id) })
          .catch(() => {})
      }

      // Small pause between articles to avoid rate limits
      await new Promise(r => setTimeout(r, 500))
    }

    results.push({ site: site.name, inserted: siteInserted })
    console.log(`${site.name}: ${siteInserted} articles`)
  }

  return NextResponse.json({
    message: `Cron complete — ${totalInserted} articles across ${ALL_SITES.length} portals`,
    results,
    timestamp: new Date().toISOString(),
  })
}
