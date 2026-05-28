import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Each portal domain → its route + slug on rephuby.com
const DOMAIN_MAP: Record<string, { route: string; slug: string; name: string }> = {
  'nexwire.com':     { route:'news',         slug:'global-trade-wire',  name:'Nexwire'  },
  'finvex.com':      { route:'finance',       slug:'finance-terminal',   name:'Finvex'   },
  'aurexhq.com':     { route:'commodities',   slug:'gold-markets-today', name:'AurexHQ'  },
  'bizplex.com':     { route:'magazine',      slug:'business-pulse',     name:'Bizplex'  },
  'verivex.com':     { route:'reviews-hub',   slug:'trust-score',        name:'Verivex'  },
  'bizpedia.com':    { route:'wiki',          slug:'company-pedia',      name:'Bizpedia' },
  'presxwire.com':   { route:'pressroom',     slug:'press-central',      name:'PresxWire'},
  'invexhub.com':    { route:'investdb',      slug:'invest-data',        name:'InvexHub' },
  'tradvex.com':     { route:'forum',         slug:'trade-board',        name:'Tradvex'  },
  'certivade.com':   { route:'association',   slug:'global-trade-assoc', name:'Certivade'},
  'execvex.com':     { route:'executive',     slug:'executive-network',  name:'Execvex'  },
  'signalix.com':    { route:'market-radar',  slug:'market-radar',       name:'Signalix' },
  // .co fallbacks (verified available)
  'nexwire.co':      { route:'news',         slug:'global-trade-wire',  name:'Nexwire'  },
  'bizplex.co':      { route:'magazine',      slug:'business-pulse',     name:'Bizplex'  },
  'verivex.co':      { route:'reviews-hub',   slug:'trust-score',        name:'Verivex'  },
  // aurexhq.com is available — buy at vercel.com/domains/search?q=aurexhq.com

  // .io fallbacks
  'nexwire.io':      { route:'news',         slug:'global-trade-wire',  name:'Nexwire'  },
  'finvex.io':       { route:'finance',       slug:'finance-terminal',   name:'Finvex'   },
  'aurexhq.io':      { route:'commodities',   slug:'gold-markets-today', name:'AurexHQ'  },
  'bizplex.io':      { route:'magazine',      slug:'business-pulse',     name:'Bizplex'  },
  'verivex.io':      { route:'reviews-hub',   slug:'trust-score',        name:'Verivex'  },
}

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '')
  const cleanHost = host.replace(/^www\./, '')
  const { pathname } = request.nextUrl

  // Skip static assets, API routes, Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.includes('.')
  ) return NextResponse.next()

  const portal = DOMAIN_MAP[cleanHost]
  if (!portal) return NextResponse.next()

  // Root → portal homepage
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone()
    url.pathname = `/${portal.route}/${portal.slug}`
    return NextResponse.rewrite(url)
  }

  // Already on portal path — let through
  if (pathname.startsWith(`/${portal.route}/${portal.slug}`)) {
    return NextResponse.next()
  }

  // Article pages — keep path, just prefix with portal route
  if (pathname.startsWith('/article/')) {
    return NextResponse.next()
  }

  // /search, /charts, /legal, /portal — pass through unchanged
  if (['/search','/charts','/legal','/portal','/academy'].some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Everything else on portal domain → portal homepage
  const url = request.nextUrl.clone()
  url.pathname = `/${portal.route}/${portal.slug}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)',],
}
