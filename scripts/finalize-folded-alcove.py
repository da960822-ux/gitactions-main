import bpy,math
from mathutils import Vector
from pathlib import Path
r=Path('/workspace/yl-folded-playhouse-g1');bpy.ops.wm.open_mainfile(filepath='/workspace/gate1-assets-r4/alcove.blend')
def V(p):return(p[0],-p[2],p[1])
names=['Alcove_Ivory_Solid','Continuous_Entrance_Canopy','Alcove_RoseGold_Mouth','Alcove_Curved_Waist_Lip','Alcove_Lip_RoseGold','Architecture_Static']
for name in names[:-1]:
 o=bpy.data.objects[name]
 if not o.data.shape_keys:o.shape_key_add(name='Basis');o.shape_key_add(name='Space_Unfold');o.shape_key_add(name='Gift_Entry')
 kind='ledge'if'Lip'in name or'Waist'in name else'wall';key=o.data.shape_keys.key_blocks['Space_Unfold'];intro=o.data.shape_keys.key_blocks['Gift_Entry'];inv=o.matrix_world.inverted()
 for idx,v in enumerate(o.data.vertices):
  world=o.matrix_world @ v.co;x,z,y=world.x,-world.y,world.z
  if kind=='wall':w=max(0,min(1,(y+1.5)/6))*max(0,min(1,(1-x)/4));nx=x+.55*max(0,1-(y+2.7)/8);ny=y+.5*w;nz=z-4.5*w
  else:nx=x;ny=y-.65;nz=z-1.4
  key.data[idx].co=inv @ Vector(V((nx,ny,nz)))
  angle=.14*(1 if kind=='wall'else -.45);dy=y+3.35;dz=z+1.65;intro.data[idx].co=inv @ Vector(V((x,-3.35+dy*math.cos(angle)-dz*math.sin(angle),-1.65+dy*math.sin(angle)+dz*math.cos(angle))))
# Remove temporary bake-target image nodes from export materials; lightmaps are separately loaded as linear data.
for name in names:
 for mat in bpy.data.objects[name].data.materials:
  for node in list(mat.node_tree.nodes):
   if node.type=='TEX_IMAGE' and node.image and 'physical irradiance'in node.image.name:mat.node_tree.nodes.remove(node)
bpy.ops.object.select_all(action='DESELECT')
for name in names+(['Passage_Warm_Rim']if'Passage_Warm_Rim'in bpy.data.objects else[]):bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects[names[0]]
bpy.ops.export_scene.gltf(filepath=str(r/'public/models/folded-alcove/alcove.glb'),export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_morph_normal=True,export_materials='EXPORT',export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath='/workspace/gate1-assets-r4/alcove.blend')
print('MORPHS_WORLD_SPACE_CORRECTED',flush=True)
