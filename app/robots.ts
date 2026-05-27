import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/status'] }],
    sitemap: 'https://rephuby.com/sitemap.xml',
  }
}
