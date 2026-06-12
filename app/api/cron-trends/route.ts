import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic    = 'force-dynamic'
export const maxDuration = 120

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||ANON)
}

// Google Trends RSS feeds
const TRENDS_FEEDS = {
  israel:  'https://trends.google.com/trending/rss?geo=IL',
  usa:     'https://trends.google.com/trending/rss?geo=US',
  global:  'https://trends.google.com/trending/rss',
}

// News RSS feeds
const NEWS_FEEDS = {
  times_of_israel: 'https://www.timesofisrael.com/feed/',
  jta:             'https://www.jta.org/feed',
  jpost:           'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',
}

// Reddit RSS feeds
const REDDIT_FEEDS = {
  israel:  'https://www.reddit.com/r/Israel/hot.json?limit=25',
  aliyah:  'https://www.reddit.com/r/aliyah/hot.json?limit=25',
  jewish:  'https://www.reddit.com/r/Jewish/hot.json?limit=20',
}

// Keywords that indicate relevance to each site
const SITE_KEYWORDS = {
  'jewish-news-now': [
    'israel','jewish','jews','hamas','hezbollah','gaza','jerusalem','tel aviv',
    'netanyahu','knesset','idf','mossad','antisemit','aliyah','diaspora',
    'synagogue','passover','shabbat','kosher','rabbi','zion','settler'
  ],
  'jewish-property-report': [
    'israel','property','apartment','real estate','housing','rent','mortgage',
    'tel aviv','jerusalem','construction','building','invest','price','sqm',
    'neighbourhood','tama','buy','sell','market','yield'
  ],
  'aliya-today': [
    'aliya','aliyah','olim','oleh','immigration','israel','immigrant','nefesh',
    'absorption','ulpan','hebrew','misrad','klita','citizenship','passport',
    'relocation','move to israel','making aliya','jewish agency'
  ]
}

function isRelevant(text: string, slug: string): boolean {
  const lower = text.toLowerCase()
  const keywords = SITE_KEYWORDS[slug as keyof typeof SITE_KEYWORDS] || []
  return keywords.some(k => lower.includes(k))
}

async function fetchXmlTopics(url: string, source: string): Promise<{title:string;source:string}[]> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RepHuby/1.0)' },
      signal: AbortSignal.timeout(8000)
    })
    if (!r.ok) return []
    const xml = await r.text()
    const titles: {title:string;source:string}[] = []
    const regex = /<title>(?:<!\[CDATA\[)?([^<\]]+)(?:\]\]>)?<\/title>/g
    let m
    while ((m = regex.exec(xml)) !== null) {
      const t = m[1].trim()
      if (t && t.length > 5 && !t.includes('<?') && !t.toLowerCase().includes('rss')) {
        titles.push({ title: t, source })
      }
    }
    return titles.slice(0, 20)
  } catch { return [] }
}

async function fetchRedditTopics(url: string, source: string): Promise<{title:string;source:string;score:number}[]> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RepHuby/1.0)' },
      signal: AbortSignal.timeout(8000)
    })
    if (!r.ok) return []
    const data = await r.json()
    return (data?.data?.children || [])
      .filter((p: any) => p.data?.score > 50)
      .map((p: any) => ({
        title: p.data.title,
        source,
        score: p.data.score || 0
      }))
      .slice(0, 15)
  } catch { return [] }
}

async function getAnthropicKey(db: ReturnType<typeof getDb>): Promise<string> {
  const { data } = await db.from('system_api_keys').select('key_value').eq('key_name','ANTHROPIC_API_KEY').single()
  return data?.key_value || process.env.ANTHROPIC_API_KEY || ''
}

async function generateTopicsWithAI(
  rawTopics: {title:string;source:string;score?:number}[],
  siteSlug: string,
  apiKey: string
): Promise<string[]> {
  if (!apiKey || rawTopics.length === 0) return []

  const siteDescriptions: Record<string, string> = {
    'jewish-news-now':        'Jewish and Israel news website targeting English-speaking Jewish readers worldwide',
    'jewish-property-report': 'Israeli real estate website for diaspora investors and olim buying property in Israel',
    'aliya-today':            'Complete guide website for Jews making aliya (immigrating) to Israel',
  }

  const prompt = `You are an SEO content strategist for "${siteSlug}" — a ${siteDescriptions[siteSlug]}.

Today's trending topics from Google Trends Israel, Reddit r/Israel, r/aliyah and major Jewish news outlets:
${rawTopics.map((t,i) => `${i+1}. [${t.source}] ${t.title}`).join('\n')}

Based on these trending topics, generate 10 specific SEO article topics for ${siteSlug} that:
1. Are directly relevant to the site's audience
2. Match what people are ACTUALLY searching RIGHT NOW
3. Have a clear question or guide format (e.g., "How to...", "What is...", "Is it safe to...", "2026 guide to...")
4. Would rank on Google for searches the audience makes
5. Are 100% unique angles not just repeating the headline

Return ONLY a JSON array of 10 article topic strings, no other text:
["Topic 1", "Topic 2", ...]`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!res.ok) return []
    const data = await res.json()
    const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || ''
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const topics = JSON.parse(match[0])
      return Array.isArray(topics) ? topics.slice(0, 10) : []
    }
  } catch {}
  return []
}

export async function GET(req: NextRequest) {
  const secret   = req.headers.get('authorization')?.replace('Bearer ','') ?? ''
  const expected = process.env.CRON_SECRET ?? ''
  if (expected && secret !== expected) return NextResponse.json({ error:'Unauthorized' },{ status:401 })

  const db      = getDb()
  const apiKey  = await getAnthropicKey(db)
  const today   = new Date().toISOString().split('T')[0]
  const results: Record<string, any> = {}

  // 1. Fetch all raw topics from feeds in parallel
  const [
    israelTrends, usTrends,
    toiNews, jtaNews, jpostNews,
    redditIsrael, redditAliyah, redditJewish
  ] = await Promise.all([
    fetchXmlTopics(TRENDS_FEEDS.israel, 'google_trends_il'),
    fetchXmlTopics(TRENDS_FEEDS.usa,    'google_trends_us'),
    fetchXmlTopics(NEWS_FEEDS.times_of_israel, 'times_of_israel'),
    fetchXmlTopics(NEWS_FEEDS.jta,             'jta'),
    fetchXmlTopics(NEWS_FEEDS.jpost,           'jerusalem_post'),
    fetchRedditTopics(REDDIT_FEEDS.israel, 'reddit_israel'),
    fetchRedditTopics(REDDIT_FEEDS.aliyah, 'reddit_aliyah'),
    fetchRedditTopics(REDDIT_FEEDS.jewish, 'reddit_jewish'),
  ])

  const allRaw = [
    ...israelTrends, ...usTrends,
    ...toiNews, ...jtaNews, ...jpostNews,
    ...redditIsrael, ...redditAliyah, ...redditJewish
  ]

  console.log(`[cron-trends] Fetched ${allRaw.length} raw topics from feeds`)

  // 2. For each Jewish site, filter relevant topics and use AI to generate article angles
  const JEWISH_SITES = ['jewish-news-now', 'jewish-property-report', 'aliya-today']

  for (const siteSlug of JEWISH_SITES) {
    // Filter relevant raw topics for this site
    const relevant = allRaw.filter(t => isRelevant(t.title, siteSlug))
    console.log(`[cron-trends] ${siteSlug}: ${relevant.length} relevant raw topics`)

    // Use AI to convert raw headlines into SEO article topics
    const aiTopics = await generateTopicsWithAI(relevant.slice(0, 30), siteSlug, apiKey)

    // Also add direct relevant headlines as topics
    const directTopics = relevant
      .filter(t => t.source.includes('reddit') || t.source.includes('jta'))
      .map(t => t.title)
      .slice(0, 5)

    const allTopics = [...new Set([...aiTopics, ...directTopics])]

    // Save to DB — upsert to avoid duplicates
    let saved = 0
    for (const topic of allTopics) {
      const sourceItem = allRaw.find(r => r.title === topic)
      const { error } = await db.from('trending_topics').upsert({
        site_slug: siteSlug,
        topic,
        source: sourceItem?.source || 'ai_generated',
        score: (sourceItem as any)?.score || 0,
        date: today,
        discovered_at: new Date().toISOString(),
      }, { onConflict: 'site_slug,topic,date', ignoreDuplicates: true })
      if (!error) saved++
    }

    results[siteSlug] = { relevant: relevant.length, ai_topics: aiTopics.length, saved }
  }

  return NextResponse.json({
    ok: true,
    date: today,
    raw_fetched: allRaw.length,
    results
  })
}
