import json, time, pathlib, urllib.request, concurrent.futures as cf
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(p, body=None):
    req = urllib.request.Request(BASE + p, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET"); return json.loads(urllib.request.urlopen(req, timeout=240).read())
def still(name, subject, fmt="16:9"):
    r = call("/godmode/api/still", {"subject": subject, "style": "free", "background": "free", "format": fmt, "count": 1}); sid = r["stills"][0].get("id") or r["stills"][0].get("still_id")
    pathlib.Path(name + ".png").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=120).read()); return sid
def clip(name, sid, motion):
    for attempt in range(3):
        try: r = call("/godmode/api/animate", {"still_id": sid, "motion": motion, "camera": "prompt", "quality": "final"}); break
        except Exception as e: print(name, "submit retry", e, flush=True); time.sleep(20)
    job = r["job"]; t0 = time.time()
    while True:
        time.sleep(15); j = call("/godmode/api/job/" + job["id"]); j = j.get("job", j)
        if j["status"] in ("done", "failed", "error") or time.time() - t0 > 700: break
    if j["status"] == "done": pathlib.Path(name + ".mp4").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/videos/" + j["id"] + ".mp4", headers=H), timeout=300).read()); return "ok"
    return "fail " + str(j.get("error"))
PLUSH = "everything made of soft plush and felt like premium toys, stitched seams, fuzzy textures, rounded shapes, premium 3D animated-film render, warm daylight, no text, no logos"
SCENE = ("A vast, wide felt meadow seen from a high gentle angle like a drone far back, the home of a children's learning kingdom: rolling felt hills stretching to distant felt mountains, a winding felt river with two little bridges, big felt forests, and six places spread far apart across the whole landscape with long felt paths between them: a tall blue-roofed felt tower on a hill (maths), a felt garden with a big gate of letters (words), a felt music pavilion with a drum roof by the river, a felt art house with a paintbrush chimney, a felt pond with reeds and lily pads (nature), and a felt rocket on a launch pad on a far hilltop (space); a small felt signpost clearing in the centre; cotton-wool clouds; the places are small in the frame because the meadow is huge, " + PLUSH)
sid = still("meadow", SCENE); print("still", sid, flush=True)
FLY = "Nothing in the scene moves except the clouds drifting very slowly and the river shimmering. The camera is a fast, playful drone: it dives from high above, swoops low over the river and under the first bridge, banks sharply around the trees, skims the path, and pulls up to stop right in front of the blue-roofed tower's door. Fast, smooth, exciting, no shake."
print(("fly_maths", clip("fly_maths", sid, FLY)), flush=True)
print("spent today", call("/godmode/api/status")["spent_today"])
