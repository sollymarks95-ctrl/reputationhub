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
