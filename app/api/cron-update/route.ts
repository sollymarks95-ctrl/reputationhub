import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

// 3 live domains get 10 articles/day each = 30 total
// Other 9 portals get 1 article/day each = 9 total
// Grand total: 39 articles/day

const LIVE_SITES = [
  {
    id:'4d048bde-1dcd-4891-8434-a7960ab9d3ae', name:'Nex-Wire', slug:'global-trade-wire',
    domain:'nex-wire.com', count:10,
    topics:['global trade policy','forex markets USD EUR GBP','US-Iran Strait of Hormuz tensions','Federal Reserve interest rates 2026','commodity markets gold oil',
             'China trade relations','shipping supply chain disruption','emerging market currencies','geopolitical risk analysis','trade sanctions regulations']
  },
  {
    id:'48bed332-6525-4d76-aaa5-6d10a5112d77', name:'Finvexx', slug:'finance-terminal',
    domain:'finvexx.com', count:10,
    topics:['S&P 500 market analysis 2026','Bitcoin cryptocurrency market','gold price forecast analysis','Federal Reserve monetary policy',
             'corporate earnings Q2 2026','bond market yields inflation','ETF investment flows','forex trading signals EUR USD','hedge fund strategies','IPO market activity 2026']
  },
  {
    id:'c0f14745-8189-444d-af09-39d7248fa319', name:'Bizplezx', slug:'business-pulse',
    domain:'bizplezx.com', count:10,
    topics:['AI business strategy 2026','M&A deal activity','startup funding venture capital','CEO leadership executive strategy',
             'corporate digital transformation','private equity investment trends','technology sector business outlook','ESG sustainability business','remote work future of work','business innovation disruption']
  },
]

const OTHER_SITES = [
  { id:'3b440202-e1c3-4f54-8a4e-65cf7e7dbfe1', name:'AurexHQ',   slug:'gold-markets-today', topics:['gold price analysis commodities'] },
  { id:'6ae7e692-bce9-489d-b835-87dcba9ffc47', name:'Verivex',   slug:'trust-score',        topics:['forex broker regulation CySEC FCA'] },
  { id:'aa04790b-9aed-4fa9-867d-3481adc828c5', name:'Bizpedia',  slug:'company-pedia',      topics:['financial company profile analysis'] },
  { id:'104ceccb-e3d0-4979-85be-b7297abb7f90', name:'PresxWire', slug:'press-central',      topics:['financial regulatory announcement'] },
  { id:'1cd6688f-bec9-4d1b-a024-80952bf31a21', name:'InvexHub',  slug:'invest-data',        topics:['investment fund performance data'] },
  { id:'d020965e-d84d-4c9e-a068-d3b90f6902d0', name:'Tradvex',   slug:'trade-board',        topics:['forex trading signal analysis'] },
  { id:'1972c09e-a68e-4997-b2a8-00756ead609c', name:'Certivade', slug:'global-trade-assoc', topics:['trade compliance regulatory update'] },
  { id:'64a6087d-480f-4040-9df1-ad020faf5796', name:'Execvex',   slug:'executive-network',  topics:['executive leadership CEO interview'] },
  { id:'27fdf1e6-8c0c-4591-ae9b-5a2c5cacee22', name:'Signalix',  slug:'market-radar',       topics:['market signals technical analysis'] },
]

const COVER_POOL = [
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
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80',
]

function slugHash(s: string) {
  let h = 0; for (let i=0; i<s.length; i++) h = (h*31 + s.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}

async function writeArticle(siteName: string, topic: string): Promise<{ title: string; body: string; category: string } | null> {
  const today = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':ANTHROPIC, 'anthropic-version':'2023-06-01', 'anthropic-beta':'web-search-2025-03-05' },
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:2000,
        tools:[{ type:'web_search_20250305', name:'web_search' }],
        system:`You are a senior financial journalist writing for ${siteName}. Today is ${today}.

Write a 700-900 word SEO-optimized professional article that:
1. Searches for and uses REAL current data (actual prices, percentages, named sources)
2. Has a compelling keyword-rich headline
3. Opens with a strong lead paragraph containing the key news hook
4. Uses 4-5 paragraphs with specific data points, named companies/people
5. Includes market context and what it means for readers
6. Ends with a forward-looking paragraph

SEO Requirements:
- Include 3-4 naturally placed keywords related to the topic
- Write in a professional journalism style (Reuters/Bloomberg)
- No fluff - every sentence must add value

Respond EXACTLY in this format:
HEADLINE: [your compelling headline]
CATEGORY: [one of: Markets, Finance, Trade, Analysis, Commodities, Forex, Crypto, Strategy, Leadership, Innovation]
BODY:
[full article body - NO markdown headers, just clean paragraphs]`,
        messages:[{ role:'user', content:`Search the web and write an article about: ${topic}. Use real current data from today or this week. Include specific numbers, company names, and market context.` }]
      }),
      signal: AbortSignal.timeout(90000),
    })
    const data = await res.json()
    const text = data.content?.find((b: any) => b.type==='text')?.text || ''
    const headline = text.match(/HEADLINE:\s*(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '')
    const category = text.match(/CATEGORY:\s*(.+)/)?.[1]?.trim() || 'Markets'
    const body = text.match(/BODY:\s*([\s\S]+)/)?.[1]?.trim()
    if (headline && body && body.length > 200) return { title: headline, body, category }
  } catch (e) { console.error(e) }
  return null
}

function makeSlug(title: string, i: number): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70) + '-' + Date.now().toString(36) + i
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET || 'REDACTED_CRON_SECRET'}`) {
    return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  }

  let published = 0
  const results: any[] = []
  const errors: string[] = []

  // Process LIVE sites - 10 articles each
  for (const site of LIVE_SITES) {
    let sitePublished = 0
    for (let i = 0; i < site.count; i++) {
      const topic = site.topics[i % site.topics.length]
      try {
        const article = await writeArticle(site.name, topic)
        if (!article) { errors.push(`${site.name}[${i}]: no content`); continue }

        const slug = makeSlug(article.title, i)
        const excerpt = article.body.split('\n').filter(Boolean)[0]?.slice(0, 280) + '...'
        const readTime = Math.ceil(article.body.split(' ').length / 200)
        const cover = COVER_POOL[slugHash(slug) % COVER_POOL.length]

        const { error } = await supabase.from('news_articles').insert({
          news_site_id: site.id,
          title: article.title,
          slug,
          excerpt,
          body: article.body,
          category: article.category,
          tags: [topic.split(' ')[0], article.category, site.name],
          cover_image_url: cover,
          is_featured: i === 0,
          is_breaking: false,
          status: 'published',
          published_at: new Date().toISOString(),
          ai_generated: true,
          read_time_minutes: readTime,
          author_name: 'Editorial Team',
        })

        if (!error) { published++; sitePublished++; results.push({ site: site.name, title: article.title }) }
        else errors.push(`${site.name}: ${error.message}`)
      } catch (e: any) { errors.push(`${site.name}[${i}]: ${e.message}`) }
    }
  }

  // Process other sites - 1 article each
  for (const site of OTHER_SITES) {
    const topic = site.topics[0]
    try {
      const article = await writeArticle(site.name, topic)
      if (!article) continue
      const slug = makeSlug(article.title, 0)
      const cover = COVER_POOL[slugHash(slug) % COVER_POOL.length]
      await supabase.from('news_articles').insert({
        news_site_id: site.id, title: article.title, slug,
        excerpt: article.body.split('\n').filter(Boolean)[0]?.slice(0, 280) + '...',
        body: article.body, category: article.category,
        tags: [site.name, article.category], cover_image_url: cover,
        is_featured: false, status:'published',
        published_at: new Date().toISOString(),
        ai_generated: true, read_time_minutes: Math.ceil(article.body.split(' ').length/200),
        author_name: 'Editorial Team',
      })
      published++
    } catch {}
  }

  return NextResponse.json({ success:true, published, live_sites_articles: published - OTHER_SITES.length, timestamp: new Date().toISOString(), results: results.slice(0,15), errors: errors.length ? errors : undefined })
}
