/**
 * MyMind Clone - Twitter/X Card Component
 *
 * Renders tweets in a distinctive Twitter/X style.
 *
 * @fileoverview Twitter card with X branding
 */

'use client';

import Image from 'next/image';
import { ExternalLink, Trash2, RotateCcw, Loader2, Archive, Globe } from 'lucide-react';
import { useState } from 'react';
import type { Card } from '@/lib/types';
import { TagDisplay } from '../TagDisplay';
import { decodeHtmlEntities } from '@/lib/text-utils';

// =============================================================================
// TYPES
// =============================================================================

interface TwitterCardProps {
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
 * Twitter/X style card for tweets.
 */
export function TwitterCard({ card, onDelete, onArchive, onRestore, onClick }: TwitterCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [imageError, setImageError] = useState(false);
	// Use new author fields if available, fallback to legacy
	const authorName = card.metadata.authorName || card.metadata.author || '';
	const authorHandle = card.metadata.authorHandle || '';
	const authorAvatar = card.metadata.authorAvatar || '';
	// Decode HTML entities that may have been encoded by the scraper/API
	const tweetText = decodeHtmlEntities(card.content || card.title || '');
	// Multi-image support
	const tweetImages = card.metadata.images as string[] | undefined;
	const imageCount = tweetImages?.length ?? (card.imageUrl ? 1 : 0);
	const hasImage = card.imageUrl && !imageError;

	return (
		<article
			className={`relative flex flex-col overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-card)] card-shadow border-l-[3px] border-black ${onClick ? 'cursor-pointer' : ''}`}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3 p-3 pb-2">
				{/* Domain Badge - First (Source) - fixed width, doesn't shrink */}
				{card.url && (
					<div className="flex-shrink-0 flex items-center gap-1.5 rounded-md bg-black/80 px-2 py-1">
						<Globe className="w-3 h-3 text-white/80 flex-shrink-0" />
						<span className="text-xs font-medium text-white">
							{new URL(card.url).hostname.replace('www.', '')}
						</span>
					</div>
				)}
				{/* Author - Name + Avatar on right - can shrink/truncate */}
				<div className="flex items-center gap-2 min-w-0">
					<div className="flex flex-col items-end min-w-0">
						<span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[140px]">
							{authorName || authorHandle || 'Unknown'}
						</span>
						{authorHandle && (
							<span className="text-xs text-[var(--foreground-muted)] truncate max-w-[140px]">
								@{authorHandle}
							</span>
						)}
					</div>
					{/* Avatar or X Logo fallback */}
					{authorAvatar ? (
						<Image
							src={authorAvatar}
							alt={authorName || 'Author'}
							width={36}
							height={36}
							className="rounded-full object-cover flex-shrink-0"
						/>
					) : (
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-black flex-shrink-0">
							<svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
							</svg>
						</div>
					)}
				</div>
			</div>

			{/* Tweet Content */}
			<div className="px-3 pb-2">
				<p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
					{tweetText}
				</p>
			</div>

			{/* Image if exists - with multi-image badge and error handling */}
			{hasImage && (
				<div className="relative aspect-video w-full overflow-hidden border-t border-[var(--border)]">
					<Image
						src={card.imageUrl!}
						alt="Tweet media"
						fill
						sizes="(max-width: 640px) 100vw, 400px"
						className="object-cover"
						loading="lazy"
						onError={() => setImageError(true)}
					/>
					{/* Multi-image count badge */}
					{imageCount > 1 && (
						<div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 backdrop-blur-sm">
							<svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
								<path d="M3 9h18" />
								<path d="M9 3v18" />
							</svg>
							<span className="text-[10px] font-medium text-white">{imageCount}</span>
						</div>
					)}
				</div>
			)}

			{/* Footer with Title + Date */}
			<div className="flex flex-col gap-1 px-3 py-2 border-t border-[var(--border)]">
				{card.title && (
					<h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 leading-snug">
						{decodeHtmlEntities(card.title)}
					</h3>
				)}
				<div className="text-xs text-[var(--foreground-muted)]">
					Added {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</div>
				{/* Domain Link */}
				{card.url && (
					<div className="flex items-center gap-1.5">
						<Globe className="w-3 h-3 text-[var(--foreground-muted)]" />
						<span className="text-xs text-[var(--accent-primary)] truncate">
							{new URL(card.url).hostname.replace('www.', '')}
						</span>
					</div>
				)}
			</div>

			{/* Tags */}
			{card.tags.length > 0 && (
				<TagDisplay tags={card.tags} className="px-3 pb-3" />
			)}

			{/* Processing Indicator */}
			{card.metadata?.processing && (
				<div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium animate-pulse">
					<Loader2 className="h-3 w-3 animate-spin" />
					Analyzing...
				</div>
			)}

			{/* Always-visible External Link */}
			{card.url && (
				<a
					href={card.url}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(e) => e.stopPropagation()}
					className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/90 shadow-sm text-gray-400 hover:text-gray-600 transition-colors z-10"
					aria-label="Open original"
				>
					<ExternalLink className="h-3.5 w-3.5" />
				</a>
			)}

			{/* Hover Actions */}
			{isHovered && (
				<div className="absolute right-2 top-2 flex gap-1">
					{onArchive && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onArchive();
							}}
							className="p-1.5 rounded-md bg-white/90 shadow-sm text-gray-600 hover:text-amber-600 transition-colors"
							aria-label="Archive card"
						>
							<div className="flex items-center justify-center">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<rect width="20" height="5" x="2" y="3" rx="1" />
									<path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
									<path d="M10 12h4" />
								</svg>
							</div>
						</button>
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

export default TwitterCard;
