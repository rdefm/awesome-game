# 11 — A tune for every place

**What to build:** Every planet and every place inside one has its own tune matching its mood (twinkly Bluebell, warm rumbly Ember, chimey Frosty, bouncy Candy, twangy Stripey, cosy indoors). Tunes crossfade at scene changes; the landing cutscene and blast-off get a little sting.

**Blocked by:** 10 — Music, plus a mute button

**Relevant files:** `src/engine/audio.js`, `src/ship/sfx.js` (or a new tunes file), `src/ship/planetScenes.js`, `src/ship/landingCutscene.js`, `src/ship/playScene.js` (`leaveTo`), `VISION.md`

**Status:** ready-for-agent

- [ ] A tune per planet and per indoor place
- [ ] Crossfade on scene changes; never two tunes at once
- [ ] Landing and blast-off stings
- [ ] Respects the mute setting
- [ ] VISION.md updated
- [ ] `npm test` passes
