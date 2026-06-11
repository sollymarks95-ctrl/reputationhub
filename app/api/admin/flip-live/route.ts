import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co'),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA')
  )
}


export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json()
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

    const { error } = await db()
      .from('news_sites')
      .update({ noindex: false })
      .eq('slug', slug)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, slug, message: `${slug} is now live and indexable` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
