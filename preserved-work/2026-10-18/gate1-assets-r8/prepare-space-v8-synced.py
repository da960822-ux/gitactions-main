from pathlib import Path
R=Path('/workspace/yl-folded-playhouse-r8/src/landing/cinematic/folded');p=R/'previewSpaceV8.ts';s=(R/'previewSpaceV7.ts').read_text().replace("assetVersion:'chamber-r8.space-v7-ssr'","assetVersion:'chamber-r8.space-v8-synced'")
s=s.replace("let renderSerial=0;", "let pendingFrameData:Record<string,string>|null=null;let renderSerial=0;")
s=s.replace("const resetFence=()=>{pendingFence=null;lastSignature='';};", "const resetFence=()=>{pendingFence=null;pendingFrameData=null;lastSignature='';};")
s=s.replace("if(pendingFence){fenceGL.deleteSync(pendingFence);pendingFence=null;}\n });", "if(pendingFence){fenceGL.deleteSync(pendingFence);pendingFence=null;}publishCompletedFrame();\n });")
old="if(disposed)return;const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY].map(n=>n.toFixed(4)).join(',');if(signature===lastSignature)return;if(pendingFence){const status=fenceGL.clientWaitSync(pendingFence,0,0);if(status===fenceGL.TIMEOUT_EXPIRED){skippedWhilePending++;return;}fenceGL.deleteSync(pendingFence);pendingFence=null;}lastSignature=signature;"
new="if(disposed)return;const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY].map(n=>n.toFixed(4)).join(',');if(pendingFence){const status=fenceGL.clientWaitSync(pendingFence,0,0);if(status===fenceGL.TIMEOUT_EXPIRED){skippedWhilePending++;return;}fenceGL.deleteSync(pendingFence);pendingFence=null;publishCompletedFrame();}if(signature===lastSignature)return;lastSignature=signature;"
assert old in s;s=s.replace(old,new)
s=s.replace(' function render(pose:FoldPose){', " function publishCompletedFrame(){if(!pendingFrameData||disposed)return;pendingFrameData.fenceCompletedAtMs=performance.now().toFixed(3);pendingFrameData.initMarks=JSON.stringify(marks);options.onFrame?.(pendingFrameData);pendingFrameData=null;}\n function render(pose:FoldPose){")
s=s.replace('options.onFrame?.({frameSerial:', 'pendingFrameData={frameSerial:').replace("allocationNote:'VRAM and hardware GPU performance not measured'});", "allocationNote:'VRAM and hardware GPU performance not measured'};")
p.write_text(s)
s=Path('/workspace/yl-folded-playhouse-r8/src/landing/AcrossHero.tsx').read_text().replace("'./cinematic/folded/pose'","'./pose'").replace("'./across-hero.css'","'../../across-hero.css'").replace("'./cinematic/folded/previewSpaceV4'","'./previewSpaceV8'")
s=s.replace("if(t>=INTRO_SECONDS-1/60)endIntro();", "if(t>=INTRO_SECONDS-1/60&&Number(screen.dataset.entrance)>=.999)endIntro();")
s=s.replace("const p=pose.progress,exit=", "const p=Number(screen.dataset.progress??0),displayedEntrance=Number(screen.dataset.entrance??0),exit=")
s=s.replace(".42+index*.13,pose.entrance)",".42+index*.13,displayedEntrance)")
(R/'ReviewedHero.tsx').write_text(s)
