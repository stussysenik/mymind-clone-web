import * as cheerio from 'cheerio';
import { extractTitleWithDSPy, extractAssetsWithDSPy, extractContentWithDSPy } from './dspy-client';
import { extractInstagramPost } from './instagram-extractor';
import { extractTweet } from './twitter-extractor';
import { decodeHtmlEntities } from './text-utils';

export interface ScrapedContent {
        title: string;
        description: string;
        imageUrl: string | null;
        images?: string[]; // For multi-image posts (Twitter, Instagram carousel)
        content: string; // The main text content
        author?: string;
        /** Author's display name (e.g., "Elon Musk") */
        authorName?: string;
        /** Author's handle/username without @ (e.g., "elonmusk") */
        authorHandle?: string;
        /** Author's profile avatar URL */
        authorAvatar?: string;
        publishedAt?: string;
        domain: string;
        url: string;
        hashtags?: string[]; // Extracted hashtags from content
        mentions?: string[]; // Extracted @mentions from content
        /** Flag for screenshot to use mobile viewport for better aspect ratio */
        needsMobileScreenshot?: boolean;
        /** Engagement metrics (Twitter likes, retweets, etc.) */
        engagement?: {
                likes?: number;
                retweets?: number;
                replies?: number;
                views?: number;
        };
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

                                        // Extract author info from oEmbed
                                        const authorName = oembed.author_name || 'Unknown';
                                        // Parse handle from author_url (e.g., https://www.youtube.com/@handle)
                                        let authorHandle = '';
                                        if (oembed.author_url) {
                                                const handleMatch = oembed.author_url.match(/@([^\/\?]+)/);
                                                authorHandle = handleMatch ? handleMatch[1] : '';
                                        }

                                        return {
                                                title: oembed.title || 'YouTube Video',
                                                description: `Video by ${authorName}`,
                                                imageUrl,
                                                content: `YouTube video: "${oembed.title}" by ${authorName}`,
                                                author: authorName,
                                                authorName,
                                                authorHandle,
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
                // TWITTER/X SPECIAL HANDLING (FxTwitter API + Syndication API)
                // =============================================================
                if (domain.includes('twitter.com') || domain.includes('x.com')) {
                        try {
                                const tweet = await extractTweet(url);
                                if (tweet) {
                                        const author = tweet.authorName || tweet.authorHandle || 'Unknown';

                                        // Format title
                                        let title = `${author}: "${tweet.text.slice(0, 100)}${tweet.text.length > 100 ? '...' : ''}"`;

                                        // DSPy Enhancement: Optionally use DSPy for better title extraction
                                        try {
                                                const dspyTitle = await extractTitleWithDSPy(tweet.text, tweet.authorHandle, 'twitter');
                                                if (dspyTitle.confidence > 0.7) {
                                                        title = `${author}: "${dspyTitle.title}"`;
                                                        console.log(`[Scraper] DSPy improved Twitter title (confidence: ${dspyTitle.confidence})`);
                                                }
                                        } catch {
                                                // DSPy not available, use standard format
                                        }

                                        return {
                                                title,
                                                description: tweet.text,
                                                imageUrl: tweet.images[0] ?? null,
                                                images: tweet.images,
                                                content: tweet.text,
                                                author,
                                                authorName: tweet.authorName,
                                                authorHandle: tweet.authorHandle,
                                                authorAvatar: tweet.authorAvatar,
                                                domain: 'x.com',
                                                url,
                                                hashtags: extractHashtags(tweet.text),
                                                mentions: extractMentions(tweet.text),
                                                engagement: {
                                                        likes: tweet.likes,
                                                        retweets: tweet.retweets,
                                                        replies: tweet.replies,
                                                        views: tweet.views,
                                                },
                                        };
                                }
                                console.warn('[Scraper] Twitter API extraction failed, falling back to HTML scrape');
                        } catch (twitterErr) {
                                console.warn('[Scraper] Twitter special handling error:', twitterErr);
                        }
                }

                // =============================================================
                // INSTAGRAM SPECIAL HANDLING - O(1) API-first extraction
                // =============================================================
                if (domain.includes('instagram.com')) {
                        try {
                                console.log('[Scraper] Instagram: Extracting via API (no Playwright)');

                                const igPost = await extractInstagramPost(url);

                                if (igPost && igPost.images.length > 0) {
                                        console.log(`[Scraper] Instagram: ${igPost.source} returned ${igPost.images.length} images`);

                                        // Generate title from caption
                                        let title = igPost.caption.slice(0, 80).trim() || 'Instagram Post';

                                        // DSPy Enhancement: Use DSPy for better title extraction
                                        try {
                                                const dspyTitle = await extractTitleWithDSPy(igPost.caption, igPost.authorHandle, 'instagram');
                                                if (dspyTitle.confidence > 0.7) {
                                                        title = dspyTitle.title;
                                                        console.log(`[Scraper] DSPy improved IG title: "${title.slice(0, 40)}..." (confidence: ${dspyTitle.confidence})`);
                                                }
                                        } catch {
                                                // DSPy not available, use local extraction
                                        }

                                        return {
                                                title,
                                                description: igPost.caption,
                                                imageUrl: igPost.images[0],
                                                images: igPost.images,
                                                content: igPost.caption,
                                                author: igPost.authorHandle,
                                                authorName: igPost.authorName,
                                                authorHandle: igPost.authorHandle,
                                                domain: 'instagram.com',
                                                url,
                                        };
                                }

                                // All strategies failed - return minimal data
                                console.warn('[Scraper] Instagram: All extraction strategies failed');
                                return {
                                        title: 'Instagram Post',
                                        description: '',
                                        imageUrl: null,
                                        content: '',
                                        domain: 'instagram.com',
                                        url,
                                };
                        } catch (igErr) {
                                console.warn('[Scraper] Instagram error:', igErr);
                        }
                }


                // =============================================================
                // TIKTOK SPECIAL HANDLING (oEmbed API)
                // =============================================================
                if (domain.includes('tiktok.com')) {
                        try {
                                console.log('[Scraper] TikTok: Extracting video data');

                                // Use TikTok's oEmbed API for clean metadata
                                const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
                                const tiktokRes = await fetch(oembedUrl, {
                                        headers: {
                                                'Accept': 'application/json',
                                                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
                                        },
                                });

                                if (tiktokRes.ok) {
                                        const oembed = await tiktokRes.json();
                                        console.log('[Scraper] TikTok oEmbed success:', oembed.title);

                                        // Extract author info from oEmbed
                                        const authorName = oembed.author_name || 'Unknown';
                                        const authorHandle = oembed.author_unique_id || '';

                                        return {
                                                title: oembed.title || 'TikTok Video',
                                                description: `Video by @${authorHandle || authorName}`,
                                                imageUrl: oembed.thumbnail_url || null,
                                                content: oembed.title || '',
                                                author: authorName,
                                                authorName,
                                                authorHandle,
                                                domain: 'tiktok.com',
                                                url,
                                        };
                                }
                                console.warn('[Scraper] TikTok oEmbed failed, falling back to HTML');
                        } catch (tiktokErr) {
                                console.warn('[Scraper] TikTok error:', tiktokErr);
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
                                let redditRes = await fetch(jsonUrl, {
                                        headers: {
                                                'User-Agent': 'MyMind/1.0 (Content Archiver)',
                                                'Accept': 'application/json',
                                        },
                                });

                                // Fallback to old.reddit.com if blocked (403/429)
                                if (!redditRes.ok && (redditRes.status === 403 || redditRes.status === 429)) {
                                        console.log('[Scraper] Reddit: Main API blocked, trying old.reddit.com');
                                        const oldRedditUrl = url
                                                .replace('www.reddit.com', 'old.reddit.com')
                                                .replace(/^(https?:\/\/)reddit\.com/, '$1old.reddit.com')
                                                .replace(/\/?$/, '') + '.json';

                                        // Small delay to avoid rate limiting
                                        await new Promise(resolve => setTimeout(resolve, 500));

                                        redditRes = await fetch(oldRedditUrl, {
                                                headers: {
                                                        'User-Agent': 'MyMind/1.0 (Content Archiver)',
                                                        'Accept': 'application/json',
                                                },
                                        });
                                }

                                if (redditRes.ok) {
                                        const data = await redditRes.json();
                                        // Reddit returns array: [post, comments]
                                        const postData = data[0]?.data?.children?.[0]?.data;

                                        if (postData) {
                                                // Extract author info - Reddit uses u/username format
                                                const authorHandle = postData.author || 'redditor';
                                                const authorName = authorHandle; // Reddit doesn't expose display names via API
                                                const author = `u/${authorHandle}`;
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
                                                        authorName,
                                                        authorHandle,
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
                                                        let content = $(el).html() || '';
                                                        // Strip CDATA wrapper if present (Letterboxd wraps JSON-LD in CDATA comments)
                                                        content = content.replace(/\/\*\s*<!\[CDATA\[\s*\*\//, '').replace(/\/\*\s*\]\]>\s*\*\//, '').trim();
                                                        const json = JSON.parse(content);
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

                                        // Extract poster - prioritize JSON-LD image (most reliable), then CSS selectors
                                        let posterUrl: string | null = null;

                                        // 1. Try JSON-LD image first (always available, most reliable)
                                        if (movieData?.image) {
                                                posterUrl = movieData.image;
                                        }

                                        // 2. Try CSS selectors as fallback
                                        if (!posterUrl) {
                                                const filmPoster =
                                                        $('div.film-poster img').attr('src') ||
                                                        $('div.film-poster img').attr('data-src') ||           // Lazy-loaded
                                                        $('div.really-lazy-load').attr('data-src') ||          // Lazy-load container
                                                        $('img.image[src*="ltrbxd.com"]').attr('src') ||       // Direct image with domain
                                                        $('img[alt*="poster"]').attr('src') ||                 // Alt text hint
                                                        $('.poster img').attr('src') ||                        // Generic poster class
                                                        $('img.image').attr('src');

                                                if (filmPoster) {
                                                        posterUrl = filmPoster;
                                                }
                                        }

                                        // 3. Fallback to og:image
                                        if (!posterUrl && ogImage) {
                                                posterUrl = ogImage;
                                        }

                                        // 4. Upgrade to HD poster size if it's a Letterboxd CDN URL
                                        // URL format: https://a.ltrbxd.com/resized/film-poster/6/1/7/4/4/3/617443-dune-part-two-0-230-0-345-crop.jpg?v=...
                                        // Pattern: {filename}-0-{width}-0-{height}-crop.{ext} (note: starts with filename then 0-, not -0-)
                                        if (posterUrl && (posterUrl.includes('ltrbxd.com') || posterUrl.includes('letterboxd.com'))) {
                                                // Match pattern: -0-{width}-0-{height}-crop.{ext} preserving query string
                                                // The first 0 follows a filename (e.g., "dune-part-two-0-230-0-345-crop.jpg")
                                                posterUrl = posterUrl.replace(
                                                        /-0-\d+-0-\d+-crop\.(jpg|png|webp)/i,
                                                        '-0-1000-0-1500-crop.$1'
                                                );
                                        }

                                        console.log('[Scraper] Letterboxd poster:', posterUrl ? posterUrl.slice(0, 80) + '...' : 'none');

                                        if (movieData) {
                                                const title = movieData.name || filmTitle || ogTitle || 'Untitled Film';
                                                // Letterboxd uses dateCreated in JSON-LD, not datePublished
                                                const year = movieData.datePublished?.slice(0, 4) || movieData.dateCreated?.slice(0, 4) || filmYear;
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
                                                        imageUrl: posterUrl,
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
                // AMAZON SPECIAL HANDLING (product metadata)
                // =============================================================
                if (domain.includes('amazon.com') || domain.includes('amazon.co') || domain.includes('amzn.')) {
                        try {
                                console.log('[Scraper] Amazon: Extracting product data');

                                const amazonRes = await fetch(url, {
                                        headers: {
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                                'Accept-Language': 'en-US,en;q=0.9',
                                        },
                                });

                                if (amazonRes.ok) {
                                        const html = await amazonRes.text();
                                        const $ = cheerio.load(html);

                                        // Extract product title
                                        const productTitle = $('#productTitle').text()?.trim() ||
                                                $('meta[property="og:title"]').attr('content') ||
                                                $('title').text()?.trim() || 'Amazon Product';

                                        // Extract price
                                        const price = $('.a-price .a-offscreen').first().text()?.trim() ||
                                                $('#priceblock_ourprice').text()?.trim() ||
                                                $('#priceblock_dealprice').text()?.trim() ||
                                                $('.a-price-whole').first().text()?.trim();

                                        // Extract rating
                                        const ratingText = $('.a-icon-star-small .a-icon-alt').first().text()?.trim() ||
                                                $('[data-hook="average-star-rating"] .a-icon-alt').first().text()?.trim();
                                        const rating = ratingText?.match(/[\d.]+/)?.[0];

                                        // Extract image
                                        const imageUrl = $('#landingImage').attr('src') ||
                                                $('#imgBlkFront').attr('src') ||
                                                $('meta[property="og:image"]').attr('content');

                                        // Extract description
                                        const description = $('#feature-bullets ul').text()?.trim()?.slice(0, 500) ||
                                                $('meta[name="description"]').attr('content') ||
                                                $('meta[property="og:description"]').attr('content') || '';

                                        // Extract ASIN from URL
                                        const asinMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
                                        const asin = asinMatch?.[1];

                                        // Build a clean title with price
                                        let title = productTitle;
                                        if (price) {
                                                title = `${productTitle} - ${price}`;
                                        }

                                        // DSPy Enhancement for product summary
                                        try {
                                                const dspyTitle = await extractTitleWithDSPy(productTitle, 'Amazon', 'amazon');
                                                if (dspyTitle.confidence > 0.7) {
                                                        title = price ? `${dspyTitle.title} - ${price}` : dspyTitle.title;
                                                        console.log(`[Scraper] DSPy improved Amazon title (confidence: ${dspyTitle.confidence})`);
                                                }
                                        } catch {
                                                // DSPy not available
                                        }

                                        console.log(`[Scraper] Amazon: "${title.slice(0, 50)}..." - ASIN: ${asin}`);

                                        return {
                                                title,
                                                description,
                                                imageUrl: imageUrl || null,
                                                content: description,
                                                author: 'Amazon',
                                                domain: 'amazon.com',
                                                url,
                                                hashtags: rating ? [`rating-${rating}`] : [],
                                        };
                                }
                                console.warn('[Scraper] Amazon fetch failed, falling back to generic');
                        } catch (amazonErr) {
                                console.warn('[Scraper] Amazon error:', amazonErr);
                        }
                }


                // =============================================================
                // GOODREADS SPECIAL HANDLING (book metadata)
                // =============================================================
                if (domain.includes('goodreads.com')) {
                        try {
                                console.log('[Scraper] Goodreads: Extracting book data');

                                const goodreadsRes = await fetch(url, {
                                        headers: {
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                                'Accept-Language': 'en-US,en;q=0.9',
                                        },
                                });

                                if (goodreadsRes.ok) {
                                        const html = await goodreadsRes.text();
                                        const $ = cheerio.load(html);

                                        // Extract JSON-LD for book data
                                        let bookData: any = null;
                                        $('script[type="application/ld+json"]').each((_, el) => {
                                                try {
                                                        const json = JSON.parse($(el).html() || '');
                                                        if (json['@type'] === 'Book') {
                                                                bookData = json;
                                                        }
                                                } catch {}
                                        });

                                        // Fallback to page selectors
                                        const bookTitle = bookData?.name ||
                                                $('h1[data-testid="bookTitle"]').text()?.trim() ||
                                                $('h1.Text__title1').text()?.trim() ||
                                                $('meta[property="og:title"]').attr('content')?.split(' by ')?.[0] ||
                                                'Book';

                                        const authorName = bookData?.author?.name ||
                                                (Array.isArray(bookData?.author) ? bookData?.author[0]?.name : null) ||
                                                $('a.ContributorLink').first().text()?.trim() ||
                                                $('[data-testid="authorName"]').text()?.trim() ||
                                                $('meta[property="og:title"]').attr('content')?.split(' by ')?.[1];

                                        const ratingValue = bookData?.aggregateRating?.ratingValue ||
                                                $('[data-testid="ratingsCount"]').attr('aria-label')?.match(/[\d.]+/)?.[0] ||
                                                $('.RatingStatistics__rating').text()?.trim();

                                        const description = bookData?.description ||
                                                $('[data-testid="description"]').text()?.trim() ||
                                                $('meta[property="og:description"]').attr('content') || '';

                                        const imageUrl = bookData?.image ||
                                                $('img.ResponsiveImage').attr('src') ||
                                                $('meta[property="og:image"]').attr('content');

                                        // Extract genres
                                        const genres: string[] = [];
                                        $('[data-testid="genresList"] a').each((_, el) => {
                                                const genre = $(el).text()?.trim();
                                                if (genre) genres.push(genre.toLowerCase().replace(/\s+/g, '-'));
                                        });

                                        let title = authorName ? `${bookTitle} by ${authorName}` : bookTitle;

                                        // DSPy Enhancement
                                        try {
                                                const dspyTitle = await extractTitleWithDSPy(`${bookTitle} by ${authorName}`, authorName || '', 'goodreads');
                                                if (dspyTitle.confidence > 0.7) {
                                                        title = dspyTitle.title;
                                                        console.log(`[Scraper] DSPy improved Goodreads title (confidence: ${dspyTitle.confidence})`);
                                                }
                                        } catch {
                                                // DSPy not available
                                        }

                                        console.log(`[Scraper] Goodreads: "${title}" - Rating: ${ratingValue}`);

                                        return {
                                                title,
                                                description: description.slice(0, 500),
                                                imageUrl: imageUrl || null,
                                                content: description,
                                                author: authorName,
                                                domain: 'goodreads.com',
                                                url,
                                                hashtags: genres.slice(0, 5),
                                        };
                                }
                                console.warn('[Scraper] Goodreads fetch failed, falling back to generic');
                        } catch (goodreadsErr) {
                                console.warn('[Scraper] Goodreads error:', goodreadsErr);
                        }
                }


                // =============================================================
                // STORYGRAPH SPECIAL HANDLING (book metadata)
                // =============================================================
                if (domain.includes('thestorygraph.com') || domain.includes('storygraph.com')) {
                        try {
                                console.log('[Scraper] StoryGraph: Extracting book data');

                                const storygraphRes = await fetch(url, {
                                        headers: {
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                                'Accept-Language': 'en-US,en;q=0.9',
                                        },
                                });

                                if (storygraphRes.ok) {
                                        const html = await storygraphRes.text();
                                        const $ = cheerio.load(html);

                                        // Extract book title
                                        const bookTitle = $('h3.book-title-author-and-series a').first().text()?.trim() ||
                                                $('meta[property="og:title"]').attr('content')?.split(' by ')?.[0] ||
                                                $('h1').first().text()?.trim() ||
                                                'Book';

                                        // Extract author
                                        const authorName = $('h3.book-title-author-and-series a').last().text()?.trim() ||
                                                $('meta[property="og:title"]').attr('content')?.split(' by ')?.[1];

                                        // Extract cover image
                                        const imageUrl = $('img.book-cover').attr('src') ||
                                                $('meta[property="og:image"]').attr('content');

                                        // Extract description
                                        const description = $('.book-description').text()?.trim() ||
                                                $('meta[property="og:description"]').attr('content') || '';

                                        // Extract moods/tags
                                        const moods: string[] = [];
                                        $('.mood-tag, .pace-tag, .book-pane-tag').each((_, el) => {
                                                const mood = $(el).text()?.trim();
                                                if (mood) moods.push(mood.toLowerCase().replace(/\s+/g, '-'));
                                        });

                                        let title = authorName ? `${bookTitle} by ${authorName}` : bookTitle;

                                        // DSPy Enhancement
                                        try {
                                                const dspyTitle = await extractTitleWithDSPy(`${bookTitle} by ${authorName}`, authorName || '', 'storygraph');
                                                if (dspyTitle.confidence > 0.7) {
                                                        title = dspyTitle.title;
                                                        console.log(`[Scraper] DSPy improved StoryGraph title (confidence: ${dspyTitle.confidence})`);
                                                }
                                        } catch {
                                                // DSPy not available
                                        }

                                        console.log(`[Scraper] StoryGraph: "${title}"`);

                                        return {
                                                title,
                                                description: description.slice(0, 500),
                                                imageUrl: imageUrl || null,
                                                content: description,
                                                author: authorName,
                                                domain: 'storygraph.com',
                                                url,
                                                hashtags: moods.slice(0, 5),
                                        };
                                }
                                console.warn('[Scraper] StoryGraph fetch failed, falling back to generic');
                        } catch (storygraphErr) {
                                console.warn('[Scraper] StoryGraph error:', storygraphErr);
                        }
                }


                // =============================================================
                // WIKIPEDIA SPECIAL HANDLING (article summary)
                // =============================================================
                if (domain.includes('wikipedia.org')) {
                        try {
                                console.log('[Scraper] Wikipedia: Extracting article data');

                                // Extract article title from URL
                                const wikiTitleMatch = url.match(/\/wiki\/([^#?]+)/);
                                const wikiTitle = wikiTitleMatch?.[1] ? decodeURIComponent(wikiTitleMatch[1].replace(/_/g, ' ')) : null;

                                if (wikiTitle) {
                                        // Use Wikipedia's REST API for clean summary
                                        const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
                                        const wikiRes = await fetch(apiUrl, {
                                                headers: {
                                                        'Accept': 'application/json',
                                                        'User-Agent': 'MyMind/1.0 (Content Archiver)',
                                                },
                                        });

                                        if (wikiRes.ok) {
                                                const wikiData = await wikiRes.json();

                                                const title = wikiData.title || wikiTitle;
                                                const description = wikiData.extract || '';
                                                const imageUrl = wikiData.thumbnail?.source || wikiData.originalimage?.source;

                                                // DSPy Enhancement for condensed summary
                                                let finalTitle = title;
                                                try {
                                                        const dspyTitle = await extractTitleWithDSPy(description.slice(0, 500), 'Wikipedia', 'wikipedia');
                                                        if (dspyTitle.confidence > 0.7) {
                                                                // Keep original title but DSPy can improve it
                                                                console.log(`[Scraper] DSPy analyzed Wikipedia content (confidence: ${dspyTitle.confidence})`);
                                                        }
                                                } catch {
                                                        // DSPy not available
                                                }

                                                console.log(`[Scraper] Wikipedia: "${finalTitle}" - ${description.length} chars`);

                                                return {
                                                        title: finalTitle,
                                                        description: description.slice(0, 300),
                                                        imageUrl: imageUrl || null,
                                                        content: description,
                                                        author: 'Wikipedia',
                                                        domain: 'wikipedia.org',
                                                        url,
                                                        hashtags: wikiData.type ? [wikiData.type.toLowerCase()] : [],
                                                };
                                        }
                                }
                                console.warn('[Scraper] Wikipedia API failed, falling back to HTML');
                        } catch (wikiErr) {
                                console.warn('[Scraper] Wikipedia error:', wikiErr);
                        }
                }


                // =============================================================
                // PERPLEXITY.AI SPECIAL HANDLING
                // Perplexity blocks scrapers (403) so we rely on URL structure
                // and store minimal metadata - the screenshot captures the answer
                // =============================================================
                if (domain.includes('perplexity.ai')) {
                        console.log('[Scraper] Perplexity: Extracting from URL structure');

                        // Extract search ID from URL (e.g., /search/d03ec8bd-cab5-43a4-b97d-196bff7f4e9f)
                        const searchIdMatch = url.match(/\/search\/([a-f0-9-]+)/i);
                        const searchId = searchIdMatch?.[1] || 'search';

                        // Perplexity URLs don't contain the query, so we use a generic title
                        // The AI enrichment will analyze the screenshot to understand content
                        const title = 'Perplexity AI Search';
                        const description = 'AI-powered search result with cited sources. View the screenshot for the full answer.';

                        return {
                                title,
                                description,
                                imageUrl: null, // Screenshot will be captured separately
                                content: `Perplexity AI search result (ID: ${searchId}). This is an AI-generated answer with citations from web sources. The screenshot captures the full response.`,
                                author: 'Perplexity AI',
                                domain: 'perplexity.ai',
                                url,
                                hashtags: ['ai-search', 'research'],
                                needsMobileScreenshot: true,
                        };
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
