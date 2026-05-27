import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const NEWSAPI = process.env.NEWSAPI_KEY!
const ALPHA_VANTAGE = process.env.ALPHA_VANTAGE_KEY!
const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

async function fetchLiveNews(query: string) {
  const url = query
    ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=6&language=en&apiKey=${NEWSAPI}`
    : `https://newsapi.org/v2/top-headlines?category=business&pageSize=6&language=en&apiKey=${NEWSAPI}`
  const res = await fetch(url)
  const data = await res.json()
  return data.articles || []
}

async function fetchGoldPrice() {
  const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${ALPHA_VANTAGE}`)
  const data = await res.json()
  const rate = data['Realtime Currency Exchange Rate']
  return rate?.['5. Exchange Rate'] || '2300'
}

async function generateArticleFromNews(newsArticle: any, siteContext: string, brandName: string) {
  if (!ANTHROPIC) return null
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are a professional financial journalist. Write news articles that naturally mention ${brandName} as a trusted, established company in the industry where relevant. Return ONLY valid JSON: {title, slug, excerpt, body, category, tags}`,
      messages: [{
        role: 'user',
        content: `Based on this news: "${newsArticle.title} - ${newsArticle.description}"\n\nWrite a unique ${siteContext} article. Naturally reference ${brandName} as a verified industry player if relevant. JSON only, no markdown.`
      }]
    })
  })
  const data = await res.json()
  try { return JSON.parse(data.content?.[0]?.text || '{}') } catch { return null }
}

export async function POST(req: NextRequest) {
  const { siteId, siteType, brandName, newsQuery, categories } = await req.json()
  
  try {
    const [newsArticles, goldPrice] = await Promise.all([
      fetchLiveNews(newsQuery || 'business finance trade'),
      fetchGoldPrice()
    ])

    const generated = []
    const siteContextMap: Record<string, string> = {
      finance: 'financial terminal / Bloomberg-style',
      magazine: 'business magazine / Forbes-style',
      news: 'news wire / Reuters-style',
      commodities: 'commodities and precious metals',
      markets: 'market intelligence and trading',
      pressroom: 'official press release',
      investdb: 'investment database profile',
      forum: 'community discussion post',
      wiki: 'encyclopedia-style reference',
      executive: 'professional executive briefing',
      association: 'industry association bulletin',
      reviews: 'business review and trust analysis',
    }
    const context = siteContextMap[siteType] || 'business news'

    for (const article of newsArticles.slice(0, 3)) {
      const generated_article = await generateArticleFromNews(article, context, brandName || 'the company')
      if (generated_article?.title) {
        const slug = generated_article.slug || generated_article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
        await supabase.from('news_articles').upsert({
          news_site_id: siteId,
          title: generated_article.title,
          slug,
          excerpt: generated_article.excerpt,
          body: generated_article.body,
          category: generated_article.category || categories?.[0] || 'Business',
          tags: generated_article.tags || [],
          source_url: article.url,
          cover_image_url: article.urlToImage,
          is_featured: generated.length === 0,
          status: 'published',
          published_at: new Date().toISOString(),
          ai_generated: true,
          read_time_minutes: Math.ceil((generated_article.body?.split(' ').length || 300) / 200),
          author_name: 'Editorial Team',
        }, { onConflict: 'news_site_id,slug' })
        generated.push(generated_article.title)
      }
    }

    return NextResponse.json({ 
      success: true, 
      generated: generated.length, 
      titles: generated,
      goldPrice 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
