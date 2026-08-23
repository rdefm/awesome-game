import Phaser from 'phaser';
import { createGameState, pickUp, place } from '../gameState.js';
import { manifest } from '../content.js';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TRAY_HEIGHT = 110;
const TRAY_SLOT_SPACING = 80;
const TRAY_SLOT_X_START = 60;
const TRAY_SLOT_Y = GAME_HEIGHT - TRAY_HEIGHT / 2;

export class VillageScene extends Phaser.Scene {
  constructor() {
    super('VillageScene');
    this.state = createGameState(manifest);
    this.selectedInventoryId = null;
    this.entityViews = new Map();
  }

  create() {
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT - TRAY_HEIGHT, 0x4a7c3f)
      .setOrigin(0, 0)
      .setInteractive()
      .on('pointerdown', (pointer) => this.handleBackgroundTap(pointer));

    this.add
      .rectangle(0, GAME_HEIGHT - TRAY_HEIGHT, GAME_WIDTH, TRAY_HEIGHT, 0x2f2f2f)
      .setOrigin(0, 0);

    this.add
      .text(12, GAME_HEIGHT - TRAY_HEIGHT + 8, 'Inventory', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0, 0);

    this.render();
  }

  handleBackgroundTap(pointer) {
    if (!this.selectedInventoryId) {
      return;
    }
    this.applyState(place(this.state, this.selectedInventoryId, pointer.x, pointer.y));
    this.selectedInventoryId = null;
  }

  handleSceneEntityTap(entityId) {
    this.applyState(pickUp(this.state, entityId));
    this.selectedInventoryId = null;
  }

  handleInventoryEntityTap(entityId) {
    this.selectedInventoryId = this.selectedInventoryId === entityId ? null : entityId;
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
    view.setInteractive({ useHandCursor: true });
    view.on('pointerdown', () => this.handleSceneEntityTap(entity.id));
    this.entityViews.set(entity.id, view);
  }

  renderInventoryEntity(entity, trayIndex) {
    const x = TRAY_SLOT_X_START + trayIndex * TRAY_SLOT_SPACING;
    const view = this.createShape(entity, x, TRAY_SLOT_Y);
    view.setInteractive({ useHandCursor: true });
    view.on('pointerdown', () => this.handleInventoryEntityTap(entity.id));
    if (this.selectedInventoryId === entity.id) {
      view.setStrokeStyle(4, 0xffffff);
    }
    this.entityViews.set(entity.id, view);
  }

  createShape(entity, x, y) {
    if (entity.shape === 'circle') {
      return this.add.circle(x, y, entity.radius, entity.color);
    }
    return this.add.rectangle(x, y, entity.size, entity.size, entity.color);
  }
}

export const VILLAGE_SCENE_DIMENSIONS = { width: GAME_WIDTH, height: GAME_HEIGHT };
