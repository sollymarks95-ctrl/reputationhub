import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export async function POST(req: NextRequest) {
  try {
    const { articleId, siteSlug, slug } = await req.json()
    if (!articleId && !(siteSlug && slug)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const db = getDb()
    let id = articleId

    // If no articleId, look it up by site + slug
    if (!id && siteSlug && slug) {
      const { data: site } = await db.from('news_sites').select('id').eq('slug', siteSlug).single()
      if (site) {
        const { data: art } = await db.from('news_articles').select('id').eq('news_site_id', site.id).eq('slug', slug).single()
        if (art) id = art.id
      }
    }

    if (!id) return NextResponse.json({ ok: false }, { status: 404 })

    // Increment view count (using RPC for atomic update)
    await db.rpc('increment_article_views', { article_id: id })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false })
  }
}
