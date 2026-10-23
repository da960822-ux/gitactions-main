from pathlib import Path
R=Path('/workspace/yl-folded-playhouse-r7');p=R/'scripts/build-folded-chamber.py';s=p.read_text();assert "VERSION='chamber-v6.1'"in s
s=s.replace('gate1-assets-r6','gate1-assets-r7').replace('folded-chamber-v6','folded-chamber-v7').replace('chamber-v6.1','chamber-v7.0')
s=s.replace('nx=x+5.5*front','nx=x+18*front')
s=s.replace("  else:nx=x;ny=y;nz=z\n  key.data", "  elif kind=='wing' and any(g.group==o.vertex_groups['QuietWing'].index and g.weight>.5 for g in v.groups):\n   a=math.radians(15);dx=x+3;dz=z+21;nx=-3+dx*math.cos(a)-dz*math.sin(a)-17;ny=y;nz=-21+dx*math.sin(a)+dz*math.cos(a)+1.5\n  else:nx=x;ny=y;nz=z\n  key.data")
s=s.replace("y-(.18 if kind=='rail'else 0)","y")
s=s.replace("def set_pose(p):\n w=smooth(.15,.85,p)","def set_pose(p):\n w=smooth(.08,.43,p)")
s=s.replace("key_blocks['Space_Unfold'].value=w;", "key_blocks['Space_Unfold'].value=smooth(.55,.85,p) if o.get('motionGroup')=='rail' else w;")
s=s.replace(" o.shape_key_add(name='Basis');", " o['motionGroup']=kind;o.shape_key_add(name='Basis');")
s=s.replace('if v<.28:y=-3.35','if v<.28:y=-3.43').replace('y=-3.35+3*(1-math.cos(a))','y=-3.43+3*(1-math.cos(a))').replace('else:y=-.35+(v-.52)','else:y=-.43+(v-.52)')
s=s.replace('z-=2.0*math.sin(u*math.pi/2);return x,y,z','z-=2.0*math.sin(u*math.pi/2);z+=1.1*math.sin(u*math.pi)*smooth(-2,2,y)*(1-.45*smooth(6,12,y));return x,y,z')
s=s.replace("shell_o=grid('Shared_Sculpted_Cove',shell,104,100,ivory,.22);add_keys(shell_o,'shell')", "shell_o=grid('Shared_Sculpted_Cove',shell,104,100,ivory,.22);shell_o.data.materials.append(floor)\n for poly in shell_o.data.polygons:\n  x,y,z=U(poly.center)\n  if z>-3.1 and y<-3.2:poly.material_index=1\n add_keys(shell_o,'shell')")
s=s.replace(" floor_o=grid("," wing_group=quiet.vertex_groups.new(name='QuietWing');wing_group.add(list(range(len(quiet.data.vertices))),1,'REPLACE')\n floor_o=grid(")
s=s.replace('12-v*58','12-v*72').replace('cy=-3.02-fade','cy=-3.23-fade').replace('cy+.78*math.sin(a),cz+.62*math.cos(a)','cy+.40*math.sin(a),cz+.38*math.cos(a)')
a=s.index(' # The same roof sheet');b=s.index(' # Open gold inlay',a)
s=s[:a]+''' # One continuous roof connects foreground canopy to the deep destination.
 def roof(u,v):return -8+15*u+6*smooth(.35,1,v),5.7+.8*math.sin(u*math.pi)-.35*math.sin(v*math.pi)+.8*smooth(.45,1,v),-1-45*v
 def exposed(fn,u,v):
  du=V(fn(min(1,u+.0001),v))-V(fn(max(0,u-.0001),v));dv=V(fn(u,min(1,v+.0001)))-V(fn(u,max(0,v-.0001)));normal=du.cross(dv).normalized();return U(V(fn(u,v))+normal*.125)
 canopy=grid('Shared_Unfolding_Canopy',roof,96,144,ivory,.16)
 canopy_seam=tube('Roof_Integrated_Warm_Seam',[exposed(roof,.78,.12+i/240*.82)for i in range(241)],.032,warm)
 active(canopy);canopy_seam.select_set(True);bpy.ops.object.join();canopy=bpy.context.object;add_keys(canopy,'canopy')
 # The cool path is a low step rooted in the common floor, rather than an isolated arch.
 def step(u,v):
  x=6.6+1.3*math.sin(u*math.pi)-9*smooth(.6,1,u)+(v-.5)*(4+1.5*math.sin(u*math.pi));y=-3.32+.45*smooth(.05,.35,u)+.10*math.sin(v*math.pi);return x,y,-16-26*u
 step_o=grid('Connected_Cool_Floor_Step',step,120,28,cool,.15)
 step_seam=tube('Floor_Step_Integrated_Cool_Seam',[exposed(step,i/240,.08)for i in range(241)],.03,ice)
 # The rear wall has a real opening to a deeper side alcove, with a slot in its roof.
 rear_left=grid('Rear_Left_Pier',lambda u,v:(-18+8*u,-3.35+14*v,-45-.5*math.sin(v*math.pi)),40,64,cool,.2)
 rear_right=grid('Rear_Right_Pier',lambda u,v:(-2+18*u,-3.35+14*v,-45-1.3*math.sin(u*math.pi)),70,64,cool,.2)
 lintel=grid('Alcove_Entrance_Lintel',lambda u,v:(-10+8*u,5.8+4.85*v,-45),40,24,cool,.2)
 alcove_left=grid('Alcove_Left_Cove',lambda u,v:(-10-.6*math.sin(v*math.pi),-2.87+8.67*v,-35-21*u),72,40,cool,.18)
 alcove_right=grid('Alcove_Right_Cove',lambda u,v:(-2+.6*math.sin(v*math.pi),-2.87+8.67*v,-35-21*u),72,40,cool,.18)
 alcove_back=grid('Alcove_Back_Cove',lambda u,v:(-10+8*u,-2.87+8.67*v,-56-.6*math.sin(u*math.pi)),40,40,cool,.18)
 alcove_floor=grid('Alcove_Connected_Floor',lambda u,v:(-10+8*u,-2.87,-35-21*v),40,72,cool,.15)
 roof_front=grid('Alcove_Roof_Front',lambda u,v:(-10+8*u,5.8,-35-7*v),40,30,cool,.18)
 roof_back=grid('Alcove_Roof_Back',lambda u,v:(-10+8*u,5.8,-46-10*v),40,40,cool,.18)
 sky=grid('Alcove_Sky_Opening',lambda u,v:(-10+8*u,6.6,-42-4*v),20,12,ice)
 room_parts=[quiet,floor_o,rear_left,rear_right,lintel,step_o,step_seam,alcove_left,alcove_right,alcove_back,alcove_floor,roof_front,roof_back,sky]
''' +s[b:]
s=s.replace('bank(i/240,.91)','bank(i/240,.25)')
s=s.replace("card('Warm portrait rim',(12,6,2),(2,0,0),7,(3,5)","card('Warm portrait rim',(12,3,0),(3,2,-7),10,(2,7)")
s=s.replace('static=[quiet,floor_o,rear,r1,r2,seam1,seam2]','static=room_parts')
s=s.replace("room.name='Shared_Light_Chamber';receivers.append", "room.name='Shared_Light_Chamber';add_keys(room,'wing');receivers.append")
s=s.replace('[0,.65,1]','[0,.43,1]')
s=s.replace("[('hero',(1,.7,1),0),('arrival',(-1,1,-22),1)]", "[('hero',(1,.7,1),0),('arrival',(3,1,-25),1),('wine',(-10,-2.7,-5),0),('wine-arrival',(-22,-2.7,-20),1)]")
p.write_text(s)
p=R/'scripts/denoise-chamber-lightmaps.py';p.write_text(p.read_text().replace('gate1-assets-r6','gate1-assets-r7').replace('folded-chamber-v6','folded-chamber-v7').replace('chamber-v6.1','chamber-v7.0'))
p=R/'src/landing/cinematic/folded/pose.ts';s=p.read_text();a=s.index(' const keys=mobile');b=s.index('\n const i=',a)
s=s[:a]+''' const stable=mobile?[1.3,.25,12.1,1.35,-.1,0]:[0,.3,11.7,.3,-.05,0];
 const keys=[[0,...stable],[.43,...stable],[.5,-2.1,.5,6,3.2,1,-23],[.6,-2.1,.55,-.5,4,1,-25],[.65,-1.7,.6,-2.2,4.5,1,-25],[.85,.8,.8,-7,5.2,1,-28],[1,1.8,.8,-10.5,5.5,1,-32]];''' +s[b:]
s+='\nexport function surfaceWeights(p:number){return{aperture:smoothRange(.08,.43,p),rail:smoothRange(.55,.85,p)};}\n';p.write_text(s)
p=R/'src/landing/cinematic/folded/pose.test.ts';s=p.read_text().replace('INTRO_SECONDS}', 'INTRO_SECONDS,surfaceWeights}').replace('[.2,.35,.5,.65,.85]','[.43,.5,.6,.65,.85]');s=s.replace(" it('uses the exact stable pose", " it('opens the architectural passage fully before camera advancement',()=>{\n  for(const mobile of[false,true])for(const p of[0,.08,.2,.43])expect(cameraPose(p,1,mobile)).toEqual(cameraPose(0,1,mobile));\n  expect(surfaceWeights(.43)).toEqual({aperture:1,rail:0});expect(surfaceWeights(1)).toEqual({aperture:1,rail:1});\n });\n it('uses the exact stable pose");p.write_text(s)
print('R7_GEOMETRY_POSE_WRITTEN')
