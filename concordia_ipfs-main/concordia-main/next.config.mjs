/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Handle Node.js modules that MongoDB depends on
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      fs: false,
      dns: false,
      child_process: false,
      aws4: false,
      'timers/promises': false,
      'gcp-metadata': false,
      'snappy': false,
      'socks': false,
      'mongodb-client-encryption': false,
      'kerberos': false,
      '@mongodb-js/zstd': false,
      '@aws-sdk/credential-providers': false
    };
    return config;
  },
}

export default nextConfig
