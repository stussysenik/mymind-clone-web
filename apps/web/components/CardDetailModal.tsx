'use client';

import { X, ExternalLink, Archive, Share2, FolderPlus, Loader2, RotateCcw, Check, Plus, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/lib/types';
import { extractDomain } from '@/lib/platforms';

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
        const [tags, setTags] = useState<string[]>([]);
        const [isAddingTag, setIsAddingTag] = useState(false);
        const [newTagVal, setNewTagVal] = useState('');
        const [note, setNote] = useState('');
        const [isSavingNote, setIsSavingNote] = useState(false);
        const [noteSaved, setNoteSaved] = useState(false);
        const [showSpaceMenu, setShowSpaceMenu] = useState(false);
        const [isCreatingSpace, setIsCreatingSpace] = useState(false);
        const [newSpaceName, setNewSpaceName] = useState('');
        const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const lastSavedNoteRef = useRef<string>('');
        const currentNoteRef = useRef<string>(''); // Track current note for unmount handling
        const [isReAnalyzing, setIsReAnalyzing] = useState(false);
        const [title, setTitle] = useState('');
        const [summary, setSummary] = useState('');
        const [isSavingTitle, setIsSavingTitle] = useState(false);
        const [titleSaved, setTitleSaved] = useState(false);
        const [isSavingSummary, setIsSavingSummary] = useState(false);
        const [summarySaved, setSummarySaved] = useState(false);
        const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const summarySaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

        // Re-analyze card with AI enrichment
        const handleReAnalyze = useCallback(async () => {
                if (!card || isReAnalyzing) return;

                setIsReAnalyzing(true);
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

        useEffect(() => {
                if (card) {
                        setTags(card.tags || []);
                        setNote(card.metadata.note || '');
                        setTitle(card.title || '');
                        setSummary(card.metadata.summary || '');
                }
        }, [card]);

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
                summarySaveTimeoutRef.current = setTimeout(() => saveSummary(val), 1000);
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

                try {
                        await fetch(`/api/cards/${card.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ metadata: updatedMeta })
                        });
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
                if (!newTagVal.trim() || !card) return;
                const normalized = newTagVal.trim().toLowerCase().replace(/\s+/g, '-');
                if (tags.includes(normalized)) {
                        setNewTagVal('');
                        setIsAddingTag(false);
                        return;
                }

                const updated = [...tags, normalized];
                setTags(updated);
                setNewTagVal('');
                setIsAddingTag(false);

                await fetch(`/api/cards/${card.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ tags: updated })
                });
                router.refresh();
        };

        const handleRemoveTag = async (tagToRemove: string) => {
                if (!card) return;
                const updated = tags.filter(t => t !== tagToRemove);
                setTags(updated);

                await fetch(`/api/cards/${card.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ tags: updated })
                });
                router.refresh();
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
                                                saveNote(note);
                                        }
                                }
                                onClose();
                        }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
        }, [isOpen, onClose]);

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
                                        {card.imageUrl ? (
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                        <Image
                                                                src={card.imageUrl}
                                                                alt={card.title || 'Card content'}
                                                                fill
                                                                className="object-contain"
                                                                sizes="(max-width: 768px) 100vw, 70vw"
                                                                priority
                                                                onError={(e) => {
                                                                        // If primary image fails, fallback to Microlink/Gradient
                                                                        // We can't easily mutate props, but we could use local state
                                                                        // However, simplest fix is to hide this image and let background show?
                                                                        // Better: set local state to ignore this image
                                                                        e.currentTarget.style.display = 'none';
                                                                        // Ideally we would trigger a re-render to show the fallback UI, 
                                                                        // but hiding it reveals the bg-gray-100. 
                                                                        // To show the true fallback (Microlink), we need state.
                                                                }}
                                                        />
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
                                </div>

                                {/* RIGHT: Metadata & Notes */}
                                <div className="w-full md:w-1/3 bg-white flex flex-col border-l border-gray-100">
                                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                                                <div className="mb-0">
                                                        <div className="relative">
                                                                <input
                                                                        type="text"
                                                                        value={title}
                                                                        onChange={(e) => handleTitleChange(e.target.value)}
                                                                        className="w-full text-2xl font-serif font-medium text-gray-900 mb-2 leading-snug bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -ml-1 border border-transparent focus:border-gray-200 transition-colors"
                                                                        placeholder="Untitled"
                                                                />
                                                                {isSavingTitle && <Loader2 className="absolute right-2 top-2 w-4 h-4 animate-spin text-[var(--accent-primary)]" />}
                                                                {titleSaved && <Check className="absolute right-2 top-2 w-4 h-4 text-green-500" />}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                                                {new Date(card.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                {domain && (
                                                                        <>
                                                                                <span>•</span>
                                                                                <a
                                                                                        href={card.url || '#'}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors"
                                                                                >
                                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                                        {domain}
                                                                                </a>
                                                                        </>
                                                                )}
                                                        </div>
                                                </div>

                                                {/* Note/Description */}
                                                {card.imageUrl && card.content && (
                                                        <div className="mb-8 text-gray-600 leading-relaxed text-sm font-serif">
                                                                {card.content}
                                                        </div>
                                                )}

                                                {card.metadata.processing && (
                                                        <div className="mb-8 group">
                                                                <div className="mb-3 px-4 py-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 font-mono text-xs">
                                                                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                                                                <span className="flex items-center gap-2 text-[var(--accent-primary)] font-bold tracking-tight">
                                                                                        <div className="relative">
                                                                                                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-ping absolute inset-0 opacity-75"></div>
                                                                                                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full relative"></div>
                                                                                        </div>
                                                                                        AI PROCESSING ACTIVE
                                                                                </span>
                                                                                <LiveETA createdAt={card.createdAt} onReAnalyze={handleReAnalyze} isReAnalyzing={isReAnalyzing} />
                                                                        </div>

                                                                        <ProcessingLog createdAt={card.createdAt} isReAnalyzing={isReAnalyzing} />
                                                                </div>
                                                        </div>
                                                )}

                                                {/* Enrichment Error Banner */}
                                                {!card.metadata.processing && card.metadata.enrichmentError && (
                                                        <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-200">
                                                                <div className="flex items-start gap-3">
                                                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                                        <div className="flex-1 min-w-0">
                                                                                <h4 className="text-sm font-semibold text-red-700 mb-1">
                                                                                        AI Analysis Failed
                                                                                </h4>
                                                                                <p className="text-xs text-red-600 mb-2">
                                                                                        {card.metadata.enrichmentError}
                                                                                </p>
                                                                                {card.metadata.enrichmentFailedAt && (
                                                                                        <p className="text-[10px] text-red-400">
                                                                                                Failed at {new Date(card.metadata.enrichmentFailedAt).toLocaleString()}
                                                                                        </p>
                                                                                )}
                                                                        </div>
                                                                        <button
                                                                                onClick={handleReAnalyze}
                                                                                disabled={isReAnalyzing}
                                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                                        >
                                                                                {isReAnalyzing ? (
                                                                                        <>
                                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                                Analyzing...
                                                                                        </>
                                                                                ) : (
                                                                                        <>
                                                                                                <RefreshCw className="w-3.5 h-3.5" />
                                                                                                Re-analyze
                                                                                        </>
                                                                                )}
                                                                        </button>
                                                                </div>
                                                        </div>
                                                )}

                                                {/* AI Summary Section - Editable */}
                                                {(card.metadata.summary || card.metadata.processing || summary) && (
                                                        <div className="mb-8 p-5 bg-gray-50/50 rounded-xl border border-gray-100 group hover:border-[var(--accent-primary)]/30 transition-colors">
                                                                <div className="flex items-center justify-between mb-2">
                                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                                                                                AI Summary
                                                                        </h4>
                                                                        <div className="flex items-center gap-2">
                                                                                {isSavingSummary && <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-primary)]" />}
                                                                                {summarySaved && <Check className="w-3 h-3 text-green-500" />}
                                                                        </div>
                                                                </div>
                                                                <textarea
                                                                        value={summary}
                                                                        onChange={(e) => handleSummaryChange(e.target.value)}
                                                                        className="w-full min-h-[80px] text-sm text-gray-700 leading-relaxed bg-transparent border-none p-0 focus:ring-0 resize-y placeholder:text-gray-400"
                                                                        placeholder="Add AI summary..."
                                                                />
                                                        </div>
                                                )}

                                                {/* Tags Section */}
                                                <div className="mb-8">
                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                Mind Tags / Spaces
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
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

                                                {/* Notes Input */}
                                                <div>
                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                                                Mind Notes
                                                        </h4>
                                                        <textarea
                                                                className="w-full h-32 p-4 bg-transparent rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/10 focus:border-[var(--accent-primary)] transition-all placeholder:text-gray-300"
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

function ProcessingLog({ createdAt, isReAnalyzing }: { createdAt: string, isReAnalyzing?: boolean }) {
        const [elapsed, setElapsed] = useState(0);

        useEffect(() => {
                if (isReAnalyzing) {
                        setElapsed(1000); // Reset visual progress if retrying
                        return;
                }
                const start = new Date(createdAt).getTime();
                const interval = setInterval(() => {
                        setElapsed(Date.now() - start);
                }, 100);
                return () => clearInterval(interval);
        }, [createdAt, isReAnalyzing]);

        const format = (ms: number) => {
                const s = Math.floor(ms / 1000);
                const sms = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
                return `00:${s.toString().padStart(2, '0')}.${sms}`;
        };

        if (isReAnalyzing) {
                return (
                        <div className="space-y-2 text-gray-500 animate-pulse">
                                <div className="flex gap-3 items-center text-[var(--accent-primary)]">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Re-initializing AI analysis...</span>
                                </div>
                        </div>
                );
        }

        return (
                <div className="space-y-2 text-gray-500">
                        {/* Static Start */}
                        <div className="flex gap-3 items-start opacity-60">
                                <span className="text-gray-300 whitespace-nowrap">{format(120)}</span>
                                <span>Buffer received</span>
                        </div>

                        {/* Dynamic Steps */}
                        <div className={`flex gap-3 items-start transition-opacity duration-300 ${elapsed > 500 ? 'opacity-80' : 'opacity-30'}`}>
                                <span className="text-gray-300 whitespace-nowrap">{format(elapsed > 500 ? 450 : 0)}</span>
                                <span><span className="text-purple-500 font-bold">GLM-4.6V</span> initialized</span>
                        </div>

                        {elapsed > 1500 && (
                                <div className="flex gap-3 items-start text-gray-700 animate-in fade-in slide-in-from-left-2">
                                        <span className="text-gray-300 whitespace-nowrap">{format(elapsed)}</span>
                                        <span className="flex items-center gap-2">
                                                Analyzing vectors
                                                <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-primary)]" />
                                        </span>
                                </div>
                        )}

                        {elapsed > 4000 && (
                                <div className="flex gap-3 items-start text-gray-400 pl-[4.5rem] text-[10px] animate-in fade-in">
                                        <span>&gt; Extracting semantic tags...</span>
                                </div>
                        )}

                        {elapsed > 8000 && (
                                <div className="flex gap-3 items-start text-gray-400 pl-[4.5rem] text-[10px] animate-in fade-in">
                                        <span>&gt; Generating synthesis...</span>
                                </div>
                        )}

                        {elapsed > 12000 && (
                                <div className="flex gap-3 items-start text-orange-400 pl-[4.5rem] text-[10px] animate-in fade-in">
                                        <span>&gt; Finalizing...</span>
                                </div>
                        )}
                </div>
        );
}

/**
 * LiveETA - Shows a live countdown of estimated time remaining
 * Enhanced with timeout detection and re-analyze option
 */
function LiveETA({ createdAt, onReAnalyze, isReAnalyzing }: {
        createdAt: string;
        onReAnalyze?: () => void;
        isReAnalyzing?: boolean;
}) {
        const ESTIMATED_TOTAL_MS = 15000; // 15 seconds estimate
        const WARNING_THRESHOLD_MS = 60000; // 60 seconds - show warning
        const FAILURE_THRESHOLD_MS = 120000; // 120 seconds - likely failed
        const [remaining, setRemaining] = useState(ESTIMATED_TOTAL_MS);
        const [elapsed, setElapsed] = useState(0);

        useEffect(() => {
                const startTime = new Date(createdAt).getTime();
                const interval = setInterval(() => {
                        const now = Date.now();
                        const elapsedMs = now - startTime;
                        const left = Math.max(0, ESTIMATED_TOTAL_MS - elapsedMs);
                        setRemaining(left);
                        setElapsed(elapsedMs);
                }, 100);
                return () => clearInterval(interval);
        }, [createdAt]);

        // Different states based on elapsed time
        if (isReAnalyzing) {
                return (
                        <span className="font-medium px-2 py-0.5 rounded text-[10px] text-blue-600 bg-blue-50 animate-pulse flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Retrying...
                        </span>
                );
        }

        if (elapsed >= FAILURE_THRESHOLD_MS) {
                // Likely failed - show re-analyze option
                return (
                        <span className="flex items-center gap-2">
                                <span className="font-medium px-2 py-0.5 rounded text-[10px] text-red-500 bg-red-50">
                                        May have failed
                                </span>
                                {onReAnalyze && (
                                        <button
                                                onClick={onReAnalyze}
                                                disabled={isReAnalyzing}
                                                className="text-[10px] font-medium text-red-600 hover:text-red-700 underline disabled:opacity-50"
                                        >
                                                {isReAnalyzing ? 'Retrying...' : 'Retry'}
                                        </button>
                                )}
                        </span>
                );
        }

        if (elapsed >= WARNING_THRESHOLD_MS) {
                // Taking longer than expected
                return (
                        <span className="font-medium px-2 py-0.5 rounded text-[10px] text-amber-600 bg-amber-50 animate-pulse">
                                Taking longer than expected...
                        </span>
                );
        }

        // Normal countdown
        const display = remaining > 0
                ? `ETA: ${Math.ceil(remaining / 1000)}s`
                : 'finishing...';

        return (
                <span className={`font-medium px-2 py-0.5 rounded text-[10px] transition-colors ${remaining > 5000
                        ? 'text-gray-400 bg-gray-100'
                        : remaining > 0
                                ? 'text-amber-500 bg-amber-50'
                                : 'text-orange-500 bg-orange-50 animate-pulse'
                        }`}>
                        {display}
                </span>
        );
}

