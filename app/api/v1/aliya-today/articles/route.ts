export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public REST API — AliyaToday articles
// Auth: Bearer token in Authorization header OR ?api_key= query param
// All responses are JSON with CORS enabled for 3rd-party tool integration.
//
// GET /api/v1/aliya-today/articles
// Params:
//   limit    — results per page (1-100, default 20)
//   page     — page number, 1-indexed (default 1)
//   category — filter by category slug (e.g. "Housing", "Ulpan")
//   q        — keyword search in title/excerpt
//   from     — ISO date, articles published on or after (e.g. 2026-06-01)
//   to       — ISO date, articles published on or before
//   full     — if "1", include full article body (default: excerpt only)
//
// Response shape:
// {
//   ok: true,
//   total: number,         // total matching rows (for pagination)
//   page: number,
//   limit: number,
//   totalPages: number,
//   articles: [{
//     id, slug, title, excerpt, body?, category, tags,
//     author, published_at, read_time_minutes,
//     url, cover_image_url
//   }]
// }

const API_KEY = process.env.ALIYA_API_KEY || 'AT-live-9f2e4b7c3a1d8e6f5b0c2a4d7e9f1b3c'
const SITE_SLUG = 'aliya-today'
const SITE_DOMAIN = 'aliyatoday.com'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function cors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') || ''
  const queryKey   = req.nextUrl.searchParams.get('api_key') || ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : queryKey

  if (token !== API_KEY) {
    return cors(NextResponse.json(
      { ok: false, error: 'Unauthorized. Pass your API key as: Authorization: Bearer <key> or ?api_key=<key>' },
      { status: 401 }
    ))
  }

  // ── Params ──────────────────────────────────────────────────────────────
  const sp       = req.nextUrl.searchParams
  const limit    = Math.min(Math.max(parseInt(sp.get('limit') || '20'), 1), 100)
  const page     = Math.max(parseInt(sp.get('page') || '1'), 1)
  const category = sp.get('category') || ''
  const q        = (sp.get('q') || '').trim()
  const from     = sp.get('from') || ''
  const to       = sp.get('to') || ''
  const full     = sp.get('full') === '1'
  const offset   = (page - 1) * limit

  // ── Resolve site ID ──────────────────────────────────────────────────────
  const db = getDb()
  const { data: siteRow } = await db.from('news_sites').select('id').eq('slug', SITE_SLUG).single()
  if (!siteRow) return cors(NextResponse.json({ ok: false, error: 'Site not found' }, { status: 500 }))

  // ── Query ────────────────────────────────────────────────────────────────
  const cols = [
    'id', 'slug', 'title', 'excerpt', 'category', 'tags',
    'author_name', 'published_at', 'read_time_minutes', 'cover_image_url',
    ...(full ? ['body'] : []),
  ].join(', ')

  let query = db.from('news_articles')
    .select(cols, { count: 'exact' })
    .eq('news_site_id', siteRow.id)
    .eq('status', 'published')

  if (category) query = query.ilike('category', category)
  if (q)        query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
  if (from)     query = query.gte('published_at', from)
  if (to)       query = query.lte('published_at', to)

  const { data, count, error } = await query
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return cors(NextResponse.json({ ok: false, error: error.message }, { status: 500 }))

  const articles = (data || []).map((a: any) => ({
    id:                 a.id,
    slug:               a.slug,
    title:              a.title,
    excerpt:            a.excerpt || '',
    ...(full ? { body: a.body || '' } : {}),
    category:           a.category || '',
    tags:               Array.isArray(a.tags) ? a.tags : [],
    author:             a.author_name || 'AliyaToday Editorial',
    published_at:       a.published_at,
    read_time_minutes:  a.read_time_minutes || 5,
    cover_image_url:    a.cover_image_url || null,
    url:                `https://${SITE_DOMAIN}/article/${SITE_SLUG}/${a.slug}`,
  }))

  const total = count || 0

  return cors(NextResponse.json({
    ok:         true,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    articles,
    _meta: {
      site:       'AliyaToday',
      domain:     SITE_DOMAIN,
      rss:        `https://${SITE_DOMAIN}/feed.xml`,
      docs:       `https://${SITE_DOMAIN}/api/v1/aliya-today/articles`,
      generated:  new Date().toISOString(),
    },
  }))
}
