/**
 * Instagram Carousel Scraper with Stealth Mode and Metrics
 *
 * Strategy: Uses stealth browser factory with bot evasion,
 * intercepts CDN image requests, detects carousel size from DOM.
 *
 * Fallback chain:
 * 1. Embed page with browser navigation (most reliable)
 * 2. Direct post page with stealth browser
 * 3. Static embed HTML parsing (fastest, may miss images)
 */

import type { Page, Response } from 'playwright';
import {
	createStealthPage,
	humanDelay,
	humanClick,
	withScraperMetrics,
	categorizeError,
} from './browser-factory';
import {
	getScraperConfig,
	DEFAULT_VIEWPORT,
	USER_AGENTS,
	debugLog,
} from './scraper-config';
import { INSTAGRAM_SELECTORS, CDN_PATTERNS, findFirst } from './selectors';
import { recordScraperEvent } from './scraper-metrics';

// =============================================================================
// TYPES
// =============================================================================

export interface InstagramMediaItem {
	url: string;
	type: 'image' | 'video';
	thumbnailUrl?: string;
}

export interface InstagramScraperResult {
	images: string[];
	media: InstagramMediaItem[];
	caption: string;
	author: string;
	slideCount: number;
}

export interface InstagramQuickResult {
	firstImage: string | null;
	caption: string;
	author: string;
	isCarousel: boolean;
	expectedSlideCount: number;
}

interface ImageCandidate {
	url: string;
	timestamp: number;
	contentType?: string;
}

// =============================================================================
// IMAGE QUALITY FILTERING
// =============================================================================

function isCarouselImage(url: string): boolean {
	if (!url.includes(CDN_PATTERNS.instagram.highRes)) {
		return false;
	}

	for (const pattern of CDN_PATTERNS.instagram.exclude) {
		if (url.includes(pattern)) {
			return false;
		}
	}

	const urlLower = url.toLowerCase();
	if (!urlLower.includes('.jpg') && !urlLower.includes('.jpeg') && !urlLower.includes('.webp')) {
		return false;
	}

	return true;
}

function getImageSignature(url: string): string {
	try {
		const parsed = new URL(url);
		const pathParts = parsed.pathname.split('/');
		const mediaSegment = pathParts.find((p) => p.includes('_') && p.length > 20);
		if (mediaSegment) {
			return mediaSegment.split('_')[0];
		}
		return parsed.pathname;
	} catch {
		return url;
	}
}

function deduplicateImages(images: ImageCandidate[]): string[] {
	const seen = new Set<string>();
	const unique: string[] = [];

	const sorted = [...images].sort((a, b) => a.timestamp - b.timestamp);

	for (const img of sorted) {
		const sig = getImageSignature(img.url);
		if (!seen.has(sig)) {
			seen.add(sig);
			unique.push(img.url);
		}
	}

	return unique;
}

// =============================================================================
// BROWSER HELPERS
// =============================================================================

async function detectCarouselSize(page: Page): Promise<number> {
	const config = getScraperConfig();

	try {
		// Method 1: Count carousel indicator dots
		for (const selector of INSTAGRAM_SELECTORS.carouselDots) {
			const dotCount = await page.locator(selector).count();
			if (dotCount > 1) {
				debugLog('InstagramScraper', `Detected ${dotCount} carousel dots via ${selector}`);
				return Math.min(dotCount, config.maxCarouselSize);
			}
		}

		// Method 2: Check for Next button
		const nextSelector = findFirst(INSTAGRAM_SELECTORS.nextButton);
		const hasNextButton = (await page.locator(nextSelector).count()) > 0;
		if (hasNextButton) {
			debugLog('InstagramScraper', 'Carousel detected (has Next button)');
			return config.maxCarouselSize;
		}

		// Method 3: Count images in carousel list
		for (const selector of INSTAGRAM_SELECTORS.carouselList) {
			const listImages = await page.locator(selector).count();
			if (listImages > 1) {
				debugLog('InstagramScraper', `Found ${listImages} images in carousel list`);
				return Math.min(listImages, config.maxCarouselSize);
			}
		}

		return 1;
	} catch (error) {
		debugLog('InstagramScraper', 'Error detecting carousel size:', error);
		return 1;
	}
}

async function dismissLoginPopup(page: Page): Promise<void> {
	for (const selector of INSTAGRAM_SELECTORS.loginPopupDismiss) {
		try {
			const btn = page.locator(selector).first();
			if (await btn.isVisible({ timeout: 1000 })) {
				await btn.click();
				await humanDelay(100, 300);
				debugLog('InstagramScraper', `Dismissed popup via ${selector}`);
				break;
			}
		} catch {
			// Continue
		}
	}
}

async function dismissCookieBanner(page: Page): Promise<void> {
	for (const selector of INSTAGRAM_SELECTORS.cookieBanner) {
		try {
			const btn = page.locator(selector).first();
			if (await btn.isVisible({ timeout: 500 })) {
				await btn.click();
				await humanDelay(100, 200);
				debugLog('InstagramScraper', `Dismissed cookie banner via ${selector}`);
				break;
			}
		} catch {
			// Continue
		}
	}
}

async function extractMetadata(page: Page): Promise<{ caption: string; author: string }> {
	let caption = '';
	let author = '';

	try {
		const ogTitle = await page
			.locator(INSTAGRAM_SELECTORS.meta.title)
			.getAttribute('content');
		if (ogTitle) {
			const authorMatch = ogTitle.match(/^([^:]+)\s+on\s+Instagram/i);
			if (authorMatch) {
				author = authorMatch[1].trim();
			}
		}

		const ogDesc = await page
			.locator(INSTAGRAM_SELECTORS.meta.description)
			.getAttribute('content');
		if (ogDesc) {
			const captionMatch = ogDesc.match(/(?:\d+[KM]?\s*(?:likes?|comments?)[,\s-]*)*(.+)/i);
			caption = captionMatch ? captionMatch[1].trim() : ogDesc;
		}
	} catch (e) {
		debugLog('InstagramScraper', 'Error extracting metadata:', e);
	}

	return { caption, author };
}

async function navigateCarousel(page: Page, expectedSize: number): Promise<number> {
	const config = getScraperConfig();
	let navigatedCount = 0;
	const maxAttempts = Math.min(expectedSize, config.maxCarouselSize);

	debugLog('InstagramScraper', `Navigating carousel, expecting ${expectedSize} slides`);

	for (let i = 0; i < maxAttempts - 1; i++) {
		try {
			const nextSelector = findFirst(INSTAGRAM_SELECTORS.nextButton);
			const nextButton = page.locator(nextSelector).first();
			const isVisible = await nextButton.isVisible({ timeout: 1500 }).catch(() => false);

			if (!isVisible) {
				debugLog('InstagramScraper', `No more Next button after ${navigatedCount} navigations`);
				break;
			}

			// Use human-like click with random delays
			await humanClick(page, nextSelector);
			navigatedCount++;

			// Wait for new image to load
			await humanDelay(300, 600);

			debugLog('InstagramScraper', `Clicked Next (${navigatedCount}/${maxAttempts - 1})`);
		} catch (e) {
			debugLog('InstagramScraper', `Navigation stopped: ${e}`);
			break;
		}
	}

	return navigatedCount + 1;
}

// =============================================================================
// STRATEGY 1: EMBED PAGE WITH NAVIGATION
// =============================================================================

async function scrapeViaEmbed(shortcode: string): Promise<InstagramScraperResult> {
	const config = getScraperConfig();
	const capturedImages: ImageCandidate[] = [];
	let imageCounter = 0;

	const { page, cleanup } = await createStealthPage();

	try {
		// Set up network interception
		page.on('response', (response: Response) => {
			const url = response.url();
			const contentType = response.headers()['content-type'] || '';

			if (!isCarouselImage(url)) return;
			if (!contentType.includes('image/')) return;

			capturedImages.push({
				url,
				timestamp: imageCounter++,
				contentType,
			});

			debugLog('InstagramScraper', `Embed captured image #${imageCounter}: ${url.slice(0, 80)}...`);
		});

		const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
		debugLog('InstagramScraper', `Strategy 1: Navigating to embed: ${embedUrl}`);

		await page.goto(embedUrl, {
			waitUntil: 'networkidle',
			timeout: config.navigationTimeout + 5000,
		});

		await humanDelay(500, 1000);

		// Extract metadata from embed
		let caption = '';
		let author = '';

		try {
			const captionEl = page.locator(INSTAGRAM_SELECTORS.embed.caption).first();
			if (await captionEl.isVisible({ timeout: 1000 })) {
				caption = await captionEl.innerText();
			}

			const authorEl = page.locator(INSTAGRAM_SELECTORS.embed.username).first();
			if (await authorEl.isVisible({ timeout: 1000 })) {
				author = await authorEl.innerText();
			}
		} catch {
			// Metadata extraction is optional
		}

		// Navigate through carousel
		let clickCount = 0;
		const maxClicks = config.maxCarouselSize - 1;

		while (clickCount < maxClicks) {
			try {
				const nextSelector = findFirst(INSTAGRAM_SELECTORS.embed.nextButton);
				const nextButton = page.locator(nextSelector).first();
				const isVisible = await nextButton.isVisible({ timeout: 1500 }).catch(() => false);

				if (!isVisible) {
					debugLog('InstagramScraper', `No more Next button after ${clickCount} clicks`);
					break;
				}

				await nextButton.click();
				clickCount++;
				await humanDelay(300, 500);

				debugLog('InstagramScraper', `Embed clicked Next (${clickCount}/${maxClicks})`);
			} catch (e) {
				debugLog('InstagramScraper', `Embed navigation stopped: ${e}`);
				break;
			}
		}

		await humanDelay(300, 500);

		const uniqueImages = deduplicateImages(capturedImages);
		const finalImages = uniqueImages.slice(0, config.maxCarouselSize);

		debugLog(
			'InstagramScraper',
			`Embed captured ${capturedImages.length} -> ${uniqueImages.length} unique -> ${finalImages.length} final`
		);

		const media: InstagramMediaItem[] = finalImages.map((url) => ({
			url,
			type: 'image' as const,
		}));

		return {
			images: finalImages,
			media,
			caption,
			author,
			slideCount: finalImages.length,
		};
	} finally {
		await cleanup();
	}
}

// =============================================================================
// STRATEGY 2: DIRECT PAGE WITH STEALTH
// =============================================================================

async function scrapeViaDirect(shortcode: string): Promise<InstagramScraperResult> {
	const config = getScraperConfig();
	const capturedImages: ImageCandidate[] = [];
	let imageCounter = 0;

	const { page, cleanup } = await createStealthPage();

	try {
		page.on('response', (response: Response) => {
			const url = response.url();
			if (!isCarouselImage(url)) return;

			const contentType = response.headers()['content-type'] || '';
			if (!contentType.includes('image/')) return;

			capturedImages.push({
				url,
				timestamp: imageCounter++,
			});

			debugLog('InstagramScraper', `Direct captured image #${imageCounter}: ${url.slice(0, 60)}...`);
		});

		const postUrl = `https://www.instagram.com/p/${shortcode}/`;
		debugLog('InstagramScraper', `Strategy 2: Navigating to ${postUrl}`);

		await page.goto(postUrl, {
			waitUntil: 'domcontentloaded',
			timeout: config.navigationTimeout,
		});

		await humanDelay(1000, 2000);

		await dismissCookieBanner(page);
		await dismissLoginPopup(page);

		const expectedSize = await detectCarouselSize(page);
		debugLog('InstagramScraper', `Expected carousel size: ${expectedSize}`);

		if (expectedSize > 1) {
			await navigateCarousel(page, expectedSize);
		}

		await humanDelay(500, 1000);

		const metadata = await extractMetadata(page);

		const uniqueImages = deduplicateImages(capturedImages);
		const finalImages = uniqueImages.slice(0, config.maxCarouselSize);

		debugLog(
			'InstagramScraper',
			`Direct captured ${capturedImages.length} -> ${uniqueImages.length} unique -> ${finalImages.length} final`
		);

		const isReel = postUrl.includes('/reel/') || postUrl.includes('/tv/');
		const media: InstagramMediaItem[] = finalImages.map((url, idx) => ({
			url,
			type: isReel && idx === 0 ? ('video' as const) : ('image' as const),
			thumbnailUrl: isReel && idx === 0 ? url : undefined,
		}));

		return {
			images: finalImages,
			media,
			caption: metadata.caption,
			author: metadata.author,
			slideCount: finalImages.length,
		};
	} finally {
		await cleanup();
	}
}

// =============================================================================
// STRATEGY 3: STATIC EMBED HTML
// =============================================================================

async function scrapeViaStaticEmbed(shortcode: string): Promise<string[]> {
	try {
		const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
		const res = await fetch(embedUrl, {
			headers: {
				'User-Agent': USER_AGENTS.googlebot,
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		});

		if (!res.ok) return [];

		const html = await res.text();
		const images: string[] = [];

		const displayUrlRegex = /"display_url"\s*:\s*"([^"]+)"/g;
		let match;
		while ((match = displayUrlRegex.exec(html)) !== null) {
			if (match[1]) {
				const cleanUrl = match[1]
					.replace(/\\u0026/g, '&')
					.replace(/\\\//g, '/')
					.replace(/\\"/g, '"');

				if (cleanUrl.includes(CDN_PATTERNS.instagram.highRes) && !images.includes(cleanUrl)) {
					images.push(cleanUrl);
				}
			}
		}

		return images;
	} catch (e) {
		debugLog('InstagramScraper', 'Static embed fallback failed:', e);
		return [];
	}
}

// =============================================================================
// QUICK EXTRACTION (for immediate response)
// =============================================================================

export async function scrapeInstagramQuick(shortcode: string): Promise<InstagramQuickResult | null> {
	const config = getScraperConfig();
	let firstImage: string | null = null;

	const { page, cleanup } = await createStealthPage();

	try {
		const imagePromise = new Promise<string | null>((resolve) => {
			const timeout = setTimeout(() => resolve(null), 5000);

			page.on('response', (response: Response) => {
				const url = response.url();
				if (isCarouselImage(url) && !firstImage) {
					firstImage = url;
					clearTimeout(timeout);
					resolve(url);
				}
			});
		});

		const postUrl = `https://www.instagram.com/p/${shortcode}/`;
		await page.goto(postUrl, {
			waitUntil: 'domcontentloaded',
			timeout: config.navigationTimeout,
		});

		await imagePromise;

		const metadata = await extractMetadata(page);
		const expectedSlideCount = await detectCarouselSize(page);
		const isCarousel = expectedSlideCount > 1;

		debugLog(
			'InstagramScraper',
			`Quick: first image captured, isCarousel=${isCarousel}, expected=${expectedSlideCount}`
		);

		return {
			firstImage,
			caption: metadata.caption,
			author: metadata.author,
			isCarousel,
			expectedSlideCount,
		};
	} catch (error) {
		console.error('[InstagramScraper] Quick extraction error:', error);
		return null;
	} finally {
		await cleanup();
	}
}

// =============================================================================
// LEGACY EXPORTS (for backwards compatibility)
// =============================================================================

export async function scrapeInstagramCarousel(shortcode: string): Promise<InstagramScraperResult> {
	return scrapeViaDirect(shortcode);
}

export async function scrapeInstagramViaEmbed(shortcode: string): Promise<InstagramScraperResult> {
	return scrapeViaEmbed(shortcode);
}

export async function scrapeInstagramEmbed(shortcode: string): Promise<string[]> {
	return scrapeViaStaticEmbed(shortcode);
}

// =============================================================================
// MAIN EXTRACTION WITH FALLBACK CHAIN
// =============================================================================

export async function extractInstagramImages(url: string): Promise<InstagramScraperResult | null> {
	const shortcodeMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
	const shortcode = shortcodeMatch?.[2];

	if (!shortcode) {
		console.error('[InstagramScraper] Could not extract shortcode from URL:', url);
		return null;
	}

	// Strategy 1: Embed page with browser navigation (most reliable)
	try {
		console.log('[InstagramScraper] Strategy 1: Embed page with carousel navigation');
		const result = await withScraperMetrics('instagram', 'embed-navigation', () =>
			scrapeViaEmbed(shortcode)
		);
		if (result.images.length > 0) {
			console.log(`[InstagramScraper] Embed navigation succeeded: ${result.images.length} images`);
			return result;
		}
	} catch (e) {
		console.warn('[InstagramScraper] Strategy 1 (embed navigation) failed:', e);
		recordScraperEvent('instagram', 'embed-navigation', false, 0, categorizeError(e));
	}

	// Strategy 2: Direct post page with stealth browser
	try {
		console.log('[InstagramScraper] Strategy 2: Direct post page with stealth browser');
		const result = await withScraperMetrics('instagram', 'direct-stealth', () =>
			scrapeViaDirect(shortcode)
		);
		if (result.images.length > 0) {
			console.log(`[InstagramScraper] Direct stealth succeeded: ${result.images.length} images`);
			return result;
		}
	} catch (e) {
		console.warn('[InstagramScraper] Strategy 2 (direct stealth) failed:', e);
		recordScraperEvent('instagram', 'direct-stealth', false, 0, categorizeError(e));
	}

	// Strategy 3: Static embed HTML parsing (fastest fallback)
	try {
		console.log('[InstagramScraper] Strategy 3: Static embed HTML parsing');
		const startTime = Date.now();
		const images = await scrapeViaStaticEmbed(shortcode);
		if (images.length > 0) {
			recordScraperEvent('instagram', 'static-embed', true, Date.now() - startTime);
			console.log(`[InstagramScraper] Static embed succeeded: ${images.length} images`);

			const isReel = url.includes('/reel/') || url.includes('/tv/');
			const media: InstagramMediaItem[] = images.map((imageUrl, idx) => ({
				url: imageUrl,
				type: isReel && idx === 0 ? ('video' as const) : ('image' as const),
				thumbnailUrl: isReel && idx === 0 ? imageUrl : undefined,
			}));

			return {
				images,
				media,
				caption: '',
				author: '',
				slideCount: images.length,
			};
		}
		recordScraperEvent('instagram', 'static-embed', false, Date.now() - startTime, 'PARSE_ERROR');
	} catch (e) {
		console.warn('[InstagramScraper] Strategy 3 (static embed) failed:', e);
		recordScraperEvent('instagram', 'static-embed', false, 0, categorizeError(e));
	}

	console.error('[InstagramScraper] All strategies failed');
	return null;
}
