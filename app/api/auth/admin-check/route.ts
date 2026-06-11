import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

const ADMINS = ['sollymarks95@gmail.com']

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ isAdmin: false })

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Fetch admin password from Supabase — never stored in code or env vars
    const { data } = await db
      .from('system_api_keys')
      .select('key_value')
      .eq('key_name', 'ADMIN_PASS')
      .single()

    const correctPass = data?.key_value || ''
    const isAdmin = ADMINS.includes(email.toLowerCase().trim()) &&
                    password.trim() === correctPass

    return NextResponse.json({ isAdmin })
  } catch {
    return NextResponse.json({ isAdmin: false })
  }
}
