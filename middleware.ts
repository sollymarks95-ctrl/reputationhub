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

  // Rewrite homepage + category pages to the site's template route.
  // app/s/page.tsx reads site by host header — NOT by slug in the URL —
  // so we rewrite to /s (the route), NOT /s/aliya-today (which has no page).
  const rewriteUrl = new URL(request.url)
  rewriteUrl.pathname = portal.route
    ? `/${portal.route}${pathname === '/' ? '' : pathname}`
    : `/${portal.slug}${pathname === '/' ? '' : pathname}`

  const res = NextResponse.rewrite(rewriteUrl)
  res.headers.set('x-custom-domain', 'true')
  res.headers.set('x-site-slug', portal.slug)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)'],
}
