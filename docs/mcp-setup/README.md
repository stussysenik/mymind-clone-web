# MCP Setup Guide for MyMind Clone

This guide will help you set up and configure Model Context Protocol (MCP) servers to enhance your AI coding experience with browser automation and debugging capabilities.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [MCP Servers](#mcp-servers)
  - [Chrome DevTools MCP](#chrome-devtools-mcp)
  - [Dev Browser](#dev-browser)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

## Overview

This project integrates two powerful MCPs:

1. **Chrome DevTools MCP** - Official Chrome DevTools integration for AI agents
2. **Dev Browser** - Browser automation plugin optimized for Claude

### Why Use Both?

| Feature | Chrome DevTools MCP | Dev Browser |
|---------|-------------------|-------------|
| Primary Use | Performance analysis, debugging | Browser automation, testing |
| Execution | Individual tool calls | Stateful scripts |
| Strength | Deep browser insights | Persistent page state |
| Best For | Production debugging | Development workflows |

## Prerequisites

- **Node.js**: v20 or later
- **npm**: v9 or later
- **Chrome**: Current stable version or newer
- **Claude CLI**: Installed and configured
- **Bun**: Package manager (optional, used in this project)

### Verify Prerequisites

```bash
node --version  # Should be v20.x.x
npm --version   # Should be v9.x.x or higher
google-chrome --version  # Linux
chrome --version  # macOS
claude --version
```

## MCP Servers

### Chrome DevTools MCP

**Repository**: [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)

**Features**:
- Get performance insights using Chrome DevTools
- Advanced browser debugging (network requests, console, screenshots)
- Reliable browser automation with Puppeteer
- 20.6k GitHub stars

**Tools Available**:
- **Input Automation**: click, drag, fill, fill_form, hover, press_key, upload_file
- **Navigation**: close_page, list_pages, navigate_page, new_page, select_page, wait_for
- **Emulation**: emulate, resize_page
- **Performance**: performance_analyze_insight, performance_start_trace, performance_stop_trace
- **Network**: get_network_request, list_network_requests
- **Debugging**: evaluate_script, get_console_message, list_console_messages, take_screenshot, take_snapshot

### Dev Browser

**Repository**: [SawyerHood/dev-browser](https://github.com/SawyerHood/dev-browser)

**Features**:
- Persistent pages across multiple scripts
- Flexible execution (full scripts or step-by-step)
- LLM-friendly DOM snapshots optimized for AI
- Optional Chrome extension for controlling existing browser
- 2.7k GitHub stars

**Key Advantages**:
- Stateful server maintains browser state
- Agentic script execution adapts to complexity
- 100% success rate in benchmarks
- Faster and cheaper than alternatives

## Installation

### Step 1: Install Chrome DevTools MCP

The Chrome DevTools MCP is installed via npx automatically when configured. However, you can install it globally for faster startup:

```bash
npm install -g chrome-devtools-mcp@latest
```

### Step 2: Install Dev Browser

Dev Browser is installed as a Claude Skill:

```bash
# Via Claude CLI (recommended)
claude mcp add dev-browser sawyerhood/dev-browser

# Or manually copy to skills directory
SKILLS_DIR=~/.claude/skills
mkdir -p $SKILLS_DIR
git clone https://github.com/sawyerhood/dev-browser /tmp/dev-browser-skill
cp -r /tmp/dev-browser-skill/skills/dev-browser $SKILLS_DIR/dev-browser
rm -rf /tmp/dev-browser-skill

# Install dependencies
cd $SKILLS_DIR/dev-browser && npm install
```

### Step 3: Install Chrome Extension (Optional for Dev Browser)

To control your existing Chrome browser instead of a separate instance:

```bash
# Download the extension
wget https://github.com/SawyerHood/dev-browser/releases/download/v1.0.0/extension.zip

# Unzip to a permanent location
mkdir -p ~/.dev-browser-extension
unzip extension.zip -d ~/.dev-browser-extension

# Load in Chrome
# 1. Open Chrome and go to chrome://extensions
# 2. Enable "Developer mode" (toggle in top right)
# 3. Click "Load unpacked"
# 4. Select ~/.dev-browser-extension
```

## Configuration

### Claude Desktop Configuration

Create or edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `~/.config/Claude/claude_desktop_config.json` (Linux):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    }
  }
}
```

### Claude CLI Configuration

Add to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    }
  },
  "permissions": {
    "allow": [
      "Skill(dev-browser:dev-browser)",
      "Bash(npx tsx:*)"
    ]
  }
}
```

### Advanced Configuration Options

#### Chrome DevTools MCP Options

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--headless=true",
        "--channel=stable",
        "--viewport=1920x1080",
        "--isolated=true"
      ]
    }
  }
}
```

**Available Options**:
- `--headless`: Run without UI (default: false)
- `--channel`: Chrome channel (stable, beta, dev, canary)
- `--viewport`: Initial viewport size (e.g., "1920x1080")
- `--isolated`: Use temporary user data directory (default: false)
- `--browser-url`: Connect to running Chrome instance
- `--autoConnect`: Auto-connect to running Chrome (Chrome 145+)
- `--user-data-dir`: Custom user data directory path
- `--executable-path`: Path to custom Chrome executable

#### Connecting to Running Chrome

For sharing state with your regular browser:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

Start Chrome with remote debugging:

**macOS**:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-stable
```

**Linux**:
```bash
/usr/bin/google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-stable
```

**Windows**:
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --remote-debugging-port=9222 \
  --user-data-dir="%TEMP%\chrome-profile-stable"
```

## Usage Examples

### Example 1: Performance Analysis

Use Chrome DevTools MCP to analyze your application's performance:

```
Check the performance of http://localhost:3000 and provide insights
```

The MCP will:
1. Navigate to the URL
2. Record a performance trace
3. Analyze the trace
4. Provide actionable insights

### Example 2: Debugging Network Issues

```
Go to http://localhost:3000/dashboard and check for failed network requests
```

The MCP will:
1. Navigate to the page
2. Monitor network requests
3. Identify failed requests
4. Provide error details

### Example 3: Automated Testing with Dev Browser

```
Test the signup flow on http://localhost:3000/signup
```

Dev Browser will:
1. Navigate to the signup page
2. Fill out the form with test data
3. Submit the form
4. Verify the result
5. Report any issues

### Example 4: Taking Screenshots

```
Take a screenshot of the main page and save it
```

### Example 5: Console Debugging

```
Check the console for errors on http://localhost:3000/admin
```

## Troubleshooting

### Chrome Won't Start

**Issue**: MCP server fails to start Chrome

**Solutions**:
1. Check Chrome installation path
2. Ensure no other Chrome instances are running
3. Try with a custom user data directory:
   ```json
   {
     "args": [
       "chrome-devtools-mcp@latest",
       "--user-data-dir=/tmp/chrome-debug-profile"
     ]
   }
   ```

### Permission Errors

**Issue**: "Permission denied" when using MCP tools

**Solution**: Add permissions to `~/.claude.json`:
```json
{
  "permissions": {
    "allow": [
      "Skill(dev-browser:dev-browser)",
      "Bash(npx tsx:*)"
    ]
  }
}
```

Or run with:
```bash
claude --dangerously-skip-permissions
```

### Connection Timeout

**Issue**: "Failed to connect to Chrome" errors

**Solutions**:
1. Increase timeout in configuration
2. Check if Chrome is already running and using the debug port
3. Try connecting to a running instance instead of launching new one

### Port Already in Use

**Issue**: Port 9222 already in use

**Solution**: Use a different port:
```json
{
  "args": [
    "chrome-devtools-mcp@latest",
    "--browser-url=http://127.0.0.1:9223"
  ]
}
```

And start Chrome with:
```bash
google-chrome --remote-debugging-port=9223
```

### Dev Browser Server Won't Start

**Issue**: Dev Browser server fails to start

**Solution**: Start manually:
```bash
cd ~/.claude/skills/dev-browser && npm run start-server
```

### MCP Server Not Recognized

**Issue**: "MCP server not found" error

**Solution**: Ensure the configuration is in the correct location:
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- Claude Desktop: `~/.config/Claude/claude_desktop_config.json` (Linux)
- Claude CLI: `~/.claude.json`

Restart Claude after making changes.

## Best Practices

1. **Use Isolated Mode for Testing**: Set `--isolated=true` to keep test sessions clean
2. **Connect to Running Chrome for Development**: Share your login state and bookmarks
3. **Use Headless Mode in CI/CD**: Set `--headless=true` for automated pipelines
4. **Set Viewport Appropriately**: Match your target device's screen size
5. **Regular Updates**: Both MCPs receive frequent updates - keep them current

## Security Considerations

⚠️ **Important Security Notes**:

1. **Remote Debugging Port**: When enabling `--remote-debugging-port`, any application on your machine can control your browser. Only use this in trusted environments.

2. **Sensitive Data**: Avoid browsing sensitive websites while remote debugging is enabled.

3. **User Data Directory**: Using a non-default user data directory prevents your regular browsing data from being exposed.

4. **Permissions**: Review and limit permissions in your Claude configuration.

## Getting Help

- **Chrome DevTools MCP Issues**: [GitHub Issues](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues)
- **Dev Browser Issues**: [GitHub Issues](https://github.com/SawyerHood/dev-browser/issues)
- **Claude Documentation**: [Claude MCP Guide](https://docs.anthropic.com/claude/docs/mcp)

## Contributing

To contribute improvements to this setup guide:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This setup guide is part of the MyMind Clone project and follows the same MIT license.