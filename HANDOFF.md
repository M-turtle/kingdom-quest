# Kingdom Quest — Handoff (2026-10-19)

For the next chat. Read this file, then `CLAUDE.md` (the Development Bible), then `DECISIONS.md` (every ruling Yoni gave, in his words, newest first). Nothing here overrides `DECISIONS.md`.

There are **two builds**:

| | A. The live game (what the kids play) | B. The filmed rebuild (in progress) |
|---|---|---|
| Branch | `main` | `style-test` |
| Version | **v181** (commit `aef7646`, chess v67) | The Atelier **v7** (commit `d406b54`) + style tests |
| Kids' URLs | https://m-turtle.github.io/kingdom-quest + artifact https://claude.ai/artifact/8xbRkEsZdi5cBVY4dhhcts | **never**: staging only |
| Where to look | Repo root, `shared/`, every world folder | https://m-turtle.github.io/kingdom-quest-staging/ (repo `M-turtle/kingdom-quest-staging`) |

The repo is `M-turtle/kingdom-quest`, cloned at `/Users/yonieyal/kingdom-quest`. The standalone Castle Chess is at `/Users/yonieyal/castle-chess`: the same chess build with three path lines different. Its `scene.js`, `postfx.js`, `arch.js` and `shared/` stay byte-identical. Artifact: https://claude.ai/artifact/G2gHF1CNuqbWC9Br44QgLj (favicon ♞, passed on every publish).

---

## 0. Rules that bite in this project

- **Children (Bible D1):** nothing new reaches the kids' URL (text, voice, images, mechanics, difficulty) until Yoni has reviewed it himself. All new work goes to staging first.
- **Voice:** ElevenLabs only, through the relay. Never the device `speechSynthesis` voice. The voice is soothing and slow, and long words are split on screen and in speech.
- **Kids' feedback rules:** see `DECISIONS.md` and the memory note "yoni-kids-app-feedback":
  - One item at a time, silent by default.
  - Gender-neutral Hebrew, no emoji icons.
  - No labels over the action; crisp text with no glow.
  - Never compare a kid with other kids.
  - FUN means something happens after every choice.
  - A "why X?" question is not an order to change X.
- **No Frame lines** at the top of replies in this project (Yoni, 2026-10-19).
- **Bible copy:** the repo's `CLAUDE.md` carries the older `Bible 2026-10-18 loaded.` copy. The master is now **r2**. Run the sync (`python3 ~/AETHER/principles/sync_dev_rules.py --repos --push --pr`). Never hand-edit the copy.
- **Images:** every image is WebP under 100 KB. Cost is stated before any paid generation.

---

## A. The live game (v181, branch `main`)

### What it is
- A 3D kingdom hub (`index.html` + `shared/kingdom3d.js`, three.js) with realms above and under (pirate, skull) and rides between them (`shared/ride3d.js`).
- **Worlds**, each in its own folder:
  - math, reading, spelling, chess
  - clock, market, memory, logic, story, scrolls
  - music, nature, timemachine, explore, kindness, letters (Letter Mountain)
- **Realm games:** `shared/realm-*.js`.
- **Games Arcade:** `shared/arcade.js`, nine painted cards: Doll Studio, Cannon Cove, Physics Lab and others.
- **Avatars and sign-up:** `shared/avatars.js`, `shared/mixes.js`.
- Hebrew is the default, and English is chosen per player at sign-up.
- **Sign-up:**
  - Every player gives an age at sign-up, and there are no age pickers anywhere else.
  - The difficulty ladder moves both ways: down after 2 hard rounds, back up after 2 strong ones.
  - Kid login is a name plus one secret picture. Parents keep the exact key.
  - The welcome film (Veo clip, `shared/intro.js`) plays after sign-up, login and switch. The in-engine flight was removed in v180.

### Latest versions
| Version | Change |
|---|---|
| v181 | The number pad reads 1 2 3 left to right in Hebrew too (`kq.css` v27) |
| v180 | Only the film plays; the in-engine welcome flight is gone |
| v179 | Arcade as nine painted cards; cloud saves carry songs, paintings, studio progress, eggs and mountain marks (relay cap 1.5 MB) |
| v178 | Welcome film |
| v176 | Painted animals and fruits |
| v175 | Hebrew default; one secret picture |
| v174 | Name + pictures login |
| v173 | Sign-up wizard and KINGDOM KEYS cloud saves |

### Back end
- **Supabase project `elnmuuymfmlwnsynzgrh`** (Kingdom Quest's own project; it was paused once and restored on 2026-10-17).
- **Edge function `kq-relay`** at `https://elnmuuymfmlwnsynzgrh.supabase.co/functions/v1/kq-relay`:
  - Voice: POST `{text, lang:'he', persona:'mommy'}` for Hebrew, or `{text, lang}` for English; returns `audio/mpeg`.
  - Saves: `/save` and `/load`.
  - Source is in `tts-worker/` and the scratchpad `relaydeploy`.
- **Family voices:**
  - Mommy: Word Garden, rocket, rest.
  - Daddy: Math, herald.
  - Hebrew vowels come from Dicta. Homographs are fixed with `SAY_HE` in voice_batch.

### Publishing (both targets, every time)
1. **Cache:** every changed asset gets a new `?v=N`, or Chrome serves the old one. Realm files use the hub constant `RV`; bump it by hand.
2. **GitHub Pages:** commit to `main` and push to `origin`. Pages serves `main`.
3. **Artifact `8xbRkEsZdi5cBVY4dhhcts`:**
   - It sits at the **511-file cap**, and the hub is about 64 MiB against a 64 MiB limit.
   - Publish only the changed files in the `files` map; unlisted files are kept. Never do a full replace: the chess herald voices once existed only in the artifact.
   - Because the repo is outside the working directory, rsync it into the scratchpad and publish with `root`.
   - `chess/classic.html` was dropped from the artifact to make room.
4. **Device gate:** no phones (a "no-phones" card); computers and iPads play. `#anydevice` and family devices pass.
5. **Verify:** check the deployed URL in a private window with the build number, before saying "done".

### Test hooks
- `__kq3d.step()`, `__room.step()`, `__ride.step()`.
- Hidden pane: set `document.hidden=false` and tick the hooks on intervals.
- Playwright: `/Users/yonieyal/TML-APP/mobile-tests/node_modules/playwright-core` with `channel:'chrome'`.
- Old test drivers are in `tools/filmed/*.js` (gate, cloud, intro, letters, pad and others).

### Open on the live game
- **Times Table Castle** prototype (artifact `HJWpXgSLPWvxMHjs4pWsnW`): waiting on Yoni, then it goes into the Math Tower.
- **Space mini-games:** judged too techy. The research and 9-concept page (`B6ESHEPpdkyLQvfFHiGc73`) waits on his pick; my recommendation is Snowman Test Drive + Gravity Hop.
- **Voice:** batches fail when the ElevenLabs credits hit 0.

---

## B. The filmed rebuild (branch `style-test`, staging)

### The direction Yoni set (2026-10-18/19, all in `DECISIONS.md`)
- **Art by age:** 3–6 felt/plush (paper/clay as backup); 7–9 voxel in our own block language, with no Minecraft cues; 10+ "nature-tech" (clean modern 3D, fresh greens, sandstone, cyan). Style boards: `HSrun5ERKbLvWiavBKpjDa`.
  - **For the Atelier, voxel was dropped:** felt for ages 3–6, nature-tech for 7+.
- **Filmed places:**
  - Each place is built from a God Mode scene loop (ambient only) plus stills and clips shot on green and keyed into sprites.
  - The camera flies along authored, filmed paths: fast (1.5–2×), interesting, never free.
  - The hub meadow must be **wide**.
  - Proof: Felt Pond `3hx7vkAJxxNTfN72YnLwAs`, which Yoni called "the highest level I've seen"; authored camera `T3nYtLbfVYUYPbZpqZVUHx`; wide meadow ride `4afetuyeMoRYu3FcAQEWjQ`.
- **Closed routes:**
  - The free camera and Gaussian splats: resolution, floaters.
  - The painted-film hub (`YYF2KSspvNx2xCjc35qP9S`): "a downgrade".
  - Per-world intro clips.
  - Hunyuan, Meshy, Tripo, Rodin and Trellis 3D: their textures never match the stills.
- **3D objects where needed:**
  1. Still, then a Veo turntable clip.
  2. All frames upscaled 2× (`ffmpeg scale=3840:-1`).
  3. Apple Object Capture with `custom` detail (`tools/filmed/ocap/tool/ocap.swift`, about 80 s per object).
  4. `usd2glb.py` (Blender) to GLB, then `depedestal.py`.
  5. Shown unlit (`&unlit=1`, `MeshBasicMaterial`) so the filmed texture keeps its light.
  - Nine test objects stand on staging: `?style=plush|voxel|nature&lift=0.5&scene=1&unlit=1` (`shared/models/style_*.js`).
  - Comparison page: `B12n5oE7PFuxV4FaBLmKiR`.
- **Games:**
  - No world is retired, but the shallow mechanics go. The inventory (`75iE7G34uRNfbBetVvdRCM`) found about 250 games that are only picking an answer, about 200 that are one drill card, and about 35 real mechanics.
  - The deep-game test is **The Atelier** (Hebrew **סדנת אומן**), pick A on `2Scox2kfJ3f26zTtvHq1A5`.

### The Atelier (`atelier/`, staging: https://m-turtle.github.io/kingdom-quest-staging/atelier/)
- **Files:**
  - `index.html` (loads `game.js?v=30`, `strings.js?v=9`).
  - `game.js`: `VERSION = 7`.
  - `strings.js`: Hebrew and English, every word the kid sees.
  - `assets/felt/` and `assets/nature/`:
    - The shop loop: `shop.mp4` and `shop.webp`.
    - The clients and their garment layers `g_<client>_<garment>.webp`, white, coloured at run time (Doll Studio colours × patterns).
    - The tools; the cloth `cl_disc`, `cl_strip`, `cl_sheet`; `beam`, `table`, `rulertex`, `tapetex`.
    - `meta.json`: body anchors, garment boxes, `_cloth`.
- **Purpose (Yoni):** understand the radius, measure circles, and "this times this equals that" (the way round ≈ 3.14 × the width; radius = width ÷ 2 = round ÷ 6.28), without boring repetition.
- **Loop for one client:**
  1. The client states a wish.
  2. The kid picks a fabric for each piece.
  3. The kid measures the body: the tape round the waist, or the ruler across it.
  4. Belt: the tape is laid straight, the kid reads it, the chalk goes at the end, snip.
  5. Circle skirt:
     - **Tiers 1–2:** fold the width to get the radius.
     - **Tier 3:** "3 rods and a bit", then the kid computes 3.14 × the width, or round ÷ 6.28.
     - The beam compass is pinned at the cloth's centre, the chalk is set at the radius, the kid swings a full circle, then the cut.
  6. The client puts the piece on, and the body judges the fit: too big, too small, or perfect.
  7. The client pays, and the piece goes to the wardrobe (localStorage).
- **Tiers by age:** 1 = ages ≤6, whole cm. 2 = ≤10, half cm. 3 = 11+, mm and π.
- **Clients (v7):**
  - Felt: `girl` (doll Noa), `teddy` (felt teddy), `princess` (doll Lily), `fox`.
  - Nature: girl, bear, princess, fox.
  - **No boy, no grandma, no hats** (Yoni, 2026-10-19). Their assets still sit in the folders, unused.
- **Notices:**
  - A bubble with a 🔊 speaker (ElevenLabs through the relay) sits in a **side lane**.
  - `placeDock()` and `workRects()` in `game.js` measure what is on screen (client, overlay tools, table pieces, number pad) and put the bubble in the widest free lane.
  - When the camera zooms in on the body, the body's waist-wide middle column counts as work.
  - The tailor-bear helper was removed.
- **Yoni's standing Atelier rules:**
  - The scene is still while the kid works.
  - Everything is child-sized.
  - Never give the answer.
  - Nothing appears on the client before the piece is made, and each stage has its own success.
  - Circles are drawn on the cloth with the compass.
  - The zoom shows the real ruler.
  - The cloth is at the scene's art level.
  - The compass is a straight beam.
  - No "Next" presses.
  - The zoom is calm and shallow ("car sickness").
  - Notices sit beside the work, never on it.
  - Felt first, nature-tech later.
- **Test driver:**
  - `node tools/filmed/atelier/bot7.js <age> <he|en> <outdir> [url]` plays one client and writes a screenshot of every step.
  - `bot7t.js` starts at the teddy; `bot7p.js` runs at phone size.
  - Local server: `python3 tools/filmed/meadow/rangeserver.py 4420` (from the repo root).
  - Hooks: `window.__geo`, `window.__answer`, `window.AT.S`.
- **Status:** v7 plays end to end on staging with no errors (felt teddy, age 5, Hebrew; checked at desktop and phone size).
- **Yoni's last reaction:** "You're making no sense whatsoever." **Ask him what did not make sense before building anything more.** It may be the game itself, or my last report.
- **Known flaws:**
  - A faint green tint low on the teddy's cream tummy, from the green-screen key.
  - The pay line says "משלם/ת" (gendered slash).
  - The teddy's happy clip (`tools/filmed/atelier/teddy/make.py`, output `bear.mp4` in the scratchpad) is not used.

### Art pipeline (scripts in `tools/filmed/`)
- **God Mode:** Yoni's own server, `https://web-production-61460.up.railway.app`.
  - The token lives in `~/AETHER/Keys/godmode-token.txt`. Never print it.
  - `/godmode/api/still` (prompt to still) and `/godmode/api/animate` (still to Veo clip).
  - About $0.07 per still and $0.96 per 8 s clip.
  - Examples: `atelier/teddy/make.py`, `atelier/make.py`.
- **Gemini direct:** `google-genai`, env `GEMINI_API_KEY`, model `gemini-3.1-flash-image`, about $0.04 per edit.
  - `atelier/dress/edit.py <look> <client> <garment...>` dresses a client on green in a WHITE garment.
  - Its filter sometimes blocks harmless wording (`PROHIBITED_CONTENT`); rephrase and retry.
- **Keying and layers:**
  - `atelier/assets/pack.py` holds `key_rgba`: a backdrop-adaptive chroma key with erode and despill.
  - `atelier/dress/layer.py` extracts the garment as shading plus alpha.
  - `atelier/dress/pack3.py` crops the client and its layers on one shared box and writes `meta.json` (edit its client list to pack one client).
  - `cloth.py` and `props.py` make the cloth, beam, table, ruler and tape art.
- **Blocked or not needed:**
  - The fal account is locked and not needed.
  - God Mode's Gemini credits ran out once (2026-10-18). If a still returns `RESOURCE_EXHAUSTED`, Yoni tops up at ai.studio.
- **Spend this stretch:** about $1.11 for the v7 teddy (still + clip $1.03, two edits about $0.08). Earlier Atelier rounds: about 30 garment edits plus the cloth renders.

### What is next (my read; confirm with Yoni first)
1. Find out what "makes no sense" in v7, and fix only that.
2. Felt Atelier polish: the green tint, the gender-neutral pay line, optionally one more felt animal (bunny, about $0.10).
3. Then nature-tech for ages 7+: voice, clients without boy or grandma, no hats.
4. Then the wardrobe in cloud saves (the relay `/save` already exists).
5. Bigger picture, waiting on Yoni: the wide filmed meadow hub, rigging and animating one host, and the remaining worlds rebuilt as deep games one by one.

---

## Links
- Decisions: `DECISIONS.md`.
- Yoni's Desk: https://claude.ai/artifact/5UrdmDPRUuj5BAxMfugPgF
- Memory notes (this Mac): `~/.claude/projects/-Users-yonieyal-castle-chess/memory/` (kingdom-quest-state, yoni-kids-app-feedback, voice-elevenlabs-only, no-frame-lines).
- Staging push: `git push staging style-test:main --force`. Then wait for Pages and check that `index.html` serves the new `?v=`.
