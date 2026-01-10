# Observing Playwright Tests - MyMind Clone

## Overview

When another agent is running Playwright tests on your MyMind Clone application, you can observe the testing process in several ways. This guide explains how to set up observation without interfering with the automated testing workflow.

## Current Playwright Configuration

The project's `playwright.config.ts` includes automatic server management:

```typescript
webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
}
```

**Key Setting**: `reuseExistingServer: true` - If you have `npm run dev` already running, Playwright will use it instead of starting its own server.

## Observation Methods

### Method 1: Parallel Dev Server (Recommended)

**Best for**: Full application observation + automated test visibility

1. **Start the dev server manually** (in Terminal 1):
   ```bash
   cd /home/senik/Desktop/mymind-clone/apps/web
   npm run dev
   ```
   This keeps the application running at `http://localhost:3000`

2. **Open your browser** to `http://localhost:3000` to observe the live application

3. **Watch tests execute** in a separate terminal (Terminal 2):
   ```bash
   cd /home/senik/Desktop/mymind-clone/apps/web
   npx playwright test --headed
   ```

**Result**: You'll see two browser windows - one for manual observation, one for automated test execution.

### Method 2: Debug Mode with Step-by-Step Control

**Best for**: Understanding test flow and debugging

```bash
cd /home/senik/Desktop/mymind-clone/apps/web
npx playwright test --headed --debug
```

Features:
- Tests run one step at a time
- Each action pauses before execution
- Interactive controls to step through tests
- Inspect the DOM at any point

### Method 3: Playwright UI Mode

**Best for**: Interactive test management and replay

```bash
cd /home/senik/Desktop/mymind-clone/apps/web
npx playwright test --ui
```

Features:
- Visual test explorer
- Run individual tests with one click
- Time-travel debugging (rewind/fast-forward test execution)
- View traces and screenshots

### Method 4: Headed Mode Only

**Best for**: Simple test visualization

```bash
cd /home/senik/Desktop/mymind-clone/apps/web
npx playwright test --headed
```

Shows browser windows for all tests as they execute, without additional debugging features.

## Common Use Cases

### Watching Another Agent's Tests

If another agent is running tests and you want to observe:

1. **Start your own dev server** (for manual exploration):
   ```bash
   cd /home/senik/Desktop/mymind-clone/apps/web
   npm run dev
   ```

2. **Open `http://localhost:3000` in your browser** to explore the application manually

3. **The agent's Playwright will reuse your server** (thanks to `reuseExistingServer: true`)

### Observing Specific Test Suites

Run only the tests you're interested in:

```bash
# Navigation tests only
npx playwright test -g "Navigation"

# Modal tests only
npx playwright test -g "Modal"

# Filter tests only
npx playwright test -g "Category Filters"
```

### Post-Test Analysis

After tests complete, view the detailed HTML report:

```bash
npx playwright show-report
```

This opens a local server with:
- Test results and pass/fail status
- Screenshots of failures
- Trace files for debugging
- Test execution logs

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (port 3000) |
| `npx playwright test` | Run tests (headless mode) |
| `npx playwright test --headed` | Run tests with visible browser |
| `npx playwright test --debug` | Run tests step-by-step with pause |
| `npx playwright test --ui` | Open Playwright UI for interactive testing |
| `npx playwright show-report` | View HTML test report |
| `npx playwright test -g "pattern"` | Run tests matching pattern |

## Configuration Notes

### Web Server Behavior

- **Automatic**: If no server is running, Playwright starts `npm run dev` automatically
- **Reuse**: If a server exists at `localhost:3000`, Playwright uses it
- **Cleanup**: If Playwright started the server, it shuts it down after tests complete

### Test Parallelism

Tests run in parallel by default. To see tests sequentially for observation:

```bash
npx playwright test --workers=1 --headed
```

### Traces and Screenshots

The configuration enables:
- `trace: 'on-first-retry'` - Captures traces on test retries
- Automatic screenshots on failures
- HTML report with visual artifacts

## Troubleshooting

### Port Already in Use

If you get a port conflict:
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

### Tests Fail to Start Dev Server

Ensure you're in the correct directory:
```bash
cd /home/senik/Desktop/mymind-clone/apps/web
```

### Browser Not Launching

Install Playwright browsers:
```bash
npx playwright install
```

## Best Practices

1. **Separate Terminals**: Use one terminal for the dev server, another for test commands
2. **Keep Server Running**: Leave `npm run dev` running for quick iteration
3. **Use UI Mode for Complex Debugging**: Switch to UI mode when you need deep inspection
4. **Review Reports**: Always check the HTML report after test runs for insights

## Test Coverage Reference

| Spec File | Coverage |
|-----------|----------|
| `mymind.spec.ts` | Card grid, Add modal, API endpoints |
| `navigation.spec.ts` | Header, tabs, routing |
| `filters.spec.ts` | TagScroller filters, URL state |
| `card-modal.spec.ts` | Card detail modal |
| `interactions.spec.ts` | Loading, hover, responsive |