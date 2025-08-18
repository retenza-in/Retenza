import "./src/env.js";
import withPWA from "next-pwa";

/** @type {import("next").NextConfig} */
const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/app-build-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /\/_next\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
  ],
})({
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
});

export default config;
