#!/bin/bash
#
# Start dev-browser server for autonomous development
# This must be running before ralph-loop.sh can use browser automation
#

SKILLS_DIR="${HOME}/.claude/skills/dev-browser"

cd "$SKILLS_DIR"

echo "Starting dev-browser server..."
echo "Mode: Standalone (headless Chromium)"
echo ""

# Start in headless mode for autonomous operation
./server.sh --headless &
DEV_BROWSER_PID=$!

echo "Dev-browser server started with PID: $DEV_BROWSER_PID"
echo "Waiting for Ready message..."

# Wait for server to be ready (max 30 seconds)
TIMEOUT=30
ELAPSED=0
while [[ $ELAPSED -lt $TIMEOUT ]]; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "Dev-browser server is ready!"
    echo ""
    echo "To stop: kill $DEV_BROWSER_PID"
    exit 0
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

echo "Warning: Server may not be fully ready yet. Check manually."
echo "PID: $DEV_BROWSER_PID"
