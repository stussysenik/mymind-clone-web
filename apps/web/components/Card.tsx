/**
 * MyMind Clone - Card Component
 * 
 * Routes to platform-specific card renderers based on URL.
 * Falls back to generic card for unknown platforms.
 * 
 * @fileoverview Smart card router component
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Globe, ExternalLink, Play, StickyNote, FileText, ShoppingBag, BookOpen, Trash2 } from 'lucide-react';
import type { Card as CardType } from '@/lib/types';
import { detectPlatform, getPlatformInfo, extractDomain } from '@/lib/platforms';

// Platform-specific cards
import { TwitterCard } from './cards/TwitterCard';
import { InstagramCard } from './cards/InstagramCard';
import { YouTubeCard } from './cards/YouTubeCard';
import { MovieCard } from './cards/MovieCard';
import { RedditCard } from './cards/RedditCard';

// =============================================================================
// PROPS
// =============================================================================

interface CardProps {
        card: CardType;
        /** Optional delete handler */
        onDelete?: () => void;
}

// =============================================================================
// TYPE ICONS
// =============================================================================

const TYPE_ICONS = {
        article: FileText,
        image: Globe,
        note: StickyNote,
        product: ShoppingBag,
        book: BookOpen,
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Smart card component that routes to platform-specific renderers.
 */
export function Card({ card, onDelete }: CardProps) {
        const platform = detectPlatform(card.url);

        // Route to platform-specific cards
        switch (platform) {
                case 'twitter':
                        return <TwitterCard card={card} />;
                case 'instagram':
                        return <InstagramCard card={card} />;
                case 'youtube':
                        return <YouTubeCard card={card} />;
                case 'reddit':
                        return <RedditCard card={card} />;
                case 'letterboxd':
                case 'imdb':
                        return <MovieCard card={card} />;
                default:
                        return <GenericCard card={card} onDelete={onDelete} />;
        }
}

// =============================================================================
// GENERIC CARD (for unknown platforms)
// =============================================================================

/**
 * Generic card for non-platform-specific content.
 */
function GenericCard({ card, onDelete }: CardProps) {
        const [imageError, setImageError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);

        const platformInfo = getPlatformInfo(card.url);
        const domain = extractDomain(card.url);
        const TypeIcon = TYPE_ICONS[card.type];
        const isVideo = card.url?.includes('vimeo');

        /**
         * Renders the card visual content.
         */
        const renderVisual = () => {
                if (card.imageUrl && !imageError) {
                        return (
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                                        <Image
                                                src={card.imageUrl}
                                                alt={card.title || 'Card image'}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover"
                                                loading="lazy"
                                                onError={() => setImageError(true)}
                                        />

                                        {/* Video Play Button */}
                                        {isVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                                <Play className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" />
                                                        </div>
                                                </div>
                                        )}
                                </div>
                        );
                }

                // Note card without image
                if (card.type === 'note') {
                        return (
                                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 min-h-[120px]">
                                        <h4 className="text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                {card.title || 'Add a New Note'}
                                        </h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
                                                {card.content?.slice(0, 200) || 'Start typing here...'}
                                        </p>
                                </div>
                        );
                }

                // Placeholder for cards without images
                return (
                        <div className="aspect-[4/3] w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                <TypeIcon className="h-10 w-10 text-gray-300" />
                        </div>
                );
        };

        return (
                <article
                        className={`
        group relative flex flex-col overflow-hidden rounded-lg
        bg-white card-shadow
        transition-all duration-200
        hover:card-shadow-hover
      `}
                        style={{ borderLeft: `3px solid ${platformInfo.color}` }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                >
                        {/* Visual Section */}
                        {renderVisual()}

                        {/* Content Section */}
                        <div className="flex flex-col p-3 gap-2">
                                {/* Title */}
                                {card.title && card.type !== 'note' && (
                                        <h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 leading-snug">
                                                {card.title}
                                        </h3>
                                )}

                                {/* Summary */}
                                {card.metadata.summary && card.type !== 'note' && (
                                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">
                                                {card.metadata.summary}
                                        </p>
                                )}

                                {/* Price for products */}
                                {card.type === 'product' && card.metadata.price && (
                                        <span className="text-sm font-semibold text-green-600">
                                                {card.metadata.price}
                                        </span>
                                )}

                                {/* Source URL */}
                                {domain && (
                                        <div className="flex items-center gap-1.5 mt-auto pt-1">
                                                <Globe className="w-3 h-3 text-[var(--foreground-muted)]" />
                                                <span className="text-xs text-[var(--accent-primary)] truncate">
                                                        {domain}
                                                </span>
                                        </div>
                                )}

                                {/* Tags */}
                                {card.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                {card.tags.slice(0, 4).map((tag, index) => {
                                                        const colors = ['var(--tag-green)', 'var(--tag-blue)', 'var(--tag-purple)', 'var(--tag-orange)'];
                                                        const color = colors[index % colors.length];

                                                        return (
                                                                <span
                                                                        key={tag}
                                                                        className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]"
                                                                >
                                                                        <span
                                                                                className="w-1.5 h-1.5 rounded-full"
                                                                                style={{ backgroundColor: color }}
                                                                        />
                                                                        {tag}
                                                                </span>
                                                        );
                                                })}
                                        </div>
                                )}
                        </div>

                        {/* Hover Actions */}
                        {isHovered && (
                                <div className="absolute right-2 top-2 flex gap-1">
                                        {card.url && (
                                                <a
                                                        href={card.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
                                                        aria-label="Open original link"
                                                >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                        )}
                                        {onDelete && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete();
                                                        }}
                                                        className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-red-600 transition-colors"
                                                        aria-label="Delete card"
                                                >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                        )}
                                </div>
                        )}
                </article>
        );
}

export default Card;
