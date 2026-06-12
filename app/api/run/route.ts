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
    // Pass secret as BOTH header (for newer routes) AND query param (for legacy routes)
    const sep = path.includes('?') ? '&' : '?'
    const url = `${BASE}${path}${sep}secret=${encodeURIComponent(secret)}`
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` }
    })
    return r.ok ? await r.json().catch(() => ({ ok:true })) : { error:`HTTP ${r.status}` }
  } catch(e:any) { return { error:e.message } }
}

async function runArticles(batch: number, secret: string) {
  // FIRE AND FORGET — kick off all 14 sites in parallel but do NOT await.
  // Each /api/cron-site runs as its own independent serverless function.
  // Waiting for all 14 responses causes /api/run to 504 at ~20s (Vercel cron timeout).
  // Articles still get inserted because cron-site keeps running after /api/run returns.
  const promises = ALL_SITES.map(site =>
    fetch(`${BASE}/api/cron-site?site=${site}&batch=${batch}&secret=${encodeURIComponent(secret)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    }).catch(() => null) // swallow errors — fire and forget
  )
  // Wait just 3s to catch any immediate failures, then return
  await Promise.race([
    Promise.all(promises),
    new Promise(r => setTimeout(r, 3000))
  ])
  return { batch, status: 'fired', sites: ALL_SITES.length, note: 'cron-site functions running independently' }
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
