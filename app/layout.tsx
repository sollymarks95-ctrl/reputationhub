import type { Metadata } from 'next'
import CookieConsent from './components/CookieConsent'

export const metadata: Metadata = {
  title: 'RepHuby Intelligence — Global Markets & Trade News',
  description: 'Professional market intelligence, trade news, and financial analysis across global commodity, currency, and equity markets.',
  keywords: 'commodity trading, trade finance, financial markets, gold price, forex, market analysis',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: {
    siteName: 'RepHuby Intelligence',
    type: 'website',
    locale: 'en_GB',
  },
  other: {
    'google-site-verification': 'rephub-intelligence-verified',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'#064E3B', color:'#fff', textAlign:'center', padding:'7px 12px', fontSize:'12px', lineHeight:'1.4' }}>
          📋 All content on RepHuby is produced independently. eToro has not hired or engaged our services — all data and case studies are editorial and for research purposes only.
        </div>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
