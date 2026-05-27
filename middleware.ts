import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) return NextResponse.next()

  const siteParam = request.nextUrl.searchParams.get('site')
  if (siteParam) {
    const url = request.nextUrl.clone()
    url.pathname = `/news/${siteParam}${pathname}`
    return NextResponse.rewrite(url)
  }

  const domainMap: Record<string, { type: string; slug: string }> = {
    'nexwire.com':      { type: 'news',        slug: 'global-trade-wire' },
    'finvex.com':       { type: 'finance',      slug: 'finance-terminal' },
    'aurexhq.com':      { type: 'commodities',  slug: 'gold-markets-today' },
    'bizplex.com':      { type: 'magazine',     slug: 'business-pulse' },
    'verivex.com':      { type: 'reviews-hub',  slug: 'trust-score' },
    'bizpedia.io':      { type: 'wiki',         slug: 'company-pedia' },
    'presxwire.com':    { type: 'pressroom',    slug: 'press-central' },
    'invexhub.com':     { type: 'investdb',     slug: 'invest-data' },
    'tradvex.com':      { type: 'forum',        slug: 'trade-board' },
    'certivade.com':    { type: 'association',  slug: 'global-trade-assoc' },
    'execvex.com':      { type: 'executive',    slug: 'executive-network' },
    'signalix.com':     { type: 'market-radar', slug: 'market-radar' },
  }

  const cleanHost = hostname.replace('www.', '').split(':')[0]
  const site = domainMap[cleanHost]

  if (site) {
    const url = request.nextUrl.clone()
    url.pathname = `/${site.type}/${site.slug}${pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
