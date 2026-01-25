# Tasks: Add Nix Development Environment

## 1. Core Nix Configuration
- [x] 1.1 Create `flake.nix` with pinned nixpkgs
- [x] 1.2 Define devShell with Node.js 20.x, pnpm 9.x, Python 3.12
- [x] 1.3 Add Playwright system dependencies (browsers, fonts)
- [x] 1.4 Add `flake.lock` to pin exact versions
- [ ] 1.5 Create `shell.nix` wrapper for non-flake users (deferred)

## 2. Developer Experience
- [x] 2.1 Add `.envrc` for direnv auto-activation
- [x] 2.2 Configure shellHook to show environment info on entry
- [x] 2.3 Add pnpm/npm shims to ensure correct versions
- [x] 2.4 Include common dev tools (jq, ripgrep, git)

## 3. Python/DSPy Integration
- [x] 3.1 Add Python 3.12 with pip/venv support
- [ ] 3.2 Create `.python-version` for pyenv fallback (deferred)
- [ ] 3.3 Add `services/dspy-service` to Nix PATH (deferred)
- [ ] 3.4 Pin DSPy dependencies in Nix (optional poetry2nix) (deferred)

## 4. CI Integration
- [ ] 4.1 Add GitHub Actions workflow using `nix develop` (future)
- [ ] 4.2 Cache Nix store in CI for faster builds (future)
- [ ] 4.3 Ensure CI uses same versions as local dev (future)

## 5. Documentation
- [x] 5.1 Update README.md with Nix setup instructions
- [x] 5.2 Add "Quick Start with Nix" section
- [x] 5.3 Document direnv setup for automatic activation
- [x] 5.4 Update DOCS.md with Nix development section
- [x] 5.5 Update PROGRESS.md with Nix decision log

## 6. Verification
- [x] 6.1 Test fresh clone → `nix develop` → `pnpm dev` works
- [x] 6.2 Verify Playwright tests run in Nix shell
- [ ] 6.3 Verify DSPy service runs locally without Docker (deferred)
- [x] 6.4 Confirm Node version matches Vercel (20.x)
