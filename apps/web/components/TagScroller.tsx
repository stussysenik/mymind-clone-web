/**
 * MyMind Clone - TagScroller Component
 * 
 * Horizontal scrolling tag/filter bar matching mymind.com.
 * Shows colored tag pills for filtering content.
 * 
 * @fileoverview Horizontal tag filter bar
 */

'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Globe, Video, Image, FileText, MessageSquare, ShoppingBag, BookOpen, Sparkles } from 'lucide-react';

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
        { id: 'webpages', label: 'Web Pages', color: 'var(--tag-blue)', icon: Globe },
        { id: 'videos', label: 'Videos', color: 'var(--tag-red)', icon: Video },
        { id: 'images', label: 'Images', color: 'var(--tag-purple)', icon: Image },
        { id: 'articles', label: 'Articles', color: 'var(--tag-cyan)', icon: FileText },
        { id: 'posts', label: 'Posts', color: 'var(--tag-blue)', icon: MessageSquare },
        { id: 'products', label: 'Products', color: 'var(--tag-green)', icon: ShoppingBag },
        { id: 'books', label: 'Books', color: 'var(--tag-amber)', icon: BookOpen },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Horizontal scrolling tag filter bar.
 */
export function TagScroller({
        tags = DEFAULT_TAGS,
        selectedTag = 'all',
        onTagSelect
}: TagScrollerProps) {
        const scrollRef = useRef<HTMLDivElement>(null);
        const [showLeftArrow, setShowLeftArrow] = useState(false);
        const [showRightArrow, setShowRightArrow] = useState(true);

        /**
         * Handle scroll to update arrow visibility.
         */
        const handleScroll = () => {
                if (!scrollRef.current) return;
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                setShowLeftArrow(scrollLeft > 0);
                setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        };

        /**
         * Scroll left or right.
         */
        const scroll = (direction: 'left' | 'right') => {
                if (!scrollRef.current) return;
                const scrollAmount = 200;
                scrollRef.current.scrollBy({
                        left: direction === 'left' ? -scrollAmount : scrollAmount,
                        behavior: 'smooth',
                });
        };

        return (
                <div className="relative flex items-center gap-2 py-3">
                        {/* Left Arrow */}
                        {showLeftArrow && (
                                <button
                                        onClick={() => scroll('left')}
                                        className="absolute left-0 z-10 p-1 bg-[var(--background)] shadow-md rounded-full hover:bg-white transition-colors"
                                        aria-label="Scroll left"
                                >
                                        <ChevronLeft className="h-4 w-4 text-[var(--foreground-muted)]" />
                                </button>
                        )}

                        {/* Scrollable Tags */}
                        <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-1"
                        >
                                {tags.map((tag) => {
                                        const Icon = tag.icon;
                                        const isSelected = selectedTag === tag.id;

                                        return (
                                                <button
                                                        key={tag.id}
                                                        onClick={() => onTagSelect?.(isSelected ? null : tag.id)}
                                                        className={`
                inline-flex items-center gap-2 px-3 py-1.5
                rounded-full text-sm font-medium whitespace-nowrap
                border transition-all duration-200
                ${isSelected
                                                                        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                                                        : 'bg-white border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-hover)] hover:shadow-sm'
                                                                }
              `}
                                                >
                                                        {/* Colored Dot or Icon */}
                                                        {Icon ? (
                                                                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : ''}`} />
                                                        ) : (
                                                                <span
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: tag.color }}
                                                                />
                                                        )}
                                                        {tag.label}
                                                        {tag.count !== undefined && (
                                                                <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-[var(--foreground-muted)]'}`}>
                                                                        {tag.count}
                                                                </span>
                                                        )}
                                                </button>
                                        );
                                })}
                        </div>

                        {/* Right Arrow */}
                        {showRightArrow && (
                                <button
                                        onClick={() => scroll('right')}
                                        className="absolute right-0 z-10 p-1 bg-[var(--background)] shadow-md rounded-full hover:bg-white transition-colors"
                                        aria-label="Scroll right"
                                >
                                        <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
                                </button>
                        )}
                </div>
        );
}

export default TagScroller;
