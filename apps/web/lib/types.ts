/**
 * MyMind Clone - TypeScript Type Definitions
 * 
 * This file contains all shared types for the application.
 * Types are organized by domain: Cards, Spaces, AI, and API.
 * 
 * @fileoverview Core type definitions for the MyMind knowledge manager
 */

// =============================================================================
// CARD TYPES
// =============================================================================

/**
 * Supported card types in the system.
 * Each type determines how the card is displayed in the grid.
 */
export type CardType = 'article' | 'image' | 'note' | 'product' | 'book' | 'video' | 'audio' | 'social' | 'movie' | 'website';

/**
 * AI-extracted metadata stored in the card's metadata JSONB field.
 * This data is populated asynchronously after card creation.
 */
export interface CardMetadata {
        /** AI-generated summary of the content (max 100 tokens) */
        summary?: string;
        /** Dominant colors extracted from images (hex values) */
        colors?: string[];
        /** Additional images (for carousels/galleries) */
        images?: string[];
        /** Objects detected in images via Google Vision */
        objects?: string[];
        /** OCR text extracted from images */
        ocrText?: string;
        /** Price for product cards (extracted from page) */
        price?: string;
        /** Author name for articles/books/tweets */
        author?: string;
        /** Author's display name (e.g., "Elon Musk") */
        authorName?: string;
        /** Author's handle/username without @ (e.g., "elonmusk") */
        authorHandle?: string;
        /** Author's profile avatar URL */
        authorAvatar?: string;
        /** Estimated reading time in minutes */
        readingTime?: number;
        /** Original publication date (ISO string) */
        publishedAt?: string;

        // Platform-specific fields
        /** Source platform (twitter, instagram, youtube, etc.) */
        platform?: string;
        /** Video duration (e.g., "1:24:30") */
        duration?: string;
        /** View count for videos */
        viewCount?: string;
        /** Subreddit for Reddit posts (e.g., "r/programming") */
        subreddit?: string;
        /** Upvote count for Reddit */
        upvotes?: string;
        /** Comment count */
        comments?: string;
        /** Rating (e.g., "8.5" for IMDB, "4.5" for Letterboxd) */
        rating?: string;
        /** Release year for films */
        year?: string;
        /** Director for films */
        director?: string;

        /** Whether the card is currently being processed by AI */
        processing?: boolean;
        /** Error message if enrichment failed */
        enrichmentError?: string;
        /** Timestamp when enrichment failed */
        enrichmentFailedAt?: string;
        /** Timestamp when enrichment completed successfully */
        enrichedAt?: string;
        /** User notes/thought (from detail view) */
        note?: string;
	/** Timestamp when user last edited note */
	note_updated_at?: string;
	/** Timestamp when user last manually edited title (prevents AI overwrite) */
	titleEditedAt?: string;
	/** Timestamp when user last manually edited summary (prevents AI overwrite) */
	summaryEditedAt?: string;

	// Carousel-specific fields (Instagram, etc.)
	/** Whether this is a carousel/multi-image post */
	isCarousel?: boolean;
	/** Number of slides in carousel */
	slideCount?: number;
	/** Whether background carousel extraction is pending */
	carouselPending?: boolean;
	/** Whether carousel extraction completed */
	carouselExtracted?: boolean;
	/** Timestamp when carousel was extracted */
	carouselExtractedAt?: string;
	/** Whether carousel extraction failed */
	carouselExtractionFailed?: boolean;
	/** Error message if extraction failed */
	carouselExtractionError?: string;

	// Media persistence fields (Instagram storage)
	/** Type of each media item in carousel order ('image' or 'video') */
	mediaTypes?: ('image' | 'video')[];
	/** Indices of video positions in carousel (e.g., [1, 3] means positions 1 and 3 are videos) */
	videoPositions?: number[];
	/** Whether media has been persisted to Supabase Storage (permanent URLs) */
	mediaPersisted?: boolean;
	/** Original CDN URLs before persistence (for debugging) */
	originalCdnUrls?: string[];

	// Enrichment timing for real-time ETA display
	/** Enrichment timing data for ETA calculation */
	enrichmentTiming?: {
		/** Timestamp when enrichment started (ms since epoch) */
		startedAt?: number;
		/** Estimated total processing time in ms */
		estimatedTotalMs?: number;
		/** Platform being processed */
		platform?: string;
		/** Time spent on scraping (ms) */
		scrapeMs?: number;
		/** Time spent on classification (ms) */
		classifyMs?: number;
		/** Total actual time (ms) */
		totalMs?: number;
		/** Timestamp when enrichment completed */
		completedAt?: number;
	};
}

/**
 * Main Card entity representing a saved item in the user's mind.
 * Cards are the core data model - everything saved becomes a card.
 */
export interface Card {
        /** Unique identifier (UUID v4) */
        id: string;
        /** Owner of the card */
        userId: string;
        /** Card classification (article, image, note, product, book) */
        type: CardType;
        /** Display title - auto-generated or user-provided */
        title: string | null;
        /** Full text content (for notes) or extracted text (for articles) */
        content: string | null;
        /** Source URL if saved from web */
        url: string | null;
        /** Preview image URL (stored in Supabase Storage or external) */
        imageUrl: string | null;
        /** AI-extracted metadata */
        metadata: CardMetadata;
        /** User-defined or AI-generated tags for filtering */
        tags: string[];
        /** Timestamp when the card was created */
        createdAt: string;
        /** Timestamp of last update */
        updatedAt: string;
        /** Timestamp of deletion (if soft deleted) */
        deletedAt: string | null;
        /** Timestamp of archiving (hidden from main feed) */
        archivedAt: string | null;
}

// =============================================================================
// SPACE TYPES
// =============================================================================

/**
 * A Space is a filtered view of cards.
 * Smart Spaces auto-update based on a query; regular Spaces are manual collections.
 */
export interface Space {
        /** Unique identifier */
        id: string;
        /** Owner of the space */
        userId: string;
        /** Display name */
        name: string;
        /** Query string for Smart Spaces (e.g., "type:article tag:design") */
        query: string | null;
        /** If true, cards are auto-added when they match the query */
        isSmart: boolean;
        /** Timestamp when the space was created */
        createdAt: string;
}

// =============================================================================
// AI TYPES
// =============================================================================

/**
 * Result from the AI content classification function.
 * Used to auto-categorize and tag new cards.
 */
export interface ClassificationResult {
        /** Detected content type */
        type: CardType;
        /** Extracted or generated title */
        title: string;
        /** AI-suggested tags (max 5) */
        tags: string[];
        /** Brief summary of the content */
        /** Brief summary of the content */
        summary: string;
        /** Detected platform (e.g. twitter, mastodon, github) */
        platform?: string;
}

/**
 * Result from image analysis (Google Vision or fallback)
 */
export interface ImageAnalysisResult {
        /** Dominant colors in the image (hex values) */
        colors: string[];
        /** Detected objects/labels */
        objects: string[];
        /** Extracted text via OCR */
        ocrText: string | null;
        /** Texture quality: smooth, textured, geometric, organic */
        texture?: string;
        /** Composition style: centered, grid, asymmetric, minimal, complex */
        composition?: string;
        /** Visual elements detected: typography, logo, icon, photograph, illustration, etc */
        visualElements?: string[];
        /** Color palette type: monochrome, vibrant, muted, high-contrast, pastel */
        paletteType?: string;
}


// =============================================================================
// API TYPES
// =============================================================================

/**
 * Source of save request - used for analytics and auth routing.
 */
export type SaveSource = 'ios-share-extension' | 'web-share-api' | 'chrome-extension' | 'manual';

/**
 * Request body for POST /api/save endpoint.
 * Sent from Chrome extension, iOS Share Extension, or manual save.
 */
export interface SaveCardRequest {
        /** Source URL (required for web saves) */
        url?: string;
        /** Content type hint (can be auto-detected) */
        type?: CardType;
        /** Title override */
        title?: string;
        /** Full content (for notes) */
        content?: string;
        /** Image URL or base64 data */
        imageUrl?: string;
        /** User-defined tags */
        tags?: string[];
        /** Source of the save request (for analytics and auth routing) */
        source?: SaveSource;
        /** Auth token for iOS Share Extension (Supabase JWT from Keychain) */
        auth_token?: string;
}

/**
 * Response from POST /api/save endpoint.
 */
export interface SaveCardResponse {
        /** Whether the save was successful */
        success: boolean;
        /** Created card (if successful) */
        card?: Card;
        /** Source of the saved card */
        source?: 'db' | 'mock';
        /** Error message (if failed) */
        error?: string;
}

/**
 * Query parameters for GET /api/search endpoint.
 */
export interface SearchQuery {
        /** Full-text search term */
        q?: string;
        /** Filter by card type */
        type?: CardType;
        /** Filter by tags (comma-separated) */
        tags?: string;
        /** Maximum results to return (default: 50) */
        limit?: number;
}

/**
 * Response from GET /api/search endpoint.
 */
export interface SearchResponse {
        /** Matching cards */
        cards: Card[];
        /** Total count (for pagination) */
        total: number;
}

// =============================================================================
// DATABASE TYPES (Supabase row types)
// =============================================================================

/**
 * Database row type for the 'cards' table.
 * Uses snake_case to match PostgreSQL conventions.
 */
export interface CardRow {
        id: string;
        user_id: string;
        type: CardType;
        title: string | null;
        content: string | null;
        url: string | null;
        image_url: string | null;
        metadata: CardMetadata;
        tags: string[];
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
        archived_at?: string | null; // Optional to support older schemas
}

/**
 * Converts a database row to a Card object.
 * Transforms snake_case to camelCase.
 */
export function rowToCard(row: CardRow): Card {
        return {
                id: row.id,
                userId: row.user_id,
                type: row.type,
                title: row.title,
                content: row.content,
                url: row.url,
                imageUrl: row.image_url,
                metadata: row.metadata,
                tags: row.tags,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at,
                archivedAt: row.archived_at || null,
        };
}

/**
 * Converts a Card object to a database row.
 * Transforms camelCase to snake_case.
 */
export function cardToRow(card: Partial<Card>): Partial<CardRow> {
        const row: Partial<CardRow> = {};
        if (card.id !== undefined) row.id = card.id;
        if (card.userId !== undefined) row.user_id = card.userId;
        if (card.type !== undefined) row.type = card.type;
        if (card.title !== undefined) row.title = card.title;
        if (card.content !== undefined) row.content = card.content;
        if (card.url !== undefined) row.url = card.url;
        if (card.imageUrl !== undefined) row.image_url = card.imageUrl;
        if (card.metadata !== undefined) row.metadata = card.metadata;
        if (card.tags !== undefined) row.tags = card.tags;
        if (card.deletedAt !== undefined) row.deleted_at = card.deletedAt;
        if (card.archivedAt !== undefined) row.archived_at = card.archivedAt;
        return row;
}
