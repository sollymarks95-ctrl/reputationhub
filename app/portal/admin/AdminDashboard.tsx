'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Build portal list dynamically from DB sites (passed as prop)
// Falls back to 5 core portals if sites prop is empty
const CORE_COLORS: Record<string,{color:string,accent:string}> = {
  'global-trade-wire':  {color:'#E03131',accent:'#FF6B6B'},
  'finance-terminal':   {color:'#1971C2',accent:'#74C0FC'},
  'business-pulse':     {color:'#6741D9',accent:'#B197FC'},
  'gold-markets-today': {color:'#B08700',accent:'#FFD43B'},
  'trust-score':        {color:'#0CA678',accent:'#63E6BE'},
}
function buildPortals(sites: any[]) {
  return [...sites].sort((a, b) => {
    // Live (indexed) portals first, then noindex ones
    if (!a.noindex && b.noindex) return -1
    if (a.noindex && !b.noindex) return 1
    return 0
  }).map((s: any) => {
    const live = !s.noindex
    const domain = s.domain || s.slug + '.com'
    const color = (CORE_COLORS[s.slug]?.color || s.primary_color || s.template_config?.primary || '#1a56db')
    const accent = CORE_COLORS[s.slug]?.accent || color + 'aa'
    const words = s.name.replace(/[^a-zA-Z0-9 ]/g,' ').trim().split(/\s+/)
    const abbr = words.length >= 2 
      ? (words[0][0] + words[1][0]).toUpperCase()
      : s.name.slice(0,2).toUpperCase()
    const publicUrl = live ? ('https://' + domain) : ('https://rephuby.com/' + s.slug)
    return { name: s.name.toUpperCase(), abbr, domain, slug: s.slug, color, accent, 
             publicUrl, live, noindex: s.noindex }
  })
}

const NAV = [
  { icon:'🏠', label:'Overview',    id:'overview'  },
  { icon:'⭐', label:'Reviews',     id:'reviews'   },
  { icon:'➕', label:'Onboard Client', id:'onboard' },
  { icon:'👥', label:'Clients',     id:'clients'   },
  { icon:'✍️', label:'Generate Content', id:'content' },
  { icon:'🎙', label:'Podcasts',    id:'podcasts'  },
  { icon:'📊', label:'Rankings',    id:'rankings'  },
  { icon:'🌐', label:'Portals',     id:'portals'   },
  { icon:'📧', label:'Subscribers', id:'subs'      },
  { icon:'⚙️', label:'API Keys',    id:'settings'  },
  { icon:'📈', label:'Analytics',   id:'analytics' },
]

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`
}

function Spinner() { return <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> }

const SITE_PODCAST_CONFIGS: Record<string, any> = {
    'global-trade-wire': { showName:'Nex-Wire Intelligence', hostName:'James Hart', hostRole:'Senior Markets Editor, Nex-Wire' },
    'finance-terminal':  { showName:'Finvexx Markets', hostName:'Marcus Webb', hostRole:'Chief Markets Analyst, Finvexx' },
    'business-pulse':    { showName:'Bizplezx Executive', hostName:'Daniel Sterling', hostRole:'Editorial Director, Bizplezx' },
    'gold-markets-today':{ showName:'AurexHQ Commodities', hostName:'Richard Stone', hostRole:'Head of Commodities Research' },
    'market-radar':      { showName:'Signalixx Signals', hostName:'Jordan Blake', hostRole:'Lead Signals Analyst, Signalixx' },
    'invest-data':       { showName:'InvexHuby Intelligence', hostName:'Michael Torres', hostRole:'Chief Investment Strategist' },
    'trust-score':       { showName:'Verivex Verified', hostName:'Nathan Chen', hostRole:'Head of Research, Verivex' },
    'executive-network': { showName:'Execvex Leadership', hostName:'Alexander Ross', hostRole:'Executive Editor, Execvex' },
  }

export default function AdminDashboard({ clients, allContent, allRankings, allPodcasts, allActivity, sites, totalArticles, totalSubscribers, allReviews = [], pendingReviews: initialPending = [], businessInquiries = [] }: any) {
  // Build portal list from DB sites prop
  const PORTALS = React.useMemo(() => buildPortals(sites || []), [sites])
  const [tab, setTab] = useState('overview')
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState(30)

  const loadAnalytics = React.useCallback(async (days=30) => {
    setAnalyticsLoading(true)
    try {
      const r = await fetch(`/api/track?secret=REDACTED_CRON_SECRET&days=${days}`)
      const d = await r.json()
      setAnalytics(d)
    } catch {}
    setAnalyticsLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'analytics' && !analytics) loadAnalytics(analyticsDays)
  }, [tab])
  const [clock, setClock] = useState('')
  const [subs, setSubs] = useState<any[]>([])
  const router = useRouter()

  // Content generation state
  const [genClient, setGenClient] = useState('')
  const [genPortal, setGenPortal] = useState('')
  const [genType, setGenType] = useState('analysis')
  const [genTopic, setGenTopic] = useState('')
  const [genResult, setGenResult] = useState<any>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')
  const [publishLoading, setPublishLoading] = useState(false)
  const [publishDone, setPublishDone] = useState('')

  // Podcast state
  const [podClient, setPodClient] = useState('')
  // Auto-select first client on load
  React.useEffect(() => { if (clients?.length && !podClient) { setPodClient(clients[0].id) } }, [clients])
  React.useEffect(() => {
    const cfg = SITE_PODCAST_CONFIGS['global-trade-wire']
    if (cfg) { setPodHost(cfg.hostName); setPodHostRole(cfg.hostRole) }
  }, [])
  const [podEpNum, setPodEpNum] = useState('')
  const [podSite, setPodSite] = useState('global-trade-wire')
  const [podGuestGender, setPodGuestGender] = useState<'auto'|'male'|'female'>('auto')
  const [podStatus, setPodStatus] = useState<{step:string;ok:boolean;msg:string}[]>([])
  const [podVideo, setPodVideo] = useState('')
  const [podDescriptUrl, setPodDescriptUrl] = useState('')
  const [podVideoLoading, setPodVideoLoading] = useState(false)
  const [podTitle, setPodTitle] = useState('')
  const [podHost, setPodHost] = useState('James Hart')
  const [podHostRole, setPodHostRole] = useState('Show Host')
  const [podGuest, setPodGuest] = useState('')
  const [podRole, setPodRole] = useState('')
  const [podTopic, setPodTopic] = useState('')
  const [podDuration, setPodDuration] = useState('20')
  const [podScript, setPodScript] = useState('')
  const [podLoading, setPodLoading] = useState(false)
  const [podSubTab, setPodSubTab] = useState<'studio'|'episodes'>('studio')
  const [livePodcasts, setLivePodcasts] = useState<any[]>(allPodcasts || [])
  const [cronRunning, setCronRunning] = useState(false)
  const [pendingReviews, setPendingReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  async function loadPendingReviews() {
    setReviewsLoading(true)
    const r = await fetch('/api/verivex/pending')
    const d = await r.json()
    setPendingReviews(d.reviews || [])
    setReviewsLoading(false)
  }

  async function moderateReview(id: string, action: 'approved' | 'rejected') {
    await fetch('/api/verivex/moderate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, status: action }) })
    setPendingReviews(prev => prev.filter(r => r.id !== id))
  }

  const refreshPodcasts = React.useCallback(async () => {
    try {
      const r = await fetch('/api/admin/get-podcasts')
      if (r.ok) { const d = await r.json(); setLivePodcasts(d.podcasts || []) }
    } catch {}
  }, [])

  // Refresh podcast list when switching to episodes tab
  useEffect(() => {
    if (podSubTab === 'episodes') refreshPodcasts()
  }, [podSubTab, refreshPodcasts])
  const [podAudioLoading, setPodAudioLoading] = useState(false)
  const [podEpisodeId, setPodEpisodeId] = useState('')
  const [podAudio, setPodAudio] = useState('')
  const [podVoice, setPodVoice] = useState('male_professional')
  const [podMsg, setPodMsg] = useState('')

  // Rankings state
  const [rankClient, setRankClient] = useState('')
  const [rankKw, setRankKw] = useState('')
  const [rankChecking, setRankChecking] = useState(false)
  const [rankResult, setRankResult] = useState<any>(null)
  const [checkAllLoading, setCheckAllLoading] = useState(false)
  const [checkAllProgress, setCheckAllProgress] = useState(0)

  // Onboard state
  const [ob, setOb] = useState({ companyName:'', websiteUrl:'', regulation:'', tier:'pro', primaryColor:'#0EA5E9', ceoName:'', accountManager:'Sarah Chen — RepHuby', keywords:'', negativeUrls:'', brandVoice:'professional' })
  const [obLoading, setObLoading] = useState(false)
  const [obResult, setObResult] = useState<any>(null)

  // API Keys state
  const [apiKeys, setApiKeys] = useState({ SEARCHAPI_KEY:'gdGyamHuvxB2PsEBFBHbozWx', SERPAPI_KEY:'gdGyamHuvxB2PsEBFBHbozWx', ELEVENLABS_KEY:'sk_0ef4f63227ad68a735dbbc14cdf18bf5f7ae06fa2789f1eb', HEYGEN_KEY:'', OPENAI_KEY:'' })
  const [keyStatus, setKeyStatus] = useState<any[]>([])
  const [keysSaved, setKeysSaved] = useState(false)

  // Auth handled by login page — /portal/admin is a private URL

  useEffect(() => {
    if (tab === 'subs') fetch('/api/admin/get-subscribers').then(r => r.json()).then(d => setSubs(d.subscribers || []))
    if (tab === 'settings') fetch('/api/admin/save-api-keys').then(r => r.json()).then(d => setKeyStatus(d.keys || []))
  }, [tab])

  const getClientBrokerName = (id: string) => clients.find((c: any) => c.id === id)?.company_name || ''
  const getClientRegulation = (id: string) => clients.find((c: any) => c.id === id)?.regulation || ''

  async function generateContent(e: React.FormEvent) {
    e.preventDefault()
    setGenLoading(true); setGenError(''); setGenResult(null); setPublishDone('')
    try {
      const portal = PORTALS.find(p => p.slug === genPortal)
      const r = await fetch('/api/admin/generate-content', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ clientId: genClient, portalSlug: genPortal, portalName: portal?.name, articleType: genType, topic: genTopic, brokerName: getClientBrokerName(genClient), regulation: getClientRegulation(genClient), ceoName: '' }) })
      const d = await r.json()
      if (d.error) { setGenError(d.error); } else { setGenResult(d) }
    } catch (e: any) { setGenError(e.message) }
    setGenLoading(false)
  }

  async function publishContent() {
    if (!genResult) return
    setPublishLoading(true)
    const portal = PORTALS.find(p => p.slug === genPortal)
    const r = await fetch('/api/admin/publish-content', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ jobId: genResult.job?.id, clientId: genClient, title: genResult.title, body: genResult.body, portalSlug: genPortal, portalName: portal?.name, articleType: genType, authorName: `${getClientBrokerName(genClient)} Editorial` }) })
    const d = await r.json()
    setPublishDone(d.url || '')
    setPublishLoading(false)
  }

  async function generateScript(e: React.FormEvent) {
    e.preventDefault()
    const mins = parseInt(podDuration) || 20
    setPodLoading(true); setPodScript(''); setPodMsg(`✍️ Writing ${mins}-minute script...`); setPodAudio(''); setPodStatus([{step:'script',ok:true,msg:`✍️ Writing ${mins}-min script with Claude (searching for real market data)...`}])
    const r = await fetch('/api/admin/generate-script', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ clientId:podClient, episodeNumber:parseInt(podEpNum)||1, title:podTitle, hostName:podHost, hostRole:podHostRole, guestName:podGuest, guestRole:podRole, topic:podTopic, durationMinutes:mins, siteSlug:podSite }) })
    const d = await r.json()
    if (d.script) {
      setPodScript(d.script)
      setPodEpisodeId(d.podcastId || '')  // ← was d.episodeId (wrong key)
      const wc = d.stats?.wordCount || d.script.split(' ').length
      const est = Math.round(wc/140)
      setPodStatus([{step:'script',ok:true,msg:`✅ Script ready — ${wc} words (~${est} min) · ${d.showName||''} · Click 🎙 or 🎬 below`}])
    } else {
      setPodStatus([{step:'script',ok:false,msg:'❌ '+(d.error||'Script generation failed')}])
    }
    setPodMsg('')
    setPodLoading(false)
  }


  async function runCronNow() {
    if (!confirm('Generate today\'s articles for all portals? Takes 2-3 minutes.')) return
    setCronRunning(true)
    try {
      const r = await fetch('/api/cron-update?secret=REDACTED_CRON_SECRET')
      const d = await r.json()
      alert(d.message || d.error || 'Cron complete!')
    } catch(e:any) { alert('Cron triggered — running in background') }
    setCronRunning(false)
  }

  async function runImageRegen() {
    if (!confirm('Regenerate images for 50 articles? Takes 2-3 minutes.')) return
    setCronRunning(true)
    try {
      const r = await fetch('/api/admin/regenerate-images?secret=REDACTED_CRON_SECRET&limit=50')
      const d = await r.json()
      alert(d.message || d.error || 'Images regenerated!')
    } catch(e:any) { alert('Image regen triggered — running in background') }
    setCronRunning(false)
  }

  // OPTION 1: Audio only — single endpoint
  async function generateAudioPodcast() {
    console.log('generateAudioPodcast called', { podClient, podSite, podHost, podTopic })
    if (!podClient) { alert('❌ Select a client first'); return }
    if (!podTopic?.trim()) { alert('❌ Fill in the Topic field first'); return }
    
    setPodLoading(true)
    setPodScript('')
    setPodAudio('')
    setPodMsg('✍️ Writing script and generating audio... (~60 seconds)')
    
    try {
      const r = await fetch('/api/admin/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: podClient,
          siteSlug: podSite || 'global-trade-wire',
          hostName: podHost,
          guestName: podGuest,
          guestRole: podRole,
          guestGender: podGuestGender,
          topic: podTopic,
          title: podTitle,
          episodeNumber: parseInt(podEpNum) || 1,
          durationMinutes: parseInt(podDuration) || 5,
        })
      })
      
      const d = await r.json()
      
      if (!r.ok || !d.audioUrl) {
        const errMsg = d.error || 'Unknown error'
        setPodMsg('❌ ' + errMsg)
        alert('❌ Podcast failed: ' + errMsg)
        setPodLoading(false)
        return
      }
      
      setPodScript(d.script || '')
      setPodAudio(d.audioUrl)
      setPodMsg(`✅ Done! ${d.words} words, ${d.segments} segments. Host: ${d.host} · Guest: ${d.guest}`)
      await refreshPodcasts()
      
    } catch(e: any) {
      const msg = e.message || 'Network error'
      setPodMsg('❌ Error: ' + msg)
      alert('❌ Podcast error: ' + msg)
    }
    
    setPodLoading(false)
  }

  // OPTION 2: Full video podcast
  async function generateVideoPodcast() {
    if (!podClient) { alert('Select a client first'); return }
    setPodLoading(true); setPodScript(''); setPodAudio(''); setPodVideo(''); setPodDescriptUrl(''); setPodMsg('✍️ Writing script...')
    try {
      const sr = await fetch('/api/admin/generate-script', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ clientId:podClient, episodeNumber:parseInt(podEpNum)||1, title:podTitle, hostName:podHost, hostRole:podHostRole, guestName:podGuest, guestRole:podRole, topic:podTopic, durationMinutes:parseInt(podDuration)||20 , siteSlug:podSite }) })
      const sd = await sr.json()
      if (!sd.script) { setPodMsg('❌ Script error: '+(sd.error||'No script returned. Check Anthropic API key.')); setPodLoading(false); return }
      setPodScript(sd.script); setPodEpisodeId(sd.podcastId)
      setPodMsg('🎙 Script ready. Generating audio...')
      const ar = await fetch('/api/admin/generate-audio', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ script:sd.script, podcastId:sd.podcastId, title:podTitle, clientId:podClient, guestName:podGuest, guestGender:podGuestGender, siteSlug:podSite, hostName:podHost }) })
      const ad = await ar.json()
      if (!ad.audioUrl) { setPodMsg('Audio error: '+(ad.error||'unknown')); setPodLoading(false); return }
      setPodAudio(ad.audioUrl)
      setPodMsg('🎬 Audio done. Sending to Descript for video production...')
      setPodVideoLoading(true)
      const vr = await fetch('/api/admin/generate-video', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ audioUrl:ad.audioUrl, hostName:podHost, hostRole:podHostRole, guestName:podGuest, guestRole:podRole, episodeTitle:podTitle, episodeNum:parseInt(podEpNum)||1, clientId:podClient, podcastId:sd.podcastId, duration:parseInt(podDuration)*60 }) })
      const vd = await vr.json()
      if (vd.videoUrl) setPodVideo(vd.videoUrl)
      if (vd.projectUrl||vd.descriptLink) setPodDescriptUrl(vd.projectUrl||vd.descriptLink)
      setPodMsg(vd.success ? `✅ Video podcast ready! Host: ${ad.voices?.host} · Guest: ${ad.voices?.guest}` : '✓ Audio ready — Descript project created, open to export video')
      setPodVideoLoading(false)
    } catch(e:any) { setPodMsg('Error: '+e.message); setPodVideoLoading(false) }
    setPodLoading(false)
  }

  // LEGACY: 1-click (keep for generateFullPodcast reference)
  async function generateFullPodcast(e: React.FormEvent) {
    e.preventDefault()
    if (!podClient) { alert('Select a client first'); return }
    setPodLoading(true); setPodScript(''); setPodAudio(''); setPodVideo(''); setPodDescriptUrl(''); setPodStatus([]); setPodMsg('Generating script...')
    try {
      const scriptRes = await fetch('/api/admin/generate-script', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ clientId: podClient, episodeNumber: parseInt(podEpNum)||1, title: podTitle, hostName: podHost, hostRole: podHostRole, guestName: podGuest, guestRole: podRole, topic: podTopic, durationMinutes: parseInt(podDuration)||20 , siteSlug:podSite })
      })
      const scriptData = await scriptRes.json()
      if (!scriptData.success) { setPodMsg('Script failed: ' + scriptData.error); setPodLoading(false); return }
      setPodScript(scriptData.script)
      setPodEpisodeId(scriptData.podcastId)
      setPodMsg(`✓ Script: ${scriptData.stats?.wordCount} words (~${scriptData.stats?.estimatedMinutes} min). Generating audio with ElevenLabs...`)
      // Now generate audio
      const audioRes = await fetch('/api/admin/generate-audio', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ script: scriptData.script, podcastId: scriptData.podcastId, title: podTitle, clientId: podClient, guestName: podGuest, guestGender: podGuestGender, siteSlug: podSite })
      })
      const audioData = await audioRes.json()
      if (audioData.audioUrl) {
        setPodAudio(audioData.audioUrl)
        setPodMsg(`✓ Audio complete — ${audioData.segments} segments, ${audioData.sizeKb}KB. Generating video...`)
        // Step 3: Generate video
        setPodVideoLoading(true)
        try {
          const vidRes = await fetch('/api/admin/generate-video', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              audioUrl: audioData.audioUrl,
              hostName: podHost, hostRole: podHostRole,
              guestName: podGuest, guestRole: podRole,
              episodeTitle: podTitle, episodeNum: parseInt(podEpNum)||1,
              clientId: podClient, podcastId: scriptData.podcastId,
              duration: parseInt(podDuration)*60,
            })
          })
          const vidData = await vidRes.json()
          if (vidData.videoUrl) {
            setPodVideo(vidData.videoUrl)
          }
          if (vidData.projectUrl || vidData.descriptLink) {
            setPodDescriptUrl(vidData.projectUrl || vidData.descriptLink)
          }
          if (vidData.success) {
            setPodMsg('✅ Podcast complete — audio + Descript video production ready!')
          } else {
            setPodMsg(`✓ Audio ready. Video: ${vidData.error || 'check Descript'} — MP3 available above`)
          }
        } catch (err) { setPodMsg('✓ Audio ready! Video generation failed — MP3 available above') }
        setPodVideoLoading(false)
      } else {
        setPodMsg('Audio failed: ' + (audioData.error || 'unknown error'))
      }
    } catch (e: any) { setPodMsg('Error: ' + e.message) }
    setPodLoading(false)
  }

  async function generateAudio() {
    if (!podScript) return
    setPodAudioLoading(true); setPodMsg(''); setPodSubTab('episodes')
    const r = await fetch('/api/admin/generate-audio', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ episodeId: podEpisodeId, script: podScript, voiceId: podVoice }) })
    const d = await r.json()
    setPodMsg(d.message || '')
    if (d.audioUrl && d.audioUrl.startsWith('http')) setPodAudio(d.audioUrl)
    setPodAudioLoading(false)
  }

  async function checkSingleRanking() {
    if (!rankClient || !rankKw) return
    setRankChecking(true); setRankResult(null)
    const r = await fetch('/api/admin/check-rankings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ clientId: rankClient, keyword: rankKw }) })
    const d = await r.json()
    setRankResult(d)
    setRankChecking(false)
  }

  async function checkAllRankings() {
    if (!rankClient) return
    setCheckAllLoading(true)
    const clientRankings = allRankings.filter((r: any) => r.client_id === rankClient)
    let done = 0
    for (const r of clientRankings) {
      await fetch('/api/admin/check-rankings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ clientId: rankClient, keyword: r.keyword }) })
      done++; setCheckAllProgress(Math.round((done / clientRankings.length) * 100))
    }
    setCheckAllLoading(false); setCheckAllProgress(0)
    router.refresh()
  }

  async function onboardClient(e: React.FormEvent) {
    e.preventDefault()
    setObLoading(true); setObResult(null)
    const r = await fetch('/api/admin/onboard-client', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...ob, keywords: ob.keywords.split('\n').filter(Boolean), negativeUrls: ob.negativeUrls.split('\n').filter(Boolean) }) })
    const d = await r.json()
    setObResult(d); setObLoading(false)
    if (d.success) router.refresh()
  }

  async function saveApiKeys(e: React.FormEvent) {
    e.preventDefault(); setKeysSaved(false)
    await fetch('/api/admin/save-api-keys', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(apiKeys) })
    setKeysSaved(true)
    setTimeout(() => setKeysSaved(false), 3000)
  }

  const page1 = allRankings.filter((r: any) => r.current_position > 0 && r.current_position <= 10).length
  const totalViews = allContent.reduce((s: number, c: any) => s + (c.views || 0), 0)


  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0B0F19', fontFamily:"'DM Sans',system-ui,sans-serif", color:'#F1F5F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      @keyframes progress{from{width:0}to{width:100%}}
      @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .syne{font-family:'Syne',sans-serif}
        .nav-b{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:#64748b;transition:all .2s;border:none;background:none;width:100%;text-align:left;font-family:inherit}
        .nav-b:hover{background:rgba(255,255,255,0.05);color:#F1F5F9}
        .nav-b.on{background:rgba(239,68,68,0.15);color:#EF4444;font-weight:700;border:1px solid rgba(239,68,68,0.2)}
        .card{background:linear-gradient(135deg,#141B2D,#1C2333);border:1px solid rgba(255,255,255,0.08);border-radius:12px}
        .inp{width:100%;padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#F1F5F9;font-size:13px;font-family:inherit;outline:none;transition:border .2s}
        .inp:focus{border-color:#0EA5E9}
        .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .2s;white-space:nowrap}
        .b-blue{background:linear-gradient(135deg,#0EA5E9,#818CF8);color:#fff}
        .b-blue:hover{opacity:.9;transform:translateY(-1px)}
        .b-green{background:linear-gradient(135deg,#10B981,#059669);color:#fff}
        .b-green:hover{opacity:.9}
        .b-red{background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff}
        .b-gold{background:linear-gradient(135deg,#F59E0B,#F97316);color:#000;font-weight:700}
        .b-ghost{background:rgba(255,255,255,0.06);color:#94A3B8;border:1px solid rgba(255,255,255,0.1)}
        .b-ghost:hover{border-color:#0EA5E9;color:#0EA5E9}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:700}
        .bg{background:rgba(16,185,129,0.15);color:#10B981;border:1px solid rgba(16,185,129,0.3)}
        .bb{background:rgba(14,165,233,0.15);color:#0EA5E9;border:1px solid rgba(14,165,233,0.3)}
        .br{background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.3)}
        .by{background:rgba(245,158,11,0.15);color:#F59E0B;border:1px solid rgba(245,158,11,0.3)}
        .trow:hover{background:rgba(255,255,255,0.025)}
        textarea{font-family:'DM Sans',system-ui,sans-serif;resize:vertical}
        select.inp option{background:#1C2333;color:#F1F5F9}
        label{display:block;font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:5px}
        @media(max-width:768px){.adm-sidebar{width:52px!important}.adm-label{display:none!important}}
      `}</style>

      {/* ─── SIDEBAR ─── */}
      <aside className="adm-sidebar" style={{ width:220, background:'#0D1117', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', position:'fixed', top:0, bottom:0, left:0, zIndex:50, overflow:'hidden' }}>
        <div style={{ padding:'16px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <Link href="https://rephuby.com">
            <div className="syne" style={{ fontSize:20, fontWeight:900 }}>Rep<span style={{ background:'linear-gradient(135deg,#EF4444,#F97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Huby</span></div>
          </Link>
          <div className="adm-label" style={{ fontSize:9, color:'#EF4444', fontWeight:800, letterSpacing:'.1em', marginTop:2 }}>⚙ ADMIN · COMMAND CENTER</div>
        </div>
        <div className="adm-label" style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ width:32, height:32, borderRadius:7, background:'linear-gradient(135deg,#EF4444,#DC2626)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, flexShrink:0 }}>S</div>
          <div><div style={{ fontWeight:700, fontSize:12 }}>Solly</div><div style={{ fontSize:10, color:'#475569' }}>Super Admin</div></div>
        </div>
        {/* System status */}
        <div className="adm-label" style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {[['12 Portals','Online','#10B981'],['Daily Cron','07:00 ✓','#10B981'],['AI Engine','Active','#10B981'],['DB','Connected','#10B981']].map(([l,s,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
              <span style={{ color:'#64748b' }}>{l}</span><span style={{ color:c, fontWeight:700 }}>● {s}</span>
            </div>
          ))}
        </div>
        <nav style={{ flex:1, padding:'6px', overflow:'auto' }}>
          {NAV.map(n => (
            <button key={n.id} className={`nav-b ${tab===n.id?'on':''}`} onClick={() => setTab(n.id)}>
              <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
              <span className="adm-label">{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          {/* Client portal switcher */}
          <a href="/portal/dashboard" style={{ display:'block', marginBottom:8, textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'linear-gradient(135deg,rgba(14,165,233,0.18),rgba(14,165,233,0.06))', border:'1px solid rgba(14,165,233,0.35)', borderRadius:8, cursor:'pointer', transition:'all .2s' }}>
              <span style={{ fontSize:15 }}>👤</span>
              <div className="adm-label" style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#0EA5E9' }}>Client Portal</div>
                <div style={{ fontSize:9, color:'rgba(14,165,233,0.6)' }}>switch view</div>
              </div>
              <span style={{ color:'#0EA5E9', fontSize:12 }} className="adm-label">→</span>
            </div>
          </a>
          <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer">
            <button className="btn b-ghost" style={{ width:'100%', justifyContent:'center', marginBottom:7, fontSize:11 }}>
              <span className="adm-label">📱 Telegram</span>
            </button>
          </a>
          <button onClick={() => { localStorage.removeItem('rephuby_session'); router.push('/portal') }}
            style={{ width:'100%', padding:'7px', background:'transparent', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, color:'#EF4444', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
            <span className="adm-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main style={{ marginLeft:220, flex:1, overflowY:'auto', minHeight:'100vh' }}>
        {/* Top bar */}
        <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(13,17,23,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'11px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 className="syne" style={{ fontSize:17, fontWeight:800 }}>{NAV.find(n=>n.id===tab)?.icon} {NAV.find(n=>n.id===tab)?.label}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:14, fontSize:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, color:'#10B981' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', animation:'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontFamily:'monospace' }}>{clock}</span>
            </div>
            <a href="https://nex-wire.com" target="_blank" rel="noopener noreferrer"><button className="btn b-ghost" style={{ fontSize:11 }}>View Site ↗</button></a>
          </div>
        </div>

        <div style={{ padding:'24px' }}>

          {/* ══ REVIEWS MONITOR ══ */}
          {tab === 'reviews' && (
            <div>
              {/* Stats row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
                {[
                  ['Total Reviews', allReviews.length, '#10B981'],
                  ['Pending', (initialPending.length > 0 && pendingReviews.length === 0 ? initialPending : pendingReviews).length, '#F59E0B'],
                  ['eToro Reviews', allReviews.filter((r:any)=>r.company_slug==='etoro').length, '#00C853'],
                  ['Avg eToro Rating', (()=>{ const et = allReviews.filter((r:any)=>r.company_slug==='etoro'); return et.length ? (et.reduce((s:number,r:any)=>s+r.rating,0)/et.length).toFixed(1)+'★' : 'N/A' })(), '#6366F1'],
                ].map(([label,val,color]) => (
                  <div key={label as string} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:16, textAlign:'center' }}>
                    <div style={{ fontSize:24, fontWeight:900, color: color as string }}>{val}</div>
                    <div style={{ fontSize:11, color:'#64748B', marginTop:4 }}>{label as string}</div>
                  </div>
                ))}
              </div>

              {/* eToro position spotlight */}
              <div style={{ background:'linear-gradient(135deg,#00C85315,#00C85305)', border:'1px solid #00C85330', borderRadius:12, padding:20, marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:16, color:'#00C853', marginBottom:4 }}>🏆 eToro — Client Position</div>
                    <div style={{ fontSize:13, color:'#94A3B8' }}>
                      {(()=>{ const et=allReviews.filter((r:any)=>r.company_slug==='etoro'); const avg=et.length?et.reduce((s:number,r:any)=>s+r.rating,0)/et.length:0; return `${et.length} reviews · ${avg.toFixed(1)}★ avg · ${et.filter((r:any)=>r.is_pinned).length} pinned (featured)` })()}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:32, fontWeight:900, color:'#00C853' }}>
                      {(()=>{ const et=allReviews.filter((r:any)=>r.company_slug==='etoro'); return et.length ? (et.reduce((s:number,r:any)=>s+r.rating,0)/et.length).toFixed(1) : 'N/A' })()}
                    </div>
                    <div style={{ fontSize:11, color:'#64748B' }}>TrustScore</div>
                  </div>
                </div>
              </div>

              {/* Platform breakdown */}
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20, marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>📊 All Platform Rankings</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                  {['etoro','ic-markets','pepperstone','ftmo','binance','coinbase','xm','interactive-brokers','plus500','myforexfunds'].map(slug => {
                    const revs = allReviews.filter((r:any)=>r.company_slug===slug);
                    const avg = revs.length ? revs.reduce((s:number,r:any)=>s+r.rating,0)/revs.length : 0;
                    const isClient = slug === 'etoro';
                    return (
                      <div key={slug} style={{ background: isClient?'rgba(0,200,83,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${isClient?'#00C85330':'rgba(255,255,255,0.06)'}`, borderRadius:8, padding:12, textAlign:'center' }}>
                        <div style={{ fontSize:13, fontWeight:isClient?800:600, color:isClient?'#00C853':'#94A3B8', marginBottom:4 }}>{slug.split('-')[0].toUpperCase()}</div>
                        <div style={{ fontSize:18, fontWeight:900, color:avg>=4?'#10B981':avg>=3?'#F59E0B':'#EF4444' }}>{avg>0?avg.toFixed(1):'—'}</div>
                        <div style={{ fontSize:10, color:'#475569' }}>{revs.length} reviews</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pending moderation */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ fontSize:16, fontWeight:700 }}>⏳ Pending Moderation ({(initialPending.length > 0 && pendingReviews.length === 0 ? initialPending : pendingReviews).length})</h3>
                <button onClick={loadPendingReviews} className="btn b-blue" style={{ fontSize:12 }}>🔄 Refresh</button>
              </div>
              {((initialPending.length > 0 && pendingReviews.length === 0 ? initialPending : pendingReviews).length === 0) ? (
                <div style={{ textAlign:'center', padding:32, color:'#475569', border:'1px dashed #334155', borderRadius:12, marginBottom:20 }}>
                  <div style={{ fontWeight:600 }}>No pending reviews ✅</div>
                </div>
              ) : (initialPending.length > 0 && pendingReviews.length === 0 ? initialPending : pendingReviews).map((r: any) => (
                <div key={r.id} style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:18, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{r.title}</span>
                        <span style={{ background:r.rating>=4?'#10B98120':'#EF444420', color:r.rating>=4?'#10B981':'#EF4444', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700 }}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                        </span>
                        {r.verified_email && <span style={{ fontSize:10, background:'#10B98115', color:'#10B981', padding:'2px 6px', borderRadius:4 }}>Email Verified</span>}
                      </div>
                      <div style={{ fontSize:12, color:'#64748B' }}>{r.reviewer_name} · {r.reviewer_location||'Unknown'} · {new Date(r.created_at).toLocaleDateString()}</div>
                      <div style={{ fontSize:11, color:'#F59E0B', marginTop:2 }}>Platform: <strong>{r.company_name}</strong></div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <button onClick={() => moderateReview(r.id, 'approved')} className="btn b-green" style={{ fontSize:11, padding:'6px 14px' }}>✅ Approve</button>
                      <button onClick={() => moderateReview(r.id, 'rejected')} className="btn b-ghost" style={{ fontSize:11, padding:'6px 14px', color:'#EF4444', borderColor:'#EF4444' }}>❌ Reject</button>
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:'#94A3B8', lineHeight:1.6, background:'rgba(0,0,0,0.2)', padding:'10px 14px', borderRadius:6 }}>{r.review_text}</p>
                </div>
              ))}

              {/* Business inquiries */}
              {businessInquiries.length > 0 && (
                <div style={{ marginTop:24 }}>
                  <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>🏢 Business Inquiries ({businessInquiries.length})</h3>
                  {businessInquiries.map((b: any) => (
                    <div key={b.id} style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, padding:16, marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{b.company} <span style={{ fontSize:11, background:'#6366F120', color:'#818CF8', padding:'2px 8px', borderRadius:4, marginLeft:8 }}>{b.plan}</span></div>
                          <div style={{ fontSize:12, color:'#64748B' }}>{b.contact_name} · {b.email}{b.phone?` · ${b.phone}`:''}</div>
                          {b.website && <div style={{ fontSize:12, color:'#6366F1', marginTop:2 }}>{b.website}</div>}
                          {b.message && <div style={{ fontSize:12, color:'#94A3B8', marginTop:4 }}>{b.message}</div>}
                        </div>
                        <div style={{ fontSize:11, color:'#475569', textAlign:'right', flexShrink:0 }}>
                          <div style={{ marginBottom:4 }}>{new Date(b.created_at).toLocaleDateString()}</div>
                          <span style={{ background:b.status==='pending'?'#F59E0B20':'#10B98120', color:b.status==='pending'?'#F59E0B':'#10B981', padding:'2px 8px', borderRadius:4, fontWeight:600 }}>{b.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              {/* Manual cron controls */}
              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                <button onClick={runCronNow} disabled={cronRunning} style={{ padding:'8px 18px', background:cronRunning?'#334155':'linear-gradient(135deg,#10B981,#059669)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:cronRunning?'not-allowed':'pointer', fontSize:12 }}>
                  {cronRunning ? '⏳ Running...' : '🗞️ Generate Today\'s Articles'}
                </button>
                <button onClick={runImageRegen} disabled={cronRunning} style={{ padding:'8px 18px', background:cronRunning?'#334155':'linear-gradient(135deg,#6366F1,#4F46E5)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:cronRunning?'not-allowed':'pointer', fontSize:12 }}>
                  {cronRunning ? '⏳ Running...' : '🖼️ Regenerate Images'}
                </button>
                <span style={{ fontSize:11, color:'#475569', alignSelf:'center' }}>Auto-runs daily 10am IL · Next: tomorrow</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[{l:'Active Clients',v:clients.length,i:'👥',c:'#EF4444'},{l:'Articles Live',v:totalArticles?.toLocaleString(),i:'📰',c:'#0EA5E9'},{l:'Newsletter Subs',v:totalSubscribers,i:'📧',c:'#10B981'},{l:'Page 1 Keywords',v:page1,i:'🎯',c:'#F59E0B'}].map(k => (
                  <div key={k.l} className="card" style={{ padding:'18px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><span style={{ fontSize:22 }}>{k.i}</span><div style={{ width:8, height:8, borderRadius:'50%', background:k.c, animation:'pulse 2s ease-in-out infinite', marginTop:4 }} /></div>
                    <div className="syne" style={{ fontSize:32, fontWeight:900, color:k.c, lineHeight:1, marginBottom:3 }}>{k.v}</div>
                    <div style={{ fontSize:13, color:'#94A3B8' }}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
                {/* Portal grid */}
                <div className="card" style={{ padding:20 }}>
                  <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>🌐 12-Portal Network</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {sites.map((s: any) => {
                      const p = PORTALS.find(p => p.slug === s.slug)
                      return (
                        <a key={s.id} href={PORTALS.find(pp=>pp.slug===s.slug)?.publicUrl || `https://rephuby.com/${p?.route||'news'}/${s.slug}`} target="_blank" rel="noopener noreferrer">
                          <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:`1px solid ${s.primary_color}30`, borderLeft:`3px solid ${s.primary_color}`, borderRadius:8 }}>
                            <div style={{ fontWeight:700, fontSize:12, color:'#F1F5F9' }}>{s.name}</div>
                            <div style={{ fontSize:10, color:'#10B981', marginTop:2 }}>● Live</div>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
                {/* Activity */}
                <div className="card" style={{ padding:20 }}>
                  <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>⚡ Activity</div>
                  {allActivity.slice(0,8).map((a: any, i: number) => (
                    <div key={i} style={{ display:'flex', gap:8, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{a.type==='rank_improved'?'🚀':a.type==='article_published'?'📰':a.type==='podcast_ready'?'🎙':a.type==='portal_activated'?'✅':'⚡'}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, color:'#F1F5F9', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
                        <div style={{ fontSize:10, color:'#475569' }}>{timeAgo(a.created_at)} ago</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Quick actions */}
              <div className="card" style={{ padding:18 }}>
                <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:12 }}>⚡ Quick Actions</div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <button className="btn b-blue" onClick={() => setTab('onboard')}>➕ Onboard New Client</button>
                  <button className="btn b-green" onClick={() => setTab('content')}>✍️ Generate Article</button>
                  <button className="btn b-gold" onClick={() => setTab('podcasts')}>🎙 Create Podcast</button>
                  <button className="btn b-ghost" onClick={() => setTab('rankings')}>📊 Check Rankings</button>
                  <a href="/api/cron-update" target="_blank"><button className="btn b-ghost">🤖 Trigger Daily Articles</button></a>
                  <a href="https://supabase.com/dashboard/project/gykxxhxsakxhfuutgobb" target="_blank"><button className="btn b-ghost">🗄 Supabase DB</button></a>
                </div>
              </div>
            </div>
          )}

          {/* ══ ONBOARD CLIENT ══ */}
          {tab === 'onboard' && (
            <div style={{ animation:'slideIn .3s ease', maxWidth:720 }}>
              {obResult?.success ? (
                <div className="card" style={{ padding:28, textAlign:'center' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                  <div className="syne" style={{ fontSize:22, fontWeight:800, color:'#10B981', marginBottom:8 }}>{obResult.client.company_name} Onboarded!</div>
                  <div style={{ fontSize:14, color:'#64748b', marginBottom:20 }}>{obResult.portalsAssigned} portals activated · {obResult.keywordsAdded} keywords tracking · {obResult.client.tier?.toUpperCase()} plan</div>
                  <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, padding:14, marginBottom:20, fontSize:13, color:'#94A3B8', textAlign:'left' }}>
                    <strong style={{color:'#10B981'}}>Auto-generated keywords:</strong><br/>
                    {obResult.keywords?.map((k: string) => <span key={k} style={{ display:'inline-block', margin:'2px 4px', padding:'2px 8px', background:'rgba(255,255,255,0.06)', borderRadius:4, fontSize:11 }}>{k}</span>)}
                  </div>
                  <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button className="btn b-green" onClick={() => setTab('content')}>Generate First Articles →</button>
                    <button className="btn b-ghost" onClick={() => { setObResult(null); setOb({...ob, companyName:'', websiteUrl:'', ceoName:'', keywords:'', negativeUrls:''}) }}>Onboard Another</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding:28 }}>
                  <div className="syne" style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>➕ Onboard New Client</div>
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:24 }}>Creates client profile, assigns portals, generates brand keywords, and sets up full tracking dashboard.</p>
                  <form onSubmit={onboardClient}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      {[
                        {k:'companyName',l:'Broker / Company Name *',ph:'e.g. eToro',full:false},
                        {k:'websiteUrl',l:'Website URL',ph:'https://www.etoro.com',full:false},
                        {k:'regulation',l:'Regulation',ph:'e.g. CySEC / FCA / ASIC',full:false},
                        {k:'ceoName',l:'CEO / Key Contact Name',ph:'e.g. Alex Chen',full:false},
                        {k:'accountManager',l:'Account Manager',ph:'Sarah Chen — RepHuby',full:false},
                      ].map(f => (
                        <div key={f.k} style={{ gridColumn:f.full?'1/-1':'auto' }}>
                          <label>{f.l}</label>
                          <input className="inp" value={(ob as any)[f.k]} onChange={e => setOb({...ob,[f.k]:e.target.value})} placeholder={f.ph} required={f.k==='companyName'} />
                        </div>
                      ))}
                      <div>
                        <label>Plan Tier</label>
                        <select className="inp" value={ob.tier} onChange={e => setOb({...ob,tier:e.target.value})}>
                          <option value="starter">Starter ($5,000/mo) — 5 portals</option>
                          <option value="pro">Pro ($9,500/mo) — All 12 portals</option>
                          <option value="enterprise">Enterprise — Custom</option>
                        </select>
                      </div>
                      <div>
                        <label>Brand Color</label>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <input type="color" value={ob.primaryColor} onChange={e => setOb({...ob,primaryColor:e.target.value})} style={{ width:44, height:36, border:'none', background:'none', cursor:'pointer' }} />
                          <input className="inp" value={ob.primaryColor} onChange={e => setOb({...ob,primaryColor:e.target.value})} style={{ flex:1 }} />
                        </div>
                      </div>
                      <div style={{ gridColumn:'1/-1' }}>
                        <label>Brand Keywords (one per line — or leave blank for auto-generation)</label>
                        <textarea className="inp" value={ob.keywords} onChange={e => setOb({...ob,keywords:e.target.value})} placeholder={"etoro review\netoro scam\netoro legit"} rows={4} />
                      </div>
                      <div style={{ gridColumn:'1/-1' }}>
                        <label>Negative URLs to Bury (one per line — links currently ranking that we need to push down)</label>
                        <textarea className="inp" value={ob.negativeUrls} onChange={e => setOb({...ob,negativeUrls:e.target.value})} placeholder={"https://forexpeacearmy.com/...\nhttps://reddit.com/..."} rows={3} />
                      </div>
                    </div>
                    <button type="submit" className="btn b-red" style={{ marginTop:20, padding:'12px 28px', fontSize:14 }} disabled={obLoading}>
                      {obLoading ? <><Spinner/> Onboarding...</> : '✅ Onboard Client & Activate Portals →'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ══ CONTENT GENERATOR ══ */}
          {tab === 'content' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'400px 1fr', gap:20, alignItems:'start' }}>
                <div className="card" style={{ padding:22 }}>
                  <div className="syne" style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>✍️ Generate Article</div>
                  <form onSubmit={generateContent}>
                    <div style={{ marginBottom:12 }}>
                      <label>Client</label>
                      <select className="inp" value={genClient} onChange={e => setGenClient(e.target.value)} required>
                        <option value="">— Select Client —</option>
                        {clients.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <label>Portal to Publish On</label>
                      <select className="inp" value={genPortal} onChange={e => setGenPortal(e.target.value)} required>
                        <option value="">— Select Portal —</option>
                        {PORTALS.map(p => <option key={p.slug} value={p.slug}>{p.name} ({p.route})</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <label>Article Type</label>
                      <select className="inp" value={genType} onChange={e => setGenType(e.target.value)}>
                        <option value="analysis">Market Analysis</option>
                        <option value="interview">CEO / Expert Interview</option>
                        <option value="review">Broker Review</option>
                        <option value="press_release">Press Release</option>
                        <option value="research">Research Report</option>
                      </select>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <label>Topic / Brief</label>
                      <textarea className="inp" value={genTopic} onChange={e => setGenTopic(e.target.value)} placeholder={"e.g. EUR/USD Q3 outlook and impact on retail traders\n\nor: CEO interview about new Tier-1 liquidity providers\n\nor: Company expansion into MENA markets"} rows={4} required />
                    </div>
                    {genError && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, padding:'9px 12px', fontSize:12, color:'#EF4444', marginBottom:12 }}>{genError}</div>}
                    <button type="submit" className="btn b-blue" style={{ width:'100%', justifyContent:'center', padding:'11px' }} disabled={genLoading}>
                      {genLoading ? <><Spinner/> Generating with Claude AI...</> : '🤖 Generate Article →'}
                    </button>
                  </form>
                </div>

                {/* Preview */}
                <div>
                  {!genResult && !genLoading && (
                    <div className="card" style={{ padding:40, textAlign:'center', color:'#475569' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>✍️</div>
                      <div style={{ fontSize:14 }}>Generated article will appear here for review before publishing</div>
                    </div>
                  )}
                  {genLoading && (
                    <div className="card" style={{ padding:40, textAlign:'center' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                        <div style={{ width:32, height:32, border:'3px solid rgba(14,165,233,0.2)', borderTopColor:'#0EA5E9', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                        <div style={{ color:'#94A3B8', fontSize:14 }}>Claude is writing your article...</div>
                        <div style={{ fontSize:12, color:'#475569' }}>Professional journalism quality · 600-800 words</div>
                      </div>
                    </div>
                  )}
                  {genResult && (
                    <div className="card" style={{ padding:22 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                        <div>
                          <div className="syne" style={{ fontSize:15, fontWeight:800 }}>Preview — {genResult.wordCount} words</div>
                          <div style={{ fontSize:11, color:'#64748b' }}>Review before publishing to {PORTALS.find(p=>p.slug===genPortal)?.name}</div>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          {publishDone ? (
                            <a href={publishDone} target="_blank" rel="noopener noreferrer"><button className="btn b-green">✅ View Live Article ↗</button></a>
                          ) : (
                            <button className="btn b-green" onClick={publishContent} disabled={publishLoading}>
                              {publishLoading ? <><Spinner/> Publishing...</> : '🚀 Publish to Portal →'}
                            </button>
                          )}
                          <button className="btn b-ghost" onClick={() => setGenResult(null)}>Regenerate</button>
                        </div>
                      </div>
                      {/* Editable title */}
                      <div style={{ marginBottom:12 }}>
                        <label>Title (editable)</label>
                        <input className="inp" value={genResult.title} onChange={e => setGenResult({...genResult, title:e.target.value})} style={{ fontWeight:700, fontSize:14 }} />
                      </div>
                      {/* Editable body */}
                      <div>
                        <label>Article Body (editable)</label>
                        <textarea className="inp" value={genResult.body} onChange={e => setGenResult({...genResult, body:e.target.value})} rows={18} style={{ fontSize:13, lineHeight:1.7 }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ PODCASTS ══ */}
          {tab === 'podcasts' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              {/* Sub-tab switcher */}
              <div style={{ display:'flex', gap:8, marginBottom:20, background:'rgba(255,255,255,0.03)', borderRadius:10, padding:4, width:'fit-content', border:'1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { id:'studio', label:'🎙 Studio', sub:'Create' },
                  { id:'episodes', label:'📻 Episodes', sub:'Listen & Download' },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setPodSubTab(t.id as any)}
                    style={{ padding:'9px 22px', borderRadius:8, border:'none', cursor:'pointer', transition:'all .2s',
                      background: podSubTab===t.id ? 'linear-gradient(135deg,#0EA5E9,#6366F1)' : 'transparent',
                      color: podSubTab===t.id ? '#fff' : '#64748b', fontWeight: podSubTab===t.id ? 700 : 500, fontSize:13 }}>
                    {t.label} <span style={{ fontSize:10, opacity:.75, marginLeft:4 }}>{t.sub}</span>
                  </button>
                ))}
              </div>

              {podSubTab === 'studio' && (
              <div style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap:20, alignItems:'start' }}>
                <div className="card" style={{ padding:22 }}>
                  <div className="syne" style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>🎙 AI Podcast Studio</div>

                  {/* Episode Templates - click to auto-fill everything */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#475569', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>Quick Episode Templates</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {[
                        { icon:'👔', label:'CEO Interview', title:'The Vision Behind {broker}: CEO Interview', guest:'James Richardson', role:'Chief Executive Officer', topic:'Company founding story, regulatory journey, why clients trust {broker}, 2026 growth strategy, what sets {broker} apart from competitors, message to potential clients' },
                        { icon:'📈', label:'Q3 Market Update', title:'Q3 2026 Market Intelligence: What Traders Need to Know', guest:'Sarah Mitchell', role:'Chief Market Analyst', topic:'EUR/USD outlook and current exchange rates, Bitcoin latest price and institutional flows, gold at current highs, Federal Reserve latest rate decision, Strait of Hormuz geopolitical risk and oil impact, best trading opportunities this quarter' },
                        { icon:'🔒', label:'Regulation & Trust', title:'Why Regulated Brokers Win in 2026', guest:'Dr. Michael Torres', role:'Head of Compliance', topic:'CySEC vs FCA vs ASIC regulation, why regulation matters for trader safety, {broker} compliance journey, client fund protection, how to verify a broker is legit, common scams to avoid' },
                        { icon:'💹', label:'Forex Deep Dive', title:'Forex Trading Mastery: Strategies That Actually Work', guest:'Elena Volkov', role:'Senior Forex Strategist', topic:'EUR/USD technical analysis 2026, impact of Fed decisions on currency pairs, GBP outlook post-UK elections, USD strength thesis, carry trade opportunities, risk management for retail traders' },
                        { icon:'₿', label:'Crypto & DeFi', title:'Bitcoin, Ethereum & the Future of Digital Assets', guest:'Alex Chen', role:'Head of Crypto Research', topic:'BTC at $76k — is this the floor?, Ethereum scaling solutions, institutional crypto adoption, how {broker} offers crypto CFDs safely, regulatory clarity in 2026, crypto vs traditional forex' },
                        { icon:'🌍', label:'Emerging Markets', title:'Emerging Market Opportunities: Where Smart Money Is Moving', guest:'Priya Sharma', role:'EM Markets Director', topic:'India forex boom, Middle East trading growth, African markets opening up, Dubai financial hub expansion, how geopolitical shifts create trading opportunities, {broker} global expansion' },
                        { icon:'🛡️', label:'Scam Fighter', title:'How to Spot a Fake Broker — The Complete Guide', guest:'Robert Lawson', role:'Financial Investigations Analyst', topic:'Warning signs of unregulated brokers, how to check FCA/CySEC registration, common withdrawal scam tactics, why {broker} is different, what to do if you\'ve been scammed, RegTech tools for safety' },
                        { icon:'📊', label:'Trading Psychology', title:'The Mental Edge: Why Traders Fail and How to Win', guest:'Dr. Anna Williams', role:'Trading Psychologist', topic:'Why 70% of retail traders lose money, emotion vs strategy, the discipline framework used by hedge funds, how {broker} tools help manage risk, building a consistent trading routine, mindset of profitable traders' },
                      ].map((t) => {
                        const client = clients.find((c: any) => c.id === podClient)
                        const brokerName = client?.company_name || 'our broker'
                        return (
                          <button key={t.label} type="button"
                            className="btn b-ghost"
                            style={{ justifyContent:'flex-start', gap:8, fontSize:11, padding:'8px 12px', textAlign:'left' }}
                            onClick={() => {
                              const filled = (s: string) => s.replace(/\{broker\}/g, brokerName)
                              setPodTitle(filled(t.title))
                              setPodGuest(t.guest)
                              setPodRole(t.role)
                              setPodTopic(filled(t.topic))
                              if (!podHost) setPodHost('James Richardson')
                            }}>
                            <span style={{ fontSize:16, flexShrink:0 }}>{t.icon}</span>
                            <span style={{ fontWeight:700 }}>{t.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <form onSubmit={generateScript}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                      <div>
                        <label>Client</label>
                        <select className="inp" value={podClient} onChange={e => setPodClient(e.target.value)} required>
                          <option value="">— Select Client —</option>
                          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label>Publish to Portal</label>
                        <select className="inp" value={podSite} onChange={e => {
                          setPodSite(e.target.value)
                          const cfg = SITE_PODCAST_CONFIGS[e.target.value]
                          if (cfg) { setPodHost(cfg.hostName); setPodHostRole(cfg.hostRole) }
                        }}>
                          <option value="">— Select Site —</option>
                          {PORTALS.map(p => <option key={p.slug} value={p.slug}>{p.name} ({p.domain})</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <div><label>Host Name</label><input className="inp" value={podHost} onChange={e => setPodHost(e.target.value)} placeholder="James Richardson" /></div>
                      <div><label>Host Role / Title</label><input className="inp" value={podHostRole} onChange={e => setPodHostRole(e.target.value)} placeholder="Show Host" /></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <div><label>Episode #</label><input className="inp" value={podEpNum} onChange={e => setPodEpNum(e.target.value)} placeholder="1" type="number" min="1" /></div>
                      <div><label>Duration (min)</label><input className="inp" value={podDuration} onChange={e => setPodDuration(e.target.value)} placeholder="20" type="number" /></div>
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <label>Episode Title</label>
                      <input className="inp" value={podTitle} onChange={e => setPodTitle(e.target.value)} placeholder="Click a template above or type your own title" required />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:8 }}>
                      <div><label>Guest Name</label><input className="inp" value={podGuest} onChange={e => setPodGuest(e.target.value)} placeholder="e.g. Dr. Sarah Mitchell" /></div>
                      <div><label>Guest Role / Title</label><input className="inp" value={podRole} onChange={e => setPodRole(e.target.value)} placeholder="e.g. Chief Analyst" /></div>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <label>Guest Voice Gender <span style={{fontSize:10,color:'#475569'}}>(picks consistent ElevenLabs voice)</span></label>
                      <div style={{ display:'flex', gap:8, marginTop:6 }}>
                        {(['auto','male','female'] as const).map(g => (
                          <button key={g} type="button" onClick={() => setPodGuestGender(g)}
                            style={{ flex:1, padding:'7px', border:`1px solid ${podGuestGender===g?'#0EA5E9':'rgba(255,255,255,0.1)'}`, borderRadius:6, background:podGuestGender===g?'rgba(14,165,233,0.15)':'transparent', color:podGuestGender===g?'#0EA5E9':'#64748b', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            {g==='auto'?'🎲 Auto':g==='male'?'👔 Male':'👩 Female'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <label>Topic / Key Points</label>
                      <textarea className="inp" value={podTopic} onChange={e => setPodTopic(e.target.value)} rows={4} placeholder="Click a template above — it auto-fills with trending topics, market data, and talking points" required />
                    </div>
                    {/* TWO OUTPUT OPTIONS */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:8 }}>
                      {/* OPTION 1: AUDIO PODCAST */}
                      <button type="button" onClick={generateAudioPodcast} disabled={podLoading && !podScript}
                        style={{ padding:'14px 10px', background:'linear-gradient(135deg,#10B981,#059669)', border:'none', borderRadius:10, color:'#fff', cursor: (podLoading&&!podScript)?'not-allowed':'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:24 }}>🎙</span>
                        <span style={{ fontWeight:800, fontSize:13 }}>Audio Podcast</span>
                        <span style={{ fontSize:10, opacity:0.85 }}>Script → ElevenLabs → MP3</span>
                      </button>
                      {/* OPTION 2: VIDEO PODCAST */}
                      <button type="button" onClick={generateVideoPodcast} disabled={podLoading && !podScript}
                        style={{ padding:'14px 10px', background:'linear-gradient(135deg,#6366F1,#4F46E5)', border:'none', borderRadius:10, color:'#fff', cursor: (podLoading&&!podScript)?'not-allowed':'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:24 }}>🎬</span>
                        <span style={{ fontWeight:800, fontSize:13 }}>Video Podcast</span>
                        <span style={{ fontSize:10, opacity:0.85 }}>Script → Audio → Descript</span>
                      </button>
                    </div>
                    {/* Persistent step-by-step status — shows while loading AND after */}
                    {podStatus.length > 0 && (
                      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, overflow:'hidden' }}>
                        {podStatus.map((s, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom: i<podStatus.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: !s.ok ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
                            {i === podStatus.length-1 && podLoading
                              ? <div style={{ width:14, height:14, border:'2px solid rgba(14,165,233,0.3)', borderTopColor:'#0EA5E9', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />
                              : <span style={{ fontSize:14, flexShrink:0 }}>{s.ok ? '✓' : '✗'}</span>
                            }
                            <span style={{ fontSize:12, color: s.ok ? '#94A3B8' : '#EF4444' }}>{s.msg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="submit" className="btn b-ghost" style={{ width:'100%', justifyContent:'center', fontSize:11, marginTop:4 }} disabled={podLoading}>
                      📝 Script Only (review before generating)
                    </button>
                  </form>

                  {/* PROGRESS & OUTPUT — top of panel when active */}
                  {(podStatus.length > 0 || podAudio || podVideo) && (
                    <div style={{ marginBottom: podScript ? 16 : 0 }}>

                      {/* Step log */}
                      {podStatus.length > 0 && (
                        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, overflow:'hidden', marginBottom:12 }}>
                          {podStatus.map((s, i) => (
                            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 14px', borderBottom: i<podStatus.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background:!s.ok?'rgba(239,68,68,0.06)':'transparent' }}>
                              {i === podStatus.length-1 && podLoading
                                ? <div style={{ width:13,height:13,border:'2px solid rgba(14,165,233,0.3)',borderTopColor:'#0EA5E9',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0,marginTop:1 }}/>
                                : <span style={{fontSize:13,flexShrink:0,marginTop:1}}>{s.ok?'✅':'❌'}</span>
                              }
                              <span style={{ fontSize:12, color:s.ok?'#94A3B8':'#EF4444', lineHeight:1.4 }}>{s.msg}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Audio player */}
                      {podAudio && (
                        <div style={{ marginBottom:12 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'#10B981', letterSpacing:'.06em', marginBottom:8 }}>🎙 AUDIO PODCAST</div>
                          <audio controls style={{ width:'100%', borderRadius:6, background:'#0B0F19', marginBottom:6 }} src={podAudio}/>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                            <a href={podAudio} download="podcast.mp3"><button className="btn b-green" style={{ width:'100%', justifyContent:'center', fontSize:11 }}>⬇️ Download MP3</button></a>
                            <a href={podAudio} target="_blank" rel="noopener noreferrer"><button className="btn b-ghost" style={{ width:'100%', justifyContent:'center', fontSize:11 }}>🔗 Open in new tab</button></a>
                          </div>
                        </div>
                      )}

                      {/* Video output */}
                      {(podVideo || podDescriptUrl || podVideoLoading) && (
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:'#818CF8', letterSpacing:'.06em', marginBottom:8 }}>🎬 VIDEO PODCAST</div>
                          {podVideoLoading && !podVideo && (
                            <div style={{ padding:'10px 14px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:6, display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#818CF8', marginBottom:8 }}>
                              <div style={{ width:12,height:12,border:'2px solid rgba(99,102,241,0.3)',borderTopColor:'#818CF8',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0 }}/>
                              Processing in Descript — Studio Sound + captions + export...
                            </div>
                          )}
                          {podVideo && (
                            <>
                              <video controls style={{ width:'100%', borderRadius:6, maxHeight:280, marginBottom:6 }} src={podVideo}/>
                              <a href={podVideo} download="podcast.mp4"><button className="btn b-blue" style={{ width:'100%', justifyContent:'center', fontSize:11, marginBottom:6 }}>⬇️ Download MP4</button></a>
                            </>
                          )}
                          {podDescriptUrl && (
                            <a href={podDescriptUrl} target="_blank" rel="noopener noreferrer">
                              <button className="btn b-ghost" style={{ width:'100%', justifyContent:'center', fontSize:11 }}>🎬 Open in Descript (Studio Sound applied)</button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Script panel — with action buttons inside */}
                <div className="card" style={{ padding:22 }}>

                  {/* PROMINENT ACTION BUTTONS — right panel, always visible after script */}
                  {podScript && (
                    <div style={{ marginBottom:16, padding:16, background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(99,102,241,0.08))', borderRadius:12, border:'1px solid rgba(255,255,255,0.12)' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ color:'#10B981' }}>✅</span> Script ready — now generate:
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <button onClick={generateAudioPodcast} disabled={podLoading}
                          style={{ padding:'14px 10px', background: podLoading ? '#1E293B' : 'linear-gradient(135deg,#10B981,#059669)', border:'none', borderRadius:10, color:'#fff', cursor:podLoading?'not-allowed':'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, transition:'opacity .2s', opacity: podLoading ? 0.5 : 1 }}>
                          <span style={{ fontSize:22 }}>🎙</span>
                          <span style={{ fontWeight:800, fontSize:13 }}>Audio Podcast</span>
                          <span style={{ fontSize:10, opacity:.85 }}>Script → ElevenLabs → MP3</span>
                        </button>
                        <button onClick={generateVideoPodcast} disabled={podLoading}
                          style={{ padding:'14px 10px', background: podLoading ? '#1E293B' : 'linear-gradient(135deg,#6366F1,#4F46E5)', border:'none', borderRadius:10, color:'#fff', cursor:podLoading?'not-allowed':'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, transition:'opacity .2s', opacity: podLoading ? 0.5 : 1 }}>
                          <span style={{ fontSize:22 }}>🎬</span>
                          <span style={{ fontWeight:800, fontSize:13 }}>Video Podcast</span>
                          <span style={{ fontSize:10, opacity:.85 }}>Audio → Descript → MP4</span>
                        </button>
                      </div>
                      {podLoading && <div style={{ marginTop:10, fontSize:11, color:'#64748b', textAlign:'center' }}>⏳ Generating — please wait...</div>}
                    </div>
                  )}


                  {podScript ? (
                    <>
                      {/* Loading indicator while generating audio (script is already visible) */}
                      {podLoading && (
                        <div style={{ padding:'10px 14px', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:8, marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:14,height:14,border:'2px solid rgba(14,165,233,0.3)',borderTopColor:'#0EA5E9',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0 }}/>
                          <span style={{ fontSize:12, color:'#0EA5E9' }}>Generating audio — script locked for editing...</span>
                        </div>
                      )}
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                        <div>
                          <div className="syne" style={{ fontSize:14, fontWeight:800 }}>Episode Script — {podScript.split(' ').length} words (~{Math.round(podScript.split(' ').length/140)} min)</div>
                          <div style={{ fontSize:11, color:'#64748b' }}>Edit freely before generating audio</div>
                        </div>
                        <button className="btn b-ghost" style={{ fontSize:11 }} onClick={() => { navigator.clipboard.writeText(podScript) }}>📋 Copy</button>
                      </div>
                      <textarea
                        className="inp"
                        value={podScript}
                        onChange={e => setPodScript(e.target.value)}
                        rows={26}
                        style={{ fontSize:12, lineHeight:1.7, fontFamily:'monospace' }}
                      />
                    </>
                  ) : !podLoading ? (
                    <div style={{ padding:'60px 20px', textAlign:'center', color:'#475569' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>🎙</div>
                      <div style={{ fontSize:14 }}>Fill the form and click Generate Script to create a professional podcast episode script</div>
                    </div>
                  ) : (
                    <div style={{ padding:'32px 24px', textAlign:'center', background:'rgba(245,158,11,0.05)', border:'2px solid rgba(245,158,11,0.3)', borderRadius:12, margin:16 }}>
                      <div style={{ fontSize:52, marginBottom:12 }}>⏳</div>
                      <div style={{ fontSize:20, fontWeight:900, color:'#F59E0B', marginBottom:8, fontFamily:"'Syne',sans-serif" }}>
                        GENERATING PODCAST...
                      </div>
                      <div style={{ fontSize:14, color:'#cbd5e1', marginBottom:16, lineHeight:1.6 }}>
                        {podMsg || 'Writing script and generating audio with S1 voice'}
                      </div>
                      <div style={{ fontSize:13, color:'#f59e0b', fontWeight:700, background:'rgba(245,158,11,0.1)', padding:'8px 16px', borderRadius:8, display:'inline-block', marginBottom:16 }}>
                        ⚠️ Takes 60–120 seconds. Stay on this page.
                      </div>
                      <div style={{ height:8, background:'#1e293b', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:8, background:'linear-gradient(90deg,#F59E0B,#10B981)', borderRadius:4, animation:'progress 120s linear forwards', width:'0%' }} />
                      </div>
                      <div style={{ fontSize:11, color:'#475569', marginTop:8 }}>If you see this for more than 2 minutes, check the Episodes tab</div>
                    </div>
                  )}
                </div>
              </div>

              )} {/* end studio tab */}

              {/* ═══ EPISODES TAB ═══ */}
              {podSubTab === 'episodes' && (
                <div>
                  {/* Live generating banner — shows while audio is being created */}
                  {podLoading && (
                    <div style={{ marginBottom:18, padding:20, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.3)', borderRadius:12, display:'flex', alignItems:'center', gap:16 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #0EA5E9', borderTopColor:'transparent', animation:'spin 1s linear infinite', flexShrink:0 }} />
                      <div>
                        <div style={{ fontWeight:700, color:'#0EA5E9', fontSize:14 }}>Generating your podcast episode...</div>
                        <div style={{ fontSize:12, color:'#64748B', marginTop:3 }}>{podMsg || 'Processing with ElevenLabs — this takes 1-2 minutes'}</div>
                      </div>
                    </div>
                  )}
                  {/* Audio ready banner */}
                  {podAudio && !podLoading && (
                    <div style={{ marginBottom:18, padding:20, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12 }}>
                      <div style={{ fontWeight:700, color:'#10B981', fontSize:14, marginBottom:10 }}>✅ Episode ready — listen now</div>
                      <audio controls style={{ width:'100%', borderRadius:6 }} src={podAudio}/>
                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <a href={podAudio} download="podcast.mp3" style={{ flex:1 }}><button className="btn b-green" style={{ width:'100%', justifyContent:'center', fontSize:11 }}>⬇️ Download MP3</button></a>
                        <a href={podAudio} target="_blank" rel="noopener noreferrer" style={{ flex:1 }}><button className="btn b-ghost" style={{ width:'100%', justifyContent:'center', fontSize:11 }}>🔗 Open in new tab</button></a>
                      </div>
                    </div>
                  )}
                  {livePodcasts.length === 0 && !podLoading ? (
                    <div style={{ textAlign:'center', padding:'80px 20px', color:'#475569' }}>
                      <div style={{ fontSize:48, marginBottom:12 }}>🎙</div>
                      <div style={{ fontSize:16, fontWeight:600, color:'#94A3B8', marginBottom:8 }}>No episodes yet</div>
                      <div style={{ fontSize:13 }}>Go to the Studio tab and generate your first podcast episode.</div>
                      <button onClick={() => setPodSubTab('studio')} style={{ marginTop:20, padding:'10px 24px', background:'linear-gradient(135deg,#0EA5E9,#6366F1)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                        Open Studio →
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(400px,1fr))', gap:18 }}>
                      {livePodcasts.map((ep: any, i: number) => (
                        <div key={i} className="card" style={{ padding:24 }}>
                          {/* Episode header */}
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                            <div>
                              <div style={{ fontSize:11, color:'#475569', fontWeight:700, letterSpacing:'.06em' }}>EPISODE {ep.episode_number}</div>
                              <div className="syne" style={{ fontSize:17, fontWeight:800, marginTop:4, lineHeight:1.2, color:'#F1F5F9' }}>{ep.title}</div>
                            </div>
                            <span className={`badge ${ep.status==='published'?'badge-green':ep.status==='generating'?'badge-gold':'badge-blue'}`} style={{ flexShrink:0, marginLeft:10 }}>
                              {ep.status === 'generating' ? '⟳ Generating...' : ep.status === 'published' ? '✓ Published' : ep.status}
                            </span>
                          </div>

                          {/* Guest + duration info */}
                          <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
                            {ep.guest_name && <span style={{ fontSize:12, color:'#64748b' }}>👤 {ep.guest_name}</span>}
                            {ep.host_name && <span style={{ fontSize:12, color:'#64748b' }}>🎙 {ep.host_name}</span>}
                            {ep.duration_minutes > 0 && <span className="badge badge-blue">⏱ {ep.duration_minutes} min</span>}
                          </div>

                          {/* Audio player or placeholder */}
                          {ep.mp3_url ? (
                            <div style={{ marginBottom:14 }}>
                              <div style={{ fontSize:10, fontWeight:700, color:'#10B981', letterSpacing:'.06em', marginBottom:8 }}>🎵 AUDIO</div>
                              <audio controls style={{ width:'100%', borderRadius:8, outline:'none' }} src={ep.mp3_url}/>
                              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                                <a href={ep.mp3_url} download={`episode-${ep.episode_number}.mp3`} style={{ flex:1 }}>
                                  <button style={{ width:'100%', padding:'8px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:6, color:'#10B981', fontWeight:700, cursor:'pointer', fontSize:11 }}>
                                    ⬇ Download MP3
                                  </button>
                                </a>
                                <a href={ep.mp3_url} target="_blank" rel="noopener noreferrer" style={{ flex:1 }}>
                                  <button style={{ width:'100%', padding:'8px', background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.25)', borderRadius:6, color:'#0EA5E9', fontWeight:700, cursor:'pointer', fontSize:11 }}>
                                    🔗 Open in tab
                                  </button>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div style={{ height:52, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.03)', borderRadius:8, marginBottom:14, border:'1px dashed rgba(255,255,255,0.08)' }}>
                              <span style={{ fontSize:12, color:'#475569' }}>
                                {ep.status === 'generating' ? '⟳ Audio generating...' : '— No audio yet —'}
                              </span>
                            </div>
                          )}

                          {/* Created date */}
                          <div style={{ fontSize:11, color:'#334155', marginTop:4 }}>
                            {ep.published_at ? new Date(ep.published_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ RANKINGS ══ */}
          {tab === 'rankings' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20, marginBottom:20 }}>
                <div className="card" style={{ padding:20 }}>
                  <div className="syne" style={{ fontSize:15, fontWeight:800, marginBottom:14 }}>📊 Check Rankings</div>
                  <div style={{ marginBottom:12 }}>
                    <label>Client</label>
                    <select className="inp" value={rankClient} onChange={e => setRankClient(e.target.value)}>
                      <option value="">— Select Client —</option>
                      {clients.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label>Single Keyword</label>
                    <input className="inp" value={rankKw} onChange={e => setRankKw(e.target.value)} placeholder="etoro review" />
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                    <button className="btn b-blue" style={{ flex:1, justifyContent:'center' }} onClick={checkSingleRanking} disabled={rankChecking || !rankClient || !rankKw}>
                      {rankChecking ? <><Spinner/> Checking...</> : '🔍 Check This Keyword'}
                    </button>
                  </div>
                  <button className="btn b-ghost" style={{ width:'100%', justifyContent:'center' }} onClick={checkAllRankings} disabled={checkAllLoading || !rankClient}>
                    {checkAllLoading ? <><Spinner/> {checkAllProgress}% done...</> : '🔄 Check ALL Keywords for Client'}
                  </button>
                  {checkAllLoading && (
                    <div style={{ marginTop:10, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${checkAllProgress}%`, background:'linear-gradient(90deg,#0EA5E9,#10B981)', borderRadius:3, transition:'width .3s' }} />
                    </div>
                  )}

                  {rankResult && (
                    <div style={{ marginTop:14, padding:14, background:rankResult.error?'rgba(239,68,68,0.1)':rankResult.found?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)', border:`1px solid ${rankResult.error?'rgba(239,68,68,0.3)':rankResult.found?'rgba(16,185,129,0.3)':'rgba(245,158,11,0.3)'}`, borderRadius:8 }}>
                      {rankResult.error ? (
                        <div style={{ fontSize:13, color:'#EF4444', fontWeight:700 }}>❌ {rankResult.error}</div>
                      ) : rankResult.found ? (
                        <>
                          <div className="syne" style={{ fontSize:28, fontWeight:900, color:rankResult.position<=3?'#10B981':rankResult.position<=10?'#F59E0B':'#EF4444' }}>#{rankResult.position}</div>
                          {rankResult.previousPosition
                            ? <div style={{ fontSize:12, fontWeight:700, color:rankResult.position<rankResult.previousPosition?'#10B981':'#94A3B8' }}>
                                {rankResult.position<rankResult.previousPosition?`▲ Up from #${rankResult.previousPosition}`:rankResult.position>rankResult.previousPosition?`▼ Down from #${rankResult.previousPosition}`:`= Same as before #${rankResult.previousPosition}`}
                              </div>
                            : <div style={{ fontSize:12, color:'#64748B' }}>First check — no previous data</div>
                          }
                          {rankResult.url && <div style={{ fontSize:10, color:'#64748b', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rankResult.url}</div>}
                        </>
                      ) : (
                        <div style={{ fontSize:13, color:'#F59E0B', fontWeight:700 }}>Not found in top 100 results</div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop:16, padding:'10px 12px', background:'rgba(255,255,255,0.04)', borderRadius:8, fontSize:11, color:'#475569' }}>
                    <strong style={{color:'#10B981'}}>✓ SearchAPI.io connected</strong> — 100 free searches available. Real Google rankings active.
                  </div>
                </div>

                {/* Rankings table */}
                <div className="card" style={{ overflow:'hidden' }}>
                  <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between' }}>
                    <div className="syne" style={{ fontSize:14, fontWeight:800 }}>All Rankings ({allRankings.length} keywords)</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <span className="badge bg">{page1} Page 1</span>
                      <span className="badge bb">{allRankings.filter((r:any)=>r.current_position>0&&r.current_position<=3).length} Top 3</span>
                    </div>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                      <thead><tr style={{ background:'rgba(255,255,255,0.02)', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.04em' }}>
                        {['Keyword','Client','Portal','Position','Change','Status'].map(h => <th key={h} style={{ padding:'8px 14px', textAlign:'left' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {allRankings.map((r: any, i: number) => (
                          <tr key={i} className="trow" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
                            <td style={{ padding:'9px 14px', fontWeight:600 }}>{r.keyword}</td>
                            <td style={{ padding:'9px 14px', color:'#64748b', fontSize:11 }}>{getClientBrokerName(r.client_id)}</td>
                            <td style={{ padding:'9px 14px', color:'#0EA5E9', fontSize:11 }}>{r.portal_name||'—'}</td>
                            <td style={{ padding:'9px 14px' }}><span className="syne" style={{ fontSize:18, fontWeight:900, color:r.current_position<=3?'#10B981':r.current_position<=10?'#F59E0B':r.current_position>0?'#EF4444':'#475569' }}>#{r.current_position||'?'}</span></td>
                            <td style={{ padding:'9px 14px', fontSize:11, fontWeight:700 }}>
                              {r.current_position > 0 && r.previous_position > 0
                                ? r.current_position < r.previous_position
                                  ? <span style={{color:'#10B981'}}>▲ +{r.previous_position-r.current_position}</span>
                                  : r.current_position > r.previous_position
                                  ? <span style={{color:'#EF4444'}}>▼ {r.current_position-r.previous_position}</span>
                                  : <span style={{color:'#475569'}}>→</span>
                                : <span style={{color:'#475569'}}>New</span>
                              }
                            </td>
                            <td style={{ padding:'9px 14px' }}>
                              <span className={`badge ${r.current_position<=3?'bg':r.current_position<=10?'bb':r.current_position>0?'br':'by'}`}>
                                {r.current_position<=3?'🏆 Top 3':r.current_position<=10?'✓ Page 1':r.current_position>0?'Page 2+':'Unchecked'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CLIENTS ══ */}
          {tab === 'clients' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ fontSize:13, color:'#64748b' }}>{clients.length} active client{clients.length!==1?'s':''}</div>
                <button className="btn b-red" onClick={() => setTab('onboard')}>➕ Onboard New Client</button>
              </div>
              {clients.map((c: any) => (
                <div key={c.id} className="card" style={{ padding:22, marginBottom:14 }}>
                  <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:14 }}>
                    <div style={{ width:48, height:48, borderRadius:10, background:`linear-gradient(135deg,${c.primary_color||'#0EA5E9'},#1d4ed8)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20, flexShrink:0 }}>
                      {c.company_name?.charAt(0)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div className="syne" style={{ fontSize:18, fontWeight:800 }}>{c.company_name}</div>
                      <div style={{ display:'flex', gap:10, marginTop:3, fontSize:12, color:'#64748b', flexWrap:'wrap' }}>
                        {c.website_url && <a href={c.website_url} target="_blank" rel="noopener noreferrer" style={{ color:'#0EA5E9' }}>{c.website_url}</a>}
                        <span>· {c.regulation}</span>
                        <span>· <span className="badge bb">{c.tier?.toUpperCase()}</span></span>
                        <span>· AM: {c.account_manager}</span>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div className="syne" style={{ fontSize:38, fontWeight:900, color:c.primary_color||'#0EA5E9', lineHeight:1 }}>{c.brand_score}</div>
                      <div style={{ fontSize:10, color:'#475569' }}>Brand Score</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:12 }}>
                    {[
                      {l:'Content',v:allContent.filter((x:any)=>x.client_id===c.id).length,c:'#0EA5E9'},
                      {l:'Page 1 KW',v:allRankings.filter((x:any)=>x.client_id===c.id&&x.current_position>0&&x.current_position<=10).length,c:'#10B981'},
                      {l:'Podcasts',v:allPodcasts.filter((x:any)=>x.client_id===c.id&&x.status==='published').length,c:'#F59E0B'},
                      {l:'Total KW',v:allRankings.filter((x:any)=>x.client_id===c.id).length,c:'#818CF8'},
                    ].map(m => (
                      <div key={m.l} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:8, textAlign:'center' }}>
                        <div className="syne" style={{ fontSize:24, fontWeight:800, color:m.c }}>{m.v}</div>
                        <div style={{ fontSize:11, color:'#475569' }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button className="btn b-blue" style={{ fontSize:12 }} onClick={() => { setGenClient(c.id); setTab('content') }}>✍️ Generate Article</button>
                    <button className="btn b-gold" style={{ fontSize:12 }} onClick={() => { setPodClient(c.id); setTab('podcasts') }}>🎙 Create Podcast</button>
                    <button className="btn b-ghost" style={{ fontSize:12 }} onClick={() => { setRankClient(c.id); setTab('rankings') }}>📊 Check Rankings</button>
                    <Link href="/portal/dashboard"><button className="btn b-ghost" style={{ fontSize:12 }}>👁 View Client Portal</button></Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ PORTALS ══ */}
          {tab === 'portals' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                <span className="badge bg">✓ {sites.filter((s:any)=>!s.noindex).length} Live Custom Domains</span>
                <span className="badge bb">{sites.filter((s:any)=>s.noindex).length} building content — click 🚀 to flip live</span>
                <span className="badge bb">{sites.length} total sites in network</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                {buildPortals(sites).map((pp) => {
                  return (
                    <div key={pp.slug} className="card" style={{ padding:20, position:'relative', overflow:'hidden', border: pp.live ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:`${pp.color}10`, borderRadius:'50%', filter:'blur(30px)', pointerEvents:'none' }} />
                      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
                        <div style={{ width:52, height:52, borderRadius:12, background:`linear-gradient(145deg,${pp.color},${pp.color}90)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 20px ${pp.color}50`, position:'relative', overflow:'hidden' }}>
                          <div style={{ position:'absolute', top:0, left:0, right:0, height:'45%', background:'rgba(255,255,255,0.15)', borderRadius:'12px 12px 50% 50%' }} />
                          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:14, color:'#fff', letterSpacing:'-0.02em', position:'relative', zIndex:1 }}>{pp.abbr}</span>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:15,letterSpacing:'-0.03em',lineHeight:1,display:'flex',alignItems:'center',flexWrap:'wrap',gap:0}}>
                            <span style={{color:'#F1F5F9'}}>{pp.name.slice(0, Math.max(pp.name.length-3,3))}</span>
                            <span style={{color:pp.color}}>{pp.name.slice(Math.max(pp.name.length-3,3))}</span>
                          </div>
                          <div style={{ fontSize:10, fontWeight:600, color: pp.live ? '#10B981' : '#475569', marginTop:3 }}>
                            {pp.live ? '🌐 ' : ''}{pp.domain}
                          </div>
                        </div>
                        <span className={pp.live ? 'badge bg' : 'badge bb'} style={{ flexShrink:0, fontSize:10 }}>
                          {pp.live ? '✓ LIVE' : 'rephuby'}
                        </span>
                      </div>
                      <div style={{ fontSize:10, color:'#334155', marginBottom:12, fontFamily:'monospace', background:'rgba(255,255,255,0.04)', padding:'4px 8px', borderRadius:4 }}>
                        {pp.live ? pp.publicUrl.replace('https://','') : 'rephuby.com/' + pp.route + '/' + pp.slug}
                      </div>
                      {/* Article count */}
                      {(() => {
                        const count = (sites.find((s:any)=>s.slug===pp.slug) as any)?.article_count || 0
                        return null
                      })()}
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                        <a href={pp.publicUrl} target="_blank" rel="noopener noreferrer">
                          <button className={pp.live ? 'btn b-green' : 'btn b-ghost'} style={{ fontSize:11 }}>
                            {pp.live ? '🌐 Live Site ↗' : '👁 Preview ↗'}
                          </button>
                        </a>
                        <button className="btn b-blue" style={{ fontSize:11 }} onClick={() => { setGenPortal(pp.slug); setTab('content') }}>✍️ Write Article</button>
                        {!pp.live && (
                          <button className="btn" style={{ fontSize:11, background:'linear-gradient(135deg,#10B981,#059669)', color:'#fff', border:'none', cursor:'pointer' }}
                            onClick={async () => {
                              if (!confirm(`Flip ${pp.name} to LIVE? This will enable Google indexing.`)) return
                              const r = await fetch('/api/admin/flip-live', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ slug: pp.slug }) })
                              const d = await r.json()
                              if (d.ok) { alert(`✅ ${pp.name} is now LIVE and indexable!`); window.location.reload() }
                              else alert('Error: ' + d.error)
                            }}>
                            🚀 Flip to Live
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

                    {/* ══ ANALYTICS ══ */}
          {tab === 'analytics' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div className="syne" style={{ fontSize:20, fontWeight:900, color:'#F1F5F9' }}>📈 Traffic Analytics</div>
                <div style={{ display:'flex', gap:8 }}>
                  {[7,14,30].map(d => (
                    <button key={d} className={analyticsDays===d?'btn b-blue':'btn b-ghost'} style={{fontSize:11}}
                      onClick={()=>{ setAnalyticsDays(d); loadAnalytics(d) }}>
                      {d}d
                    </button>
                  ))}
                  <button className="btn b-ghost" style={{fontSize:11}} onClick={()=>loadAnalytics(analyticsDays)}>↻ Refresh</button>
                </div>
              </div>

              {analyticsLoading && <div style={{textAlign:'center',padding:60,color:'#64748b'}}>Loading analytics...</div>}

              {analytics && !analyticsLoading && (
                <>
                  {/* KPI row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                    {[
                      { label:'Total Views', value: analytics.total?.toLocaleString() || '0', sub: `Last ${analyticsDays} days`, color:'#6366f1' },
                      { label:'Today', value: analytics.todayViews?.toLocaleString() || '0', sub: analytics.growthPct >= 0 ? `+${analytics.growthPct}% vs yesterday` : `${analytics.growthPct}% vs yesterday`, color: analytics.growthPct >= 0 ? '#10B981' : '#ef4444' },
                      { label:'Yesterday', value: analytics.yesterdayViews?.toLocaleString() || '0', sub:'Full day', color:'#64748b' },
                      { label:'Daily Avg', value: analytics.daily?.length > 0 ? Math.round(analytics.total / analytics.daily.length).toLocaleString() : '0', sub:'Views per day', color:'#f59e0b' },
                    ].map(kpi => (
                      <div key={kpi.label} className="card" style={{padding:'16px 18px'}}>
                        <div style={{fontSize:11,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{kpi.label}</div>
                        <div style={{fontSize:26,fontWeight:900,color:kpi.color,fontFamily:"'Syne',sans-serif"}}>{kpi.value}</div>
                        <div style={{fontSize:11,color:'#475569',marginTop:4}}>{kpi.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Main chart — views over time */}
                  <div className="card" style={{padding:20,marginBottom:16}}>
                    <div className="syne" style={{fontSize:13,fontWeight:800,marginBottom:16,color:'#94a3b8'}}>PAGEVIEWS OVER TIME</div>
                    <div style={{display:'flex',alignItems:'flex-end',gap:3,height:140,paddingBottom:4}}>
                      {(() => {
                        const data = analytics.daily || []
                        const max = Math.max(...data.map((d:any)=>d.views), 1)
                        return data.map((d:any, i:number) => {
                          const h = Math.max(4, (d.views / max) * 128)
                          const isToday = d.date === new Date().toISOString().slice(0,10)
                          return (
                            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,cursor:'default'}} title={`${d.date}: ${d.views} views`}>
                              <div style={{width:'100%',background: isToday ? '#6366f1' : '#1e293b',height:h,borderRadius:'3px 3px 0 0',border: isToday ? '1px solid #818cf8' : '1px solid #334155',transition:'height 0.3s'}} />
                              {data.length <= 14 && <div style={{fontSize:8,color:'#334155',transform:'rotate(-45deg)',whiteSpace:'nowrap'}}>{d.date.slice(5)}</div>}
                            </div>
                          )
                        })
                      })()}
                    </div>
                    {analytics.daily?.length === 0 && (
                      <div style={{textAlign:'center',padding:'40px 0',color:'#475569',fontSize:13}}>
                        No traffic data yet — tracking will start automatically as visitors arrive.<br/>
                        <span style={{fontSize:11,color:'#334155'}}>Make sure the tracking script is on your portals.</span>
                      </div>
                    )}
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                    {/* By Site */}
                    <div className="card" style={{padding:20}}>
                      <div className="syne" style={{fontSize:12,fontWeight:800,marginBottom:14,color:'#94a3b8'}}>VIEWS BY SITE</div>
                      {(analytics.bySite?.length > 0) ? analytics.bySite.map((s:any) => {
                        const max = analytics.bySite[0]?.views || 1
                        const pct = (s.views / max) * 100
                        const pp = PORTALS.find((p:any)=>p.slug===s.slug)
                        return (
                          <div key={s.slug} style={{marginBottom:10}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                              <span style={{fontSize:12,color:'#cbd5e1',fontWeight:600}}>{pp?.name || s.slug}</span>
                              <span style={{fontSize:12,color:'#64748b'}}>{s.views.toLocaleString()}</span>
                            </div>
                            <div style={{height:4,background:'#1e293b',borderRadius:2}}>
                              <div style={{height:4,width:`${pct}%`,background:pp?.color||'#6366f1',borderRadius:2}}/>
                            </div>
                          </div>
                        )
                      }) : <div style={{color:'#475569',fontSize:12,padding:'20px 0',textAlign:'center'}}>No data yet</div>}
                    </div>

                    {/* Device + Country */}
                    <div style={{display:'flex',flexDirection:'column',gap:16}}>
                      <div className="card" style={{padding:20,flex:1}}>
                        <div className="syne" style={{fontSize:12,fontWeight:800,marginBottom:12,color:'#94a3b8'}}>DEVICE BREAKDOWN</div>
                        <div style={{display:'flex',gap:12}}>
                          {(analytics.byDevice?.length > 0 ? analytics.byDevice : [{device:'desktop',views:0},{device:'mobile',views:0}]).map((d:any) => {
                            const total = analytics.byDevice?.reduce((a:number,x:any)=>a+x.views,0)||1
                            const icons: Record<string,string> = {desktop:'🖥️',mobile:'📱',tablet:'📋'}
                            const colors: Record<string,string> = {desktop:'#6366f1',mobile:'#10B981',tablet:'#f59e0b'}
                            return (
                              <div key={d.device} style={{flex:1,textAlign:'center',padding:'12px 8px',background:'rgba(255,255,255,0.03)',borderRadius:8}}>
                                <div style={{fontSize:22,marginBottom:4}}>{icons[d.device]||'💻'}</div>
                                <div style={{fontSize:18,fontWeight:900,color:colors[d.device]||'#6366f1',fontFamily:"'Syne',sans-serif"}}>{d.views>0 ? Math.round(d.views/total*100)+'%' : '—'}</div>
                                <div style={{fontSize:10,color:'#64748b',textTransform:'capitalize'}}>{d.device}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="card" style={{padding:20,flex:1}}>
                        <div className="syne" style={{fontSize:12,fontWeight:800,marginBottom:12,color:'#94a3b8'}}>TOP COUNTRIES</div>
                        {(analytics.byCountry?.length > 0) ? analytics.byCountry.slice(0,5).map((c:any)=>(
                          <div key={c.country} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                            <span style={{fontSize:12,color:'#cbd5e1'}}>{c.country}</span>
                            <span style={{fontSize:12,color:'#64748b',fontWeight:700}}>{c.views}</span>
                          </div>
                        )) : <div style={{color:'#475569',fontSize:12,textAlign:'center',padding:'12px 0'}}>No data yet</div>}
                      </div>
                    </div>
                  </div>

                  {/* Top referrers */}
                  {analytics.byReferrer?.length > 0 && (
                    <div className="card" style={{padding:20}}>
                      <div className="syne" style={{fontSize:12,fontWeight:800,marginBottom:14,color:'#94a3b8'}}>TOP REFERRERS</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                        {analytics.byReferrer.map((r:any)=>(
                          <div key={r.referrer} style={{padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:'1px solid rgba(255,255,255,0.06)'}}>
                            <div style={{fontSize:12,fontWeight:700,color:'#cbd5e1',marginBottom:2}}>{r.referrer}</div>
                            <div style={{fontSize:18,fontWeight:900,color:'#6366f1',fontFamily:"'Syne',sans-serif"}}>{r.views}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

                    {/* ══ SUBSCRIBERS ══ */}
          {tab === 'subs' && (
            <div style={{ animation:'slideIn .3s ease' }}>
              <div className="card" style={{ overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between' }}>
                  <div className="syne" style={{ fontSize:15, fontWeight:800 }}>📧 Newsletter Subscribers ({subs.length})</div>
                  <button className="btn b-ghost" style={{ fontSize:12 }} onClick={() => {
                    const csv = ['Email,Site,Date'].concat(subs.map((s: any) => `${s.email},${s.site_name||''},${s.subscribed_at}`)).join('\n')
                    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'subscribers.csv'; a.click()
                  }}>⬇️ Export CSV</button>
                </div>
                {subs.length === 0 ? (
                  <div style={{ padding:'40px 20px', textAlign:'center', color:'#475569', fontSize:14 }}>No subscribers yet — newsletter forms are live on all 12 portal sites</div>
                ) : (
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'rgba(255,255,255,0.02)', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase' }}>
                      {['Email','Portal','Subscribed'].map(h => <th key={h} style={{ padding:'8px 14px', textAlign:'left' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {subs.map((s: any, i: number) => (
                        <tr key={i} className="trow" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                          <td style={{ padding:'9px 14px', fontWeight:600 }}>{s.email}</td>
                          <td style={{ padding:'9px 14px', color:'#0EA5E9', fontSize:12 }}>{s.site_name || 'RepHuby'}</td>
                          <td style={{ padding:'9px 14px', color:'#64748b', fontSize:11 }}>{s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ══ API KEYS / SETTINGS ══ */}
          {tab === 'settings' && (
            <div style={{ animation:'slideIn .3s ease', maxWidth:680 }}>
              <div className="card" style={{ padding:24, marginBottom:16 }}>
                <div className="syne" style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>⚙️ API Keys & Integrations</div>
                <p style={{ fontSize:13, color:'#64748b', marginBottom:22 }}>Stored securely in database. Required for live rank checking, real podcast audio generation, and video interviews.</p>
                <form onSubmit={saveApiKeys}>
                  {[
                    { k:'SEARCHAPI_KEY', l:'SearchAPI.io Key', desc:'Google rank tracking — 100 free searches/mo, upgrade at searchapi.io', link:'https://searchapi.io', placeholder:'gdGyam...', icon:'📊' },
                    { k:'ELEVENLABS_KEY', l:'ElevenLabs API Key', desc:'Premium AI voice generation for podcasts — $22/mo', link:'https://elevenlabs.io', placeholder:'xxxxxxxxx...', icon:'🎙' },
                    { k:'OPENAI_KEY', l:'OpenAI API Key', desc:'TTS audio fallback + GPT-4 (already set in Vercel env)', link:'https://platform.openai.com', placeholder:'sk-proj-...', icon:'🤖' },
                    { k:'HEYGEN_KEY', l:'HeyGen API Key', desc:'AI video talking head generation for video interviews — $29/mo', link:'https://heygen.com', placeholder:'xxxxxxxxx...', icon:'🎬' },
                  ].map(k => {
                    const existing = keyStatus.find((s: any) => s.key_name === k.k)
                    return (
                      <div key={k.k} style={{ marginBottom:18, padding:'16px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ fontSize:20 }}>{k.icon}</span>
                            <div>
                              <div style={{ fontWeight:700, fontSize:13, color:'#F1F5F9' }}>{k.l}</div>
                              <div style={{ fontSize:11, color:'#64748b' }}>{k.desc}</div>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            {existing?.is_active ? <span className="badge bg">✓ Active</span> : <span className="badge br">Not Set</span>}
                            <a href={k.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#0EA5E9' }}>Get key ↗</a>
                          </div>
                        </div>
                        <input
                          className="inp"
                          type="password"
                          placeholder={existing?.is_active ? '••••••••••••••••••• (set)' : k.placeholder}
                          value={(apiKeys as any)[k.k]}
                          onChange={e => setApiKeys({...apiKeys, [k.k]: e.target.value})}
                          style={{ fontFamily:'monospace', fontSize:12 }}
                        />
                      </div>
                    )
                  })}
                  <button type="submit" className="btn b-green" style={{ padding:'12px 28px', fontSize:14 }}>
                    {keysSaved ? '✅ Keys Saved!' : '💾 Save API Keys →'}
                  </button>
                </form>
              </div>

              {/* Infrastructure info */}
              <div className="card" style={{ padding:20 }}>
                <div className="syne" style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>🏗 Infrastructure</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    {t:'Domain',v:'rephuby.com',l:'https://vercel.com',i:'🌐'},
                    {t:'Database',v:'Supabase EU',l:'https://supabase.com/dashboard/project/gykxxhxsakxhfuutgobb',i:'🗄'},
                    {t:'Hosting',v:'Vercel (auto-deploy)',l:'https://vercel.com/sollymarks95-ctrl/reputationhub',i:'🚀'},
                    {t:'AI Cron',v:'Daily 7:00 AM IST',l:'/api/cron-update',i:'🤖'},
                  ].map(s => (
                    <a key={s.t} href={s.l} target="_blank" rel="noopener noreferrer">
                      <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.04)', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize:16, marginBottom:4 }}>{s.i}</div>
                        <div style={{ fontWeight:700, fontSize:13, color:'#F1F5F9' }}>{s.t}</div>
                        <div style={{ fontSize:11, color:'#0EA5E9' }}>{s.v}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
