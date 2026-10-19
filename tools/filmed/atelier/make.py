import json, pathlib, urllib.request, concurrent.futures as cf
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(p, body=None):
    req = urllib.request.Request(BASE + p, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET"); return json.loads(urllib.request.urlopen(req, timeout=240).read())
def still(name, subject):
    r = call("/godmode/api/still", {"subject": subject, "style": "free", "background": "free", "format": "16:9", "count": 1}); sid = r["stills"][0].get("id") or r["stills"][0].get("still_id")
    pathlib.Path(name + ".png").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=120).read()); return name, sid
PLUSH = ", everything made of soft plush and felt like premium toys, stitched seams, fuzzy textures, rounded shapes, premium 3D animated-film render, warm daylight, wide shot from a gentle angle, no text, no letters, no numbers, no logos"
J = {
 "atelier": "A cosy felt tailor's shop interior: a big-headed felt doll client standing on a round fitting podium with her arms out, a felt measuring tape wrapped around her waist held by two little felt hands, bolts of felt fabric in many colours on shelves behind, a cutting table with a long felt ruler, chalk, scissors and a paper pattern, a felt cash drawer and a felt bell on the counter, a window with a felt street outside" + PLUSH,
 "pattern": "A felt drafting table seen from above at an angle: a sheet of felt pattern paper with a large drawn circle sector and a rectangle in chalk, a felt pin compass, a felt protractor and a long felt ruler lying on it, and beside the table a finished felt cone-shaped party hat and a felt sleeve standing as 3D objects, as if the flat shapes fold into them, soft lamp light" + PLUSH,
 "scale": "Three felt dolls of three sizes standing in a row on a felt workshop floor, tiny, medium and large like a teddy bear, each wearing the same felt dress scaled to its size, a felt tape measure on the floor between them and a felt chalkboard easel showing only a simple drawn ruler, no writing" + PLUSH,
 "runway": "A felt fashion runway at night with a felt spotlight, a big-headed felt doll walking in a half-finished felt dress with pins in it, a little felt seamstress character kneeling at the hem with scissors and a tape measure, a felt audience of toy animals clapping, confetti" + PLUSH,
 "mystery": "A felt detective's room: a felt magnifying glass on a desk, four felt dresses hanging on a rack of different sizes, a row of felt shoes of different lengths on the floor, a felt tape measure, a felt doll in a detective hat holding a notebook, mysterious warm lamplight" + PLUSH,
 "lab": "A bright felt design studio: a huge roll of felt fabric unrolled across a long table, a felt doll wearing a wild hand-made felt outfit of circles and triangles, chalk shapes drawn on the fabric, a felt wardrobe open at the side full of saved felt outfits on hangers, a felt window with sunshine" + PLUSH,
}
with cf.ThreadPoolExecutor(3) as ex:
    for r in ex.map(lambda k: still(k, J[k]), J): print(r, flush=True)
print("spent today", call("/godmode/api/status")["spent_today"])
