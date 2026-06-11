import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DOMAIN_MAP: Record<string, { route: string; slug: string }> = {
  'nex-wire.com':             { route:'news',        slug:'global-trade-wire'    },
  'www.nex-wire.com':         { route:'news',        slug:'global-trade-wire'    },
  'finvexx.com':              { route:'finance',     slug:'finance-terminal'     },
  'www.finvexx.com':          { route:'finance',     slug:'finance-terminal'     },
  'bizplezx.com':             { route:'magazine',    slug:'business-pulse'       },
  'www.bizplezx.com':         { route:'magazine',    slug:'business-pulse'       },
  'aurexhq.com':              { route:'commodities', slug:'gold-markets-today'   },
  'www.aurexhq.com':          { route:'commodities', slug:'gold-markets-today'   },
  'verivex.co':               { route:'reviews-hub', slug:'trust-score'          },
  'www.verivex.co':           { route:'reviews-hub', slug:'trust-score'          },
  'invexhuby.com':            { route:'s', slug:'invest-data'        },
  'www.invexhuby.com':        { route:'s', slug:'invest-data'        },
  'signalixx.com':            { route:'s', slug:'market-radar'       },
  'www.signalixx.com':        { route:'s', slug:'market-radar'       },
  'execvex.com':              { route:'s', slug:'executive-network'  },
  'www.execvex.com':          { route:'s', slug:'executive-network'  },
  'cryptoxos.com':            { route:'s', slug:'crypto-hub'         },
  'www.cryptoxos.com':        { route:'s', slug:'crypto-hub'         },
  'fxvexx.com':               { route:'s', slug:'fx-vexx'            },
  'www.fxvexx.com':           { route:'s', slug:'fx-vexx'            },
  'tradehubiq.com':           { route:'s', slug:'trade-hub-iq'       },
  'www.tradehubiq.com':       { route:'s', slug:'trade-hub-iq'       },
  'jewishnewsnow.com':        { route:'s', slug:'jewish-news-now'    },
  'jewishpropertyreport.com': { route:'s', slug:'jewish-property-report' },
  'aliyatoday.com':           { route:'s', slug:'aliya-today'        },
}

export function middleware(request: NextRequest) {
  const host     = (request.headers.get('host') || '').replace(':3000','')
  const url      = new URL(request.url)
  const pathname = url.pathname
  const portal   = DOMAIN_MAP[host]

  // Unknown domain — pass through
  if (!portal) return NextResponse.next()

  // Always pass through these paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/article/') ||
    pathname.startsWith('/legal') ||
    pathname.startsWith('/portal') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/ads.txt' ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  ) return NextResponse.next()

  // Build rewrite target
  let targetPath: string

  if (portal.route === 's') {
    if (pathname.startsWith('/s')) return NextResponse.next()
    targetPath = '/s'
  } else {
    if (pathname.startsWith(`/${portal.route}/`)) return NextResponse.next()
    targetPath = pathname === '/'
      ? `/${portal.route}/${portal.slug}`
      : `/${portal.route}/${portal.slug}${pathname}`
  }

  // Build the rewrite URL using standard URL API
  const rewriteUrl = new URL(targetPath, request.url)
  const res = NextResponse.rewrite(rewriteUrl)
  res.headers.set('x-custom-domain', 'true')
  res.headers.set('x-site-slug', portal.slug)
  return res
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)'],
}
