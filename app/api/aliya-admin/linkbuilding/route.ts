import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const ANTH  = process.env.ANTHROPIC_API_KEY || ''
const ALIYA_SITE_ID = '9cfd54a9-5e1c-414c-8fe1-12b779013fca'

// Subreddits to monitor — ordered by relevance
const SUBREDDITS = [
  { name: 'aliyah',            label: 'r/aliyah',            priority: 1 },
  { name: 'Israel',            label: 'r/Israel',            priority: 2 },
  { name: 'Jewish',            label: 'r/Jewish',            priority: 3 },
  { name: 'israelexpatriates', label: 'r/israelexpatriates', priority: 2 },
  { name: 'MovingToIsrael',    label: 'r/MovingToIsrael',    priority: 1 },
  { name: 'expats',            label: 'r/expats',            priority: 3 },
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
  const { data } = await db().from('news_articles')
    .select('title,slug,excerpt,category,tags,views')
    .eq('news_site_id', ALIYA_SITE_ID)
    .eq('status','published')
    .order('views', { ascending: false })
    .limit(limit)
  return data || []
}

async function fetchSubreddit(sub: string, sort: 'hot'|'new' = 'hot', limit = 25) {
  // Try JSON API first with browser-like headers, fall back to RSS
  try {
    const jsonR = await fetch(`https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10000)
    })
    if (jsonR.ok) {
      const d = await jsonR.json()
      const posts = (d.data?.children || [])
        .filter((c: any) => !c.data.stickied)
        .map((c: any) => ({
          id: c.data.id,
          title: c.data.title,
          url: `https://reddit.com${c.data.permalink}`,
          score: c.data.score,
          comments: c.data.num_comments,
          selftext: (c.data.selftext || '').slice(0, 600),
          created: c.data.created_utc,
          subreddit: sub,
          author: c.data.author,
          is_question: c.data.title.includes('?') || (c.data.selftext||'').includes('?'),
        }))
      if (posts.length > 0) return posts
    }
  } catch {}
  // RSS fallback
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/${sort}.rss?limit=${limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AliyaToday/1.0; +https://aliyatoday.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(12000)
    })
    if (!r.ok) return []
    const xml = await r.text()
    // Parse RSS <entry> tags
    const entries: any[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1]
      const title  = (/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s.exec(entry)?.[1] || '').trim()
      const link   = /<link[^>]*href="([^"]+)"/.exec(entry)?.[1] || ''
      const author = /<name>(.*?)<\/name>/.exec(entry)?.[1] || ''
      const content = (/<content[^>]*>([\s\S]*?)<\/content>/.exec(entry)?.[1] || '').replace(/<[^>]+>/g,'').slice(0,500).trim()
      const id = link.split('/comments/')?.[1]?.split('/')?.[0] || Math.random().toString(36).slice(2)
      if (title && link && !title.toLowerCase().includes('submitted by')) {
        entries.push({
          id,
          title,
          url: link,
          score: 1,
          comments: 0,
          flair: '',
          selftext: content,
          created: Date.now() / 1000,
          subreddit: sub,
          author,
          is_question: title.includes('?') || content.includes('?'),
        })
      }
    }
    return entries.slice(0, limit)
  } catch (e: any) {
    console.error(`Reddit RSS fetch failed for r/${sub}:`, e.message)
    return []
  }
}

// Get already-used post IDs to avoid repeats
async function getUsedPostIds(): Promise<Set<string>> {
  const { data } = await db().from('reddit_used_posts').select('post_id').limit(500)
  return new Set((data||[]).map((r:any) => r.post_id))
}

async function markPostUsed(postId: string, postTitle: string, subreddit: string) {
  await db().from('reddit_used_posts').upsert(
    { post_id: postId, post_title: postTitle, subreddit, used_at: new Date().toISOString() },
    { onConflict: 'post_id' }
  ).catch(() => {})
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  // ── REDDIT: Get fresh opportunities ───────────────────────────────────────
  if (action === 'reddit_daily') {
    const [articles, usedIds] = await Promise.all([
      getTopArticles(25),
      getUsedPostIds()
    ])

    // Fetch from all subreddits in parallel
    const allFetches = await Promise.all([
      ...SUBREDDITS.map(s => fetchSubreddit(s.name, 'hot', 25)),
      fetchSubreddit('aliyah', 'new', 15),  // also check new posts in r/aliyah
    ])

    // Flatten, dedupe by id, filter already used
    const seen = new Set<string>()
    const allPosts = allFetches.flat()
      .filter((p: any) => {
        if (seen.has(p.id) || usedIds.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      // Prioritise questions and posts with engagement
      .sort((a: any, b: any) => {
        const aScore = (a.is_question ? 30 : 0) + Math.min(a.comments * 2, 40) + Math.min(a.score / 10, 30)
        const bScore = (b.is_question ? 30 : 0) + Math.min(b.comments * 2, 40) + Math.min(b.score / 10, 30)
        return bScore - aScore
      })
      .slice(0, 30)

    if (!allPosts.length) return NextResponse.json({ opportunities: [], message: 'No new posts found' })

    const articleList = articles.map((a: any) =>
      `"${a.title}" [${a.category}] → https://aliyatoday.com/article/aliya-today/${a.slug}\nExcerpt: ${a.excerpt||''}`
    ).join('\n\n')

    const postList = allPosts.map((p: any, i: number) =>
      `POST ${i+1} [r/${p.subreddit}] [${p.is_question?'QUESTION':'DISCUSSION'}]
Title: "${p.title}"
Body: ${p.selftext || '(link post / no body)'}
Engagement: ${p.score} upvotes, ${p.comments} comments
URL: ${p.url}`
    ).join('\n\n---\n\n')

    const today = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

    const analysis = await claude(
      `Today is ${today}. You are helping Solly Marks — Israeli entrepreneur, experienced oleh living in Ashdod, founder of AliyaToday.com.

Here are fresh Reddit posts from Jewish/Israel/Aliyah subreddits:

${postList}

Here are AliyaToday articles that could help:

${articleList}

YOUR TASK:
For each Reddit post where Solly can genuinely add value with a helpful comment, create a reply. Prioritise posts where:
1. Someone is asking a question about aliyah, moving to Israel, or Israeli life
2. Someone is confused about bureaucracy, costs, health system, housing, etc.
3. The discussion is about a topic AliyaToday covers well

For each opportunity, write a reply that:
- STARTS by directly answering or helping — not with "I" or "Great question"
- Sounds like a real experienced oleh who has been through it
- Is 80-160 words — conversational, not an essay
- If an AliyaToday article directly helps, include the URL naturally at the END only — like "I wrote a full breakdown of this at [url] if helpful" — never as the main point
- DO NOT include a link if no article directly covers it — answer from experience instead
- Never say "AliyaToday" or "my site" in an obviously promotional way

Return ONLY valid JSON array (no preamble, no fences):
[{
  "post_id": "reddit post id",
  "subreddit": "subreddit name",
  "post_title": "full title",
  "post_url": "full reddit url",
  "reply": "full reply text ready to paste",
  "article_url": "full article url or null if no article used",
  "article_title": "article title or null",
  "relevance": 1-10,
  "why": "one sentence why this reply helps"
}]

Include ALL posts with relevance >= 4. Be generous — if someone discusses Israel, aliyah, or Jewish life and you can help, include it. Aim for at least 5-8 replies. Rank by relevance descending.`,
      'You are Solly Marks, experienced oleh in Ashdod. Be generous — include any post where you can genuinely help, even loosely related. Better to suggest more than fewer.'
    )

    let opportunities: any[] = []
    try {
      const clean = analysis.replace(/```json|```/g, '').trim()
      opportunities = JSON.parse(clean)
    } catch {
      // Try to extract JSON array if wrapped in text
      const match = analysis.match(/\[[\s\S]+\]/)
      if (match) { try { opportunities = JSON.parse(match[0]) } catch { opportunities = [] } }
    }

    // Filter and sort
    opportunities = opportunities
      .filter((o: any) => o.relevance >= 4 && o.reply && o.post_url)
      .sort((a: any, b: any) => b.relevance - a.relevance)
      .slice(0, 12)

    return NextResponse.json({
      opportunities,
      totalScanned: allPosts.length,
      subreddits: SUBREDDITS.map(s => s.label),
      generatedAt: new Date().toISOString(),
      generatedAtMs: Date.now(),
      date: today,
    })
  }

  // ── REDDIT: Mark post as done (used) ──────────────────────────────────────
  if (action === 'reddit_mark_done') {
    const { postId, postTitle, subreddit } = body
    await markPostUsed(postId, postTitle, subreddit)
    return NextResponse.json({ ok: true })
  }

  // ── REDDIT: Get history of used posts ─────────────────────────────────────
  if (action === 'reddit_history') {
    const { data } = await db().from('reddit_used_posts')
      .select('*').order('used_at', { ascending: false }).limit(100)
    return NextResponse.json({ history: data || [] })
  }

  // ── TOI Blog Post Drafter ──────────────────────────────────────────────────
  if (action === 'draft_toi') {
    const articles = await getTopArticles(5)
    const picked = articles[body.articleIndex ?? 0] || articles[0]
    if (!picked) return NextResponse.json({ error:'No articles' }, { status:400 })
    const url = `https://aliyatoday.com/article/aliya-today/${picked.slug}`
    const draft = await claude(
      `Write a Times of Israel blog post based on:\nTitle: ${picked.title}\nExcerpt: ${picked.excerpt}\nURL: ${url}\n\n- 450-600 words\n- First person as Solly Marks, oleh in Ashdod\n- Personal hook, practical insights for diaspora Jews\n- Link to AliyaToday.com once naturally\n- Byline: "Solly Marks is an Israeli entrepreneur and founder of AliyaToday.com"\n\nReturn title first, then post body.`,
      'Ghostwrite authentic personal content for Solly Marks for the Times of Israel blog. Human voice, no marketing.'
    )
    return NextResponse.json({ draft, article: picked, articleUrl: url, submitUrl: 'https://blogs.timesofisrael.com/wp-login.php', topArticles: articles })
  }

  // ── HARO Pitch ────────────────────────────────────────────────────────────
  if (action === 'haro_draft') {
    const { query, publication, deadline } = body
    const draft = await claude(
      `Write a HARO pitch for:\nQuery: "${query}"\nPublication: ${publication||'Unknown'}\nDeadline: ${deadline||'ASAP'}\n\nAs Solly Marks — Israeli entrepreneur, oleh in Ashdod, founder AliyaToday.com.\n150-250 words, expert credential first, 2-3 specific insights, end with [your@email.com] / aliyatoday.com\n\nReturn ONLY the pitch text.`,
      'Write expert HARO pitches for Solly Marks. Direct, credible, no fluff.'
    )
    return NextResponse.json({ draft, query, publication })
  }

  // ── Outreach Email ─────────────────────────────────────────────────────────
  if (action === 'outreach_email') {
    const { orgName, orgType, contactName } = body
    const email = await claude(
      `Outreach email from Solly Marks to ${orgName} (${orgType||'Jewish organisation'}).\n${contactName?'Contact: '+contactName:''}\nGoal: Get them to link AliyaToday.com in their newsletter or resources.\n150-200 words, genuine, simple ask, sign as Solly Marks Founder AliyaToday.com Ashdod Israel.\nReturn Subject line first then email.`,
      'Write genuine community outreach for Solly Marks. Brief, helpful, not salesy.'
    )
    return NextResponse.json({ email, orgName })
  }

  // ── Save outreach ──────────────────────────────────────────────────────────
  if (action === 'save_outreach') {
    const { orgName, orgType, contactEmail, platform, status, notes } = body
    const { error } = await db().from('link_building_outreach').upsert({
      org_name: orgName, org_type: orgType, contact_email: contactEmail||'',
      platform: platform||'email', status: status||'drafted',
      notes: notes||'', updated_at: new Date().toISOString()
    }, { onConflict: 'org_name,platform' })
    if (error) return NextResponse.json({ error: error.message }, { status:500 })
    return NextResponse.json({ ok: true })
  }

  // ── Get outreach CRM ───────────────────────────────────────────────────────
  if (action === 'get_outreach') {
    const { data } = await db().from('link_building_outreach')
      .select('*').order('updated_at', { ascending: false }).limit(200)
    return NextResponse.json({ records: data || [] })
  }


  // ── Send outreach email via Resend ────────────────────────────────────────
  if (action === 'send_email') {
    const { to, subject, html, orgName, orgType } = body
    const RESEND_KEY = process.env.RESEND_API_KEY || ''
    if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'Solly Marks <solly@aliyatoday.com>',
        to: [to],
        subject,
        html: html || `<p>${body.text?.replace(/\n/g,'<br>')}</p>`,
        tags: [
          { name: 'org_name', value: (orgName||'').slice(0,50).replace(/[^a-zA-Z0-9_\-]/g,'_') },
          { name: 'org_type', value: (orgType||'outreach').slice(0,50).replace(/[^a-zA-Z0-9_\-]/g,'_') },
          { name: 'campaign', value: 'link_building' },
        ]
      })
    })
    const result = await r.json()
    if (!r.ok) return NextResponse.json({ error: result.message || 'Send failed' }, { status: 400 })

    // Mark as sent in CRM
    if (orgName) {
      await db().from('link_building_outreach').upsert({
        org_name: orgName, org_type: orgType||'', contact_email: to,
        platform: 'email', status: 'sent',
        notes: subject, updated_at: new Date().toISOString()
      }, { onConflict: 'org_name,platform' }).catch(() => {})
    }

    return NextResponse.json({ ok: true, id: result.id })
  }


  // ── AUTO OUTREACH — draft + send to all target orgs ─────────────────────
  if (action === 'auto_outreach') {
    const RESEND_KEY = process.env.RESEND_API_KEY || ''
    if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

    const TARGET_ORGS = [
      { name: "Nefesh B'Nefesh", type: 'Aliyah Organisation', email: 'info@nbn.org.il',
        angle: 'As the leading aliyah facilitation organisation, your community would benefit from our practical day-to-day oleh guides covering Sal Klita, Kupat Holim, and bureaucracy navigation.' },
      { name: 'Jewish Agency Aliyah', type: 'Aliyah Organisation', email: 'aliyah@jafi.org',
        angle: 'Our practical English-language guides complement your official aliyah resources — specifically covering post-arrival life, health funds, tax planning, and housing that olim need help with immediately.' },
      { name: 'Times of Israel', type: 'Jewish Media', email: 'editorial@timesofisrael.com',
        angle: 'As a daily publisher covering Israel for the English-speaking Jewish world, you may find our aliyah data and oleh insights useful for your readership.' },
      { name: 'Aish.com', type: 'Jewish Community', email: 'info@aish.com',
        angle: 'Your readers who are considering aliyah or have family in Israel would find our practical cost breakdowns and step-by-step guides extremely useful.' },
      { name: 'Chabad.org', type: 'Chabad House', email: 'info@chabad.org',
        angle: 'Many in your global community consider or make aliyah. Our practical guides — covering Sal Klita amounts, Kupat Holim comparison, and first-year costs — would be a valuable resource to share.' },
      { name: 'Jewish Federations of North America', type: 'Jewish Federation', email: 'info@jewishfederations.org',
        angle: 'Your 150+ member federations serve communities where Israel connection and aliyah are significant topics. AliyaToday.com could be a valuable resource for your Israel engagement programs.' },
      { name: 'MyIsrael', type: 'Aliyah Organisation', email: 'info@myisrael.org.il',
        angle: 'As an organisation helping Jews connect with Israel, our practical post-aliyah guides on Kupat Holim, Bituach Leumi, and daily life could complement your pre-aliyah programs.' },
      { name: 'Israel Forever Foundation', type: 'Jewish Organisation', email: 'info@israelforever.org',
        angle: 'Your mission of deepening the connection between diaspora Jews and Israel aligns perfectly with our content helping people understand and navigate life in Israel.' },
      { name: 'WIZO', type: 'Jewish Organisation', email: 'wizo@wizo.org',
        angle: 'Your work supporting women and families in Israel means many in your network would benefit from our guides on health funds, child benefits, and absorption support for new olim.' },
      { name: 'Honest Reporting', type: 'Jewish Media', email: 'contact@honestreporting.com',
        angle: 'Your English-speaking pro-Israel audience includes many who are considering or have made aliyah — our practical resource could be useful to share with your community.' },
    ]

    const results: any[] = []

    for (const org of TARGET_ORGS) {
      try {
        // Draft email via Claude
        const draftResp = await claude(
          `Write a short outreach email from Solly Marks to ${org.name} (${org.type}).

Angle: ${org.angle}

Requirements:
- 120-160 words MAXIMUM — keep it short, they get hundreds of emails
- Subject line first on its own line starting with "Subject: "
- Warm, genuine, not salesy
- One specific AliyaToday resource to mention (pick the most relevant: Sal Klita guide, Kupat Holim comparison, 10-year tax exemption guide, or aliyah checklist 2026)
- Simple ask: "Would you consider adding AliyaToday.com to your resources / sharing with your community?"
- Sign off: Solly Marks, Founder — AliyaToday.com | Ashdod, Israel

Return ONLY the email (subject line first, then body). No preamble.`,
          'Write concise, genuine outreach emails for Solly Marks. Short and human. Never salesy.'
        )

        const lines = draftResp.trim().split('\n')
        const subjectLine = lines.find((l: string) => l.toLowerCase().startsWith('subject:')) || lines[0]
        const subject = subjectLine.replace(/^subject:\s*/i, '').trim()
        const bodyLines = lines.filter((l: string) => !l.toLowerCase().startsWith('subject:'))
        const body = bodyLines.join('\n').trim()
        const htmlBody = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#111;max-width:600px">${body.split('\n').map((p: string) => p ? `<p>${p}</p>` : '').join('')}</div>`

        // Send via Resend
        const sendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
          body: JSON.stringify({
            from: 'Solly Marks <solly@aliyatoday.com>',
            to: [org.email],
            subject,
            html: htmlBody,
            tags: [
              { name: 'org_name', value: org.name.slice(0,50).replace(/[^a-zA-Z0-9_\-]/g,'_') },
              { name: 'campaign', value: 'auto_outreach_v1' },
            ]
          })
        })
        const sendResult = await sendResp.json()

        // Save to CRM
        await db().from('link_building_outreach').upsert({
          org_name: org.name, org_type: org.type, contact_email: org.email,
          platform: 'email', status: sendResp.ok ? 'sent' : 'drafted',
          notes: `${subject}\n\n${body}`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'org_name,platform' }).catch(() => {})

        results.push({ org: org.name, email: org.email, ok: sendResp.ok, id: sendResult.id, subject })
        
        // Small delay between sends to avoid rate limits
        await new Promise(r => setTimeout(r, 800))

      } catch (err: any) {
        results.push({ org: org.name, email: org.email, ok: false, error: err.message })
      }
    }

    const sent = results.filter(r => r.ok).length
    return NextResponse.json({ ok: true, sent, total: results.length, results })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
