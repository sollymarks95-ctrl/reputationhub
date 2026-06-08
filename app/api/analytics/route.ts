import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CORS = { 'Access-Control-Allow-Origin': '*' }

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

const FLAG: Record<string,string> = {
  US:'🇺🇸',GB:'🇬🇧',IL:'🇮🇱',DE:'🇩🇪',FR:'🇫🇷',AU:'🇦🇺',CA:'🇨🇦',IN:'🇮🇳',
  SG:'🇸🇬',AE:'🇦🇪',NL:'🇳🇱',CH:'🇨🇭',JP:'🇯🇵',BR:'🇧🇷',ZA:'🇿🇦',MX:'🇲🇽',
  IT:'🇮🇹',ES:'🇪🇸',SE:'🇸🇪',PL:'🇵🇱',NG:'🇳🇬',KE:'🇰🇪',TR:'🇹🇷',RU:'🇷🇺',
  PK:'🇵🇰',PH:'🇵🇭',ID:'🇮🇩',UA:'🇺🇦',TH:'🇹🇭',MY:'🇲🇾',Unknown:'🌍',
}

function classifySource(referrer: string | null): string {
  if (!referrer || referrer === '') return 'Direct'
  const r = referrer.toLowerCase()
  if (r.includes('google') || r.includes('bing') || r.includes('yahoo') || r.includes('duckduck') || r.includes('baidu') || r.includes('yandex')) return 'Organic Search'
  if (r.includes('facebook') || r.includes('fb.com') || r.includes('instagram') || r.includes('twitter') || r.includes('x.com') || r.includes('linkedin') || r.includes('tiktok') || r.includes('youtube') || r.includes('reddit')) return 'Social'
  if (r.includes('t.co')) return 'Social'
  if (r.includes('dev.to') || r.includes('hashnode') || r.includes('medium') || r.includes('substack')) return 'Content / Backlinks'
  if (r.includes('rephuby') || r.includes('verivex') || r.includes('finvexx') || r.includes('nex-wire') || r.includes('aurexhq') || r.includes('invexhuby') || r.includes('signalixx') || r.includes('execvex') || r.includes('cryptoxos') || r.includes('bizplezx') || r.includes('fxvexx') || r.includes('tradehubiq')) return 'Internal Network'
  if (r.includes('http')) return 'Referral'
  return 'Other'
}

export async function OPTIONS() { return new Response(null,{status:204,headers:CORS}) }

export async function GET(req: NextRequest) {
  const db = getDb()
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
  const siteSlug = req.nextUrl.searchParams.get('site') || null
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)

  let query = db.from('page_views').select('*').gte('created_at', since)
  if (siteSlug) query = query.eq('site_slug', siteSlug)

  const { data: views } = await query
  const allViews = views || []

  // Total / today / yesterday / week
  const now = new Date()
  const todayViews = allViews.filter(v => new Date(v.created_at) >= todayStart).length
  const yesterdayViews = allViews.filter(v => {
    const d = new Date(v.created_at)
    const yStart = new Date(todayStart.getTime() - 86400000)
    return d >= yStart && d < todayStart
  }).length
  const weekViews = allViews.filter(v => new Date(v.created_at) >= new Date(Date.now() - 7*86400000)).length
  const growthPct = yesterdayViews ? Math.round((todayViews - yesterdayViews) / yesterdayViews * 100) : 0

  // GEO breakdown
  const countryCounts: Record<string,number> = {}
  for (const v of allViews) {
    const c = v.country || 'Unknown'
    countryCounts[c] = (countryCounts[c] || 0) + 1
  }
  const geoBreakdown = Object.entries(countryCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,15)
    .map(([code, count]) => ({
      country: code,
      flag: FLAG[code] || '🌍',
      count,
      pct: Math.round(count / allViews.length * 100) || 0
    }))

  // TRAFFIC SOURCES
  const sourceCounts: Record<string,number> = {}
  for (const v of allViews) {
    const source = classifySource(v.referrer)
    sourceCounts[source] = (sourceCounts[source] || 0) + 1
  }
  const sourceBreakdown = Object.entries(sourceCounts)
    .sort((a,b) => b[1]-a[1])
    .map(([source, count]) => ({
      source,
      count,
      pct: Math.round(count / allViews.length * 100) || 0,
      icon: source === 'Organic Search' ? '🔍' :
            source === 'Social' ? '📱' :
            source === 'Direct' ? '🔗' :
            source === 'Content / Backlinks' ? '📝' :
            source === 'Internal Network' ? '🌐' : '↗️'
    }))

  // TOP REFERRERS (actual URLs)
  const referrerCounts: Record<string,number> = {}
  for (const v of allViews) {
    if (v.referrer && v.referrer !== '') {
      try {
        const host = new URL(v.referrer).hostname.replace('www.','')
        referrerCounts[host] = (referrerCounts[host] || 0) + 1
      } catch { referrerCounts[v.referrer] = (referrerCounts[v.referrer] || 0) + 1 }
    }
  }
  const topReferrers = Object.entries(referrerCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,10)
    .map(([domain, count]) => ({ domain, count }))

  // TOP PAGES
  const pageCounts: Record<string,number> = {}
  for (const v of allViews) {
    const p = v.path || '/'
    pageCounts[p] = (pageCounts[p] || 0) + 1
  }
  const topPages = Object.entries(pageCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,10)
    .map(([path, count]) => ({ path, count }))

  // PER PORTAL breakdown
  const portalCounts: Record<string,number> = {}
  for (const v of allViews) { portalCounts[v.site_slug||'unknown'] = (portalCounts[v.site_slug||'unknown'] || 0) + 1 }
  const portalBreakdown = Object.entries(portalCounts)
    .sort((a,b) => b[1]-a[1])
    .map(([slug, count]) => ({ slug, count, pct: Math.round(count/allViews.length*100)||0 }))

  // DEVICE breakdown
  const deviceCounts: Record<string,number> = {}
  for (const v of allViews) { const d = v.device || 'Unknown'; deviceCounts[d] = (deviceCounts[d]||0)+1 }

  // DAILY TREND (last 14 days)
  const dailyTrend: Record<string,number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i*86400000)
    const key = d.toISOString().split('T')[0]
    dailyTrend[key] = 0
  }
  for (const v of allViews) {
    const key = v.created_at?.split('T')[0]
    if (key && key in dailyTrend) dailyTrend[key]++
  }
  const trend = Object.entries(dailyTrend).map(([date, count]) => ({ date, count }))

  return NextResponse.json({
    total: allViews.length,
    todayViews,
    yesterdayViews,
    weekViews,
    growthPct,
    uniqueCountries: geoBreakdown.length,
    uniquePaths: Object.keys(pageCounts).length,
    geoBreakdown,
    sourceBreakdown,
    topReferrers,
    topPages,
    portalBreakdown,
    deviceBreakdown: Object.entries(deviceCounts).map(([device,count])=>({device,count})),
    trend,
    finance: { mrr: 0 },
    days,
  }, { headers: CORS })
}
