/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // Removed as it's unrecognized in Next.js 16

  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const cspScriptSrc = `'self' 'unsafe-inline' https://accounts.google.com${isDevelopment ? " 'unsafe-eval'" : ''}`;

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src ${cspScriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' https:; connect-src 'self' https://*.supabase.co https://api.example.com; frame-src https://accounts.google.com`,
          },
        ],
      },
    ];
  },
  // Explicitly use webpack instead of Turbopack for compatibility
  webpack: (config, { isServer, dev }) => {
    // Optimasi bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Hanya untuk development
    if (dev && !isServer) {
      // Tambahkan mode development specific optimasi
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              maxSize: 244000, // ~244KB
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              priority: 5,
              maxSize: 244000, // ~244KB
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
