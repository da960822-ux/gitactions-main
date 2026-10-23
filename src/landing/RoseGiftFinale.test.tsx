import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {RoseGiftFinale,roseGiftCanCelebrate,roseGiftClosingLine,roseGiftPose} from './story/RoseGiftFinale';

it('gates fireworks on the fully settled handover while visible, never on initial contact or transfer',()=>{
 for(const seconds of [-1,0,1.2,1.65,2.85,2.999,NaN,Infinity])expect(roseGiftCanCelebrate(seconds,true)).toBe(false);
 expect(roseGiftCanCelebrate(3,true)).toBe(true);expect(roseGiftCanCelebrate(3,false)).toBe(false);
 expect(roseGiftCanCelebrate(0,true)).toBe(false);expect(roseGiftCanCelebrate(3,true)).toBe(true);
});

it('registers three finite fireworks behind the unchanged single rose and uses a static reduced-motion glow',()=>{
 const html=renderToStaticMarkup(<RoseGiftFinale language="ko"/>),reduced=renderToStaticMarkup(<RoseGiftFinale language="ko" reducedMotion/>);
 expect(html).toContain('data-celebration="idle"');expect(html).toContain('data-trigger="handover-complete"');
 expect(html.match(/class="rg-firework-launch"/g)).toHaveLength(3);expect(html.match(/class="rg-firework-ray"/g)).toHaveLength(84);
 expect(html.indexOf('class="rg-celebration"')).toBeLessThan(html.indexOf('class="rg-live"'));
 expect(reduced).toContain('data-celebration="static"');expect(reduced).toContain('rg-celebration-glow');
 expect(html.match(/data-flower-instance="single"/g)).toHaveLength(1);
});

it('uses the playful lifetime-partner line only after receiving and an actual pact answer',()=>{
 for(const language of ['ko','es'] as const){
  const normal=roseGiftClosingLine(language,true,false);
  expect(roseGiftClosingLine(language,false,true)).toBe(normal);
  const signed=roseGiftClosingLine(language,true,true);
  expect(signed.startsWith(language==='ko'?'네가 사인했으니까, 이제 우리는 평생 함께야, Baby.':'Como firmaste, ahora vamos a estar juntos toda la vida, Baby.')).toBe(true);
  expect(signed).toContain(language==='ko'?'내가 제일 좋아하는 내 편':'Mi persona favorita');
  expect(normal).not.toContain(language==='ko'?'네가 사인했으니까':'Como firmaste');
 }
});

it('renders one live layered cutout and preserves semantics, loading and the approved static fallback',()=>{
 const html=renderToStaticMarkup(<RoseGiftFinale language="es" pactAccepted/>);
 expect(html).toContain('aria-labelledby="rose-gift-title"');
 expect(html).toContain('role="img"');
 expect(html).toContain('Yeonseok le ofrece una rosa roja a Lisbeth');
 for(const asset of ['received','offer','body-clean','rose-single','limb-atlas','hand-pose-atlas'])expect(html).toContain(`/images/rose-gift/${asset}.png`);
 for(const retired of ['contact.png','rg-pose'])expect(html).not.toContain(retired);
 expect(html.match(/data-flower-instance="single"/g)).toHaveLength(1);
 expect(html).toContain('data-rig="complete-limb-handover"');
 expect(html).toMatch(/href="\/images\/rose-gift\/body-clean.png"[^>]*mask="url\(#[^"]+-body-underlay\)"/);
 expect(html.match(/href="\/images\/rose-gift\/limb-atlas.png"/g)).toHaveLength(3);
 expect(html.match(/href="\/images\/rose-gift\/hand-pose-atlas.png"/g)).toHaveLength(2);
 for(const hand of ['donor-closed','donor-open','recipient-open','recipient-closed'])expect(html).toContain(`data-rg-joint="${hand}"`);
 expect(html).toContain('data-rg-joint="donor-arm"');
 expect(html).not.toContain('data-rg-joint="donor-lower"');
 expect(html).toContain('data-rg-joint="recipient-lower"');
 expect(html).not.toContain('data-rg-joint="donor-grip"');
 expect(html).not.toContain('data-rg-joint="recipient-reach"');
 expect(html).toMatch(/class="rg-replay" disabled=""/);
 expect(html).not.toContain('Ya firmaste');
 expect(html).not.toContain('<canvas');
 expect(html).not.toContain('<filter');
 expect(html).not.toContain('wrist-skin');
 expect(html).toMatch(/href="\/images\/rose-gift\/offer.png"[^>]*clip-path="url\(#[^"]+-recipient-upper\)"/);
 expect(html).not.toContain('opacity=');
 expect(html.indexOf('data-rg-joint="recipient-open"')).toBeLessThan(html.indexOf('data-flower-instance="single"'));
 expect(html.indexOf('data-rg-joint="donor-hands"')).toBeGreaterThan(html.indexOf('data-flower-instance="single"'));
 expect(html.indexOf('data-rg-joint="donor-closed"')).toBeGreaterThan(html.indexOf('data-rg-joint="recipient-closed"'));
 expect(html).not.toContain('recipient-open-window');
 expect(html).toContain('data-rg-joint="recipient-closed" visibility="hidden"');
 expect(html).toContain('data-rg-joint="recipient-lower"');
});

it('holds distinct contacts before transfer, then retreats after acceptance',()=>{
 const contact=roseGiftPose(1.2);
 for(const seconds of [1.2,1.5,1.65,1.85]){
  const p=roseGiftPose(seconds);
  expect(p.donorGrip).toEqual(contact.donorGrip);
  expect(p.recipientGrip).toEqual(contact.recipientGrip);
 }
 expect(roseGiftPose(1.6).owner).toBe('donor');
 expect(roseGiftPose(1.7).owner).toBe('recipient');
 expect(roseGiftPose(2.4).donorGrip).not.toEqual(contact.donorGrip);
});

it('starts with a gripping donor and separated open recipient, closes her hand before he releases',()=>{
 const start=roseGiftPose(0);
 expect(start.donorOpen).toBe(0);expect(start.recipientClosed).toBe(false);
 expect(Math.hypot(start.donorGrip.x-start.recipientGrip.x,start.donorGrip.y-start.recipientGrip.y)).toBeGreaterThan(100);
 expect(roseGiftPose(1.2).recipientTurn).toBeGreaterThan(0);
 expect(roseGiftPose(1.35).recipientTurn).toBe(30);
 expect(roseGiftPose(1.35).recipientClosed).toBe(false);
 expect(roseGiftPose(1.379).recipientClosed).toBe(false);
 expect(roseGiftPose(1.38).recipientClosed).toBe(true);
 expect(roseGiftPose(1.5).recipientClosed).toBe(true);
 expect(roseGiftPose(1.5).donorOpen).toBe(0);
 expect(roseGiftPose(1.65).recipientClosed).toBe(true);
 expect(roseGiftPose(1.65).donorOpen).toBeGreaterThan(0);
 expect(roseGiftPose(3).donorOpen).toBe(1);expect(roseGiftPose(3).recipientClosed).toBe(true);
});

it('registers both receiving poses to the same wrist projection while the donor still covers the switch',()=>{
 const before=roseGiftPose(1.38-1e-6),after=roseGiftPose(1.38+1e-6);
 expect(before.recipientClosed).toBe(false);expect(after.recipientClosed).toBe(true);
 expect(before.recipientWristWorld).toEqual(after.recipientWristWorld);
 expect(before.recipientTurn).toBe(after.recipientClosedTurn);
 expect(before.recipientForeshorten).toBeCloseTo(after.recipientClosedForeshorten,10);
 expect(before.recipientForeshorten).toBeGreaterThan(0);
 expect(before.recipientForeshorten).toBeLessThan(.4);
 expect(before.donorOpen).toBe(0);expect(after.donorOpen).toBe(0);
 for(const time of [1.6,1.75,1.85,1.95]){
  const p=roseGiftPose(time),previous=roseGiftPose(time-.01);
  expect(p.recipientClosedForeshorten).toBeGreaterThanOrEqual(previous.recipientClosedForeshorten);
  expect(p.recipientClosedForeshorten).toBeLessThanOrEqual(1);
 }
 expect(roseGiftPose(3).recipientClosedForeshorten).toBe(1);
});

it('keeps the received original and localized replay semantics for reduced motion',()=>{
 for(const language of ['ko','es'] as const){
  const html=renderToStaticMarkup(<RoseGiftFinale language={language} reducedMotion pactAccepted/>);
  expect(html).toContain('data-static="true"');
  expect(html).toContain('data-phase="received"');
  expect(html).toMatch(/class="rg-static" src="\/images\/rose-gift\/received.png"/);
  expect(html).toMatch(/type="button" class="rg-replay" disabled=""/);
  expect(html).toContain(language==='ko'?'한 번 더 보기':'Ver otra vez');
  expect(html).toContain(roseGiftClosingLine(language,true,true));
 }
});

it('has continuous flower position and direction at the ownership change in both seek directions',()=>{
 const before=roseGiftPose(1.65-1e-6),contact=roseGiftPose(1.65),after=roseGiftPose(1.65+1e-6);
 expect(before.owner).toBe('donor');expect(contact.owner).toBe('recipient');
 for(const pose of [before,after]){
  expect(Math.hypot(pose.rose.x-contact.rose.x,pose.rose.y-contact.rose.y)).toBeLessThan(.001);
  expect(Math.abs(pose.roseAngle-contact.roseAngle)).toBeLessThan(.001);
 }
});

it('keeps the rose rigidly attached to the carrying hand instead of independently sliding between sprites',()=>{

 for(let frame=0;frame<=180;frame++){
  const pose=roseGiftPose(frame/60),grip=pose.owner==='donor'?pose.donorGrip:{x:pose.recipientGrip.x+pose.stemOffset.x,y:pose.recipientGrip.y+pose.stemOffset.y};
  expect(Math.hypot(pose.rose.x-grip.x,pose.rose.y-grip.y)).toBeCloseTo(0,8);
  expect([pose.donor,pose.elbow,pose.recipient,pose.rose.x,pose.rose.y,pose.roseAngle].every(Number.isFinite)).toBe(true);
 }
 expect(roseGiftPose(-1)).toEqual(roseGiftPose(0));
 expect(roseGiftPose(9)).toEqual(roseGiftPose(3));
 expect(roseGiftPose(3).phase).toBe('received');
});


it('keeps two separate hand contacts on the same rigid stem throughout the hold',()=>{
 for(let frame=144;frame<=204;frame++){
  const p=roseGiftPose(frame/120),separation=Math.hypot(p.donorGrip.x-p.recipientGrip.x,p.donorGrip.y-p.recipientGrip.y);
  expect(separation).toBeGreaterThan(30);expect(separation).toBeLessThan(45);
  expect(Math.hypot(p.rose.x-p.donorGrip.x,p.rose.y-p.donorGrip.y)).toBeLessThan(1e-8);
  expect(Math.hypot(p.rose.x-p.stemOffset.x-p.recipientGrip.x,p.rose.y-p.stemOffset.y-p.recipientGrip.y)).toBeLessThan(1e-8);
 }
});

it('preserves articulated limb lengths and continuous wrists through reach, acceptance and settling',()=>{
 let previous=roseGiftPose(0);
 for(let frame=0;frame<=360;frame++){
  const p=roseGiftPose(frame/120),distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
  expect(distance({x:522,y:620},p.donorElbow)).toBeCloseTo(Math.hypot(13,43),8);
  expect(distance(p.donorElbow,p.donorWrist)).toBeCloseTo(Math.hypot(81,7),8);
  expect(distance(p.recipientElbow,p.recipientWristWorld)).toBeCloseTo(78,8);
  for(const key of ['donorWrist','recipientWristWorld'] as const)expect(distance(p[key],previous[key])).toBeLessThan(3);
  previous=p;
 }
 const final=roseGiftPose(3);
 expect(final.donorWrist.x).toBeCloseTo(616,8);expect(final.donorWrist.y).toBeCloseTo(656,8);
 expect(final.recipientWristWorld).toEqual({x:735,y:610});
});
