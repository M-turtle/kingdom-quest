import json, sys, time, urllib.request, pathlib, concurrent.futures as cf
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
def call(path, body=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET")
    with urllib.request.urlopen(req, timeout=180) as r: return json.loads(r.read())
STYLE = " Children's picture-book illustration brought to life, soft painted shading, warm glowing colours, premium animated-film quality, no text, no letters, no logos."
JOBS = {
 "hub": "Wide view of a magical storybook kingdom at golden hour: a castle on a green hill in the middle with a small carousel pavilion floating on a tiny island above it, a round stone tower, a snowy mountain, a little music hall with columns, a giant chessboard on the grass, a market stall, a pond, meadows, trees and a winding river. Gentle continuous ambient motion only: clouds drift slowly, the river sparkles, flags flutter, two birds cross the sky, the carousel turns slowly, lantern lights twinkle. Locked camera, nothing else moves." + STYLE,
 "tower": "Inside a cosy wizard's tower hall: a kind old wizard in a deep blue robe with golden stars stands beside a big wooden abacus with glowing beads, gently conjuring sparkling number-free glowing orbs that drift up from his hands; candles flicker on shelves of books, a tall arched window shows the kingdom and sky outside, a small owl blinks on a perch. The left third of the frame is an empty stone floor by the window. Gentle continuous motion, the wizard keeps conjuring and the owl blinks. Locked camera." + STYLE,
}
def one(k):
    r = call("/godmode/api/create", {"prompt": JOBS[k], "style": "free", "background": "free", "format": "16:9", "camera": "locked", "quality": "final"}); job = r["job"]; t0 = time.time()
    while True:
        time.sleep(15); j = call("/godmode/api/job/" + job["id"]); j = j.get("job", j)
        if j["status"] in ("done", "failed", "error") or time.time() - t0 > 560: break
    if j["status"] != "done": return k, j["status"], j.get("error")
    b = urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/videos/" + j["id"] + ".mp4", headers=H), timeout=300).read(); pathlib.Path(k + ".mp4").write_bytes(b)
    return k, "done", len(b)
with cf.ThreadPoolExecutor(2) as ex:
    for res in ex.map(one, JOBS): print(res, flush=True)
print("spent today", call("/godmode/api/status")["spent_today"])
