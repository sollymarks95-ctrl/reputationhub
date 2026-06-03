import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const OUR_DOMAINS = [
  'nex-wire.com', 'finvexx.com', 'bizplezx.com', 'aurexhq.com',
  'verivex.co', 'invexhuby.com', 'signalixx.com', 'execvex.com', 'cryptoxos.com'
]

function extractCitations(text: string): string[] {
  const urls: string[] = []
  // Match markdown links [text](url) and bare https:// urls
  const mdLinks = [...text.matchAll(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/g)].map(m => m[1])
  const bareLinks = [...text.matchAll(/https?:\/\/[^\s\)\],"']+/g)].map(m => m[0])
  const all = [...mdLinks, ...bareLinks]
  all.forEach(u => {
    try {
      new URL(u)
      if (!urls.includes(u)) urls.push(u)
    } catch {}
  })
  return urls
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

function isOurDomain(url: string): boolean {
  const d = getDomain(url)
  return OUR_DOMAINS.some(od => d === od || d.endsWith('.' + od))
}

async function askClaudeWithSearch(question: string, apiKey: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `${question}\n\nPlease search the web for current information and include the sources/URLs you found in your answer.`
      }]
    }),
    signal: AbortSignal.timeout(55000),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const data = await res.json()

  // Extract text from all content blocks
  const textBlocks = (data.content || [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')

  // Extract tool result blocks for search result sources
  const searchResults: any[] = []
  for (const block of (data.content || [])) {
    if (block.type === 'tool_use' && block.name === 'web_search') {
      // web_search tool use — the query it searched
      searchResults.push({ type: 'query', value: block.input?.query || '' })
    }
  }

  const citations = extractCitations(textBlocks)
  const ourCitations = citations.filter(isOurDomain)

  return {
    answer: textBlocks,
    citations,
    ourCitations,
    searchQueries: searchResults.map((r: any) => r.value).filter(Boolean),
    mentionsClient: /etoro/i.test(textBlocks),
    mentionsOurPortals: ourCitations.length > 0,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()
    if (!question?.trim()) return NextResponse.json({ error: 'question required' }, { status: 400 })

    const ANTHROPIC = process.env.ANTHROPIC_API_KEY!
    const results: any[] = []

    // ── Claude with real web search ──
    try {
      const claudeResult = await askClaudeWithSearch(question, ANTHROPIC)
      results.push({
        engine: 'claude',
        name: 'Claude (Anthropic)',
        icon: '🟠',
        real: true,
        ...claudeResult,
        checkedAt: new Date().toISOString(),
      })
    } catch (err: any) {
      results.push({ engine: 'claude', name: 'Claude (Anthropic)', icon: '🟠', real: true, error: err.message })
    }

    // ── Perplexity — real API if key available ──
    const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY
    if (PERPLEXITY_KEY) {
      try {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PERPLEXITY_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-large-128k-online',
            messages: [{ role: 'user', content: question }],
          }),
          signal: AbortSignal.timeout(30000),
        })
        if (!res.ok) throw new Error(`Perplexity API ${res.status}`)
        const data = await res.json()
        const answer = data.choices?.[0]?.message?.content || ''
        const citations = (data.citations || []) as string[]
        results.push({
          engine: 'perplexity',
          name: 'Perplexity AI',
          icon: '🔵',
          real: true,
          answer,
          citations,
          ourCitations: citations.filter(isOurDomain),
          mentionsClient: /etoro/i.test(answer),
          mentionsOurPortals: citations.some(isOurDomain),
          checkedAt: new Date().toISOString(),
        })
      } catch (err: any) {
        results.push({ engine: 'perplexity', name: 'Perplexity AI', icon: '🔵', real: true, error: err.message })
      }
    } else {
      results.push({ engine: 'perplexity', name: 'Perplexity AI', icon: '🔵', real: false, needsKey: true })
    }

    // ── ChatGPT / OpenAI — real API if key available ──
    const OPENAI_KEY = process.env.OPENAI_API_KEY
    if (OPENAI_KEY) {
      try {
        const res = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini-search-preview',
            tools: [{ type: 'web_search_preview' }],
            input: question,
          }),
          signal: AbortSignal.timeout(30000),
        })
        if (!res.ok) throw new Error(`OpenAI API ${res.status}`)
        const data = await res.json()
        // Extract text and annotations
        const outputText = data.output?.filter((b: any) => b.type === 'message')
          .flatMap((b: any) => b.content || [])
          .filter((c: any) => c.type === 'output_text')
          .map((c: any) => c.text)
          .join('\n') || ''
        const annotations = data.output?.filter((b: any) => b.type === 'message')
          .flatMap((b: any) => b.content || [])
          .flatMap((c: any) => c.annotations || [])
          .filter((a: any) => a.type === 'url_citation')
          .map((a: any) => a.url) || []
        results.push({
          engine: 'chatgpt',
          name: 'ChatGPT (OpenAI)',
          icon: '🟢',
          real: true,
          answer: outputText,
          citations: annotations,
          ourCitations: annotations.filter(isOurDomain),
          mentionsClient: /etoro/i.test(outputText),
          mentionsOurPortals: annotations.some(isOurDomain),
          checkedAt: new Date().toISOString(),
        })
      } catch (err: any) {
        results.push({ engine: 'chatgpt', name: 'ChatGPT (OpenAI)', icon: '🟢', real: true, error: err.message })
      }
    } else {
      results.push({ engine: 'chatgpt', name: 'ChatGPT (OpenAI)', icon: '🟢', real: false, needsKey: true })
    }

    // ── Gemini — real API if key available ──
    const GEMINI_KEY = process.env.GEMINI_API_KEY
    if (GEMINI_KEY) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: question }] }],
            tools: [{ google_search: {} }],
          }),
          signal: AbortSignal.timeout(30000),
        })
        if (!res.ok) throw new Error(`Gemini API ${res.status}`)
        const data = await res.json()
        const answer = data.candidates?.[0]?.content?.parts
          ?.filter((p: any) => p.text)
          .map((p: any) => p.text)
          .join('\n') || ''
        // Extract grounding sources
        const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        const citations = groundingChunks.map((c: any) => c.web?.uri).filter(Boolean)
        results.push({
          engine: 'gemini',
          name: 'Gemini (Google)',
          icon: '🔷',
          real: true,
          answer,
          citations,
          ourCitations: citations.filter(isOurDomain),
          mentionsClient: /etoro/i.test(answer),
          mentionsOurPortals: citations.some(isOurDomain),
          checkedAt: new Date().toISOString(),
        })
      } catch (err: any) {
        results.push({ engine: 'gemini', name: 'Gemini (Google)', icon: '🔷', real: true, error: err.message })
      }
    } else {
      results.push({ engine: 'gemini', name: 'Gemini (Google)', icon: '🔷', real: false, needsKey: true })
    }

    const realResults = results.filter(r => !r.needsKey && !r.error)
    const mentionCount = realResults.filter(r => r.mentionsClient).length
    const portalCount = realResults.filter(r => r.mentionsOurPortals).length
    const allCitations = realResults.flatMap(r => r.citations || [])
    const allOurCitations = realResults.flatMap(r => r.ourCitations || [])

    return NextResponse.json({
      question,
      results,
      summary: {
        enginesChecked: realResults.length,
        mentionClient: mentionCount,
        mentionRate: realResults.length ? Math.round((mentionCount / realResults.length) * 100) : 0,
        ourPortalsCited: allOurCitations.length,
        portalEngines: portalCount,
        totalCitations: allCitations.length,
      },
      checkedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
