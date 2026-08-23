# 03 — Real cast, items, and art integration

**What to build:** Replace the placeholder shapes from ticket 01 with the actual v1 cast: 2-3 characters/animals and 3-5 items, each backed by an AI-generated image asset supplied by the user, plus a real village background image. Define the concrete content manifest (names, sprite keys, types) that later tickets (goals, persistence) will reference.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A concrete list of 2-3 characters/animals and 3-5 items is proposed and confirmed with the user, along with the art-generation prompts for each
- [ ] User-supplied image assets are integrated into the project and loaded via Phaser's preload step
- [ ] The village scene renders the real background and real sprites in place of the ticket 01 placeholders
- [ ] Pick-up/place (tap and drag, from tickets 01-02) continue to work unchanged against the real entities
- [ ] Content manifest structure (id, display name, sprite key, type) is stable enough for ticket 04 to add a `wants` field to character entries
