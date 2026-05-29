import { NextResponse, NextRequest } from 'next/server'

const DOMAIN_MAP: Record<string, { route: string; slug: string }> = {
  'nex-wire.com':     { route:'news',        slug:'global-trade-wire'   },
  'www.nex-wire.com': { route:'news',        slug:'global-trade-wire'   },
  'finvexx.com':      { route:'finance',     slug:'finance-terminal'    },
  'www.finvexx.com':  { route:'finance',     slug:'finance-terminal'    },
  'bizplezx.com':     { route:'magazine',    slug:'business-pulse'      },
  'www.bizplezx.com': { route:'magazine',    slug:'business-pulse'      },
  'aurexhq.com':      { route:'commodities', slug:'gold-markets-today'  },
  'www.aurexhq.com':  { route:'commodities', slug:'gold-markets-today'  },
  'verivex.co':       { route:'reviews-hub', slug:'trust-score'         },
  'bizpedia.com':     { route:'wiki',        slug:'company-pedia'       },
  'presxwire.com':    { route:'pressroom',   slug:'press-central'       },
  'invexhub.com':     { route:'investdb',    slug:'invest-data'         },
  'tradvex.com':      { route:'forum',       slug:'trade-board'         },
  'certivade.com':    { route:'association', slug:'global-trade-assoc'  },
  'execvex.com':      { route:'executive',   slug:'executive-network'   },
  'signalix.com':     { route:'market-radar',slug:'market-radar'        },
}

export default function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.replace(':443','').replace(':80','') || ''
  const pathname = request.nextUrl.pathname

  const portal = DOMAIN_MAP[host]
  if (!portal) return NextResponse.next()

  // Always pass through these paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/article/') ||
    pathname.startsWith('/faq/') ||
    pathname.startsWith('/reviews') ||  // includes /reviews (index) and /reviews/[company]
    pathname.startsWith('/search') ||
    pathname.startsWith('/legal') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/charts') ||
    pathname.startsWith('/for-businesses') ||
    pathname === '/favicon.ico' || pathname === '/sw.js'
  ) return NextResponse.next()

  // Robots.txt — serve dynamic per-domain file with AI crawler rules
  if (pathname === '/robots.txt') {
    const url = request.nextUrl.clone()
    url.pathname = '/api/robots'
    return NextResponse.rewrite(url)
  }

  // Sitemap — pass host as query param so API knows which site
  if (pathname === '/sitemap.xml' || pathname === '/sitemap') {
    const url = request.nextUrl.clone()
    url.pathname = '/api/sitemap'
    url.searchParams.set('host', host)
    return NextResponse.rewrite(url)
  }

  // Already on the internal route — don't rewrite again (prevents loop)
  if (pathname.startsWith(`/${portal.route}/`)) return NextResponse.next()

  // Rewrite root and sub-paths to internal portal route (REWRITE not REDIRECT)
  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' || pathname === ''
    ? `/${portal.route}/${portal.slug}`
    : `/${portal.route}/${portal.slug}${pathname}`

  const res = NextResponse.rewrite(url)
  // Tell the page it's on a custom domain — so Home links use "/" not "/${route}/${slug}"
  res.headers.set('x-custom-domain', 'true')
  res.headers.set('x-site-slug', portal.slug)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)'],
}
