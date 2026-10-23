import bpy,json,hashlib
from pathlib import Path
p=Path('/workspace/gate1-assets-r6');source=p/'chamber.blend';before=hashlib.sha256(source.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(source))
for im in bpy.data.images:
 if im.source=='FILE' and not im.packed_file:im.pack()
out=p/'chamber-source-portable.blend';bpy.ops.wm.save_as_mainfile(filepath=str(out),compress=True);assert hashlib.sha256(source.read_bytes()).hexdigest()==before
(p/'portable-source.json').write_text(json.dumps({'source':str(source),'sourceSha256':before,'portable':str(out),'portableSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'change':'Only embedded existing approved portrait and compressed a separate save; original source unchanged.'},indent=2));print('PORTABLE_SOURCE_SAVED',flush=True)
