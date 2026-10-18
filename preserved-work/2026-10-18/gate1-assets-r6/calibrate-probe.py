import bpy,math,json
from mathutils import Vector
from pathlib import Path
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=1;s.cycles.use_denoising=False;s.render.threads_mode='FIXED';s.render.threads=1;s.render.resolution_x=128;s.render.resolution_y=64;s.render.resolution_percentage=100;s.world=bpy.data.worlds.new('Black');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[1].default_value=0
V=lambda a:Vector((a[0],-a[2],a[1]))
for name,at,col in [('X',(3,0,0),(1,0,0)),('Z',(0,0,3),(0,0,1)),('Y',(0,3,0),(0,1,0))]:
 bpy.ops.mesh.primitive_plane_add(size=1.5,location=V(at));o=bpy.context.object;o.rotation_euler=(-o.location).to_track_quat('Z','Y').to_euler();m=bpy.data.materials.new(name);m.use_nodes=True;m.node_tree.nodes.clear();out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');em=m.node_tree.nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(*col,1);m.node_tree.links.new(em.outputs[0],out.inputs[0]);o.data.materials.append(m)
bpy.ops.object.camera_add();c=bpy.context.object;c.data.type='PANO';c.data.panorama_type='EQUIRECTANGULAR';c.rotation_euler=(math.pi/2,0,0);s.camera=c;s.render.image_settings.file_format='OPEN_EXR';s.render.filepath='/workspace/gate1-assets-r6/probe-axis-calibration.exr';bpy.ops.render.render(write_still=True);im=bpy.data.images.load(s.render.filepath);px=list(im.pixels);results={}
for n,k in [('X',0),('Y',1),('Z',2)]:
 points=[(i%128,i//128)for i in range(128*64)if px[i*4+k]>.8 and all(px[i*4+j]<.05 for j in range(3)if j!=k)];results[n]={'u':sum(x+.5 for x,y in points)/len(points)/128,'v':sum(y+.5 for x,y in points)/len(points)/64,'count':len(points)}
Path('/workspace/gate1-assets-r6/probe-axis-calibration.json').write_text(json.dumps(results,indent=2));print('PROBE_AXES',results)
