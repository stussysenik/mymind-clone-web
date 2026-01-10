/**
 * MyMind Clone - AI Utilities
 * 
 * Uses GLM-4.7 for content classification and GLM-4.6V for vision.
 * Falls back to rule-based classification if API is unavailable.
 * 
 * @fileoverview AI utilities using Zhipu GLM Coding API
 */

import type { CardType, ClassificationResult, ImageAnalysisResult } from './types';

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
        }>
): Promise<GLMResponse> {
        const endpoint = `${ZHIPU_API_BASE}/chat/completions`;

        const body: Record<string, unknown> = {
                model,
                messages,
                max_tokens: 500,
        };

        if (tools) {
                body.tools = tools;
                body.tool_choice = { type: 'function', function: { name: tools[0].function.name } };
        }

        const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
                },
                body: JSON.stringify(body),
        });

        if (!response.ok) {
                const error = await response.text();
                throw new Error(`GLM API error: ${response.status} - ${error}`);
        }

        return response.json();
}

// =============================================================================
// CONTENT CLASSIFICATION
// =============================================================================

/**
 * Tool definition for content classification.
 * 
 * TAG DESIGN (Norman Lewis Design Thinking):
 * - Primary Tags (2): Define the ESSENCE of the item - what makes it unique
 * - Secondary Tags (3): Add context, era, vibe, or connection to broader themes
 * - Total: Max 5 tags per item to prevent tag explosion at scale
 * 
 * Example: BMW M3 Magazine Article
 *   Primary: ["automotive", "bmw"]
 *   Secondary: ["sports-car", "german-engineering", "magazine"]
 */
const CLASSIFICATION_TOOL = {
        type: 'function' as const,
        function: {
                name: 'classify_content',
                description: 'Classify web content into a category with exactly 3-5 hierarchical tags and a holistic summary. Detect platform and shopping items.',
                parameters: {
                        type: 'object',
                        properties: {
                                type: {
                                        type: 'string',
                                        enum: ['article', 'image', 'note', 'product', 'book'],
                                        description: 'The primary content type. Use "product" for any shopping item or commercial tool.',
                                },
                                title: {
                                        type: 'string',
                                        description: 'A concise, descriptive title (max 60 chars)',
                                },
                                tags: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        minItems: 3,
                                        maxItems: 5,
                                        description: '3-5 tags balancing MICRO and MACRO concepts. E.g., include both "category-theory" AND "mathematics". Connect specific topics to broader fields. Lowercase, hyphenated.',
                                },
                                summary: {
                                        type: 'string',
                                        description: 'Holistic summary of the ENTIRE content (3-8 sentences). Capture the full context, not just the first paragraph. Be objective and descriptive.',
                                },
                                platform: {
                                        type: 'string',
                                        description: 'The source platform or website name (e.g., "Mastodon", "Are.na", "Pinterest", "Bluesky", "GitHub", "Amazon").',
                                },
                        },
                        required: ['type', 'title', 'tags', 'summary'],
                },
        },
};

/**
 * Normalize type to allowed database values.
 * Maps any type to: article, image, note, product, or book
 */
function normalizeType(type: string): 'article' | 'image' | 'note' | 'product' | 'book' {
        const normalized = type?.toLowerCase() ?? 'article';

        // Map common types to our allowed values
        const typeMap: Record<string, 'article' | 'image' | 'note' | 'product' | 'book'> = {
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
        };

        return typeMap[normalized] ?? 'article';
}

/**
 * Classifies content using GLM-4.7 or GLM-4.6V (vision).
 * Uses vision model when an image is present for multimodal analysis.
 * Falls back to rule-based classification if API is unavailable.
 */
export async function classifyContent(
        url: string | null,
        content: string | null,
        imageUrl?: string | null
): Promise<ClassificationResult> {
        // Fallback to rule-based classification if GLM is not configured
        if (!ZHIPU_API_KEY) {
                return classifyContentFallback(url, content, imageUrl);
        }

        try {
                // Choose model based on whether we have an image to analyze
                const hasImage = imageUrl && !imageUrl.startsWith('data:'); // Can't inline base64 to API
                const model = hasImage ? VISION_MODEL : TEXT_MODEL;

                // Build messages differently for vision vs text model
                const messages: GLMMessage[] = [
                        {
                                role: 'system',
                                content: `You are a highly sophisticated curator for a visual knowledge system. Analyze the content and generate metadata.

CRITICAL INSTRUCTIONS:
1. SUMMARY: Write a HOLISTIC summary (3-8 sentences). Consider the entire text/image. Do not focus only on the intro. If it's a code snippet, describe what it does.
2. TAGGING: Generate 3-5 tags. Balance MICRO (specific) and MACRO (broad) concepts.
   - Example: For a Category Theory post -> ["category-theory", "mathematics", "abstract-algebra", "logic"].
   - Example: For a Nike shoe -> ["nike", "sneakers", "footwear", "fashion", "sportswear"].
   - DO NOT use generic tags like "website", "link", "page".
3. PLATFORMS: Detect platforms like Are.na, Pinterest, Mastodon, Bluesky, GitHub.
4. PRODUCTS: If the item is clearly a product, shopping item, or commercial tool, classify type as "product".`,
                        },
                ];

                if (hasImage) {
                        // Multimodal message with image + text
                        const textParts: string[] = [];
                        if (url) textParts.push(`Source URL: ${url}`);
                        if (content) textParts.push(`Text content: ${content.slice(0, 800)}`);
                        textParts.push('Analyze this image and metadata. Classify it with specific, non-generic tags (e.g., if it is a photo of a camera, use "photography", "leica", "analog" - NOT "image", "object").');

                        messages.push({
                                role: 'user',
                                content: [
                                        {
                                                type: 'image_url',
                                                image_url: { url: imageUrl }
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

                const response = await callGLM(
                        model,
                        messages,
                        [CLASSIFICATION_TOOL]
                );

                // Extract function call result
                const toolCall = response.choices[0]?.message?.tool_calls?.[0];
                if (toolCall?.function?.arguments) {
                        const result = JSON.parse(toolCall.function.arguments) as ClassificationResult;
                        // Normalize type to allowed values
                        result.type = normalizeType(result.type);
                        return result;
                }

                // Try parsing from content if no tool call
                const content_text = response.choices[0]?.message?.content;
                if (content_text) {
                        try {
                                const parsed = JSON.parse(content_text);
                                if (parsed.type && parsed.title) {
                                        return parsed as ClassificationResult;
                                }
                        } catch {
                                // Not JSON, use fallback
                        }
                }

                throw new Error('No valid classification in response');
        } catch (error) {
                console.error('[AI] Classification error, using fallback:', error);
                return classifyContentFallback(url, content, imageUrl);
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
                type = 'article'; // Video type mapped to article
                tags.push('video', 'youtube', 'entertainment');
                if (urlLower.includes('music') || contentLower.includes('music')) {
                        tags.push('music');
                }
        }
        // Letterboxd
        else if (domain.includes('letterboxd.com')) {
                type = 'article';
                tags.push('film', 'movies', 'reviews', 'cinema');
        }
        // GitHub
        else if (domain.includes('github.com') || domain.includes('github.io')) {
                type = 'article';
                tags.push('code', 'developer', 'open-source');
                if (domain.includes('github.io')) {
                        tags.push('portfolio');
                }
        }
        // Twitter/X
        else if (domain.includes('twitter.com') || domain.includes('x.com')) {
                type = 'article';
                tags.push('social', 'twitter', 'thoughts');
        }
        // Reddit
        else if (domain.includes('reddit.com')) {
                type = 'article';
                tags.push('social', 'reddit', 'discussion', 'community');
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
        // Book sites
        else if (
                urlLower.includes('goodreads.') ||
                urlLower.includes('/book') ||
                contentLower.includes('isbn') ||
                contentLower.includes('author:')
        ) {
                type = 'book';
                tags.push('book', 'reading', 'literature');
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
// IMAGE ANALYSIS (GLM-4.6V)
// =============================================================================

/**
 * Analyzes an image using GLM-4.6V for colors, objects, and text.
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
        if (!ZHIPU_API_KEY) {
                // Return mock data if API not configured
                return {
                        colors: ['#3498DB', '#2ECC71', '#9B59B6'],
                        objects: ['image', 'content'],
                        ocrText: null,
                };
        }

        try {
                const response = await callGLM(VISION_MODEL, [
                        {
                                role: 'user',
                                content: [
                                        {
                                                type: 'text',
                                                text: 'Analyze this image and respond with JSON containing: { "colors": ["#hex1", "#hex2", "#hex3"] (3 dominant colors as hex), "objects": ["object1", "object2"] (detected objects/labels), "ocrText": "any text visible in image or null" }',
                                        },
                                        {
                                                type: 'image_url',
                                                image_url: { url: imageUrl },
                                        },
                                ],
                        },
                ]);

                const content = response.choices[0]?.message?.content;
                if (content) {
                        // Try to parse JSON from response
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0]);
                                return {
                                        colors: parsed.colors || ['#3498DB', '#2ECC71', '#9B59B6'],
                                        objects: parsed.objects || [],
                                        ocrText: parsed.ocrText || null,
                                };
                        }
                }

                throw new Error('Could not parse vision response');
        } catch (error) {
                console.error('[AI] Image analysis error:', error);
                return {
                        colors: ['#3498DB', '#2ECC71', '#9B59B6'],
                        objects: ['image'],
                        ocrText: null,
                };
        }
}

// =============================================================================
// SUMMARY GENERATION
// =============================================================================

/**
 * Generates a summary for content using GLM-4.7.
 */
export async function generateSummary(
        content: string,
        maxTokens: number = 50
): Promise<string | null> {
        if (!ZHIPU_API_KEY) {
                return content.slice(0, 150).trim() + '...';
        }

        try {
                const response = await callGLM(TEXT_MODEL, [
                        {
                                role: 'system',
                                content: 'Summarize the following content in 1-2 sentences. Be concise and informative.',
                        },
                        {
                                role: 'user',
                                content: content.slice(0, 2000),
                        },
                ]);

                return response.choices[0]?.message?.content ?? null;
        } catch (error) {
                console.error('[AI] Summary generation error:', error);
                return content.slice(0, 150).trim() + '...';
        }
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
