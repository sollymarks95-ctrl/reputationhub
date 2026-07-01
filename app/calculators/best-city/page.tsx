'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const P = '#c47d1a'

type City = 'netanya' | 'raanana' | 'jerusalem' | 'telaviv' | 'modiin' | 'beitshemesh' | 'haifa' | 'ashdod' | 'beersheva'

const CITY_INFO: Record<City, { name: string; blurb: string; href: string }> = {
  netanya:      { name: 'Netanya', blurb: 'Beachfront, affordable, huge Anglo/French community, easy train to Tel Aviv.', href: '/article/aliya-today/2026-07-01-moving-to-netanya-as-a-new-oleh-the-complete-2026-guide' },
  raanana:      { name: "Ra'anana", blurb: 'Leafy, family-oriented, best-in-class Anglo schools, local hi-tech jobs.', href: '/article/aliya-today/2026-07-01-moving-to-raanana-as-a-new-oleh-the-complete-2026-guide' },
  jerusalem:    { name: 'Jerusalem', blurb: 'Deep religious and cultural infrastructure, historic, large Anglo-religious community.', href: '/article/aliya-today/2026-07-01-moving-to-jerusalem-as-a-new-oleh-the-complete-2026-guide' },
  telaviv:      { name: 'Tel Aviv', blurb: 'Center of Israeli tech and nightlife, most expensive, least "Anglo bubble."' , href: '/' },
  modiin:       { name: "Modi'in", blurb: 'Planned city, family-friendly, strong Anglo presence, central location.', href: '/' },
  beitshemesh:  { name: 'Beit Shemesh', blurb: 'More affordable, growing religious Anglo community, commutable to Jerusalem.', href: '/' },
  haifa:        { name: 'Haifa', blurb: 'Coastal, more affordable, tech industry (Matam park), smaller Anglo community.', href: '/' },
  ashdod:       { name: 'Ashdod', blurb: 'Affordable beach city, growing community, less English-language infrastructure.', href: '/' },
  beersheva:    { name: "Be'er Sheva", blurb: 'Most affordable major city, Ben-Gurion University, growing tech hub, desert climate.', href: '/' },
}

type Answers = {
  budget: 'low' | 'mid' | 'high' | null
  kids: 'yes' | 'no' | null
  religious: 'yes' | 'no' | null
  work: 'remote' | 'local' | null
  vibe: 'beach' | 'city' | 'quiet' | null
}

function score(answers: Answers): City {
  const points: Record<City, number> = {
    netanya: 0, raanana: 0, jerusalem: 0, telaviv: 0, modiin: 0, beitshemesh: 0, haifa: 0, ashdod: 0, beersheva: 0,
  }
  if (answers.budget === 'low') { points.beersheva += 3; points.ashdod += 3; points.beitshemesh += 2; points.haifa += 2 }
  if (answers.budget === 'mid') { points.netanya += 3; points.modiin += 2; points.jerusalem += 1 }
  if (answers.budget === 'high') { points.telaviv += 3; points.raanana += 3; points.jerusalem += 1 }

  if (answers.kids === 'yes') { points.raanana += 3; points.modiin += 3; points.beitshemesh += 2; points.netanya += 1 }
  if (answers.kids === 'no') { points.telaviv += 2; points.jerusalem += 1 }

  if (answers.religious === 'yes') { points.jerusalem += 3; points.beitshemesh += 3; points.raanana += 1 }
  if (answers.religious === 'no') { points.telaviv += 2; points.haifa += 2; points.netanya += 1 }

  if (answers.work === 'local') { points.raanana += 2; points.telaviv += 2; points.jerusalem += 1; points.beersheva += 1 }
  if (answers.work === 'remote') { points.netanya += 2; points.ashdod += 1; points.beitshemesh += 1 }

  if (answers.vibe === 'beach') { points.netanya += 3; points.telaviv += 2; points.ashdod += 2 }
  if (answers.vibe === 'city') { points.telaviv += 3; points.jerusalem += 2 }
  if (answers.vibe === 'quiet') { points.modiin += 2; points.raanana += 2; points.beersheva += 1 }

  return (Object.keys(points) as City[]).reduce((best, c) => points[c] > points[best] ? c : best, 'netanya' as City)
}

const QUESTIONS: { key: keyof Answers; label: string; options: { value: string; label: string }[] }[] = [
  { key: 'budget', label: 'What\'s your monthly housing budget?', options: [
    { value: 'low', label: 'Under ₪5,500/month' },
    { value: 'mid', label: '₪5,500-₪8,500/month' },
    { value: 'high', label: '₪8,500+/month' },
  ]},
  { key: 'kids', label: 'Are you moving with children?', options: [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]},
  { key: 'religious', label: 'Is a strong religious/Orthodox community a priority?', options: [
    { value: 'yes', label: 'Yes, important to us' },
    { value: 'no', label: 'Not a priority' },
  ]},
  { key: 'work', label: 'How will you work?', options: [
    { value: 'remote', label: 'Remote / for a company abroad' },
    { value: 'local', label: 'Locally, in-person' },
  ]},
  { key: 'vibe', label: 'What lifestyle appeals most?', options: [
    { value: 'beach', label: 'Beach city' },
    { value: 'city', label: 'Big-city energy' },
    { value: 'quiet', label: 'Quiet suburb' },
  ]},
]

export default function BestCityQuiz() {
  const [answers, setAnswers] = useState<Answers>({ budget: null, kids: null, religious: null, work: null, vibe: null })
  const [showResult, setShowResult] = useState(false)

  const allAnswered = Object.values(answers).every(v => v !== null)
  const result = useMemo(() => allAnswered ? score(answers) : null, [answers, allAnswered])

  function reset() {
    setAnswers({ budget: null, kids: null, religious: null, work: null, vibe: null })
    setShowResult(false)
  }

  return (
    <div>
      <Link href="/calculators" style={{ fontSize: 12.5, color: P, textDecoration: 'none', fontWeight: 700 }}>← All calculators</Link>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: '14px 0 6px' }}>🗺️ Best City for Olim Quiz</h1>
      <p style={{ fontSize: 14, color: '#6b5a3e', marginBottom: 28, lineHeight: 1.6 }}>
        Answer five quick questions to get a personalized city recommendation.
      </p>

      {!showResult ? (
        <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderRadius: 12, padding: 26 }}>
          {QUESTIONS.map(q => (
            <div key={q.key} style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{q.label}</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {q.options.map(o => (
                  <button key={o.value}
                    onClick={() => setAnswers(a => ({ ...a, [q.key]: o.value }))}
                    style={{
                      padding: '9px 16px', borderRadius: 8,
                      border: `2px solid ${answers[q.key] === o.value ? P : '#e2d8c8'}`,
                      background: answers[q.key] === o.value ? P : '#fff',
                      color: answers[q.key] === o.value ? '#fff' : '#1a0f00',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif',
                    }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            disabled={!allAnswered}
            onClick={() => setShowResult(true)}
            style={{
              marginTop: 6, padding: '13px 28px', borderRadius: 8, border: 'none',
              background: allAnswered ? P : '#e2d8c8', color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: allAnswered ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif',
            }}>
            See My Result →
          </button>
        </div>
      ) : result && (
        <div style={{ background: '#2d1a00', borderRadius: 12, padding: 32, color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Your Best-Fit City</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 14 }}>{CITY_INFO[result].name}</div>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.85)', maxWidth: 460, margin: '0 auto 22px', lineHeight: 1.6 }}>{CITY_INFO[result].blurb}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={CITY_INFO[result].href} style={{ padding: '11px 22px', borderRadius: 8, background: P, color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
              Read the full guide →
            </Link>
            <button onClick={reset} style={{ padding: '11px 22px', borderRadius: 8, background: 'transparent', border: '2px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              Retake Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
