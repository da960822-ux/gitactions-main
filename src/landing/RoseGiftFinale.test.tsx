import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {RoseGiftFinale,roseGiftClosingLine,roseGiftPose} from '../../post-hero-preview/src/RoseGiftFinale';

it('uses the playful lifetime-partner line only after receiving and an actual pact answer',()=>{
 for(const language of ['ko','es'] as const){
  const normal=roseGiftClosingLine(language,true,false);
  expect(roseGiftClosingLine(language,false,true)).toBe(normal);
  expect(roseGiftClosingLine(language,true,true)).toContain(language==='ko'?'사인했으니까':'Ya firmaste');
  expect(normal).not.toContain(language==='ko'?'사인했으니까':'Ya firmaste');
 }
});

it('renders one live layered cutout and preserves semantics, loading and the approved static fallback',()=>{
 const html=renderToStaticMarkup(<RoseGiftFinale language="es" pactAccepted/>);
 expect(html).toContain('aria-labelledby="rose-gift-title"');
 expect(html).toContain('role="img"');
 expect(html).toContain('Yeonseok le ofrece una rosa roja a Lisbeth');
 for(const asset of ['received','offer','body-clean','rose-single'])expect(html).toContain(`/images/rose-gift/${asset}.png`);
 for(const retired of ['contact.png','rg-pose'])expect(html).not.toContain(retired);
 expect(html.match(/data-flower-instance="single"/g)).toHaveLength(1);
 expect(html).toContain('data-rig="registered-cutout"');
 expect(html).toContain('data-rg-joint="donor-elbow-back"');
 expect(html).toContain('data-rg-joint="recipient-hand"');
 expect(html).toContain('data-rg-joint="donor-grip"');
 expect(html).toContain('data-rg-joint="recipient-reach"');
 expect(html).toMatch(/class="rg-replay" disabled=""/);
 expect(html).not.toContain('Ya firmaste');
 expect(html).not.toContain('<canvas');
});

it('closes the receiving fingers before the donor releases while preserving the same articulated wrists',()=>{
 expect(roseGiftPose(0).donorRelease).toBe(0);
 expect(roseGiftPose(0).recipientClose).toBe(0);
 expect(roseGiftPose(1.5).recipientClose).toBeGreaterThan(.9);
 expect(roseGiftPose(1.5).donorRelease).toBe(0);
 expect(roseGiftPose(1.94).donorRelease).toBe(1);
 expect(roseGiftPose(3).recipientClose).toBe(1);
});

it('has continuous flower position and direction at the ownership change in both seek directions',()=>{
 const before=roseGiftPose(1.5-1e-6),contact=roseGiftPose(1.5),after=roseGiftPose(1.5+1e-6);
 expect(before.owner).toBe('donor');expect(contact.owner).toBe('recipient');
 for(const pose of [before,after]){
  expect(Math.hypot(pose.rose.x-contact.rose.x,pose.rose.y-contact.rose.y)).toBeLessThan(.001);
  expect(Math.abs(pose.roseAngle-contact.roseAngle)).toBeLessThan(.001);
 }
});

it('keeps the rose rigidly attached to the carrying hand instead of independently sliding between sprites',()=>{
 const contact=roseGiftPose(1.5),recipientOffset=Math.hypot(contact.rose.x-contact.recipientGrip.x,contact.rose.y-contact.recipientGrip.y);
 for(let frame=0;frame<=180;frame++){
  const pose=roseGiftPose(frame/60),grip=pose.owner==='donor'?pose.donorGrip:pose.recipientGrip;
  expect(Math.hypot(pose.rose.x-grip.x,pose.rose.y-grip.y)).toBeCloseTo(pose.owner==='donor'?13.3:recipientOffset,8);
  expect([pose.donor,pose.elbow,pose.wrist,pose.recipient,pose.recipientWrist,pose.rose.x,pose.rose.y,pose.roseAngle].every(Number.isFinite)).toBe(true);
 }
 expect(roseGiftPose(-1)).toEqual(roseGiftPose(0));
 expect(roseGiftPose(9)).toEqual(roseGiftPose(3));
 expect(roseGiftPose(3).phase).toBe('received');
});
