export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const JEWISH_SITES = [
  { slug: 'jewish-news-now',        name: 'Jewish News Now',        domain: 'jewishnewsnow.com',        color: '#1a56b0', icon: '📰' },
  { slug: 'jewish-property-report', name: 'Jewish Property Report', domain: 'jewishpropertyreport.com', color: '#0a7c4e', icon: '🏠' },
  { slug: 'aliya-today',            name: 'Aliya Today',            domain: 'aliyatoday.com',           color: '#c47d1a', icon: '✈️' },
]

const TONE_MAP: Record<string, string> = {
  'Warm & Personal': 'Write warmly, like a fellow community member sharing something genuinely helpful. Use "our community", "fellow olim", personal phrasing. Sound like a real person.',
  'Informative':     'Lead with the most useful insight. Clear and factual. No fluff. Like a knowledgeable friend sharing something important.',
  'Direct & Punchy': 'Short sentences. Bold hook. Real talk. Maximum 4 sentences total. Create urgency.',
  'Question Hook':   'Open with a compelling question that makes the reader stop. Then answer it referencing the article. Pull them in.',
  'Storytelling':    "Open with a brief relatable scenario — a moment someone planning Aliyah would recognise. Then connect it to the article insight.",
}

const SITE_CONTEXT: Record<string, string> = {
  'jewish-news-now':        'Jewish News Now covers breaking Israel and global Jewish community news. Audience: diaspora Jews interested in Israel.',
  'jewish-property-report': 'Jewish Property Report covers Israeli real estate. Audience: Jews considering buying property in Israel.',
  'aliya-today':            'Aliya Today guides Jews making Aliyah. Audience: people actively planning or in the process of making Aliyah.',
}

export async function POST(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { tone = 'Warm & Personal', siteSlug } = await req.json()
  const sitesToProcess = siteSlug ? JEWISH_SITES.filter(s => s.slug === siteSlug) : JEWISH_SITES
  const posts = []

  for (const site of sitesToProcess) {
    const { data: siteRow } = await sb.from('news_sites').select('id').eq('slug', site.slug).single()
    if (!siteRow) continue

    const { data: articles } = await sb
      .from('news_articles')
      .select('slug, title, excerpt, category, published_at')
      .eq('news_site_id', siteRow.id).eq('status', 'published')
      .order('published_at', { ascending: false }).limit(1)

    const article = articles?.[0]
    if (!article) continue

    const url  = `https://${site.domain}/article/${site.slug}/${article.slug}`
    const toneInstr = TONE_MAP[tone] || TONE_MAP['Warm & Personal']

    const prompt = `You are writing a Facebook post for a Jewish community group.

SITE: ${site.name}
AUDIENCE: ${SITE_CONTEXT[site.slug]}
TONE: ${toneInstr}

ARTICLE TITLE: ${article.title}
ARTICLE EXCERPT: ${article.excerpt}
FULL ARTICLE URL: ${url}

Write a Facebook post that:
- Is 3–5 sentences maximum (under 120 words)
- Opens with a strong first line that stops the scroll
- Includes 1–3 relevant emojis placed naturally
- Does NOT say "Check out this article" or "I found this article"
- Does NOT include the URL in the post body — it will be added below
- Ends with a natural call to action like "Link below 👇" or "Full guide in comments 👇"
- Sounds like a real person from the community

Return ONLY the post text. No preamble, no labels, no quotes.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text?.trim() || '[Generation failed]'
      posts.push({ site: site.name, siteSlug: site.slug, siteDomain: site.domain, siteColor: site.color, siteIcon: site.icon, article: { ...article, url }, postBody: text, fullPost: `${text}\n\n👉 ${url}`, tone })
    } catch {
      posts.push({ site: site.name, siteSlug: site.slug, siteDomain: site.domain, siteColor: site.color, siteIcon: site.icon, article: { ...article, url }, postBody: '[Generation failed — try again]', fullPost: `[Generation failed]\n\n👉 ${url}`, tone })
    }
  }

  return NextResponse.json({ posts })
}
