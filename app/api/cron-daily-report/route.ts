import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic = 'force-dynamic'
export const maxDuration = 120

const SUPA_URL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || SUPA_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
)

function buildEmail(client: any, stats: any): { subject: string; html: string } {
  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
  const color = client.primary_color || '#1971C2'

  const articleRows = stats.topArticles.map((a: any) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
        <a href="${a.url}" style="color:${color};font-weight:600;text-decoration:none;font-size:13px;">${a.title}</a>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px;">${a.portal} · ${a.type === 'brand_feature' ? '⭐ Feature' : a.type === 'brand_mention' ? '📰 Analysis' : '📄 News'}</div>
      </td>
    </tr>`).join('')

  const reviewRows = stats.recentReviews.map((r: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;">
        ${'⭐'.repeat(r.rating)} <strong>${r.title}</strong>
        <div style="color:#64748b;font-size:12px;margin-top:2px;">${r.reviewer} · ${r.portal}</div>
      </td>
    </tr>`).join('')

  const portalList = stats.portalCoverage.map((p: any) =>
    `<span style="display:inline-block;background:${color}15;color:${color};border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;margin:2px;">${p.name} (${p.count})</span>`
  ).join(' ')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <div style="background:${color};border-radius:12px 12px 0 0;padding:28px 32px;">
    <div style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">RepHuby Intelligence</div>
    <h1 style="color:#fff;font-size:22px;margin:8px 0 4px;font-weight:700;">Good morning, ${client.contact_name || client.company_name} 👋</h1>
    <div style="color:rgba(255,255,255,0.85);font-size:13px;">${today} · Daily Coverage Report</div>
  </div>

  <!-- Stats Bar -->
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:20px 32px;display:flex;gap:24px;">
    <div style="text-align:center;">
      <div style="font-size:28px;font-weight:800;color:${color};">${stats.articlesYesterday}</div>
      <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Articles Published</div>
    </div>
    <div style="width:1px;background:#e2e8f0;"></div>
    <div style="text-align:center;">
      <div style="font-size:28px;font-weight:800;color:${color};">${stats.portalsActive}</div>
      <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Portals Active</div>
    </div>
    <div style="width:1px;background:#e2e8f0;"></div>
    <div style="text-align:center;">
      <div style="font-size:28px;font-weight:800;color:${color};">${stats.totalReviews}</div>
      <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Total Reviews</div>
    </div>
    <div style="width:1px;background:#e2e8f0;"></div>
    <div style="text-align:center;">
      <div style="font-size:28px;font-weight:800;color:${color};">${stats.avgRating}⭐</div>
      <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Avg Rating</div>
    </div>
  </div>

  <!-- Portal Coverage -->
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:16px 32px;">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Yesterday's Coverage</div>
    <div>${portalList}</div>
  </div>

  <!-- Top Articles -->
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;margin-top:0;">
    <div style="padding:16px 32px 8px;border-bottom:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">📰 Top Articles to Share</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">Share these with your team, social media, or clients</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">${articleRows}</table>
    <div style="padding:12px 32px;">
      <a href="https://rephuby.com/portal" style="color:${color};font-size:12px;font-weight:600;">View all articles →</a>
    </div>
  </div>

  <!-- Recent Reviews -->
  ${stats.recentReviews.length > 0 ? `
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;margin-top:8px;">
    <div style="padding:16px 32px 8px;border-bottom:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">⭐ New Reviews on Verivex</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">Share your Verivex profile: <a href="https://verivex.co/broker/${client.brand_slug}" style="color:${color};">verivex.co/broker/${client.brand_slug}</a></div>
    </div>
    <table style="width:100%;border-collapse:collapse;">${reviewRows}</table>
  </div>` : ''}

  <!-- Action Items -->
  <div style="background:${color}08;border:1px solid ${color}30;border-radius:8px;padding:20px 24px;margin-top:16px;">
    <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:12px;">💡 Suggested Actions Today</div>
    <ul style="margin:0;padding-left:16px;color:#475569;font-size:13px;line-height:1.8;">
      <li>Share top articles on your LinkedIn / social channels</li>
      <li>Forward review profile link to recent clients: <a href="https://verivex.co/broker/${client.brand_slug}" style="color:${color};">verivex.co/broker/${client.brand_slug}</a></li>
      <li>Paste article links in your email newsletter</li>
      <li>Reply to any negative reviews on your Verivex profile</li>
    </ul>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:24px 0;color:#94a3b8;font-size:11px;">
    RepHuby Intelligence · ${client.company_name} Coverage Report<br>
    <a href="https://rephuby.com/portal" style="color:#94a3b8;">View Dashboard</a> · 
    <a href="https://rephuby.com/portal/unsubscribe?client=${client.brand_slug}" style="color:#94a3b8;">Unsubscribe</a>
  </div>

</div>
</body></html>`

  return {
    subject: `☀️ Good Morning — ${stats.articlesYesterday} articles published for ${client.company_name} | ${yesterday}`,
    html
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || ''
  const authHeader = req.headers.get('authorization')
  const urlSecret = req.nextUrl.searchParams.get('secret')
  if (authHeader !== ('Bearer ' + cronSecret) && urlSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  // Read Resend key from Supabase system_api_keys (secure — not in code or env)
  const { data: resendKeyRow } = await db
    .from('system_api_keys')
    .select('key_value')
    .eq('key_name', 'RESEND_API_KEY')
    .single()
  const RESEND_KEY = resendKeyRow?.key_value || process.env.RESEND_API_KEY
  if (!RESEND_KEY) return NextResponse.json({ error: 'No Resend key' })

  // Get all active clients with report emails
  const { data: clients } = await db
    .from('portal_clients')
    .select('*')
    .eq('is_active', true)
    .eq('report_enabled', true)

  if (!clients?.length) return NextResponse.json({ ok: true, message: 'No clients to report' })

  const yesterday = new Date(Date.now() - 86400000)
  const dayStart = new Date(yesterday)
  dayStart.setHours(0,0,0,0)
  const dayEnd = new Date(yesterday)
  dayEnd.setHours(23,59,59,999)

  const sent: string[] = []

  for (const client of clients) {
    // Build email list — report_emails array + contact_email
    const emailList: string[] = [
      ...(client.report_emails || []),
      ...(client.contact_email ? [client.contact_email] : [])
    ].filter(Boolean)

    if (emailList.length === 0) continue

    // Get yesterday's articles for this client
    const { data: articles } = await db
      .from('news_articles')
      .select('title, slug, article_type, news_site_id')
      .in('article_type', ['brand_feature', 'brand_mention', 'news'])
      .gte('published_at', dayStart.toISOString())
      .lte('published_at', dayEnd.toISOString())
      .eq('status', 'published')

    const { data: sites } = await db
      .from('news_sites')
      .select('id, name, domain, slug')
      .eq('is_live', true)

    const siteMap = Object.fromEntries((sites || []).map((s: any) => [s.id, s]))

    // Top articles — prioritise brand_feature then brand_mention
    const brandArticles = (articles || [])
      .filter((a: any) => a.article_type === 'brand_feature' || a.article_type === 'brand_mention')
      .slice(0, 5)
      .map((a: any) => {
        const site = siteMap[a.news_site_id]
        return {
          title: a.title,
          url: `https://${site?.domain}/article/${site?.slug}/${a.slug}`,
          portal: site?.name || 'Portal',
          type: a.article_type
        }
      })

    // Portal coverage breakdown
    const portalCounts: Record<string, number> = {}
    for (const a of (articles || [])) {
      const site = siteMap[a.news_site_id]
      if (site) portalCounts[site.name] = (portalCounts[site.name] || 0) + 1
    }
    const portalCoverage = Object.entries(portalCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Reviews stats
    const { data: reviews } = await db
      .from('verivex_reviews')
      .select('rating, title, reviewer_name, company_slug')
      .eq('company_slug', client.brand_slug)
      .gte('created_at', dayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: allReviews } = await db
      .from('verivex_reviews')
      .select('rating')
      .eq('company_slug', client.brand_slug)
      .eq('status', 'approved')

    const avgRating = allReviews?.length
      ? (allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length).toFixed(1)
      : '—'

    const stats = {
      articlesYesterday: (articles || []).length,
      portalsActive: Object.keys(portalCounts).length,
      totalReviews: allReviews?.length || 0,
      avgRating,
      topArticles: brandArticles,
      portalCoverage,
      recentReviews: (reviews || []).map((r: any) => ({
        rating: r.rating,
        title: r.title,
        reviewer: r.reviewer_name,
        portal: 'Verivex'
      }))
    }

    const { subject, html } = buildEmail(client, stats)

    // Send via Resend to all emails
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RepHuby Intelligence <onboarding@resend.dev>',
        to: emailList,
        subject,
        html
      })
    })

    // Log the send to DB
    await db.from('client_report_log').insert({
      client_id: client.id,
      client_name: client.company_name,
      recipients: emailList,
      articles_count: stats.articlesYesterday,
      portals_count: stats.portalsActive,
      reviews_count: stats.recentReviews.length,
      avg_rating: parseFloat(stats.avgRating) || null,
      top_articles: stats.topArticles,
      email_subject: subject,
      status: 'sent',
    })

    sent.push(client.company_name)
  }

  return NextResponse.json({ ok: true, sent, count: sent.length })
}
