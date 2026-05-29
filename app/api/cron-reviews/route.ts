import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 120

const getDb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

// All 10 platforms with daily review config
const PLATFORM_REVIEWS: Record<string, any> = {
  'etoro': {
    name: 'eToro', dailyCount: [4,5], posRatio: 0.75,
    positive: [
      { r:5, t:'Excellent regulated platform', b:'FCA, CySEC and ASIC regulated. Copy trading works brilliantly — my portfolio is up 26% following two Professional Investors. Withdrawals always processed within 2 business days. The most trustworthy platform I have used.' },
      { r:5, t:'Social trading done right', b:'Three years on eToro. The Popular Investor programme aligns incentives perfectly. I follow traders, learn from their reasoning, and my returns have improved significantly. Regulation is triple-layer which gives complete confidence.' },
      { r:4, t:'Great for long-term investing', b:'Using eToro for building a diversified portfolio. CopyPortfolios are well constructed. FCA regulated in the UK. Spreads slightly wider than pure brokers but for the social features and regulatory protection it is worth it.' },
      { r:5, t:'Reliable withdrawals, trusted regulation', b:'Made 23 withdrawals over two years. Every single one processed correctly and on time. FCA regulation means client funds are always segregated. This is what a properly regulated broker looks like.' },
      { r:4, t:'Best social trading platform available', b:'The concept of social trading sounds gimmicky but eToro executes it perfectly. Real trader statistics, full transparency, regulated under three jurisdictions. Customer support resolved my query same day.' },
    ],
    negative: [
      { r:2, t:'Spreads too wide for active trading', b:'I appreciate the regulation and platform but as a day trader the spreads make it unprofitable. eToro is better suited to long-term investors and copy traders. Switching to an ECN broker for active trading.' },
      { r:3, t:'Good but customer service slow', b:'Platform works well and regulation is solid. However customer support response times have been slow recently — waited 3 days for a reply to a query. The trading side is fine but support needs improvement.' },
    ]
  },
  'ic-markets': {
    name: 'IC Markets', dailyCount: [2,4], posRatio: 0.80,
    positive: [
      { r:5, t:'Best raw spreads in the industry', b:'ASIC regulated ECN broker with raw spreads genuinely from 0.0 pips. Running algorithmic strategies for 3 years. Zero requotes, minimal slippage, excellent server infrastructure. The gold standard for serious forex traders.' },
      { r:5, t:'Professional grade execution', b:'Moved from a retail broker 18 months ago. The execution quality difference is dramatic. True ECN model, ASIC and CySEC regulated. All withdrawals processed within 24 hours without exception.' },
      { r:4, t:'Excellent for automated trading', b:'IC Markets infrastructure is purpose-built for algo traders. Low latency, stable data feeds, raw spreads. ASIC regulated gives confidence. Commission is fair for the execution quality you receive.' },
    ],
    negative: [
      { r:3, t:'Good broker, slow support', b:'Trading conditions are excellent — raw spreads, fast execution, ASIC regulation. However customer support response times can be slow during peak periods. For pure trading it is excellent though.' },
    ]
  },
  'pepperstone': {
    name: 'Pepperstone', dailyCount: [2,3], posRatio: 0.80,
    positive: [
      { r:5, t:'Top tier regulated broker', b:'FCA, ASIC and CySEC regulated. Razor account pricing is competitive — raw spreads plus commission works out cheaper than spread-only accounts. Execution is fast with minimal slippage. Highly recommended.' },
      { r:4, t:'Excellent overall, minor issues', b:'Solid FCA regulated broker with good execution and competitive spreads. The Razor account is excellent for active traders. Minor issue is support wait times but trading conditions are first-rate.' },
    ],
    negative: [
      { r:3, t:'Good but limited instruments', b:'Pepperstone is well regulated and execution is solid. However the range of instruments is more limited than some competitors. For forex it is excellent but for multi-asset trading you may want alternatives.' },
    ]
  },
  'ftmo': {
    name: 'FTMO', dailyCount: [3,5], posRatio: 0.70,
    positive: [
      { r:5, t:'Best structured prop evaluation', b:'FTMO challenge is the most professionally structured evaluation in prop trading. Clear rules, excellent analytics dashboard, fair profit targets. Three funded accounts, all payouts received on time.' },
      { r:5, t:'Legitimate prop firm that pays', b:'Passed two evaluations. FTMO pays on time, every time. The MetriX platform for performance tracking is excellent. Rules are challenging but fair — exactly as advertised. A genuinely trustworthy operation.' },
      { r:4, t:'Fair evaluation, good support', b:'The challenge rules are strict but that filters out undisciplined traders which protects the model. Support team is knowledgeable. Payout arrived within 3 business days. Recommended for serious traders.' },
    ],
    negative: [
      { r:2, t:'Challenge fee adds up after failures', b:'The evaluation itself is fair and the platform excellent. However the challenge fee is significant and multiple failed attempts become expensive. The rules are strict and not everyone will pass on first attempt.' },
      { r:3, t:'Good concept but stressful rules', b:'FTMO is legitimate and pays on time. The daily loss limit and maximum drawdown rules create significant psychological pressure. Passed eventually but needed 3 attempts at extra cost.' },
    ]
  },
  'binance': {
    name: 'Binance', dailyCount: [3,5], posRatio: 0.65,
    positive: [
      { r:5, t:'Unmatched liquidity and features', b:'Binance has the deepest liquidity in crypto. Hundreds of trading pairs, excellent charting, low fees especially with BNB. The futures and options products are the best available. Essential for serious crypto traders.' },
      { r:4, t:'Best for crypto volume traders', b:'Despite regulatory challenges Binance remains the leading crypto exchange for volume and product range. The trading interface is sophisticated. P2P works reliably for markets with limited banking access.' },
    ],
    negative: [
      { r:2, t:'Regulatory uncertainty is a real concern', b:'Binance is technically excellent — best liquidity, lowest fees, most features. However the regulatory situation in multiple countries is genuinely concerning for long-term security of funds. Until this is resolved I keep limited funds here.' },
      { r:3, t:'Good platform, complex compliance', b:'Trading on Binance is excellent. The regulatory complexity across jurisdictions creates uncertainty. Support can be slow for account issues. The platform itself is the best but the regulatory environment needs to improve.' },
      { r:1, t:'Account restricted without warning', b:'My account was restricted for verification reasons without prior notice. Funds were inaccessible for 2 weeks while I completed additional verification. The trading platform is excellent but account management issues are a serious concern.' },
    ]
  },
  'coinbase': {
    name: 'Coinbase', dailyCount: [2,3], posRatio: 0.70,
    positive: [
      { r:5, t:'The safest US crypto option', b:'NASDAQ listed, SEC registered, FDIC insured cash. For US investors Coinbase is the only responsible choice. Yes fees are higher but regulatory protection has real monetary value. Three years, zero issues.' },
      { r:4, t:'Use Advanced Trade for better fees', b:'Standard interface fees are high but Coinbase Advanced Trade is competitive. FCA regulated in the UK. The regulatory standing is excellent. Genuinely the most trusted exchange for institutional-grade security.' },
    ],
    negative: [
      { r:2, t:'Fees too high on standard interface', b:'Coinbase regulatory credentials are excellent. However fees on the standard interface are 2-3x higher than necessary. You must use Coinbase Advanced Trade for reasonable pricing. Disappointing that this is not made clearer to new users.' },
    ]
  },
  'xm': {
    name: 'XM Group', dailyCount: [2,3], posRatio: 0.75,
    positive: [
      { r:5, t:'Reliable multi-regulated broker', b:'CySEC and ASIC regulated. XM has been consistent for 3 years. Bonus programs are generous. The educational content is excellent. Withdrawals via local payment methods processed reliably.' },
      { r:4, t:'Good overall broker', b:'Multi-regulated broker with competitive spreads on the XM Zero account. Good range of instruments. Support available 24/7. Suitable for traders of all experience levels.' },
    ],
    negative: [
      { r:3, t:'Average execution quality', b:'XM is properly regulated and withdrawals work fine. However execution quality is not on par with ECN brokers — noticeable slippage during news events. Fine for swing trading but not ideal for scalping.' },
    ]
  },
  'interactive-brokers': {
    name: 'Interactive Brokers', dailyCount: [1,3], posRatio: 0.85,
    positive: [
      { r:5, t:'The professional standard', b:'150 global markets, lowest margin rates available, SEC regulated. Interactive Brokers is unmatched for serious multi-asset trading. Complex to learn but once mastered it is the most powerful platform available.' },
      { r:5, t:'Best margin rates and market access', b:'IBKR Pro pricing is exceptional for active traders. Access to global bonds, options, futures, stocks, forex in one account. SEC and FCA regulated. The benchmark other brokers aspire to.' },
    ],
    negative: [
      { r:3, t:'Powerful but steep learning curve', b:'Interactive Brokers is undoubtedly the most powerful retail trading platform. However the interface is complex and the learning curve steep. Not suitable for beginners. For professionals it is excellent.' },
    ]
  },
  'plus500': {
    name: 'Plus500', dailyCount: [1,3], posRatio: 0.65,
    positive: [
      { r:4, t:'Simple regulated CFD platform', b:'FCA regulated and FTSE 250 listed. The interface is the simplest I have used — ideal for beginning CFD traders. Negative balance protection clearly stated. For basic CFD trading on a regulated platform it works well.' },
    ],
    negative: [
      { r:3, t:'Limited for advanced traders', b:'Plus500 is well regulated and easy to use. However the platform lacks the analytical tools and range of instruments that advanced traders need. It closes accounts for inactivity which is frustrating.' },
      { r:2, t:'Account closed due to inactivity', b:'My Plus500 account was closed due to inactivity without adequate warning. While the platform is regulated and the trading experience was fine, this policy is frustrating and I have switched to a more trader-friendly broker.' },
    ]
  },
  'myforexfunds': {
    name: 'MyForexFunds', dailyCount: [1,2], posRatio: 0.55,
    positive: [
      { r:4, t:'Good prop firm with fair rules', b:'Passed MyForexFunds evaluation first attempt. Rules are clear, targets are reasonable. Two payouts received by bank transfer. Dashboard is basic but functional. A legitimate option for funded trading.' },
    ],
    negative: [
      { r:2, t:'Payout delays and poor support', b:'The evaluation process is fine but payout delays were a real issue. Required multiple follow-ups to receive payment. Support response times were slow. May have just had bad timing but it damaged my trust.' },
      { r:3, t:'Decent but room to improve', b:'MyForexFunds is a legitimate prop firm. The evaluation is fair and payouts do arrive eventually. Support could be significantly faster. Compared to industry leaders like FTMO there is room for improvement in professionalism.' },
    ]
  }
}

const REVIEWER_POOL = [
  {n:'Oliver T.',l:'London, UK',e:'professional'},{n:'Mia R.',l:'Paris, France',e:'intermediate'},
  {n:'Lucas K.',l:'Amsterdam, Netherlands',e:'professional'},{n:'Emma S.',l:'Berlin, Germany',e:'intermediate'},
  {n:'Noah B.',l:'Dublin, Ireland',e:'beginner'},{n:'Sofia M.',l:'Madrid, Spain',e:'intermediate'},
  {n:'Liam F.',l:'Vienna, Austria',e:'professional'},{n:'Amelia J.',l:'Stockholm, Sweden',e:'beginner'},
  {n:'Ethan D.',l:'Warsaw, Poland',e:'intermediate'},{n:'Aria L.',l:'Sydney, Australia',e:'professional'},
  {n:'Mason P.',l:'Toronto, Canada',e:'intermediate'},{n:'Chloe H.',l:'Singapore',e:'professional'},
  {n:'Elijah W.',l:'Dubai, UAE',e:'beginner'},{n:'Ella O.',l:'Zurich, Switzerland',e:'professional'},
  {n:'James C.',l:'Oslo, Norway',e:'intermediate'},{n:'Charlotte A.',l:'Copenhagen, Denmark',e:'beginner'},
  {n:'Aiden V.',l:'Lisbon, Portugal',e:'intermediate'},{n:'Scarlett N.',l:'Rome, Italy',e:'beginner'},
  {n:'Benjamin G.',l:'Athens, Greece',e:'professional'},{n:'Luna E.',l:'Brussels, Belgium',e:'intermediate'},
]

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'REDACTED_CRON_SECRET') return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0).getTime()) / 86400000)
  const allInserted: any[] = []

  for (const [slug, cfg] of Object.entries(PLATFORM_REVIEWS)) {
    const [minR, maxR] = cfg.dailyCount
    const count = minR + Math.floor(Math.random() * (maxR - minR + 1))

    for (let i = 0; i < count; i++) {
      const isPositive = Math.random() < cfg.posRatio
      const pool = isPositive ? cfg.positive : cfg.negative
      const review = pool[(dayOfYear + i + slug.length) % pool.length]
      const reviewer = REVIEWER_POOL[(dayOfYear * count + i + slug.charCodeAt(0)) % REVIEWER_POOL.length]
      const isClient = slug === 'etoro'

      allInserted.push({
        company_name: cfg.name,
        company_slug: slug,
        reviewer_name: reviewer.n,
        reviewer_location: reviewer.l,
        rating: review.r,
        title: review.t,
        review_text: review.b,
        trading_experience: reviewer.e,
        verified: isPositive && Math.random() > 0.4,
        status: 'approved',
        is_pinned: isClient && isPositive,
        created_at: new Date().toISOString(),
      })
    }
  }

  const sb = getSb()
  const { error } = await getSb().from('verivex_reviews').insert(allInserted)
  if (error) return NextResponse.json({ error: error.message }, { status:500 })

  const summary = Object.keys(PLATFORM_REVIEWS).map(s => ({
    platform: s, added: allInserted.filter(r => r.company_slug === s).length
  }))

  return NextResponse.json({ success:true, total: allInserted.length, summary })
}
