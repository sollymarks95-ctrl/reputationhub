import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 120

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

export async function POST(req: NextRequest) {
  const { clientId, topic, episode, duration = 8, hostName, hostRole, guestName, guestRole } = await req.json()

  const client = clientId
    ? (await supabase.from('portal_clients').select('*').eq('id', clientId).single()).data
    : null

  const companyName = client?.company_name || 'the firm'
  const industry = client?.industry || 'financial services'

  const hostLabel = hostName || 'James Richardson'
  const guestLabel = guestName || 'Alex Chen'
  const hostJobTitle = hostRole || 'Show Host'  
  const guestJobTitle = guestRole || 'Expert Analyst'

  const prompt = `Write a professional ${duration}-minute podcast episode script about: "${topic || `${companyName}'s market position and reputation`}"

${client ? `Company: ${companyName} | Industry: ${industry}` : ''}
Host: ${hostLabel} (${hostJobTitle})
Guest: ${guestLabel} (${guestJobTitle})

FORMAT RULES (critical):
- Two speakers ONLY: always "HOST:" and "GUEST:" — never use their real names as speaker labels
- EVERY line MUST start with exactly "HOST:" or "GUEST:" 
- ${hostLabel} is the HOST — confident, sharp interviewer who sets the scene and asks great questions
- ${guestLabel} is the GUEST — the expert who gives insightful data-driven answers
- Natural flowing conversation — not Q&A style, they build on each other's points
- Include REAL current data: BTC ~$76k, Gold ~$4,400/oz, EUR/USD 1.11, S&P 500 at 5,842
- ${duration} minutes ≈ ${duration * 130} words total
- Open with a strong hook, build through the episode, close with key takeaways

INTRO: HOST introduces the show, mentions ${guestLabel}'s name and title naturally in speech
BODY: Deep discussion with specific data points, market examples, named companies/events
CLOSE: HOST wraps up, thanks ${guestLabel} by name, signs off

STYLE: Bloomberg/Reuters podcast quality — sharp, data-driven, genuinely interesting.

OUTPUT ONLY THE SCRIPT — no stage directions, no brackets, no asterisks:`

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
