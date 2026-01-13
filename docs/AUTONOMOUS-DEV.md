# Autonomous Development Setup

This document describes the Ralph Wiggum AI loop approach for overnight autonomous development.

## Overview

The Ralph Wiggum approach is "a simple while loop that repeatedly feeds an AI agent a prompt until completion." Named after The Simpsons character who embodies "persistent iteration despite setbacks."

## Prerequisites

### 1. Chrome/Chromium with Remote Debugging
```bash
# For snap Chromium (Ubuntu/Pop!_OS):
chromium --remote-debugging-port=9222

# For Google Chrome:
google-chrome --remote-debugging-port=9222
```

### 2. MCP Servers (configured in .mcp.json)
- **chrome-devtools**: Browser automation and performance profiling
- **brave-search**: Documentation and best practices lookup

### 3. Dev-Browser Skill
Located at `~/.claude/skills/dev-browser/`. Start the server before use:
```bash
# Standalone mode (headless Chromium):
~/.claude/skills/dev-browser/server.sh --headless &

# Extension mode (connects to your Chrome):
cd ~/.claude/skills/dev-browser && npm run start-extension &
```

## Scripts

### ralph-loop.sh
The core loop that runs Claude repeatedly until task completion.

```bash
./scripts/autonomous/ralph-loop.sh "<prompt>" \
  --max-iterations 30 \
  --completion-promise "RALPH_COMPLETE"
```

Parameters:
- `<prompt>`: The task description
- `--max-iterations`: Safety limit (default: 30)
- `--completion-promise`: Exact string that signals completion (default: "RALPH_COMPLETE")
- `--log-dir`: Where to store logs (default: `logs/ralph/`)

### run-prd-overnight.sh
Convenience script for implementing a PRD spec overnight.

```bash
./scripts/autonomous/run-prd-overnight.sh openspec/changes/001-ios-share-sheet.md
```

This script:
1. Reads the spec file
2. Starts dev-browser server if needed
3. Runs the Ralph loop with appropriate settings
4. Logs everything to `logs/ralph/`

## Workflow

### Before Going to Sleep

1. **Create your spec** using OpenSpec:
   ```bash
   /openspec propose
   ```

2. **Start Chrome with remote debugging**:
   ```bash
   chromium --remote-debugging-port=9222 &
   ```

3. **Launch the overnight runner**:
   ```bash
   ./scripts/autonomous/run-prd-overnight.sh openspec/changes/001-your-feature.md
   ```

4. **Go to sleep!**

### In the Morning

1. Check logs at `logs/ralph/`
2. Review git commits made overnight
3. Run tests to verify implementation
4. Continue from where Claude left off if needed

## Best Practices

### Writing Good Specs
The Ralph Wiggum approach succeeds when specs are:
- Clear with specific deliverables
- Broken into incremental phases
- Have testable completion criteria

### Completion Criteria
Include in your spec:
- E2E tests that must pass
- Performance budgets (<200ms interactions)
- Visual verification checkpoints

### Safety Limits
- Always set `--max-iterations` to prevent infinite loops
- The loop uses `--dangerously-skip-permissions` for autonomous operation
- Review all changes made overnight before merging

## Troubleshooting

### Chrome DevTools MCP Not Working
1. Verify Chrome is running with `--remote-debugging-port=9222`
2. Check `.mcp.json` has correct `CHROME_PATH` environment variable
3. Restart Claude Code after changing `.mcp.json`

### Dev-Browser Not Connecting
1. Ensure Playwright browsers are installed: `npx playwright install chromium`
2. Check the server is running: `curl http://localhost:3000/health`
3. Look for "Ready" message in server output

### Ralph Loop Exits Early
1. Check logs for specific errors
2. Verify the completion promise is spelled exactly as configured
3. Increase `--max-iterations` if task needs more steps

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CHROME_PATH` | Path to Chrome/Chromium executable |
| `DEBUG=*` | Enable verbose logging for MCP servers |

## File Structure

```
scripts/autonomous/
├── ralph-loop.sh          # Core loop script
├── start-dev-browser.sh   # Dev-browser server launcher
└── run-prd-overnight.sh   # Overnight PRD runner

logs/ralph/
├── ralph_YYYYMMDD_HHMMSS.log    # Main log file
└── iterations_YYYYMMDD_HHMMSS/  # Individual iteration outputs
    ├── iteration_1.txt
    ├── iteration_2.txt
    └── ...
```
