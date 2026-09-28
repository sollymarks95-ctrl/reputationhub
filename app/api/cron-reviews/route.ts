import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// ── Database ────────────────────────────────────────────────────────────────
const DB_URL  = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const DB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DB_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DB_ANON
  )
}

// ── Active sites ─────────────────────────────────────────────────────────────
const SITES: Record<string, { id: string; domain: string; name: string; author: string }> = {
  'aliya-today':            { id: '9cfd54a9-5e1c-414c-8fe1-12b779013fca', domain: 'aliyatoday.com',           name: 'AliyaToday',             author: 'Solly Marks' },
  'jewish-news-now':        { id: '8dc3f4f2-309c-4f3b-98c6-a6d42d037778', domain: 'jewishnewsnow.com',        name: 'Jewish News Now',        author: 'Solly Marks' },
  'jewish-property-report': { id: '15762338-2746-45ea-95b5-6685ed3c480e', domain: 'jewishpropertyreport.com', name: 'Jewish Property Report', author: 'Solly Marks' },
}

// ── Review-intent filter ──────────────────────────────────────────────────────
// Only topics that naturally lend themselves to a review/comparison/best-of
// article — these are the highest-converting SEO formats.
const REVIEW_SIGNALS = [
  'best','top','compare','vs','review','which','recommended','worth it',
  'guide','how to choose','pros and cons','alternatives','cheapest','cheapest',
  'rating','ranked','list of','types of','options for',
]

function isReviewTopic(topic: string): boolean {
  const t = topic.toLowerCase()
  return REVIEW_SIGNALS.some(s => t.includes(s))
}

// ── Per-site review topic seeds ───────────────────────────────────────────────
// Used as fallback if trending_topics table has no review-intent topics today
const FALLBACK_TOPICS: Record<string, string[]> = {
  'aliya-today': [
    'best ulpan programs israel 2026 review',
    'kupat holim comparison which health fund is best for olim',
    'best neighbourhoods for english speakers israel 2026',
    'nefesh bnefesh vs jewish agency which to use',
    'best israeli banks for new olim compared',
    'absorption center vs private rental which is better 2026',
    'best moving companies for aliyah reviewed',
    'top israeli cities for olim ranked 2026',
  ],
  'jewish-news-now': [
    'best jewish news sources online reviewed 2026',
    'top jewish community organisations worldwide compared',
    'best synagogues for english speakers israel reviewed',
    'top jewish education programs compared 2026',
  ],
  'jewish-property-report': [
    'best areas to buy property in israel 2026 reviewed',
    'tel aviv vs jerusalem property investment compared',
    'top real estate agents for foreign buyers israel',
    'best mortgages for olim compared 2026',
    'netanya vs haifa vs tel aviv which to invest',
    'best property developers in israel ranked 2026',
  ],
}

// ── Article generation ────────────────────────────────────────────────────────
async function generateReviewArticle(
  siteSlug: string,
  topic: string,
  apiKey: string
): Promise<{ title: string; excerpt: string; body: string; category: string; tags: string[] } | null> {
  const siteInfo = SITES[siteSlug]
  const today = new Date().toISOString().split('T')[0]

  const prompts: Record<string, string> = {
    'aliya-today': `You are Solly Marks — AliyaToday.com publisher and experienced oleh. Write a definitive review/comparison guide.

TOPIC: ${topic}
DATE: ${today}

MANDATORY STRUCTURE (2,000-2,500 words):
H1: [Comparison/review headline — keyword first, include 2026]
OPENING (Quick Verdict — 3 sentences): Give a direct top-pick recommendation immediately with a real reason. Perplexity and ChatGPT pull this as the direct answer.
H2: Why This Matters for New Olim
H2: Our Criteria for This Review (3-5 clear criteria you evaluated)
H2: [Option 1 Name] — Full Review
  H3: What We Like
  H3: Drawbacks  
  H3: Best For
H2: [Option 2 Name] — Full Review
  (same structure)
H2: [Option 3 Name] — Full Review (if applicable)
H2: Side-by-Side Comparison Table (HTML table: 5+ rows comparing all options across criteria)
H2: Our Verdict — Which Should You Choose?
H2: Frequently Asked Questions
  H3: [Natural question people type into Google]
  H3: [Cost/price question]
  H3: [Timing/when question]
  H3: [What if scenario]

REQUIREMENTS:
- Minimum 6 real specific numbers (prices in ₪/$, timelines, ratings, distances)
- Mention Nefesh BNefesh, Misrad HaKlita, Bituach Leumi, Jewish Agency where relevant
- Warm practical voice — like advice from a trusted friend who made aliyah recently
- Every H2 minimum 200 words
- FAQ answers minimum 80 words each
- No invented company names — use real well-known options only
- Internal reference: "As we covered in our aliyah cost breakdown..."

Return ONLY valid JSON (no markdown fences):
{"title":"Keyword-first headline 60-70 chars with 2026","excerpt":"Under 155 chars with specific recommendation or key fact","body":"<h2>...</h2><p>...</p>...","category":"Guide","tags":["aliyah 2026","israel","guide","review","olim"]}`,

    'jewish-news-now': `You are Solly Marks — JewishNewsNow.com editor. Write an authoritative review/roundup.

TOPIC: ${topic}
DATE: ${today}

STRUCTURE (1,800-2,200 words):
H1: [Review/comparison headline — keyword first, 2026]
OPENING (Quick Answer — 2-3 sentences): Direct answer to what's being reviewed.
H2: Why We Reviewed This
H2: How We Evaluated (criteria used)
H2: [Item 1] — Reviewed
H2: [Item 2] — Reviewed  
H2: [Item 3] — Reviewed
H2: Comparison Table (HTML, 5+ rows)
H2: Our Recommendation
H2: FAQ (4 questions, 80+ words each)

Requirements: factual, authoritative, cite real organisations. 5+ specific numbers.

Return ONLY valid JSON:
{"title":"...","excerpt":"...","body":"...","category":"Review","tags":["jewish news","israel","2026","review"]}`,

    'jewish-property-report': `You are Solly Marks — JewishPropertyReport.com editor. Write a definitive property review/comparison.

TOPIC: ${topic}
DATE: ${today}

STRUCTURE (2,000-2,500 words):
H1: [Property comparison headline — keyword first, 2026]
OPENING (Quick Verdict — 3 sentences): Direct investment/purchase recommendation with real price data.
H2: Market Overview 2026
H2: [Location/Option 1] — Full Review
  H3: Current Prices (real ₪/sqm data)
  H3: Rental Yields
  H3: Pros for Jewish Buyers
  H3: Drawbacks
H2: [Location/Option 2] — Full Review (same)
H2: [Location/Option 3] — Full Review (if applicable)
H2: Investment Comparison Table (HTML, price/yield/demand/growth rows)
H2: Our Verdict — Where to Buy in 2026
H2: FAQ for Foreign Buyers (4 questions, 80+ words each)

Requirements: 8+ real price figures in ₪, cite Bank of Israel/CBS data where relevant, practical advice for diaspora buyers.

Return ONLY valid JSON:
{"title":"...","excerpt":"...","body":"...","category":"Property Review","tags":["israel property","real estate","investment","2026","review"]}`,
  }

  const prompt = prompts[siteSlug] || prompts['aliya-today']

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = (data.content?.[0]?.text || '').trim()
    const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (!parsed?.title || !parsed?.body) return null
    return parsed
  } catch { return null }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || ''
  const auth = req.headers.get('authorization')
  const urlSecret = req.nextUrl.searchParams.get('secret')
  if (cronSecret && auth !== `Bearer ${cronSecret}` && urlSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const today = new Date().toISOString().split('T')[0]

  // Get API key
  const { data: keyRow } = await db.from('system_api_keys').select('key_value').eq('key_name', 'ANTHROPIC_API_KEY').single()
  const apiKey = keyRow?.key_value || process.env.ANTHROPIC_API_KEY || ''
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const results: Record<string, any> = {}

  for (const [siteSlug, siteInfo] of Object.entries(SITES)) {
    // 1. Pull review-intent topics from trending_topics (real Google search data)
    const { data: trending } = await db.from('trending_topics')
      .select('topic, score, source')
      .eq('site_slug', siteSlug)
      .gte('date', today)
      .order('score', { ascending: false })
      .limit(50)

    // Filter to review/comparison intent only
    const reviewTopics = (trending || [])
      .map((t: any) => t.topic)
      .filter(isReviewTopic)

    // Fallback to hardcoded seeds if no trending review topics today
    const topicPool = reviewTopics.length >= 2 ? reviewTopics : FALLBACK_TOPICS[siteSlug] || []
    if (topicPool.length === 0) { results[siteSlug] = { skipped: 'no topics' }; continue }

    // 2. Pick 1 topic not already published this week
    const { data: recentSlugs } = await db.from('news_articles')
      .select('title')
      .eq('news_site_id', siteInfo.id)
      .eq('status', 'published')
      .gte('published_at', new Date(Date.now() - 7 * 86400000).toISOString())

    const recentTitles = new Set((recentSlugs || []).map((r: any) => r.title.toLowerCase()))
    const topic = topicPool.find(t => !recentTitles.has(t.toLowerCase())) || topicPool[0]

    // 3. Generate the review article
    const article = await generateReviewArticle(siteSlug, topic, apiKey)
    if (!article) { results[siteSlug] = { error: 'generation failed', topic }; continue }

    // 4. Insert into news_articles
    const slug = `${today}-${slugify(article.title)}`
    const { data: existing } = await db.from('news_articles').select('id').eq('slug', slug).single()
    if (existing) { results[siteSlug] = { skipped: 'duplicate', slug }; continue }

    const { error } = await db.from('news_articles').insert({
      news_site_id: siteInfo.id,
      title: article.title,
      slug,
      excerpt: article.excerpt || '',
      body: article.body || '',
      category: article.category || 'Guide',
      tags: Array.isArray(article.tags) ? article.tags : [],
      author_name: siteInfo.author,
      cover_image_url: `https://picsum.photos/seed/${siteSlug}-review-${slug.slice(-8)}/1200/630`,
      status: 'published',
      published_at: new Date().toISOString(),
      is_featured: false,
      article_type: 'review',
      ai_generated: true,
      read_time_minutes: Math.ceil((article.body || '').split(' ').length / 200),
    })

    if (error) {
      results[siteSlug] = { error: error.message, topic }
    } else {
      results[siteSlug] = {
        inserted: 1,
        topic,
        title: article.title,
        slug,
        source: reviewTopics.length >= 2 ? 'google_trends' : 'fallback_seeds',
      }
    }

    // Small gap between sites
    await new Promise(r => setTimeout(r, 1000))
  }

  return NextResponse.json({ ok: true, date: today, results })
}
