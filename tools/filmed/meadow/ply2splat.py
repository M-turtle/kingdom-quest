# Brush .ply (3DGS) -> .splat (32 bytes per splat: pos f32x3, scale f32x3, rgba u8x4, rot u8x4), keeping the most opaque N
import sys, numpy as np, struct
src, dst, keep = sys.argv[1], sys.argv[2], int(sys.argv[3])
f = open(src, 'rb'); props = []; n = 0
while True:
    line = f.readline().decode().strip()
    if line.startswith('element vertex'): n = int(line.split()[-1])
    elif line.startswith('property'): props.append(line.split()[-1])
    elif line == 'end_header': break
data = np.frombuffer(f.read(), dtype=np.float32).reshape(n, len(props)); P = {p: i for i, p in enumerate(props)}
pos = data[:, [P['x'], P['y'], P['z']]]; scale = np.exp(data[:, [P['scale_0'], P['scale_1'], P['scale_2']]])
op = 1 / (1 + np.exp(-data[:, P['opacity']])); SH0 = 0.28209479177387814
rgb = np.clip(0.5 + SH0 * data[:, [P['f_dc_0'], P['f_dc_1'], P['f_dc_2']]], 0, 1)
rot = data[:, [P['rot_0'], P['rot_1'], P['rot_2'], P['rot_3']]]; rot = rot / np.linalg.norm(rot, axis=1, keepdims=True)
import json; box = json.load(open('free/camera.json'))['box']; lo, hi = np.array(box[0]) - np.array([0.6, 0.0, 0.6]), np.array(box[1]) + 0.6; inside = np.all((pos > lo) & (pos < hi), axis=1) & (scale.max(1) < 0.16)
idx = np.where(inside)[0]; idx = idx[np.argsort(-op[idx])][:keep]; idx = idx[np.argsort(-(op[idx] * scale[idx].prod(1)))]   # keep the most visible
out = bytearray()
for i in idx:
    out += struct.pack('<3f', *pos[i]) + struct.pack('<3f', *scale[i]) + bytes(np.round(np.append(rgb[i] * 255, op[i] * 255)).astype(np.uint8)) + bytes(np.round(rot[i] * 128 + 128).clip(0, 255).astype(np.uint8))
open(dst, 'wb').write(out); print('splats', n, 'kept', len(idx), 'bytes', len(out))
