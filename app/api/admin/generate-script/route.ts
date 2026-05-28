import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { clientId, episodeNumber, title, guestName, guestRole, topic, brokerName, regulation, durationMinutes } = await req.json()
    const wordTarget = (durationMinutes || 20) * 130

    const prompt = `Write a professional ${wordTarget}-word podcast interview script.

PODCAST: ${brokerName} Financial Insights
EPISODE ${episodeNumber || 1}: "${title}"
GUEST: ${guestName || 'CEO'}, ${guestRole || 'Chief Executive Officer'} at ${brokerName}
REGULATION: ${regulation || 'CySEC regulated'}
TOPIC: ${topic}

FORMAT:
[INTRO]
HOST: [30-second professional introduction mentioning ${brokerName} and guest credentials]

[MAIN INTERVIEW - 6 substantive Q&A exchanges]
HOST: [Engaging question]
${guestName || 'GUEST'}: [Expert answer 80-120 words — show real market knowledge, reference regulation, client protection, specific trading conditions]

[TRUST MOMENT - must include]
HOST: "Some people searching online find mixed information about brokers. What would you say to a trader who wants to verify ${brokerName} is legitimate and trustworthy?"
${guestName || 'GUEST'}: [Confident, specific answer: CySEC license number, segregated funds, audit, client protections, how to verify directly]

[CLOSING]
HOST: [Wrap-up with website rephuby.com and Telegram @rephub_intelligence]

Write the complete script now. Make it natural, conversational, and genuinely informative.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3500, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await response.json()
    const script = data.content?.[0]?.text || ''

    const { data: ep, error } = await supabase.from('podcast_scripts').insert({
      client_id: clientId, episode_number: episodeNumber || 1,
      title, guest_name: guestName, guest_role: guestRole,
      topic, script, status: 'script_ready',
      duration_seconds: (durationMinutes || 20) * 60,
    }).select().single()

    return NextResponse.json({ success: true, script, episodeId: ep?.id, wordCount: script.split(' ').length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
