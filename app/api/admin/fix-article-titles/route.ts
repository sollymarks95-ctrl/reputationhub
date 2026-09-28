import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// One-shot: fix any article titles that still say 2025 → 2026
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch all articles with 2025 in title
  const { data: articles, error } = await db
    .from('news_articles')
    .select('id, title, excerpt, seo_title, seo_description')
    .ilike('title', '%2025%')
    .eq('status', 'published')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!articles?.length) return NextResponse.json({ ok: true, updated: 0, message: 'No 2025 titles found' })

  const updates: any[] = []
  for (const a of articles) {
    const newTitle = a.title.replace(/\b2025\b/g, '2026')
    const newExcerpt = (a.excerpt || '').replace(/\b2025\b/g, '2026')
    const { error: upErr } = await db
      .from('news_articles')
      .update({
        title: newTitle,
        excerpt: newExcerpt,
        seo_title: newTitle,
        seo_description: newExcerpt,
      })
      .eq('id', a.id)
    updates.push({ id: a.id, old: a.title, new: newTitle, error: upErr?.message })
  }

  return NextResponse.json({ ok: true, updated: updates.length, updates })
}
