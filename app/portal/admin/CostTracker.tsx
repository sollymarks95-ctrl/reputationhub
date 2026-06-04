'use client'
import { useState, useEffect } from 'react'

const CATEGORIES = [
  { id:'claude',      label:'Claude AI',    icon:'🤖', color:'#A78BFA' },
  { id:'vercel',      label:'Vercel',       icon:'▲',  color:'#F1F5F9' },
  { id:'domains',     label:'Domains',      icon:'🌐', color:'#38BDF8' },
  { id:'heygen',      label:'HeyGen',       icon:'🎥', color:'#F59E0B' },
  { id:'elevenlabs',  label:'ElevenLabs',   icon:'🎙', color:'#10B981' },
  { id:'shotstack',   label:'Shotstack',    icon:'🎬', color:'#EF4444' },
  { id:'supabase',    label:'Supabase',     icon:'🗄️', color:'#3ECF8E' },
  { id:'anthropic',   label:'API Credits',  icon:'💳', color:'#6366F1' },
  { id:'other',       label:'Other',        icon:'📦', color:'#94A3B8' },
]

const BILLING_TYPES = [
  { id:'one_time', label:'One-time' },
  { id:'monthly',  label:'Monthly'  },
  { id:'annual',   label:'Annual'   },
]

// Fixed estimated costs per API call
const API_COSTS = {
  heygen_video:     1.20,  // per talking head video (~90s)
  elevenlabs_audio: 0.30,  // per podcast episode audio
  shotstack_render: 0.25,  // per video render
  claude_article:   0.015, // per article (Claude API ~$0.015)
}

export default function CostTracker() {
  const [entries, setEntries]           = useState<any[]>([])
  const [usage, setUsage]               = useState<any>({})
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [filter, setFilter]             = useState<'all'|'monthly'|'one_time'>('all')
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'claude',
    description: '',
    amount_usd: '',
    billing_type: 'one_time',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [costRes, usageRes] = await Promise.all([
        fetch('/api/admin/costs'),
        fetch('/api/admin/costs/usage'),
      ])
      if (costRes.ok) setEntries(await costRes.json())
      if (usageRes.ok) setUsage(await usageRes.json())
    } catch {}
    setLoading(false)
  }

  async function addEntry() {
    if (!form.description || !form.amount_usd) return
    try {
      const res = await fetch('/api/admin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount_usd: parseFloat(form.amount_usd) }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ date: new Date().toISOString().split('T')[0], category:'claude', description:'', amount_usd:'', billing_type:'one_time', notes:'' })
        loadData()
      }
    } catch {}
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    await fetch(`/api/admin/costs?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  // Calculate monthly totals
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const yearStart  = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]

  const monthlyFixed = entries
    .filter(e => e.billing_type === 'monthly')
    .reduce((sum, e) => sum + parseFloat(e.amount_usd), 0)

  const annualAsMonthly = 0 // no annual subscriptions currently

  // One-time costs logged this calendar month
  const thisMonthOneTime = entries
    .filter(e => e.billing_type === 'one_time' && e.date >= monthStart)
    .reduce((sum, e) => sum + parseFloat(e.amount_usd), 0)

  // All one-time costs this year (for annual view)
  const thisYearOneTime = entries
    .filter(e => e.billing_type === 'one_time' && e.date >= yearStart)
    .reduce((sum, e) => sum + parseFloat(e.amount_usd), 0)

  // Claude topups total (all time)
  const claudeTotal = entries
    .filter(e => e.category === 'claude')
    .reduce((sum, e) => sum + parseFloat(e.amount_usd), 0)

  // Calculated API usage costs this month
  const calculatedCosts = {
    heygen:     (usage.videos_this_month || 0) * API_COSTS.heygen_video,
    elevenlabs: (usage.audios_this_month || 0) * API_COSTS.elevenlabs_audio,
    shotstack:  (usage.renders_this_month || 0) * API_COSTS.shotstack_render,
    claude_api: (usage.articles_this_month || 0) * API_COSTS.claude_article,
  }
  const totalCalculated = Object.values(calculatedCosts).reduce((a, b) => a + b, 0)
  const monthlyTotal = monthlyFixed + annualAsMonthly + thisMonthOneTime + totalCalculated

  const G = '#10B981'
  const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20 }

  const catLookup = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

  const filtered = filter === 'all' ? entries
    : filter === 'monthly' ? entries.filter(e => e.billing_type === 'monthly')
    : entries.filter(e => e.billing_type === 'one_time')

  // Category breakdown for monthly total
  const byCategory: Record<string, number> = {}
  entries.filter(e => e.billing_type === 'monthly').forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount_usd)
  })
  // No annual subscriptions currently
  // Claude topups this month
  entries.filter(e => e.billing_type === 'one_time' && e.category === 'claude' && e.date >= monthStart).forEach(e => {
    byCategory['claude'] = (byCategory['claude'] || 0) + parseFloat(e.amount_usd)
  })
  // Add calculated
  byCategory['heygen']     = (byCategory['heygen']    || 0) + calculatedCosts.heygen
  byCategory['elevenlabs'] = (byCategory['elevenlabs']|| 0) + calculatedCosts.elevenlabs
  byCategory['shotstack']  = (byCategory['shotstack'] || 0) + calculatedCosts.shotstack
  byCategory['anthropic']  = (byCategory['anthropic'] || 0) + calculatedCosts.claude_api

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
    { label:'Monthly Burn', value:`$${monthlyTotal.toFixed(2)}`, sub:`June 2026 subscriptions + usage`, color:G },
          { label:'Subscriptions', value:`$${(monthlyFixed + annualAsMonthly).toFixed(2)}`, sub:`$${monthlyFixed.toFixed(0)}/mo + $${annualAsMonthly.toFixed(2)}/mo (annual÷12)`, color:'#38BDF8' },
          { label:'Claude Topups', value:`$${claudeTotal.toFixed(2)}`, sub:`all time (4 days) · 21 topups`, color:'#A78BFA' },
          { label:'All-Time Spend', value:`$${(entries.reduce((s,e)=>s+parseFloat(e.amount_usd),0)).toFixed(0)}`, sub:'total logged since June 2026', color:'#F59E0B' },
        ].map(s => (
          <div key={s.label} style={{ ...card, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:6, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* LEFT: Category breakdown */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:800, color:'#F1F5F9', marginBottom:16 }}>📊 Monthly Breakdown</div>
            {Object.entries(byCategory).sort(([,a],[,b]) => b - a).map(([cat, amt]) => {
              const c = catLookup[cat]
              const pct = monthlyTotal > 0 ? (amt / monthlyTotal) * 100 : 0
              return (
                <div key={cat} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13, color:'#F1F5F9' }}>{c?.icon || '📦'} {c?.label || cat}</span>
                    <span style={{ fontSize:13, fontWeight:700, color: c?.color || '#94A3B8' }}>${amt.toFixed(2)}</span>
                  </div>
                  <div style={{ height:5, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: c?.color || '#94A3B8', borderRadius:3, opacity:0.8 }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* API Usage (calculated) */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:800, color:'#F1F5F9', marginBottom:4 }}>🔢 API Usage This Month</div>
            <div style={{ fontSize:11, color:'#475569', marginBottom:14 }}>Auto-calculated from your actual usage</div>
            {[
              { label:'Videos rendered (HeyGen)', count: usage.videos_this_month || 0, cost: calculatedCosts.heygen, unit:'@ $1.20 each', color:'#F59E0B' },
              { label:'Audio episodes (ElevenLabs)', count: usage.audios_this_month || 0, cost: calculatedCosts.elevenlabs, unit:'@ $0.30 each', color:G },
              { label:'Video composites (Shotstack)', count: usage.renders_this_month || 0, cost: calculatedCosts.shotstack, unit:'@ $0.25 each', color:'#EF4444' },
              { label:'Articles generated (Claude API)', count: usage.articles_this_month || 0, cost: calculatedCosts.claude_api, unit:'@ $0.015 each', color:'#A78BFA' },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize:12, color:'#F1F5F9' }}>{row.label}</div>
                  <div style={{ fontSize:10, color:'#475569' }}>{row.count} × {row.unit}</div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color: row.color }}>${row.cost.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Entries list */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#F1F5F9' }}>💳 Cost Entries</div>
              <div style={{ display:'flex', gap:8 }}>
                {(['all','monthly','one_time'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'none', cursor:'pointer',
                      background: filter===f ? G : 'rgba(255,255,255,0.06)',
                      color: filter===f ? '#fff' : '#64748b', fontWeight: filter===f ? 700 : 400 }}>
                    {f === 'all' ? 'All' : f === 'monthly' ? 'Monthly' : 'One-time'}
                  </button>
                ))}
                <button onClick={() => setShowForm(f => !f)}
                  style={{ fontSize:12, padding:'4px 12px', borderRadius:6, border:'none', cursor:'pointer', fontWeight:700, background:G, color:'#fff' }}>
                  + Add
                </button>
              </div>
            </div>

            {/* Add form */}
            {showForm && (
              <div style={{ background:'rgba(16,185,129,0.06)', borderRadius:8, padding:14, marginBottom:16, border:`1px solid ${G}33` }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category:e.target.value}))}
                    style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.4)', color:'#F1F5F9', fontSize:12 }}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                  <select value={form.billing_type} onChange={e => setForm(p => ({...p, billing_type:e.target.value}))}
                    style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.4)', color:'#F1F5F9', fontSize:12 }}>
                    {BILLING_TYPES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                  <input value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))}
                    placeholder="Description (e.g. Claude $5 topup)"
                    style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.4)', color:'#F1F5F9', fontSize:12 }} />
                  <input value={form.amount_usd} onChange={e => setForm(p => ({...p, amount_usd:e.target.value}))}
                    type="number" step="0.01" placeholder="Amount USD"
                    style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.4)', color:'#F1F5F9', fontSize:12 }} />
                  <input value={form.date} onChange={e => setForm(p => ({...p, date:e.target.value}))}
                    type="date"
                    style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.4)', color:'#F1F5F9', fontSize:12 }} />
                  <input value={form.notes} onChange={e => setForm(p => ({...p, notes:e.target.value}))}
                    placeholder="Notes (optional)"
                    style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.4)', color:'#F1F5F9', fontSize:12 }} />
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={addEntry} style={{ flex:1, padding:'8px', borderRadius:6, border:'none', cursor:'pointer', background:G, color:'#fff', fontWeight:700, fontSize:13 }}>Save Entry</button>
                  <button onClick={() => setShowForm(false)} style={{ padding:'8px 16px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', background:'transparent', color:'#94A3B8', fontSize:13 }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Entries table */}
            {loading ? <div style={{ color:'#64748b', fontSize:13 }}>Loading…</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {filtered.sort((a, b) => b.date.localeCompare(a.date)).map((e: any) => {
                  const cat = catLookup[e.category]
                  return (
                    <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize:16 }}>{cat?.icon || '📦'}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.description}</div>
                        <div style={{ fontSize:10, color:'#475569' }}>{e.date} · {BILLING_TYPES.find(b => b.id === e.billing_type)?.label}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color: cat?.color || '#94A3B8', flexShrink:0 }}>${parseFloat(e.amount_usd).toFixed(2)}</div>
                      <button onClick={() => deleteEntry(e.id)}
                        style={{ fontSize:10, color:'#475569', background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>✕</button>
                    </div>
                  )
                })}
                {filtered.length === 0 && <div style={{ color:'#64748b', fontSize:13 }}>No entries yet.</div>}
              </div>
            )}
          </div>

          {/* Quick-add Claude topups */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:800, color:'#F1F5F9', marginBottom:10 }}>⚡ Quick Add Claude Topup</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[5, 10, 20, 50].map(amt => (
                <button key={amt} onClick={async () => {
                  await fetch('/api/admin/costs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      date: new Date().toISOString().split('T')[0],
                      category: 'claude', description: `Claude claude.ai topup $${amt}`,
                      amount_usd: amt, billing_type: 'one_time', notes: 'claude.ai credit topup',
                    }),
                  })
                  loadData()
                }} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #A78BFA44', background:'#A78BFA15', color:'#A78BFA', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  + ${amt}
                </button>
              ))}
            </div>
            <div style={{ fontSize:10, color:'#334155', marginTop:8 }}>Click to instantly log a Claude credit topup with today's date</div>
          </div>
        </div>
      </div>
    </div>
  )
}
