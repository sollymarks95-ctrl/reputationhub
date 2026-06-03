import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const AI_ENGINES = [
  { id: 'claude', name: 'Claude (Anthropic)', icon: '🟠' },
  { id: 'chatgpt', name: 'ChatGPT (OpenAI)', icon: '🟢' },
  { id: 'perplexity', name: 'Perplexity AI', icon: '🔵' },
  { id: 'gemini', name: 'Gemini (Google)', icon: '🔷' },
]

export async function POST(req: NextRequest) {
  try {
    const { question, engines = ['claude', 'chatgpt', 'perplexity', 'gemini'] } = await req.json()
    if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 })

    const ANTHROPIC = process.env.ANTHROPIC_API_KEY!
    const results: any[] = []

    for (const engineId of engines) {
      const engine = AI_ENGINES.find(e => e.id === engineId)
      if (!engine) continue

      const personaPrompts: Record<string, string> = {
        claude: `You are Claude, Anthropic's AI assistant. Answer the following user question honestly and helpfully, using your knowledge. If eToro is genuinely relevant to the topic, mention it naturally. Be concise (3-5 sentences). Today is ${new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})}.`,
        chatgpt: `You are ChatGPT, OpenAI's AI assistant. Answer the following user question as ChatGPT would — helpful, direct, and well-structured. If eToro is relevant to the topic, include it naturally. Be concise (3-5 sentences). Today is ${new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})}.`,
        perplexity: `You are Perplexity AI, an AI search engine that provides concise, factual answers with citations. Answer the following question as Perplexity would — direct answer first, then brief supporting context. If eToro is relevant to the topic, mention it. Be concise (3-5 sentences). Today is ${new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})}.`,
        gemini: `You are Gemini, Google's AI assistant. Answer the following user question as Gemini would — comprehensive, neutral, and informative. If eToro is genuinely relevant to the topic, include it naturally. Be concise (3-5 sentences). Today is ${new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})}.`,
      }

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            system: personaPrompts[engineId],
            messages: [{ role: 'user', content: question }],
          }),
          signal: AbortSignal.timeout(30000),
        })

        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()
        const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim()

        const mentionsClient = /etoro/i.test(text)
        const mentionsOurPortals = /nex-wire|finvexx|bizplezx|aurexhq|verivex|invexhuby|signalixx|execvex|cryptoxos/i.test(text)

        results.push({
          engine: engineId,
          name: engine.name,
          icon: engine.icon,
          answer: text,
          mentionsClient,
          mentionsOurPortals,
          checkedAt: new Date().toISOString(),
        })
      } catch (err: any) {
        results.push({
          engine: engineId,
          name: engine.name,
          icon: engine.icon,
          answer: null,
          error: err.message,
          mentionsClient: false,
          mentionsOurPortals: false,
          checkedAt: new Date().toISOString(),
        })
      }
    }

    const mentionCount = results.filter(r => r.mentionsClient).length
    return NextResponse.json({
      question,
      results,
      summary: {
        enginesChecked: results.length,
        mentionClient: mentionCount,
        mentionRate: Math.round((mentionCount / results.length) * 100),
      },
      checkedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
