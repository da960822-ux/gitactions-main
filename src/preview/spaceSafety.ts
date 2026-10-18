export type ScreenRect={x:number;y:number;width:number;height:number};
export function keepHeartOutsidePortrait(x:number,y:number,radius:number,portrait:ScreenRect,side:-1|1){
 const gap=18,insideY=y+radius>portrait.y-gap&&y-radius<portrait.y+portrait.height+gap;
 if(insideY){const edge=side<0?portrait.x-gap-radius:portrait.x+portrait.width+gap+radius;x=side<0?Math.min(x,edge):Math.max(x,edge);}
 return{x,y};
}
