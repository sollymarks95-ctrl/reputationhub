import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string,string> = Object.fromEntries((keys||[]).map((k:any)=>[k.key_name, k.key_value]))
  const FULL_KEY = km.CREATOMATE_KEY
  const KEY1 = FULL_KEY?.split('-').slice(0,5).join('-')  // first UUID
  const KEY2 = FULL_KEY?.split('-').slice(5).join('-')    // second UUID (after first UUID's 5 groups)

  const PROBES = [
    // Try Creatomate with both key variants
    { label: 'Creatomate /v1/renders FULL',  url:'https://api.creatomate.com/v1/renders', key: FULL_KEY },
    { label: 'Creatomate /v1/renders KEY2',  url:'https://api.creatomate.com/v1/renders', key: KEY2 },
    { label: 'Creatomate /v1/renders KEY1',  url:'https://api.creatomate.com/v1/renders', key: KEY1 },
    // More Nextcut function names on api.nextcut.io
    { label: 'Nextcut /create-render',       url:'https://api.nextcut.io/create-render', key: FULL_KEY },
    { label: 'Nextcut /submit-render',       url:'https://api.nextcut.io/submit-render', key: FULL_KEY },
    { label: 'Nextcut /generate',            url:'https://api.nextcut.io/generate', key: FULL_KEY },
    { label: 'Nextcut /video',               url:'https://api.nextcut.io/video', key: FULL_KEY },
    { label: 'Nextcut /create-video',        url:'https://api.nextcut.io/create-video', key: FULL_KEY },
    { label: 'Nextcut /render-video',        url:'https://api.nextcut.io/render-video', key: FULL_KEY },
    { label: 'Nextcut /process',             url:'https://api.nextcut.io/process', key: FULL_KEY },
    { label: 'Nextcut /jobs',                url:'https://api.nextcut.io/jobs', key: FULL_KEY },
    { label: 'Nextcut /templates',           url:'https://api.nextcut.io/templates', key: FULL_KEY },
  ]

  const results = await Promise.allSettled(
    PROBES.map(async p => {
      const r = await fetch(p.url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${p.key}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      const body = await r.text()
      return { label: p.label, status: r.status, body: body.slice(0,150) }
    })
  )

  const out = results.map((r,i) => r.status==='fulfilled' 
    ? r.value 
    : { label: PROBES[i].label, status: 'ERR', body: (r as any).reason?.message?.slice(0,80) })

  return NextResponse.json({ key1: KEY1, key2: KEY2, results: out }, { headers: CORS })
}
