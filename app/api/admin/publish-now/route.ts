import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ── Site config ──────────────────────────────────────────────────────────────
const SITES = [
  {
    slug: 'jewish-news-now',
    id:   '8dc3f4f2-309c-4f3b-98c6-a6d42d037778',
    name: 'Jewish News Now',
    domain: 'jewishnewsnow.com',
    persona: 'Senior Jewish news journalist. AP/Reuters discipline: lead with who/what/where/when. Short paragraphs, active voice, inverted pyramid. Named sources, named institutions (JTA, Times of Israel, Jerusalem Post, Reuters). Every article has a new data point or development.',
    topics: [
      'Israel news breaking today 2026',
      'antisemitism rising in US universities 2026',
      'Israel Gaza ceasefire hostage deal update 2026',
      'Jewish diaspora community news USA 2026',
      'Israel Iran nuclear tensions 2026',
      'Israel US relations Trump administration 2026',
      'Knesset legislation 2026 key votes',
      'aliyah statistics record immigration to Israel 2026',
      'Israel high tech startups exits 2026',
      'Jerusalem news politics today 2026',
    ],
    category: 'News',
  },
  {
    slug: 'jewish-property-report',
    id:   '15762338-2746-45ea-95b5-6685ed3c480e',
    name: 'Jewish Property Report',
    domain: 'jewishpropertyreport.com',
    persona: 'Israeli real estate journalist for diaspora buyers. Lead with a price figure or market stat. Include real NIS/ILS numbers from Madlan/Yad2. Explain Israeli concepts in plain English. Include at least one worked cost example.',
    topics: [
      'Tel Aviv apartment prices per sqm 2026',
      'how to buy property in Israel as a foreigner step by step',
      'Jerusalem property investment guide 2026',
      'Israel property purchase tax mas rechisha foreigners 2026',
      'Israeli mortgage mashkanta guide for olim 2026',
      'best neighbourhoods buy Tel Aviv 2026',
      'Israel real estate market forecast Q4 2026',
      'Netanya real estate prices diaspora buyers 2026',
      'Tama 38 Pinui Binui explained 2026',
      'rental yield Tel Aviv vs Jerusalem 2026',
    ],
    category: 'Real Estate',
  },
  {
    slug: 'aliya-today',
    id:   '9cfd54a9-5e1c-414c-8fe1-12b779013fca',
    name: 'Aliya Today',
    domain: 'aliyatoday.com',
    persona: 'Experienced oleh and journalist. Warm, direct, specific. Like advice from a trusted friend who made aliyah. Cites NBN, Jewish Agency, Misrad HaKlita, Gov.il. Uses Hebrew terms with English explanations. Always includes at least one real number, timeline, or cost figure.',
    topics: [
      'how to make aliyah step by step 2026 complete guide',
      'sal klita absorption basket benefits how much 2026',
      'nefesh bnefesh aliyah application process guide',
      'kupat holim health fund comparison olim 2026 which is best',
      'aliyah from USA complete guide 2026',
      'misrad haklita first steps new olim guide',
      'ulpan free israel how to register 2026',
      'israel bank account olim how to open 2026',
      'bituach leumi national insurance olim guide 2026',
      'aliyah checklist 2026 everything you need to bring',
    ],
    category: 'Aliyah Guides',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(t: string) {
  return t.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-$/, '')
}

async function getAnthropicKey(db: any): Promise<string> {
  const { data } = await db.from('system_api_keys').select('key_value').eq('key_name', 'ANTHROPIC_API_KEY').single()
  return data?.key_value || process.env.ANTHROPIC_API_KEY || ''
}

async function generateArticle(
  anthropicKey: string,
  site: typeof SITES[0],
  topic: string,
  recentTitles: string[]
): Promise<{ title: string; excerpt: string; body: string; category: string; tags: string[] } | null> {
  const recentList = recentTitles.slice(0, 20).map(t => `- ${t}`).join('\n')

  const prompt = `You are: ${site.persona}

Write a complete, publication-ready article for ${site.name} (${site.domain}).

TOPIC: ${topic}

DO NOT repeat these recent angles:
${recentList || '(none yet)'}

OUTPUT — valid JSON only, no markdown fences:
{
  "title": "60-70 char SEO headline with year if relevant",
  "excerpt": "One factual sentence, under 155 chars, with a real statistic or key fact",
  "body": "Full article HTML, 600-900 words. Use <h2>, <p>, <ul>/<li> tags. Include real figures, named sources, and specific details. No fluff.",
  "category": "${site.category}",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      tools: [{
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3,
      }],
    }),
    signal: AbortSignal.timeout(90000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  // Extract text from content blocks
  const textBlock = data.content?.find((b: any) => b.type === 'text')
  if (!textBlock?.text) throw new Error('No text in response')

  const raw = textBlock.text.trim()
  // Strip markdown fences if present
  const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(jsonStr)
}

async function getImage(category: string, slug: string, domain: string): Promise<string> {
  // Curated working Unsplash photo IDs (source.unsplash.com is deprecated)
  const PHOTO_POOLS: Record<string, string[]> = {
    'News': [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
      'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200&q=80',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80',
      'https://images.unsplash.com/photo-1565118531796-763e5082d113?w=1200&q=80',
      'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=1200&q=80',
    ],
    'Real Estate': [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
    ],
    'Aliyah Guides': [
      'https://images.unsplash.com/photo-1565118531796-763e5082d113?w=1200&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
    ],
  }
  const pool = PHOTO_POOLS[category] || PHOTO_POOLS['News']
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteFilter = searchParams.get('site') // optional: run one site only
  const articlesPerSite = Math.min(parseInt(searchParams.get('n') || '3', 10), 5)

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const anthropicKey = await getAnthropicKey(db)
  if (!anthropicKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not found in DB or env' }, { status: 500 })
  }

  // ── Look up REAL site IDs from DB — never rely on hardcoded UUIDs ──────────
  const slugsToRun = siteFilter
    ? SITES.filter(s => s.slug === siteFilter).map(s => s.slug)
    : SITES.map(s => s.slug)

  const { data: dbSites, error: dbErr } = await db
    .from('news_sites')
    .select('id,slug,name,is_live,domain')
    .in('slug', slugsToRun)

  if (dbErr || !dbSites?.length) {
    return NextResponse.json({ error: `DB lookup failed: ${dbErr?.message || 'no sites found'}`, slugs: slugsToRun }, { status: 500 })
  }

  const todayUTC = new Date(); todayUTC.setUTCHours(0,0,0,0)
  const DAILY_CAP = 15
  const report: any[] = []

  for (const dbSite of dbSites) {
    // Merge DB row with static config (topics, persona, etc.)
    const staticCfg = SITES.find(s => s.slug === dbSite.slug)!
    const site = { ...staticCfg, id: dbSite.id, domain: dbSite.domain || staticCfg.domain }

    const siteReport: any = {
      site: site.slug,
      db_id: dbSite.id,  // show real ID so we can verify
      inserted: 0, errors: [], articles: []
    }

    // Auto-fix is_live
    if (!dbSite.is_live) {
      await db.from('news_sites').update({ is_live: true }).eq('id', dbSite.id)
      siteReport.fixed_live = true
    }

    // Check daily cap
    const { count: todayCount } = await db.from('news_articles')
      .select('id', { count: 'exact', head: true })
      .eq('news_site_id', site.id).eq('status', 'published')
      .gte('published_at', todayUTC.toISOString())

    const remaining = DAILY_CAP - (todayCount || 0)
    const toGenerate = Math.min(articlesPerSite, remaining)
    siteReport.today_before = todayCount || 0
    siteReport.generating = toGenerate

    if (toGenerate <= 0) {
      siteReport.note = `Daily cap ${DAILY_CAP} reached (${todayCount} today)`
      report.push(siteReport)
      continue
    }

    // Fetch recent titles to avoid duplication
    const { data: recentRows } = await db.from('news_articles')
      .select('title').eq('news_site_id', site.id)
      .gte('published_at', new Date(Date.now() - 14*24*60*60*1000).toISOString())
      .order('published_at', { ascending: false }).limit(50)
    const recentTitles = (recentRows || []).map((r: any) => r.title)

    for (let i = 0; i < toGenerate; i++) {
      const topic = site.topics[i % site.topics.length]

      try {
        const article = await generateArticle(anthropicKey, site, topic, recentTitles)
        if (!article) { siteReport.errors.push(`${topic}: no article returned`); continue }

        const slug = `${slugify(article.title)}-${Date.now()}`
        const coverImage = await getImage(article.category, slug, site.domain)

        const { error: insertErr } = await db.from('news_articles').insert({
          news_site_id: site.id,
          title: article.title,
          slug,
          excerpt: article.excerpt || '',
          body: article.body || '',
          category: article.category || site.category,
          tags: Array.isArray(article.tags) ? article.tags : [],
          author_name: 'Solly Marks',
          cover_image_url: coverImage,
          status: 'published',
          published_at: new Date().toISOString(),
          is_featured: false,
          article_type: 'news',
          ai_generated: true,
          read_time_minutes: Math.ceil((article.body || '').split(' ').length / 200),
        })

        if (insertErr) {
          siteReport.errors.push(`Insert failed: ${insertErr.message}`)
        } else {
          siteReport.inserted++
          siteReport.articles.push({
            title: article.title,
            url: `https://${site.domain}/article/${site.slug}/${slug}`,
          })
          recentTitles.unshift(article.title)
        }

        // Small pause between articles
        await new Promise(r => setTimeout(r, 500))
      } catch (e: any) {
        siteReport.errors.push(`${topic}: ${e.message}`)
      }
    }

    report.push(siteReport)
  }

  const totalInserted = report.reduce((s, r) => s + (r.inserted || 0), 0)
  return NextResponse.json({ ok: true, total_inserted: totalInserted, sites: report })
}
