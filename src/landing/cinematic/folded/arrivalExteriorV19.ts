import * as T from 'three';

// An illustrative daylight exterior is real scene geometry, not a second Hero photograph.
export function createArrivalExterior(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const sun=new T.Vector3(-.28,.12,-.95).normalize(),phase={value:0};
 const vertex=`#include <clipping_planes_pars_vertex>
 varying vec3 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
 #include <clipping_planes_vertex>
 }`;
 const skyMaterial=keep(new T.ShaderMaterial({side:T.BackSide,depthWrite:false,clipping:true,uniforms:{sun:{value:sun}},vertexShader:vertex,fragmentShader:`#include <clipping_planes_pars_fragment>
 uniform vec3 sun;varying vec3 vWorld;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}void main(){
 #include <clipping_planes_fragment>
 vec3 d=normalize(vWorld-cameraPosition);float h=max(d.y,0.);vec3 c=mix(vec3(.72,.38,.24),vec3(.055,.22,.32),smoothstep(-.02,.55,d.y));c=mix(vec3(.13,.25,.31),c,smoothstep(-.12,.025,d.y));float n=noise(d.xz*7.+d.y*12.)*.6+noise(d.xz*17.+d.y*31.)*.3+noise(d.xz*39.)*.1;float cloud=smoothstep(.48,.7,n)*smoothstep(.02,.15,h)*(1.-smoothstep(.45,.8,h));c=mix(c,vec3(.65,.58,.53),cloud*.8);float glow=pow(max(dot(d,sun),0.),22.),disc=pow(max(dot(d,sun),0.),2400.);c+=vec3(1.,.48,.2)*(glow*.38+disc*3.);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));
 const sky=new T.Mesh(keep(new T.SphereGeometry(220,24,12)),skyMaterial);sky.name='ILLUSTRATIVE_DAYLIGHT_SKY_BEYOND_STORY_WINDOW';sky.position.set(-10,0,-170);scene.add(sky);
 const waterMaterial=keep(new T.ShaderMaterial({clipping:true,uniforms:{sun:{value:sun},phase},vertexShader:vertex,fragmentShader:`#include <clipping_planes_pars_fragment>
 uniform vec3 sun;uniform float phase;varying vec3 vWorld;void main(){
 #include <clipping_planes_fragment>
 vec2 p=vWorld.xz;vec3 n=normalize(vec3(-.11*cos(p.x*.62+phase)-.07*cos(p.x*1.47+p.y*.72),1.,-.075*cos(p.y*.76-phase)-.034*cos(p.x*1.47+p.y*.72)));vec3 v=normalize(cameraPosition-vWorld),h=normalize(v+sun);float fresnel=pow(1.-max(dot(n,v),0.),4.);vec3 c=mix(vec3(.012,.14,.16),vec3(.17,.35,.4),fresnel);float spec=pow(max(dot(n,h),0.),110.);c+=vec3(1.,.54,.27)*spec*2.3;c+=vec3(.06,.11,.11)*max(n.y-.94,0.);gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));
 const geometry=keep(new T.PlaneGeometry(240,240,64,64));geometry.rotateX(-Math.PI/2);const pos=geometry.getAttribute('position'),original=new Float32Array(pos.array);
 const water=new T.Mesh(geometry,waterMaterial);water.name='ACTUAL_WAVE_SURFACE_OUTSIDE_ENTRY';water.position.set(-10,-3.5,-195);scene.add(water);
 return{update(p:number){phase.value=p*4;for(let i=0;i<pos.count;i++){const x=original[i*3],z=original[i*3+2];pos.setY(i,.12*Math.sin(x*.62+phase.value)+.08*Math.sin(z*.76-phase.value));}pos.needsUpdate=true;}};
}
