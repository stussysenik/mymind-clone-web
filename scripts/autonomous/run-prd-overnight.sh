#!/bin/bash
#
# Overnight PRD Implementation Runner
# Combines all autonomous development tools for sleep-time development
#
# Prerequisites:
# 1. Chrome must be running with remote debugging:
#    google-chrome --remote-debugging-port=9222
# 2. Dev-browser server should be started
#
# Usage: ./run-prd-overnight.sh <spec-file>
# Example: ./run-prd-overnight.sh openspec/changes/001-ios-share-sheet.md
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SPEC_FILE="${1:-openspec/changes/001-ios-share-sheet.md}"

cd "$PROJECT_DIR"

echo "=============================================="
echo "Overnight PRD Implementation Runner"
echo "=============================================="
echo "Project: $PROJECT_DIR"
echo "Spec File: $SPEC_FILE"
echo "Started: $(date)"
echo ""

# Verify spec file exists
if [[ ! -f "$SPEC_FILE" ]]; then
  echo "Error: Spec file not found: $SPEC_FILE"
  echo "Please create the spec first using: /openspec propose"
  exit 1
fi

# Read spec content for the prompt
SPEC_CONTENT=$(cat "$SPEC_FILE")

# Create the comprehensive overnight prompt
PROMPT="You are implementing a feature overnight while the developer sleeps.

## Spec to Implement
File: $SPEC_FILE

$SPEC_CONTENT

## Your Mission
Implement this feature completely, following the openspec workflow:

### Phase 1: Analysis & Test Setup
1. Read and understand the spec thoroughly
2. Explore the codebase to understand existing patterns
3. Write Playwright E2E tests that define success criteria (tests should fail initially)

### Phase 2: Implementation
4. Implement the feature incrementally
5. After each significant change, run tests to verify progress
6. Use dev-browser skill to visually verify UI changes
7. Use chrome-devtools MCP to verify <200ms performance budget

### Phase 3: Verification & Cleanup
8. Ensure all tests pass
9. Run the build to check for type errors
10. Commit working code with descriptive messages
11. Update the spec with implementation notes if needed

## Tools Available
- **openspec**: For spec management (/openspec apply when ready)
- **dev-browser skill**: For browser automation and visual testing
- **chrome-devtools MCP**: For performance profiling and debugging
- **brave-search MCP**: For documentation and best practices lookup
- **playwright**: For E2E testing

## Workflow Rules
- Accept all permission prompts
- Commit frequently with atomic, descriptive commits
- If stuck on one part, document the blocker and move to another
- Prioritize working code over perfect code
- Test after every significant change

## Completion
When the feature is fully implemented with:
- All E2E tests passing
- Build succeeding
- Performance within budget (<200ms)
- Code committed

Output exactly: RALPH_COMPLETE"

# Start dev-browser server in background if not already running
echo "Checking dev-browser server..."
if ! pgrep -f "dev-browser.*server" > /dev/null; then
  echo "Starting dev-browser server..."
  "$SCRIPT_DIR/start-dev-browser.sh" &
  sleep 5
fi

# Create logs directory
mkdir -p "$PROJECT_DIR/logs/ralph"

echo ""
echo "Starting Ralph Wiggum loop..."
echo "Max iterations: 50"
echo "Logs: $PROJECT_DIR/logs/ralph/"
echo ""
echo "You can safely go to sleep now!"
echo "Check logs/ralph/ in the morning for results."
echo ""

# Run the loop
"$SCRIPT_DIR/ralph-loop.sh" "$PROMPT" \
  --max-iterations 50 \
  --completion-promise "RALPH_COMPLETE" \
  --log-dir "$PROJECT_DIR/logs/ralph"

echo ""
echo "=============================================="
echo "Overnight run completed: $(date)"
echo "=============================================="
