export const SITE_PODCAST_CONFIG: Record<string, {showName:string;hostName:string;hostRole:string;hostVoiceId:string;accentColor:string;bgColor:string;domain:string;tagline:string}> = {
  'global-trade-wire': { showName:'Nex-Wire Intelligence', hostName:'David Hart', hostRole:'Senior Markets Editor, Nex-Wire', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#E03131', bgColor:'#0D0505', domain:'nex-wire.com', tagline:'Global Trade & Market Intelligence' },
  'finance-terminal':  { showName:'Finvexx Markets', hostName:'Marcus Webb', hostRole:'Chief Markets Analyst, Finvexx', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#1565C0', bgColor:'#020C1A', domain:'finvexx.com', tagline:'Financial Markets & Investment Intelligence' },
  'business-pulse':    { showName:'Bizplezx Executive', hostName:'Claire Sterling', hostRole:'Editorial Director, Bizplezx', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#6741D9', bgColor:'#07031A', domain:'bizplezx.com', tagline:'Business Strategy & Innovation Intelligence' },
  'gold-markets-today':{ showName:'AurexHQ Commodities', hostName:'Richard Stone', hostRole:'Head of Commodities Research', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#B08700', bgColor:'#0D0A01', domain:'aurexhq.com', tagline:'Precious Metals & Commodities Intelligence' },
  'market-radar':      { showName:'Signalix Radar', hostName:'Jordan Blake', hostRole:'Lead Signals Analyst, Signalix', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#A61E4D', bgColor:'#0D0106', domain:'signalix.com', tagline:'Market Signals & Technical Analysis' },
  'invest-data':       { showName:'InvexHub Insights', hostName:'Michael Torres', hostRole:'Chief Investment Strategist', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#0B6E4F', bgColor:'#011009', domain:'invexhub.com', tagline:'Investment Intelligence & Fund Analysis' },
  'trust-score':       { showName:'Verivex Verified', hostName:'Sophie Chen', hostRole:'Head of Research, Verivex', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#0CA678', bgColor:'#011209', domain:'verivex.co', tagline:'Verified Reviews & Broker Intelligence' },
  'executive-network': { showName:'Execvex Leadership', hostName:'Alexandra Ross', hostRole:'Executive Editor, Execvex', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#3B5BDB', bgColor:'#02031A', domain:'execvex.com', tagline:'Executive Leadership & Career Intelligence' },
}
export function getSiteConfig(slug: string) {
  return SITE_PODCAST_CONFIG[slug] || { showName:'RepHuby Intelligence', hostName:'James Richardson', hostRole:'Show Host', hostVoiceId:'xMTIubkjc8KMDoYdz4bQ', accentColor:'#0EA5E9', bgColor:'#0A0E17', domain:'rephuby.com', tagline:'Financial Market Intelligence' }
}
export const MALE_VOICES = [
  { id:'onwK4e9ZLuTAKqWW03F9', name:'Daniel',  desc:'British, authoritative' },
  { id:'TxGEqnHWrfWFTfGW9XjX', name:'Josh',    desc:'Warm, professional' },
  { id:'wViXBPUzp2ZZixB1xQuM', name:'Patrick', desc:'Confident, smooth' },
  { id:'ErXwobaYiN019PkySvjV', name:'Antoni',  desc:'Well-rounded, natural' },
  { id:'pNInz6obpgDQGcFmaJgB', name:'Adam',    desc:'Deep, authoritative' },
  { id:'2EiwWnXFnvU5JabPnv8n', name:'Clyde',   desc:'Seasoned, deep' },
  { id:'VR6AewLTigWG4xSOukaG', name:'Arnold',  desc:'Powerful, commanding' },
]
export const FEMALE_VOICES = [
  { id:'21m00Tcm4TlvDq8ikWAM', name:'Rachel',  desc:'Professional, confident' },
  { id:'AZnzlk1XvdvUeBnXmlld', name:'Domi',    desc:'Strong, clear' },
  { id:'EXAVITQu4vr4xnSDxMaL', name:'Bella',   desc:'Polished, composed' },
  { id:'MF3mGyEYCl7XYWbV9V6O', name:'Elli',    desc:'Friendly, articulate' },
  { id:'oWAxZDx7w5VEj9dCyTzz', name:'Grace',   desc:'Calm, measured' },
  { id:'ThT5KcBeYPX3keUQqHPh', name:'Dorothy', desc:'Pleasant, clear' },
]
export function pickGuestVoice(guestName: string, gender: 'male'|'female'|'auto' = 'auto') {
  const pool = gender === 'male' ? MALE_VOICES : gender === 'female' ? FEMALE_VOICES : [...MALE_VOICES, ...FEMALE_VOICES]
  let h = 0; const k = guestName.toLowerCase().trim()
  for (let i=0;i<k.length;i++) h=(h*31+k.charCodeAt(i))&0x7fffffff
  return pool[h%pool.length]
}
