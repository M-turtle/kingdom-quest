import json, time, pathlib, urllib.request, os, subprocess, concurrent.futures as cf
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(p, body=None):
    req = urllib.request.Request(BASE + p, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET"); return json.loads(urllib.request.urlopen(req, timeout=240).read())
STYLE = {
 "plush": "everything made of soft plush and felt like a premium toy, stitched seams, fuzzy textures, rounded shapes",
 "voxel": "built from chunky painted blocks of varied sizes with slightly bevelled edges and smooth painted faces (no pixel textures), a polished block-toy look that is its own design",
 "nature": "clean modern stylized 3D with a nature-tech feel: smooth surfaces, fresh greens, warm sandstone, cyan accent lights on edges and gear, bright and optimistic",
}
OBJ = {
 ("plush", "host"): "a kind old wizard with a long beard, a blue star robe and a pointed hat, standing upright",
 ("plush", "creature"): "a cute bunny with long ears, sitting",
 ("voxel", "tower"): "a round stone wizard's tower with a blue cone roof, a wooden door and glowing windows",
 ("voxel", "host"): "a friendly explorer kid with goggles and a backpack, standing upright, rounded block-toy proportions with a real face",
 ("voxel", "creature"): "a cute fox, standing",
 ("nature", "tower"): "a round stone wizard's tower with a blue cone roof, a wooden door and glowing windows",
 ("nature", "host"): "a cool teen ranger with a light jacket, climbing harness and a small drone on the shoulder, standing upright",
 ("nature", "creature"): "a majestic eagle perched with folded wings",
}
SUB = " {obj}, {style}, standing centered on a plain matte light-grey round pedestal, plain soft grey studio background, even soft studio lighting, full object visible with space around it, no text, no logos."
MOT = ("The round pedestal is a turntable: it turns slowly and steadily through one complete 360-degree rotation over the whole clip, carrying the object with it, so it is seen from the front, its side, its back, its other side and back to the front. "
       "The object itself stays perfectly still and rigid, nothing on it moves or changes. Lighting, background and framing stay exactly the same the whole time.")
def one(k):
    st, ob = k; d = pathlib.Path(f"{st}_{ob}"); d.mkdir(exist_ok=True)
    if (d / "turn.mp4").exists(): return k, "clip exists"
    for attempt in range(3):
        try:
            r = call("/godmode/api/still", {"subject": SUB.format(obj=OBJ[k][0].upper() + OBJ[k][1:], style=STYLE[st]), "style": "free", "background": "free", "format": "16:9", "count": 1}); sid = r["stills"][0].get("id") or r["stills"][0].get("still_id")
            (d / "still.png").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=120).read())
            r = call("/godmode/api/animate", {"still_id": sid, "motion": MOT, "camera": "locked", "quality": "final"}); job = r["job"]; t0 = time.time()
            while True:
                time.sleep(15); j = call("/godmode/api/job/" + job["id"]); j = j.get("job", j)
                if j["status"] in ("done", "failed", "error") or time.time() - t0 > 600: break
            if j["status"] != "done": raise RuntimeError("veo " + str(j.get("error")))
            (d / "turn.mp4").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/videos/" + j["id"] + ".mp4", headers=H), timeout=300).read()); return k, "ok"
        except Exception as e: err = str(e)[:120]; time.sleep(10)
    return k, "FAILED " + err
with cf.ThreadPoolExecutor(2) as ex:
    for r in ex.map(one, list(OBJ)): print(r, flush=True)
print("spent today", call("/godmode/api/status")["spent_today"])
