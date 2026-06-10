import './globals.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import CookieConsent from './components/CookieConsent'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'RepHuby Intelligence — Global Markets & Trade News',
  description: 'Professional market intelligence, trade news, and financial analysis across global commodity, currency, and equity markets.',
  keywords: 'commodity trading, trade finance, financial markets, gold price, forex, market analysis',
  // robots handled per-page — portals set index:true, noindex portals set noindex
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
        {children}
        <Analytics />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7010447785244398"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <CookieConsent />
      </body>
    </html>
  )
}
