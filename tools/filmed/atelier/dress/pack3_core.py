# shared by pack3.py and rebase.py: the chroma key and body anchors (from ../assets/pack.py), the garment layer, the paths
import os, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, '..', 'assets', 'pack.py')).read().split("import sys\nfor look in")[0]; ns = {}; exec(src, ns); key_rgba = ns['key_rgba']; anchors = ns['anchors']
from layer import layer
SRC = '/private/tmp/claude-501/-Users-yonieyal-castle-chess/d9987f28-f2c5-4381-b2fb-abb4d8144d7e/scratchpad/atelier/assets'
OUT = '/Users/yonieyal/kingdom-quest/atelier/assets'
def bbox(a, thr=20):
    ys, xs = np.where(a > thr); return [xs.min(), ys.min(), xs.max() + 1, ys.max() + 1]
