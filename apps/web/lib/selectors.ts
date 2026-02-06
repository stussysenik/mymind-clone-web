/**
 * DOM selectors and CDN patterns for Instagram scraping
 */

export const INSTAGRAM_SELECTORS = {
	carouselDots: [
		'article div[role="tablist"] > div',
	],
	nextButton: [
		'button[aria-label="Next"]',
	],
	carouselList: [
		'article ul > li img',
	],
	loginPopupDismiss: [
		'button:has-text("Not now")',
		'button:has-text("Not Now")',
		'[aria-label="Close"]',
	],
	cookieBanner: [
		'button:has-text("Allow all cookies")',
		'button:has-text("Accept all")',
		'button:has-text("Allow essential and optional cookies")',
	],
	meta: {
		title: 'meta[property="og:title"]',
		description: 'meta[property="og:description"]',
	},
	embed: {
		caption: '.Caption',
		username: '.UsernameText',
		nextButton: [
			'button.coreSpriteRightChevron',
			'button[aria-label="Next"]',
			'.LeftChevron + .RightChevron',
			'button:has(svg[aria-label="Next"])',
		],
	},
};

export const CDN_PATTERNS = {
	instagram: {
		highRes: 't51.2885-15',
		exclude: [
			't51.2885-19', // Profile pictures
			'150x150',
			'_s.jpg',
			'_t.jpg',
			'/s150x150/',
			'/s320x320/',
			'/c0.',
			'/e15/',
			'profile_pic',
		],
	},
};

/**
 * Returns the first selector from an array of selectors.
 * Used when a single selector string is needed from a list of candidates.
 */
export function findFirst(selectors: string[]): string {
	return selectors[0];
}
