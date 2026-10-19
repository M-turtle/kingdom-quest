#!/bin/zsh
cd "$(dirname "$0")"
for c in girl boy grandma bear fox princess; do python3 edit.py felt $c skirt belt 2>&1 | grep -v -i warn & done; wait
for c in girl boy grandma bear fox princess; do python3 edit.py nature $c circleSkirt belt hat 2>&1 | grep -v -i warn & done; wait
echo BATCH DONE; ls felt_*_*.png nature_*_*.png | wc -l
