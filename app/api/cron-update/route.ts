import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

async function generateArticles(site: any, count: number) {
  const topics: Record<string, string> = {
    news: 'global trade, exports, shipping, supply chains, international business',
    finance: 'financial markets, forex, stocks, bonds, central banks, interest rates',
    commodities: 'gold, silver, oil, precious metals, commodities, mining',
    magazine: 'business strategy, corporate leadership, innovation, entrepreneurship',
    reviews: 'business trust, company reviews, B2B reputation, verified businesses',
    wiki: 'company profiles, industry knowledge, trade regulations, market data',
    pressroom: 'corporate press releases, company announcements, mergers acquisitions',
    investdb: 'startup funding, private equity, venture capital, investment deals',
    forum: 'trade community discussions, market debates, business Q&A',
    association: 'trade certification, compliance standards, industry association news',
    executive: 'executive careers, CEO profiles, leadership moves, C-suite news',
    markets: 'market signals, trading intelligence, technical analysis, price movements',
  }
  const topic = topics[site.site_type || 'news'] || topics.news

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: `You write for ${site.name}, a professional publication. Generate ${count} unique, SEO-optimised news articles. Each must cover a DIFFERENT specific story or angle. Return ONLY a JSON array, no markdown backticks.`,
      messages: [{ role: 'user', content: `Write ${count} professional articles (350-500 words each) about: ${topic}. Make each one a distinct story. Format: [{"title":"Compelling SEO headline","slug":"url-slug","excerpt":"2-sentence compelling summary with keywords","body":"Full article with 4-5 paragraphs separated by \\n\\n. Include specific data, quotes, company names, statistics. Professional journalism quality.","category":"News","tags":["tag1","tag2","tag3"],"author_name":"${['Sarah Mitchell','James Thornton','Emma Hartley','Dr. Michael Wong','Research Desk','Markets Desk','Analysis Team'][Math.floor(Math.random()*7)]}","read_time_minutes":5}]` }]
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
  if (auth !== `Bearer ${process.env.CRON_SECRET || 'rephub-cron-2025-secure'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sites } = await supabase.from('news_sites').select('*').eq('is_live', true)
  if (!sites?.length) return NextResponse.json({ message: 'No sites' })

  const images = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800',
    'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=800',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800',
  ]

  const results = []
  for (const site of sites) {
    try {
      const articles = await generateArticles(site, 3)
      let inserted = 0
      for (const a of articles) {
        const slug = (a.slug || a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)) + '-' + Date.now()
        const { error } = await supabase.from('news_articles').upsert({
          news_site_id: site.id,
          title: a.title, slug,
          excerpt: a.excerpt, body: a.body,
          category: a.category || 'News',
          tags: a.tags || [],
          cover_image_url: images[Math.floor(Math.random() * images.length)],
          is_featured: false, is_breaking: Math.random() > 0.9,
          status: 'published',
          published_at: new Date().toISOString(),
          ai_generated: true,
          read_time_minutes: a.read_time_minutes || 5,
          author_name: a.author_name || 'Editorial Team',
        }, { onConflict: 'news_site_id,slug' })
        if (!error) inserted++
      }
      results.push({ site: site.name, inserted })
    } catch (e: any) {
      results.push({ site: site.name, error: e.message })
    }
  }

  return NextResponse.json({
    success: true, timestamp: new Date().toISOString(),
    total: results.reduce((a, r) => a + (r.inserted || 0), 0), results
  })
}
