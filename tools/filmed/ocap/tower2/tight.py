import json, time, pathlib, urllib.request
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(p, body=None):
    req = urllib.request.Request(BASE + p, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET"); return json.loads(urllib.request.urlopen(req, timeout=240).read())
subject = ("Close-up product shot: a single round stone wizard's tower with a blue cone roof, a wooden door and warmly glowing windows, everything made of soft plush and felt like a premium toy, stitched seams, fuzzy textures, rounded shapes, "
           "standing upright on a plain matte light-grey round pedestal, the tower filling the frame from top to bottom with only a little space above and below, plain soft grey studio background, even soft studio lighting, sharp focus, no text, no logos.")
r = call("/godmode/api/still", {"subject": subject, "style": "free", "background": "free", "format": "9:16", "count": 1}); sid = r["stills"][0].get("id") or r["stills"][0].get("still_id")
pathlib.Path("still.png").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=120).read()); print("still", sid)
motion = ("The round pedestal is a turntable: it turns slowly and steadily through one complete 360-degree rotation over the whole clip, carrying the tower with it. The tower itself stays perfectly still and rigid, nothing on it moves or changes. Lighting, background and framing stay exactly the same the whole time, sharp focus throughout.")
r = call("/godmode/api/animate", {"still_id": sid, "motion": motion, "camera": "locked", "quality": "final"}); job = r["job"]; t0 = time.time(); print("job", job["id"], job.get("usd"))
while True:
    time.sleep(15); j = call("/godmode/api/job/" + job["id"]); j = j.get("job", j)
    if j["status"] in ("done", "failed", "error") or time.time() - t0 > 600: break
print(j["status"], j.get("error"))
if j["status"] == "done": pathlib.Path("turn.mp4").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/videos/" + j["id"] + ".mp4", headers=H), timeout=300).read()); print("saved")
print("spent today", call("/godmode/api/status")["spent_today"])
