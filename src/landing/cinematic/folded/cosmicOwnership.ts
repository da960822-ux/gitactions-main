/** Source-pixel traces own opaque original stone; generated foliage selection stays outside these structural regions. */
export const ARCH_TRACE=[[0,0],[488,0],[470,35],[455,70],[444,110],[437,150],[436,172],[452,179],[450,192],[442,204],[432,218],[426,243],[425,560],[431,574],[445,582],[446,596],[463,605],[465,616],[487,628],[489,640],[517,648],[517,662],[0,662]];
export const RAIL_HOLES=[
 [[729,770],[732,748],[747,730],[761,725],[778,732],[791,748],[798,770],[794,781],[791,782],[792,826],[739,828],[739,788],[730,785]],
 [[835,773],[839,753],[852,739],[869,734],[887,740],[900,754],[907,773],[904,783],[902,784],[903,823],[845,825],[845,790],[837,788]],
 [[947,778],[951,760],[964,747],[980,742],[995,748],[1008,761],[1015,779],[1010,789],[1008,790],[1009,817],[957,820],[957,795],[949,792]],
 [[1054,783],[1058,768],[1071,755],[1086,750],[1101,756],[1114,770],[1121,784],[1117,793],[1115,794],[1116,813],[1065,815],[1065,799],[1057,796]],
 [[1155,788],[1160,774],[1171,763],[1186,758],[1200,764],[1210,777],[1216,790],[1212,799],[1210,800],[1210,808],[1164,811],[1164,804],[1158,802]],
];
const edgeSafeHoles=RAIL_HOLES.map(points=>{const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length;return points.map(([x,y])=>[x+Math.sign(cx-x)*2,y+Math.sign(cy-y)*2]);});
function polygonFunction(name:string,points:number[][]){return `bool ${name}(vec2 p){bool inside=false;vec2 vertices[${points.length}]=vec2[${points.length}](${points.map(([x,y])=>`vec2(${x}.,${y}.)`).join(',')});for(int i=0,j=${points.length-1};i<${points.length};j=i++){vec2 a=vertices[i],b=vertices[j];if((a.y>p.y)!=(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}`;}
export const COSMIC_COVERAGE_GLSL=[polygonFunction('originalArch',ARCH_TRACE),...edgeSafeHoles.map((p,i)=>polygonFunction('originalRailHole'+i,p)),`
float originalNearCoverage(vec2 uv,float generated){
 vec2 p=vec2(uv.x*1536.,(1.-uv.y)*1024.);
 float coverage=generated;
 if(p.y<662.){
  if(originalArch(p))coverage=1.;
  else if(p.x<530.&&(p.y<330.||(p.y>425.&&p.y<540.)))coverage=0.;
 }
 if(p.x>710.&&p.x<1240.&&p.y>660.&&p.y<835.){
  bool hole=${RAIL_HOLES.map((_,i)=>'originalRailHole'+i+'(p)').join('||')};
  coverage=p.y>=634.+p.x*.048&&!hole?1.:0.;
  if(p.x<805.&&p.y>750.)coverage=max(coverage,generated);
 }
 return coverage;
}`].join('\n');
