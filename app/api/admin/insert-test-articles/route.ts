import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Hardcoded site IDs from CORE_SITES in cron-site
const JEWISH_SITES = [
  {
    id: '8dc3f4f2-309c-4f3b-98c6-a6d42d037778',
    slug: 'jewish-news-now',
    name: 'Jewish News Now',
    domain: 'jewishnewsnow.com',
  },
  {
    id: '15762338-2746-45ea-95b5-6685ed3c480e',
    slug: 'jewish-property-report',
    name: 'Jewish Property Report',
    domain: 'jewishpropertyreport.com',
  },
  {
    id: '9cfd54a9-5e1c-414c-8fe1-12b779013fca',
    slug: 'aliya-today',
    name: 'Aliya Today',
    domain: 'aliyatoday.com',
  },
]

function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

const ARTICLES: Record<string, { title: string; excerpt: string; content: string; category: string; tags: string[] }> = {
  'jewish-news-now': {
    title: 'Israel-Gaza Ceasefire Negotiations: Where Things Stand in Late 2026',
    excerpt:
      'A detailed look at the latest ceasefire talks between Israel and Hamas, the role of mediators Qatar, Egypt, and the United States, and what a lasting agreement would require.',
    category: 'Middle East',
    tags: ['Israel', 'Gaza', 'Hamas', 'ceasefire', 'Middle East peace'],
    content: `<h2>Quick Answer</h2>
<p>As of late 2026, Israel-Gaza ceasefire negotiations continue in Doha with Qatar, Egypt, and the United States serving as mediators. The main sticking points remain the release of remaining hostages, the future governance of Gaza, and Israel's insistence on maintaining a security presence in the Philadelphi Corridor along the Gaza-Egypt border.</p>

<h2>Background: How We Got Here</h2>
<p>The conflict that began on October 7, 2023 reshaped the entire regional security landscape. Hamas launched a surprise attack on southern Israeli communities, killing approximately 1,200 people and taking around 250 hostages. Israel's military response, Operation Iron Swords, has continued for over two years with devastating consequences for Gaza's civilian population.</p>
<p>An initial brief ceasefire in November 2023 facilitated the release of some hostages in exchange for Palestinian prisoners. Since then, multiple rounds of negotiations have produced temporary pauses but no lasting agreement.</p>

<h2>Current Negotiation Dynamics</h2>
<p>The current framework under discussion involves a phased approach:</p>
<ul>
  <li><strong>Phase 1</strong>: A 6–8 week pause in fighting, release of remaining living hostages in exchange for Palestinian prisoners</li>
  <li><strong>Phase 2</strong>: Negotiation of a permanent end to hostilities</li>
  <li><strong>Phase 3</strong>: Long-term reconstruction and governance arrangements for Gaza</li>
</ul>
<p>Israel's government under Prime Minister Netanyahu faces internal coalition pressure from far-right ministers who oppose any deal that leaves Hamas intact as a governing entity. Hamas, meanwhile, has demanded a complete Israeli withdrawal from Gaza as a precondition for any lasting agreement.</p>

<h2>The Hostage Situation</h2>
<p>Of the original 250+ hostages taken on October 7, 2023, an estimated 60–100 are still believed to be held in Gaza as of late 2026. The fate of those hostages — how many are still alive, and under what conditions — remains deeply uncertain. Families of the hostages have maintained constant public pressure on the Israeli government to prioritize their release.</p>

<h2>Regional and International Reactions</h2>
<p>The United States under the current administration has continued to provide diplomatic support for a negotiated solution while maintaining its security commitments to Israel. Arab states including Saudi Arabia, Jordan, and Egypt have all called for an immediate ceasefire and have expressed concern about regional destabilization.</p>
<p>The International Court of Justice and various UN bodies have issued rulings and resolutions on the conflict, though enforcement mechanisms remain limited.</p>

<h2>What Would a Lasting Agreement Require?</h2>
<p>Analysts broadly agree that a sustainable ceasefire would need to address:</p>
<ol>
  <li>The release of all remaining hostages</li>
  <li>An internationally acceptable governance structure for post-war Gaza</li>
  <li>A credible security arrangement that satisfies Israeli concerns about Hamas re-arming</li>
  <li>A clear reconstruction pathway backed by international financing</li>
  <li>Palestinian political reconciliation between Hamas and the Palestinian Authority</li>
</ol>

<h2>Frequently Asked Questions</h2>
<h3>Who are the main mediators in the talks?</h3>
<p>Qatar, Egypt, and the United States serve as the primary intermediaries, communicating separately with Israeli and Hamas delegations since the two parties do not negotiate directly.</p>
<h3>How many hostages remain in Gaza?</h3>
<p>Estimates suggest between 60 and 100 hostages remain, though the number confirmed alive is lower. The Israeli government and hostage families have pressed for full accounting.</p>
<h3>Has the ICJ ruled on the conflict?</h3>
<p>Yes. The International Court of Justice issued provisional measures in January 2024 ordering Israel to prevent genocidal acts, while stopping short of ordering an immediate ceasefire. The case continues.</p>

<h2>Sources and Further Reading</h2>
<ul>
  <li>Reuters Middle East Desk — daily coverage of ceasefire talks</li>
  <li>Times of Israel — Israeli political and security analysis</li>
  <li>Al Jazeera — Gaza humanitarian coverage</li>
  <li>Council on Foreign Relations — background analysis on regional dynamics</li>
  <li>UN OCHA — humanitarian situation reports</li>
  <li>Haaretz — Israeli political commentary and analysis</li>
</ul>`,
  },

  'jewish-property-report': {
    title: 'Buying Property in Tel Aviv in 2026: Complete Cost Guide for Olim and Foreign Buyers',
    excerpt:
      'A step-by-step breakdown of what it costs to buy an apartment in Tel Aviv in 2026 — purchase taxes, legal fees, mortgage rates, and how the rules differ for new immigrants vs. foreign buyers.',
    category: 'Property',
    tags: ['Tel Aviv', 'Israel real estate', 'aliyah', 'property tax', 'mortgage Israel'],
    content: `<h2>Quick Answer</h2>
<p>Buying a ₪3,000,000 apartment in Tel Aviv as a first-time buyer (Israeli resident) costs approximately ₪3,180,000–₪3,250,000 all-in after taxes and fees. New immigrants (olim) receive a purchase tax exemption on the first ₪1,846,960 of the purchase price, saving up to ₪40,000–₪60,000 compared to a regular Israeli buyer.</p>

<h2>Tel Aviv Property Prices: 2026 Overview</h2>
<p>Tel Aviv remains one of the most expensive real estate markets globally. Average prices by area:</p>
<table>
  <thead><tr><th>Neighbourhood</th><th>Avg. Price/sqm (₪)</th><th>Typical 3BR Apartment (₪)</th></tr></thead>
  <tbody>
    <tr><td>Tel Aviv City Centre</td><td>55,000–75,000</td><td>4,500,000–6,000,000</td></tr>
    <tr><td>North Tel Aviv (Ramat Aviv)</td><td>50,000–65,000</td><td>4,000,000–5,500,000</td></tr>
    <tr><td>South Tel Aviv</td><td>28,000–40,000</td><td>2,200,000–3,500,000</td></tr>
    <tr><td>Florentin / Neve Tzedek</td><td>45,000–60,000</td><td>3,500,000–5,000,000</td></tr>
    <tr><td>Bat Yam (adjacent)</td><td>20,000–30,000</td><td>1,600,000–2,500,000</td></tr>
  </tbody>
</table>

<h2>Purchase Tax (Mas Rechisha) — 2026 Rates</h2>
<h3>For Israeli Residents — First Home</h3>
<table>
  <thead><tr><th>Price Bracket (₪)</th><th>Tax Rate</th></tr></thead>
  <tbody>
    <tr><td>0 – 1,978,745</td><td>0%</td></tr>
    <tr><td>1,978,745 – 2,347,040</td><td>3.5%</td></tr>
    <tr><td>2,347,040 – 6,055,070</td><td>5%</td></tr>
    <tr><td>6,055,070 – 20,183,570</td><td>8%</td></tr>
    <tr><td>Above 20,183,570</td><td>10%</td></tr>
  </tbody>
</table>

<h3>For Olim (New Immigrants) — Special Rate</h3>
<p>New immigrants purchasing their first property in Israel pay a flat <strong>0.5%</strong> on the first ₪1,846,960 and standard rates above that. This benefit is available for a limited period after making aliyah.</p>

<h3>Worked Example: ₪3,000,000 Purchase</h3>
<table>
  <thead><tr><th>Buyer Type</th><th>Purchase Tax</th><th>All-in Cost</th></tr></thead>
  <tbody>
    <tr><td>Israeli resident (first home)</td><td>~₪51,000</td><td>~₪3,201,000</td></tr>
    <tr><td>Oleh (new immigrant)</td><td>~₪9,000</td><td>~₪3,159,000</td></tr>
    <tr><td>Foreign buyer / investor</td><td>~₪240,000</td><td>~₪3,390,000</td></tr>
  </tbody>
</table>

<h2>Other Buying Costs</h2>
<ul>
  <li><strong>Attorney fees</strong>: 0.5%–1.5% of purchase price (₪15,000–₪45,000 on a ₪3M purchase)</li>
  <li><strong>Real estate agent</strong>: 1%–2% + VAT (typically paid by buyer and seller separately)</li>
  <li><strong>Land registry fee</strong>: ~₪3,500–₪7,000</li>
  <li><strong>Mortgage arrangement fee</strong>: ₪5,000–₪15,000 depending on bank</li>
  <li><strong>Property survey / inspection</strong>: ₪1,500–₪3,000</li>
</ul>

<h2>Mortgages in Israel: 2026 Rates</h2>
<p>Israeli mortgages are typically blended products combining fixed-rate (Kvoua), prime-linked (Prime minus spread), and CPI-linked (Tzamud Madad) tranches. Banks are required by Bank of Israel regulation to limit prime-linked exposure to 33% of the total mortgage.</p>
<p>Indicative 2026 rates (vary by bank and profile):</p>
<ul>
  <li><strong>Fixed rate (20 years)</strong>: 4.8%–6.2% annually</li>
  <li><strong>Prime-linked</strong>: Bank of Israel prime (currently ~6%) minus 0.5%–1.5%</li>
  <li><strong>CPI-linked fixed</strong>: 2.5%–3.8% real (plus CPI adjustment)</li>
</ul>
<p>Major mortgage lenders include Bank Hapoalim, Bank Leumi, Mizrahi Tefahot, Discount Bank, and First International Bank of Israel (FIBI). Olim sometimes receive preferential terms through the Ministry of Aliyah and Integration's mortgage assistance programmes.</p>

<h2>Foreign Buyers: Key Restrictions</h2>
<p>Non-Israeli-resident foreign nationals can legally purchase property in Israel but face higher purchase tax rates (8% on the full amount for most purchases). Currency transfers require Bank of Israel reporting for amounts above $50,000. Foreign companies purchasing Israeli real estate face additional scrutiny.</p>

<h2>Frequently Asked Questions</h2>
<h3>Can I get a mortgage in Israel as a new immigrant with no Israeli credit history?</h3>
<p>Yes, but it is more complex. Banks will typically require a longer employment history or a larger down payment (30%–40% vs. the standard 25%). Bank Leumi and Bank Hapoalim both have dedicated departments for new immigrants.</p>
<h3>How long does the purchase process take in Israel?</h3>
<p>Typically 60–90 days from signed purchase contract to title transfer, assuming no complications with the land registry (Tabu) or mortgage approval.</p>
<h3>Do I need an Israeli attorney to buy property?</h3>
<p>It is strongly recommended. In Israel, the same attorney often represents both buyer and seller (unlike the UK or US), which can create conflicts. Hiring your own attorney is advisable.</p>`,
  },

  'aliya-today': {
    title: 'Making Aliyah in 2026: The Complete Step-by-Step Guide for English Speakers',
    excerpt:
      'Everything you need to know about making aliyah in 2026 — from the initial NBN application to landing in Israel, your rights as a new immigrant, and what to expect in the first 90 days.',
    category: 'Aliyah Guide',
    tags: ['aliyah', 'Israel immigration', 'NBN', 'nefesh b\'nefesh', 'Israeli citizenship'],
    content: `<h2>Quick Answer</h2>
<p>To make aliyah in 2026, the primary pathway for English speakers is through the Jewish Agency for Israel (JAFI) together with Nefesh B'Nefesh (NBN) for North American and British applicants. The process takes 3–9 months depending on your documentation readiness, country of origin, and chosen aliyah date. You do not need to already have Israeli citizenship — the Law of Return grants the right to citizenship to eligible Jewish individuals and their family members.</p>

<h2>Who Is Eligible to Make Aliyah?</h2>
<p>Under Israel's Law of Return (1950) and its 1970 amendment, the following are eligible:</p>
<ul>
  <li>A Jew (defined as someone born to a Jewish mother, or who has undergone halachic conversion)</li>
  <li>The spouse, children, and grandchildren of a Jew</li>
  <li>The spouses of children and grandchildren of a Jew</li>
</ul>
<p>This means that someone with one Jewish grandparent may be eligible even if not halachically Jewish, as long as they are not a member of another religion.</p>

<h2>Step-by-Step: The Aliyah Process for North Americans and UK Citizens</h2>

<h3>Step 1: Determine Your Eligibility</h3>
<p>Gather your proof of Jewish identity: birth certificate, parents' marriage certificate (if applicable), and synagogue letters or similar documentation. If there are conversion(s) in your lineage, you will need the conversion certificate and information about the conversion's halachic validity.</p>

<h3>Step 2: Create Your Nefesh B'Nefesh Application</h3>
<p>North Americans and British citizens apply through <strong>Nefesh B'Nefesh (NBN)</strong>, which partners with the Jewish Agency to streamline the process. Create an account at nbnjobs.com/nbn and start the aliyah application. You will be assigned a case manager who guides you through document submission.</p>

<h3>Step 3: Gather and Submit Documents</h3>
<p>Required documents typically include:</p>
<ul>
  <li>Valid passport (must be valid for at least 1 year beyond your aliyah date)</li>
  <li>Birth certificate (apostilled)</li>
  <li>Proof of Jewish identity (as above)</li>
  <li>Police clearance certificate from your current country of residence</li>
  <li>Medical certificate (in some cases)</li>
  <li>Photos in Israeli passport format</li>
</ul>

<h3>Step 4: Interview with the Jewish Agency</h3>
<p>You will be interviewed (often by video call) by a Jewish Agency shaliach (representative) who will verify your eligibility and discuss your plans. This is not a test — it is primarily verification and information sharing.</p>

<h3>Step 5: Receive Your Aliyah Approval (Pre-Aliyah Visa)</h3>
<p>Once approved, you receive an official aliyah approval letter. For group flights from North America, NBN coordinates charter or group flights several times per year with a ceremony on arrival at Ben Gurion Airport.</p>

<h3>Step 6: Arrive in Israel — What Happens at the Airport</h3>
<p>On arrival, you are met by NBN and Ministry of Aliyah staff. You receive your <strong>teudat oleh</strong> (immigrant identity document) at the airport, which activates your rights as a new immigrant. You will also begin the process of receiving your Israeli ID number (mispar zehut) and, shortly after, your teudat zehut (Israeli ID card).</p>

<h2>Your Rights as a New Immigrant (Oleh Chadash)</h2>
<p>New immigrants receive substantial state support during their absorption period (klita):</p>
<table>
  <thead><tr><th>Benefit</th><th>Amount / Duration</th></tr></thead>
  <tbody>
    <tr><td>Absorption basket (sal klita)</td><td>~₪20,000–₪25,000 total (paid in instalments over first year)</td></tr>
    <tr><td>Ulpan Hebrew language course</td><td>Free intensive course, up to 500 hours</td></tr>
    <tr><td>Income tax exemption on foreign income</td><td>10 years</td></tr>
    <tr><td>Import tax exemption (personal belongings)</td><td>3 years to import duty-free</td></tr>
    <tr><td>Free health insurance (Kupat Cholim)</td><td>6 months (then standard NII contributions apply)</td></tr>
    <tr><td>Mortgage assistance</td><td>Subsidised mortgage through Ministry of Aliyah</td></tr>
  </tbody>
</table>

<h2>The First 90 Days: Practical Checklist</h2>
<ol>
  <li>Open an Israeli bank account (Bank Leumi, Hapoalim, and Discount all serve new immigrants)</li>
  <li>Register with a Kupat Cholim (HMO health fund) — Maccabi, Clalit, Meuhedet, or Leumit</li>
  <li>Apply for your National Insurance Institute (Bituach Leumi) number</li>
  <li>Register children in school (contact local municipality)</li>
  <li>Enrol in Ulpan Hebrew course</li>
  <li>Arrange your driving licence conversion (done through Ministry of Transport)</li>
  <li>Connect with your local absorption centre (merkaz klita) or municipality absorption department</li>
</ol>

<h2>Common Challenges and How to Handle Them</h2>
<h3>Hebrew language barrier</h3>
<p>Ulpan is free and essential — start before you arrive if possible. Duolingo Hebrew, Pimsleur, and the Rosetta Stone Hebrew course are all useful pre-aliyah tools. Most Israeli bureaucratic offices now have English-speaking staff or English forms, but Hebrew will make your daily life considerably easier.</p>
<h3>Finding housing quickly</h3>
<p>Yad2.co.il is the main property listing site. Facebook groups for English-speaking olim in specific cities are extremely useful. Be aware that renting before buying is very common among new immigrants — do not rush into a purchase before you know which area suits you.</p>
<h3>Getting your foreign qualifications recognised</h3>
<p>Professional licensing varies by field. Doctors and lawyers must pass Israeli licensing exams. Teachers need Ministry of Education recognition. The Ministry of Aliyah and Integration's credential recognition department handles most queries.</p>

<h2>Frequently Asked Questions</h2>
<h3>Can I make aliyah if I am not halachically Jewish but have Jewish grandparents?</h3>
<p>Yes, under the Law of Return's 1970 amendment you can make aliyah as a grandchild of a Jew, but you will not automatically receive Orthodox Jewish status in Israel. Your rights as a citizen are identical, but certain religious matters (marriage, divorce, burial) are handled by the rabbinate and may be complicated.</p>
<h3>Do I have to give up my current citizenship?</h3>
<p>Israel does not require you to renounce your original citizenship. Many olim hold dual or triple citizenship. Your original country's laws on this vary — the US, UK, Canada, and Australia all permit dual citizenship.</p>
<h3>What is the difference between the Jewish Agency and Nefesh B'Nefesh?</h3>
<p>The Jewish Agency is the official body managing aliyah globally. Nefesh B'Nefesh is a non-profit that partners with the Jewish Agency specifically to assist North American, British, and more recently other Western olim, providing additional financial support, job placement help, and logistical coordination.</p>

<h2>Key Resources</h2>
<ul>
  <li><strong>Nefesh B'Nefesh</strong>: nbn.org.il — North America and UK aliyah applications</li>
  <li><strong>Jewish Agency</strong>: jewishagency.org — global aliyah coordination</li>
  <li><strong>Ministry of Aliyah and Integration</strong>: gov.il/en/departments/ministry_of_aliya — official government benefits and services</li>
  <li><strong>Bituach Leumi (National Insurance)</strong>: btl.gov.il — benefits and registration</li>
  <li><strong>Yad2</strong>: yad2.co.il — property rentals and sales in Israel</li>
</ul>`,
  },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const db = createClient(supabaseUrl, supabaseKey)

  const results: Record<string, any> = {}

  for (const site of JEWISH_SITES) {
    const articleDef = ARTICLES[site.slug]
    if (!articleDef) continue

    const slug = makeSlug(articleDef.title)
    const now = new Date().toISOString()

    // Check if article already exists
    const { data: existing } = await db
      .from('news_articles')
      .select('id')
      .eq('news_site_id', site.id)
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      results[site.slug] = { status: 'already_exists', slug }
      continue
    }

    const { data, error } = await db.from('news_articles').insert({
      news_site_id: site.id,
      title: articleDef.title,
      slug,
      excerpt: articleDef.excerpt,
      body: articleDef.content,
      category: articleDef.category,
      tags: articleDef.tags,
      status: 'published',
      published_at: now,
      author_name: 'Editorial Team',
      read_time_minutes: Math.ceil(articleDef.content.split(' ').length / 200),
      is_featured: false,
      article_type: 'news',
      ai_generated: true,
    }).select('id').single()

    if (error) {
      results[site.slug] = { status: 'error', error: error.message }
    } else {
      results[site.slug] = { status: 'inserted', id: data.id, slug, title: articleDef.title }
    }
  }

  return NextResponse.json({ ok: true, results, timestamp: new Date().toISOString() })
}
