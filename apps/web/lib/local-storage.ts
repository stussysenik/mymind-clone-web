/**
 * MyMind Clone - Local Storage Fallback
 * 
 * Provides localStorage-based persistence for demo mode.
 * When Supabase is not configured, cards are stored locally.
 * 
 * @fileoverview localStorage card storage for demo mode
 */

import type { Card } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'mymind_cards';

// =============================================================================
// STORAGE OPERATIONS
// =============================================================================

/**
 * Retrieves all cards from localStorage.
 * Returns empty array if no cards or not in browser.
 */
export function getLocalCards(): Card[] {
        if (typeof window === 'undefined') return [];

        try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (!stored) return [];
                const cards = JSON.parse(stored) as Card[];
                // Filter out deleted and archived by default for main view
                // Actually existing getLocalCards returns EVERYTHING?
                // CardGridClient filters them?
                // No, CardGridClient uses localCards as source.
                // Checking CardGridClient usage: setLocalCards(getLocalCards()).
                // Then uniqueCards filters out deletedIds.
                // If I want getLocalCards to return all for the client to filter, I should leave it.
                // But CardGridClient doesn't filter by archivedAt unless I tell it to.
                return cards;
        } catch (error) {
                console.error('[LocalStorage] Error reading cards:', error);
                return [];
        }
}

/**
 * Archives a local card.
 */
export function archiveLocalCard(id: string): boolean {
        if (typeof window === 'undefined') return false;

        try {
                const existing = getLocalCards();
                const updated = existing.map(card => {
                        if (card.id === id) {
                                return { ...card, archivedAt: new Date().toISOString() };
                        }
                        return card;
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return true;
        } catch (error) {
                console.error('[LocalStorage] Error archiving card:', error);
                return false;
        }
}

/**
 * Unarchives a local card.
 */
export function unarchiveLocalCard(id: string): boolean {
        if (typeof window === 'undefined') return false;

        try {
                const existing = getLocalCards();
                const updated = existing.map(card => {
                        if (card.id === id) {
                                return { ...card, archivedAt: null };
                        }
                        return card;
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return true;
        } catch (error) {
                console.error('[LocalStorage] Error unarchiving card:', error);
                return false;
        }
}

/**
 * Updates a local card with partial data.
 * Use for updating tags, metadata, title, etc.
 */
export function updateLocalCard(id: string, updates: Partial<Card>): boolean {
        if (typeof window === 'undefined') return false;

        try {
                const existing = getLocalCards();
                let found = false;
                const updated = existing.map(card => {
                        if (card.id === id) {
                                found = true;
                                return { ...card, ...updates, updatedAt: new Date().toISOString() };
                        }
                        return card;
                });

                if (!found) {
                        console.warn('[LocalStorage] Card not found for update:', id);
                        return false;
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                console.log('[LocalStorage] Card updated:', id, updates);
                return true;
        } catch (error) {
                console.error('[LocalStorage] Error updating card:', error);
                return false;
        }
}

/**
 * Saves a new card to localStorage.
 * Prepends to existing cards (newest first).
 */
export function saveLocalCard(card: Card): void {
        if (typeof window === 'undefined') return;

        try {
                const existing = getLocalCards();
                const updated = [card, ...existing];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
                console.error('[LocalStorage] Error saving card:', error);
        }
}


/**
 * Deletes a card from localStorage by ID.
 * Returns true if card was found and deleted.
 */
export function deleteLocalCard(id: string): boolean {
        if (typeof window === 'undefined') return false;

        try {
                const existing = getLocalCards();
                const filtered = existing.filter(card => card.id !== id);

                if (filtered.length === existing.length) {
                        return false; // Card not found
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                return true;
        } catch (error) {
                console.error('[LocalStorage] Error deleting card:', error);
                return false;
        }
}

/**
 * Clears all cards from localStorage.
 * Useful for testing or reset functionality.
 */
export function clearLocalCards(): void {
        if (typeof window === 'undefined') return;

        try {
                localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
                console.error('[LocalStorage] Error clearing cards:', error);
        }
}
