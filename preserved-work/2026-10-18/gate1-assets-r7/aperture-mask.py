import bpy,math,json,numpy as np
from pathlib import Path
from mathutils import Vector
P=Path('/workspace/gate1-assets-r7');bpy.ops.wm.open_mainfile(filepath=str(P/'chamber.blend'));s=bpy.context.scene;s.cycles.samples=1;s.cycles.use_denoising=False;s.render.resolution_x=960;s.render.resolution_y=540;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='Standard';s.world.node_tree.nodes['Background'].inputs[1].default_value=0
pose=next(p for p in json.loads((P/'camera-poses.json').read_text())if p['progress']==.43)
def mask(name,dest):
 m=bpy.data.materials.new(name);m.use_nodes=True;nt=m.node_tree;nt.nodes.clear();out=nt.nodes.new('ShaderNodeOutputMaterial');em=nt.nodes.new('ShaderNodeEmission');nt.links.new(em.outputs[0],out.inputs[0]);em.inputs[0].default_value=(0,0,0,1)
 if dest:
  geom=nt.nodes.new('ShaderNodeNewGeometry');sep=nt.nodes.new('ShaderNodeSeparateXYZ');gt=nt.nodes.new('ShaderNodeMath');gt.operation='GREATER_THAN';gt.inputs[1].default_value=4;nt.links.new(geom.outputs['Position'],sep.inputs[0]);nt.links.new(sep.outputs['Y'],gt.inputs[0]);nt.links.new(gt.outputs[0],em.inputs[0])
 return m
black=mask('Occluding foreground',False);white=mask('Destination beyond actual entrance z -4',True)
for o in s.objects:
 if o.type!='MESH':continue
 if o.data.shape_keys:o.data.shape_keys.key_blocks['Space_Unfold'].value=pose['weights']['rail'if o.get('motionGroup')=='rail'else'aperture']
 if o.get('portrait'):
  for n in o.data.materials[0].node_tree.nodes:
   if n.type=='EMISSION':n.inputs[1].default_value=0
  continue
 for slot in o.material_slots:
  dest=o.name in ['Shared_Light_Chamber','Shared_Unfolding_Canopy']and not slot.material.name.startswith('Deep burgundy')
  slot.material=white if dest else black
V=lambda p:Vector((p[0],-p[2],p[1]));bpy.ops.object.camera_add(location=V(pose['position']));c=bpy.context.object;c.rotation_euler=(V(pose['target'])-c.location).to_track_quat('-Z','Y').to_euler();c.data.sensor_fit='VERTICAL';c.data.sensor_height=24;c.data.lens=24/(2*math.tan(math.radians(pose['fov'])/2));s.camera=c;s.render.filepath=str(P/'aperture-destination-mask.png');bpy.ops.render.render(write_still=True)
im=bpy.data.images.load(s.render.filepath);a=np.array(im.pixels[:]).reshape(540,960,4);ratio=float((a[:,:,:3].mean(axis=2)>.5).mean());(P/'aperture-destination-mask.json').write_text(json.dumps({'pose':pose,'destinationVisibleFraction':ratio,'definition':'Actual visible room/canopy fragments beyond the actual entrance plane at Three world z=-4; excludes opened cove/wing, foreground bank, portrait and background. One-sample flat-emission diagnostic, not beauty image.','source':'chamber.blend'},indent=2));print('DESTINATION_VISIBLE_FRACTION',ratio,flush=True)
