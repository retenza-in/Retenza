import "./src/env.js";
import withPWA from "next-pwa";

/** @type {import("next").NextConfig} */
const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})({
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
});

export default config;
