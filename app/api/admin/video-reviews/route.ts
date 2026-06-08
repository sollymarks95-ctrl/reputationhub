import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  // Check HeyGen status for processing videos
  const { data: videos } = await db.from('video_reviews')
    .select('*').order('created_at', { ascending: false }).limit(30)

  // Update status for processing ones
  if (videos) {
    const { data: keyRow } = await db.from('system_api_keys').select('key_value').eq('key_name','HEYGEN_KEY').single()
    const heygenKey = keyRow?.key_value || ''
    for (const v of videos.filter(v => v.status === 'processing' && v.heygen_video_id)) {
      try {
        const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${v.heygen_video_id}`, {
          headers: { 'X-Api-Key': heygenKey }
        })
        const d = await r.json()
        if (d.data?.status === 'completed' && d.data?.video_url) {
          await db.from('video_reviews').update({ status: 'completed', heygen_video_url: d.data.video_url }).eq('id', v.id)
          v.status = 'completed'
          v.heygen_video_url = d.data.video_url
        }
      } catch {}
    }
  }

  return NextResponse.json({ videos: videos || [] })
}
