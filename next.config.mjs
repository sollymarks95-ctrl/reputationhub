/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  async rewrites() {
    return [
      // nex-wire.com → news/global-trade-wire
      { source: '/:path*', destination: '/news/global-trade-wire/:path*', has: [{ type: 'host', value: 'nex-wire.com' }] },
      { source: '/:path*', destination: '/news/global-trade-wire/:path*', has: [{ type: 'host', value: 'www.nex-wire.com' }] },
      // finvexx.com → finance/finance-terminal
      { source: '/:path*', destination: '/finance/finance-terminal/:path*', has: [{ type: 'host', value: 'finvexx.com' }] },
      { source: '/:path*', destination: '/finance/finance-terminal/:path*', has: [{ type: 'host', value: 'www.finvexx.com' }] },
      // bizplezx.com → magazine/business-pulse
      { source: '/:path*', destination: '/magazine/business-pulse/:path*', has: [{ type: 'host', value: 'bizplezx.com' }] },
      { source: '/:path*', destination: '/magazine/business-pulse/:path*', has: [{ type: 'host', value: 'www.bizplezx.com' }] },
      // aurexhq.com → commodities/gold-markets-today
      { source: '/:path*', destination: '/commodities/gold-markets-today/:path*', has: [{ type: 'host', value: 'aurexhq.com' }] },
      // bizpedia.com → wiki/company-pedia
      { source: '/:path*', destination: '/wiki/company-pedia/:path*', has: [{ type: 'host', value: 'bizpedia.com' }] },
      // presxwire.com → pressroom/press-central
      { source: '/:path*', destination: '/pressroom/press-central/:path*', has: [{ type: 'host', value: 'presxwire.com' }] },
      // invexhub.com → investdb/invest-data
      { source: '/:path*', destination: '/investdb/invest-data/:path*', has: [{ type: 'host', value: 'invexhub.com' }] },
      // tradvex.com → forum/trade-board
      { source: '/:path*', destination: '/forum/trade-board/:path*', has: [{ type: 'host', value: 'tradvex.com' }] },
      // certivade.com → association/global-trade-assoc
      { source: '/:path*', destination: '/association/global-trade-assoc/:path*', has: [{ type: 'host', value: 'certivade.com' }] },
      // execvex.com → executive/executive-network
      { source: '/:path*', destination: '/executive/executive-network/:path*', has: [{ type: 'host', value: 'execvex.com' }] },
      // signalix.com → market-radar/market-radar
      { source: '/:path*', destination: '/market-radar/market-radar/:path*', has: [{ type: 'host', value: 'signalix.com' }] },
      // verivex.co → reviews-hub/trust-score
      { source: '/:path*', destination: '/reviews-hub/trust-score/:path*', has: [{ type: 'host', value: 'verivex.co' }] },
      // sitemap per custom domain
      { source: '/sitemap.xml', destination: '/api/sitemap', has: [{ type: 'host', value: 'nex-wire.com' }] },
      { source: '/sitemap.xml', destination: '/api/sitemap', has: [{ type: 'host', value: 'finvexx.com' }] },
      { source: '/sitemap.xml', destination: '/api/sitemap', has: [{ type: 'host', value: 'bizplezx.com' }] },
    ]
  },
}
export default nextConfig
