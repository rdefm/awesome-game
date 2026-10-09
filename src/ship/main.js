import { Engine } from '../engine/engine.js';
import { loadAssets } from './assets.js';
import { W, H } from './layout.js';
import { defineSfx } from './sfx.js';
import { landedOn, planetScene } from './planetScenes.js';
import { loadSave, musicOn } from './save.js';
import { shipRoomScene } from './shipRooms.js';
import { TUNES } from './tunes.js';

const engine = new Engine({ parent: document.getElementById('game'), width: W, height: H });
defineSfx(engine.audio);
engine.music.tunes = TUNES;
const assets = loadAssets();
const save = loadSave();
engine.music.enabled = musicOn(save);
// Pick up where she left off: in one of the ship's rooms, or out on a planet.
const planet = landedOn(save);
engine.setScene(planet ? planetScene(planet, assets, { fromShip: false }) : shipRoomScene(save.where, assets));
engine.start();
