/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Image domains
  images: {
    remotePatterns: [
      // Original domains converted
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Existing remotePatterns preserved
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
    ],
  },

  // ✅ API configuration for file uploads
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Increased for video uploads
    },
    responseLimit: false,
  },

  // ✅ Turbopack config
  turbopack: {
    root: __dirname,
  },

  // ✅ reactStrictMode enabled
  reactStrictMode: true,

  // ✅ Server external packages
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  // ✅ Webpack config for video.js and file handling
  webpack: (config, { isServer }) => {
    // For video.js and related dependencies
    config.module.rules.push({
      test: /\.node$/,
      use: 'raw-loader',
    });

    // Handle video files
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mov|avi|mkv)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/videos/',
            outputPath: 'static/videos/',
            name: '[name]-[hash].[ext]',
          },
        },
      ],
    });

    // For client-side, don't try to bundle fs/path
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },

  // ✅ Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_MAX_UPLOAD_SIZE: process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE || '2097152000', // 2GB default
  },

  // ✅ Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/student',
        permanent: false,
      },
    ];
  },

  // ✅ Headers for CORS and file uploads
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // ✅ Experimental features
  experimental: {
    // For Next.js 13/14 compatibility
    serverComponentsExternalPackages: ['fs', 'path', 'bcryptjs'],
    
    // Enable if you need these features
    // optimizeCss: true,
    // scrollRestoration: true,
  },

  // ✅ Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // ✅ Enable SWC minify for better performance
  swcMinify: true,
};

module.exports = nextConfig;