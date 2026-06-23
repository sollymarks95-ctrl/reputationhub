import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

function db() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||ANON) }

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { type, data } = payload

    // Resend webhook event types we care about
    // email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
    const emailId   = data?.email_id  || data?.id || ''
    const toEmail   = (data?.to?.[0])  || data?.to || ''
    const subject   = data?.subject   || ''
    const tags      = data?.tags      || {}
    const orgName   = tags?.org_name  || ''

    // Map Resend event → our status
    const statusMap: Record<string, string> = {
      'email.sent':      'sent',
      'email.delivered': 'sent',
      'email.opened':    'opened',
      'email.clicked':   'clicked',
      'email.bounced':   'bounced',
      'email.complained':'bounced',
    }
    const newStatus = statusMap[type]
    if (!newStatus) return NextResponse.json({ ok: true }) // ignore unknown events

    // Log the raw event
    await db().from('resend_email_events').insert({
      email_id:   emailId,
      event_type: type,
      to_email:   toEmail,
      subject,
      org_name:   orgName,
      raw:        payload,
      created_at: new Date().toISOString(),
    }).catch(() => {})

    // Update outreach CRM status if we have org_name tag
    if (orgName) {
      // Only upgrade status, never downgrade (opened > sent, replied > opened)
      const statusRank: Record<string,number> = { drafted:0, sent:1, opened:2, clicked:3, replied:4, linked:5, bounced:-1, declined:-1 }
      const { data: existing } = await db().from('link_building_outreach')
        .select('status').eq('org_name', orgName).eq('platform','email').single()

      if (existing) {
        const currentRank = statusRank[existing.status] ?? 0
        const newRank     = statusRank[newStatus] ?? 0
        if (newRank > currentRank) {
          await db().from('link_building_outreach')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('org_name', orgName).eq('platform', 'email')
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
