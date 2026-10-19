import json, pathlib, urllib.request, concurrent.futures as cf
BASE = "https://web-production-61460.up.railway.app"; TOK = pathlib.Path.home().joinpath("AETHER/Keys/godmode-token.txt").read_text().strip()
H = {"authorization": "Bearer " + TOK, "content-type": "application/json"}
STYLE = (" Children's picture-book illustration, soft painted shading, warm glowing colours, cute and inviting, one clear focal scene, "
         "wide shot with room around the subject, no text, no letters, no logos, no watermark, no frame.")
GAMES = {
 "studio": "A cheerful doll-maker's studio: a smiling rag doll on a wooden table beside a big yellow ruler, scissors, colourful fabric rolls and a dress form, sunlight from a window.",
 "cannon": "A pirate cove at golden hour: a small bronze cannon on a wooden cart aimed from a sandy cliff at a little pirate ship with a skull flag on the sea, a treasure chest nearby.",
 "bridge": "A rickety wooden plank bridge being built across a mountain gorge, a little wooden cart with a pony waiting at the edge, numbered planks stacked, clouds below.",
 "kick": "A sunny football pitch: a child's football on the penalty spot facing a big goal with a friendly goalkeeper crouching, a semicircle drawn on the grass like a protractor.",
 "robot": "A friendly little diving robot with round eyes and a glass dome swimming on a sunny seabed among coral, collecting glowing pearls into a basket, bubbles rising.",
 "spell": "A wizard duel in a cosy crystal crypt: a young wizard with a glowing wand facing a goofy harmless purple monster, sparkles and floating letter-free magic stars in the air.",
 "bakery": "A magical potion bakery: a counter with cupcakes, measuring cups and jugs of pink and blue potion, a cheerful baker in a hat, shelves of jars, cosy warm light.",
 "detective": "A cobbled town square at dusk with lanterns: a big brass magnifying glass, a notebook, footprints on the cobbles and a curious cat near a fountain, a mystery feeling.",
 "physics": "A bright inventor's physics lab: a wise owl in round glasses beside a ramp with a rolling ball, a catapult, a pendulum and a bouncing spring, chalkboard with simple shapes.",
}
def one(k):
    body = {"subject": GAMES[k] + STYLE, "style": "free", "background": "free", "format": "16:9", "count": 1}
    req = urllib.request.Request(BASE + "/godmode/api/still", data=json.dumps(body).encode(), headers=H, method="POST")
    r = json.loads(urllib.request.urlopen(req, timeout=180).read()); st = r["stills"][0]
    sid = st.get("id") or st.get("still_id"); 
    b = urllib.request.urlopen(urllib.request.Request(BASE + "/godmode/files/stills/" + sid + ".png", headers=H), timeout=180).read()
    pathlib.Path(k + ".png").write_bytes(b); return k, len(b), r.get("spent_today")
with cf.ThreadPoolExecutor(5) as ex:
    for k, n, sp in ex.map(one, GAMES): print(k, n, "spent today", sp)
