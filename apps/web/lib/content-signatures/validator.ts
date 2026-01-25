/**
 * Content Signature Validator
 *
 * Validates scraped content against platform signatures.
 * Ensures data quality and consistency.
 *
 * @fileoverview Validation utilities for content signatures
 */

import type { ScrapedContent } from '../scraper';
import { getContentSignatureFromUrl, type ContentSignature, type ScrapedContentFields } from './index';

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  suggestions: ContentFix[];
}

export interface ValidationIssue {
  field: keyof ScrapedContentFields;
  severity: 'error' | 'warning';
  message: string;
}

export interface ContentFix {
  field: keyof ScrapedContentFields;
  currentValue: string | null;
  suggestedValue: string;
  reason: string;
}

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Validate scraped content against its platform signature
 */
export function validateContent(
  content: ScrapedContent,
  url: string
): ValidationResult {
  const signature = getContentSignatureFromUrl(url);
  const issues: ValidationIssue[] = [];
  const suggestions: ContentFix[] = [];

  // Check required fields
  for (const field of signature.requiredFields) {
    const value = content[field as keyof ScrapedContent];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      issues.push({
        field,
        severity: 'error',
        message: `Required field "${field}" is missing or empty`,
      });
    }
  }

  // Validate title
  validateTitle(content, signature, issues, suggestions);

  // Validate author separation
  validateAuthorSeparation(content, signature, issues, suggestions);

  // Validate images
  validateImages(content, signature, issues, suggestions);

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
    suggestions,
  };
}

/**
 * Validate title formatting
 */
function validateTitle(
  content: ScrapedContent,
  signature: ContentSignature,
  issues: ValidationIssue[],
  suggestions: ContentFix[]
): void {
  if (!content.title) return;

  // Check title length
  if (content.title.length > signature.title.maxLength) {
    issues.push({
      field: 'title',
      severity: 'warning',
      message: `Title exceeds max length (${content.title.length} > ${signature.title.maxLength})`,
    });

    suggestions.push({
      field: 'title',
      currentValue: content.title,
      suggestedValue: content.title.slice(0, signature.title.maxLength - 3) + '...',
      reason: 'Truncate to max length',
    });
  }
}

/**
 * Validate that author is properly separated from title
 */
function validateAuthorSeparation(
  content: ScrapedContent,
  signature: ContentSignature,
  issues: ValidationIssue[],
  suggestions: ContentFix[]
): void {
  // Only check for platforms that require author separation
  if (signature.title.authorFormat !== 'separate') return;
  if (!content.author || !content.title) return;

  const authorLower = content.author.toLowerCase();
  const titleLower = content.title.toLowerCase();

  // Check if author name appears at start of title (concatenation bug)
  if (titleLower.startsWith(authorLower)) {
    issues.push({
      field: 'title',
      severity: 'error',
      message: `Title contains author prefix: "${content.author}" should be separate`,
    });

    // Suggest fixed title
    const fixedTitle = content.title.slice(content.author.length).trim();
    if (fixedTitle.length > 0) {
      suggestions.push({
        field: 'title',
        currentValue: content.title,
        suggestedValue: fixedTitle,
        reason: 'Remove author prefix from title',
      });
    }
  }

  // Check for common username patterns (e.g., @username at start)
  const usernamePattern = /^@?[a-zA-Z0-9_]+/;
  const match = content.title.match(usernamePattern);
  if (match && match[0].length > 3) {
    // Could be a username
    const potentialUsername = match[0].replace('@', '');
    if (
      content.author &&
      potentialUsername.toLowerCase() === content.author.replace('@', '').toLowerCase()
    ) {
      // Already caught above, skip
    } else if (!content.author && content.title.length > potentialUsername.length + 1) {
      // No author extracted, but title might start with one
      issues.push({
        field: 'author',
        severity: 'warning',
        message: `Title may contain embedded username: "${potentialUsername}"`,
      });
    }
  }
}

/**
 * Validate image extraction
 */
function validateImages(
  content: ScrapedContent,
  signature: ContentSignature,
  issues: ValidationIssue[],
  suggestions: ContentFix[]
): void {
  if (!signature.extraction.extractImages) return;

  // Check for low-quality image indicators
  if (content.imageUrl) {
    const imageUrl = content.imageUrl.toLowerCase();

    // Check for obvious thumbnail patterns
    const thumbnailPatterns = [
      'thumbnail',
      'thumb',
      '_s.',
      '_t.',
      '150x150',
      '320x320',
      'w=150',
      'w=320',
    ];

    if (thumbnailPatterns.some((p) => imageUrl.includes(p))) {
      issues.push({
        field: 'imageUrl',
        severity: 'warning',
        message: 'Image URL appears to be a thumbnail, not full resolution',
      });
    }

    // Check for static/placeholder images
    if (imageUrl.includes('static') && imageUrl.includes('instagram')) {
      issues.push({
        field: 'imageUrl',
        severity: 'error',
        message: 'Instagram static placeholder detected instead of actual content',
      });
    }
  }

  // Check carousel support
  if (signature.extraction.supportsCarousel && content.images) {
    if (content.images.length === 0 && content.imageUrl) {
      issues.push({
        field: 'images',
        severity: 'warning',
        message: 'Single image extracted but platform supports carousels',
      });
    }
  }
}

/**
 * Apply suggested fixes to content
 */
export function applyContentFixes(
  content: ScrapedContent,
  fixes: ContentFix[]
): ScrapedContent {
  const fixed = { ...content };

  for (const fix of fixes) {
    if (fix.field === 'title' && fix.suggestedValue) {
      fixed.title = fix.suggestedValue;
    }
    if (fix.field === 'author' && fix.suggestedValue) {
      fixed.author = fix.suggestedValue;
    }
    // Add more fields as needed
  }

  return fixed;
}

/**
 * Format title according to platform signature
 */
export function formatTitle(
  title: string,
  author: string | undefined,
  signature: ContentSignature
): string {
  const truncatedTitle = title.slice(0, signature.title.maxLength);

  switch (signature.title.authorFormat) {
    case 'prefix':
      if (author && signature.title.authorSeparator) {
        return `${author}${signature.title.authorSeparator}${truncatedTitle}`.slice(
          0,
          signature.title.maxLength
        );
      }
      break;
    case 'suffix':
      if (author && signature.title.authorSeparator) {
        const withSuffix = `${truncatedTitle}${signature.title.authorSeparator}${author}`;
        return withSuffix.slice(0, signature.title.maxLength);
      }
      break;
    case 'separate':
    case null:
    default:
      // Return title without author
      break;
  }

  return truncatedTitle;
}
