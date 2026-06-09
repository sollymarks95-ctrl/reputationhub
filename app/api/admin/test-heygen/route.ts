import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const BEN = '8cda690a684542e0817593096ea5461d'

export async function GET() {
  const db = createClient('https://gykxxhxsakxhfuutgobb.supabase.co', ANON)
  const { data } = await db.from('system_api_keys').select('key_value').eq('key_name','HEYGEN_KEY').single()
  const key = data?.key_value || ''

  // Test 1: talking_photo type with Ben
  const r1 = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: 'talking_photo', talking_photo_id: BEN },
        voice: { type: 'text', voice_id: 'en-US-GuyNeural', speed: 1.0 },
        background: { type: 'color', value: '#0f172a' },
      }],
      input_text: 'Hey traders, Ben here. This is a test.',
      aspect_ratio: '16:9', test: false,
    }),
    signal: AbortSignal.timeout(12000)
  })
  const d1 = await r1.json()

  // Test 2: standard avatar Tyler (always works if key valid)
  const r2 = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: 'avatar', avatar_id: 'Tyler-insuit-20220721', avatar_style: 'normal' },
        voice: { type: 'text', voice_id: 'en-US-GuyNeural', speed: 1.0 },
        background: { type: 'color', value: '#0f172a' },
      }],
      input_text: 'Hey traders, this is a test video.',
      aspect_ratio: '16:9', test: false,
    }),
    signal: AbortSignal.timeout(12000)
  })
  const d2 = await r2.json()

  return NextResponse.json({
    credits: 300,
    ben_talking_photo: { status: r1.status, video_id: d1?.data?.video_id, error: d1?.message || d1?.error, raw: d1 },
    tyler_avatar:      { status: r2.status, video_id: d2?.data?.video_id, error: d2?.message || d2?.error, raw: d2 },
  })
}
