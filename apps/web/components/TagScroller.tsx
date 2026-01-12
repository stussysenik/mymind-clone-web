/**
 * MyMind Clone - TagScroller Component
 * 
 * Horizontal scrolling tag/filter bar matching mymind.com.
 * Enhanced with tactile micro-interactions following Don Norman's principles.
 * 
 * Features:
 * - Snappy click feedback with spring animation
 * - Hover lift effect for depth
 * - All filters clickable (even when empty)
 * - Visual feedback on selection
 * 
 * @fileoverview Horizontal tag filter bar with micro-interactions
 */

'use client';

import { useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Globe, Video, Image, FileText, MessageSquare, ShoppingBag, BookOpen, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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

        // Track which button is being pressed for tactile feedback
        const [pressedTag, setPressedTag] = useState<string | null>(null);
        const [showLeftArrow, setShowLeftArrow] = useState(false);
        const [showRightArrow, setShowRightArrow] = useState(true);

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
                setShowLeftArrow(scrollLeft > 0);
                setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }, []);

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

        return (
                <div className="relative flex items-center gap-2 py-3">
                        {/* Left Arrow - Tactile */}
                        {showLeftArrow && (
                                <button
                                        onClick={() => scroll('left')}
                                        className="absolute left-0 z-10 p-1.5 bg-white shadow-md rounded-full 
                                                   tactile-btn hover:shadow-lg"
                                        aria-label="Scroll left"
                                >
                                        <ChevronLeft className="h-4 w-4 text-gray-500" />
                                </button>
                        )}

                        {/* Scrollable Tags */}
                        <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex items-center gap-3 overflow-x-auto hide-scrollbar px-1 pb-1"
                        >

                                {tags.map((tag) => {
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
                                                        className={`
                                                                group relative inline-flex items-center gap-1.5 px-3.5 py-2
                                                                rounded-full text-sm font-medium whitespace-nowrap
                                                                select-none cursor-pointer
                                                                transition-all duration-150
                                                                ${isPressed
                                                                        ? 'scale-[0.97] transition-transform duration-75'
                                                                        : 'hover:-translate-y-0.5'
                                                                }
                                                                ${isSelected
                                                                        ? 'bg-white text-black shadow-md ring-1 ring-black/10 border-b-2 border-[var(--accent-primary)]'
                                                                        : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-black hover:shadow-sm'
                                                                }
                                                        `}

                                                        style={{
                                                                // Spring animation on release
                                                                transitionTimingFunction: isPressed
                                                                        ? 'cubic-bezier(0.4, 0, 0.2, 1)'
                                                                        : 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                        }}
                                                >
                                                        {/* Selection pulse effect */}
                                                        {isSelected && (
                                                                <span
                                                                        className="absolute inset-0 rounded-full animate-bounce-in"
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
                                                                                        : 'text-gray-400 group-hover:text-[var(--accent-primary)] group-hover:scale-110'
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
                        </div>

                        {/* Right Arrow - Tactile */}
                        {showRightArrow && (
                                <button
                                        onClick={() => scroll('right')}
                                        className="absolute right-0 z-10 p-1.5 bg-white shadow-md rounded-full 
                                                   tactile-btn hover:shadow-lg"
                                        aria-label="Scroll right"
                                >
                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                </button>
                        )}
                </div>
        );
}

export default TagScroller;
