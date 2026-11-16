import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { marbleDisplayName, marbleLandmarkAsset } from './marble-world-theme';
describe('world landmark display theme',()=>{
 it('maps old saves without mutating their names and preserves personal cities',()=>{
  const names={ko:'뉴어크',es:'Newark'};
  expect(marbleDisplayName(names,'ko')).toBe('두바이');
  expect(marbleDisplayName(names,'es')).toBe('Dubái');
  expect(names.ko).toBe('뉴어크');
  expect(marbleDisplayName({ko:'광주',es:'Gwangju'},'ko')).toBe('광주');
  expect(marbleDisplayName({ko:'산토도밍고',es:'Santo Domingo'},'es')).toBe('Santo Domingo');
 });
 it('connects exactly the six selected replacement sprites while keeping other art',()=>{
  for(const slug of ['new-york','puerto-plata','san-juan','miami','newark','toronto'])expect(existsSync(`public${marbleLandmarkAsset(slug)}`)).toBe(true);
  expect(marbleLandmarkAsset('gwangju')).toBeUndefined();
  expect(marbleLandmarkAsset('paris')).toBeUndefined();
 });
});
