/**
 * MyMind Clone - Screenshot API Endpoint
 *
 * Self-hosted screenshot capture endpoint using Playwright.
 * Can be called from web, Chrome extension, or iOS share sheet.
 *
 * @fileoverview API route for screenshot capture
 */

import { NextRequest, NextResponse } from 'next/server';
import { captureWithPlaywright, getMicrolinkFallback } from '@/lib/screenshot-playwright';
import { uploadScreenshotToStorage } from '@/lib/supabase';

/**
 * POST /api/screenshot
 *
 * Captures a screenshot of a URL using Playwright and uploads to Supabase Storage.
 *
 * Request body:
 * {
 *   "url": string
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "url": string | null,
 *   "source": "playwright" | "microlink",
 *   "platform": string,
 *   "error"?: string
 * }
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { url } = body;

		if (!url || typeof url !== 'string') {
			return NextResponse.json(
				{ success: false, error: 'Missing or invalid URL' },
				{ status: 400 }
			);
		}

		console.log(`[Screenshot API] Capturing ${url}`);

		// Try Playwright screenshot
		const result = await captureWithPlaywright(url);

		if (result.success && result.buffer.length > 0) {
			// Upload to Supabase Storage
			const uploadedUrl = await uploadScreenshotToStorage(result.buffer, url);

			if (uploadedUrl) {
				console.log(`[Screenshot API] Success: Playwright + Storage for ${result.platform}`);
				return NextResponse.json({
					success: true,
					url: uploadedUrl,
					source: 'playwright',
					platform: result.platform,
				});
			} else {
				console.warn('[Screenshot API] Playwright captured but storage upload failed, falling back to Microlink');
			}
		}

		// Fallback to Microlink
		console.log(`[Screenshot API] Falling back to Microlink for ${url}`);
		const microlinkUrl = getMicrolinkFallback(url);

		return NextResponse.json({
			success: true,
			url: microlinkUrl,
			source: 'microlink',
			platform: result.platform,
		});
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Unknown error';
		console.error('[Screenshot API] Error:', errorMsg);

		return NextResponse.json(
			{
				success: false,
				error: errorMsg,
			},
			{ status: 500 }
		);
	}
}
