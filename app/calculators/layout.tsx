import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { default: 'Aliyah Calculators & Tools', template: '%s | AliyaToday' },
  description: 'Free interactive tools for planning your Aliyah: cost calculator, Sal Klita calculator, and best-city quiz.',
  keywords: 'aliyah cost calculator, sal klita calculator, best city for olim, aliyah budget, moving to israel calculator',
  robots: 'index,follow',
  openGraph: {
    title: 'Aliyah Calculators & Tools | AliyaToday',
    description: 'Free interactive tools for planning your Aliyah: cost calculator, Sal Klita calculator, and best-city quiz.',
    siteName: 'AliyaToday',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aliyah Calculators & Tools | AliyaToday',
    description: 'Free interactive tools for planning your Aliyah.',
    site: '@aliyatoday',
  },
}

const P = '#c47d1a'

export default function CalculatorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f2ea', fontFamily: 'Georgia, serif', color: '#1a0f00' }}>
      <header style={{ background: 'linear-gradient(135deg, #2d1a00 0%, #1a0f00 100%)', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>✈️</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
              Aliya<span style={{ color: P }}>Today</span>
            </div>
          </Link>
          <nav style={{ display: 'flex', gap: 18, fontSize: 13 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,.75)', textDecoration: 'none' }}>Home</Link>
            <Link href="/calculators" style={{ color: P, fontWeight: 800, textDecoration: 'none' }}>Calculators</Link>
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>
        {children}
      </main>
      <footer style={{ borderTop: '1px solid #e2d8c8', padding: '24px 20px', textAlign: 'center', fontSize: 12, color: '#8a7a5c' }}>
        <p>These tools give estimates for planning purposes only. Always confirm exact figures with Misrad Haklita, Nefesh B'Nefesh, or the Jewish Agency before making decisions.</p>
        <p style={{ marginTop: 8 }}>© {new Date().getFullYear()} AliyaToday</p>
      </footer>
    </div>
  )
}
