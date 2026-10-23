"""Gate1 visual QA revision of the authored .blend; keeps the approved portrait untouched."""
import bpy,bmesh,math
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SOURCE=Path('/workspace/gate1-assets-r4');OUT=ROOT/'public/models/folded-alcove'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'alcove.blend'))
def V(p):return(p[0],-p[2],p[1])
def active(o):bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
ivory=bpy.data.objects['Alcove_Ivory_Solid'].data.materials[0];rose=bpy.data.objects['Alcove_RoseGold_Mouth'].data.materials[0];wine=next(m for m in bpy.data.objects['Architecture_Static'].data.materials if'Ink_Wine'in m.name)
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 for n in mat.node_tree.nodes:
  if n.type=='TEX_NOISE':n.inputs['Scale'].default_value=1200
  if n.type=='BUMP':n.inputs['Distance'].default_value=.0015;n.inputs['Strength'].default_value=.08
# Less frontal fill lets the true bowl curvature and contact shadows read instead of a uniformly lit disk.
bpy.data.lights['Cool ivory bounce'].energy=200
for name in['Alcove_Ivory_Solid','Alcove_RoseGold_Mouth','Alcove_Curved_Waist_Lip','Alcove_Lip_RoseGold']:
 bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
def normals(o):
 active(o);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
def mesh(name,vs,fs,mat):
 g=bpy.data.meshes.new(name);g.from_pydata([V(p)for p in vs],[],fs);g.update();o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
 for p in g.polygons:p.use_smooth=True
 normals(o);return o
def box(name,lo,hi,mat):
 a,b=Vector(V(lo)),Vector(V(hi));bpy.ops.mesh.primitive_cube_add(size=1,location=(a+b)/2);o=bpy.context.object;o.name=name;o.dimensions=tuple(abs(a[i]-b[i])for i in range(3));bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);return o
def sub(o,c):
 active(o);m=o.modifiers.new('Carved volume','BOOLEAN');m.object=c;m.solver='EXACT';m.operation='DIFFERENCE';bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(c,do_unlink=True)
def bevel(o,width):
 active(o);m=o.modifiers.new('Broad rounded junction','BEVEL');m.width=width;m.segments=8;m.limit_method='ANGLE';m.angle_limit=.65;bpy.ops.object.modifier_apply(modifier=m.name);m=o.modifiers.new('Weighted polished normals','WEIGHTED_NORMAL');m.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=m.name)
def tube(name,points,r,mat):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3;s=c.splines.new('POLY');s.points.add(len(points)-1)
 for a,p in zip(s.points,points):a.co=(*V(p),1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);active(o);bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.data.materials.append(mat);return o
niche=box('Alcove_Ivory_Solid',(-2.7,-4.6,-8),(16,13,-1.65),ivory)
bpy.ops.mesh.primitive_uv_sphere_add(segments=192,ring_count=96,location=V((1.85,.35,-1.2)));c=bpy.context.object;c.scale=(3.95,6.3,3.85);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);sub(niche,c);bevel(niche,.62)
# The left outer edge follows the alcove rather than making a vertical white rectangle over the passage.
profile=[]
for i in range(121):
 y=-4.8+i/120*19.0;t=(y-.35)/4.55;x=1.85-4.45*math.sqrt(max(0,1-t*t))-.60 if abs(t)<1 else 1.25
 # Above the visible alcove the wall continues out of frame as a ceiling.
 if y>5.0:x=-2.7
 profile.append((x,y))
poly=[(-30,-4.8)]+profile+[(-30,14.2)];n=len(poly);vs=[(x,y,z)for z in[-10,4]for x,y in poly];fs=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)];c=mesh('Left_Contour_Trim',vs,fs,ivory);sub(niche,c);bevel(niche,.16)
# Project the continuous fine metal edge onto the actual bevel surface, never a floating oval.
pts=[];inv=niche.matrix_world.inverted()
for i in range(257):
 a=i/256*2*math.pi;x=1.85+4.15*math.cos(a);y=.35+4.05*math.sin(a);origin=inv@Vector(V((x,y,6)));direction=inv.to_3x3()@Vector(V((0,0,-1)));hit,p,norm,_=niche.ray_cast(origin,direction)
 if hit:q=niche.matrix_world@(p+norm*.014);pts.append((q.x,q.z,-q.y))
 else:pts.append((x,y,-1.65))
rim=tube('Alcove_RoseGold_Mouth',pts,.016,rose)
N=80;vs=[]
for side in range(4):
 for i in range(N+1):
  u=i/N;x=-1.18+u*6.65;y=-2.38+.18*math.sin(u*math.pi);z=.5+.36*math.sin(u*math.pi);vs.append((x,y if side<2 else -3.48,z if side in[0,3]else -2.25))
fs=[]
for s in range(4):
 for i in range(N):a=s*(N+1)+i;b=((s+1)%4)*(N+1)+i;fs.append((a,a+1,b+1,b))
fs.extend([(0,N+1,2*(N+1),3*(N+1)),(N,2*N+1,3*N+2,4*N+3)])
ledge=mesh('Alcove_Curved_Waist_Lip',vs,fs,ivory.copy());bevel(ledge,.065)
liprim=tube('Alcove_Lip_RoseGold',[(vs[i][0],-3.30,vs[i][2]+.016)for i in range(N+1)],.014,rose)
# Move the true passage left far enough to be visible beside the alcove in the initial camera.
static=bpy.data.objects['Architecture_Static'];bm=bmesh.new();bm.from_mesh(static.data);faces=[f for f in bm.faces if'Ink_Wine'in static.data.materials[f.material_index].name];bmesh.ops.delete(bm,geom=faces,context='FACES');bm.to_mesh(static.data);bm.free();static.data.update()
wall=box('Revised_Wine_Passage',(-24,-4.6,-10.1),(-2.69,14,-8.65),wine)
path=[(-8.2,-4),(-8.2,1)]+[(-6.3+1.9*math.cos(math.pi-i*math.pi/64),1+2.8*math.sin(math.pi-i*math.pi/64))for i in range(65)]+[(-4.4,-4)];n=len(path);vs=[(x,y,z)for z in[-12,-7]for x,y in path];fs=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)];c=mesh('Passage_Cutter',vs,fs,wine);sub(wall,c);bevel(wall,.19)
# A real curved skirting cove gives the copy wall a soft transition into the stone floor.
nx=40;ny=24;vs=[(-24+i/nx*15.5,-3.36+2*(1-math.cos(j/ny*math.pi/2)),-6.65-2*math.sin(j/ny*math.pi/2))for j in range(ny+1)for i in range(nx+1)];fs=[]
for j in range(ny):
 for i in range(nx):a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
cove=mesh('Wine_Floor_Wall_Cove',vs,fs,wine)
active(static);wall.select_set(True);cove.select_set(True);bpy.ops.object.join();static=bpy.context.object;normals(static)
hood=bpy.data.objects['Continuous_Entrance_Canopy'];hood.shape_key_clear()
for v in hood.data.vertices:
 u=max(0,min(1,(v.co.x+6.9)/5.8));v.co.x-=2.0*(1-u)
# Four stable irradiance atlases are re-baked for the revised geometry and lighting.
receivers=[(niche,'alcove',2048),(hood,'canopy',1024),(ledge,'lip',1024),(static,'room',2048)]
for o,stem,size in receivers:
 active(o);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.018);bpy.ops.object.mode_set(mode='OBJECT');o['lightmap']=stem+'-irradiance.png';o['lightmapScale']=3.0
 image=bpy.data.images.new(stem+' revised physical irradiance',width=size,height=size,float_buffer=True);image.colorspace_settings.name='Non-Color'
 for mat in o.data.materials:
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.nodes.active=node
 bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},margin=16,use_clear=True);px=list(image.pixels);image.pixels.foreach_set([v/3 if i%4!=3 else v for i,v in enumerate(px)]);image.filepath_raw=str(OUT/(stem+'-irradiance.png'));image.file_format='PNG';image.save();print('REBAKED',stem,flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'alcove.blend'));print('VISUAL_REVISION_COMPLETE',flush=True)
