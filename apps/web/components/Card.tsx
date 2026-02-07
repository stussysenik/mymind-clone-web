/**
 * MyMind Clone - Card Component
 *
 * Routes to platform-specific card renderers based on URL.
 * Falls back to generic card for unknown platforms.
 *
 * Enhanced with:
 * - Physics-based hover animations
 * - Touch target compliant action buttons
 * - Staggered fade-up entrance animation
 *
 * @fileoverview Smart card router component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Globe, ExternalLink, Play, StickyNote, FileText, ShoppingBag, BookOpen, Trash2, RotateCcw, Twitter, Volume2, MessageSquare, Archive, Film, Users } from 'lucide-react';
import { AnalyzingIndicator } from './AnalyzingIndicator';
import { TagDisplay } from './TagDisplay';
import type { Card as CardType } from '@/lib/types';
import { detectPlatform, getPlatformInfo, extractDomain } from '@/lib/platforms';
import { decodeHtmlEntities } from '@/lib/text-utils';
import { getProcessingState } from '@/lib/enrichment-timing';

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
        /** Optional archive handler */
        onArchive?: () => void;
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
        social: Users,     // Social media (Twitter, Instagram, Reddit, etc.)
        movie: Film,       // Movies (IMDB, Letterboxd)
        website: Globe,
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Smart card component that routes to platform-specific renderers.
 */
export function Card({ card, onDelete, onArchive, onRestore, onClick }: CardProps) {
        const platform = detectPlatform(card.url);

        // Route to platform-specific cards
        switch (platform) {
                case 'twitter':
                        return <TwitterCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                case 'instagram':
                        return <InstagramCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                case 'youtube':
                        return <YouTubeCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                case 'reddit':
                        return <RedditCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                case 'letterboxd':
                        return <LetterboxdCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                case 'imdb':
                        return <MovieCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                case 'goodreads':
                        return <GoodreadsCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                case 'amazon':
                        return <AmazonCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                case 'storygraph':
                        return <StoryGraphCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
                default:
                        return <GenericCard card={card} onDelete={onDelete} onArchive={onArchive} onRestore={onRestore} onClick={onClick} />;
        }
}

// =============================================================================
// GENERIC CARD (for unknown platforms)
// =============================================================================

/**
 * Generic card for non-platform-specific content.
 */
function GenericCard({ card, onDelete, onArchive, onRestore, onClick }: CardProps) {
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
                                        {/* Platform/Domain Badge for generic websites */}
                                        {domain && (
                                                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                                                        <Globe className="w-3 h-3 text-white/80" />
                                                        <span className="text-xs font-medium text-white truncate max-w-[100px]">{domain}</span>
                                                </div>
                                        )}
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
                // Skip for social platforms that block screenshots (twitter/x show login walls)
                const isSocialUrl = card.url && (card.url.includes('twitter.com') || card.url.includes('x.com') || card.url.includes('instagram.com'));
                if (hasValidUrl && !screenshotError && !isSocialUrl) {
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
                                        {/* Platform/Domain Badge */}
                                        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                                                <Globe className="w-3 h-3 text-white/80" />
                                                <span className="text-xs font-medium text-white truncate max-w-[100px]">{domain || 'Website'}</span>
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
                                                {decodeHtmlEntities(card.title || 'Add a New Note')}
                                        </h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
                                                {decodeHtmlEntities(card.content?.slice(0, 200) || 'Start typing here...')}
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
                        data-testid="card"
                        data-card-id={card.id}
                        onClick={onClick}
                        className={`
                                group relative flex flex-col overflow-hidden rounded-lg
                                bg-[var(--card-bg)] card-shadow
                                transition-all duration-200
                                hover:card-shadow-hover hover:-translate-y-1
                                physics-press animate-fade-up
                                ${onClick ? 'cursor-pointer' : ''}
                        `}
                        style={{
                                borderLeft: `3px solid ${platformInfo.color}`,
                                transitionTimingFunction: 'var(--ease-snappy)'
                        }}
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
                                                {decodeHtmlEntities(card.title)}
                                        </h3>
                                )}

                                {/* Summary */}
                                {card.metadata.summary && card.type !== 'note' && (
                                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">
                                                {decodeHtmlEntities(card.metadata.summary)}
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
                                        <TagDisplay tags={card.tags} className="pt-2 border-t border-[var(--border)]" />
                                )}
                        </div>

                        {/* Processing Indicator - positioned on left to avoid conflicting with hover actions */}
                        {(() => {
                                const processingState = getProcessingState(card.metadata);
                                // Only show indicator if actively processing (not stuck/failed/idle)
                                if (processingState === 'idle') return null;

                                const handleRetry = async () => {
                                        try {
                                                // Fire enrichment request (don't wait for completion)
                                                // Use keepalive so request continues even if component unmounts
                                                // force: true bypasses idempotency guard for user-initiated retries
                                                fetch('/api/enrich', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ cardId: card.id, force: true }),
                                                        keepalive: true,
                                                }).catch(err => console.error('Enrichment failed:', err));

                                                // Small delay to let the API set processing=true
                                                await new Promise(resolve => setTimeout(resolve, 200));

                                                // Refresh immediately to show "Analyzing" state
                                                router.refresh();
                                        } catch (err) {
                                                console.error('Failed to retry enrichment:', err);
                                        }
                                };

                                return (
                                        <div className="absolute top-2 left-2 z-10">
                                                <AnalyzingIndicator
                                                        variant="dark"
                                                        accentColor={platformInfo.color}
                                                        size="sm"
                                                        startTime={card.metadata?.enrichmentTiming?.startedAt}
                                                        failed={processingState === 'failed' || processingState === 'stuck'}
                                                        onRetry={handleRetry}
                                                />
                                        </div>
                                );
                        })()}

                        {/* Always-visible External Link - bottom right, touch target compliant */}
                        {card.url && (
                                <a
                                        href={card.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute bottom-2 right-2 p-2 md:p-1.5 rounded-full
                                                   bg-[var(--card-bg)]/90 shadow-sm text-[var(--foreground-muted)]
                                                   hover:text-[var(--foreground)] transition-colors z-10
                                                   physics-press touch-target"
                                        aria-label="Open original"
                                >
                                        <ExternalLink className="h-4 w-4 md:h-3.5 md:w-3.5" />
                                </a>
                        )}

                        {/* Hover Actions - touch target compliant */}
                        {isHovered && (
                                <div className="absolute right-2 top-2 flex gap-1.5 animate-scale-in">
                                        {onArchive && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onArchive();
                                                        }}
                                                        className="p-2.5 md:p-2 rounded-lg bg-[var(--card-bg)]/90 shadow-sm
                                                                   text-[var(--foreground-muted)] hover:text-amber-600
                                                                   hover:bg-amber-50 dark:hover:bg-amber-900/20
                                                                   transition-colors physics-press touch-target"
                                                        aria-label="Archive card"
                                                >
                                                        <Archive className="h-4 w-4" />
                                                </button>
                                        )}
                                        {onDelete && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete();
                                                        }}
                                                        className="p-2.5 md:p-2 rounded-lg bg-[var(--card-bg)]/90 shadow-sm
                                                                   text-[var(--foreground-muted)] hover:text-red-600
                                                                   hover:bg-red-50 dark:hover:bg-red-900/20
                                                                   transition-colors physics-press touch-target"
                                                        aria-label="Delete card"
                                                >
                                                        <Trash2 className="h-4 w-4" />
                                                </button>
                                        )}
                                        {onRestore && (
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRestore();
                                                        }}
                                                        className="p-2.5 md:p-2 rounded-lg bg-[var(--card-bg)]/90 shadow-sm
                                                                   text-[var(--foreground-muted)] hover:text-green-600
                                                                   hover:bg-green-50 dark:hover:bg-green-900/20
                                                                   transition-colors physics-press touch-target"
                                                        aria-label="Restore card"
                                                >
                                                        <RotateCcw className="h-4 w-4" />
                                                </button>
                                        )}
                                </div>
                        )}
                </article>
        );
}

export default Card;
