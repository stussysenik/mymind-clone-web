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
  /**
   * Image optimization configuration.
   * Allows loading images from external domains.
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Use modern formats for better performance
    formats: ['image/avif', 'image/webp'],
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
