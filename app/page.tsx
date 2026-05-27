'use client'
import Link from 'next/link'

const PORTALS = [
  { name:'Nexwire',  type:'Global Trade News',  color:'#c0392b', route:'news/global-trade-wire'          },
  { name:'Finvex',   type:'Financial Markets',   color:'#1a73e8', route:'finance/finance-terminal'        },
  { name:'AurexHQ',  type:'Gold & Commodities',  color:'#d4a017', route:'commodities/gold-markets-today'  },
  { name:'Bizplex',  type:'Business Magazine',   color:'#7c3aed', route:'magazine/business-pulse'         },
  { name:'Verivex',  type:'Verified Reviews',    color:'#059669', route:'reviews-hub/trust-score'         },
  { name:'Bizpedia', type:'Company Profiles',    color:'#0369a1', route:'wiki/company-pedia'              },
  { name:'PresxWire',type:'Press Releases',      color:'#dc2626', route:'pressroom/press-central'         },
  { name:'InvexHub', type:'Investment Intel',    color:'#0f766e', route:'investdb/invest-data'            },
  { name:'Tradvex',  type:'Trade Community',     color:'#ea580c', route:'forum/trade-board'               },
  { name:'Certivade',type:'Trade Standards',     color:'#1d4ed8', route:'association/global-trade-assoc'  },
  { name:'Execvex',  type:'Executive Network',   color:'#4f46e5', route:'executive/executive-network'     },
  { name:'Signalix', type:'Market Signals',      color:'#b91c1c', route:'market-radar/market-radar'       },
]

export default function HomePage() {
  return (
    <div style={{ minHeight:'100vh', background:'#0B0F19', color:'#F1F5F9', fontFamily:"'DM Sans',system-ui,sans-serif", overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} a{text-decoration:none;color:inherit}
        .syne{font-family:'Syne',sans-serif}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes float{0%,100%{transform:translateY(0) rotateY(-5deg)}50%{transform:translateY(-18px) rotateY(-3deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px #F59E0B40}50%{box-shadow:0 0 40px #F59E0B80}}
        @keyframes wave{0%{height:4px}100%{height:22px}}
        @keyframes pgreen{0%,100%{box-shadow:0 0 20px #10B98140}50%{box-shadow:0 0 40px #10B98170}}
        @keyframes fadeup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .btn{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:100px;font-size:15px;font-weight:600;border:none;cursor:pointer;transition:all .25s;font-family:inherit;white-space:nowrap;text-decoration:none}
        .btn-blue{background:linear-gradient(135deg,#0EA5E9,#818CF8);color:#fff;box-shadow:0 0 30px #0EA5E940}
        .btn-blue:hover{transform:translateY(-2px);box-shadow:0 8px 40px #0EA5E960}
        .btn-ghost{background:transparent;color:#F1F5F9;border:1px solid rgba(255,255,255,0.15)}
        .btn-ghost:hover{border-color:#0EA5E9;color:#0EA5E9}
        .btn-green{background:linear-gradient(135deg,#10B981,#059669);color:#fff;animation:pgreen 2.5s ease-in-out infinite}
        .btn-green:hover{transform:translateY(-2px)}
        .btn-gold{background:linear-gradient(135deg,#F59E0B,#F97316);color:#000;font-weight:700}
        .btn-gold:hover{transform:translateY(-2px)}
        .btn-login{background:transparent;color:#0EA5E9;border:1px solid rgba(14,165,233,0.35)}
        .btn-login:hover{background:rgba(14,165,233,0.08)}
        .nav-link{font-size:14px;color:#94A3B8;padding:6px 12px;border-radius:6px;transition:color .2s}
        .nav-link:hover{color:#F1F5F9}
        .glass{background:linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.10);border-radius:12px}
        .grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,black,transparent)}
        .tag{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:100px;font-size:12px;font-weight:600;letter-spacing:.05em}
        .fc{padding:36px 30px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));transition:all .3s}
        .fc:hover{transform:translateY(-6px);border-color:rgba(255,255,255,0.2)}
        .pc{padding:40px 32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));transition:all .3s}
        .pc.ft{border-color:rgba(14,165,233,0.5)!important;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(129,140,248,0.05))}
        .tc{padding:36px 32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));transition:all .3s}
        .tc:hover{transform:translateY(-4px);border-color:rgba(255,255,255,0.2)}
        .inp{padding:14px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#F1F5F9;font-size:14px;outline:none;font-family:inherit;width:100%;transition:border .2s}
        .inp:focus{border-color:#0EA5E9}
        @media(max-width:900px){
          .hg{grid-template-columns:1fr!important}
          .sc{display:none!important}
          .fg{grid-template-columns:1fr!important}
          .pg{grid-template-columns:1fr!important}
          .tg{grid-template-columns:1fr!important}
          .sg{grid-template-columns:repeat(2,1fr)!important}
          .nl{display:none!important}
          .fmg{grid-template-columns:1fr!important}
          .ds1{display:none!important}
          .ds2{display:none!important}
          .h1s{font-size:36px!important}
          .h2s{font-size:30px!important}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, padding:'14px 0', background:'rgba(11,15,25,0.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <Link href="/">
            <div className="syne" style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.03em' }}>
              Rep<span style={{ background:'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Hub</span>
            </div>
          </Link>
          <div className="nl" style={{ display:'flex', gap:4 }}>
            {[['#portals','Network'],['#features','Platform'],['#dashboard','Dashboard'],['#pricing','Pricing'],['#proof','Results']].map(([h,l]) => (
              <a key={h} href={h} className="nav-link">{l}</a>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding:'9px 18px', fontSize:14 }}>
              Contact Us
            </a>
            <Link href="/portal" className="btn btn-login" style={{ padding:'9px 18px', fontSize:14 }}>
              Client Login
            </Link>
            <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" className="btn btn-blue" style={{ padding:'9px 20px', fontSize:14 }}>
              Audit My Brand
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'120px 0 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 70% 50%,rgba(14,165,233,0.13),transparent),radial-gradient(ellipse 50% 80% at 10% 30%,rgba(16,185,129,0.09),transparent)' }} />
        <div className="grid-bg" />
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', width:'100%' }}>
          <div className="hg" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
            <div style={{ position:'relative', zIndex:2, animation:'fadeup .6s ease' }}>
              <div style={{ display:'flex', gap:10, marginBottom:22, flexWrap:'wrap' }}>
                <span className="tag" style={{ background:'rgba(14,165,233,0.12)', border:'1px solid rgba(14,165,233,0.3)', color:'#0EA5E9' }}>🛡 Authority Engine</span>
                <span className="tag" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', color:'#10B981' }}>🤖 AI-Powered</span>
                <span className="tag" style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', color:'#F59E0B' }}>✦ From $5,000/mo</span>
              </div>
              <h1 className="syne h1s" style={{ fontSize:56, fontWeight:900, lineHeight:1.05, letterSpacing:'-0.02em', marginBottom:22 }}>
                We Don&apos;t Just Build Trust.{' '}
                <span style={{ background:'linear-gradient(135deg,#38BDF8,#818CF8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>We Command Your</span>{' '}
                <span style={{ background:'linear-gradient(135deg,#10B981,#34D399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Google Page One.</span>
              </h1>
              <p style={{ fontSize:18, color:'#94A3B8', lineHeight:1.75, marginBottom:36, maxWidth:520 }}>
                The ultimate authority engine for Forex, Crypto &amp; Trading brokers. Publish analysis across <strong style={{color:'#F1F5F9'}}>12 elite financial portals</strong>, dominate search intent, and launch AI-generated team podcasts — tracked in real-time.
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:44 }}>
                <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" className="btn btn-blue" style={{ fontSize:16, padding:'15px 30px' }}>
                  Audit My Brand&apos;s Reputation
                </a>
                <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize:16, padding:'15px 28px' }}>
                  ▶ Watch 2-Min Demo
                </a>
              </div>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                {[['47+','Brokers Ranked #1'],['12','Elite Portals'],['96h','To Google P1']].map(([n,l]) => (
                  <div key={l}>
                    <div className="syne" style={{ fontSize:28, fontWeight:900, lineHeight:1 }}>{n}</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SERP MOCKUP */}
            <div className="sc" style={{ position:'relative', zIndex:2, animation:'float 6s ease-in-out infinite' }}>
              <div style={{ background:'linear-gradient(135deg,#1C2333,#141B2D)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:16, padding:24, boxShadow:'0 40px 100px rgba(0,0,0,0.7),0 0 60px rgba(14,165,233,0.2)', position:'relative', maxWidth:460 }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,#0EA5E9,transparent)' }} />
                <div style={{ position:'absolute', top:-12, right:-12, background:'linear-gradient(135deg,#F59E0B,#F97316)', color:'#000', fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:100, animation:'glow 2s ease-in-out infinite', zIndex:10 }}>LIVE RESULTS ●</div>
                <div style={{ background:'#0B0F19', borderRadius:8, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, marginBottom:18, border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display:'flex', gap:5 }}>{['#EF4444','#F59E0B','#10B981'].map(c=><div key={c} style={{width:9,height:9,borderRadius:'50%',background:c}}/>)}</div>
                  <div style={{ flex:1, background:'rgba(255,255,255,0.05)', padding:'4px 10px', borderRadius:4, fontSize:11, color:'#64748b' }}>google.com/search?q=your+broker+name</div>
                </div>
                {[
                  { r:1, d:'finvex.rephuby.com', t:'Your Broker — Official Analysis | Finvex', sn:'Full market analysis, regulation details...', st:true },
                  { r:2, d:'nexwire.rephuby.com', t:'Your Broker Market Commentary | Nexwire', sn:'Daily expert market updates from your team...' },
                  { r:3, d:'signalix.rephuby.com', t:'CEO Interview: Your Broker 2025 | Bizplex', sn:'Exclusive AI podcast: leadership insights...' },
                  { r:4, d:'verivex.rephuby.com', t:'Your Broker: 4.9★ Reviews | Verivex', sn:'2,400+ verified reviews. Regulated & trusted.' },
                  { r:5, d:'invexhub.rephuby.com', t:'Your Broker Intelligence | InvexHub', sn:'Institutional-grade market data...' },
                ].map(s => (
                  <div key={s.r} style={{ padding:'10px 0 10px 22px', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative' }}>
                    <div style={{ position:'absolute', left:-6, top:'50%', transform:'translateY(-50%)', width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, background:s.r===1?'linear-gradient(135deg,#F59E0B,#F97316)':'#1E2533', color:s.r===1?'#000':'#64748b' }}>{s.r}</div>
                    <div style={{ fontSize:10, color:'#10B981', marginBottom:1 }}>{s.d}</div>
                    <div style={{ fontSize:12, color:'#60A5FA', fontWeight:600, marginBottom:1 }}>{s.t}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{s.sn}</div>
                    {s.st && <div style={{ fontSize:10, color:'#F59E0B' }}>★★★★★ 4.9 (2,400 reviews)</div>}
                  </div>
                ))}
                <div style={{ marginTop:12, padding:'9px 12px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', animation:'pulse 1.5s ease-in-out infinite' }} />
                  <span style={{ fontSize:11, color:'#10B981', fontWeight:600 }}>+3 positions updated 2 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTAL TICKER */}
      <section id="portals" style={{ padding:'56px 0', overflow:'hidden', position:'relative', background:'rgba(255,255,255,0.015)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:180, background:'linear-gradient(90deg,#0B0F19,transparent)', zIndex:2 }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:180, background:'linear-gradient(-90deg,#0B0F19,transparent)', zIndex:2 }} />
        <div style={{ textAlign:'center', marginBottom:26 }}>
          <h2 className="syne" style={{ fontSize:22, fontWeight:400, color:'#64748b' }}>Instant Distribution Across Our <strong style={{color:'#F1F5F9'}}>Proprietary 12-Site Financial Network</strong></h2>
          <p style={{ fontSize:13, color:'#475569', marginTop:6 }}>Your analysis published daily on our high-authority portals — generating backlinks, trust, and Page 1 rankings</p>
        </div>
        <div style={{ overflow:'hidden' }}>
          <div style={{ display:'flex', animation:'ticker 30s linear infinite', whiteSpace:'nowrap' }}>
            {[...PORTALS,...PORTALS].map((p, i) => (
              <a key={i} href={`https://rephuby.com/${p.route}`} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'10px 22px', flexShrink:0, textDecoration:'none' }}>
                <div style={{ width:36, height:36, borderRadius:8, background:`${p.color}28`, border:`1px solid ${p.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:15, color:p.color }}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="syne" style={{ fontWeight:700, fontSize:14, color:p.color }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'#475569' }}>{p.type}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ padding:'52px 0', background:'linear-gradient(135deg,#111827,#0F172A)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
          <div className="sg" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {[{n:'$2.4B+',l:'Client AUM Protected',c:'#38BDF8'},{n:'12',l:'Elite Portals Live',c:'#34D399'},{n:'96h',l:'Avg Time to Google P1',c:'#FCD34D'},{n:'42%',l:'Avg Conversion Increase',c:'#F97316'}].map((s,i) => (
              <div key={s.l} style={{ textAlign:'center', padding:'18px 12px', borderRight:i<3?'1px solid rgba(255,255,255,0.06)':'none' }}>
                <div className="syne" style={{ fontSize:46, fontWeight:900, color:s.c, lineHeight:1, marginBottom:6 }}>{s.n}</div>
                <div style={{ fontSize:13, color:'#64748b' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ padding:'96px 0' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <span className="tag" style={{ background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.25)', color:'#0EA5E9', marginBottom:18, display:'inline-flex' }}>The Three Pillars</span>
            <h2 className="syne h2s" style={{ fontSize:46, fontWeight:900, marginBottom:14, lineHeight:1.1 }}>Everything You Need to <span style={{ background:'linear-gradient(135deg,#38BDF8,#818CF8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Dominate Your</span> <span style={{ background:'linear-gradient(135deg,#10B981,#34D399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Brand Search</span></h2>
            <p style={{ fontSize:17, color:'#64748b', maxWidth:580, margin:'0 auto' }}>A complete authority engine that runs 24/7, publishing your expertise and burying everything that threatens your reputation.</p>
          </div>
          <div className="fg" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:22 }}>
            {[
              { icon:'🛡', tag:'Pillar 01', tc:'#0EA5E9', grad:'135deg,#0EA5E9,#818CF8', title:'SEO Dominance', accent:'& Brand Shield', desc:"Own 100% of your brand's search real estate. We push down negative reviews and bad press by flooding Google Page 1 with authoritative, optimized assets. Your competitors' negative articles? Buried on page 3.", cta:'Get brand audit →' },
              { icon:'🌐', tag:'Pillar 02', tc:'#10B981', grad:'135deg,#10B981,#34D399', title:'Authority Network', accent:'Publishing', desc:"Turn your internal team into industry celebrities. Your brokers' market analysis is pushed automatically to our portals, generating massive backlink equity and organic trust signals that Google rewards with rankings.", cta:'See our network →' },
              { icon:'🎙', tag:'Pillar 03', tc:'#F59E0B', grad:'135deg,#F59E0B,#F97316', title:'AI Media &', accent:'Podcast Engine', desc:"Humanize your brokerage at scale. Our AI engine generates high-fidelity professional audio/video interviews with your team — synced automatically to Spotify, YouTube & Apple Podcasts.", cta:'Hear sample →' },
            ].map(f => (
              <div key={f.tag} className="fc">
                <div style={{ fontSize:36, marginBottom:18 }}>{f.icon}</div>
                <span className="tag" style={{ background:`${f.tc}12`, border:`1px solid ${f.tc}30`, color:f.tc, marginBottom:14, fontSize:11, display:'inline-flex' }}>{f.tag}</span>
                <h3 className="syne" style={{ fontSize:22, fontWeight:800, marginBottom:12 }}>
                  {f.title}<br/>
                  <span style={{ background:`linear-gradient(${f.grad})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{f.accent}</span>
                </h3>
                <p style={{ fontSize:15, color:'#64748b', lineHeight:1.75, marginBottom:18 }}>{f.desc}</p>
                <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" style={{ fontSize:13, fontWeight:700, color:f.tc }}>{f.cta}</a>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:44 }}>
            <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" className="btn btn-green" style={{ fontSize:16, padding:'16px 34px' }}>
              Start Your Authority Engine on Telegram →
            </a>
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section id="dashboard" style={{ padding:'80px 0', background:'rgba(255,255,255,0.015)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <span className="tag" style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', color:'#10B981', marginBottom:14, display:'inline-flex' }}>Real-Time Control</span>
            <h2 className="syne h2s" style={{ fontSize:44, fontWeight:900, marginBottom:12, lineHeight:1.1 }}>Your <span style={{ background:'linear-gradient(135deg,#38BDF8,#818CF8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Live Authority</span> Dashboard</h2>
            <p style={{ fontSize:17, color:'#64748b' }}>Every article, ranking, and podcast — tracked in one command center at rephuby.com/portal</p>
          </div>
          <div style={{ background:'linear-gradient(135deg,#141B2D,#1C2333)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.6),0 0 50px rgba(14,165,233,0.12)', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,#0EA5E9,#10B981,transparent)' }} />
            <div style={{ padding:'13px 22px', background:'#0B0F19', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', gap:6 }}>{['#EF4444','#F59E0B','#10B981'].map(c=><div key={c} style={{width:11,height:11,borderRadius:'50%',background:c}}/>)}</div>
              <span className="syne" style={{ fontSize:12, color:'#64748b', fontWeight:700 }}>RepHub Intelligence Dashboard — rephuby.com/portal/dashboard</span>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#10B981' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', animation:'pulse 1.5s ease-in-out infinite' }} />Live
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 200px', minHeight:380 }}>
              <div className="ds1" style={{ padding:18, borderRight:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#475569', letterSpacing:'.08em', marginBottom:12 }}>🎯 GOOGLE RANK TRACKER</div>
                {[['apex review','#1',4,'Finvex'],['apex legit','#1',9,'Nexwire'],['apex safe','#2',14,'Verivex'],['apex scam','#18',5,'Signalix']].map(([k,p,prev,site]) => (
                  <div key={k} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:11 }}>
                    <div style={{ width:18, height:18, borderRadius:3, background:p!=='#18'?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:p!=='#18'?'#10B981':'#EF4444', flexShrink:0 }}>{p!=='#18'?'▲':'▼'}</div>
                    <div style={{ flex:1 }}><div style={{ color:'#F1F5F9' }}>{k}</div><div style={{ fontSize:9, color:'#475569' }}>{site}</div></div>
                    <div className="syne" style={{ fontSize:14, fontWeight:900, color:p==='#1'?'#10B981':p==='#2'?'#F59E0B':'#34D399' }}>{p}</div>
                  </div>
                ))}
                <div style={{ marginTop:12, padding:'7px 10px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:7, fontSize:10, color:'#10B981', fontWeight:700, textAlign:'center' }}>🏆 Page 1: 8/10 terms</div>
              </div>
              <div style={{ padding:20 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#475569', letterSpacing:'.08em', marginBottom:12 }}>📰 RECENT ARTICLES PUBLISHED</div>
                {[['Finvex','Your Broker Q2 2025 EUR/USD Outlook: Bull Case Builds'],['Nexwire','Your Broker Head of Research: Global Trade Commentary'],['Signalix','Bitcoin Weekly Signal: Your Broker Crypto Desk Analysis'],['AurexHQ','Gold Hits 3-Month High: Your Broker Commodities Strategy'],['Verivex','Your Broker: 4.9-Star — 2,400 Verified Client Reviews']].map(([portal,title]) => (
                  <div key={title} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', alignItems:'center' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'#0EA5E9', minWidth:60 }}>{portal}</span>
                    <span style={{ flex:1, fontSize:12, fontWeight:500, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:'#10B981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', padding:'2px 8px', borderRadius:100, flexShrink:0 }}>● Live</span>
                  </div>
                ))}
                <div style={{ marginTop:12, padding:'9px 14px', background:'rgba(255,255,255,0.03)', borderRadius:8, fontSize:12, color:'#64748b', textAlign:'center' }}>
                  <span style={{ color:'#F59E0B', fontWeight:700 }}>36 articles</span> published across 12 portals this week
                </div>
              </div>
              <div className="ds2" style={{ padding:18, borderLeft:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#475569', letterSpacing:'.08em', marginBottom:12 }}>🎙 AI PODCAST ENGINE</div>
                {[{ep:7,t:'CEO Q3 Market Outlook',done:true},{ep:6,t:'Head of Research Interview',done:true},{ep:8,t:'Gold & Oil 2025 Special',done:false}].map(ep => (
                  <div key={ep.ep} style={{ padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:9, color:'#475569', fontWeight:700 }}>EP.{ep.ep}</span>
                      <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:100, background:ep.done?'rgba(16,185,129,0.15)':'rgba(245,158,11,0.15)', color:ep.done?'#10B981':'#F59E0B' }}>
                        {ep.done?'✓ Live':'⟳ Generating'}
                      </span>
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#F1F5F9', marginBottom:7 }}>{ep.t}</div>
                    <div style={{ height:20, display:'flex', alignItems:'center', gap:1.5 }}>
                      {Array.from({length:16}).map((_,j) => (
                        <div key={j} style={{ width:2.5, borderRadius:2, background:ep.done?'#0EA5E9':'#F59E0B', height:Math.floor(Math.random()*14+4), animation:`wave ${.4+Math.random()*.6}s ease-in-out ${j*.04}s infinite alternate` }} />
                      ))}
                    </div>
                    {ep.done && <div style={{ display:'flex', gap:4, marginTop:7 }}>
                      <span style={{ fontSize:9, padding:'1px 6px', background:'rgba(29,185,84,0.15)', color:'#1DB954', borderRadius:4 }}>Spotify</span>
                      <span style={{ fontSize:9, padding:'1px 6px', background:'rgba(255,0,0,0.12)', color:'#FF6B6B', borderRadius:4 }}>YouTube</span>
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign:'center', marginTop:28 }}>
            <Link href="/portal" className="btn btn-blue" style={{ fontSize:15, padding:'13px 30px' }}>Access My Dashboard →</Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding:'96px 0' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <span className="tag" style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', color:'#F59E0B', marginBottom:16, display:'inline-flex' }}>Transparent Pricing</span>
            <h2 className="syne h2s" style={{ fontSize:44, fontWeight:900, marginBottom:14, lineHeight:1.1 }}>Investment That <span style={{ background:'linear-gradient(135deg,#10B981,#34D399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Pays For Itself</span></h2>
            <p style={{ fontSize:17, color:'#64748b' }}>One qualified lead from a cleaner Google Page 1 covers months of service. ROI in 30 days.</p>
          </div>
          <div className="pg" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:22 }}>
            {[
              { tier:'Authority Starter', price:'5,000', clr:'#94A3B8', ft:false, cta:'Start Dominating →', feats:['5 portals from our network','15 articles/week published','Google rank monitoring','2 AI podcast episodes/month','Monthly SEO report'] },
              { tier:'Authority Pro', price:'9,500', clr:'#0EA5E9', ft:true, cta:'Get Authority Pro →', feats:['All 12 portals fully activated','35 articles/week published','Real-time rank tracking','8 AI podcast episodes/month','Brand crisis rapid response','Weekly executive briefing','Dedicated account manager'] },
              { tier:'Enterprise Command', price:'Custom', clr:'#F59E0B', ft:false, cta:'Request Quote →', feats:['Unlimited portal coverage','100+ articles/week','Multi-brand management','Daily AI podcast production','24/7 brand monitoring','Regulatory crisis PR','C-suite strategy sessions'] },
            ].map(p => (
              <div key={p.tier} className={`pc${p.ft?' ft':''}`} style={{ position:'relative' }}>
                {p.ft && <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#0EA5E9,#818CF8)', color:'#fff', fontSize:10, fontWeight:800, letterSpacing:'.1em', padding:'4px 14px', borderRadius:100, whiteSpace:'nowrap' }}>MOST POPULAR</div>}
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:10, textTransform:'uppercase', letterSpacing:'.06em' }}>{p.tier}</div>
                <div className="syne" style={{ fontSize:50, fontWeight:900, lineHeight:1, marginBottom:4, color:p.clr }}>
                  {p.price!=='Custom'&&<span style={{fontSize:24,color:'#64748b',fontWeight:400}}>$</span>}{p.price}
                </div>
                <div style={{ fontSize:13, color:'#64748b', marginBottom:18 }}>per month · 3 month minimum</div>
                <div style={{ height:1, background:'rgba(255,255,255,0.07)', marginBottom:18 }} />
                {p.feats.map(f => <div key={f} style={{ display:'flex', gap:9, marginBottom:11, fontSize:14, alignItems:'flex-start' }}><span style={{color:'#10B981',flexShrink:0}}>✓</span><span style={{color:'#94A3B8',lineHeight:1.4}}>{f}</span></div>)}
                <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" style={{ display:'block', marginTop:24 }}>
                  <button className={`btn ${p.ft?'btn-blue':p.price==='Custom'?'btn-gold':'btn-ghost'}`} style={{ width:'100%', justifyContent:'center', fontSize:14 }}>{p.cta}</button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section id="proof" style={{ padding:'96px 0', background:'rgba(255,255,255,0.015)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <span className="tag" style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', color:'#10B981', marginBottom:16, display:'inline-flex' }}>Client Results</span>
            <h2 className="syne h2s" style={{ fontSize:44, fontWeight:900, lineHeight:1.1 }}>Brokers Who Now <span style={{ background:'linear-gradient(135deg,#10B981,#34D399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Own Their</span> <span style={{ background:'linear-gradient(135deg,#38BDF8,#818CF8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Google Page 1</span></h2>
          </div>
          <div className="tg" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
            {[
              { mt:'📈 +42% Conversion Rate · 60 Days', q:"We were losing 60% of prospects who Googled us because the first page was full of forum posts. RepHub flooded Page 1 with 8 authoritative articles in 96 hours. Our closing rate went from 11% to 19% in the first month.", n:'Marcus H.', r:'CEO, CySEC-Regulated FX Broker · Europe', av:'M', g:'135deg,#0EA5E9,#818CF8' },
              { mt:'🔴 Competitor Review: #1 → #23 Pushed Down', q:"A competitor planted a fake review site ranking #1 for our brand. RepHub buried it to page 3 in 3 weeks and replaced the top 7 positions with our own content. The AI podcast was a game-changer — prospects now watch our CEO interview before scheduling a call.", n:'Alinta K.', r:'CMO, ASIC-Licensed Crypto Exchange · APAC', av:'A', g:'135deg,#10B981,#34D399' },
              { mt:'🏆 #1 Google Ranking in 8 Brand Terms', q:"We went from 2 brand terms controlled to 11 in the first quarter. The real-time dashboard lets our compliance team see every article. For a regulated firm, this level of control over our narrative is priceless. Worth 10x what we pay.", n:'Rafael S.', r:'Head of Marketing, FCA-Regulated Broker · UK', av:'R', g:'135deg,#F59E0B,#F97316' },
              { mt:'⚡ 96h From Onboarding to Page 1', q:"I was skeptical — we'd tried PR agencies and spent $20K with nothing to show. RepHub had our first 12 articles live across their network within 96 hours of signing. By week 3, our brand search had a completely different story.", n:'Dmitri V.', r:'Founder, MIFID-II Licensed Prop Firm · EU', av:'D', g:'135deg,#818CF8,#4f46e5' },
            ].map(t => (
              <div key={t.n} className="tc">
                <div style={{ background:`linear-gradient(${t.g})`, display:'inline-flex', padding:'5px 12px', borderRadius:8, fontSize:12, color:'#000', fontWeight:700, marginBottom:16 }}>{t.mt}</div>
                <div style={{ fontSize:42, lineHeight:.8, color:'#0EA5E9', opacity:.5, marginBottom:10, fontFamily:'Georgia,serif' }}>"</div>
                <p style={{ fontSize:15, color:'#94A3B8', lineHeight:1.7, marginBottom:20, fontStyle:'italic' }}>{t.q}</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(${t.g})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18 }}>{t.av}</div>
                  <div>
                    <div style={{ fontWeight:700 }}>{t.n}</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="contact" style={{ padding:'110px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 80% at 50% 50%,rgba(14,165,233,0.12),transparent)' }} />
        <div style={{ maxWidth:780, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:2 }}>
          <div style={{ background:'linear-gradient(135deg,#141B2D,#1C2333)', borderRadius:20, padding:'64px 52px', textAlign:'center', border:'1px solid rgba(14,165,233,0.3)', boxShadow:'0 0 60px rgba(14,165,233,0.15)', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,#0EA5E9,#10B981,transparent)' }} />
            <span className="tag" style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', marginBottom:18, display:'inline-flex' }}>🚨 Only 4 Slots Remaining — June 2025</span>
            <h2 className="syne h2s" style={{ fontSize:48, fontWeight:900, marginBottom:16, lineHeight:1.05 }}>
              Stop Losing Leads to{' '}
              <span style={{ background:'linear-gradient(135deg,#38BDF8,#818CF8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Unverified</span>{' '}
              <span style={{ background:'linear-gradient(135deg,#F59E0B,#F97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Competitors.</span>
            </h2>
            <p style={{ fontSize:17, color:'#64748b', maxWidth:500, margin:'0 auto 32px', lineHeight:1.7 }}>Every day your Google Page 1 isn&apos;t controlled is revenue walking out the door. 6 broker slots per month.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxWidth:500, margin:'0 auto 10px' }} className="fmg">
              <input placeholder="Broker / Company Name" className="inp" />
              <input placeholder="Website URL" type="url" className="inp" />
              <input placeholder="Work Email" type="email" className="inp" style={{ gridColumn:'1/-1' }} />
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:20 }}>
              <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" className="btn btn-green" style={{ fontSize:15, padding:'15px 32px' }}>
                Contact Us on Telegram
              </a>
              <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ fontSize:15, padding:'15px 30px' }}>
                Free Brand Report
              </a>
            </div>
            <div style={{ marginTop:14, fontSize:13, color:'#475569' }}><span style={{color:'#F59E0B',fontWeight:700}}>4 slots remaining</span> · Average client sees ROI in 30 days</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:'32px 0', background:'#0B0F19', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div>
            <Link href="/"><div className="syne" style={{ fontSize:20, fontWeight:900 }}>Rep<span style={{ background:'linear-gradient(135deg,#0EA5E9,#10B981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Hub</span></div></Link>
            <div style={{ fontSize:12, color:'#334155', marginTop:4 }}>The Authority Engine for Trading Brokers · rephuby.com</div>
          </div>
          <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
            {[['#portals','Network'],['#features','Platform'],['#pricing','Pricing'],['#proof','Results'],['/portal','Client Login'],['/legal/privacy','Privacy'],['/legal/terms','Terms']].map(([h,l]) => (
              <Link key={h} href={h} style={{ fontSize:13, color:'#475569' }}>{l}</Link>
            ))}
          </div>
          <div style={{ textAlign:'right' }}>
            <a href="https://t.me/rephub_intelligence" target="_blank" rel="noopener noreferrer" style={{ color:'#10B981', fontWeight:600, fontSize:13 }}>📱 @rephub_intelligence</a>
            <div style={{ fontSize:12, color:'#334155', marginTop:4 }}>© 2025 RepHub Intelligence Ltd</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
