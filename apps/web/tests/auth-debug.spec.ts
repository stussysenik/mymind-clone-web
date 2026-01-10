import { test, expect } from '@playwright/test';

test('debug login flow', async ({ page }) => {
        console.log('Navigating to login...');
        await page.goto('/login');

        console.log('Filling credentials...');
        await page.fill('input[type="email"]', 'admin@example.com');
        await page.fill('input[type="password"]', 'admin');

        console.log('Clicking submit...');
        await page.click('button[type="submit"]');

        console.log('Waiting for URL...');
        // Wait for redirect to home or for error message
        try {
                await page.waitForURL('**/', { timeout: 5000 });
                console.log('Success: Redirected to home');
        } catch (e) {
                console.log('Failed to redirect. Checking for errors...');
                const error = await page.locator('.text-red-500').textContent().catch(() => 'No error text found');
                console.log(`Error on page: ${error}`);
                console.log(`Current URL: ${page.url()}`);
                throw e;
        }
});
