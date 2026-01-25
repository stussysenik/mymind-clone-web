/**
 * Content Source Signatures
 *
 * Type-safe contracts defining what each platform scraper should produce.
 * Ensures consistent data structure across different content sources.
 *
 * @fileoverview Platform content signatures and validation
 */

import type { Platform } from '../platforms';

// =============================================================================
// BASE TYPES
// =============================================================================

/**
 * Base signature interface for all platforms
 */
export interface ContentSignature {
  platform: Platform;

  /** Fields that MUST be present for valid scrape */
  requiredFields: (keyof ScrapedContentFields)[];

  /** Title handling configuration */
  title: {
    /** Maximum length before truncation */
    maxLength: number;
    /** How to format author in title (null = no author in title) */
    authorFormat: 'prefix' | 'suffix' | 'separate' | null;
    /** Separator between author and title (e.g., ": ", " - ") */
    authorSeparator?: string;
  };

  /** Display configuration for cards */
  display: {
    /** Where author name should appear */
    authorPosition: 'title' | 'subtitle' | 'metadata' | 'hidden';
    /** Primary visual source */
    primaryVisual: 'image' | 'screenshot' | 'video-thumbnail';
    /** Show platform badge on card */
    showPlatformBadge: boolean;
  };

  /** Content extraction requirements */
  extraction: {
    /** Try to extract original images (vs screenshot only) */
    extractImages: boolean;
    /** Support for multi-image (carousel) posts */
    supportsCarousel: boolean;
    /** Extract embedded media (videos, audio) */
    extractEmbeddedMedia: boolean;
  };
}

/**
 * Fields that can be extracted from content
 */
export interface ScrapedContentFields {
  title: string;
  description: string;
  imageUrl: string | null;
  images: string[];
  content: string;
  author: string;
  publishedAt: string;
  domain: string;
  url: string;
}

// =============================================================================
// PLATFORM SIGNATURES
// =============================================================================

export const INSTAGRAM_SIGNATURE: ContentSignature = {
  platform: 'instagram',
  requiredFields: ['title', 'imageUrl'],
  title: {
    maxLength: 80,
    authorFormat: 'separate', // Author is NEVER in title
    authorSeparator: undefined,
  },
  display: {
    authorPosition: 'subtitle', // @username below title
    primaryVisual: 'image',
    showPlatformBadge: true,
  },
  extraction: {
    extractImages: true,
    supportsCarousel: true,
    extractEmbeddedMedia: false, // Videos handled separately
  },
};

export const TWITTER_SIGNATURE: ContentSignature = {
  platform: 'twitter',
  requiredFields: ['title', 'content'],
  title: {
    maxLength: 100,
    authorFormat: 'prefix', // "@username: tweet text"
    authorSeparator: ': ',
  },
  display: {
    authorPosition: 'title', // Integrated into title
    primaryVisual: 'image',
    showPlatformBadge: true,
  },
  extraction: {
    extractImages: true,
    supportsCarousel: true,
    extractEmbeddedMedia: true,
  },
};

export const YOUTUBE_SIGNATURE: ContentSignature = {
  platform: 'youtube',
  requiredFields: ['title', 'imageUrl'],
  title: {
    maxLength: 100,
    authorFormat: 'separate',
    authorSeparator: undefined,
  },
  display: {
    authorPosition: 'subtitle', // Channel name
    primaryVisual: 'video-thumbnail',
    showPlatformBadge: true,
  },
  extraction: {
    extractImages: true,
    supportsCarousel: false,
    extractEmbeddedMedia: true,
  },
};

export const LETTERBOXD_SIGNATURE: ContentSignature = {
  platform: 'letterboxd',
  requiredFields: ['title'],
  title: {
    maxLength: 100,
    authorFormat: null, // No author in film titles
    authorSeparator: undefined,
  },
  display: {
    authorPosition: 'metadata', // Director in metadata
    primaryVisual: 'image', // Movie poster
    showPlatformBadge: true,
  },
  extraction: {
    extractImages: true,
    supportsCarousel: false,
    extractEmbeddedMedia: false,
  },
};

export const REDDIT_SIGNATURE: ContentSignature = {
  platform: 'reddit',
  requiredFields: ['title', 'content'],
  title: {
    maxLength: 120,
    authorFormat: 'separate',
    authorSeparator: undefined,
  },
  display: {
    authorPosition: 'metadata', // u/username in metadata
    primaryVisual: 'screenshot', // Reddit layouts vary too much
    showPlatformBadge: true,
  },
  extraction: {
    extractImages: true,
    supportsCarousel: true,
    extractEmbeddedMedia: true,
  },
};

export const GITHUB_SIGNATURE: ContentSignature = {
  platform: 'github',
  requiredFields: ['title'],
  title: {
    maxLength: 100,
    authorFormat: 'prefix', // "owner/repo"
    authorSeparator: '/',
  },
  display: {
    authorPosition: 'title', // Part of repo name
    primaryVisual: 'screenshot', // Repo preview
    showPlatformBadge: true,
  },
  extraction: {
    extractImages: false,
    supportsCarousel: false,
    extractEmbeddedMedia: false,
  },
};

export const GENERIC_SIGNATURE: ContentSignature = {
  platform: 'unknown',
  requiredFields: ['title'],
  title: {
    maxLength: 100,
    authorFormat: 'separate',
    authorSeparator: undefined,
  },
  display: {
    authorPosition: 'metadata',
    primaryVisual: 'screenshot',
    showPlatformBadge: false,
  },
  extraction: {
    extractImages: true,
    supportsCarousel: false,
    extractEmbeddedMedia: false,
  },
};

// =============================================================================
// SIGNATURE REGISTRY
// =============================================================================

/**
 * Registry of all platform signatures
 */
export const CONTENT_SIGNATURES: Partial<Record<Platform, ContentSignature>> = {
  instagram: INSTAGRAM_SIGNATURE,
  twitter: TWITTER_SIGNATURE,
  youtube: YOUTUBE_SIGNATURE,
  letterboxd: LETTERBOXD_SIGNATURE,
  reddit: REDDIT_SIGNATURE,
  github: GITHUB_SIGNATURE,
  unknown: GENERIC_SIGNATURE,
};

/**
 * Get signature for a platform, with fallback to generic
 */
export function getContentSignature(platform: Platform): ContentSignature {
  return CONTENT_SIGNATURES[platform] ?? GENERIC_SIGNATURE;
}

/**
 * Get signature from URL
 */
export function getContentSignatureFromUrl(url: string): ContentSignature {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('instagram.com')) return INSTAGRAM_SIGNATURE;
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return TWITTER_SIGNATURE;
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return YOUTUBE_SIGNATURE;
    if (hostname.includes('letterboxd.com')) return LETTERBOXD_SIGNATURE;
    if (hostname.includes('reddit.com')) return REDDIT_SIGNATURE;
    if (hostname.includes('github.com')) return GITHUB_SIGNATURE;

    return GENERIC_SIGNATURE;
  } catch {
    return GENERIC_SIGNATURE;
  }
}
