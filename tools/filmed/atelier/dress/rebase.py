# swap a client's base picture (same pose, new base clothes) without redoing its garment layers: the crop box is rebuilt from the
# ORIGINAL picture and its garment edits exactly as pack3 builds it, then the new picture is keyed and cut on that same box, so every
# existing g_<client>_<garment>.webp still lands where it did. usage: python3 rebase.py <look> <client> <new.png> <garment,...>
import sys, json, numpy as np
from PIL import Image
import pack3_core as P   # key_rgba, anchors, layer, bbox, SRC, OUT (shared with pack3)
look, client, newp, gs = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(',')
cl = P.key_rgba(Image.open(f'{P.SRC}/{look}_{client}.png')); box = P.bbox(np.asarray(cl.getchannel('A')))
for g in gs:
    lay = P.layer(look, client, g)[0]; bb = P.bbox(np.asarray(lay.getchannel('A')))
    box = [min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3])]
pad = 8; box = [max(0, box[0] - pad), max(0, box[1] - pad), min(cl.width, box[2] + pad), min(cl.height, box[3] + pad)]
crop = cl.crop(box); k = min(700 / crop.width, 1100 / crop.height, 1.0); size = (round(crop.width * k), round(crop.height * k))
new = P.key_rgba(Image.open(newp)).crop(box).resize(size, Image.LANCZOS); new.save(f'{P.OUT}/{look}/{client}.webp', 'WEBP', quality=88)
meta = json.load(open(f'{P.OUT}/{look}/meta.json')); m = {kk: float(v) for kk, v in P.anchors(new).items()}; m['g'] = meta[client]['g']; meta[client] = m
json.dump(meta, open(f'{P.OUT}/{look}/meta.json', 'w')); print(look, client, 'rebased on', box, size)
