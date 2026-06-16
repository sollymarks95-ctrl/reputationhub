export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const JEWISH = ['jewish-news-now','jewish-property-report','aliya-today']

const FLAG: Record<string,string> = {
  US:'🇺🇸',GB:'🇬🇧',IL:'🇮🇱',DE:'🇩🇪',FR:'🇫🇷',AU:'🇦🇺',CA:'🇨🇦',IN:'🇮🇳',
  SG:'🇸🇬',AE:'🇦🇪',NL:'🇳🇱',CH:'🇨🇭',JP:'🇯🇵',BR:'🇧🇷',ZA:'🇿🇦',MX:'🇲🇽',
  IT:'🇮🇹',ES:'🇪🇸',SE:'🇸🇪',PL:'🇵🇱',NG:'🇳🇬',TR:'🇹🇷',IE:'🇮🇪',KR:'🇰🇷',
  RU:'🇷🇺',UA:'🇺🇦',AT:'🇦🇹',BE:'🇧🇪',PT:'🇵🇹',CN:'🇨🇳',HK:'🇭🇰',
  AR:'🇦🇷',CO:'🇨🇴',CL:'🇨🇱',PE:'🇵🇪',Unknown:'🌍',
}

const COUNTRY_NAMES: Record<string,string> = {
  US:'United States',GB:'United Kingdom',IL:'Israel',DE:'Germany',FR:'France',
  AU:'Australia',CA:'Canada',IN:'India',SG:'Singapore',AE:'UAE',NL:'Netherlands',
  CH:'Switzerland',JP:'Japan',BR:'Brazil',ZA:'South Africa',MX:'Mexico',
  IT:'Italy',ES:'Spain',SE:'Sweden',PL:'Poland',IE:'Ireland',KR:'South Korea',
  RU:'Russia',UA:'Ukraine',AT:'Austria',BE:'Belgium',PT:'Portugal',
  CN:'China',HK:'Hong Kong',AR:'Argentina',CO:'Colombia',CL:'Chile',PE:'Peru',
}

const SITE_DOMAINS: Record<string,string> = {
  'jewish-news-now': 'jewishnewsnow.com',
  'jewish-property-report': 'jewishpropertyreport.com',
  'aliya-today': 'aliyatoday.com',
}
const SITE_COLORS: Record<string,string> = {
  'jewish-news-now':'#1a56b0','jewish-property-report':'#0a7c4e','aliya-today':'#c47d1a',
}

export async function GET(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON
  )
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const today = new Date().toISOString().slice(0,10)
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10)

  // All Jewish site page views in window
  const { data: rows } = await sb
    .from('page_views')
    .select('created_at,site_slug,device,country,referrer,path')
    .in('site_slug', JEWISH)
    .gte('created_at', since)

  const all = rows || []

  // Aggregations
  const dailyMap: Record<string,number> = {}
  const siteMap: Record<string,number> = {}
  const deviceMap: Record<string,number> = {}
  const countryMap: Record<string,number> = {}
  const refMap: Record<string,number> = {}
  const pathMap: Record<string,{views:number,site:string}> = {}
  let todayViews = 0, yesterdayViews = 0

  all.forEach((v:any) => {
    const d = v.created_at.slice(0,10)
    dailyMap[d] = (dailyMap[d]||0)+1
    siteMap[v.site_slug] = (siteMap[v.site_slug]||0)+1
    deviceMap[v.device] = (deviceMap[v.device]||0)+1
    countryMap[v.country] = (countryMap[v.country]||0)+1
    if (v.referrer && v.referrer !== 'direct') refMap[v.referrer] = (refMap[v.referrer]||0)+1
    if (d===today) todayViews++
    if (d===yesterday) yesterdayViews++
    // Track top articles (paths containing /article/)
    if (v.path && v.path.includes('/article/')) {
      if (!pathMap[v.path]) pathMap[v.path] = {views:0, site:v.site_slug}
      pathMap[v.path].views++
    }
  })

  // Top articles — join with news_articles for titles
  const topPaths = Object.entries(pathMap).sort((a,b)=>b[1].views-a[1].views).slice(0,20)
  const slugsToFetch = topPaths.map(([path]) => path.split('/').pop()).filter(Boolean)

  const { data: articleRows } = await sb
    .from('news_articles')
    .select('slug,title,news_site_id')
    .in('slug', slugsToFetch as string[])

  const slugToTitle: Record<string,string> = {}
  for (const a of articleRows || []) {
    slugToTitle[a.slug] = a.title
  }

  const topArticles = topPaths.map(([path, {views,site}]) => {
    const slug = path.split('/').pop() || ''
    const domain = SITE_DOMAINS[site] || site
    return {
      path, slug, views, site, domain,
      url: `https://${domain}${path}`,
      title: slugToTitle[slug] || slug.replace(/-/g,' ').replace(/^\d{4}-\d{2}-\d{2}-/,''),
      color: SITE_COLORS[site] || '#666',
    }
  })

  // Build daily array for last N days (fill gaps with 0)
  const daily: {date:string,views:number}[] = []
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(Date.now() - i*86400000).toISOString().slice(0,10)
    daily.push({ date: d, views: dailyMap[d] || 0 })
  }

  const total = all.length

  return NextResponse.json({
    total, todayViews, yesterdayViews,
    growthPct: yesterdayViews > 0 ? Math.round((todayViews-yesterdayViews)/yesterdayViews*100) : 0,
    days,
    daily,
    bySite: JEWISH.map(slug => ({
      slug, domain: SITE_DOMAINS[slug], color: SITE_COLORS[slug],
      views: siteMap[slug] || 0,
      pct: Math.round((siteMap[slug]||0)/Math.max(total,1)*100),
    })),
    byDevice: Object.entries(deviceMap).sort((a,b)=>b[1]-a[1]).map(([device,views])=>({device,views,pct:Math.round(views/Math.max(total,1)*100)})),
    byCountry: Object.entries(countryMap).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([country,views])=>({
      country, views,
      name: COUNTRY_NAMES[country] || country,
      flag: FLAG[country] || '🌍',
      pct: Math.round(views/Math.max(total,1)*100),
    })),
    byReferrer: Object.entries(refMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([referrer,views])=>({referrer,views})),
    topArticles,
  })
}
