import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient((process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co'), (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'))
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [videos, audios, renders, articles] = await Promise.all([
    sb.from('podcast_videos').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    sb.from('podcast_scripts').select('id', { count: 'exact', head: true }).not('audio_url', 'is', null).gte('created_at', monthStart),
    sb.from('podcast_videos').select('id', { count: 'exact', head: true }).not('video_169_url', 'is', null).gte('created_at', monthStart),
    sb.from('news_articles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
  ])

  return NextResponse.json({
    videos_this_month:  videos.count || 0,
    audios_this_month:  audios.count || 0,
    renders_this_month: renders.count || 0,
    articles_this_month: articles.count || 0,
    month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
  }, { headers: CORS })
}
