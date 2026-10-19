import bpy, sys
argv = sys.argv[sys.argv.index("--") + 1:]; src, dst = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.wm.usd_import(filepath=src)
tris = 0; imgs = []
for o in bpy.data.objects:
    if o.type == 'MESH': tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
for im in bpy.data.images: imgs.append((im.name, tuple(im.size)))
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=90)
print("CONVERTED tris", tris, "images", imgs)
