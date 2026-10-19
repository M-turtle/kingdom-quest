import subprocess, os, concurrent.futures as cf
STYLES = {
 "plush": "Everything made of soft plush and felt like premium toys, stitched seams, fuzzy textures, rounded shapes, warm studio lighting, premium 3D animated-film render.",
 "storybook": "Painted children's picture-book illustration brought into 3D: soft painted textures, gentle brush grain, warm glowing colours, dreamy light, premium animated-film render.",
 "glossy": "Bright glossy modern animated-film 3D: smooth clean surfaces, vivid saturated colours, big friendly shapes, crisp rim light, like a top studio feature film.",
 "paper": "Handmade papercraft and clay diorama: layered cut paper, cardboard, polymer clay figures with fingerprints, tiny real-world materials, tilt-shift macro photo look.",
}
SUBJECTS = {
 "kingdom": "A wide view from above of a small magical kingdom: a castle on a green hill in the middle, a round stone tower, a snowy mountain, a little music hall, a giant chessboard on the grass, a pond, meadows, trees and a winding river.",
 "tower": "A round stone wizard's tower with a blue cone roof, a wooden door, glowing windows and a few floating glowing orbs around its top, on a grassy patch, full view with space around it.",
 "character": "A friendly young wizard child character with a pointed blue hat with stars, a small cape and a little wand, standing and smiling, full body, facing slightly to the side, on a plain ground.",
}
def one(k):
    s, sub = k; out = f"{s}_{sub}.png"
    if os.path.exists(out): return out, "exists"
    p = subprocess.run(["node", "/Users/yonieyal/kingdom-quest/tools/fal_t2i.js", out, SUBJECTS[sub] + " " + STYLES[s] + " No text, no letters, no logos, no watermark.", "--ar", "16:9", "--res", "1K"], capture_output=True, text=True)
    return out, (p.stdout + p.stderr)[-120:].strip()
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(one, [(s, u) for s in STYLES for u in SUBJECTS]): print(r)
