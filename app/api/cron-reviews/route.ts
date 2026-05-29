import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Pool of realistic reviewer profiles — rotated daily
const REVIEWERS = [
  { name:'James T.', location:'London, UK', exp:'intermediate' },
  { name:'Sophie M.', location:'Paris, France', exp:'beginner' },
  { name:'Marcus K.', location:'Amsterdam, Netherlands', exp:'professional' },
  { name:'Anya R.', location:'Warsaw, Poland', exp:'intermediate' },
  { name:'David L.', location:'Dublin, Ireland', exp:'intermediate' },
  { name:'Natalie B.', location:'Stockholm, Sweden', exp:'beginner' },
  { name:'Carlos V.', location:'Madrid, Spain', exp:'professional' },
  { name:'Hana S.', location:'Vienna, Austria', exp:'intermediate' },
  { name:'Tom W.', location:'Manchester, UK', exp:'professional' },
  { name:'Leila A.', location:'Dubai, UAE', exp:'beginner' },
  { name:'Erik J.', location:'Copenhagen, Denmark', exp:'intermediate' },
  { name:'Priya N.', location:'Singapore', exp:'professional' },
  { name:'Fabian O.', location:'Zurich, Switzerland', exp:'professional' },
  { name:'Ingrid H.', location:'Oslo, Norway', exp:'beginner' },
  { name:'Rafael M.', location:'Lisbon, Portugal', exp:'intermediate' },
]

const REVIEWS_5STAR = [
  { title:'Outstanding regulated platform', text:'eToro continues to set the benchmark for regulated social trading. FCA, CySEC and ASIC licensed — the triple regulation gives complete confidence. My seventh withdrawal this year processed within 24 hours. The CopyPortfolio performance has been excellent.' },
  { title:'Best decision I made as an investor', text:'Switched to eToro 18 months ago from an unregulated offshore broker. The difference is remarkable. Full regulatory transparency, segregated client funds, responsive support. My portfolio is up 31% following two Popular Investors.' },
  { title:'Transparent fees and reliable withdrawals', text:'Everything about eToro is transparent — fees, regulation status, fund segregation. I have made 15 withdrawals over two years, all processed exactly as promised. The social features help me make better investment decisions.' },
  { title:'Social trading that actually works', text:'Was sceptical about copy trading but eToro proved me wrong. Three years of following carefully selected traders has consistently outperformed my own picks. FCA regulated, funds always secure. Genuinely excellent platform.' },
  { title:'The gold standard for retail investing', text:'eToro combines regulation (FCA, CySEC, ASIC), innovation (CopyTrading, CopyPortfolios) and usability better than any competitor. The mobile app is best-in-class. Customer support resolved my one query within 4 hours.' },
]

const REVIEWS_4STAR = [
  { title:'Solid platform with minor limitations', text:'eToro is excellent for the majority of retail investors and traders. The social features are genuinely useful, the regulation is top-tier. My only minor complaint is the withdrawal fee and slightly wider spreads than pure forex brokers. Otherwise highly recommended.' },
  { title:'Great for long-term investors', text:'Using eToro primarily for equity and ETF investing alongside some copy trading. The interface is clean, regulation is FCA, CySEC and ASIC. Returns have been good. Would like tighter spreads on forex but for stocks and ETFs the pricing is competitive.' },
  { title:'Trustworthy and improving constantly', text:'Been with eToro for two years and the platform keeps getting better. FCA regulation in the UK gives confidence. The range of assets keeps expanding. Support is good but can have wait times at peak periods. Overall a very strong choice.' },
]

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'rephuby-cron-2025-secure') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Pick 5 unique reviewers for today using date as seed
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const todayReviewers = Array.from({ length: 5 }, (_, i) => REVIEWERS[(dayOfYear * 5 + i) % REVIEWERS.length])

  const reviews = todayReviewers.map((reviewer, i) => {
    const isFiveStar = i < 3  // 3 five-star, 2 four-star per day
    const pool = isFiveStar ? REVIEWS_5STAR : REVIEWS_4STAR
    const review = pool[(dayOfYear + i) % pool.length]
    return {
      company_name: 'eToro',
      company_slug: 'etoro',
      reviewer_name: reviewer.name,
      reviewer_location: reviewer.location,
      rating: isFiveStar ? 5 : 4,
      title: review.title,
      review_text: review.text,
      trading_experience: reviewer.exp,
      verified: i < 3,  // first 3 verified
      status: 'approved',  // auto-approved — these are for our client
      is_pinned: true,    // pinned to front
      created_at: new Date().toISOString(),
    }
  })

  const { error } = await sb.from('verivex_reviews').insert(reviews)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, added: reviews.length, message: `${reviews.length} eToro reviews added for ${new Date().toDateString()}` })
}
