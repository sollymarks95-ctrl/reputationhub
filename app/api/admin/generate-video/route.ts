import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gykxxhxsakxhfuutgobb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

function buildPodcastHtml(hostName:string,hostRole:string,guestName:string,guestRole:string,episodeTitle:string,episodeNum:number,accent:string) {
  const hi=hostName.split(' ').map((n:string)=>n[0]).join('')
  const gi=guestName.split(' ').map((n:string)=>n[0]).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1920px;height:1080px;overflow:hidden;background:linear-gradient(135deg,#0A0E17 0%,#111827 50%,#0D1117 100%);font-family:'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.grid{position:absolute;inset:0;opacity:0.03;background-image:linear-gradient(${accent} 1px,transparent 1px),linear-gradient(90deg,${accent} 1px,transparent 1px);background-size:80px 80px}
.glow{position:absolute;border-radius:50%;filter:blur(80px)}
.g1{left:-80px;top:40%;width:350px;height:350px;background:${accent}12}
.g2{right:-80px;top:40%;width:350px;height:350px;background:#10B98112}
.g3{top:-40px;left:50%;transform:translateX(-50%);width:700px;height:180px;background:${accent}08}
.header{text-align:center;margin-bottom:44px;position:relative;z-index:10}
.ep-badge{display:inline-block;border:1px solid ${accent}60;color:${accent};font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;padding:5px 18px;border-radius:100px;margin-bottom:14px;background:${accent}10}
.show-name{font-size:58px;font-weight:900;color:#F1F5F9;letter-spacing:-0.03em;line-height:1}
.show-name span{color:${accent}}
.speakers{display:flex;gap:56px;align-items:center;position:relative;z-index:10;margin-bottom:44px}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:38px 50px;display:flex;flex-direction:column;align-items:center;min-width:340px;position:relative;overflow:hidden;backdrop-filter:blur(10px)}
.host-card{border-color:${accent}25}
.guest-card{border-color:#10B98125}
.cg{position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:180px;height:80px;border-radius:50%;filter:blur(35px)}
.hcg{background:${accent}18}.gcg{background:#10B98118}
.av{width:108px;height:108px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;color:#fff;margin-bottom:18px}
.hav{background:linear-gradient(135deg,${accent},${accent}90);box-shadow:0 8px 28px ${accent}40}
.gav{background:linear-gradient(135deg,#10B981,#10B98190);box-shadow:0 8px 28px #10B98140}
.badge{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:3px 10px;border-radius:100px;margin-bottom:10px}
.hbadge{background:${accent}12;color:${accent};border:1px solid ${accent}25}
.gbadge{background:#10B98112;color:#10B981;border:1px solid #10B98125}
.sname{font-size:28px;font-weight:800;color:#F1F5F9;letter-spacing:-0.02em;margin-bottom:6px;text-align:center}
.stitle{font-size:13px;color:#64748b;text-align:center;line-height:1.5}
.divider{display:flex;flex-direction:column;align-items:center;gap:10px}
.dline{width:1px;height:70px;background:linear-gradient(to bottom,transparent,rgba(255,255,255,0.1),transparent)}
.mic{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:22px}
.ep-title{font-size:21px;color:#94A3B8;text-align:center;max-width:860px;line-height:1.5;position:relative;z-index:10;font-style:italic;padding:0 16px}
.bar{position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${accent},#10B981)}
.waveform{display:flex;align-items:center;gap:3px;position:absolute;bottom:16px;left:50%;transform:translateX(-50%);opacity:0.25}
.wb{width:3px;background:${accent};border-radius:3px;animation:w var(--d) ease-in-out infinite alternate}
@keyframes w{from{height:3px}to{height:var(--h)}}
</style></head><body>
<div class="grid"></div>
<div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div>
<div class="header">
  <div class="ep-badge">EPISODE ${episodeNum} · TRADING EDGE PODCAST</div>
  <div class="show-name">Trading<span>Edge</span></div>
</div>
<div class="speakers">
  <div class="card host-card">
    <div class="cg hcg"></div>
    <div class="av hav">${hi}</div>
    <div class="badge hbadge">HOST</div>
    <div class="sname">${hostName}</div>
    <div class="stitle">${hostRole}</div>
  </div>
  <div class="divider">
    <div class="dline"></div>
    <div class="mic">🎙</div>
    <div class="dline"></div>
  </div>
  <div class="card guest-card">
    <div class="cg gcg"></div>
    <div class="av gav">${gi}</div>
    <div class="badge gbadge">GUEST</div>
    <div class="sname">${guestName}</div>
    <div class="stitle">${guestRole}</div>
  </div>
</div>
<div class="ep-title">"${episodeTitle}"</div>
<div class="waveform">${Array.from({length:38},(_,i)=>`<div class="wb" style="--h:${6+Math.abs(Math.sin(i*0.9))*18}px;--d:${0.5+Math.random()*0.9}s;animation-delay:${(Math.random()*0.4).toFixed(2)}s"></div>`).join('')}</div>
<div class="bar"></div>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const { audioUrl, duration, hostName='David', hostRole='Show Host', guestName='Sarah', guestRole='Expert', episodeTitle='Financial Intelligence', episodeNum=1, clientId, podcastId } = await req.json()
    if (!audioUrl) return NextResponse.json({error:'audioUrl required'},{status:400})

    const KEY = process.env.SHOTSTACK_KEY || 'sandbox'
    const BASE = KEY==='sandbox' ? 'https://api.shotstack.io/stage/v1' : 'https://api.shotstack.io/v1'
    const html = buildPodcastHtml(hostName,hostRole,guestName,guestRole,episodeTitle,episodeNum,'#0EA5E9')
    const len = duration || 1200

    const payload = {
      timeline: {
        soundtrack: { src: audioUrl, effect: 'fadeInFadeOut', volume: 1 },
        tracks: [{ clips: [{ asset: { type:'html', html, width:1920, height:1080, position:'center' }, start:0, length:len, effect:'none' }] }]
      },
      output: { format:'mp4', resolution:'hd', quality:'high', fps:30, size:{width:1920,height:1080} }
    }

    const r = await fetch(`${BASE}/render`, {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':KEY},
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) { const e=await r.text(); return NextResponse.json({error:`Shotstack ${r.status}: ${e.slice(0,200)}`},{status:500}) }
    const rd = await r.json()
    const renderId = rd.response?.id
    if (!renderId) return NextResponse.json({error:'No render ID'},{status:500})

    // Poll for completion
    let videoUrl=null
    for (let i=0;i<60;i++) {
      await new Promise(res=>setTimeout(res,5000))
      const sr = await fetch(`${BASE}/render/${renderId}`,{headers:{'x-api-key':KEY}})
      const sd = await sr.json()
      const state = sd.response?.status
      if (state==='done') { videoUrl=sd.response?.url; break }
      if (state==='failed') return NextResponse.json({error:'Render failed',details:sd},{status:500})
    }
    if (!videoUrl) return NextResponse.json({error:'Render timed out'},{status:500})

    if (podcastId) await sb.from('podcast_scripts').update({status:'video_ready'}).eq('id',podcastId)
    if (clientId) await sb.from('portal_activity').insert({client_id:clientId,type:'podcast_ready',description:`Video podcast ready: Ep ${episodeNum}`})

    return NextResponse.json({success:true, videoUrl, renderId})
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500})
  }
}
