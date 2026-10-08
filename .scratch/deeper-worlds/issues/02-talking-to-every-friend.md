# 02 — Talking to every friend

**What to build:** Every friend can be chatted with the same way as the pink alien: puffball, fire newt, mum and baby yeti, gummy bear, Ginger, Zig and the lava family (dad, mum, baby). Each has its own personality in how it talks, and their chats hint at the drop-on reactions already in the game ("I'm sooo hot…" from the newt, Ginger wondering what snow is, Zig dreaming of other planets' colours), so chatting helps her discover them.

**Blocked by:** 01 — Talking to the pink alien

**Relevant files:** `src/ship/talks/`, `src/ship/talk.js`, `src/ship/entities/bluebell.js`, `src/ship/entities/ember.js`, `src/ship/entities/frosty.js`, `src/ship/entities/candy.js`, `src/ship/entities/stripey.js`, `src/ship/entities/lavaHouse.js`, `src/ship/entities/friends.js`, `src/ship/sfx.js` (a voice blip per character), `VISION.md`

**Status:** ready-for-agent

- [ ] Every friend's tap: trick, then speech bubble, then chat
- [ ] Each friend has its own tree, voice blip and text colour
- [ ] Each chat hints at that friend's existing drop-on reaction(s), and changes once it has happened
- [ ] Babies (yeti, lava) babble in simple words
- [ ] VISION.md updated
- [ ] `npm test` passes
