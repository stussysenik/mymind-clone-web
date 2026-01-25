/**
 * MyMind Clone - VideoPlayer Component
 *
 * Embedded video player for native-like playback.
 * Supports YouTube, Vimeo, and other embeddable platforms.
 *
 * @fileoverview Video player wrapper component
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Play, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { getYouTubeVideoId, getVideoEmbedUrl } from '@/lib/platforms';

interface VideoPlayerProps {
	url: string;
	thumbnail?: string;
	title?: string;
	autoPlay?: boolean;
	className?: string;
}

export function VideoPlayer({
	url,
	thumbnail,
	title,
	autoPlay = false,
	className = '',
}: VideoPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(autoPlay);
	const [hasError, setHasError] = useState(false);

	// Get the embed URL
	const embedUrl = useMemo(() => {
		const baseEmbed = getVideoEmbedUrl(url);
		if (!baseEmbed) return null;

		// Add autoplay parameter if needed
		const separator = baseEmbed.includes('?') ? '&' : '?';
		return isPlaying ? `${baseEmbed}${separator}autoplay=1` : baseEmbed;
	}, [url, isPlaying]);

	const handlePlay = useCallback(() => {
		setIsPlaying(true);
	}, []);

	const handleError = useCallback(() => {
		setHasError(true);
	}, []);

	// If we can't create an embed URL or there's an error, show fallback
	if (!embedUrl || hasError) {
		return (
			<div className={`relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900 flex flex-col items-center justify-center ${className}`}>
				{thumbnail && (
					<Image
						src={thumbnail}
						alt={title || 'Video thumbnail'}
						fill
						className="object-cover opacity-30"
					/>
				)}
				<div className="relative z-10 text-center p-6">
					<p className="text-white/80 mb-4">Video cannot be played inline</p>
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
					>
						<Play className="w-4 h-4" />
						Watch on {getDomainName(url)}
					</a>
				</div>
			</div>
		);
	}

	// Show thumbnail overlay if not playing yet
	if (!isPlaying && thumbnail) {
		return (
			<div
				className={`relative aspect-video w-full rounded-lg overflow-hidden bg-black cursor-pointer group ${className}`}
				onClick={handlePlay}
			>
				<Image
					src={thumbnail}
					alt={title || 'Video thumbnail'}
					fill
					className="object-cover transition-transform duration-300 group-hover:scale-105"
				/>
				{/* Dark overlay */}
				<div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

				{/* Play button */}
				<div className="absolute inset-0 flex items-center justify-center">
					<button
						className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
						aria-label="Play video"
					>
						<Play className="w-7 h-7 md:w-8 md:h-8 text-gray-900 ml-1" fill="currentColor" />
					</button>
				</div>

				{/* Video title overlay */}
				{title && (
					<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
						<p className="text-white text-sm font-medium line-clamp-2">{title}</p>
					</div>
				)}
			</div>
		);
	}

	// Show the iframe player
	return (
		<div className={`relative aspect-video w-full rounded-lg overflow-hidden bg-black ${className}`}>
			<iframe
				src={embedUrl}
				title={title || 'Video player'}
				className="absolute inset-0 w-full h-full"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowFullScreen
				onError={handleError}
			/>

			{/* External link button */}
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors opacity-0 hover:opacity-100 focus:opacity-100"
				aria-label="Open in new tab"
			>
				<ExternalLinkIcon className="w-4 h-4" />
			</a>
		</div>
	);
}

/**
 * Compact video player for inline use (e.g., in cards)
 */
export function VideoPlayerCompact({
	url,
	thumbnail,
	onClick,
}: {
	url: string;
	thumbnail?: string;
	onClick?: () => void;
}) {
	return (
		<div
			className="relative aspect-video w-full rounded-lg overflow-hidden bg-black cursor-pointer group"
			onClick={onClick}
		>
			{thumbnail ? (
				<Image
					src={thumbnail}
					alt="Video thumbnail"
					fill
					className="object-cover"
				/>
			) : (
				<div className="w-full h-full bg-gray-800" />
			)}

			{/* Play icon overlay */}
			<div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
				<div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
					<Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
				</div>
			</div>
		</div>
	);
}

// Helper to get domain name for display
function getDomainName(url: string): string {
	try {
		const hostname = new URL(url).hostname;
		if (hostname.includes('youtube')) return 'YouTube';
		if (hostname.includes('vimeo')) return 'Vimeo';
		if (hostname.includes('twitch')) return 'Twitch';
		return hostname.replace('www.', '');
	} catch {
		return 'source';
	}
}

export default VideoPlayer;
