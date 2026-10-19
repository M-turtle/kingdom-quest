# pack the photo-built models into the staging style files: shared/models/style_<s>.js = window.KQ_STYLE = { tower, host, creature }
import base64, os
S = '/private/tmp/claude-501/-Users-yonieyal-castle-chess/d9987f28-f2c5-4381-b2fb-abb4d8144d7e/scratchpad/ocap'
SRC = { ('plush', 'tower'): f'{S}/tower/clean_up.glb' }
for s in ['plush', 'voxel', 'nature']:
    for o in ['tower', 'host', 'creature']: SRC.setdefault((s, o), f'{S}/{s}_{o}/clean.glb')
for s in ['plush', 'voxel', 'nature']:
    parts = []
    for o in ['tower', 'host', 'creature']:
        f = SRC[(s, o)]
        if not os.path.exists(f): print('MISSING', f); continue
        parts.append(f"  {o}: '" + base64.b64encode(open(f, 'rb').read()).decode() + "'")
    if s == 'plush':
        for k, f in [('tree', f'{S}/world/tree/clean.glb'), ('bush', f'{S}/world/bush/clean.glb')]:
            if os.path.exists(f): parts.append(f"  {k}: '" + base64.b64encode(open(f, 'rb').read()).decode() + "'")
        for k, f in [('ground', f'{S}/world/ground_tile.webp'), ('sky', f'{S}/world/sky_bg.webp')]:
            if os.path.exists(f): parts.append(f"  {k}: 'data:image/webp;base64," + base64.b64encode(open(f, 'rb').read()).decode() + "'")
    out = f'/Users/yonieyal/kingdom-quest/shared/models/style_{s}.js'
    open(out, 'w').write("/* STYLE TEST models (staging only, 2026-10-18): " + s + " — tower, host, creature as base64 GLB, built still → Veo turntable → Apple Object Capture on the Mac (the surface is the video's own pixels). */\nwindow.KQ_STYLE = {\n" + ",\n".join(parts) + "\n};\n")
    print(out, os.path.getsize(out))
