#!/bin/bash

################################################################################
# MCP Setup Script for MyMind Clone
#
# This script automates the installation and configuration of MCP servers:
# - Chrome DevTools MCP
# - Dev Browser
#
# Usage: ./setup.sh [--skip-prereq-checks] [--install-extension]
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="${HOME}/.claude/skills"
CHROME_EXTENSION_DIR="${HOME}/.dev-browser-extension"

# Default options
SKIP_PREREQ_CHECKS=false
INSTALL_EXTENSION=false
HEADLESS_MODE=false

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

################################################################################
# Prerequisites Check
################################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing_prereqs=false

    # Check Node.js
    if check_command node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"

        # Check if Node.js version is >= 20
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 20 ]; then
            print_error "Node.js version $NODE_VERSION is too old (required: v20+)"
            missing_prereqs=true
        fi
    else
        print_error "Node.js not found (required: v20 or later)"
        missing_prereqs=true
    fi

    # Check npm
    if check_command npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    else
        print_error "npm not found"
        missing_prereqs=true
    fi

    # Check Chrome
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if check_command google-chrome; then
            CHROME_VERSION=$(google-chrome --version)
            print_success "Chrome found: $CHROME_VERSION"
        elif check_command chromium-browser; then
            CHROME_VERSION=$(chromium-browser --version)
            print_success "Chromium found: $CHROME_VERSION"
        else
            print_error "Chrome/Chromium not found"
            missing_prereqs=true
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "/Applications/Google Chrome.app" ]; then
            print_success "Chrome found at /Applications/Google Chrome.app"
        else
            print_error "Chrome not found in /Applications"
            missing_prereqs=true
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        if [ -d "$PROGRAMFILES/Google/Chrome/Application" ]; then
            print_success "Chrome found at $PROGRAMFILES/Google/Chrome/Application"
        else
            print_error "Chrome not found"
            missing_prereqs=true
        fi
    fi

    # Check Claude CLI
    if check_command claude; then
        CLAUDE_VERSION=$(claude --version 2>&1 | head -n1)
        print_success "Claude CLI found: $CLAUDE_VERSION"
    else
        print_warning "Claude CLI not found - MCP configuration may need manual setup"
    fi

    if [ "$missing_prereqs" = true ]; then
        print_error "Some prerequisites are missing. Please install them and run again."
        exit 1
    fi

    print_success "All prerequisites met!"
}

################################################################################
# Chrome DevTools MCP Installation
################################################################################

install_chrome_devtools_mcp() {
    print_header "Installing Chrome DevTools MCP"

    # Try to install globally for faster startup (optional but recommended)
    print_info "Installing chrome-devtools-mcp globally (for faster startup)..."
    if npm install -g chrome-devtools-mcp@latest 2>&1; then
        print_success "Chrome DevTools MCP installed globally"
    else
        print_warning "Global installation failed, will use npx instead"
    fi

    # Create configuration directory if it doesn't exist
    CLAUDE_CONFIG_DIR=""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CLAUDE_CONFIG_DIR="${HOME}/Library/Application Support/Claude"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        CLAUDE_CONFIG_DIR="${HOME}/.config/Claude"
    fi

    if [ -n "$CLAUDE_CONFIG_DIR" ]; then
        mkdir -p "$CLAUDE_CONFIG_DIR"
        CLAUDE_CONFIG_FILE="${CLAUDE_CONFIG_DIR}/claude_desktop_config.json"

        # Backup existing config
        if [ -f "$CLAUDE_CONFIG_FILE" ]; then
            cp "$CLAUDE_CONFIG_FILE" "${CLAUDE_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
            print_info "Backed up existing config to ${CLAUDE_CONFIG_FILE}.backup"
        fi

        # Create or update config
        CHROME_DEVTOOLS_CONFIG='{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"'

        # Add headless mode if requested
        if [ "$HEADLESS_MODE" = true ]; then
            CHROME_DEVTOOLS_CONFIG+=',
        "--headless=true"'
        fi

        CHROME_DEVTOOLS_CONFIG+='
      ]
    }
  }
}'

        echo "$CHROME_DEVTOOLS_CONFIG" > "$CLAUDE_CONFIG_FILE"
        print_success "Chrome DevTools MCP configured for Claude Desktop"
    fi

    # Update Claude CLI config
    if [ -f "${HOME}/.claude.json" ]; then
        cp "${HOME}/.claude.json" "${HOME}/.claude.json.backup.$(date +%Y%m%d_%H%M%S)"
        print_info "Backed up .claude.json"

        # Add MCP configuration to Claude CLI
        if ! grep -q '"mcpServers"' "${HOME}/.claude.json"; then
            print_warning "Please manually add Chrome DevTools MCP to ~/.claude.json"
        fi
    fi
}

################################################################################
# Dev Browser Installation
################################################################################

install_dev_browser() {
    print_header "Installing Dev Browser"

    # Create skills directory
    mkdir -p "$SKILLS_DIR"

    # Clone repository to temp location
    TMP_DIR=$(mktemp -d)
    print_info "Cloning Dev Browser repository..."

    if ! git clone https://github.com/SawyerHood/dev-browser "$TMP_DIR/dev-browser" 2>&1; then
        print_error "Failed to clone Dev Browser repository"
        rm -rf "$TMP_DIR"
        exit 1
    fi

    # Copy skill to skills directory
    if [ -d "$SKILLS_DIR/dev-browser" ]; then
        print_info "Removing existing Dev Browser installation..."
        rm -rf "$SKILLS_DIR/dev-browser"
    fi

    cp -r "$TMP_DIR/dev-browser/skills/dev-browser" "$SKILLS_DIR/"
    print_success "Dev Browser skill copied to $SKILLS_DIR/dev-browser"

    # Clean up temp directory
    rm -rf "$TMP_DIR"

    # Install dependencies
    print_info "Installing Dev Browser dependencies..."
    if cd "$SKILLS_DIR/dev-browser" && npm install 2>&1; then
        print_success "Dev Browser dependencies installed"
    else
        print_error "Failed to install Dev Browser dependencies"
        exit 1
    fi

    # Configure permissions in .claude.json
    if [ -f "${HOME}/.claude.json" ]; then
        print_info "Configuring permissions in ~/.claude.json..."
        # Add permissions if not present
        if ! grep -q '"Skill(dev-browser:dev-browser)"' "${HOME}/.claude.json"; then
            print_warning "Please manually add the following to ~/.claude.json under 'permissions':"
            echo '{
  "permissions": {
    "allow": [
      "Skill(dev-browser:dev-browser)",
      "Bash(npx tsx:*)"
    ]
  }
}'
        fi
    fi

    print_success "Dev Browser installed successfully!"
}

################################################################################
# Chrome Extension Installation
################################################################################

install_chrome_extension() {
    print_header "Installing Chrome Extension for Dev Browser"

    # Download extension
    EXTENSION_URL="https://github.com/SawyerHood/dev-browser/releases/download/v1.0.0/extension.zip"
    EXTENSION_ZIP="/tmp/dev-browser-extension.zip"

    print_info "Downloading Chrome extension..."
    if ! wget -O "$EXTENSION_ZIP" "$EXTENSION_URL" 2>&1; then
        print_error "Failed to download Chrome extension"
        return 1
    fi

    # Create extension directory
    mkdir -p "$CHROME_EXTENSION_DIR"

    # Extract extension
    print_info "Extracting Chrome extension..."
    if ! unzip -o "$EXTENSION_ZIP" -d "$CHROME_EXTENSION_DIR" 2>&1; then
        print_error "Failed to extract Chrome extension"
        rm -f "$EXTENSION_ZIP"
        return 1
    fi

    rm -f "$EXTENSION_ZIP"

    print_success "Chrome extension extracted to $CHROME_EXTENSION_DIR"
    print_info "To install the extension:"
    print_info "1. Open Chrome and go to chrome://extensions"
    print_info "2. Enable 'Developer mode' (toggle in top right)"
    print_info "3. Click 'Load unpacked' and select: $CHROME_EXTENSION_DIR"
    print_info "4. Click the Dev Browser extension icon in Chrome's toolbar"
    print_info "5. Toggle it to 'Active' to enable browser control"
}

################################################################################
# Verification
################################################################################

verify_installation() {
    print_header "Verifying Installation"

    # Check Chrome DevTools MCP
    print_info "Testing Chrome DevTools MCP..."
    if npx -y chrome-devtools-mcp@latest --help &> /dev/null; then
        print_success "Chrome DevTools MCP is accessible"
    else
        print_warning "Chrome DevTools MCP test failed (may work on first use)"
    fi

    # Check Dev Browser
    if [ -d "$SKILLS_DIR/dev-browser" ] && [ -f "$SKILLS_DIR/dev-browser/package.json" ]; then
        print_success "Dev Browser is installed"
    else
        print_error "Dev Browser installation not found"
    fi

    # Check Chrome extension (if installed)
    if [ "$INSTALL_EXTENSION" = true ] && [ -d "$CHROME_EXTENSION_DIR" ]; then
        print_success "Chrome extension is ready to load"
    fi

    print_header "Installation Complete!"
    print_success "MCP servers have been installed and configured"
    print_info "Next steps:"
    print_info "1. Restart Claude CLI or Claude Desktop"
    print_info "2. Try a test prompt: 'Check the performance of https://example.com'"
    print_info "3. Read the full documentation at: docs/mcp-setup/README.md"
}

################################################################################
# Main Script
################################################################################

main() {
    print_header "MCP Setup Script for MyMind Clone"
    echo ""

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-prereq-checks)
                SKIP_PREREQ_CHECKS=true
                shift
                ;;
            --install-extension)
                INSTALL_EXTENSION=true
                shift
                ;;
            --headless)
                HEADLESS_MODE=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-prereq-checks    Skip prerequisite checks"
                echo "  --install-extension     Install Chrome extension for Dev Browser"
                echo "  --headless              Configure Chrome to run in headless mode"
                echo "  -h, --help              Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use -h or --help for usage information"
                exit 1
                ;;
        esac
    done

    # Check prerequisites (unless skipped)
    if [ "$SKIP_PREREQ_CHECKS" = false ]; then
        check_prerequisites
    else
        print_warning "Skipping prerequisite checks"
    fi

    echo ""

    # Install Chrome DevTools MCP
    install_chrome_devtools_mcp

    echo ""

    # Install Dev Browser
    install_dev_browser

    echo ""

    # Install Chrome extension (if requested)
    if [ "$INSTALL_EXTENSION" = true ]; then
        install_chrome_extension
        echo ""
    fi

    # Verify installation
    verify_installation
}

# Run main function
main "$@"
