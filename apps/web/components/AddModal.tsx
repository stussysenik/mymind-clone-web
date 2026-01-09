/**
 * MyMind Clone - Add Modal Component
 * 
 * Modal for adding new URLs, notes, or images.
 * Auto-detects platform from URL and shows preview.
 * 
 * @fileoverview Modal for adding new cards
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Link2, StickyNote, Image as ImageIcon, Loader2, Globe, Sparkles, Upload } from 'lucide-react';
import { detectPlatform, getPlatformInfo } from '@/lib/platforms';

// =============================================================================
// TYPES
// =============================================================================

type TabType = 'link' | 'note' | 'image';

interface AddModalProps {
        isOpen: boolean;
        onClose: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Modal for adding new items to the collection.
 */
export function AddModal({ isOpen, onClose }: AddModalProps) {
        const [activeTab, setActiveTab] = useState<TabType>('link');
        const [url, setUrl] = useState('');
        const [noteTitle, setNoteTitle] = useState('');
        const [noteContent, setNoteContent] = useState('');
        const [imageFile, setImageFile] = useState<File | null>(null);
        const [imagePreview, setImagePreview] = useState<string | null>(null);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [error, setError] = useState<string | null>(null);

        const inputRef = useRef<HTMLInputElement>(null);
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

        // Focus input when modal opens
        useEffect(() => {
                if (isOpen) {
                        setTimeout(() => {
                                if (activeTab === 'link') {
                                        inputRef.current?.focus();
                                } else if (activeTab === 'note') {
                                        textareaRef.current?.focus();
                                }
                        }, 100);
                }
        }, [isOpen, activeTab]);

        // Reset state on close
        useEffect(() => {
                if (!isOpen) {
                        setUrl('');
                        setNoteTitle('');
                        setNoteContent('');
                        setImageFile(null);
                        setImagePreview(null);
                        setError(null);
                        setActiveTab('link');
                }
        }, [isOpen]);

        // Keyboard shortcuts
        useEffect(() => {
                const handleKeyDown = (e: KeyboardEvent) => {
                        if (e.key === 'Escape') {
                                onClose();
                        }
                };

                if (isOpen) {
                        document.addEventListener('keydown', handleKeyDown);
                        return () => document.removeEventListener('keydown', handleKeyDown);
                }
        }, [isOpen, onClose]);

        /**
         * Handle image file selection.
         */
        const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                                setError('Please select an image file');
                                return;
                        }
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                                setError('Image must be less than 5MB');
                                return;
                        }

                        setImageFile(file);
                        setError(null);

                        // Create preview
                        const reader = new FileReader();
                        reader.onload = (e) => {
                                setImagePreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                }
        };

        /**
         * Handle drag and drop.
         */
        const handleDrop = (e: React.DragEvent) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                        const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handleImageSelect(event);
                }
        };

        /**
         * Handles form submission.
         */
        const handleSubmit = useCallback(async () => {
                setError(null);
                setIsSubmitting(true);

                try {
                        let payload;

                        if (activeTab === 'link') {
                                if (!url.trim()) {
                                        throw new Error('Please enter a URL');
                                }
                                // Validate URL
                                try {
                                        new URL(url);
                                } catch {
                                        throw new Error('Please enter a valid URL');
                                }
                                payload = { url, type: 'auto' };
                        } else if (activeTab === 'note') {
                                if (!noteContent.trim()) {
                                        throw new Error('Please enter some content');
                                }
                                payload = {
                                        type: 'note',
                                        title: noteTitle || 'Untitled Note',
                                        content: noteContent
                                };
                        } else if (activeTab === 'image') {
                                if (!imagePreview) {
                                        throw new Error('Please select an image');
                                }
                                payload = {
                                        type: 'image',
                                        title: imageFile?.name || 'Uploaded Image',
                                        imageUrl: imagePreview, // Send as base64 data URL
                                };
                        } else {
                                throw new Error('Unknown tab');
                        }

                        // Call API
                        const response = await fetch('/api/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                        });

                        const data = await response.json();

                        if (!response.ok) {
                                throw new Error(data.error || 'Failed to save');
                        }

                        // Save to localStorage for demo mode persistence
                        if (data.card) {
                                // Import dynamically to avoid SSR issues
                                const { saveLocalCard } = await import('@/lib/local-storage');
                                // Create a properly typed card with local prefix for ID
                                const cardToSave = {
                                        ...data.card,
                                        id: `local-${Date.now()}`,
                                };
                                saveLocalCard(cardToSave);
                        }

                        // Success - close modal and refresh
                        onClose();
                        window.location.reload();
                } catch (err) {
                        setError(err instanceof Error ? err.message : 'Something went wrong');
                } finally {
                        setIsSubmitting(false);
                }
        }, [activeTab, url, noteTitle, noteContent, imageFile, imagePreview, onClose]);

        // Detect platform from URL
        const platform = detectPlatform(url);
        const platformInfo = getPlatformInfo(url);
        const showPlatformPreview = url.length > 10 && platform !== 'unknown';

        if (!isOpen) return null;

        return (
                <>
                        {/* Backdrop */}
                        <div
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                                onClick={onClose}
                        />

                        {/* Modal */}
                        <div className="fixed inset-x-4 top-[20%] z-50 mx-auto max-w-lg rounded-xl bg-white shadow-2xl sm:inset-x-auto">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                                        <h2 className="text-lg font-semibold text-[var(--foreground)]">
                                                Save to Mind
                                        </h2>
                                        <button
                                                onClick={onClose}
                                                className="rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-gray-100"
                                        >
                                                <X className="h-5 w-5" />
                                        </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-[var(--border)]">
                                        <TabButton
                                                active={activeTab === 'link'}
                                                onClick={() => setActiveTab('link')}
                                                icon={Link2}
                                                label="Link"
                                        />
                                        <TabButton
                                                active={activeTab === 'note'}
                                                onClick={() => setActiveTab('note')}
                                                icon={StickyNote}
                                                label="Note"
                                        />
                                        <TabButton
                                                active={activeTab === 'image'}
                                                onClick={() => setActiveTab('image')}
                                                icon={ImageIcon}
                                                label="Image"
                                        />
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                        {activeTab === 'link' && (
                                                <div className="space-y-4">
                                                        {/* URL Input */}
                                                        <div>
                                                                <input
                                                                        ref={inputRef}
                                                                        type="url"
                                                                        value={url}
                                                                        onChange={(e) => setUrl(e.target.value)}
                                                                        placeholder="Paste a URL..."
                                                                        className="
                                                                                w-full rounded-lg border border-[var(--border)] px-4 py-3
                                                                                text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]
                                                                                focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20
                                                                        "
                                                                />
                                                        </div>

                                                        {/* Platform Preview */}
                                                        {showPlatformPreview && (
                                                                <div
                                                                        className="flex items-center gap-3 rounded-lg p-3"
                                                                        style={{ backgroundColor: platformInfo.bgColor }}
                                                                >
                                                                        <div
                                                                                className="flex h-8 w-8 items-center justify-center rounded-full"
                                                                                style={{ backgroundColor: platformInfo.color }}
                                                                        >
                                                                                <Globe className="h-4 w-4 text-white" />
                                                                        </div>
                                                                        <div>
                                                                                <p className="text-sm font-medium text-[var(--foreground)]">
                                                                                        {platformInfo.name} detected
                                                                                </p>
                                                                                <p className="text-xs text-[var(--foreground-muted)]">
                                                                                        Will be saved as a {platformInfo.name} card
                                                                                </p>
                                                                        </div>
                                                                        <Sparkles className="ml-auto h-4 w-4 text-[var(--accent-primary)]" />
                                                                </div>
                                                        )}
                                                </div>
                                        )}

                                        {activeTab === 'note' && (
                                                <div className="space-y-3">
                                                        <input
                                                                type="text"
                                                                value={noteTitle}
                                                                onChange={(e) => setNoteTitle(e.target.value)}
                                                                placeholder="Title (optional)"
                                                                className="
                                                                        w-full rounded-lg border border-[var(--border)] px-4 py-2
                                                                        text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]
                                                                        focus:border-[var(--accent-primary)] focus:outline-none
                                                                "
                                                        />
                                                        <textarea
                                                                ref={textareaRef}
                                                                value={noteContent}
                                                                onChange={(e) => setNoteContent(e.target.value)}
                                                                placeholder="Start typing..."
                                                                rows={6}
                                                                className="
                                                                        w-full resize-none rounded-lg border border-[var(--border)] px-4 py-3
                                                                        text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]
                                                                        focus:border-[var(--accent-primary)] focus:outline-none
                                                                "
                                                        />
                                                </div>
                                        )}

                                        {activeTab === 'image' && (
                                                <div className="space-y-3">
                                                        <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageSelect}
                                                                className="hidden"
                                                        />

                                                        {imagePreview ? (
                                                                <div className="relative">
                                                                        <img
                                                                                src={imagePreview}
                                                                                alt="Preview"
                                                                                className="w-full h-48 object-cover rounded-lg"
                                                                        />
                                                                        <button
                                                                                onClick={() => {
                                                                                        setImageFile(null);
                                                                                        setImagePreview(null);
                                                                                }}
                                                                                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                                                                        >
                                                                                <X className="h-4 w-4" />
                                                                        </button>
                                                                        <p className="mt-2 text-sm text-[var(--foreground-muted)] truncate">
                                                                                {imageFile?.name}
                                                                        </p>
                                                                </div>
                                                        ) : (
                                                                <div
                                                                        onClick={() => fileInputRef.current?.click()}
                                                                        onDragOver={(e) => e.preventDefault()}
                                                                        onDrop={handleDrop}
                                                                        className="flex flex-col items-center justify-center h-48 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors"
                                                                >
                                                                        <Upload className="h-8 w-8 text-[var(--foreground-muted)] mb-2" />
                                                                        <p className="text-sm text-[var(--foreground-muted)]">
                                                                                Click or drag to upload
                                                                        </p>
                                                                        <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                                                                Max 5MB • PNG, JPG, GIF
                                                                        </p>
                                                                </div>
                                                        )}
                                                </div>
                                        )}

                                        {/* Error */}
                                        {error && (
                                                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                                        {error}
                                                </div>
                                        )}
                                </div>

                                {/* Footer */}
                                <div className="flex justify-end gap-3 border-t border-[var(--border)] px-4 py-3">
                                        <button
                                                onClick={onClose}
                                                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:bg-gray-100"
                                        >
                                                Cancel
                                        </button>
                                        <button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="
                                                        flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2
                                                        text-sm font-medium text-white
                                                        hover:bg-[var(--accent-hover)]
                                                        disabled:opacity-50
                                                "
                                        >
                                                {isSubmitting ? (
                                                        <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Saving...
                                                        </>
                                                ) : (
                                                        'Save'
                                                )}
                                        </button>
                                </div>
                        </div>
                </>
        );
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

interface TabButtonProps {
        active: boolean;
        onClick: () => void;
        icon: typeof Link2;
        label: string;
        disabled?: boolean;
}

function TabButton({ active, onClick, icon: Icon, label, disabled }: TabButtonProps) {
        return (
                <button
                        onClick={onClick}
                        disabled={disabled}
                        data-testid={`tab-${label.toLowerCase()}`}
                        className={`
                                flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
                                ${active
                                        ? 'border-b-2 border-[var(--accent-primary)] text-[var(--foreground)]'
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                >
                        <Icon className="h-4 w-4" />
                        {label}
                </button>
        );
}

export default AddModal;
