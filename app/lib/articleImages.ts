// Article image generation using seed-based Picsum Photos
// picsum.photos/seed/{seed}/W/H — free, no auth, no ID range limit, works in all browsers
// Same seed = same image every time (deterministic per article)
// Site prefixes ensure each site gets different images even for the same article slug

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

// Returns a deterministic unique image URL per article.
// Seed format: {sitePrefix}-{slug}-{category}
// This ensures:
// - Different sites → different images for same content topic
// - Same article always gets the same image (no flicker on reload)
// - No ID range issues (picsum seed API accepts any string)
export function getArticleImage(category: string, slug: string, siteDomain = ''): string {
  const prefix = SEED_PREFIX[siteDomain] || siteDomain.split('.')[0].slice(0, 4) || 'img'
  const seed   = cleanSeed(`${prefix}-${slug.slice(0, 40)}-${category.slice(0, 8)}`)
  return `https://picsum.photos/seed/${seed}/1200/630`
}
