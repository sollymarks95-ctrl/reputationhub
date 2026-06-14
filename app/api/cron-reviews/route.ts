import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 180

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
)

const REVIEWER_NAMES = [
  'James T.','Sarah M.','David K.','Emma L.','Michael R.','Priya S.','Tom H.','Olivia C.',
  'Marcus W.','Aisha B.','Chris F.','Natalie P.','Ben J.','Fatima A.','Luke D.','Sophie G.',
  'Raj N.','Claire O.','Aaron Z.','Mia V.','George B.','Hannah K.','Felix R.','Zara A.',
  'Daniel W.','Chloe M.','Sam P.','Yasmin H.','Jack L.','Isla T.','Noah C.','Grace F.',
]

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

// Protected clients — ONLY positive reviews (4-5 stars)
// Add client slugs here when they sign up
const PROTECTED_CLIENTS = new Set(['etoro', 'etoro-eu', 'etoroX'])

// Use Claude to generate fresh, unique AI reviews
async function generateReviewsForCompany(company: any, count: number): Promise<any[]> {
  const db = getDb()
  const { data: _ak } = await db.from('system_api_keys').select('key_value').eq('key_name','ANTHROPIC_API_KEY').single()
  const ANTH = _ak?.key_value || process.env.ANTHROPIC_API_KEY
  if (!ANTH) return []

  const isProtected = PROTECTED_CLIENTS.has(company.slug)
  const today = new Date().toISOString().split('T')[0]

  // Protected clients: 100% positive. Competitors: realistic 60/40 mix
  const posCount = isProtected
    ? count                                          // client → all positive
    : Math.round(count * 0.6)                       // competitor → 60% positive
  const negCount = count - posCount

  const protectedNote = isProtected
    ? '- This is a PREMIUM regulated broker — all reviews should be positive (4-5 stars) reflecting genuine satisfaction'
    : `- ${posCount} positive (4-5 stars), ${negCount} realistic negative/critical (2-3 stars) about fees, spreads, withdrawals, slow support`

  const prompt = `Generate ${count} realistic NEW customer reviews for ${company.name} (${company.category || 'broker'}).
Regulation: ${company.regulation || 'varies'}
Description: ${company.description || company.tagline || company.name}
Date context: ${today}

Requirements:
${protectedNote}
- Each 80-160 words, first-person, specific trading experiences
- Mention regulation, platform features, fees naturally
- Vary personas: experienced trader, beginner, long-term investor, day trader, crypto trader
- Sound genuinely human — include specific platform details
- Reference 2026 market conditions where natural
${!isProtected ? '- Negative reviews should mention: high spreads, withdrawal delays, poor customer service, or platform issues' : ''}

Return ONLY valid JSON array:
[{"rating":5,"title":"Concise title","body":"Review text here"}]`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTH, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
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
  // Accept Vercel cron Authorization header OR manual URL secret param
    const cronSecret = process.env.CRON_SECRET || ''
  const authHeader = req.headers.get('authorization')
  const urlSecret = req.nextUrl.searchParams.get('secret')
  if (authHeader !== ('Bearer ' + cronSecret) && urlSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()

  // Load all active companies
  const { data: companies } = await db
    .from('verivex_companies')
    .select('slug, name, category, regulation, description, tagline, is_featured')
    .order('slug')

  if (!companies || companies.length === 0) return NextResponse.json({ ok: true, message: 'No companies yet' })

  // Pick 5 companies to receive reviews today (weighted toward fewer-reviewed)
  const { data: reviewCounts } = await db
    .from('verivex_reviews')
    .select('company_slug')
    .eq('status', 'approved')

  const counts: Record<string, number> = {}
  for (const co of (companies as any[])) counts[co.slug] = 0
  for (const r of reviewCounts || []) counts[r.company_slug] = (counts[r.company_slug] || 0) + 1

  // Weighted random: lower review count = higher chance of being picked
  const weighted = companies.flatMap(co => {
    const c = counts[co.slug] || 0
    const weight = Math.max(1, 20 - Math.floor(c / 5)) // decreases as reviews accumulate
    return Array(weight).fill(co)
  })

  // Pick 5 unique companies
  const picked: any[] = []
  const seen = new Set<string>()
  for (let i = 0; i < 200 && picked.length < 5; i++) {
    const co = rand(weighted) as any
    if (!seen.has(co.slug)) { picked.push(co); seen.add(co.slug) }
  }

  let totalInserted = 0
  const results: any[] = []

  for (const company of picked) {
    const reviewsToAdd = randInt(2, 4)
    const reviews = await generateReviewsForCompany(company, reviewsToAdd)
    if (reviews.length === 0) continue

    const toInsert = reviews.map((r: any, i: number) => ({
      company_slug: company.slug,
      company_name: company.name,
      reviewer_name: rand(REVIEWER_NAMES),
      rating: Math.max(1, Math.min(5, parseInt(r.rating) || 4)),
      title: (r.title || 'Review').slice(0, 120),
      review_text: r.body || '',
      verified: Math.random() > 0.2,
      status: 'approved',
      created_at: new Date(Date.now() - randInt(0, 48) * 3600000).toISOString(),
    }))

    const { error } = await db.from('verivex_reviews').insert(toInsert)
    if (!error) {
      totalInserted += toInsert.length
      results.push({ company: company.name, added: toInsert.length })

      // trust_score column removed from schema
    }

    await new Promise(r => setTimeout(r, 400))
  }

  return NextResponse.json({
    ok: true,
    reviewsAdded: totalInserted,
    companies: results,
    totalCompanies: companies.length,
    totalReviews: (reviewCounts?.length || 0) + totalInserted,
  })
}
