/**
 * MyMind Clone - Classification Tool Definition
 *
 * Main tool definition for AI content classification.
 * Used across all platforms for structured metadata extraction.
 */

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
export const CLASSIFICATION_TOOL = {
	type: 'function' as const,
	function: {
		name: 'classify_content',
		description: 'Classify web content into a category with exactly 3-5 hierarchical tags and a holistic summary. Detect platform and shopping items.',
		parameters: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: ['article', 'image', 'note', 'product', 'book', 'video', 'audio'],
					description: 'The primary content type. Use "product" for any shopping item, "video" for YouTube/Vimeo, "audio" for podcasts/music.',
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
					description: `3-5 HIERARCHICAL tags in this structure:
  - 1-2 PRIMARY (essence): The core identity, e.g., "bmw", "breakdance", "terence-tao"
  - 1-2 CONTEXTUAL (subject): The broader field, e.g., "automotive", "dance", "mathematics"
  - 1 VIBE/MOOD (abstract): The feeling or energy, e.g., "kinetic", "minimalist", "atmospheric"
This enables cross-disciplinary discovery. Lowercase, hyphenated.`,
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
 * Generic system prompt for content classification.
 * Can be enhanced with platform-specific prompts.
 */
export const GENERIC_CLASSIFICATION_PROMPT = `You are a highly sophisticated curator for a visual knowledge system. Analyze content and generate metadata that enables SERENDIPITOUS discovery across disciplines.

CRITICAL INSTRUCTIONS:
1. SUMMARY: Write a HOLISTIC summary (3-8 sentences). Consider the entire text/image. Do not focus only on the intro. If it's a code snippet, describe what it does.

2. TAGGING: Generate 3-5 HIERARCHICAL tags using this 3-layer structure:
   LAYER 1 - PRIMARY (1-2 tags): The ESSENCE of the item. What makes it unique.
     Examples: "bmw", "terence-tao", "category-theory", "breakdance"

   LAYER 2 - CONTEXTUAL (1-2 tags): The broader subject or field.
     Examples: "automotive", "mathematics", "dance", "data-viz"

   LAYER 3 - VIBE/MOOD (1 tag): The abstract feeling, energy, or aesthetic. THIS IS CRITICAL.
     Vocabulary: kinetic, atmospheric, minimalist, raw, nostalgic, elegant, chaotic, ethereal, tactile, visceral, contemplative, playful, precise, organic, geometric
     Examples:
       - Breakdance video -> "kinetic"
       - Weather data viz -> "atmospheric"
       - Japanese design article -> "minimalist"
       - Academic math paper -> "contemplative"

   The VIBE tag creates cross-disciplinary portals: a breakdance video (kinetic) connects to a JavaScript animation (kinetic).
   DO NOT use generic tags like "website", "link", "page", "content".

3. PLATFORMS: Detect platforms like Are.na, Pinterest, Mastodon, Bluesky, GitHub.
4. PRODUCTS: If the item is clearly a product, shopping item, or commercial tool, classify type as "product".`;
