import test from 'node:test';import assert from 'node:assert/strict';
import {paperTransform,blendPaperCorners,letterOpeningLayout} from './paperProjection';
test('paper projection maps every DOM corner to its perspective quad within two pixels',()=>{
 const corners=[{x:1075,y:130},{x:1492,y:154},{x:1460,y:580},{x:1000,y:550}];
 const transform=paperTransform(corners,740,630)!;
 const m=transform.slice(9,-1).split(',').map(Number);
 for(const [i,[x,y]] of [[0,0],[740,0],[740,630],[0,630]].entries()){
  const divisor=m[3]*x+m[7]*y+1;
  assert.ok(Math.abs((m[0]*x+m[4]*y+m[12])/divisor-corners[i].x)<2);
  assert.ok(Math.abs((m[1]*x+m[5]*y+m[13])/divisor-corners[i].y)<2);
 }
});
test('handoff preserves endpoints and rejects a collapsed quad',()=>{
 const from=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];const to=from.map(p=>({x:p.x+100,y:p.y+200}));
 assert.deepEqual(blendPaperCorners(from,to,0),from);assert.deepEqual(blendPaperCorners(from,to,1),to);
 assert.equal(paperTransform(Array(4).fill({x:0,y:0}),740,630),null);
});

test('opening reader keeps natural PC widths and reverses without accumulating layout inputs',()=>{
 const large=letterOpeningLayout(1920,1080,642,1),small=letterOpeningLayout(1440,900,644,1);
 assert.equal(large.width,740);assert.equal(large.left+large.width/2,1920*.7);assert.equal(large.top,108);
 assert.equal(small.width,705);assert.equal(small.left+small.width/2,1440*.7);assert.equal(small.top,90);
 const closed=letterOpeningLayout(1440,900,644,0),middle=letterOpeningLayout(1440,900,644,.95);
 assert.equal(closed.handoff,0);assert.equal(small.handoff,1);assert.ok(middle.envelopeBase>closed.envelopeBase&&middle.envelopeBase<small.envelopeBase);
 large.left=-999;letterOpeningLayout(1920,1080,642,.92);assert.deepEqual(letterOpeningLayout(1440,900,644,0),closed);
 assert.ok(Object.values(letterOpeningLayout(NaN,Infinity,undefined,NaN)).every(Number.isFinite));
});
