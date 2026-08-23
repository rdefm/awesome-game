import Phaser from 'phaser';
import { VillageScene, VILLAGE_SCENE_DIMENSIONS } from './scenes/VillageScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VILLAGE_SCENE_DIMENSIONS.width,
  height: VILLAGE_SCENE_DIMENSIONS.height,
  backgroundColor: '#1c1c1c',
  scene: [VillageScene],
});
