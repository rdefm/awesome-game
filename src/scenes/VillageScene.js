import Phaser from 'phaser';
import { createGameState, pickUp, place } from '../gameState.js';
import { manifest } from '../content.js';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TRAY_HEIGHT = 110;
const TRAY_SLOT_SPACING = 80;
const TRAY_SLOT_X_START = 60;
const TRAY_TOP_Y = GAME_HEIGHT - TRAY_HEIGHT;
const TRAY_SLOT_Y = GAME_HEIGHT - TRAY_HEIGHT / 2;
// Small buffer so a shaky tablet tap isn't misread as a drag.
const DRAG_DISTANCE_THRESHOLD = 10;

export class VillageScene extends Phaser.Scene {
  constructor() {
    super('VillageScene');
    this.state = createGameState(manifest);
    this.selectedInventoryId = null;
    this.entityViews = new Map();
  }

  create() {
    this.input.dragDistanceThreshold = DRAG_DISTANCE_THRESHOLD;

    this.add
      .rectangle(0, 0, GAME_WIDTH, TRAY_TOP_Y, 0x4a7c3f)
      .setOrigin(0, 0)
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

    // Dropped back into the zone it started in - snap the view back to its real position.
    this.render();
  }

  applyState(nextState) {
    this.state = nextState;
    this.render();
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
    const view = this.createShape(entity, runtime.x, runtime.y);
    view.on('pointerup', () => this.handleEntityPointerUp(entity.id, view));
    this.entityViews.set(entity.id, view);
  }

  renderInventoryEntity(entity, trayIndex) {
    const x = TRAY_SLOT_X_START + trayIndex * TRAY_SLOT_SPACING;
    const view = this.createShape(entity, x, TRAY_SLOT_Y);
    view.on('pointerup', () => this.handleEntityPointerUp(entity.id, view));
    if (this.selectedInventoryId === entity.id) {
      view.setStrokeStyle(4, 0xffffff);
    }
    this.entityViews.set(entity.id, view);
  }

  createShape(entity, x, y) {
    const view =
      entity.shape === 'circle'
        ? this.add.circle(x, y, entity.radius, entity.color)
        : this.add.rectangle(x, y, entity.size, entity.size, entity.color);

    view.setData('entityId', entity.id);
    view.setInteractive({ useHandCursor: true, draggable: true });
    return view;
  }
}

export const VILLAGE_SCENE_DIMENSIONS = { width: GAME_WIDTH, height: GAME_HEIGHT };
