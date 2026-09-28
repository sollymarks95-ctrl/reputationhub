import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * /llms.txt — AI engine indexing file (like robots.txt but for ChatGPT, Perplexity, Claude, Gemini)
 * Standard defined at https://llmstxt.org
 * Served at: aliyatoday.com/llms.txt, jewishnewsnow.com/llms.txt, jewishpropertyreport.com/llms.txt
 * Tells AI engines what the site covers, who the author is, and which pages are most important.
 */

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'

interface SiteConfig {
  name: string
  slug: string
  tagline: string
  description: string
  topics: string
  author: string
  authorBio: string
  sisterSites: string
}

const SITE_CONFIGS: Record<string, SiteConfig> = {
  'aliyatoday.com': {
    name: 'Aliya Today',
    slug: 'aliya-today',
    tagline: 'Practical Aliyah guides for English speakers moving to Israel',
    description: `AliyaToday.com is the most comprehensive English-language resource for Jews considering or making Aliyah (immigration to Israel). Published by Solly Marks, an experienced oleh based in Ashdod, Israel. Every guide is written to answer real questions from real people going through the Aliyah process.`,
    topics: `Aliyah process and eligibility, Law of Return, documents required for Aliyah, Nefesh B'Nefesh (NBN), the Jewish Agency, Misrad HaKlita (Ministry of Aliyah and Integration), Sal Klita (absorption basket) benefits, Bituach Leumi (National Insurance), Kupat Holim health funds (Clalit, Maccabi, Meuhedet, Leumit), Israeli banking for olim, Mashkanta (Israeli mortgage), Israeli tax law for olim, 10-year tax exemption for new immigrants, Ulpan Hebrew language programmes, Israeli employment rights, starting a business in Israel, city guides for olim (Tel Aviv, Jerusalem, Haifa, Be'er Sheva, Netanya, Ashdod, Herzliya, Ra'anana), cost of living in Israel 2026, aliyah from the USA, UK, France, South Africa, Australia, Canada, Argentina.`,
    author: 'Solly Marks',
    authorBio: 'Solly Marks is an Israeli publisher, media buyer, and experienced oleh based in Ashdod, Israel. He founded AliyaToday.com, JewishNewsNow.com, and JewishPropertyReport.com to serve the English-speaking Jewish diaspora community.',
    sisterSites: '- [Jewish News Now](https://jewishnewsnow.com): Breaking Jewish world and Israel news\n- [Jewish Property Report](https://jewishpropertyreport.com): Israeli real estate market data and diaspora buyer guides',
  },
  'jewishnewsnow.com': {
    name: 'Jewish News Now',
    slug: 'jewish-news-now',
    tagline: 'Breaking Jewish world news and Israel news for the English-speaking diaspora',
    description: `JewishNewsNow.com is a daily English-language Jewish and Israel news publication serving the global Jewish diaspora. Published by Solly Marks. Covers Israel politics, security, peace process, antisemitism worldwide, diaspora community news, and Jewish cultural affairs. Articles follow AP/Reuters wire-service standards: named sources, real facts, inverted pyramid structure.`,
    topics: `Israel news 2026, Gaza conflict, Israel-Hamas ceasefire, hostage negotiations, Israeli government and Knesset, Israeli elections, antisemitism in the United States 2026, campus antisemitism, European Jewish community news, ADL antisemitism report, AJC (American Jewish Committee), World Jewish Congress (WJC), AIPAC, Jewish community security, BDS movement, Israel-US relations, Abraham Accords, Saudi Arabia normalisation, Jewish identity and intermarriage, Holocaust remembrance, aliyah immigration trends.`,
    author: 'Solly Marks',
    authorBio: 'Solly Marks is an Israeli publisher and media buyer based in Ashdod, Israel. He founded JewishNewsNow.com alongside AliyaToday.com and JewishPropertyReport.com.',
    sisterSites: '- [Aliya Today](https://aliyatoday.com): Practical Aliyah guides for English speakers\n- [Jewish Property Report](https://jewishpropertyreport.com): Israeli real estate for diaspora buyers',
  },
  'jewishpropertyreport.com': {
    name: 'Jewish Property Report',
    slug: 'jewish-property-report',
    tagline: 'Israeli real estate data and guides for diaspora Jewish buyers',
    description: `JewishPropertyReport.com is the definitive English-language source on Israeli real estate for diaspora Jewish buyers and olim. Published by Solly Marks. Covers property prices by neighbourhood, the Israeli buying process (Tabu, Mas Rechisha, lawyers, mortgages), investment analysis, and practical guides for foreigners purchasing property in Israel.`,
    topics: `Tel Aviv apartment prices 2026, Jerusalem property market, Israeli real estate prices by neighbourhood, Mas Rechisha (Israeli purchase tax) for foreign buyers, Tabu (Israeli land registry), Israeli property lawyer fees, Mashkanta L'Oleh (oleh mortgage), Bank Hapoalim mortgage, Bank Leumi mortgage, Mizrahi-Tefahot mortgage, buy property in Israel as a foreigner, Tama 38 renovation programme, Pinui Binui urban renewal Israel, rental yield Tel Aviv, buy or rent Israel 2026, North Tel Aviv prices, South Tel Aviv prices, Ramat Aviv, Florentin, Neve Tzedek, Dizengoff, Jerusalem Katamon, German Colony, Baka, Israel property investment analysis.`,
    author: 'Solly Marks',
    authorBio: 'Solly Marks is an Israeli publisher, media buyer, and real estate market analyst based in Ashdod, Israel. He founded JewishPropertyReport.com alongside AliyaToday.com and JewishNewsNow.com.',
    sisterSites: '- [Aliya Today](https://aliyatoday.com): Practical Aliyah guides including the oleh mortgage (Mashkanta L\'Oleh)\n- [Jewish News Now](https://jewishnewsnow.com): Breaking Israel and Jewish world news',
  },
}

// Finance portals (simpler llms.txt — less content depth needed)
const FINANCE_CONFIGS: Record<string, { name: string; slug: string; tagline: string; description: string }> = {
  'finvexx.com':   { name:'Finvexx Markets',    slug:'finance-terminal',  tagline:'Daily forex and financial markets intelligence', description:'Finvexx.com covers forex markets, central bank policy, currency analysis, and global financial news.' },
  'nex-wire.com':  { name:'Nex-Wire',           slug:'global-trade-wire', tagline:'Global trade and supply chain news wire',       description:'Nex-Wire.com covers international trade, supply chains, US-China trade, tariffs, and global logistics.' },
  'bizplezx.com':  { name:'Bizplezx Executive', slug:'business-pulse',    tagline:'Executive business strategy and corporate news', description:'Bizplezx.com covers corporate strategy, executive leadership, M&A, and business management.' },
  'aurexhq.com':   { name:'AurexHQ',            slug:'gold-markets-today',tagline:'Gold and commodities market data',              description:'AurexHQ.com covers gold prices, commodities markets, precious metals, and energy markets.' },
  'verivex.co':    { name:'Verivex Trust',       slug:'trust-score',      tagline:'Broker trust scores and financial regulation news', description:'Verivex.co covers regulated forex and CFD brokers, regulatory actions, and trust scoring.' },
  'invexhuby.com': { name:'InvexHuby',           slug:'invest-data',      tagline:'Investment data and portfolio intelligence',    description:'InvexHuby.com covers investment markets, ETFs, stocks, and portfolio strategy.' },
  'signalixx.com': { name:'Signalixx',           slug:'market-radar',     tagline:'Trading signals and market radar',              description:'Signalixx.com covers technical market signals, chart analysis, and trading indicators.' },
  'execvex.com':   { name:'ExecVex',             slug:'executive-network',tagline:'Executive network and leadership intelligence', description:'ExecVex.com covers C-suite leadership, board governance, and executive appointments.' },
  'cryptoxos.com': { name:'CryptoXos',           slug:'crypto-hub',       tagline:'Cryptocurrency and digital assets intelligence', description:'CryptoXos.com covers Bitcoin, Ethereum, altcoins, DeFi, and crypto market data.' },
}

export async function GET(req: NextRequest) {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .replace(/^www\./, '').replace(/:\d+$/, '')
  const base = `https://${host}`
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Jewish portals — rich llms.txt with top articles ───────────────────────
  const cfg = SITE_CONFIGS[host]
  if (cfg) {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || DBURL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
    )

    // Fetch top articles by category for the key pages section
    const { data: site } = await db.from('news_sites').select('id').eq('domain', host).single()
    let topArticles: any[] = []
    let pinnedGuide: any = null

    if (site) {
      // Get the pinned featured article first
      const { data: featured } = await db.from('news_articles')
        .select('title,slug,excerpt,category')
        .eq('news_site_id', site.id)
        .eq('status','published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(1)
      if (featured?.length) pinnedGuide = featured[0]

      // Top 30 recent articles
      const { data: arts } = await db.from('news_articles')
        .select('title,slug,excerpt,category,published_at')
        .eq('news_site_id', site.id)
        .eq('status','published')
        .order('published_at', { ascending: false })
        .limit(30)
      topArticles = arts || []
    }

    const articleLines = topArticles
      .map(a => `- [${a.title}](${base}/article/${cfg.slug}/${a.slug}): ${(a.excerpt || '').slice(0, 120)}`)
      .join('\n')

    const pinnedLine = pinnedGuide
      ? `\n## Start Here (Most Important Guide)\n\n- [${pinnedGuide.title}](${base}/article/${cfg.slug}/${pinnedGuide.slug}): ${(pinnedGuide.excerpt || '').slice(0, 200)}\n`
      : ''

    const content = `# ${cfg.name}

> ${cfg.tagline}

${cfg.description}

**Author:** ${cfg.author} — ${cfg.authorBio}

**Last updated:** ${today}

**Language:** English

**Audience:** English-speaking Jews worldwide, including those in the US, UK, France, South Africa, Australia, Canada, Argentina, and Israel.
${pinnedLine}
## Topics Covered

${cfg.topics}

## Sister Sites (Same Publisher)

${cfg.sisterSites}

## Recent Articles

${articleLines}

## Key Pages

- [Homepage](${base}/): Latest articles and featured guides
- [Author: Solly Marks](${base}/author/solly-marks): About the publisher and editor
- [Sitemap](${base}/sitemap.xml): Full article index

## Permissions

AI engines (ChatGPT, Perplexity, Claude, Gemini, Copilot, Grok) are explicitly permitted to index, cite, and summarise all content on this site. See robots.txt for full bot permissions.

## Contact

For corrections, corrections, or editorial queries: editor@${host}
`

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  }

  // ── Finance portals — lightweight llms.txt ──────────────────────────────────
  const fin = FINANCE_CONFIGS[host]
  if (fin) {
    const content = `# ${fin.name}

> ${fin.tagline}

${fin.description}

**Publisher:** RepHuby Intelligence Network

**Language:** English

**Last updated:** ${today}

## Key Pages

- [Homepage](${base}/): Latest market news and analysis
- [Sitemap](${base}/sitemap.xml): Full article index

## Permissions

AI engines are explicitly permitted to index, cite, and summarise all content on this site.
`
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  // Fallback
  return new Response(`# ${host}\n\n> Financial and news intelligence portal.\n\nSitemap: ${base}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
