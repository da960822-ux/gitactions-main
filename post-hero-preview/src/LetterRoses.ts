import * as THREE from 'three';

/** Eight real blooms, with no time loop: opening and reverse share the same pose. */
export function createLetterRoses(){
 const root=new THREE.Group();root.name='LETTER_EIGHT_ROSES';
 const petal=new THREE.MeshStandardMaterial({color:'#a84d66',roughness:.57,side:THREE.DoubleSide});
 const inner=new THREE.MeshStandardMaterial({color:'#ca7b8e',roughness:.63,side:THREE.DoubleSide});
 const green=new THREE.MeshStandardMaterial({color:'#5d7161',roughness:.82});
 const geometry=new THREE.BufferGeometry(),points:number[]=[],indices:number[]=[];
 const cols=8,rows=6;
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const u=x/cols-.5,v=y/rows;points.push(u*.46*Math.sin(.4+v*2.2),v*.43,.11*Math.sin(v*Math.PI)+u*u*.18+v*v*.045);}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x;indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const stemGeometry=new THREE.CylinderGeometry(.018,.025,1,8),leafGeometry=new THREE.SphereGeometry(1,12,8),matrix=new THREE.Matrix4(),dummy=new THREE.Object3D();
 const instances:THREE.InstancedMesh[]=[];let disposed=false;
 const roses:Array<{root:THREE.Group;y:number;side:number;index:number}>=[];
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const rose=new THREE.Group();rose.name=`LETTER_ROSE_${side<0?'LEFT':'RIGHT'}_${i+1}`;const y=1.4+i*.78;rose.position.set(side*(5.4+(i%2)*.52),y,-.45-(i%2)*.45);root.add(rose);
  const stem=new THREE.Mesh(stemGeometry,green);stem.scale.y=y;stem.position.y=-y/2;stem.castShadow=true;rose.add(stem);
  for(const sign of [-1,1]){const leaf=new THREE.Mesh(leafGeometry,green);leaf.scale.set(.2,.055,.08);leaf.position.set(sign*.12,-y*.45,0);leaf.rotation.z=sign*.5;rose.add(leaf);}
  const bloom=new THREE.Group();bloom.rotation.set(-.2,side*.18,i*.3);rose.add(bloom);
  const outer=new THREE.InstancedMesh(geometry,petal,18),core=new THREE.InstancedMesh(geometry,inner,12);instances.push(outer,core);outer.castShadow=core.castShadow=true;bloom.add(outer,core);
  for(let k=0;k<30;k++){const inside=k>=18,local=inside?k-18:k,ring=inside?Math.floor(local/6):Math.floor(local/9),count=inside?6:9,angle=local%count/count*Math.PI*2+ring*.34;dummy.position.set(Math.sin(angle)*(inside?.02:.08+ring*.04),Math.cos(angle)*(inside?.02:.08+ring*.04),inside?.1+ring*.05:ring*.025);dummy.rotation.set(inside?.25:-.23,0,-angle);dummy.scale.setScalar(inside?.58-ring*.12:1-ring*.1);dummy.updateMatrix();matrix.copy(dummy.matrix);(inside?core:outer).setMatrixAt(local,matrix);}
  outer.instanceMatrix.needsUpdate=core.instanceMatrix.needsUpdate=true;roses.push({root:rose,y,side,index:i});
 }
 return {root,update(opening:number){if(disposed)return;roses.forEach(rose=>{const q=THREE.MathUtils.smoothstep(opening,.3+rose.index*.09,.64+rose.index*.09);rose.root.visible=q>0;rose.root.scale.setScalar(q);rose.root.position.y=rose.y-(1-q)*.5;rose.root.rotation.z=rose.side*(1-q)*.18;});},dispose(){if(disposed)return;disposed=true;root.removeFromParent();instances.forEach(mesh=>mesh.dispose());geometry.dispose();stemGeometry.dispose();leafGeometry.dispose();petal.dispose();inner.dispose();green.dispose();}};
}
