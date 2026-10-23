from pathlib import Path
P=Path('/workspace/gate1-assets-r8');s=(P/'author-space-v3.py').read_text().replace('space-v3-model','space-v4-model').replace('chamber-space-v3.blend','chamber-space-v4.blend').replace('geometry-space-v3','geometry-space-v4').replace('chamber-r8.space-v3','chamber-r8.space-v4')
s=s.replace('depth=1+139*v;w,f,h,r=profile(depth);x,y=c_profile(u,w,f,h,r);return center(depth)+x,y,-depth','depth=1+139*v-11*(1-smooth(0,.12,v))*(1-smooth(.29,.43,u));w,f,h,r=profile(depth);x,y=c_profile(u,w,f,h,r);return center(depth)+x,y,-depth')
s=s.replace('depth=1+139*u;w,f,h,r=profile(depth);right=center(depth)+w/2','depth=1+139*u-11*(1-smooth(0,.12,u))*(1-smooth(.02,.25,v));w,f,h,r=profile(depth);right=center(depth)+w/2')
s=s.replace("stage_trim=stage_box('Portrait_Stage_Rose_Gold_Edge',(1.85,-2.86,.05),(6.46,.035,2.76),gold,.016)",'''# A closed edge inlay, not a full metal plate covering the stage deck.
+curve=bpy.data.curves.new('Closed stage rose-gold edge','CURVE');curve.dimensions='3D';curve.bevel_depth=.018;curve.bevel_resolution=3;spline=curve.splines.new('POLY');pts=[]
+for cx,cz,start in [(3.05,1.18,0),(-3.05,1.18,90),(-3.05,-1.18,180),(3.05,-1.18,270)]:
+ for k in range(12):
+  a=math.radians(start+k/12*90);pts.append((1.85+cx+.16*math.cos(a),-2.85,.05+cz+.16*math.sin(a)))
+spline.points.add(len(pts)-1)
+for point,position in zip(spline.points,pts):point.co=(*V(position),1)
+spline.use_cyclic_u=True;stage_trim=bpy.data.objects.new('Portrait_Stage_Rose_Gold_Edge',curve);s.collection.objects.link(stage_trim);active(stage_trim);bpy.ops.object.convert(target='MESH');stage_trim=bpy.context.object;stage_trim.data.materials.append(gold);stage_trim['runtime']=True;stage_trim['portraitStage']=True;stage_trim['previewUnbaked']=True;stage_trim['lightmapStem']='portrait-stage-preview';stage_trim['motionGroup']='portrait-stage';uv(stage_trim)'''.replace('\n+','\n'))
(P/'author-space-v4.py').write_text(s);compile(s,'space-v4-author','exec')
s=(P/'space-v3-probes.py').read_text().replace('space-v3-model','space-v4-model').replace('chamber-space-v3.blend','chamber-space-v4.blend').replace('space-v3-probes.json','space-v4-probes.json');(P/'space-v4-probes.py').write_text(s)
