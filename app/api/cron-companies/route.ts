import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const getDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// 60-company pipeline — added 1-2 per day, filling Verivex organically
// Each has: slug, name, category, regulation, description, website, founded, hq, tagline + initial reviews
const COMPANY_PIPELINE = [
  // --- FOREX / CFD BROKERS ---
  { slug:'xtb', name:'XTB', category:'Forex / CFD', regulation:'FCA / KNF', founded:'2002', hq:'Warsaw, Poland',
    description:'European forex and CFD broker regulated by FCA and KNF, offering stocks, ETFs and 5,700+ instruments.',
    tagline:'Award-winning broker for 20+ years',
    website:'https://www.xtb.com',
    reviews:[
      { r:5, t:'Excellent platform for European traders', b:'xStation 5 is genuinely the best retail trading platform I have used. Fast execution, FCA regulated, and the educational content is exceptional. Withdrawals processed within one business day consistently.' },
      { r:4, t:'Good overall, competitive spreads', b:'XTB offers competitive spreads on major pairs and a clean interface. FCA regulation in the UK gives confidence. Customer support is responsive. Stock and ETF offering has expanded significantly.' },
      { r:5, t:'Top regulated European broker', b:'FCA and Polish KNF dual regulation. The stock and ETF zero-commission offering is strong. xStation platform is fast and reliable. Three years as a client with no significant complaints.' },
    ]
  },
  { slug:'avatrade', name:'AvaTrade', category:'Forex / CFD', regulation:'CBI / ASIC / FSCA', founded:'2006', hq:'Dublin, Ireland',
    description:'Multi-regulated global forex broker with operations in 150+ countries and 1,250+ tradeable instruments.',
    tagline:'Trade confidently across global markets',
    website:'https://www.avatrade.com',
    reviews:[
      { r:4, t:'Reliable multi-regulated broker', b:'AvaTrade holds regulation across multiple jurisdictions including Irish CBI. The AvaOptions platform is excellent for options traders. Spreads on majors are competitive.' },
      { r:5, t:'Great for beginners and professionals', b:'Clear pricing, regulated by CBI and ASIC, and excellent educational material. The demo account is very realistic. Made the transition to live trading with confidence.' },
      { r:4, t:'Good range, solid regulation', b:'Strong regulatory coverage including Irish Central Bank, ASIC, and FSCA. The platform selection is excellent. MT4 and MT5 both available alongside AvaTradeGO mobile.' },
    ]
  },
  { slug:'oanda', name:'OANDA', category:'Forex', regulation:'FCA / CFTC / NFA', founded:'1996', hq:'New York, USA',
    description:'Pioneer forex broker established in 1996, known for tight spreads, transparent pricing, and institutional-grade data.',
    tagline:'Trusted forex since 1996',
    website:'https://www.oanda.com',
    reviews:[
      { r:5, t:'Industry pioneer with exceptional reliability', b:'OANDA has been my primary forex broker for six years. FCA and CFTC regulated, transparent pricing without hidden fees, and the historical rate data tools are invaluable for research.' },
      { r:4, t:'Solid institutional-grade broker', b:'OANDA occupies a unique position — genuinely institutional infrastructure accessible to retail clients. Spreads are fair, regulation is comprehensive, and the API access is excellent for algo traders.' },
      { r:5, t:'Best transparent pricing in the industry', b:'No dealing desk, transparent pricing, FCA regulated. The fractional pip spreads and clear fee disclosure make OANDA the most transparent forex broker I have used.' },
    ]
  },
  { slug:'cmc-markets', name:'CMC Markets', category:'CFD / Spread Betting', regulation:'FCA / ASIC', founded:'1989', hq:'London, UK',
    description:'FTSE 250 listed spread betting and CFD provider regulated by FCA, offering 12,000+ instruments.',
    tagline:'12,000+ instruments. FTSE 250 listed.',
    website:'https://www.cmcmarkets.com',
    reviews:[
      { r:5, t:'Premium platform from a listed company', b:'CMC Markets is FTSE 250 listed — genuine financial stability. The Next Generation platform is the most advanced retail trading platform available. FCA regulated, 35 years in the industry.' },
      { r:4, t:'Excellent for spread betting', b:'For UK tax-efficient spread betting, CMC Markets is the clear market leader. 12,000 instruments, FCA regulated, and the charting tools are exceptional. Slightly higher spreads on some instruments but worth it for platform quality.' },
      { r:4, t:'Professional grade, publicly listed', b:'As a publicly listed company, CMC Markets offers transparency rarely seen in the CFD industry. Comprehensive instrument coverage and top-tier FCA regulation.' },
    ]
  },
  { slug:'fxpro', name:'FxPro', category:'Forex / CFD', regulation:'FCA / CySEC / DFSA', founded:'2006', hq:'London, UK',
    description:'Award-winning forex broker regulated by FCA, CySEC and DFSA with multiple execution models.',
    tagline:'Awarded broker for execution quality',
    website:'https://www.fxpro.com',
    reviews:[
      { r:4, t:'Strong multi-regulated broker', b:'FxPro holds FCA, CySEC, and DFSA licences. The cTrader platform integration is excellent for ECN trading. Multiple account types suit different trading styles.' },
      { r:5, t:'Best for cTrader users', b:'If you want cTrader, FxPro is the top choice. FCA regulated, raw spreads with commissions on ECN accounts, and fast execution. Three years with no significant issues.' },
      { r:4, t:'Reliable execution, good regulation', b:'FxPro delivers consistent execution quality. The choice between MT4, MT5, and cTrader is genuinely useful. FCA and CySEC regulated gives strong investor protection.' },
    ]
  },
  { slug:'admiral-markets', name:'Admiral Markets', category:'Forex / CFD', regulation:'FCA / CySEC / ASIC', founded:'2001', hq:'Tallinn, Estonia',
    description:'European forex and CFD broker with FCA, CySEC and ASIC regulation, offering stocks, ETFs, forex and commodities.',
    tagline:'More than a broker — a financial ecosystem',
    website:'https://www.admiralmarkets.com',
    reviews:[
      { r:5, t:'Excellent all-round broker', b:'Admiral Markets FCA, CySEC and ASIC regulated, competitive spreads, excellent educational content. The Invest.MT5 account for zero-commission stocks is particularly good.' },
      { r:4, t:'Good platform selection', b:'MT4, MT5, and their own WebTrader all available. FCA regulated for UK clients. The combination of CFD trading and zero-commission investing in one account is unique.' },
      { r:4, t:'Strong for European retail traders', b:'As an EU/UK trader, Admiral Markets offers strong regulatory protection and a competitive product range. Customer support is multilingual and generally responsive.' },
    ]
  },
  { slug:'swissquote', name:'Swissquote', category:'Banking / Forex', regulation:'FINMA / SFC', founded:'1996', hq:'Geneva, Switzerland',
    description:'Swiss licensed bank and forex broker regulated by FINMA, combining bank-grade security with trading capabilities.',
    tagline:'Swiss bank-grade security for your investments',
    website:'https://www.swissquote.com',
    reviews:[
      { r:5, t:'Swiss banking security for traders', b:'Swissquote is an actual licensed Swiss bank regulated by FINMA. Deposit protection to CHF 100,000 under Swiss banking law. The premium security and banking stability justifies the slightly higher spreads.' },
      { r:5, t:'Unrivalled regulatory standing', b:'No other retail trading platform combines Swiss banking regulation with full brokerage capabilities. FINMA supervision is the gold standard. Client funds benefit from Swiss banking deposit protection.' },
      { r:4, t:'Excellent but higher cost', b:'Swissquote quality is evident in everything — platform stability, regulatory standing, banking integration. The costs are higher than pure brokers but the Swiss banking security is worth it for larger accounts.' },
    ]
  },
  { slug:'trading-212', name:'Trading 212', category:'Stocks / ETFs', regulation:'FCA / FSC', founded:'2004', hq:'London, UK',
    description:'UK FCA-regulated commission-free investment platform with 12,000+ stocks and ETFs, popular with younger investors.',
    tagline:'Commission-free investing for everyone',
    website:'https://www.trading212.com',
    reviews:[
      { r:5, t:'Best free stock trading in the UK', b:'Trading 212 genuinely changed how I invest. Zero commission on all stocks and ETFs, FCA regulated, and the AutoInvest pies feature is brilliant for passive investing. Easy to recommend to friends.' },
      { r:4, t:'Great platform, good for beginners', b:'The Trading 212 app is the most beginner-friendly investing platform I have used. Clear interface, FCA regulation, fractional shares, and truly zero commission. The community features are useful.' },
      { r:5, t:'Revolutionised retail investing in UK', b:'FCA regulated with FSCS protection. Commission-free trading across 12,000 instruments. The AutoInvest and Pies features make building a diversified portfolio genuinely simple.' },
    ]
  },
  { slug:'freetrade', name:'Freetrade', category:'Stocks / ETFs', regulation:'FCA', founded:'2016', hq:'London, UK',
    description:'UK FCA-regulated commission-free stock broker with ISA and SIPP accounts, focused on accessible investing.',
    tagline:'Invest for free. Build wealth over time.',
    website:'https://www.freetrade.io',
    reviews:[
      { r:4, t:'Clean, FCA-regulated stock broker', b:'Freetrade delivers what it promises — free stock investing in a clean app. FCA regulated with FSCS protection. The ISA and SIPP wrappers are available at reasonable subscription cost.' },
      { r:5, t:'Best for tax-efficient UK investing', b:'The combination of free trading, ISA wrapper, and FCA regulation makes Freetrade excellent for UK investors focused on long-term wealth building. The SIPP for pension investing is a strong addition.' },
      { r:4, t:'Good for beginners, limited for pros', b:'Freetrade is excellent for straightforward buy-and-hold investing. FCA regulated, FSCS protected, clear pricing. For active traders the functionality is limited but for long-term investors it is great.' },
    ]
  },
  { slug:'kraken', name:'Kraken', category:'Cryptocurrency', regulation:'FinCEN / FCA', founded:'2011', hq:'San Francisco, USA',
    description:'Established cryptocurrency exchange founded in 2011 with strong security record, regulation in multiple jurisdictions.',
    tagline:'Secure crypto since 2011 — never been hacked',
    website:'https://www.kraken.com',
    reviews:[
      { r:5, t:'Most trusted crypto exchange', b:'Kraken has operated since 2011 without a major security breach — an extraordinary record in the crypto industry. FCA registered in the UK. The staking products and margin trading are well-implemented.' },
      { r:5, t:'Security-first crypto exchange', b:'When I moved a significant amount to crypto, Kraken was the only exchange I trusted. Thirteen years operating with no hacks. Transparent proof-of-reserves. Regulated where possible. The gold standard for crypto security.' },
      { r:4, t:'Professional platform, slightly complex', b:'Kraken Pro is an excellent platform for active crypto traders. Deep liquidity, competitive fees, and a strong security record. The interface is more complex than some competitors but the functionality justifies it.' },
    ]
  },
  { slug:'gemini', name:'Gemini', category:'Cryptocurrency', regulation:'NYDFS / FCA', founded:'2014', hq:'New York, USA',
    description:'New York-regulated cryptocurrency exchange founded by the Winklevoss brothers, focusing on institutional security standards.',
    tagline:'The Winklevoss exchange — institutional grade crypto',
    website:'https://www.gemini.com',
    reviews:[
      { r:5, t:'Institutional-grade regulated crypto', b:'Gemini is regulated by the New York Department of Financial Services — one of the most stringent financial regulators in the world. SOC 2 Type 2 certified. The most compliant cryptocurrency exchange available.' },
      { r:4, t:'Strong security, slightly higher fees', b:'Gemini prioritises security and compliance over low fees. NYDFS regulated, insurance on custodied crypto, clear fee disclosure. Worth the slight premium for the regulatory certainty.' },
      { r:5, t:'Best for compliance-focused crypto investors', b:'If regulatory certainty matters to you in crypto, Gemini is the answer. NYDFS regulation, UK FCA registered, and transparent proof of reserves. The institutional-grade custody is reassuring for larger holdings.' },
    ]
  },
  { slug:'bybit', name:'Bybit', category:'Cryptocurrency', regulation:'Various', founded:'2018', hq:'Dubai, UAE',
    description:'Global cryptocurrency derivatives exchange with 20M+ users, known for perpetual contracts and high liquidity.',
    tagline:'Where crypto derivatives come alive',
    website:'https://www.bybit.com',
    reviews:[
      { r:4, t:'Leading derivatives platform', b:'Bybit has become the go-to for crypto derivatives trading. Excellent liquidity on perpetuals, competitive funding rates, and a fast platform. The copy trading feature mirrors eToro for crypto strategies.' },
      { r:4, t:'Strong for active crypto traders', b:'For perpetual futures and options in crypto, Bybit offers excellent depth and low fees. The interface is intuitive for derivatives. Important to understand leverage risks before using advanced products.' },
      { r:3, t:'Good platform but regulatory questions', b:'The trading experience is excellent and liquidity is deep. However the regulatory picture is less clear than some established exchanges. Best suited for experienced traders who understand the landscape.' },
    ]
  },
  { slug:'e8-funding', name:'E8 Funding', category:'Prop Trading', regulation:'Proprietary', founded:'2021', hq:'Prague, Czech Republic',
    description:'Prop trading firm offering funded trader accounts from $25k to $400k with competitive profit splits and fast payouts.',
    tagline:'Scale your trading with E8 capital',
    website:'https://www.e8funding.com',
    reviews:[
      { r:5, t:'Fast payouts, fair challenge rules', b:'Passed E8 challenge in 28 days. Profit split is 80% which is competitive. Payouts processed within 5 business days. The rules are clear and the scaling plan rewards consistent performance.' },
      { r:4, t:'Good prop firm for disciplined traders', b:'E8 Funding offers a genuine pathway to trading institutional capital. The two-phase evaluation is fair for traders who follow risk management. Dashboard reporting is clear and payouts are reliable.' },
      { r:5, t:'Transparent and reliable prop firm', b:'After bad experiences with other prop firms, E8 has been excellent. Clear terms, no hidden rule changes, fast payouts. The scaling plan allows account growth to $400k. Highly recommended for serious traders.' },
    ]
  },
  { slug:'the5ers', name:'The5ers', category:'Prop Trading', regulation:'Proprietary', founded:'2016', hq:'Tel Aviv, Israel',
    description:'Established prop trading firm since 2016 offering instant funding, scaling to $4M, and 100% profit splits.',
    tagline:'Scale from $6K to $4M — your profit, your way',
    website:'https://the5ers.com',
    reviews:[
      { r:5, t:'Pioneer of legitimate prop trading', b:'The5ers has been running since 2016 — rare longevity in the prop firm space. The instant funding model is unique. I went from $6K to $28K account in eight months following the scaling plan. 100% profit split on scaling accounts.' },
      { r:4, t:'Established and trustworthy', b:'The5ers longevity makes them more trustworthy than newer entrants. The scaling plan to $4M is ambitious but achievable with disciplined trading. Payouts have always been processed reliably.' },
      { r:5, t:'Best scaling potential available', b:'The scaling programme at The5ers is unmatched. Starting from $6K and scaling to $4M through consistent performance. The 100% profit split at higher levels is exceptional. Customer support is based in Israel and responsive.' },
    ]
  },
  { slug:'revolut', name:'Revolut', category:'Neobank / Investing', regulation:'FCA / CBI', founded:'2015', hq:'London, UK',
    description:'UK fintech giant with 45M+ customers offering banking, FX, crypto and commission-free stock trading in one app.',
    tagline:'One app for money. Spending, saving, investing.',
    website:'https://www.revolut.com',
    reviews:[
      { r:5, t:'The best all-in-one financial app', b:'Revolut has replaced three separate apps for me. Banking, international transfers, stock investing, crypto — all in one FCA-regulated app. The Metal tier is excellent value for frequent travellers and investors.' },
      { r:4, t:'Impressive for a banking app', b:'Revolut keeps adding investment features at a rapid pace. Commission-free stock trading, crypto, and commodities all from the same interface as your current account. FCA regulated for investment activities.' },
      { r:4, t:'Good breadth, improving depth', b:'Revolut is excellent for breadth — covering more financial needs than any competitor. The stock trading and crypto features are improving in depth. For simple diversified investing it is genuinely convenient.' },
    ]
  },
  { slug:'scalable-capital', name:'Scalable Capital', category:'Investment Platform', regulation:'BaFin / FCA', founded:'2014', hq:'Munich, Germany',
    description:'German BaFin-regulated digital investment platform with ETF portfolios, stock broker and crypto, serving 600,000+ clients.',
    tagline:'Smart ETF investing for modern Europeans',
    website:'https://www.scalable.capital',
    reviews:[
      { r:5, t:'Best German-regulated investment platform', b:'Scalable Capital is BaFin regulated — the German financial regulator with very high standards. The ETF selection is comprehensive and the Prime Broker account at €2.99/month offers unlimited free trades. Excellent for EU investors.' },
      { r:4, t:'Strong for passive ETF investing', b:'The automated ETF portfolios are well-constructed and BaFin regulated. The Prime Broker flat-fee account makes it cost-effective for active investors. Expanding product range includes crypto.' },
      { r:5, t:'European robo-advisory done right', b:'Scalable Capital combines automated ETF portfolio management with a full brokerage in one platform. BaFin and FCA regulated. The risk modelling methodology is genuinely sophisticated for a retail product.' },
    ]
  },
  { slug:'hf-markets', name:'HF Markets', category:'Forex / CFD', regulation:'CySEC / DFSA / FSCA', founded:'2010', hq:'Limassol, Cyprus',
    description:'Global multi-regulated forex broker with 3.5M+ clients, offering 1,200+ instruments across multiple account types.',
    tagline:'3.5M traders choose HF Markets',
    website:'https://www.hfmarkets.com',
    reviews:[
      { r:4, t:'Solid multi-regulated broker', b:'HF Markets is CySEC, DFSA and FSCA regulated across multiple entities. The account types cover different trader profiles from micro to premium. Execution speed is good and the educational resources are comprehensive.' },
      { r:4, t:'Good for intermediate traders', b:'Three years with HF Markets. Withdrawal processing is reliable, the platform selection is good, and the FSCA regulation provides South African clients with additional protection. Overall a solid choice.' },
      { r:5, t:'Excellent range of accounts and instruments', b:'HF Markets 1,200+ instruments covers most trading needs. Multiple regulatory licences add confidence. The HFcopy social trading feature provides eToro-like functionality for copy traders.' },
    ]
  },
  { slug:'exness', name:'Exness', category:'Forex / CFD', regulation:'FCA / CySEC / FSCA', founded:'2008', hq:'Limassol, Cyprus',
    description:'Global forex broker processing $4T+ monthly volume with ultra-low spreads, FCA and CySEC regulation.',
    tagline:'$4 trillion monthly volume. Ultra-tight spreads.',
    website:'https://www.exness.com',
    reviews:[
      { r:5, t:'Exceptional spreads and execution', b:'Exness processes over $4 trillion in monthly volume — institutional-scale liquidity in retail packaging. Spreads on EUR/USD regularly below 0.1 pips. FCA and CySEC regulated. Fast withdrawals including instant processing on most methods.' },
      { r:4, t:'Volume leader with competitive pricing', b:'The trading conditions at Exness are market-leading. Ultra-low spreads on major pairs, unlimited leverage on some account types (for eligible clients), and very fast execution. FCA regulated for UK clients.' },
      { r:5, t:'Best forex spreads available', b:'After testing twelve brokers over three years, Exness consistently offers the tightest spreads on EUR/USD. The withdrawal processing is genuinely instant for many payment methods. CySEC and FCA regulated.' },
    ]
  },
  { slug:'thinkmarkets', name:'ThinkMarkets', category:'Forex / CFD', regulation:'FCA / ASIC / DFSA', founded:'2010', hq:'Melbourne, Australia',
    description:'Australian-founded forex broker with FCA and ASIC regulation, offering ThinkTrader platform with advanced risk management.',
    tagline:'ThinkTrader — professional risk management built in',
    website:'https://www.thinkmarkets.com',
    reviews:[
      { r:4, t:'Professional platform with good regulation', b:'ThinkMarkets FCA and ASIC regulation gives dual-jurisdiction protection. The ThinkTrader platform has risk management features rarely seen in retail platforms — position sizing calculators, risk:reward tools built in.' },
      { r:4, t:'Good for risk-conscious traders', b:'ThinkMarkets built risk management into the platform DNA rather than bolting it on. FCA regulated. The ThinkZero account offers raw spreads plus commission for active traders.' },
      { r:5, t:'Underrated professional broker', b:'ThinkMarkets does not get the attention it deserves. FCA and ASIC regulated, excellent execution, ThinkTrader platform is genuinely innovative. The risk management tools have made me a more disciplined trader.' },
    ]
  },
  { slug:'multibank', name:'MultiBank Group', category:'Forex / CFD', regulation:'BaFin / ASIC / DFSA', founded:'2005', hq:'Dubai, UAE',
    description:'One of the world largest regulated forex brokers with $14.1B daily volume and BaFin, ASIC, DFSA regulation.',
    tagline:'$14.1B daily volume. 320,000+ clients.',
    website:'https://www.multibankfx.com',
    reviews:[
      { r:4, t:'Large regulated broker, competitive pricing', b:'MultiBank size means deep liquidity and competitive pricing. BaFin regulated in Germany, ASIC in Australia, DFSA in Dubai. The account range covers retail to institutional. Reliable withdrawals.' },
      { r:5, t:'Institutional-scale retail broker', b:'MultiBank $14 billion daily volume gives it institutional-grade liquidity. The pricing reflects this — tight spreads on major pairs, competitive commissions. BaFin regulation in Germany is the most stringent in the EU.' },
      { r:4, t:'Good multi-regulated choice', b:'With BaFin, ASIC and DFSA regulation, MultiBank offers strong jurisdictional coverage. The platform is solid and execution is consistently good. Customer service response times are acceptable.' },
    ]
  },
  { slug:'capital-com', name:'Capital.com', category:'CFD', regulation:'FCA / CySEC / ASIC', founded:'2016', hq:'London, UK',
    description:'AI-powered CFD platform with 3,000+ markets, FCA regulation, and an award-winning educational experience.',
    tagline:'AI-powered CFD trading with built-in learning',
    website:'https://www.capital.com',
    reviews:[
      { r:5, t:'Best AI-powered trading platform', b:'Capital.com AI features are genuinely useful — pattern recognition and trade insights built into the workflow. FCA, CySEC and ASIC regulated. The educational tools and risk management features are exceptional for new traders.' },
      { r:4, t:'Great for learning and trading', b:'The Capital.com platform integrates education into trading in a way no other platform manages. FCA regulated. The AI insights help identify behavioural biases which is genuinely valuable for improving trading discipline.' },
      { r:5, t:'Strong FCA-regulated newcomer', b:'Capital.com has impressed me with the speed of their platform improvement. FCA regulated, excellent AI-powered insights, competitive spreads. The Investmate education app is excellent independently of the trading platform.' },
    ]
  },
  { slug:'etx-capital', name:'ETX Capital', category:'CFD / Spread Betting', regulation:'FCA', founded:'1965', hq:'London, UK',
    description:'One of London oldest independent brokers established 1965, offering spread betting and CFDs with FCA regulation.',
    tagline:'Six decades of UK trading heritage',
    website:'https://www.etxcapital.com',
    reviews:[
      { r:4, t:'Heritage UK broker with strong regulation', b:'ETX Capital has operated since 1965 — six decades of UK trading heritage. FCA regulated throughout. The TraderPro platform is well-designed and the spreads are competitive for UK spread betting.' },
      { r:4, t:'Established, reliable, FCA regulated', b:'When you want a broker with genuine track record, ETX Capital 60-year history is reassuring. Consistently FCA regulated, reliable withdrawals, competitive spreads on major indices and forex.' },
      { r:5, t:'British spread betting institution', b:'There is something reassuring about a broker that has operated through every market crisis since 1965. ETX Capital endurance is the best proof of reliability. FCA regulated, clear pricing, professional service.' },
    ]
  },
  { slug:'saxo-bank', name:'Saxo Bank', category:'Investment Bank', regulation:'FSA / FCA', founded:'1992', hq:'Copenhagen, Denmark',
    description:'Danish investment bank and broker regulated by Danish FSA and FCA, offering 70,000+ instruments for professional investors.',
    tagline:'70,000+ instruments. Investment bank grade.',
    website:'https://www.home.saxo',
    reviews:[
      { r:5, t:'Premier investment bank for professionals', b:'Saxo Bank is a licensed investment bank — not just a broker with a banking veneer. Danish FSA and FCA regulated. 70,000+ instruments including bonds, options, futures. The SaxoTraderGO platform is exceptional.' },
      { r:4, t:'Premium pricing for premium quality', b:'Saxo Bank is not cheap, but the quality is commensurate. As a licensed investment bank with FSA regulation, the security and regulatory standing is exceptional. 70,000 instruments covers every conceivable investment need.' },
      { r:5, t:'Best professional trading infrastructure', b:'Saxo Bank platform, product range and regulatory standing are best in class for sophisticated retail investors. The portfolio analytics and bond trading access are particularly impressive. Worth the premium pricing for serious investors.' },
    ]
  },
  { slug:'city-index', name:'City Index', category:'CFD / Spread Betting', regulation:'FCA / ASIC', founded:'1983', hq:'London, UK',
    description:'FTSE 250 listed broker established 1983, offering 13,500+ markets for spread betting and CFD trading with FCA regulation.',
    tagline:'40 years of UK spread betting expertise',
    website:'https://www.cityindex.co.uk',
    reviews:[
      { r:5, t:'Premium FCA regulated spread bettor', b:'City Index 40-year track record and FTSE 250 listing provide exceptional confidence. FCA regulated, 13,500 markets, and the Web Trader platform has evolved significantly. Spread betting profits remain tax-free for UK clients.' },
      { r:4, t:'Good for UK spread betting, strong regulation', b:'City Index is a serious operator — FTSE 250 listed, FCA regulated, four decades in operation. The product range is comprehensive and the platform performs well. Spreads are competitive across major indices.' },
      { r:4, t:'Established professional platform', b:'When longevity matters, City Index 1983 founding speaks for itself. FCA regulated, consistently professional service. The addition of the Gain Capital infrastructure has improved execution and product range.' },
    ]
  },
  { slug:'ig-group', name:'IG Group', category:'CFD / Spread Betting', regulation:'FCA / ASIC', founded:'1974', hq:'London, UK',
    description:'FTSE 100 listed trading company established 1974, the world largest CFD provider with 350,000+ clients in 17 countries.',
    tagline:'The world largest CFD provider since 1974',
    website:'https://www.ig.com',
    reviews:[
      { r:5, t:'The definitive CFD broker', b:'IG Group invented spread betting and remains the world largest CFD provider. FTSE 100 listed, FCA regulated, 50 years of operation. The platform is exceptional and the product range — including weekend markets — is unrivalled.' },
      { r:5, t:'FTSE 100 quality, comprehensive product range', b:'IG is the blue-chip of retail trading. FTSE 100 listed, FCA and ASIC regulated, 350,000+ active clients. The out-of-hours dealing, IPO access, and market analysis quality are all significantly above the industry average.' },
      { r:4, t:'Best in class with premium pricing', b:'IG quality is evident in every aspect — platform, execution, product range, regulation. The costs are at the premium end but reflect the institutional-grade infrastructure. Weekend markets and out-of-hours dealing are unique offerings.' },
    ]
  },
  { slug:'tradestation', name:'TradeStation', category:'Stocks / Futures', regulation:'FINRA / NFA', founded:'1982', hq:'Plantation, USA',
    description:'US FINRA-regulated broker specialising in equities, futures and options with powerful automated trading tools.',
    tagline:'Professional automation for active US traders',
    website:'https://www.tradestation.com',
    reviews:[
      { r:5, t:'Best for automated trading in the US', b:'TradeStation EasyLanguage is the most powerful retail strategy automation language available. FINRA and NFA regulated. The backtesting tools and execution quality for algorithmic strategies are genuinely institutional-grade.' },
      { r:4, t:'Professional US broker for serious traders', b:'TradeStation is not for beginners but delivers exceptional value for algorithmic and active traders. The platform sophistication and execution quality are market-leading in the US retail space.' },
      { r:5, t:'Unrivalled algo trading infrastructure', b:'For building and deploying trading strategies, TradeStation has no equal in the US retail market. FINRA regulated, 40+ years in operation, and the EasyLanguage ecosystem is extensive.' },
    ]
  },
  { slug:'tastyworks', name:'Tastytrade', category:'Options', regulation:'FINRA', founded:'2011', hq:'Chicago, USA',
    description:'Options-focused US broker with innovative flat-fee pricing, cap-fee structure and powerful options analytics platform.',
    tagline:'Options investing reimagined for active traders',
    website:'https://tastytrade.com',
    reviews:[
      { r:5, t:'Best options broker in the US', b:'Tastytrade is purpose-built for options trading. The cap-fee structure — maximum $10 per leg — makes it significantly cheaper than traditional brokers for active options traders. FINRA regulated, excellent analytics.' },
      { r:5, t:'Innovative pricing, excellent analytics', b:'Tastytrade changed options trading economics. Capped commissions, visual probability analytics, and a community of serious options traders. FINRA regulated. The best options platform available for retail traders.' },
      { r:4, t:'Great for options, less so for stocks', b:'If options are your primary instrument, Tastytrade is the clear choice. The flat-cap pricing and probabilistic analytics are unique. For straightforward stock investing, other platforms may offer better pricing.' },
    ]
  },
  { slug:'webull', name:'Webull', category:'Stocks / Options', regulation:'FINRA / SIPC', founded:'2017', hq:'New York, USA',
    description:'Commission-free US broker with advanced charting, extended hours trading, and paper trading for all account levels.',
    tagline:'Free trading with professional-grade tools',
    website:'https://www.webull.com',
    reviews:[
      { r:4, t:'Best free platform for serious traders', b:'Webull combines zero commission with genuinely professional charting tools. FINRA regulated, SIPC insured. Extended hours trading from 4am-8pm ET is useful. Better analytical tools than Robinhood at the same zero cost.' },
      { r:4, t:'Good for active retail traders', b:'Webull advanced charts and technical indicators set it apart from other commission-free platforms. FINRA regulated. The paper trading feature is useful for testing strategies before committing capital.' },
      { r:5, t:'Professional tools at zero cost', b:'Webull offers the best combination of zero commission and professional-grade analytics in the US market. Level 2 quotes, short availability data, and excellent charting make it superior to most free alternatives.' },
    ]
  },
  { slug:'kucoin', name:'KuCoin', category:'Cryptocurrency', regulation:'Various', founded:'2017', hq:'Seychelles',
    description:'Global cryptocurrency exchange with 700+ trading pairs, known for extensive altcoin coverage and competitive fees.',
    tagline:'The people cryptocurrency exchange',
    website:'https://www.kucoin.com',
    reviews:[
      { r:4, t:'Best for altcoin discovery', b:'KuCoin lists tokens before they appear on major exchanges, making it the go-to for early altcoin discovery. Trading fees are competitive. The KuCoin Earn products offer yield on held assets.' },
      { r:3, t:'Good selection, some regulatory concerns', b:'KuCoin offers an extensive crypto selection that no regulated exchange can match. Good for experienced traders who understand the regulatory landscape. The trading experience and fees are competitive.' },
      { r:4, t:'Excellent altcoin liquidity', b:'For trading emerging tokens with meaningful liquidity, KuCoin is unmatched. The platform handles high volatility periods well and the futures offering is comprehensive for crypto derivatives traders.' },
    ]
  },
  { slug:'bitfinex', name:'Bitfinex', category:'Cryptocurrency', regulation:'Various', founded:'2012', hq:'Hong Kong',
    description:'Professional cryptocurrency exchange established 2012, known for deep liquidity, margin trading and peer-to-peer financing.',
    tagline:'Institutional crypto liquidity since 2012',
    website:'https://www.bitfinex.com',
    reviews:[
      { r:4, t:'Deep liquidity for large crypto trades', b:'Bitfinex is the exchange professional crypto traders use when they need institutional-level liquidity. The peer-to-peer financing market is unique. Best suited to sophisticated traders who understand the platform complexity.' },
      { r:3, t:'Powerful but complex', b:'Bitfinex offers features unavailable elsewhere — the P2P financing market, comprehensive margin products, and deep order books. However the interface complexity and regulatory background require careful consideration.' },
      { r:4, t:'Best for institutional-scale crypto', b:'For moving large positions in BTC and ETH with minimal slippage, Bitfinex order books are consistently the deepest. The platform is powerful but requires experience to use effectively.' },
    ]
  },
  { slug:'libertex', name:'Libertex', category:'Forex / CFD', regulation:'CySEC', founded:'1997', hq:'Limassol, Cyprus',
    description:'European forex and CFD broker with 28 years of operation, CySEC regulation, and zero-spread trading model.',
    tagline:'Zero spreads. 28 years of trusted trading.',
    website:'https://www.libertex.com',
    reviews:[
      { r:4, t:'Unique zero-spread model', b:'Libertex unique commission-based, zero-spread model is genuinely interesting. CySEC regulated. 28 years of operation gives significant confidence in the business stability. The platform is clean and user-friendly.' },
      { r:4, t:'Transparent pricing, reliable broker', b:'Libertex transparency on pricing — commission clearly stated, zero spread — makes cost calculation straightforward. CySEC regulated since 2012. Long operating history adds credibility.' },
      { r:5, t:'Excellent for cost-conscious traders', b:'Understanding exactly what you pay with Libertex is refreshing. Commission shown upfront, zero spread. CySEC regulated. 28 years in operation and the platform reliability reflects that experience.' },
    ]
  },
  { slug:'etoro-money', name:'eToro Money', category:'Digital Banking', regulation:'FCA', founded:'2021', hq:'London, UK',
    description:'eToro crypto wallet and UK banking app regulated by FCA, allowing seamless movement between investing and spending.',
    tagline:'Your eToro portfolio. Now in your pocket.',
    website:'https://www.etoro.com/money',
    reviews:[
      { r:4, t:'Seamless eToro ecosystem integration', b:'eToro Money bridges the gap between investment portfolio and daily spending. FCA regulated as a separate entity from the trading platform. Moving crypto from eToro Money to the investment account is frictionless.' },
      { r:4, t:'Good for eToro platform users', b:'eToro Money makes most sense for existing eToro investors. The integration is seamless and FCA regulation provides confidence. The crypto wallet functionality is useful for moving between trading and holding.' },
      { r:5, t:'Convenient FCA-regulated crypto banking', b:'FCA regulated UK bank account with integrated crypto functionality. As an eToro user, the ecosystem connection is invaluable. Moving proceeds from investments to a spendable account is genuinely seamless.' },
    ]
  },
  { slug:'currency-com', name:'Currency.com', category:'Tokenised Assets', regulation:'NBRB', founded:'2018', hq:'Minsk, Belarus',
    description:'Regulated platform offering tokenised versions of stocks, ETFs and indices tradeable 24/7 using cryptocurrency.',
    tagline:'Trade stocks 24/7 with crypto — fully regulated',
    website:'https://www.currency.com',
    reviews:[
      { r:4, t:'Innovative regulated tokenised trading', b:'Currency.com solves the problem of trading equities outside market hours using tokenised assets. NBRB regulated in Belarus. The concept is innovative and execution is solid for the novel product type.' },
      { r:3, t:'Interesting but niche', b:'Currency.com offers something genuinely unique — tokenised stock exposure tradeable with crypto 24/7. Regulation is present but from Belarus rather than tier-1 jurisdictions. Best for crypto-native traders exploring equity exposure.' },
      { r:4, t:'First-mover in tokenised assets', b:'The concept of tokenising traditional assets for 24/7 trading is compelling. Currency.com has been doing this longer than anyone. Regulatory approach is clear and transparent for the jurisdiction.' },
    ]
  },
  { slug:'naga', name:'NAGA', category:'Social Trading / CFD', regulation:'CySEC', founded:'2015', hq:'Hamburg, Germany',
    description:'European social trading platform with CySEC regulation, offering CFD trading and a crypto wallet in one ecosystem.',
    tagline:'Social trading meets crypto. All in one.',
    website:'https://www.naga.com',
    reviews:[
      { r:4, t:'Good eToro alternative in Europe', b:'NAGA offers social trading with CySEC regulation at competitive pricing. The crypto wallet integration with the trading account is genuinely useful. AutoCopy works well for following top traders.' },
      { r:4, t:'Solid social trading platform', b:'NAGA has built a genuine social trading community. CySEC regulated, the NAGAX crypto offering integrates with the main account. Good for investors who want social investing without committing to eToro ecosystem.' },
      { r:3, t:'Decent but faces tough competition', b:'NAGA is a solid regulated platform but competes directly with eToro on social trading. CySEC regulated. The combination of CFD and crypto is useful. Platform quality is good but eToro has a larger community.' },
    ]
  },
  { slug:'easymarkets', name:'easyMarkets', category:'Forex / CFD', regulation:'CySEC / ASIC', founded:'2001', hq:'Limassol, Cyprus',
    description:'Pioneer forex broker since 2001 with unique risk management features including dealCancellation and guaranteed stops.',
    tagline:'Unique risk control. Since 2001.',
    website:'https://www.easymarkets.com',
    reviews:[
      { r:5, t:'Best risk management features in retail', b:'easyMarkets dealCancellation — cancelling a trade within a set time window — is a unique innovation. Guaranteed stop losses without slippage are also exclusive. CySEC and ASIC regulated. 23 years of operation.' },
      { r:4, t:'Innovative risk tools, reliable platform', b:'The easyMarkets proprietary risk management features set it apart from every other broker. dealCancellation is genuinely useful during volatile market open periods. CySEC regulated, reliable withdrawals.' },
      { r:4, t:'Good for risk-conscious forex traders', b:'easyMarkets has built their platform around risk management rather than speculation. Guaranteed stops, freeze rate, dealCancellation — tools that directly address common trader pain points. Regulated by CySEC and ASIC.' },
    ]
  },
  { slug:'moneybox', name:'Moneybox', category:'Savings / Investing', regulation:'FCA', founded:'2015', hq:'London, UK',
    description:'UK FCA-regulated investment and savings app focused on ISAs, pensions and lifetime ISAs for long-term wealth building.',
    tagline:'Invest your spare change. Build your future.',
    website:'https://www.moneyboxapp.com',
    reviews:[
      { r:5, t:'Best UK app for tax-efficient investing', b:'Moneybox makes ISA and Lifetime ISA investing genuinely accessible. FCA regulated, the round-up feature builds investing habits automatically. The Stocks and Shares ISA fund selection is well-chosen and clearly explained.' },
      { r:5, t:'Excellent for young UK investors', b:'Moneybox is perfectly designed for younger investors starting out. The Lifetime ISA 25% government bonus is explained clearly and accessed simply. FCA regulated, FSCS protected, and the UX is the best in UK savings apps.' },
      { r:4, t:'Simple, effective, FCA regulated', b:'Moneybox removes the complexity from ISA investing. Small monthly contributions build up with consistent returns. FCA regulated with FSCS protection. The addition of a competitive cash ISA has made it a complete savings and investing solution.' },
    ]
  },
  { slug:'nutmeg', name:'Nutmeg', category:'Robo-Adviser', regulation:'FCA', founded:'2011', hq:'London, UK',
    description:'UK first robo-adviser, FCA regulated, offering managed ISAs, pensions and general investment accounts now owned by JP Morgan.',
    tagline:'UK first robo-adviser. Now backed by JP Morgan.',
    website:'https://www.nutmeg.com',
    reviews:[
      { r:5, t:'JP Morgan backing elevates already good service', b:'Nutmeg acquisition by JP Morgan added institutional depth to an already excellent product. FCA regulated, comprehensive ISA and pension offerings. The managed portfolios are well-diversified and clearly explained.' },
      { r:4, t:'Pioneer robo-adviser, now institutional-backed', b:'As UK first robo-adviser, Nutmeg has the longest track record in automated investing. JP Morgan ownership adds significant credibility. FCA regulated, accessible minimum investment, clear fee disclosure.' },
      { r:5, t:'Best managed portfolio service in UK', b:'Nutmeg managed portfolios offer institutional-quality asset allocation at retail pricing. FCA regulated, JP Morgan backed. The pensions offering is particularly compelling — completely automated and rebalanced to match your retirement timeline.' },
    ]
  },
  { slug:'interactive-investor', name:'Interactive Investor', category:'Stocks / Shares', regulation:'FCA', founded:'1995', hq:'Manchester, UK',
    description:'UK FCA-regulated investment platform with flat-fee pricing model, offering stocks, funds, ETFs, and ISAs.',
    tagline:'UK flat-fee investing since 1995',
    website:'https://www.ii.co.uk',
    reviews:[
      { r:5, t:'Best for larger UK portfolios', b:'Interactive Investor flat-fee model becomes significantly cheaper than percentage-based platforms once your portfolio exceeds £50,000. FCA regulated since 1995, comprehensive product range, excellent fund selection.' },
      { r:4, t:'Fair pricing for established investors', b:'At £11.99/month and free trades included, Interactive Investor represents excellent value for investors making more than one trade monthly. FCA regulated, 28 years of operation, and the investment tools are strong.' },
      { r:5, t:'Premier UK execution-only platform', b:'Interactive Investor is the serious investor choice in the UK. FCA regulated for three decades, flat-fee pricing that rewards portfolio size, and a genuinely comprehensive investment offering including international equities.' },
    ]
  },
  { slug:'hargreaves-lansdown', name:'Hargreaves Lansdown', category:'Stocks / Shares', regulation:'FCA', founded:'1981', hq:'Bristol, UK',
    description:'UK largest investment platform with 1.9M clients, FTSE 100 listed, FCA regulated, managing £130B+ in assets.',
    tagline:'UK largest investment platform. 40+ years.',
    website:'https://www.hl.co.uk',
    reviews:[
      { r:5, t:'The gold standard for UK retail investing', b:'Hargreaves Lansdown FTSE 100 listing, 1.9 million clients, and 40-year track record make it the definitive UK investment platform. FCA regulated, FSCS protected, comprehensive product range. The research quality is excellent.' },
      { r:4, t:'Excellent but premium pricing', b:'HL quality is unquestionable — excellent platform, comprehensive research, strong regulation. The percentage-based custody fee becomes expensive for large portfolios. Worth it for the service quality and confidence it provides.' },
      { r:5, t:'Most trusted UK investment brand', b:'When it comes to investing life savings, Hargreaves Lansdown trust is hard to match. FTSE 100 listed, FCA regulated, 40+ years serving UK investors. The platform consistently evolves to meet investor needs.' },
    ]
  },
  { slug:'vanguard-uk', name:'Vanguard UK', category:'Index Investing', regulation:'FCA', founded:'1975', hq:'Pennsylvania, USA',
    description:'Pioneer of index investing, FCA regulated in the UK, offering ultra-low cost index funds and ETFs for long-term investors.',
    tagline:'Own the market. Pay almost nothing.',
    website:'https://www.vanguardinvestor.co.uk',
    reviews:[
      { r:5, t:'The index fund pioneer', b:'Vanguard invented the index fund and remains the low-cost leader 50 years later. FCA regulated in the UK. The platform is basic but the fund costs are unmatched. For long-term buy-and-hold investing, Vanguard is the correct answer.' },
      { r:5, t:'Lowest costs for index investing', b:'Vanguard UK platform charges 0.15% annually on platform costs. The underlying fund OCFs are among the lowest in the market. FCA regulated. For passive index investing, no combination of platform and fund costs comes close to Vanguard.' },
      { r:4, t:'Excellent for passive investors, limited for active', b:'Vanguard is excellent if you want to invest in Vanguard index funds. The range is intentionally limited to their own products. FCA regulated, ultra-low costs. For investors who want external fund access, other platforms offer more choice.' },
    ]
  },
]

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'rephuby-cron-2025-secure') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  
  // Get existing company slugs
  const { data: existing } = await db.from('verivex_companies').select('slug')
  const existingSlugs = new Set((existing || []).map((r: any) => r.slug))
  
  // How many companies to add today (1-2 per day, increasing variety)
  const toAdd = COMPANY_PIPELINE.filter(c => !existingSlugs.has(c.slug)).slice(0, 2)
  
  if (toAdd.length === 0) {
    return NextResponse.json({ ok: true, message: 'All companies already added', total: existingSlugs.size })
  }

  const added: string[] = []
  const reviewsInserted: string[] = []

  for (const company of toAdd) {
    // Insert the company
    const { error: companyErr } = await db.from('verivex_companies').insert({
      slug: company.slug,
      name: company.name,
      category: company.category,
      regulation: company.regulation,
      description: company.description,
      tagline: company.tagline,
      website: company.website,
      founded: company.founded,
      headquarters: company.hq,
      logo_url: `https://www.google.com/s2/favicons?domain=${new URL(company.website).hostname}&sz=64`,
      logo_letter: company.name.charAt(0),
      logo_color: '#1a56db',
      is_featured: false,
      is_verified: true,
    })

    if (companyErr) {
      console.error('Company insert error:', company.slug, companyErr.message)
      continue
    }

    added.push(company.name)

    // Insert initial reviews for this company
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const REVIEWERS = [
      { n: 'James O.', l: 'London, UK', e: '3-5 years' },
      { n: 'Sarah M.', l: 'Sydney, Australia', e: '1-3 years' },
      { n: 'Marcus T.', l: 'Frankfurt, Germany', e: '5+ years' },
      { n: 'Emma R.', l: 'Amsterdam, Netherlands', e: '1-3 years' },
      { n: 'David K.', l: 'Toronto, Canada', e: '3-5 years' },
    ]

    const reviews = company.reviews.map((rev: any, i: number) => ({
      company_name: company.name,
      company_slug: company.slug,
      reviewer_name: REVIEWERS[(dayOfYear + i) % REVIEWERS.length].n,
      reviewer_location: REVIEWERS[(dayOfYear + i) % REVIEWERS.length].l,
      rating: rev.r,
      title: rev.t,
      review_text: rev.b,
      trading_experience: REVIEWERS[(dayOfYear + i) % REVIEWERS.length].e,
      verified: rev.r >= 4,
      status: 'approved',
      is_pinned: false,
      created_at: new Date(Date.now() - (i * 86400000)).toISOString(),
    }))

    const { error: reviewErr } = await db.from('verivex_reviews').insert(reviews)
    if (!reviewErr) reviewsInserted.push(company.name)
  }

  return NextResponse.json({
    ok: true,
    added,
    reviewsInserted,
    totalNow: (existing?.length || 0) + added.length,
    remaining: COMPANY_PIPELINE.filter(c => !existingSlugs.has(c.slug) && !added.includes(c.name)).length,
  })
}
