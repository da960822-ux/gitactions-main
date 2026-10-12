import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const GiftIntro=()=>{
  const f=useCurrentFrame();const {fps}=useVideoConfig();
  const ease=Easing.bezier(.22,1,.36,1);
  const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const,easing:ease};
  const join=interpolate(f,[.25*fps,1.7*fps],[0,1],clamp);
  const enter=interpolate(f,[2*fps,3.6*fps],[0,1],clamp);
  return <AbsoluteFill style={{background:'#0b2225',overflow:'hidden',color:'#f1f0e4'}}>
    <style>{`@font-face{font-family:DM;src:url('${staticFile('fonts/dm-sans-regular.ttf')}')}@font-face{font-family:Gowun;src:url('${staticFile('fonts/gowun-batang-display.woff2')}')}`}</style>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 24% 60%,#397f8644,transparent 55%),radial-gradient(ellipse at 78% 35%,#c68f4844,transparent 55%)'}}/>
    <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{position:'absolute',inset:0,scale:1+enter*3,opacity:1-enter}}>
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#22444b"/><stop offset=".25" stopColor="#9cdec9"/><stop offset=".34" stopColor="#def6d6"/><stop offset=".4" stopColor="#47807d"/><stop offset=".75" stopColor="#213e3d"/><stop offset=".87" stopColor="#e7ba90"/><stop offset="1" stopColor="#364c49"/></linearGradient>
        <linearGradient id="warm" x1="0" y1="0" x2="1" y2=".6"><stop stopColor="#374f48"/><stop offset=".35" stopColor="#d8ab7c"/><stop offset=".47" stopColor="#fff0c0"/><stop offset=".52" stopColor="#9c7862"/><stop offset=".85" stopColor="#579184"/><stop offset="1" stopColor="#172e31"/></linearGradient>
        <radialGradient id="inner"><stop stopColor="#93b6a0"/><stop offset=".5" stopColor="#4a6c60"/><stop offset="1" stopColor="#102b32"/></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="36"/></filter>
      </defs>
      <ellipse cx="960" cy="815" rx={400+join*80} ry="32" fill="#94cab0" opacity=".18" filter="url(#glow)"/>
      <g style={{translate:`${-130*(1-join)}px 0`,rotate:`${-18*(1-join)}deg`,transformOrigin:'960px 540px'}}>
        <path d="M480 820C240 430 530 90 950 225C1380 365 1515 180 1510 100C1570 300 1440 470 1185 394C590 214 466 462 570 740Z" fill="url(#glass)"/>
        <path d="M480 820C240 430 530 90 950 225C1380 365 1515 180 1510 100" fill="none" stroke="#c7f2d8" strokeWidth="2" opacity=".65"/>
      </g>
      <g style={{translate:`${130*(1-join)}px 0`,rotate:`${22*(1-join)}deg`,transformOrigin:'960px 540px'}}>
        <path d="M380 910C580 580 910 810 1180 720C1550 596 1540 194 1450 130C1720 280 1670 700 1310 827C965 950 715 729 500 1000Z" fill="url(#warm)"/>
        <path d="M380 910C580 580 910 810 1180 720C1550 596 1540 194 1450 130" fill="none" stroke="#f4d7ac" strokeWidth="2" opacity=".7"/>
      </g>
      <rect x="685" y="300" width="550" height="420" rx="110" fill="url(#inner)" opacity={join*.6}/>
    </svg>
    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:interpolate(f,[.4*fps,.9*fps,2.2*fps,2.7*fps],[0,1,1,0],clamp),translate:`0 ${interpolate(f,[.4*fps,1.4*fps],[40,0],clamp)}px`,scale:1+enter*.5}}>
      <p style={{fontFamily:'DM',fontSize:18,letterSpacing:'5px',margin:'0 0 36px'}}>YEONSEOK ♡ LISBETH</p>
      <h1 style={{fontFamily:'Gowun,Georgia,serif',fontWeight:400,fontStyle:'italic',fontSize:126,letterSpacing:'-8px',margin:0}}>Para ti, Baby.</h1>
      <p style={{fontFamily:'DM',fontSize:20,letterSpacing:'2px',margin:'34px 0 0'}}>A LITTLE WORLD, JUST FOR US.</p>
    </div>
    <Img src={staticFile('images/yeonseok-lisbeth-cutout.webp')} style={{position:'absolute',height:780,width:780,objectFit:'contain',right:160,bottom:80,opacity:interpolate(f,[2.75*fps,3.35*fps],[0,.8],clamp),scale:interpolate(f,[2.6*fps,3.6*fps],[.75,1],clamp)}}/>
    <AbsoluteFill style={{background:'#0b2225',opacity:interpolate(f,[3.15*fps,3.6*fps],[0,1],clamp)}}/>
  </AbsoluteFill>;
};
