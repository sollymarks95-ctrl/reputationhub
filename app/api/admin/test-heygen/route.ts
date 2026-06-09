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

  // HeyGen new API format: input_text goes INSIDE voice object
  async function testVideo(characterPayload: any, label: string) {
    const r = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_inputs: [{
          character: characterPayload,
          voice: {
            type: 'text',
            voice_id: 'en-US-GuyNeural',
            input_text: 'Hey traders, Ben here from Verivex. This is a test.',
            speed: 1.0,
          },
          background: { type: 'color', value: '#0f172a' },
        }],
        aspect_ratio: '16:9',
        test: false,
      }),
      signal: AbortSignal.timeout(12000)
    })
    const d = await r.json()
    return { label, status: r.status, video_id: d?.data?.video_id, error: d?.error, message: d?.message }
  }

  const [benTP, benAvatar, tyler] = await Promise.all([
    testVideo({ type: 'talking_photo', talking_photo_id: BEN }, 'Ben (talking_photo)'),
    testVideo({ type: 'avatar', avatar_id: BEN, avatar_style: 'normal' }, 'Ben (avatar)'),
    testVideo({ type: 'avatar', avatar_id: 'Tyler-insuit-20220721', avatar_style: 'normal' }, 'Tyler (reference)'),
  ])

  return NextResponse.json({ credits: 300, results: [benTP, benAvatar, tyler] })
}
