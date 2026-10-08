import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

// Crawlable, server-rendered archive of EVERY published article for the 3 Jewish
// portals. The homepages only link ~30 recent articles and their category
// controls are JS buttons, so hundreds of articles were reachable only through
// the sitemap ("Discovered — currently not indexed" in Search Console). This
// page gives Googlebot a plain-<a> path to every article, 60 per page.

export const dynamic = 'force-dynamic'

const PER_PAGE = 60

const SITES: Record<string, { name: string; domain: string; color: string }> = {
  'aliya-today':            { name: 'AliyaToday',             domain: 'aliyatoday.com',           color: '#c47d1a' },
  'jewish-news-now':        { name: 'Jewish News Now',        domain: 'jewishnewsnow.com',        color: '#b91c1c' },
  'jewish-property-report': { name: 'Jewish Property Report', domain: 'jewishpropertyreport.com', color: '#1d4ed8' },
}

async function siteSlugFromRequest(): Promise<string> {
  const h = await headers()
  return h.get('x-site-slug') || ''
}

function pageNumber(raw?: string) {
  const n = parseInt(raw || '1', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
): Promise<Metadata> {
  const slug = await siteSlugFromRequest()
  const site = SITES[slug]
  if (!site) return { title: 'Not found', robots: 'noindex' }
  const page = pageNumber((await searchParams).page)
  const base = `https://${site.domain}`
  return {
    title: `All Articles${page > 1 ? ` — Page ${page}` : ''} | ${site.name}`,
    description: `Browse every ${site.name} article, newest first.`,
    robots: 'index,follow',
    alternates: { canonical: page > 1 ? `${base}/archive?page=${page}` : `${base}/archive` },
  }
}

export default async function ArchivePage(
  { searchParams }: { searchParams: Promise<{ page?: string }> }
) {
  const slug = await siteSlugFromRequest()
  const site = SITES[slug]
  if (!site) notFound()

  const page = pageNumber((await searchParams).page)

  const { data: siteRow } = await supabase
    .from('news_sites').select('id,name').eq('slug', slug).single()
  if (!siteRow) notFound()

  const from = (page - 1) * PER_PAGE
  const { data: articles, count } = await supabase
    .from('news_articles')
    .select('slug,title,category,published_at,excerpt', { count: 'exact' })
    .eq('news_site_id', siteRow.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  if (page > totalPages) notFound()

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'Georgia, serif', color: '#1a1a1a' }}>
      <header style={{ background: site.color, padding: '14px 24px' }}>
        <Link href="/" style={{ color: '#fff', fontWeight: 900, fontSize: 20, textDecoration: 'none' }}>
          {site.name}
        </Link>
      </header>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>All Articles</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
          {total} articles · page {page} of {totalPages}
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(articles || []).map((a: any) => (
            <li key={a.slug} style={{ padding: '14px 0', borderBottom: '1px solid #e5e5e5' }}>
              <Link
                href={`/article/${slug}/${a.slug}`}
                style={{ color: '#111', fontWeight: 700, fontSize: 17, textDecoration: 'none' }}
              >
                {a.title}
              </Link>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                {a.category ? `${a.category} · ` : ''}{a.published_at ? fmt(a.published_at) : ''}
              </div>
              {a.excerpt && (
                <p style={{ fontSize: 14, color: '#555', margin: '6px 0 0', lineHeight: 1.5 }}>
                  {String(a.excerpt).slice(0, 180)}
                </p>
              )}
            </li>
          ))}
        </ul>

        <nav aria-label="Archive pages" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <Link
              key={n}
              href={n === 1 ? '/archive' : `/archive?page=${n}`}
              style={{
                padding: '6px 12px', borderRadius: 4, fontSize: 13, textDecoration: 'none',
                border: `1px solid ${n === page ? site.color : '#ddd'}`,
                background: n === page ? site.color : '#fff',
                color: n === page ? '#fff' : '#333',
              }}
            >
              {n}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
