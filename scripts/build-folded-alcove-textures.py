"""Small deterministic PBR data textures, independent of the approved portrait."""
from pathlib import Path
import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image
root=Path(__file__).resolve().parents[1]/'public/models/folded-alcove'
rng=np.random.default_rng(4042025)
for name,sigma in [('plaster',(1.2,1.2)),('brushed',(.5,12))]:
 height=gaussian_filter(rng.standard_normal((512,512)),sigma,mode='wrap');height/=height.std();dy,dx=np.gradient(height)
 normals=np.stack([-dx*.12,-dy*.12,np.ones_like(height)],axis=-1);normals/=np.linalg.norm(normals,axis=-1,keepdims=True)
 Image.fromarray(np.round((normals*.5+.5)*255).astype('uint8'),'RGB').save(root/(name+'-normal.png'))
