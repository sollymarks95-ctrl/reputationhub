export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const JEWISH_SITE_IDS = ['jewish-news-now', 'jewish-property-report', 'aliya-today']
const SITE_DOMAINS: Record<string, string> = {
  'jewish-news-now': 'jewishnewsnow.com',
  'jewish-property-report': 'jewishpropertyreport.com',
  'aliya-today': 'aliyatoday.com',
}

export async function GET() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const articles = []
  for (const slug of JEWISH_SITE_IDS) {
    const { data: site } = await sb.from('news_sites').select('id, name').eq('slug', slug).single()
    if (!site) continue
    const { data: arts } = await sb
      .from('news_articles').select('slug, title, excerpt, published_at, category')
      .eq('news_site_id', site.id).eq('status', 'published')
      .order('published_at', { ascending: false }).limit(1)
    if (arts?.[0]) {
      const a = arts[0]
      articles.push({
        siteSlug: slug, siteName: site.name, domain: SITE_DOMAINS[slug],
        ...a,
        url: `https://${SITE_DOMAINS[slug]}/article/${slug}/${a.slug}`,
      })
    }
  }
  return NextResponse.json({ articles })
}
