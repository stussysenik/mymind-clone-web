import { Page } from '@playwright/test';

/**
 * Seeds cards into localStorage to allow UI testing without backend dependencies.
 * This bypasses Supabase RLS and server-side fetching issues.
 */
export async function seedLocalStorage(page: Page) {
        const mockCards = [
                {
                        id: 'mock-1',
                        title: 'Playwright Test Card',
                        content: 'This card is seeded via localStorage for UI testing.',
                        type: 'article',
                        url: 'https://playwright.dev',
                        tags: ['testing', 'automation'],
                        createdAt: new Date().toISOString()
                },
                {
                        id: 'mock-2',
                        title: 'Video Test',
                        content: 'A video card',
                        type: 'video',
                        url: 'https://youtube.com',
                        tags: ['video'],
                        createdAt: new Date().toISOString()
                }
        ];

        await page.addInitScript((cards) => {
                window.localStorage.setItem('mymind_cards', JSON.stringify(cards));
        }, mockCards);

        return mockCards;
}
