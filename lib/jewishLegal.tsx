import type { JSX } from 'react'

// Jewish/Aliyah portals are informational publishers, not financial-trading
// publishers. They previously inherited the shared RepHuby/FCA legal content
// wholesale (wrong entity name, wrong registered address, irrelevant trading
// risk disclosures). This map gives each of them correct, site-aware legal
// copy without touching the finance-portal legal content below.
export const JEWISH_SITES: Record<string, { name: string; domain: string; email: string }> = {
  'aliyatoday.com':               { name: 'AliyaToday', domain: 'aliyatoday.com', email: 'privacy@aliyatoday.com' },
  'www.aliyatoday.com':           { name: 'AliyaToday', domain: 'aliyatoday.com', email: 'privacy@aliyatoday.com' },
  'jewishnewsnow.com':            { name: 'Jewish News Now', domain: 'jewishnewsnow.com', email: 'privacy@jewishnewsnow.com' },
  'www.jewishnewsnow.com':        { name: 'Jewish News Now', domain: 'jewishnewsnow.com', email: 'privacy@jewishnewsnow.com' },
  'jewishpropertyreport.com':     { name: 'Jewish Property Report', domain: 'jewishpropertyreport.com', email: 'privacy@jewishpropertyreport.com' },
  'www.jewishpropertyreport.com': { name: 'Jewish Property Report', domain: 'jewishpropertyreport.com', email: 'privacy@jewishpropertyreport.com' },
}

export function jewishLegalContent(page: string, site: { name: string; domain: string; email: string }): { title: string; content: () => JSX.Element } | null {
  const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  const MAP: Record<string, { title: string; content: () => JSX.Element }> = {
    privacy: {
      title: 'Privacy Policy',
      content: () => (
        <>
          <p><strong>Last updated:</strong> {today}</p>
          <h2>1. Who We Are</h2>
          <p>{site.name} ("we", "our", "us") is an independent editorial publication at {site.domain}, operated from Israel by Solly Marks, providing information for people considering or making Aliyah.</p>
          <h2>2. What Information We Collect</h2>
          <ul>
            <li><strong>Newsletter subscribers:</strong> Email address and date of subscription.</li>
            <li><strong>Website visitors:</strong> IP address, browser type, pages visited, and referring URL, collected through standard analytics cookies.</li>
            <li><strong>Contact form submissions:</strong> Name, email address, and message content.</li>
          </ul>
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To send the newsletter and guides you subscribed to;</li>
            <li>To improve the quality and relevance of our content;</li>
            <li>To analyse website traffic using anonymised analytics data;</li>
            <li>To respond to your enquiries.</li>
          </ul>
          <h2>4. Data Retention</h2>
          <p>We retain newsletter subscriber data for the duration of your subscription plus 2 years. Website analytics data is retained for 26 months. You may request deletion of your personal data at any time.</p>
          <h2>5. Your Rights</h2>
          <p>Depending on your location, you may have the right to access, correct, delete, or export your personal data, and to object to or restrict its processing.</p>
          <h2>6. Cookies</h2>
          <p>We use cookies to improve your browsing experience and analyse website traffic. See our Cookie Policy for details.</p>
          <h2>7. Third-Party Services</h2>
          <p>We use the following third-party services that may process your personal data: Supabase (database hosting), Vercel (website hosting), Google Analytics (anonymised analytics), and Resend (email delivery). Each has its own privacy policy.</p>
          <h2>8. Contact Us</h2>
          <p>For privacy-related enquiries, contact us at <strong>{site.email}</strong>.</p>
        </>
      )
    },
    terms: {
      title: 'Terms of Use',
      content: () => (
        <>
          <p><strong>Last updated:</strong> {today}</p>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using {site.name} ("Services"), you accept and agree to be bound by these Terms of Use. If you do not agree, please do not use the Services.</p>
          <h2>2. Nature of the Service</h2>
          <p>{site.name} provides information, guides, and commentary about Aliyah, immigration, housing, and community life in Israel for informational purposes only. Content does not constitute legal, tax, immigration, or financial advice. Always confirm details with the relevant official authority (Misrad Haklita, Nefesh B'Nefesh, the Jewish Agency, Misrad Hapnim, Bituach Leumi, or the Israel Tax Authority) before making decisions.</p>
          <h2>3. Accuracy of Information</h2>
          <p>While we make reasonable efforts to keep content accurate and current, government programs, benefits, and requirements change over time. We make no warranty as to completeness or timeliness of any information published.</p>
          <h2>4. Intellectual Property</h2>
          <p>All content on {site.name}, including text, graphics, and data compilations, is the property of {site.name} or its content providers. You may not reproduce or redistribute our content without permission.</p>
          <h2>5. Prohibited Uses</h2>
          <p>You agree not to scrape or systematically extract data from this site, interfere with its operation, or misrepresent the source of its content.</p>
          <h2>6. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, {site.name} is not liable for damages arising from your use of, or reliance on, information provided through the Services.</p>
          <h2>7. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the Services after changes constitutes acceptance of the updated terms.</p>
        </>
      )
    },
    cookies: {
      title: 'Cookie Policy',
      content: () => (
        <>
          <p><strong>Last updated:</strong> {today}</p>
          <h2>What Are Cookies</h2>
          <p>Cookies are small text files placed on your device to help websites function and to collect anonymised usage data.</p>
          <h2>How {site.name} Uses Cookies</h2>
          <ul>
            <li><strong>Essential cookies:</strong> required for the site to function correctly.</li>
            <li><strong>Analytics cookies:</strong> help us understand how visitors use the site, so we can improve it.</li>
          </ul>
          <h2>Managing Cookies</h2>
          <p>You can control or delete cookies through your browser settings. Disabling cookies may affect site functionality.</p>
          <h2>Contact</h2>
          <p>Questions about this policy can be sent to <strong>{site.email}</strong>.</p>
        </>
      )
    },
    about: {
      title: `About ${site.name}`,
      content: () => (
        <>
          <h2>Our Mission</h2>
          <p>{site.name} exists to be a practical, trustworthy guide for people making Aliyah — covering the process, costs, housing, healthcare, work, and community life in Israel.</p>
          <h2>Editorial Standards</h2>
          <p>Guides are written and reviewed by Solly Marks, an oleh living in Ashdod, Israel, and are checked against official sources including Misrad Haklita, Nefesh B'Nefesh, the Jewish Agency, Bituach Leumi, and the Israel Tax Authority where relevant. Information is provided for general guidance only — always confirm specifics with the relevant official body before making decisions.</p>
          <h2>Contact</h2>
          <p>Email: <strong>{site.email}</strong></p>
        </>
      )
    },
    contact: {
      title: 'Contact',
      content: () => (
        <>
          <p>For general enquiries, corrections, or partnership requests, email us at <strong>{site.email}</strong>. We aim to respond within one business day.</p>
        </>
      )
    },
  }
  return MAP[page] || null
}
