/**
 * MyMind Clone - Instagram Card Component
 *
 * Renders Instagram posts and reels with distinctive styling.
 *
 * @fileoverview Instagram card with gradient and play button
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Instagram, Globe } from 'lucide-react';
import type { Card } from '@/lib/types';
import { TagDisplay } from '../TagDisplay';
import { AnalyzingIndicator } from '../AnalyzingIndicator';
import { AuthorDisplay } from '../AuthorDisplay';

// =============================================================================
// TYPES
// =============================================================================

interface InstagramCardProps {
	card: Card;
	onDelete?: () => void;
	onArchive?: () => void;
	onRestore?: () => void;
	onClick?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Instagram style card for posts and reels.
 */
export function InstagramCard({ card, onDelete, onArchive, onRestore, onClick }: InstagramCardProps) {
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const isReel = card.url?.includes('/reel/') || card.url?.includes('/reels/');
	// Use new author fields if available, fallback to legacy
	const authorName = card.metadata.authorName || '';
	const authorHandle = card.metadata.authorHandle || card.metadata.author?.replace('@', '') || '';
	const authorAvatar = card.metadata.authorAvatar || '';

	// Video detection from new metadata fields
	const videoPositions = card.metadata.videoPositions || [];
	const hasVideos = videoPositions.length > 0 || isReel;
	const videoCount = videoPositions.length || (isReel ? 1 : 0);
	const imageCount = (card.metadata.images?.length || 1) - videoCount;

	return (
		<article
			className={`relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-card)] card-shadow border-l-[3px] border-[#E4405F] ${onClick ? 'cursor-pointer' : ''}`}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Image Container - Square aspect ratio for Instagram */}
			<div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
				{card.imageUrl && !imageError ? (
					<Image
						src={card.imageUrl}
						alt={card.title || 'Instagram post'}
						fill
						sizes="(max-width: 640px) 100vw, 400px"
						className="object-cover"
						loading="lazy"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<Instagram className="h-16 w-16 text-white/80" />
					</div>
				)}

				{/* Processing Indicator */}
				{card.metadata?.processing && (
					<div className="absolute left-2 top-2 z-20">
						<AnalyzingIndicator variant="glass" accentColor="#E4405F" size="sm" />
					</div>
				)}

				{/* Domain Badge - only show when not processing */}
				{!card.metadata?.processing && card.url && (
					<div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
						<Globe className="w-3 h-3 text-white/80" />
						<span className="text-xs font-medium text-white truncate max-w-[120px]">
							{new URL(card.url).hostname.replace('www.', '')}
						</span>
					</div>
				)}

				{/* Carousel Indicator Badge */}
				{card.metadata.images && card.metadata.images.length > 1 && (
					<div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 backdrop-blur-sm z-10">
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
							<rect width="18" height="18" x="3" y="3" rx="2" />
							<path d="M7 3v18" />
							<path d="M17 3v18" />
						</svg>
						<span className="text-xs font-medium text-white">1/{card.metadata.images.length}</span>
						{hasVideos && (
							<span className="ml-1 text-xs text-orange-400">
								{videoCount === 1 ? '1 video' : `${videoCount} videos`}
							</span>
						)}
					</div>
				)}

				{/* Video Badge for Reels or posts with videos (when not a carousel) */}
				{hasVideos && (!card.metadata.images || card.metadata.images.length <= 1) && (
					<div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 backdrop-blur-sm z-10">
						<Play className="w-3 h-3 text-orange-400" fill="currentColor" />
						<span className="text-xs font-medium text-orange-400">Video</span>
					</div>
				)}

				{/* Play Button for Reels */}
				{isReel && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
							<Play className="h-6 w-6 text-gray-800 ml-0.5" fill="currentColor" />
						</div>
					</div>
				)}

				{/* Gradient Overlay */}
				<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

				{/* Always-visible External Link - 44px touch target on mobile */}
				{card.url && (
					<a
						href={card.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						className="absolute bottom-2 right-2 p-2.5 sm:p-1.5 rounded-full bg-white/90 shadow-sm text-gray-400 hover:text-gray-600 transition-colors z-10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
						aria-label="Open original"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3.5 sm:h-3.5">
							<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
							<polyline points="15 3 21 3 21 9" />
							<line x1="10" x2="21" y1="14" y2="3" />
						</svg>
					</a>
				)}

				{/* Hover Actions - 44px touch targets on mobile */}
				{isHovered && (
					<div className="absolute right-2 top-2 flex gap-1 z-20">
						{onArchive && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									onArchive();
								}}
								className="p-2.5 sm:p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-amber-400 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
								aria-label="Archive card"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3.5 sm:h-3.5">
									<rect width="20" height="5" x="2" y="3" rx="1" />
									<path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
									<path d="M10 12h4" />
								</svg>
							</button>
						)}
						{onDelete && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
								className="p-2.5 sm:p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-red-400 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
								aria-label="Delete card"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3.5 sm:h-3.5">
									<path d="M3 6h18" />
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
									<path d="M8 6V4c0-1 1-1 1-1h6c1 0 1 1 1 1v2" />
								</svg>
							</button>
						)}
						{onRestore && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									onRestore();
								}}
								className="p-2.5 sm:p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 hover:text-green-400 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
								aria-label="Restore card"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-3.5 sm:h-3.5">
									<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
									<path d="M3 3v5h5" />
								</svg>
							</button>
						)}
					</div>
				)}
			</div>

			{/* Content */}
			<div className="p-3">
				{/* Author */}
				<div className="mb-2">
					{authorHandle || authorName ? (
						<AuthorDisplay
							name={authorName || authorHandle}
							handle={authorHandle}
							avatarUrl={authorAvatar}
							platform="instagram"
							size="sm"
						/>
					) : (
						<div className="flex items-center gap-2">
							<div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
								<div className="flex h-full w-full items-center justify-center rounded-full bg-white">
									<span className="text-[8px] font-semibold text-pink-500">IG</span>
								</div>
							</div>
							<span className="text-sm font-medium text-[var(--foreground)]">
								Instagram
							</span>
						</div>
					)}
				</div>

				{/* Title (AI-generated summary) */}
				{card.title && (
					<h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 leading-snug mb-1">
						{card.title}
					</h3>
				)}

				{/* Caption - only show if no title */}
				{card.content && !card.title && (
					<p className="text-sm text-[var(--foreground-muted)] line-clamp-3">
						{card.content}
					</p>
				)}

				{/* Date */}
				<div className="mt-2 text-xs text-[var(--foreground-muted)]">
					Added {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</div>
				{/* Domain Link */}
				<div className="flex items-center gap-1.5 mt-1">
					<Globe className="w-3 h-3 text-[var(--foreground-muted)]" />
					<span className="text-xs text-[var(--accent-primary)] truncate">instagram.com</span>
				</div>

				{/* Tags */}
				{card.tags && card.tags.length > 0 && (
					<TagDisplay tags={card.tags} className="mt-2 pt-2 border-t border-[var(--border)]" />
				)}
			</div>
		</article>
	);
}

export default InstagramCard;
