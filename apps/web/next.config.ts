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
    unoptimized: process.env.STATIC_EXPORT === 'true',
  },

  /**
   * Enable experimental features for better performance.
   */
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
