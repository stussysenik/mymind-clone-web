import * as cheerio from 'cheerio';

export interface ScrapedContent {
        title: string;
        description: string;
        imageUrl: string | null;
        content: string; // The main text content
        author?: string;
        publishedAt?: string;
        domain: string;
        url: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
        try {
                const response = await fetch(url, {
                        headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; MyMindCloneBot/1.0; +http://mymind-clone.local)',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        },
                });

                if (!response.ok) {
                        console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                        // Return minimal info if fetch fails
                        return {
                                title: url,
                                description: '',
                                imageUrl: null,
                                content: '',
                                domain: new URL(url).hostname,
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

                const publishedAt =
                        $('meta[property="article:published_time"]').attr('content') ||
                        $('time').first().attr('datetime');

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
                        domain: new URL(url).hostname,
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
