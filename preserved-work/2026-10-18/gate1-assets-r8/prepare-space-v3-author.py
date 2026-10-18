from pathlib import Path
P=Path('/workspace/gate1-assets-r8');s=(P/'author-space-v2-lit.py').read_text().replace('space-v2-lit-model','space-v3-model').replace('chamber-space-v2-lit.blend','chamber-space-v3.blend').replace('geometry-space-v2-lit','geometry-space-v3').replace('chamber-r8.space-v2-lit','chamber-r8.space-v3')
s=s.replace("return_o=grid('Deep_Burgundy_Continuous_Return',return_cove,180,48,wine,.18)","satin_wine=material('Burgundy satin architecture',(.055,.012,.030),.42,.15,True)\nreturn_o=grid('Deep_Burgundy_Continuous_Return',return_cove,180,48,satin_wine,.18)")
needle='# Geometry diagnostics precede every preview export.'
assert needle in s
insert='''# Replace the detached narrow bank with a solid, floor-rooted portrait stage.
for name in ['Shared_Sculpted_Foreground','Foreground_Open_Inlay']:
 obj=bpy.data.objects.get(name)
 if obj:bpy.data.objects.remove(obj,do_unlink=True)

def stage_box(name,at,size,mat,bevel):
 bpy.ops.mesh.primitive_cube_add(size=1,location=V(at));obj=bpy.context.object;obj.name=name;obj.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=obj.modifiers.new('Finished stage edge','BEVEL');mod.width=bevel;mod.segments=6;bpy.ops.object.modifier_apply(modifier=mod.name)
 for face in obj.data.polygons:face.use_smooth=True
 mod=obj.modifiers.new('Weighted planar stage normals','WEIGHTED_NORMAL');mod.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=mod.name)
 obj.data.materials.append(mat);obj['runtime']=True;obj['portraitStage']=True;obj['previewUnbaked']=True;obj['lightmapStem']='portrait-stage-preview';obj['motionGroup']='portrait-stage';uv(obj);return obj
stage_body=stage_box('Portrait_Stage_Rooted_Body',(1.85,-3.14,.05),(6.4,.56,2.7),ivory,.12)
stage_trim=stage_box('Portrait_Stage_Rose_Gold_Edge',(1.85,-2.86,.05),(6.46,.035,2.76),gold,.016)
stage_lip=stage_box('Portrait_Stage_Integrated_Front_Lip',(1.85,-2.78,1.25),(6.2,.18,.20),ivory,.075)
assert -3.14-.56/2<-3.32 and -3.14+.56/2>-.03-2.95
stage_motion={'pivot':[1.85,0,.05],'progress':[.10,.52],'delta':[1.9,0,-4.4],'angleYDegrees':-6}
s['portraitStageMotion']=json.dumps(stage_motion)
for obj in [stage_body,stage_trim,stage_lip]:obj['stageMotion']=json.dumps(stage_motion)
# Rigid hinge replaces the old nonmonotonic x+25*front deformation.
# No intermediate collapse, reversed skin or changing surface thickness.
hinged=[]
for obj in list(s.objects):
 if obj.get('motionGroup')!='shell':continue
 obj['hingeRig']=True;obj['hingePivot']=[18,0,-7];obj['hingeYDegrees']=-75;obj['hingeProgress']=[.08,.43]
 if obj.data.shape_keys and'Space_Unfold'in obj.data.shape_keys.key_blocks:obj.shape_key_remove(obj.data.shape_keys.key_blocks['Space_Unfold'])
 if obj.get('lightmapStem'):obj['restBakeOnly']=True
 # Finish the original light seam's two tube ends without changing vertices.
 if not obj.get('lightmapStem'):
  coords=[v.co.copy()for v in obj.data.vertices];bm=bmesh.new();bm.from_mesh(obj.data);boundary=[e for e in bm.edges if e.is_boundary]
  if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0);bm.to_mesh(obj.data)
  bm.free();assert len(coords)==len(obj.data.vertices)and all((v.co-coords[i]).length<1e-6 for i,v in enumerate(obj.data.vertices))
 hinged.append(obj)
for obj in hinged+[stage_body,stage_trim,stage_lip]:
 bm=bmesh.new();bm.from_mesh(obj.data);assert not any(e.is_boundary or not e.is_manifold for e in bm.edges),obj.name;bm.free()
'''
s=s.replace(needle,insert+'\n'+needle)
(P/'author-space-v3.py').write_text(s);compile(s,'space-v3-author','exec')
