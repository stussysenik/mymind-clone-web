/**
 * MyMind Clone - Instagram Content Extractor
 *
 * Extracts Instagram post data using fast HTTP-only methods (no Playwright):
 * 1. InstaFix/ddinstagram (primary) - works from any IP (Vercel-safe)
 * 2. Instagram GraphQL API - rich JSON with media, caption, author
 * 3. Static embed HTML parsing (fallback) - parse embedded JSON from script tags
 * 4. Direct page OG tags with Googlebot UA (last resort) - basic metadata
 *
 * Replaces the previous Playwright-based approach which was slow (5-15s),
 * inconsistent across mobile/desktop, and resource-heavy.
 *
 * Pattern follows twitter-extractor.ts: layered API fallback, no browser.
 *
 * @fileoverview API-based Instagram content extraction
 */

// =============================================================================
// TYPES
// =============================================================================

export interface InstagramPostData {
	shortcode: string;
	caption: string;
	authorName: string;
	authorHandle: string;
	authorAvatar: string;
	images: string[];          // High-res CDN URLs
	isVideo: boolean;
	videoUrl: string | null;
	isCarousel: boolean;
	slideCount: number;
	likes: number;
	comments: number;
	timestamp: string;
	source: 'instafix' | 'graphql' | 'embed-html' | 'og-tags';
}

// =============================================================================
// SHORTCODE EXTRACTION
// =============================================================================

/**
 * Extract Instagram shortcode from various URL formats:
 * - https://www.instagram.com/p/ABC123/
 * - https://www.instagram.com/reel/ABC123/
 * - https://www.instagram.com/tv/ABC123/
 * - https://instagram.com/p/ABC123/?igsh=xxx
 */
export function extractShortcode(url: string): string | null {
	const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
	return match?.[1] ?? null;
}

// =============================================================================
// SHARE URL RESOLUTION
// =============================================================================

/**
 * Instagram mobile app generates /share/ URLs when users tap "Copy Link":
 * - instagram.com/share/reel/BARSSL4rTu (opaque share ID, NOT a shortcode)
 * - instagram.com/share/p/BACiUUUYQV
 *
 * These 302-redirect to canonical URLs (/reel/DHbVbT4Jx0c/, /p/C6q-XdvsU5v/).
 */
const INSTAGRAM_SHARE_RE = /instagram\.com\/share\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/;

export function isInstagramShareUrl(url: string): boolean {
	return INSTAGRAM_SHARE_RE.test(url);
}

export async function resolveInstagramShareUrl(url: string): Promise<string> {
	if (!isInstagramShareUrl(url)) return url;

	console.log(`[Instagram] Resolving share URL: ${url}`);
	try {
		const res = await fetch(url, {
			method: 'GET',
			redirect: 'manual',
			signal: AbortSignal.timeout(5000),
			headers: {
				'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
				'Accept': 'text/html',
			},
		});

		if (res.status >= 300 && res.status < 400) {
			const location = res.headers.get('location');
			if (location) {
				const resolved = new URL(location, url).toString();
				console.log(`[Instagram] Share URL resolved: ${resolved}`);
				return resolved;
			}
		}
		console.warn(`[Instagram] Share URL returned ${res.status}, using original`);
		return url;
	} catch (err) {
		console.warn(`[Instagram] Share URL resolution failed:`, err instanceof Error ? err.message : err);
		return url;
	}
}

// =============================================================================
// HELPER: Clean Instagram CDN URLs
// =============================================================================

function cleanCdnUrl(url: string): string {
	return url
		.replace(/&amp;/g, '&')       // HTML entity decode
		.replace(/\\u0026/g, '&')
		.replace(/\\\//g, '/')
		.replace(/\\"/g, '"');
}

function isContentImage(url: string): boolean {
	// Exclude profile pictures, thumbnails, and static assets
	if (url.includes('150x150')) return false;
	if (url.includes('_s.')) return false;
	if (url.includes('s150x150')) return false;
	if (url.includes('static.cdninstagram')) return false;
	if (url.includes('/s/')) return false;
	// Must be from Instagram CDN
	return url.includes('cdninstagram.com') || url.includes('scontent') || url.includes('fbcdn.net');
}

// =============================================================================
// STRATEGY 1: InstaFix (ddinstagram.com) — works from any IP
// =============================================================================

/**
 * InstaFix is the Instagram equivalent of FxTwitter — it runs its own scraper
 * infrastructure that handles IP blocking. Works from Vercel/datacenter IPs.
 *
 * Two sub-strategies:
 * A. oEmbed API — structured JSON with thumbnail URL, author, title
 * B. HTML page OG tags — richer images (full resolution)
 */
async function fetchViaInstaFix(shortcode: string): Promise<InstagramPostData | null> {
	const canonicalUrl = `https://www.instagram.com/p/${shortcode}/`;

	// Sub-strategy A: Fetch ddinstagram HTML page and parse OG tags (carousel-aware)
	// HTML is tried first because it extracts ALL og:image tags and correctly sets
	// isCarousel and slideCount, while oEmbed only returns a single thumbnail.
	try {
		const ddUrl = `https://ddinstagram.com/p/${shortcode}/`;
		const res = await fetch(ddUrl, {
			signal: AbortSignal.timeout(5000),
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		});

		if (!res.ok) {
			throw new Error(`InstaFix HTML returned ${res.status}`);
		}

		const html = await res.text();

		// Extract OG tags from InstaFix page
		const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/)?.[1]
			|| html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:image"/)?.[1];
		const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/)?.[1]
			|| html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:title"/)?.[1];
		const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/)?.[1]
			|| html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:description"/)?.[1];
		const ogVideo = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]*)"/)?.[1]
			|| html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:video"/)?.[1];

		// Also look for additional images (carousel support via multiple og:image tags)
		const allImages: string[] = [];
		const ogImageRegex = /<meta[^>]+property="og:image"[^>]+content="([^"]*)"/g;
		const ogImageRegex2 = /<meta[^>]+content="([^"]*)"[^>]+property="og:image"/g;
		let imgMatch;
		while ((imgMatch = ogImageRegex.exec(html)) !== null) {
			if (imgMatch[1] && !allImages.includes(imgMatch[1])) {
				allImages.push(imgMatch[1]);
			}
		}
		while ((imgMatch = ogImageRegex2.exec(html)) !== null) {
			if (imgMatch[1] && !allImages.includes(imgMatch[1])) {
				allImages.push(imgMatch[1]);
			}
		}

		// Apply cleanCdnUrl to decode HTML entities (&amp; -> &) in OG image URLs
		const images = (allImages.length > 0 ? allImages : ogImage ? [ogImage] : [])
			.map(cleanCdnUrl);

		if (images.length === 0) {
			throw new Error('InstaFix HTML: no images found');
		}

		// Parse author from title
		let authorName = '';
		let caption = ogDesc || '';
		if (ogTitle) {
			const authorMatch = ogTitle.match(/^(.+?)\s+on\s+Instagram/i)
				|| ogTitle.match(/^@?(\S+)/);
			if (authorMatch) {
				authorName = authorMatch[1].trim().replace(/^@/, '');
			}
		}

		// Clean metrics prefix from description
		caption = caption.replace(/^\d+[KM]?\s*(?:likes?|comments?)[,\s-]*/gi, '').trim();

		const isVideo = !!ogVideo;

		console.log(`[Instagram] InstaFix HTML success: ${images.length} images, author="${authorName}"`);

		return {
			shortcode,
			caption,
			authorName,
			authorHandle: authorName,
			authorAvatar: '',
			images,
			isVideo,
			videoUrl: ogVideo || null,
			isCarousel: images.length > 1,
			slideCount: images.length,
			likes: 0,
			comments: 0,
			timestamp: '',
			source: 'instafix',
		};
	} catch (error) {
		console.warn('[Instagram] InstaFix HTML failed:', error instanceof Error ? error.message : error);
	}

	// Sub-strategy B: oEmbed API fallback (structured JSON, single thumbnail only)
	try {
		const oembedUrl = `https://ddinstagram.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
		const res = await fetch(oembedUrl, {
			signal: AbortSignal.timeout(5000),
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; MyMindBot/1.0)',
				'Accept': 'application/json',
			},
		});

		if (res.ok) {
			const contentType = res.headers.get('content-type') || '';
			if (contentType.includes('application/json') || contentType.includes('text/json')) {
				const data = await res.json();
				if (data && data.thumbnail_url) {
					console.log(`[Instagram] InstaFix oEmbed success: thumbnail found`);

					// Parse author from author_name field
					const authorName = data.author_name || '';
					const authorHandle = authorName.replace(/^@/, '');

					// Parse caption from title (InstaFix puts caption in title)
					let caption = data.title || '';
					// Clean metrics prefix if present
					caption = caption.replace(/^\d+[KM]?\s*(?:likes?|comments?)[,\s-]*/gi, '').trim();

					return {
						shortcode,
						caption,
						authorName: authorHandle,
						authorHandle,
						authorAvatar: '',
						images: [cleanCdnUrl(data.thumbnail_url)],
						isVideo: false,
						videoUrl: null,
						isCarousel: false,
						slideCount: 1,
						likes: 0,
						comments: 0,
						timestamp: '',
						source: 'instafix',
					};
				}
			}
		}
		console.warn(`[Instagram] InstaFix oEmbed returned ${res.status}`);
	} catch (error) {
		console.warn('[Instagram] InstaFix oEmbed failed:', error instanceof Error ? error.message : error);
	}

	return null;
}

// =============================================================================
// STRATEGY 2: Instagram GraphQL API
// =============================================================================

/**
 * Instagram GraphQL endpoint - returns rich JSON with all media.
 * May return null from datacenter IPs (Instagram blocks non-residential).
 * Fast when it works (~150ms).
 */
async function fetchViaGraphQL(shortcode: string): Promise<InstagramPostData | null> {
	// Try multiple doc_ids (Instagram rotates these every 2-4 weeks)
	const docIds = [
		'10015901848480474',  // ahmedrangel/instagram-media-scraper (2025-2026)
		'8845758582119845',   // scrapfly.io guide (2025)
	];

	for (const docId of docIds) {
		try {
			const variables = JSON.stringify({
				shortcode,
				fetch_tagged_user_count: null,
				hoisted_comment_id: null,
				hoisted_reply_id: null,
			});

			const res = await fetch('https://www.instagram.com/api/graphql', {
				method: 'POST',
				signal: AbortSignal.timeout(5000),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'X-IG-App-Id': '936619743392459',
					'X-Requested-With': 'XMLHttpRequest',
					// CRITICAL: Must use mobile UA — desktop UA returns HTML login wall instead of JSON
					'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
					'Referer': 'https://www.instagram.com/',
					'Origin': 'https://www.instagram.com',
				},
				body: `variables=${encodeURIComponent(variables)}&doc_id=${docId}`,
			});

			if (!res.ok) {
				console.warn(`[Instagram] GraphQL returned ${res.status} with doc_id ${docId}`);
				continue;
			}

			// Instagram returns HTML login wall with wrong UA — detect and skip
			const contentType = res.headers.get('content-type') || '';
			if (contentType.includes('text/html')) {
				console.warn(`[Instagram] GraphQL returned HTML instead of JSON with doc_id ${docId}`);
				continue;
			}

			const data = await res.json();
			const media = data?.data?.xdt_shortcode_media;

			if (!media) {
				console.warn(`[Instagram] GraphQL returned null media with doc_id ${docId}`);
				continue;
			}

			// Successfully got data - parse it
			const images: string[] = [];
			let isCarousel = false;
			let isVideo = media.is_video === true;
			let videoUrl: string | null = media.video_url || null;

			// Check for carousel (sidecar) — Instagram uses both GraphSidecar and XDTGraphSidecar
			const isSidecar = media.__typename === 'GraphSidecar' || media.__typename === 'XDTGraphSidecar';
			if (isSidecar && media.edge_sidecar_to_children?.edges) {
				isCarousel = true;
				for (const edge of media.edge_sidecar_to_children.edges) {
					const node = edge.node;
					if (node.is_video && node.video_url) {
						// For video slides, use the video thumbnail
						images.push(node.display_url);
					} else {
						images.push(node.display_url);
					}
				}
			} else if (media.display_url) {
				images.push(media.display_url);
			}

			// Extract caption
			const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || '';

			// Extract author
			const owner = media.owner || {};
			const authorHandle = owner.username || '';
			const authorName = owner.full_name || authorHandle;
			const authorAvatar = owner.profile_pic_url || '';

			// Extract metrics
			const likes = media.edge_media_preview_like?.count ?? 0;
			const comments = media.edge_media_to_comment?.count ?? media.edge_media_preview_comment?.count ?? 0;
			const timestamp = media.taken_at_timestamp
				? new Date(media.taken_at_timestamp * 1000).toISOString()
				: '';

			return {
				shortcode,
				caption,
				authorName,
				authorHandle,
				authorAvatar,
				images,
				isVideo,
				videoUrl,
				isCarousel,
				slideCount: images.length,
				likes,
				comments,
				timestamp,
				source: 'graphql',
			};
		} catch (error) {
			console.warn(`[Instagram] GraphQL failed with doc_id ${docId}:`, error instanceof Error ? error.message : error);
			continue;
		}
	}

	return null;
}

// =============================================================================
// STRATEGY 3: Static Embed HTML Parsing
// =============================================================================

/**
 * Fetch the embed page and parse any embedded JSON/image data from scripts.
 * Instagram embeds used to contain display_url data in script tags.
 * Even when client-rendered, there may be initial data or img elements.
 */
async function fetchViaEmbedHTML(shortcode: string): Promise<InstagramPostData | null> {
	try {
		const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;

		const res = await fetch(embedUrl, {
			signal: AbortSignal.timeout(8000),
			headers: {
				// Mobile UA — Instagram blocks Googlebot on embed pages now
				'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
			},
		});

		if (!res.ok) {
			console.warn(`[Instagram] Embed page returned ${res.status}`);
			return null;
		}

		const html = await res.text();
		const images: string[] = [];
		let caption = '';
		let author = '';

		// =====================================================================
		// Parse embedded JSON data from script tags
		// =====================================================================

		// Strategy A: Look for edge_sidecar_to_children (carousel posts)
		const sidecarMatch = html.match(/"edge_sidecar_to_children"\s*:\s*\{[^}]*"edges"\s*:\s*\[([\s\S]*?)\]\s*\}/);
		if (sidecarMatch) {
			const carouselUrls = sidecarMatch[1].match(/"display_url"\s*:\s*"([^"]+)"/g);
			if (carouselUrls) {
				for (const urlMatch of carouselUrls) {
					const url = urlMatch.match(/"display_url"\s*:\s*"([^"]+)"/)?.[1];
					if (url) {
						const cleanUrl = cleanCdnUrl(url);
						if (isContentImage(cleanUrl)) {
							images.push(cleanUrl);
						}
					}
				}
			}
		}

		// Strategy B: Look for single post display_url
		if (images.length === 0) {
			const displayUrlRegex = /"display_url"\s*:\s*"([^"]+)"/g;
			let match;
			while ((match = displayUrlRegex.exec(html)) !== null) {
				const cleanUrl = cleanCdnUrl(match[1]);
				if (isContentImage(cleanUrl) && !images.includes(cleanUrl)) {
					images.push(cleanUrl);
					break; // Only take the first valid one for single posts
				}
			}
		}

		// Strategy C: Look for display_resources (highest resolution)
		if (images.length === 0) {
			const resourcesRegex = /"display_resources"\s*:\s*\[([\s\S]*?)\]/g;
			let resMatch;
			while ((resMatch = resourcesRegex.exec(html)) !== null) {
				const resourceRegex = /\{"config_width":(\d+),"config_height":(\d+),"src":"([^"]+)"\}/g;
				let best: { url: string; width: number } | null = null;
				let rMatch;
				while ((rMatch = resourceRegex.exec(resMatch[1])) !== null) {
					const width = parseInt(rMatch[1], 10);
					const url = cleanCdnUrl(rMatch[3]);
					if (width >= 640 && (!best || width > best.width)) {
						best = { url, width };
					}
				}
				if (best && isContentImage(best.url)) {
					images.push(best.url);
				}
			}
		}

		// Strategy D: img tags with CDN URLs (embed page may have them)
		if (images.length === 0) {
			const imgRegex = /<img[^>]+src="(https?:\/\/[^"]*(?:cdninstagram|scontent|fbcdn)[^"]*)"/g;
			let imgMatch;
			while ((imgMatch = imgRegex.exec(html)) !== null) {
				const url = cleanCdnUrl(imgMatch[1]);
				if (isContentImage(url) && !images.includes(url)) {
					images.push(url);
				}
			}
		}

		// Strategy E: Look for EmbeddedMediaImage class (older embeds)
		if (images.length === 0) {
			const embeddedMediaRegex = /class="EmbeddedMediaImage"[^>]*src="([^"]+)"/g;
			let emMatch;
			while ((emMatch = embeddedMediaRegex.exec(html)) !== null) {
				const url = cleanCdnUrl(emMatch[1]);
				if (isContentImage(url)) {
					images.push(url);
				}
			}
		}

		// =====================================================================
		// Extract caption and author from HTML
		// =====================================================================

		// Caption from embed
		const captionMatch = html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/);
		if (captionMatch) {
			caption = captionMatch[1].replace(/<[^>]+>/g, '').trim();
		}
		if (!caption) {
			// Try og:description
			const ogDescMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/);
			if (ogDescMatch) {
				caption = ogDescMatch[1];
				// Remove "X likes, Y comments" prefix
				caption = caption.replace(/^\d+[KM]?\s*(?:likes?|comments?)[,\s-]*/gi, '').trim();
			}
		}

		// Author from embed
		const usernameMatch = html.match(/class="UsernameText"[^>]*>([^<]+)/);
		if (usernameMatch) {
			author = usernameMatch[1].trim();
		}
		if (!author) {
			const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/);
			if (ogTitleMatch) {
				const authorMatch = ogTitleMatch[1].match(/^([^:]+)\s+on\s+Instagram/i);
				if (authorMatch) {
					author = authorMatch[1].trim();
				}
			}
		}

		// Clean caption - remove author prefix if present
		if (author && caption.toLowerCase().startsWith(author.toLowerCase())) {
			caption = caption.slice(author.length).trim();
		}

		if (images.length === 0) {
			console.warn('[Instagram] Embed HTML: no images found in page');
			return null;
		}

		console.log(`[Instagram] Embed HTML: found ${images.length} images, author="${author}"`);

		return {
			shortcode,
			caption,
			authorName: author.replace('@', ''),
			authorHandle: author.replace('@', ''),
			authorAvatar: '',
			images,
			isVideo: false,
			videoUrl: null,
			isCarousel: images.length > 1,
			slideCount: images.length,
			likes: 0,
			comments: 0,
			timestamp: '',
			source: 'embed-html',
		};
	} catch (error) {
		console.warn('[Instagram] Embed HTML parsing failed:', error instanceof Error ? error.message : error);
		return null;
	}
}

// =============================================================================
// STRATEGY 4: Direct Page OG Tags (Googlebot UA)
// =============================================================================

/**
 * Fetch the direct post page with Googlebot UA and extract OG meta tags.
 * Least data but most reliable — Instagram serves OG metadata to known search
 * crawlers (Googlebot) regardless of IP, so this works on Vercel/datacenter IPs.
 */
async function fetchViaOGTags(shortcode: string): Promise<InstagramPostData | null> {
	try {
		const postUrl = `https://www.instagram.com/p/${shortcode}/`;

		const res = await fetch(postUrl, {
			signal: AbortSignal.timeout(5000),
			headers: {
				// Googlebot UA — Instagram serves OG tags to search crawlers from any IP
				'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		});

		if (!res.ok) {
			console.warn(`[Instagram] Direct page returned ${res.status}`);
			return null;
		}

		const html = await res.text();

		// Extract OG tags
		const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/)?.[1];
		const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/)?.[1];
		const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/)?.[1];

		if (!ogImage || ogImage.includes('static.cdninstagram')) {
			console.warn('[Instagram] OG tags: no valid image found');
			return null;
		}

		// Parse author from title ("Author on Instagram: caption")
		let author = '';
		let caption = ogDesc || '';
		if (ogTitle) {
			const authorMatch = ogTitle.match(/^(.+?)\s+on\s+Instagram/i);
			if (authorMatch) {
				author = authorMatch[1].trim();
			}
			// Try to extract caption from title too
			const captionMatch = ogTitle.match(/on\s+Instagram:\s*["""](.+?)["""]$/i);
			if (captionMatch && !caption) {
				caption = captionMatch[1].trim();
			}
		}

		// Clean metrics prefix from description
		caption = caption.replace(/^\d+[KM]?\s*(?:likes?|comments?)[,\s-]*/gi, '').trim();

		return {
			shortcode,
			caption,
			authorName: author,
			authorHandle: author.replace(/\s/g, '').toLowerCase(),
			authorAvatar: '',
			images: [cleanCdnUrl(ogImage)],
			isVideo: false,
			videoUrl: null,
			isCarousel: false,
			slideCount: 1,
			likes: 0,
			comments: 0,
			timestamp: '',
			source: 'og-tags',
		};
	} catch (error) {
		console.warn('[Instagram] OG tags extraction failed:', error instanceof Error ? error.message : error);
		return null;
	}
}

// =============================================================================
// STRATEGY 5: Instagram Official oEmbed (Most Reliable)
// =============================================================================

/**
 * Instagram's official oEmbed endpoint - the most reliable option.
 * Works from any IP without authentication.
 * Returns: thumbnail_url, author_name, title (caption)
 *
 * Note: This is rate-limited but very reliable.
 */
async function fetchViaOfficialOEmbed(url: string): Promise<InstagramPostData | null> {
	try {
		const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;

		const res = await fetch(oembedUrl, {
			signal: AbortSignal.timeout(8000),
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; MyMindBot/1.0)',
				'Accept': 'application/json',
			},
		});

		if (!res.ok) {
			console.warn(`[Instagram] Official oEmbed returned ${res.status}`);
			return null;
		}

		const data = await res.json();

		if (!data.thumbnail_url) {
			console.warn('[Instagram] Official oEmbed: no thumbnail_url');
			return null;
		}

		// Extract shortcode from URL for consistency
		const shortcode = extractShortcode(url) || 'unknown';

		// Parse author from author_name
		const authorName = data.author_name || '';
		const authorHandle = authorName.replace(/^@/, '').replace(/\s/g, '').toLowerCase();

		// Caption from title
		let caption = data.title || '';
		// Clean metrics prefix if present
		caption = caption.replace(/^\d+[KM]?\s*(?:likes?|comments?)[,\s-]*/gi, '').trim();

		console.log(`[Instagram] Official oEmbed success: author="${authorHandle}"`);

		return {
			shortcode,
			caption,
			authorName,
			authorHandle,
			authorAvatar: '',
			images: [cleanCdnUrl(data.thumbnail_url)],
			isVideo: data.type === 'video',
			videoUrl: null,
			isCarousel: false,
			slideCount: 1,
			likes: 0,
			comments: 0,
			timestamp: '',
			source: 'instafix', // Use instafix source since it's similar quality
		};
	} catch (error) {
		console.warn('[Instagram] Official oEmbed failed:', error instanceof Error ? error.message : error);
		return null;
	}
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Extract Instagram post data from a URL.
 * Uses a layered fallback chain: InstaFix → Official oEmbed → GraphQL → Embed HTML → OG Tags → null
 *
 * InstaFix and Official oEmbed are tried first because they work from any IP (Vercel-safe).
 * GraphQL is faster and richer but fails from datacenter IPs (Instagram blocks them).
 *
 * @returns InstagramPostData or null if all strategies fail
 */
export async function extractInstagramPost(url: string): Promise<InstagramPostData | null> {
	const resolvedUrl = await resolveInstagramShareUrl(url);
	const shortcode = extractShortcode(resolvedUrl);
	if (!shortcode) {
		console.warn('[Instagram] Could not extract shortcode from URL:', url);
		return null;
	}

	console.log(`[Instagram] Extracting post ${shortcode}`);

	// Layer 1: InstaFix (works from any IP — Vercel-safe)
	const instaFixResult = await fetchViaInstaFix(shortcode);
	if (instaFixResult) {
		console.log(`[Instagram] InstaFix success: ${instaFixResult.images.length} images, author="${instaFixResult.authorHandle}"`);
		return instaFixResult;
	}

	// Layer 2: Official Instagram oEmbed API (most reliable — Vercel-safe)
	const officialOEmbedResult = await fetchViaOfficialOEmbed(resolvedUrl);
	if (officialOEmbedResult) {
		console.log(`[Instagram] Official oEmbed success: author="${officialOEmbedResult.authorHandle}"`);
		return officialOEmbedResult;
	}

	// Layer 3: GraphQL API (fastest, richest data — may fail on Vercel)
	const graphqlResult = await fetchViaGraphQL(shortcode);
	if (graphqlResult) {
		console.log(`[Instagram] GraphQL success: ${graphqlResult.images.length} images, author="${graphqlResult.authorHandle}"`);
		return graphqlResult;
	}

	// Layer 4: Static Embed HTML parsing (no browser needed — may fail on Vercel)
	const embedResult = await fetchViaEmbedHTML(shortcode);
	if (embedResult) {
		console.log(`[Instagram] Embed HTML success: ${embedResult.images.length} images`);
		return embedResult;
	}

	// Layer 5: Direct page OG tags with Googlebot UA (least data, always works)
	const ogResult = await fetchViaOGTags(shortcode);
	if (ogResult) {
		console.log(`[Instagram] OG tags success: ${ogResult.images.length} images`);
		return ogResult;
	}

	console.warn(`[Instagram] All strategies failed for ${shortcode}`);
	return null;
}
