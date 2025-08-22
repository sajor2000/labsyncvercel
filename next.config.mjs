/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build & Output Configuration
  outputFileTracingRoot: process.cwd(),
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  distDir: '.next',
  generateBuildId: process.env.VERCEL_GIT_COMMIT_SHA ? 
    async () => process.env.VERCEL_GIT_COMMIT_SHA : undefined,
  
  // Server Configuration
  serverExternalPackages: ['@supabase/supabase-js', 'openai', 'googleapis'],
  
  // Performance Optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  modularizeImports: {
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  
  // Package Import Optimization
  transpilePackages: ['@react-email/components', '@react-email/render'],
  
  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
        ]
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache fonts
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Redirects for common patterns
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/auth/signin',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
    ]
  },
  
  // Webpack Configuration
  webpack: (config, { isServer, webpack }) => {
    // Bundle analyzer (enable with ANALYZE=true)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        })
      )
    }
    
    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { module: /node_modules\/@supabase\/realtime-js/ },
      { module: /node_modules\/@supabase\/supabase-js/ },
    ]

    // Replace Node.js specific code in Edge runtime
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.versions': JSON.stringify({}),
          'process.versions.node': JSON.stringify(''),
        })
      )
    }
    
    // Polyfill for Edge runtime
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: false,
    }
    
    return config
  },
  
  // Additional Experimental Features
  experimental: {
    ...{
      optimizePackageImports: [
        '@radix-ui/react-accordion',
        '@radix-ui/react-alert-dialog',
        '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-label',
        '@radix-ui/react-popover',
        '@radix-ui/react-select',
        '@radix-ui/react-separator',
        '@radix-ui/react-slot',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-toast',
        '@radix-ui/react-tooltip',
        '@tanstack/react-query',
        'date-fns',
        'framer-motion',
        'react-hook-form',
        'recharts',
        'zod',
      ],
    },
    optimizeCss: true,
    optimizeServerReact: true,
    webpackBuildWorker: true,
  },
  
  // Environment Variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  },
  
  // TypeScript Configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint Configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
}

// Export configuration
export default nextConfig