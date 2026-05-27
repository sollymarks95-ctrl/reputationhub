import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!

const STYLE = "Professional editorial news photograph, photorealistic, high quality, dramatic lighting, no text, no watermarks, cinematic"
const IMG_PROMPTS: Record<string, string> = {
  'Trade': 'global shipping port cargo containers cranes maritime',
  'Markets': 'financial trading floor screens charts Wall Street',
  'Finance': 'modern bank glass skyscraper financial district dusk',
  'Gold': 'gold bullion bars coins polished surface luxury',
  'Silver': 'silver precious metals bars studio photography metallic',
  'Commodities': 'oil barrels wheat fields copper industrial commodity',
  'Forex': 'currency exchange notes coins forex trading screens',
  'Strategy': 'executive boardroom meeting glass walls city skyline',
  'Leadership': 'business leader walking modern corporate office',
  'ESG': 'wind turbines solar panels green sustainable energy',
  'Research': 'data analysis charts multiple monitors tech office',
  'Analysis': 'financial analyst charts trading screens close-up',
  'Signals': 'candlestick charts technical indicators trading screens',
  'Default': 'global business finance city skyline financial district',
}

async function generateAIImage(title: string, category: string): Promise<string | null> {
  if (!OPENAI_KEY) return null
  const prompt = `${STYLE}: ${IMG_PROMPTS[category] || IMG_PROMPTS['Default']}. Scene: ${title.substring(0, 80)}`
  for (const model of ['gpt-image-1', 'dall-e-3']) {
    try {
      const body: any = { model, prompt, n: 1, size: '1024x1024' }
      if (model === 'dall-e-3') { body.quality = 'hd'; body.response_format = 'url' }
      else { body.quality = 'high'; body.output_format = 'url' }
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(40000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const url = data?.data?.[0]?.url
      if (url) return url
    } catch { continue }
  }
  return null
}

async function generateArticles(site: any) {
  const topics: Record<string, string> = {
    news: 'global trade, exports, shipping, supply chains, international business news',
    finance: 'financial markets, forex, stocks, bonds, central banks, interest rates, crypto',
    commodities: 'gold prices, silver, oil, copper, precious metals, mining, commodities trading',
    magazine: 'business strategy, corporate leadership, innovation, entrepreneurship, growth',
    reviews: 'business trust, company reviews, B2B reputation, verified businesses, ratings',
    wiki: 'company profiles, industry knowledge, trade regulations, market reference data',
    pressroom: 'corporate press releases, company announcements, M&A, IPOs, funding rounds',
    investdb: 'startup funding, private equity, venture capital, investment deals, valuations',
    forum: 'trade community, market debates, import export discussions, business Q&A',
    association: 'trade certification, compliance, industry association, standards news',
    executive: 'executive careers, CEO profiles, leadership moves, C-suite news, boards',
    markets: 'market signals, trading intelligence, technical analysis, price movements',
  }
  const topic = topics[site.site_type || 'news'] || topics.news

  const authorNames = ['Sarah Mitchell', 'James Thornton', 'Emma Hartley', 'Dr. Michael Wong', 'Marcus Chen', 'Priya Sharma', 'David Nakamura', 'Elena Vasquez']
  const author = authorNames[Math.floor(Math.random() * authorNames.length)]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: `You write professional long-form journalism for ${site.name}. Generate 3 unique, SEO-optimised articles (600-900 words each). Each must cover a completely DIFFERENT specific story. Return ONLY a JSON array.`,
      messages: [{ role: 'user', content: `Write 3 professional news articles about: ${topic}. Each must be 600+ words with multiple paragraphs. Include specific data, quotes, company names, statistics. SEO headlines. JSON: [{"title":"Compelling headline with keywords","slug":"seo-url-slug","excerpt":"2-sentence summary with keywords","body":"Full article 600-900 words with paragraphs separated by \\n\\n. Professional journalism. Include subheadings formatted as ## HEADING.","category":"Category","tags":["tag1","tag2","tag3"],"read_time_minutes":6}]` }]
    })
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || '[]'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch { return [] }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET || 'rephuby-cron-2025-secure'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sites } = await supabase.from('news_sites').select('*').eq('is_live', true)
  if (!sites?.length) return NextResponse.json({ message: 'No sites' })

  const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1024',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1024',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1024',
    'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=1024',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1024',
  ]

  const results = []
  for (const site of sites) {
    try {
      const articles = await generateArticles(site)
      let inserted = 0
      const authorNames = ['Sarah Mitchell', 'James Thornton', 'Emma Hartley', 'Dr. Michael Wong', 'Marcus Chen', 'Priya Sharma']

      for (const a of articles) {
        const slug = (a.slug || a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)) + '-' + Date.now()

        // Generate AI image for this article
        let imageUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
        try {
          const aiImage = await generateAIImage(a.title, a.category || 'Default')
          if (aiImage) imageUrl = aiImage
        } catch { /* use fallback */ }

        const { error } = await supabase.from('news_articles').upsert({
          news_site_id: site.id,
          title: a.title,
          slug,
          excerpt: a.excerpt,
          body: a.body,
          category: a.category || 'News',
          tags: a.tags || [],
          cover_image_url: imageUrl,
          is_featured: false,
          is_breaking: Math.random() > 0.9,
          status: 'published',
          published_at: new Date().toISOString(),
          ai_generated: true,
          read_time_minutes: a.read_time_minutes || 6,
          author_name: authorNames[Math.floor(Math.random() * authorNames.length)],
        }, { onConflict: 'news_site_id,slug' })
        if (!error) inserted++
      }
      results.push({ site: site.name, inserted })
    } catch (e: any) {
      results.push({ site: site.name, error: e.message?.substring(0, 50) })
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    total: results.reduce((a, r) => a + ((r as any).inserted || 0), 0),
    results
  })
}
