import * as cheerio from 'cheerio';
import { extractTitleWithDSPy, extractAssetsWithDSPy, extractContentWithDSPy } from './dspy-client';
import { extractInstagramImages } from './instagram-scraper';
import { decodeHtmlEntities } from './text-utils';

// =============================================================================
// INSTAGRAM SCRAPER WRAPPER (Delegates to dedicated module)
// =============================================================================

/**
 * Extracts high-resolution images from Instagram using network interception
 * This wrapper delegates to the instagram-scraper module which:
 * 1. Intercepts CDN image requests as Playwright navigates
 * 2. Clicks through carousel slides to trigger lazy loading
 * 3. Deduplicates and returns highest resolution images
 */
async function scrapeInstagramWithPlaywright(shortcode: string): Promise<{
	images: string[];
	caption: string;
	author: string;
} | null> {
	try {
		const url = `https://www.instagram.com/p/${shortcode}/`;
		const result = await extractInstagramImages(url);

		if (result && result.images.length > 0) {
			console.log(`[Scraper] Instagram: Extracted ${result.images.length} images from ${result.slideCount} slides`);
			return {
				images: result.images,
				caption: result.caption,
				author: result.author,
			};
		}

		return null;
	} catch (error) {
		console.warn('[Scraper] Instagram extraction failed:', error);
		return null;
	}
}

export interface ScrapedContent {
        title: string;
        description: string;
        imageUrl: string | null;
        images?: string[]; // For multi-image posts (Twitter, Instagram carousel)
        content: string; // The main text content
        author?: string;
        publishedAt?: string;
        domain: string;
        url: string;
        hashtags?: string[]; // Extracted hashtags from content
        mentions?: string[]; // Extracted @mentions from content
}

/**
 * Extract hashtags from text content
 * Returns lowercase, deduplicated hashtags without the # symbol
 */
function extractHashtags(text: string): string[] {
        if (!text) return [];
        const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
        const unique = [...new Set(matches.map(h => h.slice(1).toLowerCase()))];
        return unique.slice(0, 20); // Limit to 20 hashtags
}

/**
 * Extract @mentions from text content
 * Returns usernames without the @ symbol
 */
function extractMentions(text: string): string[] {
        if (!text) return [];
        const matches = text.match(/@[a-zA-Z0-9_]+/g) || [];
        const unique = [...new Set(matches.map(m => m.slice(1)))];
        return unique.slice(0, 10); // Limit to 10 mentions
}


export async function scrapeUrl(url: string): Promise<ScrapedContent> {
        try {
                const parsedUrl = new URL(url);
                const domain = parsedUrl.hostname.replace('www.', '');

                // =============================================================
                // YOUTUBE SPECIAL HANDLING (oEmbed API)
                // =============================================================
                if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
                        try {
                                // Use YouTube's oEmbed API for clean metadata (no consent page issues)
                                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                                const oembedRes = await fetch(oembedUrl, {
                                        headers: {
                                                'Accept': 'application/json',
                                                'Accept-Language': 'en-US,en;q=0.9',
                                        },
                                });

                                if (oembedRes.ok) {
                                        const oembed = await oembedRes.json();
                                        console.log('[Scraper] YouTube oEmbed success:', oembed.title);

                                        // Extract video ID for thumbnail
                                        let videoId = '';
                                        if (domain.includes('youtu.be')) {
                                                videoId = parsedUrl.pathname.slice(1);
                                        } else {
                                                videoId = parsedUrl.searchParams.get('v') || '';
                                        }

                                        const imageUrl = videoId
                                                ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                                                : oembed.thumbnail_url || null;

                                        return {
                                                title: oembed.title || 'YouTube Video',
                                                description: `Video by ${oembed.author_name || 'Unknown'}`,
                                                imageUrl,
                                                content: `YouTube video: "${oembed.title}" by ${oembed.author_name}`,
                                                author: oembed.author_name,
                                                domain: 'youtube.com',
                                                url,
                                        };
                                }
                                console.warn('[Scraper] YouTube oEmbed failed, falling back to HTML scraping');
                        } catch (oembedErr) {
                                console.warn('[Scraper] YouTube oEmbed error:', oembedErr);
                        }
                }

                // =============================================================
                // TWITTER/X SPECIAL HANDLING (syndication API for clean images)
                // =============================================================
                if (domain.includes('twitter.com') || domain.includes('x.com')) {
                        try {
                                // Extract tweet ID from URL
                                const tweetIdMatch = url.match(/status\/(\d+)/);
                                if (tweetIdMatch) {
                                        const tweetId = tweetIdMatch[1];
                                        console.log('[Scraper] Twitter/X: Extracting tweet', tweetId);

                                        // Use Twitter syndication API (no auth required, returns clean JSON)
                                        const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`;
                                        const syndicationRes = await fetch(syndicationUrl, {
                                                headers: {
                                                        'Accept': 'application/json',
                                                        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
                                                },
                                        });

                                        if (syndicationRes.ok) {
                                                const tweetData = await syndicationRes.json();
                                                console.log('[Scraper] Twitter syndication success');

                                                // Extract images from tweet media
                                                const images: string[] = [];
                                                if (tweetData.mediaDetails) {
                                                        for (const media of tweetData.mediaDetails) {
                                                                if (media.media_url_https) {
                                                                        // Use original quality images
                                                                        images.push(media.media_url_https + ':orig');
                                                                }
                                                        }
                                                }
                                                // Fallback to photos array
                                                if (images.length === 0 && tweetData.photos) {
                                                        for (const photo of tweetData.photos) {
                                                                if (photo.url) images.push(photo.url);
                                                        }
                                                }

                                                const author = tweetData.user?.name || tweetData.user?.screen_name || 'Unknown';
                                                const handle = tweetData.user?.screen_name || '';
                                                // Decode HTML entities from Twitter API (e.g., &amp; → &)
                                                const tweetText = decodeHtmlEntities(tweetData.text || '');

                                                // Format title: "Author: tweet text..."
                                                let title = `${author}: "${tweetText.slice(0, 100)}${tweetText.length > 100 ? '...' : ''}"`;

                                                // DSPy Enhancement: Optionally use DSPy for better title extraction
                                                try {
                                                        const dspyTitle = await extractTitleWithDSPy(tweetText, handle, 'twitter');
                                                        if (dspyTitle.confidence > 0.7) {
                                                                // Twitter title format includes author per signature
                                                                title = `${author}: "${dspyTitle.title}"`;
                                                                console.log(`[Scraper] DSPy improved Twitter title (confidence: ${dspyTitle.confidence})`);
                                                        }
                                                } catch {
                                                        // DSPy not available, use standard format
                                                }

                                                return {
                                                        title,
                                                        description: tweetText,
                                                        imageUrl: images[0] || null,
                                                        images, // All images for multi-image tweets
                                                        content: tweetText,
                                                        author,
                                                        publishedAt: tweetData.created_at,
                                                        domain: 'twitter.com',
                                                        url,
                                                };
                                        }
                                        console.warn('[Scraper] Twitter syndication failed, falling back to HTML');
                                }
                        } catch (twitterErr) {
                                console.warn('[Scraper] Twitter special handling error:', twitterErr);
                        }
                }

                // =============================================================
                // INSTAGRAM SPECIAL HANDLING - Enhanced for actual image extraction
                // =============================================================
                if (domain.includes('instagram.com')) {
                        try {
                                console.log('[Scraper] Instagram: Extracting media');

                                // Extract shortcode from URL (e.g., /p/DSFjvqIjIZn/ or /reel/ABC123/)
                                const shortcodeMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                                const shortcode = shortcodeMatch?.[2];

                                if (shortcode) {
                                        // ==========================================================
                                        // PRIORITY 1: Try Playwright for HIGH-RES images
                                        // ==========================================================
                                        const playwrightResult = await scrapeInstagramWithPlaywright(shortcode);
                                        if (playwrightResult && playwrightResult.images.length > 0) {
                                                console.log(`[Scraper] Instagram: Using Playwright result (${playwrightResult.images.length} high-res images)`);

                                                // Generate title from caption
                                                let title = playwrightResult.caption.slice(0, 80).trim() || 'Instagram Post';

                                                // DSPy Enhancement: Use DSPy for better title extraction
                                                try {
                                                        const dspyTitle = await extractTitleWithDSPy(playwrightResult.caption, playwrightResult.author, 'instagram');
                                                        if (dspyTitle.confidence > 0.7) {
                                                                title = dspyTitle.title;
                                                                console.log(`[Scraper] DSPy improved Playwright title: "${title.slice(0, 40)}..." (confidence: ${dspyTitle.confidence})`);
                                                        }
                                                } catch {
                                                        // DSPy not available, use local extraction
                                                }

                                                return {
                                                        title,
                                                        description: playwrightResult.caption,
                                                        imageUrl: playwrightResult.images[0],
                                                        images: playwrightResult.images,
                                                        content: playwrightResult.caption,
                                                        author: playwrightResult.author,
                                                        domain: 'instagram.com',
                                                        url,
                                                };
                                        }

                                        // ==========================================================
                                        // PRIORITY 2: Fall back to embed endpoint (lower quality)
                                        // ==========================================================
                                        console.log('[Scraper] Instagram: Playwright unavailable, falling back to embed');
                                        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
                                        const embedRes = await fetch(embedUrl, {
                                                headers: {
                                                        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                                                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                                },
                                        });

                                        if (embedRes.ok) {
                                                const html = await embedRes.text();
                                                const $ = cheerio.load(html);

                                                // PHASE 5 FIX: Enhanced Instagram carousel image extraction
                                                // Goal: Extract ALL carousel images at FULL resolution

                                                // Collect all candidate images with metadata
                                                interface ImageCandidate {
                                                        url: string;
                                                        width?: number;
                                                        height?: number;
                                                        source: 'display_url' | 'display_resources' | 'img_tag' | 'og_image';
                                                }
                                                const candidates: ImageCandidate[] = [];

                                                // Strategy 1: Parse embedded JSON for edge_sidecar_to_children (carousel)
                                                // and display_url/display_resources (all posts)
                                                const scripts = $('script').map((_, el) => $(el).html()).get().join(' ');

                                                try {
                                                        // PRIORITY 1: Look for edge_sidecar_to_children (carousel posts)
                                                        // This contains the ACTUAL carousel images, not related posts
                                                        const sidecarMatch = scripts.match(/"edge_sidecar_to_children"\s*:\s*\{[^}]*"edges"\s*:\s*\[([\s\S]*?)\]\s*\}/);
                                                        if (sidecarMatch) {
                                                                console.log('[Scraper] Instagram: Detected carousel post');
                                                                // Extract display_url from each carousel item
                                                                const carouselUrls = sidecarMatch[1].match(/"display_url"\s*:\s*"([^"]+)"/g);
                                                                if (carouselUrls) {
                                                                        for (const urlMatch of carouselUrls) {
                                                                                const url = urlMatch.match(/"display_url"\s*:\s*"([^"]+)"/)?.[1];
                                                                                if (url) {
                                                                                        const cleanUrl = url
                                                                                                .replace(/\\u0026/g, '&')
                                                                                                .replace(/\\\//g, '/')
                                                                                                .replace(/\\"/g, '"');
                                                                                        // Skip profile pictures (small dimensions in URL)
                                                                                        if (!cleanUrl.includes('150x150') && !cleanUrl.includes('_s.')) {
                                                                                                candidates.push({ url: cleanUrl, source: 'display_url' });
                                                                                        }
                                                                                }
                                                                        }
                                                                }
                                                        }

                                                        // PRIORITY 2: Single post - look for main media display_url
                                                        // Only if we didn't find carousel images
                                                        if (candidates.length === 0) {
                                                                // Look for the FIRST display_url which is typically the main post
                                                                // Avoid URLs that look like profile pics or thumbnails
                                                                const displayUrlRegex = /"display_url"\s*:\s*"([^"]+)"/g;
                                                                let match;
                                                                let mainPostFound = false;
                                                                while ((match = displayUrlRegex.exec(scripts)) !== null && !mainPostFound) {
                                                                        if (match[1]) {
                                                                                const cleanUrl = match[1]
                                                                                        .replace(/\\u0026/g, '&')
                                                                                        .replace(/\\\//g, '/')
                                                                                        .replace(/\\"/g, '"');
                                                                                // Filter out profile pictures and thumbnails
                                                                                if (!cleanUrl.includes('150x150') &&
                                                                                    !cleanUrl.includes('_s.') &&
                                                                                    !cleanUrl.includes('s150x150') &&
                                                                                    !cleanUrl.includes('/s/')) {
                                                                                        candidates.push({ url: cleanUrl, source: 'display_url' });
                                                                                        mainPostFound = true; // Only take the first valid one for single posts
                                                                                }
                                                                        }
                                                                }
                                                        }

                                                        // PRIORITY 3: Look for display_resources (multiple sizes)
                                                        // Only the highest quality (largest width)
                                                        const resourcesRegex = /"display_resources"\s*:\s*\[([\s\S]*?)\]/g;
                                                        let match;
                                                        while ((match = resourcesRegex.exec(scripts)) !== null) {
                                                                if (match[1]) {
                                                                        const resourceRegex = /\{"config_width":(\d+),"config_height":(\d+),"src":"([^"]+)"\}/g;
                                                                        let resourceMatch;
                                                                        let bestResource: ImageCandidate | null = null;
                                                                        while ((resourceMatch = resourceRegex.exec(match[1])) !== null) {
                                                                                const width = parseInt(resourceMatch[1], 10);
                                                                                const height = parseInt(resourceMatch[2], 10);
                                                                                // Only consider high-res images (> 640px)
                                                                                if (width >= 640) {
                                                                                        const url = resourceMatch[3]
                                                                                                .replace(/\\u0026/g, '&')
                                                                                                .replace(/\\\//g, '/');
                                                                                        if (!bestResource || width > (bestResource.width || 0)) {
                                                                                                bestResource = { url, width, height, source: 'display_resources' };
                                                                                        }
                                                                                }
                                                                        }
                                                                        if (bestResource) {
                                                                                candidates.push(bestResource);
                                                                        }
                                                                }
                                                        }
                                                } catch (e) {
                                                        console.warn('[Scraper] Error parsing Instagram scripts:', e);
                                                }

                                                // Strategy 2: Fallback to img tags (usually lower quality)
                                                $('img[src*="cdninstagram"], img[src*="scontent"], img[src*="fbcdn"]').each((_, el) => {
                                                        const src = $(el).attr('src');
                                                        if (src) {
                                                                const cleanUrl = src.replace(/\\u0026/g, '&').replace(/\\\//g, '/');
                                                                candidates.push({ url: cleanUrl, source: 'img_tag' });
                                                        }
                                                });

                                                // Strategy 3: OG image as last resort
                                                const ogImage = $('meta[property="og:image"]').attr('content');
                                                if (ogImage && !ogImage.includes('static.cdninstagram')) {
                                                        candidates.push({ url: ogImage, source: 'og_image' });
                                                }

                                                // Deduplicate and prioritize by quality
                                                // Instagram URLs often contain the same image at different sizes
                                                // The URL path before query params is usually unique per image
                                                const seenBaseUrls = new Set<string>();
                                                const images: string[] = [];

                                                // Helper to extract base URL (without size params)
                                                const getBaseUrl = (url: string): string => {
                                                        try {
                                                                const parsed = new URL(url);
                                                                // Remove common size/quality params
                                                                return parsed.pathname;
                                                        } catch {
                                                                return url;
                                                        }
                                                };

                                                // Sort by quality: display_url > display_resources (by size) > img_tag > og_image
                                                const prioritized = candidates.sort((a, b) => {
                                                        const priority = { display_url: 0, display_resources: 1, img_tag: 2, og_image: 3 };
                                                        if (priority[a.source] !== priority[b.source]) {
                                                                return priority[a.source] - priority[b.source];
                                                        }
                                                        // For display_resources, prefer larger images
                                                        if (a.source === 'display_resources' && b.source === 'display_resources') {
                                                                const aSize = (a.width || 0) * (a.height || 0);
                                                                const bSize = (b.width || 0) * (b.height || 0);
                                                                return bSize - aSize; // Larger first
                                                        }
                                                        return 0;
                                                });

                                                // Select best image per unique content
                                                for (const candidate of prioritized) {
                                                        const baseUrl = getBaseUrl(candidate.url);
                                                        if (!seenBaseUrls.has(baseUrl)) {
                                                                seenBaseUrls.add(baseUrl);
                                                                images.push(candidate.url);
                                                        }
                                                }

                                                console.log(`[Scraper] Instagram: Found ${candidates.length} candidate images, selected ${images.length} unique`)

                                                // Extract caption/text - FIXED: Separate author from caption
                                                const rawCaption = $('.Caption').text()?.trim() ||
                                                        $('meta[property="og:description"]').attr('content') || '';
                                                const author = $('.UsernameText').text()?.trim() ||
                                                        $('meta[property="og:title"]').attr('content')?.split(' on Instagram')?.[0] || '';

                                                // FIX: Remove username prefix from caption if present
                                                // Instagram embed often concatenates "username" + "caption text" without separator
                                                let cleanCaption = rawCaption;
                                                if (author && rawCaption.toLowerCase().startsWith(author.toLowerCase())) {
                                                        cleanCaption = rawCaption.slice(author.length).trim();
                                                }
                                                // Also check for username without @ prefix variations
                                                const usernameVariants = [
                                                        author,
                                                        author.replace('@', ''),
                                                        `@${author.replace('@', '')}`,
                                                ].filter(Boolean);
                                                for (const variant of usernameVariants) {
                                                        if (cleanCaption.toLowerCase().startsWith(variant.toLowerCase())) {
                                                                cleanCaption = cleanCaption.slice(variant.length).trim();
                                                                break;
                                                        }
                                                }

                                                // Title is clean caption only (max 80 chars per signature)
                                                let title = cleanCaption.slice(0, 80).trim() || 'Instagram Post';

                                                // DSPy Enhancement: Use DSPy for better title extraction
                                                try {
                                                        const dspyTitle = await extractTitleWithDSPy(rawCaption, author, 'instagram');
                                                        if (dspyTitle.confidence > 0.7) {
                                                                title = dspyTitle.title;
                                                                console.log(`[Scraper] DSPy improved title: "${title.slice(0, 40)}..." (confidence: ${dspyTitle.confidence})`);
                                                        }
                                                } catch (dspyErr) {
                                                        // DSPy not available, use local extraction
                                                        console.log('[Scraper] DSPy unavailable, using local title extraction');
                                                }

                                                if (images.length > 0) {
                                                        console.log(`[Scraper] Instagram: Found ${images.length} images, author="${author}", title="${title.slice(0, 40)}..."`);
                                                        return {
                                                                title,
                                                                description: cleanCaption,
                                                                imageUrl: images[0],
                                                                images, // All carousel images
                                                                content: cleanCaption,
                                                                author,
                                                                domain: 'instagram.com',
                                                                url,
                                                        };
                                                }
                                        }
                                }

                                // Final fallback: Direct HTML scrape with Googlebot UA
                                console.warn('[Scraper] Instagram embed failed, trying direct HTML...');
                                const directRes = await fetch(url, {
                                        headers: {
                                                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                        },
                                });

                                if (directRes.ok) {
                                        const html = await directRes.text();
                                        const $ = cheerio.load(html);

                                        // Get og:image which should be the first image
                                        const ogImage = $('meta[property="og:image"]').attr('content');
                                        const ogTitle = $('meta[property="og:title"]').attr('content') || 'Instagram Post';
                                        const ogDesc = $('meta[property="og:description"]').attr('content') || '';

                                        if (ogImage && !ogImage.includes('static.cdninstagram')) {
                                                return {
                                                        title: ogTitle,
                                                        description: ogDesc,
                                                        imageUrl: ogImage,
                                                        content: ogDesc,
                                                        domain: 'instagram.com',
                                                        url,
                                                };
                                        }
                                }
                        } catch (igErr) {
                                console.warn('[Scraper] Instagram error:', igErr);
                        }
                }


                // =============================================================
                // REDDIT SPECIAL HANDLING (JSON API for clean extraction)
                // =============================================================
                if (domain.includes('reddit.com')) {
                        try {
                                console.log('[Scraper] Reddit: Extracting post data');

                                // Reddit supports appending .json to any URL for API access
                                const jsonUrl = url.replace(/\/?$/, '') + '.json';
                                const redditRes = await fetch(jsonUrl, {
                                        headers: {
                                                'User-Agent': 'MyMind/1.0 (Content Archiver)',
                                                'Accept': 'application/json',
                                        },
                                });

                                if (redditRes.ok) {
                                        const data = await redditRes.json();
                                        // Reddit returns array: [post, comments]
                                        const postData = data[0]?.data?.children?.[0]?.data;

                                        if (postData) {
                                                const author = `u/${postData.author}`;
                                                const subreddit = `r/${postData.subreddit}`;
                                                const postTitle = postData.title || 'Reddit Post';
                                                const selftext = postData.selftext || '';
                                                const score = postData.score || 0;
                                                const numComments = postData.num_comments || 0;

                                                // Extract images from different post types
                                                const images: string[] = [];
                                                let imageUrl: string | null = null;

                                                // Gallery posts
                                                if (postData.is_gallery && postData.media_metadata) {
                                                        Object.values(postData.media_metadata).forEach((item: any) => {
                                                                if (item?.s?.u) {
                                                                        // Decode HTML entities in URL
                                                                        const cleanUrl = item.s.u.replace(/&amp;/g, '&');
                                                                        images.push(cleanUrl);
                                                                }
                                                        });
                                                        imageUrl = images[0] || null;
                                                }
                                                // Direct image posts
                                                else if (postData.url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(postData.url)) {
                                                        imageUrl = postData.url;
                                                        images.push(postData.url);
                                                }
                                                // Preview images
                                                else if (postData.preview?.images?.[0]?.source?.url) {
                                                        const previewUrl = postData.preview.images[0].source.url.replace(/&amp;/g, '&');
                                                        imageUrl = previewUrl;
                                                        images.push(previewUrl);
                                                }
                                                // Thumbnail as fallback
                                                else if (postData.thumbnail && postData.thumbnail.startsWith('http')) {
                                                        imageUrl = postData.thumbnail;
                                                }

                                                // Detect post type
                                                let postType = 'text';
                                                if (postData.is_video) postType = 'video';
                                                else if (postData.is_gallery) postType = 'gallery';
                                                else if (images.length > 0) postType = 'image';
                                                else if (postData.url && !postData.is_self) postType = 'link';

                                                // Build title with subreddit context
                                                let title = postTitle;

                                                // DSPy Enhancement: Use DSPy for better title/summary extraction
                                                try {
                                                        const dspyTitle = await extractTitleWithDSPy(
                                                                `${postTitle}\n\n${selftext.slice(0, 500)}`,
                                                                postData.author,
                                                                'reddit'
                                                        );
                                                        if (dspyTitle.confidence > 0.7) {
                                                                title = dspyTitle.title;
                                                                console.log(`[Scraper] DSPy improved Reddit title (confidence: ${dspyTitle.confidence})`);
                                                        }
                                                } catch {
                                                        // DSPy not available, use original title
                                                }

                                                // Content includes selftext and metadata
                                                const content = selftext ||
                                                        `${postType.charAt(0).toUpperCase() + postType.slice(1)} post in ${subreddit} with ${score} upvotes and ${numComments} comments`;

                                                console.log(`[Scraper] Reddit: ${postType} post by ${author} in ${subreddit}`);

                                                return {
                                                        title: `${title}`,
                                                        description: `${subreddit} • ${score} points • ${numComments} comments`,
                                                        imageUrl,
                                                        images: images.length > 1 ? images : undefined,
                                                        content,
                                                        author,
                                                        domain: 'reddit.com',
                                                        url,
                                                        publishedAt: postData.created_utc ? new Date(postData.created_utc * 1000).toISOString() : undefined,
                                                };
                                        }
                                }
                                console.warn('[Scraper] Reddit JSON API failed, falling back to HTML');
                        } catch (redditErr) {
                                console.warn('[Scraper] Reddit error:', redditErr);
                        }
                }


                // =============================================================
                // IMDB SPECIAL HANDLING (JSON-LD for movie metadata)
                // =============================================================
                if (domain.includes('imdb.com')) {
                        try {
                                console.log('[Scraper] IMDB: Extracting movie data');

                                const imdbRes = await fetch(url, {
                                        headers: {
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                                'Accept-Language': 'en-US,en;q=0.9',
                                        },
                                });

                                if (imdbRes.ok) {
                                        const html = await imdbRes.text();
                                        const $ = cheerio.load(html);

                                        // Extract JSON-LD for structured movie data
                                        let movieData: any = null;
                                        $('script[type="application/ld+json"]').each((_, el) => {
                                                try {
                                                        const json = JSON.parse($(el).html() || '');
                                                        if (json['@type'] === 'Movie' || json['@type'] === 'TVSeries') {
                                                                movieData = json;
                                                        }
                                                } catch {}
                                        });

                                        // Fallback to og: tags if JSON-LD not found
                                        const ogTitle = $('meta[property="og:title"]').attr('content');
                                        const ogImage = $('meta[property="og:image"]').attr('content');
                                        const ogDescription = $('meta[property="og:description"]').attr('content');

                                        if (movieData) {
                                                // Extract from JSON-LD
                                                const title = movieData.name || ogTitle || 'Untitled';
                                                const year = movieData.datePublished?.slice(0, 4);
                                                const rating = movieData.aggregateRating?.ratingValue;
                                                const director = Array.isArray(movieData.director)
                                                        ? movieData.director[0]?.name
                                                        : movieData.director?.name;
                                                const genre = Array.isArray(movieData.genre)
                                                        ? movieData.genre.slice(0, 3)
                                                        : movieData.genre ? [movieData.genre] : [];
                                                const description = movieData.description || ogDescription || '';

                                                // Get poster image - prefer og:image (usually higher res)
                                                let imageUrl = ogImage || movieData.image || null;

                                                console.log(`[Scraper] IMDB: ${title} (${year}) - Rating: ${rating}`);

                                                return {
                                                        title: year ? `${title} (${year})` : title,
                                                        description,
                                                        imageUrl,
                                                        content: description,
                                                        author: director,
                                                        domain: 'imdb.com',
                                                        url,
                                                        // Additional metadata for card display
                                                        hashtags: genre.map((g: string) => g.toLowerCase().replace(/\s+/g, '-')),
                                                };
                                        }

                                        // Fallback: use OG tags
                                        if (ogTitle) {
                                                console.log('[Scraper] IMDB: Using OG tags fallback');
                                                return {
                                                        title: ogTitle,
                                                        description: ogDescription || '',
                                                        imageUrl: ogImage || null,
                                                        content: ogDescription || '',
                                                        domain: 'imdb.com',
                                                        url,
                                                };
                                        }
                                }
                                console.warn('[Scraper] IMDB fetch failed, falling back to generic');
                        } catch (imdbErr) {
                                console.warn('[Scraper] IMDB error:', imdbErr);
                        }
                }


                // =============================================================
                // LETTERBOXD SPECIAL HANDLING (for film metadata)
                // =============================================================
                if (domain.includes('letterboxd.com')) {
                        try {
                                console.log('[Scraper] Letterboxd: Extracting film data');

                                const letterboxdRes = await fetch(url, {
                                        headers: {
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                                'Accept-Language': 'en-US,en;q=0.9',
                                        },
                                });

                                if (letterboxdRes.ok) {
                                        const html = await letterboxdRes.text();
                                        const $ = cheerio.load(html);

                                        // Extract JSON-LD
                                        let movieData: any = null;
                                        $('script[type="application/ld+json"]').each((_, el) => {
                                                try {
                                                        const json = JSON.parse($(el).html() || '');
                                                        if (json['@type'] === 'Movie') {
                                                                movieData = json;
                                                        }
                                                } catch {}
                                        });

                                        // Fallback to meta tags
                                        const ogTitle = $('meta[property="og:title"]').attr('content');
                                        const ogImage = $('meta[property="og:image"]').attr('content');
                                        const ogDescription = $('meta[property="og:description"]').attr('content');

                                        // Letterboxd-specific selectors
                                        const filmTitle = $('#featured-film-header h1')?.text()?.trim() ||
                                                $('h1.headline-1')?.text()?.trim();
                                        const filmYear = $('small.number a')?.text()?.trim() ||
                                                $('[itemprop="datePublished"]')?.text()?.trim();
                                        const directorName = $('[itemprop="director"] [itemprop="name"]')?.text()?.trim() ||
                                                $('a[href*="/director/"]')?.first()?.text()?.trim();

                                        // Extract poster - Letterboxd uses different image sources
                                        let posterUrl = ogImage;
                                        const filmPoster = $('div.film-poster img').attr('src') ||
                                                $('img.image').attr('src');
                                        if (filmPoster && filmPoster.includes('ltrbxd.com')) {
                                                // Upgrade to larger size if possible
                                                posterUrl = filmPoster.replace(/-0-.*\.jpg/, '-0-1000-0-1500-crop.jpg');
                                        }

                                        if (movieData) {
                                                const title = movieData.name || filmTitle || ogTitle || 'Untitled Film';
                                                const year = movieData.datePublished?.slice(0, 4) || filmYear;
                                                const director = Array.isArray(movieData.director)
                                                        ? movieData.director[0]?.name
                                                        : movieData.director?.name || directorName;
                                                const rating = movieData.aggregateRating?.ratingValue;
                                                const genre = Array.isArray(movieData.genre)
                                                        ? movieData.genre.slice(0, 3)
                                                        : movieData.genre ? [movieData.genre] : [];

                                                console.log(`[Scraper] Letterboxd: ${title} (${year}) - Dir: ${director}`);

                                                return {
                                                        title: year ? `${title} (${year})` : title,
                                                        description: movieData.description || ogDescription || '',
                                                        imageUrl: posterUrl || movieData.image || null,
                                                        content: movieData.description || ogDescription || '',
                                                        author: director,
                                                        domain: 'letterboxd.com',
                                                        url,
                                                        hashtags: genre.map((g: string) => g.toLowerCase().replace(/\s+/g, '-')),
                                                };
                                        }

                                        // Fallback: Combine scraped data
                                        const title = filmTitle || ogTitle || 'Letterboxd Film';
                                        console.log(`[Scraper] Letterboxd fallback: ${title}`);

                                        return {
                                                title: filmYear ? `${title} (${filmYear})` : title,
                                                description: ogDescription || '',
                                                imageUrl: posterUrl || null,
                                                content: ogDescription || '',
                                                author: directorName,
                                                domain: 'letterboxd.com',
                                                url,
                                        };
                                }
                                console.warn('[Scraper] Letterboxd fetch failed, falling back to generic');
                        } catch (letterboxdErr) {
                                console.warn('[Scraper] Letterboxd error:', letterboxdErr);
                        }
                }


                // =============================================================
                // GENERAL HTML SCRAPING (with consent cookies for YouTube fallback)
                // =============================================================
                const headers: Record<string, string> = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9', // Force English content
                };

                // Add consent cookies for YouTube if needed
                if (domain.includes('youtube.com') || domain.includes('google.')) {
                        headers['Cookie'] = 'CONSENT=YES+cb; SOCS=CAESEwgDEgk2NzEwMDQwMTgaAmVuIAEaBgiA_-CvBg';
                }

                const response = await fetch(url, { headers });

                if (!response.ok) {
                        console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                        // Return minimal info if fetch fails
                        return {
                                title: url,
                                description: '',
                                imageUrl: null,
                                content: '',
                                domain: parsedUrl.hostname,
                                url,
                        };
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                // Extract Metadata
                const title =
                        $('meta[property="og:title"]').attr('content') ||
                        $('title').first().text() ||
                        $('h1').first().text() ||
                        url;


                const description =
                        $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="description"]').attr('content') ||
                        '';

                let imageUrl =
                        $('meta[property="og:image"]').attr('content') ||
                        $('meta[property="twitter:image"]').attr('content') ||
                        null;

                // Convert relative URLs to absolute
                if (imageUrl && !imageUrl.startsWith('http')) {
                        imageUrl = new URL(imageUrl, url).toString();
                }

                const author =
                        $('meta[name="author"]').attr('content') ||
                        $('meta[property="article:author"]').attr('content') ||
                        $('meta[property="profile:username"]').attr('content');

                // Try to extract author from title if it matches "Name (@handle)" pattern (common in Mastodon/Twitter)
                const titleAuthorMatch = !author && title ? title.match(/^(.+?)\s\(@[^)]+\)$/) : null;
                const finalAuthor = author || (titleAuthorMatch ? titleAuthorMatch[1] : undefined);

                // Extract Date
                let publishedAt =
                        $('meta[property="article:published_time"]').attr('content') ||
                        $('meta[property="og:published_time"]').attr('content') ||
                        $('meta[name="date"]').attr('content') ||
                        $('meta[name="pubdate"]').attr('content') ||
                        $('meta[name="publish-date"]').attr('content') ||
                        $('time').first().attr('datetime') ||
                        $('time').first().attr('content');

                // Try JSON-LD if meta tags failed
                if (!publishedAt) {
                        try {
                                const jsonLd = $('script[type="application/ld+json"]').first().html();
                                if (jsonLd) {
                                        const parsed = JSON.parse(jsonLd);
                                        // Handle single object or array graph
                                        const graph = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
                                        const article = graph.find((item: any) =>
                                                ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'].includes(item['@type'])
                                        );
                                        if (article && article.datePublished) {
                                                publishedAt = article.datePublished;
                                        }
                                }
                        } catch (e) {
                                // JSON-LD parse error, ignore
                        }
                }

                // Extract Main Content
                // Be smart about what we remove
                $('script, style, nav, footer, header, aside, .ad, .ads, .advertisement, [role="alert"]').remove();

                // Try to find the main article body
                let content = '';
                const article = $('article');
                if (article.length > 0) {
                        content = article.text();
                } else {
                        // Fallback to main or just body text but it might be messy
                        const main = $('main');
                        if (main.length > 0) {
                                content = main.text();
                        } else {
                                content = $('body').text();
                        }
                }

                // Clean up excessive whitespace and messy HTML
                content = content.replace(/\s+/g, ' ').trim();

                // specific check for Mastodon/SPA raw HTML dumps (e.g. <img...>)
                // If the text content starts with tags that Cheerio didn't strip (meaning they were text escaped strings in the DOM??) 
                // OR if it's very short and looks like just an image alt tag or loading state
                if (content.startsWith('<') || content.includes('function()') || content.includes('window.__')) {
                        // If content looks like raw HTML/JS, prefer description
                        console.log('[Scraper] Detected raw HTML/script in content, falling back to description');
                        content = description || title;
                } else if (url.includes('mathstodon.xyz') || url.includes('mastodon')) {
                        // For Mastodon, the "content" often ends up being just the "Login" text or sidebar if not successful.
                        // Use description if available and content seems generic
                        if (content.includes('Mastodon is the best way to keep up') || content.length < 100) {
                                content = description || content;
                        }
                }

                // Allow fallback to OG description if main content is too short (likely just nav/footer text)
                if (content.length < 50 && description.length > 50) {
                        content = description;
                }

                content = content.slice(0, 5000); // Limit to 5k chars for AI context window

                return {
                        title,
                        description,
                        imageUrl,
                        content,
                        author: finalAuthor,
                        publishedAt,
                        domain: parsedUrl.hostname,
                        url,
                };

        } catch (error) {
                console.error('Error scraping URL:', error);
                return {
                        title: url,
                        description: '',
                        imageUrl: null,
                        content: '',
                        domain: new URL(url).hostname,
                        url,
                };
        }
}
