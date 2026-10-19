import json, time, pathlib, urllib.request
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(p, body=None):
    for a in range(4):
        try:
            req = urllib.request.Request(BASE + p, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET"); return json.loads(urllib.request.urlopen(req, timeout=240).read())
        except Exception as e: print("retry", e, flush=True); time.sleep(20)
subj = ("A cute felt teddy bear, honey-brown felt with stitched seams, a cream felt tummy patch and muzzle, big friendly shiny eyes, wearing no clothes and nothing else, standing straight facing the camera with both arms held a little out to the sides, feet together, full body head to toe, "
        "everything made of soft plush and felt like premium toys, premium 3D animated-film render, alone, centred, on a completely flat uniform pure bright green screen background (#00FF00), nothing else in the frame, no shadow on the background, even soft studio lighting, no text")
r = call("/godmode/api/still", {"subject": subj, "style": "free", "background": "free", "format": "9:16", "count": 1}); sid = r["stills"][0].get("id") or r["stills"][0].get("still_id")
pathlib.Path("bear.png").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=120).read()); print("still", sid, flush=True)
r = call("/godmode/api/animate", {"still_id": sid, "motion": "The teddy bear is delighted: it bounces happily on the spot, waves one paw at the viewer, gives a little hug to itself, then returns to standing exactly as at the start with both arms a little out to the sides. Feet stay in place. Locked camera, the green background stays perfectly flat and uniform.", "camera": "locked", "quality": "final"}); job = r["job"]; t0 = time.time()
while True:
    time.sleep(15); j = call("/godmode/api/job/" + job["id"]); j = j.get("job", j)
    if j["status"] in ("done", "failed", "error") or time.time() - t0 > 700: break
print(j["status"], j.get("error"))
if j["status"] == "done": pathlib.Path("bear.mp4").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/videos/" + j["id"] + ".mp4", headers=H), timeout=300).read()); print("saved")
print("spent today", call("/godmode/api/status")["spent_today"])
