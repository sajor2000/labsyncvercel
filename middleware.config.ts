// Middleware configuration to optimize Edge runtime compatibility
export const middlewareConfig = {
  // Skip Supabase auth checks for static assets and API routes
  skipAuth: [
    '/_next',
    '/api/health',
    '/api/robots',
    '/api/sitemap',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
  
  // Routes that don't need rate limiting
  skipRateLimit: [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/images',
    '/fonts',
  ],
}