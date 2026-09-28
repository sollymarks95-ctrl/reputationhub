import { NextRequest, NextResponse } from 'next/server'

// ACTIVE DOMAINS — only the 3 Jewish sites + RepHuby intelligence portal.
// All finance portals (nex-wire, finvexx, verivex, aurexhq, invexhuby,
// bizplezx, signalixx, execvex, cryptoxos, fxvexx, tradehubiq, copyvexx,
// expatinvestiq) have been removed. Requests to those domains will fall
// through to the default Next.js 404 handler.
const DOMAIN_MAP: Record<string, { route: string; slug: string }> = {
  'jewishnewsnow.com':             { route: 's', slug: 'jewish-news-now'      },
  'www.jewishnewsnow.com':         { route: 's', slug: 'jewish-news-now'      },
  'jewishpropertyreport.com':      { route: 's', slug: 'jewish-property-report' },
  'www.jewishpropertyreport.com':  { route: 's', slug: 'jewish-property-report' },
  'aliyatoday.com':                { route: 's', slug: 'aliya-today'          },
  'www.aliyatoday.com':            { route: 's', slug: 'aliya-today'          },
  'rephuby.com':                   { route: '',  slug: 'rephuby-intelligence' },
  'www.rephuby.com':               { route: '',  slug: 'rephuby-intelligence' },
}

export function middleware(request: NextRequest) {
  const host     = (request.headers.get('host') || '').replace(':3000','')
  const url      = new URL(request.url)
  const pathname = url.pathname

  const portal = DOMAIN_MAP[host]
  if (!portal) return NextResponse.next() // unknown host — pass through

  // Let these paths through without rewriting
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/article/') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/feed.xml') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/legal/') ||
    pathname.startsWith('/aliya-admin') ||
    pathname.startsWith('/portal/') ||
    pathname.startsWith('/author/') ||
    pathname.startsWith('/news/') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/_next/')
  ) {
    const res = NextResponse.next()
    res.headers.set('x-site-slug', portal.slug)
    return res
  }

  // Pass slug as REQUEST header so the page can read it via headers().
  // NextResponse.rewrite() with { request: { headers } } injects headers
  // into the rewritten request — this is the only reliable way to pass
  // data from middleware to a server component.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-site-slug', portal.slug)
  requestHeaders.set('x-custom-domain', 'true')

  const rewriteUrl = new URL(request.url)
  if (portal.route === 's') {
    rewriteUrl.pathname = '/s'
  } else {
    rewriteUrl.pathname = portal.route
      ? `/${portal.route}/${portal.slug}${pathname === '/' ? '' : pathname}`
      : `/${portal.slug}${pathname === '/' ? '' : pathname}`
  }

  return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)'],
}
