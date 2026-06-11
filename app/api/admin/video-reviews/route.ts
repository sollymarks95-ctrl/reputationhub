import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
)

export async function GET() {
  const db = getDb()
  const { data: videos } = await db.from('video_reviews')
    .select('*').order('created_at', { ascending: false }).limit(30)

  if (!videos?.length) return NextResponse.json({ videos: [] })

  // Poll HeyGen for status updates on processing videos
  const { data: keyRow } = await db.from('system_api_keys').select('key_value').eq('key_name','HEYGEN_KEY').single()
  const heygenKey = keyRow?.key_value || ''

  const updated = await Promise.all(videos.map(async (v) => {
    if (v.status !== 'processing' || !v.heygen_video_id) return v
    try {
      // New HeyGen v2 status endpoint
      const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${v.heygen_video_id}`, {
        headers: { 'X-Api-Key': heygenKey },
        signal: AbortSignal.timeout(5000)
      })
      const d = await r.json()
      const hStatus = d.data?.status
      const videoUrl = d.data?.video_url
      const thumbnailUrl = d.data?.thumbnail_url

      if (hStatus === 'completed' && videoUrl) {
        await db.from('video_reviews').update({
          status: 'ready',
          heygen_video_url: videoUrl,
        }).eq('id', v.id)
        return { ...v, status: 'ready', heygen_video_url: videoUrl, thumbnail_url: thumbnailUrl }
      }
      if (hStatus === 'failed') {
        await db.from('video_reviews').update({ status: 'failed' }).eq('id', v.id)
        return { ...v, status: 'failed' }
      }
    } catch {}
    return v
  }))

  return NextResponse.json({ videos: updated })
}

// Publish video to broker's Verivex portal page
export async function POST(req: NextRequest) {
  const { video_id, youtube_url } = await req.json()
  if (!video_id) return NextResponse.json({ error: 'Missing video_id' }, { status: 400 })

  const db = getDb()
  const { data: video } = await db.from('video_reviews').select('*').eq('id', video_id).single()
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

  // Mark as published
  await db.from('video_reviews').update({
    published_to_portal: true,
    published_at: new Date().toISOString(),
    youtube_url: youtube_url || video.heygen_video_url,
  }).eq('id', video_id)

  // Update the broker's Verivex company page with the video URL
  if (video.broker_slug) {
    await db.from('verivex_companies').update({
      video_url: youtube_url || video.heygen_video_url,
      video_title: video.youtube_title,
    }).eq('slug', video.broker_slug)
  }

  return NextResponse.json({ ok: true, message: `Video published to ${video.broker_slug} on Verivex` })
}
