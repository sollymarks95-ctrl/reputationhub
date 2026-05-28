import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Custom domains → portal route mapping
const DOMAIN_MAP: Record<string, { route: string; slug: string }> = {
  'nex-wire.com':     { route:'news',        slug:'global-trade-wire'   },
  'www.nex-wire.com': { route:'news',        slug:'global-trade-wire'   },
  'finvexx.com':      { route:'finance',     slug:'finance-terminal'    },
  'www.finvexx.com':  { route:'finance',     slug:'finance-terminal'    },
  'bizplezx.com':     { route:'magazine',    slug:'business-pulse'      },
  'www.bizplezx.com': { route:'magazine',    slug:'business-pulse'      },
  // Future domains — add as they're purchased
  'aurexhq.com':      { route:'commodities', slug:'gold-markets-today'  },
  'www.aurexhq.com':  { route:'commodities', slug:'gold-markets-today'  },
  'bizpedia.com':     { route:'wiki',        slug:'company-pedia'       },
  'presxwire.com':    { route:'pressroom',   slug:'press-central'       },
  'invexhub.com':     { route:'investdb',    slug:'invest-data'         },
  'tradvex.com':      { route:'forum',       slug:'trade-board'         },
  'certivade.com':    { route:'association', slug:'global-trade-assoc'  },
  'execvex.com':      { route:'executive',   slug:'executive-network'   },
  'signalix.com':     { route:'market-radar',slug:'market-radar'        },
}

// Portals that HAVE custom domains — public access via rephuby.com paths should redirect
const REPHUBY_REDIRECT: Record<string, string> = {
  '/news/global-trade-wire':   'https://nex-wire.com',
  '/finance/finance-terminal': 'https://finvexx.com',
  '/magazine/business-pulse':  'https://bizplezx.com',
}

const SKIP = ['/_next','/_vercel','/portal','/legal','/search','/charts','/academy','/logo','/llms','.well-known']

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '')
  const { pathname } = req.nextUrl

  // Skip Next.js internals and static files
  if (SKIP.some(s => pathname.startsWith(s)) || pathname.includes('.')) {
    return NextResponse.next()
  }

  // ── CUSTOM DOMAIN REQUEST ──────────────────────────────────────────────────
  const portal = DOMAIN_MAP[host]
  if (portal) {
    // Favicon → serve domain-specific icon
    if (pathname === '/favicon.ico' || pathname === '/favicon.svg') {
      const url = req.nextUrl.clone()
      url.pathname = '/api/favicon'
      return NextResponse.rewrite(url)
    }
    // API routes and static pass through
    if (pathname.startsWith('/api/')) return NextResponse.next()
    // Article pages pass through
    if (pathname.startsWith('/article/')) return NextResponse.next()
    // Already on portal path
    if (pathname.startsWith(`/${portal.route}/${portal.slug}`)) return NextResponse.next()
    // Other portal-safe paths
    if (['/search','/charts','/legal','/portal'].some(p => pathname.startsWith(p))) return NextResponse.next()
    // Rewrite root + everything else → portal homepage
    const url = req.nextUrl.clone()
    url.pathname = `/${portal.route}/${portal.slug}`
    return NextResponse.rewrite(url)
  }

  // ── REPHUBY.COM REQUEST ────────────────────────────────────────────────────
  // If someone accesses rephuby.com/news/global-trade-wire → redirect to nex-wire.com
  const redirectDomain = REPHUBY_REDIRECT[pathname] ||
    Object.entries(REPHUBY_REDIRECT).find(([path]) => pathname.startsWith(path))?.[1]

  if (redirectDomain && (host === 'rephuby.com' || host === 'www.rephuby.com' || host.includes('vercel.app'))) {
    // Don't redirect article pages — those are served internally for the cron/admin
    if (pathname.startsWith('/article/')) return NextResponse.next()
    return NextResponse.redirect(redirectDomain, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)',],
}
