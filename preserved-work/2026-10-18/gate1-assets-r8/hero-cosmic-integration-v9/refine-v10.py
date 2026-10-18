from pathlib import Path
r=Path('/workspace/yl-folded-playhouse-r8');d=r/'src/landing/cinematic/folded'
s=(d/'floorSupportV9.ts').read_text().replace('height:.62','height:.82').replace('sin:number};','sin:number;progress:number};').replace('return{x:','return{progress,x:')
s=s.replace('out.height=h*w;out.dx=dr*', '''const tBack=Math.max(0,Math.min(1,(z+12)/11.2)),backSmooth=tBack*tBack*(3-2*tBack),opening=Math.max(0,Math.min(1,(shape.progress-.12)/.36)),closed=1-opening*opening*(3-2*opening);
 const drop=-10*(1-backSmooth)*closed,dropZ=tBack>0&&tBack<1?60*tBack*(1-tBack)/11.2*closed:0;
 out.height=(h+drop)*w;out.dx=dr*''')
s=s.replace('out.dy=h*wy;out.dz=dr*','out.dy=(h+drop)*wy;out.dz=dropZ*w+dr*')
(d/'floorSupportV10.ts').write_text(s)
c=(d/'poseSpaceV6.ts').read_text().replace("const keys=[[0,...stable],[.43,...stable]", "const keys=[[0,...stable],[.18,-.35,.4,11.4,.5,-.05,-2],[.43,-1.7,.5,8,1,.6,-20]")
(d/'poseSpaceV10.ts').write_text(c)
s=(d/'previewSpaceV9.ts').read_text().replace("from './floorSupportV9'","from './floorSupportV10'").replace("from './poseSpaceV6'","from './poseSpaceV10'").replace('chamber-r8.cosmic-v9','chamber-r8.cosmic-v10')
s=s.replace("const scene=new T.Scene();scene.background=new T.Color('#100a13');","const scene=new T.Scene();scene.background=new T.Color('#100a13');const foldedHorizon=new T.Plane(new T.Vector3(0,0,1),12);renderer.clippingPlanes=[foldedHorizon];")
s=s.replace('applyRigidPose(portraitRig,portraitStagePose(p));','foldedHorizon.constant=12+388*smoothRange(.08,.43,p);applyRigidPose(portraitRig,portraitStagePose(p));')
s=s.replace('edgeCurve=1.05+','edgeCurve=-.2+').replace('lowered .62m broad smooth field and thin rose-gold inlay','continuous .82m crest; rear floor folds down10m and unrolls into corridor; thin rose-gold inlay')
(d/'previewSpaceV10.ts').write_text(s)
p=r/'src/landing/AcrossHero.tsx';p.write_text(p.read_text().replace('previewSpaceV9','previewSpaceV10'))
t=(d/'floorSupportV9.test.ts').read_text().replace("'./floorSupportV9'","'./floorSupportV10'").replace('support v9','support v10').replace('expect(a.height).toBeGreaterThanOrEqual(0);expect(a.height).toBeLessThanOrEqual(.62);','expect(a.height).toBeGreaterThanOrEqual(-10);expect(a.height).toBeLessThanOrEqual(.82);').replace('[-6,-3,0,2]','[-20,-10,-6,-3,0,2]')
(d/'floorSupportV10.test.ts').write_text(t)
print('V10 continuum refined; original assets and V9 preserved')
