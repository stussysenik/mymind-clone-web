/**
 * MyMind Clone - Twitter/X Content Extractor
 *
 * Extracts tweet data using free APIs (no auth required):
 * 1. FxTwitter API (primary) - rich JSON with media, metrics, author
 * 2. Twitter Syndication API (fallback) - embed data with media
 *
 * Replaces the previous oEmbed + Playwright screenshot approach
 * which was slow (7.5s+) and unreliable (X.com blocks headless browsers).
 *
 * @fileoverview API-based Twitter content extraction
 */

// =============================================================================
// TYPES
// =============================================================================

export interface TweetData {
	id: string;
	text: string;
	authorName: string;
	authorHandle: string;
	authorAvatar: string;
	images: string[];
	videoThumbnail: string | null;
	likes: number;
	retweets: number;
	replies: number;
	views: number;
	createdAt: string;
	quotedTweet: { text: string; authorHandle: string } | null;
	source: 'fxtwitter' | 'syndication' | 'oembed';
}

// =============================================================================
// TWEET ID EXTRACTION
// =============================================================================

/**
 * Extract tweet ID from various Twitter/X URL formats:
 * - https://x.com/user/status/123456
 * - https://twitter.com/user/status/123456?s=46
 * - https://x.com/user/status/123456/photo/1
 * - https://mobile.twitter.com/user/status/123456
 */
export function extractTweetId(url: string): string | null {
	const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
	return match?.[1] ?? null;
}

// =============================================================================
// FXTWITTER API (Primary)
// =============================================================================

interface FxTweetResponse {
	code: number;
	message: string;
	tweet?: {
		id: string;
		text: string;
		url: string;
		created_at: string;
		created_timestamp: number;
		author: {
			name: string;
			screen_name: string;
			avatar_url: string;
			banner_url?: string;
		};
		likes: number;
		retweets: number;
		replies: number;
		views: number;
		lang: string;
		replying_to?: string;
		media?: {
			photos?: Array<{ url: string; width: number; height: number; altText?: string }>;
			videos?: Array<{ url: string; thumbnail_url: string; duration: number }>;
			mosaic?: { formats: { jpeg: string; webp: string } };
		};
		quote?: {
			text: string;
			author: { screen_name: string };
		};
	};
}

async function fetchViaFxTwitter(tweetId: string): Promise<TweetData | null> {
	try {
		const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
			signal: AbortSignal.timeout(5000),
			headers: {
				'User-Agent': 'MyMind/1.0 (content archiver)',
			},
		});

		if (!res.ok) {
			console.warn(`[Twitter] FxTwitter API returned ${res.status}`);
			return null;
		}

		const data: FxTweetResponse = await res.json();
		if (!data.tweet) return null;

		const t = data.tweet;

		// Collect all image URLs
		const images: string[] = [];
		if (t.media?.photos) {
			for (const photo of t.media.photos) {
				images.push(photo.url);
			}
		}

		// Get video thumbnail if present
		let videoThumbnail: string | null = null;
		if (t.media?.videos?.[0]) {
			videoThumbnail = t.media.videos[0].thumbnail_url;
			// If no photos but has video, use thumbnail as primary image
			if (images.length === 0 && videoThumbnail) {
				images.push(videoThumbnail);
			}
		}

		// Use mosaic image for multi-photo tweets (pre-composed grid)
		if (t.media?.mosaic?.formats?.jpeg && images.length > 1) {
			// Keep individual images but note mosaic is available
			// We prefer individual images for better mobile display
		}

		return {
			id: t.id,
			text: t.text,
			authorName: t.author.name,
			authorHandle: t.author.screen_name,
			authorAvatar: t.author.avatar_url,
			images,
			videoThumbnail,
			likes: t.likes ?? 0,
			retweets: t.retweets ?? 0,
			replies: t.replies ?? 0,
			views: t.views ?? 0,
			createdAt: t.created_at,
			quotedTweet: t.quote ? { text: t.quote.text, authorHandle: t.quote.author.screen_name } : null,
			source: 'fxtwitter',
		};
	} catch (error) {
		console.warn('[Twitter] FxTwitter API failed:', error instanceof Error ? error.message : error);
		return null;
	}
}

// =============================================================================
// TWITTER SYNDICATION API (Fallback)
// =============================================================================

/**
 * Generate syndication token from tweet ID.
 * Algorithm from Vercel's react-tweet package.
 */
function generateSyndicationToken(tweetId: string): string {
	return ((Number(tweetId) / 1e15) * Math.PI)
		.toString(36)
		.replace(/(0+|\.)/, '');
}

interface SyndicationTweet {
	__typename: string;
	text: string;
	user: {
		name: string;
		screen_name: string;
		profile_image_url_https: string;
	};
	created_at: string;
	favorite_count: number;
	conversation_count: number;
	mediaDetails?: Array<{
		type: 'photo' | 'video' | 'animated_gif';
		media_url_https: string;
		video_info?: {
			variants: Array<{ url: string; bitrate?: number; content_type: string }>;
		};
	}>;
	quoted_tweet?: {
		text: string;
		user: { screen_name: string };
	};
	id_str: string;
}

async function fetchViaSyndication(tweetId: string): Promise<TweetData | null> {
	try {
		const token = generateSyndicationToken(tweetId);
		const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${token}&lang=en`;

		const res = await fetch(url, {
			signal: AbortSignal.timeout(5000),
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
			},
		});

		if (!res.ok) {
			console.warn(`[Twitter] Syndication API returned ${res.status}`);
			return null;
		}

		const data: SyndicationTweet = await res.json();
		if (!data.text) return null;

		// Extract images
		const images: string[] = [];
		let videoThumbnail: string | null = null;

		if (data.mediaDetails) {
			for (const media of data.mediaDetails) {
				if (media.type === 'photo') {
					images.push(media.media_url_https);
				} else if (media.type === 'video' || media.type === 'animated_gif') {
					videoThumbnail = media.media_url_https;
					if (images.length === 0) {
						images.push(media.media_url_https);
					}
				}
			}
		}

		return {
			id: data.id_str || tweetId,
			text: data.text,
			authorName: data.user.name,
			authorHandle: data.user.screen_name,
			authorAvatar: data.user.profile_image_url_https,
			images,
			videoThumbnail,
			likes: data.favorite_count ?? 0,
			retweets: 0, // Syndication doesn't return retweet count
			replies: data.conversation_count ?? 0,
			views: 0, // Syndication doesn't return views
			createdAt: data.created_at,
			quotedTweet: data.quoted_tweet
				? { text: data.quoted_tweet.text, authorHandle: data.quoted_tweet.user.screen_name }
				: null,
			source: 'syndication',
		};
	} catch (error) {
		console.warn('[Twitter] Syndication API failed:', error instanceof Error ? error.message : error);
		return null;
	}
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Extract tweet data from a Twitter/X URL.
 * Uses a layered fallback chain: FxTwitter → Syndication → null
 *
 * @returns TweetData or null if all APIs fail
 */
export async function extractTweet(url: string): Promise<TweetData | null> {
	const tweetId = extractTweetId(url);
	if (!tweetId) {
		console.warn('[Twitter] Could not extract tweet ID from URL:', url);
		return null;
	}

	console.log(`[Twitter] Extracting tweet ${tweetId}`);

	// Layer 1: FxTwitter API (fastest, richest data)
	const fxResult = await fetchViaFxTwitter(tweetId);
	if (fxResult) {
		console.log(`[Twitter] FxTwitter success: "${fxResult.text.slice(0, 60)}..." (${fxResult.images.length} images)`);
		return fxResult;
	}

	// Layer 2: Syndication API (Twitter's own embed endpoint)
	const synResult = await fetchViaSyndication(tweetId);
	if (synResult) {
		console.log(`[Twitter] Syndication success: "${synResult.text.slice(0, 60)}..." (${synResult.images.length} images)`);
		return synResult;
	}

	console.warn(`[Twitter] All APIs failed for tweet ${tweetId}`);
	return null;
}
