import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

const SITES = [
  { id:'4d048bde-1dcd-4891-8434-a7960ab9d3ae', name:'Nexwire',   slug:'global-trade-wire',  route:'news',         category:'Trade',      topics:['global trade','forex markets','geopolitical risk','USD outlook'] },
  { id:'48bed332-6525-4d76-aaa5-6d10a5112d77', name:'Finvex',    slug:'finance-terminal',   route:'finance',      category:'Finance',    topics:['stock markets','S&P 500','interest rates','Federal Reserve','earnings'] },
  { id:'3b440202-e1c3-4f54-8a4e-65cf7e7dbfe1', name:'AurexHQ',   slug:'gold-markets-today', route:'commodities',  category:'Gold',       topics:['gold price','oil price','commodities','silver','natural gas'] },
  { id:'c0f14745-8189-444d-af09-39d7248fa319', name:'Bizplex',   slug:'business-pulse',     route:'magazine',     category:'Strategy',   topics:['M&A','fintech','startup funding','CEO strategy','business growth'] },
  { id:'6ae7e692-bce9-489d-b835-87dcba9ffc47', name:'Verivex',   slug:'trust-score',        route:'reviews-hub',  category:'Analysis',   topics:['broker regulation','CySEC update','FCA news','trading platform review'] },
  { id:'aa04790b-9aed-4fa9-867d-3481adc828c5', name:'Bizpedia',  slug:'company-pedia',      route:'wiki',         category:'Research',   topics:['company profile','broker history','executive bio','market maker'] },
  { id:'104ceccb-e3d0-4979-85be-b7297abb7f90', name:'PresxWire', slug:'press-central',      route:'pressroom',   category:'Markets',    topics:['press release','regulatory announcement','IPO','broker news'] },
  { id:'1cd6688f-bec9-4d1b-a024-80952bf31a21', name:'InvexHub',  slug:'invest-data',        route:'investdb',     category:'Finance',    topics:['investment data','ETF flows','fund performance','portfolio strategy'] },
  { id:'d020965e-d84d-4c9e-a068-d3b90f6902d0', name:'Tradvex',   slug:'trade-board',        route:'forum',        category:'Signals',    topics:['EUR/USD','GBP/USD','BTC/USD','trading signals','technical analysis'] },
  { id:'1972c09e-a68e-4997-b2a8-00756ead609c', name:'Certivade', slug:'global-trade-assoc', route:'association',  category:'Trade',      topics:['trade certification','regulatory compliance','MiFID II','ESMA'] },
  { id:'64a6087d-480f-4040-9df1-ad020faf5796', name:'Execvex',   slug:'executive-network',  route:'executive',    category:'Leadership', topics:['executive interview','C-suite','hedge fund manager','broker leadership'] },
  { id:'27fdf1e6-8c0c-4591-ae9b-5a2c5cacee22', name:'Signalix',  slug:'market-radar',       route:'market-radar', category:'Signals',    topics:['market radar','volatility index','VIX','crypto signals','forex signals'] },
]

const COVER_IMAGES: Record<string, string> = {
  Trade: 'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=1200&q=80',
  Finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  Gold: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&q=80',
  Strategy: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
  Analysis: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  Research: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
  Markets: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&q=80',
  Signals: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&q=80',
  Leadership: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=80',
}

async function generateArticleWithWebSearch(site: typeof SITES[0], topic: string): Promise<{ title: string; body: string } | null> {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are a senior financial journalist writing for ${site.name}, an elite financial portal. Today is ${today}.

Write a 600-750 word professional article that:
- Leads with TODAY's actual market data (search for it)
- Uses specific real numbers, price levels, and events from the last 24-48 hours
- Is written in a professional financial journalism style (like Reuters/Bloomberg)
- Has a compelling headline
- Includes 4-5 paragraphs with real market context

Format response as:
HEADLINE: [compelling article title]
BODY:
[full article body]`,
        messages: [{
          role: 'user',
          content: `Search for the latest news and write a ${site.category} article about: ${topic}. Use real, current market data from today or yesterday. Include specific price levels, percentage moves, and real market events.`
        }]
      }),
      signal: AbortSignal.timeout(60000),
    })

    const data = await response.json()
    const textBlock = data.content?.find((b: any) => b.type === 'text')
    const text = textBlock?.text || ''
    
    const headlineMatch = text.match(/HEADLINE:\s*(.+)/i)
    const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i)
    
    if (headlineMatch && bodyMatch) {
      return {
        title: headlineMatch[1].trim().replace(/^["']|["']$/g, ''),
        body: bodyMatch[1].trim()
      }
    }

    // Fallback: split on first newline
    const lines = text.split('\n').filter(Boolean)
    return {
      title: lines[0].replace(/^#+\s*/, '').replace(/\*+/g, '').trim(),
      body: lines.slice(1).join('\n\n').trim()
    }
  } catch (e) {
    console.error(`Error generating article for ${site.name}:`, e)
    return null
  }
}

function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) + '-' + Date.now().toString(36)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'REDACTED_CRON_SECRET'
  
  // Allow Vercel cron (no auth header) or manual trigger with secret
  if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: any[] = []
  const errors: any[] = []
  let published = 0

  for (const site of SITES) {
    // Pick random topic for this run
    const topic = site.topics[Math.floor(Math.random() * site.topics.length)]
    
    try {
      const article = await generateArticleWithWebSearch(site, topic)
      if (!article || !article.title || !article.body) {
        errors.push({ site: site.name, error: 'No content generated' })
        continue
      }

      const slug = makeSlug(article.title)
      const excerpt = article.body.split('\n').filter(Boolean)[0]?.slice(0, 280) + '...'
      const readTime = Math.ceil(article.body.split(' ').length / 200)
      const cover = COVER_IMAGES[site.category] || COVER_IMAGES.Finance

      const { error } = await supabase.from('news_articles').insert({
        news_site_id: site.id,
        title: article.title,
        slug,
        excerpt,
        body: article.body,
        category: site.category,
        tags: [topic, site.category, 'Market Analysis'],
        cover_image_url: cover,
        is_featured: false,
        is_breaking: false,
        status: 'published',
        published_at: new Date().toISOString(),
        ai_generated: true,
        read_time_minutes: readTime,
        author_name: 'Editorial Team',
      })

      if (error) {
        errors.push({ site: site.name, error: error.message })
      } else {
        published++
        results.push({ site: site.name, title: article.title, topic })
      }
    } catch (e: any) {
      errors.push({ site: site.name, error: e.message })
    }
  }

  return NextResponse.json({
    success: true,
    published,
    total_sites: SITES.length,
    timestamp: new Date().toISOString(),
    articles: results,
    errors: errors.length ? errors : undefined,
  })
}
