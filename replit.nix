{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.typescript
    pkgs.postgresql
    pkgs.pkg-config
    pkgs.libvips
    pkgs.python3
    pkgs.gcc
    pkgs.git
  ];
}