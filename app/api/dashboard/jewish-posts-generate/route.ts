import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

export async function POST(req: NextRequest) {
  const { articles, tone } = await req.json()

  const SITE_CONTEXT: Record<string, string> = {
    'jewish-news-now':        'Jewish News Now covers Israel & global Jewish community news. Audience: diaspora Jews interested in Israel.',
    'jewish-property-report': 'Jewish Property Report covers Israeli real estate for foreign buyers & diaspora investors. Audience: Jews considering property in Israel.',
    'aliya-today':            'Aliya Today is the go-to guide for Jews making Aliyah (moving to Israel). Audience: people actively planning or considering Aliyah.',
  }

  const TONE_INSTRUCTIONS: Record<string, string> = {
    'Informative':      'Write in a clear, factual tone. Lead with the most useful insight. No fluff.',
    'Warm & Personal':  'Write warmly, like a fellow community member sharing something genuinely helpful. Use "we", "our community", "my fellow olim" etc.',
    'Direct & Punchy':  'Short sentences. Bold hook. Real talk. No padding.',
    'Question Hook':    'Open with a question that makes the reader stop scrolling. Then answer it with the article.',
    'Storytelling':     'Open with a brief relatable scenario or moment, then connect it to the article's insight.',
  }

  const posts = []

  for (const article of articles.slice(0, 3)) {
    const url = `https://${article.site_domain}/article/${article.site_slug}/${article.slug}`
    const siteCtx = SITE_CONTEXT[article.site_slug] || ''
    const toneInstr = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS['Warm & Personal']

    const prompt = `You are writing a Facebook post for a Jewish community group about this article.

SITE CONTEXT: ${siteCtx}
TONE: ${toneInstr}

ARTICLE TITLE: ${article.title}
ARTICLE EXCERPT: ${article.excerpt}
ARTICLE URL: ${url}

Write a Facebook post that:
- Is 3–5 sentences (max 100 words)
- Has a strong opening line that stops the scroll
- Includes 1–2 relevant emojis naturally
- Does NOT include the URL (it will be added separately)
- Does NOT say "Check out this article" or "I found this article" — be natural
- Ends with a call to action like "Full guide below 👇" or "Read the full breakdown below" or similar
- Sounds like a real person from the community, NOT a brand

Return ONLY the post text, nothing else.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC,
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
      const postText = data.content?.[0]?.text?.trim() || ''

      posts.push({
        site: article.site_name,
        siteIcon: article.site_slug === 'aliya-today' ? '✈️' : article.site_slug === 'jewish-property-report' ? '🏠' : '📰',
        siteColor: article.site_slug === 'aliya-today' ? '#c47d1a' : article.site_slug === 'jewish-property-report' ? '#0a7c4e' : '#1a56b0',
        article,
        post: postText,
        tone,
      })
    } catch (e) {
      posts.push({
        site: article.site_name,
        siteIcon: '📰',
        siteColor: '#1a56b0',
        article,
        post: `[Generation failed for this article — try again]`,
        tone,
      })
    }
  }

  return NextResponse.json({ posts })
}
