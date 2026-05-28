import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 120

const ANTHROPIC = process.env.ANTHROPIC_API_KEY!

export async function POST(req: NextRequest) {
  const { clientId, topic, episode, duration = 20, hostName, hostRole, guestName, guestRole } = await req.json()

  const client = clientId
    ? (await supabase.from('portal_clients').select('*').eq('id', clientId).single()).data
    : null

  const company = client?.company_name || 'the firm'
  const industry = client?.industry || 'financial services'
  const HOST = hostName || 'David'
  const GUEST = guestName || 'Sarah'
  const HOST_TITLE = hostRole || 'Host'
  const GUEST_TITLE = guestRole || 'Expert'

  // 130 words per minute, target 10% over for natural delivery padding
  const targetWords = Math.round(duration * 130 * 1.1)

  const prompt = `You are writing a premium ${duration}-MINUTE financial podcast script. This will be converted to audio so it must be EXACTLY ${targetWords} words (±50 words).

SHOW: "Trading Edge" with ${HOST}, ${HOST_TITLE}
GUEST: ${GUEST}, ${GUEST_TITLE} at ${company}
TOPIC: ${topic || `${company}'s market position and competitive advantage in ${industry}`}
CONTEXT: ${industry} sector, 2026 market environment

ABSOLUTE RULES:
1. Format EVERY line as either "HOST:" or "GUEST:" — these are the ONLY valid prefixes
2. NEVER write: "HOST said", "GUEST replied", [laughs], [pause], (background music), stage directions of ANY kind
3. NEVER start audio with "HOST:" — the HOST's first line opens mid-conversation feeling, or with "Welcome back"
4. Names are used naturally IN the dialogue, not as labels (e.g. GUEST says "Thanks for having me, ${HOST}" not "GUEST: [speaking warmly]")
5. The conversation must flow like two smart people who KNOW each other — not a formal interview
6. Use contractions: "we're", "it's", "that's" — not "we are", "it is"
7. Include natural filler phrases that make it human: "Look,", "Here's the thing,", "Right, and that's exactly why...", "What's interesting is..."
8. NO grammar errors, NO filler words like "um" or "uh", NO incomplete sentences
9. Target word count: ${targetWords} words — count carefully, this is CRITICAL for timing

STRUCTURE (across ${duration} minutes):
- First 2 min: Hook opening, introduce guest naturally, tease what's coming
- Next ${Math.round(duration*0.6)} min: Deep substantive discussion with specific data, named companies, real market examples
- Last 3 min: Key takeaways, forward-looking outlook, sign-off

CURRENT MARKET CONTEXT to weave in naturally:
- Bitcoin at $76,210 (down from $126k ATH in Oct 2025)
- Gold at $4,404/oz (record territory)
- EUR/USD 1.1124, GBP/USD 1.3482
- Fed rate hold at 3.5-3.75%
- US-Iran Strait of Hormuz situation affecting oil (now $63)
- S&P 500 at 5,842

OUTPUT ONLY THE SCRIPT — start immediately with "HOST:" — no title, no description, no word count:`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':ANTHROPIC, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,  // enough for 3000 words
        messages: [{ role:'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(90000),
    })

    const data = await res.json()
    const script = data.content?.[0]?.text?.trim() || ''
    const wordCount = script.split(/\s+/).length
    const hostLines = (script.match(/^HOST:/gm) || []).length
    const guestLines = (script.match(/^GUEST:/gm) || []).length

    const { data: saved } = await supabase.from('podcast_scripts').insert({
      client_id: clientId || null,
      title: `Episode ${episode || 1}: ${topic || company + ' — ' + GUEST_TITLE + ' Interview'}`,
      script,
      status: 'draft',
      episode_number: episode || 1,
      duration_minutes: duration,
    }).select().single()

    return NextResponse.json({
      success: true, script,
      podcastId: saved?.id,
      stats: { wordCount, hostLines, guestLines, estimatedMinutes: Math.round(wordCount / 130) },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
