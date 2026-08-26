import Phaser from 'phaser';
import { createGameState, pickUp, place, moveWithinScene } from '../gameState.js';
import { manifest } from '../content.js';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TRAY_HEIGHT = 110;
const TRAY_SLOT_SPACING = 110;
const TRAY_SLOT_X_START = 70;
const TRAY_TOP_Y = GAME_HEIGHT - TRAY_HEIGHT;
const TRAY_SLOT_Y = GAME_HEIGHT - TRAY_HEIGHT / 2;
// Small buffer so a shaky tablet tap isn't misread as a drag.
const DRAG_DISTANCE_THRESHOLD = 10;
// Sized for reliable touch targets on a tablet, not just visibility.
const ENTITY_DISPLAY_SIZE = 90;
const SELECTION_HIGHLIGHT_PADDING = 14;
const MONKEY_FRAME_SIZE = 82;
const MONKEY_IDLE_ANIM = 'monkey-idle';
const MONKEY_SWEEP_FRAME_SIZE = 256;
const MONKEY_SWEEP_ANIM = 'monkey-sweep';
const MONKEY_ID = 'monkey';
const BROOM_ID = 'broom';
// Two entities count as "brought together" once their centers are this close.
const PROXIMITY_THRESHOLD = ENTITY_DISPLAY_SIZE;

export class VillageScene extends Phaser.Scene {
  constructor() {
    super('VillageScene');
    this.state = createGameState(manifest);
    this.selectedInventoryId = null;
    this.entityViews = new Map();
  }

  preload() {
    this.load.image('background', 'assets/background.png');
    for (const entity of manifest) {
      if (entity.spriteKey === 'monkey') {
        this.load.spritesheet('monkey', 'assets/monkey-idle.png', {
          frameWidth: MONKEY_FRAME_SIZE,
          frameHeight: MONKEY_FRAME_SIZE,
        });
        this.load.spritesheet('monkey-sweep', 'assets/monkey-sweep.png', {
          frameWidth: MONKEY_SWEEP_FRAME_SIZE,
          frameHeight: MONKEY_SWEEP_FRAME_SIZE,
        });
      } else {
        this.load.image(entity.spriteKey, `assets/${entity.spriteKey}.png`);
      }
    }
  }

  create() {
    this.input.dragDistanceThreshold = DRAG_DISTANCE_THRESHOLD;

    this.anims.create({
      key: MONKEY_IDLE_ANIM,
      frames: this.anims.generateFrameNumbers('monkey'),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: MONKEY_SWEEP_ANIM,
      frames: this.anims.generateFrameNumbers('monkey-sweep'),
      frameRate: 10,
      repeat: 0,
    });

    this.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, TRAY_TOP_Y)
      .setInteractive()
      .on('pointerdown', (pointer) => this.handleBackgroundTap(pointer));

    this.add.rectangle(0, TRAY_TOP_Y, GAME_WIDTH, TRAY_HEIGHT, 0x2f2f2f).setOrigin(0, 0);

    this.add
      .text(12, TRAY_TOP_Y + 8, 'Inventory', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0, 0);

    this.input.on('dragstart', (pointer, view) => view.setData('dragged', true));
    this.input.on('drag', (pointer, view, dragX, dragY) => {
      view.x = dragX;
      view.y = dragY;
    });
    this.input.on('dragend', (pointer, view) => this.handleDragEnd(pointer, view));

    this.render();
  }

  handleBackgroundTap(pointer) {
    if (!this.selectedInventoryId) {
      return;
    }
    this.placeEntity(this.selectedInventoryId, pointer.x, pointer.y);
  }

  handleSceneEntityTap(entityId) {
    this.applyState(pickUp(this.state, entityId));
    this.selectedInventoryId = null;
  }

  handleInventoryEntityTap(entityId) {
    this.selectedInventoryId = this.selectedInventoryId === entityId ? null : entityId;
    this.render();
  }

  placeEntity(entityId, x, y) {
    this.applyState(place(this.state, entityId, x, y));
    this.selectedInventoryId = null;
  }

  handleEntityPointerUp(entityId, view) {
    if (view.getData('dragged')) {
      view.setData('dragged', false);
      return;
    }

    const entity = this.state.entities[entityId];
    if (entity.location === 'scene') {
      this.handleSceneEntityTap(entityId);
    } else {
      this.handleInventoryEntityTap(entityId);
    }
  }

  handleDragEnd(pointer, view) {
    const entityId = view.getData('entityId');
    const entity = this.state.entities[entityId];
    const droppedInTray = pointer.y >= TRAY_TOP_Y;

    if (entity.location === 'scene' && droppedInTray) {
      this.handleSceneEntityTap(entityId);
      return;
    }

    if (entity.location === 'inventory' && !droppedInTray) {
      this.placeEntity(entityId, pointer.x, pointer.y);
      return;
    }

    if (entity.location === 'scene' && !droppedInTray) {
      this.applyState(moveWithinScene(this.state, entityId, pointer.x, pointer.y));
      return;
    }

    // Dropped back into the zone it started in - snap the view back to its real position.
    this.render();
  }

  applyState(nextState) {
    const wasNear = this.isBroomNearMonkey(this.state);
    this.state = nextState;
    this.render();

    if (!wasNear && this.isBroomNearMonkey(this.state)) {
      this.playMonkeySweep();
    }
  }

  isBroomNearMonkey(state) {
    const broom = state.entities[BROOM_ID];
    const monkey = state.entities[MONKEY_ID];
    if (!broom || !monkey || broom.location !== 'scene' || monkey.location !== 'scene') {
      return false;
    }
    return Phaser.Math.Distance.Between(broom.x, broom.y, monkey.x, monkey.y) <= PROXIMITY_THRESHOLD;
  }

  playMonkeySweep() {
    const monkeyView = this.entityViews.get(MONKEY_ID);
    if (!monkeyView) {
      return;
    }
    // The sweep spritesheet's frames are a different native size than the idle
    // spritesheet's, so displaySize has to be re-applied after each switch —
    // otherwise the sprite's scale (fixed to whichever frame size was current
    // when setDisplaySize was last called) makes it balloon or shrink.
    monkeyView.play(MONKEY_SWEEP_ANIM);
    monkeyView.setDisplaySize(ENTITY_DISPLAY_SIZE, ENTITY_DISPLAY_SIZE);
    monkeyView.once(`animationcomplete-${MONKEY_SWEEP_ANIM}`, () => {
      if (monkeyView.active) {
        monkeyView.play(MONKEY_IDLE_ANIM);
        monkeyView.setDisplaySize(ENTITY_DISPLAY_SIZE, ENTITY_DISPLAY_SIZE);
      }
    });
  }

  render() {
    for (const view of this.entityViews.values()) {
      view.destroy();
    }
    this.entityViews.clear();

    let trayIndex = 0;
    for (const entity of manifest) {
      const runtime = this.state.entities[entity.id];
      if (runtime.location === 'scene') {
        this.renderSceneEntity(entity, runtime);
      } else {
        this.renderInventoryEntity(entity, trayIndex);
        trayIndex += 1;
      }
    }
  }

  renderSceneEntity(entity, runtime) {
    const view = this.createEntitySprite(entity, runtime.x, runtime.y);
    view.on('pointerup', () => this.handleEntityPointerUp(entity.id, view));
    this.entityViews.set(entity.id, view);
    this.renderPlaceholderLabel(entity, runtime.x, runtime.y);
  }

  renderInventoryEntity(entity, trayIndex) {
    const x = TRAY_SLOT_X_START + trayIndex * TRAY_SLOT_SPACING;

    if (this.selectedInventoryId === entity.id) {
      const highlightSize = ENTITY_DISPLAY_SIZE + SELECTION_HIGHLIGHT_PADDING;
      const highlight = this.add
        .rectangle(x, TRAY_SLOT_Y, highlightSize, highlightSize)
        .setStrokeStyle(4, 0xffffff);
      this.entityViews.set(`${entity.id}-highlight`, highlight);
    }

    const view = this.createEntitySprite(entity, x, TRAY_SLOT_Y);
    view.on('pointerup', () => this.handleEntityPointerUp(entity.id, view));
    this.entityViews.set(entity.id, view);
    this.renderPlaceholderLabel(entity, x, TRAY_SLOT_Y);
  }

  // Missing art renders as Phaser's generic checkerboard texture, which looks
  // identical for every entity — label it with its name so it's identifiable
  // until real art lands in public/assets/.
  renderPlaceholderLabel(entity, x, y) {
    if (this.textures.exists(entity.spriteKey)) {
      return;
    }

    const label = this.add
      .text(x, y, entity.name, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 0.5);
    this.entityViews.set(`${entity.id}-label`, label);
  }

  createEntitySprite(entity, x, y) {
    const view =
      entity.spriteKey === 'monkey'
        ? this.add.sprite(x, y, 'monkey').play(MONKEY_IDLE_ANIM)
        : this.add.image(x, y, entity.spriteKey);
    view.setDisplaySize(ENTITY_DISPLAY_SIZE, ENTITY_DISPLAY_SIZE);

    view.setData('entityId', entity.id);
    view.setInteractive({ useHandCursor: true, draggable: true });
    return view;
  }
}

export const VILLAGE_SCENE_DIMENSIONS = { width: GAME_WIDTH, height: GAME_HEIGHT };
