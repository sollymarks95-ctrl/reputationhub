import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'

export async function GET() {
  const db = createClient('https://gykxxhxsakxhfuutgobb.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON)
  const { data } = await db.from('system_api_keys').select('key_value').eq('key_name','HEYGEN_KEY').single()
  const key = data?.key_value || ''

  // Test credits
  const cRes = await fetch('https://api.heygen.com/v2/user/remaining_quota', { headers: { 'X-Api-Key': key } })
  const cData = await cRes.json()

  // Test avatars
  const aRes = await fetch('https://api.heygen.com/v2/avatars', { headers: { 'X-Api-Key': key } })
  const aData = await aRes.json()

  // Test talking_photo list
  const tpRes = await fetch('https://api.heygen.com/v2/talking_photo', { headers: { 'X-Api-Key': key } })
  const tpData = await tpRes.json()

  // Test video with Tyler (confirm API works)
  const vRes = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: 'avatar', avatar_id: 'Tyler-insuit-20220721', avatar_style: 'normal' },
        voice: { type: 'text', voice_id: 'en-US-GuyNeural', speed: 1.0 },
        background: { type: 'color', value: '#0f172a' },
      }],
      input_text: 'Testing one two three.',
      aspect_ratio: '16:9', test: false,
    })
  })
  const vData = await vRes.json()

  return NextResponse.json({
    key_valid: cRes.status === 200,
    key_preview: key.slice(0,20)+'...',
    credits: cData,
    avatars_count: aData?.data?.avatars?.length ?? 0,
    avatars_error: aData?.message,
    talking_photos: tpData?.data?.talking_photo_list?.map((t:any) => ({ id: t.talking_photo_id, name: t.talking_photo_name })) || tpData,
    test_video: { status: vRes.status, video_id: vData?.data?.video_id, error: vData?.message || vData?.error },
  })
}
