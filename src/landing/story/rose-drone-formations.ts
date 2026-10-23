export const ROSE_DRONE_COUNT=256;
export const ROSE_DRONE_CYCLE=64;
export const ROSE_DRONE_PALETTE=['#ffda39','#ff494f','#ff913b','#398dff','#8beaff','#fff4e5','#ffa2cb'];
export const ROSE_DRONE_FORMATIONS=['pokeball','magikarp','gyarados','pikachu','heart'] as const;
type XY=readonly[number,number];
type Light={x:number;y:number;color:number};

// Authored light paths follow the official Pokédex silhouettes, not raster overlays.
function line(path:readonly XY[],count:number,color:number):Light[]{
 const distances=[0];for(let i=1;i<path.length;i++)distances.push(distances[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
 return Array.from({length:count},(_,index)=>{
  const distance=(index+.5)/count*distances[distances.length-1],end=distances.findIndex(value=>value>=distance),a=path[end-1],b=path[end],mix=(distance-distances[end-1])/(distances[end]-distances[end-1]);
  return{x:a[0]+(b[0]-a[0])*mix,y:a[1]+(b[1]-a[1])*mix,color};
 });
}
function arc(x:number,y:number,rx:number,ry:number,count:number,color:number,start=0,end=Math.PI*2){
 return line(Array.from({length:97},(_,index):XY=>{const a=start+(end-start)*index/96;return[x+Math.cos(a)*rx,y+Math.sin(a)*ry];}),count,color);
}
function curve(start:XY,...segments:readonly[XY,XY,XY][]){
 const points:XY[]=[start];let a=start;
 for(const [b,c,d] of segments){for(let i=1;i<=24;i++){const t=i/24,s=1-t;points.push([s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]]);}a=d;}
 return points;
}
function pokeball(){
 return[
  ...arc(600,-160,132,132,36,1,Math.PI,Math.PI*2),...arc(600,-160,132,132,36,5,0,Math.PI),
  ...line([[468,-160],[570,-160]],20,3),...line([[630,-160],[732,-160]],20,3),
  ...arc(600,-160,27,27,20,5),...arc(600,-160,10,10,12,5),
  ...[100,75,50].flatMap((radius,index)=>arc(600,-160,radius,radius,[24,20,12][index],1,Math.PI+.15,Math.PI*2-.15)),
  ...[100,75,50].flatMap((radius,index)=>arc(600,-160,radius,radius,[24,20,12][index],5,.15,Math.PI-.15)),
 ];
}
function magikarp(){
 return[
  ...line(curve([414,-184],[[460,-240],[626,-238],[694,-176]],[[739,-127],[674,-63],[562,-72]],[[474,-71],[416,-99],[414,-184]]),64,1),
  ...line([[693,-170],[817,-236],[789,-150],[842,-78],[699,-111],[693,-170]],32,5),
  ...line([[708,-153],[798,-207],[756,-145],[819,-99],[708,-129]],12,5),
  ...arc(395,-148,34,47,24,6),...arc(442,-177,20,23,18,5),...arc(436,-175,5,7,3,3),
  ...line(curve([385,-136],[[378,-95],[333,-91],[349,-131]]),12,0),
  ...line(curve([411,-126],[[449,-84],[463,-114],[438,-129]]),12,0),
  ...line([[506,-221],[509,-275],[535,-253],[555,-293],[580,-256],[609,-276],[607,-224]],24,0),
  ...line([[533,-77],[554,-31],[581,-52],[600,-79]],16,0),
  ...line([[515,-161],[568,-139],[543,-104],[515,-161],[544,-137]],20,5),
  ...line(curve([481,-199],[[501,-170],[494,-130],[476,-111]]),11,2),
  ...line([[582,-192],[597,-181],[581,-166],[598,-151],[583,-137],[600,-121]],8,2),
 ];
}
function gyarados(){
 const spine=curve([722,-191],[[706,-130],[663,-54],[593,-65]],[[508,-77],[462,-144],[503,-197]],[[542,-248],[626,-240],[602,-190]],[[575,-145],[453,-158],[344,-169]]);
 const sides=(side:number):XY[]=>spine.map((p,index)=>{const before=spine[Math.max(0,index-1)],after=spine[Math.min(spine.length-1,index+1)],dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy),width=29*(1-index/spine.length)+4;return[p[0]-dy/length*width*side,p[1]+dx/length*width*side];});
 const left=sides(1),right=sides(-1);
 return[
  ...line([...left,...right.reverse(),left[0]],76,3),...line(left.slice(0,70),24,5),
  ...[8,15,22,29,36,43,50,57].flatMap(index=>line([left[index],[(left[index][0]+spine[index][0])/2,(left[index][1]+spine[index][1])/2]],3,5)),
  ...line([[646,-54],[626,-20],[608,-61],[585,-31],[575,-68]],8,4),
  ...line([[480,-155],[451,-179],[485,-197],[467,-225],[510,-222]],8,4),
  ...line([[407,-159],[381,-194],[365,-172],[332,-196],[344,-166]],8,4),
  ...line([[684,-242],[706,-266],[738,-262],[760,-247],[793,-232],[812,-198],[798,-161],[765,-151],[735,-164],[718,-190],[688,-200],[684,-242]],32,3),
  ...arc(776,-205,26,40,24,6),...line([[751,-234],[760,-210],[769,-235]],4,5),...line([[782,-234],[790,-210],[799,-235]],4,5),
  ...line([[711,-243],[721,-247],[733,-241]],3,5),{x:724,y:-239,color:1},
  ...line([[752,-245],[764,-248],[776,-241]],3,5),{x:765,y:-239,color:1},
  ...line([[704,-262],[690,-289],[716,-280],[726,-302],[739,-278],[759,-289],[754,-260]],20,4),
  ...line(curve([744,-183],[[716,-160],[698,-174],[697,-130]]),8,4),
  ...line(curve([807,-194],[[844,-177],[823,-151],[842,-135]]),8,4),
 ];
}
function pikachu(){
 return[
  ...line(curve([535,-40],[[522,-63],[500,-74],[484,-115]],[[472,-145],[484,-174],[504,-187]],[[497,-215],[484,-256],[480,-284]],[[483,-296],[488,-301],[494,-299]],[[518,-274],[538,-231],[552,-205]],[[575,-212],[611,-210],[632,-216]],[[655,-241],[688,-280],[708,-295]],[[719,-294],[722,-289],[720,-285]],[[713,-256],[700,-210],[686,-185]],[[712,-159],[708,-124],[686,-102]],[[666,-82],[670,-55],[652,-38]],[[628,-24],[560,-22],[535,-40]]),110,0),
  ...line([[486,-264],[480,-284],[494,-299],[510,-272]],9,3),...line([[686,-267],[708,-295],[720,-285],[711,-259]],9,3),
  ...arc(510,-117,16,13,12,1),...arc(678,-117,16,13,12,1),
  ...arc(548,-149,9,11,8,5),...arc(638,-149,9,11,8,5),
  ...line([[590,-131],[596,-127],[601,-132]],3,2),
  ...line(curve([565,-106],[[576,-89],[587,-98],[595,-103]],[[605,-94],[617,-89],[626,-107]]),17,6),
  ...line([[526,-80],[546,-72],[557,-85]],6,0),...line([[634,-85],[648,-72],[665,-82]],6,0),
  ...arc(552,-32,19,7,7,0,0,Math.PI),...arc(639,-32,19,7,7,0,0,Math.PI),
  ...line([[686,-74],[737,-100],[724,-131],[774,-182],[817,-162],[777,-120],[799,-101],[731,-67],[716,-86],[688,-61]],34,0),
  ...line(curve([565,-63],[[582,-51],[613,-52],[629,-65]]),8,0),
 ];
}
function heart(){
 const outline=Array.from({length:385},(_,index):XY=>{const t=index/384*Math.PI*2;return[600+288*Math.sin(t)**3,-180-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*9.4];});
 return[...line(outline,160,6),...line(outline.map(([x,y]):XY=>[600+(x-600)*.76,-167+(y+167)*.76]),96,0)];
}
const raw=[pokeball(),magikarp(),gyarados(),pikachu(),heart()];
// Stable drone IDs take short routes to each next formation, including the evolution.
export const roseDroneFormations:Light[][]=[raw[0]];
for(let scene=1;scene<raw.length;scene++){
 const available=new Set(raw[scene].map((_,index)=>index));
 roseDroneFormations.push(roseDroneFormations[scene-1].map(previous=>{
  let nearest=-1,distance=Infinity;for(const index of available){const point=raw[scene][index],d=(point.x-previous.x)**2+(point.y-previous.y)**2;if(d<distance){distance=d;nearest=index;}}
  available.delete(nearest);return raw[scene][nearest];
 }));
}
const smooth=(a:number,b:number,value:number)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
export function roseDronePosition(index:number,time:number){
 const t=((time%ROSE_DRONE_CYCLE)+ROSE_DRONE_CYCLE)%ROSE_DRONE_CYCLE;
 const scene=Math.min(4,Math.floor(Math.max(0,t-4)/12)),local=Math.max(0,t-4)%12;
 const from=roseDroneFormations[scene][index],to=roseDroneFormations[Math.min(4,scene+1)][index];
 const delay=index%11*.012,mix=scene<4?smooth(delay,1-delay,(local-8)/4):0;
 const enter=smooth(index%8*.06,3.5+index%8*.06,t),leave=smooth(60,64,t),flight=t<4?enter:1-leave;
 const target={x:from.x+(to.x-from.x)*mix,y:from.y+(to.y-from.y)*mix-18*Math.sin(mix*Math.PI)};
 const start={x:index<ROSE_DRONE_COUNT/2?-270-index*2:1470+(index-ROSE_DRONE_COUNT/2)*2,y:310+(index%12)*17};
 return{x:start.x+(target.x-start.x)*flight,y:start.y+(target.y-start.y)*flight+Math.sin(flight*Math.PI)*(index<ROSE_DRONE_COUNT/2?-70:70)+Math.sin(t*.8)*2*flight,
  alpha:smooth(0,.8,t)*(1-smooth(63,64,t)),color:to.color,fromColor:from.color,colorMix:mix,
  formation:t<4||t>=60?'flight':scene<4&&local>=8?'morph':ROSE_DRONE_FORMATIONS[scene]};
}
