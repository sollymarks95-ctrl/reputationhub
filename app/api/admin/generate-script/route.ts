import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 120

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

export async function POST(req: NextRequest) {
  const { clientId, topic, episode, duration = 8 } = await req.json()

  const client = clientId
    ? (await supabase.from('portal_clients').select('*').eq('id', clientId).single()).data
    : null

  const companyName = client?.company_name || 'the firm'
  const industry = client?.industry || 'financial services'

  const prompt = `Write a professional ${duration}-minute podcast episode script about: "${topic || `${companyName}'s market position and reputation`}"

${client ? `Company: ${companyName} | Industry: ${industry}` : ''}

FORMAT RULES (critical):
- Two speakers: HOST (male, authoritative host) and GUEST (expert analyst/executive)
- EVERY line MUST start with exactly "HOST:" or "GUEST:"
- Natural conversation, not a lecture
- Include real market context, specific statistics, named developments
- ${duration} minutes ≈ ${duration * 130} words total
- Episode ${episode || 1} opener, main discussion, key takeaways, sign-off

STYLE: Bloomberg/Reuters podcast quality — professional but conversational. 
The HOST asks sharp questions. The GUEST gives expert, data-driven answers.
Make it feel like a REAL premium financial podcast.

OUTPUT ONLY THE SCRIPT — no stage directions, no [brackets], no asterisks:`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(60000),
    })

    const data = await res.json()
    const script = data.content?.[0]?.text?.trim() || ''

    // Count speaker lines
    const hostLines = (script.match(/^HOST:/gm) || []).length
    const guestLines = (script.match(/^GUEST:/gm) || []).length
    const wordCount = script.split(' ').length

    // Save to DB
    const { data: saved } = await supabase.from('podcast_scripts').insert({
      client_id: clientId || null,
      title: `Episode ${episode || 1}: ${topic || companyName + ' Market Intelligence'}`,
      script,
      status: 'draft',
      episode_number: episode || 1,
      duration_minutes: duration,
    }).select().single()

    return NextResponse.json({
      success: true,
      script,
      podcastId: saved?.id,
      stats: { wordCount, hostLines, guestLines, estimatedMinutes: Math.round(wordCount / 130) },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
