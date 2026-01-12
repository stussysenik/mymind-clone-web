'use client';

import { X, ExternalLink, Archive, Share2, FolderPlus, Loader2, RotateCcw, Check, Plus, AlertTriangle, RefreshCw, Trash2, Sparkles, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/lib/types';
import { extractDomain } from '@/lib/platforms';
import { updateLocalCard } from '@/lib/local-storage';

interface CardDetailModalProps {
        card: Card | null;
        isOpen: boolean;
        onClose: () => void;
        onDelete?: (id: string) => void;
        onRestore?: (id: string) => void;
        onArchive?: (id: string) => void;
        availableSpaces?: string[];
}

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';

// ... (imports remain)

export function CardDetailModal({ card, isOpen, onClose, onDelete, onRestore, onArchive, availableSpaces = [] }: CardDetailModalProps) {
        const router = useRouter();
        // Initialize state directly from props since key={id} forces remount
        const [tags, setTags] = useState<string[]>(card?.tags || []);
        const [isAddingTag, setIsAddingTag] = useState(false);
        const [newTagVal, setNewTagVal] = useState('');
        const [note, setNote] = useState(card?.metadata?.note || '');
        const [isSavingNote, setIsSavingNote] = useState(false);
        const [noteSaved, setNoteSaved] = useState(false);
        const [showSpaceMenu, setShowSpaceMenu] = useState(false);
        const [isCreatingSpace, setIsCreatingSpace] = useState(false);
        const [newSpaceName, setNewSpaceName] = useState('');
        const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const lastSavedNoteRef = useRef<string>(card?.metadata?.note || '');
        const currentNoteRef = useRef<string>(card?.metadata?.note || ''); // Track current note for unmount handling
        const [isReAnalyzing, setIsReAnalyzing] = useState(false);
        const [retryCount, setRetryCount] = useState(0);
        const [title, setTitle] = useState(card?.title || '');
        const [summary, setSummary] = useState(card?.metadata?.summary || '');
        const [isSavingTitle, setIsSavingTitle] = useState(false);
        const [titleSaved, setTitleSaved] = useState(false);
        const [isSavingSummary, setIsSavingSummary] = useState(false);
        const [summarySaved, setSummarySaved] = useState(false);
        const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const summarySaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        // Expandable sections for comfortable reading
        const [summaryExpanded, setSummaryExpanded] = useState(false);
        const [notesExpanded, setNotesExpanded] = useState(false);

        // Carousel state
        const [currentImageIndex, setCurrentImageIndex] = useState(0);
        const images = card?.metadata?.images?.length ? card.metadata.images : (card?.imageUrl ? [card.imageUrl] : []);

        const nextImage = (e?: React.MouseEvent) => {
                e?.stopPropagation();
                if (images.length > 1) {
                        setCurrentImageIndex((prev) => (prev + 1) % images.length);
                }
        };

        const prevImage = (e?: React.MouseEvent) => {
                e?.stopPropagation();
                if (images.length > 1) {
                        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                }
        };

        // Re-analyze card with AI enrichment
        const handleReAnalyze = useCallback(async () => {
                if (!card || isReAnalyzing) return;

                setIsReAnalyzing(true);
                setRetryCount(prev => prev + 1);

                try {
                        const response = await fetch('/api/enrich', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ cardId: card.id })
                        });

                        if (!response.ok) {
                                const data = await response.json();
                                console.error('[Re-analyze] Failed:', data.error);
                        }

                        // Refresh to get updated card data
                        router.refresh();
                } catch (err) {
                        console.error('[Re-analyze] Error:', err);
                } finally {
                        setIsReAnalyzing(false);
                }
        }, [card, isReAnalyzing, router]);

        // Sync state when card is refreshed (same ID) from AI updates
        useEffect(() => {
                if (card) {
                        // For simplicity, we only sync tags as they might be AI generated.
                        // We DO NOT sync note, title, summary if local state differs to prevent overwriting user input
                        // However, if we aren't editing, we might want to sync?
                        // Let's assume AI only adds tags/summary.

                        if (JSON.stringify(card.tags) !== JSON.stringify(tags)) {
                                // Only update if server has MORE tags or DIFFERENT tags?
                                // If we optimized updated locally, tags has our new tag. card.tags might not yet (if refresh happens too fast).
                                // BUT if we assume router.refresh() fetches LATEST data...
                                // And we assume API Patch was fast.
                                // Then card.tags should contain our tag.
                                // If card.tags is missing our tag, it means race condition (server doesn't have it yet).
                                // If we blindly sync, we lose our tag.
                                // Safer strategy: UNION.
                                // const merged = Array.from(new Set([...tags, ...(card.tags||[])]));
                                // setTags(merged);
                                // No, that revives deleted tags.

                                // Alternative: Only update if 'card.tags' has MORE items?
                                // Or simply: trust server? 
                                // If we remove router.refresh from handleAddTag(), then the only refresh source is AI polling or other external events.
                                // If AI triggers refresh, 'card.tags' might NOT have our new tag if we just added it and AI was finishing parallel job.
                                // BUT we want AI tags.

                                // Let's try trusting server but debouncing/checking?
                                // For now, let's Enable it because failing to see tags is worse.
                                setTags(card.tags || []);
                        }

                        // Update summary if it changed and we aren't editing it
                        if (card.metadata.summary !== summary && !isSavingSummary && card.metadata.summary) {
                                setSummary(card.metadata.summary);
                        }
                }
        }, [card, isSavingSummary, summary, tags]);

        // Debounced save for Title
        const saveTitle = useCallback(async (newTitle: string) => {
                if (!card) return;
                setIsSavingTitle(true);
                setTitleSaved(false);

                try {
                        await fetch(`/api/cards/${card.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ title: newTitle })
                        });
                        setTitleSaved(true);
                        setTimeout(() => setTitleSaved(false), 2000);
                        router.refresh();
                } catch (err) {
                        console.error('Failed to save title:', err);
                } finally {
                        setIsSavingTitle(false);
                }
        }, [card, router]);

        const handleTitleChange = (val: string) => {
                setTitle(val);
                setTitleSaved(false);
                if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
                titleSaveTimeoutRef.current = setTimeout(() => saveTitle(val), 1000);
        };

        // Debounced save for Summary
        const saveSummary = useCallback(async (newSummary: string) => {
                if (!card) return;
                setIsSavingSummary(true);
                setSummarySaved(false);

                const updatedMeta = {
                        ...card.metadata,
                        summary: newSummary,
                };

                try {
                        await fetch(`/api/cards/${card.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ metadata: updatedMeta })
                        });
                        setSummarySaved(true);
                        setTimeout(() => setSummarySaved(false), 2000);
                } catch (err) {
                        console.error('Failed to save summary:', err);
                } finally {
                        setIsSavingSummary(false);
                }
        }, [card]);

        const handleSummaryChange = (val: string) => {
                setSummary(val);
                setSummarySaved(false);
                if (summarySaveTimeoutRef.current) clearTimeout(summarySaveTimeoutRef.current);
                // Use longer debounce (2.5s) to allow paragraph deletion without interruption
                summarySaveTimeoutRef.current = setTimeout(() => saveSummary(val), 2500);
        };


        // Debounced autosave for notes
        const saveNote = useCallback(async (noteToSave: string) => {
                if (!card || noteToSave === lastSavedNoteRef.current) return;

                setIsSavingNote(true);
                setNoteSaved(false);

                const updatedMeta = {
                        ...card.metadata,
                        note: noteToSave,
                        note_updated_at: new Date().toISOString()
                };
                console.log('[CardDetail] Saving note, Meta Payload:', updatedMeta);

                try {
                        await fetch(`/api/cards/${card.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ metadata: updatedMeta })
                        });
                        console.log('[CardDetail] Note saved successfully');
                        lastSavedNoteRef.current = noteToSave;
                        setNoteSaved(true);
                        // Hide "Saved" indicator after 2 seconds
                        setTimeout(() => setNoteSaved(false), 2000);
                } catch (err) {
                        console.error('Failed to save note:', err);
                } finally {
                        setIsSavingNote(false);
                }
        }, [card]);

        // Handle note changes with debounce
        const handleNoteChange = (newNote: string) => {
                setNote(newNote);
                currentNoteRef.current = newNote;
                setNoteSaved(false);

                // Clear existing timeout
                if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                }

                // Set new debounced save (500ms after typing stops)
                saveTimeoutRef.current = setTimeout(() => {
                        saveNote(newNote);
                }, 500);
        };

        // Cleanup timeout on unmount AND flush pending save
        useEffect(() => {
                return () => {
                        if (saveTimeoutRef.current) {
                                clearTimeout(saveTimeoutRef.current);
                        }
                        // Flush pending save on unmount if different
                        if (currentNoteRef.current !== lastSavedNoteRef.current && card) {
                                // Use fetch directly to avoid state updates on unmounted component
                                const updatedMeta = {
                                        ...card.metadata,
                                        note: currentNoteRef.current,
                                        note_updated_at: new Date().toISOString()
                                };
                                // Fire and forget (keepalive if possible, but fetch is usually fine)
                                fetch(`/api/cards/${card.id}`, {
                                        method: 'PATCH',
                                        body: JSON.stringify({ metadata: updatedMeta }),
                                        keepalive: true // Important for background save
                                }).catch(console.error);
                        }
                };
        }, [card]); // Re-bind if card changes so we have correct ID

        // Flush pending note save when modal closes
        useEffect(() => {
                if (!isOpen && note !== lastSavedNoteRef.current && card) {
                        // Modal just closed with unsaved changes - save immediately
                        saveNote(note);
                }
        }, [isOpen, note, card, saveNote]);

        // Initialize lastSavedNoteRef when card changes
        useEffect(() => {
                if (card) {
                        const noteVal = card.metadata.note || '';
                        lastSavedNoteRef.current = noteVal;
                        currentNoteRef.current = noteVal;
                        setNote(noteVal);
                }
        }, [card]);

        // Add card to a space (adds the space name as a tag)
        const handleAddToSpace = async (spaceName: string) => {
                if (!card) return;
                const normalized = spaceName.trim().toLowerCase().replace(/\s+/g, '-');
                if (tags.includes(normalized)) {
                        setShowSpaceMenu(false);
                        return;
                }

                const updated = [...tags, normalized];
                setTags(updated);
                setShowSpaceMenu(false);

                await fetch(`/api/cards/${card.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ tags: updated })
                });
                router.refresh();
        };

        // Create new space and add card to it
        const handleCreateSpace = async () => {
                if (!newSpaceName.trim()) return;
                await handleAddToSpace(newSpaceName);
                setNewSpaceName('');
                setIsCreatingSpace(false);
        };

        const handleAddTag = async () => {
                const tagVal = newTagVal.trim();
                console.log('[CardDetail] Adding tag:', tagVal);
                if (!tagVal || !card) return;
                const normalized = tagVal.toLowerCase().replace(/\s+/g, '-');
                if (tags.includes(normalized)) {
                        setNewTagVal('');
                        setIsAddingTag(false);
                        return;
                }

                const updated = [...tags, normalized];
                setTags(updated);
                setNewTagVal('');
                setIsAddingTag(false);

                // Handle mock/local/demo cards client-side (no API auth)
                // Demo cards have prefixes like twitter-, instagram-, youtube-, reddit-, etc.
                const isDemoCard = card.id.startsWith('mock-') ||
                        card.id.startsWith('local-') ||
                        card.id.match(/^(twitter|instagram|youtube|reddit|letterboxd|imdb|article|image|product|note)-/);

                if (isDemoCard) {
                        updateLocalCard(card.id, { tags: updated });
                        console.log('[CardDetail] Tags saved to localStorage:', updated);
                        return;
                }


                // Real cards go to API
                try {
                        await fetch(`/api/cards/${card.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ tags: updated })
                        });
                        console.log('[CardDetail] Tags saved to API:', updated);
                } catch (e) {
                        console.error('Failed to save tags:', e);
                }
        };

        const handleRemoveTag = async (tagToRemove: string) => {
                if (!card) return;
                const updated = tags.filter(t => t !== tagToRemove);
                setTags(updated);

                // Handle mock/local/demo cards client-side
                const isDemoCard = card.id.startsWith('mock-') ||
                        card.id.startsWith('local-') ||
                        card.id.match(/^(twitter|instagram|youtube|reddit|letterboxd|imdb|article|image|product|note)-/);

                if (isDemoCard) {
                        updateLocalCard(card.id, { tags: updated });
                        return;
                }

                try {
                        await fetch(`/api/cards/${card.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ tags: updated })
                        });
                } catch (e) {
                        console.error('Failed to remove tag:', e);
                }
        };


        // Polling for AI completion
        useEffect(() => {
                if (!isOpen || !card?.metadata?.processing) return;

                const interval = setInterval(() => {
                        router.refresh();
                }, 3000);

                return () => clearInterval(interval);
        }, [isOpen, card?.metadata?.processing, router]);

        // Escape key to close modal
        useEffect(() => {
                if (!isOpen) return;

                const handleKeyDown = (e: KeyboardEvent) => {
                        if (e.key === 'Escape') {
                                // Don't close if user is typing in an input
                                const activeElement = document.activeElement;
                                if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
                                        // If in input, first blur it, next escape will close
                                        (activeElement as HTMLElement).blur();
                                        return;
                                }
                                // Flush any pending note save before closing
                                if (saveTimeoutRef.current) {
                                        clearTimeout(saveTimeoutRef.current);
                                        if (note !== lastSavedNoteRef.current) {
                                                console.log('[CardDetail] Closing, flushing note save:', note);
                                                saveNote(note);
                                        }
                                }
                                onClose();
                        }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
        }, [isOpen, onClose, note]); // Added note dependency for closure capture

        if (!isOpen || !card) return null;

        const domain = extractDomain(card.url);

        return (
                <div
                        role="dialog"
                        aria-modal="true"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
                >
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />

                        <div className="relative w-full max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">

                                {/* Close Button (Absolute) */}
                                <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 z-[110] p-2 bg-black/10 hover:bg-black/20 md:bg-gray-100 md:hover:bg-gray-200 rounded-full text-white md:text-gray-500 transition-colors"
                                >
                                        <X className="w-5 h-5" />
                                </button>

                                {/* LEFT: Visual Content */}
                                <div data-testid="card-visual" className={`w-full md:w-2/3 flex items-center justify-center relative group overflow-hidden ${card.imageUrl ? 'bg-gray-100' : ''}`}
                                        style={!card.imageUrl ? {
                                                background: `linear-gradient(135deg, 
                                                        hsl(${(card.title?.charCodeAt(0) || 0) % 360}, 70%, 95%) 0%, 
                                                        hsl(${((card.title?.charCodeAt(1) || 50) + 120) % 360}, 60%, 90%) 50%,
                                                        hsl(${((card.title?.charCodeAt(2) || 100) + 240) % 360}, 50%, 85%) 100%)`
                                        } : undefined}
                                >
                                        {images.length > 0 ? (
                                                <div className="relative w-full h-full flex items-center justify-center bg-black/5">
                                                        {/* Blurred Backdrop */}
                                                        <div className="absolute inset-0 overflow-hidden">
                                                                <Image
                                                                        src={images[currentImageIndex]}
                                                                        alt=""
                                                                        fill
                                                                        className="object-cover opacity-20 blur-2xl scale-110"
                                                                />
                                                        </div>

                                                        {/* Main Image */}
                                                        <div className="relative w-full h-full flex items-center justify-center p-4">
                                                                <Image
                                                                        src={images[currentImageIndex]}
                                                                        alt={card.title || 'Card content'}
                                                                        fill
                                                                        className="object-contain drop-shadow-xl"
                                                                        sizes="(max-width: 768px) 100vw, 70vw"
                                                                        priority
                                                                        onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                        }}
                                                                />
                                                        </div>

                                                        {/* Carousel Controls */}
                                                        {images.length > 1 && (
                                                                <>
                                                                        <button
                                                                                onClick={prevImage}
                                                                                className="absolute left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all hover:scale-110"
                                                                        >
                                                                                <ChevronLeft className="w-6 h-6" />
                                                                        </button>
                                                                        <button
                                                                                onClick={nextImage}
                                                                                className="absolute right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all hover:scale-110"
                                                                        >
                                                                                <ChevronRight className="w-6 h-6" />
                                                                        </button>

                                                                        {/* Dots */}
                                                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-full bg-black/20 backdrop-blur-sm">
                                                                                {images.map((_, idx) => (
                                                                                        <button
                                                                                                key={idx}
                                                                                                onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setCurrentImageIndex(idx);
                                                                                                }}
                                                                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                                                                                        />
                                                                                ))}
                                                                        </div>
                                                                </>
                                                        )}
                                                </div>
                                        ) : card.url ? (
                                                /* URL without image - show website screenshot preview */
                                                <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
                                                        <div className="relative w-full max-w-xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20">
                                                                <Image
                                                                        src={`https://api.microlink.io/?url=${encodeURIComponent(card.url)}&screenshot=true&meta=false&embed=screenshot.url`}
                                                                        alt={card.title || 'Website preview'}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                                        onError={(e) => {
                                                                                // Hide broken image
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                />
                                                        </div>
                                                        <p className="mt-4 text-sm text-gray-600 font-medium">{domain}</p>
                                                </div>
                                        ) : (
                                                /* Note/text content - show nicely formatted */
                                                <div className="p-12 text-center max-w-2xl">
                                                        <h2 className="text-3xl font-serif text-gray-800 mb-6 leading-tight">{card.title}</h2>
                                                        <p className="text-xl text-gray-600 leading-relaxed whitespace-pre-wrap font-serif">
                                                                {card.content || 'No content provided'}
                                                        </p>
                                                </div>
                                        )}

                                        {/* Color Palette Overlay - Clickable for color search */}
                                        {card.metadata?.colors && card.metadata.colors.length > 0 && (
                                                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 z-10">
                                                        {card.metadata.colors.slice(0, 5).map((color: string, i: number) => (
                                                                <button
                                                                        key={i}
                                                                        onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onClose();
                                                                                router.push(`/?color=${encodeURIComponent(color)}`);
                                                                        }}
                                                                        className="w-6 h-6 rounded-full border-2 border-white/70 shadow-lg hover:scale-125 hover:border-white transition-all duration-200 cursor-pointer"
                                                                        style={{ backgroundColor: color }}
                                                                        title={`Search by color: ${color}`}
                                                                />
                                                        ))}
                                                </div>
                                        )}
                                </div>


                                {/* RIGHT: Metadata & Notes */}
                                <div className="w-full md:w-1/3 bg-white flex flex-col border-l border-gray-100">
                                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                                                {/* Title + Dates */}
                                                <div className="mb-4">
                                                        <div className="relative">
                                                                <input
                                                                        type="text"
                                                                        value={title}
                                                                        onChange={(e) => handleTitleChange(e.target.value)}
                                                                        className="w-full text-xl font-serif font-medium text-gray-900 mb-3 leading-snug bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -ml-1 border border-transparent focus:border-gray-200 transition-colors truncate"
                                                                        placeholder="Untitled"
                                                                        title={title}
                                                                />
                                                                {isSavingTitle && <Loader2 className="absolute right-2 top-2 w-4 h-4 animate-spin text-[var(--accent-primary)]" />}
                                                                {titleSaved && <Check className="absolute right-2 top-2 w-4 h-4 text-green-500" />}
                                                        </div>
                                                        <div className="flex flex-col gap-1 text-sm text-gray-400 font-medium">
                                                                {/* Added Date */}
                                                                <div className="flex items-center gap-2">
                                                                        <span className="text-gray-300">Added</span>
                                                                        <span>{new Date(card.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                </div>
                                                                {/* Original Published Date (if available) */}
                                                                {card.metadata?.publishedAt && (
                                                                        <div className="flex items-center gap-2">
                                                                                <span className="text-gray-300">Published</span>
                                                                                <span>{new Date(card.metadata.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                        </div>
                                                                )}
                                                                {/* Source domain */}
                                                                {domain && (
                                                                        <a
                                                                                href={card.url || '#'}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors mt-1"
                                                                        >
                                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                                {domain}
                                                                        </a>
                                                                )}
                                                        </div>
                                                </div>


                                                {/* AI Summary moved to be immediately after title/date for prominence */}

                                                {/* AI Processing / Failure Indicator */}
                                                {(card.metadata.processing || card.metadata.enrichmentError) && (
                                                        <AIThinkingIndicator
                                                                createdAt={card.createdAt}
                                                                isReAnalyzing={isReAnalyzing}
                                                                hasFailed={!!card.metadata.enrichmentError}
                                                                retryCount={retryCount}
                                                                onRetry={handleReAnalyze}
                                                                onManual={async () => {
                                                                        // Clear error locally so we can write summary
                                                                        // Realistically we might want to PATCH the card to clear error/processing flag?
                                                                        // But simply focusing the summary might be enough if we hide the indicator.
                                                                        // Better: Hide indicator, focus summary.
                                                                        // But indicator is conditional on card.metadata. 
                                                                        // Let's force update local state to hide it? 
                                                                        // Or just update the DB to say "processing: false, error: null"

                                                                        // Simplest hack: Optimistic update
                                                                        const updated = { ...card.metadata, processing: false, enrichmentError: null };
                                                                        // Actual update:
                                                                        try {
                                                                                await fetch(`/api/cards/${card.id}`, {
                                                                                        method: 'PATCH',
                                                                                        body: JSON.stringify({ metadata: updated })
                                                                                });
                                                                                router.refresh();
                                                                        } catch (e) { console.error(e); }
                                                                }}
                                                        />
                                                )}

                                                {/* AI Summary Section - Editable with Comfortable Reading */}
                                                {(card.metadata.summary || card.metadata.processing || summary) && (
                                                        <div className="mb-8 p-5 bg-gray-50/50 rounded-xl border border-gray-100 group hover:border-[var(--accent-primary)]/30 transition-all">
                                                                <div className="flex items-center justify-between mb-3">
                                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                                                                                AI Summary
                                                                        </h4>
                                                                        <div className="flex items-center gap-2">
                                                                                {isSavingSummary && <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-primary)]" />}
                                                                                {summarySaved && <Check className="w-3 h-3 text-green-500" />}
                                                                                <button
                                                                                        onClick={() => setSummaryExpanded(!summaryExpanded)}
                                                                                        className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                                                                                        title={summaryExpanded ? 'Collapse' : 'Expand for reading'}
                                                                                >
                                                                                        {summaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                                </button>
                                                                        </div>
                                                                </div>
                                                                <textarea
                                                                        value={summary}
                                                                        onChange={(e) => handleSummaryChange(e.target.value)}
                                                                        className={`w-full text-gray-700 leading-relaxed bg-transparent border-none p-0 focus:ring-0 resize-none placeholder:text-gray-400 break-words transition-all duration-300 ${summaryExpanded ? 'min-h-[320px] text-base' : 'min-h-[160px] text-sm'}`}
                                                                        placeholder="Add AI summary..."
                                                                />
                                                        </div>
                                                )}

                                                {/* Tags Section */}
                                                <div className="mb-10 w-full">
                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                Mind Tags / Spaces
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2.5 w-full pb-1">
                                                                {isAddingTag ? (
                                                                        <div className="flex items-center gap-2">
                                                                                <input
                                                                                        autoFocus
                                                                                        type="text"
                                                                                        className="w-32 px-3 py-1.5 rounded-full bg-gray-50 border border-[var(--accent-primary)] text-xs text-gray-900 focus:outline-none"
                                                                                        placeholder="tag-name"
                                                                                        value={newTagVal}
                                                                                        onChange={(e) => setNewTagVal(e.target.value)}
                                                                                        onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') handleAddTag();
                                                                                                if (e.key === 'Escape') setIsAddingTag(false);
                                                                                        }}
                                                                                        onBlur={() => {
                                                                                                if (newTagVal) handleAddTag();
                                                                                                else setIsAddingTag(false);
                                                                                        }}
                                                                                />
                                                                        </div>
                                                                ) : (
                                                                        <button
                                                                                onClick={() => setIsAddingTag(true)}
                                                                                className="px-4 py-1.5 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm shadow-orange-200 flex items-center gap-1"
                                                                        >
                                                                                + Add Tag
                                                                        </button>
                                                                )}

                                                                {tags.map(tag => (
                                                                        <span
                                                                                key={tag}
                                                                                onClick={() => {
                                                                                        const params = new URLSearchParams();
                                                                                        params.set('q', `#${tag}`);
                                                                                        router.push('/?' + params.toString());
                                                                                        onClose();
                                                                                }}
                                                                                className="group relative px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200 hover:bg-gray-100 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                                                                        >
                                                                                {tag}
                                                                                <button
                                                                                        onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleRemoveTag(tag);
                                                                                        }}
                                                                                        className="ml-1.5 text-gray-400 hover:text-red-500 hidden group-hover:inline-block transition-colors"
                                                                                >
                                                                                        <X className="w-3 h-3" />
                                                                                </button>
                                                                        </span>
                                                                ))}
                                                        </div>
                                                </div>

                                                {/* Notes Input - Comfortable Reading */}
                                                <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                                        Mind Notes
                                                                </h4>
                                                                <button
                                                                        onClick={() => setNotesExpanded(!notesExpanded)}
                                                                        className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                                                                        title={notesExpanded ? 'Collapse' : 'Expand for writing'}
                                                                >
                                                                        {notesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                </button>
                                                        </div>
                                                        <textarea
                                                                className={`w-full p-4 bg-transparent rounded-xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/10 focus:border-[var(--accent-primary)] transition-all placeholder:text-gray-300 ${notesExpanded ? 'h-64 text-base leading-relaxed' : 'h-40 text-sm'}`}
                                                                placeholder="Type here to add a note... (autosaves)"
                                                                value={note}
                                                                onChange={(e) => handleNoteChange(e.target.value)}
                                                        />
                                                        <div className="h-5 mt-1">
                                                                {isSavingNote && (
                                                                        <span className="text-[10px] text-[var(--accent-primary)] font-medium inline-flex items-center gap-1 animate-pulse">
                                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                                Saving...
                                                                        </span>
                                                                )}
                                                                {noteSaved && !isSavingNote && (
                                                                        <span className="text-[10px] text-green-500 font-medium inline-flex items-center gap-1">
                                                                                <Check className="w-3 h-3" />
                                                                                Saved
                                                                        </span>
                                                                )}
                                                        </div>
                                                </div>
                                        </div>

                                        {/* Bottom Actions Bar */}
                                        <div className="p-6 border-t border-gray-100 flex items-center justify-center gap-4 bg-white">
                                                {/* Add to Space Button */}
                                                <div className="relative">
                                                        <button
                                                                onClick={() => setShowSpaceMenu(!showSpaceMenu)}
                                                                className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-[var(--accent-primary)] border border-gray-100 hover:border-[var(--accent-primary)]/30"
                                                                title="Add to Space"
                                                        >
                                                                <FolderPlus className="w-5 h-5" />
                                                        </button>

                                                        {/* Space Dropdown Menu */}
                                                        {showSpaceMenu && (
                                                                <>
                                                                        <div
                                                                                className="fixed inset-0 z-40"
                                                                                onClick={() => {
                                                                                        setShowSpaceMenu(false);
                                                                                        setIsCreatingSpace(false);
                                                                                }}
                                                                        />
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                                                                                <div className="px-3 py-2 border-b border-gray-100">
                                                                                        <p className="text-xs font-medium text-gray-500">Add to Space</p>
                                                                                </div>

                                                                                {/* Existing Spaces - filter out ones already on the card */}
                                                                                <div className="max-h-40 overflow-y-auto">
                                                                                        {availableSpaces
                                                                                                .filter(space => !tags.includes(space))
                                                                                                .map(space => (
                                                                                                        <button
                                                                                                                key={space}
                                                                                                                onClick={() => handleAddToSpace(space)}
                                                                                                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors capitalize"
                                                                                                        >
                                                                                                                {space}
                                                                                                        </button>
                                                                                                ))}
                                                                                        {availableSpaces.filter(space => !tags.includes(space)).length === 0 && (
                                                                                                <p className="px-3 py-2 text-sm text-gray-400 italic">No other spaces available</p>
                                                                                        )}
                                                                                </div>

                                                                                <div className="border-t border-gray-100 mt-1 pt-1">
                                                                                        {isCreatingSpace ? (
                                                                                                <div className="px-3 py-2">
                                                                                                        <input
                                                                                                                autoFocus
                                                                                                                type="text"
                                                                                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[var(--accent-primary)]"
                                                                                                                placeholder="Space name..."
                                                                                                                value={newSpaceName}
                                                                                                                onChange={(e) => setNewSpaceName(e.target.value)}
                                                                                                                onKeyDown={(e) => {
                                                                                                                        if (e.key === 'Enter') handleCreateSpace();
                                                                                                                        if (e.key === 'Escape') setIsCreatingSpace(false);
                                                                                                                }}
                                                                                                        />
                                                                                                        <div className="flex gap-2 mt-2">
                                                                                                                <button
                                                                                                                        onClick={handleCreateSpace}
                                                                                                                        className="flex-1 py-1.5 text-xs font-medium bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90"
                                                                                                                >
                                                                                                                        Create
                                                                                                                </button>
                                                                                                                <button
                                                                                                                        onClick={() => setIsCreatingSpace(false)}
                                                                                                                        className="flex-1 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                                                                                                >
                                                                                                                        Cancel
                                                                                                                </button>
                                                                                                        </div>
                                                                                                </div>
                                                                                        ) : (
                                                                                                <button
                                                                                                        onClick={() => setIsCreatingSpace(true)}
                                                                                                        className="w-full px-3 py-2 text-left text-sm text-[var(--accent-primary)] hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
                                                                                                >
                                                                                                        <Plus className="w-4 h-4" />
                                                                                                        Create New Space
                                                                                                </button>
                                                                                        )}
                                                                                </div>
                                                                        </div>
                                                                </>
                                                        )}
                                                </div>
                                                <button className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-900 border border-gray-100 hover:border-gray-300">
                                                        <Share2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onClose();
                                                                router.push(`/?similar=${card.id}`);
                                                        }}
                                                        className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-purple-500 border border-gray-100 hover:border-purple-200"
                                                        title="See Similar"
                                                        aria-label="See Similar"
                                                >
                                                        <Sparkles className="w-5 h-5" />
                                                </button>
                                                {onArchive && !card.archivedAt && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onArchive(card.id);
                                                                        onClose();
                                                                }}
                                                                className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-[var(--accent-primary)] border border-gray-100 hover:border-[var(--accent-primary)]/30"
                                                                title="Archive"
                                                        >
                                                                <Archive className="w-5 h-5" />
                                                        </button>
                                                )}
                                                <button
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete?.(card.id);
                                                        }}
                                                        className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-red-500 border border-gray-100 hover:border-red-200"
                                                        title="Delete (Trash)"
                                                >
                                                        <Trash2 className="w-5 h-5" />
                                                </button>
                                                {onRestore && (
                                                        <button
                                                                onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onRestore(card.id);
                                                                }}
                                                                className="p-3 rounded-full hover:bg-gray-50 transition-colors text-gray-400 hover:text-green-500 border border-gray-100 hover:border-green-200"
                                                                title="Restore"
                                                        >
                                                                <RotateCcw className="w-5 h-5" />
                                                        </button>
                                                )}
                                        </div>
                                </div>
                        </div>
                </div>

        );
}


/**
 * AIThinkingIndicator - Minimalist, premium feedback
 */
function AIThinkingIndicator({
        createdAt,
        isReAnalyzing,
        hasFailed,
        retryCount,
        onRetry,
        onManual
}: {
        createdAt: string;
        isReAnalyzing: boolean;
        hasFailed: boolean;
        retryCount: number;
        onRetry: () => void;
        onManual: () => void;
}) {
        const [elapsed, setElapsed] = useState(0);
        const [showLongerMessage, setShowLongerMessage] = useState(false);

        useEffect(() => {
                if (isReAnalyzing) {
                        setElapsed(1000);
                        setShowLongerMessage(false);
                        return;
                }
                const start = new Date(createdAt).getTime();
                const interval = setInterval(() => {
                        const now = Date.now();
                        const e = now - start;
                        setElapsed(e);
                        if (e > 15000) setShowLongerMessage(true);
                }, 100);
                return () => clearInterval(interval);
        }, [createdAt, isReAnalyzing]);

        // Failed State
        if (hasFailed) {
                // If we have already retried once (retryCount >= 1), suggest manual
                if (retryCount >= 1) {
                        return (
                                <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-3 animate-in fade-in">
                                        <div className="flex items-center gap-2 text-gray-500">
                                                <Sparkles className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium">AI couldn't summarize this card.</span>
                                        </div>
                                        <button
                                                onClick={onManual}
                                                className="text-xs font-bold text-[var(--accent-primary)] hover:underline self-start"
                                        >
                                                Write your own summary &rarr;
                                        </button>
                                </div>
                        );
                }

                // First failure - Offer Retry
                return (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-between animate-in fade-in">
                                <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        <span className="text-xs font-medium text-red-600">AI analysis process paused.</span>
                                </div>
                                <button
                                        onClick={onRetry}
                                        className="text-xs font-bold bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                                >
                                        Retry
                                </button>
                        </div>
                );
        }

        // Processing State
        const getStatusText = () => {
                if (isReAnalyzing) return "Refining analysis...";
                if (elapsed < 3000) return "Reading content...";
                if (elapsed < 8000) return "Analyzing...";
                if (elapsed < 20000) return "Finishing up...";
                return "Taking a moment...";
        };

        return (
                <div className="mb-8 p-5 bg-gray-50/30 rounded-xl border border-gray-100/50">
                        <div className="flex items-center gap-3">
                                <div className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-primary)]"></span>
                                </div>
                                <span className={`text-xs font-medium bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent animate-pulse`}>
                                        {getStatusText()}
                                </span>
                        </div>
                </div>
        );
}

