// Easing curves take t in [0,1] and return progress (may overshoot for springy ones).
export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => t * (2 - t),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - (1 - t) ** 3,
  outBack: (t) => {
    const c = 1.70158;
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
  },
  outElastic: (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};

// Drives property tweens and timers off the game clock (not wall time), so
// everything pauses together and scripted sequences can simply `await`.
export class Tweens {
  constructor() {
    this.active = [];
  }

  to(target, props, duration, easing = ease.outQuad) {
    return new Promise((resolve) => {
      const from = {};
      for (const key of Object.keys(props)) {
        from[key] = target[key];
      }
      this.active.push({ target, from, props, duration: Math.max(duration, 0.0001), elapsed: 0, easing, resolve });
    });
  }

  wait(seconds) {
    return this.to({}, {}, seconds);
  }

  // Stops tweens on a target without resolving them (their awaiters are abandoned).
  cancel(target) {
    this.active = this.active.filter((t) => t.target !== target);
  }

  update(dt) {
    const done = [];
    for (const tw of this.active) {
      tw.elapsed += dt;
      const p = Math.min(tw.elapsed / tw.duration, 1);
      const k = tw.easing(p);
      for (const key of Object.keys(tw.props)) {
        tw.target[key] = tw.from[key] + (tw.props[key] - tw.from[key]) * k;
      }
      if (p >= 1) {
        done.push(tw);
      }
    }
    if (done.length) {
      this.active = this.active.filter((t) => !done.includes(t));
      done.forEach((t) => t.resolve());
    }
  }
}
