import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/auth/', '/settings/'],
    },
    sitemap: 'https://labflow.vercel.app/sitemap.xml',
  }
}