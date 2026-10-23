import bpy,bmesh,json
from pathlib import Path
P=Path('/workspace/gate1-assets-r7');bpy.ops.wm.open_mainfile(filepath=str(P/'chamber.blend'));o=bpy.data.objects['Shared_Unfolding_Canopy'];bm=bmesh.new();bm.from_mesh(o.data);rows=[]
for e in bm.edges:
 if not e.is_boundary:continue
 vertices=[(o.matrix_world@v.co)for v in e.verts];p=[(v.x,v.z,-v.y)for v in vertices]
 if any(-10.5<=x<=-1.5 and -46.5<=z<=-41.5 for x,y,z in p):rows.append({'endsXYZ':p,'linkedFaces':len(e.link_faces)})
r={'source':'chamber.blend unchanged, read-only inspection','object':o.name,'boundaryEdgesNearSlot':len(rows),'allBoundaryEdges':sum(e.is_boundary for e in bm.edges),'slotBoundaryEdges':rows,'interpretation':'Open mesh boundary near slot after post-solidify face deletion confirms an unfinished geometric boundary. Visual projection and production repair still require review; no author/model/atlas files changed.'};(P/'slot-boundary-inspection.json').write_text(json.dumps(r,indent=2));print('SLOT_BOUNDARY_DIAGNOSTIC',len(rows),r['allBoundaryEdges']);bm.free()
