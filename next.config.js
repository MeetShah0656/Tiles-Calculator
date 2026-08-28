/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental performance options to optimize memory
  experimental: {
    webpackMemoryOptimizations: true,
  },

  // Silence warning/error and allow Turbopack by default
  turbopack: {},

  // Ensure webpack cache is configured efficiently to prevent in-memory cache bloat
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
