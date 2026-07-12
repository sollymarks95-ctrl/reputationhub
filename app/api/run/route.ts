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
  'copy-trade-iq','expat-invest-iq',
  'jewish-news-now','jewish-property-report','aliya-today',
  'rephuby-intelligence',
]

const JEWISH_SITES = ['jewish-news-now','jewish-property-report','aliya-today']
const FINANCE_SITES = ALL_SITES.filter(s => !JEWISH_SITES.includes(s))
function sitesForGroup(group: string) {
  if (group === 'finance') return FINANCE_SITES
  if (group === 'jewish')  return JEWISH_SITES
  return ALL_SITES
}

async function callCron(path: string, secret: string, timeoutMs = 60000) {
  try {
    // Pass secret as BOTH header (for newer routes) AND query param (for legacy routes)
    const sep = path.includes('?') ? '&' : '?'
    const url = `${BASE}${path}${sep}secret=${encodeURIComponent(secret)}`
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(timeoutMs), // guard against a hung downstream route eating /api/run's own 300s budget
    })
    return r.ok ? await r.json().catch(() => ({ ok:true })) : { error:`HTTP ${r.status}` }
  } catch(e:any) { return { error:e.message } }
}

async function runArticles(batch: number, secret: string, group: string = 'all') {
  const sites = sitesForGroup(group)
  // FIRE AND FORGET — kick off all 14 sites in parallel but do NOT await.
  // Each /api/cron-site runs as its own independent serverless function.
  // Waiting for all 14 responses causes /api/run to 504 at ~20s (Vercel cron timeout).
  // Articles still get inserted because cron-site keeps running after /api/run returns.
  const promises = sites.map(site =>
    fetch(`${BASE}/api/cron-site?site=${site}&batch=${batch}&secret=${encodeURIComponent(secret)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    }).catch(() => null) // swallow errors — fire and forget
  )
  // Wait just 3s to catch any immediate failures, then return
  await Promise.race([
    Promise.all(promises),
    new Promise(r => setTimeout(r, 3000))
  ])
  return { batch, group, status: 'fired', sites: sites.length, note: 'cron-site functions running independently' }
}

async function runQuestions(secret: string) {
  // Questions run sequentially — each is fast (<10s), total ~140s for 14 sites.
  // BUDGET GUARD: stop calling more sites once we're close to /api/run's own 300s
  // maxDuration, so a few slow/stuck downstream calls can't 504 the whole job and
  // silently lose every site that hadn't run yet. We just defer the rest to the
  // next day's cron run instead.
  const start = Date.now()
  const BUDGET_MS = 260_000 // 40s safety margin under the 300s hard limit
  const PER_CALL_TIMEOUT_MS = 20000
  const results = []
  for (const site of ALL_SITES) {
    if (Date.now() - start + PER_CALL_TIMEOUT_MS + 1000 > BUDGET_MS) {
      results.push({ site, error: 'skipped: time budget exceeded, deferred to next run' })
      continue
    }
    const r = await callCron(`/api/cron-questions?site=${site}`, secret, PER_CALL_TIMEOUT_MS)
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
  else if (job==='articles')  result = await runArticles(batch, secret, req.nextUrl.searchParams.get('group') ?? 'all')
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
