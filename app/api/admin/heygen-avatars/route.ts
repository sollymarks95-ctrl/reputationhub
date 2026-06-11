import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic = 'force-dynamic'

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
)

export async function GET() {
  const db = getDb()
  const { data: keyRow } = await db.from('system_api_keys').select('key_value').eq('key_name','HEYGEN_KEY').single()
  const key = keyRow?.key_value || process.env.HEYGEN_API_KEY || ''
  if (!key) return NextResponse.json({ error: 'No HeyGen key' })

  // Get all custom/talking photo avatars
  const res = await fetch('https://api.heygen.com/v2/avatars', {
    headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' }
  })
  const data = await res.json()
  return NextResponse.json(data)
}
