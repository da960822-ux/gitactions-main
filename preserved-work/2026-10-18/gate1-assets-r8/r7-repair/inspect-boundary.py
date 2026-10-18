import bpy,bmesh,json
bpy.ops.wm.open_mainfile(filepath='/workspace/gate1-assets-r7/chamber.blend');o=bpy.data.objects['Shared_Unfolding_Canopy'];b=bmesh.new();b.from_mesh(o.data);edges={e for e in b.edges if e.is_boundary};rows=[]
while edges:
 seed=edges.pop();component={seed};verts=set(seed.verts);pending=list(seed.verts)
 while pending:
  v=pending.pop()
  for e in v.link_edges:
   if e in edges:
    edges.remove(e);component.add(e)
    for q in e.verts:
     if q not in verts:verts.add(q);pending.append(q)
 xyz=[(v.co.x,v.co.z,-v.co.y)for v in verts]
 rows.append({'edges':len(component),'verts':len(verts),'min':[min(q[i]for q in xyz)for i in range(3)],'max':[max(q[i]for q in xyz)for i in range(3)],'sample':xyz[:4]})
print('BOUNDARY_COMPONENTS',json.dumps(rows));b.free()
