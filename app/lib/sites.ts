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

export const SITES: Record<string, SiteEntry> = {
  'global-trade-wire':      { id: '4d048bde-1dcd-4891-8434-a7960ab9d3ae', route: 'news',        name: 'Nex-Wire Intelligence',  accent: '#3b82f6', emoji: '🌐' },
  'finance-terminal':       { id: '48bed332-6525-4d76-aaa5-6d10a5112d77', route: 'finance',      name: 'Finvexx Markets',        accent: '#3b82f6', emoji: '📈' },
  'business-pulse':         { id: 'c0f14745-8189-444d-af09-39d7248fa319', route: 'magazine',     name: 'Bizplezx Executive',     accent: '#b8860b', emoji: '💼' },
  'gold-markets-today':     { id: '3b440202-e1c3-4f54-8a4e-65cf7e7dbfe1', route: 'commodities',  name: 'AurexHQ',                accent: '#b8860b', emoji: '🥇' },
  'trust-score':            { id: '6ae7e692-bce9-489d-b835-87dcba9ffc47', route: 'reviews-hub',  name: 'Verivex Trust',          accent: '#10b981', emoji: '🛡️' },
  'invest-data':            { id: '1cd6688f-bec9-4d1b-a024-80952bf31a21', route: 's',            name: 'InvexHuby',              accent: '#3b82f6', emoji: '📊' },
  'market-radar':           { id: '27fdf1e6-8c0c-4591-ae9b-5a2c5cacee22', route: 's',            name: 'Signalixx',              accent: '#3b82f6', emoji: '📡' },
  'executive-network':      { id: '64a6087d-480f-4040-9df1-ad020faf5796', route: 's',            name: 'ExecVex',                accent: '#111827', emoji: '👔' },
  'crypto-hub':             { id: 'f54ac054-3574-482c-a3f3-97037b45c759', route: 's',            name: 'CryptoXos',              accent: '#7c3aed', emoji: '₿' },
  'fx-vexx':                { id: '0c8feb1b-7995-46c0-96e7-5e567cc5d9bd', route: 's',            name: 'FXVexx',                 accent: '#3b82f6', emoji: '💱' },
  'trade-hub-iq':           { id: 'e9a1ef2c-59c0-46ff-9d2f-d3db8bb272eb', route: 's',            name: 'TradeHubIQ',             accent: '#3b82f6', emoji: '📉' },
  'jewish-news-now':        { id: '8dc3f4f2-309c-4f3b-98c6-a6d42d037778', route: 's',            name: 'Jewish News Now',        accent: '#1a56b0', emoji: '✡️' },
  'jewish-property-report': { id: '15762338-2746-45ea-95b5-6685ed3c480e', route: 's',            name: 'Jewish Property Report', accent: '#1a7a4c', emoji: '🏠' },
  'aliya-today':            { id: '9cfd54a9-5e1c-414c-8fe1-12b779013fca', route: 's',            name: 'AliyaToday',             accent: '#c47d1a', emoji: '✈️' },
  'rephuby-intelligence':   { id: '35579979-ca5e-476f-bd75-9be5910fe29b', route: '',             name: 'RepHuby Intelligence',   accent: '#3b82f6', emoji: '🌐' },
  'copy-trade-iq':          { id: '2c3fdf9f-0729-498c-9dd1-109dc9846977', route: 'copytrade',    name: 'CopyVexx',               accent: '#3b82f6', emoji: '🔁' },
  'expat-invest-iq':        { id: '544439af-5fa1-4e38-b547-588d7fbdc5d7', route: 'expat',        name: 'ExpatInvestIQ',          accent: '#3b82f6', emoji: '🌍' },
  // Legacy / non-cron portals still live
  'company-pedia':          { id: 'aa04790b-9aed-4fa9-867d-3481adc828c5', route: 'wiki',         name: 'Company-Pedia',          accent: '#3b82f6', emoji: '📚' },
  'press-central':          { id: '104ceccb-e3d0-4979-85be-b7297abb7f90', route: 'pressroom',    name: 'Press Central',          accent: '#3b82f6', emoji: '📰' },
  'trade-board':            { id: 'd020965e-d84d-4c9e-a068-d3b90f6902d0', route: 'forum',        name: 'Trade Board',            accent: '#3b82f6', emoji: '💬' },
  'global-trade-assoc':     { id: '1972c09e-a68e-4997-b2a8-00756ead609c', route: 'association',  name: 'Global Trade Assoc',     accent: '#3b82f6', emoji: '🌐' },
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
