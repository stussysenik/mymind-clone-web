/**
 * MyMind Clone - Amazon Card Component
 *
 * Renders products from Amazon with price and Prime badge.
 * Orange accent matching Amazon brand.
 *
 * @fileoverview Amazon product card
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Trash2, Package, Star } from 'lucide-react';
import type { Card } from '@/lib/types';
import { TagDisplay } from '../TagDisplay';

interface AmazonCardProps {
	card: Card;
	onDelete?: () => void;
	onArchive?: () => void;
	onRestore?: () => void;
	onClick?: () => void;
}

export function AmazonCard({ card, onDelete, onClick }: AmazonCardProps) {
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const price = card.metadata.price;
	const rating = card.metadata.rating;

	return (
		<article
			className={`relative overflow-hidden rounded-lg bg-white card-shadow border-l-[3px] border-[#FF9900] ${onClick ? 'cursor-pointer' : ''}`}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Product Image */}
			<div className="relative aspect-square w-full overflow-hidden bg-gray-50">
				{card.imageUrl && !imageError ? (
					<Image
						src={card.imageUrl}
						alt={card.title || 'Product image'}
						fill
						sizes="(max-width: 640px) 100vw, 300px"
						className="object-contain p-4"
						loading="lazy"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gray-50">
						<Package className="h-12 w-12 text-[#FF9900]/40" />
					</div>
				)}

				{/* Amazon Badge */}
				<div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-[#232F3E] px-2 py-1">
					<svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FF9900">
						<path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705a.66.66 0 01-.753.077c-1.06-.878-1.25-1.286-1.828-2.123-1.748 1.783-2.988 2.317-5.251 2.317-2.683 0-4.773-1.656-4.773-4.968 0-2.586 1.4-4.348 3.395-5.208 1.727-.756 4.14-.89 5.982-1.098v-.411c0-.753.058-1.642-.385-2.292-.385-.579-1.124-.818-1.774-.818-1.205 0-2.277.618-2.54 1.897-.054.285-.261.566-.549.58l-3.065-.33c-.259-.058-.548-.268-.474-.665C5.73 2.11 8.253.853 10.502.853c1.155 0 2.663.307 3.577 1.18 1.155 1.075 1.041 2.507 1.041 4.068v3.683c0 1.107.46 1.593 1.155 2.192.241.17.295.48.016.64-.733.612-2.037 1.747-2.755 2.386l-.005-.003-.387-.197z" />
					</svg>
					<span className="text-xs font-medium text-white">Amazon</span>
				</div>

				{/* Prime Badge (if applicable) */}
				{price && (
					<div className="absolute bottom-2 right-2 rounded bg-[#232F3E] px-2 py-1">
						<span className="text-sm font-bold text-[#FF9900]">{price}</span>
					</div>
				)}

				{/* Always-visible External Link */}
				{card.url && (
					<a
						href={card.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						className="absolute bottom-10 left-2 p-1.5 rounded-full bg-white/90 shadow-sm text-gray-400 hover:text-gray-600 transition-colors z-10"
						aria-label="Open original"
					>
						<ExternalLink className="h-3.5 w-3.5" />
					</a>
				)}

				{/* Hover Actions */}
				{isHovered && (
					<div className="absolute right-2 top-2 flex gap-1 z-20">
						{onDelete && (
							<button
								onClick={(e) => { e.stopPropagation(); onDelete(); }}
								className="p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
								aria-label="Delete card"
							>
								<Trash2 className="h-4 w-4 text-gray-600 hover:text-red-500" />
							</button>
						)}
					</div>
				)}
			</div>

			{/* Content */}
			<div className="p-3">
				<h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 leading-snug">
					{card.title}
				</h3>
				{rating && (
					<div className="flex items-center gap-1 mt-1">
						<Star className="h-3 w-3 text-[#FF9900] fill-[#FF9900]" />
						<span className="text-xs text-[var(--foreground-muted)]">{rating}</span>
					</div>
				)}
				{/* Added Date */}
				<div className="mt-1 text-xs text-[var(--foreground-muted)]">
					Added {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</div>
				{/* Tags */}
				{card.tags && card.tags.length > 0 && (
					<TagDisplay tags={card.tags} className="mt-2 pt-2 border-t border-[var(--border)]" />
				)}
			</div>
		</article>
	);
}

export default AmazonCard;
