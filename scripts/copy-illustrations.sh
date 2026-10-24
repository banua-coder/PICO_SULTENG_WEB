#!/bin/sh
# Copies the brand v2 art into public/: flat light and dark illustrations (public/illustrations) and the Lottie files with their posters (public/lottie).
# Source: ~/Documents/Projects/PICO/brand/v2 (written for PICO, MIT). Plain files, outside the JS bundle. Run it again when the brand repo changes.
SRC="${1:-$HOME/Documents/Projects/PICO/brand/v2}"
ROOT="$(dirname "$0")/../public"
for mode in light dark; do
  mkdir -p "$ROOT/illustrations/$mode"
  for n in cuci-tangan pakai-masker jaga-jarak vaksinasi isolasi-mandiri gejala-demam gejala-batuk gejala-sakit-kepala gejala-sesak-napas gejala-hilang-penciuman telekonsultasi bantuan-antar rumah-sakit telepon-119 state-kosong state-galat state-luring state-memuat state-periode-kosong state-pemeliharaan; do
    cp "$SRC/flat/$mode/pico-v2-$n.svg" "$ROOT/illustrations/$mode/$n.svg"
  done
done
mkdir -p "$ROOT/lottie/posters"
for n in loading success offline empty handwash-loop logo-reveal logo-reveal-dark; do
  cp "$SRC/lottie/pico-v2-$n.json" "$ROOT/lottie/$n.json"
done
for n in loading success offline empty handwash-loop logo-reveal; do
  cp "$SRC/lottie/posters/pico-v2-$n.svg" "$ROOT/lottie/posters/$n.svg"
  cp "$SRC/lottie/posters/pico-v2-$n-dark.svg" "$ROOT/lottie/posters/$n-dark.svg"
done
