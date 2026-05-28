import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DOMAIN_MAP: Record<string, { route: string; slug: string }> = {
  'nex-wire.com':     { route:'news',        slug:'global-trade-wire'   },
  'www.nex-wire.com': { route:'news',        slug:'global-trade-wire'   },
  'finvexx.com':      { route:'finance',     slug:'finance-terminal'    },
  'www.finvexx.com':  { route:'finance',     slug:'finance-terminal'    },
  'bizplezx.com':     { route:'magazine',    slug:'business-pulse'      },
  'www.bizplezx.com': { route:'magazine',    slug:'business-pulse'      },
  'aurexhq.com':      { route:'commodities', slug:'gold-markets-today'  },
  'bizpedia.com':     { route:'wiki',        slug:'company-pedia'       },
  'presxwire.com':    { route:'pressroom',   slug:'press-central'       },
  'invexhub.com':     { route:'investdb',    slug:'invest-data'         },
  'tradvex.com':      { route:'forum',       slug:'trade-board'         },
  'certivade.com':    { route:'association', slug:'global-trade-assoc'  },
  'execvex.com':      { route:'executive',   slug:'executive-network'   },
  'signalix.com':     { route:'market-radar',slug:'market-radar'        },
}

// Only rephuby.com paths with custom domains redirect publicly
const REPHUBY_REDIRECT: Record<string, string> = {
  '/news/global-trade-wire':   'https://nex-wire.com',
  '/finance/finance-terminal': 'https://finvexx.com',
  '/magazine/business-pulse':  'https://bizplezx.com',
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '')
  const { pathname } = req.nextUrl

  // Always pass through Next.js internals and ALL static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/_vercel') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // ── CUSTOM DOMAIN ──────────────────────────────────────────────────────────
  const portal = DOMAIN_MAP[host]
  if (portal) {
    if (pathname.startsWith('/api/'))    return NextResponse.next()
    if (pathname.startsWith('/article/'))return NextResponse.next()
    if (['/search','/legal','/portal','/charts'].some(p => pathname.startsWith(p))) return NextResponse.next()

    // Root and everything else → rewrite to portal
    if (pathname === '/' || !pathname.startsWith(`/${portal.route}/${portal.slug}`)) {
      const url = req.nextUrl.clone()
      url.pathname = `/${portal.route}/${portal.slug}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // ── REPHUBY.COM — redirect portal paths to real domains ───────────────────
  if (host === 'rephuby.com' || host === 'www.rephuby.com' || host.includes('vercel.app')) {
    if (pathname.startsWith('/article/')) return NextResponse.next()

    const redirectTarget = REPHUBY_REDIRECT[pathname] ||
      Object.entries(REPHUBY_REDIRECT).find(([p]) => pathname.startsWith(p))?.[1]

    if (redirectTarget) {
      return NextResponse.redirect(redirectTarget, { status: 301 })
    }
  }

  return NextResponse.next()
}

export const config = {
  // Only intercept page routes — NOT static files, images, or media
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)',],
}
