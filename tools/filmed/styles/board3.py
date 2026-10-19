import subprocess, os, concurrent.futures as cf
TAIL = " No text, no letters, no logos, no watermark."
SUBJ = {
 "world": "A wide view from above of a wild expedition world in bright daylight: a red-rock canyon with a river, a jungle waterfall, a glacier edge, a base camp with tents, a zip line across the gorge, a cliffside observatory and a wooden hanging bridge.",
 "math": "A cliffside research station built into the rock: glass front, a radar dish, solar panels, a hanging rope bridge to its door, a river far below, full view with space around it.",
 "hero": "A cool thirteen-year-old explorer with a climbing harness, a light jacket, a small drone hovering beside them and a map tablet, confident relaxed stance, full body, facing slightly to the side, on plain ground.",
}
STYLES = {
 "wild": "Stylized realism like a top modern adventure game: rich natural materials, dramatic but bright daylight, clean readable shapes, atmospheric depth, premium 3D render.",
 "painted": "Painterly cel-shaded adventure look with confident brush strokes, bold silhouettes, strong colour blocking, breezy daylight, the look of a stylish animated adventure film for teens.",
 "eco": "Clean modern stylized 3D with a nature-tech feel: smooth surfaces, soft global illumination, fresh greens, warm sandstone, cyan accent lights on gear and buildings, bright and optimistic, premium render.",
}
def one(k):
    st, sub = k; out = f"teen2_{st}_{sub}.png"
    if os.path.exists(out): return out, "exists"
    p = subprocess.run(["node", "/Users/yonieyal/kingdom-quest/tools/fal_t2i.js", out, SUBJ[sub] + " " + STYLES[st] + TAIL, "--ar", "16:9", "--res", "1K"], capture_output=True, text=True)
    return out, (p.stdout + p.stderr)[-80:].strip()
with cf.ThreadPoolExecutor(3) as ex:
    for r in ex.map(one, [(s, u) for s in STYLES for u in SUBJ]): print(r)
