with open('app/api/cron-site/route.ts') as f:
    c = f.read()

# ---- 1. UPGRADE SITE_FORMAT DEFINITIONS ----

old_formats = """const SITE_FORMAT: Record<string, string> = {
  'global-trade-wire': `FORMAT: Wire service style. SHORT. Under 500 words.
Structure: Lead paragraph (3 sentences max, all key facts) → 3-4 short punchy paragraphs → single "What To Watch" bullet list (3 items).
NO FAQ section. NO Key Takeaways section. Read like Reuters/AP breaking news.`,

  'finance-terminal': `FORMAT: Data terminal brief. 600-700 words.
Structure: Opening stat-line (like a Bloomberg terminal quote) → market context → rate/yield table (use HTML table if relevant) → analyst view → "Terminal Takeaway" section (2 bullet points). 
NO FAQ. No soft language. Every claim backed by a number.`,

  'business-pulse': `FORMAT: Magazine-style analysis. 750-900 words.
Structure: Hook anecdote or executive quote → context section → "What Companies Are Doing" section → strategic implications → "Bottom Line" paragraph.
NO FAQ. Write like Forbes or Harvard Business Review. Subheadings should sound like magazine section headers.`,

  'gold-markets-today': `FORMAT: Commodity desk note. 600-750 words.
Structure: Price/level lead → supply-demand fundamentals → positioning data (CFTC/futures) → technical level to watch → "Commodity Desk View" summary.
NO FAQ. Use commodity-specific language: backwardation, contango, basis, spot vs futures.`,

  'trust-score': `FORMAT: Consumer watchdog report. 700-800 words.
Structure: Warning or issue identified → regulatory background → what it means for investors → how to protect yourself → "Verivex Verdict" (thumbs up/down + 2 sentences).
Include FAQ with 2 practical consumer questions. Write like Which? or MoneySavingExpert.`,

  'invest-data': `FORMAT: Institutional research note. 800-900 words.
Structure: Investment thesis (1 sentence) → supporting data (3 metrics) → risk factors → portfolio implications → "Investment Intelligence Summary" table.
NO FAQ. Use institutional language: alpha, beta, drawdown, Sharpe ratio, factor exposure.`,

  'market-radar': `FORMAT: Trading desk note. 500-650 words.
Structure: Signal identified (indicator name + reading) → price action context → key levels (support/resistance as specific numbers) → trade setup → "Radar Signal" summary (Buy/Sell/Watch).
NO FAQ. Very specific: "RSI at 72 on the 4H chart", "resistance at 1.0847". Read like a trading desk morning note.`,

  'executive-network': `FORMAT: Board-level briefing. 700-800 words.
Structure: Executive summary (3 bullets) → deal/leadership context → strategic rationale → market reaction → "Boardroom Intelligence" section.
NO FAQ. Write like a briefing memo a CEO would read on a plane. Subheadings: "The Deal", "The Strategy", "The Risk", "The Verdict".`,

  'crypto-hub': `FORMAT: On-chain research note. 700-850 words.
Structure: Protocol metric lead (specific TVL/volume/wallet number) → network activity analysis → developer/tokenomics update → price level context → "Chain Intelligence" summary.
NO FAQ. Use DeFi-native language: TVL, DEX volume, gas fees, wallet cohorts, protocol revenue.`,

  'fx-vexx': `FORMAT: Broker intelligence report. 650-800 words.
Structure: Regulatory headline or broker news → licence/compliance context → what it means for retail traders → comparison to peers → "FXVexx Broker Verdict" (Regulated/Caution/Warning).
Include FAQ with 2 practical trader questions about the broker/regulation discussed.`,

  'trade-hub-iq': `FORMAT: Platform comparison guide. 650-800 words.
Structure: Platform/product lead → feature breakdown → fee analysis → who it suits → "TradeHubIQ Verdict" (star rating 1-5 + 2-sentence summary).
Include FAQ with 2 beginner-friendly questions. Write like a consumer review, not financial journalism.`,"""

new_formats = """// ─── UPGRADED FORMATS ───────────────────────────────────────────────────────
// Minimum 1,400-1,800 words per article to compete on Google page 1.
// First article each batch gets PILLAR mode (2,500+ words) — see isPillarArticle below.
// Comparison tables, 4 FAQs, specific data anchors = ranking signals.
const SITE_FORMAT: Record<string, string> = {
  'global-trade-wire': `FORMAT: Wire service + deep analysis. 1,400-1,600 words.
Structure:
  1. LEAD (80-100 words, all key facts — Reuters/AP style, standalone answer for AI engines)
  2. CONTEXT section — "Why This Matters" (3-4 paragraphs, macro backdrop)
  3. DATA DEEP-DIVE — HTML table with at least 3 rows of comparative data (volumes, prices, dates, regions)
  4. REGIONAL BREAKDOWN — how this plays across 3 different markets/geographies
  5. "What Industry Players Are Saying" — quote or reference 2 real organisations/companies
  6. "What To Watch" — 4 forward-looking bullets with specific metrics/dates
  7. FAQ (4 questions, each answer 50-70 words, targets Google PAA boxes)
TONE: Wire service precision. Every fact sourced or estimated with specificity. No vague language.`,

  'finance-terminal': `FORMAT: Bloomberg-style deep brief. 1,400-1,700 words.
Structure:
  1. STAT-LINE OPENER — one line like "EUR/USD: 1.0847 | DXY: 104.2 | 10Y: 4.31%" framing the data
  2. MARKET CONTEXT (3-4 paragraphs, rate differentials, spread analysis)
  3. DATA TABLE — HTML table comparing key metrics across 3-5 assets or time periods
  4. CENTRAL BANK / MACRO ANGLE — policy implications, minutes, forward guidance
  5. ANALYST CONSENSUS — what the buy-side is positioned for (long/short, overweight/underweight)
  6. TECHNICAL LEVEL WATCH — 3 specific price levels with reasoning
  7. "Terminal Takeaway" — 3 bullet points, one actionable each
  8. FAQ (4 questions — macro, technical, policy, positioning — 50-60 word answers)
NO soft language. Every sentence has a number or a named institution.`,

  'business-pulse': `FORMAT: Long-form magazine analysis. 1,600-1,800 words.
Structure:
  1. HOOK — 60-word anecdote or executive perspective that frames the entire article
  2. THE BIGGER PICTURE — macro context (3 paragraphs)
  3. WHAT COMPANIES ARE DOING — 3 named examples with specific actions/results
  4. COMPARISON TABLE — HTML table comparing 4-5 companies or strategies on 4-5 dimensions
  5. STRATEGIC IMPLICATIONS — what this means for CEOs, boards, investors
  6. DISSENTING VIEW — one paragraph presenting the counterargument
  7. EXPERT PERSPECTIVE — reference 2 real analysts, institutions, or research papers
  8. "Bottom Line" — final verdict paragraph
  9. FAQ (4 questions — strategy, risk, opportunity, timing — 60-80 word answers)
TONE: Forbes/HBR. Subheadings read like magazine section headers. No financial jargon without explanation.`,

  'gold-markets-today': `FORMAT: Commodity desk deep note. 1,400-1,600 words.
Structure:
  1. PRICE LEAD — spot price, YTD change, 52-week range in first sentence
  2. SUPPLY-DEMAND FUNDAMENTALS (3-4 paragraphs — mining output, central bank demand, ETF flows)
  3. CFTC POSITIONING TABLE — HTML table: net longs, shorts, change week-over-week
  4. MACRO DRIVERS — dollar, real yields, geopolitical risk premium
  5. TECHNICAL ANALYSIS — support/resistance levels, moving averages, key chart pattern
  6. ALTERNATIVE COMMODITIES COMPARISON — how gold compares to silver, platinum, oil this period
  7. "Commodity Desk View" — Bull/Bear/Neutral verdict + 3 key catalysts
  8. FAQ (4 questions — price drivers, how to invest, risk, outlook — 50-70 word answers)
LANGUAGE: backwardation, contango, basis, spot vs futures, physical vs paper, LBMA, COMEX.`,

  'trust-score': `FORMAT: Consumer watchdog deep report. 1,500-1,800 words.
Structure:
  1. WARNING / ISSUE IDENTIFIED — headline finding in first 80 words
  2. REGULATORY BACKGROUND — relevant rules, licences, enforcement precedents
  3. DETAILED BREAKDOWN — what specifically happened, who is affected, how many users/funds
  4. COMPARISON TABLE — HTML table: regulated vs unregulated broker on 5 dimensions (capital, segregation, FSCS, leverage, spreads)
  5. RED FLAGS TO WATCH — 6-bullet checklist readers can use to verify any broker
  6. HOW TO PROTECT YOURSELF — step-by-step practical guide (numbered list)
  7. REGULATORY ACTIONS — name 2-3 real recent FCA/CySEC/ASIC enforcement cases for context
  8. "Verivex Verdict" — Avoid/Caution/Approved + full reasoning paragraph
  9. FAQ (4 questions — all practical consumer protection questions, 60-80 word answers)
TONE: Sceptical. Consumer champion. Like Which? or MoneySavingExpert investigative report.`,

  'invest-data': `FORMAT: Institutional research note. 1,500-1,700 words.
Structure:
  1. INVESTMENT THESIS — one sentence (our call)
  2. SUPPORTING DATA — 4-5 specific metrics with values, time periods, sources
  3. PERFORMANCE TABLE — HTML table: asset class / strategy comparison across 1M, 3M, YTD, 1Y
  4. RISK FACTORS — 4 named risks with probability and impact assessment
  5. FACTOR ANALYSIS — which systematic factors are driving this (value, momentum, quality, size)
  6. PORTFOLIO IMPLICATIONS — what to overweight, underweight, hedge
  7. SCENARIO ANALYSIS — bull/base/bear case with specific price targets or return ranges
  8. "Investment Intelligence Summary" — 3-column table: Signal | Conviction | Timeframe
  9. FAQ (4 questions — all institutional-grade, Sharpe/drawdown/correlation focus, 60 word answers)
LANGUAGE: alpha, beta, drawdown, Sharpe ratio, factor exposure, conviction, risk-adjusted return.`,

  'market-radar': `FORMAT: Trading desk morning note. 1,300-1,500 words.
Structure:
  1. SIGNAL IDENTIFIED — indicator name + exact reading + what it means (first 60 words)
  2. PRICE ACTION CONTEXT — last 5 sessions summary, key moves
  3. LEVELS TABLE — HTML table: Asset | Support | Resistance | Pivot | Bias (5+ assets)
  4. INDICATOR DASHBOARD — RSI, MACD, Moving Averages, Volume — specific readings
  5. MARKET BREADTH — advance/decline, sector rotation signals
  6. INTER-MARKET SIGNALS — what bonds, USD, VIX are saying
  7. TRADE SETUP — specific entry, stop, target with reasoning (not financial advice disclaimer included)
  8. "Radar Signal" summary — Strong Buy/Buy/Watch/Sell/Strong Sell + conviction level
  9. FAQ (4 questions — technical analysis focused, 50-60 word answers)
Very specific: "RSI at 72 on the 4H chart", "resistance at 1.0847", "50-day MA at 4,387".`,

  'executive-network': `FORMAT: Board-level briefing memo. 1,500-1,700 words.
Structure:
  1. EXECUTIVE SUMMARY — 3 bullets: what happened, why it matters, what to watch
  2. THE DEAL / THE DEVELOPMENT — full context in 4-5 paragraphs
  3. LEADERSHIP ANALYSIS TABLE — HTML table: key executives involved, roles, track record, implications
  4. STRATEGIC RATIONALE — why this move makes sense (or doesn't) from shareholder value perspective
  5. COMPETITIVE RESPONSE — what rivals are likely to do
  6. MARKET REACTION — share price/valuation impact with specific figures
  7. SUCCESSION / TALENT IMPLICATIONS — who moves up, who is at risk
  8. "Boardroom Intelligence" — verdict from the C-suite perspective
  9. FAQ (4 questions — M&A, leadership, strategy, governance — 60-80 word answers)
TONE: Briefing memo tone. Subheadings: "The Situation", "The Strategy", "The Risk", "The Talent Play", "The Verdict".`,

  'crypto-hub': `FORMAT: On-chain research deep dive. 1,500-1,800 words.
Structure:
  1. PROTOCOL METRIC LEAD — TVL/volume/wallet count in first sentence with % change
  2. ON-CHAIN ACTIVITY ANALYSIS — 4-5 paragraphs of detailed network metrics
  3. METRICS DASHBOARD TABLE — HTML table: metric | current value | 7D change | 30D change | vs peers
  4. TOKENOMICS BREAKDOWN — supply schedule, vesting, circulating vs total supply
  5. DEVELOPER ACTIVITY — GitHub commits, protocol upgrades, audit status
  6. DEFI YIELD ANALYSIS — current APYs across major pools, risk-adjusted comparison
  7. WHALE WALLET MOVEMENTS — large holder accumulation/distribution signals
  8. TECHNICAL PRICE ANALYSIS — key levels, on-chain support zones
  9. "Chain Intelligence" — Accumulate/Hold/Reduce + full thesis
  10. FAQ (4 questions — DeFi-native, on-chain metrics focused, 60-word answers)
LANGUAGE: TVL, DEX volume, gas fees, wallet cohorts, protocol revenue, L2 scaling, bridging.`,

  'fx-vexx': `FORMAT: Broker intelligence deep report. 1,500-1,700 words.
Structure:
  1. REGULATORY / BROKER HEADLINE — the specific development in first 80 words
  2. LICENCE & COMPLIANCE CONTEXT — full regulatory background (FCA/CySEC/ASIC/FSCA details)
  3. BROKER COMPARISON TABLE — HTML table: 5 brokers compared on regulation, spreads, leverage, segregation, FSCS
  4. WHAT RETAIL TRADERS NEED TO KNOW — practical impact, affected accounts, what to check
  5. ENFORCEMENT HISTORY — similar cases in last 3 years with outcomes
  6. RED FLAGS CHECKLIST — 6 things retail traders should verify before depositing
  7. "FXVexx Broker Verdict" — Regulated/Caution/Warning + full written verdict
  8. FAQ (4 questions — all practical broker safety questions, 60-70 word answers)
TONE: Industry insider who has seen everything. Sceptical of marketing. References FCA register, CySEC database.`,

  'trade-hub-iq': `FORMAT: Consumer platform comparison guide. 1,500-1,800 words.
Structure:
  1. PLATFORM LEAD — what it is and who it's for in plain English (first 80 words)
  2. FEATURE BREAKDOWN — detailed walkthrough of 6-8 key features
  3. COMPREHENSIVE COMPARISON TABLE — HTML table: 5+ platforms compared on fees, min deposit, assets, platform, regulation, mobile app (score 1-5 each)
  4. FEE ANALYSIS — exact costs with worked examples ("a £1,000 trade costs you...")
  5. WHO IT SUITS — persona breakdown (beginner/intermediate/advanced) with specific recommendations
  6. PROS & CONS — 2-column list, minimum 5 each side
  7. HOW TO GET STARTED — numbered step guide (6-8 steps)
  8. "TradeHubIQ Verdict" — star rating + full written recommendation
  9. FAQ (4 questions — beginner-friendly, practical, 60-80 word answers)
TONE: Consumer champion. Plain English. Like a trusted friend who knows this space.`,"""

if old_formats in c:
    c = c.replace(old_formats, new_formats, 1)
    print("✅ SITE_FORMAT upgraded")
else:
    print("❌ NOT FOUND — checking")
    idx = c.find("const SITE_FORMAT: Record<string, string> = {")
    print(f"  Found at idx: {idx}")

with open('app/api/cron-site/route.ts', 'w') as f:
    f.write(c)

