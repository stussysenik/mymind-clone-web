/**
 * MyMind Clone - TagScroller Component
 *
 * Horizontal scrolling tag/filter bar matching mymind.com.
 * Enhanced with:
 * - Tactile micro-interactions following Don Norman's principles
 * - Atomic weight system for responsive pill limits
 * - Fade edge indicators for overflow
 * - Momentum scroll for touch devices
 * - Physics-based elastic-tap animations
 *
 * @fileoverview Horizontal tag filter bar with micro-interactions
 */

'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Globe, Video, Image, FileText, MessageSquare, ShoppingBag, BookOpen, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBreakpoint } from '@/hooks/useMediaQuery';

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
	/** Tags to display */
	tags?: Tag[];
	/** Currently selected tag */
	selectedTag?: string | null;
	/** Callback when tag is selected */
	onTagSelect?: (tagId: string | null) => void;
}

// =============================================================================
// DEFAULT TAGS (Content Types)
// =============================================================================

const DEFAULT_TAGS: Tag[] = [
	{ id: 'all', label: 'All', color: 'var(--accent-primary)', icon: Sparkles },
	{ id: 'webpages', label: 'Web Pages', color: '#00A99D' },
	{ id: 'videos', label: 'Videos', color: '#FF48B0' },
	{ id: 'images', label: 'Images', color: '#9D7AD2' },
	{ id: 'articles', label: 'Articles', color: '#00A99D' },
	{ id: 'posts', label: 'Posts', color: '#2B579A' },
	{ id: 'products', label: 'Products', color: '#00A99D' },
	{ id: 'books', label: 'Books', color: '#FFE800' },
];

// =============================================================================
// PILL LIMIT BY BREAKPOINT
// =============================================================================

const getPillLimit = (isXs: boolean, isSm: boolean, isMd: boolean): number => {
	if (isXs) return 3;   // xs: 3 pills
	if (isSm) return 5;   // sm: 5 pills
	if (isMd) return 6;   // md: 6 pills
	return Infinity;      // lg+: all pills
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TagScroller({
	tags = DEFAULT_TAGS,
	selectedTag: propSelectedTag,
	onTagSelect
}: TagScrollerProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentType = searchParams.get('type') || 'all';
	const scrollRef = useRef<HTMLDivElement>(null);
	const { isXs, isSm, isMd } = useBreakpoint();

	// Track which button is being pressed for tactile feedback
	const [pressedTag, setPressedTag] = useState<string | null>(null);
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(false);
	const [showMoreButton, setShowMoreButton] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	// Calculate pill limit based on breakpoint
	const pillLimit = useMemo(() => getPillLimit(isXs, isSm, isMd), [isXs, isSm, isMd]);

	// Determine visible tags based on limit
	const visibleTags = useMemo(() => {
		if (isExpanded || pillLimit === Infinity) return tags;
		return tags.slice(0, pillLimit);
	}, [tags, pillLimit, isExpanded]);

	// Check if we need the "more" button
	useEffect(() => {
		setShowMoreButton(tags.length > pillLimit && !isExpanded);
	}, [tags.length, pillLimit, isExpanded]);

	// Map DB types back to UI Tag IDs for highlighting
	const getSelectedTagId = (type: string) => {
		if (type === 'article') return 'webpages';
		if (type === 'image') return 'images';
		if (type === 'video') return 'videos';
		if (type === 'product') return 'products';
		if (type === 'book') return 'books';
		if (type === 'twitter') return 'posts'; // Map twitter type to Posts tab
		return type;
	};

	const selectedTag = propSelectedTag || getSelectedTagId(currentType);

	/**
	 * Handle tag selection with URL update
	 */
	const handleTagSelect = useCallback((tagId: string | null) => {
		if (onTagSelect) {
			onTagSelect(tagId);
			return;
		}

		const params = new URLSearchParams(searchParams.toString());
		if (tagId && tagId !== 'all') {
			// Map UI tags to DB types
			let dbType = tagId;
			if (tagId === 'webpages') dbType = 'article'; // Web pages are essentially articles/content
			if (tagId === 'articles') dbType = 'article'; // Explicit articles
			if (tagId === 'images') dbType = 'image';
			if (tagId === 'products') dbType = 'product';
			if (tagId === 'books') dbType = 'book';
			if (tagId === 'videos') dbType = 'video';
			if (tagId === 'posts') dbType = 'twitter'; // Posts can be twitter, bluesky, etc.

			params.set('type', dbType);
		} else {
			params.delete('type');
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

	return (
		<div className="relative flex items-center gap-2 py-3">
			{/* Left Arrow - Weight 5: Content Optional, visible on desktop */}
			{showLeftArrow && (
				<button
					onClick={() => scroll('left')}
					className="absolute left-0 z-10 p-2 bg-[var(--card-bg)] shadow-md rounded-full
					           physics-press touch-target hover:shadow-lg
					           hidden md:flex items-center justify-center"
					aria-label="Scroll left"
				>
					<ChevronLeft className="h-4 w-4 text-[var(--foreground-muted)]" />
				</button>
			)}

			{/* Scrollable Tags with momentum scroll and fade edges */}
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className={`
					flex items-center gap-2 md:gap-3 overflow-x-auto hide-scrollbar
					px-1 pb-1 momentum-scroll
					${fadeEdgeClass}
				`}
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
								select-none cursor-pointer
								elastic-tap touch-target
								${isPressed
									? 'scale-[0.95]'
									: 'hover:-translate-y-0.5'
								}
								${isSelected
									? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-md ring-1 ring-black/10 border-b-2 border-[var(--accent-primary)]'
									: 'bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--card-bg)]/80 hover:text-[var(--foreground)] hover:shadow-sm'
								}
							`}
							style={{
								// Spring animation on release
								transitionTimingFunction: isPressed
									? 'cubic-bezier(0.4, 0, 0.2, 1)'
									: 'var(--ease-elastic)'
							}}
						>
							{/* Selection pulse effect */}
							{isSelected && (
								<span
									className="absolute inset-0 rounded-full animate-scale-in"
									style={{
										background: 'transparent',
										boxShadow: `0 0 0 2px ${tag.color}20`
									}}
								/>
							)}

							{/* Icon or Colored Dot */}
							{Icon ? (
								<Icon
									className={`
										h-3.5 w-3.5 transition-all duration-200
										${isSelected
											? 'text-[var(--accent-primary)] scale-110'
											: 'text-[var(--foreground-muted)] group-hover:text-[var(--accent-primary)] group-hover:scale-110'
										}
									`}
								/>
							) : (
								<span
									className={`
										w-2.5 h-2.5 rounded-full border-[1.5px]
										transition-all duration-200
										${isSelected
											? 'scale-110'
											: 'group-hover:scale-110'
										}
									`}
									style={{
										backgroundColor: isSelected ? tag.color : 'transparent',
										borderColor: tag.color,
										boxShadow: isSelected ? `0 0 8px ${tag.color}40` : 'none'
									}}
								/>
							)}

							{/* Label */}
							<span className="relative">{tag.label}</span>
						</button>
					);
				})}

				{/* "More" button when pills are limited */}
				{showMoreButton && (
					<button
						onClick={() => setIsExpanded(true)}
						className={`
							inline-flex items-center gap-1.5 px-3 py-2
							rounded-full text-sm font-medium whitespace-nowrap
							select-none cursor-pointer
							elastic-tap touch-target
							bg-[var(--background-secondary)] text-[var(--foreground-muted)]
							hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] hover:shadow-sm
							hover:-translate-y-0.5
						`}
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
