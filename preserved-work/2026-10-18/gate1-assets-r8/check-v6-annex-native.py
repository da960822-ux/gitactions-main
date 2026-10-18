import bpy,bmesh,json
from pathlib import Path
P=Path('/workspace/gate1-assets-r8');bpy.ops.wm.open_mainfile(filepath=str(P/'chamber-space-v6.blend'));rows=[]
for o in bpy.context.scene.objects:
 if not(o.name.startswith('Continuation ')and o.type=='MESH'and not o.get('lighting_card')):continue
 bm=bmesh.new();bm.from_mesh(o.data);rows.append({'name':o.name,'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges)});bm.free()
(P/'space-v6-annex-native-checks.json').write_text(json.dumps(rows,indent=2));assert len(rows)==10;assert not any(r['boundaryEdges']or r['nonManifoldEdges']for r in rows);print('ANNEX_NATIVE_CLOSED_CHECKS_PASS',len(rows),flush=True)
