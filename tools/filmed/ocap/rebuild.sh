#!/bin/zsh
set -e; cd "$(dirname "$0")"
for d in plush_host plush_creature voxel_tower voxel_host voxel_creature nature_tower nature_host nature_creature; do
  [ -f $d/model.glb ] && { echo "$d exists"; continue; }
  mkdir -p $d/frames; ffmpeg -loglevel error -y -i $d/turn.mp4 -vf "fps=12,scale=1920:-1" $d/frames/f_%03d.png
  ./tool/ocap $d/frames $d/model.usdz medium 2>&1 | grep -E "DONE|ERROR|FAILED" | head -2
  blender -b -P usd2glb.py -- $PWD/$d/model.usdz $PWD/$d/model.glb 2>&1 | grep -E "CONVERTED|Error" | head -1
  echo "$d $(stat -f%z $d/model.glb) bytes"
done
echo REBUILD DONE
