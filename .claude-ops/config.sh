#!/bin/bash
#
# Claude Autonomous Operations Configuration
# Source this before running autonomous scripts
#

# Auto-approve trusted domains for MCP tools
export CLAUDE_AUTO_APPROVE_DOMAINS="github.com,localhost,127.0.0.1"
export CLAUDE_PERMISSION_LEVEL="trusted"

# Chrome DevTools MCP auto-approval
export MCP_CHROME_DEVTOOLS_AUTO_APPROVE="true"
export CHROME_DEVTOOLS_AUTO_APPROVE_FETCH="true"

# Anthropic MCP domain auto-approval
export ANTHROPIC_MCP_AUTO_APPROVE_DOMAINS="github.com,localhost,127.0.0.1"

# Chrome path for Linux (snap Chromium)
export CHROME_PATH="/snap/chromium/current/usr/lib/chromium-browser/chrome"

# Playwright configuration
export PLAYWRIGHT_BROWSERS_PATH="${HOME}/.cache/ms-playwright"
