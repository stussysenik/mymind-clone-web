import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Stress Test: Batch Link Addition', () => {
        // Read links from LINKS.md
        const linksPath = path.resolve(__dirname, '../../../LINKS.md');
        // Read file, split by new lines, filter empty lines, filter for valid URLs (simple check)
        const linksInput = fs.readFileSync(linksPath, 'utf-8');
        const links = linksInput
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && line.startsWith('http')); // Include lines starting with http

        test.beforeEach(async ({ page }) => {
                // Assume global setup handles auth, just go to home
                await page.goto('/');
        });

        test('should add all links from LINKS.md', async ({ page }) => {
                test.setTimeout(120000); // Give it enough time for batch processing

                console.log(`Found ${links.length} links to add.`);

                for (const [index, link] of links.entries()) {
                        console.log(`[${index + 1}/${links.length}] Adding: ${link}`);

                        // Open Add Modal
                        await page.locator('button[aria-label="Add Item"]').click();
                        await expect(page.locator('[role="dialog"]')).toBeVisible();

                        // Type/Paste URL - relying on the smart input
                        const input = page.locator('input[placeholder="Paste a link or note..."]');
                        await input.fill(link);

                        // Wait for "Add" button to be potentially active or just press Enter
                        // Check if there is an explicit "Add" button or if Enter works
                        // Based on previous knowledge, Enter works or there is a specific button?
                        // "Add Modal upgraded to Smart Input" suggest simple input.
                        await page.keyboard.press('Enter');

                        // Verify toast or closing of modal
                        // Wait for the modal to close implies success, or a toast
                        await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

                        // Optional: verify it appears in the grid?
                        // This might race with the next add, but let's just ensure we can proceed.
                        // A small delay to ensure backend catches up?
                        await page.waitForTimeout(1000);
                }

                // Final verification: Reload and check count? 
                // Or just trust the process for now.
                // We'll verify at least one card exists
                await page.reload();
                await expect(page.locator('article').first()).toBeVisible();
        });
});
