Last login: Thu Jan 15 19:59:44 on ttys016
s3nik@seniks-Mac-Studio mymind-clone % cct
zsh: command not found: cct
s3nik@seniks-Mac-Studio mymind-clone % nix develop .#capacitor
warning: Git tree '/Users/s3nik/Desktop/mymind-clone' has uncommitted changes
error:
       … while calling the 'derivationStrict' builtin
         at «nix-internal»/derivation-internal.nix:37:12:
           36|
           37|   strict = derivationStrict drvAttrs;
             |            ^
           38|

       … while evaluating derivation 'nix-shell'
         whose name attribute is located at «github:NixOS/nixpkgs/1412caf»/pkgs/stdenv/generic/make-derivation.nix:541:13

       … while evaluating attribute 'nativeBuildInputs' of derivation 'nix-shell'
         at «github:NixOS/nixpkgs/1412caf»/pkgs/stdenv/generic/make-derivation.nix:590:13:
          589|             depsBuildBuild = elemAt (elemAt dependencies 0) 0;
          590|             nativeBuildInputs = elemAt (elemAt dependencies 0) 1;
             |             ^
          591|             depsBuildTarget = elemAt (elemAt dependencies 0) 2;

       (stack trace truncated; use '--show-trace' to show the full, detailed trace)

       error: Package ‘chromium-143.0.7499.192’ in /nix/store/35wv5mfa19isa8y59ys4fz3r8vav3ax9-source/pkgs/applications/networking/browsers/chromium/browser.nix:85 is not available on the requested hostPlatform:
         hostPlatform.system = "aarch64-darwin"
         package.meta.platforms = [
           "aarch64-linux"
           "armv5tel-linux"
           "armv6l-linux"
           "armv7a-linux"
           "armv7l-linux"
           "i686-linux"
           "loongarch64-linux"
           "m68k-linux"
           "microblaze-linux"
           "microblazeel-linux"
           "mips-linux"
           "mips64-linux"
           "mips64el-linux"
           "mipsel-linux"
           "powerpc-linux"
           "powerpc64-linux"
           "powerpc64le-linux"
           "riscv32-linux"
           "riscv64-linux"
           "s390-linux"
           "s390x-linux"
           "x86_64-linux"
         ]
         package.meta.badPlatforms = [ ]
       , refusing to evaluate.

       a) To temporarily allow packages that are unsupported for this system, you can use an environment variable
          for a single invocation of the nix tools.

            $ export NIXPKGS_ALLOW_UNSUPPORTED_SYSTEM=1

          Note: When using `nix shell`, `nix build`, `nix develop`, etc with a flake,
                then pass `--impure` in order to allow use of environment variables.

       b) For `nixos-rebuild` you can set
         { nixpkgs.config.allowUnsupportedSystem = true; }
       in configuration.nix to override this.

       c) For `nix-env`, `nix-build`, `nix-shell` or any other Nix command you can add
         { allowUnsupportedSystem = true; }
       to ~/.config/nixpkgs/config.nix.
s3nik@seniks-Mac-Studio mymind-clone % cct
zsh: command not found: cct
s3nik@seniks-Mac-Studio mymind-clone %