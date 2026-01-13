#!/bin/bash
#
# Vision-Driven Overnight Development Runner
#
# This is the V2 runner that implements entire VISIONS, not just single specs.
# The AI will autonomously:
# 1. Analyze the vision
# 2. Create specs as needed (spec chaining)
# 3. Implement each spec
# 4. Evaluate progress
# 5. Create more specs if gaps found
# 6. Complete only when vision is FULLY realized
#
# Usage: ./run-vision-overnight.sh <vision-file>
# Example: ./run-vision-overnight.sh openspec/visions/ios-share-sheet.md
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
VISION_FILE="${1:-}"

cd "$PROJECT_DIR"

echo "=============================================="
echo "Vision-Driven Overnight Development (V2)"
echo "=============================================="
echo "Project: $PROJECT_DIR"
echo "Started: $(date)"
echo ""

if [[ -z "$VISION_FILE" ]]; then
  echo "Error: No vision file provided"
  echo ""
  echo "Usage: $0 <vision-file>"
  echo ""
  echo "Available visions:"
  ls -1 openspec/visions/*.md 2>/dev/null || echo "  (none yet - create one first)"
  echo ""
  echo "To create a vision, write a markdown file describing:"
  echo "  - The end goal (what does 'done' look like?)"
  echo "  - Key capabilities needed"
  echo "  - Success criteria"
  echo "  - Performance requirements"
  exit 1
fi

if [[ ! -f "$VISION_FILE" ]]; then
  echo "Error: Vision file not found: $VISION_FILE"
  exit 1
fi

echo "Vision File: $VISION_FILE"
echo ""
echo "--- Vision Content Preview ---"
head -30 "$VISION_FILE"
echo "..."
echo "--- End Preview ---"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check if dev-browser server should be started
if ! pgrep -f "dev-browser.*server" > /dev/null 2>&1; then
  echo "  Starting dev-browser server..."
  "$SCRIPT_DIR/start-dev-browser.sh" &
  sleep 5
else
  echo "  dev-browser server: running"
fi

# Create logs directory
mkdir -p "$PROJECT_DIR/logs/ralph"

echo ""
echo "=============================================="
echo "Starting Vision Loop"
echo "=============================================="
echo ""
echo "The AI will now:"
echo "  1. Analyze the vision"
echo "  2. Create specs as needed"
echo "  3. Implement each spec (test-first)"
echo "  4. Evaluate progress toward vision"
echo "  5. Create more specs if gaps found"
echo "  6. Complete only when vision is fully realized"
echo ""
echo "Max iterations: 100"
echo "Logs: $PROJECT_DIR/logs/ralph/"
echo ""
echo "You can safely go to sleep now!"
echo "=============================================="
echo ""

# Run the V2 vision-driven loop
"$SCRIPT_DIR/ralph-loop-v2.sh" "$VISION_FILE" \
  --max-iterations 100 \
  --log-dir "$PROJECT_DIR/logs/ralph"

echo ""
echo "=============================================="
echo "Vision run completed: $(date)"
echo "=============================================="
