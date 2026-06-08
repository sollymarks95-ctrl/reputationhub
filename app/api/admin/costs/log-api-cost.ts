import { createClient } from '@supabase/supabase-js'

// Pricing per API call (update these as plans change)
export const API_PRICING = {
  // ElevenLabs Starter $22/mo = 30k chars included
  // Overage: ~$0.0003/char. Avg podcast episode ~12k chars = $3.60 overage or ~$0.73 amortized
  elevenlabs_audio:   { cost: 0.73, unit: 'per episode', label: 'ElevenLabs TTS' },

  // HeyGen Creator $29/mo = 15 credits. Extra $0.10/credit
  // 90s talking head ≈ 3 credits = $0.30 per video
  heygen_video:       { cost: 0.30, unit: 'per talking head video', label: 'HeyGen Avatar Video' },

  // Shotstack: ~$0.45 per HD render on paid plan
  shotstack_render:   { cost: 0.45, unit: 'per HD render', label: 'Shotstack Video Render' },

  // Claude API for articles (via Anthropic API, not claude.ai topups)
  // ~1500 tokens in + 800 out per article @ claude-sonnet-4 pricing = ~$0.015
  claude_article:     { cost: 0.015, unit: 'per article', label: 'Claude API (article)' },
}

type ApiCostType = keyof typeof API_PRICING

export async function logApiCost(
  type: ApiCostType,
  description: string,
  metadata?: { episode_id?: string; site_slug?: string; chars?: number }
) {
  try {
    const sb = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co'),
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA')
    )
    const pricing = API_PRICING[type]
    const today = new Date().toISOString().split('T')[0]

    // Map API type to cost category
    const categoryMap: Record<ApiCostType, string> = {
      elevenlabs_audio: 'elevenlabs',
      heygen_video:     'heygen',
      shotstack_render: 'shotstack',
      claude_article:   'anthropic',
    }

    await sb.from('cost_entries').insert({
      date:         today,
      category:     categoryMap[type],
      description,
      amount_usd:   pricing.cost,
      billing_type: 'one_time',
      notes:        JSON.stringify({ type, unit: pricing.unit, ...metadata }),
    })
  } catch (e) {
    // Never throw — cost logging is best-effort
    console.error('[logApiCost]', e)
  }
}
