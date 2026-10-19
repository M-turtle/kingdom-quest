import subprocess, os, concurrent.futures as cf
TAIL = " No text, no letters, no logos, no watermark."
BANDS = {
 "mid": { # 7–9
  "subjects": {
   "world": "A wide view from above of an adventure world: a fortress on a cliff, a volcano with a science lab, a jungle temple, a harbour with a ship, zip lines and rope bridges between them, a river and waterfalls.",
   "math": "A clockwork observatory tower with brass gears, a big telescope dome, number dials and a rope-bridge entrance, on a rocky hill, full view with space around it.",
   "hero": "A brave kid explorer, about nine years old, with goggles on the forehead, a backpack, a utility belt and a compass, standing confidently, full body, facing slightly to the side, on a plain ground.",
  },
  "styles": {
   "expedition": "Stylized painterly adventure-game 3D, cel-shaded with soft painted light, bold silhouettes, wind in the grass, the look of a big open-world adventure game for all ages.",
   "bricks": "Everything built from snap-together plastic building bricks and minifigure-style characters, crisp glossy plastic, studs visible, playful and precise, premium toy-photography render.",
   "voxel": "Blocky voxel world made of chunky cubes with hand-painted textures, warm sunlight, long soft shadows, the cosy look of a famous block-building game but polished and cinematic.",
  }},
 "teen": { # 10+
  "subjects": {
   "world": "A wide view from above of a futuristic academy at night: glass towers, a stadium with lights, a domed lab, a skate park, a monorail, neon signs without words, a river with bridges.",
   "math": "A sleek data tower: a tall glass-and-steel spire with floating holographic rings and glowing panels, a plaza with light strips at its base, full view with space around it.",
   "hero": "A cool teenager, about thirteen, with a hoodie, sneakers, a holographic wristband and a hoverboard under one arm, relaxed confident pose, full body, facing slightly to the side, on a plain ground.",
  },
  "styles": {
   "neon": "Sleek sci-fi look: dark surfaces with glowing cyan and magenta light lines, holograms, reflections on wet ground, cinematic night lighting, premium 3D render.",
   "graphic": "Bold graphic-novel cel-shading: thick clean ink outlines, flat dynamic colours, halftone shadows, stylish anime-adjacent energy, daytime, premium 2.5D render.",
   "cinematic": "Realistic cinematic concept art: physically based materials, dramatic golden-hour light, atmospheric haze, detailed but clean, the look of a top-tier modern game trailer.",
  }},
}
def one(k):
    band, st, sub = k; out = f"{band}_{st}_{sub}.png"
    if os.path.exists(out): return out, "exists"
    B = BANDS[band]; p = subprocess.run(["node", "/Users/yonieyal/kingdom-quest/tools/fal_t2i.js", out, B["subjects"][sub] + " " + B["styles"][st] + TAIL, "--ar", "16:9", "--res", "1K"], capture_output=True, text=True)
    return out, (p.stdout + p.stderr)[-100:].strip()
jobs = [(b, s, u) for b in BANDS for s in BANDS[b]["styles"] for u in BANDS[b]["subjects"]]
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(one, jobs): print(r)
