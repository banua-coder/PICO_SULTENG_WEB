#!/bin/sh
# Copies the brand v2 illustrations (flat light and dark, no CSS) into public/illustrations/. Run it again when the brand repo changes.
# Source: ~/Documents/Projects/PICO/brand/v2 (written for PICO, MIT). The pictures are plain <img> files, outside the JS bundle.
SRC="${1:-$HOME/Documents/Projects/PICO/brand/v2}"
DST="$(dirname "$0")/../public/illustrations"
for mode in light dark; do
  mkdir -p "$DST/$mode"
  for n in cuci-tangan pakai-masker jaga-jarak vaksinasi gejala-demam gejala-batuk gejala-sakit-kepala state-kosong state-galat state-luring state-periode-kosong telepon-119; do
    cp "$SRC/flat/$mode/pico-v2-$n.svg" "$DST/$mode/$n.svg"
  done
done
