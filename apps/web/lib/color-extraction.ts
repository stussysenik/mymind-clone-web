/**
 * Color Extraction Utility
 *
 * Extracts dominant colors from images using KMeans clustering.
 * Useful for creating visually cohesive card backgrounds and accents.
 *
 * Based on the approach: reshape pixels -> KMeans clustering -> extract centroids
 */

// Simple KMeans implementation for RGB color clustering
interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorResult {
  hex: string;
  rgb: RGB;
  percentage: number;
}

/**
 * Extract dominant colors from image data using KMeans clustering
 * @param imageData - Raw pixel data (Uint8ClampedArray from canvas or sharp)
 * @param numColors - Number of colors to extract (default: 5)
 * @param quality - Sample every Nth pixel for performance (default: 10)
 */
export function extractDominantColors(
  imageData: Uint8Array | Uint8ClampedArray,
  numColors: number = 8,
  quality: number = 10
): ColorResult[] {
  // Sample pixels for performance
  const pixels: RGB[] = [];

  for (let i = 0; i < imageData.length; i += 4 * quality) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];

    // Skip transparent pixels
    if (a < 125) continue;

    // Skip very light (white) and very dark (black) pixels
    if (r > 250 && g > 250 && b > 250) continue;
    if (r < 5 && g < 5 && b < 5) continue;

    pixels.push({ r, g, b });
  }

  if (pixels.length === 0) {
    return [{ hex: '#888888', rgb: { r: 136, g: 136, b: 136 }, percentage: 100 }];
  }

  // Run KMeans clustering
  const clusters = kMeans(pixels, numColors, 10);

  // Sort by cluster size (most dominant first)
  clusters.sort((a, b) => b.count - a.count);

  // Calculate percentages and format results
  const totalPixels = pixels.length;
  return clusters.map(cluster => ({
    hex: rgbToHex(cluster.centroid),
    rgb: cluster.centroid,
    percentage: Math.round((cluster.count / totalPixels) * 100)
  }));
}

/**
 * Simple KMeans clustering for RGB colors
 */
function kMeans(
  pixels: RGB[],
  k: number,
  maxIterations: number
): { centroid: RGB; count: number }[] {
  // Initialize centroids randomly from pixel samples
  const centroids: RGB[] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push({ ...pixels[i * step] });
  }

  let assignments: number[] = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each pixel to nearest centroid
    let changed = false;
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      let minDist = Infinity;
      let nearest = 0;

      for (let j = 0; j < centroids.length; j++) {
        const dist = colorDistance(pixel, centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          nearest = j;
        }
      }

      if (assignments[i] !== nearest) {
        assignments[i] = nearest;
        changed = true;
      }
    }

    if (!changed) break;

    // Update centroids
    const sums: { r: number; g: number; b: number; count: number }[] =
      centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

    for (let i = 0; i < pixels.length; i++) {
      const cluster = assignments[i];
      sums[cluster].r += pixels[i].r;
      sums[cluster].g += pixels[i].g;
      sums[cluster].b += pixels[i].b;
      sums[cluster].count++;
    }

    for (let j = 0; j < centroids.length; j++) {
      if (sums[j].count > 0) {
        centroids[j] = {
          r: Math.round(sums[j].r / sums[j].count),
          g: Math.round(sums[j].g / sums[j].count),
          b: Math.round(sums[j].b / sums[j].count)
        };
      }
    }
  }

  // Count final assignments
  const counts = new Array(k).fill(0);
  for (const a of assignments) {
    counts[a]++;
  }

  return centroids.map((centroid, i) => ({
    centroid,
    count: counts[i]
  }));
}

/**
 * Euclidean distance in RGB color space
 */
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastingTextColor(hex: string): '#000000' | '#ffffff' {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Extract colors from image URL (server-side with sharp)
 */
export async function extractColorsFromUrl(imageUrl: string): Promise<ColorResult[]> {
  try {
    // Dynamically import sharp (server-side only)
    // @ts-expect-error - sharp is optional and may not have types in serverless
    const sharp = (await import('sharp')).default;

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');

    const buffer = Buffer.from(await response.arrayBuffer());

    // Process with sharp - resize for performance
    const { data, info } = await sharp(buffer)
      .resize(100, 100, { fit: 'inside' })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    return extractDominantColors(data, 5, 1);
  } catch (error) {
    console.error('[ColorExtraction] Failed to extract colors:', error);
    return [{ hex: '#888888', rgb: { r: 136, g: 136, b: 136 }, percentage: 100 }];
  }
}

/**
 * Get a nice accent color from extracted palette
 * Prefers saturated, non-gray colors
 */
export function getBestAccentColor(colors: ColorResult[]): string {
  for (const color of colors) {
    const { r, g, b } = color.rgb;

    // Calculate saturation (simple approximation)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    // Skip grays (low saturation) and very dark/light colors
    if (saturation > 0.2 && max > 50 && max < 230) {
      return color.hex;
    }
  }

  // Fallback to first color
  return colors[0]?.hex || '#888888';
}
