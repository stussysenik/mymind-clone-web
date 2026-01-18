/**
 * MyMind Clone - Website Prompt Template
 *
 * Generic website and page content analysis.
 * Emphasizes layout, structure, and dominant visual elements.
 */

/**
 * Website-specific classification prompt.
 * For generic web pages, articles, blogs, and documentation.
 *
 * @param url - The page URL
 * @param pageType - Detected page type (article, landing, docs, etc.)
 * @param hasHeroImage - Whether page has a prominent hero image
 * @param dominantColors - Extracted dominant colors from screenshot
 */
export function getWebsitePrompt(
	url: string,
	pageType?: 'article' | 'landing' | 'docs' | 'blog' | 'portfolio' | 'product' | 'unknown',
	hasHeroImage?: boolean,
	dominantColors?: string[]
): string {
	return `You are analyzing a website/web page. VISUAL LAYOUT and STRUCTURE are important.

URL: ${url}
Page Type: ${pageType || 'Unknown'} page
${hasHeroImage ? 'Hero Image: YES - page has prominent header image' : 'Hero Image: NO'}
${dominantColors ? `Dominant Colors: ${dominantColors.join(', ')}` : ''}

PAGE LAYOUT ANALYSIS:
- Structure: ${pageType === 'article'
			? 'Long-form article with text and images'
			: pageType === 'landing'
				? 'Landing page with CTAs and sections'
				: pageType === 'docs'
					? 'Documentation with navigation and code'
					: pageType === 'portfolio'
						? 'Portfolio with project showcase'
						: 'General website layout'
		}
- Visual hierarchy: Identify key sections (header, hero, content, sidebar, etc.)
- Design style: (minimalist, corporate, editorial, experimental, etc.)
${dominantColors
			? `- Color palette: Describe the visual mood based on colors (${dominantColors.join(', ')})`
			: ''
		}

${hasHeroImage
			? `HERO IMAGE ANALYSIS:
- Describe the hero image (what does it show?)
- How does it relate to the content?
- Visual style and mood`
			: ''
		}

CONTENT EXTRACTION:
- Main topic or subject
- Key sections and organization
- Content type (tutorial, news, opinion, reference, showcase, etc.)
- Target audience (developers, designers, general public, professionals, etc.)

VISUAL ELEMENTS:
- Typography: (serif, sans-serif, monospace, display font)
- Imagery: ${hasHeroImage ? 'photographs, illustrations, diagrams, screenshots, etc.' : 'minimal images or text-focused'}
- Layout grid: (single column, multi-column, card-based, etc.)
- Interactivity: (static page, interactive demos, forms, animations)

SUMMARY REQUIREMENTS:
- Lead with page structure: "${pageType || 'This page'} featuring..."
- Describe the visual layout and design approach
- Summarize the main content (3-8 sentences)
- Include key visual characteristics (colors, typography, imagery)
- Focus on what makes this page VISUALLY DISTINCT

TAGS (3-5 total):
- 1-2 subject/topic tags (what the content is about)
- 1 format tag (article, tutorial, reference, showcase, etc.)
- 1-2 visual/aesthetic tags (minimalist, editorial, technical, vibrant, etc.)
- 1 vibe tag (contemplative, energetic, precise, etc.)

Example output for design blog:
{
  "type": "article",
  "title": "The Future of Spatial Interfaces",
  "tags": ["design", "ui", "spatial-computing", "editorial", "contemplative"],
  "summary": "This editorial article features a BOLD hero image of a 3D interface mockup against a deep blue gradient background. The page uses a CLASSIC two-column layout with generous white space and a serif typeface for headers. Dominant colors: deep blues, warm grays, accent orange. The content explores spatial UI design principles with embedded interactive demos and code examples. Visual style: CLEAN, TECHNICAL, SOPHISTICATED. The page balances long-form text with visual breaks (diagrams, screenshots). Target audience: product designers and developers interested in emerging interfaces.",
  "platform": "Medium"
}

CRITICAL: Users recall websites by their VISUAL PRESENTATION - color scheme, layout, typography, and imagery. Capture the visual "feel" of the page.
`;
}

/**
 * Page type detection patterns.
 * Analyzes URL and content to determine page type.
 */
export const PAGE_TYPE_PATTERNS: Record<string, string[]> = {
	article: ['/article/', '/post/', '/blog/', '/story/', '/news/', '/read/'],
	docs: ['/docs/', '/documentation/', '/guide/', '/api/', '/reference/'],
	landing: ['/', '/home', '/index', '/landing'],
	portfolio: ['/portfolio', '/work/', '/projects/', '/case-study/'],
	product: ['/product/', '/pricing', '/features', '/demo'],
	blog: ['/blog', '/writing', '/posts', '/articles'],
};

/**
 * Detect page type from URL.
 *
 * @param url - The page URL
 * @returns Detected page type or 'unknown'
 */
export function detectPageType(
	url: string
): 'article' | 'landing' | 'docs' | 'blog' | 'portfolio' | 'product' | 'unknown' {
	const urlLower = url.toLowerCase();

	for (const [type, patterns] of Object.entries(PAGE_TYPE_PATTERNS)) {
		if (patterns.some((pattern) => urlLower.includes(pattern))) {
			return type as any;
		}
	}

	return 'unknown';
}

/**
 * Extract domain name from URL for platform detection.
 *
 * @param url - The page URL
 * @returns Domain name (e.g., "medium.com")
 */
export function extractDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace('www.', '');
	} catch {
		return '';
	}
}
