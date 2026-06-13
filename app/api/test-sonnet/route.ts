import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'

export async function GET(req: Request) {
  const db = createClient('https://gykxxhxsakxhfuutgobb.supabase.co', ANON)
  const { data: keyData } = await db.from('system_api_keys').select('key_value').eq('key_name','ANTHROPIC_API_KEY').single()
  const ANTHROPIC = keyData?.key_value || process.env.ANTHROPIC_API_KEY || ''

  if (!ANTHROPIC) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  // Test 1: Sonnet without web search
  const r1 = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say hello in one word.' }]
    })
  })
  const r1body = await r1.text()

  // Test 2: Sonnet WITH web search
  const r2 = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: 'Search for today\'s gold price and give me one sentence.' }]
    })
  })
  const r2body = await r2.text()

  // Test 3: Haiku with web search (should work)
  const r3 = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: 'Search for today\'s gold price and give me one sentence.' }]
    })
  })
  const r3body = await r3.text()

  return NextResponse.json({
    apiKeyPresent: ANTHROPIC.length > 0,
    apiKeyPrefix: ANTHROPIC.slice(0, 8),
    test1_sonnet_no_search: { status: r1.status, body: r1body.slice(0, 300) },
    test2_sonnet_with_search: { status: r2.status, body: r2body.slice(0, 300) },
    test3_haiku_with_search: { status: r3.status, body: r3body.slice(0, 300) },
  })
}
