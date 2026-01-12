/**
 * Color utility functions for perceptual color similarity
 */

// Convert hex color to RGB
export function hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return [128, 128, 128]; // Default gray
        return [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
        ];
}

// Convert RGB to LAB color space (for perceptual similarity)
export function rgbToLab(rgb: [number, number, number]): [number, number, number] {
        // First convert RGB to XYZ
        let r = rgb[0] / 255;
        let g = rgb[1] / 255;
        let b = rgb[2] / 255;

        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        r *= 100;
        g *= 100;
        b *= 100;

        // D65 illuminant
        let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
        let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

        x /= 95.047;
        y /= 100.0;
        z /= 108.883;

        x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
        y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
        z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

        const L = (116 * y) - 16;
        const a = 500 * (x - y);
        const bLab = 200 * (y - z);

        return [L, a, bLab];
}

// Convert hex directly to LAB
export function hexToLab(hex: string): [number, number, number] {
        return rgbToLab(hexToRgb(hex));
}

/**
 * Calculate Delta E (CIE76) - perceptual color distance
 * Lower values = more similar colors
 * < 1: Not perceptible
 * 1-2: Barely perceptible
 * 2-10: Perceptible at a glance
 * 11-49: Colors more similar than opposite
 * 100+: Completely different colors
 */
export function colorDistance(color1: string, color2: string): number {
        const lab1 = hexToLab(color1);
        const lab2 = hexToLab(color2);

        return Math.sqrt(
                Math.pow(lab2[0] - lab1[0], 2) +
                Math.pow(lab2[1] - lab1[1], 2) +
                Math.pow(lab2[2] - lab1[2], 2)
        );
}

/**
 * Check if any color in a card's palette is similar to target
 */
export function hasMatchingColor(
        cardColors: string[] | undefined,
        targetColor: string,
        threshold: number = 25
): boolean {
        if (!cardColors || cardColors.length === 0) return false;

        return cardColors.some(color => {
                try {
                        return colorDistance(color, targetColor) < threshold;
                } catch {
                        return false;
                }
        });
}

/**
 * Get the best matching color distance for a card
 */
export function getBestColorMatch(
        cardColors: string[] | undefined,
        targetColor: string
): number {
        if (!cardColors || cardColors.length === 0) return Infinity;

        let bestDistance = Infinity;
        for (const color of cardColors) {
                try {
                        const distance = colorDistance(color, targetColor);
                        if (distance < bestDistance) {
                                bestDistance = distance;
                        }
                } catch {
                        // Skip invalid colors
                }
        }
        return bestDistance;
}

/**
 * Validate hex color format
 */
export function isValidHex(color: string): boolean {
        return /^#?([a-f\d]{6}|[a-f\d]{3})$/i.test(color);
}

/**
 * Normalize hex color (ensure # prefix)
 */
export function normalizeHex(color: string): string {
        const hex = color.replace('#', '');
        return `#${hex.toUpperCase()}`;
}
