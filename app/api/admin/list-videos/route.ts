import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic = 'force-dynamic'

export async function GET() {
  const sb = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co'),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA')
  )
  const { data: videos } = await sb
    .from('podcast_videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ videos: videos || [] })
}
