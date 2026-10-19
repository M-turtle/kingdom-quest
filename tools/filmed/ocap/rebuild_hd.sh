#!/bin/zsh
# every object again: frames upscaled 2x, Object Capture custom detail (150k polys, 4K max texture), GLB, pedestal off
cd "$(dirname "$0")"
for d in plush_host plush_creature voxel_tower voxel_host voxel_creature nature_tower nature_host nature_creature world/tree world/bush; do
  [ -f $d/hd.glb ] && { echo "$d hd exists"; continue; }
  src=$d/turn.mp4; [ "$d" = world/tree ] && src=world/tree_turn.mp4; [ "$d" = world/bush ] && src=world/bush_turn.mp4
  mkdir -p $d/frames2x $d/hd_out; ffmpeg -loglevel error -y -i $src -vf "fps=12,scale=3840:-1:flags=lanczos" $d/frames2x/f_%03d.png
  ./tool/ocap $d/frames2x $d/hd_out/model.usdz custom 2>&1 | grep -E "DONE|ERROR|FAILED" | head -1
  blender -b -P usd2glb.py -- $PWD/$d/hd_out/model.usdz $PWD/$d/hd_raw.glb 2>&1 | grep CONVERTED | cut -c1-120
  blender -b -P depedestal.py -- $PWD/$d/hd_raw.glb $PWD/$d/hd.glb 2>&1 | grep -E "PEDESTAL|FALLBACK" | head -1
  echo "$d $(stat -f%z $d/hd.glb 2>/dev/null) bytes"
done
echo HD REBUILD DONE
