import * as T from 'three';
import {clamp} from './spaceMotion';

/** A broad folded gift ribbon, never a tube or wire. Same vertices unfold into the next surface. */
export function createRibbonGeometry() {
  const columns=96,rows=12,stride=columns+1,sheet=stride*(rows+1),positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(const side of [1,-1])for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){positions.push((col/columns-.5)*5.4,(row/rows-.5),side*.018);uvs.push(col/columns,row/rows);}
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const a=row*stride+col,b=a+1,c=a+stride,d=c+1;
    indices.push(a,b,c,b,d,c,a+sheet,c+sheet,b+sheet,b+sheet,c+sheet,d+sheet);
  }
  for(let row=0;row<rows;row++)for(const col of [0,columns]){const a=row*stride+col,b=a+stride;indices.push(a,a+sheet,b,b,a+sheet,b+sheet);}
  for(const row of [0,rows])for(let col=0;col<columns;col++){const a=row*stride+col,b=a+1;indices.push(a,b,a+sheet,b,b+sheet,a+sheet);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
  geometry.userData.original = new Float32Array(positions);
  geometry.userData.path=new T.CatmullRomCurve3([
    new T.Vector3(0,0,.05),new T.Vector3(-.65,.36,.34),new T.Vector3(-1.7,.83,.45),
    new T.Vector3(-2.25,.47,.12),new T.Vector3(-1.96,-.23,-.30),new T.Vector3(-.74,-.21,-.18),new T.Vector3(0,0,-.02),
  ],false,'centripetal');
  updateRibbon(geometry, 0);
  return geometry;
}
export function updateRibbon(geometry: T.BufferGeometry, amount: number) {
  const original = geometry.userData.original as Float32Array, positions = geometry.attributes.position as T.BufferAttribute;
  const path=geometry.userData.path as T.CatmullRomCurve3;
  for (let i = 0; i < positions.count; i++) {
    const x = original[i*3], y = original[i*3+1], u = x / 2.7;
    const t=clamp((u+1)/2),center=path.getPoint(t),tangent=path.getTangent(t),across=new T.Vector3(-tangent.y,tangent.x,0).normalize();
    const normal=tangent.clone().cross(across).normalize(),band=.18+.14*Math.pow(Math.sin(t*Math.PI),.7),thickness=original[i*3+2];
    const point=center.addScaledVector(across,y*band).addScaledVector(normal,thickness);point.z+=y*y*.055;
    const bowFolds=.075*Math.sin((u+1)*Math.PI*4)*Math.cos(y*Math.PI*.8)+.03*Math.sin(y*Math.PI*2+u*.8);
    const panelFolds=.42*Math.sin(u*Math.PI*4+y*.85)+.16*Math.sin(u*Math.PI*8-y*.7);
    const folds=T.MathUtils.lerp(bowFolds,panelFolds,amount);
    positions.setXYZ(i, T.MathUtils.lerp(point.x, u * 8.5, amount),
      T.MathUtils.lerp(point.y, y * 8, amount), T.MathUtils.lerp(point.z, -.08 * Math.cos(u * Math.PI)+folds+thickness, amount));
  }
  positions.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
}

export function createRibbonTailGeometry() {
  const shape=new T.Shape();shape.moveTo(-.15,0);shape.lineTo(.15,0);shape.lineTo(.22,-1.35);
  shape.quadraticCurveTo(.24,-1.57,.10,-1.62);shape.quadraticCurveTo(0,-1.66,-.10,-1.62);
  shape.quadraticCurveTo(-.24,-1.57,-.22,-1.35);shape.closePath();
  const geometry=new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelThickness:.008,bevelSize:.012,bevelSegments:2,steps:8,curveSegments:16});
  const positions=geometry.attributes.position as T.BufferAttribute;
  for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i);positions.setXYZ(i,x+Math.sin(y*2)*.12,y,positions.getZ(i)+Math.sin(y*2.2)*.13+y*y*.08);}
  positions.needsUpdate=true;geometry.computeVertexNormals();return geometry;
}

/** Six paper panels: a three-column fold followed by a horizontal fold. */
export function createPaperGeometry() {
  const geometry = new T.PlaneGeometry(1, 1, 60, 48);
  geometry.userData.original = new Float32Array(geometry.attributes.position.array);
  return geometry;
}
export function updatePaper(geometry: T.BufferGeometry, amount: number, width: number, height: number) {
  const original = geometry.userData.original as Float32Array, positions = geometry.attributes.position as T.BufferAttribute;
  const angle = Math.PI * (1 - clamp(amount));
  for (let i = 0; i < positions.count; i++) {
    const flatX = original[i*3] * width, flatY = original[i*3+1] * height;
    let x = flatX, y = flatY, z = 0;
    if (Math.abs(x) > width / 6) {
      const hinge = Math.sign(x) * width / 6, distance = x - hinge;
      x = hinge + distance * Math.cos(angle);
      z = -Math.abs(distance) * Math.sin(angle) + .006 * (1-amount);
    }
    if (y < 0) {z += -y * Math.sin(angle); y *= Math.cos(angle);}
    z += Math.sin(flatX / width * Math.PI) * Math.sin(flatY / height * Math.PI) * .16 * (1-amount);
    positions.setXYZ(i, x, y, z);
  }
  positions.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
}
