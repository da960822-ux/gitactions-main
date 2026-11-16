import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleResultPanel } from './MarbleResultPanel';

describe('Marble result dialog',()=>{
  it('makes the winner, final state, reason and scores explicit',()=>{
    const html=renderToStaticMarkup(createElement(MarbleResultPanel,{language:'ko',winnerLabel:'우리 팀 승리',reason:'상대 팀 모두 파산',scores:[{name:'우리 팀',score:4230},{name:'상대 팀',score:0}],onReplay:()=>{},onExit:()=>{}}));
    expect(html).toContain('<dialog');expect(html).toContain('aria-modal="true"');expect(html).toContain('aria-labelledby=');expect(html).toContain('aria-describedby=');expect(html).toContain('경기 종료 · 최종 결과');expect(html).toContain('우리 팀 승리</h2>');expect(html).toContain('상대 팀 모두 파산');expect(html).toContain('4,230');expect(html).toContain('새 게임 시작');expect(html).toContain('게임 나가기');
  });
  it('locks replay while the online handshake is awaiting agreement',()=>{
    const html=renderToStaticMarkup(createElement(MarbleResultPanel,{language:'es',winnerLabel:'Ganaste',reason:'Fin',scores:[],onReplay:()=>{},replayPending:true,scoreLabel:'Puntuación final'}));
    expect(html).toContain('disabled=');expect(html).toContain('Esperando acuerdo');expect(html).toContain('Puntuación final');
  });
  it('supports Spanish draws and only renders supported exit actions',()=>{
    const html=renderToStaticMarkup(createElement(MarbleResultPanel,{language:'es',winnerLabel:'Empate',reason:'Mismo patrimonio',scores:[{name:'Tú',score:1000},{name:'Rival',score:1000}],draw:true,onExit:()=>{}}));
    expect(html).toContain('Partida terminada');expect(html).toContain('Empate</h2>');expect(html).toContain('Patrimonio final');expect(html).toContain('Salir del juego');expect(html).not.toContain('Jugar de nuevo');expect(html).not.toContain('<svg');
  });
});
