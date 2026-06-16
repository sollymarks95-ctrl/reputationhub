import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const JEWISH_SITES = [
  { slug: 'jewish-news-now',        name: 'Jewish News Now',        domain: 'jewishnewsnow.com' },
  { slug: 'jewish-property-report', name: 'Jewish Property Report', domain: 'jewishpropertyreport.com' },
  { slug: 'aliya-today',            name: 'Aliya Today',            domain: 'aliyatoday.com' },
]

export async function GET() {
  const articles = []

  for (const site of JEWISH_SITES) {
    const { data: siteRow } = await supabase
      .from('news_sites')
      .select('id')
      .eq('slug', site.slug)
      .single()

    if (!siteRow) continue

    // Get the most recent published article
    const { data: rows } = await supabase
      .from('news_articles')
      .select('slug, title, excerpt, category, published_at')
      .eq('news_site_id', siteRow.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)

    if (rows?.[0]) {
      articles.push({ ...rows[0], site_slug: site.slug, site_name: site.name, site_domain: site.domain })
    }
  }

  return NextResponse.json({ articles })
}
