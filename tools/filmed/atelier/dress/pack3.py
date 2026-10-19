# v3 pack: client (keyed) + its garment layers on one shared crop, so a layer drawn over the client lands exactly; garment boxes go to meta
import sys, json, numpy as np, subprocess, os
from PIL import Image
from pack3_core import key_rgba, layer, SRC, OUT, bbox, ns
GS = {'felt': ['skirt', 'belt'], 'nature': ['circleSkirt', 'belt', 'hat']}
# usage: pack3.py                         every client, then the props
#        pack3.py <look> <client,...> <garment,...>   only those clients (e.g. felt fox,teddy skirt,belt,pants,shirt), no props
ONLY = sys.argv[1:4] if len(sys.argv) >= 4 else None
if ONLY: GS = {ONLY[0]: ONLY[2].split(',')}
for look, gs in GS.items():
    meta = json.load(open(f'{OUT}/{look}/meta.json'))
    for c in (ONLY[1].split(',') if ONLY else ['girl', 'boy', 'grandma', 'bear', 'fox', 'princess']):
        cl = key_rgba(Image.open(f'{SRC}/{look}_{c}.png')); A = np.asarray(cl.getchannel('A')); box = bbox(A); L = {}
        for g in gs:
            lay, b, shift, shp = layer(look, c, g); L[g] = lay; bb = bbox(np.asarray(lay.getchannel('A')))
            box = [min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3])]
        pad = 8; box = [max(0, box[0] - pad), max(0, box[1] - pad), min(cl.width, box[2] + pad), min(cl.height, box[3] + pad)]
        crop = cl.crop(box); k = min(700 / crop.width, 1100 / crop.height, 1.0); size = (round(crop.width * k), round(crop.height * k))
        crop = crop.resize(size, Image.LANCZOS); crop.save(f'{OUT}/{look}/{c}.webp', 'WEBP', quality=88)
        m = ns['anchors'](crop); m = {kk: float(v) for kk, v in m.items()}; m['g'] = {}
        for g, lay in L.items():
            gl = lay.crop(box).resize(size, Image.LANCZOS); gl.save(f'{OUT}/{look}/g_{c}_{g}.webp', 'WEBP', quality=86)
            a = np.asarray(gl.getchannel('A')); x0, y0, x1, y1 = bbox(a, 60)
            mid = a[(y0 + min(y1, y0 + 12)) // 2]; xs = np.where(mid > 60)[0]   # width of the garment's top band
            m['g'][g] = {'x0': x0 / size[0], 'y0': y0 / size[1], 'x1': x1 / size[0], 'y1': y1 / size[1], 'topW': float((xs.max() - xs.min()) / size[0]) if len(xs) else float((x1 - x0) / size[0])}
            if g == 'shirt':   # the chest, across: the shirt's own width on a row below the sleeves (the run through the middle)
                yy = round(y0 + 0.6 * (y1 - y0)); row = a[yy] > 60; cx = (x0 + x1) // 2; l = r = cx
                while l > 0 and row[l - 1]: l -= 1
                while r < size[0] - 1 and row[r + 1]: r += 1
                m['g'][g].update({'chestY': yy / size[1], 'chestX0': l / size[0], 'chestX1': (r + 1) / size[0]})
        meta[c] = m; print(look, c, size, {g: round(v['y0'], 3) for g, v in m['g'].items()})
    json.dump(meta, open(f'{OUT}/{look}/meta.json', 'w'))
if ONLY: raise SystemExit('PACK3 DONE (clients only)')
# props: table background, ruler and tape textures (a seamless middle band of each strip)
def band(img, look, name, key):
    im = Image.open(img).convert('RGB')
    if key: k = key_rgba(im); a = np.asarray(k.getchannel('A')); rows = np.where((a > 128).mean(1) > 0.5)[0]; cols = np.where((a > 128).mean(0) > 0.5)[0]
    else: rows = np.arange(im.height); cols = np.arange(im.width)
    y0, y1 = rows.min() + 4, rows.max() - 4; x0, x1 = cols.min() + (cols.max() - cols.min()) // 4, cols.min() + (cols.max() - cols.min()) // 2
    im.crop((x0, y0, x1, y1)).resize((512, 96), Image.LANCZOS).save(f'{OUT}/{look}/{name}.webp', 'WEBP', quality=84)
for look in ['felt', 'nature']:
    subprocess.run(['cwebp', '-quiet', '-q', '82', '-resize', '1920', '0', f'table_{look}.png', '-o', f'{OUT}/{look}/table.webp'], check=True)
    band(f'rulerblank_{look}.png', look, 'rulertex', True); band(f'tapeblank_{look}.png', look, 'tapetex', True)
print('PACK3 DONE')
