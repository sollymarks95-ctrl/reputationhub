import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CORS = { 'Access-Control-Allow-Origin': '*' }
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const job_id = req.nextUrl.searchParams.get('job_id')
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400, headers: CORS })

  const { data: job, error } = await supabase
    .from('podcast_videos')
    .select('*')
    .eq('id', job_id)
    .single()

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404, headers: CORS })
  if (job.status === 'ready') return NextResponse.json({ ...job, done: true }, { headers: CORS })
  if (job.status === 'failed') return NextResponse.json({ ...job, done: true }, { headers: CORS })

  // ── Poll Creatomate for each render job ──
  const { data: keys } = await supabase
    .from('system_api_keys')
    .select('key_name, key_value')
    .eq('key_name', 'CREATOMATE_KEY')
    .eq('is_active', true)
    .single()

  const creatomateKey = (keys as any)?.key_value
  if (!creatomateKey) return NextResponse.json({ ...job, done: false }, { headers: CORS })

  const formatMap = [
    { id: job.creatomate_169_id, field: 'video_169_url', label: '16:9' },
    { id: job.creatomate_916_id, field: 'video_916_url', label: '9:16' },
    { id: job.creatomate_11_id,  field: 'video_11_url',  label: '1:1'  },
  ].filter(f => f.id)

  const updates: Record<string, any> = {}
  let allDone = true
  let anyFailed = false

  for (const fmt of formatMap) {
    if ((job as any)[fmt.field]) continue // already has URL, skip

    const res = await fetch(`https://api.creatomate.com/v1/renders/${fmt.id}`, {
      headers: { 'Authorization': `Bearer ${creatomateKey}` }
    })

    if (!res.ok) { allDone = false; continue }
    const data = await res.json()

    if (data.status === 'succeeded' && data.url) {
      updates[fmt.field] = data.url
    } else if (data.status === 'failed') {
      anyFailed = true
      updates.error_msg = `${fmt.label} render failed: ${data.error || 'unknown'}`
    } else {
      allDone = false // still rendering
    }
  }

  // Calculate progress
  const readyCount = formatMap.filter(f => (job as any)[f.field] || updates[f.field]).length
  const totalCount = formatMap.length || 1
  const progress = Math.round(40 + (readyCount / totalCount) * 55)

  const isFullyDone = allDone && !anyFailed && readyCount === totalCount
  updates.progress_pct = isFullyDone ? 100 : progress
  updates.status = anyFailed ? 'failed' : isFullyDone ? 'ready' : 'rendering'
  updates.current_step = isFullyDone
    ? 'All formats ready ✓'
    : anyFailed
    ? 'Render failed'
    : `Rendering... ${readyCount}/${totalCount} formats done`

  if (Object.keys(updates).length > 0) {
    await supabase.from('podcast_videos').update(updates).eq('id', job_id)
  }

  const updatedJob = { ...job, ...updates }
  return NextResponse.json({ ...updatedJob, done: isFullyDone || anyFailed }, { headers: CORS })
}
