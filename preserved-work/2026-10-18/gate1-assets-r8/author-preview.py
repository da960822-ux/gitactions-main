"""R8 geometry review source only. No bake, package change or original R7 overwrite."""
import bpy,bmesh,math,json,hashlib
from pathlib import Path
from mathutils import Vector
P=Path('/workspace/gate1-assets-r8');R=Path('/workspace/yl-folded-playhouse-r8');OUT=R/'public/models/folded-chamber-r8-preview';OUT.mkdir(parents=True,exist_ok=True)
G=Path('/workspace/yl-folded-playhouse-r7/scripts/build-folded-chamber.py');ns={'__file__':str(G)};exec(G.read_text().split('\nstage=sys.argv')[0],ns)
V,U,active,material,grid,uv=map(ns.get,['V','U','active','material','grid','uv']);smooth=ns['smooth'];bpy.ops.wm.open_mainfile(filepath='/workspace/gate1-assets-r7/chamber.blend');s=bpy.context.scene
old=bpy.data.objects['Shared_Light_Chamber'];ret=old.copy();ret.data=old.data.copy();s.collection.objects.link(ret);ret.name='Retained_Hero_Wing_And_Floor';ret.data.name='Retained_Original_UV_Wing_And_Floor';active(ret)
keep=[i for i,m in enumerate(ret.data.materials)if m and ('Deep burgundy mineral'in m.name or'Satin graphite stone'in m.name)]
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.mesh.select_mode(type='FACE');bm=bmesh.from_edit_mesh(ret.data)
for f in bm.faces:f.select_set(f.material_index not in keep)
bmesh.update_edit_mesh(ret.data);bpy.ops.mesh.delete(type='FACE');bpy.ops.object.mode_set(mode='OBJECT');assert len(ret.data.vertices)>20000;assert all(len(k.data)==len(ret.data.vertices)for k in ret.data.shape_keys.key_blocks);ret['preview_preserved_uv']='R7 room UV0, normal and GI are retained for unchanged wine/floor only';bpy.data.objects.remove(old,do_unlink=True)
oldcan=bpy.data.objects['Shared_Unfolding_Canopy'];ivory=oldcan.data.materials[0];warm=oldcan.data.materials[1];wine=next(m for m in ret.data.materials if m and'Deep burgundy'in m.name);gold=bpy.data.materials['Soft rose gold'];bpy.data.objects.remove(oldcan,do_unlink=True)
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

def center(depth):return -1-4.2*math.sin(smooth(18,98,depth)*math.pi*.95)
def profile(depth):return 15-2.3*smooth(28,85,depth),-3.32+.32*smooth(20,82,depth),7.3+.85*math.sin(smooth(15,90,depth)*math.pi),2.25

def old_roof(u,z):
 v=(-1-z)/45;return -.5+2*smooth(.35,1,v)+(u-.5)*(15+25*smooth(.2,.55,v)),5.7+.8*math.sin(u*math.pi)-.35*math.sin(v*math.pi)+.8*smooth(.45,1,v)+2*smooth(.25,.6,v),z

def fold(u,v):
 depth=1+97*v;z=-depth;a=old_roof(u,z);w,f,h,r=profile(depth);x,y=c_profile(u,w,f,h,r);x+=center(depth);mix=smooth(12,31,depth);return a[0]*(1-mix)+x*mix,a[1]*(1-mix)+y*mix,z

# Cut the lightwell aperture in the unthickened surface; solidify and bevel afterwards.
N,M=160,208;vertices=[V(fold(i/N,j/M))for j in range(M+1)for i in range(N+1)];faces=[]
for j in range(M):
 for i in range(N):
  if 77<=i<95 and 147<=j<168:continue
  a=j*(N+1)+i;faces.append((a,a+N+1,a+N+2,a+1))
mesh=bpy.data.meshes.new('Continuous_Floor_Wall_Ceiling_Surface');mesh.from_pydata(vertices,[],faces);mesh.update();can=bpy.data.objects.new('Shared_Unfolding_Canopy',mesh);s.collection.objects.link(can);can.data.materials.append(ivory)
for f in mesh.polygons:f.use_smooth=True
active(can);mod=can.modifiers.new('Closed thickness including aperture reveal','SOLIDIFY');mod.thickness=.18;mod.offset=0;bpy.ops.object.modifier_apply(modifier=mod.name);mod=can.modifiers.new('Rounded continuous edge finish','BEVEL');mod.width=.065;mod.segments=4;mod.limit_method='ANGLE';mod.angle_limit=.55;bpy.ops.object.modifier_apply(modifier=mod.name)
def tube(name,points,r,mat):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3;c.use_fill_caps=True;sp=c.splines.new('POLY');sp.points.add(len(points)-1)
 for p,q in zip(sp.points,points):p.co=(*V(q),1)
 o=bpy.data.objects.new(name,c);s.collection.objects.link(o);active(o);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.data.materials.append(mat);bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-5);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();return o

def inside(fn,u,v,amount=.099):
 du=V(fn(min(1,u+.0001),v))-V(fn(max(0,u-.0001),v));dv=V(fn(u,min(1,v+.0001)))-V(fn(u,max(0,v-.0001)));return U(V(fn(u,v))-du.cross(dv).normalized()*amount)
seam=tube('Embedded_Rose_Gold_Edge',[inside(fold,.975,.13+i/240*.8)for i in range(241)],.012,gold);light=tube('Embedded_Warm_Leading_Seam',[inside(fold,.88,.15+i/260*.68)for i in range(261)],.018,warm)
active(can);seam.select_set(True);light.select_set(True);bpy.ops.object.join();can=bpy.context.object;can['runtime']=True;can['lightmapStem']='canopy';can['normalMap']='canopy-normal.png';can['lightmapStorageScale']=1.0;can['lightmapUnitToIrradiance']=math.pi;can['bakeSize']=2048;can['previewUnbaked']=True;can['motionGroup']='canopy';can.shape_key_add(name='Basis');opened=can.shape_key_add(name='Space_Unfold');entry=can.shape_key_add(name='Gift_Entry')
for i,v in enumerate(can.data.vertices):
 x,y,z=U(v.co);w=smooth(-28,-2,z);a=math.radians(-20)*w;dy=y-8;dz=z+28;opened.data[i].co=V((x+1.2*w,8+dy*math.cos(a)-dz*math.sin(a),-28+dy*math.sin(a)+dz*math.cos(a)));entry.data[i].co=V((x,y,z+.25))
uv(can)
# A burgundy return curves out of the common floor and into a ceiling lip; no rear closing wall.
def return_cove(u,v):
 depth=20+94*u;w,f,h,r=profile(depth);right=center(depth)+w/2;cx,yy=c_profile(v,5.5,f-.20,h+.30,1.65);return right+1.75-cx,yy,-depth
return_o=grid('Deep_Burgundy_Continuous_Return',return_cove,148,64,wine,.20);return_o['runtime']=True;return_o['lightmapStem']='destination-preview';return_o['previewUnbaked']=True;return_o['motionGroup']='static';uv(return_o)
# The physical warm emitter is concealed behind the finished reveal, with depth behind it.
wellmat=material('Warm lightwell mineral emitter',(1,.58,.31),.5,emission=2.8)
well=grid('Warm_Recessed_Lightwell',lambda u,v:(center(75)-10-.9*math.sin(v*math.pi),-.6+5.4*v,-67-17*u),32,32,wellmat,.12);well['runtime']=True;well['previewUnbaked']=True;well['lightmapStem']='destination-preview';uv(well)
# Remove the distant blue portrait softbox arrangement; keep the Hero's original two sources.
for o in list(s.objects):
 if o.get('lighting_card')and o.name not in ['Warm portrait softbox','Warm portrait rim']:bpy.data.objects.remove(o,do_unlink=True)
def card(name,at,target,power,size,color):
 m=material(name,color,.5,emission=power);g=bpy.data.meshes.new(name);g.from_pydata([(-size[0]/2,-size[1]/2,0),(size[0]/2,-size[1]/2,0),(size[0]/2,size[1]/2,0),(-size[0]/2,size[1]/2,0)],[],[(0,1,2,3)]);g.update();o=bpy.data.objects.new(name,g);s.collection.objects.link(o);o.data.materials.append(m);o.location=V(at);o.rotation_euler=(V(target)-o.location).to_track_quat('Z','Y').to_euler();o['lighting_card']=True;o['runtime']=True;o['rect_area_position']=list(at);o['rect_area_target']=list(target);o['rect_area_size']=list(size);o['rect_area_power']=power;o['rect_area_color']=list(color);o.visible_camera=False
card('Warm destination grazing source',(-6,5,-35),(1,1,-29),9,(3,6),(1,.72,.48));card('Cool quiet depth source',(10,5,-38),(-3,1,-48),5,(4,5),(.45,.61,.85));card('Warm far continuation source',(-7,4,-82),(-3,1,-62),14,(3,5),(1,.58,.30))
# Geometry diagnostics precede every preview export.
checks=[]
for o in [can,return_o,well]:
 bm=bmesh.new();bm.from_mesh(o.data);checks.append({'object':o.name,'vertices':len(bm.verts),'faces':len(bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges)});bm.free()
(P/'geometry-checks-current.json').write_text(json.dumps(checks,indent=2))
if any(x['boundaryEdges']for x in checks):
 b=bmesh.new();b.from_mesh(can.data);print('BOUNDARY_COORDS',[[U(v.co)for v in e.verts]for e in b.edges if e.is_boundary],flush=True);b.free();bpy.ops.wm.save_as_mainfile(filepath=str(P/'chamber-preview-failed.blend'))
assert all(x['boundaryEdges']==0 for x in checks),checks
s['assetVersion']='chamber-r8.preview';s['previewNote']='Unbaked new canopy/destination; original Hero source and original R7 UV retained for wine/floor. No final lighting claim.';bpy.ops.wm.save_as_mainfile(filepath=str(P/'chamber-preview.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in s.objects:
 if o.get('runtime'):o.select_set(True)
bpy.context.view_layer.objects.active=can;bpy.ops.export_scene.gltf(filepath=str(OUT/'chamber.glb'),export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_morph_normal=True,export_materials='EXPORT',export_extras=True)
report={'version':'chamber-r8.preview','sourceR7SHA256':hashlib.sha256(Path('/workspace/gate1-assets-r7/chamber.blend').read_bytes()).hexdigest(),'sourceSHA256':hashlib.sha256((P/'chamber-preview.blend').read_bytes()).hexdigest(),'checks':checks,'baked':False,'artifact':'Actual geometry prototype, final GI/normal/HDR not produced'};(P/'geometry-preview.json').write_text(json.dumps(report,indent=2));print('R8_PREVIEW_AUTHOR_COMPLETE',report,flush=True)
