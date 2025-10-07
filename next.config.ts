/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ❌ Completely ignore ESLint during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Allow builds even if there are TS errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
