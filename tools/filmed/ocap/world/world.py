import json, time, pathlib, urllib.request, concurrent.futures as cf
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(p, body=None):
    req = urllib.request.Request(BASE + p, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET"); return json.loads(urllib.request.urlopen(req, timeout=240).read())
def still(name, subject):
    r = call("/godmode/api/still", {"subject": subject, "style": "free", "background": "free", "format": "16:9", "count": 1}); sid = r["stills"][0].get("id") or r["stills"][0].get("still_id")
    pathlib.Path(name + ".png").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=120).read()); return sid
MOT = ("The round pedestal is a turntable: it turns slowly and steadily through one complete 360-degree rotation over the whole clip, carrying the object with it. The object itself stays perfectly still and rigid, nothing on it moves or changes. Lighting, background and framing stay exactly the same the whole time.")
def turn(name, sid):
    r = call("/godmode/api/animate", {"still_id": sid, "motion": MOT, "camera": "locked", "quality": "final"}); job = r["job"]; t0 = time.time()
    while True:
        time.sleep(15); j = call("/godmode/api/job/" + job["id"]); j = j.get("job", j)
        if j["status"] in ("done", "failed", "error") or time.time() - t0 > 600: break
    if j["status"] == "done": pathlib.Path(name + "_turn.mp4").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/videos/" + j["id"] + ".mp4", headers=H), timeout=300).read()); return "ok"
    return "fail " + str(j.get("error"))
PLUSH = "everything made of soft plush and felt like a premium toy, stitched seams, fuzzy textures, rounded shapes, standing centered on a plain matte light-grey round pedestal, plain soft grey studio background, even soft studio lighting, full object visible with space around it, no text, no logos."
def obj(name, what): sid = still(name, what + ", " + PLUSH); return name, turn(name, sid)
with cf.ThreadPoolExecutor(2) as ex:
    for r in ex.map(lambda a: obj(*a), [("tree", "A single round leafy tree with a thick trunk and a big soft green felt canopy"), ("bush", "A single small round green felt bush with three little felt flowers on it")]): print(r, flush=True)
print("ground", still("ground", "A seamless top-down texture of soft green felt grass meadow with a few tiny felt flowers, evenly lit, flat, no shadows, no objects, no horizon, fills the whole frame edge to edge, no text."))
print("sky", still("sky", "A soft felt and cotton-wool sky: pale blue felt backdrop with fluffy white cotton clouds, evenly lit, flat, fills the whole frame, no horizon, no text."))
print("spent today", call("/godmode/api/status")["spent_today"])
