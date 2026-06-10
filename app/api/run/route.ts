import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic    = 'force-dynamic'
export const maxDuration = 300

const BASE  = 'https://rephuby.com'
const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

const ALL_SITES = [
  'global-trade-wire','finance-terminal','trust-score','gold-markets-today',
  'invest-data','business-pulse','market-radar','executive-network',
  'crypto-hub','fx-vexx','trade-hub-iq',
  'jewish-news-now','jewish-property-report','aliya-today',
]

async function callCron(path: string, secret: string) {
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${secret}` }
    })
    return r.ok ? await r.json().catch(() => ({ ok:true })) : { error:`HTTP ${r.status}` }
  } catch(e:any) { return { error:e.message } }
}

async function runArticles(batch: number, secret: string) {
  // ALL 14 sites in PARALLEL — finishes in ~30-60s, never times out
  const results = await Promise.all(
    ALL_SITES.map(async site => {
      const r = await callCron(`/api/cron-site?site=${site}&batch=${batch}`, secret)
      return { site, inserted: r.inserted ?? 0, error: r.error }
    })
  )
  const total = results.reduce((s,r) => s+(r.inserted||0), 0)
  const failed = results.filter(r => r.error).map(r => r.site)
  return { batch, total_inserted:total, failed, per_site:results }
}

async function runQuestions(secret: string) {
  // Questions run sequentially — each is fast (<10s), total ~140s for 14 sites
  const results = []
  for (const site of ALL_SITES) {
    const r = await callCron(`/api/cron-questions?site=${site}`, secret)
    results.push({ site, ...r })
    await new Promise(res => setTimeout(res, 500)) // small gap between calls
  }
  return { sites:results.length, results }
}

export async function GET(req: NextRequest) {
  const secret   = req.headers.get('authorization')?.replace('Bearer ','') ?? ''
  const expected = process.env.CRON_SECRET ?? ''
  if (expected && secret !== expected) {
    return NextResponse.json({ error:'Unauthorized' },{ status:401 })
  }

  const job   = req.nextUrl.searchParams.get('job') ?? ''
  const batch = parseInt(req.nextUrl.searchParams.get('batch') ?? '0')
  const t0    = Date.now()
  let result: any = { error:'Unknown job' }

  if      (job==='trends')    result = await callCron('/api/cron-trends', secret)
  else if (job==='articles')  result = await runArticles(batch, secret)
  else if (job==='questions') result = await runQuestions(secret)
  else if (job==='reviews')   result = await callCron('/api/cron-reviews', secret)
  else if (job==='companies') result = await callCron('/api/cron-companies', secret)
  else if (job==='backlinks') result = await callCron('/api/cron-backlinks-daily', secret)
  else if (job==='report')    result = await callCron('/api/cron-daily-report', secret)
  else if (job==='video')     result = await callCron('/api/cron-video-review', secret)
  else if (job==='links')     result = await callCron('/api/cron-internal-links?limit=100', secret)
  else return NextResponse.json({ error:`Unknown job: ${job}` },{ status:400 })

  const ms = Date.now()-t0

  // Log to Supabase
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
    )
    await db.from('cron_run_log').upsert({
      job, batch,
      result: JSON.stringify(result).slice(0,2000),
      elapsed_ms: ms,
      ran_at: new Date().toISOString()
    },{ onConflict:'job,batch' })
  } catch{} // non-fatal

  return NextResponse.json({ job, batch, ms, ...result })
}
