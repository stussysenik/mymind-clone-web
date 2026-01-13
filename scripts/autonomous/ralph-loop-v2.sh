#!/bin/bash
#
# Ralph Wiggum Loop V2 - Vision-Driven Autonomous Development
#
# Unlike V1 which implements a single spec, V2 is vision-driven:
# - Reads a VISION document (the end goal)
# - Autonomously creates specs as needed
# - Implements spec by spec
# - Evaluates progress toward vision after each spec
# - Creates new specs when gaps are discovered
# - Only completes when VISION is fully realized
#
# Usage: ./ralph-loop-v2.sh "<vision-file>" [--max-iterations N]
#
# Example:
#   ./ralph-loop-v2.sh "openspec/visions/ios-share-sheet.md" --max-iterations 100
#

set -e

# Source permission configuration if available
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
if [[ -f "$PROJECT_DIR/.claude-ops/config.sh" ]]; then
  source "$PROJECT_DIR/.claude-ops/config.sh"
  echo "Loaded permission config from .claude-ops/config.sh"
fi

# Default configuration
MAX_ITERATIONS=100
VISION_FILE=""
LOG_DIR="$PROJECT_DIR/logs/ralph"
COMPLETION_PROMISE="VISION_ACHIEVED"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --log-dir)
      LOG_DIR="$2"
      shift 2
      ;;
    *)
      if [[ -z "$VISION_FILE" ]]; then
        VISION_FILE="$1"
      fi
      shift
      ;;
  esac
done

if [[ -z "$VISION_FILE" ]]; then
  echo "Error: No vision file provided"
  echo "Usage: $0 <vision-file> [--max-iterations N]"
  exit 1
fi

if [[ ! -f "$PROJECT_DIR/$VISION_FILE" ]]; then
  echo "Error: Vision file not found: $PROJECT_DIR/$VISION_FILE"
  exit 1
fi

# Create log directory
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/vision_${TIMESTAMP}.log"
ITERATION_DIR="$LOG_DIR/iterations_${TIMESTAMP}"
STATE_FILE="$LOG_DIR/state_${TIMESTAMP}.json"
mkdir -p "$ITERATION_DIR"

# Read vision content
VISION_CONTENT=$(cat "$PROJECT_DIR/$VISION_FILE")

echo "================================================" | tee -a "$LOG_FILE"
echo "Ralph Wiggum V2 - Vision-Driven Loop" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "Vision File: $VISION_FILE" | tee -a "$LOG_FILE"
echo "Max Iterations: $MAX_ITERATIONS" | tee -a "$LOG_FILE"
echo "Log File: $LOG_FILE" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"

# Initialize state file
cat > "$STATE_FILE" << STATEEOF
{
  "vision_file": "$VISION_FILE",
  "started": "$(date -Iseconds)",
  "iteration": 0,
  "specs_created": [],
  "specs_completed": [],
  "current_phase": "analyzing_vision",
  "blockers": [],
  "progress_percent": 0
}
STATEEOF

# The meta-prompt that drives vision-to-completion
VISION_PROMPT="You are an autonomous AI developer implementing a VISION from start to finish.

## YOUR VISION (The End Goal)
File: $VISION_FILE

$VISION_CONTENT

---

## YOUR DEVELOPMENT METHODOLOGY

You operate in a **spec-chain loop**:

### 1. ANALYZE PHASE
- Read the vision document
- List ALL capabilities needed to achieve the vision
- Check what's already implemented (read existing code)
- Identify gaps between current state and vision

### 2. SPEC PHASE
- If no active spec exists, create one using: /openspec propose
- Specs go in: openspec/changes/NNN-feature-name.md
- Each spec should be SMALL and IMPLEMENTABLE (1-4 hours of work)
- Include clear acceptance criteria and tests

### 3. IMPLEMENT PHASE
- Write failing Playwright tests first
- Implement code to pass tests
- Use dev-browser for visual verification
- Use chrome-devtools for performance (<200ms)
- Commit after each working increment

### 4. VERIFY PHASE
- Run all tests: npm test / npx playwright test
- Check performance budgets
- Visual verification with screenshots

### 5. EVALUATE PHASE (Critical!)
After completing a spec, ask yourself:
- Is the VISION fully achieved? (all capabilities working)
- What's still missing?
- Do I need another spec?

If vision NOT complete → Create next spec → Loop back to step 2
If vision IS complete → Output: $COMPLETION_PROMISE

---

## STATE TRACKING

Update this file after each significant action: $STATE_FILE

Read it at the start of each iteration to remember:
- What specs you've created
- What's been completed
- Current progress toward vision
- Any blockers encountered

---

## TOOLS AVAILABLE

1. **openspec**: /openspec propose, /openspec apply, /openspec archive
2. **dev-browser**: Browser automation (start server first if needed)
3. **chrome-devtools**: Performance profiling, debugging
4. **brave-search**: Documentation lookup when stuck
5. **playwright**: E2E testing

---

## DISCIPLINE RULES

1. NEVER implement without a spec first
2. NEVER skip tests - they define success
3. NEVER ignore performance budget (<200ms)
4. ALWAYS commit working code frequently
5. ALWAYS update state file after major actions
6. ALWAYS create a new spec when you discover missing functionality

---

## COMPLETION CRITERIA

Output exactly '$COMPLETION_PROMISE' ONLY when:
- [ ] All vision capabilities are implemented
- [ ] All Playwright tests pass
- [ ] Performance within budget
- [ ] Code committed and clean
- [ ] No known blockers or gaps

If ANY of these are false, create the next spec and continue.

---

## CURRENT ITERATION INFO
Iteration: ITERATION_PLACEHOLDER / $MAX_ITERATIONS
State File: $STATE_FILE
Logs: $ITERATION_DIR

Read the state file first to understand where you left off."

iteration=0
completed=false
consecutive_failures=0
MAX_CONSECUTIVE_FAILURES=5

while [[ $iteration -lt $MAX_ITERATIONS ]] && [[ "$completed" != "true" ]]; do
  iteration=$((iteration + 1))
  ITER_FILE="$ITERATION_DIR/iteration_${iteration}.txt"

  echo "" | tee -a "$LOG_FILE"
  echo "=== ITERATION $iteration of $MAX_ITERATIONS ===" | tee -a "$LOG_FILE"
  echo "Started: $(date)" | tee -a "$LOG_FILE"

  # Replace iteration placeholder
  CURRENT_PROMPT="${VISION_PROMPT//ITERATION_PLACEHOLDER/$iteration}"

  # Run Claude with the vision prompt (15 min timeout per iteration)
  OUTPUT=$(timeout 900 claude --dangerously-skip-permissions -p "$CURRENT_PROMPT" 2>&1) || true
  EXIT_CODE=$?

  # Save iteration output
  echo "$OUTPUT" > "$ITER_FILE"
  echo "$OUTPUT" >> "$LOG_FILE"

  # Circuit breaker: detect repeated failures
  if [[ $EXIT_CODE -ne 0 ]] || [[ -z "$OUTPUT" ]] || echo "$OUTPUT" | grep -qE "(error|Error|ERROR|rate.limit|timeout)"; then
    consecutive_failures=$((consecutive_failures + 1))
    echo "WARNING: Potential failure detected (consecutive: $consecutive_failures)" | tee -a "$LOG_FILE"

    if [[ $consecutive_failures -ge $MAX_CONSECUTIVE_FAILURES ]]; then
      echo "CIRCUIT BREAKER: $MAX_CONSECUTIVE_FAILURES consecutive failures. Pausing for 5 minutes..." | tee -a "$LOG_FILE"
      sleep 300
      consecutive_failures=0
    fi
  else
    consecutive_failures=0  # Reset on success
  fi

  # Check for vision achieved
  if echo "$OUTPUT" | grep -q "$COMPLETION_PROMISE"; then
    completed=true
    echo "" | tee -a "$LOG_FILE"
    echo "================================================" | tee -a "$LOG_FILE"
    echo "VISION ACHIEVED at iteration $iteration!" | tee -a "$LOG_FILE"
    echo "Finished: $(date)" | tee -a "$LOG_FILE"
    echo "================================================" | tee -a "$LOG_FILE"
  fi

  # Update state file with iteration count
  if command -v jq &> /dev/null; then
    jq ".iteration = $iteration | .consecutive_failures = $consecutive_failures" "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
  fi

  # Brief pause between iterations (longer pause to avoid rate limits)
  if [[ "$completed" != "true" ]] && [[ $iteration -lt $MAX_ITERATIONS ]]; then
    sleep 5
  fi
done

if [[ "$completed" != "true" ]]; then
  echo "" | tee -a "$LOG_FILE"
  echo "================================================" | tee -a "$LOG_FILE"
  echo "MAX ITERATIONS REACHED ($MAX_ITERATIONS)" | tee -a "$LOG_FILE"
  echo "Vision may be incomplete. Review:" | tee -a "$LOG_FILE"
  echo "  - State: $STATE_FILE" | tee -a "$LOG_FILE"
  echo "  - Logs: $LOG_DIR" | tee -a "$LOG_FILE"
  echo "Finished: $(date)" | tee -a "$LOG_FILE"
  echo "================================================" | tee -a "$LOG_FILE"
  exit 1
fi

exit 0
