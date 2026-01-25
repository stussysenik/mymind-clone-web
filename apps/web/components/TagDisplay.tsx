/**
 * MyMind Clone - Tag Display Component
 *
 * Consistent tag/hashtag display with colored dots.
 * Used across all card types for visual consistency.
 *
 * @fileoverview Reusable tag display with colored indicators
 */

'use client';

// Color palette for tags - cycles through these colors
const TAG_COLORS = [
  '#10B981', // emerald/teal
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F97316', // orange
  '#EC4899', // pink
  '#14B8A6', // cyan
  '#EAB308', // yellow
  '#EF4444', // red
];

interface TagDisplayProps {
  tags: string[];
  maxTags?: number;
  className?: string;
}

/**
 * Displays tags with colored dot indicators.
 * Consistent style: ● tag-name
 */
export function TagDisplay({ tags, maxTags = 5, className = '' }: TagDisplayProps) {
  if (!tags || tags.length === 0) return null;

  const displayTags = tags.slice(0, maxTags);

  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1.5 ${className}`}>
      {displayTags.map((tag, index) => (
        <span
          key={tag}
          className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]"
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: TAG_COLORS[index % TAG_COLORS.length] }}
          />
          {tag}
        </span>
      ))}
    </div>
  );
}

export default TagDisplay;
