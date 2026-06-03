import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET(req: NextRequest) {
  const job_id = req.nextUrl.searchParams.get('job_id')
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400, headers: CORS })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: job } = await sb.from('podcast_videos').select('*').eq('id', job_id).single()
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS })
  if (job.status === 'ready' || job.status === 'failed') return NextResponse.json({ ...job, done: true }, { headers: CORS })

  const { data: keys } = await sb.from('system_api_keys').select('key_name, key_value').in('key_name', ['CREATOMATE_KEY', 'HEYGEN_KEY']).eq('is_active', true)
  const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

  const updates: Record<string, any> = {}

  // ── Poll HeyGen ──
  if (job.heygen_host_job_id && !job.video_916_url && !job.video_169_url) {
    const hk = km.HEYGEN_KEY
    if (hk) {
      const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${job.heygen_host_job_id}`, {
        headers: { 'X-Api-Key': hk }
      })
      if (r.ok) {
        const d = await r.json()
        const status = d?.data?.status
        const videoUrl = d?.data?.video_url

        if (status === 'completed' && videoUrl) {
          updates.video_916_url = videoUrl
          updates.video_169_url = videoUrl
          updates.status = 'ready'
          updates.progress_pct = 100
          updates.current_step = '✅ HeyGen video ready!'
        } else if (status === 'failed') {
          updates.status = 'failed'
          updates.error_msg = d?.data?.error || 'HeyGen rendering failed'
          updates.current_step = '❌ HeyGen failed'
        } else {
          // still processing
          updates.progress_pct = Math.min((job.progress_pct || 40) + 5, 90)
          updates.current_step = `HeyGen: ${status || 'processing'}...`
        }
      }
    }
  }

  // ── Poll Creatomate ──
  const creatomateKey = km.CREATOMATE_KEY
  if (creatomateKey && creatomateKey !== 'REPLACE_WITH_KEY') {
    const fmts = [
      { id: job.creatomate_169_id, field: 'video_169_url', label: '16:9' },
      { id: job.creatomate_916_id, field: 'video_916_url', label: '9:16' },
      { id: job.creatomate_11_id,  field: 'video_11_url',  label: '1:1'  },
    ].filter(f => f.id && !(job as any)[f.field])

    let allDone = true
    for (const fmt of fmts) {
      const r = await fetch(`https://api.creatomate.com/v1/renders/${fmt.id}`, {
        headers: { 'Authorization': `Bearer ${creatomateKey}` }
      })
      if (!r.ok) { allDone = false; continue }
      const d = await r.json()
      if (d.status === 'succeeded' && d.url) updates[fmt.field] = d.url
      else if (d.status === 'failed') updates.error_msg = `${fmt.label} failed`
      else allDone = false
    }

    const readyCount = fmts.filter(f => (job as any)[f.field] || updates[f.field]).length
    if (allDone && fmts.length > 0) {
      updates.status = 'ready'; updates.progress_pct = 100; updates.current_step = '✅ All formats ready!'
    } else {
      updates.progress_pct = Math.round(40 + (readyCount / Math.max(fmts.length, 1)) * 55)
      updates.current_step = `Rendering ${readyCount}/${fmts.length} formats...`
    }
  }

  if (Object.keys(updates).length > 0) {
    await sb.from('podcast_videos').update(updates).eq('id', job_id)
  }

  const updated = { ...job, ...updates }
  return NextResponse.json({ ...updated, done: updated.status === 'ready' || updated.status === 'failed' }, { headers: CORS })
}
