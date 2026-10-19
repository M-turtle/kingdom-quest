# green-screen key: a clip or still on #00FF00 → transparent frames; clips become a sprite sheet (WebP with alpha) + a JSON of frame boxes
import sys, os, json, numpy as np
from PIL import Image
def key_rgba(im):
    from scipy import ndimage
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255; r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    hue_ok = (g - np.maximum(r, b)) / np.maximum(mx, 1e-6)                       # 1 when g is the only strong channel
    # the screen (and its shadow) is purer green than any felt: hue_ok >= 0.67 measured; the frog body tops out at 0.56
    green = np.clip((hue_ok - 0.58) / 0.12, 0, 1) * np.clip((sat - 0.45) / 0.15, 0, 1)
    # anything that is screen-ish or near-black and connected to the frame edge is backdrop (dark vignette corners included)
    cand = (green > 0.35) | (mx < 0.1)
    lab, n = ndimage.label(cand); border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); border = border[border > 0]
    back = np.isin(lab, border)
    alpha = np.where(back, np.where(mx < 0.1, 0.0, 1 - green), 1.0).astype(np.float32)
    alpha = np.where(back, np.clip((alpha - 0.25) / 0.6, 0, 1), alpha)                 # no faint haze left over the backdrop
    edge = (1 - alpha) * (alpha > 0)
    g2 = np.where(edge > 0, g - np.clip(g - np.maximum(r, b), 0, 1) * edge, g)
    out = np.stack([r, g2, b, alpha], axis=2); out[..., :3] = np.clip(out[..., :3], 0, 1)
    return Image.fromarray((out * 255).astype(np.uint8), 'RGBA')
def bbox_union(frames, pad=6):
    boxes = [f.getchannel('A').point(lambda p: 255 if p > 20 else 0).getbbox() for f in frames]; boxes = [b for b in boxes if b]
    x0 = max(0, min(b[0] for b in boxes) - pad); y0 = max(0, min(b[1] for b in boxes) - pad); x1 = min(frames[0].width, max(b[2] for b in boxes) + pad); y1 = min(frames[0].height, max(b[3] for b in boxes) + pad); return (x0, y0, x1, y1)
name = sys.argv[1]; kind = sys.argv[2]   # clip | still
if kind == 'still':
    im = key_rgba(Image.open(f'{name}.png')); bb = im.getchannel('A').point(lambda p: 255 if p > 20 else 0).getbbox(); im = im.crop(bb); s = max(im.size); sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(im, ((s - im.width) // 2, (s - im.height) // 2)); sq.resize((512, 512), Image.LANCZOS).save(f'site/{name}.webp', 'WEBP', quality=90); print(name, 'still keyed', sq.size)
else:
    files = sorted(f for f in os.listdir(f'{name}_frames') if f.endswith('.png')); frames = [key_rgba(Image.open(f'{name}_frames/{f}')) for f in files]
    bb = bbox_union(frames); frames = [f.crop(bb) for f in frames]
    for f in frames:
        a = np.asarray(f.getchannel('A')).copy(); a[:3, :] = 0; a[-3:, :] = 0; a[:, :3] = 0; a[:, -3:] = 0; f.putalpha(Image.fromarray(a)); w, h = frames[0].size; cell = 320; cols = 12; rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        k = cell / max(w, h); fr = f.resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS); x = (i % cols) * cell + (cell - fr.width) // 2; y = (i // cols) * cell + (cell - fr.height) // 2; sheet.paste(fr, (x, y))
    sheet.save(f'site/{name}_sheet.webp', 'WEBP', quality=88); json.dump({'frames': len(frames), 'cols': cols, 'cell': cell, 'aspect': w / h}, open(f'site/{name}_sheet.json', 'w')); print(name, 'frames', len(frames), 'cell', cell, 'sheet', sheet.size, os.path.getsize(f'site/{name}_sheet.webp'))
