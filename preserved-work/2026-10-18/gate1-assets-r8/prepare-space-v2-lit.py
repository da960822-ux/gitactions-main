from pathlib import Path
P=Path('/workspace/gate1-assets-r8');s=(P/'author-space-v2.py').read_text()
s=s.replace("OUT=P/'space-v2-model'","OUT=P/'space-v2-lit-model'").replace('chamber-space-v2.blend','chamber-space-v2-lit.blend').replace('geometry-space-v2','geometry-space-v2-lit').replace('chamber-r8.space-v2','chamber-r8.space-v2-lit')
s=s.replace("wellmat=material('Warm lightwell mineral emitter',(1,.58,.31),.5,emission=2.8)","wellmat=material('Warm lightwell mineral emitter',(1,.58,.31),.5,emission=12)")
s=s.replace("well['runtime']=True;", "well.data.materials[0]=ivory;well['runtime']=True;")
s=s.replace("reveal=grid(name,fn,32,8,ivory,.14)","reveal=grid(name,fn,32,8,wellmat if name=='Lightwell far reveal' else ivory,.14)")
s=s.replace("card('Warm far continuation source',(center(108)+2,5,-108),(center(90),1,-90),14,(3,5),(1,.58,.30))","card('Warm far continuation source',(center(100)-3,4,-100),(center(120)+5,2,-120),14,(3,5),(1,.52,.48))")
a=s.index("well['rect_area_position']=");b=s.index('# Geometry diagnostics',a)
s=s[:a]+'''emitter=next(r for r in reveals if r.name=='Lightwell far reveal')
+depth=1+139*v1;at=fold((u0+u1)/2,v1);emitter['rect_area_position']=[at[0]-.85,at[1],at[2]+.08];emitter['rect_area_target']=[center(depth-15)+2,1,-depth+15];emitter['rect_area_size']=[1.7,4];emitter['rect_area_power']=12;emitter['rect_area_color']=[1,.58,.31]
+'''.replace('\n+','\n')+s[b:]
(P/'author-space-v2-lit.py').write_text(s);compile(s,'space-v2-lit','exec')
s=(P/'space-v2-probes.py').read_text().replace('space-v2-model','space-v2-lit-model').replace('chamber-space-v2.blend','chamber-space-v2-lit.blend').replace('space-v2-probes.json','space-v2-lit-probes.json');(P/'space-v2-lit-probes.py').write_text(s)
