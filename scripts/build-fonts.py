#!/usr/bin/env python3
"""Build the self-hosted WOFF2 subsets from the brand fonts (spec 12).

Needs: pip install fonttools brotli
Run:   python3 scripts/build-fonts.py [path/to/PICO/brand/fonts]

Archivo: wdth pinned at 87.5 (the display width), wght limited to 650..760.
Source Sans 3: wght limited to 400..600.
Both: Latin + Latin Extended subset, tabular numerals kept. Outputs go to src/assets/fonts/.
The outputs are committed, so CI and other developers need neither Python nor the TTFs.
"""
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent.parent / "PICO" / "brand" / "fonts"
OUT = ROOT / "src" / "assets" / "fonts"

UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x250))  # Basic Latin, Latin-1, Latin Extended-A/B
    + list(range(0x1E00, 0x1F00))                       # Latin Extended Additional
    + list(range(0x2010, 0x2028)) + [0x2030, 0x2032, 0x2033, 0x2039, 0x203A]  # punctuation
    + [0x20AC, 0x2116, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x2248, 0x2260, 0x2264, 0x2265]
)

JOBS = [
    ("Archivo.ttf", "Archivo-display.woff2", {"wdth": 87.5, "wght": (650, 760)}),
    ("SourceSans3.ttf", "SourceSans3-text.woff2", {"wght": (400, 600)}),
]

OUT.mkdir(parents=True, exist_ok=True)
for src, out, limits in JOBS:
    font = TTFont(SRC / src)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "tnum", "lnum", "ccmp", "locl", "mark", "mkmk"]
    opts.name_IDs = [1, 2]
    opts.notdef_outline = True
    opts.hinting = False
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    # subset first: instancing the full font fails on Source Sans 3 (its default weight is outside 400..600)
    font = instancer.instantiateVariableFont(font, limits)
    font.flavor = "woff2"
    font.save(OUT / out)
    print(f"{out}: {(OUT / out).stat().st_size / 1024:.1f} KB")
