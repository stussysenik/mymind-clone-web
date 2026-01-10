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
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Globe, ExternalLink, Play, StickyNote, FileText, ShoppingBag, BookOpen, Trash2, RotateCcw, Loader2, Twitter, Volume2, MessageSquare } from 'lucide-react';
import type { Card as CardType } from '@/lib/types';
import { detectPlatform, getPlatformInfo, extractDomain } from '@/lib/platforms';

// Platform-specific cards
import { TwitterCard } from './cards/TwitterCard';
import { InstagramCard } from './cards/InstagramCard';
import { YouTubeCard } from './cards/YouTubeCard';
import { MovieCard } from './cards/MovieCard';
import { RedditCard } from './cards/RedditCard';
import { LetterboxdCard } from './cards/LetterboxdCard';
import { GoodreadsCard } from './cards/GoodreadsCard';
import { AmazonCard } from './cards/AmazonCard';
import { StoryGraphCard } from './cards/StoryGraphCard';

// =============================================================================
// PROPS
// =============================================================================

interface CardProps {
        card: CardType;
        /** Optional delete handler */
        onDelete?: () => void;
        /** Optional restore handler (for Trash) */
        onRestore?: () => void;
        /** Optional click handler (for Detail View) */
        onClick?: () => void;
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
        video: Play,
        audio: Volume2,
        twitter: Twitter,
        reddit: MessageSquare,
        website: Globe,
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Smart card component that routes to platform-specific renderers.
 */
export function Card({ card, onDelete, onRestore, onClick }: CardProps) {
        const platform = detectPlatform(card.url);

        // Route to platform-specific cards
        switch (platform) {
                case 'twitter':
                        return <TwitterCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                case 'instagram':
                        return <InstagramCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                case 'youtube':
                        return <YouTubeCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                case 'reddit':
                        return <RedditCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                case 'letterboxd':
                        return <LetterboxdCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                case 'imdb':
                        return <MovieCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                case 'goodreads':
                        return <GoodreadsCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                case 'amazon':
                        return <AmazonCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                case 'storygraph':
                        return <StoryGraphCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
                default:
                        return <GenericCard card={card} onDelete={onDelete} onRestore={onRestore} onClick={onClick} />;
        }
}

// =============================================================================
// GENERIC CARD (for unknown platforms)
// =============================================================================

/**
 * Generic card for non-platform-specific content.
 */
function GenericCard({ card, onDelete, onRestore, onClick }: CardProps) {
        const [imageError, setImageError] = useState(false);
        const [screenshotError, setScreenshotError] = useState(false);
        const [isHovered, setIsHovered] = useState(false);
        const router = useRouter();

        const platformInfo = getPlatformInfo(card.url);
        const domain = extractDomain(card.url);
        const TypeIcon = TYPE_ICONS[card.type];
        const isVideo = card.url?.includes('vimeo');

        /**
         * Renders the card visual content.
         */
        const renderVisual = () => {
                const hasValidUrl = card.url && !card.url.startsWith('file:') && !card.url.startsWith('local-');

                // 1. Primary Image - Natural Aspect Ratio for Masonry
                if (card.imageUrl && !imageError) {
                        return (
                                <div className="relative w-full overflow-hidden bg-gray-100/50">
                                        <Image
                                                src={card.imageUrl}
                                                alt={card.title || 'Card image'}
                                                width={500}
                                                height={300}
                                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover"
                                                loading="lazy"
                                                onError={() => setImageError(true)}
                                        />
                                        {/* Video Play Button */}
                                        {isVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
                                                                <Play className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" />
                                                        </div>
                                                </div>
                                        )}
                                </div>
                        );
                }

                // 2. Fallback: Automatic Screenshot (Microlink) - Fixed Golden Ratio for consistency
                if (hasValidUrl && !screenshotError) {
                        const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(card.url!)}&screenshot=true&meta=false&embed=screenshot.url`;
                        return (
                                <div className="relative aspect-[1.618/1] w-full overflow-hidden bg-gray-50 group-hover:bg-gray-100 transition-colors">
                                        <Image
                                                src={screenshotUrl}
                                                alt="Site Preview"
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover object-top opacity-90 hover:opacity-100 transition-opacity"
                                                loading="lazy"
                                                unoptimized
                                                onError={() => setScreenshotError(true)}
                                        />
                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-medium text-gray-500 shadow-sm">
                                                <Globe className="w-2.5 h-2.5" />
                                                AUTO-SHOT
                                        </div>
                                </div>
                        );
                }

                // 3. Last Resort: Type Icon

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

                // Placeholder with dynamic gradient and Golden Ratio
                const getGradient = (str: string) => {
                        let hash = 0;
                        for (let i = 0; i < str.length; i++) {
                                hash = str.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        const hue1 = Math.abs(hash % 360);
                        const hue2 = (hue1 + 40) % 360;
                        return `linear-gradient(135deg, hsl(${hue1}, 70%, 90%), hsl(${hue2}, 70%, 95%))`;
                };

                return (
                        <div
                                className="aspect-[1.618/1] w-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
                                style={{ background: getGradient(card.title || card.type) }}
                        >
                                <TypeIcon className="h-12 w-12 text-gray-400/50" />
                        </div>
                );
        };

        return (
                <article
                        onClick={onClick}
                        className={`
        group relative flex flex-col overflow-hidden rounded-lg
        bg-white card-shadow
        transition-all duration-200
        hover:card-shadow-hover
        ${onClick ? 'cursor-pointer' : ''}
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
                                                                        onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                router.push(`/?q=%23${tag}`);
                                                                        }}
                                                                        className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--accent-primary)] hover:underline cursor-pointer transition-colors"
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

                        {/* Processing Indicator - positioned on left to avoid conflicting with hover actions */}
                        {card.metadata?.processing && (
                                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium animate-pulse">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Analyzing...
                                </div>
                        )}

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
                                        {onRestore && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRestore();
                                                        }}
                                                        className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-green-600 transition-colors"
                                                        aria-label="Restore card"
                                                >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                </button>
                                        )}
                                </div>
                        )}
                </article>
        );
}

export default Card;
