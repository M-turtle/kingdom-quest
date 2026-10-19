#!/bin/zsh
# tree + bush: frames → Object Capture → GLB → pedestal off; ground + sky: stills → WebP data for the engine
set -e; cd "$(dirname "$0")"
for d in tree bush; do
  [ -f $d/clean.glb ] && continue; mkdir -p $d/frames
  ffmpeg -loglevel error -y -i ${d}_turn.mp4 -vf "fps=12,scale=1920:-1" $d/frames/f_%03d.png
  ../tool/ocap $d/frames $d/model.usdz medium 2>&1 | grep -E "DONE|ERROR|FAILED" | head -1
  blender -b -P ../usd2glb.py -- $PWD/$d/model.usdz $PWD/$d/model.glb 2>&1 | grep -E "CONVERTED" | head -1
  blender -b -P ../depedestal.py -- $PWD/$d/model.glb $PWD/$d/clean.glb 2>&1 | grep -E "PEDESTAL" | head -1
  echo "$d $(stat -f%z $d/clean.glb) bytes"
done
python3 - <<'PY'
from PIL import Image
im=Image.open('ground.png').convert('RGB'); w,h=im.size; s=min(w,h); im=im.crop(((w-s)//2,(h-s)//2,(w-s)//2+s,(h-s)//2+s)).resize((1024,1024))
# make it tile: mirror into a 2x2 so edges meet themselves
T=Image.new('RGB',(2048,2048)); T.paste(im,(0,0)); T.paste(im.transpose(Image.FLIP_LEFT_RIGHT),(1024,0)); T.paste(im.transpose(Image.FLIP_TOP_BOTTOM),(0,1024)); T.paste(im.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.FLIP_TOP_BOTTOM),(1024,1024)); T.resize((1024,1024)).save('ground_tile.png')
sk=Image.open('sky.png').convert('RGB').resize((1536,864)); sk.save('sky_bg.png'); print('tiles ok')
PY
cwebp -quiet -q 82 ground_tile.png -o ground_tile.webp; cwebp -quiet -q 82 sky_bg.png -o sky_bg.webp; ls -la ground_tile.webp sky_bg.webp | awk '{print $5, $9}'
echo WORLD BUILT
