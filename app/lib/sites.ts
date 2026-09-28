// Master site registry — every live portal in the network, keyed by slug.
// Single source of truth for: site UUID, homepage route prefix, display name,
// brand accent color. Imported by the search page + search API so they can
// never drift out of sync with each other.
//
// `route` is the path prefix used for that site's homepage (matches
// middleware.ts DOMAIN_MAP). Article URLs never need the route prefix —
// they're always /article/<slug>/<article-slug> regardless of which domain
// serves the site.
//
// IMPORTANT: keep this in sync with CORE_SITES in app/api/cron-site/route.ts
// and DOMAIN_MAP in middleware.ts whenever a new portal is added.

export type SiteEntry = { id: string; route: string; name: string; accent: string; emoji: string }

// Active sites — 3 Jewish portals + RepHuby only.
// All finance portals removed from routing and cron jobs.
export const SITES: Record<string, SiteEntry> = {
  'aliya-today':            { id: '9cfd54a9-5e1c-414c-8fe1-12b779013fca', route: 's', name: 'AliyaToday',             accent: '#c47d1a', emoji: '✈️' },
  'jewish-news-now':        { id: '8dc3f4f2-309c-4f3b-98c6-a6d42d037778', route: 's', name: 'Jewish News Now',        accent: '#1a56b0', emoji: '✡️' },
  'jewish-property-report': { id: '15762338-2746-45ea-95b5-6685ed3c480e', route: 's', name: 'Jewish Property Report', accent: '#1a7a4c', emoji: '🏠' },
  'rephuby-intelligence':   { id: '35579979-ca5e-476f-bd75-9be5910fe29b', route: '',  name: 'RepHuby Intelligence',   accent: '#3b82f6', emoji: '🌐' },
}

// Reverse lookup: news_site_id (uuid) -> slug
export const ID_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SITES).map(([slug, s]) => [s.id, slug])
)

export function homeHref(slug: string) {
  const s = SITES[slug]
  if (!s) return '/'
  return s.route ? `/${s.route}/${slug}` : '/'
}

// Accepts either a slug ("aliya-today") or a raw news_site_id uuid and
// resolves it to the canonical SiteEntry, or null if unrecognised.
export function resolveSite(siteParam: string | null | undefined): SiteEntry | null {
  if (!siteParam) return null
  if (SITES[siteParam]) return SITES[siteParam]
  const bySlugOfId = ID_TO_SLUG[siteParam]
  if (bySlugOfId) return SITES[bySlugOfId]
  return null
}

export function slugForSite(site: SiteEntry): string {
  return ID_TO_SLUG[site.id] || ''
}
