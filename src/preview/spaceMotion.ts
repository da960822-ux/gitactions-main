export const SPACE_PLAN = {
  balloons: 48, stars: 720, brightStars: 12, entranceSeconds: 2,
  scrollDistance: 720, letterSeconds: 1.2,
  cameraStart: 12.8, cameraRest: 9.4, cameraEnd: 5.4,
} as const;

export const clamp = (n: number, low = 0, high = 1) => Math.min(high, Math.max(low, n));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const randomAt = (i: number) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
export function advanceLetter(value: number, open: boolean, dt: number, immediate: boolean) {
  return immediate ? Number(open) : clamp(value + (open ? 1 : -1) * Math.min(dt, .25) / SPACE_PLAN.letterSeconds);
}
export function stepSpring(position: number, velocity: number, target: number, dt: number) {
  // Substeps keep a sudden resumed frame from injecting energy into a dragged balloon.
  const count = Math.max(1, Math.ceil(Math.min(dt, .05) / .008));
  const step = Math.min(dt, .05) / count;
  for (let i = 0; i < count; i++) {
    velocity += ((target - position) * 100 - velocity * 15) * step;
    position += velocity * step;
  }
  return {position, velocity};
}
export function balloonPlan(index: number, mobile: boolean) {
  const left = index < 18, right = index >= 18 && index < 38;
  const local = left ? index : right ? index - 18 : index - 38;
  const layer = index % 3;
  const x = left ? (mobile ? -.06 : .155) + Math.sin(local * 2.4) * (mobile ? .115 : .065)
    : right ? (mobile ? 1.06 : .855) + Math.cos(local * 2.1) * (mobile ? .115 : .068)
    : .27 + local * .051;
  const y = left ? (mobile ? .28 : .35) + local / 18 * (mobile ? .28 : .26)
    : right ? (mobile ? .27 : .22) + local / 20 * (mobile ? .32 : .56)
    : .17 + Math.sin(local * 1.9) * .045;
  return {x, y, depth: left || right ? [7.2, 10.6, 14.4][layer] : 18.4,
    pixels: (mobile ? 56 : 88) + randomAt(index + 4) * (mobile ? 46 : 67) + (local % 9 === 0 ? (mobile ? 38 : 68) : 0),
    material: index % 3, rotation: (randomAt(index + 32) - .5) * .7};
}
