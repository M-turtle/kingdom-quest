import json, sys, time, urllib.request, pathlib
BASE = "https://web-production-61460.up.railway.app"
TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(path, body=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET")
    with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read())
quality = sys.argv[1]; out = sys.argv[2]
prompt = ("Wide aerial view of a magical storybook kingdom at golden hour: a small castle on a green hill, a round stone tower, a snowy mountain, "
          "a little music hall with columns, a giant chessboard on the grass, meadows, trees and a winding river. Above the kingdom, dozens of playful "
          "objects float and swirl slowly through the air like gentle confetti: big colourful alphabet letter blocks and number blocks, cute cartoon animals "
          "(a fox, an owl, a bunny), fruit (an apple, a strawberry, grapes), tiny planets with rings, a little rocket and bright music notes. "
          "Throughout the shot every object keeps moving: they spiral slowly downward through the air, drifting lower and lower, and one by one they glide down and come to rest on the rooftops of the little buildings, so that by the end of the shot the sky is almost empty and the buildings are decorated with them. Children's picture-book illustration style, warm "
          "soft colours, gentle glow and sparkles, dreamy and calm. The camera slowly pushes in from the wide view.")
st = call("/godmode/api/status"); print("spent today before:", st["spent_today"], "cap:", st["cap"])
r = call("/godmode/api/create", {"prompt": prompt, "style": "free", "background": "free", "format": "16:9", "camera": "prompt", "quality": quality})
job = r["job"]; print("job", job["id"], job["status"], "usd", job.get("usd"), "warnings", job.get("warnings"))
t0 = time.time()
while True:
    time.sleep(15); j = call("/godmode/api/job/" + job["id"]); 
    if j.get("job"): j = j["job"]
    print(int(time.time() - t0), "s", j["status"], flush=True)
    if j["status"] in ("done", "failed", "error"): break
    if time.time() - t0 > 560: print("TIMEOUT, still", j["status"]); break
print(json.dumps({k: v for k, v in j.items() if k not in ("prompt",)}, ensure_ascii=False)[:1200])
if j["status"] == "done":
    url = "/godmode/files/videos/" + j["id"] + ".mp4"
    print("clip url:", url)
    if url:
        req = urllib.request.Request(BASE + url if url.startswith("/") else url, headers={"authorization": "Bearer " + TOK})
        with urllib.request.urlopen(req, timeout=300) as rr: pathlib.Path(out).write_bytes(rr.read())
        print("saved", out, pathlib.Path(out).stat().st_size)
