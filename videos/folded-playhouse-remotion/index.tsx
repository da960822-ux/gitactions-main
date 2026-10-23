import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,Composition,continueRender,delayRender,cancelRender,registerRoot,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {createFoldedWorld} from '../../src/landing/cinematic/folded/world';
import {introPose} from '../../src/landing/cinematic/folded/pose';
import {GiftSurfaceEdge} from './GiftSurfaceEdge';
import {GiftSurfaceEdgeV18} from './GiftSurfaceEdgeV18';

export function SharedSceneIntro(){
 const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig(),canvas=useRef<HTMLCanvasElement>(null),world=useRef<ReturnType<typeof createFoldedWorld>|null>(null),current=useRef(frame);
 current.current=frame;
 const [ready,setReady]=useState(false),[handle]=useState(()=>delayRender('Shared Folded Playhouse textures and PBR environment'));
 useEffect(()=>{
  const instance=createFoldedWorld(canvas.current!,{width,height,pixelRatio:1,portrait:staticFile('images/yeonseok-lisbeth-cutout.webp')});world.current=instance;let stopped=false;
  instance.ready.then(()=>{if(stopped)return;instance.render(introPose(current.current/fps));instance.renderer.getContext().finish();setReady(true);continueRender(handle);}).catch(cancelRender);
  return()=>{stopped=true;instance.dispose();world.current=null;};
 },[width,height,fps,handle]);
 useLayoutEffect(()=>{if(!ready||!world.current)return;const wait=delayRender('Render shared scene frame');world.current.render(introPose(frame/fps));world.current.renderer.getContext().finish();continueRender(wait);},[frame,fps,ready]);
 return <AbsoluteFill style={{background:'#100e14'}}><canvas ref={canvas} width={width} height={height} style={{width,height,display:'block'}}/></AbsoluteFill>;
}
const Root=()=> <>
 <Composition id="GiftSurfaceEdgeV18" component={GiftSurfaceEdgeV18} width={512} height={512} fps={30} durationInFrames={96}/>
 <Composition id="GiftSurfaceEdge" component={GiftSurfaceEdge} width={512} height={512} fps={30} durationInFrames={96}/>
 <Composition id="FoldedIntroWide" component={SharedSceneIntro} width={1920} height={1080} fps={30} durationInFrames={96}/>
 <Composition id="FoldedIntroClassic" component={SharedSceneIntro} width={1440} height={900} fps={30} durationInFrames={96}/>
 <Composition id="FoldedIntroTall" component={SharedSceneIntro} width={390} height={498} fps={30} durationInFrames={96}/>
</>;
registerRoot(Root);
