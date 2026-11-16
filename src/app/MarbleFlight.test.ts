import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {preloadMarblePlane,freshMarbleFlightEvents} from './MarbleFlight';
import manifest from '../../public/images/marble/airline-characters.json';
it('ships only the two approved immutable optimized character planes with provenance',()=>{
 expect(manifest.assets.map(a=>[a.airline,a.character])).toEqual([['asiana','lisbeth'],['jetblue','yeonseok']]);
 for(const asset of manifest.assets){const bytes=readFileSync(new URL(`../../public${asset.path}`,import.meta.url));expect(bytes.length).toBe(asset.bytes);expect(bytes.length).toBeLessThan(180000);expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);expect(asset.path).toContain(asset.sha256.slice(0,12));expect(asset.libraryFileId).toMatch(/^libfile_/);expect(asset.width).toBe(1100);}
});
it('preloads each full scene once, resolving only after image success',async()=>{
 const images:any[]=[];class MockImage {src='';onload?:()=>void;onerror?:()=>void;constructor(){images.push(this);}}vi.stubGlobal('Image',MockImage);
 try{const a=preloadMarblePlane('asiana');expect(preloadMarblePlane('asiana')).toBe(a);const b=preloadMarblePlane('jetblue');expect(images).toHaveLength(2);expect(images[0].src).toBe(manifest.assets[0].path);expect(images[1].src).toBe(manifest.assets[1].path);const done=vi.fn();void a.then(done);await Promise.resolve();expect(done).not.toHaveBeenCalled();images[0].onload();images[1].onerror();expect(await a).toBe(true);expect(await b).toBe(false);}finally{vi.unstubAllGlobals();}
});

it('reduced-motion static scenes accept only fresh contiguous live receipts, never mount/reconnect/hidden catch-up',()=>{
 const event=(sequence:number)=>({sequence,type:'move' as const,source:'train' as const,to:8,actor:'p1'});
 const live=[event(10),event(11),event(12)];expect(freshMarbleFlightEvents(live,10,false)).toEqual(live.slice(1));
 expect(freshMarbleFlightEvents(live,12,false)).toEqual([]);
 expect(freshMarbleFlightEvents(live,1,false)).toEqual([]);
 expect(freshMarbleFlightEvents([event(11),event(13)],10,false)).toEqual([]);
 expect(freshMarbleFlightEvents(live,10,true)).toEqual([]);
 expect(freshMarbleFlightEvents(Array.from({length:13},(_,i)=>event(i+11)),10,false)).toEqual([]);
});
