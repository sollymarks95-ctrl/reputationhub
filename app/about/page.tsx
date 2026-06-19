import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SITE_ABOUT: Record<string, {
  name: string; domain: string; tagline: string; mission: string;
  coverage: string[]; editorial: string; founded: string; category: string
}> = {
  'global-trade-wire':     { name:'Nex-Wire', domain:'nex-wire.com', tagline:'Global Trade Intelligence', mission:'Nex-Wire delivers real-time global trade intelligence, covering supply chain disruptions, tariff developments, commodity flows, and macroeconomic shifts affecting international commerce. Our analysis is designed for executives, traders, and policy professionals who need actionable intelligence, not noise.', coverage:['US-China trade policy','OPEC and energy markets','Supply chain intelligence','Currency and FX movements','Emerging market trade flows'], editorial:'Every article on Nex-Wire is fact-checked against named institutional sources. We do not publish speculation without labelling it as such. Our editorial standard is: every fact needs a source, every claim needs evidence.', founded:'2025', category:'Global Trade & Financial Markets' },
  'finance-terminal':      { name:'Finvexx', domain:'finvexx.com', tagline:'Financial Markets Intelligence', mission:'Finvexx covers financial markets, investment strategy, and economic analysis for professional investors and market participants. We track central bank policy, equity markets, fixed income, and macro trends across global economies.', coverage:['Federal Reserve and central bank policy','Equity market analysis','Bond and credit markets','Economic data and indicators','Institutional investment flows'], editorial:'Finvexx cites primary sources — central bank communications, SEC filings, official economic releases. We do not fabricate quotes or statistics.', founded:'2025', category:'Financial Markets' },
  'business-pulse':        { name:'Bizplezx', domain:'bizplezx.com', tagline:'Business & Executive Intelligence', mission:'Bizplezx publishes business strategy analysis, executive leadership coverage, and market intelligence for C-suite decision-makers. We focus on actionable intelligence for business leaders across all sectors.', coverage:['Corporate strategy and M&A','Executive leadership and governance','Sector and industry analysis','ESG and sustainability','Private equity and venture capital'], editorial:'All company data cited in Bizplezx articles comes from public filings, press releases, or named executive statements. We do not fabricate company performance figures.', founded:'2025', category:'Business Strategy' },
  'gold-markets-today':    { name:'AurexHQ', domain:'aurexhq.com', tagline:'Gold & Commodities Markets', mission:'AurexHQ provides gold, silver, and commodities market analysis for investors, traders, and commodity professionals. We track spot prices, futures markets, supply/demand fundamentals, and macroeconomic drivers of precious metal prices.', coverage:['Gold and silver spot markets','Commodities futures analysis','Mining sector coverage','Central bank gold reserves','Inflation and commodity correlations'], editorial:'Price data cited in AurexHQ articles comes from official market sources (COMEX, LME, LBMA). We update price references within 24 hours of publication.', founded:'2025', category:'Commodities & Precious Metals' },
  'trust-score':           { name:'Verivex', domain:'verivex.co', tagline:'Financial Trust & Reputation Intelligence', mission:'Verivex publishes independent analysis of financial institutions, brokers, and investment platforms. We help investors identify credible financial providers and understand reputation risk in the financial services sector.', coverage:['Broker reputation analysis','Regulatory compliance coverage','Investor protection intelligence','Financial fraud and scam alerts','Institutional credibility ratings'], editorial:'Verivex does not accept payment for positive coverage. Our analysis is based on public regulatory records, customer data, and named institutional sources.', founded:'2025', category:'Financial Trust & Ratings' },
  'invest-data':           { name:'InvexHuby', domain:'invexhuby.com', tagline:'Investment Research & Data Intelligence', mission:'InvexHuby provides investment research, portfolio strategy analysis, and market data intelligence for individual and institutional investors. We cover alternative investments, ETFs, private markets, and global allocation strategies.', coverage:['ETF and fund analysis','Private equity and credit','Alternative investment intelligence','Portfolio strategy and allocation','Global market data'], editorial:'Investment data cited in InvexHuby articles references official sources (SEC, financial exchanges, fund prospectuses). Past performance data is always labelled with appropriate caveats.', founded:'2025', category:'Investment Research' },
  'market-radar':          { name:'Signalixx', domain:'signalixx.com', tagline:'Trading Signals & Technical Analysis', mission:'Signalixx publishes technical analysis, trading intelligence, and market signal coverage for active traders across equities, forex, commodities, and crypto markets. We focus on actionable market intelligence backed by technical and quantitative analysis.', coverage:['Technical chart analysis','Trading signal coverage','Market microstructure intelligence','Options and derivatives analysis','Algorithmic trading developments'], editorial:'Signalixx clearly labels analysis as opinion and not as financial advice. Technical levels cited are based on publicly available market data.', founded:'2025', category:'Trading & Technical Analysis' },
  'executive-network':     { name:'ExecVex', domain:'execvex.com', tagline:'C-Suite Intelligence & Executive Strategy', mission:'ExecVex covers executive leadership, boardroom strategy, and senior management intelligence for business leaders worldwide. We track CEO transitions, board decisions, executive compensation, and corporate governance trends.', coverage:['CEO and C-suite moves','Board governance and composition','Executive compensation analysis','Leadership strategy','Corporate culture intelligence'], editorial:'All executive moves and quotes cited in ExecVex articles are sourced from official company announcements, SEC filings, or named press releases. We do not fabricate executive statements.', founded:'2025', category:'Executive Leadership' },
  'crypto-hub':            { name:'CryptoXos', domain:'cryptoxos.com', tagline:'Cryptocurrency & Blockchain Intelligence', mission:'CryptoXos provides cryptocurrency market analysis, blockchain technology coverage, and DeFi intelligence for crypto investors, developers, and policy professionals. We cover Bitcoin, Ethereum, altcoins, and the regulatory landscape shaping digital assets.', coverage:['Bitcoin and Ethereum market analysis','DeFi protocol coverage','NFT and Web3 developments','Crypto regulatory intelligence','Blockchain technology adoption'], editorial:'Cryptocurrency prices cited in CryptoXos articles reference major exchange data. We do not provide financial advice and clearly label all market analysis as opinion.', founded:'2025', category:'Cryptocurrency & Blockchain' },
  'fx-vexx':               { name:'FXVexx', domain:'fxvexx.com', tagline:'Forex & Currency Markets Intelligence', mission:'FXVexx covers foreign exchange markets, currency analysis, and FX trading intelligence for currency traders, treasury professionals, and international investors. We track major, minor, and exotic currency pairs with institutional-grade analysis.', coverage:['Major currency pair analysis','Central bank FX policy','Emerging market currencies','FX derivatives and hedging','Currency correlation intelligence'], editorial:'FX rate data cited in FXVexx articles references official market sources. Articles clearly label all trading analysis as educational content, not financial advice.', founded:'2025', category:'Foreign Exchange Markets' },
  'trade-hub-iq':          { name:'TradeHubIQ', domain:'tradehubiq.com', tagline:'Trade Finance & Global Commerce Intelligence', mission:'TradeHubIQ covers trade finance, import-export intelligence, and global commerce developments for traders, exporters, importers, and trade finance professionals. We focus on practical intelligence for participants in international trade.', coverage:['Trade finance instruments (LC, SBLC, BG)','Export credit agency coverage','Supply chain finance','Trade compliance and sanctions','Customs and logistics intelligence'], editorial:'TradeHubIQ cites official sources for trade data — WTO, ITC, national customs agencies. Regulatory information is reviewed for accuracy at publication.', founded:'2025', category:'Trade Finance & Commerce' },
  'aliya-today':           { name:'AliyaToday', domain:'aliyatoday.com', tagline:'Practical Aliyah Guides for English-Speaking Jews', mission:'AliyaToday publishes practical, step-by-step guides for English-speaking Jews making aliyah to Israel. We cover real costs, bureaucratic processes, health fund choices, tax planning, property, and daily life — everything the official sources do not explain clearly. Our goal is to be the guide you wish you had before you landed.', coverage:['Aliyah costs and Sal Klita (absorption basket) amounts','Kupat Holim (health fund) comparison and registration','Tax planning and the 10-year exemption for olim','Property buying and the Mashkanta L\'Oleh mortgage','Ulpan, driving licence conversion, Teudat Zehut process'], editorial:'AliyaToday verifies all government benefit amounts, tax rates, and process steps against official sources (Misrad HaKlita, Bituach Leumi, Israel Tax Authority) before publication. Where official figures are unavailable, we say so explicitly rather than estimate.', founded:'2025', category:'Aliyah & Israeli Life' },
  'jewish-news-now':       { name:'JewishNewsNow', domain:'jewishnewsnow.com', tagline:'Breaking Jewish World News — Factual, Pro-Israel', mission:'JewishNewsNow covers breaking news and analysis for the global Jewish community and those who follow Israel and Jewish affairs. We report on Israeli politics and society, antisemitism worldwide, Israel-diaspora relations, Jewish culture, and the issues affecting Jewish communities from New York to Melbourne. Our journalism is factual, pro-Israel, and sourced to named publications and officials.', coverage:['Israel security and politics','Antisemitism and Jewish safety worldwide','Israel-diaspora relations','Jewish community news from the US, UK, France, and Australia','Israeli culture, history, and society'], editorial:'JewishNewsNow sources every factual claim to a named publication (JTA, Times of Israel, Jerusalem Post) or official statement. We do not publish unverified casualty figures, invented quotes, or anonymous sources. Corrections are published prominently.', founded:'2025', category:'Jewish World News' },
  'jewish-property-report':{ name:'JewishPropertyReport', domain:'jewishpropertyreport.com', tagline:'Israeli Real Estate for Diaspora Jewish Buyers', mission:'JewishPropertyReport covers the Israeli property market for English-speaking diaspora Jewish buyers and investors. We publish real price data, buyer guides, city spotlights, and practical legal and tax information for foreigners purchasing property in Israel. Our analysis draws on current Madlan.co.il and Yad2.co.il listing data, Bank of Israel statistics, and direct property professional expertise.', coverage:['Tel Aviv, Jerusalem, and major city property prices','Purchase tax and legal process for foreign buyers','Oleh mortgage (Mashkanta L\'Oleh) guide','Neighbourhood spotlights and investment analysis','Israeli property market trends and Bank of Israel data'], editorial:'All property prices published by JewishPropertyReport are sourced from current Madlan.co.il or Yad2.co.il listings or official Bank of Israel data. Where live data is unavailable, we direct readers to check directly rather than publish estimates.', founded:'2025', category:'Israeli Real Estate' },
}

const ABOUT_ICON_MAP: Record<string,string> = {
  'global-trade-wire':'/icon-nexwire.svg','finance-terminal':'/icon-finvexx.svg',
  'trust-score':'/icon-verivex.svg','gold-markets-today':'/icon-aurexhq.svg',
  'invest-data':'/icon-invexhuby.svg','business-pulse':'/icon-bizplezx.svg',
  'market-radar':'/icon-signalixx.svg','executive-network':'/icon-execvex.svg',
  'crypto-hub':'/icon-cryptoxos.svg','fx-vexx':'/icon-fxvexx.svg',
  'trade-hub-iq':'/icon-tradehubiq.svg','aliya-today':'/icon-aliya-today.svg',
  'jewish-news-now':'/icon-jewish-news-now.svg','jewish-property-report':'/icon-jewish-property-report.svg',
  'copy-trade-iq':'/icon-copyvexx.svg','expat-invest-iq':'/icon-expatinvestiq.svg',
}

export async function generateMetadata() {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(':3000','').replace('www.','')
  const siteEntry = Object.entries(SITE_ABOUT).find(([,s]) => s.domain.replace('www.','') === host)
  const site = siteEntry?.[1] || SITE_ABOUT['global-trade-wire']
  const slug = siteEntry?.[0] || 'global-trade-wire'
  return {
    title: `About ${site.name} — ${site.tagline}`,
    description: site.mission.slice(0, 155),
    icons: { icon: ABOUT_ICON_MAP[slug] || '/icon-rephuby.svg' },
    openGraph: { title: `About ${site.name}`, description: site.mission.slice(0,155), type: 'website' }
  }
}

export default async function AboutPage() {
  const headersList = await headers()
  const host = (headersList.get('host') || '').replace(':3000','').replace('www.','')
  const siteSlug = headersList.get('x-site-slug') || 'global-trade-wire'
  const site = SITE_ABOUT[siteSlug] || SITE_ABOUT['global-trade-wire']
  const base = `https://${site.domain}`

  // Article count
  const { count } = await db.from('news_articles')
    .select('*', { count:'exact', head:true })
    .eq('status','published')
    .eq('news_site_id',
      (await db.from('news_sites').select('id').eq('slug', siteSlug).single()).data?.id || ''
    )

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: site.name,
    url: base,
    description: site.mission,
    foundingDate: site.founded,
    masthead: `${base}/about`,
    publishingPrinciples: `${base}/about#editorial`,
    founder: { '@type':'Person', name:'Solly Marks', url:'https://rephuby.com/author/solly-marks' },
    editor: { '@type':'Person', name:'Solly Marks', url:`${base}/author/solly-marks` },
    contactPoint: { '@type':'ContactPoint', contactType:'editorial', email:`contact@${site.domain}` },
    sameAs: ['https://rephuby.com', 'https://www.linkedin.com/in/solly-marks'],
  }

  const p = '#1a56db', text = '#111827', sub = '#6b7280', bg = '#f3f4f6', card = '#ffffff'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <div style={{ background:bg, minHeight:'100vh', fontFamily:'system-ui,-apple-system,sans-serif' }}>
        <div style={{ background:p, padding:'16px 0' }}>
          <div style={{ maxWidth:900, margin:'0 auto', padding:'0 20px' }}>
            <Link href="/" style={{ color:'#fff', textDecoration:'none', fontSize:14, opacity:0.8 }}>← {site.name}</Link>
          </div>
        </div>

        {/* HERO */}
        <div style={{ background:card, borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ maxWidth:900, margin:'0 auto', padding:'48px 20px 40px' }}>
            <div style={{ fontSize:12, color:p, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{site.category}</div>
            <h1 style={{ margin:'0 0 12px', fontSize:32, fontWeight:900, color:text }}>About {site.name}</h1>
            <p style={{ margin:'0 0 24px', fontSize:18, color:sub, fontWeight:500 }}>{site.tagline}</p>
            <p style={{ margin:'0 0 24px', fontSize:16, color:text, lineHeight:1.75, maxWidth:700 }}>{site.mission}</p>
            <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
              <div style={{ textAlign:'center', background:bg, borderRadius:12, padding:'16px 24px' }}>
                <div style={{ fontSize:28, fontWeight:800, color:p }}>{(count||0).toLocaleString()}</div>
                <div style={{ fontSize:12, color:sub }}>Articles Published</div>
              </div>
              <div style={{ textAlign:'center', background:bg, borderRadius:12, padding:'16px 24px' }}>
                <div style={{ fontSize:28, fontWeight:800, color:p }}>2025</div>
                <div style={{ fontSize:12, color:sub }}>Founded</div>
              </div>
              <div style={{ textAlign:'center', background:bg, borderRadius:12, padding:'16px 24px' }}>
                <div style={{ fontSize:28, fontWeight:800, color:p }}>Daily</div>
                <div style={{ fontSize:12, color:sub }}>Publishing Frequency</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 20px' }}>
          <div style={{ display:'grid', gap:24, gridTemplateColumns:'repeat(auto-fit, minmax(340px, 1fr))' }}>

            {/* COVERAGE */}
            <div style={{ background:card, borderRadius:16, padding:'28px 28px', border:'1px solid #e5e7eb' }}>
              <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700, color:text }}>What We Cover</h2>
              <ul style={{ margin:0, padding:0, listStyle:'none' }}>
                {site.coverage.map((c,i) => (
                  <li key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:sub, lineHeight:1.5 }}>
                    <span style={{ color:p, fontWeight:700, flexShrink:0 }}>→</span> {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* EDITORIAL */}
            <div id="editorial" style={{ background:card, borderRadius:16, padding:'28px 28px', border:'1px solid #e5e7eb' }}>
              <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700, color:text }}>Editorial Standards</h2>
              <p style={{ margin:'0 0 16px', fontSize:14, color:sub, lineHeight:1.7 }}>{site.editorial}</p>
              <p style={{ margin:0, fontSize:14, color:sub, lineHeight:1.7 }}>
                Corrections and clarifications are published prominently.
                Contact our editorial team at <a href={`mailto:contact@${site.domain}`} style={{ color:p }}>contact@{site.domain}</a>
              </p>
            </div>

            {/* PUBLISHER */}
            <div style={{ background:card, borderRadius:16, padding:'28px 28px', border:'1px solid #e5e7eb' }}>
              <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700, color:text }}>Publisher</h2>
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:p, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16, flexShrink:0 }}>SM</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:text }}>Solly Marks</div>
                  <div style={{ fontSize:13, color:sub }}>Publisher & Media Buyer, Ashdod, Israel</div>
                </div>
              </div>
              <p style={{ margin:'0 0 12px', fontSize:13, color:sub, lineHeight:1.6 }}>
                Solly Marks is an Israeli entrepreneur and media publisher operating 14+ editorial portals across finance, trade intelligence, and Jewish community news. Based in Ashdod, Israel.
              </p>
              <a href="/author/solly-marks" style={{ color:p, fontSize:13, fontWeight:600, textDecoration:'none' }}>View full profile →</a>
            </div>

            {/* FEEDS */}
            <div style={{ background:card, borderRadius:16, padding:'28px 28px', border:'1px solid #e5e7eb' }}>
              <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700, color:text }}>Subscribe & Follow</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <a href="/feed.xml" style={{ display:'flex', gap:10, alignItems:'center', color:text, textDecoration:'none', fontSize:14, padding:'10px 14px', background:bg, borderRadius:8 }}>
                  <span style={{ fontSize:18 }}>🔔</span> <span>RSS Feed <span style={{ color:sub, fontSize:12 }}>— subscribe in any news reader</span></span>
                </a>
                <a href="/sitemap.xml" style={{ display:'flex', gap:10, alignItems:'center', color:text, textDecoration:'none', fontSize:14, padding:'10px 14px', background:bg, borderRadius:8 }}>
                  <span style={{ fontSize:18 }}>🗺️</span> <span>Sitemap <span style={{ color:sub, fontSize:12 }}>— all published articles</span></span>
                </a>
              </div>
            </div>

          </div>

          {/* LEGAL LINKS */}
          <div style={{ marginTop:32, display:'flex', gap:16, flexWrap:'wrap', fontSize:13, color:sub }}>
            <Link href="/legal/privacy" style={{ color:sub, textDecoration:'none' }}>Privacy Policy</Link>
            <Link href="/legal/terms" style={{ color:sub, textDecoration:'none' }}>Terms of Use</Link>
            <Link href="/legal/cookies" style={{ color:sub, textDecoration:'none' }}>Cookie Policy</Link>
            <a href={`mailto:contact@${site.domain}`} style={{ color:sub, textDecoration:'none' }}>Contact Editorial</a>
          </div>
        </div>
      </div>
    </>
  )
}
