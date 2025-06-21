
{ pkgs }: {
  deps = [
    pkgs.gh
    pkgs.chromium
    pkgs.glib
    pkgs.nss
    pkgs.at-spi2-atk
    pkgs.libdrm
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXrandr
    pkgs.xorg.libxcb
    pkgs.xorg.libX11
    pkgs.xorg.libXext
    pkgs.xorg.libXi
    pkgs.xorg.libXtst
    pkgs.xorg.libXcursor
    pkgs.xorg.libXfixes
    pkgs.mesa
    pkgs.xorg.libXScrnSaver
    pkgs.alsa-lib
    pkgs.cups
    pkgs.gtk3
    pkgs.pango
    pkgs.cairo
    pkgs.fontconfig
    pkgs.freetype
    pkgs.expat
    pkgs.dbus
    pkgs.nspr
    pkgs.atk
    pkgs.gdk-pixbuf
    pkgs.libxkbcommon
  ];
}
