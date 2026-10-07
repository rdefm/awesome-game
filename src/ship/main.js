import { Engine } from '../engine/engine.js';
import { loadAssets } from './assets.js';
import { W, H } from './layout.js';
import { defineSfx } from './sfx.js';
import { ShipScene } from './shipScene.js';

const engine = new Engine({ parent: document.getElementById('game'), width: W, height: H });
defineSfx(engine.audio);
engine.setScene(new ShipScene(loadAssets()));
engine.start();
