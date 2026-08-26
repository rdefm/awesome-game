# v1 art assets

Generate these with an AI image tool (e.g. ChatGPT image generation), save as
PNG with the exact filenames below, and drop them in this folder
(`public/assets/`). Phaser loads them by these filenames at runtime — nothing
else needs to change.

**Shared style prefix** — put this at the start of every character/item
prompt so the set feels consistent:

> Flat 2D vector illustration, cozy children's storybook game art style, soft
> rounded shapes, clean bold outlines, simple flat colors, no shadows, no
> gradients, transparent background, single subject centered, friendly and
> cute, suitable for a 7-12 year old audience.

## Characters (1024x1024, transparent PNG)

| File | Prompt (after the shared prefix) |
| --- | --- |
| `cat.png` | An orange tabby cat sitting upright, friendly smile, big round eyes, fluffy tail curled around its paws. |
| `dog.png` | A brown-and-white puppy with floppy ears, sitting, tongue out, wagging tail, happy expression. |
| `rabbit.png` | A small white rabbit with pink inner ears, sitting on its haunches, tiny pink nose, fluffy tail. |

## Items (1024x1024, transparent PNG)

| File | Prompt (after the shared prefix) |
| --- | --- |
| `ball.png` | A bouncy rubber ball with a red and yellow stripe pattern. |
| `bone.png` | A light tan dog bone / chew toy, classic double-knot bone shape. |
| `flower.png` | A single pink daisy-style flower with a green stem and two leaves. |
| `basket.png` | A small round wicker basket, empty, brown woven texture, simple handle. |
| `broom.png` | A wooden broom standing upright, tan wood handle, yellow straw bristles fanned at the base — matches the broom Manny holds in `assets/Manny-sweeping.png`. |

## Background (1600x980, opaque PNG)

This matches the aspect ratio of the scene area above the inventory tray
(800x490) so it isn't stretched or squashed when Phaser scales it to fit.

`background.png`:

> Flat 2D vector illustration, cozy children's storybook game art style, soft
> colors, clean outlines, no gradients. A sunny village square scene viewed
> from a slightly elevated angle: green grass ground, a winding dirt path, a
> small cottage with a red roof off to one side, a leafy tree, a clear blue
> sky with a few fluffy clouds. Empty of characters and items — just the
> background scenery, since characters and items are placed on top in-game.
> Landscape orientation.

## Checklist

- [ ] `background.png`
- [ ] `cat.png`
- [ ] `dog.png`
- [ ] `rabbit.png`
- [ ] `ball.png`
- [ ] `bone.png`
- [ ] `flower.png`
- [ ] `basket.png`
- [ ] `broom.png`
