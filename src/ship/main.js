import { Engine } from '../engine/engine.js';
import { loadAssets } from './assets.js';
import { W, H } from './layout.js';
import { defineSfx } from './sfx.js';
import { landedOn, planetScene } from './planetScenes.js';
import { loadSave } from './save.js';
import { ShipScene } from './shipScene.js';

const engine = new Engine({ parent: document.getElementById('game'), width: W, height: H });
defineSfx(engine.audio);
const assets = loadAssets();
const save = loadSave();
// Pick up where she left off: inside the ship, or out on a planet.
const planet = landedOn(save);
engine.setScene(planet ? planetScene(planet, assets, { fromShip: false }) : new ShipScene(assets));
engine.start();
