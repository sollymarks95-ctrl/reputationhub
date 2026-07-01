'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const P = '#c47d1a'

export default function SalKlitaCalculator() {
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(1)
  const [isSingleParent, setIsSingleParent] = useState(false)
  const [age65Plus, setAge65Plus] = useState(false)

  const result = useMemo(() => {
    // Estimates modelled on the published 2026 absorption-basket structure:
    // a base per-adult amount, a per-child top-up, and bonuses for single
    // parents and olim aged 65+. Paid in installments over the first year
    // (roughly 40% in months 1-2, remainder spread over the following 10).
    const baseAdult = 11500
    const baseChild = 5200
    const singleParentBonus = 6000
    const seniorBonus = 4500

    let total = adults * baseAdult + children * baseChild
    if (isSingleParent) total += singleParentBonus
    if (age65Plus) total += seniorBonus

    const firstPayment = Math.round(total * 0.4)
    const remaining = total - firstPayment
    const monthlyAfter = Math.round(remaining / 10)

    return { total, firstPayment, monthlyAfter }
  }, [adults, children, isSingleParent, age65Plus])

  const fmt = (n: number) => `₪${n.toLocaleString('en-US')}`

  return (
    <div>
      <Link href="/calculators" style={{ fontSize: 12.5, color: P, textDecoration: 'none', fontWeight: 700 }}>← All calculators</Link>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: '14px 0 6px' }}>🏛️ Sal Klita Calculator</h1>
      <p style={{ fontSize: 14, color: '#6b5a3e', marginBottom: 28, lineHeight: 1.6 }}>
        Estimate your absorption basket (Sal Klita) payments based on your family. This is a planning estimate — confirm your exact entitlement with Misrad Haklita.
      </p>

      <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderRadius: 12, padding: 26, marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em', color: '#5c4a2e' }}>
            Adults making Aliyah: {adults}
          </label>
          <input type="range" min={1} max={2} value={adults} onChange={e => setAdults(Number(e.target.value))} style={{ width: '100%', accentColor: P }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em', color: '#5c4a2e' }}>
            Children: {children}
          </label>
          <input type="range" min={0} max={6} value={children} onChange={e => setChildren(Number(e.target.value))} style={{ width: '100%', accentColor: P }} />
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
            <input type="checkbox" checked={isSingleParent} onChange={e => setIsSingleParent(e.target.checked)} style={{ accentColor: P, width: 18, height: 18 }} />
            Single-parent household
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
            <input type="checkbox" checked={age65Plus} onChange={e => setAge65Plus(e.target.checked)} style={{ accentColor: P, width: 18, height: 18 }} />
            Primary applicant is 65+
          </label>
        </div>
      </div>

      <div style={{ background: '#2d1a00', borderRadius: 12, padding: 26, color: '#fff' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Estimated Total Sal Klita (First Year)</div>
        <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 22 }}>{fmt(result.total)}</div>
        <div style={{ display: 'grid', gap: 10, fontSize: 13.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
            <span style={{ color: 'rgba(255,255,255,.75)' }}>First payment (months 1-2, ~40%)</span>
            <span style={{ fontWeight: 800 }}>{fmt(result.firstPayment)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,.75)' }}>Then, months 3-12</span>
            <span style={{ fontWeight: 800 }}>~{fmt(result.monthlyAfter)}/month</span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#8a7a5c', marginTop: 18, lineHeight: 1.6 }}>
        Sal Klita amounts and payment schedules are set by Misrad Haklita and can change. This tool gives a planning estimate only, not a guarantee — check your exact entitlement at your Misrad Haklita appointment or via Nefesh B'Nefesh.
      </p>
    </div>
  )
}
