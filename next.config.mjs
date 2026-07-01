/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  async redirects() {
    return [
      // AliyaToday — duplicate/renamed articles consolidated during content
      // cleanup (July 2026). Each old slug 301s to its canonical replacement
      // so no previously-indexed or shared URL 404s.
      {
        source: '/article/aliya-today/2026-07-01-cost-of-living-in-israel-2026-realistic-monthly-budget-for-n',
        destination: '/article/aliya-today/2026-07-01-cost-of-living-in-israel-2026-what-new-olim-actually-spend-p',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-07-01-bituach-leumi-for-new-olim-2026-registration-steps-and-benef',
        destination: '/article/aliya-today/2026-07-01-bituach-leumi-for-new-olim-2026-registration-benefits-payment-timeline',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-23-sal-klita-benefits-2026-how-much-olim-actually-receive',
        destination: '/article/aliya-today/2026-06-22-sal-klita-2026-the-complete-guide',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-28-sal-klita-2026-how-much-money-new-olim-receive',
        destination: '/article/aliya-today/2026-06-22-sal-klita-2026-the-complete-guide',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-22-cost-of-making-aliyah-2026-financial-breakdown-vs-2016-baseline',
        destination: '/article/aliya-today/2026-06-22-cost-of-making-aliyah-2026-complete-budget-for-single-couple-family-olim',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-07-01-israeli-politics-coalition-risk-knesset-navigation-for-investor-olim',
        destination: '/article/aliya-today/2026-07-01-how-to-make-aliyah-2026-complete-step-by-step-guide',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-24-how-much-money-do-you-need-to-make-aliyah-2026-financial-winners-losers-decoded',
        destination: '/article/aliya-today/2026-06-22-cost-of-making-aliyah-2026-complete-budget-for-single-couple-family-olim',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-24-how-much-money-do-i-need-to-make-aliyah-the-2026-financial-roadmap',
        destination: '/article/aliya-today/2026-06-22-cost-of-making-aliyah-2026-complete-budget-for-single-couple-family-olim',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-15-aliyah-cost-breakdown-2026-pre-arrival-to-month-six',
        destination: '/article/aliya-today/2026-06-22-cost-of-making-aliyah-2026-complete-budget-for-single-couple-family-olim',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-21-bituach-leumi-for-olim-2026-how-social-security-changed-since-2016',
        destination: '/article/aliya-today/2026-07-01-bituach-leumi-for-new-olim-2026-registration-benefits-payment-timeline',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-30-israel-driving-test-english-conversion-2026-regulatory-inflection-or-temporary-p',
        destination: '/article/aliya-today/2026-06-17-free-ulpan-for-new-olim-2026-how-to-enrol',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-07-01-israeli-bank-account-new-olim-2026-which-bank-how-to-open',
        destination: '/article/aliya-today/2026-06-17-how-to-open-an-israeli-bank-account-as-a-new-oleh-2026',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-23-israeli-bank-accounts-for-olim-2026-vs-2016-access-revolution',
        destination: '/article/aliya-today/2026-06-17-how-to-open-an-israeli-bank-account-as-a-new-oleh-2026',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-26-kupat-holim-2026-which-health-fund-new-olim-choose',
        destination: '/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile',
        permanent: true,
      },
      {
        source: '/article/aliya-today/2026-06-24-kupat-holim-clalit-vs-maccabi-vs-meuhedet-2026-olim-hmo-selection-shifts',
        destination: '/article/aliya-today/2026-06-14-kupat-holim-choice-2026-which-health-fund-fits-your-oleh-financial-profile',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ]
  },
}
export default nextConfig
