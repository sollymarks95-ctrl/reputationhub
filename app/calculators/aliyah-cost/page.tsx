'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const P = '#c47d1a'

type FamilySize = 'single' | 'couple' | 'family3' | 'family5'
type City = 'netanya' | 'raanana' | 'jerusalem' | 'telaviv' | 'beershemesh' | 'ashdod'

const FAMILY_LABELS: Record<FamilySize, string> = {
  single: 'Single',
  couple: 'Couple',
  family3: 'Family of 3-4',
  family5: 'Family of 5+',
}

const CITY_RENT: Record<City, number> = {
  netanya: 5500,
  raanana: 9000,
  jerusalem: 7500,
  telaviv: 11000,
  beershemesh: 4500,
  ashdod: 5000,
}

const CITY_LABELS: Record<City, string> = {
  netanya: 'Netanya',
  raanana: "Ra'anana",
  jerusalem: 'Jerusalem',
  telaviv: 'Tel Aviv',
  beershemesh: 'Beit Shemesh',
  ashdod: 'Ashdod',
}

const BASE_MONTHLY: Record<FamilySize, number> = {
  single: 4500,
  couple: 7500,
  family3: 10500,
  family5: 14500,
}

const SHIPPING: Record<FamilySize, number> = {
  single: 8000,
  couple: 14000,
  family3: 22000,
  family5: 28000,
}

const FLIGHTS: Record<FamilySize, number> = {
  single: 4500,
  couple: 9000,
  family3: 15000,
  family5: 22000,
}

export default function AliyahCostCalculator() {
  const [family, setFamily] = useState<FamilySize>('couple')
  const [city, setCity] = useState<City>('netanya')
  const [shipping, setShipping] = useState(true)
  const [months, setMonths] = useState(6)

  const result = useMemo(() => {
    const rent = CITY_RENT[city]
    const livingMonthly = BASE_MONTHLY[family]
    const livingTotal = livingMonthly * months
    const rentTotal = rent * months
    const deposit = rent * 2.5
    const shippingCost = shipping ? SHIPPING[family] : 0
    const flightsCost = FLIGHTS[family]
    const setupBuffer = family === 'single' ? 6000 : family === 'couple' ? 10000 : family === 'family3' ? 15000 : 20000
    const total = livingTotal + rentTotal + deposit + shippingCost + flightsCost + setupBuffer
    return { rent, livingMonthly, livingTotal, rentTotal, deposit, shippingCost, flightsCost, setupBuffer, total }
  }, [family, city, shipping, months])

  const fmt = (n: number) => `₪${n.toLocaleString('en-US')}`

  return (
    <div>
      <Link href="/calculators" style={{ fontSize: 12.5, color: P, textDecoration: 'none', fontWeight: 700 }}>← All calculators</Link>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: '14px 0 6px' }}>💰 Aliyah Cost Calculator</h1>
      <p style={{ fontSize: 14, color: '#6b5a3e', marginBottom: 28, lineHeight: 1.6 }}>
        Estimate what your first months in Israel will actually cost — rent, living expenses, shipping and setup — based on your family size and city.
      </p>

      <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderRadius: 12, padding: 26, marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em', color: '#5c4a2e' }}>Family size</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.keys(FAMILY_LABELS) as FamilySize[]).map(f => (
              <button key={f} onClick={() => setFamily(f)}
                style={{ padding: '9px 16px', borderRadius: 8, border: `2px solid ${family === f ? P : '#e2d8c8'}`, background: family === f ? P : '#fff', color: family === f ? '#fff' : '#1a0f00', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                {FAMILY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em', color: '#5c4a2e' }}>City</label>
          <select value={city} onChange={e => setCity(e.target.value as City)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '2px solid #e2d8c8', fontSize: 14, fontFamily: 'Georgia, serif', background: '#fff' }}>
            {(Object.keys(CITY_LABELS) as City[]).map(c => (
              <option key={c} value={c}>{CITY_LABELS[c]} (~{fmt(CITY_RENT[c])}/mo rent)</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em', color: '#5c4a2e' }}>
            Budget window: {months} months
          </label>
          <input type="range" min={3} max={12} value={months} onChange={e => setMonths(Number(e.target.value))}
            style={{ width: '100%', accentColor: P }} />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', color: '#1a0f00' }}>
            <input type="checkbox" checked={shipping} onChange={e => setShipping(e.target.checked)} style={{ accentColor: P, width: 18, height: 18 }} />
            Shipping a container from abroad (uncheck if buying furniture new in Israel)
          </label>
        </div>
      </div>

      <div style={{ background: '#2d1a00', borderRadius: 12, padding: 26, color: '#fff' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Estimated Total — {months} Months</div>
        <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 22 }}>{fmt(Math.round(result.total))}</div>
        <div style={{ display: 'grid', gap: 10, fontSize: 13.5 }}>
          <Row label={`Rent (${months} mo)`} value={fmt(Math.round(result.rentTotal))} />
          <Row label="Rental deposit (~2.5 mo)" value={fmt(Math.round(result.deposit))} />
          <Row label={`Living expenses (${months} mo)`} value={fmt(Math.round(result.livingTotal))} />
          <Row label="Flights" value={fmt(result.flightsCost)} />
          {shipping && <Row label="Shipping container" value={fmt(result.shippingCost)} />}
          <Row label="Setup buffer (furniture, phones, misc)" value={fmt(result.setupBuffer)} />
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#8a7a5c', marginTop: 18, lineHeight: 1.6 }}>
        This does not include Sal Klita payments, which typically offset part of these costs but arrive in installments over your first year — use the <Link href="/calculators/sal-klita" style={{ color: P }}>Sal Klita Calculator</Link> to estimate those separately. Figures are 2026 estimates for planning purposes; actual costs vary by household and market conditions.
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
      <span style={{ color: 'rgba(255,255,255,.75)' }}>{label}</span>
      <span style={{ fontWeight: 800 }}>{value}</span>
    </div>
  )
}
