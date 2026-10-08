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

  // Block direct access to /s?_site=... from unknown hosts (e.g. rephuby.com/s?_site=...)
  // These URLs should never appear in Google's index — only the canonical domain URLs should.
  if (!portal) {
    if (pathname === '/s' || pathname.startsWith('/s?')) {
      const res = NextResponse.next()
      res.headers.set('X-Robots-Tag', 'noindex, nofollow')
      return res
    }
    return NextResponse.next() // unknown host — pass through
  }

  // Let these paths through without rewriting
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/article/') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/feed.xml') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/llms.txt') ||
    pathname.startsWith('/legal/') ||
    pathname.startsWith('/aliya-admin') ||
    pathname.startsWith('/calculators') ||
    pathname.startsWith('/guides') ||
    pathname.startsWith('/portal/') ||
    pathname.startsWith('/author/') ||
    pathname.startsWith('/archive') ||
    pathname.startsWith('/news/') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/_next/')
  ) {
    const res = NextResponse.next()
    res.headers.set('x-site-slug', portal.slug)
    // app/article/[site]/[slug]/page.tsx reads this header to decide whether
    // "Home"/breadcrumb/category/back/tag links should point to "/" (real
    // custom domain) or fall back to "/news/<slug>" (an internal-only path
    // that isn't in this site's ROUTE_MAP for any of the 3 Jewish portals).
    // This header was never being set here, so EVERY article page on all 3
    // domains linked "Home" etc to /news/<slug> instead of "/" — a dead-end
    // path that Googlebot was following off of every single article, which
    // is almost certainly a major contributor to the 404/4xx counts and the
    // large "Discovered — currently not indexed" count in Search Console.
    res.headers.set('x-custom-domain', 'true')
    return res
  }

  const rewriteUrl = new URL(request.url)
  if (portal.route === 's') {
    // Encode the site slug as a search param — more reliable than request headers.
    // The browser URL stays clean (server-side rewrite). Page reads ?_site=slug.
    rewriteUrl.pathname = '/s'
    rewriteUrl.searchParams.set('_site', portal.slug)
  } else {
    rewriteUrl.pathname = portal.route
      ? `/${portal.route}/${portal.slug}${pathname === '/' ? '' : pathname}`
      : `/${portal.slug}${pathname === '/' ? '' : pathname}`
  }

  const res = NextResponse.rewrite(rewriteUrl)
  res.headers.set('x-site-slug', portal.slug)
  res.headers.set('x-custom-domain', 'true')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|robots\\.txt|llms\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)'],
}
