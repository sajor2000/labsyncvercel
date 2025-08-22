export function GET() {
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /_next/
Disallow: /static/

# Sitemap
Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://labflow.vercel.app'}/sitemap.xml
`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}