import * as cheerio from 'cheerio';

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
                                                const tweetText = tweetData.text || '';

                                                return {
                                                        title: `${author}: "${tweetText.slice(0, 100)}${tweetText.length > 100 ? '...' : ''}"`,
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
                                        // Try Facebook Graph API embed endpoint (more reliable than deprecated oEmbed)
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

                                                // Extract images from various sources in embed HTML
                                                const images: string[] = [];

                                                // Try to find images in img tags with actual URLs
                                                $('img[src*="cdninstagram"], img[src*="scontent"]').each((_, el) => {
                                                        const src = $(el).attr('src');
                                                        if (src && !images.includes(src)) {
                                                                images.push(src);
                                                        }
                                                });

                                                // Also parse any embedded JSON for carousel images
                                                const scripts = $('script').map((_, el) => $(el).html()).get().join(' ');

                                                // Strategy 1: Look for edge_sidecar_to_children in JSON blobs
                                                // This often appears in window.__additionalDataLoaded or similar
                                                try {
                                                        const sidecarMatches = scripts.match(/"edge_sidecar_to_children"\s*:\s*({[^}]+})/);
                                                        if (sidecarMatches?.[1]) {
                                                                // It's usually nested deeper, so simple regex might not catch the full object.
                                                                // Instead, let's look for "display_url" patterns which usually appear for each child.
                                                        }

                                                        // Better Strategy: Regex for all display_url occurrences in the script content
                                                        // This covers both single posts and carousels where all children are listed in the initial state
                                                        // We use a set to dedup
                                                        const urlRegex = /"display_url"\s*:\s*"([^"]+)"/g;
                                                        let match;
                                                        while ((match = urlRegex.exec(scripts)) !== null) {
                                                                if (match[1]) {
                                                                        const cleanUrl = match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
                                                                        if (!images.includes(cleanUrl)) {
                                                                                images.push(cleanUrl);
                                                                        }
                                                                }
                                                        }

                                                        // Also look for "display_resources" which often has higher quality candidates
                                                        // src pattern in JSON
                                                        const srcRegex = /"src"\s*:\s*"([^"]+)"/g;
                                                        while ((match = srcRegex.exec(scripts)) !== null) {
                                                                if (match[1] && (match[1].includes('cdninstagram') || match[1].includes('fbcdn'))) {
                                                                        const cleanUrl = match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
                                                                        // Only add if we don't have it (fuzzy match to avoid dupes of different sizes)
                                                                        // For simplicity, just add if exact match missing
                                                                        if (!images.includes(cleanUrl)) {
                                                                                // Prefer not to flood with thumbnails, but "src" usually implies a candidate
                                                                                // Let's stick to display_url as primary if found
                                                                        }
                                                                }
                                                        }
                                                } catch (e) {
                                                        console.warn('[Scraper] Error parsing Instagram scripts:', e);
                                                }

                                                // Extract caption/text
                                                const caption = $('.Caption').text()?.trim() ||
                                                        $('meta[property="og:description"]').attr('content') || '';
                                                const author = $('.UsernameText').text()?.trim() ||
                                                        $('meta[property="og:title"]').attr('content')?.split(' on Instagram')?.[0] || '';

                                                if (images.length > 0) {
                                                        console.log(`[Scraper] Instagram: Found ${images.length} images`);
                                                        return {
                                                                title: caption.slice(0, 100) || 'Instagram Post',
                                                                description: caption,
                                                                imageUrl: images[0],
                                                                images, // All carousel images
                                                                content: caption,
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
