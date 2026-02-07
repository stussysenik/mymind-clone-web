/**
 * MyMind Clone - Next.js Configuration
 * 
 * Configures Next.js settings including image domains,
 * experimental features, and build optimizations.
 * 
 * @fileoverview Next.js configuration
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Capacitor builds
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24h — prevents re-fetches of upstream CDN URLs between save and background extraction
    unoptimized: process.env.STATIC_EXPORT === 'true',
  },

  /**
   * Enable experimental features for better performance.
   */
  // Allow cross-origin dev requests from mobile devices on LAN
  allowedDevOrigins: ['192.168.0.169'],

  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
