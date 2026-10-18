"""Versioned Gate1 chamber: author once, bake matching UV normals/GI, export, compare."""
import bpy,math,json,hashlib,sys,time
import numpy as np
from pathlib import Path
from mathutils import Vector
from array import array
ROOT=Path(__file__).resolve().parents[1];SOURCE=Path('/workspace/gate1-assets-r6');OUT=ROOT/'public/models/folded-chamber-v6';OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(exist_ok=True)
VERSION='chamber-v6.1';V=lambda p:Vector((p[0],-p[2],p[1]));U=lambda p:(p.x,p.z,-p.y)
def smooth(a,b,v):
 t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
def active(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o

def material(name,color,rough,metal=0,noise=False,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if emission:b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emission
 if noise:
  n=m.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=36;n.inputs['Detail'].default_value=3;n.inputs['Roughness'].default_value=.62
  bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Distance'].default_value=.0025;bump.inputs['Strength'].default_value=.13;m.node_tree.links.new(n.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],b.inputs['Normal'])
 return m

def grid(name,fn,nx,ny,mat,thickness=0):
 vs=[V(fn(i/nx,j/ny))for j in range(ny+1)for i in range(nx+1)];fs=[]
 for j in range(ny):
  for i in range(nx):a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
 g=bpy.data.meshes.new(name);g.from_pydata(vs,[],fs);g.update();o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
 for p in g.polygons:p.use_smooth=True
 if thickness:
  active(o);mod=o.modifiers.new('Solid rounded shell','SOLIDIFY');mod.thickness=thickness;mod.offset=0;bpy.ops.object.modifier_apply(modifier=mod.name)
  mod=o.modifiers.new('Finished edges','BEVEL');mod.width=min(thickness*.42,.08);mod.segments=4;mod.limit_method='ANGLE';mod.angle_limit=.55;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o

def tube(name,points,r,mat):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=4;s=c.splines.new('POLY');s.points.add(len(points)-1)
 for p,q in zip(s.points,points):p.co=(*V(q),1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);active(o);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.data.materials.append(mat);return o

def add_keys(o,kind):
 o.shape_key_add(name='Basis');key=o.shape_key_add(name='Space_Unfold');entry=o.shape_key_add(name='Gift_Entry')
 for i,v in enumerate(o.data.vertices):
  x,y,z=U(o.matrix_world@v.co)
  if kind=='shell':
   front=1-smooth(-1,16,x);upper=smooth(-2,6,y);nx=x+5.5*front;ny=y+.8*upper*front;nz=z-15*front
  elif kind=='canopy':
   w=smooth(-18,-2,z);nx=x+1.4*w;ny=y-1.3*w*smooth(-1,4,x);nz=z-12*w
  elif kind=='rail':
   nx=x;ny=y-.35;nz=z-7.0*max(0,1-abs(x-1)/14)
  else:nx=x;ny=y;nz=z
  key.data[i].co=o.matrix_world.inverted()@V((nx,ny,nz))
  entry.data[i].co=o.matrix_world.inverted()@V((x,y-(.18 if kind=='rail'else 0),z+(.7 if kind=='shell'else .25)))

def uv(o):
 active(o);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT')

def set_pose(p):
 w=smooth(.15,.85,p)
 for o in bpy.context.scene.objects:
  if o.type=='MESH'and o.data.shape_keys:
   o.data.shape_keys.key_blocks['Space_Unfold'].value=w;o.data.shape_keys.key_blocks['Gift_Entry'].value=0
 return w

def author():
 bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=32;s.cycles.use_denoising=False;s.render.threads_mode='FIXED';s.render.threads=4;s.view_settings.view_transform='AgX'
 s.world=bpy.data.worlds.new('Low cool air');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.055,.075,.11,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.14
 ivory=material('Warm mineral plaster',(.67,.62,.55),.67,noise=True);wine=material('Deep burgundy mineral',(.016,.006,.014),.8,noise=True);floor=material('Satin graphite stone',(.024,.022,.031),.31,.05,True);gold=material('Soft rose gold',(.72,.43,.29),.26,1,True);cool=material('Cold blue plaster',(.055,.095,.135),.65,noise=True);warm=material('Warm woven light',(1,.51,.28),.4,emission=3.2);ice=material('Cool woven light',(.24,.57,1),.4,emission=2.2)
 # A continuous open-sided cove: no ellipse cutout or separate metal ring.
 def shell(u,v):
  if v<.28:y=-3.35;z=3-v/.28*6
  elif v<.52:
   a=(v-.28)/.24*math.pi/2;y=-3.35+3*(1-math.cos(a));z=-3-3*math.sin(a)
  else:y=-.35+(v-.52)/.48*12;z=-6
  left=-.9-3.2*smooth(2.5,7,y)-.35*smooth(-3,-.2,y);x=left+(18-left)*u
  z-=2.0*math.sin(u*math.pi/2);return x,y,z
 shell_o=grid('Shared_Sculpted_Cove',shell,104,100,ivory,.22);add_keys(shell_o,'shell')
 # Quiet continuous left wall / floor cove, with the real passage concealed to the right of copy.
 quiet=grid('Quiet_Wine_Cove',lambda u,v:(-27+u*24,-3.35+(0 if v<.45 else 3*(1-math.cos(min(1,(v-.45)/.3)*math.pi/2))+max(0,v-.75)*34),3-24*min(1,v/.75)),88,90,wine,.16)
 floor_o=grid('Continuous_Graphite_Floor',lambda u,v:(-30+u*58,-3.38,12-v*58),64,64,floor,.12)
 # A rounded bank submerges into the floor at both ends. It has no exposed block cap.
 def bank(u,v):
  a=v*2*math.pi;x=-2.9+u*24;fade=1.9*math.exp(-u*38)+1.5*smooth(.8,1,u);cy=-3.02-fade;cz=.12-.7*u+.32*math.sin(u*math.pi)
  return x,cy+.78*math.sin(a),cz+.62*math.cos(a)
 rail=grid('Shared_Sculpted_Foreground',bank,144,48,ivory);add_keys(rail,'rail')
 # The same roof sheet unfurls towards the shared light chamber.
 canopy=grid('Shared_Unfolding_Canopy',lambda u,v:(-8+u*15,5.7+.8*math.sin(u*math.pi)-.35*math.sin(v*math.pi),-1-v*26),96,104,ivory,.16);add_keys(canopy,'canopy')
 # A cool, deep sculpted return behind the warm folds.
 rear=grid('Cold_Depth_Cove',lambda u,v:(-13+u*26,-3.35+14*v,-45-2.8*math.sin(u*math.pi)+1.7*math.sin(v*math.pi)),90,80,cool,.2)
 # Two paths enter separately, cross in depth and become an architectural weave.
 # These are room-scale surfaces rooted in the floor, rather than loose props or rings.
 def ribbon(u,v,side):
  z=-23-19*u;x=(7.7 if side==1 else 3.3)+side*(2.6*math.sin(u*math.pi)-.9*u);y=-3.28+8.6*math.sin(u*math.pi)
  width=1.2+1.3*math.sin(u*math.pi);return x+(v-.5)*width,y+(v-.5)*.45,z+side*.65*math.sin(v*math.pi)
 r1=grid('Two_Paths_Warm_Fold',lambda u,v:ribbon(u,v,1),120,20,ivory,.16);r2=grid('Two_Paths_Cool_Fold',lambda u,v:ribbon(u,v,-1),120,20,cool,.16)
 def exposed(fn,u,v):
  du=V(fn(min(1,u+.0001),v))-V(fn(max(0,u-.0001),v));dv=V(fn(u,min(1,v+.0001)))-V(fn(u,max(0,v-.0001)));normal=du.cross(dv).normalized();return U(V(fn(u,v))+normal*.125)
 seam1=tube('Warm_Path_Integrated_Seam',[exposed(lambda u,v:ribbon(u,v,1),i/240,.12)for i in range(241)],.032,warm);seam2=tube('Cool_Path_Integrated_Seam',[exposed(lambda u,v:ribbon(u,v,-1),i/240,.88)for i in range(241)],.03,ice)
 # Open gold inlay follows the rounded foreground; no closed frame around the couple.
 accent=tube('Foreground_Open_Inlay',[(bank(i/240,.91)[0],bank(i/240,.91)[1],bank(i/240,.91)[2]+.008)for i in range(241)],.009,gold);add_keys(accent,'rail')
 seam=tube('Shared_Shell_Light',[exposed(shell,.025,.38+i/180*.6)for i in range(181)],.014,warm);add_keys(seam,'shell')
 # Cards are the actual source of illumination and visible in the authored HDR probes.
 def card(name,at,target,power,size,color):
  m=material(name,color,.5,emission=power);g=bpy.data.meshes.new(name);g.from_pydata([(-size[0]/2,-size[1]/2,0),(size[0]/2,-size[1]/2,0),(size[0]/2,size[1]/2,0),(-size[0]/2,size[1]/2,0)],[],[(0,1,2,3)]);g.update();o=bpy.data.objects.new(name,g);s.collection.objects.link(o);o.data.materials.append(m);o.location=V(at);direction=V(target)-o.location;o.rotation_euler=direction.to_track_quat('Z','Y').to_euler();o['lighting_card']=True
 card('Warm portrait softbox',(-3.5,6.5,6),(2,0,-2),12,(7,5),(1,.86,.71))
 card('Cool depth softbox',(13,5,-20),(0,0,-21),14,(5,7),(.33,.57,1))
 card('Warm ceiling bounce',(12,6,-21),(0,-2,-22),16,(5,4),(1,.62,.40))
 card('Cold rear edge',(-7,3,-28),(1,0,-25),20,(3,6),(.25,.52,1))
 card('Warm portrait rim',(12,6,2),(2,0,0),7,(3,5),(1,.58,.40))
 card('Far cool volume',(22,7,-37),(5,0,-35),18,(6,5),(.38,.64,1))
 # The approved image is the only portrait source; this plane also casts its actual alpha shadow.
 image=bpy.data.images.load(str(ROOT/'public/images/yeonseok-lisbeth-cutout.webp'));m=bpy.data.materials.new('Approved unchanged portrait');m.use_nodes=True;nt=m.node_tree;nt.nodes.clear();out=nt.nodes.new('ShaderNodeOutputMaterial');tex=nt.nodes.new('ShaderNodeTexImage');tex.image=image;em=nt.nodes.new('ShaderNodeEmission');nt.links.new(tex.outputs['Color'],em.inputs[0]);tr=nt.nodes.new('ShaderNodeBsdfTransparent');mix=nt.nodes.new('ShaderNodeMixShader');nt.links.new(tex.outputs['Alpha'],mix.inputs[0]);nt.links.new(tr.outputs[0],mix.inputs[1]);nt.links.new(em.outputs[0],mix.inputs[2]);df=nt.nodes.new('ShaderNodeBsdfDiffuse');df.inputs['Color'].default_value=(.3,.3,.3,1);opaque=nt.nodes.new('ShaderNodeMixShader');nt.links.new(tex.outputs['Alpha'],opaque.inputs[0]);nt.links.new(tr.outputs[0],opaque.inputs[1]);nt.links.new(df.outputs[0],opaque.inputs[2]);path=nt.nodes.new('ShaderNodeLightPath');mx=nt.nodes.new('ShaderNodeMath');mx.operation='MAXIMUM';nt.links.new(path.outputs['Is Camera Ray'],mx.inputs[0]);nt.links.new(path.outputs['Is Glossy Ray'],mx.inputs[1]);final=nt.nodes.new('ShaderNodeMixShader');nt.links.new(mx.outputs[0],final.inputs[0]);nt.links.new(opaque.outputs[0],final.inputs[1]);nt.links.new(mix.outputs[0],final.inputs[2]);nt.links.new(final.outputs[0],out.inputs[0])
 portrait=grid('Approved_Portrait',lambda u,v:(-1.1+5.9*u,-2.92+5.9*v,.05),1,1,m);uvl=portrait.data.uv_layers.new(name='UVMap')
 for poly in portrait.data.polygons:
  for l in poly.loop_indices:
   x,y,z=U(portrait.data.vertices[portrait.data.loops[l].vertex_index].co);uvl.data[l].uv=((x+1.1)/5.9,(y+2.92)/5.9)
 portrait['portrait']=True
 # Keep receivers separate; never share a material between different atlas contracts.
 receivers=[(shell_o,'shell',2048),(rail,'foreground',1024),(canopy,'canopy',2048)]
 static=[quiet,floor_o,rear,r1,r2,seam1,seam2]
 active(static[0])
 for o in static:o.select_set(True)
 bpy.ops.object.join();room=bpy.context.object;room.name='Shared_Light_Chamber';receivers.append((room,'room',2048))
 for o,stem,size in receivers:
  for slot in o.material_slots:slot.material=slot.material.copy();slot.material.name+='__'+stem
  uv(o);o['lightmapStem']=stem;o['normalMap']=stem+'-normal.png';o['lightmapStorageScale']=1.0;o['lightmapQuantity']='outgoingDiffusePerUnitAlbedo';o['lightmapUnitToIrradiance']=math.pi;o['bakeSize']=size;o['assetVersion']=VERSION
 for o in [accent,seam]:uv(o);o['assetVersion']=VERSION
 accent['normalMap']='accent-normal.png';accent['bakeSize']=512
 for o in [*([r[0]for r in receivers]),accent,seam]:o['runtime']=True
 set_pose(0);s['assetVersion']=VERSION;s['generatorSha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest();s['poseSamples']=json.dumps([0,.65,1]);bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'chamber.blend'));print('AUTHOR_COMPLETE',flush=True)

def target(o,name,size,float_buffer):
 im=bpy.data.images.new(name,width=size,height=size,float_buffer=float_buffer);im.colorspace_settings.name='Non-Color'
 for mat in o.data.materials:
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=im;mat.node_tree.nodes.active=node
 return im

def bake():
 bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'chamber.blend'));s=bpy.context.scene;assert s['generatorSha256']==hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'Generator changed after authoring';s.cycles.samples=48
 receivers=[o for o in s.objects if o.get('lightmapStem')];records=[]
 for o in [x for x in s.objects if x.get('normalMap')]:
  active(o);im=target(o,o.name+' tangent normal',int(o['bakeSize']),False);bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT',margin=16,use_clear=True);im.filepath_raw=str(OUT/o['normalMap']);im.file_format='PNG';im.save();print('NORMAL_BAKED',o.name,flush=True)
 for p in [0,.65,1]:
  set_pose(p)
  for o in receivers:
   active(o);stem=o['lightmapStem'];size=int(o['bakeSize']);im=target(o,stem+' full diffuse '+str(p),size,True);bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},margin=16,use_clear=True)
   file=stem+'-diffuse-'+str(p).replace('.','_')+'.exr';s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='16';s.render.image_settings.exr_codec='ZIP';im.save_render(str(OUT/file),scene=s)
   px=array('f',[0])*len(im.pixels);im.pixels.foreach_get(px);records.append({'node':o.name,'progress':p,'file':file,'size':size,'maxLinear':max(px)});print('DIFFUSE_BAKED',o.name,p,flush=True)
 set_pose(0)
 # Preserve a panorama at each real observation region, including the exact emitter cards.
 for name,at,p in [('hero',(1,.7,1),0),('arrival',(-1,1,-22),1)]:
  set_pose(p);bpy.ops.object.camera_add(location=V(at));c=bpy.context.object;c.name='Probe_'+name;c.rotation_euler=(math.pi/2,0,0);c.data.type='PANO';c.data.panorama_type='EQUIRECTANGULAR';s.camera=c;s.render.resolution_x=1024;s.render.resolution_y=512;s.render.resolution_percentage=100;s.cycles.samples=32;s.render.image_settings.file_format='HDR';s.render.filepath=str(OUT/(name+'-environment.hdr'));bpy.ops.render.render(write_still=True)
  im=bpy.data.images.load(s.render.filepath,check_existing=False);im.colorspace_settings.name='Non-Color';px=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(px);px=px.reshape(512,1024,4);cols=(1024//4-np.arange(1024)-1)%1024;im.pixels.foreach_set(px[:,cols,:].copy().ravel());im.filepath_raw=s.render.filepath;im.file_format='HDR';im.save();print('ENVIRONMENT_BAKED',name,'axis calibrated: uBlender=fract(1.25-uThree)',flush=True)
 set_pose(0);s['bakeRecords']=json.dumps(records);bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'chamber-baked.blend'));print('BAKE_COMPLETE',flush=True)

def export():
 bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'chamber-baked.blend'));s=bpy.context.scene;assert s['generatorSha256']==hashlib.sha256(Path(__file__).read_bytes()).hexdigest();set_pose(0)
 for m in bpy.data.materials:
  if m.use_nodes:
   for n in list(m.node_tree.nodes):
    if n.type=='TEX_IMAGE' and n.image and ('full diffuse'in n.image.name or'tangent normal'in n.image.name):m.node_tree.nodes.remove(n)
 bpy.ops.object.select_all(action='DESELECT')
 for o in s.objects:
  if o.get('runtime'):o.select_set(True)
 bpy.context.view_layer.objects.active=next(o for o in s.objects if o.get('runtime'));bpy.ops.export_scene.gltf(filepath=str(OUT/'chamber.glb'),export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_morph_normal=True,export_materials='EXPORT',export_extras=True)
 manifest={'version':VERSION,'generatorSha256':s['generatorSha256'],'authorBlendSha256':hashlib.sha256((SOURCE/'chamber.blend').read_bytes()).hexdigest(),'bakedBlendSha256':hashlib.sha256((SOURCE/'chamber-baked.blend').read_bytes()).hexdigest(),'blender':bpy.app.version_string,'bakeDevice':'CPU','bakeSamples':48,'normalSpace':'TANGENT','normalUV':'TEXCOORD_0','environmentOrientation':'axis-calibrated horizontal remap; +X u=.5, +Z u=.75, +Y v=1','lightmapQuantity':'outgoingDiffusePerUnitAlbedo','storageScale':1,'unitToIrradiance':math.pi,'poseSamples':[0,.65,1],'records':json.loads(s['bakeRecords']),'files':{f.name:{'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size}for f in OUT.iterdir()if f.is_file()and f.name!='asset-manifest.json'}}
 (OUT/'asset-manifest.json').write_text(json.dumps(manifest,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'chamber-final.blend'));print('EXPORT_COMPLETE',flush=True)

stage=sys.argv[sys.argv.index('--')+1]if'--'in sys.argv else'author'
{'author':author,'bake':bake,'export':export}[stage]()
