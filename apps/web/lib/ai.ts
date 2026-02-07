/**
 * MyMind Clone - AI Utilities
 * 
 * Uses GLM-4.7 for content classification and GLM-4.6V for vision.
 * Falls back to rule-based classification if API is unavailable.
 * 
 * @fileoverview AI utilities using Zhipu GLM Coding API
 */

import type { CardType, ClassificationResult, ImageAnalysisResult } from './types';
import { CLASSIFICATION_TOOL, GENERIC_CLASSIFICATION_PROMPT } from './prompts';
import { getInstagramPrompt, extractInstagramHashtags } from './prompts/instagram';
import { getTwitterPrompt, detectThreadIntent, extractTwitterHashtags } from './prompts/twitter';
import { generateSummaryWithDSPy, cleanMovieTitle, isMoviePlatform, type DSPyPlatform } from './dspy-client';

// =============================================================================
// CONFIGURATION
// =============================================================================

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_API_BASE = process.env.ZHIPU_API_BASE || 'https://api.z.ai/api/coding/paas/v4';

// Models
const TEXT_MODEL = 'glm-4.7';
const VISION_MODEL = 'glm-4.6v';

/**
 * Check if AI features are available.
 */
export function isAIConfigured(): boolean {
        return !!ZHIPU_API_KEY;
}

// =============================================================================
// GLM API CLIENT
// =============================================================================

interface GLMMessage {
        role: 'system' | 'user' | 'assistant';
        content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface GLMResponse {
        choices: Array<{
                message: {
                        content: string;
                        tool_calls?: Array<{
                                function: {
                                        name: string;
                                        arguments: string;
                                };
                        }>;
                };
        }>;
}

/**
 * Call the GLM API.
 */
async function callGLM(
        model: string,
        messages: GLMMessage[],
        tools?: Array<{
                type: 'function';
                function: {
                        name: string;
                        description: string;
                        parameters: Record<string, unknown>;
                };
        }>,
        timeoutMs: number = 30000
): Promise<GLMResponse> {
        const endpoint = `${ZHIPU_API_BASE}/chat/completions`;

        const body: Record<string, unknown> = {
                model,
                messages,
                // GLM-4.7 is a reasoning model — reasoning tokens consume the budget,
                // so we need generous max_tokens to get full output
                max_tokens: 4000,
        };

        // NOTE: Tool calling is disabled for GLM-4.7 (reasoning model).
        // Tool call arguments come back empty/truncated because reasoning tokens
        // consume the budget. Instead, we ask for JSON in the response content.
        if (tools) {
                body.tools = tools;
                body.tool_choice = { type: 'function', function: { name: tools[0].function.name } };
        }

        const startTime = Date.now();
        const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(timeoutMs),
        });

        const elapsedMs = Date.now() - startTime;
        console.log(`[AI] GLM ${model} responded in ${elapsedMs}ms`);

        if (!response.ok) {
                const error = await response.text();
                throw new Error(`GLM API error: ${response.status} - ${error}`);
        }

        return response.json();
}

// =============================================================================
// IMAGE TO BASE64 CONVERSION (for GLM-4.6V)
// =============================================================================

/**
 * Maximum image size in bytes (5MB).
 * Larger images will be skipped to avoid memory issues.
 */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Fetches an image from URL and converts to base64 data URL.
 * GLM-4.6V cannot access external URLs, so we must inline images.
 * 
 * @param imageUrl - External image URL to fetch
 * @returns Base64 data URL or null if fetch fails
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
        try {
                // Skip if already base64
                if (imageUrl.startsWith('data:')) {
                        return imageUrl;
                }

                // Fetch with timeout (5 seconds)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(imageUrl, {
                        signal: controller.signal,
                        headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; MyMindBot/1.0)',
                                'Accept': 'image/*',
                        },
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                        console.warn(`[AI] Image fetch failed: ${response.status} for ${imageUrl}`);
                        return null;
                }

                // Check content type
                const contentType = response.headers.get('content-type') || 'image/jpeg';
                if (!contentType.startsWith('image/')) {
                        console.warn(`[AI] Not an image: ${contentType}`);
                        return null;
                }

                // Check size via Content-Length header first (if available)
                const contentLength = response.headers.get('content-length');
                if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
                        console.warn(`[AI] Image too large: ${contentLength} bytes`);
                        return null;
                }

                // Read the buffer
                const buffer = await response.arrayBuffer();

                // Double-check size after download
                if (buffer.byteLength > MAX_IMAGE_SIZE) {
                        console.warn(`[AI] Image too large after download: ${buffer.byteLength} bytes`);
                        return null;
                }

                // Convert to base64
                const base64 = Buffer.from(buffer).toString('base64');
                const dataUrl = `data:${contentType};base64,${base64}`;

                console.log(`[AI] Converted image to base64: ${imageUrl.slice(0, 50)}... (${buffer.byteLength} bytes)`);
                return dataUrl;
        } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                        console.warn(`[AI] Image fetch timeout: ${imageUrl}`);
                } else {
                        console.error(`[AI] Image fetch error:`, error);
                }
                return null;
        }
}

// =============================================================================
// CONTENT CLASSIFICATION
// =============================================================================

/**
 * Detects if a URL is from Instagram.
 */
function isInstagramUrl(url: string | null): boolean {
	if (!url) return false;
	try {
		const hostname = new URL(url).hostname.toLowerCase();
		return hostname.includes('instagram.com');
	} catch {
		return false;
	}
}

/**
 * Detects if a URL is from Twitter/X.
 */
function isTwitterUrl(url: string | null): boolean {
	if (!url) return false;
	try {
		const hostname = new URL(url).hostname.toLowerCase();
		return hostname.includes('twitter.com') || hostname.includes('x.com');
	} catch {
		return false;
	}
}

/**
 * Extracts caption from content for Instagram posts.
 */
function extractInstagramCaption(content: string | null): string | undefined {
	// The scraper typically extracts caption as the content
	return content || undefined;
}

/**
 * Extracts tweet text from content.
 */
function extractTweetText(content: string | null): string {
	// The scraper typically extracts tweet text as the content
	return content || '';
}

// Note: CLASSIFICATION_TOOL is now imported from './prompts'

/**
 * Normalize type to allowed database values.
 * Maps any type to: article, image, note, product, book, video, audio, social, or movie
 */
function normalizeType(type: string): 'article' | 'image' | 'note' | 'product' | 'book' | 'video' | 'audio' | 'social' | 'movie' {
        const normalized = type?.toLowerCase() ?? 'article';

        // Map common types to our allowed values
        const typeMap: Record<string, 'article' | 'image' | 'note' | 'product' | 'book' | 'video' | 'audio' | 'social' | 'movie'> = {
                article: 'article',
                blog: 'article',
                post: 'article',
                website: 'article',
                link: 'article',
                page: 'article',
                documentation: 'article',
                tutorial: 'article',
                image: 'image',
                photo: 'image',
                picture: 'image',
                screenshot: 'image',
                note: 'note',
                text: 'note',
                memo: 'note',
                thought: 'note',
                product: 'product',
                item: 'product',
                tool: 'product',
                software: 'product',
                app: 'product',
                book: 'book',
                ebook: 'book',
                pdf: 'book',
                document: 'book',
                snippet: 'note',
                code: 'note',
                // Video & Audio types
                video: 'video',
                youtube: 'video',
                vimeo: 'video',
                audio: 'audio',
                podcast: 'audio',
                music: 'audio',
                song: 'audio',
                // Social media types
                social: 'social',
                twitter: 'social',
                instagram: 'social',
                reddit: 'social',
                linkedin: 'social',
                bluesky: 'social',
                mastodon: 'social',
                // Movie types
                movie: 'movie',
                film: 'movie',
                imdb: 'movie',
                letterboxd: 'movie',
        };

        return typeMap[normalized] ?? 'article';
}

/**
 * Classifies content using GLM-4.7 or GLM-4.6V (vision).
 * Uses vision model when an image is present for multimodal analysis.
 * Falls back to rule-based classification if API is unavailable.
 *
 * @param url - Source URL
 * @param content - Text content (caption for Instagram)
 * @param imageUrl - Primary image URL
 * @param imageCount - Total number of images (for Instagram carousels)
 */
export async function classifyContent(
        url: string | null,
        content: string | null,
        imageUrl?: string | null,
        imageCount?: number
): Promise<ClassificationResult> {
        // Fallback to rule-based classification if GLM is not configured
        if (!ZHIPU_API_KEY) {
                return classifyContentFallback(url, content, imageUrl);
        }

        try {
                // Choose model based on whether we have an image to analyze
                // Note: We'll try to convert external URLs to base64 for the vision model
                let hasImage = imageUrl && imageUrl.length > 0;
                let model = TEXT_MODEL; // Default to text model
                let base64ImageUrl: string | null = null;

                // Try to convert image to base64 if we have an image URL
                if (hasImage && imageUrl) {
                        console.log(`[AI] Attempting to convert image to base64: ${imageUrl.slice(0, 60)}...`);
                        base64ImageUrl = await fetchImageAsBase64(imageUrl);

                        if (base64ImageUrl) {
                                model = VISION_MODEL;
                                console.log(`[AI] Image converted successfully, using ${VISION_MODEL}`);
                        } else {
                                console.warn(`[AI] Image conversion failed, falling back to ${TEXT_MODEL}`);
                                hasImage = false;
                        }
                }

                // Build messages differently for vision vs text model
                // Use platform-specific prompts when available
                const isInstagram = isInstagramUrl(url);
                const isTwitter = isTwitterUrl(url);

                let systemPrompt: string;
                if (isInstagram) {
                        const caption = extractInstagramCaption(content);
                        systemPrompt = getInstagramPrompt(imageCount || 1, caption, false);
                } else if (isTwitter) {
                        const tweetText = extractTweetText(content);
                        const isThread = detectThreadIntent(tweetText);
                        systemPrompt = getTwitterPrompt(tweetText, undefined, isThread, undefined, !!hasImage, false);
                } else {
                        systemPrompt = GENERIC_CLASSIFICATION_PROMPT;
                }

                const messages: GLMMessage[] = [
                        {
                                role: 'system',
                                content: systemPrompt,
                        },
                ];

                if (hasImage && base64ImageUrl) {
                        // Multimodal message with base64 image + text
                        const textParts: string[] = [];
                        if (url) textParts.push(`Source URL: ${url}`);
                        if (content) textParts.push(`Text content: ${content.slice(0, 800)}`);
                        textParts.push('Analyze this image and metadata. Include ONE abstract VIBE tag (e.g., "kinetic", "minimalist", "atmospheric", "raw", "elegant") alongside specific subject tags.\n\nRESPONSE FORMAT: Return ONLY a JSON object (no markdown, no explanation):\n{"type": "article|image|note|product|book|video|audio|social|movie", "title": "concise title", "tags": ["tag1", "tag2", "tag3"], "summary": "holistic summary", "platform": "source platform"}');

                        messages.push({
                                role: 'user',
                                content: [
                                        {
                                                type: 'image_url',
                                                image_url: { url: base64ImageUrl } // Now using base64!
                                        },
                                        {
                                                type: 'text',
                                                text: textParts.join('\n\n')
                                        }
                                ]
                        });
                } else {
                        // Text-only message
                        const prompt = buildClassificationPrompt(url, content, imageUrl);
                        messages.push({
                                role: 'user',
                                content: prompt,
                        });
                }

                console.log(`[AI] Using ${model} for classification${hasImage ? ' (with image analysis)' : ''}`);

                // Try primary model (vision 45s or text 30s)
                const primaryTimeout = model === VISION_MODEL ? 45000 : 30000;
                let result = await tryGLMClassification(model, messages, primaryTimeout);
                if (result) return result;

                // FALLBACK 1: If vision model failed, retry with text-only model
                // Text model can still produce rich tags from URL + content metadata
                if (model === VISION_MODEL) {
                        console.warn('[AI] Vision model failed, retrying with text-only model');
                        const textMessages: GLMMessage[] = [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: buildClassificationPrompt(url, content, imageUrl) },
                        ];
                        result = await tryGLMClassification(TEXT_MODEL, textMessages, 30000);
                        if (result) return result;
                }

                throw new Error('No valid classification from any model');
        } catch (error) {
                // FALLBACK 2: Rule-based classification (instant, generic)
                console.error('[AI] Classification error, using rule-based fallback:', error);
                return classifyContentFallback(url, content, imageUrl);
        }
}

/**
 * Attempt GLM classification and parse JSON response.
 * Returns null if the call fails or response is unparseable.
 */
async function tryGLMClassification(
        model: string,
        messages: GLMMessage[],
        timeoutMs: number
): Promise<ClassificationResult | null> {
        try {
                const response = await callGLM(model, messages, undefined, timeoutMs);

                // Parse JSON from response content (may be wrapped in ```json blocks)
                const content_text = response.choices[0]?.message?.content;
                if (content_text) {
                        const jsonMatch = content_text.match(/```(?:json)?\s*([\s\S]*?)```/) || content_text.match(/(\{[\s\S]*\})/);
                        if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[1]) as ClassificationResult;
                                if (parsed.type && parsed.title) {
                                        parsed.type = normalizeType(parsed.type);
                                        console.log(`[AI] Classification result: type=${parsed.type}, title="${parsed.title?.slice(0, 40)}..."`);
                                        return parsed;
                                }
                        }
                }

                // Try tool calls (for non-reasoning models)
                const toolCall = response.choices[0]?.message?.tool_calls?.[0];
                if (toolCall?.function?.arguments) {
                        const toolResult = JSON.parse(toolCall.function.arguments) as ClassificationResult;
                        if (toolResult.type) {
                                toolResult.type = normalizeType(toolResult.type);
                                return toolResult;
                        }
                }

                console.warn(`[AI] ${model} returned unparseable response`);
                return null;
        } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                console.warn(`[AI] ${model} classification failed: ${msg}`);
                return null;
        }
}

/**
 * Builds the prompt for content classification.
 */
function buildClassificationPrompt(
        url: string | null,
        content: string | null,
        imageUrl?: string | null
): string {
        const parts: string[] = [];

        if (url) {
                parts.push(`URL: ${url}`);
        }

        if (content) {
                // Truncate content to avoid token limits (increased for GLM-4)
                const truncated = content.slice(0, 4000);
                parts.push(`Content: ${truncated}`);
        }

        if (imageUrl) {
                parts.push(`Image URL: ${imageUrl}`);
        }

        return parts.join('\n\n');
}

/**
 * Rule-based content classification fallback.
 * Enhanced to generate 3-5 meaningful, overlapping tags.
 */
function classifyContentFallback(
        url: string | null,
        content: string | null,
        imageUrl?: string | null
): ClassificationResult {
        const urlLower = url?.toLowerCase() ?? '';
        const contentLower = content?.toLowerCase() ?? '';

        // Extract domain for platform detection
        let domain = '';
        try {
                if (url) domain = new URL(url).hostname.replace('www.', '');
        } catch { /* ignore */ }

        // Detect type based on URL patterns and content
        let type: CardType = 'note';
        const tags: string[] = [];

        // ==========================================================================
        // PLATFORM-SPECIFIC TAG GENERATION (3-5 tags per platform)
        // ==========================================================================

        // YouTube
        if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
                type = 'video'; // Proper video type for filter compatibility
                tags.push('video', 'youtube', 'entertainment');
                if (urlLower.includes('music') || contentLower.includes('music')) {
                        tags.push('music');
                }
        }
        // IMDB - Movie platform
        else if (domain.includes('imdb.com')) {
                type = 'movie' as CardType;
                tags.push('movie', 'film', 'entertainment', 'imdb');
        }
        // Letterboxd - Movie platform
        else if (domain.includes('letterboxd.com')) {
                type = 'movie' as CardType;
                tags.push('movie', 'film', 'reviews', 'letterboxd');
        }
        // GitHub
        else if (domain.includes('github.com') || domain.includes('github.io')) {
                type = 'article';
                tags.push('code', 'developer', 'open-source');
                if (domain.includes('github.io')) {
                        tags.push('portfolio');
                }
        }
        // Twitter/X - Social media
        else if (domain.includes('twitter.com') || domain.includes('x.com')) {
                type = 'social' as CardType;
                tags.push('social', 'twitter', 'thoughts');
        }
        // Instagram - Social media
        else if (domain.includes('instagram.com')) {
                type = 'social' as CardType;
                tags.push('social', 'instagram', 'visual');
        }
        // Reddit - Social media
        else if (domain.includes('reddit.com')) {
                type = 'social' as CardType;
                tags.push('social', 'reddit', 'discussion', 'community');
        }
        // Bluesky - Social media
        else if (domain.includes('bsky.app') || domain.includes('bluesky')) {
                type = 'social' as CardType;
                tags.push('social', 'bluesky', 'thoughts');
        }
        // Mastodon - Social media
        else if (domain.includes('mastodon') || domain.includes('fosstodon') || domain.includes('hachyderm')) {
                type = 'social' as CardType;
                tags.push('social', 'mastodon', 'fediverse');
        }
        // LinkedIn - Social media
        else if (domain.includes('linkedin.com')) {
                type = 'social' as CardType;
                tags.push('social', 'linkedin', 'professional');
        }
        // Medium / Substack (Articles)
        else if (domain.includes('medium.com') || domain.includes('substack.com')) {
                type = 'article';
                tags.push('article', 'writing', 'blog');
        }
        // News sites
        else if (
                domain.includes('nytimes.com') ||
                domain.includes('theguardian.com') ||
                domain.includes('bbc.') ||
                domain.includes('cnn.com') ||
                urlLower.includes('news')
        ) {
                type = 'article';
                tags.push('news', 'journalism', 'current-events');
        }
        // Product sites
        else if (
                urlLower.includes('amazon.') ||
                urlLower.includes('shop') ||
                urlLower.includes('product') ||
                urlLower.includes('ebay.') ||
                contentLower.includes('add to cart') ||
                contentLower.includes('buy now')
        ) {
                type = 'product';
                tags.push('shopping', 'product', 'wishlist');
        }
        // Book sites (including StoryGraph)
        else if (
                urlLower.includes('goodreads.') ||
                domain.includes('thestorygraph.com') ||
                urlLower.includes('/book') ||
                contentLower.includes('isbn') ||
                contentLower.includes('author:')
        ) {
                type = 'book';
                tags.push('book', 'reading', 'literature');
                if (domain.includes('thestorygraph.com')) {
                        tags.push('storygraph');
                }
        }
        // Image platforms
        else if (
                imageUrl &&
                !content &&
                (urlLower.includes('unsplash') ||
                        urlLower.includes('pinterest') ||
                        urlLower.includes('imgur') ||
                        urlLower.endsWith('.jpg') ||
                        urlLower.endsWith('.png'))
        ) {
                type = 'image';
                tags.push('visual', 'image', 'inspiration');
        }
        // Generic article/blog (longer content)
        else if (content && content.length > 500) {
                type = 'article';
                // tags.push('reading'); // User requested NO generic tags
        }
        // Generic website with URL
        else if (url) {
                type = 'article';
                // tags.push('website', 'link'); // User requested NO generic tags
        }

        // ==========================================================================
        // CONTENT-BASED TAG EXTRACTION (keywords)
        // ==========================================================================
        const combinedText = (content || '') + ' ' + (url || '');
        const keywordPatterns: Record<string, string[]> = {
                'design': ['design', 'ui', 'ux', 'figma', 'sketch', 'interface', 'web design', 'graphic', 'typography', 'css', 'frontend'],
                'technology': ['tech', 'software', 'app', 'digital', 'startup', 'saas', 'programming', 'code', 'developer', 'hardware', 'gadget'],
                'ai': ['artificial intelligence', 'machine learning', 'ai', 'neural', 'gpt', 'llm', 'chatgpt', 'openai', 'anthropic', 'claude', 'gemini'],
                'photography': ['photo', 'camera', 'lens', 'shot', 'portrait', 'landscape', 'aperture', 'iso'],
                'music': ['music', 'song', 'album', 'artist', 'band', 'vinyl', 'record', 'spotify', 'soundcloud', 'lyrics'],
                'food': ['recipe', 'cook', 'restaurant', 'food', 'meal', 'dinner', 'lunch', 'breakfast', 'cuisine', 'baking'],
                'travel': ['travel', 'trip', 'destination', 'vacation', 'flight', 'hotel', 'tourism', 'explore', 'map'],
                'finance': ['invest', 'money', 'stock', 'crypto', 'finance', 'bitcoin', 'ethereum', 'market', 'economy'],
                'health': ['health', 'fitness', 'workout', 'wellness', 'medical', 'nutrition', 'diet', 'exercise', 'yoga'],
                'art': ['art', 'gallery', 'painting', 'sculpture', 'artist', 'exhibition', 'museum', 'contemporary', 'illustration'],
                'science': ['science', 'research', 'study', 'physics', 'biology', 'chemistry', 'space', 'astronomy', 'nasa', 'math', 'calculus', 'algebra', 'theorem'],
                'business': ['business', 'marketing', 'strategy', 'leadership', 'management', 'entrepreneur', 'sales', 'startup', 'vc'],
                'gaming': ['game', 'gaming', 'esports', 'playstation', 'xbox', 'nintendo', 'steam', 'twitch', 'gameplay'],
                'fashion': ['fashion', 'style', 'clothing', 'outfit', 'brand', 'trend', 'wear', 'streetwear', 'sneakers', 'nike', 'adidas'],
                'social': ['mastodon', 'fediverse', 'bluesky', 'threads', 'twitter', 'social media', 'instaloader', 'are.na', 'pinterest']
        };

        for (const [tag, patterns] of Object.entries(keywordPatterns)) {
                if (patterns.some(p => combinedText.toLowerCase().includes(p))) {
                        if (!tags.includes(tag)) {
                                tags.push(tag);
                        }
                }
        }

        // ==========================================================================
        // ENSURE 3-5 TAGS (add generic ones if needed)
        // ==========================================================================
        if (tags.length < 3) {
                // Add domain-based tag
                if (domain && !tags.includes(domain.split('.')[0])) {
                        const domainTag = domain.split('.')[0].toLowerCase();
                        if (domainTag.length > 2 && domainTag.length < 20) {
                                tags.push(domainTag);
                        }
                }
        }
        if (tags.length < 3) {
                tags.push('saved', 'explore');
        }

        // Limit to 5 tags max
        const finalTags = tags.slice(0, 5);

        // Extract title from content or URL
        let title = 'Untitled';
        if (content) {
                const firstLine = content.split('\n')[0];
                title = firstLine.slice(0, 60).trim() || 'Untitled';
        } else if (url) {
                try {
                        const urlPath = new URL(url).pathname;
                        title = urlPath.split('/').pop()?.replace(/[-_]/g, ' ') || domain;
                } catch {
                        title = url.slice(0, 60);
                }
        }

        // Generate contextual summary
        let summary: string;
        if (content && content.length > 10) {
                summary = content.slice(0, 150).trim() + (content.length > 150 ? '...' : '');
        } else if (domain) {
                // Generate platform-aware summary
                if (domain.includes('youtube')) {
                        summary = `Video saved from YouTube. Explore this content in your creative archive.`;
                } else if (domain.includes('github')) {
                        summary = `Code repository or developer content from GitHub.`;
                } else if (domain.includes('letterboxd')) {
                        summary = `Film review or watchlist item from Letterboxd.`;
                } else {
                        summary = `Content saved from ${domain}. Open link to explore full details.`;
                }
        } else {
                summary = 'Personal note saved to your creative brain. Review content for details.';
        }

        return {
                type,
                title,
                tags: finalTags,
                summary,
        };
}

// =============================================================================
// IMAGE ANALYSIS (KMeans Color Extraction + GLM-4.6V Vision)
// =============================================================================

import { extractColorsFromUrl } from './color-extraction';

/**
 * Fetches image buffer for processing
 */
async function fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
        try {
                if (imageUrl.startsWith('data:')) {
                        // Convert base64 to buffer
                        const base64Data = imageUrl.split(',')[1];
                        return Buffer.from(base64Data, 'base64');
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const response = await fetch(imageUrl, {
                        signal: controller.signal,
                        headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; MyMindBot/1.0)',
                                'Accept': 'image/*',
                        },
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                        console.warn(`[AI] Image fetch failed: ${response.status}`);
                        return null;
                }

                return Buffer.from(await response.arrayBuffer());
        } catch (error) {
                console.warn('[AI] Image buffer fetch error:', error);
                return null;
        }
}

/**
 * Analyzes an image using KMeans for accurate color extraction (8 colors)
 * and GLM-4.6V for objects, text, and visual analysis.
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
        const defaultColors = ['#3498DB', '#2ECC71', '#9B59B6', '#E74C3C', '#F39C12', '#1ABC9C', '#9B59B6', '#34495E'];

        // Run KMeans color extraction and GLM vision in parallel
        const [kmeansColors, visionAnalysis] = await Promise.all([
                // KMeans color extraction - accurate pixel-level analysis
                extractColorsFromUrl(imageUrl).then(colors => {
                        const hexColors = colors.map(c => c.hex);
                        console.log(`[AI] KMeans extracted ${hexColors.length} colors:`, hexColors.slice(0, 4).join(', ') + '...');
                        return hexColors;
                }).catch(err => {
                        console.warn('[AI] KMeans color extraction failed:', err);
                        return defaultColors;
                }),

                // GLM Vision analysis for objects, OCR, composition
                (async () => {
                        if (!ZHIPU_API_KEY) {
                                return { objects: ['image', 'content'], ocrText: null };
                        }

                        try {
                                const base64Url = await fetchImageAsBase64(imageUrl);
                                if (!base64Url) {
                                        return { objects: ['image'], ocrText: null };
                                }

                                const response = await callGLM(VISION_MODEL, [
                                        {
                                                role: 'user',
                                                content: [
                                                        {
                                                                type: 'text',
                                                                text: `Analyze this image. Respond with JSON (DO NOT include colors, we extract those separately):
{
  "objects": ["object1", "object2"],       // Detected objects/subjects (5-10 items)
  "ocrText": "visible text or null",       // Any text in image
  "texture": "smooth|textured|geometric|organic",  // Surface/pattern quality
  "composition": "centered|grid|asymmetric|minimal|complex",  // Layout style
  "visualElements": ["typography", "logo", ...],  // From: typography, logo, icon, photograph, illustration, diagram, pattern, product, person, nature, architecture, abstract
  "paletteType": "monochrome|vibrant|muted|high-contrast|pastel"  // Color scheme type
}`,
                                                        },
                                                        {
                                                                type: 'image_url',
                                                                image_url: { url: base64Url },
                                                        },
                                                ],
                                        },
                                ]);

                                const content = response.choices[0]?.message?.content;
                                if (content) {
                                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                                        if (jsonMatch) {
                                                return JSON.parse(jsonMatch[0]);
                                        }
                                }
                                return { objects: ['image'], ocrText: null };
                        } catch (error) {
                                console.warn('[AI] Vision analysis error:', error);
                                return { objects: ['image'], ocrText: null };
                        }
                })()
        ]);

        return {
                colors: kmeansColors.length > 0 ? kmeansColors : defaultColors,
                objects: visionAnalysis.objects || [],
                ocrText: visionAnalysis.ocrText || null,
                texture: visionAnalysis.texture,
                composition: visionAnalysis.composition,
                visualElements: visionAnalysis.visualElements,
                paletteType: visionAnalysis.paletteType,
        };
}



// =============================================================================
// SUMMARY GENERATION
// =============================================================================

import { getSummaryPrompt, detectPlatformFromUrl, validateSummaryQuality, type SummaryContext } from './prompts/summary';

/**
 * Options for generating a summary
 */
export interface GenerateSummaryOptions {
        content: string;
        url?: string;
        author?: string;
        title?: string;
        imageCount?: number;
}

/**
 * Generates an ANALYTICAL summary for content using GLM-4.7.
 * Uses platform-specific prompts for higher quality output.
 *
 * @param options - Summary generation options
 * @returns Analytical summary (50-500 chars) or null
 */
export async function generateSummary(
        options: string | GenerateSummaryOptions,
        maxTokens: number = 100
): Promise<string | null> {
        // Handle legacy string-only call signature
        const opts: GenerateSummaryOptions =
                typeof options === 'string' ? { content: options } : options;

        const { content, url, author, title, imageCount } = opts;

        // Detect platform for specialized prompts
        const platform = url ? detectPlatformFromUrl(url) : 'unknown';

        // DSPy Enhancement: Try DSPy microservice first for supported platforms
        // Now includes IMDB, Letterboxd, and YouTube in addition to social platforms
        const DSPY_SUPPORTED_PLATFORMS = ['instagram', 'twitter', 'reddit', 'imdb', 'letterboxd', 'youtube'];
        if (DSPY_SUPPORTED_PLATFORMS.includes(platform)) {
                try {
                        const dspyPlatform = platform as DSPyPlatform;
                        const dspyResult = await generateSummaryWithDSPy(content, dspyPlatform, {
                                author,
                                title,
                                imageCount,
                        });

                        if (dspyResult.isAnalytical && dspyResult.qualityScore > 0.6) {
                                console.log(`[AI] DSPy generated ${platform} summary (quality: ${dspyResult.qualityScore})`);
                                return dspyResult.summary;
                        }
                        console.log(`[AI] DSPy summary quality too low (${dspyResult.qualityScore}), falling back to GLM`);
                } catch (dspyErr) {
                        console.log('[AI] DSPy unavailable, using GLM for summary generation');
                }
        }

        if (!ZHIPU_API_KEY) {
                return content.slice(0, 150).trim() + '...';
        }

        try {

                // Build context for prompt generation
                const context: SummaryContext = {
                        content,
                        author,
                        platform,
                        imageCount,
                        url,
                        title,
                };

                // Get platform-specific prompt
                const summaryPrompt = getSummaryPrompt(context);

                const response = await callGLM(TEXT_MODEL, [
                        {
                                role: 'system',
                                content: `You are an expert content analyst for a visual knowledge manager. Your job is to generate ANALYTICAL summaries that help users remember WHY they saved something.

CRITICAL RULES:
1. NEVER just truncate or paraphrase the original content
2. ALWAYS provide INSIGHT about the content's value
3. Keep summaries between 50-200 characters
4. Be specific, not generic
5. Focus on memorability and future usefulness`,
                        },
                        {
                                role: 'user',
                                content: summaryPrompt,
                        },
                ]);

                const summary = response.choices[0]?.message?.content?.trim() ?? null;

                // Validate quality
                if (summary) {
                        const validation = validateSummaryQuality(summary, content);
                        if (!validation.valid) {
                                console.warn('[AI] Summary quality issues:', validation.issues);
                                // Still return it, but log the issues for improvement
                        }
                        console.log(`[AI] Generated ${platform} summary: "${summary.slice(0, 60)}..."`);
                }

                return summary;
        } catch (error) {
                console.error('[AI] Summary generation error:', error);
                return content.slice(0, 150).trim() + '...';
        }
}

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use generateSummary with options object instead
 */
export async function generateSummaryLegacy(
        content: string,
        maxTokens: number = 50
): Promise<string | null> {
        return generateSummary({ content }, maxTokens);
}
// =============================================================================
// SEARCH QUERY EXPANSION
// =============================================================================

/**
 * Expands a search query with semantic synonyms and related concepts.
 * Returns the original query + up to 3 related terms.
 */
export async function expandSearchQuery(query: string): Promise<string[]> {
        if (!ZHIPU_API_KEY || !query) {
                return [query];
        }

        try {
                const response = await callGLM(TEXT_MODEL, [
                        {
                                role: 'system',
                                content: 'You are a semantic search assistant. Given a search query, output a JSON array of up to 3 closely related synonyms, concepts, or "vibes" that would help find relevant items in a curatorial database. Output ONLY the JSON array.',
                        },
                        {
                                role: 'user',
                                content: `Query: "${query}"`,
                        },
                ]);

                const content = response.choices[0]?.message?.content;
                if (content) {
                        // Extract array from possible markdown
                        const match = content.match(/\[[\s\S]*\]/);
                        if (match) {
                                const terms = JSON.parse(match[0]) as string[];
                                // Filter unique and combined
                                const results = Array.from(new Set([query, ...terms])).slice(0, 4);
                                return results;
                        }
                }

                return [query];
        } catch (error) {
                console.error('[AI] Search expansion error:', error);
                return [query];
        }
}

// =============================================================================
// TAG NORMALIZATION ("Gardener Bot")
// =============================================================================

/**
 * Normalizes generated tags against existing tags in the database.
 * Prevents tag fragmentation by remapping similar tags (e.g., "Building" -> "Architecture").
 * 
 * @param generatedTags - New tags from AI classification
 * @param existingTags - Tags already in the user's database
 * @returns Normalized tags that reuse existing ones where appropriate
 */
export async function normalizeTagsToExisting(
        generatedTags: string[],
        existingTags: string[]
): Promise<string[]> {
        // If no existing tags or no API, return as-is
        if (!ZHIPU_API_KEY || existingTags.length === 0 || generatedTags.length === 0) {
                return generatedTags;
        }

        try {
                const response = await callGLM(TEXT_MODEL, [
                        {
                                role: 'system',
                                content: `You are a tag curator for a visual knowledge system. Your job is to consolidate tags to prevent fragmentation.

Given NEW tags and EXISTING tags, remap any semantically similar new tags to existing ones.
- "building" should become "architecture" if "architecture" exists
- "photo" should become "photography" if "photography" exists
- "video" should become "film" if "film" exists but "video" doesn't

Output a JSON array of the final tags (same length as input, preserving order).
Keep new tags unchanged if no good match exists.`,
                        },
                        {
                                role: 'user',
                                content: `NEW: ${JSON.stringify(generatedTags)}
EXISTING: ${JSON.stringify(existingTags.slice(0, 50))}

Return only the JSON array.`,
                        },
                ]);

                const content = response.choices[0]?.message?.content;
                if (content) {
                        const match = content.match(/\[[\s\S]*\]/);
                        if (match) {
                                const normalized = JSON.parse(match[0]) as string[];
                                // Validate: must return same number of tags
                                if (normalized.length === generatedTags.length) {
                                        console.log('[AI] Tags normalized:', generatedTags, '->', normalized);
                                        return normalized;
                                }
                        }
                }

                return generatedTags;
        } catch (error) {
                console.error('[AI] Tag normalization error:', error);
                return generatedTags;
        }
}
