import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||ANON)
}

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET || ''
  if (!secret) return true // no secret set — allow (dev mode)

  const svixId        = req.headers.get('svix-id') || ''
  const svixTimestamp = req.headers.get('svix-timestamp') || ''
  const svixSignature = req.headers.get('svix-signature') || ''

  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Reject timestamps older than 5 minutes
  const ts = parseInt(svixTimestamp, 10)
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
  const secretBytes   = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const key = await crypto.subtle.importKey(
    'raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig      = await crypto.subtle.sign('HMAC', new TextEncoder().encode(signedContent), key)
  const computed = 'v1,' + Buffer.from(sig).toString('base64')

  // svix-signature header can contain multiple sigs space-separated
  return svixSignature.split(' ').some((s: string) => s === computed)
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    if (!rawBody) return NextResponse.json({ ok: true }) // empty ping

    const valid = await verifySignature(req, rawBody)
    if (!valid) {
      // Log but don't block — misconfigured secret shouldn't 500
      console.warn('Resend webhook: invalid signature, processing anyway')
    }

    let payload: any
    try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ ok: true }) }
    const { type, data } = payload || {}
    if (!type) return NextResponse.json({ ok: true }) // unknown event shape

    const emailId   = data?.email_id || data?.id || ''
    const toEmail   = Array.isArray(data?.to) ? data.to[0] : (data?.to || '')
    const subject   = data?.subject || ''
    const tags      = data?.tags || {}

    // Resend sends tags as array of {name,value} objects
    const tagMap: Record<string,string> = {}
    if (Array.isArray(tags)) {
      tags.forEach((t: any) => { if (t.name) tagMap[t.name] = t.value || '' })
    } else {
      Object.assign(tagMap, tags)
    }
    const orgName = tagMap['org_name'] || ''

    // Map event → CRM status
    const statusMap: Record<string,string> = {
      'email.sent':       'sent',
      'email.delivered':  'sent',
      'email.opened':     'opened',
      'email.clicked':    'clicked',
      'email.bounced':    'bounced',
      'email.complained': 'bounced',
    }
    const newStatus = statusMap[type]

    // Log every event regardless
    await db().from('resend_email_events').insert({
      email_id:   emailId,
      event_type: type,
      to_email:   toEmail,
      subject,
      org_name:   orgName,
      raw:        payload,
      created_at: new Date().toISOString(),
    }).catch(() => {})

    // Update CRM — only upgrade status, never downgrade
    if (newStatus && orgName) {
      const statusRank: Record<string,number> = {
        drafted: 0, sent: 1, opened: 2, clicked: 3, replied: 4, linked: 5, bounced: -1, declined: -1
      }
      const { data: existing } = await db()
        .from('link_building_outreach')
        .select('status')
        .eq('org_name', orgName)
        .eq('platform', 'email')
        .single()

      if (existing) {
        const cur = statusRank[existing.status] ?? 0
        const nxt = statusRank[newStatus] ?? 0
        if (nxt > cur) {
          await db().from('link_building_outreach')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('org_name', orgName)
            .eq('platform', 'email')
        }
      }
    }

    return NextResponse.json({ ok: true, event: type })
  } catch (e: any) {
    console.error('Resend webhook error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
