/**
 * MyMind Clone - Author Display Component
 *
 * Shared component for displaying author information consistently
 * across social media cards (Twitter, Instagram, YouTube, Reddit, TikTok).
 *
 * @fileoverview Consistent author display with avatar, name, and handle
 */

'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface AuthorDisplayProps {
	/** Author's display name (e.g., "Elon Musk") */
	name?: string;
	/** Author's handle/username without @ (e.g., "elonmusk") */
	handle?: string;
	/** Author's profile avatar URL */
	avatarUrl?: string;
	/** Size variant for the component */
	size?: 'sm' | 'md' | 'lg';
	/** Platform for styling the fallback icon */
	platform?: 'twitter' | 'instagram' | 'youtube' | 'reddit' | 'tiktok' | 'default';
	/** Custom class name for the container */
	className?: string;
	/** Whether to show the @ symbol before the handle */
	showAtSymbol?: boolean;
	/** Handle prefix for platforms like Reddit (u/) */
	handlePrefix?: string;
}

// =============================================================================
// SIZE CONFIGURATIONS
// =============================================================================

const sizeConfig = {
	sm: {
		avatar: 'h-6 w-6',
		avatarImg: 24,
		name: 'text-sm',
		handle: 'text-xs',
		icon: 'h-3 w-3',
		gap: 'gap-2',
	},
	md: {
		avatar: 'h-8 w-8',
		avatarImg: 32,
		name: 'text-sm',
		handle: 'text-xs',
		icon: 'h-4 w-4',
		gap: 'gap-2',
	},
	lg: {
		avatar: 'h-10 w-10',
		avatarImg: 40,
		name: 'text-base',
		handle: 'text-sm',
		icon: 'h-5 w-5',
		gap: 'gap-3',
	},
};

const platformColors = {
	twitter: 'bg-black text-white',
	instagram: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white',
	youtube: 'bg-red-600 text-white',
	reddit: 'bg-[#FF4500] text-white',
	tiktok: 'bg-black text-white',
	default: 'bg-gray-200 text-gray-600',
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * AuthorDisplay - Shared component for consistent author rendering
 */
export function AuthorDisplay({
	name,
	handle,
	avatarUrl,
	size = 'md',
	platform = 'default',
	className = '',
	showAtSymbol = true,
	handlePrefix = '',
}: AuthorDisplayProps) {
	const [imageError, setImageError] = useState(false);
	const config = sizeConfig[size];

	// Determine display name and handle
	const displayName = name || handle || 'Unknown';
	const displayHandle = handle ? `${handlePrefix}${showAtSymbol ? '@' : ''}${handle}` : '';

	// Don't show handle if it's the same as the name
	const showHandle = displayHandle && displayName.toLowerCase() !== handle?.toLowerCase();

	return (
		<div className={`flex items-center ${config.gap} ${className}`}>
			{/* Avatar */}
			<div className={`relative ${config.avatar} flex-shrink-0 overflow-hidden rounded-full`}>
				{avatarUrl && !imageError ? (
					<Image
						src={avatarUrl}
						alt={`${displayName}'s avatar`}
						width={config.avatarImg}
						height={config.avatarImg}
						className="object-cover rounded-full"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className={`flex h-full w-full items-center justify-center rounded-full ${platformColors[platform]}`}>
						<User className={config.icon} />
					</div>
				)}
			</div>

			{/* Name and Handle */}
			<div className="flex flex-col min-w-0">
				<span className={`font-medium text-[var(--foreground)] truncate ${config.name}`}>
					{displayName}
				</span>
				{showHandle && (
					<span className={`text-[var(--foreground-muted)] truncate ${config.handle}`}>
						{displayHandle}
					</span>
				)}
			</div>
		</div>
	);
}

export default AuthorDisplay;
