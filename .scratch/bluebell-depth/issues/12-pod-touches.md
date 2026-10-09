# 12 — Pod touches: light colours and a photo frame

**What to build:** Two small things in the pod. A pull-cord for the string lights: each pull changes them to the next colour (pink, gold, blue, green, rainbow), and the choice stays. A photo frame on the wall shows a little picture of the last friend she brought into the pod (an empty frame with a question mark until then); a flash and a click when it updates.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/podScene.js`, `src/ship/entities/pod.js`, `src/ship/art/pod.js`, `src/ship/world.js` (per-place state), `src/ship/save.js`, `src/ship/sfx.js`

**Status:** ready-for-agent

- [ ] Pull-cord cycles light colours; colour saved
- [ ] Photo frame shows the last friend brought in (with its hat); saved
- [ ] Frame is empty until a friend has visited
- [ ] Old saves load fine
- [ ] VISION.md updated
- [ ] `npm test` passes
