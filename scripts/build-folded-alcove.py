"""Author and bake the Gate1 alcove. Blender 4.3; CPU-only; no third-party model assets."""
import bpy, math, json, os
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/models/folded-alcove'; OUT.mkdir(parents=True,exist_ok=True)
SOURCE=Path('/workspace/gate1-assets-r4'); SOURCE.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.cycles.use_denoising=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='16'
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.18,.22,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.18
scene.view_settings.view_transform='AgX'
def V(p):return (p[0],-p[2],p[1])
def material(name,color,rough=.6,metal=0,noise=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;b=n.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if noise:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=150;tex.inputs['Detail'].default_value=2;bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.018;m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],b.inputs['Normal'])
 return m
ivory=material('Ivory_Plastersatin',(.73,.70,.64),.68,noise=True)
wine=material('Ink_Wine_Plaster',(.018,.007,.014),.78,noise=True)
floor=material('Graphite_PolishedStone',(.027,.021,.029),.28,.06,noise=True)
rose=material('RoseGold_BrushedEdge',(.72,.47,.33),.21,1,True)
velvet=material('Burgundy_SeatVelvet',(.105,.012,.033),.84,noise=True)
clay=material('Warm_Travertine',(.38,.31,.24),.6,noise=True)
emit=material('Warm_IntegratedLight',(.83,.61,.40),.5);bs=emit.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.67,.38,1);bs.inputs['Emission Strength'].default_value=3
objects=[]
def mesh(name,verts,faces,mat):
 g=bpy.data.meshes.new(name);g.from_pydata([V(p) for p in verts],[],faces);g.update();o=bpy.data.objects.new(name,g);scene.collection.objects.link(o);o.data.materials.append(mat);objects.append(o)
 for p in g.polygons:p.use_smooth=True
 return o
def active(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o

def bevel(o,width=.16,segments=5):
 active(o);m=o.modifiers.new('Authored rounded transitions','BEVEL');m.width=width;m.segments=segments;m.affect='EDGES';m.limit_method='ANGLE';m.angle_limit=.65;bpy.ops.object.modifier_apply(modifier=m.name)
 m=o.modifiers.new('Planar and curved normal weighting','WEIGHTED_NORMAL');m.keep_sharp=True;m.weight=50;bpy.ops.object.modifier_apply(modifier=m.name)

def box(name,lo,hi,mat,r=.12):
 a,b=Vector(V(lo)),Vector(V(hi));c=(a+b)/2;bpy.ops.mesh.primitive_cube_add(size=1,location=c);o=bpy.context.object;o.name=name;o.dimensions=tuple(abs(a[i]-b[i])for i in range(3));bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);objects.append(o)
 if r:bevel(o,r)
 return o

def subtract(o,cutter):
 active(o);m=o.modifiers.new('Carved solid recess','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter;bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cutter,do_unlink=True)

# A solid wall is carved with an ellipsoid, then the mouth is physically bevelled.
niche=box('Alcove_Ivory_Solid',(-2.7,-4.6,-8.0),(16,13,-1.65),ivory,0)
bpy.ops.mesh.primitive_uv_sphere_add(segments=160,ring_count=80,location=V((1.85,.35,-1.2)));c=bpy.context.object;c.scale=(3.95,6.3,3.85);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);subtract(niche,c);bevel(niche,.28,7)
for p in niche.data.polygons:p.use_smooth=True

# The second opening is an actual round-topped passage through the darker wall.
darkwall=box('Wine_Portal_Wall',(-24,-4.6,-10.1),(-2.69,14,-8.65),wine,0)
path=[(-5.1,-4),(-5.1,1.0)]+[(-3.2+1.9*math.cos(math.pi-i*math.pi/48),1+2.8*math.sin(math.pi-i*math.pi/48))for i in range(49)]+[(-1.3,-4)]
vs=[(x,y,z)for z in[-12,-7]for x,y in path];n=len(path);fs=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)];cut=mesh('Portal_Cutter',vs,fs,wine);subtract(darkwall,cut);objects.remove(cut);bevel(darkwall,.19,6)

# One broad continuous curved canopy connects the alcove wall to the passage, not a set of ribs.
def surface(name,fn,nx,ny,mat,thickness=.18):
 vs=[fn(i/nx,j/ny)for j in range(ny+1)for i in range(nx+1)];fs=[]
 for j in range(ny):
  for i in range(nx):a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
 o=mesh(name,vs,fs,mat);active(o);m=o.modifiers.new('Shell thickness','SOLIDIFY');m.thickness=thickness;bpy.ops.object.modifier_apply(modifier=m.name);bevel(o,min(.075,thickness*.35),3);return o
hood=surface('Continuous_Entrance_Canopy',lambda u,v:(-6.9+u*5.8,4.8+.65*math.sin(u*math.pi)-.4*v,-2.7-v*8),40,30,ivory)
# A coherent low lip hides the original waist crop with a curved 3D boundary.
N=64;vs=[]
for side in range(4):
 for i in range(N+1):
  u=i/N;x=-1.18+u*6.65;y=-2.38+.18*math.sin(u*math.pi);z=.50+.36*math.sin(u*math.pi)
  vs.append((x,y-(.15 if side in[2,3]else 0),z if side in[0,3]else -2.25))
fs=[]
for s in range(4):
 for i in range(N):a=s*(N+1)+i;b=((s+1)%4)*(N+1)+i;fs.append((a,a+1,b+1,b))
fs.extend([(0,N+1,2*(N+1),3*(N+1)),(N,2*N+1,3*N+2,4*N+3)])
ledge=mesh('Alcove_Curved_Waist_Lip',vs,fs,ivory);bevel(ledge,.055,4)

def tube(name,points,radius,mat):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=2;curve.bevel_depth=radius;curve.bevel_resolution=3;s=curve.splines.new('POLY');s.points.add(len(points)-1)
 for a,p in zip(s.points,points):a.co=(*V(p),1)
 o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o);active(o);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.data.materials.append(mat);objects.append(o);return o
rim=tube('Alcove_RoseGold_Mouth',[(1.85+3.99*math.cos(a),.35+3.89*math.sin(a),-1.61)for a in[i*2*math.pi/256 for i in range(257)]],.018,rose)
liprim=tube('Alcove_Lip_RoseGold',[(vs[i][0],vs[i][1]-.13,vs[i][2]+.015)for i in range(N+1)],.015,rose)
# Continuous floor; the mirror reflection is produced by the live WebGL camera, not baked into its colour.
roomfloor=box('Continuous_Stone_Floor',(-32,-3.55,-45),(24,-3.36,10),floor,.03)
# Beyond the opening, different distances, material zones and built-in seating establish a real room.
back=surface('Far_Room_FloorWall_Cove',lambda u,v:(-11+u*14,-3.35+((1-math.cos(v/.45*math.pi/2))*2.5 if v<.45 else 2.5+(v-.45)/.55*7.2),-27-2.5*math.sin(min(v/.45,1)*math.pi/2)),50,48,clay)
side=surface('Far_Room_Ivory_Return',lambda u,v:(2.4+.8*math.sin(u*math.pi),-3.35+u*10,-11-v*20),28,48,ivory)
ceiling=surface('Far_Room_High_Vault',lambda u,v:(-11+u*14,7.2+1.3*math.sin(u*math.pi),-10-v*23),48,40,ivory)
# Two broad curved built-ins, deliberately fitted to the architecture rather than loose placeholder boxes.
def curved_seat(name,cx,cz,radius,start,end,mat):
 steps=72;v=[]
 for k in range(4):
  for i in range(steps+1):
   a=start+(end-start)*i/steps;r=radius+(1.05 if k in[1,2]else 0);v.append((cx+r*math.cos(a),-2.2 if k in[0,1]else -3.34,cz+r*math.sin(a)))
 f=[]
 for k in range(4):
  for i in range(steps):a=k*(steps+1)+i;b=((k+1)%4)*(steps+1)+i;f.append((a,b,b+1,a+1))
 f.extend([(0,steps+1,2*(steps+1),3*(steps+1)),(steps,2*steps+1,3*steps+2,4*steps+3)])
 o=mesh(name,v,f,mat);bevel(o,.20,5);return o
seat1=curved_seat('BuiltIn_Burgundy_Curve',-3.7,-21,4.4,-.2,1.0,velvet)
seat2=curved_seat('BuiltIn_Travertine_Curve',-7,-26,2.7,2.4,4.2,clay)
# A softly pleated textile wall creates a warm, deep background in the shared room.
curtain=surface('Far_Burgundy_Acoustic_Wall',lambda u,v:(-10.8+u*3.7,-3.25+v*9,-26.8+.10*math.cos(u*math.pi*18)),96,28,velvet,.012)
slot1=tube('Passage_Warm_Light_Seam',[(-5.18,1+2.9*math.sin(a),-10.18)for a in[math.pi-i*math.pi/96 for i in range(97)]],.018,emit)
# The integrated strip follows the actual rear cove, away from the text field.
slot2=tube('Far_Cove_Warm_Light_Seam',[(-10.8+u*13.5,-1.2,-29.58)for u in[i/64 for i in range(65)]],.024,emit)

# Shape keys are exported as real glTF morph targets with shared topology.
def keys(o,kind):
 o.shape_key_add(name='Basis');key=o.shape_key_add(name='Space_Unfold');intro=o.shape_key_add(name='Gift_Entry')
 for idx,v in enumerate(o.data.vertices):
  world=o.matrix_world @ v.co;x,z,y=world.x,-world.y,world.z
  if kind=='wall':
   w=max(0,min(1,(y+1.5)/6))*max(0,min(1,(1-x)/4));nx=x+.55*max(0,1-(y+2.7)/8);ny=y+.5*w;nz=z-4.5*w
  elif kind=='ledge':nx=x;ny=y-.65;nz=z-1.4
  else:nx=x;ny=y+.2;nz=z-2.0
  key.data[idx].co=o.matrix_world.inverted() @ Vector(V((nx,ny,nz)))
  angle=.14*(1 if kind=='wall'else -.45);dy=y+3.35;dz=z+1.65;intro.data[idx].co=o.matrix_world.inverted() @ Vector(V((x,-3.35+dy*math.cos(angle)-dz*math.sin(angle),-1.65+dy*math.sin(angle)+dz*math.cos(angle))))
for o,kind in[(niche,'wall'),(hood,'wall'),(rim,'wall'),(ledge,'ledge'),(liprim,'ledge')]:keys(o,kind)

# UVs are authored after modelling; each baked receiver uses its own atlas.
def uv(o):
 active(o);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.018);bpy.ops.object.mode_set(mode='OBJECT')
for o in objects:
 if o.type=='MESH':uv(o)
# Group static geometry into a single receiver/atlas while keeping PBR material slots.
static=[o for o in objects if o not in[niche,hood,rim,ledge,liprim]]
bpy.ops.object.select_all(action='DESELECT')
for o in static:o.select_set(True)
bpy.context.view_layer.objects.active=static[0];bpy.ops.object.join();static=bpy.context.object;static.name='Architecture_Static';uv(static)
# Clone per-receiver materials to keep bake image targets independent.
receivers=[(niche,'alcove',2048),(hood,'canopy',1024),(ledge,'lip',1024),(static,'room',2048)]
for o,stem,size in receivers:
 for slot in o.material_slots:
  slot.material=slot.material.copy()
 o['lightmap']=stem+'-irradiance.png';o['lightmapScale']=3.0
# Export a clean asset before baking so the checkpoint survives any renderer failure.
export_objects=[niche,hood,rim,ledge,liprim,static]
for o in export_objects:o['authoredBy']='Yeonseok × Lisbeth Gate1 · Blender 4.3 · local procedural authoring'
active(niche)
for o in export_objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'alcove.glb'),export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_morph_normal=True,export_materials='EXPORT',export_extras=True)
# Actual broad area lights for baked diffuse irradiation / occlusion.
def area(name,at,target,power,size,color):
 l=bpy.data.lights.new(name,'AREA');l.energy=power;l.shape='RECTANGLE';l.size=size[0];l.size_y=size[1];l.color=color;o=bpy.data.objects.new(name,l);scene.collection.objects.link(o);o.location=V(at);o.rotation_euler=(Vector(V(target))-o.location).to_track_quat('-Z','Y').to_euler();return o
area('Warm broad key',(-4,6,6),(2,0,-3),1400,(7,5),(1,.88,.76))
area('Cool ivory bounce',(7,4,2),(1,-1,-4),1000,(5,7),(.73,.85,1))
area('Passage ceiling warm',(-3.5,4.6,-15),(-3.5,-2,-17),1000,(4,5),(1,.69,.42))
area('Far room broad lamp',(-4,5.7,-24),(-4,-3,-24),1400,(5,4),(1,.79,.55))
area('Rear return edge',(1,2,-27),(-4,0,-24),600,(3,4),(1,.46,.32))
# Use the exact approved RGBA only as an occluder during light baking; it is not exported or regenerated.
image=bpy.data.images.load(str(ROOT/'public/images/yeonseok-lisbeth-cutout.webp'))
occluder=mesh('Approved_Portrait_Bake_Occluder',[(-1.1,-2.92,.05),(4.8,-2.92,.05),(4.8,2.98,.05),(-1.1,2.98,.05)],[(0,1,2,3)],ivory)
occ=bpy.data.materials.new('Approved alpha shadow');occ.use_nodes=True;nt=occ.node_tree;nt.nodes.clear();out=nt.nodes.new('ShaderNodeOutputMaterial');mix=nt.nodes.new('ShaderNodeMixShader');tr=nt.nodes.new('ShaderNodeBsdfTransparent');df=nt.nodes.new('ShaderNodeBsdfDiffuse');im=nt.nodes.new('ShaderNodeTexImage');im.image=image;nt.links.new(im.outputs['Alpha'],mix.inputs[0]);nt.links.new(tr.outputs[0],mix.inputs[1]);nt.links.new(df.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs[0]);occluder.data.materials.clear();occluder.data.materials.append(occ);uv_layer=occluder.data.uv_layers.new(name='UVMap');coords=[(0,0),(1,0),(1,1),(0,1)]
for p in occluder.data.polygons:
 for l in p.loop_indices:uv_layer.data[l].uv=coords[occluder.data.loops[l].vertex_index]
manifest=[]
for o,stem,size in receivers:
 active(o);image=bpy.data.images.new(stem+' physical irradiance',width=size,height=size,float_buffer=True);image.colorspace_settings.name='Non-Color'
 for m in o.data.materials:
  node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;m.node_tree.nodes.active=node
 bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},margin=16,use_clear=True)
 # Store linear irradiance below 1 and recover its scale in the live PBR lightMap.
 pixels=list(image.pixels);pixels=[v/3 if i%4!=3 else v for i,v in enumerate(pixels)];image.pixels.foreach_set(pixels);image.filepath_raw=str(OUT/(stem+'-irradiance.png'));image.file_format='PNG';image.save()
 manifest.append({'name':o.name,'file':stem+'-irradiance.png','resolution':[size,size],'irradianceScale':3,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons)})
 print('BAKED',stem,flush=True)
# Keep an editable scene and all modelling/bake provenance outside the application source.
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'alcove.blend'))
(OUT/'asset-manifest.json').write_text(json.dumps({'generator':'scripts/build-folded-alcove.py','blender':bpy.app.version_string,'device':'CPU','samples':32,'receivers':manifest,'referenceImageViewed':False,'morphTargets':['Space_Unfold','Gift_Entry']},indent=2))
print('ALCOVE_ASSET_COMPLETE',flush=True)
