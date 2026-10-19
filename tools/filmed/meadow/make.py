import json, time, pathlib, urllib.request, sys
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(p, body=None):
    req = urllib.request.Request(BASE + p, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET"); return json.loads(urllib.request.urlopen(req, timeout=240).read())
def still(name, subject, fmt="16:9"):
    r = call("/godmode/api/still", {"subject": subject, "style": "free", "background": "free", "format": fmt, "count": 1}); sid = r["stills"][0].get("id") or r["stills"][0].get("still_id")
    pathlib.Path(name + ".png").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=120).read()); return sid
def clip(name, sid, motion, camera):
    r = call("/godmode/api/animate", {"still_id": sid, "motion": motion, "camera": camera, "quality": "final"}); job = r["job"]; t0 = time.time()
    while True:
        time.sleep(15); j = call("/godmode/api/job/" + job["id"]); j = j.get("job", j)
        if j["status"] in ("done", "failed", "error") or time.time() - t0 > 700: break
    if j["status"] == "done": pathlib.Path(name + ".mp4").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/videos/" + j["id"] + ".mp4", headers=H), timeout=300).read()); return "ok"
    return "fail " + str(j.get("error"))
PLUSH = "everything made of soft plush and felt like premium toys, stitched seams, fuzzy textures, rounded shapes, premium 3D animated-film render, warm daylight, no text, no logos"
SCENE = ("The home meadow of a children's learning kingdom, a round felt meadow in a wide shot from a low gentle angle: in the centre a small felt clearing with a signpost; around it, spaced apart, a tall blue-roofed felt tower (maths), a felt garden gate with big felt letters on it (words), a felt music pavilion with a drum roof, a felt art house with a paintbrush chimney, a felt pond with reeds (nature), and a felt rocket on a launch pad (space); felt trees and bushes between them, a felt river with a little bridge, felt mountains and cotton-wool clouds behind, " + PLUSH)
sid = still("meadow", SCENE); print("still", sid, flush=True)
jobs = {
 "orbit": ("Nothing in the scene moves except the cotton clouds drifting very slowly and the river shimmering. The camera flies a slow, smooth, complete 360-degree circle around the whole meadow at a constant height and distance, keeping the signpost at the centre of the frame the entire time, ending exactly where it started.", "prompt"),
 "fly": ("Nothing in the scene moves except the cotton clouds drifting very slowly and the river shimmering. The camera glides forward low over the meadow like a slow drone, from the front edge over the bridge, past the signpost in the clearing, and on toward the blue-roofed tower, smooth constant speed, no shake.", "prompt"),
 "orbit_high": ("Nothing in the scene moves except the cotton clouds drifting very slowly. The camera flies a slow, smooth, complete 360-degree circle around the whole meadow from a higher angle looking down at about 40 degrees, keeping the signpost at the centre of the frame the entire time, ending exactly where it started.", "prompt"),
}
import concurrent.futures as cf
with cf.ThreadPoolExecutor(3) as ex:
    for r in ex.map(lambda k: (k, clip(k, sid, *jobs[k])), jobs): print(r, flush=True)
print("spent today", call("/godmode/api/status")["spent_today"])
