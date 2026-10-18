# Kingdom Quest — decisions log

Every "never / always / from now on" and every decision Yoni gives goes here the same turn, dated,
in his words (Development Bible A5). Re-read this file at session start and after every compaction.
Nothing is deleted: a reversed decision gets a new dated line that points at the old one.
Format: `- YYYY-MM-DD · topic · "his words" · what it means for the code`

## Standing decisions (seeded 2026-10-18 from the memory files and chat records)
- 2026-10-18 · Children · nothing new reaches the kids' URL (text, voice, images, mechanics, difficulty) until Yoni reviewed it himself.
- 2026-09-28 · Voice · "We should never, ever use ... the generic voice of the computer. Always use the 11 labs."
- 2026-09-17 · Hebrew · gender-neutral for age groups: "you translated squire into na'al, which is a boy in Hebrew, but you can't do that for age groups because it could be also a girl"
- 2026-09-20 · Hebrew register · "בעברית אל תשתמש בבן תמותה טיפש - טיפש זה קללה. foolish זה טיפשי. בוא נשנה ל אווילי"
- 2026-09-29 · "Don't compare it to other kids. We don't want competition between the parents."
- 2026-10-17 · Ages · "In all the games, remove everything has to do with ages. ... Every user needs to tell you his initial age."
- 2026-09-18 · "a positive re-enforcement that is grounded in actual academic research to build confidence and not dependency of dopamine" · "Don't use the generic folders of sounds from my Mac"
- 2026-10-07 · "I want them to use their head ... not in terms of taking a left or a right."
- 2026-10-12 · Lily's rule · "it has to start with eight times something ... Lily wants it that way"
- 2026-10-03 · Spend · "I don't want to do any extra payments. ... We're not buying extra credits. We're not increasing the cap."
- 2026-09-17 · Order · "I need you to solve one by one do not try to solve all of them combined start with the home page"

## Log (newest first)
- 2026-10-18 · 3D objects, how · "Why do you keep going to Blender and Meshy and Hunyuan ... We already confirmed that this will never look like it should ... That's why you created this and ran it through Veo. To get pictures from all around it. So we can establish the 3D objects ourselves." · NO third-party reconstruction engines (Meshy, Hunyuan, Tripo, Rodin, Trellis) and no re-painted textures. The pipeline is: baseline still → Veo turntable clip (locked camera, pedestal turns 360°) → all frames → Apple Object Capture on this Mac (free, local; tools/ocap) → GLB. The surface is the video's own pixels. Proven on the bear and the plush tower 2026-10-18; a photo-built texture keeps its own light in the engine (?lift=0.5 in the style test).
- 2026-10-18 · Judging the look · "this is a major gap between what you showed me and what's actually there" · a screenshot inside the engine is the only proof of a look; "placed first try" and frame rate are not results. Show the still beside the in-engine shot, same framing, before calling anything done.
- 2026-10-18 · Art, ages 10+ · "m for sure" · 10+ = M nature-tech (clean modern 3D, fresh greens, warm sandstone, cyan accents); the three looks are now set: A plush (3–6, D backup), G voxel with our own blocks (7–9), M nature-tech (10+).
- 2026-10-18 · Art, three looks by age · "So ages three to six, definitely A. And as a backup, we can have D. Ages seven to nine, definitely G. Just one concern about the cubes ... I don't want any issues with the IP. Confirm that that's not a problem. For ages 10 and above, no. For neon, too urban. We need it cool, but something more nature-oriented, some sort of adventure, but not that dark." · 3–6 = plush/felt (A), backup paper/clay (D); 7–9 = voxel (G) with our own blocks and figures, nothing that reads as Minecraft; 10+ = new round (K/L/M on the style board HSrun5ERKbLvWiavBKpjDa), pick pending.
- 2026-10-18 · Art by age · "Anything from three till six, that's definitely the way to go. Anything above that, seven, eight, nine, we'll need a different design ... Anything above nine is already teenager, and that should look like something totally different. So I need actually three designs." · the look switches by the age given at sign-up; three asset sets, not one reskinned.
- 2026-10-18 · 3D pipeline · "You have a perfect video high quality, and we can prompt it to make anything we want, including showing that elf from three hundred sixty degrees. With depth, why not take the pictures from that and create the models ourselves?" · objects are built still → turntable clip (or one four-view still) → multi-view reconstruction (fal Hunyuan3D); the saved still is the baseline, not the prompt. Bear test: 1nt2VLqRVbefKxGgRUureH.
- 2026-10-18 · Intro · "intro videos to worlds are just annoying" · no per-world intro clips; a world entrance is at most one second of the destination fading in.
- 2026-10-18 · Login · "remove the animation that we made and keep only the new video" · the in-engine welcome flight is gone (v180); the film plays after sign-up, login, switch, and on opening the kingdom.
- 2026-10-18 · Kingdom look · the painted-film hub (YYF2KSspvNx2xCjc35qP9S) was judged "a downgrade" against the living 3D map; the 3D engine stays, the art inside it is rebuilt.
- 2026-10-18 · Live agent · "I want an agent that lives inside this game ... self-improving, self-healing ... hard blocked for anything that could be malicious, rude, or non-constructive ... knows how to explain to parents their kid interests ... voice option only for parents" · sparked in the Frame (kq-live-agent); plan given in chat: telemetry + harness + nightly routine, tier gates, parents' weekly voice summary.
