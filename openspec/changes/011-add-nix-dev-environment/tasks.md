# Tasks: Add Nix Development Environment

## 1. Core Nix Configuration
- [ ] 1.1 Create `flake.nix` with pinned nixpkgs
- [ ] 1.2 Define devShell with Node.js 20.x, pnpm 9.x, Python 3.12
- [ ] 1.3 Add Playwright system dependencies (browsers, fonts)
- [ ] 1.4 Add `flake.lock` to pin exact versions
- [ ] 1.5 Create `shell.nix` wrapper for non-flake users

## 2. Developer Experience
- [ ] 2.1 Add `.envrc` for direnv auto-activation
- [ ] 2.2 Configure shellHook to show environment info on entry
- [ ] 2.3 Add pnpm/npm shims to ensure correct versions
- [ ] 2.4 Include common dev tools (jq, ripgrep, git)

## 3. Python/DSPy Integration
- [ ] 3.1 Add Python 3.12 with pip/venv support
- [ ] 3.2 Create `.python-version` for pyenv fallback
- [ ] 3.3 Add `services/dspy-service` to Nix PATH
- [ ] 3.4 Pin DSPy dependencies in Nix (optional poetry2nix)

## 4. CI Integration
- [ ] 4.1 Add GitHub Actions workflow using `nix develop`
- [ ] 4.2 Cache Nix store in CI for faster builds
- [ ] 4.3 Ensure CI uses same versions as local dev

## 5. Documentation
- [ ] 5.1 Update README.md with Nix setup instructions
- [ ] 5.2 Add "Quick Start with Nix" section
- [ ] 5.3 Document direnv setup for automatic activation
- [ ] 5.4 Update CLAUDE.md with Nix context
- [ ] 5.5 Add CONTRIBUTING.md with environment setup

## 6. Verification
- [ ] 6.1 Test fresh clone → `nix develop` → `pnpm dev` works
- [ ] 6.2 Verify Playwright tests run in Nix shell
- [ ] 6.3 Verify DSPy service runs locally without Docker
- [ ] 6.4 Confirm Node version matches Vercel (20.x)
