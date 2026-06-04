import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export const maxDuration = 30
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string,string> = Object.fromEntries((keys||[]).map((k:any)=>[k.key_name, k.key_value]))
  const FULL = km.CREATOMATE_KEY
  const K1 = FULL?.split('-').slice(0,5).join('-')   // first UUID
  const K2 = FULL?.split('-').slice(5).join('-')     // second UUID

  const MIN_BODY = JSON.stringify({ source: { output_format:'mp4', width:100, height:100, duration:1, elements:[] }})

  const PROBES = [
    // POST Creatomate with different keys
    { label:'POST Creatomate FULL key', url:'https://api.creatomate.com/v1/renders', key: FULL, method:'POST', body: MIN_BODY },
    { label:'POST Creatomate KEY1 only', url:'https://api.creatomate.com/v1/renders', key: K1, method:'POST', body: MIN_BODY },
    { label:'POST Creatomate KEY2 only', url:'https://api.creatomate.com/v1/renders', key: K2, method:'POST', body: MIN_BODY },
    // Nextcut /render-video with different auth formats
    { label:'Nextcut /render-video Bearer FULL', url:'https://api.nextcut.io/render-video', key: FULL, method:'GET', authHeader:'Authorization', authPrefix:'Bearer ' },
    { label:'Nextcut /render-video apikey FULL', url:'https://api.nextcut.io/render-video', key: FULL, method:'GET', authHeader:'apikey', authPrefix:'' },
    { label:'Nextcut /render-video x-api-key FULL', url:'https://api.nextcut.io/render-video', key: FULL, method:'GET', authHeader:'x-api-key', authPrefix:'' },
    { label:'Nextcut /render-video Bearer K1', url:'https://api.nextcut.io/render-video', key: K1, method:'GET', authHeader:'Authorization', authPrefix:'Bearer ' },
    { label:'Nextcut /render-video Bearer K2', url:'https://api.nextcut.io/render-video', key: K2, method:'GET', authHeader:'Authorization', authPrefix:'Bearer ' },
    // POST render-video
    { label:'POST Nextcut /render-video FULL', url:'https://api.nextcut.io/render-video', key: FULL, method:'POST', body: MIN_BODY, authHeader:'Authorization', authPrefix:'Bearer ' },
  ]

  const results = await Promise.allSettled(
    PROBES.map(async (p: any) => {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      const authKey = p.authHeader || 'Authorization'
      const authPre = p.authPrefix !== undefined ? p.authPrefix : 'Bearer '
      headers[authKey] = `${authPre}${p.key}`
      const r = await fetch(p.url, {
        method: p.method || 'GET',
        headers,
        body: p.body,
        signal: AbortSignal.timeout(8000),
      })
      const body = await r.text()
      return { label: p.label, status: r.status, body: body.slice(0,200) }
    })
  )

  const out = results.map((r,i) => r.status==='fulfilled' 
    ? r.value 
    : { label: PROBES[i].label, status: 'ERR', body: (r as any).reason?.message?.slice(0,80) })

  return NextResponse.json({ k1:K1, k2:K2, results: out }, { headers: CORS })
}
