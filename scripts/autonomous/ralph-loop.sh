#!/bin/bash
#
# Ralph Wiggum Loop - Persistent iteration AI development
# "I'm helping!" - Named after the character who keeps trying despite setbacks
#
# Usage: ./ralph-loop.sh "<prompt>" [--max-iterations N] [--completion-promise "TEXT"]
#
# Example:
#   ./ralph-loop.sh "Implement iOS Share Sheet feature per openspec/changes/001-ios-share-sheet.md" \
#     --max-iterations 50 \
#     --completion-promise "RALPH_COMPLETE"
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
MAX_ITERATIONS=30
COMPLETION_PROMISE="RALPH_COMPLETE"
LOG_DIR="$(dirname "$0")/../../logs/ralph"
PROMPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --completion-promise)
      COMPLETION_PROMISE="$2"
      shift 2
      ;;
    --log-dir)
      LOG_DIR="$2"
      shift 2
      ;;
    *)
      if [[ -z "$PROMPT" ]]; then
        PROMPT="$1"
      fi
      shift
      ;;
  esac
done

if [[ -z "$PROMPT" ]]; then
  echo "Error: No prompt provided"
  echo "Usage: $0 \"<prompt>\" [--max-iterations N] [--completion-promise \"TEXT\"]"
  exit 1
fi

# Create log directory
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/ralph_${TIMESTAMP}.log"
ITERATION_DIR="$LOG_DIR/iterations_${TIMESTAMP}"
mkdir -p "$ITERATION_DIR"

echo "================================================" | tee -a "$LOG_FILE"
echo "Ralph Wiggum Loop Started: $(date)" | tee -a "$LOG_FILE"
echo "Prompt: $PROMPT" | tee -a "$LOG_FILE"
echo "Max Iterations: $MAX_ITERATIONS" | tee -a "$LOG_FILE"
echo "Completion Promise: $COMPLETION_PROMISE" | tee -a "$LOG_FILE"
echo "Log File: $LOG_FILE" | tee -a "$LOG_FILE"
echo "================================================" | tee -a "$LOG_FILE"

# Build the full prompt with context
FULL_PROMPT="$PROMPT

IMPORTANT INSTRUCTIONS FOR AUTONOMOUS EXECUTION:
1. You are running in an autonomous loop. Accept all permission prompts automatically.
2. Use openspec workflow: spec -> test -> implement -> verify
3. Use dev-browser skill for visual testing (start server first)
4. Use chrome-devtools MCP for performance validation (<200ms rule)
5. Use brave-search MCP for documentation lookups
6. Run playwright tests after implementation
7. When task is FULLY complete with passing tests, output exactly: $COMPLETION_PROMISE
8. If blocked, document the blocker and continue with next subtask
9. Commit working increments frequently with descriptive messages

Current iteration context will be appended below.
"

iteration=0
completed=false

while [[ $iteration -lt $MAX_ITERATIONS ]] && [[ "$completed" != "true" ]]; do
  iteration=$((iteration + 1))
  ITER_FILE="$ITERATION_DIR/iteration_${iteration}.txt"

  echo "" | tee -a "$LOG_FILE"
  echo "--- Iteration $iteration of $MAX_ITERATIONS ---" | tee -a "$LOG_FILE"
  echo "Started: $(date)" | tee -a "$LOG_FILE"

  # Run Claude with the prompt, capturing output
  # Using --dangerously-skip-permissions for autonomous execution
  OUTPUT=$(claude --dangerously-skip-permissions -p "$FULL_PROMPT

Iteration: $iteration/$MAX_ITERATIONS
Previous iterations logged to: $ITERATION_DIR
" 2>&1) || true

  # Save iteration output
  echo "$OUTPUT" > "$ITER_FILE"
  echo "$OUTPUT" >> "$LOG_FILE"

  # Check for completion promise
  if echo "$OUTPUT" | grep -q "$COMPLETION_PROMISE"; then
    completed=true
    echo "" | tee -a "$LOG_FILE"
    echo "================================================" | tee -a "$LOG_FILE"
    echo "TASK COMPLETED at iteration $iteration" | tee -a "$LOG_FILE"
    echo "Completion promise found: $COMPLETION_PROMISE" | tee -a "$LOG_FILE"
    echo "Finished: $(date)" | tee -a "$LOG_FILE"
    echo "================================================" | tee -a "$LOG_FILE"
  fi

  # Brief pause between iterations to avoid rate limiting
  if [[ "$completed" != "true" ]] && [[ $iteration -lt $MAX_ITERATIONS ]]; then
    sleep 2
  fi
done

if [[ "$completed" != "true" ]]; then
  echo "" | tee -a "$LOG_FILE"
  echo "================================================" | tee -a "$LOG_FILE"
  echo "MAX ITERATIONS REACHED ($MAX_ITERATIONS)" | tee -a "$LOG_FILE"
  echo "Task may be incomplete. Review logs at: $LOG_DIR" | tee -a "$LOG_FILE"
  echo "Finished: $(date)" | tee -a "$LOG_FILE"
  echo "================================================" | tee -a "$LOG_FILE"
  exit 1
fi

exit 0
