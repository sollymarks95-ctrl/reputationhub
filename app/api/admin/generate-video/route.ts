import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSiteConfig } from '@/app/lib/podcast-config'

export const runtime = 'nodejs'
export const maxDuration = 300

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const DESCRIPT_KEY = 'REDACTED_DESCRIPT_KEY'
const DESCRIPT_BASE = 'https://descriptapi.com/v1'

async function descriptCall(path: string, body: object) {
  const res = await fetch(`${DESCRIPT_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DESCRIPT_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Descript ${path} → ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

async function pollJob(jobId: string, maxWaitMs = 180000): Promise<any> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 5000))
    const res = await fetch(`${DESCRIPT_BASE}/jobs/${jobId}`, {
      headers: { 'Authorization': `Bearer ${DESCRIPT_KEY}` }
    })
    if (res.ok) {
      const data = await res.json()
      const state = data.job_state || data.status
      if (state === 'complete' || state === 'stopped' || state === 'done') return data
      if (state === 'failed' || state === 'error') throw new Error(`Job ${jobId} failed: ${JSON.stringify(data)}`)
    }
  }
  throw new Error('Job timed out')
}

export async function POST(req: NextRequest) {
  try {
    const {
      audioUrl, duration,
      hostName, hostRole,
      guestName = 'Sarah', guestRole = 'Expert Analyst',
      episodeTitle = 'Financial Intelligence', episodeNum = 1,
      clientId, podcastId, siteSlug = '',
    } = await req.json()

    if (!audioUrl) return NextResponse.json({ error: 'audioUrl required' }, { status: 400 })

    const projectName = `TradingEdge - Ep${episodeNum}: ${episodeTitle.slice(0, 60)}`

    // ── STEP 1: Import audio into Descript project ──────────────────────────
    console.log('Descript: importing audio...')
    const importData = await descriptCall('/jobs/import/project_media', {
      project_name: projectName,
      add_media: {
        'podcast.mp3': { url: audioUrl }
      },
      add_compositions: [{
        name: projectName,
        clips: [{ media: 'podcast.mp3' }]
      }]
    })

    const projectId = importData.project_id
    if (!projectId) throw new Error('No project_id from Descript import')
    console.log('Descript project:', projectId)

    // Wait for import to settle
    await new Promise(r => setTimeout(r, 10000))

    // ── STEP 2: Underlord — Studio Sound + Layout + Captions ────────────────
    console.log('Descript: running Underlord agent...')
    const agentData = await descriptCall('/jobs/agent', {
      project_id: projectId,
      prompt: `This is a professional financial podcast episode called "${episodeTitle}" (Episode ${episodeNum}).

The podcast has two speakers:
- HOST: ${hostName}, ${hostRole} (left side)
- GUEST: ${guestName}, ${guestRole} (right side)

Please do ALL of the following:
1. Apply Studio Sound to the audio to make it sound like a professional broadcast studio recording — remove all noise, enhance voice clarity, and balance both speakers.
2. Add professional captions/subtitles at the bottom — white text, clean sans-serif font, word-by-word or phrase-by-phrase for readability.
3. Set a dark cinematic background (#0A0E17 dark navy) for the video composition.
4. Create a clean podcast layout with the show name "TradingEdge" at the top.
5. Add a lower-third for HOST "${hostName} · ${hostRole}" and another for GUEST "${guestName} · ${guestRole}".
6. The result should look and sound like a premium Bloomberg or CNBC podcast production.
7. Export quality should be HD (1920x1080).

Make the production look completely professional and broadcast-ready.`
    })

    const agentJobId = agentData.job_id
    console.log('Descript agent job:', agentJobId)

    // ── STEP 3: Poll for agent completion ───────────────────────────────────
    const agentResult = await pollJob(agentJobId, 240000)
    console.log('Descript agent done:', agentResult.result?.status)

    const projectUrl = agentResult.result?.project_url || `https://web.descript.com/${projectId}`

    // ── STEP 4: Try to export as MP4 ─────────────────────────────────────────
    let videoUrl: string | null = null
    try {
      const exportData = await descriptCall('/jobs/export', {
        project_id: projectId,
        composition_name: projectName,
        format: 'mp4',
        resolution: '1080p',
      })
      const exportJobId = exportData.job_id
      if (exportJobId) {
        const exportResult = await pollJob(exportJobId, 300000)
        videoUrl = exportResult.result?.download_url || exportResult.result?.url || null
        console.log('Descript export URL:', videoUrl)
      }
    } catch (exportErr) {
      console.error('Export step failed (project still available in Descript):', exportErr)
    }

    // Update DB
    if (podcastId) {
      await sb.from('podcast_scripts').update({
        status: videoUrl ? 'video_ready' : 'descript_ready',
      }).eq('id', podcastId)
    }
    if (clientId) {
      await sb.from('portal_activity').insert({
        client_id: clientId,
        type: 'podcast_ready',
        description: `Podcast video ready: Episode ${episodeNum} — ${projectName}`,
      })
    }

    return NextResponse.json({
      success: true,
      projectId,
      projectUrl,
      videoUrl,           // direct MP4 download if export worked
      descriptLink: projectUrl,
      message: videoUrl
        ? 'Full video ready for download'
        : 'Descript project ready — open to export video',
    })
  } catch (e: any) {
    console.error('generate-video error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
