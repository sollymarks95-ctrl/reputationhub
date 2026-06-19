import './globals.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import CookieConsent from './components/CookieConsent'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'RepHuby Intelligence — Broker & Crypto Reputation Management',
  description: 'RepHuby Intelligence is the leading reputation management platform for forex brokers, crypto exchanges, and financial brands. 14 editorial portals, 150+ daily articles, verified reviews across global financial markets.',
  keywords: 'broker reputation management, crypto reputation management, forex broker reputation, financial brand reputation, online broker reviews, crypto exchange reputation, reputation management fintech, broker review management, forex reputation management, crypto broker reputation',
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  openGraph: {
    siteName: 'RepHuby Intelligence',
    type: 'website',
    locale: 'en_GB',
    title: 'RepHuby Intelligence — Broker & Crypto Reputation Management',
    description: 'The reputation infrastructure for financial brands. 14 editorial portals publishing 150+ daily articles about forex brokers, crypto exchanges, and global financial markets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepHuby Intelligence — Broker & Crypto Reputation Management',
    description: 'Reputation management platform for forex brokers and crypto exchanges.',
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
