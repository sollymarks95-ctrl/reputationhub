export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

const TONE_MAP: Record<string, string> = {
  'Warm & Personal': 'Write warmly, like a fellow community member sharing something genuinely helpful. Sound like a real person.',
  'Informative':     'Lead with the most useful insight. Clear and factual. No fluff.',
  'Direct & Punchy': 'Short sentences. Bold hook. Real talk. Maximum 4 sentences.',
  'Question Hook':   'Open with a compelling question that makes the reader stop.',
  'Storytelling':    "Open with a brief relatable scenario, then connect it to the article insight.",
}

export async function POST(req: NextRequest) {
  const { articles, tone = 'Warm & Personal' } = await req.json()
  const toneInstr = TONE_MAP[tone] || TONE_MAP['Warm & Personal']
  const posts = []

  for (const a of articles) {
    const prompt = `Write a Facebook post for a Jewish community group about this article.

TONE: ${toneInstr}
ARTICLE: ${a.title}
EXCERPT: ${a.excerpt}
URL: ${a.url}
SITE: ${a.siteName}

Rules:
- 3–5 sentences, under 120 words
- Strong opening line
- 1–3 emojis placed naturally
- End with "Link below 👇" or similar CTA
- Do NOT include URL in body
- Sound like a real community member

Return ONLY the post text.`

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
      posts.push({ ...a, postBody: text, fullPost: `${text}\n\n👉 ${a.url}` })
    } catch {
      posts.push({ ...a, postBody: '[Generation failed]', fullPost: `[Generation failed]\n\n👉 ${a.url}` })
    }
  }

  return NextResponse.json({ posts })
}
