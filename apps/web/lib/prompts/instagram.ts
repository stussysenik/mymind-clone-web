/**
 * MyMind Clone - Instagram Prompt Template
 *
 * Visual-first analysis for Instagram posts and carousels.
 * Emphasizes image description before caption text.
 */

/**
 * Instagram-specific classification prompt.
 * Prioritizes visual analysis and extracts hashtags.
 *
 * @param imageCount - Number of images in the carousel (1 for single posts)
 * @param caption - Instagram caption text
 * @param hasOCR - Whether OCR text is available from images
 */
export function getInstagramPrompt(
	imageCount: number = 1,
	caption?: string,
	hasOCR?: boolean
): string {
	const isCarousel = imageCount > 1;

	return `You are analyzing an Instagram ${isCarousel ? 'CAROUSEL' : 'post'}. VISUAL presentation is PRIMARY.

${isCarousel ? `CAROUSEL CONTEXT:
This post contains ${imageCount} images. You must analyze the VISUAL NARRATIVE across all images, not just the first.` : ''}

VISUAL ANALYSIS (DO THIS FIRST):
${isCarousel
		? `- Describe the visual narrative across all ${imageCount} images
- How do the images work together? (sequence, theme, contrast, story)
- What is the dominant visual theme?
- Colors, composition, and mood across the series`
		: `- Describe the photo in detail (composition, colors, subjects, style)
- Visual mood and aesthetic (minimalist, vibrant, moody, etc.)
- Photography style (portrait, landscape, product, street, etc.)`}
- Extract text visible in images via OCR${hasOCR ? ' (text provided below)' : ''}

CAPTION ANALYSIS (AFTER VISUAL):
${caption ? `- Caption: "${caption}"` : '- No caption provided'}
- Extract ALL hashtags as tags (remove # symbol, lowercase)
- Identify author tone and intent (promotional, personal, artistic, educational)
- Connection between visual and caption (complementary, contrasting, explanatory)

SUMMARY REQUIREMENTS:
${isCarousel
		? `- Lead with: "This Instagram carousel contains ${imageCount} images."
- Describe the visual sequence and narrative
- Then include caption context if relevant`
		: `- Lead with visual description (what you SEE)
- Then include caption context
- Focus on the image-text relationship`}
- 3-8 sentences, capture both visual essence and message
- Use ALL CAPS for emphasis on key visual elements

TAGS (3-5 total):
- At least 1-2 tags from hashtags in caption
- 1-2 visual/aesthetic tags (e.g., "minimalist", "vibrant", "moody")
- 1 vibe tag (e.g., "kinetic", "contemplative", "playful")

Example output for food carousel:
{
  "type": "image",
  "title": "Homemade Ramen Journey",
  "tags": ["food", "ramen", "cooking", "japanese-cuisine", "contemplative"],
  "summary": "This Instagram carousel contains 5 images documenting a ramen-making process. The visual sequence shows: (1) raw ingredients arranged on a wooden board, (2) noodles being hand-pulled, (3) broth simmering with aromatic spices, (4) plating with precision, (5) final bowl in dramatic lighting. The caption celebrates slow food and mindful cooking. Visual mood: WARM, TACTILE, MEDITATIVE. Hashtags emphasize #homemade and #japanesefood themes.",
  "platform": "Instagram"
}`;
}

/**
 * Instagram carousel-specific instructions for multi-image analysis.
 */
export const INSTAGRAM_CAROUSEL_INSTRUCTIONS = `
When analyzing Instagram carousels with multiple images:
1. View ALL images before writing the summary
2. Identify the visual narrative or theme connecting the images
3. Note image order and sequence (does it tell a story? show progression?)
4. Describe how colors and composition evolve across images
5. Generate a HOLISTIC summary encompassing the full carousel experience

Common carousel patterns:
- Before/After transformations
- Step-by-step tutorials or processes
- Multiple angles of same subject
- Photo dump / mixed aesthetic collection
- Sequential storytelling (comic, narrative)
- Product variations (colors, angles)

Your summary should help users recall: "That Instagram post with the X images showing Y theme".
`;

/**
 * Hashtag extraction utility.
 * Extracts all hashtags from Instagram caption.
 *
 * @param caption - Instagram caption text
 * @returns Array of hashtag strings (without # symbol, lowercase)
 */
export function extractInstagramHashtags(caption: string): string[] {
	const hashtagRegex = /#([\w]+)/g;
	const matches = caption.matchAll(hashtagRegex);
	const hashtags = Array.from(matches, (m) => m[1].toLowerCase());
	return [...new Set(hashtags)]; // Remove duplicates
}
