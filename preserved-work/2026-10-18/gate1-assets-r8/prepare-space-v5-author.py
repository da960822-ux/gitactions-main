from pathlib import Path
P=Path('/workspace/gate1-assets-r8');s=(P/'author-space-v4.py').read_text().replace('space-v4-model','space-v5-model').replace('chamber-space-v4.blend','chamber-space-v5.blend').replace('geometry-space-v4','geometry-space-v5').replace('chamber-r8.space-v4','chamber-r8.space-v5')
a=s.index('# Replace the detached narrow bank');b=s.index('# Rigid hinge replaces',a)
s=s[:a]+'''# No separate plaque, frame or pedestal: the actual continuous floor carries the portrait.
+for name in ['Shared_Sculpted_Foreground','Foreground_Open_Inlay']:
+ obj=bpy.data.objects.get(name)
+ if obj:bpy.data.objects.remove(obj,do_unlink=True)
+for obj in [can,return_o]:
+ obj['floorSupport']=True;obj['floorSupportContract']=json.dumps({'height':.48,'radiusX':4.6,'radiusZ':2.8,'plateau':.7,'verticalStart':-2.8,'verticalEnd':-1})
+s['portraitStageMotion']=json.dumps({'pivot':[1.85,0,.05],'progress':[.10,.52],'delta':[1.9,0,-4.4],'angleYDegrees':-6})
+'''.replace('\n+','\n')+s[b:]
s=s.replace('for obj in hinged+[stage_body,stage_trim,stage_lip]:','for obj in hinged:')
# Native procedural material matches the runtime world-space copy-zone shader.
# Standard GLTF receives the constant base material; native HDR authoring uses nodes.
needle="report={'version':"
pos=s.index(needle)
material='''# Preserve the dark burgundy copy zone in world space, without dimming the portrait.
+for mat in [m for m in bpy.data.materials if m.use_nodes and 'Warm mineral plaster'in m.name]:
+ nt=mat.node_tree;bsdf=nt.nodes.get('Principled BSDF')
+ if not bsdf:continue
+ geo=nt.nodes.new('ShaderNodeNewGeometry');xyz=nt.nodes.new('ShaderNodeSeparateXYZ');nt.links.new(geo.outputs['Position'],xyz.inputs[0]);factors=[]
+ for axis,a,b,c,d in [('X',-5,-2,1,0),('Y',18,36,1,0),('Z',-2,0,0,1)]:
+  node=nt.nodes.new('ShaderNodeMapRange');node.interpolation_type='SMOOTHSTEP';node.clamp=True;node.inputs['From Min'].default_value=a;node.inputs['From Max'].default_value=b;node.inputs['To Min'].default_value=c;node.inputs['To Max'].default_value=d;nt.links.new(xyz.outputs[axis],node.inputs['Value']);factors.append(node.outputs['Result'])
+ mul=nt.nodes.new('ShaderNodeMath');mul.operation='MULTIPLY';nt.links.new(factors[0],mul.inputs[0]);nt.links.new(factors[1],mul.inputs[1]);mul2=nt.nodes.new('ShaderNodeMath');mul2.operation='MULTIPLY';nt.links.new(mul.outputs[0],mul2.inputs[0]);nt.links.new(factors[2],mul2.inputs[1]);mix=nt.nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[1].default_value=(.67,.62,.55,1);mix.inputs[2].default_value=(.016,.006,.014,1);nt.links.new(mul2.outputs[0],mix.inputs[0]);nt.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
+ rough=nt.nodes.new('ShaderNodeMath');rough.operation='MULTIPLY_ADD';rough.inputs[1].default_value=.15;rough.inputs[2].default_value=.67;nt.links.new(mul2.outputs[0],rough.inputs[0]);nt.links.new(rough.outputs[0],bsdf.inputs['Roughness'])
+s['copyZone']='World position: left x<=-5, front depth<=18, above y=0; transitions to normal warm space by x=-2/depth36/y=-2'
+bpy.ops.wm.save_as_mainfile(filepath=str(P/'chamber-space-v5.blend'))
+'''.replace('\n+','\n')
s=s[:pos]+material+s[pos:]
(P/'author-space-v5.py').write_text(s);compile(s,'space-v5-author','exec')
s=(P/'space-v4-probes.py').read_text().replace('space-v4-model','space-v5-model').replace('chamber-space-v4.blend','chamber-space-v5.blend').replace('space-v4-probes.json','space-v5-probes.json')
s=s.replace("bases={o.name:o.matrix_world.copy()for o in s.objects}","bases={o.name:o.matrix_world.copy()for o in s.objects}\nbaseKeys={o.name:{k.name:[v.co.copy()for v in k.data]for k in o.data.shape_keys.key_blocks}for o in s.objects if o.get('floorSupport')and o.data.shape_keys}")
needle='def pose(p):'
s=s.replace(needle,'''def support(point,p):
+ x,y,z=point;t=smooth(.10,.52,p);cx=1.85+1.9*t;cz=.05-4.4*t;a=math.radians(-6)*t;c=math.cos(a);si=math.sin(a);dx=x-cx;dz=z-cz;lx=c*dx-si*dz;lz=si*dx+c*dz;r=math.hypot(lx/4.6,lz/2.8);h=.48*(1-smooth(.7,1,r))*(1-smooth(-2.8,-1,y));return x,y+h,z
+def pose(p):'''.replace('\n+','\n'))
s=s.replace(" s.view_layers.update()", " bpy.context.view_layer.update()")
s=s.replace(" bpy.context.view_layer.update()", " for name,keys in baseKeys.items():\n  o=bpy.data.objects[name]\n  for key,coords in keys.items():\n   for i,q in enumerate(coords):o.data.shape_keys.key_blocks[key].data[i].co=V(support((q.x,q.z,-q.y),p))\n  o.data.update()\n bpy.context.view_layer.update()")
(P/'space-v5-probes.py').write_text(s);compile(s,'space-v5-probes','exec')
