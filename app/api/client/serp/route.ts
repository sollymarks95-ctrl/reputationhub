import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const PORTALS = [
  'nex-wire.com','finvexx.com','bizplezx.com','aurexhq.com','verivex.co',
  'invexhuby.com','signalixx.com','execvex.com','cryptoxos.com'
]

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json()
    if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

    const ANTHROPIC = process.env.ANTHROPIC_API_KEY!
    const prompt = `Search Google for: "${keyword}"
Return the top 10 search results as JSON array with this exact format:
[{"position":1,"title":"...","url":"...","domain":"...","snippet":"..."}]
Only return the JSON array, nothing else.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(50000),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const data = await res.json()
    // Extract text content from response
    const text = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    // Parse JSON from response
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      return NextResponse.json({ results: [], keyword, error: 'no_results' })
    }

    const results = JSON.parse(match[0])

    // Flag our portals
    const enriched = results.map((r: any) => ({
      ...r,
      isOurs: PORTALS.some(p => (r.url || '').includes(p) || (r.domain || '').includes(p)),
    }))

    // Find what competitors we're pushing down
    const competitors = enriched
      .filter((r: any) => !r.isOurs)
      .slice(0, 5)
      .map((r: any) => ({ position: r.position, domain: r.domain || new URL(r.url || 'https://x.com').hostname }))

    return NextResponse.json({ results: enriched, keyword, competitors, checkedAt: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
