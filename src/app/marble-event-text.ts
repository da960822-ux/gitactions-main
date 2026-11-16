import type {Language} from '../core/types';
export function marbleEventText(text:unknown,language:Language,names:Record<string,string>={}){
 const defaults:Record<string,string>=language==='ko'?{p1:'나',p2:'상대',p3:'팀원',p4:'상대 2',bank:'은행',fund:'공동 기금'}:{p1:'Tú',p2:'Rival',p3:'Compañero',p4:'Rival 2',bank:'Banco',fund:'Fondo común'};
 return String(text??'').replace(/\b(p[1-4]|bank|fund)\b/g,id=>names[id]??defaults[id]);
}
