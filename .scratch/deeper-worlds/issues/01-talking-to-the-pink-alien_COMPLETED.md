# 01 — Talking to the pink alien

**What to build:** A LucasArts-style conversation (Monkey Island) with the pink alien on Bluebell. Tap it: it does its trick exactly as now, then a little speech bubble pops above it. Tap the bubble and the chat opens: she and the alien speak their lines as coloured text above their heads (one line at a time, tap to move on), and big chunky choice lines appear along the bottom of the screen for her replies. Choices can lead to more choices; "Bye!" always closes the chat. Conversations are plain data (a little tree of lines and choices), so new characters just add a tree.

**Blocked by:** None — can start immediately

**Relevant files:** `src/ship/playScene.js` (modal handling, `toast`), `src/ship/wardrobePicker.js` (pattern for a modal panel), `src/ship/entities/bluebell.js` (the pink alien, `local`), `src/engine/font.js`, `src/ship/sfx.js` (a chatter blip per line), new `src/ship/talk.js` (tree walking, pure + tested), new `src/ship/talks/` (one tree per character), `VISION.md`

**Decisions:**
- Tap = trick as now, then a speech bubble offering the chat (the bubble fades if ignored).
- Each speaker's lines in their own colour, above their head; choices along the bottom with generous touch targets (kids' taps wobble).
- A tree can branch on simple world facts (e.g. "has she given me the crystal yet?") so lines change over time.
- While talking the scene is modal: no walking off mid-chat.

**Status:** ready-for-agent

- [ ] Tapping the pink alien plays its trick, then shows a speech bubble; tapping the bubble opens the chat
- [ ] Lines show as coloured text above whoever's speaking; tap to move on
- [ ] Choices appear as big tappable lines at the bottom; picking one says it and follows the tree
- [ ] At least one branch that depends on a world fact (e.g. after the crystal gift)
- [ ] "Bye!" closes it and play carries on
- [ ] Tree-walking logic is pure and covered by tests
- [ ] VISION.md updated
- [ ] `npm test` passes
