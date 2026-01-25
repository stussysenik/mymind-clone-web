/**
 * Settings Modal Component
 *
 * Full design system customization:
 * - Theme mode (Light/Dark/System)
 * - Accent color customization
 * - Typography (font selection)
 *
 * @fileoverview Design system settings with live preview
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Moon, Sun, Monitor, RotateCcw, Check } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import {
	DesignTokens,
	DEFAULT_TOKENS,
	PRESET_FONTS,
	PRESET_ACCENTS,
	LIGHT_THEME_DEFAULTS,
	DARK_THEME_DEFAULTS,
	loadDesignTokens,
	saveDesignTokens,
	applyDesignTokens,
	darkenColor,
} from '@/lib/design-tokens';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type TabId = 'theme' | 'colors' | 'typography';

// Preset background colors
const PRESET_BACKGROUNDS = [
	{ name: 'Warm Cream', value: '#F7F6F3' },
	{ name: 'Cool White', value: '#FAFAFA' },
	{ name: 'Pure White', value: '#FFFFFF' },
	{ name: 'Soft Gray', value: '#F3F4F6' },
	{ name: 'Warm Sand', value: '#FAF7F2' },
	{ name: 'Soft Pink', value: '#FDF2F8' },
	{ name: 'Soft Blue', value: '#F0F9FF' },
	{ name: 'Soft Green', value: '#F0FDF4' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const [activeTab, setActiveTab] = useState<TabId>('theme');
	const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS);
	const [showColorPicker, setShowColorPicker] = useState(false);
	const [showBgColorPicker, setShowBgColorPicker] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	// Load tokens on mount
	useEffect(() => {
		const loaded = loadDesignTokens();
		setTokens(loaded);
	}, []);

	// Update tokens and apply changes immediately (live preview)
	const updateTokens = useCallback((updates: Partial<DesignTokens>) => {
		setTokens(prev => {
			const newTokens = { ...prev, ...updates };
			// Apply immediately for live preview
			applyDesignTokens(newTokens);
			// Save to localStorage
			saveDesignTokens(newTokens);
			return newTokens;
		});
		setHasChanges(true);
	}, []);

	// Handle theme mode change
	const handleThemeChange = useCallback((mode: 'light' | 'dark' | 'system') => {
		updateTokens({ mode });
	}, [updateTokens]);

	// Handle accent color change
	const handleAccentChange = useCallback((color: string) => {
		const hoverColor = darkenColor(color, 15);
		updateTokens({ accentPrimary: color, accentHover: hoverColor });
	}, [updateTokens]);

	// Handle background color change
	const handleBackgroundChange = useCallback((color: string | null) => {
		updateTokens({ background: color });
	}, [updateTokens]);

	// Handle font changes
	const handleFontSansChange = useCallback((fontValue: string) => {
		updateTokens({ fontSans: fontValue });
	}, [updateTokens]);

	const handleFontSerifChange = useCallback((fontValue: string) => {
		updateTokens({ fontSerif: fontValue });
	}, [updateTokens]);

	// Reset to defaults
	const handleReset = useCallback(() => {
		setTokens(DEFAULT_TOKENS);
		saveDesignTokens(DEFAULT_TOKENS);
		applyDesignTokens(DEFAULT_TOKENS);
		setHasChanges(false);
	}, []);

	if (!isOpen) return null;

	const tabs: { id: TabId; label: string }[] = [
		{ id: 'theme', label: 'Theme' },
		{ id: 'colors', label: 'Colors' },
		{ id: 'typography', label: 'Typography' },
	];

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-200"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
				<div
					className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-[var(--border)] shrink-0">
						<h2 className="text-lg font-serif font-bold text-[var(--foreground)]">
							Settings
						</h2>
						<button
							onClick={onClose}
							className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
							aria-label="Close settings"
						>
							<X className="h-5 w-5 text-[var(--foreground-muted)]" />
						</button>
					</div>

					{/* Tabs */}
					<div className="flex border-b border-[var(--border)] shrink-0">
						{tabs.map(tab => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
									activeTab === tab.id
										? 'text-[var(--accent-primary)]'
										: 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
								}`}
							>
								{tab.label}
								{activeTab === tab.id && (
									<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
								)}
							</button>
						))}
					</div>

					{/* Content */}
					<div className="p-6 overflow-y-auto flex-1">
						{/* Theme Tab */}
						{activeTab === 'theme' && (
							<div className="space-y-6">
								<div>
									<h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4">
										Appearance
									</h3>

									<div className="grid grid-cols-3 gap-3">
										{/* Light */}
										<button
											onClick={() => handleThemeChange('light')}
											className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
												tokens.mode === 'light'
													? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
													: 'border-[var(--border)] hover:border-[var(--border-hover)]'
											}`}
										>
											<Sun className="h-6 w-6 text-[var(--foreground)]" />
											<span className="text-xs font-medium text-[var(--foreground)]">
												Light
											</span>
											{tokens.mode === 'light' && (
												<Check className="h-4 w-4 text-[var(--accent-primary)] absolute top-2 right-2" />
											)}
										</button>

										{/* Dark */}
										<button
											onClick={() => handleThemeChange('dark')}
											className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
												tokens.mode === 'dark'
													? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
													: 'border-[var(--border)] hover:border-[var(--border-hover)]'
											}`}
										>
											<Moon className="h-6 w-6 text-[var(--foreground)]" />
											<span className="text-xs font-medium text-[var(--foreground)]">
												Dark
											</span>
										</button>

										{/* System */}
										<button
											onClick={() => handleThemeChange('system')}
											className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
												tokens.mode === 'system'
													? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
													: 'border-[var(--border)] hover:border-[var(--border-hover)]'
											}`}
										>
											<Monitor className="h-6 w-6 text-[var(--foreground)]" />
											<span className="text-xs font-medium text-[var(--foreground)]">
												System
											</span>
										</button>
									</div>

									{tokens.mode === 'system' && (
										<p className="mt-3 text-xs text-[var(--foreground-muted)]">
											Follows your system preference
										</p>
									)}
								</div>
							</div>
						)}

						{/* Colors Tab */}
						{activeTab === 'colors' && (
							<div className="space-y-6">
								{/* Accent Color */}
								<div>
									<h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4">
										Accent Color
									</h3>

									{/* Preset Colors */}
									<div className="flex flex-wrap gap-2 mb-4">
										{PRESET_ACCENTS.map(preset => (
											<button
												key={preset.name}
												onClick={() => handleAccentChange(preset.primary)}
												className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
													tokens.accentPrimary.toLowerCase() === preset.primary.toLowerCase()
														? 'border-[var(--foreground)] ring-2 ring-offset-2 ring-[var(--accent-primary)]'
														: 'border-[var(--border)]'
												}`}
												style={{ backgroundColor: preset.primary }}
												title={preset.name}
											/>
										))}
									</div>

									{/* Custom Color Picker */}
									<div className="relative">
										<button
											onClick={() => setShowColorPicker(!showColorPicker)}
											className="flex items-center gap-3 w-full p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
										>
											<div
												className="w-8 h-8 rounded-lg border border-[var(--border)]"
												style={{ backgroundColor: tokens.accentPrimary }}
											/>
											<span className="text-sm font-mono text-[var(--foreground)]">
												{tokens.accentPrimary.toUpperCase()}
											</span>
											<span className="text-xs text-[var(--foreground-muted)] ml-auto">
												Custom Color
											</span>
										</button>

										{showColorPicker && (
											<div className="absolute top-full left-0 mt-2 p-4 bg-[var(--card-bg)] rounded-xl shadow-xl border border-[var(--border)] z-10">
												<HexColorPicker
													color={tokens.accentPrimary}
													onChange={handleAccentChange}
												/>
												<button
													onClick={() => setShowColorPicker(false)}
													className="mt-3 w-full py-2 text-sm font-medium bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
												>
													Done
												</button>
											</div>
										)}
									</div>
								</div>

								{/* Background Color */}
								<div>
									<h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4">
										Background Color
									</h3>

									{/* Preset Backgrounds */}
									<div className="flex flex-wrap gap-2 mb-4">
										{PRESET_BACKGROUNDS.map(preset => (
											<button
												key={preset.name}
												onClick={() => handleBackgroundChange(preset.value)}
												className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
													tokens.background?.toLowerCase() === preset.value.toLowerCase()
														? 'border-[var(--foreground)] ring-2 ring-offset-2 ring-[var(--accent-primary)]'
														: 'border-[var(--border)]'
												}`}
												style={{ backgroundColor: preset.value }}
												title={preset.name}
											/>
										))}
									</div>

									{/* Custom Background Picker */}
									<div className="relative">
										<button
											onClick={() => setShowBgColorPicker(!showBgColorPicker)}
											className="flex items-center gap-3 w-full p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
										>
											<div
												className="w-8 h-8 rounded-lg border border-[var(--border)]"
												style={{ backgroundColor: tokens.background || LIGHT_THEME_DEFAULTS.background }}
											/>
											<span className="text-sm font-mono text-[var(--foreground)]">
												{(tokens.background || LIGHT_THEME_DEFAULTS.background).toUpperCase()}
											</span>
											<span className="text-xs text-[var(--foreground-muted)] ml-auto">
												Custom
											</span>
										</button>

										{showBgColorPicker && (
											<div className="absolute top-full left-0 mt-2 p-4 bg-[var(--card-bg)] rounded-xl shadow-xl border border-[var(--border)] z-10">
												<HexColorPicker
													color={tokens.background || LIGHT_THEME_DEFAULTS.background}
													onChange={handleBackgroundChange}
												/>
												<div className="flex gap-2 mt-3">
													<button
														onClick={() => handleBackgroundChange(null)}
														className="flex-1 py-2 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
													>
														Reset
													</button>
													<button
														onClick={() => setShowBgColorPicker(false)}
														className="flex-1 py-2 text-sm font-medium bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
													>
														Done
													</button>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Preview */}
								<div className="p-4 bg-[var(--background-secondary)] rounded-xl">
									<p className="text-xs text-[var(--foreground-muted)] mb-3">Preview</p>
									<div className="flex items-center gap-3">
										<button
											className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
											style={{ backgroundColor: tokens.accentPrimary }}
										>
											Primary Button
										</button>
										<span
											className="px-3 py-1 rounded-full text-xs font-medium"
											style={{
												backgroundColor: `${tokens.accentPrimary}15`,
												color: tokens.accentPrimary,
											}}
										>
											Tag
										</span>
									</div>
								</div>
							</div>
						)}

						{/* Typography Tab */}
						{activeTab === 'typography' && (
							<div className="space-y-6">
								{/* Heading Font */}
								<div>
									<h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-3">
										Headings
									</h3>
									<select
										value={tokens.fontSerif}
										onChange={(e) => handleFontSerifChange(e.target.value)}
										className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
									>
										{PRESET_FONTS.serif.map(font => (
											<option key={font.name} value={font.value}>
												{font.name}
											</option>
										))}
									</select>
									<p
										className="mt-3 text-lg leading-snug"
										style={{ fontFamily: tokens.fontSerif }}
									>
										The quick brown fox jumps over the lazy dog.
									</p>
								</div>

								{/* Body Font */}
								<div>
									<h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-3">
										Body Text
									</h3>
									<select
										value={tokens.fontSans}
										onChange={(e) => handleFontSansChange(e.target.value)}
										className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
									>
										{PRESET_FONTS.sans.map(font => (
											<option key={font.name} value={font.value}>
												{font.name}
											</option>
										))}
									</select>
									<p
										className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]"
										style={{ fontFamily: tokens.fontSans }}
									>
										This is how your body text will look. The quick brown fox jumps over the lazy dog.
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)] rounded-b-2xl flex items-center justify-between shrink-0">
						<button
							onClick={handleReset}
							className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--card-bg)]"
						>
							<RotateCcw className="h-4 w-4" />
							Reset to Defaults
						</button>

						{hasChanges && (
							<span className="text-xs text-green-500 font-medium flex items-center gap-1">
								<Check className="h-3 w-3" />
								Saved
							</span>
						)}
					</div>
				</div>
			</div>
		</>
	);
}

export default SettingsModal;
