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

        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

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
                let finalType = mode;
                let payload: any = {};
                let finalContent = content.trim();

                if (mode === 'auto' && !finalContent) return; // Nothing to save

                setIsSubmitting(true);
                setError(null);

                try {
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
                }
        };

        if (!isOpen) return null;

        const platformInfo = (mode === 'link' || mode === 'auto') ? getPlatformInfo(content) : null;
        const canSubmit = (mode === 'image' && !!imagePreview) || content.trim().length > 0;

        return (
                <>
                        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />

                        <div
                                className={`
                                        fixed inset-x-4 top-[15%] z-[70] mx-auto max-w-2xl 
                                        bg-white rounded-2xl shadow-2xl overflow-hidden
                                        transition-all duration-300 ease-out transform
                                        ${isDragOver ? 'scale-105 ring-4 ring-[var(--accent-primary)]' : 'scale-100'}
                                `}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                        >
                                {/* Active Mode Indicator / Header */}
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                                                <X className="w-5 h-5" />
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
                                                                placeholder="Save something..."
                                                                className="w-full text-2xl font-serif text-gray-800 placeholder:text-gray-300 bg-transparent border-none resize-none focus:ring-0 leading-relaxed custom-scrollbar"
                                                                rows={mode === 'link' ? 2 : 5}
                                                                disabled={isSubmitting}
                                                        />

                                                        {/* Link Detected Badge */}
                                                        {mode === 'link' && platformInfo && (
                                                                <div className="flex items-center gap-2 mt-4 text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
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
                                                        {/* Manual Mode Toggles (Subtle) */}
                                                        <button
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className={`p-2 rounded-lg transition-colors ${mode === 'image' ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                                                title="Upload Image"
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

                                                        {mode !== 'image' && (
                                                                <span className="text-xs text-gray-300 font-medium self-center tracking-wide uppercase px-2">
                                                                        {mode === 'auto' ? 'Smart Mode' : mode}
                                                                </span>
                                                        )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                        <span className="hidden sm:inline text-xs text-gray-300 mr-2">CMD + Enter to save</span>
                                                        <button
                                                                onClick={handleSubmit}
                                                                disabled={!canSubmit || isSubmitting}
                                                                className={`
                                                                        flex items-center gap-2 px-6 py-2.5 rounded-full font-medium shadow-sm transition-all
                                                                        ${canSubmit
                                                                                ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] hover:shadow-md transform hover:-translate-y-0.5'
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
                                                                                <ArrowUp className={`w-4 h-4 ${canSubmit ? 'animate-bounce-short' : ''}`} />
                                                                        </>
                                                                )}
                                                        </button>
                                                </div>
                                        </div>

                                        {/* Error Toast styled */}
                                        {error && (
                                                <div className="mx-6 mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
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
