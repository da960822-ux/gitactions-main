import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.LANDING_URL || 'http://127.0.0.1:5192/';
const outputDir = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/playwright/game-polish/minhwatu-native');
await fs.mkdir(outputDir, { recursive: true });
const browser = await launchChromium();
const report = { baseUrl, fixture: 'Vite browser harness using real Minhwatu engine, view projection, React table and presentation hook; deterministic local state only (no Supabase/Realtime)', checks: [], screenshots: [], errors: [], limits: ['No deployed Supabase, WebSocket/Realtime, physical audio playback or hardware latency was tested.', 'Replay consent UI is exercised through deterministic pending/request props; two-player consent persistence is not tested here.'] };
const check = (name, pass, detail = '') => report.checks.push({ name, pass: Boolean(pass), detail });
const nearby = (actual, expected, tolerance = 18) => actual && expected && Math.abs(actual.x - expected.x) <= tolerance && Math.abs(actual.y - expected.y) <= tolerance;
const mayStack = (kind, count) => ((kind === 'animal' || kind === 'ribbon') && count > 5) || (kind === 'plain' && count > 10);
const captureCategoryPass = category => {
  const stack = mayStack(category.kind, category.ids.length), boxes = category.cards;
  const facesVisible = boxes.every(card => card.visible && card.loaded && card.x >= -1 && card.right <= category.rackRight + 1);
  const ordered = category.rows.every(row => row.cards.every((card, index) => index === 0 || card.x >= row.cards[index - 1].x - 1));
  const rowsOrdered = category.rows.every((row, index) => index === 0 || row.y > category.rows[index - 1].y + 1);
  const expectedRows = category.kind === 'plain' && boxes.length > 10
    ? Array.from({ length: Math.ceil(boxes.length / 10) }, (_, index) => Math.min(10, boxes.length - index * 10))
    : boxes.length ? [boxes.length] : [];
  return category.labelVisible && category.labelFont >= 12 && Number(category.countText) === category.ids.length &&
    category.labelOverlaps.length === 0 && category.clipped.length === 0 && category.bankClipped.length === 0 &&
    category.scroll.width <= category.scroll.clientWidth + 1 && category.scroll.height <= category.scroll.clientHeight + 1 &&
    facesVisible && ordered && rowsOrdered && category.firstFullyVisible && category.lastFullyVisible && category.crossRowOverlaps.length === 0 &&
    JSON.stringify(category.rows.map(row => row.cards.length)) === JSON.stringify(expectedRows) &&
    (stack || category.overlaps.length === 0);
};

async function open(language, width, height, reduced = false) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript(lang => localStorage.setItem('dos-language', lang), language);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(`${language}-${width}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error' && !/realtime\/v1\/websocket/.test(message.text())) report.errors.push(`${language}-${width}: ${message.text()}`); });
  await page.goto(new URL('__minhwatu_native_check__', baseUrl).href, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const [{ minhwatuEngine }, { MinhwatuTable }, { GameFeedback }, reactModule, domModule] = await Promise.all([
      import('/src/games/minhwatu.ts'), import('/src/app/MinhwatuTable.tsx'), import('/src/app/GameFeedback.tsx'),
      import('/node_modules/.vite/deps/react.js'), import('/node_modules/.vite/deps/react-dom_client.js'),
    ]);
    const React = reactModule.default, { createRoot } = domModule.default ?? domModule;
    document.querySelector('#root')?.setAttribute('hidden', '');
    const host = document.createElement('main'); host.id = 'minhwatu-native-proof';
    host.style.cssText = 'width:100%;padding:8px 12px 24px;box-sizing:border-box;min-height:100vh'; document.body.append(host);
    let root = createRoot(host), state, language = 'ko', viewer = 'p1', scene = 0, revision = 0, replayPending = false, replayCalls = 0;
    const render = () => root.render(React.createElement(NativeApp, { revision: ++revision }));
    function NativeApp() {
      const view = minhwatuEngine.getPlayerView(state, viewer);
      window.__minhwatuView = view;
      return React.createElement(React.Fragment, null,
        React.createElement(MinhwatuTable, { view, language, playerId: viewer, playerNames: { p1: 'Yeonseok', p2: 'Lisbeth' }, runAction: async action => { state = minhwatuEngine.applyAction(state, viewer, action); render(); return true; }, sceneKey: String(scene), replayPending, onReplay: async () => { replayCalls++; replayPending = true; render(); } }),
        React.createElement(GameFeedback, { gameId: 'minhwatu', language, playerId: viewer, view }));
    }
    const initial = minhwatuEngine.createInitialState(20261011);
    const all = [...initial.hands.p1, ...initial.hands.p2, ...initial.table, ...initial.deck];
    const cardMap = new Map(all.map(card => [card.id, card]));
    const allIds = all.map(card => card.id);
    const arrange = ({ p1Hand, p2Hand, table, deck, p1Captures = [], p2Captures = [] }) => {
      const used = new Set();
      const take = ids => ids.map(id => { if (used.has(id) || !cardMap.has(id)) throw new Error(`bad fixture card ${id}`); used.add(id); return structuredClone(cardMap.get(id)); });
      const hands = { p1: take(p1Hand), p2: take(p2Hand) }, board = take(table), stock = take(deck), captures = { p1: take(p1Captures), p2: take(p2Captures) };
      if (used.size !== 48) throw new Error(`fixture has ${used.size}/48 cards`);
      return { ...initial, rulesVersion: 2, turn: 'p1', hands, table: board, deck: stock, captures, pending: null, phase: 'play', result: null, events: [{ sequence: 1, type: 'deal', title: { ko: '패를 나눴어요', es: 'Se repartieron las cartas' }, cards: board.map(card => structuredClone(card)) }] };
    };
    const stateWithMatches = (handMatches, drawMatches) => {
      const p1Hand = ['1-1','2-1','2-2','2-3','2-4','3-1','3-2','3-3','3-4','4-1'];
      const p2Hand = ['4-2','4-3','4-4','5-2','5-3','5-4','6-2','6-3','6-4','7-2'];
      const table = [...[2,3,4].slice(0, handMatches).map(i => `1-${i}`), ...[2,3,4].slice(0, drawMatches).map(i => `12-${i}`)];
      for (const id of allIds) if (table.length < 8 && !p1Hand.includes(id) && !p2Hand.includes(id) && !table.includes(id) && !id.startsWith('1-') && !id.startsWith('12-')) table.push(id);
      if (table.length !== 8) throw new Error(`table fixture has ${table.length} cards`);
      const reserved = new Set([...p1Hand, ...p2Hand, ...table, '12-1']);
      const deck = ['12-1', ...allIds.filter(id => !reserved.has(id)).slice(0, 19)];
      return arrange({ p1Hand, p2Hand, table, deck });
    };
    const normalState = () => stateWithMatches(2, 0);
    const godori = () => {
      const p1Hand = ['8-1'], p2Hand = ['12-4'], table = ['8-2','1-1','3-1','5-1','6-1','7-1','9-1','10-1'], deck = ['12-3'];
      const p1Captures = ['2-1','4-1'];
      const used = new Set([...p1Hand, ...p2Hand, ...table, ...deck, ...p1Captures]);
      p1Captures.push(...allIds.filter(id => !used.has(id)));
      return arrange({ p1Hand, p2Hand, table, deck, p1Captures });
    };
    const denseState = () => {
      const p1Captures = allIds.filter(id => cardMap.get(id).kind === 'ribbon').slice(0, 9).concat(allIds.filter(id => cardMap.get(id).kind === 'plain').slice(0, 23));
      const used = new Set(p1Captures), rest = allIds.filter(id => !used.has(id));
      const p1Hand = rest.slice(0,4), p2Hand = rest.slice(4,8), table = rest.slice(8,16), deck = rest.slice(16);
      return arrange({ p1Hand, p2Hand, table, deck, p1Captures });
    };
    const idsOf = kind => allIds.filter(id => cardMap.get(id).kind === kind);
    const worstHandState = () => {
      const p1Captures = [...idsOf('animal').filter(id => id !== '2-1').slice(0,6), ...idsOf('ribbon').filter(id => id !== '2-2').slice(0,6), ...idsOf('plain').slice(0,3)];
      const p2Captures = idsOf('plain').slice(3,18), captured = new Set([...p1Captures, ...p2Captures]);
      const rest = allIds.filter(id => !captured.has(id)), p1Hand = ['2-1', ...rest.filter(id => id !== '2-1' && id !== '2-2').slice(0,4)];
      const hand1 = new Set(p1Hand), p2Hand = rest.filter(id => !hand1.has(id) && id !== '2-2').slice(0,5);
      const used = new Set([...p1Hand, ...p2Hand]), table = ['2-2', ...rest.filter(id => !used.has(id) && id !== '2-2').slice(0,3)];
      const placed = new Set([...used, ...table]), deck = rest.filter(id => !placed.has(id));
      if (p1Captures.length !== 15 || p2Captures.length !== 15 || p1Hand.length !== 5 || p2Hand.length !== 5 || table.length !== 4 || deck.length !== 4) throw new Error('bad worst-hand conservation fixture');
      return arrange({ p1Hand, p2Hand, table, deck, p1Captures, p2Captures });
    };
    const field14State = () => {
      const p1Captures = [...idsOf('animal').slice(0,4), ...idsOf('ribbon').slice(0,4)];
      const p2Captures = idsOf('plain').slice(0,6), captured = new Set([...p1Captures, ...p2Captures]);
      const rest = allIds.filter(id => !captured.has(id)), p1Hand = ['1-1', ...rest.filter(id => id !== '1-1').slice(0,9)];
      const hand1 = new Set(p1Hand), p2Hand = [...rest.filter(id => !hand1.has(id) && id.startsWith('1-')).slice(0,2), ...rest.filter(id => !hand1.has(id) && !id.startsWith('1-')).slice(0,8)];
      const used = new Set([...p1Hand, ...p2Hand]), table = rest.filter(id => !used.has(id)).slice(0,14), deck = rest.filter(id => !used.has(id) && !table.includes(id));
      if (p1Captures.length + p2Captures.length !== 14 || p1Hand.length !== 10 || p2Hand.length !== 10 || table.length !== 14 || deck.length !== 0 || table.some(id => id.startsWith('1-'))) throw new Error('bad field-14 conservation fixture');
      return arrange({ p1Hand, p2Hand, table, deck, p1Captures, p2Captures });
    };
    const emptyFieldState = () => {
      const p1Captures = idsOf('plain').slice(0,10), p2Captures = [...idsOf('plain').slice(10,20)];
      const captured = new Set([...p1Captures, ...p2Captures]), rest = allIds.filter(id => !captured.has(id));
      const p1Hand = ['1-1', ...rest.filter(id => id !== '1-1').slice(0,9)], hand1 = new Set(p1Hand);
      const p2Hand = rest.filter(id => !hand1.has(id)).slice(0,10), used = new Set([...p1Hand, ...p2Hand]);
      const deck = rest.filter(id => !used.has(id));
      if (p1Hand.length !== 10 || p2Hand.length !== 10 || p1Captures.length !== 10 || p2Captures.length !== 10 || deck.length !== 8) throw new Error('bad empty-field conservation fixture');
      return arrange({ p1Hand, p2Hand, table: [], deck, p1Captures, p2Captures });
    };
    const piCountState = count => {
      const p1Captures = idsOf('plain').slice(0, count), captured = new Set(p1Captures), rest = allIds.filter(id => !captured.has(id));
      const p1Hand = rest.slice(0,10), p2Hand = rest.slice(10,20), remaining = rest.slice(20);
      const fieldCount = Math.min(8, remaining.length), table = remaining.slice(0,fieldCount), deck = remaining.slice(fieldCount);
      const state = arrange({ p1Hand, p2Hand, table, deck, p1Captures });
      if (state.hands.p1.length !== 10 || state.hands.p2.length !== 10 || state.captures.p1.length !== count || state.table.length !== fieldCount || state.deck.length !== 48-count-20-fieldCount) throw new Error(`bad ${count}-plain conservation fixture`);
      return state;
    };
    const allCapturedState = () => {
      const state = arrange({ p1Hand: [], p2Hand: [], table: [], deck: [], p1Captures: allIds.slice(0,24), p2Captures: allIds.slice(24) });
      state.phase = 'finished';
      const scores = minhwatuEngine.getPlayerView(state, 'p1').board.scores;
      state.result = { winner: scores.p1 === scores.p2 ? 'draw' : scores.p1 > scores.p2 ? 'p1' : 'p2', reason: 'deterministic QA fixture', scores };
      state.events = [...state.events, { sequence: 2, type: 'win', winner: state.result.winner, title: { ko: '정산 완료', es: 'Partida terminada' } }];
      return state;
    };
    window.__minhwatuProof = {
      engine: minhwatuEngine,
      mount(next, lang = language, seat = 'p1', nextScene = true) { state = structuredClone(next); language = lang; viewer = seat; replayPending = false; window.__minhwatuCues = []; if (nextScene) scene++; render(); },
      setViewer(seat) { viewer = seat; scene++; render(); },
      setReplayPending(value) { replayPending = value; render(); },
      view(seat = viewer) { return minhwatuEngine.getPlayerView(state, seat); },
      state() { return structuredClone(state); },
      hiddenIds(seat) { return state.hands[seat].map(card => card.id); },
      replayCalls() { return replayCalls; },
      normalState, godoriState: godori, denseState, worstHandState, field14State, emptyFieldState, piCountState, stateWithMatches,
      allCapturedState,
      renderAgain() { render(); },
      backlog() { const max=Math.max(...state.events.map(event=>event.sequence)); state.events=[...state.events,...Array.from({length:14},(_,index)=>({sequence:max+index+1,type:'turn',actor:'p1',title:{ko:'새 차례',es:'Nuevo turno'}}))]; render(); },
      remount() { root.unmount(); root = createRoot(host); render(); },
    };
    window.__minhwatuCues = [];
    window.addEventListener('minhwatu-presentation-cue', event => window.__minhwatuCues.push({ at: performance.now(), ...event.detail }));
  });
  return { context, page };
}

const idle = page => page.waitForFunction(() => !document.querySelector('.hwatu-motion-stage.is-animating') && !document.querySelector('.hwatu-flight'), null, { timeout: 7000 });
const cardRects = async (page, selector) => page.locator(selector).evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,id:node.getAttribute('data-hwatu-card-id') }; }));
async function screenshot(page, name, fullPage = false) { const file = path.join(outputDir, `${name}.png`); await page.screenshot({ path: file, fullPage }); report.screenshots.push(file); return file; }

async function auditCaptureBanks(page) {
  return page.evaluate(() => {
    const state=window.__minhwatuProof.state(), kinds=['bright','animal','ribbon','plain'], allNodes=[...document.querySelectorAll('.hwatu-capture-rack .hwatu-captured-card[data-hwatu-card-id]')];
    const visible=node=>{const style=getComputedStyle(node),r=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&r.width>0&&r.height>0};
    const banks=['p1','p2'].map(seat=>{
      const rack=document.querySelector(`.hwatu-capture-rack[data-seat="${seat}"]`), categories=kinds.map(kind=>{
        const section=rack?.querySelector(`[data-hwatu-zone="captures-${seat}-${kind}"]`), label=section?.querySelector('.hwatu-category-label'), cards=[...(section?.querySelectorAll('.hwatu-captured-card[data-hwatu-card-id]')??[])], rect=section?.getBoundingClientRect(), boxes=cards.map(card=>{const r=card.getBoundingClientRect(),img=card.querySelector('img.gb-hwatu-face');return {id:card.getAttribute('data-hwatu-card-id'),x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible:visible(card)&&visible(img),loaded:!!img?.complete&&img.naturalWidth>0};}), overlaps=[];
        const rows=[]; for(const box of boxes){const row=rows.at(-1);if(row&&Math.abs(row.y-box.y)<=2)row.cards.push(box);else rows.push({y:box.y,cards:[box]});}
        const crossRowOverlaps=[]; for(let r=0;r<rows.length;r++)for(let s=r+1;s<rows.length;s++)for(const a of rows[r].cards)for(const b of rows[s].cards)if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)crossRowOverlaps.push([a.id,b.id]);
        for(const row of rows)for(let i=0;i<row.cards.length;i++)for(let j=i+1;j<row.cards.length;j++)if(Math.min(row.cards[i].right,row.cards[j].right)-Math.max(row.cards[i].x,row.cards[j].x)>1&&Math.min(row.cards[i].bottom,row.cards[j].bottom)-Math.max(row.cards[i].y,row.cards[j].y)>1)overlaps.push([row.cards[i].id,row.cards[j].id]);
        const clipped=rect?boxes.filter(box=>box.x<rect.left-1||box.y<rect.top-1||box.right>rect.right+1||box.bottom>rect.bottom+1).map(box=>box.id):boxes.map(box=>box.id), style=section?getComputedStyle(section):null, labelRect=label?.getBoundingClientRect(),labelOverlaps=labelRect?boxes.filter(box=>Math.min(box.right,labelRect.right)-Math.max(box.x,labelRect.left)>1&&Math.min(box.bottom,labelRect.bottom)-Math.max(box.y,labelRect.top)>1).map(box=>box.id):boxes.map(box=>box.id),rackRect=rack?.getBoundingClientRect(),bankClipped=rackRect?boxes.filter(box=>box.x<rackRect.left-1||box.y<rackRect.top-1||box.right>rackRect.right+1||box.bottom>rackRect.bottom+1).map(box=>box.id):boxes.map(box=>box.id),cardsRect=section?.querySelector('.hwatu-captured-cards')?.getBoundingClientRect(),first=boxes[0],last=boxes.at(-1),countText=section?.querySelector('.hwatu-category-label b')?.textContent??'';
        return {kind,label:label?.textContent?.replace(/\s+/g,' ').trim()??'',labelVisible:!!label&&visible(label),labelFont:label?parseFloat(getComputedStyle(label).fontSize):0,countText,ids:boxes.map(box=>box.id),cards:boxes,rows,crossRowOverlaps,overlaps,clipped,labelOverlaps,bankClipped,firstFullyVisible:!first||!!cardsRect&&first.x>=cardsRect.left-1&&first.right<=cardsRect.right+1,lastFullyVisible:!last||!!cardsRect&&last.x>=cardsRect.left-1&&last.right<=cardsRect.right+1,rackRight:rackRect?.right??0,scroll:{width:section?.scrollWidth??0,clientWidth:section?.clientWidth??0,height:section?.scrollHeight??0,clientHeight:section?.clientHeight??0,overflowX:style?.overflowX??'',overflowY:style?.overflowY??''}};
      });
      const allCards=categories.flatMap(category=>category.cards.map(card=>({...card,kind:category.kind}))),crossCategoryOverlaps=[];
      for(let i=0;i<allCards.length;i++)for(let j=i+1;j<allCards.length;j++)if(allCards[i].kind!==allCards[j].kind&&Math.min(allCards[i].right,allCards[j].right)-Math.max(allCards[i].x,allCards[j].x)>1&&Math.min(allCards[i].bottom,allCards[j].bottom)-Math.max(allCards[i].y,allCards[j].y)>1)crossCategoryOverlaps.push([allCards[i].id,allCards[j].id]);
      return {seat,expected:state.captures[seat].map(card=>card.id),total:categories.reduce((n,item)=>n+item.ids.length,0),allCards,crossCategoryOverlaps,categories};
    });
    const shown=allNodes.map(node=>node.getAttribute('data-hwatu-card-id')),expected=[...state.captures.p1,...state.captures.p2].map(card=>card.id),buttons=document.querySelectorAll('.hwatu-category-summary,.hwatu-capture-inspection');
    const allCards=banks.flatMap(bank=>bank.categories.flatMap(category=>category.rows.flatMap((row,rowIndex)=>row.cards.map(card=>({...card,seat:bank.seat,kind:category.kind,rowIndex}))))),allBankOverlaps=[];
    for(let i=0;i<allCards.length;i++)for(let j=i+1;j<allCards.length;j++){
      const a=allCards[i],b=allCards[j],intentionalStack=a.seat===b.seat&&a.kind===b.kind&&a.rowIndex===b.rowIndex;
      if(!intentionalStack&&Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)allBankOverlaps.push([a.id,b.id]);
    }
    return {phase:state.phase,conserved:state.hands.p1.length+state.hands.p2.length+state.table.length+state.deck.length+state.captures.p1.length+state.captures.p2.length===48,expectedCount:expected.length,shownCount:shown.length,shownUnique:new Set(shown).size,expectedIds:expected.sort(),shownIds:shown.sort(),duplicateIds:shown.filter((id,index)=>shown.indexOf(id)!==index),unexpected:shown.filter(id=>!expected.includes(id)),banks,allBankOverlaps,inspectionControls:buttons.length,allVisible:shown.every(id=>allNodes.filter(node=>node.getAttribute('data-hwatu-card-id')===id).every(visible))};
  });
}

async function initialMatrix(language, width, height) {
  const { context, page } = await open(language, width, height);
  try {
    await page.evaluate(lang => window.__minhwatuProof.mount(window.__minhwatuProof.normalState(), lang), language);
    await page.waitForFunction(() => [...document.querySelectorAll('.gb-hwatu-face')].every(image => image.complete && image.naturalWidth > 0), null, { timeout: 8000 });
    await idle(page);
    const m = await page.evaluate(() => {
      const box = selector => { const e=document.querySelector(selector); if(!e)return null; const r=e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}; };
      return { viewport:{width:innerWidth,height:innerHeight}, documentWidth:document.documentElement.scrollWidth, handCount:document.querySelectorAll('.hwatu-hand-choice').length, tableCount:document.querySelectorAll('.hwatu-table-card').length, rails:[...document.querySelectorAll('.hwatu-capture-rack')].map(e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),right:Math.round(r.right),bottom:Math.round(r.bottom)}}),hand:box('.hwatu-hand-section'),table:box('.hwatu-felt'),broken:[...document.querySelectorAll('.gb-hwatu-face')].filter(i=>!i.complete||!i.naturalWidth).length };
    });
    check(`${language} ${width}×${height}: 10 hand, 8 table cards and both capture rails render with loaded art`, m.handCount===10 && m.tableCount===8 && m.rails.length===2 && m.broken===0, JSON.stringify(m));
    check(`${language} ${width}×${height}: no horizontal overflow`, m.documentWidth<=width, JSON.stringify({documentWidth:m.documentWidth,width}));
    if (width===1366) check(`${language} ${width}×${height}: hand and table remain in viewport`, [m.hand,m.table,...m.rails].every(box=>box&&box.y>=0&&box.bottom<=height), JSON.stringify(m));
    await screenshot(page, `${language}-${width}x${height}-initial`);
  } finally { await context.close(); }
}

async function handAndCaptureMatrix(language, width, height) {
  const { context, page } = await open(language, width, height);
  try {
    const auditVisibleCards = async () => page.evaluate(() => {
      const read = (selector, parentSelector) => {
        const parent = document.querySelector(parentSelector), parentRect = parent?.getBoundingClientRect();
        const cards = [...document.querySelectorAll(selector)].map(node => {
          const rect = node.getBoundingClientRect(), image = node.querySelector('img.gb-hwatu-face');
          return { id: node.getAttribute('data-hwatu-card-id'), x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom,
            width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden',
            loaded: !!image?.complete && image.naturalWidth > 0,
            clipped: !!parentRect && (rect.left < parentRect.left - 1 || rect.top < parentRect.top - 1 || rect.right > parentRect.right + 1 || rect.bottom > parentRect.bottom + 1) };
        });
        return { count: cards.length, ids: cards.map(card => card.id), cards, parent: parentRect && { x: parentRect.x, y: parentRect.y, right: parentRect.right, bottom: parentRect.bottom } };
      };
      return { viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth,
        hand: read('.hwatu-hand-choice[data-hwatu-card-id]', '.hwatu-hand-section'),
        field: read('.hwatu-table-card[data-hwatu-card-id]', '.hwatu-felt'),
        state: { phase: window.__minhwatuProof.state().phase, hands: { p1: window.__minhwatuProof.state().hands.p1.length, p2: window.__minhwatuProof.state().hands.p2.length },
          table: window.__minhwatuProof.state().table.length, deck: window.__minhwatuProof.state().deck.length,
          captures: { p1: window.__minhwatuProof.state().captures.p1.length, p2: window.__minhwatuProof.state().captures.p2.length } } };
    });
    const waitFaces = () => page.waitForFunction(() => [...document.querySelectorAll('.gb-hwatu-face')].every(image => image.complete && image.naturalWidth > 0), null, { timeout: 8000 });
    const safeLayout = detail => detail.documentWidth <= width && [detail.hand, detail.field].every(group => group.cards.every(card => card.visible && card.loaded && !card.clipped && card.x >= -1 && card.right <= width + 1));
    const bankPass = bank => bank.conserved && bank.shownCount === bank.expectedCount && bank.shownUnique === bank.expectedCount &&
      bank.duplicateIds.length === 0 && bank.unexpected.length === 0 && bank.allVisible && bank.allBankOverlaps.length === 0 &&
      bank.banks.every(seat => seat.crossCategoryOverlaps.length === 0 && seat.categories.every(category => captureCategoryPass(category) &&
        category.cards.every(card => card.x >= -1 && card.right <= width + 1)));

    for (const count of [10, 11, 20, 21, 24]) {
      await page.evaluate(({ lang, count }) => window.__minhwatuProof.mount(window.__minhwatuProof.piCountState(count), lang), { lang: language, count });
      await waitFaces(); await idle(page);
      const bank = await auditCaptureBanks(page), plain = bank.banks.find(seat => seat.seat === 'p1')?.categories.find(category => category.kind === 'plain');
      const expectedRows = count > 10 ? Array.from({ length: Math.ceil(count / 10) }, (_, index) => Math.min(10, count - index * 10)) : [count];
      const rowSizes = plain?.rows.map(row => row.cards.length) ?? [];
      const rowLimits = !!plain && plain.rows.every(row => row.cards.length >= 1 && row.cards.length <= 10) &&
        plain.rows.every((row, index) => index === 0 || row.y > plain.rows[index - 1].y + 1);
      check(`${language} ${width}×${height}: ${count} captured Pi cards render as ${expectedRows.join('+')} per-card rows`,
        bank.conserved && bank.expectedCount === count && bank.shownCount === count && bank.shownUnique === count &&
        bank.duplicateIds.length === 0 && bank.unexpected.length === 0 && bank.allVisible && !!plain && plain.ids.length === count &&
        JSON.stringify(rowSizes) === JSON.stringify(expectedRows) && rowLimits && captureCategoryPass(plain) &&
        plain.lastFullyVisible && plain.crossRowOverlaps.length === 0 && plain.cards.at(-1)?.visible && plain.cards.at(-1)?.loaded,
        JSON.stringify({ count, expectedRows, rowSizes, rowLimits, shown: plain?.ids.length, last: plain?.cards.at(-1), crossRowOverlaps: plain?.crossRowOverlaps,
          categoryPass: plain ? captureCategoryPass(plain) : false, conserved: bank.conserved, viewport: { width, height } }));
    }

    await page.evaluate(lang => window.__minhwatuProof.mount(window.__minhwatuProof.worstHandState(), lang), language);
    await waitFaces(); await idle(page);
    const worstView = await auditVisibleCards(), worstBank = await auditCaptureBanks(page);
    const seatKindCounts = Object.fromEntries(worstBank.banks.map(seat => [seat.seat, Object.fromEntries(seat.categories.map(category => [category.kind, category.ids.length]))]));
    const expectedWorstKinds = { p1: { bright: 0, animal: 6, ribbon: 6, plain: 3 }, p2: { bright: 0, animal: 0, ribbon: 0, plain: 15 } };
    check(`${language} ${width}×${height}: valid dense 30-capture fixture keeps both 5-card hands and 4 field cards visible`,
      worstView.state.hands.p1 === 5 && worstView.state.hands.p2 === 5 && worstView.state.table === 4 && worstView.state.deck === 4 &&
      worstBank.expectedCount === 30 && worstBank.conserved && safeLayout(worstView) && bankPass(worstBank) &&
      JSON.stringify(seatKindCounts) === JSON.stringify(expectedWorstKinds),
      JSON.stringify({ ...worstView, expectedBankCount: 30, shownBankCount: worstBank.shownCount, seatKindCounts, expectedWorstKinds,
        banks: worstBank.banks.map(seat => ({ seat: seat.seat, total: seat.total, overlaps: seat.crossCategoryOverlaps,
          categories: seat.categories.map(({ kind, ids, clipped, bankClipped, overlaps, labelFont, scroll }) => ({ kind, count: ids.length, clipped, bankClipped, overlaps, labelFont, scroll })) })) }));
    await screenshot(page, `worst-hand-${language}-${width}x${height}`, true);

    // A legal hand card now commits with one click, without a confirmation control.
    await page.evaluate(lang => window.__minhwatuProof.mount(window.__minhwatuProof.field14State(), lang), language);
    await waitFaces(); await idle(page);
    const field14 = await auditVisibleCards(), field14Bank = await auditCaptureBanks(page);
    check(`${language} ${width}×${height}: valid field-14 opening has two 10-card hands, 14 field cards, 14 captures and no deck`,
      field14.state.hands.p1 === 10 && field14.state.hands.p2 === 10 && field14.state.table === 14 && field14.state.deck === 0 &&
      field14Bank.expectedCount === 14 && field14Bank.conserved && safeLayout(field14) && bankPass(field14Bank),
      JSON.stringify({ ...field14, bankCount: field14Bank.shownCount, bankPass: bankPass(field14Bank), bankOverlap: field14Bank.allBankOverlaps }));
    await screenshot(page, `field14-${language}-${width}x${height}`, true);
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').click();
    await page.waitForFunction(() => window.__minhwatuProof.state().hands.p1.length === 9, null, { timeout: 3000 });
    check(`${language} ${width}×${height}: one hand click commits without a confirm button`,
      await page.locator('.hwatu-confirm').count() === 0 && await page.evaluate(() => window.__minhwatuProof.state().events.filter(event => event.type === 'play').length === 1));
    await idle(page);
    await screenshot(page, `one-click-${language}-${width}x${height}`, true);

    // Play a real match from the deterministic engine fixture and compare the sorted per-card ghost to its settled face.
    await page.evaluate(lang => window.__minhwatuProof.mount(window.__minhwatuProof.worstHandState(), lang), language);
    await idle(page);
    const beforeIds = await page.evaluate(() => window.__minhwatuProof.state().captures.p1.map(card => card.id));
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="2-1"]').click();
    await page.waitForFunction(() => window.__minhwatuCues.some(item => item.event.type === 'capture' && item.event.actor === 'p1'), null, { timeout: 5000 });
    const gained = await page.evaluate(before => window.__minhwatuProof.state().captures.p1.map(card => card.id).filter(id => !before.includes(id)), beforeIds);
    await page.waitForFunction(ids => ids.some(id => document.querySelector(`.hwatu-capture-landing[data-hwatu-landing-card-id="${id}"]`)), gained, { timeout: 2500 });
    const ghost = await page.evaluate(ids => ids.map(id => {
      const element = document.querySelector(`.hwatu-capture-landing[data-hwatu-landing-card-id="${id}"]`), rect = element?.getBoundingClientRect();
      const image = element?.querySelector('img.gb-hwatu-face');
      return { id, present: !!element, parentSeat: element?.closest('.hwatu-capture-rack')?.getAttribute('data-seat') ?? null,
        x: rect?.x, y: rect?.y, right: rect?.right, bottom: rect?.bottom, width: rect?.width, height: rect?.height,
        imageLoaded: !image || (image.complete && image.naturalWidth > 0) };
    }), gained);
    check(`${language} ${width}×${height}: an in-flight capture has one sorted per-card landing ghost in the owner's visible rack`,
      gained.includes('2-1') && ghost.some(item => item.id === '2-1' && item.present && item.parentSeat === 'p1' && item.imageLoaded &&
        item.x >= -1 && item.right <= width + 1 && item.y >= -1 && item.bottom <= height + 1), JSON.stringify({ gained, ghost }));
    await idle(page);
    const landed = await page.evaluate(ids => ids.map(id => ({ id,
      face: document.querySelectorAll(`.hwatu-captured-card[data-hwatu-card-id="${id}"]`).length,
      ghost: document.querySelectorAll(`.hwatu-capture-landing[data-hwatu-landing-card-id="${id}"]`).length })), gained);
    check(`${language} ${width}×${height}: capture settles to exactly one face and removes each landing ghost`,
      gained.includes('2-1') && landed.every(item => item.face === 1 && item.ghost === 0), JSON.stringify({ gained, landed }));

    await page.evaluate(lang => window.__minhwatuProof.mount(window.__minhwatuProof.emptyFieldState(), lang), language);
    await idle(page);
    const emptyState = await auditVisibleCards();
    check(`${language} ${width}×${height}: empty field fixture conserves 48 cards with 10-card hands and 8-card deck`,
      emptyState.state.table === 0 && emptyState.state.hands.p1 === 10 && emptyState.state.hands.p2 === 10 && emptyState.state.deck === 8 && safeLayout(emptyState), JSON.stringify(emptyState));
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').click();
    await page.waitForFunction(() => document.querySelector('.hwatu-flight[data-hwatu-flight-card="1-1"]') &&
      document.querySelector('[data-hwatu-zone="table"] [data-hwatu-landing-anchor]'), null, { timeout: 3000 });
    const emptyLanding = await page.evaluate(() => {
      const card = document.querySelector('.hwatu-flight[data-hwatu-flight-card="1-1"]'), animation = card?.getAnimations()[0];
      const endFrame = animation?.effect?.getKeyframes().at(-1), match = endFrame?.transform?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
      const left = parseFloat(card?.style.left ?? '0'), top = parseFloat(card?.style.top ?? '0'), width = parseFloat(card?.style.width ?? '0'), height = parseFloat(card?.style.height ?? '0');
      const anchor = document.querySelector('[data-hwatu-zone="table"] [data-hwatu-landing-anchor]'), rect = anchor?.getBoundingClientRect();
      return { flight: !!card, anchor: !!anchor, end: match ? { x: left + Number(match[1]) + width / 2, y: top + Number(match[2]) + height / 2 } : null,
        target: rect ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } : null };
    });
    check(`${language} ${width}×${height}: empty-field hand card targets an explicit in-field landing anchor`,
      emptyLanding.flight && emptyLanding.anchor && nearby(emptyLanding.end, emptyLanding.target, 20), JSON.stringify(emptyLanding));
    await idle(page);
    check(`${language} ${width}×${height}: empty-field landing completes without a stale ghost`,
      await page.locator('.hwatu-flight[data-hwatu-flight-card="1-1"]').count() === 0 &&
      await page.locator('[data-hwatu-zone="table"] [data-hwatu-card-id="1-1"]').count() === 1 &&
      await page.locator('[data-hwatu-zone="table"] [data-hwatu-landing-anchor]').count() === 0);
  } finally { await context.close(); }
}

async function targetCases(language, width, height) {
  const { context, page } = await open(language,width,height);
  try {
    const runHand = async count => {
      await page.evaluate(({language,count})=>window.__minhwatuProof.mount(window.__minhwatuProof.stateWithMatches(count,0),language),{language,count}); await idle(page);
      const source=count===0?await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').boundingBox():null;
      await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').click();
      if(count===2){
        const targets=page.locator('.hwatu-table-card.is-target'); await targets.first().waitFor({state:'visible',timeout:4000});
        check(`${language}: hand has ${count} matches and exposes both exact targets`,await targets.count()===2,`visible ${await targets.count()}`);
        const layout=await page.evaluate(()=>({height:innerHeight,targets:[...document.querySelectorAll('.hwatu-table-card.is-target')].map(e=>{const r=e.getBoundingClientRect();return {y:r.y,bottom:r.bottom}}),confirm:document.querySelector('.hwatu-cancel')?.getBoundingClientRect().toJSON()??null}));
        check(`${language}: 1366×768 two-target choices and cancel control are visible`,layout.targets.length===2&&layout.targets.every(r=>r.y>=0&&r.bottom<=layout.height)&&Boolean(layout.confirm&&layout.confirm.y>=0&&layout.confirm.bottom<=layout.height),JSON.stringify(layout));
        const automaticFocus=await page.evaluate(()=>({id:document.activeElement?.getAttribute('data-hwatu-card-id')??null,target:document.activeElement?.classList.contains('is-target')??false}));
        check(`${language}: selecting two-match hand card focuses the first legal target`,automaticFocus.target&&automaticFocus.id===await targets.first().getAttribute('data-hwatu-card-id'),JSON.stringify(automaticFocus));
        await page.keyboard.press('Enter');
      } else {
        if(count===0){
          await page.waitForFunction(()=>document.querySelector('.hwatu-motion-note--play.is-fresh'),null,{timeout:3000});
          const landing=await page.locator('[data-hwatu-zone="table"] [data-hwatu-landing-anchor]').boundingBox();
          const flight=await page.evaluate(({source,landing})=>{const e=document.querySelector('.hwatu-flight[data-hwatu-flight-card="1-1"]'),a=e?.getAnimations()[0],f=a?.effect?.getKeyframes().at(-1),m=f?.transform?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/),x=parseFloat(e?.style.left||'0'),y=parseFloat(e?.style.top||'0'),w=parseFloat(e?.style.width||'0'),h=parseFloat(e?.style.height||'0');return {present:!!e,tableCount:document.querySelectorAll('[data-hwatu-zone="table"] [data-hwatu-card-id]').length,anchor:!!document.querySelector('.hwatu-table-landing-anchor'),end:m?{x:x+Number(m[1])+w/2,y:y+Number(m[2])+h/2}:null,expected:landing?{x:landing.x+landing.width/2,y:landing.y+landing.height/2}:null,source:source?{x:source.x+source.width/2,y:source.y+source.height/2}:null};},{source,landing});
          check(`${language}: unmatched hand card lands in the reserved 8→9 table cell`,flight.present&&flight.tableCount===8&&flight.anchor&&nearby(flight.end,flight.expected,18),JSON.stringify(flight));
        }
      }
      await page.waitForFunction(()=>window.__minhwatuProof.view('p1').log.some(event=>event.type==='turn'),null,{timeout:6000}); await idle(page);
      const result=await page.evaluate(()=>{const v=window.__minhwatuProof.view('p1');return {play:v.log.filter(e=>e.type==='play').length,capture:v.log.filter(e=>e.type==='capture').length,draw:v.log.filter(e=>e.type==='draw').length,hand:v.ownHand.length,turn:v.turn,captured:v.board.captures.p1.length};});
      check(`${language}: hand match count ${count} resolves once and advances`,result.play===1&&result.draw===1&&result.hand===9&&result.turn==='p2'&&result.captured===(count===0?0:count===3?4:2),JSON.stringify(result));
    };
    for(const count of [0,1,2,3]) await runHand(count);
    const runDraw = async count => {
      await page.evaluate(({language,count})=>window.__minhwatuProof.mount(window.__minhwatuProof.stateWithMatches(0,count),language),{language,count}); await idle(page);
      await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').click();
      await page.waitForFunction(()=>window.__minhwatuProof.view('p1').log.some(event=>event.type==='draw'),null,{timeout:5000});
      if(count===0){
        await page.waitForFunction(()=>window.__minhwatuCues.some(item=>item.event.type==='draw'&&item.transfer),null,{timeout:5000});
        const landing=await page.locator('[data-hwatu-zone="table"] [data-hwatu-landing-anchor]').boundingBox();
        const transfer=await page.evaluate(({landing})=>{const el=document.querySelector('.hwatu-flight[data-hwatu-flight-card="12-1"]'),a=el?.getAnimations()[0],frame=a?.effect?.getKeyframes().at(-1),m=frame?.transform?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/),x=parseFloat(el?.style.left||'0'),y=parseFloat(el?.style.top||'0'),w=parseFloat(el?.style.width||'0'),h=parseFloat(el?.style.height||'0');return {present:!!el,end:m?{x:x+Number(m[1])+w/2,y:y+Number(m[2])+h/2}:null,expected:landing?{x:landing.x+landing.width/2,y:landing.y+landing.height/2}:null,cue:window.__minhwatuCues.filter(item=>item.event.type==='draw').map(item=>({transfer:item.transfer,impactOffsets:item.impactOffsets}))};},{landing});
        check(`${language}: unmatched draw reveals then lands in its reserved table cell`,transfer.present&&nearby(transfer.end,transfer.expected,20)&&transfer.cue.some(item=>item.transfer),JSON.stringify(transfer));
      }
      if(count===2){ await page.waitForFunction(()=>window.__minhwatuProof.view('p1').phase==='capture-draw',null,{timeout:4000}); const targets=page.locator('.hwatu-table-card.is-target'); await targets.first().waitFor({state:'visible',timeout:4000}); check(`${language}: draw with two matches waits for an explicit legal target`,await targets.count()===2,`visible ${await targets.count()}`); await page.waitForFunction(()=>document.activeElement?.classList.contains('is-target'),null,{timeout:2200}); const focus=await page.evaluate(()=>({id:document.activeElement?.getAttribute('data-hwatu-card-id')??null,target:document.activeElement?.classList.contains('is-target')??false})); check(`${language}: capture-draw focuses a legal table choice`,focus.target&&focus.id===await targets.first().getAttribute('data-hwatu-card-id'),JSON.stringify(focus)); const chosen=await targets.first().getAttribute('data-hwatu-card-id'),chosenRect=await targets.first().boundingBox(); await targets.first().click(); await page.waitForFunction(()=>window.__minhwatuProof.view('p1').log.some(event=>event.type==='capture'),null,{timeout:4000}); await page.waitForFunction(()=>window.__minhwatuCues.some(item=>item.transfer&&item.event.cards?.some(card=>card.id==='12-1')),null,{timeout:1800}).catch(()=>{}); const route=await page.evaluate(({expected})=>{const cues=window.__minhwatuCues.filter(item=>item.transfer&&item.event.cards?.some(card=>card.id==='12-1'));const el=document.querySelector('.hwatu-flight[data-hwatu-flight-card="12-1"]'),a=el?.getAnimations()[0],frame=a?.effect?.getKeyframes().at(-1),m=frame?.transform?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/),x=parseFloat(el?.style.left||'0'),y=parseFloat(el?.style.top||'0'),w=parseFloat(el?.style.width||'0'),h=parseFloat(el?.style.height||'0');return {transfers:cues.map(item=>({type:item.event.type,targetId:item.targetId,impactOffsets:item.impactOffsets})),flight:!!el,end:m?{x:x+Number(m[1])+w/2,y:y+Number(m[2])+h/2}:null,expected:expected?{x:expected.x+expected.width/2,y:expected.y+expected.height/2}:null};},{expected:chosenRect}); check(`${language}: pending draw visibly transfers to the chosen table card before capture`,route.transfers.length>0&&route.flight&&nearby(route.end,route.expected,20),JSON.stringify({...route,chosen,chosenRect})); }
      await page.waitForFunction(()=>window.__minhwatuProof.view('p1').log.some(event=>event.type==='turn'),null,{timeout:6000}); await idle(page);
      const result=await page.evaluate(()=>{const v=window.__minhwatuProof.view('p1');return {draw:v.log.filter(e=>e.type==='draw').length,capture:v.log.filter(e=>e.type==='capture').length,hand:v.ownHand.length,turn:v.turn,captured:v.board.captures.p1.length,pending:v.board.pendingCard?.id??null};});
      check(`${language}: draw match count ${count} resolves once with no pending leak`,result.draw===1&&result.hand===9&&result.turn==='p2'&&result.pending===null&&result.captured===(count===0?0:count===3?4:2),JSON.stringify(result));
    };
    for(const count of [0,1,2,3]) await runDraw(count);
  } finally { await context.close(); }
}

async function denseResultAndReplay(language) {
  const { context, page } = await open(language,1440,900);
  try {
    await page.evaluate(lang=>window.__minhwatuProof.mount(window.__minhwatuProof.denseState(),lang),language); await idle(page);
    await page.waitForFunction(()=>[...document.querySelectorAll('.hwatu-capture-rack .hwatu-captured-card img.gb-hwatu-face')].every(image=>image.complete&&image.naturalWidth>0),null,{timeout:8000});
    const dense=await auditCaptureBanks(page), own=dense.banks.find(bank=>bank.seat==='p1');
    const denseExpected={bright:0,animal:0,ribbon:9,plain:23};
    const denseKinds=Object.fromEntries(own.categories.map(category=>[category.kind,category.ids.length]));
    const denseStructure=own.categories.every(category=>category.label.trim().length>0&&captureCategoryPass(category))&&dense.allBankOverlaps.length===0&&dense.duplicateIds.length===0&&dense.unexpected.length===0;
    check(`${language}: conserved dense fixture keeps every 9 ribbon and 23 plain face visible; only high-count same-category stacks may overlap`,dense.conserved&&dense.expectedCount===32&&dense.shownCount===32&&dense.shownUnique===32&&JSON.stringify(denseKinds)===JSON.stringify(denseExpected)&&dense.allVisible&&denseStructure&&dense.inspectionControls===0,JSON.stringify({conserved:dense.conserved,expectedCount:dense.expectedCount,shownCount:dense.shownCount,shownUnique:dense.shownUnique,kinds:denseKinds,allVisible:dense.allVisible,structure:denseStructure,inspectionControls:dense.inspectionControls,categories:own.categories.map(({kind,label,labelFont,overlaps,clipped,labelOverlaps,bankClipped,firstFullyVisible,lastFullyVisible,scroll})=>({kind,label,labelFont,overlaps,clipped,labelOverlaps,bankClipped,firstFullyVisible,lastFullyVisible,scroll}))}));
    await screenshot(page,`${language}-dense-capture-bank`,true);
    await page.evaluate(lang=>window.__minhwatuProof.mount(window.__minhwatuProof.allCapturedState(),lang),language); await idle(page);
    await page.waitForFunction(()=>[...document.querySelectorAll('.hwatu-capture-rack .hwatu-captured-card img.gb-hwatu-face')].length===48&&[...document.querySelectorAll('.hwatu-capture-rack .hwatu-captured-card img.gb-hwatu-face')].every(image=>image.complete&&image.naturalWidth>0),null,{timeout:8000});
    const allCaptured=await auditCaptureBanks(page), totalKinds=Object.fromEntries(['bright','animal','ribbon','plain'].map(kind=>[kind,allCaptured.banks.reduce((sum,bank)=>sum+bank.categories.find(category=>category.kind===kind).ids.length,0)])), expectedKinds={bright:5,animal:9,ribbon:10,plain:24};
    const everyFace=allCaptured.expectedCount===48&&allCaptured.shownCount===48&&allCaptured.shownUnique===48&&allCaptured.expectedIds.every((id,index)=>id===allCaptured.shownIds[index])&&allCaptured.duplicateIds.length===0&&allCaptured.unexpected.length===0&&allCaptured.banks.every(bank=>bank.total===24&&JSON.stringify([...bank.expected].sort())===JSON.stringify(bank.categories.flatMap(category=>category.ids).sort())&&bank.crossCategoryOverlaps.length===0&&bank.categories.every(category=>category.label.trim().length>0&&captureCategoryPass(category)))&&JSON.stringify(totalKinds)===JSON.stringify(expectedKinds)&&allCaptured.allBankOverlaps.length===0;
    check(`${language}: finished two-seat banks show each of all 48 faces, with overlap limited to high-count same-category stacks`,allCaptured.conserved&&allCaptured.phase==='finished'&&everyFace&&allCaptured.allVisible&&allCaptured.inspectionControls===0,JSON.stringify({conserved:allCaptured.conserved,phase:allCaptured.phase,expectedCount:allCaptured.expectedCount,shownCount:allCaptured.shownCount,shownUnique:allCaptured.shownUnique,duplicateIds:allCaptured.duplicateIds,unexpected:allCaptured.unexpected,totalKinds,allBankOverlaps:allCaptured.allBankOverlaps,allVisible:allCaptured.allVisible,inspectionControls:allCaptured.inspectionControls,banks:allCaptured.banks.map(bank=>({seat:bank.seat,total:bank.total,crossCategoryOverlaps:bank.crossCategoryOverlaps,categories:bank.categories.map(({kind,label,labelFont,ids,overlaps,clipped,labelOverlaps,bankClipped,firstFullyVisible,lastFullyVisible,scroll})=>({kind,label,labelFont,count:ids.length,overlaps,clipped,labelOverlaps,bankClipped,firstFullyVisible,lastFullyVisible,scroll}))}))}));
    await screenshot(page,`${language}-all-capture-banks`,true);
    await page.evaluate(lang=>window.__minhwatuProof.mount(window.__minhwatuProof.godoriState(),lang),language); await idle(page);
    const oldScore=await page.evaluate(()=>window.__minhwatuProof.view('p1').board.scores.p1);
    await page.evaluate(()=>{window.__minhwatuScoreSamples=[];window.addEventListener('minhwatu-presentation-cue',function sampleCapture(event){if(event.detail?.event?.type!=='capture')return;window.removeEventListener('minhwatu-presentation-cue',sampleCapture);const offsets=event.detail.impactOffsets??[];for(const [label,offset] of [['first',offsets[0]+4],['last',offsets.at(-1)+10]])setTimeout(()=>window.__minhwatuScoreSamples.push({label,shown:Number(document.querySelector('[data-hwatu-zone="score-p1"] strong')?.textContent?.match(/-?\d+/)?.[0]),turn:document.querySelector('.hwatu-seat-score.is-turn')?.getAttribute('data-player')??null}),Math.max(0,offset));});});
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="8-1"]').click();
    await page.waitForFunction(()=>window.__minhwatuCues.some(item=>item.event.type==='capture'),null,{timeout:5000});
    const captureCue=await page.evaluate(()=>window.__minhwatuCues.filter(item=>item.event.type==='capture').at(-1));
    await page.waitForFunction(()=>window.__minhwatuScoreSamples?.length===2,null,{timeout:3000});
    const scoreSamples=await page.evaluate(()=>window.__minhwatuScoreSamples);
    await page.waitForFunction(()=>document.querySelector('.hwatu-motion-note--special.is-fresh .hwatu-earned-faces img'),null,{timeout:3000});
    const godoriHeader=await page.evaluate(()=>({text:document.querySelector('.hwatu-motion-note--special')?.textContent?.trim()??'',faces:[...document.querySelectorAll('.hwatu-motion-note--special .hwatu-earned-faces img')].map(image=>({src:image.getAttribute('src'),loaded:image.complete&&image.naturalWidth>0})),rect:document.querySelector('.hwatu-motion-note--special')?.getBoundingClientRect().toJSON()??null}));
    check(`${language}: Godori reveal shows the three canonical faces in the live inline event header`,godoriHeader.faces.length===3&&godoriHeader.faces.every(face=>face.loaded)&&godoriHeader.faces.map(face=>face.src).every(src=>/02-01|04-01|08-02/.test(src??'')),JSON.stringify(godoriHeader));
    await screenshot(page,`${language}-godori-inline`);
    const scoreAfterLast=await page.evaluate(({cue})=>({shown:Number(document.querySelector('[data-hwatu-zone="score-p1"] strong')?.textContent?.match(/-?\d+/)?.[0]),authoritative:window.__minhwatuProof.view('p1').board.scores.p1,delta:cue.event.scoreChanges?.p1}),{cue:captureCue});
    check(`${language}: public score waits for the last captured card to land`,scoreSamples[0]?.label==='first'&&scoreSamples[0].shown===oldScore&&scoreSamples[1]?.label==='last'&&scoreSamples[1].shown===scoreAfterLast.authoritative&&scoreAfterLast.delta>0,JSON.stringify({oldScore,scoreSamples,...scoreAfterLast,offsets:captureCue.impactOffsets}));
    await page.waitForFunction(()=>window.__minhwatuProof.view('p1').log.some(e=>e.type==='special'&&e.yaku?.id==='godori'),null,{timeout:5000}); await idle(page);
    await page.evaluate(()=>window.__minhwatuProof.setViewer('p2')); await idle(page);
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="12-4"]').click();
    const immediateAnnouncement=await page.locator('.game-feedback-status').innerText();
    check(`${language}: final result announcement waits for the public win event`,!(/민화투 최종 정산|Resultado de Minhwatu/.test(immediateAnnouncement))&&!(await page.evaluate(()=>window.__minhwatuCues.some(item=>item.event.type==='win'))),immediateAnnouncement);
    await page.waitForFunction(()=>window.__minhwatuCues.some(item=>item.event.type==='win'),null,{timeout:6000});
    await page.waitForFunction(lang=>document.querySelector('.game-feedback-status')?.textContent?.includes(lang==='ko'?'민화투 최종 정산':'Resultado de Minhwatu'),language,{timeout:4000});
    await page.waitForFunction(()=>window.__minhwatuProof.view('p2').result?.winner!=null,null,{timeout:5000}); await idle(page);
    const resultP2=await page.locator('.hwatu-result').innerText();
    await page.evaluate(()=>window.__minhwatuProof.setViewer('p1'));
    const result=await page.locator('.hwatu-result').innerText();
    check(`${language}: both seats receive the same named result and score formula`,resultP2.includes('Yeonseok')&&resultP2.includes('Lisbeth')&&result.includes('Yeonseok')&&result.includes('Lisbeth')&&/× 2|\* 2/.test(result),JSON.stringify({p1:result,p2:resultP2}));
    const replay=page.locator('.hwatu-replay > button'); await replay.click(); await page.getByText(/동의 대기 중|Esperando aceptación/i).waitFor({timeout:3000});
    check(`${language}: replay request callback is called once and shows pending consent`,await page.evaluate(()=>window.__minhwatuProof.replayCalls())===1,await replay.innerText());
    await page.evaluate(()=>window.__minhwatuProof.setReplayPending(false)); await page.waitForTimeout(50);
    await page.evaluate(()=>{window.__minhwatuProof.setViewer('p2');window.__minhwatuProof.setReplayPending(true);});
    check(`${language}: other seat sees incoming replay consent action`,await page.locator('.hwatu-replay > button').isVisible()&&/동의하고 한 판 더|Aceptar y jugar otra/i.test(await page.locator('.hwatu-replay > button').innerText()));
    await screenshot(page,`${language}-named-result-replay`);
  } finally { await context.close(); }
}

async function lifecycle(language) {
  const {context,page}=await open(language,1440,900);
  try {
    await page.evaluate(lang=>window.__minhwatuProof.mount(window.__minhwatuProof.normalState(),lang),language); await idle(page);
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="2-1"]').click();
    await page.waitForFunction(()=>document.querySelector('.hwatu-flight[data-hwatu-flight-card="2-1"]'),null,{timeout:3000});
    await page.evaluate(lang=>window.__minhwatuProof.mount(window.__minhwatuProof.normalState(),lang),language);
    await page.waitForFunction(()=>!document.querySelector('.hwatu-flight')&&!document.querySelector('.hwatu-score-flight')&&!document.querySelector('.hwatu-earned-faces'),null,{timeout:2000});
    check(`${language}: changing scene during flight clears previous transient effects`,!(await page.locator('.hwatu-motion-stage.is-animating').count())&&await page.evaluate(()=>window.__minhwatuProof.view('p1').log.length===1),'new scene begins from a quiet initial deal');
    await idle(page); await page.evaluate(()=>window.__minhwatuProof.renderAgain()); await page.waitForTimeout(80);
    check(`${language}: rerendering an unchanged event sequence does not replay it`,!(await page.locator('.hwatu-flight,.hwatu-score-flight').count()));
    await page.evaluate(()=>window.__minhwatuProof.remount()); await page.waitForTimeout(80);
    check(`${language}: remounting a current view does not replay historical events`,!(await page.locator('.hwatu-flight,.hwatu-score-flight,.hwatu-earned-faces').count()));
    await page.evaluate(lang=>window.__minhwatuProof.mount(window.__minhwatuProof.normalState(),lang),language); await idle(page);
    await page.evaluate(()=>window.__minhwatuProof.backlog()); await page.waitForTimeout(80);
    const backlog=await page.evaluate(()=>({sequence:window.__minhwatuProof.view('p1').log.at(-1)?.sequence,latest:window.__minhwatuProof.view('p1').log.at(-1)?.title.ko,animating:!!document.querySelector('.hwatu-motion-stage.is-animating'),clones:document.querySelectorAll('.hwatu-flight,.hwatu-score-flight').length}));
    check(`${language}: backlog over 12 events snaps to latest public state without replaying stale flights`,backlog.sequence===15&&!backlog.animating&&backlog.clones===0,JSON.stringify(backlog));
  } finally { await context.close(); }
}

async function privacyAndMotion(language) {
  const { context,page }=await open(language,1440,900);
  try {
    await page.evaluate(lang=>window.__minhwatuProof.mount(window.__minhwatuProof.stateWithMatches(2,0),lang),language); await idle(page);
    const privacy=await page.evaluate(()=>{const own=window.__minhwatuProof.view('p1'),other=window.__minhwatuProof.view('p2'),hidden=window.__minhwatuProof.hiddenIds('p2'),serialized=JSON.stringify({own,other}),dom=[...document.querySelectorAll('[data-hwatu-card-id]')].map(e=>e.getAttribute('data-hwatu-card-id'));return {own:own.ownHand.length,other:other.ownHand.length,opponentCount:own.opponentCount,leaks:hidden.filter(id=>dom.includes(id)),privateKeys:/"(hands|deck|seed)"/.test(serialized)};});
    check(`${language}: seat views and DOM hide the rival hand and stock`,privacy.own===10&&privacy.other===10&&privacy.opponentCount===10&&privacy.leaks.length===0&&!privacy.privateKeys,JSON.stringify(privacy));
    await page.evaluate(()=>window.__minhwatuProof.setViewer('p2')); await idle(page);
    const reversePrivacy=await page.evaluate(()=>{const own=window.__minhwatuProof.view('p2'),hidden=window.__minhwatuProof.hiddenIds('p1'),dom=[...document.querySelectorAll('[data-hwatu-card-id]')].map(e=>e.getAttribute('data-hwatu-card-id'));return {own:own.ownHand.map(c=>c.id),hidden:own.opponentCount,leaks:hidden.filter(id=>dom.includes(id))};});
    check(`${language}: the opposite seat sees its own hand without exposing the first seat's cards`,reversePrivacy.own.length===10&&reversePrivacy.hidden===10&&reversePrivacy.leaks.length===0,JSON.stringify(reversePrivacy));
    await page.evaluate(()=>window.__minhwatuProof.setViewer('p1')); await idle(page);
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').click(); const target=page.locator('.hwatu-table-card.is-target').first(); await target.waitFor();
    const sourceRect=await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').boundingBox(), targetRect=await target.boundingBox();
    const captureStart=await page.locator('[data-hwatu-zone="table"] [data-hwatu-card-id="1-2"]').boundingBox();
    await target.click(); await page.waitForFunction(()=>document.querySelector('.hwatu-motion-note--play.is-fresh'),null,{timeout:3000});
    const flight=await page.evaluate(({id,source,target})=>{const el=document.querySelector(`.hwatu-flight[data-hwatu-flight-card="${id}"]`),a=el?.getAnimations()[0],frame=a?.effect?.getKeyframes().at(-1),m=frame?.transform?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/),left=parseFloat(el?.style.left||'0'),top=parseFloat(el?.style.top||'0'),w=parseFloat(el?.style.width||'0'),h=parseFloat(el?.style.height||'0');return {present:!!el,hiddenSource:!document.querySelector(`.hwatu-hand-choice[data-hwatu-card-id="${id}"]`),duplicates:document.querySelectorAll(`.hwatu-hand-choice[data-hwatu-card-id="${id}"],[data-hwatu-zone="table"] [data-hwatu-card-id="${id}"]`).length,end:m?{x:left+Number(m[1])+w/2,y:top+Number(m[2])+h/2}:null,expected:target?{x:target.x+target.width/2,y:target.y+target.height/2}:null,source:source?{x:source.x+source.width/2,y:source.y+source.height/2}:null};},{id:'1-1',source:sourceRect,target:targetRect});
    const near=(a,b,t=18)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t;
    check(`${language}: selected card is shown once in flight and targets its matched table card`,flight.present&&flight.hiddenSource&&flight.duplicates===0&&near(flight.end?.x,flight.expected?.x)&&near(flight.end?.y,flight.expected?.y),JSON.stringify(flight));
    await page.waitForFunction(()=>document.querySelector('.hwatu-motion-note--capture.is-fresh'),null,{timeout:3000});
    await page.waitForFunction(()=>document.querySelector('.hwatu-flight[data-hwatu-flight-card="1-2"]'),null,{timeout:3000});
    const landingSlot=page.locator('.hwatu-capture-landing[data-hwatu-landing-card-id="1-2"]'); await landingSlot.waitFor({state:'visible',timeout:2000});
    const captureEnd=await landingSlot.boundingBox();
    const captureFlight=await page.evaluate(({target})=>{const el=document.querySelector('.hwatu-flight[data-hwatu-flight-card="1-2"]'),a=el?.getAnimations()[0],frame=a?.effect?.getKeyframes().at(-1),m=frame?.transform?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/),left=parseFloat(el?.style.left||'0'),top=parseFloat(el?.style.top||'0'),w=parseFloat(el?.style.width||'0'),h=parseFloat(el?.style.height||'0');return {present:!!el,start:el?{x:left+w/2,y:top+h/2}:null,end:m?{x:left+Number(m[1])+w/2,y:top+Number(m[2])+h/2}:null,expected:target?{x:target.x+target.width/2,y:target.y+target.height/2}:null};},{target:captureEnd});
    check(`${language}: captured table card clone starts at its exact source and lands in its category rack`,captureFlight.present&&near(captureFlight.start?.x,captureStart?.x+(captureStart?.width??0)/2,4)&&near(captureFlight.start?.y,captureStart?.y+(captureStart?.height??0)/2,12)&&near(captureFlight.end?.x,captureFlight.expected?.x,24)&&near(captureFlight.end?.y,captureFlight.expected?.y,24),JSON.stringify({...captureFlight,source:captureStart}));
    const activeFlights=await page.locator('.hwatu-flight').count(); await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForFunction(()=>!document.querySelector('.hwatu-flight')&&!document.querySelector('.hwatu-score-flight'),null,{timeout:2500});
    check(`${language}: enabling reduced motion clears active transient clones`,activeFlights>0&&await page.evaluate(()=>window.__minhwatuProof.view('p1').log.some(event=>event.type==='capture'))&&!(await page.locator('.hwatu-flight,.hwatu-score-flight,.hwatu-earned-faces').count()),`active flights before toggle: ${activeFlights}; public state remains committed`);
    await idle(page); await page.waitForFunction(()=>document.querySelector('.hwatu-captured-card[data-hwatu-card-id="1-2"]'),null,{timeout:3000});
    const arrived=await page.locator('.hwatu-captured-card[data-hwatu-card-id="1-2"]').boundingBox();
    check(`${language}: captured face replaces its per-card landing ghost without a layout jump`,!!captureEnd&&!!arrived&&near(arrived.x,captureEnd.x,1)&&near(arrived.y,captureEnd.y,1)&&near(arrived.width,captureEnd.width,1)&&near(arrived.height,captureEnd.height,1),JSON.stringify({ghost:captureEnd,arrived}));
    const cue=await page.evaluate(()=>window.__minhwatuCues.map(({event,impactOffsets,transfer})=>({type:event.type,impactOffsets,transfer:!!transfer})));
    check(`${language}: committed hand-play and capture cues follow the public event order`,cue.findIndex(item=>item.type==='play')>=0&&cue.findIndex(item=>item.type==='capture')>cue.findIndex(item=>item.type==='play')&&cue.find(item=>item.type==='capture')?.impactOffsets.join(',')==='260,285',JSON.stringify(cue));
  } finally { await context.close(); }
}

try {
  for(const [language,width,height] of [['ko',1366,768],['ko',1440,900],['ko',1920,1080],['es',1366,768],['es',1440,900],['es',1920,1080]]) await initialMatrix(language,width,height);
  for(const [language,width,height] of [['ko',1366,768],['ko',1440,900],['es',1366,768],['es',1440,900]]) await handAndCaptureMatrix(language,width,height);
  await targetCases('ko',1366,768); await targetCases('es',1366,768);
  await privacyAndMotion('ko'); await privacyAndMotion('es');
  await lifecycle('ko'); await lifecycle('es');
  await denseResultAndReplay('ko'); await denseResultAndReplay('es');
} catch(error) { report.errors.push(error instanceof Error ? error.stack||error.message : String(error)); }
finally { await browser.close(); }
report.summary={total:report.checks.length,passed:report.checks.filter(item=>item.pass).length,failed:report.checks.filter(item=>!item.pass).length};
await fs.writeFile(path.join(outputDir,'minhwatu-native.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.summary.failed||report.errors.length) process.exitCode=1;
