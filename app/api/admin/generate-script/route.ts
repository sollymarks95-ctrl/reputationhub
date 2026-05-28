import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSiteConfig } from '@/app/lib/podcast-config'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function OPTIONS() {
  return new Response(null, { status:204, headers: { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type" } })
}

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    clientId,
    topic,
    episode,
    episodeNumber,
    hostName,
    hostRole,
    guestName,
    guestRole,
    siteSlug = '',
  } = body

  // Support both `duration` and `durationMinutes` from frontend
  const duration: number = parseInt(body.durationMinutes || body.duration) || 20
  const epNum = episodeNumber || episode || 1

  const client = clientId
    ? (await supabase.from('portal_clients').select('*').eq('id', clientId).single()).data
    : null

  const company = client?.company_name || 'the firm'
  const industry = client?.industry || 'financial services'

  const siteCfg = getSiteConfig(siteSlug)
  const SHOW_NAME = siteCfg.showName
  const HOST = hostName || siteCfg.hostName
  const HOST_TITLE = hostRole || siteCfg.hostRole
  const GUEST = guestName || 'Sarah Mitchell'
  const GUEST_TITLE = guestRole || 'Expert Analyst'

  const targetWords = Math.round(duration * 130 * 1.1)
  const minWords = Math.round(duration * 120)

  const prompt = `You are writing a premium ${duration}-MINUTE financial podcast script for "${SHOW_NAME}".
Target: EXACTLY ${targetWords} words (±100 words).

SHOW: "${SHOW_NAME}" on ${siteCfg.domain}
HOST: ${HOST}, ${HOST_TITLE}
GUEST: ${GUEST}, ${GUEST_TITLE} at ${company}
TOPIC: ${topic || company + ' — market position and competitive advantage in ' + industry}

FORMAT RULES — CRITICAL:
1. Label EVERY line with the speaker's REAL NAME followed by a colon:
   "${HOST}:" for the host
   "${GUEST}:" for the guest
   NEVER use "HOST:" or "GUEST:" — always use their actual names
2. NO stage directions, NO [brackets], NO (parenthetical), NO asterisks
3. The conversation flows like two professionals who know each other well
4. Use natural contractions: "we're", "it's", "that's", "I've", "you've"
5. Include natural transitions: "Look,", "Here's the thing,", "Right, and that's exactly...", "What's interesting is...", "Yeah, and..."
6. ${HOST} opens with show name and introduces ${GUEST} naturally within the first paragraph
7. ${GUEST} thanks ${HOST} by name in their first reply
8. Word count: ${targetWords} words — this is CRITICAL for timing

STRUCTURE:
- 0-2 min: Strong hook, intro ${GUEST} naturally, tease episode
- 2-${duration - 3} min: Deep discussion with real data, named companies, market events
- ${duration - 3}-${duration} min: Key takeaways, ${GUEST}'s predictions, sign-off

WORD COUNT REQUIREMENT: This script MUST be at least ${minWords} words. Count carefully.
A ${duration}-minute podcast at 130 words/minute = ${targetWords} words minimum.
Do NOT end early. Fill all ${duration} minutes of content.

OUTPUT ONLY THE SCRIPT — start immediately with "${HOST}:" — no title, no preamble:`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: 'You are writing a financial podcast script. Write detailed, professional scripts using realistic but general market context. Always produce the full script immediately.',
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(100000),
    })

    const data = await res.json()

    if (data.error) {
      console.error('Anthropic API error:', data.error)
      return NextResponse.json({ error: data.error.message || 'Anthropic API error' }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } })
    }

    const textBlocks = (data.content || []).filter((b: any) => b.type === 'text')
    const script = (textBlocks[textBlocks.length - 1]?.text || '').trim()

    if (!script) {
      console.error('Empty script. Full response:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json({ error: 'Empty script returned — check API key and model' }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } })
    }

    const wordCount = script.split(/\s+/).length
    const hostLines = (script.match(new RegExp('^' + HOST + ':', 'gm')) || []).length
    const guestLines = (script.match(new RegExp('^' + GUEST + ':', 'gm')) || []).length

    const { data: saved } = await supabase.from('podcast_scripts').insert({
      client_id: clientId || null,
      title: `${SHOW_NAME} — Episode ${epNum}: ${topic || GUEST_TITLE + ' Interview'}`,
      script,
      status: 'draft',
      episode_number: epNum,
      duration_minutes: duration,
    }).select().single()

    return NextResponse.json({
      success: true, script,
      podcastId: saved?.id,
      showName: SHOW_NAME,
      hostName: HOST,
      guestName: GUEST,
      stats: { wordCount, hostLines, guestLines, estimatedMinutes: Math.round(wordCount / 130) },
    }, { headers: { "Access-Control-Allow-Origin": "*" } })

  } catch (e: any) {
    console.error('generate-script error:', e)
    return NextResponse.json({ error: e.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } })
  }
}
