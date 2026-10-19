# Blender: import a GLB, cut off the turntable pedestal (the wide flat slab at the bottom), export GLB. Usage: blender -b -P depedestal.py -- in.glb out.glb
import bpy, bmesh, sys
argv = sys.argv[sys.argv.index("--") + 1:]; src, dst = argv[0], argv[1]; FORCE = float(argv[2]) if len(argv) > 2 else None   # optional: cut at this fraction of the height
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in bpy.data.objects: o.select_set(o.type == 'MESH')
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active; me = obj.data
zs = [(obj.matrix_world @ v.co).z for v in me.vertices]; zmin, zmax = min(zs), max(zs); H = zmax - zmin
# the pedestal is a flat disc: its top is a horizontal plane in the bottom third carrying many upward-facing faces at one height.
# Find the height band (1/80 of the model) in the bottom 30% with the most up-facing face centres; if it holds over 1.5% of all faces, cut just above it.
N = 80; counts = [0] * N; total = len(me.polygons); M = obj.matrix_world; Mn = M.to_3x3()
for f in me.polygons:
    n = (Mn @ f.normal).normalized()
    if n.z > 0.9:
        z = (M @ f.center).z; b = min(N - 1, int((z - zmin) / H * N)); counts[b] += 1
lim = int(N * 0.3); best = max(range(lim), key=lambda b: counts[b]); cut = None
if counts[best] > total * 0.015: cut = zmin + H * (best + 1.6) / N
else:
    # fallback: a wide flat bottom slab — the widest of the bottom slices sits in the lowest 12% and the width then drops by a third
    M2 = obj.matrix_world; ws = []
    for i in range(16):
        z0, z1 = zmin + H * i / 80, zmin + H * (i + 1) / 80
        pts = [M2 @ v.co for v in me.vertices if z0 <= (M2 @ v.co).z < z1]; ws.append((max(p.x for p in pts) - min(p.x for p in pts)) if len(pts) > 5 else 0)
    wmax = max(ws[:10]) if ws else 0
    for i in range(1, 16):
        if wmax > 0 and ws[i] < wmax * 0.66 and i <= 10: cut = zmin + H * (i + 0.5) / 80; print("FALLBACK cut", round((cut - zmin) / H, 3)); break
print("TOP-PLANES", [counts[b] for b in range(lim)], "best", best, "cut", None if cut is None else round((cut - zmin) / H, 3))
if FORCE is not None: cut = zmin + H * FORCE; print("FORCED cut", FORCE)
if cut is not None and (cut - zmin) / H < 0.3:
    bm = bmesh.new(); bm.from_mesh(me); M = obj.matrix_world
    doomed = [v for v in bm.verts if (M @ v.co).z < cut]
    bmesh.ops.delete(bm, geom=doomed, context='VERTS'); bm.to_mesh(me); bm.free(); me.update()
    print("PEDESTAL REMOVED", len(doomed), "verts")
else: print("PEDESTAL KEPT")
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=90)
print("EXPORTED", dst)
