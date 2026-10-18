import {Object3D,Vector3} from 'three';
import {cameraPose,smoothRange} from './poseSpaceV11';
type Triple=readonly[number,number,number];
export type RigidPose={pivot:Triple;delta:Triple;angleY:number};
const up=new Vector3(0,1,0),rotatedPivot=new Vector3();
export function portraitStagePose(progress:number):RigidPose{
 const t=smoothRange(.10,.52,progress);
 if(progress<=.43)return{pivot:[1.85,0,.05],delta:[1.9*t,0,-4.4*t],angleY:-Math.PI/30*t};
 const start=smoothRange(.10,.52,.43),blend=smoothRange(.43,1,progress),cam=cameraPose(progress,1,false).position;
 const relativeX=(1.85+1.9*start+1.7)*(1-blend)+2.5*blend,relativeZ=(.05-4.4*start-8)*(1-blend)-8.5*blend;
 return{pivot:[1.85,0,.05],delta:[cam[0]+relativeX-1.85,0,cam[2]+relativeZ-.05],angleY:-Math.PI/30*start*(1-blend)+Math.PI/24*blend};
}
export function heroHingePose(progress:number,entrance=1):RigidPose{
 return{pivot:[18,0,-7],delta:[0,0,0],angleY:-75*Math.PI/180*smoothRange(.08,.43,progress)*entrance};
}
export function applyRigidPose(object:Object3D,pose:RigidPose){
 object.quaternion.setFromAxisAngle(up,pose.angleY);
 rotatedPivot.fromArray(pose.pivot).applyQuaternion(object.quaternion);
 object.position.set(pose.pivot[0]+pose.delta[0]-rotatedPivot.x,pose.pivot[1]+pose.delta[1]-rotatedPivot.y,pose.pivot[2]+pose.delta[2]-rotatedPivot.z);
 object.updateMatrix();
}
