import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: logs } = await db
    .from('client_report_log')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ logs: logs || [] })
}
