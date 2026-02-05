/**
 * MyMind Clone - TagScroller Component
 *
 * Horizontal scrolling tag/filter bar matching mymind.com.
 * Now uses PLATFORM-BASED pills instead of content-type pills.
 *
 * Features:
 * - Dynamic platform pills (YouTube, Twitter, Instagram, etc.)
 * - 3-item threshold for showing a platform pill
 * - Fallback categories: Websites, Images, Notes
 * - Tactile micro-interactions following Don Norman's principles
 * - Atomic weight system for responsive pill limits
 * - Fade edge indicators for overflow
 *
 * @fileoverview Horizontal platform filter bar with micro-interactions
 */

'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Globe, Video, Image as ImageIcon, FileText, MessageSquare, ShoppingBag, BookOpen, Sparkles, Film, Music, Package, Mail, AtSign } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { PLATFORMS, Platform } from '@/lib/platforms';

// =============================================================================
// TYPES
// =============================================================================

interface Tag {
	id: string;
	label: string;
	color: string;
	icon?: React.ComponentType<{ className?: string }>;
	count?: number;
}

interface TagScrollerProps {
	/** Tags to display (optional - will use dynamic tags if not provided) */
	tags?: Tag[];
	/** Currently selected tag */
	selectedTag?: string | null;
	/** Callback when tag is selected */
	onTagSelect?: (tagId: string | null) => void;
	/** Platform counts for dynamic platform-based filtering (e.g., { youtube: 15, twitter: 8 }) */
	platformCounts?: Record<string, number>;
	/** @deprecated Use platformCounts instead */
	typeCounts?: Record<string, number>;
}

// =============================================================================
// PLATFORM PILL CONFIGURATION
// =============================================================================

// Minimum number of items required to show a platform pill
const MIN_ITEMS_FOR_PILL = 3;

// Priority platforms that ALWAYS show in the filter bar (even with 0 items)
// These are commonly used social platforms that users expect to filter by
const PRIORITY_PLATFORMS: Platform[] = ['twitter', 'reddit', 'youtube', 'instagram'];

// Map platform IDs to Lucide icons
const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
	youtube: Video,
	tiktok: Video,
	twitter: MessageSquare, // X logo not in Lucide, using message
	instagram: ImageIcon,
	reddit: MessageSquare,
	linkedin: MessageSquare,
	mastodon: AtSign,
	letterboxd: Film,
	imdb: Film,
	goodreads: BookOpen,
	storygraph: BookOpen,
	amazon: Package,
	spotify: Music,
	pinterest: ImageIcon,
	github: FileText,
	medium: FileText,
	substack: Mail,
	// Fallback categories
	websites: Globe,
	images: ImageIcon,
	notes: FileText,
};

// Fallback category definitions (for non-platform cards)
const FALLBACK_PILLS: Tag[] = [
	{ id: 'websites', label: 'Websites', color: '#6B7280', icon: Globe },
	{ id: 'images', label: 'Images', color: '#9D7AD2', icon: ImageIcon },
	{ id: 'notes', label: 'Notes', color: '#00A99D', icon: FileText },
];

// =============================================================================
// PILL LIMIT BY BREAKPOINT
// =============================================================================

const getPillLimit = (isXs: boolean, isMidSm: boolean, isSm: boolean, isMd: boolean): number => {
	if (isXs) return 2;      // xs (≤374px): 2 pills only
	if (isMidSm) return 3;   // midSm (375-450px): 3 pills (iPhone 12/14/16 range)
	if (isSm) return 5;      // sm (451-639px): 5 pills
	if (isMd) return 6;      // md (640-767px): 6 pills
	return Infinity;         // lg+ (>767px): all pills
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TagScroller({
	tags: propTags,
	selectedTag: propSelectedTag,
	onTagSelect,
	platformCounts,
	typeCounts // deprecated, for backwards compatibility
}: TagScrollerProps) {
	// Generate dynamic pills based on platform counts
	const dynamicTags = useMemo(() => {
		if (propTags) return propTags;

		// Use platformCounts (new) or fall back to typeCounts (deprecated)
		const counts = platformCounts || typeCounts || {};

		const pills: Tag[] = [
			{ id: 'all', label: 'All', color: 'var(--accent-primary)', icon: Sparkles }
		];

		// Track which platforms we've added
		const addedPlatforms = new Set<string>();

		// First, add priority platforms (always visible, even with 0 items)
		for (const platform of PRIORITY_PLATFORMS) {
			const count = counts[platform] || 0;
			const platformInfo = PLATFORMS[platform];
			if (platformInfo) {
				pills.push({
					id: platform,
					label: platformInfo.name,
					color: platformInfo.color,
					icon: PLATFORM_ICONS[platform],
					count
				});
				addedPlatforms.add(platform);
			}
		}

		// Sort remaining platforms by count descending
		const sortedPlatforms = Object.entries(counts)
			.filter(([platform]) => !addedPlatforms.has(platform))
			.sort(([, a], [, b]) => b - a);

		for (const [platform, count] of sortedPlatforms) {
			// Skip if below threshold (priority platforms already added above)
			if (count < MIN_ITEMS_FOR_PILL) continue;

			// Handle fallback categories (websites, images, notes from unknown platform or specific types)
			if (platform === 'unknown' || platform === 'article' || platform === 'website') {
				// Add "Websites" pill if we have enough generic articles
				const existingWebsites = pills.find(p => p.id === 'websites');
				if (!existingWebsites) {
					pills.push({
						id: 'websites',
						label: 'Websites',
						color: '#6B7280',
						icon: Globe,
						count
					});
				}
				continue;
			}

			if (platform === 'image') {
				pills.push({
					id: 'images',
					label: 'Images',
					color: '#9D7AD2',
					icon: ImageIcon,
					count
				});
				continue;
			}

			if (platform === 'note') {
				pills.push({
					id: 'notes',
					label: 'Notes',
					color: '#00A99D',
					icon: FileText,
					count
				});
				continue;
			}

			// Check if this is a known platform (and not already added)
			const platformInfo = PLATFORMS[platform as Platform];
			if (platformInfo && platform !== 'unknown' && !addedPlatforms.has(platform)) {
				pills.push({
					id: platform,
					label: platformInfo.name,
					color: platformInfo.color,
					icon: PLATFORM_ICONS[platform],
					count
				});
				addedPlatforms.add(platform);
			}
		}

		// Sort: "All" first, then priority platforms in order, then by count descending
		return pills.sort((a, b) => {
			if (a.id === 'all') return -1;
			if (b.id === 'all') return 1;

			// Priority platforms stay in their defined order
			const aIsPriority = PRIORITY_PLATFORMS.includes(a.id as Platform);
			const bIsPriority = PRIORITY_PLATFORMS.includes(b.id as Platform);

			if (aIsPriority && bIsPriority) {
				return PRIORITY_PLATFORMS.indexOf(a.id as Platform) - PRIORITY_PLATFORMS.indexOf(b.id as Platform);
			}
			if (aIsPriority) return -1;
			if (bIsPriority) return 1;

			// Non-priority: sort by count
			return (b.count || 0) - (a.count || 0);
		});
	}, [propTags, platformCounts, typeCounts]);

	const tags = dynamicTags;
	const router = useRouter();
	const searchParams = useSearchParams();
	// Support both old ?type= and new ?platform= params
	const currentPlatform = searchParams.get('platform') || searchParams.get('type') || 'all';
	const scrollRef = useRef<HTMLDivElement>(null);
	const { isXs, isMidSm, isSm, isMd } = useBreakpoint();

	// Track hydration to prevent flash - show skeleton until client is ready
	const [isHydrated, setIsHydrated] = useState(false);
	useEffect(() => {
		setIsHydrated(true);
	}, []);

	// Track which button is being pressed for tactile feedback
	const [pressedTag, setPressedTag] = useState<string | null>(null);
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(false);
	const [showMoreButton, setShowMoreButton] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	// Calculate pill limit based on breakpoint
	const pillLimit = useMemo(() => getPillLimit(isXs, isMidSm, isSm, isMd), [isXs, isMidSm, isSm, isMd]);

	// Determine visible tags based on limit
	const visibleTags = useMemo(() => {
		if (isExpanded || pillLimit === Infinity) return tags;
		return tags.slice(0, pillLimit);
	}, [tags, pillLimit, isExpanded]);

	// Check if we need the "more" button
	useEffect(() => {
		setShowMoreButton(tags.length > pillLimit && !isExpanded);
	}, [tags.length, pillLimit, isExpanded]);

	// Map current filter to UI tag ID for highlighting
	const getSelectedTagId = (filter: string) => {
		// Handle legacy type values for backwards compatibility
		if (filter === 'article') return 'websites';
		if (filter === 'image') return 'images';
		if (filter === 'note') return 'notes';
		// Platform values map directly to tag IDs
		return filter;
	};

	const selectedTag = propSelectedTag || getSelectedTagId(currentPlatform);

	/**
	 * Handle tag selection with URL update.
	 * Now uses ?platform= param instead of ?type=
	 */
	const handleTagSelect = useCallback((tagId: string | null) => {
		if (onTagSelect) {
			onTagSelect(tagId);
			return;
		}

		const params = new URLSearchParams(searchParams.toString());
		// Remove both old and new params to start fresh
		params.delete('type');
		params.delete('platform');

		if (tagId && tagId !== 'all') {
			// Platform IDs map directly (youtube, twitter, instagram, etc.)
			// Fallback categories also work: websites, images, notes
			params.set('platform', tagId);
		}

		router.push(`/?${params.toString()}`);
	}, [onTagSelect, searchParams, router]);

	/**
	 * Handle scroll to update arrow visibility
	 */
	const handleScroll = useCallback(() => {
		if (!scrollRef.current) return;
		const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
		setShowLeftArrow(scrollLeft > 8);
		setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 8);
	}, []);

	// Initial scroll check
	useEffect(() => {
		handleScroll();
		// Check on mount and when expanded changes
	}, [handleScroll, isExpanded]);

	/**
	 * Scroll left or right
	 */
	const scroll = useCallback((direction: 'left' | 'right') => {
		if (!scrollRef.current) return;
		const scrollAmount = 200;
		scrollRef.current.scrollBy({
			left: direction === 'left' ? -scrollAmount : scrollAmount,
			behavior: 'smooth',
		});
	}, []);

	// Determine fade edge class
	const fadeEdgeClass = useMemo(() => {
		if (showLeftArrow && showRightArrow) return 'fade-edge-both';
		if (showLeftArrow) return 'fade-edge-left';
		if (showRightArrow) return 'fade-edge-right';
		return '';
	}, [showLeftArrow, showRightArrow]);

	// Skeleton shown during SSR and initial hydration to prevent flash
	if (!isHydrated) {
		return (
			<div className="relative flex items-center gap-2 py-3">
				<div className="flex items-center gap-2 md:gap-3 px-1 pb-1">
					{/* Skeleton pills - show 3 on mobile, more on larger screens */}
					<div className="h-9 w-14 rounded-full bg-[var(--background-secondary)] animate-pulse" />
					<div className="h-9 w-16 rounded-full bg-[var(--background-secondary)] animate-pulse" />
					<div className="h-9 w-20 rounded-full bg-[var(--background-secondary)] animate-pulse" />
					<div className="h-9 w-16 rounded-full bg-[var(--background-secondary)] animate-pulse hidden sm:block" />
					<div className="h-9 w-18 rounded-full bg-[var(--background-secondary)] animate-pulse hidden sm:block" />
					<div className="h-9 w-20 rounded-full bg-[var(--background-secondary)] animate-pulse hidden md:block" />
					<div className="h-9 w-16 rounded-full bg-[var(--background-secondary)] animate-pulse hidden lg:block" />
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex items-center py-3 w-full">
			{/* Left Arrow - visible on desktop only */}
			{showLeftArrow && (
				<button
					onClick={() => scroll('left')}
					className="absolute left-0 z-10 p-2 bg-[var(--card-bg)] shadow-md rounded-full
					           physics-press hover:shadow-lg
					           hidden md:flex items-center justify-center"
					aria-label="Scroll left"
				>
					<ChevronLeft className="h-4 w-4 text-[var(--foreground-muted)]" />
				</button>
			)}

			{/* Scrollable Tags with momentum scroll */}
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className={`
					flex items-center gap-2 md:gap-3 overflow-x-auto hide-scrollbar
					w-full px-1 pb-1
					touch-pan-x
					${fadeEdgeClass}
				`}
				style={{ WebkitOverflowScrolling: 'touch' }}
			>
				{visibleTags.map((tag) => {
					const Icon = tag.icon;
					const isSelected = selectedTag === tag.id;
					const isPressed = pressedTag === tag.id;

					return (
						<button
							key={tag.id}
							onClick={() => handleTagSelect(isSelected ? null : tag.id)}
							onMouseDown={() => setPressedTag(tag.id)}
							onMouseUp={() => setPressedTag(null)}
							onMouseLeave={() => setPressedTag(null)}
							onTouchStart={() => setPressedTag(tag.id)}
							onTouchEnd={() => setPressedTag(null)}
							className={`
								group relative inline-flex items-center gap-1.5 px-3 md:px-3.5 py-2
								rounded-full text-sm font-medium whitespace-nowrap
								select-none cursor-pointer transition-all duration-150
								${isPressed ? 'scale-95' : ''}
								${isSelected
									? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm'
									: 'bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]'
								}
							`}
						>

							{/* Icon */}
							{Icon && (
								<Icon
									className={`h-3.5 w-3.5 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--foreground-muted)]'}`}
								/>
							)}

							{/* Label */}
							<span>{tag.label}</span>

							{/* Selection indicator - bottom dot */}
							{isSelected && (
								<span
									className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent-primary)]"
								/>
							)}
						</button>
					);
				})}

				{/* "More" button when pills are limited */}
				{showMoreButton && (
					<button
						onClick={() => setIsExpanded(true)}
						className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap select-none cursor-pointer bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] transition-colors duration-150"
					>
						<span>+{tags.length - pillLimit} more</span>
					</button>
				)}
			</div>

			{/* Right Arrow - Weight 5: Content Optional, visible on desktop */}
			{showRightArrow && (
				<button
					onClick={() => scroll('right')}
					className="absolute right-0 z-10 p-2 bg-[var(--card-bg)] shadow-md rounded-full
					           physics-press touch-target hover:shadow-lg
					           hidden md:flex items-center justify-center"
					aria-label="Scroll right"
				>
					<ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
				</button>
			)}
		</div>
	);
}

export default TagScroller;
