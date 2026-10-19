import json, time, pathlib, urllib.request, concurrent.futures as cf
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(p, body=None):
    req = urllib.request.Request(BASE + p, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET"); return json.loads(urllib.request.urlopen(req, timeout=240).read())
def still(name, subject, fmt="16:9"):
    r = call("/godmode/api/still", {"subject": subject, "style": "free", "background": "free", "format": fmt, "count": 1}); sid = r["stills"][0].get("id") or r["stills"][0].get("still_id")
    pathlib.Path(name + ".png").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=120).read()); return sid
def clip(name, sid, motion):
    r = call("/godmode/api/animate", {"still_id": sid, "motion": motion, "camera": "locked", "quality": "final"}); job = r["job"]; t0 = time.time()
    while True:
        time.sleep(15); j = call("/godmode/api/job/" + job["id"]); j = j.get("job", j)
        if j["status"] in ("done", "failed", "error") or time.time() - t0 > 600: break
    if j["status"] == "done": pathlib.Path(name + ".mp4").write_bytes(urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/videos/" + j["id"] + ".mp4", headers=H), timeout=300).read()); return "ok"
    return "fail " + str(j.get("error"))
PLUSH = "everything made of soft plush and felt like premium toys, stitched seams, fuzzy textures, rounded shapes, premium 3D animated-film render"
GREEN = ", alone on a completely flat, uniform, pure bright green screen background (#00FF00), nothing else in the frame, no shadow on the background, even soft studio lighting, no text, no logos"
JOBS = {
 "scene": ("A cosy felt pond glade seen from a low, gentle angle: a round pond of blue felt water with felt lily pads and two pink felt lilies, felt reeds on the right, a mossy felt bank in front, three round felt trees behind, a felt sky with cotton-wool clouds, " + PLUSH + ", wide shot, warm daylight, the pond centre-left and open felt bank in the lower right for things to stand on, no text, no logos.",
           "Gentle continuous ambient motion only: the felt water shimmers softly, the reeds sway a little, the cotton clouds drift very slowly, a tiny felt dragonfly flutters across the pond once. Nothing else moves. Locked camera.", "16:9"),
 "frog": ("A single cute felt frog, green with big round eyes and pink cheeks, sitting facing the camera, " + PLUSH + GREEN, "The frog does one big happy hop straight up, lands back on the same spot with a little squash, then sits still and blinks. Locked camera, the green background stays perfectly flat and uniform.", "1:1"),
 "fish": ("A single cute orange felt fish with big eyes, facing right, " + PLUSH + GREEN, "The fish leaps up in an arc, flips once in the air with a wiggle, and comes back down to where it started, then holds still. Locked camera, the green background stays perfectly flat and uniform.", "1:1"),
 "bee": ("A single cute round felt bumblebee with little felt wings, facing right, " + PLUSH + GREEN, "The bee hovers in place, bobbing gently up and down, wings fluttering, then does a small happy loop and returns to hovering. Locked camera, the green background stays perfectly flat and uniform.", "1:1"),
}
def one(k):
    subj, mot, fmt = JOBS[k]; sid = still(k, subj, fmt); return k, clip(k, sid, mot)
with cf.ThreadPoolExecutor(2) as ex:
    for r in ex.map(one, JOBS): print(r, flush=True)
for name, what in [("flower_red", "a single red felt flower with a yellow centre and a short felt stem with one leaf"), ("flower_blue", "a single blue felt flower with a white centre and a short felt stem with one leaf"), ("flower_yellow", "a single yellow felt flower with an orange centre and a short felt stem with one leaf"), ("basket", "a small round woven felt basket, empty, seen from slightly above")]:
    print(name, still(name, what.capitalize() + ", " + PLUSH + GREEN, "1:1"), flush=True)
print("spent today", call("/godmode/api/status")["spent_today"])
