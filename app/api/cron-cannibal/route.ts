// Keyword Cannibalization Detector — runs weekly
// Finds articles on the same site with 60%+ keyword overlap in titles
// Logs to cannibal_alerts table for portal admin review
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic    = 'force-dynamic'
export const maxDuration = 120

const ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3h4aHhzYWt4aGZ1dXRnb2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM1MzQsImV4cCI6MjA5NTQyOTUzNH0.xXSCYJ6WgXirWeuWSVw571CBg6CYin_BO_yeC6PVooA'
const DBURL = 'https://gykxxhxsakxhfuutgobb.supabase.co'
function getDb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||DBURL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||ANON) }

const STOPWORDS = new Set(['the','a','an','in','on','at','for','of','to','is','are','was','were',
  'how','what','why','when','where','which','who','will','can','does','do','did','has','have',
  'with','by','from','or','and','but','not','this','that','these','those','your','its','our'])

function keywords(title: string): string[] {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
}

function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const setA = new Set(a)
  return b.filter(w => setA.has(w)).length / Math.min(a.length, b.length)
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ','') ?? ''
  const expected = process.env.CRON_SECRET ?? ''
  if (expected && secret !== expected) return NextResponse.json({error:'Unauthorized'},{status:401})

  const db = getDb()
  const { data: sites } = await db.from('news_sites').select('id,slug').eq('is_live',true)
    .in('slug', ['jewish-news-now','jewish-property-report','aliya-today'])  // Jewish sites only
  if (!sites) return NextResponse.json({error:'no sites'})

  let totalAlerts = 0
  const out: any[] = []

  for (const site of sites) {
    const { data: articles } = await db.from('news_articles')
      .select('id,slug,title').eq('news_site_id',site.id).eq('status','published')
      .gte('published_at', new Date(Date.now()-60*24*60*60*1000).toISOString())
      .order('published_at',{ascending:false}).limit(300)
    if (!articles || articles.length < 2) { out.push({site:site.slug,alerts:0}); continue }

    const kw = articles.map(a => ({...a, kw: keywords(a.title)}))
    const alerts: any[] = []

    for (let i=0;i<kw.length;i++) for (let j=i+1;j<kw.length;j++) {
      const score = overlap(kw[i].kw, kw[j].kw)
      if (score >= 0.6) {
        const shared = kw[i].kw.filter((w:string) => kw[j].kw.includes(w))
        alerts.push({
          site_slug: site.slug,
          article_a_id: kw[i].id, article_a_slug: kw[i].slug, article_a_title: kw[i].title,
          article_b_id: kw[j].id, article_b_slug: kw[j].slug, article_b_title: kw[j].title,
          overlap_score: Math.round(score*100)/100,
          shared_keywords: shared, status:'open'
        })
      }
    }
    totalAlerts += alerts.length
    out.push({site:site.slug, alerts:alerts.length, examples:alerts.slice(0,2)})
  }

  return NextResponse.json({ok:true, totalAlerts, sites:out})
}
