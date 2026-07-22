// Article image selection.
//
// Primary: Openverse (api.openverse.org) — a free, keyless, no-signup search
// engine for Creative-Commons-licensed images from Flickr, Wikimedia,
// museums, NASA, Smithsonian, etc. We search using the REAL article title so
// the photo is topically relevant (e.g. "Israel bank account" returns an
// actual bank/currency photo), instead of a random unrelated stock photo.
//
// Fallback: if Openverse has no results, errors, times out, or rate-limits us,
// we fall back to the previous deterministic seed-based Picsum placeholder so
// an article NEVER ends up with a missing cover image.

const SEED_PREFIX: Record<string, string> = {
  // Jewish sites — unique prefixes so they get distinct image sets
  'jewishnewsnow.com':        'jnn',
  'jewishpropertyreport.com': 'jpr',
  'aliyatoday.com':           'at',
  // Finance sites
  'nex-wire.com':             'nw',
  'finvexx.com':              'fv',
  'bizplezx.com':             'bp',
  'aurexhq.com':              'ax',
  'verivex.co':               'vx',
  'invexhuby.com':            'ih',
  'signalixx.com':            'sx',
  'execvex.com':              'ev',
  'cryptoxos.com':            'cx',
  'fxvexx.com':               'fx',
  'tradehubiq.com':           'th',
  'rephuby.com':              'rh',
}

function cleanSeed(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 60)
}

// Deterministic placeholder — same seed always returns the same photo, so a
// re-render never flickers to a different image.
function getPlaceholderImage(category: string, slug: string, siteDomain = ''): string {
  const prefix = SEED_PREFIX[siteDomain] || siteDomain.split('.')[0]?.slice(0, 4) || 'img'
  const seed = cleanSeed(`${prefix}-${slug.slice(0, 40)}-${category.slice(0, 8)}`)
  return `https://picsum.photos/seed/${seed}/1200/630`
}

// Strip generic filler words so the search query focuses on the real subject
// of the article (numbers/years like "2026" and marketing words like "Guide"
// or "Complete" don't help image relevance and often hurt it).
function toSearchQuery(title: string): string {
  return title
    .replace(/\b(20\d{2}|guide|complete|ultimate|real|what|changed|since|mistakes?|critical|the|a|an)\b/gi, '')
    .replace(/[:\-–—'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 5)
    .join(' ')
}

export async function getArticleImage(category: string, slug: string, siteDomain = '', title = ''): Promise<string> {
  const fallback = getPlaceholderImage(category, slug, siteDomain)
  const query = toSearchQuery(title || category)
  if (!query) return fallback

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&page_size=3&mature=false`,
      { signal: controller.signal, headers: { 'User-Agent': 'RepHubyContentBot/1.0' } }
    )
    clearTimeout(timeout)
    if (!res.ok) return fallback

    const data = await res.json()
    const pick = (data?.results || []).find((r: any) => r?.url)
    if (!pick?.url) return fallback

    return pick.url as string
  } catch {
    return fallback
  }
}
