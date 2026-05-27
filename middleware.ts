import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Skip dashboard, api, static files
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Local dev — use ?site=slug to preview different sites
  const siteParam = request.nextUrl.searchParams.get('site')
  if (siteParam) {
    const url = request.nextUrl.clone()
    url.pathname = `/sites/${siteParam}${pathname}`
    return NextResponse.rewrite(url)
  }

  // Production — map domain to site slug
  // e.g. tradeverify.com → /sites/tradeverify
  const knownDomains: Record<string, string> = {
    'tradeverify.com': 'tradeverify',
    'supplierindex.com': 'supplierindex',
    'importerratings.com': 'importerratings',
    'wholesalehub.com': 'wholesalehub',
    'biztrust.com': 'biztrust',
    'bizverified.com': 'bizverified',
  }

  const cleanHost = hostname.replace('www.', '').split(':')[0]
  const siteSlug = knownDomains[cleanHost]

  if (siteSlug) {
    const url = request.nextUrl.clone()
    url.pathname = `/sites/${siteSlug}${pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
