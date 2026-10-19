# garment layer = what the edit added: changed vs the original, bright and colourless; output RGBA where RGB = the garment's own shading, A = its mask
import sys, numpy as np
from PIL import Image
from scipy import ndimage
SRC = '/private/tmp/claude-501/-Users-yonieyal-castle-chess/d9987f28-f2c5-4381-b2fb-abb4d8144d7e/scratchpad/atelier/assets'
def layer(look, client, garment):
    a = np.asarray(Image.open(f'{SRC}/{look}_{client}.png').convert('RGB')).astype(np.float32) / 255
    b = np.asarray(Image.open(f'{look}_{client}_{garment}.png').convert('RGB').resize((a.shape[1], a.shape[0]), Image.LANCZOS)).astype(np.float32) / 255
    # best small shift of b onto a (the edit can nudge the figure a few pixels)
    best = (1e9, 0, 0); ga, gb = a.mean(2), b.mean(2)
    for dy in range(-6, 7, 2):
        for dx in range(-6, 7, 2):
            d = np.abs(np.roll(np.roll(gb, dy, 0), dx, 1)[40:-40, 40:-40] - ga[40:-40, 40:-40]).mean()
            if d < best[0]: best = (d, dy, dx)
    b = np.roll(np.roll(b, best[1], 0), best[2], 1)
    diff = np.abs(b - a).max(2); mx = b.max(2); mn = b.min(2); sat = (mx - mn) / np.maximum(mx, 1e-6)
    gr = (b[..., 1] - np.maximum(b[..., 0], b[..., 2])) / np.maximum(mx, 1e-6)
    cand = (diff > 0.12) & (sat < 0.28) & (mx > 0.45) & (gr < 0.25)
    cand = ndimage.binary_opening(cand, iterations=2); cand = ndimage.binary_closing(cand, iterations=4)
    lab, n = ndimage.label(cand)
    if n == 0: raise SystemExit('no garment found')
    sizes = ndimage.sum(cand, lab, range(1, n + 1)); keep = [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * 0.08]
    m = np.isin(lab, keep); m = ndimage.binary_fill_holes(m)
    alpha = ndimage.gaussian_filter(m.astype(np.float32), 1.2); alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)
    shade = b.mean(2); shade = np.clip(shade / np.percentile(shade[m], 96), 0, 1)   # white = 1, folds darker
    rgba = np.dstack([shade, shade, shade, alpha]); out = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
    ys, xs = np.where(alpha > 0.05); box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    return out, box, best[1:], a.shape
if __name__ == '__main__':
    look, client, garment = sys.argv[1:4]; out, box, shift, shp = layer(look, client, garment); out.save(f'L_{look}_{client}_{garment}.png'); print(look, client, garment, 'box', box, 'shift', shift)
