import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { clientId, emails, enabled } = await req.json()
  if (!clientId) return NextResponse.json({ ok: false, error: 'Missing clientId' })

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { error } = await db
    .from('portal_clients')
    .update({ report_emails: emails || [], report_enabled: enabled !== false })
    .eq('id', clientId)

  return NextResponse.json({ ok: !error, error: error?.message })
}
