/**
 * MyMind Clone - ExternalLink Component
 *
 * Smart external link component that provides app-like navigation
 * with return-to-app context tracking.
 *
 * @fileoverview External link with navigation context
 */

'use client';

import { useCallback, ReactNode } from 'react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { detectPlatform, getPlatformInfo } from '@/lib/platforms';

interface ExternalLinkProps {
	/** Target URL */
	url: string;
	/** Child elements to render inside the link */
	children?: ReactNode;
	/** Additional CSS classes */
	className?: string;
	/** Show external link icon */
	showIcon?: boolean;
	/** Icon size (when showIcon is true) */
	iconSize?: 'sm' | 'md' | 'lg';
	/** Callback when link is clicked (before navigation) */
	onClick?: (e: React.MouseEvent) => void;
	/** Whether to stop event propagation */
	stopPropagation?: boolean;
	/** Aria label for accessibility */
	ariaLabel?: string;
	/** Whether to track for return context */
	trackReturn?: boolean;
}

/**
 * Context storage key for tracking last viewed card
 */
const LAST_VIEW_KEY = 'mymind_last_card_view';

/**
 * Stores the current context for return navigation
 */
function storeReturnContext(url: string): void {
	if (typeof window === 'undefined') return;

	try {
		sessionStorage.setItem(LAST_VIEW_KEY, JSON.stringify({
			url: window.location.href,
			timestamp: Date.now(),
			externalUrl: url,
		}));
	} catch {
		// SessionStorage might be unavailable in some contexts
	}
}

/**
 * Gets stored return context (if any)
 */
export function getReturnContext(): {
	url: string;
	timestamp: number;
	externalUrl: string;
} | null {
	if (typeof window === 'undefined') return null;

	try {
		const stored = sessionStorage.getItem(LAST_VIEW_KEY);
		if (!stored) return null;

		const context = JSON.parse(stored);
		// Only return if it's recent (within 30 minutes)
		if (Date.now() - context.timestamp > 30 * 60 * 1000) {
			sessionStorage.removeItem(LAST_VIEW_KEY);
			return null;
		}

		return context;
	} catch {
		return null;
	}
}

/**
 * Clears return context
 */
export function clearReturnContext(): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.removeItem(LAST_VIEW_KEY);
	} catch {
		// Ignore
	}
}

/**
 * ExternalLink component with smart navigation tracking
 */
export function ExternalLink({
	url,
	children,
	className = '',
	showIcon = false,
	iconSize = 'sm',
	onClick,
	stopPropagation = true,
	ariaLabel,
	trackReturn = true,
}: ExternalLinkProps) {
	const handleClick = useCallback((e: React.MouseEvent) => {
		if (stopPropagation) {
			e.stopPropagation();
		}

		// Store return context for potential "return to MyMind" feature
		if (trackReturn) {
			storeReturnContext(url);
		}

		// Call custom onClick handler if provided
		onClick?.(e);

		// Note: We don't prevent default - let the link navigate naturally
	}, [url, stopPropagation, trackReturn, onClick]);

	const iconSizeClass = {
		sm: 'w-3.5 h-3.5',
		md: 'w-4 h-4',
		lg: 'w-5 h-5',
	}[iconSize];

	// Generate default aria label if not provided
	const defaultAriaLabel = ariaLabel || `Open ${getDomainForLabel(url)} in new tab`;

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			onClick={handleClick}
			className={className}
			aria-label={defaultAriaLabel}
		>
			{children}
			{showIcon && (
				<ExternalLinkIcon className={`${iconSizeClass} inline-block ml-1 opacity-60`} />
			)}
		</a>
	);
}

/**
 * ExternalLink button variant - styled as a button
 */
export function ExternalLinkButton({
	url,
	children,
	className = '',
	variant = 'default',
	size = 'md',
	...props
}: ExternalLinkProps & {
	variant?: 'default' | 'primary' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
}) {
	const variantClasses = {
		default: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
		primary: 'bg-[var(--accent-primary)] text-white hover:opacity-90',
		ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
	}[variant];

	const sizeClasses = {
		sm: 'px-2.5 py-1.5 text-xs',
		md: 'px-3 py-2 text-sm',
		lg: 'px-4 py-2.5 text-base',
	}[size];

	return (
		<ExternalLink
			url={url}
			className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors ${variantClasses} ${sizeClasses} ${className}`}
			showIcon
			{...props}
		>
			{children}
		</ExternalLink>
	);
}

/**
 * Platform-aware external link with icon and styling
 */
export function PlatformLink({
	url,
	className = '',
	showPlatformIcon = true,
	...props
}: ExternalLinkProps & {
	showPlatformIcon?: boolean;
}) {
	const platform = detectPlatform(url);
	const platformInfo = getPlatformInfo(platform);

	return (
		<ExternalLink
			url={url}
			className={`inline-flex items-center gap-1.5 text-sm hover:underline ${className}`}
			ariaLabel={`Open on ${platformInfo.name}`}
			{...props}
		>
			{showPlatformIcon && platformInfo.icon && (
				<span className="text-base">{platformInfo.icon}</span>
			)}
			<span style={{ color: platformInfo.color }}>
				{platformInfo.name}
			</span>
			<ExternalLinkIcon className="w-3 h-3 opacity-50" />
		</ExternalLink>
	);
}

// Helper to get domain name for aria label
function getDomainForLabel(url: string): string {
	try {
		const hostname = new URL(url).hostname;
		if (hostname.includes('youtube')) return 'YouTube';
		if (hostname.includes('twitter') || hostname.includes('x.com')) return 'X';
		if (hostname.includes('instagram')) return 'Instagram';
		if (hostname.includes('reddit')) return 'Reddit';
		if (hostname.includes('imdb')) return 'IMDB';
		if (hostname.includes('letterboxd')) return 'Letterboxd';
		if (hostname.includes('amazon')) return 'Amazon';
		if (hostname.includes('goodreads')) return 'Goodreads';
		if (hostname.includes('wikipedia')) return 'Wikipedia';
		return hostname.replace('www.', '');
	} catch {
		return 'link';
	}
}

export default ExternalLink;
