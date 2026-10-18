import {it,expect} from 'vitest';
import {Object3D,PerspectiveCamera,Vector3} from 'three';
import {cameraPose} from './poseSpaceV15';
import {portraitStagePose,applyRigidPose} from './stageMotionV15';
it('keeps both full portrait corners inside the actual arrival camera without changing the Hero pose',()=>{
 const pose=cameraPose(1,1,false),camera=new PerspectiveCamera(48,16/9,.1,400);camera.position.fromArray(pose.position);camera.lookAt(...pose.target as[number,number,number]);camera.updateMatrixWorld();const rig=new Object3D();applyRigidPose(rig,portraitStagePose(1));rig.updateMatrixWorld();
 for(const x of[-2.95,2.95])for(const y of[-2.95,2.95]){const point=new Vector3(1.85+x,.03+y,.05).applyMatrix4(rig.matrixWorld).project(camera);expect(Math.abs(point.x)).toBeLessThan(.99);expect(Math.abs(point.y)).toBeLessThan(.99);}
 expect(portraitStagePose(0).delta).toEqual([0,0,-0]);expect(cameraPose(0,1,false).position).toEqual([0,.3,11.7]);
});
