import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const ANTH  = process.env.ANTHROPIC_API_KEY || ''
const ALIYA_SITE_ID = '9cfd54a9-5e1c-414c-8fe1-12b779013fca'

const SUBREDDITS = [
  { name: 'aliyah',            label: 'r/aliyah' },
  { name: 'MovingToIsrael',    label: 'r/MovingToIsrael' },
  { name: 'israelexpatriates', label: 'r/israelexpatriates' },
  { name: 'Israel',            label: 'r/Israel' },
  { name: 'Jewish',            label: 'r/Jewish' },
  { name: 'expats',            label: 'r/expats' },
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

// Fetch Reddit posts via RSS — works from Vercel servers
async function fetchSubreddit(sub: string, sort: 'hot'|'new' = 'hot', limit = 25) {
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/${sort}.rss?limit=${limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(12000)
    })
    if (!r.ok) return []
    const xml = await r.text()
    const entries: any[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match
    while ((match = entryRegex.exec(xml)) !== null && entries.length < limit) {
      const entry = match[1]
      const title   = (/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s.exec(entry)?.[1] || '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim()
      const link    = /<link[^>]*href="([^"]+)"/.exec(entry)?.[1] || ''
      const author  = (/<name>(.*?)<\/name>/.exec(entry)?.[1] || '').trim()
      const content = (/<content[^>]*>([\s\S]*?)<\/content>/.exec(entry)?.[1] || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,400).trim()
      const id      = link.split('/comments/')?.[1]?.split('/')?.[0] || ''
      if (title && link && id && !title.toLowerCase().includes('submitted by /u/')) {
        entries.push({ id, title, url: link, score: 0, comments: 0, selftext: content, created: Date.now()/1000, subreddit: sub, author, is_question: title.includes('?') || content.includes('?') })
      }
    }
    return entries
  } catch (e: any) {
    console.error(`Reddit fetch failed r/${sub}:`, e.message)
    return []
  }
}

// Find the best matching article for a post
function findBestArticle(post: any, arts: any[]) {
  const text = (post.title + ' ' + post.selftext).toLowerCase()
  const scored = arts.map((a: any) => {
    const aText = ((a.title||'') + ' ' + (a.excerpt||'')).toLowerCase()
    const words = aText.split(/\W+/).filter((w: string) => w.length > 4)
    const hits  = words.filter((w: string) => text.includes(w)).length
    return { ...a, _hits: hits }
  }).sort((a: any, b: any) => b._hits - a._hits)
  return scored[0] || arts[0] || null
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
    const [articles, usedIds] = await Promise.all([getTopArticles(25), getUsedPostIds()])

    // Fetch all subreddits in parallel (hot only to keep it fast)
    const fetched = await Promise.all(SUBREDDITS.map(s => fetchSubreddit(s.name, 'hot', 20)))

    // Deduplicate and filter already-used
    const seen = new Set<string>()
    const allPosts = fetched.flat().filter((p: any) => {
      if (!p.id || !p.title || seen.has(p.id) || usedIds.has(p.id)) return false
      seen.add(p.id)
      return true
    }).sort((a: any, b: any) => (b.is_question ? 1 : 0) - (a.is_question ? 1 : 0))

    if (!allPosts.length) {
      return NextResponse.json({ opportunities: [], totalScanned: 0, generatedAtMs: Date.now(), message: 'Reddit returned 0 posts — may be rate limited, try again in a few minutes' })
    }

    // Keyword filter — only posts relevant to aliyah, Israel living, Jewish relocation
    const ALIYAH_KEYWORDS = [
      'aliyah','aliya','israel','oleh','olim','absorption','klita','sal klita',
      'nbsn','nbn','nefesh','moving to israel','reloc','immigrat','making aliyah',
      'kupat holim','bituach','misrad','teudat','ulpan','jerusalem','tel aviv',
      'ashdod','netanya','haifa','beer sheva','rehovot','jewish','diaspora',
      'passport','citizenship','visa','bank account','arnona','apartment','rent',
      'housing','school','education','health','insurance','work permit','job',
      'language','hebrew','community','synagogue','shul','shabbat','kosher'
    ]
    function isRelevant(post: any): boolean {
      const text = (post.title + ' ' + post.selftext).toLowerCase()
      return ALIYAH_KEYWORDS.some(kw => text.includes(kw))
    }
    const relevantPosts = allPosts.filter(isRelevant)
    const postsToUse = relevantPosts.length > 0 ? relevantPosts : allPosts

    // Build opportunities for relevant posts only
    const opportunities = postsToUse.slice(0, 15).map((post: any) => {
      const art = findBestArticle(post, articles)
      const articleUrl = art ? `https://aliyatoday.com/article/aliya-today/${art.slug}` : null
      const replyText = buildReply(post, art)
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
    })

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
    const RESEND_KEY = process.env.RESEND_API_KEY || ''
    if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set in Vercel env vars' }, { status: 500 })
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
    const RESEND_KEY = process.env.RESEND_API_KEY || ''
    if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set in Vercel env vars — go to Vercel dashboard > Settings > Environment Variables and add it' }, { status: 500 })

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

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
