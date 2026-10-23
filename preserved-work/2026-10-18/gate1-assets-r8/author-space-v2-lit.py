"""R8 geometry review source only. No bake, package change or original R7 overwrite."""
import bpy,bmesh,math,json,hashlib
from pathlib import Path
from mathutils import Vector
P=Path('/workspace/gate1-assets-r8');R=Path('/workspace/yl-folded-playhouse-r8');OUT=P/'space-v2-lit-model';OUT.mkdir(parents=True,exist_ok=True)
G=Path('/workspace/yl-folded-playhouse-r7/scripts/build-folded-chamber.py');ns={'__file__':str(G)};exec(G.read_text().split('\nstage=sys.argv')[0],ns)
V,U,active,material,grid,uv=map(ns.get,['V','U','active','material','grid','uv']);smooth=ns['smooth'];bpy.ops.wm.open_mainfile(filepath='/workspace/gate1-assets-r7/chamber.blend');s=bpy.context.scene
old=bpy.data.objects['Shared_Light_Chamber'];ret=old.copy();ret.data=old.data.copy();s.collection.objects.link(ret);ret.name='Retained_Hero_Wing_And_Floor';ret.data.name='Retained_Original_UV_Wing_And_Floor';active(ret)
keep=[i for i,m in enumerate(ret.data.materials)if m and ('Deep burgundy mineral'in m.name)]
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.mesh.select_mode(type='FACE');bm=bmesh.from_edit_mesh(ret.data)
for f in bm.faces:f.select_set(f.material_index not in keep)
bmesh.update_edit_mesh(ret.data);bpy.ops.mesh.delete(type='FACE');bpy.ops.object.mode_set(mode='OBJECT');assert len(ret.data.vertices)>10000;assert all(len(k.data)==len(ret.data.vertices)for k in ret.data.shape_keys.key_blocks);ret['preview_preserved_uv']='R7 room UV0, normal and GI retained only for unchanged wine wing; new continuous floor is unbaked';bpy.data.objects.remove(old,do_unlink=True)
oldcan=bpy.data.objects['Shared_Unfolding_Canopy'];ivory=oldcan.data.materials[0];warm=oldcan.data.materials[1];wine=next(m for m in ret.data.materials if m and'Deep burgundy'in m.name);gold=bpy.data.materials['Soft rose gold'];graphite=next(m for m in bpy.data.materials if'Satin graphite stone'in m.name);bpy.data.objects.remove(oldcan,do_unlink=True)
def c_profile(t,width,floor,ceiling,radius):
 left=-width/2;right=width/2;flat=width-radius;arc=math.pi*radius/2;wall=ceiling-floor-2*radius;d=t*(2*flat+2*arc+wall)
 if d<flat:return right-d,floor
 d-=flat
 if d<arc:
  a=-math.pi/2-d/radius;return left+radius+radius*math.cos(a),floor+radius+radius*math.sin(a)
 d-=arc
 if d<wall:return left,floor+radius+d
 d-=wall
 if d<arc:
  a=math.pi-d/radius;return left+radius+radius*math.cos(a),ceiling-radius+radius*math.sin(a)
 return left+radius+(d-arc),ceiling

def center(depth):
 return -1-8*smooth(30,98,depth)-.020*max(0,depth-98)**2

def profile(depth):
 return 15-1.2*smooth(30,110,depth),-3.41,7.3+.7*math.sin(smooth(15,110,depth)*math.pi),2.25

def fold(u,v):
 depth=1+139*v;w,f,h,r=profile(depth);x,y=c_profile(u,w,f,h,r);return center(depth)+x,y,-depth

# Cut the lightwell aperture in the unthickened surface; solidify and bevel afterwards.
N,M=96,180;vertices=[V(fold(i/N,j/M))for j in range(M+1)for i in range(N+1)];faces=[];face_u=[]
for j in range(M):
 for i in range(N):
  if 44<=i<54 and 80<=j<101:continue
  a=j*(N+1)+i;faces.append((a,a+N+1,a+N+2,a+1));face_u.append((i+.5)/N)
mesh=bpy.data.meshes.new('Continuous_Floor_Wall_Ceiling_Surface');mesh.from_pydata(vertices,[],faces);mesh.update();can=bpy.data.objects.new('Shared_Unfolding_Canopy',mesh);s.collection.objects.link(can);can.data.materials.append(ivory);can.data.materials.append(graphite)
for f in mesh.polygons:
 f.use_smooth=True;f.material_index=1 if (face_u[f.index]<.30) else 0
active(can);mod=can.modifiers.new('Closed thickness including aperture reveal','SOLIDIFY');mod.thickness=.18;mod.offset=0;bpy.ops.object.modifier_apply(modifier=mod.name);mod=can.modifiers.new('Rounded continuous edge finish','BEVEL');mod.width=.065;mod.segments=4;mod.limit_method='ANGLE';mod.angle_limit=.55;bpy.ops.object.modifier_apply(modifier=mod.name)
def tube(name,points,r,mat):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3;c.use_fill_caps=True;sp=c.splines.new('POLY');sp.points.add(len(points)-1)
 for p,q in zip(sp.points,points):p.co=(*V(q),1)
 o=bpy.data.objects.new(name,c);s.collection.objects.link(o);active(o);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.data.materials.append(mat);bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-5);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();return o

def inside(fn,u,v,amount=.099):
 du=V(fn(min(1,u+.0001),v))-V(fn(max(0,u-.0001),v));dv=V(fn(u,min(1,v+.0001)))-V(fn(u,max(0,v-.0001)));return U(V(fn(u,v))-du.cross(dv).normalized()*amount)
seam=tube('Embedded_Rose_Gold_Edge',[inside(fold,.685,.06+i/240*.87)for i in range(241)],.012,gold);light=tube('Embedded_Warm_Leading_Seam',[inside(fold,.105,.07+i/260*.85)for i in range(261)],.018,warm)
active(can);seam.select_set(True);light.select_set(True);bpy.ops.object.join();can=bpy.context.object;can['runtime']=True;can['lightmapStem']='canopy';can['normalMap']='canopy-normal.png';can['lightmapStorageScale']=1.0;can['lightmapUnitToIrradiance']=math.pi;can['bakeSize']=2048;can['previewUnbaked']=True;can['motionGroup']='canopy';can.shape_key_add(name='Basis');opened=can.shape_key_add(name='Space_Unfold');entry=can.shape_key_add(name='Gift_Entry')
for i,v in enumerate(can.data.vertices):
 x,y,z=U(v.co);w=smooth(-30,-2,z)*smooth(1.5,6.5,y);opened.data[i].co=V((x+.45*w,y+1.5*w,z));entry.data[i].co=V((x,y,z+.25))
uv(can)
# A burgundy return curves out of the common floor and into a ceiling lip; no rear closing wall.
def return_cove(u,v):
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
# The physical warm emitter is concealed behind the finished reveal, with depth behind it.
wellmat=material('Warm lightwell mineral emitter',(1,.58,.31),.5,emission=12)
# Recess follows the same curved surface parameters and has four finished reveals.
u0,u1=44/N,54/N;v0,v1=80/M,101/M
well=grid('Warm_Recessed_Lightwell',lambda u,v:(fold(u0+(u1-u0)*v,v0+(v1-v0)*u)[0]-1.7,fold(u0+(u1-u0)*v,v0+(v1-v0)*u)[1],fold(u0+(u1-u0)*v,v0+(v1-v0)*u)[2]),32,24,wellmat,.12);well.data.materials[0]=ivory;well['runtime']=True;well['previewUnbaked']=True;well['lightmapStem']='destination-preview';uv(well)
reveals=[]
for name,fn in [
 ('Lightwell lower reveal',lambda u,v:(fold(u0,v0+(v1-v0)*u)[0]-1.7*v,fold(u0,v0+(v1-v0)*u)[1],fold(u0,v0+(v1-v0)*u)[2])),
 ('Lightwell upper reveal',lambda u,v:(fold(u1,v0+(v1-v0)*u)[0]-1.7*v,fold(u1,v0+(v1-v0)*u)[1],fold(u1,v0+(v1-v0)*u)[2])),
 ('Lightwell near reveal',lambda u,v:(fold(u0+(u1-u0)*u,v0)[0]-1.7*v,fold(u0+(u1-u0)*u,v0)[1],fold(u0+(u1-u0)*u,v0)[2])),
 ('Lightwell far reveal',lambda u,v:(fold(u0+(u1-u0)*u,v1)[0]-1.7*v,fold(u0+(u1-u0)*u,v1)[1],fold(u0+(u1-u0)*u,v1)[2]))]:
 reveal=grid(name,fn,32,8,wellmat if name=='Lightwell far reveal' else ivory,.14);reveal['runtime']=True;reveal['previewUnbaked']=True;reveal['lightmapStem']='destination-preview';uv(reveal);reveals.append(reveal)
# Remove the distant blue portrait softbox arrangement; keep the Hero's original two sources.
for o in list(s.objects):
 if o.get('lighting_card')and o.name not in ['Warm portrait softbox','Warm portrait rim']:bpy.data.objects.remove(o,do_unlink=True)
def card(name,at,target,power,size,color):
 m=material(name,color,.5,emission=power);g=bpy.data.meshes.new(name);g.from_pydata([(-size[0]/2,-size[1]/2,0),(size[0]/2,-size[1]/2,0),(size[0]/2,size[1]/2,0),(-size[0]/2,size[1]/2,0)],[],[(0,1,2,3)]);g.update();o=bpy.data.objects.new(name,g);s.collection.objects.link(o);o.data.materials.append(m);o.location=V(at);o.rotation_euler=(V(target)-o.location).to_track_quat('Z','Y').to_euler();o['lighting_card']=True;o['runtime']=True;o['rect_area_position']=list(at);o['rect_area_target']=list(target);o['rect_area_size']=list(size);o['rect_area_power']=power;o['rect_area_color']=list(color);o.visible_camera=False
# Expose the unchanged Hero source parameters for matching live area lights.
for name,at,target,power,size,color in [
 ('Warm portrait softbox',(-3.5,6.5,6),(2,0,-2),12,(7,5),(1,.86,.71)),
 ('Warm portrait rim',(12,3,0),(3,2,-7),10,(2,7),(1,.58,.40))]:
 source=bpy.data.objects[name];source['rect_area_position']=list(at);source['rect_area_target']=list(target);source['rect_area_power']=power;source['rect_area_size']=list(size);source['rect_area_color']=list(color)
card('Warm destination grazing source',(center(35)-4,5,-35),(center(40)+2,1,-40),9,(3,6),(1,.72,.48))
card('Cool quiet depth source',(center(45)+7,5,-45),(center(52)-3,1,-52),5,(4,5),(.45,.61,.85))
card('Warm far continuation source',(center(100)-3,4,-100),(center(120)+5,2,-120),14,(3,5),(1,.52,.48))
# The live analytic well light is a proxy for this exact visible emitter.
emitter=next(r for r in reveals if r.name=='Lightwell far reveal')
depth=1+139*v1;at=fold((u0+u1)/2,v1);emitter['rect_area_position']=[at[0]-.85,at[1],at[2]+.08];emitter['rect_area_target']=[center(depth-15)+2,1,-depth+15];emitter['rect_area_size']=[1.7,4];emitter['rect_area_power']=12;emitter['rect_area_color']=[1,.58,.31]
# Geometry diagnostics precede every preview export.
checks=[]
for o in [can,return_o,well,*reveals]:
 bm=bmesh.new();bm.from_mesh(o.data);checks.append({'object':o.name,'vertices':len(bm.verts),'faces':len(bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges)});bm.free()
(P/'geometry-space-v2-lit-checks.json').write_text(json.dumps(checks,indent=2))
if any(x['boundaryEdges']for x in checks):
 b=bmesh.new();b.from_mesh(can.data);print('BOUNDARY_COORDS',[[U(v.co)for v in e.verts]for e in b.edges if e.is_boundary],flush=True);b.free();bpy.ops.wm.save_as_mainfile(filepath=str(P/'chamber-space-v2-failed.blend'))
assert all(x['boundaryEdges']==0 for x in checks),checks
s['assetVersion']='chamber-r8.space-v2-lit';s['previewNote']='Unbaked new canopy/destination; original Hero source and original R7 UV retained for wine/floor. No final lighting claim.';bpy.ops.wm.save_as_mainfile(filepath=str(P/'chamber-space-v2-lit.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in s.objects:
 if o.get('runtime'):o.select_set(True)
bpy.context.view_layer.objects.active=can;bpy.ops.export_scene.gltf(filepath=str(OUT/'chamber.glb'),export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_morph_normal=True,export_materials='EXPORT',export_extras=True)
report={'version':'chamber-r8.space-v2-lit','sourceR7SHA256':hashlib.sha256(Path('/workspace/gate1-assets-r7/chamber.blend').read_bytes()).hexdigest(),'sourceSHA256':hashlib.sha256((P/'chamber-space-v2-lit.blend').read_bytes()).hexdigest(),'checks':checks,'baked':False,'artifact':'Actual geometry prototype, final GI/normal/HDR not produced'};(P/'geometry-space-v2-lit.json').write_text(json.dumps(report,indent=2));print('R8_PREVIEW_AUTHOR_COMPLETE',report,flush=True)
