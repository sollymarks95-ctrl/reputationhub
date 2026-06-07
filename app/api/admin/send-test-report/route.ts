import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: NextRequest) {
  const { toEmail, clientId } = await req.json()
  if (!toEmail || !clientId) return NextResponse.json({ ok: false, error: 'Missing toEmail or clientId' })

  const db = getDb()

  // Get Resend key from Supabase (never from code)
  const { data: keyRow } = await db
    .from('system_api_keys')
    .select('key_value')
    .eq('key_name', 'RESEND_API_KEY')
    .single()

  const RESEND_KEY = keyRow?.key_value || process.env.RESEND_API_KEY
  if (!RESEND_KEY) return NextResponse.json({ ok: false, error: 'No Resend key configured' })

  // Get client
  const { data: client } = await db
    .from('portal_clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (!client) return NextResponse.json({ ok: false, error: 'Client not found' })

  // Get recent articles (last 24h)
  const since = new Date(Date.now() - 86400000).toISOString()
  const { data: articles } = await db
    .from('news_articles')
    .select('title, slug, article_type, news_site_id')
    .gte('published_at', since)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const { data: sites } = await db
    .from('news_sites')
    .select('id, name, domain, slug')
    .eq('is_live', true)

  const siteMap = Object.fromEntries((sites || []).map((s: any) => [s.id, s]))

  const topArticles = (articles || [])
    .filter((a: any) => a.article_type === 'brand_feature' || a.article_type === 'brand_mention')
    .slice(0, 5)
    .map((a: any) => {
      const site = siteMap[a.news_site_id]
      return { title: a.title, url: `https://${site?.domain}/article/${site?.slug}/${a.slug}`, portal: site?.name || 'Portal', type: a.article_type }
    })

  const portalCounts: Record<string, number> = {}
  for (const a of (articles || [])) {
    const site = siteMap[a.news_site_id]
    if (site) portalCounts[site.name] = (portalCounts[site.name] || 0) + 1
  }

  const { data: allReviews } = await db
    .from('verivex_reviews')
    .select('rating')
    .eq('company_slug', client.brand_slug)
    .eq('status', 'approved')

  const avgRating = allReviews?.length
    ? (allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : '4.4'

  const color = client.primary_color || '#1971C2'
  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const portalList = Object.entries(portalCounts)
    .map(([name, count]) => `<span style="display:inline-block;background:${color}15;color:${color};border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;margin:2px;">${name} (${count})</span>`)
    .join(' ')

  const articleRows = topArticles.map((a: any) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
        <a href="${a.url}" style="color:${color};font-weight:600;text-decoration:none;font-size:13px;">${a.title}</a>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px;">${a.portal} · ${a.type === 'brand_feature' ? '⭐ Feature' : '📰 Analysis'}</div>
      </td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;">

  <div style="background:#f59e0b;border-radius:8px;padding:8px 16px;margin-bottom:16px;font-size:12px;color:#fff;font-weight:600;">
    🧪 TEST REPORT — This is a preview of what ${client.company_name} receives daily at 08:00
  </div>

  <div style="background:${color};border-radius:12px 12px 0 0;padding:28px 32px;">
    <div style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">RepHuby Intelligence</div>
    <h1 style="color:#fff;font-size:22px;margin:8px 0 4px;font-weight:700;">Good morning, ${client.contact_name || client.company_name} 👋</h1>
    <div style="color:rgba(255,255,255,0.85);font-size:13px;">${today} · Daily Coverage Report</div>
  </div>

  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:20px 32px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="text-align:center;padding:0 12px;">
          <div style="font-size:28px;font-weight:800;color:${color};">${(articles||[]).length}</div>
          <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Articles Published</div>
        </td>
        <td style="width:1px;background:#e2e8f0;"></td>
        <td style="text-align:center;padding:0 12px;">
          <div style="font-size:28px;font-weight:800;color:${color};">${Object.keys(portalCounts).length}</div>
          <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Portals Active</div>
        </td>
        <td style="width:1px;background:#e2e8f0;"></td>
        <td style="text-align:center;padding:0 12px;">
          <div style="font-size:28px;font-weight:800;color:${color};">${allReviews?.length || 0}</div>
          <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Total Reviews</div>
        </td>
        <td style="width:1px;background:#e2e8f0;"></td>
        <td style="text-align:center;padding:0 12px;">
          <div style="font-size:28px;font-weight:800;color:${color};">${avgRating}⭐</div>
          <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Avg Rating</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:16px 32px;">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Yesterday's Coverage</div>
    <div>${portalList || '<span style="color:#94a3b8;font-size:12px;">Articles publishing — check back tomorrow</span>'}</div>
  </div>

  ${topArticles.length > 0 ? `
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;">
    <div style="padding:16px 32px 8px;">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">📰 Top Articles to Share</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">Share these with your team, social media, or clients</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">${articleRows}</table>
    <div style="padding:12px 32px;"><a href="https://rephuby.com/portal" style="color:${color};font-size:12px;font-weight:600;">View all articles →</a></div>
  </div>` : ''}

  <div style="background:${color}08;border:1px solid ${color}30;border-radius:8px;padding:20px 24px;margin-top:16px;">
    <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:12px;">💡 Suggested Actions Today</div>
    <ul style="margin:0;padding-left:16px;color:#475569;font-size:13px;line-height:1.8;">
      <li>Share top articles on your LinkedIn / social channels</li>
      <li>Forward review profile link to recent clients: <a href="https://verivex.co/broker/${client.brand_slug}" style="color:${color};">verivex.co/broker/${client.brand_slug}</a></li>
      <li>Paste article links in your email newsletter</li>
    </ul>
  </div>

  <div style="text-align:center;padding:24px 0;color:#94a3b8;font-size:11px;">
    RepHuby Intelligence · ${client.company_name} Coverage Report
  </div>
</div>
</body></html>`

  // Send via Resend
  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'RepHuby Intelligence <reports@rephuby.com>',
      to: [toEmail],
      subject: `🧪 TEST — Daily Report Preview for ${client.company_name}`,
      html
    })
  })

  const sendData = await sendRes.json()
  return NextResponse.json({ ok: sendRes.ok, id: sendData.id, error: sendData.message })
}
