# Run the setup script
./.mcp/setup.sh

# With Chrome extension
./.mcp/setup.sh --install-extension

# With headless mode
./.mcp/setup.sh --headless
```

### Manual Chrome DevTools MCP Install
```bash
# Install globally
npm install -g chrome-devtools-mcp@latest

# Or use npx (auto-installs on first use)
npx -y chrome-devtools-mcp@latest
```

### Manual Dev Browser Install
```bash
# Install via Claude CLI
claude mcp add dev-browser sawyerhood/dev-browser

# Or install manually
SKILLS_DIR=~/.claude/skills
mkdir -p $SKILLS_DIR
git clone https://github.com/sawyerhood/dev-browser /tmp/dev-browser-skill
cp -r /tmp/dev-browser-skill/skills/dev-browser $SKILLS_DIR/dev-browser
cd $SKILLS_DIR/dev-browser && npm install
```

---

## Chrome DevTools MCP Tools

### Performance Analysis
```
Check the performance of [URL]
```
- Records performance trace
- Analyzes metrics (LCP, FCP, TBT, etc.)
- Provides actionable insights

```
Start performance trace on [URL]
Stop performance trace
Analyze performance insights
```

### Navigation
```
Navigate to [URL]
Open new page [URL]
Close current page
List all pages
Switch to page [number]
Wait for [condition]
```

### Browser Automation
```
Click [selector]
Hover over [selector]
Fill input [selector] with [text]
Fill form with data: {...}
Press key [key_name]
Drag from [selector1] to [selector2]
Upload file [path] to [selector]
```

### Debugging
```
Take screenshot
Take snapshot
List console messages
Get console message [id]
Evaluate JavaScript: [code]
```

### Network Monitoring
```
List network requests
Get network request [url]
```

### Emulation
```
Emulate device: [device_name]
Resize viewport to [width]x[height]
```

---

## Dev Browser Commands

### Basic Navigation
```
Open [URL]
Go to [URL]
Refresh the page
Go back
Go forward
```

### Form Interaction
```
Fill out the form
Click the [button] button
Select [option] from dropdown
Check the [checkbox]
```

### Testing Workflows
```
Test the signup flow
Test the login flow
Test the checkout process
Verify the [feature] works correctly
```

### Page Inspection
```
Check for broken images
Verify all links work
Find elements matching [selector]
Get the text content of [element]
```

### Screenshot & Verification
```
Take a screenshot
Verify [condition]
Check if [element] is visible
Wait for [element] to appear
```

---

## Common Use Cases

### Debugging a Local App
```
1. "Navigate to http://localhost:3000"
2. "Check the console for errors"
3. "Take a screenshot"
4. "List network requests and find any failures"
5. "Check the performance of the page"
```

### Testing a Feature
```
1. "Open http://localhost:3000/login"
2. "Fill in username: test@example.com"
3. "Fill in password: test123"
4. "Click the login button"
5. "Verify we're redirected to /dashboard"
6. "Take a screenshot to confirm"
```

### Performance Optimization
```
1. "Start performance trace on http://localhost:3000/products"
2. "Navigate to different products"
3. "Stop performance trace"
4. "Analyze performance and provide recommendations"
5. "Check network requests for slow assets"
```

### Regression Testing
```
1. "Test the complete user flow from signup to purchase"
2. "Document any issues found"
3. "Take screenshots of each step"
4. "Verify all interactive elements work"
5. "Check console for JavaScript errors"
```

---

## Configuration Snippets

### Basic Claude Desktop Config
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

### Headless Mode (CI/CD)
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--headless=true"
      ]
    }
  }
}
```

### Custom Viewport
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--viewport=1920x1080"
      ]
    }
  }
}
```

### Connect to Running Chrome
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

### Auto-Connect (Chrome 145+)
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--autoConnect"
      ]
    }
  }
}
```

### Claude CLI Permissions
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

---

## Troubleshooting Quick Fixes

### Chrome Won't Start
```bash
# Kill existing Chrome instances
pkill chrome || pkill chromium

# Try with isolated mode
# Update config to add: "--isolated=true"

# Clear user data directory
rm -rf ~/.cache/chrome-devtools-mcp/
```

### Permission Denied
```bash
# Run Claude with permissions skip
claude --dangerously-skip-permissions

# Or add to ~/.claude.json (see config snippets above)
```

### Port Already in Use
```bash
# Find what's using the port
lsof -i :9222

# Use a different port (update config)
# Change to: "--browser-url=http://127.0.0.1:9223"
```

### MCP Not Recognized
```bash
# Restart Claude
# Verify config location:
# - Claude Desktop: ~/.config/Claude/claude_desktop_config.json
# - Claude CLI: ~/.claude.json

# Test MCP directly
npx -y chrome-devtools-mcp@latest --help
```

### Dev Browser Server Issues
```bash
# Start manually
cd ~/.claude/skills/dev-browser
npm run start-server

# Reinstall
rm -rf ~/.claude/skills/dev-browser
# Run install again (see Manual Install above)
```

### Extension Not Loading
```bash
# Verify extension directory
ls -la ~/.dev-browser-extension

# Check Chrome for errors
# chrome://extensions -> Dev Browser -> Errors

# Re-download
rm -rf ~/.dev-browser-extension
wget https://github.com/SawyerHood/dev-browser/releases/download/v1.0.0/extension.zip
unzip extension.zip -d ~/.dev-browser-extension
```

---

## Chrome Startup Commands

### Enable Remote Debugging
```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug

# Linux
google-chrome --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --remote-debugging-port=9222 \
  --user-data-dir="%TEMP%\chrome-debug"
```

### Start with Custom Profile
```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=~/.config/chrome-devtools-profile
```

---

## Performance Metrics Reference

### Key Metrics to Monitor
- **LCP** (Largest Contentful Paint): < 2.5s good
- **FCP** (First Contentful Paint): < 1.8s good
- **TBT** (Total Blocking Time): < 200ms good
- **CLS** (Cumulative Layout Shift): < 0.1 good
- **FID** (First Input Delay): < 100ms good

### Performance Optimization Tips
```
1. "Check for unused JavaScript"
2. "Analyze network requests for large assets"
3. "Look for render-blocking resources"
4. "Check for memory leaks"
5. "Audit images - check if they're optimized"
6. "Analyze third-party script impact"
7. "Check for unnecessary reflows/repaints"
```

---

## Testing Checklist

### Functional Testing
- [ ] Navigation works correctly
- [ ] Forms validate and submit properly
- [ ] Buttons trigger correct actions
- [ ] Links navigate to correct pages
- [ ] Error messages display appropriately
- [ ] Success states work as expected

### Visual Testing
- [ ] Page layout is correct
- [ ] Images load properly
- [ ] Colors and styling match design
- [ ] Responsive design works at different viewports
- [ ] No visual glitches or overlaps

### Performance Testing
- [ ] Page load time is acceptable
- [ ] No memory leaks
- [ ] Network requests are optimized
- [ ] Scripts don't block the main thread
- [ ] Smooth animations and transitions

### Cross-Browser Testing
```
"Test in Chrome"
"Test in Firefox" (if available)
"Test in Safari" (if on macOS)
"Test at mobile viewport size"
"Test at desktop viewport size"
```

---

## Keyboard Shortcuts

### Chrome DevTools
```
F12 / Ctrl+Shift+I  - Open DevTools
Ctrl+Shift+C        - Inspect element
Ctrl+Shift+J        - Open Console
Ctrl+Shift+N        - Incognito mode
Ctrl+R              - Refresh
Ctrl+F5             - Hard refresh
```

### Browser Automation
```
Press [Enter]       - Submit form or activate button
Press [Escape]      - Close dialog or cancel
Press [Tab]         - Navigate to next field
Press [Shift+Tab]   - Navigate to previous field
```

---

## Useful Selectors

### Common CSS Selectors
```
button[type="submit"]      - Submit buttons
input[type="text"]          - Text inputs
a[href*="login"]           - Links containing "login"
[aria-label="Close"]        - Elements by accessibility label
.class-name                 - By class name
#id-name                   - By ID
[data-testid="button"]     - By test attribute
```

### XPath Selectors
```
//button[contains(text(), 'Submit')]       - Button with text
//input[@placeholder='Email']               - Input by placeholder
//div[@class='container']//a                - Nested element
//*[text()='Login']                          - Element with exact text
```

---

## Getting Help

### Documentation
- Full guide: `docs/mcp-setup/README.md`
- Chrome DevTools MCP: https://github.com/ChromeDevTools/chrome-devtools-mcp
- Dev Browser: https://github.com/SawyerHood/dev-browser

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npx -y chrome-devtools-mcp@latest

# Write logs to file
npx -y chrome-devtools-mcp@latest --log-file=/tmp/mcp-debug.log
```

### Report Issues
- Chrome DevTools MCP: GitHub Issues
- Dev Browser: GitHub Issues
- Include logs and configuration when reporting