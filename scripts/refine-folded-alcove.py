"""Post-bake geometry QA: repair the passage strip and integrate the threshold with stone."""
import bpy,bmesh,math
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];bpy.ops.wm.open_mainfile(filepath='/workspace/gate1-assets-r4/alcove.blend')
static=bpy.data.objects['Architecture_Static'];bm=bmesh.new();bm.from_mesh(static.data);bad=[]
for f in bm.faces:
 p=static.matrix_world@f.calc_center_median();mat=static.data.materials[f.material_index]
 if 'Warm_IntegratedLight'in mat.name and abs(p.x+5.18)<.06 and abs(-p.y+10.18)<.06:bad.append(f)
bmesh.ops.delete(bm,geom=bad,context='FACES');bm.to_mesh(static.data);bm.free();static.data.update()
# The constant-X authoring mistake is replaced by the actual rounded opening contour.
emit=next(m for m in static.data.materials if'Warm_IntegratedLight'in m.name);c=bpy.data.curves.new('Passage_Warm_Rim','CURVE');c.dimensions='3D';c.bevel_depth=.014;c.bevel_resolution=3;s=c.splines.new('POLY');s.points.add(128)
for i,p in enumerate(s.points):a=math.pi-i/128*math.pi;p.co=(-6.3+1.93*math.cos(a),8.60,1+2.84*math.sin(a),1)
o=bpy.data.objects.new('Passage_Warm_Rim',c);bpy.context.collection.objects.link(o);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');bpy.context.object.data.materials.append(emit)
# The same solid low wall continues into a stone skirting; no floating shelf or alpha crop.
ledge=bpy.data.objects['Alcove_Curved_Waist_Lip'];ledge.shape_key_clear();stone=next(m for m in static.data.materials if'Graphite_PolishedStone'in m.name).copy();ledge.data.materials.append(stone);bm=bmesh.new();bm.from_mesh(ledge.data);plane=ledge.matrix_world.inverted()@Vector((0,0,-2.90));normal=ledge.matrix_world.to_3x3().transposed()@Vector((0,0,1));bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=plane,plane_no=normal,dist=.000001,clear_inner=False,clear_outer=False)
for f in bm.faces:
 if(ledge.matrix_world@f.calc_center_median()).z<-2.90001:f.material_index=len(ledge.data.materials)-1
bm.to_mesh(ledge.data);bm.free();ledge.data.update()
bpy.ops.wm.save_as_mainfile(filepath='/workspace/gate1-assets-r4/alcove.blend');print('PASSAGE_STRIP_REPAIRED',len(bad),flush=True)
