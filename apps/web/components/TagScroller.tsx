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
        { id: 'webpages', label: 'Web Pages', color: '#00A99D' }, // Riso Teal
        { id: 'videos', label: 'Videos', color: '#FF48B0' },      // Riso Pink
        { id: 'images', label: 'Images', color: '#9D7AD2' },      // Riso Purple
        { id: 'articles', label: 'Articles', color: '#00A99D' },  // Riso Cyan
        { id: 'posts', label: 'Posts', color: '#2B579A' },        // Riso Blue
        { id: 'products', label: 'Products', color: '#00A99D' },  // Riso Teal
        { id: 'books', label: 'Books', color: '#FFE800' },        // Riso Yellow
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Horizontal scrolling tag filter bar.
 */
import { useRouter, useSearchParams } from 'next/navigation';

// ...

export function TagScroller({
        tags = DEFAULT_TAGS,
        selectedTag: propSelectedTag,
        onTagSelect
}: TagScrollerProps) {
        const router = useRouter();
        const searchParams = useSearchParams();
        const currentType = searchParams.get('type') || 'all';

        // Use prop if provided, otherwise URL state
        const selectedTag = propSelectedTag || currentType;

        const handleTagSelect = (tagId: string | null) => {
                if (onTagSelect) {
                        onTagSelect(tagId);
                        return;
                }

                const params = new URLSearchParams(searchParams.toString());
                if (tagId && tagId !== 'all') {
                        // Map UI tags to DB types correctly
                        let dbType = tagId;
                        if (tagId === 'webpages') dbType = 'article';
                        if (tagId === 'images') dbType = 'image';
                        if (tagId === 'products') dbType = 'product';
                        if (tagId === 'books') dbType = 'book';
                        if (tagId === 'videos') dbType = 'video'; // Requires 'video' type specific logic or map to youtube platform search? 
                        if (tagId === 'posts') dbType = 'twitter';

                        params.set('type', dbType);
                } else {
                        params.delete('type');
                }
                router.push(`/?${params.toString()}`);
        };
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
                                                        onClick={() => handleTagSelect(isSelected ? null : tag.id)}
                                                        className={`
                group inline-flex items-center gap-2 px-4 py-2
                rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-200
                ${isSelected
                                                                        ? 'bg-white text-black shadow-md ring-1 ring-black/5'
                                                                        : 'bg-transparent text-gray-500 hover:bg-white hover:text-black hover:shadow-sm'
                                                                }
              `}
                                                >
                                                        {/* Colored Dot or Icon */}
                                                        {Icon ? (
                                                                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-gray-400 group-hover:text-[var(--accent-primary)]'}`} />
                                                        ) : (
                                                                <span
                                                                        className={`w-2.5 h-2.5 rounded-full border-[1.5px] transition-colors duration-300 ${isSelected ? 'bg-[var(--tag-color)] border-[var(--tag-color)]' : 'bg-transparent border-[var(--tag-color)] group-hover:bg-[var(--tag-color)]'}`}
                                                                        style={{
                                                                                '--tag-color': tag.color,
                                                                                backgroundColor: isSelected ? tag.color : 'transparent',
                                                                                borderColor: tag.color
                                                                        } as React.CSSProperties}
                                                                />
                                                        )}
                                                        {tag.label}
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
