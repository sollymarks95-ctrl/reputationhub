import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DOMAIN_MAP: Record<string, { route: string; slug: string; name: string }> = {
  // ── PURCHASED DOMAINS ──────────────────────────────────────────────────
  'finvexx.com':      { route:'finance',      slug:'finance-terminal',    name:'Finvex'   },
  'www.finvexx.com':  { route:'finance',      slug:'finance-terminal',    name:'Finvex'   },
  'nex-wire.com':     { route:'news',         slug:'global-trade-wire',   name:'Nexwire'  },
  'www.nex-wire.com': { route:'news',         slug:'global-trade-wire',   name:'Nexwire'  },

  // ── FUTURE PORTALS (add domain → connect here) ─────────────────────────
  'aurexhq.com':      { route:'commodities',  slug:'gold-markets-today',  name:'AurexHQ'  },
  'www.aurexhq.com':  { route:'commodities',  slug:'gold-markets-today',  name:'AurexHQ'  },
  'bizplezx.com':     { route:'magazine',     slug:'business-pulse',      name:'Bizplezx' },
  'www.bizplezx.com': { route:'magazine',     slug:'business-pulse',      name:'Bizplezx' },
  'bizplex.co':       { route:'magazine',     slug:'business-pulse',      name:'Bizplex'  },
  'www.bizplex.co':   { route:'magazine',     slug:'business-pulse',      name:'Bizplex'  },
  'verivex.co':       { route:'reviews-hub',  slug:'trust-score',         name:'Verivex'  },
  'www.verivex.co':   { route:'reviews-hub',  slug:'trust-score',         name:'Verivex'  },
  'bizpedia.com':     { route:'wiki',         slug:'company-pedia',       name:'Bizpedia' },
  'presxwire.com':    { route:'pressroom',    slug:'press-central',       name:'PresxWire'},
  'invexhub.com':     { route:'investdb',     slug:'invest-data',         name:'InvexHub' },
  'tradvex.com':      { route:'forum',        slug:'trade-board',         name:'Tradvex'  },
  'certivade.com':    { route:'association',  slug:'global-trade-assoc',  name:'Certivade'},
  'execvex.com':      { route:'executive',    slug:'executive-network',   name:'Execvex'  },
  'signalix.com':     { route:'market-radar', slug:'market-radar',        name:'Signalix' },
}

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '')
  const { pathname } = request.nextUrl

  // Skip internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) return NextResponse.next()

  const portal = DOMAIN_MAP[host]
  if (!portal) return NextResponse.next()

  // Root → portal homepage
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone()
    url.pathname = `/${portal.route}/${portal.slug}`
    return NextResponse.rewrite(url)
  }

  // Already on correct path
  if (pathname.startsWith(`/${portal.route}/${portal.slug}`)) return NextResponse.next()

  // Article, search, legal, portal — pass through
  if (['/article/','/search','/charts','/legal','/portal','/academy'].some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Everything else → portal homepage
  const url = request.nextUrl.clone()
  url.pathname = `/${portal.route}/${portal.slug}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)',],
}
