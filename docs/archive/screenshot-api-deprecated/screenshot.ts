/**
 * MyMind Clone - Screenshot Capture Module
 *
 * High-resolution screenshot capture with ScreenshotOne API fallback to Microlink.
 *
 * Features:
 * - 1080p+ archival quality screenshots via ScreenshotOne
 * - Platform-specific viewport optimization (YouTube, Instagram, Twitter, etc.)
 * - Exponential backoff retry logic (1s, 2s, 4s)
 * - Graceful fallback to Microlink on failure
 *
 * @fileoverview Screenshot capture with quality optimization
 */

import { detectPlatform, type Platform } from './platforms';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Screenshot capture result
 */
export interface ScreenshotResult {
	url: string;
	source: 'screenshotone' | 'microlink';
	platform: Platform;
	success: boolean;
	error?: string;
}

/**
 * ScreenshotOne API options
 */
export interface ScreenshotOptions {
	viewport_width?: number;
	viewport_height?: number;
	device_scale_factor?: number;
	format?: 'png' | 'jpeg' | 'webp';
	full_page?: boolean;
	block_ads?: boolean;
	block_cookie_banners?: boolean;
	delay?: number; // Delay in seconds before taking screenshot
}

/**
 * Platform-specific viewport configuration
 */
interface PlatformConfig {
	viewport_width: number;
	viewport_height: number;
	device_scale_factor?: number;
	full_page: boolean;
	delay?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1 second
const SCREENSHOTONE_API_URL = process.env.SCREENSHOTONE_API_URL || 'https://api.screenshotone.com/take';
const SCREENSHOTONE_API_KEY = process.env.SCREENSHOTONE_API_KEY;

/**
 * Platform-specific viewport configurations for optimal capture
 */
const PLATFORM_CONFIGS: Record<Platform, PlatformConfig | null> = {
	// Video platforms - desktop 1080p
	youtube: {
		viewport_width: 1920,
		viewport_height: 1080,
		full_page: false, // Just viewport, not full page
		delay: 2, // Wait for video player to load
	},

	// Social media - mobile viewports
	instagram: {
		viewport_width: 375, // iPhone X width
		viewport_height: 812, // iPhone X height
		device_scale_factor: 2, // Retina display
		full_page: true, // Capture full post + caption
		delay: 2, // Wait for image carousel to load
	},
	twitter: {
		viewport_width: 1200,
		viewport_height: 800,
		full_page: false, // Just viewport
		delay: 1, // Wait for images/video to load
	},
	tiktok: {
		viewport_width: 375,
		viewport_height: 812,
		device_scale_factor: 2,
		full_page: false,
		delay: 2,
	},
	linkedin: {
		viewport_width: 1200,
		viewport_height: 800,
		full_page: false,
		delay: 1,
	},
	reddit: {
		viewport_width: 1920,
		viewport_height: 1080,
		full_page: false,
		delay: 1,
	},
	pinterest: {
		viewport_width: 1200,
		viewport_height: 1600,
		full_page: true, // Capture full pin
		delay: 1,
	},

	// Content platforms
	medium: {
		viewport_width: 1200,
		viewport_height: 1600,
		full_page: false,
		delay: 1,
	},
	substack: {
		viewport_width: 1200,
		viewport_height: 1600,
		full_page: false,
		delay: 1,
	},
	github: {
		viewport_width: 1920,
		viewport_height: 1080,
		full_page: false,
		delay: 0,
	},

	// Others
	mastodon: {
		viewport_width: 1200,
		viewport_height: 800,
		full_page: false,
		delay: 1,
	},
	letterboxd: {
		viewport_width: 1200,
		viewport_height: 1600,
		full_page: false,
		delay: 1,
	},
	imdb: {
		viewport_width: 1920,
		viewport_height: 1080,
		full_page: false,
		delay: 1,
	},
	goodreads: {
		viewport_width: 1200,
		viewport_height: 1600,
		full_page: false,
		delay: 1,
	},
	amazon: {
		viewport_width: 1920,
		viewport_height: 1080,
		full_page: false,
		delay: 1,
	},
	storygraph: {
		viewport_width: 1200,
		viewport_height: 1600,
		full_page: false,
		delay: 1,
	},
	spotify: {
		viewport_width: 1920,
		viewport_height: 1080,
		full_page: false,
		delay: 1,
	},

	// Generic websites
	unknown: null, // Use default config
};

/**
 * Default configuration for unknown platforms
 */
const DEFAULT_CONFIG: PlatformConfig = {
	viewport_width: 1920,
	viewport_height: 1080,
	full_page: false,
	delay: 0,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Sleep helper for exponential backoff
 */
function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 * Pattern reused from apps/web/app/api/enrich/route.ts:40-62
 */
async function withRetry<T>(
	fn: () => Promise<T>,
	retries: number = MAX_RETRIES,
	backoffMs: number = INITIAL_BACKOFF_MS
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < retries) {
				const waitTime = backoffMs * Math.pow(2, attempt);
				console.log(`[Screenshot] Retry ${attempt + 1}/${retries} after ${waitTime}ms`);
				await sleep(waitTime);
			}
		}
	}

	throw lastError;
}

/**
 * Get platform-specific configuration
 */
function getPlatformConfig(url: string): PlatformConfig {
	const platform = detectPlatform(url);
	return PLATFORM_CONFIGS[platform] ?? DEFAULT_CONFIG;
}

/**
 * Build Microlink fallback URL
 */
function buildMicrolinkUrl(url: string): string {
	return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

// =============================================================================
// CORE SCREENSHOT FUNCTIONS
// =============================================================================

/**
 * Capture screenshot using ScreenshotOne API
 *
 * @param url - URL to capture
 * @param options - Optional screenshot configuration (overrides platform defaults)
 * @returns Screenshot result with URL
 */
export async function captureWithScreenshotOne(
	url: string,
	options?: Partial<ScreenshotOptions>
): Promise<ScreenshotResult> {
	if (!SCREENSHOTONE_API_KEY) {
		throw new Error('ScreenshotOne API key not configured');
	}

	// Get platform-specific configuration
	const platformConfig = getPlatformConfig(url);
	const platform = detectPlatform(url);

	// Merge platform config with custom options
	const finalOptions: ScreenshotOptions = {
		viewport_width: platformConfig.viewport_width,
		viewport_height: platformConfig.viewport_height,
		device_scale_factor: platformConfig.device_scale_factor,
		format: 'png', // Lossless quality for archival
		full_page: platformConfig.full_page,
		block_ads: true,
		block_cookie_banners: true,
		delay: platformConfig.delay,
		...options, // Allow override
	};

	// Build ScreenshotOne API URL
	const params = new URLSearchParams({
		access_key: SCREENSHOTONE_API_KEY,
		url: url,
		viewport_width: String(finalOptions.viewport_width),
		viewport_height: String(finalOptions.viewport_height),
		format: finalOptions.format ?? 'png',
		full_page: String(finalOptions.full_page),
		block_ads: String(finalOptions.block_ads),
		block_cookie_banners: String(finalOptions.block_cookie_banners),
		...(finalOptions.device_scale_factor && {
			device_scale_factor: String(finalOptions.device_scale_factor),
		}),
		...(finalOptions.delay && {
			delay: String(finalOptions.delay),
		}),
	});

	const screenshotUrl = `${SCREENSHOTONE_API_URL}?${params.toString()}`;

	// Test if screenshot is accessible (ScreenshotOne returns 200 with image immediately)
	const response = await fetch(screenshotUrl, {
		method: 'HEAD', // Just check if it's accessible
		headers: {
			'User-Agent': 'MyMind/1.0 (Screenshot Service)',
		},
	});

	if (!response.ok) {
		throw new Error(`ScreenshotOne API error: ${response.status} ${response.statusText}`);
	}

	console.log(`[Screenshot] ScreenshotOne success for ${platform} (${finalOptions.viewport_width}x${finalOptions.viewport_height})`);

	return {
		url: screenshotUrl,
		source: 'screenshotone',
		platform,
		success: true,
	};
}

/**
 * Main screenshot capture function with fallback chain
 *
 * Flow:
 * 1. Try ScreenshotOne with retry (1s, 2s, 4s backoff)
 * 2. Fall back to Microlink on failure
 * 3. Return null if both fail (rare)
 *
 * @param url - URL to capture
 * @returns Screenshot URL or null if all methods fail
 */
export async function captureScreenshot(url: string): Promise<string | null> {
	const platform = detectPlatform(url);

	try {
		// Try ScreenshotOne with retry
		const result = await withRetry(
			() => captureWithScreenshotOne(url),
			MAX_RETRIES,
			INITIAL_BACKOFF_MS
		);

		console.log(`[Screenshot] Success: ${result.source} for ${platform}`);
		return result.url;
	} catch (screenshotOneError) {
		// Log ScreenshotOne failure
		const errorMsg = screenshotOneError instanceof Error
			? screenshotOneError.message
			: 'Unknown error';
		console.warn(`[Screenshot] ScreenshotOne failed for ${platform}: ${errorMsg}`);

		// Fall back to Microlink
		try {
			const microlinkUrl = buildMicrolinkUrl(url);
			console.log(`[Screenshot] Falling back to Microlink for ${platform}`);
			return microlinkUrl;
		} catch (microlinkError) {
			console.error(`[Screenshot] All methods failed for ${platform}:`, microlinkError);
			return null;
		}
	}
}

// =============================================================================
// MONITORING AND UTILITIES
// =============================================================================

/**
 * Check if ScreenshotOne is configured
 */
export function isScreenshotOneConfigured(): boolean {
	return !!SCREENSHOTONE_API_KEY;
}

/**
 * Get screenshot service status
 */
export function getScreenshotServiceStatus(): {
	screenshotone: boolean;
	microlink: boolean;
} {
	return {
		screenshotone: isScreenshotOneConfigured(),
		microlink: true, // Microlink is always available as fallback
	};
}
