/**
 * MyMind Clone - YouTube Card Component
 *
 * Renders YouTube videos with thumbnail and play button.
 *
 * @fileoverview YouTube card with red accent
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Trash2, Archive, Globe } from 'lucide-react';
import type { Card } from '@/lib/types';
import { TagDisplay } from '../TagDisplay';
import { AnalyzingIndicator } from '../AnalyzingIndicator';
import { CardActions, ExternalLinkButton } from './CardActions';
import { AuthorDisplay } from '../AuthorDisplay';

// =============================================================================
// TYPES
// =============================================================================

interface YouTubeCardProps {
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
 * YouTube style card for videos.
 */
export function YouTubeCard({ card, onDelete, onArchive, onRestore, onClick }: YouTubeCardProps) {
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	// Use new author fields if available, fallback to legacy
	const authorName = card.metadata.authorName || card.metadata.author || 'YouTube';
	const authorHandle = card.metadata.authorHandle || '';
	const viewCount = card.metadata.viewCount;

	return (
		<article
			className={`relative overflow-hidden rounded-lg bg-white card-shadow border-l-[3px] border-red-600 ${onClick ? 'cursor-pointer' : ''}`}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Thumbnail */}
			<div className="relative aspect-video w-full overflow-hidden bg-gray-900">
				{card.imageUrl && !imageError ? (
					<Image
						src={card.imageUrl}
						alt={card.title || 'YouTube video'}
						fill
						sizes="(max-width: 640px) 100vw, 400px"
						className="object-cover"
						loading="lazy"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gray-900">
						<svg className="h-12 w-12 text-red-600" viewBox="0 0 24 24" fill="currentColor">
							<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
						</svg>
					</div>
				)}

				{/* Play Button Overlay */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/90 shadow-lg transition-transform hover:scale-110">
						<Play className="h-6 w-6 text-white ml-0.5" fill="currentColor" />
					</div>
				</div>

				{/* Duration Badge (if available) */}
				{card.metadata.duration && (
					<div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
						{card.metadata.duration}
					</div>
				)}

				{/* Processing Indicator */}
				{card.metadata?.processing && (
					<div className="absolute left-2 top-2 z-20">
						<AnalyzingIndicator variant="dark" accentColor="#FF0000" size="sm" />
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

				{/* Always-visible External Link - bottom right for consistency */}
				{card.url && (
					<ExternalLinkButton url={card.url} variant="dark" position="bottom-right" />
				)}

				{/* Hover Actions */}
				<CardActions
					isHovered={isHovered}
					onArchive={onArchive}
					onDelete={onDelete}
					onRestore={onRestore}
					variant="dark"
				/>
			</div>

			{/* Content */}
			<div className="p-3">
				{/* Title */}
				<h3 className="mb-1 text-sm font-medium text-[var(--foreground)] line-clamp-2 leading-snug">
					{card.title}
				</h3>

				{/* Channel & Views */}
				<div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
					<span className="font-medium">{authorName}</span>
					{authorHandle && (
						<>
							<span className="text-[var(--foreground-muted)]">@{authorHandle}</span>
						</>
					)}
					{viewCount && (
						<>
							<span>•</span>
							<span>{viewCount} views</span>
						</>
					)}
				</div>

				{/* Added Date */}
				<div className="mt-1 text-xs text-[var(--foreground-muted)]">
					Added {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</div>

				{/* Domain Link */}
				<div className="flex items-center gap-1.5 mt-1">
					<Globe className="w-3 h-3 text-[var(--foreground-muted)]" />
					<span className="text-xs text-[var(--accent-primary)] truncate">youtube.com</span>
				</div>

				{/* Tags */}
				{card.tags.length > 0 && (
					<TagDisplay tags={card.tags} className="mt-2 pt-2 border-t border-[var(--border)]" />
				)}
			</div>
		</article>
	);
}

export default YouTubeCard;
