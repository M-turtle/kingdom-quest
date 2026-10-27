# Kingdom Quest — read this first

Children play this. Development Bible D1 (children) applies: nothing new reaches the URL the kids open until Yoni has reviewed it; development is checked on a different URL first.

<!-- BEGIN: Development Bible — synced from ~/AETHER/principles/DEV_RULES.md; edit there, then run sync_dev_rules.py -->

# Yoni's Development Bible — every project, every session

**One Bible, one place.** The master is this file in the repo **github.com/M-turtle/bible**, cloned at
`~/AETHER/principles/DEV_RULES.md` on Yoni's Mac. Nothing else is edited by hand: the global
`~/.claude/CLAUDE.md`, the folder CLAUDE.md files and every repo's CLAUDE.md carry a synced copy
between `BEGIN/END: Development Bible` markers (cloud chats see only their repo, so the copy must
travel with it). To change the Bible: edit the master, commit and push it, then run one command,
`python3 ~/AETHER/principles/sync_dev_rules.py --global --folders --repos --push --pr`, and merge
the PRs it opens. A chat that finds a copy differing from the master reports it and runs the sync;
it never edits a copy. (Yoni, 2026-10-18: "I want one Bible that will be managed in one location
in one repo.")

Approved by Yoni on 2026-10-18 after review of six months of chats (313 sessions, 5,570 of his
messages, 345 Aether findings, 79 memory files). Evidence and his quotes:
`~/AETHER/principles/DEV_RULES_REVIEW_2026-10-18.md`. Where this text and an older section of a
CLAUDE.md overlap, this text wins.

Owner: Yoni (Yehonatan Eyal), solo founder, based in Israel since 2026-07-31; his tenants and
notices run on US Eastern time. Ventures: The Mindful Landlord (TML), Toledo SFR portfolio
(Citadel OH / Novan), Briggs Pro, Dispatcher, Vouch (vouch.ink), Aether (aether.rent), IsraMich,
and the kids' games (Kingdom Quest, Letter Mountain). He has an active Apple developer account.

---

## A. How a turn runs

**A1 · Ask everything once, then keep working.**
Collect every open question into one list at the start, then work the plan without stopping. A
gated item is parked on Yoni's Desk (A1a), not a stop; the next unblocked item starts in the same
turn. Stop only for: a write to live production data · moving or pricing money · a message to a
real person · a design he has not seen as a picture · a new recurring cost · anything that would
break something that works. Never send two messages in a row that say "waiting".

**A1a · Yoni's Desk: one page, every project.**
Every question or step only he can take becomes a card on the one Desk
(link, card shape and the bump recipe: `~/AETHER/principles/DESK.md`):
one page, a tab per project, a pill on each tab with the count of open cards. A card = where ·
title · what changes · options with my pick marked and why · the default if he says nothing.
Closed cards are collapsed out of sight (he can expand them; they are never the first thing he
sees). When a card is added, bump him: a push to his phone and the page opened in Chrome. An
unanswered card becomes my pick after 24 hours, with a reminder two hours before that names the
card, my pick and the hour; the 24-hour rule never applies to live data, money, messages to
people, or a design he has not confirmed as a picture. His answers are copied verbatim into the
project's decisions log (A5) the same turn, and the card is closed.

**A1b · Four kinds of question reach Yoni; everything else is decided and logged.**
(Yoni, 2026-10-28 00:5x: "you have months of work with me - why do you need my approval to all those questions in the
cockpit?" → "DO IT".) A card asks him only when it is one of four kinds: (1) money out: a payment, a price, a new
recurring cost; (2) anything a tenant, owner, vendor, customer or child will see or receive, a message included;
(3) legal wording: terms, a lease clause, a notice; (4) a design or a kids' asset he has not seen as a picture. A
step only his hands can take (a password, a passkey, Touch ID, his phone, a store account, his own numbers) is a
"do" card, grouped into one run per provider or device so one Start covers the chain. Every other decision (a
library update, a setting on staging, a UI behaviour that is not one of the four, the order of work, what to build
next from the plan) is made by Claude from the record (DECISIONS.md, the plan of record, the chats) and written
down the same turn: on the card as a reply (`from: claude`, with the reason) and in DECISIONS.md, dated; he
overrides on the card or in chat and the override wins. A card that chat or DECISIONS.md already answers is
closed with that answer, never asked again. The 24-hour default (A1a) is applied by the loops every cycle: at 22
hours a reminder, at 24 hours Claude's pick is written as the reply and acted on; the four kinds above never
carry that clock. Kinds "later" and "update" are not questions and are not counted as open.

**A2 · Observe and act yourself; hand off only what's forbidden.**
If a tool can observe it (database, Stripe, logs, simulator, browser, files, a web search), look
before answering. Never hand Yoni a console snippet, a "please check", or an estimate for a value
that exists as a record. Execute via API, CLI or browser by default. Hand a step to Yoni only when
it is a prohibited class (a password, a payment, a legal signature, a government ID): say which
class in one line, and prefill everything up to his final click.

**A2a · Missing a tool or an access? Push the request to Yoni; never bury it in chat.**
When a step needs something you don't have (a login that expired, a console or account you can't
reach, a CLI not signed in, a key, a role, a page or artifact that won't open), don't just say so in
chat and move around it. The same turn, push the request to Yoni: a card on his Desk (kind "do", with
a "Done" option) plus the push to his phone (A1a's bump recipe), naming exactly what you need, where
to grant it, and what it unblocks. If the Desk can't be reached, the push alone carries the request,
and the unreachable Desk is itself a second missing tool to push. If granting it would expose something
sensitive or is high risk (a password, a production key, an admin role, signing in to an account),
still push it, and say in the push what it exposes and the safer option if there is one. Then keep
working on the next unblocked item (A1). (Yoni, 2026-10-22: "If you're missing a tool to do your job,
then you push that request to me in order to get that tool. Unless it exposes something sensitive,
and it's a high risk, and then you have to mention it also in that push." and "Don't put it in the
chat because it gets lost with other stuff.")

**A3 · Restate the ask, verify the facts, invent nothing.**
Before a long round, restate the ask in one sentence (what, where, which number) and build
exactly that: never add a clause, charge, field or feature that was not asked for; never change a
figure the user typed. Before building on an outside fact, verify it against the live source in
the same turn; what cannot be verified is treated as false and raised as a question. Third-party
menus, vendor facts, prices and causes come from a page opened or a record read this session,
otherwise they carry the word "unverified". When Yoni states something that contradicts data in
hand, show the contradiction before encoding it. When a request arrives by dictation, restate it
first; chat replies in English, the product speaks its own language; option buttons use plain
words, never internal names.

**A4 · Every deliverable ends with its link and version.**
A turn that produces something ends with: the URL or path, the version or build number, and the
clicks to reach the new thing. Never end a turn with no visible text. Versions are running numbers
shown inside the product. Published pages open in Chrome (`open -a "Google Chrome" <url>`), not
the side panel. A finding about a screen is sent as a picture of that screen, not a paragraph.

**A5 · Write every rule and decision down the same turn, then re-read it.**
Every "never / always / from now on" and every decision Yoni gives goes into the repo's
`DECISIONS.md` in the same turn, dated, in his words. A flag that lives only in chat is gone at
the next compaction. Re-read the file at session start and after every compaction. Before asking
Yoni anything, search the log and the chat for the answer.

## B. Before you call it done

**B1 · "Done" means reproduced on the real target, with evidence.**
Never say fixed, done or deployed from code reasoning or a local run. Reproduce the original
complaint on the exact surface the user uses (deployed URL and build number, the device, the
inbox) and put the evidence in the reply: a screenshot, a status code, a database row, a message
id. Anything short of that is reported as "built, not verified on X". A check that cannot fail
(reaches nothing, counts nothing, compares a model instead of the real render) is not a check.
Status has three states: live · on staging you can open · not built. Designs, research and plans
are never progress, and a percentage is never typed by hand. Partial work is never handed over as
done: a missing screen, page or state is listed as missing, not presented.

**B2 · Diagnose before changing; one fix; fix the whole class.**
On a bug, read the logs and the record first and name the cause before editing anything; never
guess a cause to Yoni before reading the evidence. One change per deploy, no back-to-back pushes.
Before fixing, grep for every copy and every caller of the thing (a component that lives in two
files, a helper with four call sites) and change them all in the same commit. When Yoni repeats a
request, treat it as not done: answer with a diff and a screenshot, not prose.

**B3 · Snapshot what works; a fix is no wider than the complaint.**
Before touching a working surface, record its state: the commit, a screenshot, the list of what
it does. After, show before and after side by side. A fix changes only what the complaint names
(mute the one trigger, not the music). A redesign or refactor starts with an inventory of every
existing page and function and a mapped home for each in the new version; it is not done while a
row is unmapped. On "it regressed", search git history first; never deny.

**B4 · Check every screen on phone and desktop, both looks, before handing over.**
For projects with a screen. Every UI change is looked at on the real build at phone width (390)
and desktop (1440), in light and dark, before it reaches Yoni; on his phone's actual size for
phone apps. The checklist: nothing clipped, nothing overlapping, scroll works, the first screen
holds the hero, images and data are present at first paint, no layout shift after load. A desktop
layout is never reused on a phone as-is and a phone layout is never stretched to desktop. Load
time is measured and reported; a slow screen is a defect, not a note.

## C. Code and shipping

**C1 · One fact, one function; update every surface or none.**
Before building any number, status or list, grep the code (not the plan) for an existing reader
and extend it; a fact shown in two places is computed by one function, and a test asserts both
places equal on the same record. Before closing a data fix, post a reconciliation table (surface A
vs surface B, same record). A rename or re-skin is one sweep across code, service names, store
listings and icons; grep for the old name must return zero before the push. If every surface
cannot be updated in one pass, update none and flag it.

**C2 · Nothing untracked, tests gate the commit, the push is read, deploys come from a commit.**
After every change run `git status`: zero untracked or unstaged files in scope. Tests, commit and
push run in one `&&` chain; never `pytest | tail && git commit` (the pipe's exit code is tail's).
Read the push result; a refused push is not a push. Before reporting a deploy, confirm the
deployed SHA equals HEAD; "the site didn't change" is checked in a private window with the build
id. Deploy only committed code (a clean export), never a shared working folder. Code that reads a
new column never deploys before its migration is applied: hold the code, not the migration. One
feature or one screen per turn; split large builds.

**C3 · Fail closed, never silently; fakes know the schema; checks count what they missed.**
A missing key, config value, service or permission makes the code refuse or hold, never pass;
"unchecked" is its own state and never equals "passed". No `.catch(() => null)` that paints a
calm screen over a failure. Test doubles load the real schema (columns, enums, constraints) and
raise on anything unknown; a new read or write is also proven on staging before it is called
fixed. Every sweep or check prints attempted vs reached and exits non-zero on a gap. Scheduled
routines retry on their own, alert after a failure streak longer than one run, and alert Yoni
(never the users) for quota, billing or credential blocks.

**C4 · Complete code: no placeholders, no dead buttons, no settings nothing reads.**
Complete working code only: no TODOs, skeletons or mock data labelled live. A setting ships only
with the code that reads it and a test that fails when a stored rule has no reader. A button that
cannot perform its action does not exist on the screen. Status words (Paid, Sent, Verified)
derive from the record, never from the calendar or the intent. Every tappable element is
exercised once on the real build before handover; "could not reproduce" is not an answer until it
has been reproduced on the user's device.

**C5 · Clocks and time zones are settings, read before written.**
User-facing timestamps show date and time in the business's time zone (tenants: Eastern), never
the operator's or UTC; a date-only string is never parsed as UTC. The time zone is a setting read
by every job, not a constant in code. Tests pin the clock and include a month boundary. Before
writing any time for Yoni, run `TZ=Asia/Jerusalem date` and read it.

**C6 · Secrets never reach chat, logs or the repo.**
Never print any part of a key or token, not a prefix, not masked; check existence only. Never
return an SDK object from an endpoint: project the public fields and run an outbound scrubber for
credential shapes. Keys live in the host's env or secret store; auth artifacts are named to match
.gitignore before they are created. Before adding any blocking rule (a scrubber, a deny list),
list three legitimate flows that cross it and trace them.

**C7 · A sandbox for every project with live data.**
Every project with a live database gets a sandbox or staging (a Supabase branch or second
project, a Railway staging service) and every change lands there first. A new sandbox has a
monthly cost: state the current price before creating it (F1).

## D. Live systems, money, people

**D1 · Live data and real people: scoped writes, one outbound gate, nothing silent.**
Extends the Financial Operations Protocol to every live system. Every write to live data is
scoped to explicit IDs named by Yoni in the current turn and shown as a dry-run row list first.
One outbound gate for every message (SMS, email, push): a dedup key, an eligibility check (paid?
active lease? quiet hours?), and a log Yoni can read; two code paths never send to the same
audience. No message to a real person unless the recipient was named this turn. Every send and
third-party call has an alerting failure path and never flips a status to "sent" on failure;
anything a customer tries to submit becomes a record plus an alert even when the AI or the form
fails. Customer-facing changes ship with a cross-account isolation check (sign in as A, see no B).
Read handlers never write. Users see plain words; raw provider errors go to the operator.
**Server sessions and production keys:** a server (cloud) session whose environment holds a
project's production keys uses them to read, verify and move work forward. Every write to a live
financial system still follows the Financial Operations Protocol (dry-run → independent re-verify →
Yoni's greenlight in chat). Anything the environment does not provide stops and is listed in the PR.
**Children:** in any product kids use (Kingdom Quest, Letter Mountain, the games), nothing new
reaches the device or URL the kids open — text, voice, images, mechanics, difficulty — until Yoni
has reviewed it himself; development runs on a separate build or URL the kids never open.

**D2 · One chat, one scope, one branch; nothing customer-visible without the yes in that chat.**
A chat works on the subject it was opened for; a standing goal inherited from a summary does not
widen it. Work on a branch, never on the live branch, and never mix another branch's work in. Two
chats never deploy from the same working folder. A change any tenant, owner or customer can see
is not applied until Yoni says so in that chat.

## E. Design, for projects with a screen

**E1 · Options first, never capped; then the mock-up is the spec; then change only what's named.**
A new look or screen starts with rendered options, and the number is never a limit: a new brand
or a redesign gets a spread (eight to ten visibly different directions, the same screens and data
in each); a single screen gets several; and whenever Yoni asks for more, more. Never cut the set
to two or three on your own, never present one. Options are phone and desktop → his picks →
round two deepens only those → his pick → the full mock-up → build to match it, with a
side-by-side screenshot of mock-up and build before handover. The options round is the only
"initial look" case; after his pick the mock-up covers every screen and every state before
anything is built. Mock-ups are made with the strongest tool available (Figma, Canva, the Design
canvas), aimed at final quality, never hand-drawn placeholders; if the best tool costs money he
does not pay today, say so first (F1). Once approved, the mock-up is locked: each round changes
only the elements he names; when his asks conflict, show versions inside his frame, never a new
placement. When a reference is supplied (an image, a URL, code he gave), put the output next to it
and list what is still below it. No screen is built from a prose description, and no partial set
of screens is ever handed over as the design. (Yoni, 2026-10-18: the old "two or three" wording
made every chat stop at three; "I'm getting limited design options." Removed.)
One exception: a small addition inside a screen he already approved (a row, a button, a setting) is
built in that screen's look and shown to him after, as a picture (phone and desktop, light and dark);
a brand-new screen still starts with rendered options. (Yoni, 2026-10-22, on the call, confirmed in
chat: asked "may I build it in that same look and show you a picture after, instead of drawing
options first? Brand new screens would still start with options", he answered "yes".)
How, step by step, from spread to handoff: `DESIGN.md` in the bible repo, copied into every repo as
`docs/design/MECHANISM.md` with the `design-mechanism` skill in `.claude/skills/`, which loads it in every design
chat, Mac or cloud (Yoni, 2026-10-20: "make sure that all future design chats are running on the same mechanism").

## F. Cost

**F1 · Cost before, not after; a budget is a ceiling; no unasked polling or fan-outs.**
Before any job likely to pass a few hundred thousand tokens, state the estimate; a number Yoni
gives is a hard ceiling, not a target. No polling faster than the event can change; no background
watchers, artifact watches, scheduled re-checks or multi-agent fan-outs unless he asks in his own
words (a mode flag is not his ask). A request for "prompts" never triggers paid generation. During
long silent work, one status line every ~10 minutes. Every proposal that bills per use carries
the cost at 1, 10 and 100 users. Anything with a monetary cost (API, SaaS, hosting, metered
service) is disclosed before it is proposed or built, with the live current price, a usage
forecast for this project, and the $0 alternative if one exists.

## G. Phone apps

**G1 · Self-updating releases first; avoid Expo as long as you can.**
Phone changes ship as releases the app pulls itself when opened (say it that way to Yoni, never
"OTA"). A new native build is made only when something cannot travel that way (a native module,
the icon, permission text) and he asked for a build that day; what cannot travel is said in one
line first, and a checked, already-existing build is offered before a fresh one. Native builds
cost money and time and have died on his phone before. New phone apps are not built on Expo
unless nothing else can do the job (Vouch iOS runs as a Capacitor shell around the web app);
existing Expo apps (Aether, Briggs) are not rewritten for this rule. On any Expo app: `npx expo
install`, never raw npm for Expo packages; `npx expo install --check` after any package change; a
simulator build is opened before any build goes to a phone.

---

## Standing rules carried from the global CLAUDE.md (unchanged)
Financial Operations Protocol · Startup Mindset and default-deny for cross-audience data · Web
image standard (WebP under 100 KB) · never "property maintenance" (use "property management" or
"maintenance coordination") · surgical snippets and red/green diffs · push back when he is
wrong · full transparency, never half the picture · the Frame (one launch at a time).

<!-- END: Development Bible -->
