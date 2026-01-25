# Design: Nix Development Environment

## Context
- Project uses Node.js (Next.js 16), pnpm, Python (DSPy service)
- Vercel deployment shows Node 20.x vs 24.x version warning
- Developers on different machines get version drift
- Docker used for DSPy but adds overhead for local dev
- Playwright needs system dependencies (browsers, fonts)

## Goals
- Pin exact Node.js 20.x (match Vercel production)
- Pin pnpm 9.x for consistent lockfile handling
- Pin Python 3.12 for DSPy service
- Zero-friction dev setup: one command
- Optional - existing workflows still work

## Non-Goals
- Not replacing Vercel (they manage their own runtime)
- Not replacing HuggingFace Spaces for production DSPy
- Not forcing Nix on contributors (additive only)

## Decisions

### Decision 1: Use Nix Flakes
**What**: Use modern `flake.nix` format instead of legacy `shell.nix` only
**Why**:
- Flakes provide hermetic, reproducible builds
- `flake.lock` pins exact nixpkgs commit
- Better caching and faster evaluation
- Industry direction (NixOS, devenv, etc.)

**Alternatives considered**:
- devenv.sh: Simpler but less flexible, adds abstraction layer
- Docker Compose: Heavier, slower startup, isolation overhead
- asdf/mise: Good but doesn't handle system deps (Playwright)

### Decision 2: Node.js 20.x (LTS)
**What**: Pin to nodejs_20, not nodejs (which follows latest)
**Why**:
- Vercel production uses Node 20.x
- LTS = stable, security updates
- Avoids 24.x experimental features breaking builds

```nix
nodejs = pkgs.nodejs_20;
```

### Decision 3: Playwright Dependencies via Nix
**What**: Include Playwright browsers and system deps in devShell
**Why**:
- `npx playwright install` downloads 500MB+ browsers
- System deps (fonts, libs) vary by OS
- Nix provides consistent browser binaries

```nix
buildInputs = with pkgs; [
  playwright-driver.browsers
  # System deps for Chromium
  nss
  nspr
  atk
  cups
  # ... etc
];
```

### Decision 4: direnv Integration
**What**: Add `.envrc` with `use flake`
**Why**:
- Automatic environment activation on `cd`
- No manual `nix develop` needed
- IDE integration (VS Code, etc.)

```bash
# .envrc
use flake
```

### Decision 5: Keep Docker for Production DSPy
**What**: Nix for local dev, Docker/HF Spaces for production
**Why**:
- HuggingFace Spaces requires Docker
- Vercel doesn't run Python
- Local dev can use Nix Python directly

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Nix learning curve | Provide copy-paste commands in README |
| macOS ARM compatibility | Use nixpkgs-darwin, test on M1/M2 |
| Slow first evaluation | Cache in CI, use binary cache |
| IDE confusion | Document `which node` should show Nix path |

## File Structure

```
/
├── flake.nix           # Main Nix configuration
├── flake.lock          # Pinned dependencies (committed)
├── shell.nix           # Compat wrapper for non-flake users
├── .envrc              # direnv auto-activation
├── .python-version     # pyenv fallback (3.12)
└── .node-version       # nvm/fnm fallback (20)
```

## flake.nix Skeleton

```nix
{
  description = "MyMind development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # JavaScript
            nodejs_20
            nodePackages.pnpm

            # Python
            python312
            python312Packages.pip
            python312Packages.virtualenv

            # Playwright deps
            playwright-driver.browsers

            # Dev tools
            git
            jq
            ripgrep
          ];

          shellHook = ''
            echo "MyMind dev environment"
            echo "Node: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo "Python: $(python --version)"
          '';
        };
      });
}
```

## Migration Plan

1. **Phase 1** (this PR): Add Nix files, document setup
2. **Phase 2**: Add CI workflow using Nix
3. **Phase 3**: Update CONTRIBUTING.md, recommend Nix
4. **Phase 4** (optional): Explore nix-darwin for macOS system config

## Open Questions

- [ ] Should we use `devenv.sh` abstraction or raw Nix?
- [ ] Pin Playwright browser versions or use latest?
- [ ] Add Nix to CI now or separate PR?
