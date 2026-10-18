from pathlib import Path
s=Path('/workspace/gate1-assets-r8/author-preview.py').read_text()
s=s.replace("OUT=R/'public/models/folded-chamber-r8-preview'","OUT=P/'space-v2-model'")
s=s.replace("('Deep burgundy mineral'in m.name or'Satin graphite stone'in m.name)","('Deep burgundy mineral'in m.name)").replace('assert len(ret.data.vertices)>20000','assert len(ret.data.vertices)>10000')
s=s.replace("gold=bpy.data.materials['Soft rose gold'];", "gold=bpy.data.materials['Soft rose gold'];graphite=next(m for m in bpy.data.materials if'Satin graphite stone'in m.name);")
a=s.index('def center(depth):');b=s.index('# Cut the lightwell aperture',a)
s=s[:a]+'''def center(depth):
 return -1-8*smooth(30,98,depth)-.020*max(0,depth-98)**2

def profile(depth):
 return 15-1.2*smooth(30,110,depth),-3.41,7.3+.7*math.sin(smooth(15,110,depth)*math.pi),2.25

def fold(u,v):
 depth=1+139*v;w,f,h,r=profile(depth);x,y=c_profile(u,w,f,h,r);return center(depth)+x,y,-depth

''' +s[b:]
s=s.replace('N,M=160,208','N,M=96,180').replace('if 77<=i<95 and 147<=j<168:continue','if 44<=i<54 and 80<=j<101:continue')
s=s.replace('can.data.materials.append(ivory)','can.data.materials.append(ivory);can.data.materials.append(graphite)')
s=s.replace('for f in mesh.polygons:f.use_smooth=True','for f in mesh.polygons:\n f.use_smooth=True;f.material_index=1 if (f.index%(N)<int(N*.30)) else 0')
# Face material assignment uses the parameter of the actual face, accounting for the opening.
s=s.replace('faces=[]\nfor j', 'faces=[];face_u=[]\nfor j')
s=s.replace('faces.append((a,a+N+1,a+N+2,a+1))','faces.append((a,a+N+1,a+N+2,a+1));face_u.append((i+.5)/N)')
s=s.replace('(f.index%(N)<int(N*.30))','(face_u[f.index]<.30)')
s=s.replace("[inside(fold,.975,.13+i/240*.8)for i in range(241)]","[inside(fold,.685,.06+i/240*.87)for i in range(241)]")
s=s.replace("[inside(fold,.88,.15+i/260*.68)for i in range(261)]","[inside(fold,.105,.07+i/260*.85)for i in range(261)]")
a=s.index('for i,v in enumerate(can.data.vertices):');b=s.index('uv(can)',a)
s=s[:a]+'''for i,v in enumerate(can.data.vertices):
 x,y,z=U(v.co);w=smooth(-30,-2,z)*smooth(1.5,6.5,y);opened.data[i].co=V((x+.45*w,y+1.5*w,z));entry.data[i].co=V((x,y,z+.25))
''' +s[b:]
a=s.index('def return_cove(');b=s.index('# The physical warm emitter',a)
s=s[:a]+'''def return_cove(u,v):
 depth=1+139*u;w,f,h,r=profile(depth);right=center(depth)+w/2
 if v<.25:
  a=v/.25*math.pi/2;x=right+math.sin(a);y=f+1-math.cos(a)
 elif v<.75:x=right+1;y=f+1+(h-f-2)*(v-.25)/.5
 else:
  a=(v-.75)/.25*math.pi/2;x=right+math.cos(a);y=h-1+math.sin(a)
 return x,y,-depth
return_o=grid('Deep_Burgundy_Continuous_Return',return_cove,180,48,wine,.18);return_o['runtime']=True;return_o['lightmapStem']='destination-preview';return_o['previewUnbaked']=True;return_o['motionGroup']='canopy';uv(return_o)
return_o.shape_key_add(name='Basis');opened_return=return_o.shape_key_add(name='Space_Unfold');entry_return=return_o.shape_key_add(name='Gift_Entry')
for i,v in enumerate(return_o.data.vertices):
 x,y,z=U(v.co);weight=smooth(-30,-2,z)*smooth(1.5,6.5,y);opened_return.data[i].co=V((x+.45*weight,y+1.5*weight,z));entry_return.data[i].co=V((x,y,z+.25))
''' +s[b:]
a=s.index('well=grid(');b=s.index('# Remove the distant',a)
s=s[:a]+'''# Recess follows the same curved surface parameters and has four finished reveals.
u0,u1=44/N,54/N;v0,v1=80/M,101/M
well=grid('Warm_Recessed_Lightwell',lambda u,v:(fold(u0+(u1-u0)*v,v0+(v1-v0)*u)[0]-1.7,fold(u0+(u1-u0)*v,v0+(v1-v0)*u)[1],fold(u0+(u1-u0)*v,v0+(v1-v0)*u)[2]),32,24,wellmat,.12);well['runtime']=True;well['previewUnbaked']=True;well['lightmapStem']='destination-preview';uv(well)
reveals=[]
for name,fn in [
 ('Lightwell lower reveal',lambda u,v:(fold(u0,v0+(v1-v0)*u)[0]-1.7*v,fold(u0,v0+(v1-v0)*u)[1],fold(u0,v0+(v1-v0)*u)[2])),
 ('Lightwell upper reveal',lambda u,v:(fold(u1,v0+(v1-v0)*u)[0]-1.7*v,fold(u1,v0+(v1-v0)*u)[1],fold(u1,v0+(v1-v0)*u)[2])),
 ('Lightwell near reveal',lambda u,v:(fold(u0+(u1-u0)*u,v0)[0]-1.7*v,fold(u0+(u1-u0)*u,v0)[1],fold(u0+(u1-u0)*u,v0)[2])),
 ('Lightwell far reveal',lambda u,v:(fold(u0+(u1-u0)*u,v1)[0]-1.7*v,fold(u0+(u1-u0)*u,v1)[1],fold(u0+(u1-u0)*u,v1)[2]))]:
 reveal=grid(name,fn,32,8,ivory,.14);reveal['runtime']=True;reveal['previewUnbaked']=True;reveal['lightmapStem']='destination-preview';uv(reveal);reveals.append(reveal)
''' +s[b:]
a=s.index("card('Warm destination grazing source'");b=s.index('# Geometry diagnostics',a)
s=s[:a]+'''# Expose the unchanged Hero source parameters for matching live area lights.
for name,at,target,power,size,color in [
 ('Warm portrait softbox',(-3.5,6.5,6),(2,0,-2),12,(7,5),(1,.86,.71)),
 ('Warm portrait rim',(12,3,0),(3,2,-7),10,(2,7),(1,.58,.40))]:
 source=bpy.data.objects[name];source['rect_area_position']=list(at);source['rect_area_target']=list(target);source['rect_area_power']=power;source['rect_area_size']=list(size);source['rect_area_color']=list(color)
card('Warm destination grazing source',(center(35)-4,5,-35),(center(40)+2,1,-40),9,(3,6),(1,.72,.48))
card('Cool quiet depth source',(center(45)+7,5,-45),(center(52)-3,1,-52),5,(4,5),(.45,.61,.85))
card('Warm far continuation source',(center(108)+2,5,-108),(center(90),1,-90),14,(3,5),(1,.58,.30))
# The live analytic well light is a proxy for this exact visible emitter.
well['rect_area_position']=[center(70)-profile(70)[0]/2-1.6,2,-70];well['rect_area_target']=[center(70)+2,1,-70];well['rect_area_size']=[16,4];well['rect_area_power']=2.8;well['rect_area_color']=[1,.58,.31]
''' +s[b:]
s=s.replace('for o in [can,return_o,well]:','for o in [can,return_o,well,*reveals]:')
s=s.replace('geometry-checks-current.json','geometry-space-v2-checks.json').replace('chamber-preview-failed.blend','chamber-space-v2-failed.blend').replace('chamber-preview.blend','chamber-space-v2.blend').replace('geometry-preview.json','geometry-space-v2.json')
s=s.replace("s['assetVersion']='chamber-r8.preview'","s['assetVersion']='chamber-r8.space-v2'").replace("'version':'chamber-r8.preview'","'version':'chamber-r8.space-v2'")
s=s.replace("'R7 room UV0, normal and GI are retained for unchanged wine/floor only'","'R7 room UV0, normal and GI retained only for unchanged wine wing; new continuous floor is unbaked'")
# New source retains only the wine wing, with no coplanar legacy floor.
s=s.replace('Original Hero source and original R7 UV retained for wine/floor','Original Hero source and original R7 UV retained for wine wing')
Path('/workspace/gate1-assets-r8/author-space-v2.py').write_text(s)
compile(s,'space-v2-author','exec')
print('EXTERNAL_SPACE_V2_AUTHOR_READY; no model export or product file edit yet')
