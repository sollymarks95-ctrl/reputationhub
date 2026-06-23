import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const ANTH  = process.env.ANTHROPIC_API_KEY || ''
const ALIYA_SITE_ID = '9cfd54a9-5e1c-414c-8fe1-12b779013fca'

const SUBREDDITS = [
  // Core aliyah subs — all posts accepted
  { name: 'aliyah',              label: 'r/aliyah' },
  { name: 'MovingToIsrael',      label: 'r/MovingToIsrael' },
  { name: 'israelexpatriates',   label: 'r/israelexpatriates' },
  { name: 'living_in_israel',    label: 'r/living_in_israel' },
  { name: 'olim',                label: 'r/olim' },
  // Broader Jewish/Israel lifestyle — keyword filtered
  { name: 'JewishLiving',        label: 'r/JewishLiving' },
  { name: 'Jewish',              label: 'r/Jewish' },
  { name: 'IsraelTourism',       label: 'r/IsraelTourism' },
  { name: 'Tel_Aviv',            label: 'r/Tel_Aviv' },
  { name: 'Jerusalem',           label: 'r/Jerusalem' },
]

function db() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||ANON) }

async function claude(prompt: string, system: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json','x-api-key':ANTH,'anthropic-version':'2023-06-01' },
    body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:3000, system, messages:[{role:'user',content:prompt}] })
  })
  const d = await r.json()
  return d.content?.[0]?.text || ''
}

async function getTopArticles(limit = 20) {
  const { data } = await db().from('news_articles').select('id,title,slug,excerpt,views,category').eq('site_id', ALIYA_SITE_ID).eq('status','published').order('views', { ascending:false }).limit(limit)
  return data || []
}

async function getUsedPostIds(): Promise<Set<string>> {
  const { data } = await db().from('reddit_used_posts').select('post_id').order('used_at', { ascending:false }).limit(200)
  return new Set((data||[]).map((r:any) => r.post_id))
}

async function markPostUsed(postId: string, postTitle: string, subreddit: string) {
  await db().from('reddit_used_posts').upsert({ post_id: postId, post_title: postTitle, subreddit, used_at: new Date().toISOString() }, { onConflict: 'post_id' })
}

// Fetch Reddit posts — JSON API first, RSS fallback
async function fetchSubreddit(sub: string, sort: 'hot'|'new' = 'hot', limit = 25) {
  const hdrs = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
  }
  // Try JSON API first
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1&t=week`, {
      headers: hdrs, signal: AbortSignal.timeout(12000)
    })
    if (r.ok) {
      const d = await r.json()
      const posts = (d?.data?.children || []).map((p: any) => {
        const pd = p.data
        return { id: pd.id, title: pd.title||'', url: `https://www.reddit.com${pd.permalink}`, selftext: (pd.selftext||'').slice(0,500), subreddit: sub, author: pd.author||'', score: pd.score||0, comments: pd.num_comments||0, created: pd.created_utc||0, is_question: (pd.title||'').includes('?')||(pd.selftext||'').includes('?') }
      }).filter((p: any) => p.id && p.title && !p.title.includes('[deleted]'))
      if (posts.length > 0) return posts
    }
  } catch(e) {}
  // RSS fallback
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/${sort}.rss?limit=${limit}`, {
      headers: { ...hdrs, 'Accept': 'application/rss+xml, */*' },
      signal: AbortSignal.timeout(10000)
    })
    if (!r.ok) return []
    const xml = await r.text()
    const entries: any[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match
    while ((match = entryRegex.exec(xml)) !== null && entries.length < limit) {
      const entry = match[1]
      const title   = (/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s.exec(entry)?.[1] || '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim()
      const link    = /<link[^>]*href="([^"]+)"/.exec(entry)?.[1] || ''
      const content = (/<content[^>]*>([\s\S]*?)<\/content>/.exec(entry)?.[1] || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,400).trim()
      const id      = link.split('/comments/')?.[1]?.split('/')?.[0] || ''
      if (title && link && id && !title.toLowerCase().includes('submitted by')) {
        entries.push({ id, title, url: link, selftext: content, subreddit: sub, author: '', score: 0, comments: 0, created: Date.now()/1000, is_question: title.includes('?')||content.includes('?') })
      }
    }
    return entries
  } catch(e: any) { return [] }
}

// Find the best matching article for a post — weighted scoring
function findBestArticle(post: any, arts: any[]) {
  const postText = (post.title + ' ' + post.selftext).toLowerCase()
  const postWords = postText.split(/\W+/).filter((w: string) => w.length > 4)

  const scored = arts.map((a: any) => {
    const titleText = (a.title||'').toLowerCase()
    const excerptText = (a.excerpt||'').toLowerCase()
    const categoryText = (a.category||'').toLowerCase()

    let score = 0
    // Title word matches are worth 3x
    postWords.forEach((w: string) => {
      if (titleText.includes(w)) score += 3
      if (excerptText.includes(w)) score += 1
      if (categoryText.includes(w)) score += 2
    })

    // Topic keyword boosts
    const topicMap: Record<string, string[]> = {
      'cost': ['cost','price','expensive','cheap','afford','budget','money','salary','wage'],
      'health': ['health','kupat','hospital','doctor','insurance','medical','sick','bituach'],
      'housing': ['apartment','rent','housing','flat','home','property','buy','mortgage','mashkanta'],
      'bank': ['bank','account','transfer','money','finance','payment'],
      'school': ['school','education','children','kids','gan','kindergarten','university'],
      'driving': ['driving','licence','license','car','vehicle','transport'],
      'tax': ['tax','exemption','mas','income','salary','freelance','work'],
      'ulpan': ['ulpan','hebrew','language','learn'],
      'klita': ['klita','absorption','sal','basket','benefits'],
      'citizenship': ['citizen','passport','return','identity','teudat'],
    }
    Object.values(topicMap).forEach(kws => {
      if (kws.some(k => postText.includes(k)) && kws.some(k => (titleText+excerptText).includes(k))) {
        score += 5
      }
    })

    return { ...a, _score: score }
  }).sort((a: any, b: any) => b._score - a._score)

  // Return best match if it has any relevance, otherwise first article
  return (scored[0]?._score > 0 ? scored[0] : arts[0]) || null
}

function buildReply(post: any, art: any | null): string {
  const url = art ? `https://aliyatoday.com/article/aliya-today/${art.slug}` : null
  if (post.is_question) {
    return url
      ? `Made aliyah myself (based in Ashdod now) — happy to help with this.\n\nThe things most people miss: activating your Sal Klita absorption basket early (there are deadlines), choosing the right Kupat Holim health fund (Clalit vs Maccabi vs Meuhedet differ a lot), and getting registered with Misrad HaKlita in week one.\n\nI put together a practical breakdown here: ${url} — covers the real numbers and steps. Happy to answer specifics too.`
      : `Made aliyah myself and now based in Ashdod — happy to share experience on this.\n\nKey practical things: get your Teudat Zehut sorted in week one, choose your Kupat Holim carefully (big differences in coverage), and activate your Sal Klita before the deadlines. The gap between what official guides say and what you actually encounter is significant. Feel free to ask specifics.`
  }
  return url
    ? `Speaking from personal experience making aliyah (living in Ashdod now) — worth adding that the practical day-to-day reality often differs from what you read in advance. Things like health fund quality, first-year tax exemptions, and the Bituach Leumi setup all have nuances that catch people.\n\nCovered this in detail here if useful: ${url}`
    : `From personal experience making aliyah (Ashdod now) — the practical absorption side is often harder than the application process itself. Health funds, banking, driving licence conversion, and understanding your Sal Klita entitlements are where most people get stuck. Happy to share specifics if helpful.`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { action } = body

  // ── REDDIT: Get fresh opportunities ─────────────────────────────────────────
  if (action === 'reddit_daily') {
    const [articles, usedIds] = await Promise.all([getTopArticles(50), getUsedPostIds()])

    // Fetch all subreddits in parallel (hot only to keep it fast)
    // Fetch NEW (latest timeline) from all aliyah subs + HOT from broader subs
    // NEW = latest posts in chronological order — fresh every scan
    // HOT = top posts by votes — broader subs only to catch popular discussions
    const newFetch  = Promise.all(SUBREDDITS.slice(0,5).map(s => fetchSubreddit(s.name, 'new', 25)))
    const hotFetch  = Promise.all(SUBREDDITS.slice(5).map(s => fetchSubreddit(s.name, 'hot', 15)))
    const [newResults, hotResults] = await Promise.all([newFetch, hotFetch])
    const fetched = [...newResults, ...hotResults]

    // Deduplicate and filter already-used
    const seen = new Set<string>()
    const allPosts = fetched.flat().filter((p: any) => {
      if (!p.id || !p.title || seen.has(p.id) || usedIds.has(p.id)) return false
      seen.add(p.id)
      return true
    }).sort((a: any, b: any) => (b.is_question ? 1 : 0) - (a.is_question ? 1 : 0))

    if (!allPosts.length) {
      return NextResponse.json({ opportunities: [], totalScanned: 0, generatedAtMs: Date.now(), rateLimited: true, message: 'Reddit returned 0 posts — rate limited. Try again in 5-10 minutes.' })
    }

    // Keyword filter — only posts relevant to aliyah, Israel living, Jewish relocation
    // Keywords for broader subs — must relate to moving/living in Israel
    const ALIYAH_KEYWORDS = [
      'aliyah','aliya','oleh','olim','making aliyah','move to israel','moving to israel',
      'immigrat','nbn','nefesh','absorption','klita','sal klita','jewish agency',
      'kupat holim','bituach leumi','misrad haklita','teudat zehut','teudat oleh',
      'ulpan','arnona','bank account','bank hapoalim','bank leumi','discount bank',
      'health fund','health insurance','bituach','driving licence','driving license',
      'apartment israel','rent israel','housing israel','mortgage israel','mashkanta',
      'property israel','real estate israel','work permit','work visa israel',
      'freelance israel','tax exemption','mas hachnasa','first year israel',
      'absorption basket','shipping to israel','lift to israel',
      'school in israel','cost of living israel','salary israel','living in israel',
      'citizenship israel','passport israel','law of return','making aliyah',
      'relocat','expat israel','foreign national israel','overseas buyer'
    ]
    function isRelevant(post: any): boolean {
      // Posts from aliyah-specific subs are always relevant
      const alwaysRelevantSubs = ['aliyah', 'MovingToIsrael', 'israelexpatriates', 'olim', 'living_in_israel', 'JewishLiving']
      if (alwaysRelevantSubs.includes(post.subreddit)) return true
      // For general subs, require keyword match
      const text = (post.title + ' ' + post.selftext).toLowerCase()
      return ALIYAH_KEYWORDS.some(kw => text.includes(kw))
    }
    const relevantPosts = allPosts.filter(isRelevant)
    const postsToUse = relevantPosts

    // Generate tailored replies using Claude — topic-specific + correct article link
    const TOP_POSTS = postsToUse.slice(0, 12)
    const opportunities = await Promise.all(TOP_POSTS.map(async (post: any) => {
      const art = findBestArticle(post, articles)
      const articleUrl = art ? `https://aliyatoday.com/article/aliya-today/${art.slug}` : null

      const rawReply = await claude(
        `You are Solly Marks — made aliyah from South Africa, now living in Ashdod. You run AliyaToday.com, a practical English-language guide for olim. You give detailed, genuinely helpful Reddit replies based on real experience.

Someone posted this on Reddit r/${post.subreddit}:
TITLE: "${post.title}"
CONTENT: "${post.selftext || '(no body text)'}"

${art ? `RELEVANT ALIYATODAY.COM ARTICLE TO INCLUDE:
Article title: "${art.title}"
Full URL: ${articleUrl}
Summary: ${art.excerpt || ''}

⚠️ YOU MUST include this exact URL in your reply: ${articleUrl}
Include it naturally as a p.s. or inline mention — e.g. "I wrote a full guide on this: ${articleUrl}"` : ''}

Write a reply in this exact style — warm, personal, structured with bullet points, specific:

EXAMPLE STYLE (match tone/structure, NOT content):
"33 days is actually still within normal range for a mixed-faith couple, though I understand the anxiety! When I made aliyah from South Africa my timeline was smoother, but I've spoken to plenty of UK olim through my site and here's what I've heard:

- **Solo Jewish applicants** from the UK typically see the Mazal Tov email within 2-4 weeks post-interview
- **Mixed couples** almost always take longer — 6-10 weeks is genuinely common because the file goes through additional review at the Jewish Agency in Jerusalem
- Missing documents are the #1 reason for delays — submitting everything upfront is genuinely good

My honest advice: at the 6-week mark, email your shaliach directly asking if the file has been forwarded to Jerusalem yet. That one question tells you exactly where you are.

p.s. I wrote a detailed guide covering UK aliyah timelines and what to expect: https://aliyatoday.com/article/aliya-today/uk-to-israel-aliyah-2026"

YOUR RULES:
1. Open by acknowledging their SPECIFIC situation — show you read their post
2. Use 2-4 bullet points with **bold key terms** for scannability
3. Give ONE concrete actionable step they can take TODAY
4. ${art ? `MANDATORY: Include the full URL ${articleUrl} at the end as a p.s. or natural mention` : 'End warmly, offer to answer follow-up questions'}
5. 150-250 words — detailed but not overwhelming
6. Sound like a real oleh sharing genuine experience, NOT a template or bot

CRITICAL: Respond to "${post.title}" SPECIFICALLY. Return ONLY the reply text.`,
        'You are Solly Marks, South African oleh in Ashdod, founder of AliyaToday.com. Write structured Reddit replies with bullet points. ALWAYS include the AliyaToday.com URL when provided.'
      ).catch(() => buildReply(post, art))

      // Guarantee the URL is in the reply — append if Claude dropped it
      let replyText = rawReply
      if (articleUrl && rawReply && !rawReply.includes(articleUrl)) {
        replyText = rawReply.trimEnd() + '\n\np.s. Full guide on this topic: ' + articleUrl
      }

      return {
        post_id:       post.id,
        subreddit:     post.subreddit,
        post_title:    post.title,
        post_url:      post.url,
        reply:         replyText,
        article_url:   articleUrl,
        article_title: art?.title || null,
        relevance:     post.is_question ? 8 : 6,
        why:           post.is_question ? 'Question — direct helpful reply' : 'Discussion — adds oleh perspective',
      }
    }))

    return NextResponse.json({ opportunities, totalScanned: allPosts.length, generatedAt: new Date().toISOString(), generatedAtMs: Date.now() })
  }

  // ── REDDIT: Mark post as done ────────────────────────────────────────────────
  if (action === 'reddit_mark_done') {
    const { postId, postTitle, subreddit } = body
    await markPostUsed(postId, postTitle, subreddit)
    return NextResponse.json({ ok: true })
  }

  // ── REDDIT: History ──────────────────────────────────────────────────────────
  if (action === 'reddit_history') {
    const { data } = await db().from('reddit_used_posts').select('*').order('used_at', { ascending:false }).limit(50)
    return NextResponse.json({ history: data || [] })
  }

  // ── TOI BLOG DRAFT ───────────────────────────────────────────────────────────
  if (action === 'draft_toi') {
    const articles = await getTopArticles(10)
    const idx = (body.articleIndex || 0) % articles.length
    const article = articles[idx]
    if (!article) return NextResponse.json({ error:'No articles' }, { status:400 })
    const draft = await claude(
      `Write a 450-550 word personal blog post for the Times of Israel Blogs platform as Solly Marks.

Solly is an Israeli entrepreneur and oleh, living in Ashdod. He writes from personal experience about Israel and aliyah.

Topic to write about: "${article.title}"
Background context: ${article.excerpt || ''}

TIMES OF ISRAEL EDITORIAL GUIDELINES (strictly follow all):
1. Topic must relate to Israel, the Middle East, or Jewish life — this topic qualifies.
2. Civil and respectful tone throughout — no incitement, no hatred, constructive language only.
3. Factually accurate — do not exaggerate, mislead, or make unsupported claims.
4. NOT a marketing vehicle — mention AliyaToday.com at most once, only if genuinely natural. No affiliate links, no keyword stuffing, no SEO tactics.
5. High writing quality — clear, engaging English. Personal voice, well-structured, no technical errors.
6. Original content — not a repost or summary of another article. Fresh personal perspective.
7. One working link only — https://aliyatoday.com/article/aliya-today/${article.slug} — include only if it adds genuine reader value.

STRUCTURE:
- Title: specific, honest, not clickbait
- Opening: personal hook from Solly's perspective (Ashdod / his aliyah experience)
- Body (3-4 paragraphs): practical insights, real experience, honest observations
- Conclusion: thoughtful, invites reader discussion
- Natural (optional) mention: "I explore this further at AliyaToday.com" — only if it genuinely fits

Return ONLY the blog post. Title on first line. No preamble.`,
      'You are Solly Marks, an oleh living in Ashdod, writing for the Times of Israel Blogs. Follow TOI guidelines strictly: genuine personal voice, no promotion, accurate, civil, quality English.'
    )
    return NextResponse.json({ draft, article })
  }

  // ── HARO PITCH ───────────────────────────────────────────────────────────────
  if (action === 'haro_draft') {
    const { query, publication } = body
    const pitch = await claude(
      `Write an expert pitch response from Solly Marks to this journalist query:

Query: "${query}"
Publication: "${publication || 'unknown'}"

Solly Marks bio: Israeli entrepreneur, made aliyah from South Africa, now based in Ashdod. Founded AliyaToday.com — practical English-language guide for olim. Former competitive junior tennis player. Background in direct response media buying and e-commerce.

Pitch requirements:
- 150-200 words maximum
- Subject line first: "Subject: [your subject]"
- Credentials upfront, specific and credible
- Answer the query directly with concrete experience
- Contact: solly@aliyatoday.com | AliyaToday.com

Return ONLY the pitch, subject line first.`,
      'Write concise, credentialled expert pitches for journalist queries.'
    )
    return NextResponse.json({ draft: pitch })
  }

  // ── OUTREACH EMAIL DRAFT ─────────────────────────────────────────────────────
  if (action === 'outreach_email') {
    const { orgName, orgType, contactName } = body
    const email = await claude(
      `Write a short outreach email from Solly Marks to ${orgName} (${orgType}).

Solly is the founder of AliyaToday.com — practical English-language guides for new olim covering Sal Klita, Kupat Holim, tax exemptions, housing, and daily life in Israel. He lives in Ashdod.

The ask: would they consider linking to or sharing AliyaToday.com with their community as a practical resource for olim?

Requirements:
- Subject line first: "Subject: ..."
- 120-150 words MAX — they get hundreds of emails
- Warm, genuine, not salesy or template-sounding
- One specific resource to mention (pick the most relevant)
- Sign off: Solly Marks, Founder | AliyaToday.com | Ashdod, Israel

Return ONLY the email.`,
      'Write short, genuine outreach emails for Solly Marks. Human, not corporate.'
    )
    return NextResponse.json({ email })
  }

  // ── SEND SINGLE EMAIL ────────────────────────────────────────────────────────
  if (action === 'send_email') {
    let RESEND_KEY = process.env.RESEND_API_KEY || ''
    if (!RESEND_KEY) {
      // Fallback: read from Supabase system_api_keys table
      try {
        const { data } = await db().from('system_api_keys').select('key_value').eq('key_name','RESEND_API_KEY').single()
        RESEND_KEY = data?.key_value || ''
      } catch(e) {}
    }
    if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set in Vercel env vars or Supabase system_api_keys' }, { status: 500 })
    const { to, subject, text, html, orgName, orgType } = body
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from:'Solly Marks <solly@aliyatoday.com>', to:[to], subject, html: html || `<pre style="font-family:Georgia,serif;white-space:pre-wrap">${text}</pre>`, tags:[{name:'org_name',value:(orgName||'').slice(0,50).replace(/[^a-zA-Z0-9_-]/g,'_')}] })
    })
    const result = await r.json()
    if (r.ok) {
      await db().from('link_building_outreach').upsert({ org_name: orgName, org_type: orgType, contact_email: to, platform:'email', status:'sent', notes: subject, updated_at: new Date().toISOString() }, { onConflict:'org_name,platform' }).catch(()=>{})
    }
    return NextResponse.json({ ok: r.ok, id: result.id, error: result.message })
  }

  // ── AUTO-OUTREACH: Send to 10 Jewish orgs ───────────────────────────────────
  if (action === 'auto_outreach') {
    let RESEND_KEY = process.env.RESEND_API_KEY || ''
    if (!RESEND_KEY) {
      try {
        const { data } = await db().from('system_api_keys').select('key_value').eq('key_name','RESEND_API_KEY').single()
        RESEND_KEY = data?.key_value || ''
      } catch(e) {}
    }
    if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not configured. Add it to Vercel env vars or Supabase system_api_keys table.' }, { status: 500 })

    const TARGETS = [
      { name: "Nefesh B'Nefesh", type:'Aliyah Organisation', email:'info@nbn.org.il', angle:'As the leading aliyah facilitation org, your olim would benefit from our practical post-arrival guides.' },
      { name:'Jewish Agency', type:'Aliyah Organisation', email:'aliyah@jafi.org', angle:'Our practical guides complement your official resources — covering health funds, Sal Klita activation, and first-year taxes.' },
      { name:'Times of Israel', type:'Jewish Media', email:'editorial@timesofisrael.com', angle:'Our aliyah data and practical guides may be useful for your English-speaking readership.' },
      { name:'Aish.com', type:'Jewish Community', email:'info@aish.com', angle:'Your readers considering aliyah would find our practical cost breakdowns and guides extremely useful.' },
      { name:'Chabad.org', type:'Chabad House', email:'info@chabad.org', angle:'Many in your global community consider aliyah. Our Sal Klita and Kupat Holim guides are a practical resource to share.' },
      { name:'Jewish Federations of North America', type:'Jewish Federation', email:'info@jewishfederations.org', angle:'Your 150+ member federations serve communities where aliyah is a significant topic.' },
      { name:'MyIsrael', type:'Aliyah Organisation', email:'info@myisrael.org.il', angle:'Our practical post-aliyah guides could complement your pre-aliyah programs.' },
      { name:'Israel Forever Foundation', type:'Jewish Organisation', email:'info@israelforever.org', angle:'Your mission of deepening diaspora-Israel connection aligns with our practical content for life in Israel.' },
      { name:'WIZO', type:'Jewish Organisation', email:'wizo@wizo.org', angle:'Your work supporting families in Israel means your network would benefit from our guides on child benefits and absorption.' },
      { name:'Honest Reporting', type:'Jewish Media', email:'contact@honestreporting.com', angle:'Your pro-Israel audience includes many considering or who have made aliyah — our practical resource could be useful.' },
    ]

    const results: any[] = []
    for (const org of TARGETS) {
      try {
        const emailText = await claude(
          `Write a short outreach email from Solly Marks to ${org.name} (${org.type}).
Angle: ${org.angle}
Requirements: Subject line first. 120-150 words MAX. Warm, genuine, not salesy.
One specific AliyaToday resource. Ask if they'd share or link to aliyatoday.com.
Sign off: Solly Marks, Founder | AliyaToday.com | Ashdod, Israel
Return ONLY the email.`,
          'Write concise genuine outreach. Short and human. Never corporate or salesy.'
        )
        const lines = emailText.trim().split('\n')
        const subjectLine = lines.find((l:string) => /^subject:/i.test(l.trim())) || lines[0]
        const subject = subjectLine.replace(/^subject:\s*/i,'').trim()
        const body_lines = lines.filter((l:string) => !/^subject:/i.test(l.trim()))
        const bodyText = body_lines.join('\n').trim()

        const sendR = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
          body: JSON.stringify({
            from: 'Solly Marks <solly@aliyatoday.com>',
            to: [org.email],
            subject,
            html: `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#111;max-width:600px">${bodyText.split('\n').map((p:string) => p.trim() ? `<p>${p}</p>` : '').join('')}</div>`,
            tags: [{ name:'campaign', value:'outreach_v1' }, { name:'org', value:org.name.slice(0,50).replace(/[^a-zA-Z0-9_-]/g,'_') }]
          })
        })
        const sendResult = await sendR.json()
        if (sendR.ok) {
          await db().from('link_building_outreach').upsert({ org_name: org.name, org_type: org.type, contact_email: org.email, platform:'email', status:'sent', notes: subject, updated_at: new Date().toISOString() }, { onConflict:'org_name,platform' }).catch(()=>{})
        }
        results.push({ org: org.name, email: org.email, ok: sendR.ok, subject, error: sendResult.message })
        await new Promise(r => setTimeout(r, 600))
      } catch(e:any) {
        results.push({ org: org.name, ok: false, error: e.message })
      }
    }
    const sent = results.filter(r => r.ok).length
    return NextResponse.json({ ok: true, sent, total: results.length, results })
  }

  // ── GET OUTREACH CRM ─────────────────────────────────────────────────────────
  if (action === 'get_outreach') {
    const { data } = await db().from('link_building_outreach').select('*').order('updated_at', { ascending:false }).limit(50)
    return NextResponse.json({ records: data || [] })
  }

  // ── CHECK RESEND KEY STATUS ─────────────────────────────────────────────────
  if (action === 'check_resend') {
    let key = process.env.RESEND_API_KEY || ''
    if (!key) {
      try {
        const { data } = await db().from('system_api_keys').select('key_value').eq('key_name','RESEND_API_KEY').single()
        key = data?.key_value || ''
      } catch(e) {}
    }
    if (!key) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY is not set in Vercel environment variables or Supabase' })
    // Test the key with a dry-run by hitting Resend domains endpoint
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${key}` }
      })
      const d = await r.json()
      if (r.ok) return NextResponse.json({ ok: true, message: 'Resend connected ✅', domains: d.data?.map((x:any)=>x.name) })
      return NextResponse.json({ ok: false, error: `Resend API error: ${d.message || r.status}` })
    } catch(e:any) {
      return NextResponse.json({ ok: false, error: `Network error: ${e.message}` })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
