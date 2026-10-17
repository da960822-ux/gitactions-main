"""Offline OIDN RTLightmap pass; retains raw radiance, UVs, normals, scale and source lock."""
import bpy,numpy as np,json,hashlib,subprocess,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];ASSET=ROOT/'public/models/folded-chamber-v6';WORK=Path('/workspace/gate1-assets-r6/denoise');WORK.mkdir(parents=True,exist_ok=True)
OIDN=Path(sys.argv[sys.argv.index('--')+1]);assert OIDN.is_file();manifest=json.loads((ASSET/'asset-manifest.json').read_text());assert manifest['version']=='chamber-v6.1'
assert not manifest.get('postprocess'),'Already denoised; do not filter a filtered asset again'
for file,meta in manifest['files'].items():assert hashlib.sha256((ASSET/file).read_bytes()).hexdigest()==meta['sha256'],file
s=bpy.context.scene;s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='16';s.render.image_settings.exr_codec='ZIP'
records=[]
for record in manifest['records']:
 file=record['file'];path=ASSET/file;shutil.copy2(path,WORK/('raw-'+file));im=bpy.data.images.load(str(path),check_existing=False);im.colorspace_settings.name='Non-Color';width,height=im.size;rgba=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(rgba);rgba=rgba.reshape(height,width,4);original=rgba[:,:,:3].copy();pfm=WORK/(file+'.pfm');out=WORK/(file+'.denoised.pfm')
 with pfm.open('wb')as f:f.write(f'PF\n{width} {height}\n-1.0\n'.encode());f.write(original.astype('<f4').tobytes())
 subprocess.run([str(OIDN),'-d','cpu','-f','RTLightmap','--hdr',str(pfm),'-o',str(out),'--threads','4','-q','high'],check=True)
 with out.open('rb')as f:
  assert f.readline().strip()==b'PF';assert list(map(int,f.readline().split()))==[width,height];assert float(f.readline())<0;clean=np.frombuffer(f.read(),dtype='<f4').reshape(height,width,3)
 assert np.isfinite(clean).all()and clean.min()>=0
 mean_in=float(original.mean());mean_out=float(clean.mean());ratio=mean_out/max(mean_in,1e-10);assert .85<ratio<1.15,(file,ratio)
 rgba[:,:,:3]=clean;im.pixels.foreach_set(rgba.ravel());im.save_render(str(WORK/('clean-'+file)),scene=s)
 records.append({'file':file,'rawSha256':hashlib.sha256((WORK/('raw-'+file)).read_bytes()).hexdigest(),'maxRawRGB':float(original.max()),'maxDenoisedRGB':float(clean.max()),'meanRaw':mean_in,'meanDenoised':mean_out,'energyRatio':ratio,'meanAbsoluteChange':float(np.abs(clean-original).mean()),'normalAndUVChanged':False});print('DENOISED_LIGHTMAP',file,ratio,flush=True)
for record in records:shutil.copy2(WORK/('clean-'+record['file']),ASSET/record['file'])
manifest['runtimeTextureTransfer']={'diffuseEXRFlipY':True,'normalPNGFlipY':False,'UV':'TEXCOORD_0','normalYWithoutTangents':-1,'evidence':'four-corner WebGL float readback; UV0 unchanged'}
manifest['postprocess']={'tool':'Intel Open Image Denoise 2.5.1','filter':'RTLightmap','device':'CPU','input':'linear HDR diffuse; alpha preserved; no tone mapping','source':'https://www.openimagedenoise.org/downloads.html','binarySha256':hashlib.sha256(OIDN.read_bytes()).hexdigest(),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'records':records}
for file,meta in manifest['files'].items():meta.update(sha256=hashlib.sha256((ASSET/file).read_bytes()).hexdigest(),bytes=(ASSET/file).stat().st_size)
(ASSET/'asset-manifest.json').write_text(json.dumps(manifest,indent=2));print('LIGHTMAP_DENOISE_COMPLETE',flush=True)
