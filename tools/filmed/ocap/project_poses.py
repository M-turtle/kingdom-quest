# Blender: paint the turntable frames back onto the Object Capture mesh using Object Capture's own camera poses, so the texture is the frames'
# pixels at the frames' resolution. Usage: blender -b -P project_poses.py -- <poses_out dir> <frames dir> <out.glb> [n_cams] [tex_size]
import bpy, sys, json, math, mathutils, os
argv = sys.argv[sys.argv.index("--") + 1:]; pdir, fdir, dst = argv[0], argv[1], argv[2]; TS = int(argv[4]) if len(argv) > 4 else 4096
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.wm.usd_import(filepath=os.path.join(pdir, "model.usdz"))
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in bpy.data.objects: o.select_set(o.type == 'MESH')
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active; me = obj.data; base_uv = me.uv_layers[0].name
# the model's bounds in the poses' frame (bounds.json from the poses tool): the import may have rescaled the mesh, so match it back
bpath = os.path.join(pdir, "bounds.json")
if os.path.exists(bpath):
    B = json.load(open(bpath)); bmin, bmax = B["min"], B["max"]
    # expected box in Blender space: RK (x, y, z) -> Blender (x, -z, y)
    ex = ((bmin[0] + bmax[0]) / 2, -(bmin[2] + bmax[2]) / 2, bmin[1]); eh = bmax[1] - bmin[1]
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
    if obj.parent: bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')   # the USD import's root carries the Y-up to Z-up turn
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for it in range(2):
        pts0 = [v.co.copy() for v in me.vertices]; mh = max(p.z for p in pts0) - min(p.z for p in pts0); k = eh / mh
        cx = (max(p.x for p in pts0) + min(p.x for p in pts0)) / 2; cy = (max(p.y for p in pts0) + min(p.y for p in pts0)) / 2; zmin = min(p.z for p in pts0)
        for v in me.vertices: v.co = mathutils.Vector(((v.co.x - cx) * k + ex[0], (v.co.y - cy) * k + ex[1], (v.co.z - zmin) * k + ex[2]))
        me.update()
    pts0 = [v.co for v in me.vertices]
    print("BOUNDS matched: x", round(min(p.x for p in pts0), 3), round(max(p.x for p in pts0), 3), "y", round(min(p.y for p in pts0), 3), round(max(p.y for p in pts0), 3), "z", round(min(p.z for p in pts0), 3), round(max(p.z for p in pts0), 3), "expected x", round(bmin[0], 3), round(bmax[0], 3), "y", round(-bmax[2], 3), round(-bmin[2], 3), "z", round(bmin[1], 3), round(bmax[1], 3))
bpy.context.view_layer.update(); pts = [obj.matrix_world @ v.co for v in me.vertices]
print("MESH verts", len(me.vertices), "z range", round(min(p.z for p in pts), 3), round(max(p.z for p in pts), 3), "y range", round(min(p.y for p in pts), 3), round(max(p.y for p in pts), 3))
poses = sorted(json.load(open(os.path.join(pdir, "poses.json")))["poses"], key=lambda p: p["id"])
frames = sorted(f for f in os.listdir(fdir) if f.endswith(".png"))
# RealityKit is Y-up; the USD import turned the model Z-up (x, y, z) -> (x, -z, y). The poses get the same turn.
CONV = mathutils.Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
def pose_matrix(p):
    cols = p["columns"]; m = mathutils.Matrix(((cols[0][0], cols[1][0], cols[2][0], cols[3][0]), (cols[0][1], cols[1][1], cols[2][1], cols[3][1]), (cols[0][2], cols[1][2], cols[2][2], cols[3][2]), (cols[0][3], cols[1][3], cols[2][3], cols[3][3])))
    return CONV @ m
sc = bpy.context.scene; sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
# vertical field of view: fit so the mesh fills the frame height the way the object fills the pictures (measured from frame 0)
from bpy_extras.object_utils import world_to_camera_view
import numpy as np
im0 = bpy.data.images.load(os.path.join(fdir, frames[0])); W, H = im0.size; px = np.array(im0.pixels[:]).reshape(H, W, 4); bg = px[2, 2, :3]
mask = np.abs(px[..., :3] - bg).sum(axis=2) > 0.09; rows = np.where(mask.any(axis=1))[0]; fill = (rows.max() - rows.min()) / H; print("object fills", round(fill, 3), "of frame height")
cam0 = bpy.data.objects.new("fit", bpy.data.cameras.new("fit")); bpy.context.collection.objects.link(cam0); cam0.matrix_world = pose_matrix(poses[0]); cam0.data.sensor_fit = 'VERTICAL'
best = None
for fov_deg in np.arange(20, 70, 0.5):
    cam0.data.angle_y = math.radians(fov_deg); bpy.context.view_layer.update()
    ys = [world_to_camera_view(sc, cam0, p).y for p in pts]; span = max(ys) - min(ys)
    if best is None or abs(span - fill) < abs(best[1] - fill): best = (fov_deg, span)
FOV = math.radians(best[0]); print("FOV fit", best[0], "deg (span", round(best[1], 3), ")"); cam0.data.angle_y = FOV; bpy.context.view_layer.update(); top = max(pts, key=lambda p: p.z); bot = min(pts, key=lambda p: p.z); print("apex in cam0", [round(c, 3) for c in world_to_camera_view(sc, cam0, top)], "base in cam0", [round(c, 3) for c in world_to_camera_view(sc, cam0, bot)], "cam0 at", [round(c, 3) for c in cam0.matrix_world.translation])
# cameras: NC frames spread round the circle, baked in rounds of 7 (Blender allows 8 UV maps), merged as weighted sums
NC = int(argv[3]) if len(argv) > 3 else 21
idx = [int(i * len(poses) / NC) for i in range(NC)]
import numpy as np
def make_cam(p):
    name = f"c{p['id']:03d}"; cd = bpy.data.cameras.new(name); cd.sensor_fit = 'VERTICAL'; cd.angle_y = FOV; cam = bpy.data.objects.new(name, cd); bpy.context.collection.objects.link(cam); cam.matrix_world = pose_matrix(p); bpy.context.view_layer.update()
    uvl = me.uv_layers.new(name="proj_" + name)
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index]; c = world_to_camera_view(sc, cam, obj.matrix_world @ v.co); uvl.data[li].uv = (c.x, c.y)
    return name, cam, bpy.data.images.load(os.path.join(fdir, frames[p["id"]]))
sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.device = 'CPU'; sc.render.bake.use_selected_to_active = False; sc.render.bake.margin = 16
# the original bake (full coverage, soft) as the fallback layer: bake its colour through the base UVs first
orig_img = None
for m in me.materials:
    if m and m.use_nodes:
        for nd in m.node_tree.nodes:
            if nd.type == 'TEX_IMAGE' and nd.image and 'tex0' in nd.image.name: orig_img = nd.image
print("original texture", orig_img.name if orig_img else None)
def bake_to(image, build_nodes):
    mat = bpy.data.materials.new("bake"); mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); emit = nt.nodes.new('ShaderNodeEmission'); nt.links.new(emit.outputs[0], out.inputs[0])
    build_nodes(nt, emit)
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = image; tuv = nt.nodes.new('ShaderNodeUVMap'); tuv.uv_map = base_uv; nt.links.new(tuv.outputs[0], tn.inputs[0]); nt.nodes.active = tn
    me.materials.clear(); me.materials.append(mat); me.uv_layers.active = me.uv_layers[base_uv]
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj; bpy.ops.object.bake(type='EMIT')
def pix(image):
    a = np.empty(image.size[0] * image.size[1] * 4, dtype=np.float32); image.pixels.foreach_get(a); return a.reshape(image.size[1], image.size[0], 4)
base_img = bpy.data.images.new("base", TS, TS, float_buffer=True)
if orig_img:
    bake_to(base_img, lambda nt, emit: (lambda t, u: (nt.links.new(u.outputs[0], t.inputs[0]), nt.links.new(t.outputs['Color'], emit.inputs['Color'])))(nt.nodes.new('ShaderNodeTexImage'), nt.nodes.new('ShaderNodeUVMap')) if False else None)
    # (explicit build for clarity)
    def b_base(nt, emit):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = orig_img; u = nt.nodes.new('ShaderNodeUVMap'); u.uv_map = base_uv; nt.links.new(u.outputs[0], t.inputs[0]); nt.links.new(t.outputs['Color'], emit.inputs['Color'])
    bake_to(base_img, b_base)
BASE = pix(base_img)[..., :3] if orig_img else None
# per camera: colour and weight; keep the best two per texel (winner takes most, the runner-up only softens the seam)
B1C = np.zeros((TS, TS, 3), np.float32); B1W = np.zeros((TS, TS), np.float32); B2C = np.zeros((TS, TS, 3), np.float32); B2W = np.zeros((TS, TS), np.float32)
for ci in idx:
    cams = [make_cam(poses[ci])]
    def b_num(nt, emit):
        geo = nt.nodes.new('ShaderNodeNewGeometry'); name, cam, img = cams[0]
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = "proj_" + name; tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img; tex.extension = 'EXTEND'; tex.interpolation = 'Cubic'; nt.links.new(uvn.outputs[0], tex.inputs[0]); nt.links.new(tex.outputs['Color'], emit.inputs['Color'])
    def b_den(nt, emit):
        geo = nt.nodes.new('ShaderNodeNewGeometry'); name, cam, img = cams[0]
        sub = nt.nodes.new('ShaderNodeVectorMath'); sub.operation = 'SUBTRACT'; sub.inputs[0].default_value = cam.matrix_world.translation; nt.links.new(geo.outputs['Position'], sub.inputs[1])
        nrm = nt.nodes.new('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'; nt.links.new(sub.outputs[0], nrm.inputs[0])
        dot = nt.nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; nt.links.new(geo.outputs['Normal'], dot.inputs[0]); nt.links.new(nrm.outputs[0], dot.inputs[1])
        s2 = nt.nodes.new('ShaderNodeMath'); s2.operation = 'SUBTRACT'; s2.inputs[1].default_value = 0.15; nt.links.new(dot.outputs['Value'], s2.inputs[0]); cl = nt.nodes.new('ShaderNodeMath'); cl.operation = 'MAXIMUM'; cl.inputs[1].default_value = 0.0; nt.links.new(s2.outputs[0], cl.inputs[0])
        nt.links.new(cl.outputs[0], emit.inputs['Strength']); emit.inputs['Color'].default_value = (1, 1, 1, 1)
    ni = bpy.data.images.new(f"num{ci}", TS, TS, float_buffer=True); di = bpy.data.images.new(f"den{ci}", TS, TS, float_buffer=True)
    bake_to(ni, b_num); bake_to(di, b_den); C = pix(ni)[..., :3]; Wt = pix(di)[..., 0]
    better = Wt > B1W; second = (~better) & (Wt > B2W)
    B2C[second] = C[second]; B2W[second] = Wt[second]
    B2C[better] = B1C[better]; B2W[better] = B1W[better]; B1C[better] = C[better]; B1W[better] = Wt[better]
    name, cam, img = cams[0]; me.uv_layers.remove(me.uv_layers["proj_" + name]); bpy.data.objects.remove(cam); bpy.data.images.remove(ni); bpy.data.images.remove(di)
    print("camera", ci, "done")
# the winner takes most: the runner-up only where its facing is nearly as good (hides the seam between neighbouring frames)
k2 = np.clip((B2W / np.maximum(B1W, 1e-6) - 0.85) / 0.15, 0, 1) * 0.5
NUM = B1C * (1 - k2)[..., None] + B2C * k2[..., None]; DEN = np.ones((TS, TS), np.float32) * (B1W > 0.02)
NUM = NUM * DEN[..., None]
W0 = 0.02   # the soft original fills only where the frames gave nothing
if BASE is not None: NUM += BASE * W0; DEN += W0
FIN = NUM / np.maximum(DEN, 1e-6)[..., None]
# the bakes are linear light; an ordinary 8-bit image holds sRGB, so convert before storing
L = np.clip(FIN, 0, 1); SR = np.where(L <= 0.0031308, 12.92 * L, 1.055 * np.power(L, 1 / 2.4) - 0.055)
target = bpy.data.images.new("baked", TS, TS); out_px = np.ones((TS, TS, 4), np.float32); out_px[..., :3] = SR; target.pixels.foreach_set(out_px.ravel())
target.filepath_raw = dst.replace('.glb', '_tex.png'); target.file_format = 'PNG'; target.save()
fm = bpy.data.materials.new("painted"); fm.use_nodes = True; fnt = fm.node_tree; bsdf = fnt.nodes['Principled BSDF']; ti = fnt.nodes.new('ShaderNodeTexImage'); ti.image = target; fnt.links.new(ti.outputs['Color'], bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = 1.0
me.materials.clear(); me.materials.append(fm); me.uv_layers.active = me.uv_layers[base_uv]
bpy.data.objects.remove(cam0)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=92)
print("PROJECTED", dst)
