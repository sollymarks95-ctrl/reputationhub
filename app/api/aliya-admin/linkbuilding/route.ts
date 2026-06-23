import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const ANTH  = process.env.ANTHROPIC_API_KEY || ''
const ALIYA_SITE_ID = '9cfd54a9-5e1c-414c-8fe1-12b779013fca'

function db() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||ANON) }

async function claude(prompt: string, system: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json','x-api-key':ANTH,'anthropic-version':'2023-06-01' },
    body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:2000, system, messages:[{role:'user',content:prompt}] })
  })
  const d = await r.json()
  return d.content?.[0]?.text || ''
}

async function getTopArticles(limit=5) {
  const { data } = await db().from('news_articles')
    .select('title,slug,excerpt,category,published_at,views')
    .eq('news_site_id', ALIYA_SITE_ID)
    .eq('status','published')
    .order('views',{ascending:false})
    .limit(limit)
  return data || []
}

async function getRedditPosts() {
  try {
    const r = await fetch('https://www.reddit.com/r/aliyah/hot.json?limit=20', {
      headers:{'User-Agent':'AliyaToday/1.0'},
      signal: AbortSignal.timeout(8000)
    })
    const d = await r.json()
    return (d.data?.children||[]).map((c:any) => ({
      id: c.data.id,
      title: c.data.title,
      url: `https://reddit.com${c.data.permalink}`,
      score: c.data.score,
      comments: c.data.num_comments,
      selftext: (c.data.selftext||'').slice(0,400),
    }))
  } catch { return [] }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'draft_toi') {
    const articles = await getTopArticles(5)
    const picked = articles[body.articleIndex ?? 0] || articles[0]
    if (!picked) return NextResponse.json({error:'No articles'},{status:400})
    const url = `https://aliyatoday.com/article/aliya-today/${picked.slug}`
    const draft = await claude(
      `Write a Times of Israel blog post based on this AliyaToday article.\n\nTitle: ${picked.title}\nExcerpt: ${picked.excerpt}\nCategory: ${picked.category}\nURL: ${url}\n\nRequirements:\n- 450-600 words\n- First person as Solly Marks, oleh in Ashdod\n- Open with personal hook about aliyah experience\n- Practical insights for diaspora Jews\n- Link to AliyaToday.com naturally once\n- Warm, personal, not promotional\n- Byline at end: "Solly Marks is an Israeli entrepreneur and founder of AliyaToday.com"\n\nReturn ONLY the post text with a Subject/Title line first.`,
      'You ghostwrite authentic personal content for Solly Marks for the Times of Israel blog. Human voice, no marketing language.'
    )
    return NextResponse.json({ draft, article: picked, articleUrl: url, submitUrl: 'https://blogs.timesofisrael.com/wp-login.php', topArticles: articles })
  }

  if (action === 'reddit_opportunities') {
    const [posts, articles] = await Promise.all([getRedditPosts(), getTopArticles(15)])
    const articleList = articles.map((a:any) => `"${a.title}" → https://aliyatoday.com/article/aliya-today/${a.slug}`).join('\n')
    const postList = posts.slice(0,12).map((p:any,i:number) => `${i+1}. "${p.title}" (${p.score} upvotes)\nURL: ${p.url}${p.selftext ? '\nContext: '+p.selftext : ''}`).join('\n\n')
    const analysis = await claude(
      `Hot posts on r/aliyah right now:\n\n${postList}\n\nAliyaToday articles available:\n${articleList}\n\nFor posts where an article genuinely helps (score 7+), write a Reddit reply (80-140 words) that:\n- Answers directly and helpfully first\n- Links the article naturally only if it truly adds value\n- Sounds like an experienced oleh, not a marketer\n\nReturn ONLY JSON array: [{"post_title":"...","post_url":"...","reply":"...","article_url":"...","score":1-10}]\nOnly include score >= 7.`,
      'Experienced oleh helping people on Reddit. Only share links when genuinely useful. Never promotional.'
    )
    let opportunities: any[] = []
    try { opportunities = JSON.parse(analysis.replace(/```json|```/g,'').trim()) } catch { opportunities = [] }
    return NextResponse.json({ opportunities, totalPosts: posts.length })
  }

  if (action === 'haro_draft') {
    const { query, publication, deadline } = body
    const draft = await claude(
      `Write a HARO media pitch for this query:\n\nQuery: "${query}"\nPublication: ${publication||'Unknown'}\nDeadline: ${deadline||'ASAP'}\n\nPitch as Solly Marks:\n- Israeli entrepreneur, oleh, Ashdod\n- Founder AliyaToday.com — leading English aliyah resource\n- Expert: aliyah process, Israeli immigration, expat life in Israel\n\nRequirements: 150-250 words, lead with most relevant credential, 2-3 specific insights, mention AliyaToday.com as platform, end with [your@email.com] / aliyatoday.com\n\nReturn ONLY the pitch text.`,
      'Write expert HARO pitches for Solly Marks. Direct, credible, no fluff.'
    )
    return NextResponse.json({ draft, query, publication })
  }

  if (action === 'outreach_email') {
    const { orgName, orgType, contactName } = body
    const email = await claude(
      `Write outreach email from Solly Marks to ${orgName} (${orgType||'Jewish organisation'}).\n${contactName?'Contact: '+contactName:''}\n\nGoal: Get them to link to AliyaToday.com in their newsletter or resources page.\n\nRequirements:\n- 150-200 words max\n- Acknowledge their work genuinely\n- Describe AliyaToday briefly (practical English aliyah guides, updated daily)\n- Offer one specific resource relevant to their community\n- Simple ask: add AliyaToday.com to their resources\n- Sign: Solly Marks, Founder — AliyaToday.com | Ashdod, Israel\n\nReturn Subject line first, then email body.`,
      'Write genuine community outreach for Solly Marks. Brief, helpful, not salesy.'
    )
    return NextResponse.json({ email, orgName })
  }

  if (action === 'save_outreach') {
    const { orgName, orgType, contactEmail, platform, status, notes } = body
    const { error } = await db().from('link_building_outreach').upsert({
      org_name: orgName, org_type: orgType, contact_email: contactEmail||'',
      platform: platform||'email', status: status||'drafted',
      notes: notes||'', updated_at: new Date().toISOString()
    }, { onConflict: 'org_name,platform' })
    if (error) return NextResponse.json({error:error.message},{status:500})
    return NextResponse.json({ ok: true })
  }

  if (action === 'get_outreach') {
    const { data } = await db().from('link_building_outreach')
      .select('*').order('updated_at',{ascending:false}).limit(200)
    return NextResponse.json({ records: data||[] })
  }

  return NextResponse.json({ error:'Unknown action' },{status:400})
}
