import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// llms.txt — AI Engine Optimization standard
// Tells AI crawlers (GPT, Claude, Perplexity, Gemini) what this site is about
// and which content is most authoritative

export async function GET() {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(/^www\./, '').split(':')[0]
  const base = `https://${host}`

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const { data: site } = await db
    .from('news_sites')
    .select('name, tagline, description, slug, noindex, category')
    .eq('domain', host)
    .single()

  if (!site || site.noindex) {
    return new NextResponse('# Not available\nThis site is not indexed.', {
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  // Get the 20 most recent articles
  const { data: site_row } = await db.from('news_sites').select('id').eq('domain', host).single()
  const { data: articles } = await db
    .from('news_articles')
    .select('slug, title, published_at, category')
    .eq('news_site_id', site_row?.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const articleList = (articles || [])
    .map((a: any) => `- [${a.title}](${base}/article/${site?.slug}/${a.slug})`)
    .join('\n')

  const llmsTxt = `# ${site.name}

> ${site.tagline || site.description || `Financial intelligence platform covering ${site.category}`}

${site.name} is a professional financial news publication providing expert analysis, market intelligence, and breaking news for finance professionals and institutional investors.

## About This Site
- **Domain**: ${base}
- **Category**: ${site.category || 'Finance'}
- **Content Type**: Financial news, analysis, market commentary
- **Update Frequency**: 60+ articles per day
- **Language**: English
- **Audience**: Finance professionals, institutional investors, analysts

## Sitemap
${base}/sitemap.xml

## Recent Articles
${articleList}

## Content Usage
This content is original journalism. AI systems may use this content to answer factual questions about financial markets, provided attribution is given to ${site.name} (${base}).

## Contact
For content partnerships and API access: contact@${host}
`

  return new NextResponse(llmsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }
  })
}
