/**
 * MyMind Clone - Platform Detection Utilities
 * 
 * Detects platform from URLs and provides platform-specific metadata.
 * 
 * @fileoverview URL parsing and platform detection
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported platform identifiers.
 */
export type Platform =
        | 'twitter'
        | 'mastodon'
        | 'instagram'
        | 'youtube'
        | 'reddit'
        | 'letterboxd'
        | 'imdb'
        | 'goodreads'
        | 'amazon'
        | 'storygraph'
        | 'spotify'
        | 'github'
        | 'tiktok'
        | 'linkedin'
        | 'pinterest'
        | 'medium'
        | 'substack'
        | 'unknown';

/**
 * Platform metadata including colors and icons.
 */
export interface PlatformInfo {
        id: Platform;
        name: string;
        color: string;
        bgColor: string;
        icon: string; // Lucide icon name or custom
}

// =============================================================================
// PLATFORM DEFINITIONS
// =============================================================================

/**
 * Platform definitions with styling.
 */
export const PLATFORMS: Record<Platform, PlatformInfo> = {
        twitter: {
                id: 'twitter',
                name: 'X',
                color: '#000000',
                bgColor: 'rgba(0, 0, 0, 0.05)',
                icon: 'twitter',
        },
        mastodon: {
                id: 'mastodon',
                name: 'Mastodon',
                color: '#6364FF',
                bgColor: 'rgba(99, 100, 255, 0.08)',
                icon: 'atSign',
        },
        instagram: {
                id: 'instagram',
                name: 'Instagram',
                color: '#E4405F',
                bgColor: 'rgba(228, 64, 95, 0.08)',
                icon: 'instagram',
        },
        youtube: {
                id: 'youtube',
                name: 'YouTube',
                color: '#FF0000',
                bgColor: 'rgba(255, 0, 0, 0.08)',
                icon: 'youtube',
        },
        reddit: {
                id: 'reddit',
                name: 'Reddit',
                color: '#FF4500',
                bgColor: 'rgba(255, 69, 0, 0.08)',
                icon: 'messageSquare',
        },
        letterboxd: {
                id: 'letterboxd',
                name: 'Letterboxd',
                color: '#00E054',
                bgColor: 'rgba(0, 224, 84, 0.08)',
                icon: 'film',
        },
        imdb: {
                id: 'imdb',
                name: 'IMDb',
                color: '#F5C518',
                bgColor: 'rgba(245, 197, 24, 0.08)',
                icon: 'film',
        },
        spotify: {
                id: 'spotify',
                name: 'Spotify',
                color: '#1DB954',
                bgColor: 'rgba(29, 185, 84, 0.08)',
                icon: 'music',
        },
        github: {
                id: 'github',
                name: 'GitHub',
                color: '#24292E',
                bgColor: 'rgba(36, 41, 46, 0.05)',
                icon: 'github',
        },
        tiktok: {
                id: 'tiktok',
                name: 'TikTok',
                color: '#000000',
                bgColor: 'rgba(0, 0, 0, 0.05)',
                icon: 'video',
        },
        linkedin: {
                id: 'linkedin',
                name: 'LinkedIn',
                color: '#0A66C2',
                bgColor: 'rgba(10, 102, 194, 0.08)',
                icon: 'linkedin',
        },
        pinterest: {
                id: 'pinterest',
                name: 'Pinterest',
                color: '#E60023',
                bgColor: 'rgba(230, 0, 35, 0.08)',
                icon: 'image',
        },
        medium: {
                id: 'medium',
                name: 'Medium',
                color: '#000000',
                bgColor: 'rgba(0, 0, 0, 0.05)',
                icon: 'fileText',
        },
        substack: {
                id: 'substack',
                name: 'Substack',
                color: '#FF6719',
                bgColor: 'rgba(255, 103, 25, 0.08)',
                icon: 'mail',
        },
        goodreads: {
                id: 'goodreads',
                name: 'Goodreads',
                color: '#553B08',
                bgColor: 'rgba(85, 59, 8, 0.08)',
                icon: 'bookOpen',
        },
        amazon: {
                id: 'amazon',
                name: 'Amazon',
                color: '#FF9900',
                bgColor: 'rgba(255, 153, 0, 0.08)',
                icon: 'package',
        },
        storygraph: {
                id: 'storygraph',
                name: 'StoryGraph',
                color: '#9B7EBD',
                bgColor: 'rgba(155, 126, 189, 0.08)',
                icon: 'bookMarked',
        },
        unknown: {
                id: 'unknown',
                name: 'Web',
                color: '#6B7280',
                bgColor: 'rgba(107, 114, 128, 0.05)',
                icon: 'globe',
        },
};

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Detects the platform from a URL.
 */
export function detectPlatform(url: string | null | undefined): Platform {
        if (!url) return 'unknown';

        const urlLower = url.toLowerCase();

        // Twitter/X
        if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
                return 'twitter';
        }

        // Mastodon instances (various popular servers)
        if (urlLower.includes('mastodon') ||
                urlLower.includes('mathstodon') ||
                urlLower.includes('fosstodon') ||
                urlLower.includes('hachyderm.io') ||
                urlLower.includes('mas.to') ||
                urlLower.includes('mstdn.social') ||
                urlLower.includes('mstdn.jp') ||
                urlLower.includes('infosec.exchange') ||
                urlLower.includes('sigmoid.social')) {
                return 'mastodon';
        }

        // Instagram
        if (urlLower.includes('instagram.com')) {
                return 'instagram';
        }

        // YouTube
        if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
                return 'youtube';
        }

        // Reddit
        if (urlLower.includes('reddit.com')) {
                return 'reddit';
        }

        // Letterboxd
        if (urlLower.includes('letterboxd.com')) {
                return 'letterboxd';
        }

        // IMDb
        if (urlLower.includes('imdb.com')) {
                return 'imdb';
        }

        // Spotify
        if (urlLower.includes('spotify.com') || urlLower.includes('open.spotify.com')) {
                return 'spotify';
        }

        // GitHub
        if (urlLower.includes('github.com')) {
                return 'github';
        }

        // TikTok
        if (urlLower.includes('tiktok.com')) {
                return 'tiktok';
        }

        // LinkedIn
        if (urlLower.includes('linkedin.com')) {
                return 'linkedin';
        }

        // Pinterest
        if (urlLower.includes('pinterest.com') || urlLower.includes('pin.it')) {
                return 'pinterest';
        }

        // Medium
        if (urlLower.includes('medium.com')) {
                return 'medium';
        }

        // Substack
        if (urlLower.includes('substack.com')) {
                return 'substack';
        }

        // Goodreads
        if (urlLower.includes('goodreads.com')) {
                return 'goodreads';
        }

        // Amazon
        if (urlLower.includes('amazon.com') || urlLower.includes('amazon.co') || urlLower.includes('amzn.')) {
                return 'amazon';
        }

        // StoryGraph
        if (urlLower.includes('thestorygraph.com') || urlLower.includes('storygraph.com')) {
                return 'storygraph';
        }

        return 'unknown';
}

/**
 * Gets platform info for a URL.
 */
export function getPlatformInfo(url: string | null | undefined): PlatformInfo {
        const platform = detectPlatform(url);
        return PLATFORMS[platform];
}

/**
 * Extracts clean domain from URL.
 */
export function extractDomain(url: string | null | undefined): string | null {
        if (!url) return null;
        try {
                const hostname = new URL(url).hostname;
                return hostname.replace('www.', '');
        } catch {
                return null;
        }
}

/**
 * Checks if URL is a video platform.
 */
export function isVideoPlatform(url: string | null | undefined): boolean {
        const platform = detectPlatform(url);
        return ['youtube', 'tiktok', 'instagram'].includes(platform);
}

/**
 * Checks if URL is a social media platform.
 */
export function isSocialPlatform(url: string | null | undefined): boolean {
        const platform = detectPlatform(url);
        return ['twitter', 'mastodon', 'instagram', 'reddit', 'tiktok', 'linkedin'].includes(platform);
}
