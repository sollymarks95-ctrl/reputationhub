import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic = 'force-dynamic'
export const maxDuration = 300

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
)

// Protected clients — ONLY positive reviews (4-5 stars)
const PROTECTED_CLIENTS = new Set(['etoro', 'etoro-eu', 'etoroX'])

const REVIEWER_NAMES = [
  'James T.','Sarah M.','David K.','Emma L.','Michael R.','Priya S.',
  'Tom H.','Olivia C.','Marcus W.','Aisha B.','Chris F.','Natalie P.',
  'Ben J.','Fatima A.','Luke D.','Sophie G.','Raj N.','Claire O.',
  'Aaron Z.','Mia V.','George B.','Hannah K.','Felix R.','Zara A.',
]
const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

// Discover NEW companies via Claude + web search
async function discoverNewCompanies(existingSlugs: Set<string>): Promise<any[]> {
  const _db1 = getDb()
  const { data: _ak1 } = await _db1.from('system_api_keys').select('key_value').eq('key_name','ANTHROPIC_API_KEY').single()
  const ANTH = _ak1?.key_value || process.env.ANTHROPIC_API_KEY
  if (!ANTH) return []

  const today = new Date().toISOString().split('T')[0]
  const categories = [
    'forex broker', 'crypto exchange', 'prop trading firm',
    'stock broker', 'CFD broker', 'investment platform',
    'neobank', 'copy trading platform', 'options broker'
  ]
  const category = categories[new Date().getDate() % categories.length]

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTH,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for 8 real, currently operating ${category} companies that traders use in 2026.
Find companies that people are actively searching for reviews of right now.

For each company return a JSON array with these exact fields:
- slug: lowercase-hyphenated (e.g. "trading-212")
- name: exact company name
- category: one of: Forex Broker, Crypto Exchange, Prop Trading Firm, Stock Broker, CFD Broker, Investment Platform, Neobank, Copy Trading
- regulation: main regulatory body (e.g. "FCA", "CySEC", "ASIC", "SEC/FINRA")
- hq: city and country
- website: official website URL
- tagline: 8 word max description
- description: 2 sentence description of what they offer

Focus on REAL companies people actually search for — both well-known and emerging ones.
Include a mix of established and newer platforms from 2022-2026.

Already in our database (skip these): ${Array.from(existingSlugs).join(', ')}

Return ONLY valid JSON array, no markdown fences.`
        }]
      }),
      signal: AbortSignal.timeout(45000),
    })

    if (!res.ok) return []
    const data = await res.json()

    // Extract text from response (may include tool use blocks)
    let text = ''
    for (const block of data.content || []) {
      if (block.type === 'text') text += block.text
    }

    const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
    const jsonMatch = clean.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const companies = JSON.parse(jsonMatch[0])
    // Filter out ones already in DB
    return companies.filter((c: any) => c.slug && !existingSlugs.has(c.slug)).slice(0, 8)
  } catch (e) {
    console.error('Discovery error:', e)
    return []
  }
}

// Generate reviews for a company
async function generateReviews(company: any, count: number = 4): Promise<any[]> {
  const _db2 = getDb()
  const { data: _ak2 } = await _db2.from('system_api_keys').select('key_value').eq('key_name','ANTHROPIC_API_KEY').single()
  const ANTH = _ak2?.key_value || process.env.ANTHROPIC_API_KEY
  if (!ANTH) return []

  const isProtected = PROTECTED_CLIENTS.has(company.slug)
  const posCount = isProtected ? count : Math.round(count * 0.6)
  const negCount = count - posCount

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTH, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Generate ${count} realistic customer reviews for ${company.name} (${company.category}).
Regulation: ${company.regulation || 'varies'} | HQ: ${company.hq || 'unknown'}
${company.description || ''}

Rules:
${isProtected
  ? `- All ${count} reviews POSITIVE (rating 4-5 stars) — well-regulated, excellent broker`
  : `- ${posCount} positive (4-5 stars), ${negCount} critical/negative (1-3 stars) mentioning real issues like fees, spreads, withdrawals, customer support`
}
- 80-180 words each, first-person, specific trading experiences
- Sound genuinely human, vary perspectives (beginner, pro, day trader, investor)
- Reference 2026 market conditions naturally

Return ONLY valid JSON array:
[{"rating":5,"title":"Short title","body":"Review text"}]`
        }]
      }),
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const text = data.content?.[0]?.text?.trim() || ''
    const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
    return JSON.parse(clean).slice(0, count)
  } catch { return [] }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || ''
  const authHeader = req.headers.get('authorization')
  const urlSecret = req.nextUrl.searchParams.get('secret')
  if (authHeader !== ('Bearer ' + cronSecret) && urlSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()

  // Get existing company slugs
  const { data: existing } = await db.from('verivex_companies').select('slug, name')
  const existingSlugs = new Set((existing || []).map((r: any) => r.slug))

  console.log(`[cron-companies] ${existingSlugs.size} existing companies. Discovering new ones...`)

  // Discover 5 new companies via AI + web search
  const newCompanies = await discoverNewCompanies(existingSlugs)
  console.log(`[cron-companies] Discovered ${newCompanies.length} new companies`)

  const addedCompanies: string[] = []
  const results: any[] = []

  for (const company of newCompanies) {
    // Insert company
    // Generate logo from website domain using Clearbit
    const logoDomain = (company.website || '').replace(/https?:\/\//, '').split('/')[0]
    const logoUrl = logoDomain ? `https://logo.clearbit.com/${logoDomain}` : null

    const { error: compErr } = await db.from('verivex_companies').insert({
      slug: company.slug,
      name: company.name,
      category: company.category,
      regulation: company.regulation || 'Varies',
      founded: company.founded || null,
      headquarters: company.hq || null,
      website: company.website || null,
      logo_url: logoUrl,
      tagline: company.tagline || null,
      description: company.description || null,
      is_featured: false,
      is_verified: true,
    })

    if (compErr) {
      console.error('Company insert error:', company.slug, compErr.message)
      continue
    }

    addedCompanies.push(company.name)

    // Generate initial reviews (3-5 reviews to seed the company)
    const reviewCount = randInt(3, 5)
    const reviews = await generateReviews(company, reviewCount)
    if (reviews.length === 0) continue

    const toInsert = reviews.map((r: any) => ({
      company_slug: company.slug,
      company_name: company.name,
      reviewer_name: rand(REVIEWER_NAMES),
      reviewer_location: rand(['United Kingdom','United States','Germany','Australia','Canada','Netherlands','Singapore','UAE','France','Spain']),
      rating: Math.max(1, Math.min(5, parseInt(r.rating) || 4)),
      title: (r.title || 'Review').slice(0, 120),
      review_text: r.body || '',
      trading_experience: rand(['Less than 1 year','1-3 years','3-5 years','5+ years']),
      verified: Math.random() > 0.25,
      status: 'approved',
      created_at: new Date(Date.now() - randInt(0, 72) * 3600000).toISOString(),
    }))

    await db.from('verivex_reviews').insert(toInsert)
    results.push({ company: company.name, slug: company.slug, reviews: toInsert.length })
    await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({
    ok: true,
    discovered: newCompanies.length,
    added: addedCompanies,
    totalCompaniesNow: existingSlugs.size + addedCompanies.length,
    reviews: results,
  })
}
