import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*' }

export async function GET(req: NextRequest) {
  const job_id = req.nextUrl.searchParams.get('job_id')
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400, headers: CORS })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const { data: job } = await sb.from('podcast_videos').select('*').eq('id', job_id).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404, headers: CORS })

  if (job.status === 'ready' || job.status === 'failed') {
    return NextResponse.json({
      ...job, done: true, progress_pct: job.status === 'ready' ? 100 : 0,
    }, { headers: CORS })
  }

  const { data: keys } = await sb.from('system_api_keys').select('key_name,key_value').eq('is_active', true)
  const km: Record<string, string> = Object.fromEntries((keys || []).map((k: any) => [k.key_name, k.key_value]))

  // ── Poll Shotstack ────────────────────────────────────────────────────────
  const shotstackKey = km.SHOTSTACK_KEY
  const renderIds: { field: string, id: string, label: string }[] = [
    { field: 'video_169_url', id: job.creatomate_169_id, label: '16:9' },
    { field: 'video_916_url', id: job.creatomate_916_id, label: '9:16' },
    { field: 'video_11_url',  id: job.creatomate_11_id,  label: '1:1'  },
  ].filter(r => r.id)

  if (shotstackKey && renderIds.length > 0) {
    const env = km.SHOTSTACK_ENV || 'stage'
    const updates: Record<string, any> = {}
    let allDone = true
    let anyFailed = false

    await Promise.allSettled(renderIds.map(async ({ field, id, label }) => {
      try {
        const r = await fetch(`https://api.shotstack.io/edit/${env}/renders/${id}`, {
          headers: { 'x-api-key': shotstackKey },
          signal: AbortSignal.timeout(8000),
        })
        if (!r.ok) { allDone = false; return }
        const d = await r.json()
        const status = d?.response?.status  // queued | fetching | rendering | saving | done | failed
        const url    = d?.response?.url

        if (status === 'done' && url) {
          updates[field] = url
        } else if (status === 'failed') {
          anyFailed = true
          updates.error_msg = `${label} render failed`
        } else {
          allDone = false
        }
      } catch { allDone = false }
    }))

    if (Object.keys(updates).length > 0 || allDone) {
      const renderedCount = renderIds.filter(r => updates[r.field]).length
      const finalStatus = anyFailed && renderedCount === 0 ? 'failed'
                        : allDone ? 'ready' : 'rendering'
      const pct = allDone ? 100 : Math.min(90, 30 + renderedCount * 20)

      await sb.from('podcast_videos').update({
        ...updates,
        status: finalStatus,
        progress_pct: pct,
        current_step: allDone
          ? `✅ Done — ${renderedCount} format(s) ready`
          : `Rendering… ${renderedCount}/${renderIds.length} formats done`,
      }).eq('id', job_id)

      const { data: updated } = await sb.from('podcast_videos').select('*').eq('id', job_id).single()
      return NextResponse.json({ ...updated, done: allDone }, { headers: CORS })
    }

    return NextResponse.json({ ...job, done: false, progress_pct: job.progress_pct || 30 }, { headers: CORS })
  }

  // ── Poll HeyGen fallback ──────────────────────────────────────────────────
  if (km.HEYGEN_KEY && job.heygen_host_job_id) {
    try {
      const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${job.heygen_host_job_id}`, {
        headers: { 'X-Api-Key': km.HEYGEN_KEY },
        signal: AbortSignal.timeout(8000),
      })
      const d = await r.json()
      const s = d?.data?.status  // processing | completed | failed
      const url = d?.data?.video_url

      if (s === 'completed' && url) {
        await sb.from('podcast_videos').update({
          video_169_url: url, status: 'ready', progress_pct: 100,
          current_step: '✅ HeyGen video ready',
        }).eq('id', job_id)
        const { data: upd } = await sb.from('podcast_videos').select('*').eq('id', job_id).single()
        return NextResponse.json({ ...upd, done: true }, { headers: CORS })
      } else if (s === 'failed') {
        await sb.from('podcast_videos').update({ status: 'failed', current_step: 'HeyGen failed' }).eq('id', job_id)
        return NextResponse.json({ ...job, done: true, status: 'failed' }, { headers: CORS })
      }
    } catch {}
  }

  return NextResponse.json({ ...job, done: false, progress_pct: job.progress_pct || 20 }, { headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
