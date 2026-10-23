"""Isolated R7 mesh repair and one small local probe; no GI rebake."""
import bpy, bmesh, math, json, hashlib, subprocess, shutil
import numpy as np
from pathlib import Path
from mathutils import Vector

P=Path('/workspace/gate1-assets-r8/r7-repair');P.mkdir(exist_ok=True)
OUT=Path('/workspace/yl-folded-playhouse-r8/public/models/folded-chamber-r7-repair');OUT.mkdir(exist_ok=True)
source=Path('/workspace/gate1-assets-r7/chamber.blend')
before=hashlib.sha256(source.read_bytes()).hexdigest()
generator=Path('/workspace/yl-folded-playhouse-r7/scripts/build-folded-chamber.py')
ns={'__file__':str(generator)};exec(generator.read_text().split('\nstage=sys.argv')[0],ns)
V,U,active,smooth=[ns[k]for k in ['V','U','active','smooth']]
bpy.ops.wm.open_mainfile(filepath=str(source));s=bpy.context.scene

# Move the back wall's endpoints onto the actual bowed side-wall profiles.
# Existing vertices, UVs, materials and all morph targets remain intact.
room=bpy.data.objects['Shared_Light_Chamber'];changed=[]
for i,vertex in enumerate(room.data.vertices):
 x,y,z=U(vertex.co)
 if -10.1<=x<=-1.9 and z<-55.8:
  v=max(0,min(1,(y+2.87)/8.67));bow=.6*math.sin(v*math.pi)
  dx=bow*((x+10)/4-1)
  if abs(dx)>1e-7:
   changed.append(i)
   for k in room.data.shape_keys.key_blocks:
    q=U(k.data[i].co);k.data[i].co=V((q[0]+dx,q[1],q[2]))
   vertex.co=room.data.shape_keys.key_blocks['Basis'].data[i].co
assert len(changed)>100, len(changed)
room.data.update()

old=bpy.data.objects['Shared_Unfolding_Canopy'];ivory=old.data.materials[0]
warm=next(m for m in old.data.materials if 'Warm woven light' in m.name)
def roof(u,v):
 return -.5+2*smooth(.35,1,v)+(u-.5)*(22+18*smooth(.2,.55,v)),5.7+.8*math.sin(u*math.pi)-.35*math.sin(v*math.pi)+.8*smooth(.45,1,v)+2*smooth(.25,.6,v),-1-45*v

# The original rear piers/lintel rise through the ceiling. Fit their actual
# top edge to the underside instead of leaving an exposed overlapping cut.
parents=list(range(len(room.data.vertices)))
def find(i):
 while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
 return i
for edge in room.data.edges:
 a,b=edge.vertices;parents[find(a)]=find(b)
components={}
for i in range(len(parents)):components.setdefault(find(i),[]).append(i)
joint_vertices=[]
for indices in components.values():
 coords=[U(room.data.vertices[i].co)for i in indices]
 if min(q[2]for q in coords)<-47 or max(q[2]for q in coords)>-44:continue
 if max(q[1]for q in coords)<10:continue
 bottom=5.8 if min(q[1]for q in coords)>5 else -3.35
 for i in indices:
  x,y,z=U(room.data.vertices[i].co);v=(-1-z)/45;cx=roof(.5,v)[0];width=roof(1,v)[0]-roof(0,v)[0];u=max(0,min(1,.5+(x-cx)/width));ceiling=roof(u,v)[1]
  ny=bottom+(y-bottom)*(ceiling-bottom)/(10.65-bottom);dy=ny-y
  for k in room.data.shape_keys.key_blocks:
   q=U(k.data[i].co);k.data[i].co=V((q[0],q[1]+dy,q[2]))
  room.data.vertices[i].co=room.data.shape_keys.key_blocks['Basis'].data[i].co;joint_vertices.append(i)
assert len(joint_vertices)>100
room.data.update()
# The skylight must sit above the common roof; its old y=6.6 plane sat below
# the opening at y~9, so rays through the opening escaped to black background.
sky_indices={i for f in room.data.polygons if 'Alcove cool skylight' in room.data.materials[f.material_index].name for i in f.vertices}
assert sky_indices
for i in sky_indices:
 for k in room.data.shape_keys.key_blocks:
  x,y,z=U(k.data[i].co);k.data[i].co=V((x,y+4.2,z))
 room.data.vertices[i].co=room.data.shape_keys.key_blocks['Basis'].data[i].co

# Isolate the altered rear-wall joint as its own receiver. All other room UVs
# and original high-resolution room bakes stay intact.
joint=room.copy();joint.data=room.data.copy();s.collection.objects.link(joint);joint.name='Repaired_Ceiling_Wall_Joint'
for obj,keep_joint in [(joint,True),(room,False)]:
 active(obj);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bm=bmesh.from_edit_mesh(obj.data);bm.verts.ensure_lookup_table();wanted=set(joint_vertices)
 for vtx in bm.verts:vtx.select_set((vtx.index not in wanted) if keep_joint else (vtx.index in wanted))
 bmesh.update_edit_mesh(obj.data);bpy.ops.mesh.delete(type='VERT');bpy.ops.object.mode_set(mode='OBJECT')
joint['lightmapStem']='repair-joint';joint['normalMap']='repair-joint-normal.png';joint['bakeSize']=512
# Give the skylight a physical recess. Grazing rays then hit a finished wall,
# rather than escaping beyond a flat emitter to the scene background.
cool=next(m for m in joint.data.materials if m and 'Cold blue plaster' in m.name)
well_walls=[]
def roof_height(x,z):
 v=(-1-z)/45;cx=roof(.5,v)[0];width=roof(1,v)[0]-roof(0,v)[0];return roof(.5+(x-cx)/width,v)[1]-.1
for name,fn in [
 ('Lightwell left reveal',lambda u,v:(-10,roof_height(-10,-42-4*u)*(1-v)+10.85*v,-42-4*u)),
 ('Lightwell right reveal',lambda u,v:(-2,roof_height(-2,-42-4*u)*(1-v)+10.85*v,-42-4*u)),
 ('Lightwell front reveal',lambda u,v:(-10+8*u,roof_height(-10+8*u,-42)*(1-v)+10.85*v,-42)),
 ('Lightwell rear reveal',lambda u,v:(-10+8*u,roof_height(-10+8*u,-46)*(1-v)+10.85*v,-46))]:
 well_walls.append(ns['grid'](name,fn,24,8,cool,.12))
active(joint)
for wall in well_walls:wall.select_set(True)
bpy.ops.object.join();joint=bpy.context.object;ns['uv'](joint)

# Cut the aperture before thickness. The new reveal is a closed solid.
N,M=96,144
def sample_uv(i,j):
 v=j/(M-20)*(41/45) if j<=M-20 else 41/45+(j-(M-20))/16*(4/45) if j<=M-4 else 1+(j-(M-4))/4*(4/45)
 cx=roof(.5,v)[0];width=roof(1,v)[0]-roof(0,v)[0]
 left=max(.01,min(.40,.5+(-10-cx)/width));right=max(left+.05,min(.8,.5+(-2-cx)/width))
 u=i/20*left if i<=20 else left+(i-20)/20*(right-left) if i<=40 else right+(i-40)/(N-40)*(1-right)
 return u,v
vertices=[V(roof(*sample_uv(i,j)))for j in range(M+1)for i in range(N+1)]
faces=[]
for j in range(M):
 for i in range(N):
  if M-20<=j<M-4 and 20<=i<40:continue
  a=j*(N+1)+i;faces.append((a,a+1,a+N+2,a+N+1))
mesh=bpy.data.meshes.new('R7_Closed_Roof_And_Finished_Slot');mesh.from_pydata(vertices,[],faces);mesh.update()
o=bpy.data.objects.new('Shared_Unfolding_Canopy_Repaired',mesh);s.collection.objects.link(o);o.data.materials.append(ivory)
for f in o.data.polygons:f.use_smooth=True
active(o);m=o.modifiers.new('Thickness after aperture cut','SOLIDIFY');m.thickness=.16;m.offset=0;bpy.ops.object.modifier_apply(modifier=m.name)
m=o.modifiers.new('Finished aperture reveal','BEVEL');m.width=.0672;m.segments=4;m.limit_method='ANGLE';m.angle_limit=.55;bpy.ops.object.modifier_apply(modifier=m.name)
bm=bmesh.new();bm.from_mesh(o.data);roof_boundary=sum(e.is_boundary for e in bm.edges);roof_nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.free()
assert roof_boundary==0 and roof_nonmanifold==0,(roof_boundary,roof_nonmanifold)

# Transfer only the existing UV layout, to isolate geometry before any new bake.
# Newly finished reveal texels remain provisional until a receiver bake is needed.
o.data.uv_layers.new(name=old.data.uv_layers.active.name)
active(o);m=o.modifiers.new('Preserve R7 atlas by nearest surface interpolation','DATA_TRANSFER');m.object=old;m.use_loop_data=True;m.data_types_loops={'UV'};m.loop_mapping='POLYINTERP_NEAREST';bpy.ops.object.modifier_apply(modifier=m.name)

def exposed(u,v):
 du=V(roof(min(1,u+.0001),v))-V(roof(max(0,u-.0001),v));dv=V(roof(u,min(1,v+.0001)))-V(roof(u,max(0,v-.0001)))
 return V(roof(u,v))-du.cross(dv).normalized()*.125
c=bpy.data.curves.new('Preserved warm roof seam','CURVE');c.dimensions='3D';c.bevel_depth=.032;c.bevel_resolution=4;c.use_fill_caps=True
sp=c.splines.new('POLY');sp.points.add(240)
for i,p in enumerate(sp.points):p.co=(*exposed(.78,.12+i/240*.82),1)
seam=bpy.data.objects.new('Roof warm seam',c);s.collection.objects.link(seam);seam.data.materials.append(warm);active(seam);bpy.ops.object.convert(target='MESH');seam=bpy.context.object
seam.data.uv_layers.new(name=old.data.uv_layers.active.name);m=seam.modifiers.new('Preserve seam atlas','DATA_TRANSFER');m.object=old;m.use_loop_data=True;m.data_types_loops={'UV'};m.loop_mapping='POLYINTERP_NEAREST';bpy.ops.object.modifier_apply(modifier=m.name)
active(o);seam.select_set(True);bpy.ops.object.join();o=bpy.context.object
for k in old.keys():o[k]=old[k]
o['repairNote']='Exact rectangular closed reveal; monotonic unfold; new canopy-only low-cost GI preview'
ns['uv'](o)
o.shape_key_add(name='Basis');unfold=o.shape_key_add(name='Space_Unfold');entry=o.shape_key_add(name='Gift_Entry')
for i,v in enumerate(o.data.vertices):
 x,y,z=U(v.co);w=smooth(-28,-2,z)
 unfold.data[i].co=V((x+1.4*w,y-1.3*w*smooth(-1,4,x),z-6*w))
 entry.data[i].co=V((x,y,z+.25))
# d(z-12*smooth)/dz >= 1 - 12*1.5/26 > 0: no reversed roof strip.
assert 1-6*1.5/26>0
bpy.data.objects.remove(old,do_unlink=True);o.name='Shared_Unfolding_Canopy'
s['assetVersion']='chamber-v7.repair-preview';ns['set_pose'](0)
o['lightmapStem']='repair-canopy';o['normalMap']='repair-canopy-normal.png';o['bakeSize']=512
bpy.ops.wm.save_as_mainfile(filepath=str(P/'chamber-repaired.blend'))
# Receiver-only diagnostic bake: 512px x 3 poses, 8 samples. No other receiver changes.
s.cycles.samples=8;s.render.threads_mode='FIXED';s.render.threads=4
active(o);normal=ns['target'](o,'Repair canopy normal',512,False);bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT',margin=8,use_clear=True);normal.filepath_raw=str(OUT/'repair-canopy-normal.png');normal.file_format='PNG';normal.save()
for progress in [0,.43,1]:
 ns['set_pose'](progress);active(o);im=ns['target'](o,'Repair canopy diffuse '+str(progress),512,True);bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},margin=8,use_clear=True)
 s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='16';s.render.image_settings.exr_codec='ZIP';im.save_render(str(OUT/('repair-canopy-diffuse-'+str(progress).replace('.','_')+'.exr')),scene=s)
 print('REPAIR_CANOPY_PREVIEW_BAKED',progress,flush=True)
active(joint);normal=ns['target'](joint,'Repair joint normal',512,False);bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT',margin=8,use_clear=True);normal.filepath_raw=str(OUT/'repair-joint-normal.png');normal.file_format='PNG';normal.save()
for progress in [0,.43,1]:
 ns['set_pose'](progress);active(joint);im=ns['target'](joint,'Repair joint diffuse '+str(progress),512,True);bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},margin=8,use_clear=True);im.save_render(str(OUT/('repair-joint-diffuse-'+str(progress).replace('.','_')+'.exr')),scene=s);print('REPAIR_JOINT_PREVIEW_BAKED',progress,flush=True)
for stem in ['repair-canopy','repair-joint']:
 for progress in [0,.43,1]:
  file=stem+'-diffuse-'+str(progress).replace('.','_')+'.exr';path=OUT/file;shutil.copy2(path,P/('raw-'+file));im=bpy.data.images.load(str(path),check_existing=False);im.colorspace_settings.name='Non-Color';rgba=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(rgba);rgba=rgba.reshape(512,512,4);original=rgba[:,:,:3].copy();pfm=P/(file+'.pfm');filtered=P/(file+'.clean.pfm')
  with pfm.open('wb')as f:f.write(b'PF\n512 512\n-1.0\n');f.write(original.astype('<f4').tobytes())
  subprocess.run(['/tmp/yl-oidn-r6/oidn-2.5.1.x86_64.linux/bin/oidnDenoise','-d','cpu','-f','RTLightmap','--hdr',str(pfm),'-o',str(filtered),'--threads','4','-q','high'],check=True)
  with filtered.open('rb')as f:
   assert f.readline().strip()==b'PF';assert f.readline().strip()==b'512 512';assert float(f.readline())<0;clean=np.frombuffer(f.read(),dtype='<f4').reshape(512,512,3)
  assert np.isfinite(clean).all();ratio=float(clean.mean()/max(original.mean(),1e-10));assert .85<ratio<1.15,ratio
  rgba[:,:,:3]=clean;im.pixels.foreach_set(rgba.ravel());im.save_render(str(path),scene=s);print('REPAIR_RECEIVER_DENOISED',stem,progress,ratio,flush=True)
ns['set_pose'](0)
bpy.ops.object.select_all(action='DESELECT')
for item in s.objects:
 if item.get('runtime'):item.select_set(True)
bpy.context.view_layer.objects.active=o
bpy.ops.export_scene.gltf(filepath=str(OUT/'chamber.glb'),export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_morph_normal=True,export_materials='EXPORT',export_extras=True)

# Low-cost local specular probe inside the actual alcove, rather than the
# outside arrival probe. Diffuse bakes and all original HDRs remain unchanged.
ns['set_pose'](1)
for item in s.objects:
 if item.get('lighting_card'):item.visible_camera=True
bpy.ops.object.camera_add(location=V((-6,1,-49)));camera=bpy.context.object;camera.name='Local_Alcove_Probe';camera.rotation_euler=(math.pi/2,0,0);camera.data.type='PANO';camera.data.panorama_type='EQUIRECTANGULAR';s.camera=camera
s.render.resolution_x=1024;s.render.resolution_y=512;s.render.resolution_percentage=100;s.cycles.samples=8;s.render.threads_mode='FIXED';s.render.threads=4
s.render.image_settings.file_format='HDR';s.render.filepath=str(OUT/'alcove-environment.hdr');bpy.ops.render.render(write_still=True)
im=bpy.data.images.load(s.render.filepath,check_existing=False);im.colorspace_settings.name='Non-Color';px=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(px);px=px.reshape(512,1024,4);cols=(1024//4-np.arange(1024)-1)%1024;im.pixels.foreach_set(px[:,cols,:].copy().ravel());im.filepath_raw=s.render.filepath;im.file_format='HDR';im.save()
assert hashlib.sha256(source.read_bytes()).hexdigest()==before
report={'version':'chamber-v7.repair-preview','sourceR7SHA256':before,'changedBackWallVertices':len(changed),'ceilingJointVertices':len(joint_vertices),'physicalLightwellRevealWalls':4,'newRoofBoundaryEdges':roof_boundary,'newRoofNonManifoldEdges':roof_nonmanifold,'minimumRoofLongitudinalDerivative':1-6*1.5/26,'GIRebake':'Canopy + isolated ceiling joint, each512px x3poses8samples + OIDN RTLightmap; original12 full maps untouched','UV':'R7 untouched room UV preserved; repaired receivers have matching UV/normal/preview GI','probe':{'position':[-6,1,-49],'size':[1024,512],'samples':8},'sameR7CameraRequired':True}
(P/'mesh-repair.json').write_text(json.dumps(report,indent=2));print('R7_REPAIR_SOURCE_COMPLETE',report,flush=True)
