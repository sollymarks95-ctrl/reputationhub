import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const BEN = '8cda690a684542e0817593096ea5461d'

export async function GET() {
  const db = createClient('https://gykxxhxsakxhfuutgobb.supabase.co', ANON)
  const { data } = await db.from('system_api_keys').select('key_value').eq('key_name','HEYGEN_KEY').single()
  const key = data?.key_value || ''

  // Step 1: Get valid voices from HeyGen
  const voicesRes = await fetch('https://api.heygen.com/v2/voices', {
    headers: { 'X-Api-Key': key },
    signal: AbortSignal.timeout(8000)
  })
  const voicesData = await voicesRes.json()
  const voices = voicesData?.data?.voices || []
  const firstVoice = voices[0]
  
  // Step 2: Test video with first available voice
  let testResult: any = { skipped: 'no voices found' }
  if (firstVoice) {
    const r = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_inputs: [{
          character: { type: 'avatar', avatar_id: 'Tyler-insuit-20220721', avatar_style: 'normal' },
          voice: {
            type: 'text',
            voice_id: firstVoice.voice_id,
            input_text: 'Hey traders, Ben here from Verivex. This is a quick test.',
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
    testResult = { voice_used: firstVoice.voice_id, status: r.status, video_id: d?.data?.video_id, error: d?.error }
  }

  return NextResponse.json({
    voices_available: voices.length,
    sample_voices: voices.slice(0,5).map((v:any) => ({ id: v.voice_id, name: v.name, language: v.language })),
    test_video: testResult,
  })
}
