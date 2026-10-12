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
  return immediate ? Number(open) : clamp(value + (open ? 1 : -1) * dt / SPACE_PLAN.letterSeconds);
}
export function pointerRepulsionFactor(distance: number) {
  if(!Number.isFinite(distance)||distance<=0||distance>=180)return 0;
  return (1-distance/180)*Math.min(1,distance/64);
}
export function stepSpring(position: number, velocity: number, target: number, dt: number) {
  // Substeps stabilize a long visible frame while preserving wall-clock spring timing.
  const elapsed = clamp(Number.isFinite(dt) ? dt : 0, 0, 2);
  const count = Math.max(1, Math.ceil(elapsed / .008));
  const step = elapsed / count;
  for (let i = 0; i < count; i++) {
    velocity += ((target - position) * 100 - velocity * 15) * step;
    position += velocity * step;
  }
  return {position, velocity};
}
export function balloonPlan(index: number, mobile: boolean) {
  const left = index < 18, right = index >= 18 && index < 38;
  const local = left ? index : right ? index - 18 : index - 38;
  let x:number,y:number;
  if(mobile){
    x=left?-.06+Math.sin(local*2.4)*.115:right?1.06+Math.cos(local*2.1)*.115:.27+local*.051;
    y=left?.28+local/18*.28:right?.27+local/20*.32:.17+Math.sin(local*1.9)*.045;
  }else if(left||right){
    const centers=left?[[.055,.23],[.16,.48],[.065,.73]]:[[.80,.18],[.94,.39],[.81,.64],[.94,.84]];
    const clusterSize=left?6:5,cluster=Math.floor(local/clusterSize),slot=local%clusterSize,center=centers[cluster];
    const angle=slot/clusterSize*Math.PI*2+(randomAt(index+931)-.5)*.62;
    const rx=left?.035+randomAt(index+741)*.035:.04+randomAt(index+741)*.045;
    const ry=left?.045+randomAt(index+501)*.045:.07+randomAt(index+501)*.08;
    x=center[0]+Math.cos(angle)*rx;y=center[1]+Math.sin(angle)*ry;
  }else{
    x=.25+local*.055+(randomAt(index+741)-.5)*.025;y=.16+Math.sin(local*1.9)*.045+(randomAt(index+501)-.5)*.035;
  }
  const layer=Math.floor(randomAt(index+171)*3);
  const rightBonus=right&&local%9===0;
  return {x, y, depth: left || right ? [7.2, 10.6, 14.4][layer] : 18.4,
    pixels: right&&!mobile?68+randomAt(index+4)*48+(rightBonus?28:0):(mobile?56:88)+randomAt(index+4)*(mobile?46:67)+(local%9===0?(mobile?38:68):0),
    material: (index + Math.floor(index/3)) % 3, rotation: (randomAt(index + 32) - .5) * .9,
    tiltX:(randomAt(index+72)-.5)*(right&&!mobile?1.1:.9),tiltY:(randomAt(index+112)-.5)*(right&&!mobile?1.45:1.15)};
}
