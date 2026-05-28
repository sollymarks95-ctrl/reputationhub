// Pure Web API middleware — no next/server imports, Edge Runtime compatible

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

export default function middleware(request: Request) {
  const url = new URL(request.url)
  const host = request.headers.get('host')?.replace(':443','').replace(':80','') || ''
  const pathname = url.pathname

  const portal = DOMAIN_MAP[host]

  if (portal) {
    // Custom domain: rewrite to internal portal route
    if (pathname.startsWith('/api/')) return undefined // pass through APIs
    if (pathname.startsWith('/article/')) return undefined
    if (['/search','/legal','/portal','/charts'].some(p => pathname.startsWith(p))) return undefined
    if (pathname === '/sitemap.xml' || pathname === '/sitemap') {
      url.pathname = '/api/sitemap'
      return Response.redirect(url, 307)
    }
    if (pathname === '/robots.txt') return undefined

    // Rewrite root and all sub-paths to portal route
    const newPath = (pathname === '/' || pathname === '')
      ? `/${portal.route}/${portal.slug}`
      : `/${portal.route}/${portal.slug}${pathname}`
    url.pathname = newPath
    return Response.redirect(url, 307)
  }

  // rephuby.com — pass everything through
  return undefined
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)'],
}
