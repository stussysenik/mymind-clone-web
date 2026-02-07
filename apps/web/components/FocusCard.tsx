/**
 * MyMind Clone - FocusCard Component
 *
 * Large, centered card for focused exploration in Serendipity mode.
 * Displays a single card prominently with animated transitions.
 *
 * @fileoverview Focused single card display for Serendipity
 */

'use client';

import Image from 'next/image';
import { Globe, Play, StickyNote, FileText, ShoppingBag, BookOpen, Volume2, Film, Users } from 'lucide-react';
import type { Card } from '@/lib/types';
import { extractDomain, isVideoUrl } from '@/lib/platforms';
import { decodeHtmlEntities } from '@/lib/text-utils';

// =============================================================================
// TYPES
// =============================================================================

interface FocusCardProps {
	card: Card;
	onOpenDetail: () => void;
	isAnimating?: boolean;
	direction?: 'left' | 'right';
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
 * Large focused card display for Serendipity exploration mode.
 */
export function FocusCard({ card, onOpenDetail, isAnimating = false, direction = 'right' }: FocusCardProps) {
	const domain = extractDomain(card.url);
	const TypeIcon = TYPE_ICONS[card.type] || Globe;
	const isVideo = card.url ? isVideoUrl(card.url) : false;

	// Generate gradient for cards without images
	const getGradient = (str: string) => {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue1 = Math.abs(hash % 360);
		const hue2 = (hue1 + 40) % 360;
		return `linear-gradient(135deg, hsl(${hue1}, 70%, 90%), hsl(${hue2}, 70%, 95%))`;
	};

	// Animation classes based on direction
	const animationClass = isAnimating
		? direction === 'right'
			? 'animate-slide-in-right'
			: 'animate-slide-in-left'
		: 'animate-in fade-in zoom-in-95 duration-500';

	return (
		<div
			className={`relative mx-auto max-w-3xl cursor-pointer group ${animationClass}`}
			onClick={onOpenDetail}
		>
			{/* Large Image Container */}
			<div className="aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] bg-[var(--surface-secondary)] relative">
				{card.imageUrl ? (
					<>
						{/* Blurred backdrop */}
						<div className="absolute inset-0 overflow-hidden">
							<Image
								src={card.imageUrl}
								alt=""
								fill
								className="object-cover opacity-30 blur-2xl scale-110"
							/>
						</div>
						{/* Main image */}
						<Image
							src={card.imageUrl}
							alt={card.title || 'Card image'}
							fill
							className="object-contain transition-transform duration-500 group-hover:scale-105 relative z-10"
							sizes="(max-width: 768px) 100vw, 60vw"
							priority
						/>
					</>
				) : card.url && !card.url.startsWith('local-') && !card.url.includes('twitter.com') && !card.url.includes('x.com') ? (
					// Screenshot fallback for URLs (skip social platforms that block screenshots)
					<Image
						src={`https://api.microlink.io/?url=${encodeURIComponent(card.url)}&screenshot=true&meta=false&embed=screenshot.url`}
						alt="Site Preview"
						fill
						className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
						sizes="(max-width: 768px) 100vw, 60vw"
						unoptimized
					/>
				) : (
					// Gradient placeholder
					<div
						className="w-full h-full flex items-center justify-center"
						style={{ background: getGradient(card.title || card.type) }}
					>
						<TypeIcon className="h-24 w-24 text-gray-400/50" />
					</div>
				)}

				{/* Video play button overlay */}
				{isVideo && (
					<div className="absolute inset-0 flex items-center justify-center z-20">
						<div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform group-hover:scale-110">
							<Play className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" />
						</div>
					</div>
				)}

				{/* Domain badge */}
				{domain && (
					<div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full z-20">
						<Globe className="w-4 h-4 text-white/80" />
						<span className="text-sm font-medium text-white">{domain}</span>
					</div>
				)}

				{/* Color palette */}
				{card.metadata?.colors && card.metadata.colors.length > 0 && (
					<div className="absolute bottom-4 left-4 flex items-center gap-1.5 z-20">
						{card.metadata.colors.slice(0, 5).map((color: string, i: number) => (
							<div
								key={i}
								className="w-6 h-6 rounded-full border-2 border-white/70 shadow-lg"
								style={{ backgroundColor: color }}
							/>
						))}
					</div>
				)}
			</div>

			{/* Card Info */}
			<div className="mt-6 text-center px-4">
				<h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 leading-tight">
					{decodeHtmlEntities(card.title || 'Untitled')}
				</h2>

				{card.metadata?.summary && (
					<p className="mt-3 text-gray-600 line-clamp-2 max-w-xl mx-auto leading-relaxed">
						{decodeHtmlEntities(card.metadata.summary)}
					</p>
				)}

				{/* Tags */}
				{card.tags.length > 0 && (
					<div className="mt-4 flex justify-center gap-2 flex-wrap">
						{card.tags.slice(0, 5).map(tag => (
							<span
								key={tag}
								className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium"
							>
								{tag}
							</span>
						))}
					</div>
				)}

				{/* Click hint */}
				<div className="mt-6 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
					Click or press Space to view details
				</div>
			</div>
		</div>
	);
}

export default FocusCard;
