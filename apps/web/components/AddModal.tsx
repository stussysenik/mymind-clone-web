/**
 * MyMind Clone - Add Modal Component
 * 
 * "Smart Input" modal for adding new items.
 * Auto-detects URLs, text notes, and handles image drops/pastes fluidly.
 * Designed for "addictive loop" with minimal friction.
 * 
 * @fileoverview Modal for adding new cards (Smart Input)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Link2, StickyNote, Image as ImageIcon, Loader2, Globe, Sparkles, Upload, ArrowUp } from 'lucide-react';
import { detectPlatform, getPlatformInfo } from '@/lib/platforms';

// =============================================================================
// TYPES
// =============================================================================

type Mode = 'auto' | 'link' | 'note' | 'image';

interface AddModalProps {
        isOpen: boolean;
        onClose: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AddModal({ isOpen, onClose }: AddModalProps) {
        const router = useRouter();

        // State
        const [content, setContent] = useState(''); // Unified content (URL or Note)
        const [mode, setMode] = useState<Mode>('auto'); // Current detected mode
        const [imageFile, setImageFile] = useState<File | null>(null);
        const [imagePreview, setImagePreview] = useState<string | null>(null);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [isDragOver, setIsDragOver] = useState(false);

        // Batch link upload state
        const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null);

        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

        // Extract all URLs from text (for batch upload)
        const extractLinks = (text: string): string[] => {
                const urlRegex = /https?:\/\/[^\s<>"{}|\^\[\]`\n]+/gi;
                const matches = text.match(urlRegex) || [];
                return [...new Set(matches)]; // dedupe
        };

        const detectedLinks = extractLinks(content);
        const isMultiMode = detectedLinks.length > 1;

        // Auto-detect mode based on content
        useEffect(() => {
                if (imageFile) {
                        setMode('image');
                        return;
                }

                const trimmed = content.trim();
                // Check if purely a URL
                if (/^https?:\/\/[^\s]+$/i.test(trimmed) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/.test(trimmed)) {
                        setMode('link');
                } else if (trimmed.length > 0) {
                        setMode('note');
                } else {
                        setMode('auto');
                }
        }, [content, imageFile]);

        // Focus on open
        useEffect(() => {
                if (isOpen) {
                        setTimeout(() => {
                                textareaRef.current?.focus();
                        }, 100);
                }
        }, [isOpen]);

        // Reset state on close
        useEffect(() => {
                if (!isOpen) {
                        setContent('');
                        setImageFile(null);
                        setImagePreview(null);
                        setError(null);
                        setMode('auto');
                }
        }, [isOpen]);

        // Keyboard & Paste
        useEffect(() => {
                const handleKeyDown = (e: KeyboardEvent) => {
                        if (e.key === 'Escape') onClose();
                        // CMD+Enter to save
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                handleSubmit();
                        }
                };

                const handlePaste = (e: ClipboardEvent) => {
                        const items = e.clipboardData?.items;
                        if (items) {
                                for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                                const file = items[i].getAsFile();
                                                if (file) handleImageFile(file);
                                                e.preventDefault(); // Prevent pasting binary text
                                        }
                                }
                        }
                };

                if (isOpen) {
                        document.addEventListener('keydown', handleKeyDown);
                        document.addEventListener('paste', handlePaste);
                        return () => {
                                document.removeEventListener('keydown', handleKeyDown);
                                document.removeEventListener('paste', handlePaste);
                        };
                }
        }, [isOpen, content, imageFile, imagePreview]); // dependencies for callbacks

        const handleImageFile = (file: File) => {
                if (!file.type.startsWith('image/')) {
                        setError('Please select an image file');
                        return;
                }
                if (file.size > 5 * 1024 * 1024) {
                        setError('Image must be less than 5MB');
                        return;
                }

                setImageFile(file);
                setError(null);

                const reader = new FileReader();
                reader.onload = (e) => setImagePreview(e.target?.result as string);
                reader.readAsDataURL(file);
        };

        const handleDrop = (e: React.DragEvent) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleImageFile(file);
        };

        const handleSubmit = async () => {
                if (isSubmitting) return;

                // Corrections before submitting
                let payload: any = {};
                let finalContent = content.trim();

                if (mode === 'auto' && !finalContent && !imagePreview) return; // Nothing to save

                setIsSubmitting(true);
                setError(null);

                try {
                        // BATCH MODE: Multiple links detected
                        if (isMultiMode) {
                                const links = detectedLinks;
                                setBatchProgress({ current: 0, total: links.length });

                                let successCount = 0;
                                for (let i = 0; i < links.length; i++) {
                                        setBatchProgress({ current: i + 1, total: links.length });
                                        try {
                                                const response = await fetch('/api/save', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ url: links[i], type: 'auto' }),
                                                });
                                                const data = await response.json();
                                                if (response.ok && data.card?.id) {
                                                        successCount++;
                                                        // Trigger AI Enrichment (Background)
                                                        fetch('/api/enrich', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ cardId: data.card.id }),
                                                                keepalive: true
                                                        }).catch(console.error);
                                                }
                                        } catch (err) {
                                                console.error(`[AddModal] Failed to save ${links[i]}:`, err);
                                        }
                                }

                                setBatchProgress(null);
                                if (successCount === 0) {
                                        throw new Error('Failed to save any links');
                                }
                                onClose();
                                router.refresh();
                                return;
                        }

                        // SINGLE MODE: Original logic
                        if (mode === 'image' && imagePreview) {
                                payload = {
                                        type: 'image',
                                        title: imageFile?.name || 'Uploaded Image',
                                        imageUrl: imagePreview,
                                };
                        } else if (mode === 'link' || (mode === 'auto' && /^(http|\w+\.)/.test(finalContent))) {
                                // Assume link
                                if (!/^https?:\/\//i.test(finalContent)) {
                                        finalContent = 'https://' + finalContent;
                                }
                                payload = { url: finalContent, type: 'auto' };
                        } else {
                                // Default to note
                                const lines = finalContent.split('\n');
                                const title = lines[0].length < 50 ? lines[0] : 'Untitled Note';
                                payload = {
                                        type: 'note',
                                        title: title,
                                        content: finalContent
                                };
                        }

                        const response = await fetch('/api/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                        });

                        const data = await response.json();

                        if (!response.ok) throw new Error(data.error || 'Failed to save');

                        // Trigger AI Enrichment (Background)
                        // Uses keepalive to ensure request completes even if modal closes
                        if (data.card?.id) {
                                fetch('/api/enrich', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ cardId: data.card.id }),
                                        keepalive: true
                                }).catch(err => console.error('[AddModal] Enrichment trigger failed:', err));
                        }

                        onClose();
                        router.refresh();
                } catch (err) {
                        setError(err instanceof Error ? err.message : 'Something went wrong');
                } finally {
                        setIsSubmitting(false);
                        setBatchProgress(null);
                }
        };

        if (!isOpen) return null;

        const platformInfo = (mode === 'link' || mode === 'auto') ? getPlatformInfo(content) : null;
        const canSubmit = (mode === 'image' && !!imagePreview) || content.trim().length > 0;

        return (
                <>
                        {/* Backdrop with fade animation */}
                        <div
                                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md animate-backdrop-enter"
                                onClick={onClose}
                        />

                        {/* Modal with entrance animation + link mode color wash */}
                        <div
                                className={`
                                        fixed inset-x-4 top-[15%] z-[70] mx-auto max-w-2xl
                                        rounded-2xl shadow-2xl overflow-hidden
                                        animate-modal-enter
                                        transition-colors duration-300 ease-out
                                        ${mode === 'link' ? 'bg-blue-50/30' : 'bg-white'}
                                        ${isDragOver ? 'scale-105 ring-4 ring-[var(--accent-primary)]' : ''}
                                `}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                        >
                                {/* Close Button - Notion-like responsive */}
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                        <button
                                                onClick={onClose}
                                                className="
                                                        group p-2 rounded-full text-gray-400
                                                        transition-all duration-200 ease-out
                                                        hover:bg-gray-100 hover:text-gray-600
                                                        active:scale-95 active:bg-gray-200
                                                        focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:outline-none
                                                "
                                        >
                                                <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
                                        </button>
                                </div>

                                <div className="p-1">
                                        {/* Image Preview Area */}
                                        {mode === 'image' && imagePreview ? (
                                                <div className="relative w-full aspect-video bg-gray-50 rounded-xl overflow-hidden group">
                                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                <button
                                                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                                        className="opacity-0 group-hover:opacity-100 bg-white/90 text-red-500 px-4 py-2 rounded-full text-sm font-medium shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all"
                                                                >
                                                                        Remove Image
                                                                </button>
                                                        </div>
                                                </div>
                                        ) : (
                                                /* Main Input Area */
                                                <div className="relative p-6 pt-8">
                                                        <textarea
                                                                ref={textareaRef}
                                                                value={content}
                                                                onChange={(e) => setContent(e.target.value)}
                                                                placeholder="Save something... (paste multiple links to batch import)"
                                                                className="
                                                                        w-full text-2xl font-serif text-gray-800
                                                                        placeholder:text-gray-300 placeholder:transition-opacity placeholder:duration-150
                                                                        bg-transparent border-none resize-none leading-relaxed custom-scrollbar
                                                                        focus:outline-none focus:ring-0
                                                                        focus:placeholder:opacity-50
                                                                        focus:bg-gray-50/30
                                                                        transition-all duration-150
                                                                        rounded-lg p-2 -m-2
                                                                "
                                                                rows={isMultiMode ? 6 : (mode === 'link' ? 2 : 5)}
                                                                disabled={isSubmitting}
                                                        />

                                                        {/* Batch Mode Badge */}
                                                        {isMultiMode && !batchProgress && (
                                                                <div className="flex items-center gap-2 mt-4 text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 p-3 rounded-lg animate-badge-pulse">
                                                                        <Upload className="w-4 h-4" />
                                                                        <span className="text-sm font-medium">{detectedLinks.length} links detected - will save all</span>
                                                                        <Sparkles className="w-3 h-3 ml-auto animate-pulse" />
                                                                </div>
                                                        )}

                                                        {/* Batch Progress */}
                                                        {batchProgress && (
                                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-sm font-medium text-gray-700">
                                                                                        Saving {batchProgress.current} of {batchProgress.total}...
                                                                                </span>
                                                                                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                                                                        </div>
                                                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                                <div
                                                                                        className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                                                                                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                                                                />
                                                                        </div>
                                                                </div>
                                                        )}

                                                        {/* Single Link Detected Badge */}
                                                        {mode === 'link' && !isMultiMode && platformInfo && (
                                                                <div className="flex items-center gap-2 mt-4 text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 p-3 rounded-lg animate-badge-pulse">
                                                                        <Globe className="w-4 h-4" />
                                                                        <span className="text-sm font-medium">Link detected: {platformInfo.name}</span>
                                                                        {content.length > 20 && <Sparkles className="w-3 h-3 ml-auto animate-pulse" />}
                                                                </div>
                                                        )}
                                                </div>
                                        )}

                                        {/* Footer / Controls */}
                                        <div className="flex items-center justify-between px-6 pb-6 pt-2">
                                                <div className="flex gap-1">
                                                        {/* Image Upload Button - Polished */}
                                                        <button
                                                                onClick={() => fileInputRef.current?.click()}
                                                                title="Upload Image"
                                                                className={`
                                                                        p-2 rounded-lg transition-all duration-200
                                                                        ${mode === 'image'
                                                                                ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                                                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95'
                                                                        }
                                                                        ${isDragOver ? 'text-[var(--accent-primary)] animate-pulse' : ''}
                                                                `}
                                                        >
                                                                <ImageIcon className="w-5 h-5" />
                                                        </button>
                                                        <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                        if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                                                                }}
                                                        />

                                                        {mode !== 'image' && (
                                                                <div className="h-6 w-px bg-gray-200 mx-2 self-center" />
                                                        )}

                                                        {/* Mode Label - Context-aware pill */}
                                                        {mode !== 'image' && (
                                                                <span className={`
                                                                        text-xs font-medium tracking-wide uppercase px-2 py-1 rounded-full
                                                                        transition-all duration-200 self-center
                                                                        ${mode === 'auto'
                                                                                ? 'text-gray-400 bg-transparent'
                                                                                : 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                                        }
                                                                `}>
                                                                        {mode === 'auto' ? 'Smart Mode' : mode}
                                                                </span>
                                                        )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                        <span className="hidden sm:inline text-xs text-gray-300 mr-2">CMD + Enter to save</span>
                                                        {/* Save Button - Refined lift + press */}
                                                        <button
                                                                onClick={handleSubmit}
                                                                disabled={!canSubmit || isSubmitting}
                                                                className={`
                                                                        group flex items-center gap-2 px-6 py-2.5 rounded-full font-medium
                                                                        transition-all duration-200 ease-out
                                                                        ${canSubmit
                                                                                ? 'bg-[var(--accent-primary)] text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] active:shadow-sm'
                                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        }
                                                                `}
                                                        >
                                                                {isSubmitting ? (
                                                                        <>
                                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                                <span>Saving...</span>
                                                                        </>
                                                                ) : (
                                                                        <>
                                                                                <span>Save to Brain</span>
                                                                                <ArrowUp className={`w-4 h-4 transition-transform duration-200 ${canSubmit ? 'group-hover:-translate-y-0.5' : ''}`} />
                                                                        </>
                                                                )}
                                                        </button>
                                                </div>
                                        </div>

                                        {/* Error Toast - with subtle shake */}
                                        {error && (
                                                <div className="mx-6 mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-subtle-shake">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                        {error}
                                                </div>
                                        )}

                                        {/* Drop Zone Overlay (only when dragging) */}
                                        {isDragOver && (
                                                <div className="absolute inset-0 bg-[var(--accent-primary)]/10 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-[var(--accent-primary)] border-dashed m-1 rounded-xl z-50">
                                                        <Upload className="w-16 h-16 text-[var(--accent-primary)] mb-4 animate-bounce" />
                                                        <h3 className="text-2xl font-serif text-[var(--accent-primary)] font-bold">Drop visual</h3>
                                                </div>
                                        )}
                                </div>
                        </div>
                </>
        );
}

export default AddModal;
