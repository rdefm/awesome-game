// A plain RGBA pixel buffer with drawing primitives. All game art is painted
// into these at load time, so the art code is pure (no DOM) and testable.

const colorCache = new Map();

export function parseColor(color) {
  if (Array.isArray(color)) {
    return color;
  }
  let parsed = colorCache.get(color);
  if (!parsed) {
    const hex = color.replace('#', '');
    parsed = [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) : 255,
    ];
    colorCache.set(color, parsed);
  }
  return parsed;
}

// 4x4 ordered-dither thresholds (0..15), the classic way to fake gradients in pixel art.
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function bayer(x, y) {
  return BAYER4[(y & 3) * 4 + (x & 3)] / 16;
}

export class Pixmap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  set(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (color == null || !this.inBounds(x, y)) {
      return;
    }
    const [r, g, b, a] = parseColor(color);
    const i = (y * this.width + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = a;
  }

  clear(x, y) {
    if (this.inBounds(x, y)) {
      this.data[(y * this.width + x) * 4 + 3] = 0;
    }
  }

  get(x, y) {
    if (!this.inBounds(x, y)) {
      return [0, 0, 0, 0];
    }
    const i = (y * this.width + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }

  isSet(x, y) {
    return this.inBounds(x, y) && this.data[(y * this.width + x) * 4 + 3] > 0;
  }

  rect(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        this.set(xx, yy, color);
      }
    }
  }

  // Fills a rect with `color` on a dither pattern: amount 0 = none, 1 = solid.
  dither(x, y, w, h, color, amount) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (bayer(xx, yy) < amount) {
          this.set(xx, yy, color);
        }
      }
    }
  }

  hline(x0, x1, y, color) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      this.set(x, y, color);
    }
  }

  vline(x, y0, y1, color) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      this.set(x, y, color);
    }
  }

  line(x0, y0, x1, y1, color, thickness = 1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.rect(x0, y0, thickness, thickness, color);
      if (x0 === x1 && y0 === y1) {
        break;
      }
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  ellipse(cx, cy, rx, ry, color) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / (rx + 0.5);
        const ny = (y - cy) / (ry + 0.5);
        if (nx * nx + ny * ny <= 1) {
          this.set(x, y, color);
        }
      }
    }
  }

  circle(cx, cy, r, color) {
    this.ellipse(cx, cy, r, r, color);
  }

  ring(cx, cy, rOuter, rInner, color) {
    for (let y = Math.floor(cy - rOuter); y <= Math.ceil(cy + rOuter); y++) {
      for (let x = Math.floor(cx - rOuter); x <= Math.ceil(cx + rOuter); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= rOuter + 0.5 && d > rInner + 0.5) {
          this.set(x, y, color);
        }
      }
    }
  }

  // Draws a character grid: each char maps to a palette colour, '.' or ' ' = skip.
  grid(rows, palette, ox = 0, oy = 0, flipX = false) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = palette[row[x]];
        if (color) {
          const px = flipX ? row.length - 1 - x : x;
          this.set(ox + px, oy + y, color);
        }
      }
    });
  }

  blit(src, ox, oy, { flipX = false } = {}) {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const i = (y * src.width + x) * 4;
        if (src.data[i + 3] === 0) {
          continue;
        }
        const tx = flipX ? ox + src.width - 1 - x : ox + x;
        this.set(tx, oy + y, [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]]);
      }
    }
  }

  // Adds a 1px border around every opaque shape, touching only empty pixels.
  outline(color) {
    const marks = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.isSet(x, y)) {
          continue;
        }
        if (this.isSet(x - 1, y) || this.isSet(x + 1, y) || this.isSet(x, y - 1) || this.isSet(x, y + 1)) {
          marks.push(x, y);
        }
      }
    }
    for (let i = 0; i < marks.length; i += 2) {
      this.set(marks[i], marks[i + 1], color);
    }
    return this;
  }

  replaceColor(from, to) {
    const [fr, fg, fb] = parseColor(from);
    const [tr, tg, tb, ta] = parseColor(to);
    for (let i = 0; i < this.data.length; i += 4) {
      if (this.data[i + 3] && this.data[i] === fr && this.data[i + 1] === fg && this.data[i + 2] === fb) {
        this.data[i] = tr;
        this.data[i + 1] = tg;
        this.data[i + 2] = tb;
        this.data[i + 3] = ta;
      }
    }
    return this;
  }

  static fromGrid(rows, palette) {
    const width = Math.max(...rows.map((r) => r.length));
    const pm = new Pixmap(width, rows.length);
    pm.grid(rows, palette);
    return pm;
  }
}

// Small deterministic RNG so procedural art looks the same on every load.
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function hash2(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth value noise in [0,1].
export function valueNoise(x, y, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fractalNoise(x, y, seed = 0, octaves = 3) {
  let total = 0;
  let amp = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise(x, y, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    x *= 2;
    y *= 2;
  }
  return total / norm;
}
