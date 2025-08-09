/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle IPFS and other Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Ignore dynamic require warnings from IPFS
    config.module.exprContextCritical = false;

    return config;
  },

  // Allow IPFS gateways
  images: {
    domains: [
      'gateway.pinata.cloud',
      'ipfs.io',
      'dweb.link',
      'cloudflare-ipfs.com',
      '4everland.io',
      'gateway.ipfs.io',
    ],
  },
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@web3-storage/w3up-client']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;