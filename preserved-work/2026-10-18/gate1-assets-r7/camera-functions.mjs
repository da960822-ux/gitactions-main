const INTRO_SECONDS = 3.2;
const FOLD_ANCHORS = { hero: [0, -2.9, 0], boundary: [0, 0, -4], gallery: [0, 0, -26] };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothRange = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
function introPose(seconds) {
  return { progress: 0, entrance: smoothRange(0.1, 2.9, seconds), pointerX: 0, pointerY: 0, time: Math.min(seconds, INTRO_SECONDS) };
}
function cameraPose(p, entrance, mobile) {
  const stable = mobile ? [1.3, 0.25, 12.1, 1.35, -0.1, 0] : [0, 0.3, 11.7, 0.3, -0.05, 0];
  const keys = [[0, ...stable], [0.43, ...stable], [0.5, -2.1, 0.5, 6, 3.2, 1, -23], [0.6, -2.1, 0.55, -0.5, 2, 1, -29], [0.65, -1.7, 0.6, -2.2, 1, 1, -32], [0.85, 0.8, 0.8, -7, -1, 1, -39], [1, 1.8, 0.8, -10.5, -3, 1, -48]];
  const i = Math.min(keys.length - 2, Math.max(0, keys.findIndex((k, j) => j < keys.length - 1 && p >= k[0] && p <= keys[j + 1][0]))), a = keys[i], b = keys[i + 1], t = smoothRange(a[0], b[0], p), v = a.slice(1).map((x, j) => x + (b[j + 1] - x) * t);
  v[2] += (1 - entrance) * 2.5;
  return { position: v.slice(0, 3), target: v.slice(3, 6) };
}
function surfaceWeights(p) {
  return { aperture: smoothRange(0.08, 0.43, p), rail: smoothRange(0.55, 0.85, p) };
}
export {
  FOLD_ANCHORS,
  INTRO_SECONDS,
  cameraPose,
  clamp01,
  introPose,
  smoothRange,
  surfaceWeights
};
