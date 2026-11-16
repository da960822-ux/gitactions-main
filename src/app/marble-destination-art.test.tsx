import {MarbleCardDecision} from "./MarbleCardDecision";
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {expect,it} from 'vitest';
import sharp from 'sharp';
import manifest from '../../public/images/marble/destination-characters.json';
import {marbleDestinationImage,marbleSpecialDestinationImage} from './marble-destination-art';
import {MarblePropertyArt} from './MarblePropertyArt';
import {MarbleCityTile} from './MarbleCityTile';
import {worldGoldenKeyBoard} from '../games/marbleWorldIslands';

it('uses eight approved complete, alpha-preserving, content-addressed scenes',async()=>{
 expect(manifest.assets).toHaveLength(8);
 for(const asset of manifest.assets){
  const bytes=readFileSync(`public${asset.path}`),meta=await sharp(bytes).metadata();
  expect(asset.path).toContain(createHash('sha256').update(bytes).digest('hex').slice(0,12));
  expect([meta.width,meta.height,meta.hasAlpha]).toEqual([asset.width,asset.height,true]);
  expect(Math.max(meta.width!,meta.height!)).toBe(768);
  expect(bytes.length).toBeLessThan(300000);
  expect(marbleDestinationImage(asset.name)).toBe(asset.path);
 }
});
it('renders each destination on the shared two/four-player tile and tourism panels',()=>{
 for(const [index,tile] of worldGoldenKeyBoard.entries()){
  if(!['tourism','festival-site','island'].includes(tile.kind))continue;
  const asset=tile.kind==='tourism'?marbleDestinationImage(tile.name.ko):marbleSpecialDestinationImage(tile.kind)!;
  const html=renderToStaticMarkup(createElement(MarbleCityTile,{tile,index,tileCount:32,position:[1,2],language:'ko',routeVersion:5,modern:true,selected:false,pending:false,changed:false,atSeats:[],movingSeat:null,playerId:'p1',pawnForSeat:()=> 'fox' as const,seatLabel:()=> 'P1',onInspect:()=>{}}));
  expect(html).toContain(asset);
  if(tile.kind==='tourism')expect(renderToStaticMarkup(createElement(MarblePropertyArt,{city:`tourism:${tile.name.ko}`,buildings:[],landmark:false}))).toContain(asset);
 }
 expect(manifest.assets.some(a=>a.slug.includes('bora'))).toBe(false);
});

it('uses festival dance art only for festival-square selection and confirmation',()=>{
 const props={id:'city-festival' as const,tile:{kind:'property',name:{ko:'서울',es:'Seúl'},owner:'p1',rent:100},actor:'p1',choices:[],owner:'P1',language:'ko' as const,disabled:false,onChoose:()=>{},onConfirm:()=>{}};
 const choice={action:{type:'choose-event-city',payload:{tile:31}},label:{ko:'서울',es:'Seúl'}};
 for(const selected of [undefined,choice]){
  const html=renderToStaticMarkup(createElement(MarbleCardDecision,{...props,source:'festival-site',choice:selected}));
  expect(html).toContain(marbleDestinationImage('festival-site'));
 }
 expect(renderToStaticMarkup(createElement(MarbleCardDecision,props))).not.toContain(marbleDestinationImage('festival-site'));
});
