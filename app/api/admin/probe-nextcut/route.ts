import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string,string> = Object.fromEntries((keys||[]).map((k:any)=>[k.key_name, k.key_value]))
  const KEY = km.CREATOMATE_KEY

  const PROBES = [
    { label: 'GET /renders',              url: 'https://api.nextcut.io/renders',              method: 'GET' },
    { label: 'GET /v1/render',            url: 'https://api.nextcut.io/v1/render',            method: 'GET' },
    { label: 'GET /render',               url: 'https://api.nextcut.io/render',               method: 'GET' },
    { label: 'GET /v1/projects',          url: 'https://api.nextcut.io/v1/projects',          method: 'GET' },
    { label: 'GET /projects',             url: 'https://api.nextcut.io/projects',             method: 'GET' },
    { label: 'GET /health',               url: 'https://api.nextcut.io/health',               method: 'GET' },
    { label: 'GET /ping',                 url: 'https://api.nextcut.io/ping',                 method: 'GET' },
    { label: 'GET /api/renders',          url: 'https://nextcut.io/api/renders',              method: 'GET' },
    { label: 'GET api.nextcut root',      url: 'https://api.nextcut.io/',                     method: 'GET' },
  ]

  const results = await Promise.allSettled(
    PROBES.map(async p => {
      const r = await fetch(p.url, {
        method: p.method,
        headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(6000),
      })
      const body = await r.text()
      return { label: p.label, status: r.status, body: body.slice(0,200) }
    })
  )

  const out = results.map((r,i) => r.status==='fulfilled' 
    ? r.value 
    : { label: PROBES[i].label, status: 'ERROR', body: (r as any).reason?.message })

  return NextResponse.json({ key_preview: KEY?.slice(0,16)+'...', results: out }, { headers: CORS })
}
