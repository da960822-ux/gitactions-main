// src/core/types.ts
var otherPlayer = (p) => p === "p1" ? "p2" : "p1";
function seededRandom(seed) {
  let n = seed >>> 0;
  return () => {
    n += 1831565813;
    let t = n;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffle(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// src/games/davinci.ts
function recordEvent(before, next, event2) {
  const log = before.actionLog ?? [];
  const recorded = { ...event2, sequence: (log.at(-1)?.sequence ?? 0) + 1 };
  return { ...next, actionLog: [...log, recorded].slice(-12), turnNumber: (before.turnNumber ?? 1) + (event2.type === "stop" || event2.type === "wrong-guess" ? 1 : 0) };
}
var label = (ko, es, action) => ({ label: { ko, es }, action });
function isPlayer(p) {
  return p === "p1" || p === "p2";
}
function sortedInsert(hand, tile) {
  const out = [...hand];
  const at = tile.value === "joker" ? -1 : out.findIndex((t) => t.value !== "joker" && (t.value > tile.value || t.value === tile.value && t.color === "white" && tile.color === "black"));
  out.splice(at < 0 ? out.length : at, 0, tile);
  return out;
}
var davinciEngine = {
  id: "davinci",
  createInitialState(seed) {
    const rand = seededRandom(seed);
    const pack2 = ["black", "white"].flatMap((color) => Array.from({ length: 12 }, (_, value) => ({ color, value, revealed: false })));
    pack2.push({ color: "black", value: "joker", revealed: false }, { color: "white", value: "joker", revealed: false });
    const deck = shuffle(pack2, rand);
    const hands = { p1: [], p2: [] };
    for (let i = 0; i < 4; i++) for (const p of ["p1", "p2"]) hands[p] = sortedInsert(hands[p], deck.pop());
    return { seed, turn: "p1", hands, deck, phase: "setup", drawnIndex: null, mayStop: false, result: null, actionLog: [], turnNumber: 1, rulesVersion: 2, setupReady: { p1: false, p2: false }, setupPending: { p1: hands.p1.filter((t) => t.value === "joker").map((t) => t.color), p2: hands.p2.filter((t) => t.value === "joker").map((t) => t.color) } };
  },
  validateAction(s, p, a) {
    if (!isPlayer(p)) return "Invalid player";
    if (s.result) return "Game is over";
    if (!a || typeof a.type !== "string") return "Invalid action";
    const payload = a.payload ?? {};
    if (s.phase === "setup") {
      if (s.setupReady?.[p]) return "Rack is already ready";
      const color = s.setupPending?.[p]?.[0];
      if (a.type === "finish-setup") return !color ? null : "Place your joker first";
      if (a.type === "place-joker") return color && Number.isInteger(payload.index) && payload.index >= 0 && payload.index < s.hands[p].length ? null : "Invalid joker position";
      return "Finish the starting arrangement first";
    }
    if (a.type === "place-joker") return p === s.turn && s.phase === "place-joker" && s.drawnIndex !== null && s.hands[p][s.drawnIndex]?.value === "joker" && Number.isInteger(payload.index) && payload.index >= 0 && payload.index < s.hands[p].length ? null : "Cannot place a joker now";
    if (a.type === "draw") return p === s.turn && s.phase === "draw" && s.deck.length > 0 ? null : "Cannot draw now";
    if (a.type === "skip-draw") return p === s.turn && s.phase === "draw" && s.deck.length === 0 ? null : "Cannot skip the draw now";
    if (a.type === "guess") {
      if (s.phase !== "guess" || p !== s.turn) return "Not your guessing turn";
      const index = payload.index, value = payload.value;
      if (!Number.isInteger(index) || index < 0 || index >= s.hands[otherPlayer(p)].length) return "Invalid tile index";
      if (!(value === "joker" && s.rulesVersion === 2) && (!Number.isInteger(value) || value < 0 || value > 11)) return "Invalid tile guess";
      if (s.hands[otherPlayer(p)][index].revealed) return "Tile is already revealed";
      return null;
    }
    if (a.type === "stop") return p === s.turn && s.phase === "guess" && s.mayStop ? null : "Cannot stop now";
    return "Unknown action";
  },
  applyAction(s, p, a) {
    const error = this.validateAction(s, p, a);
    if (error) throw new Error(error);
    if (a.type === "finish-setup") {
      const setupReady = { ...s.setupReady, [p]: true };
      return recordEvent(s, { ...s, setupReady, phase: setupReady.p1 && setupReady.p2 ? "draw" : "setup", turn: "p1" }, { type: "ready", actor: p });
    }
    if (a.type === "place-joker") {
      const oldIndex = s.phase === "setup" ? s.hands[p].findIndex((t) => t.value === "joker" && t.color === s.setupPending?.[p]?.[0]) : s.drawnIndex;
      const index = a.payload.index, hand = [...s.hands[p]], [tile] = hand.splice(oldIndex, 1);
      hand.splice(index, 0, tile);
      const hands2 = { ...s.hands, [p]: hand };
      const setupPending = s.phase === "setup" ? { ...s.setupPending, [p]: s.setupPending[p].slice(1) } : s.setupPending;
      return recordEvent(s, { ...s, hands: hands2, setupPending, phase: s.phase === "setup" ? "setup" : "guess", drawnIndex: s.phase === "setup" ? null : index }, { type: "arrange", actor: p, insertedIndex: index });
    }
    if (a.type === "skip-draw") return recordEvent(s, { ...s, phase: "guess", drawnIndex: null, mayStop: false }, { type: "skip-draw", actor: p });
    if (a.type === "draw") {
      const hands2 = { ...s.hands, [p]: sortedInsert(s.hands[p], s.deck[s.deck.length - 1]) };
      const drawnIndex = hands2[p].findIndex((t) => t === s.deck[s.deck.length - 1]);
      return recordEvent(s, { ...s, hands: hands2, deck: s.deck.slice(0, -1), phase: s.deck[s.deck.length - 1].value === "joker" ? "place-joker" : "guess", drawnIndex, mayStop: false }, { type: "draw", actor: p, insertedIndex: drawnIndex });
    }
    if (a.type === "stop") return recordEvent(s, { ...s, turn: otherPlayer(p), phase: s.deck.length ? "draw" : "guess", drawnIndex: null, mayStop: false }, { type: "stop", actor: p });
    const opponent = otherPlayer(p), i = a.payload.index, target = s.hands[opponent][i];
    if (target.value === a.payload.value) {
      const hands2 = { ...s.hands, [opponent]: s.hands[opponent].map((t, j) => j === i ? { ...t, revealed: true } : t) };
      const result = hands2[opponent].every((t) => t.revealed) ? { winner: p, reason: "All opposing tiles were revealed" } : null;
      return recordEvent(s, { ...s, hands: hands2, mayStop: true, result }, { type: "correct-guess", actor: p, targetIndex: i, guess: a.payload.value });
    }
    const hands = s.drawnIndex === null ? s.hands : { ...s.hands, [p]: s.hands[p].map((t, j) => j === s.drawnIndex ? { ...t, revealed: true } : t) };
    return recordEvent(s, { ...s, hands, turn: opponent, phase: s.deck.length ? "draw" : "guess", drawnIndex: null, mayStop: false }, { type: "wrong-guess", actor: p, targetIndex: i, guess: a.payload.value, ...s.drawnIndex !== null ? { revealedOwnIndex: s.drawnIndex } : {} });
  },
  getPlayerView(s, p) {
    const own = s.hands[p].map((t) => ({ ...t })), rival = s.hands[otherPlayer(p)].map((t) => t.revealed ? { ...t } : { revealed: false, color: t.color, value: null });
    const actions = [];
    const jokerIndex = s.phase === "setup" ? s.hands[p].findIndex((t) => t.value === "joker" && t.color === s.setupPending?.[p]?.[0]) : s.turn === p && s.phase === "place-joker" ? s.drawnIndex ?? -1 : -1;
    if (!s.result && jokerIndex >= 0) for (let index = 0; index < own.length; index++) actions.push(label(`\uC870\uCEE4\uB97C ${index + 1}\uBC88\uC9F8 \uC790\uB9AC\uC5D0 \uB193\uAE30`, `Colocar el comod\xEDn en la posici\xF3n ${index + 1}`, { type: "place-joker", payload: { index } }));
    if (!s.result && s.phase === "setup" && !s.setupReady?.[p] && !s.setupPending?.[p]?.length) actions.push(label("\uBC30\uCE58 \uC644\uB8CC", "Listo para jugar", { type: "finish-setup" }));
    if (!s.result && s.turn === p && s.phase === "draw" && s.deck.length) actions.push(label("\uD0C0\uC77C \uBF51\uAE30", "Robar ficha", { type: "draw" }));
    if (!s.result && s.turn === p && s.phase === "draw" && !s.deck.length) actions.push(label("\uCD94\uCE21 \uACC4\uC18D\uD558\uAE30", "Seguir adivinando", { type: "skip-draw" }));
    if (!s.result && s.turn === p && s.phase === "guess") {
      for (let i = 0; i < rival.length; i++) if (!rival[i].revealed) for (const value of [...Array.from({ length: 12 }, (_, n) => n), ...s.rulesVersion === 2 ? ["joker"] : []]) actions.push(label(`${i + 1}\uBC88 ${rival[i].color === "black" ? "\uAC80\uC815" : "\uD770\uC0C9"} \uD0C0\uC77C: ${value === "joker" ? "\uFF0D" : value} \uCD94\uCE21`, `Ficha ${i + 1} ${rival[i].color === "black" ? "negra" : "blanca"}: adivinar ${value === "joker" ? "\uFF0D" : value}`, { type: "guess", payload: { index: i, value } }));
      if (s.mayStop) actions.push(label("\uCC28\uB840 \uB9C8\uCE58\uAE30", "Terminar turno", { type: "stop" }));
    }
    const actionLog = (s.actionLog ?? []).filter((event2) => event2.type !== "arrange" || event2.actor === p).map((event2) => ({ ...event2 }));
    const turn = s.phase === "setup" ? s.setupReady?.[p] ? otherPlayer(p) : p : s.turn;
    const phase = s.phase === "setup" ? s.setupReady?.[p] ? "waiting" : "setup" : s.turn === p ? s.phase : "waiting";
    return { game: "davinci", turn, phase, hand: own, ...jokerIndex >= 0 ? { ownJokerToPlace: { color: own[jokerIndex].color, index: jokerIndex } } : {}, board: { opponentTiles: rival, deckCount: s.deck.length, turnNumber: s.turnNumber ?? 1, setupReady: s.setupReady ? { ...s.setupReady } : void 0, tileCount: s.rulesVersion === 2 ? 26 : 24, actionLog, lastEvent: actionLog.at(-1) ?? null }, opponentCount: rival.filter((t) => !t.revealed).length, status: s.result ? "finished" : turn === p ? "your-turn" : "opponent-turn", result: s.result, actions };
  },
  getResult: (s) => s.result
};

// src/games/catchmindWords.ts
var catchmindDictionary = [
  { ko: "\uACE0\uC591\uC774", es: "gato" },
  { ko: "\uAC1C", es: "perro" },
  { ko: "\uD1A0\uB07C", es: "conejo" },
  { ko: "\uB9D0", es: "caballo" },
  { ko: "\uC18C", es: "vaca" },
  { ko: "\uB3FC\uC9C0", es: "cerdo" },
  { ko: "\uC591", es: "oveja" },
  { ko: "\uC5FC\uC18C", es: "cabra" },
  { ko: "\uC554\uD0C9", es: "gallina" },
  { ko: "\uC218\uD0C9", es: "gallo" },
  { ko: "\uC624\uB9AC", es: "pato" },
  { ko: "\uAC70\uC704", es: "ganso" },
  { ko: "\uCE60\uBA74\uC870", es: "pavo" },
  { ko: "\uBB3C\uACE0\uAE30", es: "pez" },
  { ko: "\uC0C1\uC5B4", es: "tibur\xF3n" },
  { ko: "\uACE0\uB798", es: "ballena" },
  { ko: "\uB3CC\uACE0\uB798", es: "delf\xEDn" },
  { ko: "\uBB38\uC5B4", es: "pulpo" },
  { ko: "\uAC8C", es: "cangrejo" },
  { ko: "\uAC70\uBD81\uC774", es: "tortuga" },
  { ko: "\uAC1C\uAD6C\uB9AC", es: "rana" },
  { ko: "\uBC40", es: "serpiente" },
  { ko: "\uB3C4\uB9C8\uBC40", es: "lagarto" },
  { ko: "\uC545\uC5B4", es: "cocodrilo" },
  { ko: "\uCF54\uB07C\uB9AC", es: "elefante" },
  { ko: "\uAE30\uB9B0", es: "jirafa" },
  { ko: "\uC0AC\uC790", es: "le\xF3n" },
  { ko: "\uD638\uB791\uC774", es: "tigre" },
  { ko: "\uACF0", es: "oso" },
  { ko: "\uC6D0\uC22D\uC774", es: "mono" },
  { ko: "\uC5BC\uB8E9\uB9D0", es: "cebra" },
  { ko: "\uCEA5\uAC70\uB8E8", es: "canguro" },
  { ko: "\uD310\uB2E4", es: "panda" },
  { ko: "\uD3AD\uADC4", es: "ping\xFCino" },
  { ko: "\uBD80\uC5C9\uC774", es: "b\xFAho" },
  { ko: "\uC575\uBB34\uC0C8", es: "loro" },
  { ko: "\uB098\uBE44", es: "mariposa" },
  { ko: "\uBC8C", es: "abeja" },
  { ko: "\uAC1C\uBBF8", es: "hormiga" },
  { ko: "\uAC70\uBBF8", es: "ara\xF1a" },
  { ko: "\uB2EC\uD33D\uC774", es: "caracol" },
  { ko: "\uACE0\uC2B4\uB3C4\uCE58", es: "erizo" },
  { ko: "\uC0AC\uC2B4", es: "ciervo" },
  { ko: "\uC5EC\uC6B0", es: "zorro" },
  { ko: "\uB291\uB300", es: "lobo" },
  { ko: "\uB3C5\uC218\uB9AC", es: "\xE1guila" },
  { ko: "\uBE44\uB458\uAE30", es: "paloma" },
  { ko: "\uBC8C\uC0C8", es: "colibr\xED" },
  { ko: "\uACF5\uC791", es: "pavo real" },
  { ko: "\uACE0\uB798\uC0C1\uC5B4", es: "tibur\xF3n ballena" },
  { ko: "\uD574\uD30C\uB9AC", es: "medusa" },
  { ko: "\uBD88\uAC00\uC0AC\uB9AC", es: "estrella de mar" },
  { ko: "\uC0C8\uC6B0", es: "camar\xF3n" },
  { ko: "\uBC14\uB2F7\uAC00\uC7AC", es: "langosta" },
  { ko: "\uB9E4\uD654", es: "flor de ciruelo" },
  { ko: "\uC7A5\uBBF8", es: "rosa" },
  { ko: "\uD574\uBC14\uB77C\uAE30", es: "girasol" },
  { ko: "\uD2A4\uB9BD", es: "tulip\xE1n" },
  { ko: "\uC120\uC778\uC7A5", es: "cactus" },
  { ko: "\uBC84\uC12F", es: "hongo" },
  { ko: "\uB098\uBB34", es: "\xE1rbol" },
  { ko: "\uC57C\uC790\uC218", es: "palmera" },
  { ko: "\uAD6C\uB984", es: "nube" },
  { ko: "\uD574", es: "sol" },
  { ko: "\uB2EC", es: "luna" },
  { ko: "\uBCC4", es: "estrella" },
  { ko: "\uBB34\uC9C0\uAC1C", es: "arco\xEDris" },
  { ko: "\uC0B0", es: "monta\xF1a" },
  { ko: "\uD654\uC0B0", es: "volc\xE1n" },
  { ko: "\uAC15", es: "r\xEDo" },
  { ko: "\uD3ED\uD3EC", es: "cascada" },
  { ko: "\uBC14\uB2E4", es: "oc\xE9ano" },
  { ko: "\uC12C", es: "isla" },
  { ko: "\uD574\uBCC0", es: "playa" },
  { ko: "\uB208\uC0AC\uB78C", es: "mu\xF1eco de nieve" },
  { ko: "\uBC88\uAC1C", es: "rayo" },
  { ko: "\uB208\uC1A1\uC774", es: "copo de nieve" },
  { ko: "\uC57C\uC790\uC5F4\uB9E4", es: "coco" },
  { ko: "\uC9D1", es: "casa" },
  { ko: "\uC544\uD30C\uD2B8", es: "apartamento" },
  { ko: "\uD559\uAD50", es: "escuela" },
  { ko: "\uBCD1\uC6D0", es: "hospital" },
  { ko: "\uAD50\uD68C", es: "iglesia" },
  { ko: "\uC131", es: "castillo" },
  { ko: "\uB2E4\uB9AC", es: "puente" },
  { ko: "\uB4F1\uB300", es: "faro" },
  { ko: "\uD150\uD2B8", es: "carpa" },
  { ko: "\uB3C4\uC11C\uAD00", es: "biblioteca" },
  { ko: "\uC18C\uBC29\uC11C", es: "estaci\xF3n de bomberos" },
  { ko: "\uC6B0\uCCB4\uAD6D", es: "oficina de correos" },
  { ko: "\uC2DD\uB2F9", es: "restaurante" },
  { ko: "\uC2DC\uC7A5", es: "mercado" },
  { ko: "\uACF5\uC6D0", es: "parque" },
  { ko: "\uC218\uC601\uC7A5", es: "piscina" },
  { ko: "\uB180\uC774\uD130", es: "parque infantil" },
  { ko: "\uAE30\uCC28\uC5ED", es: "estaci\xF3n de tren" },
  { ko: "\uBC84\uC2A4 \uC815\uB958\uC7A5", es: "parada de autob\xFAs" },
  { ko: "\uACF5\uD56D", es: "aeropuerto" },
  { ko: "\uB18D\uC7A5", es: "granja" },
  { ko: "\uC790\uB3D9\uCC28", es: "carro" },
  { ko: "\uBC84\uC2A4", es: "guagua" },
  { ko: "\uD2B8\uB7ED", es: "cami\xF3n" },
  { ko: "\uD0DD\uC2DC", es: "taxi" },
  { ko: "\uC790\uC804\uAC70", es: "bicicleta" },
  { ko: "\uC624\uD1A0\uBC14\uC774", es: "motocicleta" },
  { ko: "\uBE44\uD589\uAE30", es: "avi\xF3n" },
  { ko: "\uD5EC\uB9AC\uCF65\uD130", es: "helic\xF3ptero" },
  { ko: "\uBCF4\uD2B8", es: "bote" },
  { ko: "\uBC30", es: "barco" },
  { ko: "\uAE30\uCC28", es: "tren" },
  { ko: "\uB85C\uCF13", es: "cohete" },
  { ko: "\uD2B8\uB799\uD130", es: "tractor" },
  { ko: "\uC2A4\uCF00\uC774\uD2B8\uBCF4\uB4DC", es: "patineta" },
  { ko: "\uC720\uBAA8\uCC28", es: "cochecito" },
  { ko: "\uCEF4\uD4E8\uD130", es: "computadora" },
  { ko: "\uD0DC\uBE14\uB9BF", es: "tableta" },
  { ko: "\uC804\uD654\uAE30", es: "tel\xE9fono" },
  { ko: "\uCE74\uBA54\uB77C", es: "c\xE1mara" },
  { ko: "\uD154\uB808\uBE44\uC804", es: "televisor" },
  { ko: "\uB77C\uB514\uC624", es: "radio" },
  { ko: "\uD5E4\uB4DC\uD3F0", es: "auriculares" },
  { ko: "\uC2DC\uACC4", es: "reloj" },
  { ko: "\uC548\uACBD", es: "lentes" },
  { ko: "\uC6B0\uC0B0", es: "paraguas" },
  { ko: "\uC5F4\uC1E0", es: "llave" },
  { ko: "\uC790\uBB3C\uC1E0", es: "candado" },
  { ko: "\uBB38", es: "puerta" },
  { ko: "\uCC3D\uBB38", es: "ventana" },
  { ko: "\uC758\uC790", es: "silla" },
  { ko: "\uD0C1\uC790", es: "mesa" },
  { ko: "\uCE68\uB300", es: "cama" },
  { ko: "\uC18C\uD30C", es: "sof\xE1" },
  { ko: "\uB7A8\uD504", es: "l\xE1mpara" },
  { ko: "\uAC70\uC6B8", es: "espejo" },
  { ko: "\uCC45", es: "libro" },
  { ko: "\uC5F0\uD544", es: "l\xE1piz" },
  { ko: "\uBD93", es: "pincel" },
  { ko: "\uAC00\uC704", es: "tijeras" },
  { ko: "\uB9DD\uCE58", es: "martillo" },
  { ko: "\uD1B1", es: "sierra" },
  { ko: "\uAE30\uD0C0", es: "guitarra" },
  { ko: "\uD53C\uC544\uB178", es: "piano" },
  { ko: "\uB4DC\uB7FC", es: "tambor" },
  { ko: "\uD2B8\uB7FC\uD3AB", es: "trompeta" },
  { ko: "\uCD95\uAD6C\uACF5", es: "bal\xF3n de f\xFAtbol" },
  { ko: "\uB18D\uAD6C\uACF5", es: "bal\xF3n de baloncesto" },
  { ko: "\uC57C\uAD6C \uBC29\uB9DD\uC774", es: "bate de b\xE9isbol" },
  { ko: "\uD53C\uC790", es: "pizza" },
  { ko: "\uD584\uBC84\uAC70", es: "hamburguesa" },
  { ko: "\uD56B\uB3C4\uADF8", es: "perro caliente" },
  { ko: "\uC0CC\uB4DC\uC704\uCE58", es: "s\xE1ndwich" },
  { ko: "\uBC25\uADF8\uB987", es: "taz\xF3n de arroz" },
  { ko: "\uB2EC\uAC40", es: "huevo" },
  { ko: "\uBE75", es: "pan" },
  { ko: "\uCE58\uC988", es: "queso" },
  { ko: "\uC6B0\uC720", es: "leche" },
  { ko: "\uC544\uC774\uC2A4\uD06C\uB9BC", es: "helado" },
  { ko: "\uCF00\uC774\uD06C", es: "pastel" },
  { ko: "\uCFE0\uD0A4", es: "galleta" },
  { ko: "\uC0AC\uACFC", es: "manzana" },
  { ko: "\uC624\uB80C\uC9C0", es: "naranja" },
  { ko: "\uB9DD\uACE0", es: "mango" },
  { ko: "\uBC14\uB098\uB098", es: "guineo" },
  { ko: "\uD328\uC158\uD504\uB8E8\uD2B8", es: "chinola" },
  { ko: "\uD30C\uC778\uC560\uD50C", es: "pi\xF1a" },
  { ko: "\uC544\uBCF4\uCE74\uB3C4", es: "aguacate" },
  { ko: "\uD1A0\uB9C8\uD1A0", es: "tomate" },
  { ko: "\uC625\uC218\uC218", es: "ma\xEDz" },
  { ko: "\uB2F9\uADFC", es: "zanahoria" },
  { ko: "\uAC10\uC790", es: "papa" },
  { ko: "\uC591\uD30C", es: "cebolla" },
  { ko: "\uACE0\uCD94", es: "aj\xED" },
  { ko: "\uB808\uBAAC", es: "lim\xF3n" },
  { ko: "\uD3EC\uB3C4", es: "uva" },
  { ko: "\uB538\uAE30", es: "fresa" },
  { ko: "\uC218\uBC15", es: "sand\xEDa" },
  { ko: "\uCF54\uCF54\uB11B", es: "coco rallado" },
  { ko: "\uCD95\uAD6C", es: "f\xFAtbol" },
  { ko: "\uB18D\uAD6C", es: "baloncesto" },
  { ko: "\uC57C\uAD6C", es: "b\xE9isbol" },
  { ko: "\uD14C\uB2C8\uC2A4", es: "tenis" },
  { ko: "\uC218\uC601", es: "nataci\xF3n" },
  { ko: "\uB2EC\uB9AC\uAE30", es: "carrera" },
  { ko: "\uCDA4", es: "baile" },
  { ko: "\uB09A\uC2DC", es: "pesca" },
  { ko: "\uC5F0", es: "chichigua" },
  { ko: "\uC120\uBB3C", es: "regalo" },
  { ko: "\uC0DD\uC77C \uCF00\uC774\uD06C", es: "pastel de cumplea\xF1os" },
  { ko: "\uC591\uCD08", es: "vela" },
  { ko: "\uC655\uAD00", es: "corona" },
  { ko: "\uB9C8\uC2A4\uD06C", es: "m\xE1scara" },
  { ko: "\uD48D\uC120", es: "globo" }
];

// src/games/catchmind.ts
var label2 = (ko, es, action) => ({ label: { ko, es }, action });
function isPlayer2(p) {
  return p === "p1" || p === "p2";
}
function norm(v) {
  return v.normalize("NFC").toLowerCase().trim();
}
function answers(c) {
  return [c.ko, c.es].map(norm);
}
var defaultSettings = () => ({ drawTimeSeconds: 80, rounds: 6, choices: 3, hints: 2, customWords: [], customOnly: false });
function uniqueConcepts(concepts) {
  const seenKo = /* @__PURE__ */ new Set(), seenEs = /* @__PURE__ */ new Set();
  return concepts.filter(({ ko, es }) => {
    const normalizedKo = norm(ko), normalizedEs = norm(es);
    if (!normalizedKo || !normalizedEs || seenKo.has(normalizedKo) || seenEs.has(normalizedEs)) return false;
    seenKo.add(normalizedKo);
    seenEs.add(normalizedEs);
    return true;
  });
}
function dealWords(seed, settings) {
  const source = settings.customOnly ? settings.customWords : [...settings.customWords, ...catchmindDictionary];
  const concepts = shuffle(uniqueConcepts(source), seededRandom(seed));
  return Array.from({ length: settings.rounds }, (_, i) => concepts.slice(i * settings.choices, (i + 1) * settings.choices));
}
function validSettings(value) {
  if (!value || typeof value !== "object") return false;
  const settings = value;
  if (!Number.isInteger(settings.drawTimeSeconds) || settings.drawTimeSeconds < 30 || settings.drawTimeSeconds > 180) return false;
  if (!Number.isInteger(settings.rounds) || settings.rounds < 2 || settings.rounds > 12) return false;
  if (!Number.isInteger(settings.choices) || settings.choices < 3 || settings.choices > 5) return false;
  if (!Number.isInteger(settings.hints) || settings.hints < 0 || settings.hints > 3 || typeof settings.customOnly !== "boolean") return false;
  if (!Array.isArray(settings.customWords) || settings.customWords.length > 30) return false;
  const customWords = [];
  for (const item of settings.customWords) {
    if (!item || typeof item.ko !== "string" || typeof item.es !== "string") return false;
    const ko = item.ko.trim(), es = item.es.trim();
    if (!ko || !es || [...ko].length > 32 || [...es].length > 32) return false;
    customWords.push({ ko, es });
  }
  const base = uniqueConcepts(catchmindDictionary);
  const all = uniqueConcepts([...customWords, ...base]);
  if (all.length !== customWords.length + base.length) return false;
  return !settings.customOnly || customWords.length >= settings.rounds * settings.choices;
}
var catchmindDrawDurationMs = 8e4;
function getCatchmindDrawDurationMs(state) {
  const seconds = state?.settings?.drawTimeSeconds;
  return typeof seconds === "number" && Number.isInteger(seconds) ? seconds * 1e3 : catchmindDrawDurationMs;
}
function getCatchmindHintStage(state, now) {
  const hints = state.settings.hints, duration = getCatchmindDrawDurationMs(state);
  if (hints < 1 || !state.deadlineAt) return 0;
  const elapsed = Math.max(0, duration - Math.max(0, Date.parse(state.deadlineAt) - now));
  return Math.min(hints, Math.floor(elapsed * (hints + 1) / duration));
}
function guessPoints(s) {
  const remaining = s.deadlineAt ? Math.max(0, Date.parse(s.deadlineAt) - Date.now()) : 0;
  return Math.max(1, Math.ceil(3 * remaining / getCatchmindDrawDurationMs(s)));
}
function maskedHint(word, stage) {
  let left = stage;
  return [...word].map((char) => {
    if (/\s/u.test(char)) return char;
    if (left > 0) {
      left--;
      return char;
    }
    return "\uFF3F";
  }).join(" ");
}
function isCorrectGuess(s, text) {
  return s.phase === "drawing" && s.answer !== null && typeof text === "string" && answers(s.answer).includes(norm(text));
}
function makeResult(s) {
  if (s.round < s.settings.rounds - 1) return null;
  if (s.score.p1 === s.score.p2) return { winner: "draw", reason: `${s.settings.rounds} rounds complete with equal scores`, scores: { ...s.score } };
  return { winner: s.score.p1 > s.score.p2 ? "p1" : "p2", reason: `Higher score after ${s.settings.rounds} rounds`, scores: { ...s.score } };
}
var catchmindEngine = {
  id: "catchmind",
  createInitialState(seed) {
    const settings = defaultSettings();
    return { seed, round: 0, drawer: "p1", wordChoices: dealWords(seed, settings), answer: null, strokes: [], fills: [], nextOrder: 0, guesses: [], score: { p1: 0, p2: 0 }, deadlineAt: null, hintStage: 0, settings, phase: "choosing", result: null };
  },
  validateAction(s, p, a) {
    if (!isPlayer2(p)) return "Invalid player";
    if (s.result) return "Game is over";
    if (!a || typeof a.type !== "string") return "Invalid action";
    const payload = a.payload ?? {};
    if (a.type === "settings") return p === "p1" && s.round === 0 && s.phase === "choosing" && validSettings(payload.settings) ? null : "Room settings are invalid or locked";
    if (a.type === "choose") return s.phase === "choosing" && p === s.drawer && Number.isInteger(payload.wordId) && payload.wordId >= 0 && payload.wordId < s.settings.choices ? null : "Choose one of the offered words as the drawer";
    if (a.type === "draw") {
      if (s.phase !== "drawing" || p !== s.drawer) return "Only the drawer can draw during an active round";
      const strokes = payload.strokes;
      if (!Array.isArray(strokes) || strokes.length < 1 || strokes.length > 12) return "Send 1 to 12 strokes per batch";
      if (s.strokes.length + strokes.length > 200) return "Round stroke limit reached";
      if (s.strokes.reduce((sum2, stroke) => sum2 + stroke.points.length, 0) + strokes.reduce((sum2, stroke) => sum2 + (Array.isArray(stroke?.points) ? stroke.points.length : 0), 0) > 4e3) return "Round point limit reached";
      for (const stroke of strokes) {
        if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2 || stroke.points.length > 80) return "Each stroke needs 2 to 80 points";
        if (stroke.points.some((pt) => !pt || typeof pt.x !== "number" || typeof pt.y !== "number" || !Number.isFinite(pt.x) || !Number.isFinite(pt.y) || pt.x < 0 || pt.x > 1 || pt.y < 0 || pt.y > 1)) return "Points must be normalized between 0 and 1";
        if (stroke.color !== void 0 && (typeof stroke.color !== "string" || !/^#[0-9a-f]{6}$/i.test(stroke.color))) return "Invalid stroke color";
        if (stroke.width !== void 0 && (!Number.isFinite(stroke.width) || stroke.width < 1 || stroke.width > 24)) return "Stroke width must be between 1 and 24";
      }
      return null;
    }
    if (a.type === "fill") return s.phase === "drawing" && p === s.drawer && Number.isFinite(payload.x) && Number.isFinite(payload.y) && payload.x >= 0 && payload.x <= 1 && payload.y >= 0 && payload.y <= 1 && typeof payload.color === "string" && /^#[0-9a-f]{6}$/i.test(payload.color) && s.fills.length < 60 ? null : "Invalid fill operation";
    if (a.type === "reveal-hint") return s.phase === "drawing" && p === s.drawer && s.hintStage < s.settings.hints ? null : "No hint is due";
    if (a.type === "guess") {
      if (s.phase !== "drawing" || p === s.drawer) return "Only the guesser can guess during an active round";
      if (typeof payload.text !== "string" || payload.text.trim().length < 1 || payload.text.trim().length > 60 || s.guesses.length >= 200) return "Guess must contain 1 to 60 characters; round guess limit is 200";
      return null;
    }
    if (a.type === "undo" || a.type === "clear") return p === s.drawer && s.phase === "drawing" ? null : "Only the drawer may edit the active drawing";
    if (a.type === "end-round" || a.type === "pass" || a.type === "timeout") return p === s.drawer && s.phase !== "finished" && s.phase !== "choosing" ? null : "Only the drawer can finish or pass the active round";
    return "Unknown action";
  },
  applyAction(s, p, a) {
    const error = this.validateAction(s, p, a);
    if (error) throw new Error(error);
    if (a.type === "settings") {
      const settings = structuredClone(a.payload.settings);
      return { ...s, settings, wordChoices: dealWords(s.seed, settings) };
    }
    if (a.type === "choose") return { ...s, answer: s.wordChoices[s.round][a.payload.wordId], strokes: [], fills: [], guesses: [], hintStage: 0, phase: "drawing" };
    if (a.type === "draw") {
      const added = a.payload.strokes.map((st, i) => ({ by: p, points: st.points.map((pt) => ({ x: Math.round(pt.x * 1e3) / 1e3, y: Math.round(pt.y * 1e3) / 1e3 })), color: st.color ?? "#172033", width: st.width ?? 3, order: s.nextOrder + i }));
      return { ...s, strokes: [...s.strokes, ...added], nextOrder: s.nextOrder + added.length };
    }
    if (a.type === "undo") {
      const lastStroke = s.strokes.at(-1), lastFill = s.fills.at(-1);
      return lastFill && (!lastStroke || lastFill.order > lastStroke.order) ? { ...s, fills: s.fills.slice(0, -1) } : { ...s, strokes: s.strokes.slice(0, -1) };
    }
    if (a.type === "fill") return { ...s, fills: [...s.fills, { x: Math.round(a.payload.x * 1e3) / 1e3, y: Math.round(a.payload.y * 1e3) / 1e3, color: a.payload.color, order: s.nextOrder }], nextOrder: s.nextOrder + 1 };
    if (a.type === "clear") return { ...s, strokes: [], fills: [], nextOrder: 0 };
    if (a.type === "reveal-hint") return { ...s, hintStage: s.hintStage + 1 };
    if (a.type === "guess") {
      const text = a.payload.text.trim(), correct = isCorrectGuess(s, text);
      const guesserPoints = guessPoints(s);
      const score2 = correct ? { ...s.score, [p]: s.score[p] + guesserPoints, [s.drawer]: s.score[s.drawer] + 1 } : s.score;
      return { ...s, score: score2, guesses: [...s.guesses, { by: p, text, correct }], phase: correct ? "round-over" : "drawing" };
    }
    if (s.phase !== "round-over") return { ...s, phase: "round-over" };
    const result = makeResult(s);
    return result ? { ...s, phase: "finished", result } : { ...s, round: s.round + 1, drawer: otherPlayer(s.drawer), answer: null, strokes: [], fills: [], nextOrder: 0, guesses: [], hintStage: 0, phase: "choosing" };
  },
  getPlayerView(s, p) {
    const guesser = otherPlayer(s.drawer), active = s.phase === "drawing";
    const actions = [];
    if (!s.result && s.phase === "choosing" && p === "p1" && s.round === 0) actions.push(label2("\uBC29 \uC124\uC815", "Ajustes de sala", { type: "settings", payload: { settings: s.settings } }));
    if (!s.result && s.phase === "choosing" && p === s.drawer) s.wordChoices[s.round].forEach((word, wordId) => actions.push(label2(`${word.ko} / ${word.es}`, `${word.es} / ${word.ko}`, { type: "choose", payload: { wordId } })));
    if (!s.result && active && p === s.drawer) actions.push(label2("\uB77C\uC6B4\uB4DC \uC885\uB8CC", "Terminar ronda", { type: "end-round" }), label2("\uD328\uC2A4", "Pasar", { type: "pass" }), label2("\uC2E4\uD589 \uCDE8\uC18C", "Deshacer", { type: "undo" }), label2("\uC804\uCCB4 \uC9C0\uC6B0\uAE30", "Borrar todo", { type: "clear" }), label2("\uCC44\uC6B0\uAE30", "Rellenar", { type: "fill" }));
    if (!s.result && s.phase === "round-over" && p === s.drawer) actions.push(label2("\uB2E4\uC74C \uB77C\uC6B4\uB4DC", "Siguiente ronda", { type: "end-round" }));
    if (!s.result && active && p === guesser) actions.push(label2("\uC815\uB2F5 \uC81C\uCD9C", "Enviar respuesta", { type: "guess", payload: { text: "" } }));
    const visibleGuesses = s.guesses.map((g) => ({ by: g.by, correct: g.correct, text: g.correct ? g.text : "\u2026" }));
    const ownAnswer = p === s.drawer && s.phase === "drawing" ? s.answer : null;
    const visibleSettings = { drawTimeSeconds: s.settings.drawTimeSeconds, rounds: s.settings.rounds, choices: s.settings.choices, hints: s.settings.hints, customWordCount: s.settings.customWords.length, customOnly: s.settings.customOnly };
    const hintLength = active && s.answer ? { ko: [...s.answer.ko].length, es: [...s.answer.es].length } : null;
    const hintWord = active && p !== s.drawer && s.answer && s.settings.hints ? { ko: maskedHint(s.answer.ko, s.hintStage), es: maskedHint(s.answer.es, s.hintStage) } : null;
    return { game: "catchmind", turn: s.drawer, phase: s.phase, hand: p === s.drawer ? { choices: s.phase === "choosing" ? s.wordChoices[s.round].map((c, wordId) => ({ wordId, ko: c.ko, es: c.es })) : [], answer: ownAnswer, settingsCustomWords: p === "p1" ? structuredClone(s.settings.customWords) : [] } : null, board: { strokes: s.strokes.map((st) => ({ ...st, points: st.points.map((pt) => ({ ...pt })) })), fills: s.fills.map((fill) => ({ ...fill })), guesses: visibleGuesses, round: s.round + 1, totalRounds: s.settings.rounds, drawer: s.drawer, answer: s.phase === "round-over" || s.phase === "finished" ? s.answer : null, hintLength, hintWord, hintStage: s.hintStage, settings: visibleSettings, scores: { ...s.score } }, opponentCount: 0, status: s.result ? "finished" : s.phase === "choosing" ? p === s.drawer ? "choose-word" : "waiting" : active ? p === s.drawer ? "drawing" : "guessing" : "round-over", result: s.result, actions };
  },
  getResult: (s) => s.result
};

// src/games/domino.ts
var DEFAULT_SETTINGS = { difficulty: "normal", targetScore: 0, capicuaBonus: 0, pasoCorridoBonus: 0, tranqueRule: "team" };
var label3 = (ko, es, action) => ({ label: { ko, es }, action });
var seats = (mode) => mode === "1v1" ? ["p1", "p2"] : ["p1", "b1", "p2", "b2"];
var isBot = (seat) => seat === "b1" || seat === "b2";
function score(hand) {
  return hand.reduce((n, t) => n + t.a + t.b, 0);
}
function openingRank(t) {
  return t.a === t.b ? 100 + t.a : t.a + t.b;
}
function legalOrient(t, side, ends) {
  if (!ends) return true;
  return side === "left" ? t.a === ends.left || t.b === ends.left : t.a === ends.right || t.b === ends.right;
}
function sideWinner(mode, seat) {
  if (mode === "1v1") return seat === "p1" ? "p1" : "p2";
  if (mode === "partners") return seat === "p1" || seat === "b1" ? "p1" : "p2";
  return seat === "p1" || seat === "p2" ? "p1" : "p2";
}
function teams(mode) {
  return mode === "partners" ? { p1: ["p1", "b1"], p2: ["p2", "b2"] } : mode === "humans-vs-bots" ? { p1: ["p1", "p2"], p2: ["b1", "b2"] } : { p1: ["p1"], p2: ["p2"] };
}
function teamScores(s) {
  const t = teams(s.mode);
  return { p1: t.p1.reduce((n, x) => n + score(s.hands[x]), 0), p2: t.p2.reduce((n, x) => n + score(s.hands[x]), 0) };
}
function lowestPlayerScores(s) {
  const t = teams(s.mode);
  return { p1: Math.min(...t.p1.map((x) => score(s.hands[x]))), p2: Math.min(...t.p2.map((x) => score(s.hands[x]))) };
}
function cloneLog(s) {
  return [...s.log ?? []];
}
function event(s, e) {
  const log = cloneLog(s);
  log.push({ ...e, sequence: (log.at(-1)?.sequence ?? 0) + 1 });
  return log.slice(-40);
}
function nextSeat(s, seat) {
  const order = seats(s.mode);
  return order[(order.indexOf(seat) + 1) % order.length];
}
function resultFor(s, winner, reason, pips) {
  return { winner, reason, scores: s.settings?.targetScore ? { ...s.matchScores ?? { p1: 0, p2: 0 } } : pips };
}
function finishRound(s, winner, reason, hands, capicua = false) {
  const current = { ...s, hands }, pips = teamScores(current);
  if (s.rulesVersion !== 1) return { ...current, result: { winner, reason, scores: pips } };
  const bonuses = { p1: s.roundBonuses?.p1 ?? 0, p2: s.roundBonuses?.p2 ?? 0 };
  const scoreDelta = { ...bonuses };
  if (winner !== "draw") scoreDelta[winner] += pips[winner === "p1" ? "p2" : "p1"] + (capicua ? s.settings?.capicuaBonus ?? 0 : 0);
  const matchScores = { p1: (s.matchScores?.p1 ?? 0) + scoreDelta.p1, p2: (s.matchScores?.p2 ?? 0) + scoreDelta.p2 };
  const award = winner === "draw" ? 0 : scoreDelta[winner];
  const rr = { winner, reason, pips, award, capicua, bonuses, scoreDelta, pasoCorrido: winner === "draw" ? bonuses.p1 + bonuses.p2 : bonuses[winner], round: s.round ?? 1 };
  const blocked = reason.startsWith("Blocked game");
  let next = { ...current, roundResult: rr, matchScores };
  const append = (e) => {
    next = { ...next, log: event(next, { round: s.round ?? 1, ...e }) };
  };
  if (blocked) append({ type: "tranque", title: { ko: "\uD2B8\uB791\uCF00 \xB7 \uD310\uC774 \uB9C9\uD614\uC5B4\uC694", es: "\xA1Tranque! Se cerr\xF3 la mano" }, text: { ko: winner === "draw" ? "\uB0A8\uC740 \uC22B\uC790 \uD569\uC774 \uAC19\uC544 \uBB34\uC2B9\uBD80\uC785\uB2C8\uB2E4." : s.settings?.tranqueRule === "lowest-player" ? "\uAC01 \uD300\uC5D0\uC11C \uC22B\uC790 \uD569\uC774 \uAC00\uC7A5 \uB0AE\uC740 \uD55C \uC0AC\uB78C\uC744 \uBE44\uAD50\uD588\uC2B5\uB2C8\uB2E4." : "\uB450 \uD300\uC758 \uB0A8\uC740 \uC22B\uC790 \uD569\uC744 \uBE44\uAD50\uD588\uC2B5\uB2C8\uB2E4.", es: winner === "draw" ? "Los puntos restantes quedaron empatados." : s.settings?.tranqueRule === "lowest-player" ? "Se compar\xF3 a la persona con menos puntos de cada equipo." : "Se compararon los puntos restantes de cada equipo." } });
  if (capicua) append({ type: "capicua", title: { ko: "\uCE74\uD53C\uCFE0\uC544!", es: "\xA1Capic\xFAa!" }, text: { ko: "\uB9C8\uC9C0\uB9C9 \uBE44\uB354\uBE14 \uD0C0\uC77C\uC744 \uC591\uCABD \uB05D \uC5B4\uB514\uC5D0\uB4E0 \uB193\uC744 \uC218 \uC788\uC5C8\uC5B4\uC694.", es: "La \xFAltima ficha, sin ser doble, serv\xEDa en cualquiera de los dos extremos." }, points: s.settings?.capicuaBonus ?? 0, team: winner === "draw" ? void 0 : winner });
  append({ type: "round-end", title: { ko: "\uB77C\uC6B4\uB4DC \uC815\uC0B0", es: "Cuenta de la mano" }, text: { ko: blocked ? "\uB0A8\uC740 \uD328\uB97C \uACF5\uAC1C\uD558\uACE0 \uC810\uC218\uB97C \uC815\uC0B0\uD569\uB2C8\uB2E4." : "\uC190\uD328\uB97C \uBAA8\uB450 \uB193\uC558\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uD328\uB97C \uACF5\uAC1C\uD569\uB2C8\uB2E4.", es: blocked ? "Se muestran las fichas restantes y se cuentan los puntos." : "Una persona se qued\xF3 sin fichas. Se muestran las manos restantes." }, team: winner === "draw" ? void 0 : winner, points: award });
  for (const team of ["p1", "p2"]) if (scoreDelta[team] > 0) append({ type: "score", title: { ko: "\uC810\uC218 \uD68D\uB4DD", es: "Puntos ganados" }, points: scoreDelta[team], team });
  const target = s.settings?.targetScore ?? 0;
  const reached = target > 0 && (matchScores.p1 >= target || matchScores.p2 >= target);
  const matchWinner = target > 0 ? matchScores.p1 === matchScores.p2 ? "draw" : matchScores.p1 > matchScores.p2 ? "p1" : "p2" : winner;
  if (target === 0 || reached) {
    next.result = resultFor(next, matchWinner, target ? "Match target reached" : reason, pips);
    append({ type: "win", title: { ko: matchWinner === "draw" ? "\uBB34\uC2B9\uBD80" : "\uACBD\uAE30 \uC2B9\uB9AC", es: matchWinner === "draw" ? "Empate" : "\xA1Partido ganado!" }, team: matchWinner === "draw" ? void 0 : matchWinner });
  }
  return next;
}
function play(state, seat, action) {
  const threshold = seats(state.mode).length;
  if (action.type === "pass") {
    const passes = state.passes + 1, turn = nextSeat(state, seat);
    let next2 = { ...state, passes, turn, log: event(state, { type: "pass", actor: seat, title: { ko: "\uD328\uC2A4", es: "Paso" }, ends: state.ends, count: passes }) };
    if (state.lastPlacer && turn === state.lastPlacer && passes === threshold - 1 && !state.pasoAwarded) {
      const team = sideWinner(state.mode, state.lastPlacer), points = state.settings?.pasoCorridoBonus ?? 0;
      next2 = { ...next2, pasoAwarded: true, roundBonuses: { p1: state.roundBonuses?.p1 ?? 0, p2: state.roundBonuses?.p2 ?? 0 } };
      next2.roundBonuses[team] += points;
      next2.log = event(next2, { type: "paso-corrido", actor: state.lastPlacer, team, points, title: { ko: "\uD30C\uC18C \uCF54\uB9AC\uB3C4", es: "Paso corrido" }, text: { ko: "\uB2E4\uB978 \uC790\uB9AC\uB4E4\uC774 \uBAA8\uB450 \uD328\uC2A4\uD574 \uB9C8\uC9C0\uB9C9\uC73C\uB85C \uB193\uC740 \uC0AC\uB78C\uC5D0\uAC8C \uCC28\uB840\uAC00 \uB3CC\uC544\uC654\uC5B4\uC694. \uD310\uC740 \uACC4\uC18D\uB429\uB2C8\uB2E4.", es: "Los dem\xE1s asientos pasaron y volvi\xF3 el turno a quien jug\xF3 la \xFAltima ficha. La mano contin\xFAa." } });
    }
    if (passes === threshold) {
      const sc = state.settings?.tranqueRule === "lowest-player" ? lowestPlayerScores(state) : teamScores(state);
      const winner = sc.p1 === sc.p2 ? "draw" : sc.p1 < sc.p2 ? "p1" : "p2";
      return finishRound(next2, winner, winner === "draw" ? "Blocked game tied on remaining pips" : "Blocked game; lower team pip total wins", state.hands);
    }
    next2.log = event(next2, { type: "turn", actor: turn, title: { ko: "\uB2E4\uC74C \uCC28\uB840", es: "Siguiente turno" } });
    return next2;
  }
  const index = action.payload.index, side = action.payload.side, tile = state.hands[seat][index];
  const placed = !state.ends ? tile : side === "left" ? tile.b === state.ends.left ? tile : { a: tile.b, b: tile.a } : tile.a === state.ends.right ? tile : { a: tile.b, b: tile.a };
  const ends = !state.ends ? { left: placed.a, right: placed.b } : side === "left" ? { left: placed.a, right: state.ends.right } : { left: state.ends.left, right: placed.b };
  const hands = { ...state.hands, [seat]: state.hands[seat].filter((_, i) => i !== index) };
  const sequence = (state.log?.at(-1)?.sequence ?? 0) + 1;
  let next = { ...state, hands, board: [...state.board, { ...placed, by: seat, side, sequence }], ends, passes: 0, lastPlacer: seat, pasoAwarded: false, turn: nextSeat(state, seat), log: event(state, { type: "play", actor: seat, title: { ko: `${tile.a}|${tile.b} \uB193\uAE30`, es: `Ficha ${tile.a}|${tile.b}` }, tile: { ...placed }, side, ends, count: hands[seat].length }) };
  const capicua = tile.a !== tile.b && !!state.ends && (tile.a === state.ends.left && tile.b === state.ends.right || tile.b === state.ends.left && tile.a === state.ends.right);
  if (!hands[seat].length) return finishRound(next, sideWinner(state.mode, seat), "A player played all dominoes", hands, capicua);
  next.log = event(next, { type: "turn", actor: next.turn, title: { ko: "\uB2E4\uC74C \uCC28\uB840", es: "Siguiente turno" } });
  return next;
}
function chooseDominoBotAction(hand, board, ends, difficulty = "normal", publicContext = {}) {
  const playable = hand.flatMap((tile, index) => ["left", "right"].filter((side) => legalOrient(tile, side, ends)).map((side) => ({ tile, index, side })));
  if (!playable.length) return { type: "pass" };
  if (difficulty !== "easy") {
    const rank = (item) => {
      const { tile, index, side } = item;
      const pips = tile.a + tile.b;
      if (difficulty === "normal" || !ends) return pips;
      const outer = side === "left" ? tile.a === ends.left ? tile.b : tile.a : tile.a === ends.right ? tile.b : tile.a;
      const after = side === "left" ? [outer, ends.right] : [ends.left, outer];
      const remaining = hand.filter((_, i) => i !== index);
      const support = after.reduce((total, pip) => total + remaining.filter((t) => t.a === pip || t.b === pip).length, 0);
      const seen = board.filter((t) => t.a === outer || t.b === outer).length + hand.filter((t) => t.a === outer || t.b === outer).length;
      const unsupported = after.filter((pip) => !remaining.some((t) => t.a === pip || t.b === pip)).length;
      return pips + support * 6 - unsupported * 5 + Math.min(seen, 7) * (publicContext.passes ? 2 : 1);
    };
    playable.sort((x, y) => rank(y) - rank(x) || Number(y.tile.a === y.tile.b) - Number(x.tile.a === x.tile.b) || x.index - y.index);
  }
  return { type: "play", payload: { index: playable[0].index, side: playable[0].side } };
}
function botAction(s, seat) {
  if (!s.board.length && seat === s.opening.player) {
    const index = s.hands[seat].findIndex((t) => t.a === s.opening.tile.a && t.b === s.opening.tile.b);
    return { type: "play", payload: { index, side: "left" } };
  }
  return chooseDominoBotAction(s.hands[seat], s.board, s.ends, s.settings?.difficulty ?? "normal", { passes: s.passes, counts: Object.fromEntries(seats(s.mode).map((x) => [x, s.hands[x].length])) });
}
function runBots(s) {
  let next = s;
  while (!next.result && !next.roundResult && isBot(next.turn)) next = play(next, next.turn, botAction(next, next.turn));
  return next;
}
function pack() {
  return Array.from({ length: 7 }, (_, a) => Array.from({ length: 7 - a }, (_2, j) => ({ a, b: a + j }))).flat();
}
function deal(seed, mode, round) {
  const deck = shuffle(pack(), seededRandom(seed + (round - 1) * 7919)), hands = { p1: deck.slice(0, 7), p2: deck.slice(7, 14), b1: [], b2: [] };
  if (mode !== "1v1") {
    hands.b1 = deck.slice(14, 21);
    hands.b2 = deck.slice(21, 28);
  }
  const opening = Object.entries(hands).filter(([x]) => seats(mode).includes(x)).flatMap(([player, h]) => h.map((tile) => ({ player, tile, rank: openingRank(tile) }))).sort((x, y) => y.rank - x.rank)[0];
  return { hands, opening, stock: deck.slice(14, mode === "1v1" ? 28 : 14) };
}
function validSettings2(s) {
  return (s.difficulty === void 0 || ["easy", "normal", "hard"].includes(s.difficulty)) && (s.targetScore === void 0 || [0, 100, 200].includes(s.targetScore)) && (s.capicuaBonus === void 0 || [0, 25].includes(s.capicuaBonus)) && (s.pasoCorridoBonus === void 0 || [0, 25].includes(s.pasoCorridoBonus)) && (s.tranqueRule === void 0 || ["team", "lowest-player"].includes(s.tranqueRule));
}
var dominoEngine = {
  id: "domino",
  createInitialState(seed) {
    const d = deal(seed, "1v1", 1);
    return { seed, turn: d.opening.player, mode: "1v1", hands: d.hands, stock: d.stock, board: [], ends: null, passes: 0, opening: { player: d.opening.player, tile: d.opening.tile }, result: null, rulesVersion: 1, settings: { ...DEFAULT_SETTINGS }, matchScores: { p1: 0, p2: 0 }, round: 1, roundResult: null, log: [], lastPlacer: null, pasoAwarded: false, roundBonuses: { p1: 0, p2: 0 } };
  },
  validateAction(s, p, a) {
    if (p !== "p1" && p !== "p2") return "Invalid player";
    if (!a || typeof a.type !== "string") return "Invalid action";
    if (s.result) return "Game is over";
    if (a.type === "set-mode" || a.type === "configure") {
      if (a.type === "configure" && s.rulesVersion !== 1) return "Settings unavailable in this saved ruleset";
      if (a.type === "set-mode" && s.mode !== "1v1") return "Mode already selected";
      if (p !== "p1" || s.board.length || (s.round ?? 1) !== 1 || s.roundResult) return "Settings can only be changed by player 1 before the first tile";
      const pl = a.payload ?? {};
      if (a.type === "set-mode") return pl.mode === "partners" || pl.mode === "humans-vs-bots" ? null : "Invalid mode";
      return (pl.mode === void 0 || ["1v1", "partners", "humans-vs-bots"].includes(pl.mode)) && (pl.difficulty === void 0 || ["easy", "normal", "hard"].includes(pl.difficulty)) && validSettings2(pl) ? null : "Invalid configuration";
    }
    if (a.type === "next-round") return s.rulesVersion === 1 && p === "p1" && !!s.roundResult && !s.result ? null : "Next round is unavailable";
    if (s.roundResult) return "Round is over";
    if (p !== s.turn) return "Not your turn";
    if (a.type === "pass") return s.hands[p].every((t) => !legalOrient(t, "left", s.ends) && !legalOrient(t, "right", s.ends)) ? null : "A playable tile is available";
    if (a.type !== "play") return "Unknown action";
    const { index, side } = a.payload ?? {};
    if (!Number.isInteger(index) || index < 0 || index >= s.hands[p].length) return "Invalid tile index";
    if (side !== "left" && side !== "right") return "Invalid side";
    const tile = s.hands[p][index];
    if (s.board.length === 0 && (p !== s.opening.player || tile.a !== s.opening.tile.a || tile.b !== s.opening.tile.b)) return "Must open with the highest-ranked tile";
    return legalOrient(tile, side, s.ends) ? null : "Tile does not match that end";
  },
  applyAction(s, p, a) {
    const error = this.validateAction(s, p, a);
    if (error) throw new Error(error);
    if (a.type === "configure") {
      const mode = a.payload?.mode ?? s.mode, settings = { ...s.settings ?? DEFAULT_SETTINGS }, d = deal(s.seed, mode, 1);
      for (const key of ["difficulty", "targetScore", "capicuaBonus", "pasoCorridoBonus", "tranqueRule"]) if (a.payload?.[key] !== void 0) Object.assign(settings, { [key]: a.payload[key] });
      const next = { ...s, mode, settings, hands: d.hands, stock: d.stock, turn: d.opening.player, opening: { player: d.opening.player, tile: d.opening.tile }, log: event(s, { type: "configure", actor: p, title: { ko: "\uAC8C\uC784 \uC124\uC815 \uBCC0\uACBD", es: "Configuraci\xF3n actualizada" } }) };
      return runBots(next);
    }
    if (a.type === "set-mode") {
      const mode = a.payload.mode, hands = { ...s.hands, b1: s.stock.slice(0, 7), b2: s.stock.slice(7, 14) }, opening = Object.entries(hands).flatMap(([player, hand]) => hand.map((tile) => ({ player, tile, rank: openingRank(tile) }))).sort((x, y) => y.rank - x.rank)[0];
      return runBots({ ...s, mode, hands, stock: [], turn: opening.player, opening: { player: opening.player, tile: opening.tile } });
    }
    if (a.type === "next-round") {
      const round = (s.round ?? 1) + 1, d = deal(s.seed, s.mode, round), log = event(s, { type: "round-start", title: { ko: `${round}\uB77C\uC6B4\uB4DC \uC2DC\uC791`, es: `Inicio de ronda ${round}` }, round });
      return runBots({ ...s, round, roundResult: null, result: null, hands: d.hands, stock: d.stock, board: [], ends: null, passes: 0, opening: { player: d.opening.player, tile: d.opening.tile }, turn: d.opening.player, lastPlacer: null, pasoAwarded: false, roundBonuses: { p1: 0, p2: 0 }, log });
    }
    return runBots(play(s, p, a));
  },
  getPlayerView(s, p) {
    const actions = [], order = seats(s.mode), teamsView = teams(s.mode);
    if (s.rulesVersion === 1 && !s.result && !s.roundResult && p === "p1" && !s.board.length && (s.round ?? 1) === 1) actions.push(label3("\uC124\uC815 \uC800\uC7A5", "Guardar configuraci\xF3n", { type: "configure", payload: { mode: s.mode, ...s.settings ?? DEFAULT_SETTINGS } }));
    if (!s.result && !s.roundResult && s.mode === "1v1" && p === "p1" && !s.board.length && (s.round ?? 1) === 1) {
      actions.push(label3("\uC0AC\uB78C 2\uBA85 \uB300 \uBD07 2\uBA85", "Dos personas contra dos bots", { type: "set-mode", payload: { mode: "humans-vs-bots" } }), label3("\uC0AC\uB78C-\uBD07 \uD300\uC804", "Equipos mixtos", { type: "set-mode", payload: { mode: "partners" } }));
    }
    if (!s.result && s.roundResult && p === "p1") actions.push(label3("\uB2E4\uC74C \uB77C\uC6B4\uB4DC", "Siguiente ronda", { type: "next-round" }));
    if (!s.result && !s.roundResult && s.turn === p) {
      s.hands[p].forEach((t, index) => {
        for (const side of ["left", "right"]) if (legalOrient(t, side, s.ends) && (s.board.length !== 0 || p === s.opening.player && t.a === s.opening.tile.a && t.b === s.opening.tile.b)) actions.push(label3(`\uB193\uAE30 ${t.a}|${t.b} (${side === "left" ? "\uC67C\uCABD" : "\uC624\uB978\uCABD"})`, `Jugar ${t.a}|${t.b} (${side === "left" ? "izquierda" : "derecha"})`, { type: "play", payload: { index, side } }));
      });
      if (s.hands[p].every((t) => !legalOrient(t, "left", s.ends) && !legalOrient(t, "right", s.ends))) actions.push(label3("\uD328\uC2A4", "Pasar", { type: "pass" }));
    }
    const reveal = !!s.roundResult || !!s.result, scores = reveal ? teamScores(s) : null;
    const log = (s.log ?? []).map((e) => ({ ...e, title: { ...e.title }, ...e.text ? { text: { ...e.text } } : {}, ...e.tile ? { tile: { ...e.tile } } : {}, ...e.ends ? { ends: { ...e.ends } } : {} }));
    return { game: "domino", mode: s.mode, turn: s.turn, phase: s.result ? "finished" : s.roundResult ? "round-over" : "play", round: s.round ?? 1, settings: { ...s.settings ?? DEFAULT_SETTINGS }, hand: s.hands[p].map((t) => ({ ...t })), board: { tiles: s.board.map((t) => ({ ...t })), ends: s.ends ? { ...s.ends } : null, seats: order, counts: Object.fromEntries(order.map((x) => [x, s.hands[x].length])), teams: teamsView, scores, revealedHands: reveal ? Object.fromEntries(order.map((x) => [x, s.hands[x].map((t) => ({ ...t }))])) : void 0, matchScores: { ...s.matchScores ?? { p1: 0, p2: 0 } }, roundResult: s.roundResult ? { ...s.roundResult, pips: { ...s.roundResult.pips }, bonuses: { ...s.roundResult.bonuses }, scoreDelta: { ...s.roundResult.scoreDelta } } : null, roundBonuses: { p1: s.roundBonuses?.p1 ?? 0, p2: s.roundBonuses?.p2 ?? 0 }, settings: { ...s.settings ?? DEFAULT_SETTINGS }, rulesVersion: s.rulesVersion ?? 0, round: s.round ?? 1, actionLog: log }, opponentCount: order.filter((x) => x !== p).reduce((n, x) => n + s.hands[x].length, 0), status: s.result ? "finished" : s.roundResult ? "round-over" : s.turn === p ? "your-turn" : isBot(s.turn) ? "bot-turn" : "opponent-turn", result: s.result, log, actions };
  },
  getResult: (s) => s.result
};

// src/games/jaipur.ts
var players = ["p1", "p2"];
var goods = ["diamond", "gold", "silver", "cloth", "spice", "leather"];
var minimumSale = (good) => good === "diamond" || good === "gold" || good === "silver" ? 2 : 1;
var emptyPiles = { diamond: [], gold: [], silver: [], cloth: [], spice: [], leather: [] };
var tokenValues = { diamond: [7, 7, 5, 5, 5], gold: [6, 6, 5, 5, 5], silver: [5, 5, 5, 5, 5], cloth: [5, 4, 3, 3, 2, 2, 1], spice: [5, 4, 3, 3, 2, 2, 1], leather: [4, 3, 2, 1, 1, 1, 1, 1, 1] };
var label4 = {
  diamond: { ko: "\uB2E4\uC774\uC544\uBAAC\uB4DC", es: "diamantes" },
  gold: { ko: "\uAE08", es: "oro" },
  silver: { ko: "\uC740", es: "plata" },
  cloth: { ko: "\uC637\uAC10", es: "tela" },
  spice: { ko: "\uD5A5\uC2E0\uB8CC", es: "especias" },
  leather: { ko: "\uAC00\uC8FD", es: "cuero" },
  camel: { ko: "\uB099\uD0C0", es: "camello" }
};
function identities(s) {
  const ids = s.cardIds;
  return { market: ids?.market.length === s.market.length ? [...ids.market] : s.market.map((_, i) => `r${s.round}-m${i}`), hands: Object.fromEntries(players.map((p) => [p, ids?.hands[p]?.length === s.hands[p].length ? [...ids.hands[p]] : s.hands[p].map((_, i) => `r${s.round}-${p}-h${i}`)])) };
}
function appendEvent(s, e) {
  return { ...s, events: [...s.events ?? [], { ...e, sequence: (s.events?.at(-1)?.sequence ?? 0) + 1, round: s.round }].slice(-40) };
}
function scoreBreakdown(s, p, camel = 0) {
  const entry = s.ledger?.[p], detailed = !!entry?.known && entry.goods + entry.bonus === s.tokens[p];
  return { goods: detailed ? entry.goods : null, bonus: detailed ? entry.bonus : null, sale: s.tokens[p], camel, total: s.tokens[p] + camel, detailed };
}
function mixSeed(seed, n) {
  return seed + Math.imul(n + 1, 2654435769) >>> 0;
}
function newRound(state, seed) {
  const pile = [...Array(6).fill("diamond"), ...Array(6).fill("gold"), ...Array(6).fill("silver"), ...Array(8).fill("cloth"), ...Array(8).fill("spice"), ...Array(10).fill("leather"), ...Array(8).fill("camel")];
  const rnd = seededRandom(seed);
  const deck = shuffle(pile, rnd);
  const hands = { p1: [], p2: [] };
  const herds = { p1: [], p2: [] };
  for (const p of players) for (let i = 0; i < 5; i++) {
    const c = deck.pop();
    if (c === "camel") herds[p].push(0);
    else hands[p].push(c);
  }
  const market = ["camel", "camel", "camel"];
  while (market.length < 5) market.push(deck.pop());
  return { ...state, rngSeed: seed, deck, market, hands, herds, tokens: { p1: 0, p2: 0 }, piles: Object.fromEntries(goods.map((g) => [g, [...tokenValues[g]]])), bonusTiles: { 3: shuffle([1, 1, 2, 2, 3, 3, 3], rnd), 4: shuffle([4, 4, 5, 5, 6, 6], rnd), 5: shuffle([8, 8, 9, 9, 10], rnd) }, camelBadges: { p1: 0, p2: 0 }, turnCount: 0, cardIds: { market: market.map((_, i) => `r${state.round}-m${i}`), hands: { p1: hands.p1.map((_, i) => `r${state.round}-p1-h${i}`), p2: hands.p2.map((_, i) => `r${state.round}-p2-h${i}`) } }, ledger: { p1: { goods: 0, bonus: 0, known: true }, p2: { goods: 0, bonus: 0, known: true } } };
}
function draw(s) {
  const deck = [...s.deck], market = [...s.market], cardIds = identities(s);
  if (deck.length) {
    cardIds.market.push(`r${s.round}-draw${deck.length}`);
    market.push(deck.pop());
  }
  return { ...s, deck, market, cardIds };
}
function finishRound2(s) {
  const a = s.herds.p1.length, b = s.herds.p2.length;
  const badges = { ...s.camelBadges };
  let roundsWon = { ...s.roundsWon };
  const score1 = s.tokens.p1 + (a > b ? 5 : 0), score2 = s.tokens.p2 + (b > a ? 5 : 0);
  const winner = score1 === score2 ? "draw" : score1 > score2 ? "p1" : "p2";
  if (a > b) badges.p1++;
  else if (b > a) badges.p2++;
  if (winner !== "draw") roundsWon[winner]++;
  let result = null;
  if (roundsWon.p1 >= 2 || roundsWon.p2 >= 2 || s.round >= 3) {
    if (roundsWon.p1 > roundsWon.p2) result = { winner: "p1", reason: "won two rounds / gan\xF3 dos rondas", scores: { p1: roundsWon.p1, p2: roundsWon.p2 } };
    else if (roundsWon.p2 > roundsWon.p1) result = { winner: "p2", reason: "won two rounds / gan\xF3 dos rondas", scores: { p1: roundsWon.p1, p2: roundsWon.p2 } };
    else result = { winner: "draw", reason: "rounds tied / empate de rondas", scores: { p1: roundsWon.p1, p2: roundsWon.p2 } };
  }
  const summary = { round: s.round, winner, cause: s.deck.length === 0 ? "deck" : "piles", camelCounts: { p1: a, p2: b }, roundsWon: { ...roundsWon }, breakdown: { p1: scoreBreakdown(s, "p1", a > b ? 5 : 0), p2: scoreBreakdown(s, "p2", b > a ? 5 : 0) } };
  return appendEvent({ ...s, camelBadges: badges, roundsWon, result, roundHistory: [...s.roundHistory ?? [], summary].slice(-3) }, { type: "round-end", winner, summary, title: { ko: `${s.round}\uB77C\uC6B4\uB4DC \uC815\uC0B0`, es: `Cuenta de la ronda ${s.round}` } });
}
function endRound(s) {
  const ended = finishRound2(s);
  if (ended.result) return appendEvent(ended, { type: "win", winner: ended.result.winner, title: { ko: ended.result.winner === "draw" ? "\uACBD\uAE30 \uBB34\uC2B9\uBD80" : "\uC2DC\uC7A5 \uAC70\uB798\uC758 \uC2B9\uC790", es: ended.result.winner === "draw" ? "Partida empatada" : "\xA1Partida ganada!" } });
  return appendEvent(newRound({ ...ended, round: s.round + 1, active: "p1" }, mixSeed(s.rngSeed, s.round + 1)), { type: "round-start", title: { ko: `${s.round + 1}\uB77C\uC6B4\uB4DC \uC2DC\uC791`, es: `Empieza la ronda ${s.round + 1}` } });
}
function isRoundOver(s) {
  return goods.filter((g) => s.piles[g].length > 0).length <= 3 || s.deck.length === 0;
}
function makeView(s, p) {
  const cardIds = identities(s), roundHistory = structuredClone(s.roundHistory ?? []), log = structuredClone(s.events ?? []);
  const actions = [];
  const add = (ko, es, action) => actions.push({ label: { ko, es }, action });
  if (!s.result && s.active === p) {
    for (let i = 0; i < s.market.length; i++) {
      const c = s.market[i];
      if (c !== "camel" && s.hands[p].length < 7) add(`\uAC00\uC838\uC624\uAE30: ${label4[c].ko}`, `Tomar: ${label4[c].es}`, { type: "take", payload: { mode: "single", indices: [i] } });
    }
    const camels = s.market.flatMap((c, i) => c === "camel" ? [i] : []);
    if (camels.length) add(`\uB099\uD0C0 ${camels.length}\uB9C8\uB9AC \uAC00\uC838\uC624\uAE30`, `Tomar ${camels.length} camellos`, { type: "take", payload: { mode: "camels" } });
    const combos = (size, max) => {
      const out = [];
      const walk = (from, cur) => {
        if (cur.length === size) {
          out.push(cur);
          return;
        }
        for (let i = from; i < max; i++) walk(i + 1, [...cur, i]);
      };
      walk(0, []);
      return out;
    };
    const exchangeable = s.market.flatMap((c, i) => c === "camel" ? [] : [i]);
    for (let count2 = 2; count2 <= Math.min(5, s.hands[p].length, exchangeable.length); count2++) for (const hi of combos(count2, s.hands[p].length)) for (const mi of combos(count2, exchangeable.length)) add(`${count2}\uC7A5 \uAD50\uD658`, `Cambiar ${count2} cartas`, { type: "take", payload: { mode: "exchange", handIndices: hi, marketIndices: mi.map((i) => exchangeable[i]) } });
    for (const g of goods) {
      const n = s.hands[p].filter((c) => c === g).length;
      if (s.piles[g].length) for (let count2 = minimumSale(g); count2 <= n; count2++) add(`${label4[g].ko} ${count2}\uC7A5 \uD310\uB9E4`, `Vender ${label4[g].es} (${count2})`, { type: "sell", payload: { good: g, count: count2 } });
    }
  }
  return { turn: s.active, phase: s.result ? "finished" : s.active === p ? "choose" : "waiting", board: { market: [...s.market], marketCards: s.market.map((good, i) => ({ id: cardIds.market[i], good })), deckCount: s.deck.length, round: s.round, tokens: { ...s.tokens }, piles: Object.fromEntries(goods.map((g) => [g, s.piles[g].map((value, index) => index === 0 ? value : null)])), bonusTileCounts: { 3: s.bonusTiles[3].length, 4: s.bonusTiles[4].length, 5: s.bonusTiles[5].length }, camelBadges: { ...s.camelBadges }, roundsWon: { ...s.roundsWon }, herdCounts: { p1: s.herds.p1.length, p2: s.herds.p2.length }, roundHistory, roundSummary: roundHistory.at(-1) ?? null, actionLog: log, scoreBreakdown: { p1: scoreBreakdown(s, "p1"), p2: scoreBreakdown(s, "p2") } }, ownHand: [...s.hands[p]], handCards: s.hands[p].map((good, i) => ({ id: cardIds.hands[p][i], good })), opponentCount: s.hands[otherPlayer(p)].length, status: s.result ? "finished" : s.active === p ? "Your turn" : "Opponent turn", result: s.result, log, actions };
}
function validate(s, p, a) {
  if (!players.includes(p) || !a || typeof a.type !== "string") return "Invalid player or action";
  if (s.result) return "Game is finished";
  if (s.active !== p) return "Not your turn";
  const x = a.payload ?? {};
  if (a.type === "sell") {
    const g = x.good;
    const n = x.count;
    if (!goods.includes(g) || !Number.isInteger(n) || Number(n) < minimumSale(g) || Number(n) > s.hands[p].filter((c) => c === g).length || !s.piles[g].length) return "Invalid sale";
    return null;
  }
  if (a.type !== "take") return "Unknown action";
  const mode = x.mode;
  if (mode === "single") {
    const ix = x.indices;
    if (!Array.isArray(ix) || ix.length !== 1 || !Number.isInteger(ix[0]) || ix[0] < 0 || ix[0] >= s.market.length) return "Invalid market selection";
    if (s.market[ix[0]] === "camel") return "Take camels as a group";
    if (s.hands[p].length >= 7) return "Hand is full";
    return null;
  }
  if (mode === "camels") return s.market.includes("camel") ? null : "No camels in market";
  if (mode === "exchange") {
    const hi = x.handIndices, mi = x.marketIndices;
    if (!Array.isArray(hi) || !Array.isArray(mi) || hi.length !== mi.length || hi.length < 2 || hi.length > 5) return "Exchange needs 2\u20135 cards";
    if (new Set(hi).size !== hi.length || hi.some((i) => !Number.isInteger(i) || i < 0 || i >= s.hands[p].length)) return "Invalid hand selection";
    if (new Set(mi).size !== mi.length || mi.some((i) => !Number.isInteger(i) || i < 0 || i >= s.market.length)) return "Invalid market selection";
    if (mi.some((i) => s.market[i] === "camel")) return "Camels must be taken as a group";
    return null;
  }
  return "Unknown take mode";
}
function apply(s, p, a) {
  const err = validate(s, p, a);
  if (err) throw new Error(err);
  let n = { ...s, market: [...s.market], deck: [...s.deck], hands: { ...s.hands, [p]: [...s.hands[p]] }, herds: { ...s.herds, [p]: [...s.herds[p]] }, tokens: { ...s.tokens }, piles: Object.fromEntries(goods.map((g) => [g, [...s.piles[g]]])), bonusTiles: { 3: [...s.bonusTiles[3]], 4: [...s.bonusTiles[4]], 5: [...s.bonusTiles[5]] }, camelBadges: { ...s.camelBadges }, roundsWon: { ...s.roundsWon }, active: otherPlayer(p), turnCount: s.turnCount + 1 };
  const x = a.payload ?? {};
  n.cardIds = identities(s);
  n.ledger = Object.fromEntries(players.map((seat) => {
    const old = s.ledger?.[seat], known = !!old?.known && old.goods + old.bonus === s.tokens[seat];
    return [seat, known ? { ...old } : { goods: s.tokens[seat], bonus: 0, known: false }];
  }));
  const actor = p;
  if (a.type === "take") {
    if (x.mode === "single") {
      const i = x.indices[0], card2 = n.market.splice(i, 1)[0], id = n.cardIds.market.splice(i, 1)[0];
      n.hands[p].push(card2);
      n.cardIds.hands[p].push(id);
      n = appendEvent(n, { type: "take-single", actor, cards: [{ id, good: card2, slot: i }], title: { ko: `${label4[card2].ko} \uAC00\uC838\uC624\uAE30`, es: `Tomaste ${label4[card2].es}` } });
      n = draw(n);
    } else if (x.mode === "camels") {
      const cards2 = n.market.flatMap((good, i) => good === "camel" ? [{ id: n.cardIds.market[i], good, slot: i }] : []), keep = [], ids = [];
      n.market.forEach((c, i) => {
        if (c === "camel") n.herds[p].push(0);
        else {
          keep.push(c);
          ids.push(n.cardIds.market[i]);
        }
      });
      n.market = keep;
      n.cardIds.market = ids;
      n = appendEvent(n, { type: "take-camels", actor, cards: cards2, title: { ko: `\uB099\uD0C0 ${cards2.length}\uB9C8\uB9AC \uAC00\uC838\uC624\uAE30`, es: `Tomaste ${cards2.length} camellos` } });
      while (n.market.length < 5 && n.deck.length) n = draw(n);
    } else {
      const hi = [...x.handIndices].sort((a2, b) => b - a2), mi = [...x.marketIndices].sort((a2, b) => b - a2), given = [], cards2 = [];
      for (const i of hi) given.push({ good: n.hands[p].splice(i, 1)[0], id: n.cardIds.hands[p].splice(i, 1)[0], slot: i });
      for (const i of mi) cards2.push({ good: n.market.splice(i, 1)[0], id: n.cardIds.market.splice(i, 1)[0], slot: i });
      n.hands[p].push(...cards2.map((c) => c.good));
      n.cardIds.hands[p].push(...cards2.map((c) => c.id));
      n.market.push(...given.map((c) => c.good));
      n.cardIds.market.push(...given.map((c) => c.id));
      n = appendEvent(n, { type: "exchange", actor, cards: cards2, given, title: { ko: `\uC0C1\uD488 ${cards2.length}\uC7A5 \uAD50\uD658`, es: `Intercambio de ${cards2.length} cartas` } });
    }
    const oldIds = new Set(identities(s).market), refill = n.market.flatMap((good, i) => oldIds.has(n.cardIds.market[i]) || x.mode === "exchange" ? [] : [{ id: n.cardIds.market[i], good, slot: i }]);
    if (refill.length) n = appendEvent(n, { type: "market-refill", cards: refill, title: { ko: "\uC2DC\uC7A5\uC5D0 \uC0C8 \uC0C1\uD488\uC774 \uB3C4\uCC29\uD588\uC5B4\uC694", es: "Llegaron cartas nuevas al mercado" } });
  } else {
    const g = x.good, count2 = x.count, cards2 = [], originalIds = identities(s).hands[p];
    for (let i = 0; i < count2; i++) {
      const ix = n.hands[p].indexOf(g), id = n.cardIds.hands[p].splice(ix, 1)[0];
      n.hands[p].splice(ix, 1);
      cards2.push({ id, good: g, slot: originalIds.indexOf(id) });
    }
    const pile = n.piles[g], tokenValues2 = [];
    for (let i = 0; i < count2 && pile.length; i++) tokenValues2.push(pile.shift());
    const goodsPoints = tokenValues2.reduce((total, v) => total + v, 0);
    let bonus2;
    if (count2 >= 3) {
      const size = count2 >= 5 ? 5 : count2;
      if (n.bonusTiles[size].length) bonus2 = { size, value: n.bonusTiles[size].shift() };
    }
    const points = goodsPoints + (bonus2?.value ?? 0);
    n.tokens[p] += points;
    n.ledger[p].goods += goodsPoints;
    n.ledger[p].bonus += bonus2?.value ?? 0;
    n = appendEvent(n, { type: "sale", actor, cards: cards2, tokenValues: tokenValues2, goodsPoints, bonus: bonus2, points, title: { ko: `${label4[g].ko} ${count2}\uC7A5 \uD310\uB9E4`, es: `Venta de ${count2} ${count2 === 1 ? "carta" : "cartas"} de ${label4[g].es}` } });
    if (bonus2) n = appendEvent(n, { type: "bonus", actor, bonus: bonus2, points: bonus2.value, title: { ko: `${bonus2.size}\uC7A5 \uD310\uB9E4 \uBCF4\uB108\uC2A4 \uACF5\uAC1C`, es: `Bono por vender ${bonus2.size === 5 ? "5 o m\xE1s" : bonus2.size} cartas` } });
  }
  if (isRoundOver(n)) return endRound(n);
  return n;
}
var jaipurEngine = { id: "jaipur", createInitialState(seed) {
  const base = { rngSeed: seed >>> 0, active: "p1", deck: [], market: [], hands: { p1: [], p2: [] }, herds: { p1: [], p2: [] }, tokens: { p1: 0, p2: 0 }, piles: emptyPiles, bonusTiles: { 3: [], 4: [], 5: [] }, camelBadges: { p1: 0, p2: 0 }, roundsWon: { p1: 0, p2: 0 }, round: 1, result: null, turnCount: 0 };
  return newRound(base, seed >>> 0);
}, validateAction: validate, applyAction: apply, getPlayerView(s, p) {
  return makeView(s, p);
}, getResult(s) {
  return s.result;
} };

// src/games/splendorCards.ts
var canonicalCards = [
  {
    "tier": 1,
    "bonus": "white",
    "points": 1,
    "cost": {
      "green": 4
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 1,
    "cost": {
      "red": 4
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 1,
    "cost": {
      "black": 4
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 1,
    "cost": {
      "white": 4
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 1,
    "cost": {
      "blue": 4
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "white": 3,
      "blue": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "blue": 1,
      "green": 3,
      "red": 1
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 3,
      "green": 1
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 1,
      "red": 1,
      "black": 3
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "green": 1,
      "red": 3,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 3
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "black": 3
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "red": 3
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 3
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "green": 3
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 2,
      "green": 2,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "white": 1,
      "green": 2,
      "red": 2
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "blue": 1,
      "red": 2,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 2,
      "green": 1,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "white": 2,
      "blue": 2,
      "red": 1
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 2,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "green": 2,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "blue": 2,
      "red": 2
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 2,
      "red": 2
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "white": 2,
      "green": 2
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 1,
      "green": 2,
      "red": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "white": 1,
      "green": 1,
      "red": 2,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 1,
      "red": 1,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 2,
      "blue": 1,
      "green": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 2,
      "green": 1,
      "red": 1
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "red": 2,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "white": 1,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "white": 2,
      "blue": 1
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "blue": 2,
      "green": 1
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "green": 2,
      "red": 1
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 1,
      "green": 1,
      "red": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "white": 1,
      "green": 1,
      "red": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 1,
      "red": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 1,
      "green": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 1,
      "green": 1,
      "red": 1
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 1,
    "cost": {
      "green": 3,
      "red": 2,
      "black": 2
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 1,
    "cost": {
      "blue": 2,
      "green": 2,
      "red": 3
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 1,
    "cost": {
      "white": 2,
      "blue": 3,
      "black": 2
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 1,
    "cost": {
      "white": 2,
      "red": 2,
      "black": 3
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 1,
    "cost": {
      "white": 3,
      "blue": 2,
      "green": 2
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 1,
    "cost": {
      "white": 2,
      "blue": 3,
      "red": 3
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 1,
    "cost": {
      "blue": 2,
      "green": 3,
      "black": 3
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 1,
    "cost": {
      "white": 3,
      "green": 2,
      "red": 3
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 1,
    "cost": {
      "blue": 3,
      "red": 2,
      "black": 3
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 1,
    "cost": {
      "white": 3,
      "green": 3,
      "black": 2
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 3,
    "cost": {
      "white": 6
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 3,
    "cost": {
      "blue": 6
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 3,
    "cost": {
      "green": 6
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 3,
    "cost": {
      "red": 6
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 3,
    "cost": {
      "black": 6
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 2,
    "cost": {
      "green": 1,
      "red": 4,
      "black": 2
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 2,
    "cost": {
      "white": 2,
      "red": 1,
      "black": 4
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 2,
    "cost": {
      "white": 4,
      "blue": 2,
      "black": 1
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 2,
    "cost": {
      "white": 1,
      "blue": 4,
      "green": 2
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 2,
    "cost": {
      "blue": 1,
      "green": 4,
      "red": 2
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 2,
    "cost": {
      "red": 5
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 2,
    "cost": {
      "blue": 5
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 2,
    "cost": {
      "green": 5
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 2,
    "cost": {
      "black": 5
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 2,
    "cost": {
      "white": 5
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 2,
    "cost": {
      "red": 5,
      "black": 3
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 2,
    "cost": {
      "white": 5,
      "blue": 3
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 2,
    "cost": {
      "blue": 5,
      "green": 3
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 2,
    "cost": {
      "white": 3,
      "black": 5
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 2,
    "cost": {
      "green": 5,
      "red": 3
    }
  },
  {
    "tier": 3,
    "bonus": "white",
    "points": 3,
    "cost": {
      "blue": 3,
      "green": 3,
      "red": 5,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "blue",
    "points": 3,
    "cost": {
      "white": 3,
      "green": 3,
      "red": 3,
      "black": 5
    }
  },
  {
    "tier": 3,
    "bonus": "green",
    "points": 3,
    "cost": {
      "white": 5,
      "blue": 3,
      "red": 3,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "red",
    "points": 3,
    "cost": {
      "white": 3,
      "blue": 5,
      "green": 3,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "black",
    "points": 3,
    "cost": {
      "white": 3,
      "blue": 3,
      "green": 5,
      "red": 3
    }
  },
  {
    "tier": 3,
    "bonus": "white",
    "points": 4,
    "cost": {
      "black": 7
    }
  },
  {
    "tier": 3,
    "bonus": "blue",
    "points": 4,
    "cost": {
      "white": 7
    }
  },
  {
    "tier": 3,
    "bonus": "green",
    "points": 4,
    "cost": {
      "blue": 7
    }
  },
  {
    "tier": 3,
    "bonus": "red",
    "points": 4,
    "cost": {
      "green": 7
    }
  },
  {
    "tier": 3,
    "bonus": "black",
    "points": 4,
    "cost": {
      "red": 7
    }
  },
  {
    "tier": 3,
    "bonus": "white",
    "points": 4,
    "cost": {
      "white": 3,
      "red": 3,
      "black": 6
    }
  },
  {
    "tier": 3,
    "bonus": "blue",
    "points": 4,
    "cost": {
      "white": 6,
      "blue": 3,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "green",
    "points": 4,
    "cost": {
      "white": 3,
      "blue": 6,
      "green": 3
    }
  },
  {
    "tier": 3,
    "bonus": "red",
    "points": 4,
    "cost": {
      "blue": 3,
      "green": 6,
      "red": 3
    }
  },
  {
    "tier": 3,
    "bonus": "black",
    "points": 4,
    "cost": {
      "green": 3,
      "red": 6,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "white",
    "points": 5,
    "cost": {
      "white": 3,
      "black": 7
    }
  },
  {
    "tier": 3,
    "bonus": "blue",
    "points": 5,
    "cost": {
      "white": 7,
      "blue": 3
    }
  },
  {
    "tier": 3,
    "bonus": "green",
    "points": 5,
    "cost": {
      "blue": 7,
      "green": 3
    }
  },
  {
    "tier": 3,
    "bonus": "red",
    "points": 5,
    "cost": {
      "green": 7,
      "red": 3
    }
  },
  {
    "tier": 3,
    "bonus": "black",
    "points": 5,
    "cost": {
      "red": 7,
      "black": 3
    }
  }
];

// src/games/splendor.ts
var colors = ["white", "blue", "green", "red", "black"];
var titles = { white: { ko: "\uD770\uC0C9", es: "blanco" }, blue: { ko: "\uD30C\uB791", es: "azul" }, green: { ko: "\uCD08\uB85D", es: "verde" }, red: { ko: "\uBE68\uAC15", es: "rojo" }, black: { ko: "\uAC80\uC815", es: "negro" } };
var blank = () => ({ white: 0, blue: 0, green: 0, red: 0, black: 0 });
function card(id, tier, bonus2, points, cost) {
  return { id, tier, bonus: bonus2, points, cost: { ...blank(), ...cost } };
}
function createDeck(tier) {
  return canonicalCards.filter((c) => c.tier === tier).map((c, i) => card(`t${tier}-${String(i + 1).padStart(2, "0")}`, tier, c.bonus, c.points, c.cost));
}
var splendorNobles = [
  { points: 3, requirement: { white: 4, blue: 4 } },
  { points: 3, requirement: { blue: 4, green: 4 } },
  { points: 3, requirement: { green: 4, red: 4 } },
  { points: 3, requirement: { red: 4, black: 4 } },
  { points: 3, requirement: { white: 4, black: 4 } },
  { points: 3, requirement: { white: 3, blue: 3, black: 3 } },
  { points: 3, requirement: { white: 3, blue: 3, green: 3 } },
  { points: 3, requirement: { blue: 3, green: 3, red: 3 } },
  { points: 3, requirement: { green: 3, red: 3, black: 3 } },
  { points: 3, requirement: { white: 3, red: 3, black: 3 } }
];
function creates(seed) {
  const rnd = seededRandom(seed), decks = { 1: shuffle(createDeck(1), rnd), 2: shuffle(createDeck(2), rnd), 3: shuffle(createDeck(3), rnd) };
  const market = { 1: decks[1].splice(0, 4), 2: decks[2].splice(0, 4), 3: decks[3].splice(0, 4) };
  const ns = shuffle(splendorNobles.map((n, i) => ({ ...n, id: `n${i}` })), rnd).slice(0, 3);
  return { seed: seed >>> 0, active: "p1", bank: { white: 4, blue: 4, green: 4, red: 4, black: 4, gold: 5 }, market, decks, hands: { p1: { ...blank(), gold: 0 }, p2: { ...blank(), gold: 0 } }, bonuses: { p1: blank(), p2: blank() }, reserved: { p1: [], p2: [] }, nobles: { p1: 0, p2: 0 }, availableNobles: Object.fromEntries(ns.map((n) => [n.id, { points: n.points, requirement: n.requirement }])), turns: { p1: 0, p2: 0 }, pendingNobles: [], cardPoints: { p1: 0, p2: 0 }, pendingEnd: false, result: null };
}
var sum = (x) => colors.reduce((a, c) => a + x[c], 0);
var tokenTypes = [...colors, "gold"];
function returnPlans(hand, gains) {
  const needed = Math.max(0, tokenTypes.reduce((n, g) => n + hand[g] + gains[g], 0) - 10);
  if (!needed) return [{}];
  const plans = [];
  const pick = (i, left, counts) => {
    if (i === tokenTypes.length) {
      if (left === 0) plans.push(counts);
      return;
    }
    const g = tokenTypes[i], max = Math.min(left, hand[g] + gains[g]);
    for (let n = 0; n <= max; n++) pick(i + 1, left - n, n ? { ...counts, [g]: n } : counts);
  };
  pick(0, needed, {});
  return plans;
}
function validReturns(hand, gains, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const returns = value;
  if (Object.keys(returns).some((g) => !tokenTypes.includes(g)) || tokenTypes.some((g) => returns[g] !== void 0 && (!Number.isInteger(returns[g]) || Number(returns[g]) < 0 || Number(returns[g]) > hand[g] + gains[g]))) return false;
  const returned = tokenTypes.reduce((n, g) => n + Number(returns[g] ?? 0), 0), needed = Math.max(0, tokenTypes.reduce((n, g) => n + hand[g] + gains[g], 0) - 10);
  return returned === needed;
}
function returnToBank(hand, bank, value) {
  for (const g of tokenTypes) {
    const n = Number(value?.[g] ?? 0);
    hand[g] -= n;
    bank[g] += n;
  }
}
function affordable(s, p, c) {
  let missing = 0;
  for (const g of colors) missing += Math.max(0, c.cost[g] - s.bonuses[p][g] - s.hands[p][g]);
  return missing <= s.hands[p].gold;
}
function playerPoints(s, p) {
  return s.nobles[p] + s.cardPoints[p];
}
function endIfReady(s) {
  if (s.pendingNobles.length || !(s.pendingEnd && s.turns.p1 === s.turns.p2)) return s;
  const total = (p) => playerPoints(s, p);
  const a = total("p1"), b = total("p2");
  const tie = (p) => sum(s.bonuses[p]);
  let winner = a === b ? tie("p1") === tie("p2") ? "draw" : tie("p1") < tie("p2") ? "p1" : "p2" : a > b ? "p1" : "p2";
  return { ...s, result: { winner, reason: `final score ${a}-${b}`, scores: { p1: a, p2: b } } };
}
function valid(s, p, a) {
  if (s.result) return "Game is finished";
  if (s.active !== p) return "Not your turn";
  const x = a.payload ?? {};
  if (s.pendingNobles.length) {
    return a.type === "chooseNoble" && typeof x.id === "string" && s.pendingNobles.includes(x.id) ? null : "Choose one qualifying noble";
  }
  if (a.type === "chooseNoble") return "No noble choice is pending";
  if (a.type === "take") {
    if (!Array.isArray(x.gems) || x.gems.some((g) => !colors.includes(g))) return "Choose valid gem colors";
    const gs = x.gems;
    const kinds = colors.filter((g) => s.bank[g] > 0).length;
    if (kinds === 0 || gs.length !== Math.min(3, kinds) || new Set(gs).size !== gs.length) return "Take up to 3 distinct available colors";
    if (gs.some((g) => s.bank[g] < 1)) return "Gem unavailable";
    const gains = { ...blank(), gold: 0 };
    for (const g of gs) gains[g]++;
    if (!validReturns(s.hands[p], gains, x.returnTokens ?? {})) return "Return exactly enough tokens to stay at 10";
    return null;
  }
  if (a.type === "takeTwo") {
    const g = x.gem;
    if (!colors.includes(g) || s.bank[g] < 4) return "Choose a color with at least 4 tokens";
    const gains = { ...blank(), gold: 0 };
    gains[g] = 2;
    if (!validReturns(s.hands[p], gains, x.returnTokens ?? {})) return "Return exactly enough tokens to stay at 10";
    return null;
  }
  if (a.type === "reserve") {
    if (![1, 2, 3].includes(x.tier)) return "Invalid tier";
    const tier = x.tier;
    if (s.reserved[p].length >= 3) return "Reserve limit reached";
    const gains = { ...blank(), gold: s.bank.gold ? 1 : 0 };
    if (!validReturns(s.hands[p], gains, x.returnTokens ?? {})) return "Return exactly enough tokens to stay at 10";
    const ix = x.index;
    if (ix !== void 0 && (!Number.isInteger(ix) || Number(ix) < 0 || Number(ix) >= s.market[tier].length)) return "Invalid card selection";
    if (ix === void 0 && !s.decks[tier].length) return "No card remains";
    return null;
  }
  if (a.type === "buy") {
    const source = x.source, ix = x.index;
    if (source === "reserved") {
      if (!Number.isInteger(ix) || Number(ix) < 0 || Number(ix) >= s.reserved[p].length) return "Invalid reserved card";
      return affordable(s, p, s.reserved[p][Number(ix)]) ? null : "Cannot afford card";
    }
    if (source !== "market" || ![1, 2, 3].includes(x.tier) || !Number.isInteger(ix)) return "Invalid market card";
    const tier = x.tier;
    if (Number(ix) < 0 || Number(ix) >= s.market[tier].length) return "Invalid market card";
    return affordable(s, p, s.market[tier][Number(ix)]) ? null : "Cannot afford card";
  }
  return "Unknown action";
}
function apply2(s, p, a) {
  const e = valid(s, p, a);
  if (e) throw new Error(e);
  const x = a.payload ?? {};
  let n = { ...s, bank: { ...s.bank }, market: { 1: [...s.market[1]], 2: [...s.market[2]], 3: [...s.market[3]] }, decks: { 1: [...s.decks[1]], 2: [...s.decks[2]], 3: [...s.decks[3]] }, hands: { ...s.hands, [p]: { ...s.hands[p] } }, bonuses: { ...s.bonuses, [p]: { ...s.bonuses[p] } }, reserved: { ...s.reserved, [p]: [...s.reserved[p]] }, nobles: { ...s.nobles }, availableNobles: { ...s.availableNobles }, turns: { ...s.turns, [p]: s.turns[p] + 1 }, active: otherPlayer(p) };
  if (a.type === "take") {
    for (const g of x.gems) {
      n.bank[g]--;
      n.hands[p][g]++;
    }
    returnToBank(n.hands[p], n.bank, x.returnTokens);
  }
  if (a.type === "takeTwo") {
    const g = x.gem;
    n.bank[g] -= 2;
    n.hands[p][g] += 2;
    returnToBank(n.hands[p], n.bank, x.returnTokens);
  }
  if (a.type === "reserve") {
    const tier = x.tier, ix = x.index;
    const c = ix === void 0 ? n.decks[tier].shift() : n.market[tier].splice(ix, 1)[0];
    if (ix !== void 0 && n.decks[tier].length) n.market[tier].push(n.decks[tier].shift());
    if (!c) throw new Error("Reserved card is unavailable");
    n.reserved[p].push(c);
    if (n.bank.gold) {
      n.bank.gold--;
      n.hands[p].gold++;
    }
    returnToBank(n.hands[p], n.bank, x.returnTokens);
  }
  if (a.type === "buy") {
    const source = x.source;
    let c;
    if (source === "reserved") c = n.reserved[p].splice(x.index, 1)[0];
    else {
      const tier = x.tier;
      c = n.market[tier].splice(x.index, 1)[0];
      if (n.decks[tier].length) n.market[tier].push(n.decks[tier].shift());
    }
    let gold = 0;
    for (const g of colors) {
      const due = Math.max(0, c.cost[g] - n.bonuses[p][g]);
      const paid = Math.min(due, n.hands[p][g]);
      n.hands[p][g] -= paid;
      n.bank[g] += paid;
      gold += due - paid;
    }
    n.hands[p].gold -= gold;
    n.bank.gold += gold;
    n.bonuses[p][c.bonus]++;
    n.cardPoints = { ...s.cardPoints, [p]: s.cardPoints[p] + c.points };
    const qualified = Object.entries(n.availableNobles).filter(([, noble]) => colors.every((g) => n.bonuses[p][g] >= (noble.requirement[g] ?? 0))).map(([id]) => id);
    if (qualified.length === 1) {
      const id = qualified[0];
      n.nobles[p] += n.availableNobles[id].points;
      delete n.availableNobles[id];
    } else if (qualified.length > 1) n.pendingNobles = qualified;
  }
  if (a.type === "chooseNoble") {
    const id = x.id;
    n.nobles[p] += n.availableNobles[id].points;
    delete n.availableNobles[id];
    n.pendingNobles = [];
  }
  const cardPoints = n.cardPoints ?? s.cardPoints;
  n = { ...n, cardPoints, pendingEnd: s.pendingEnd || playerPoints(n, p) >= 15 };
  if (a.type === "buy" && n.pendingNobles.length) {
    n.turns[p] = s.turns[p];
    n.active = p;
  }
  return endIfReady(n);
}
function view(s, p) {
  const actions = [];
  const add = (ko, es, action) => actions.push({ label: { ko, es }, action });
  if (!s.result && s.active === p) {
    if (s.pendingNobles.length) {
      for (const id of s.pendingNobles) {
        const noble = s.availableNobles[id];
        add(`\uADC0\uC871 \uC120\uD0DD (${noble.points}\uC810)`, `Elegir noble (${noble.points} puntos)`, { type: "chooseNoble", payload: { id } });
      }
    } else {
      const available = colors.filter((g) => s.bank[g] > 0), takeCount = Math.min(3, available.length);
      const append = (ko, es, type, payload, gains) => {
        for (const ret of returnPlans(s.hands[p], gains)) {
          const back = Object.entries(ret).map(([g, n]) => `${g} ${n}`).join(", ");
          add(`${ko}${back ? ` \xB7 \uBC18\uD658 ${back}` : ""}`, `${es}${back ? ` \xB7 devolver ${back}` : ""}`, { type, payload: { ...payload, ...Object.keys(ret).length ? { returnTokens: ret } : {} } });
        }
      };
      const choose = (from, picked) => {
        if (picked.length === takeCount) {
          const gains = { ...blank(), gold: 0 };
          for (const g of picked) gains[g]++;
          append(`${takeCount}\uAC1C \uB2E4\uB978 \uC0C9 \uBCF4\uC11D \uAC00\uC838\uC624\uAE30`, `Tomar ${takeCount} gemas distintas`, "take", { gems: [...picked] }, gains);
          return;
        }
        for (let i = from; i < available.length; i++) choose(i + 1, [...picked, available[i]]);
      };
      if (takeCount) choose(0, []);
      for (const g of colors) if (s.bank[g] >= 4) {
        const gains = { ...blank(), gold: 0 };
        gains[g] = 2;
        append(`\uAC19\uC740 \uBCF4\uC11D 2\uAC1C: ${titles[g].ko}`, `2 gemas ${titles[g].es}`, "takeTwo", { gem: g }, gains);
      }
      for (const tier of [1, 2, 3]) {
        if (s.reserved[p].length < 3) {
          for (let i = 0; i < s.market[tier].length; i++) {
            const gains = { ...blank(), gold: s.bank.gold ? 1 : 0 };
            append(`\uC608\uC57D ${tier}\uB2E8\uACC4 \uCE74\uB4DC`, `Reservar carta nivel ${tier}`, "reserve", { tier, index: i }, gains);
          }
          if (s.decks[tier].length) {
            const gains = { ...blank(), gold: s.bank.gold ? 1 : 0 };
            append(`\uB371\uC5D0\uC11C ${tier}\uB2E8\uACC4 \uCE74\uB4DC \uC608\uC57D`, `Reservar del mazo nivel ${tier}`, "reserve", { tier }, gains);
          }
        }
        for (let i = 0; i < s.market[tier].length; i++) if (affordable(s, p, s.market[tier][i])) add(`\uAD6C\uB9E4: ${s.market[tier][i].id}`, `Comprar: ${s.market[tier][i].id}`, { type: "buy", payload: { source: "market", tier, index: i } });
      }
      for (let i = 0; i < s.reserved[p].length; i++) if (affordable(s, p, s.reserved[p][i])) add(`\uC608\uC57D \uCE74\uB4DC \uAD6C\uB9E4: ${s.reserved[p][i].id}`, `Comprar reservada: ${s.reserved[p][i].id}`, { type: "buy", payload: { source: "reserved", index: i } });
    }
  }
  const points = (q) => s.cardPoints[q] + s.nobles[q];
  return { turn: s.active, phase: s.result ? "finished" : s.pendingNobles.length ? "chooseNoble" : s.active === p ? "action" : "waiting", board: { bank: { ...s.bank }, market: { 1: s.market[1].map((c) => ({ ...c, cost: { ...c.cost } })), 2: s.market[2].map((c) => ({ ...c, cost: { ...c.cost } })), 3: s.market[3].map((c) => ({ ...c, cost: { ...c.cost } })) }, reservedOpponentCount: s.reserved[otherPlayer(p)].length, nobles: Object.fromEntries(Object.entries(s.availableNobles).map(([id, n]) => [id, { points: n.points, requirement: { ...n.requirement } }])), score: { p1: points("p1"), p2: points("p2") }, ownedBonuses: { p1: { ...s.bonuses.p1 }, p2: { ...s.bonuses.p2 } }, ownedNobles: { ...s.nobles }, turns: { ...s.turns } }, ownHand: { tokens: { ...s.hands[p] }, bonuses: { ...s.bonuses[p] }, reserved: s.reserved[p].map((c) => ({ ...c, cost: { ...c.cost } })), points: s.cardPoints[p], nobles: s.nobles[p] }, opponentCount: sum(s.hands[otherPlayer(p)]) + s.hands[otherPlayer(p)].gold, status: s.result ? "finished" : s.active === p ? "Your turn" : "Opponent turn", result: s.result, actions };
}
var splendorEngine = { id: "splendor", createInitialState: creates, validateAction: valid, applyAction: apply2, getPlayerView: view, getResult: (s) => s.result };

// src/games/minhwatu.ts
var MINHWATU_GODORI_BONUS = 50;
var flowers = {
  1: { ko: "\uC18C\uB098\uBB34", es: "pino" },
  2: { ko: "\uB9E4\uD654", es: "ciruelo" },
  3: { ko: "\uBC9A\uAF43", es: "cerezo" },
  4: { ko: "\uB4F1\uB098\uBB34", es: "glicinia" },
  5: { ko: "\uCC3D\uD3EC", es: "iris" },
  6: { ko: "\uBAA8\uB780", es: "peon\xEDa" },
  7: { ko: "\uC2F8\uB9AC", es: "lespedeza" },
  8: { ko: "\uC5B5\uC0C8", es: "pampas" },
  9: { ko: "\uAD6D\uD654", es: "crisantemo" },
  10: { ko: "\uB2E8\uD48D", es: "arce" },
  11: { ko: "\uC624\uB3D9\uB098\uBB34", es: "paulownia" },
  12: { ko: "\uBE44", es: "lluvia" }
};
var badgeByKind = {
  bright: { ko: "\uAD11", es: "brillante" },
  animal: { ko: "\uC5F4\uB057", es: "animal" },
  ribbon: { ko: "\uB760", es: "cinta" },
  plain: { ko: "\uD53C", es: "simple" }
};
var cardKinds = {
  1: [{ kind: "bright", badge: { ko: "\uD559", es: "grulla" } }, { kind: "ribbon", ribbonSet: "red", badge: { ko: "\uD64D\uB2E8", es: "poes\xEDa roja" } }, { kind: "plain" }, { kind: "plain" }],
  2: [{ kind: "animal", badge: { ko: "\uAF80\uAF2C\uB9AC", es: "ruise\xF1or" } }, { kind: "ribbon", ribbonSet: "red", badge: { ko: "\uD64D\uB2E8", es: "poes\xEDa roja" } }, { kind: "plain" }, { kind: "plain" }],
  3: [{ kind: "bright", badge: { ko: "\uB9C9", es: "cortina" } }, { kind: "ribbon", ribbonSet: "red", badge: { ko: "\uD64D\uB2E8", es: "poes\xEDa roja" } }, { kind: "plain" }, { kind: "plain" }],
  4: [{ kind: "animal", badge: { ko: "\uB450\uACAC\uC0C8", es: "cuco" } }, { kind: "ribbon", ribbonSet: "grass", badge: { ko: "\uCD08\uB2E8", es: "cinta verde" } }, { kind: "plain" }, { kind: "plain" }],
  5: [{ kind: "animal", badge: { ko: "\uB2E4\uB9AC", es: "puente" } }, { kind: "ribbon", ribbonSet: "grass", badge: { ko: "\uCD08\uB2E8", es: "cinta verde" } }, { kind: "plain" }, { kind: "plain" }],
  6: [{ kind: "animal", badge: { ko: "\uB098\uBE44", es: "mariposa" } }, { kind: "ribbon", ribbonSet: "blue", badge: { ko: "\uCCAD\uB2E8", es: "cinta azul" } }, { kind: "plain" }, { kind: "plain" }],
  7: [{ kind: "animal", badge: { ko: "\uBA67\uB3FC\uC9C0", es: "jabal\xED" } }, { kind: "ribbon", ribbonSet: "grass", badge: { ko: "\uCD08\uB2E8", es: "cinta verde" } }, { kind: "plain" }, { kind: "plain" }],
  8: [{ kind: "bright", badge: { ko: "\uB2EC", es: "luna" } }, { kind: "animal", badge: { ko: "\uAE30\uB7EC\uAE30", es: "gansos" } }, { kind: "plain" }, { kind: "plain" }],
  9: [{ kind: "animal", badge: { ko: "\uC220\uC794", es: "copa de sake" } }, { kind: "ribbon", ribbonSet: "blue", badge: { ko: "\uCCAD\uB2E8", es: "cinta azul" } }, { kind: "plain" }, { kind: "plain" }],
  10: [{ kind: "animal", badge: { ko: "\uC0AC\uC2B4", es: "ciervo" } }, { kind: "ribbon", ribbonSet: "blue", badge: { ko: "\uCCAD\uB2E8", es: "cinta azul" } }, { kind: "plain" }, { kind: "plain" }],
  11: [{ kind: "bright", badge: { ko: "\uBD09\uD669", es: "f\xE9nix" } }, { kind: "plain" }, { kind: "plain" }, { kind: "plain" }],
  12: [{ kind: "bright", badge: { ko: "\uBE44\uAD11", es: "hombre bajo la lluvia" } }, { kind: "animal", badge: { ko: "\uC81C\uBE44", es: "golondrina" } }, { kind: "ribbon", ribbonSet: "rain", badge: { ko: "\uBE44\uB760", es: "cinta de lluvia" } }, { kind: "plain" }]
};
function makeDeck() {
  return Object.entries(cardKinds).flatMap(([month, kinds]) => kinds.map((card2, index) => ({
    id: `${month}-${index + 1}`,
    month: Number(month),
    flower: { ...flowers[Number(month)] },
    kind: card2.kind,
    points: card2.kind === "bright" ? 20 : card2.kind === "animal" ? 10 : card2.kind === "ribbon" ? 5 : 0,
    badge: { ...card2.badge ?? badgeByKind[card2.kind] },
    ...card2.ribbonSet ? { ribbonSet: card2.ribbonSet } : {}
  })));
}
var cloneCard = (card2) => ({ ...card2, flower: { ...card2.flower }, badge: { ...card2.badge } });
var count = (cards2, test) => cards2.filter(test).length;
var yakuRules = [
  { id: "hongdan", label: { ko: "\uD64D\uB2E8", es: "Hongdan" }, cardIds: ["1-2", "2-2", "3-2"], bonus: 30 },
  { id: "cheongdan", label: { ko: "\uCCAD\uB2E8", es: "Cheongdan" }, cardIds: ["6-2", "9-2", "10-2"], bonus: 30 },
  { id: "chodan", label: { ko: "\uCD08\uB2E8", es: "Chodan" }, cardIds: ["4-2", "5-2", "7-2"], bonus: 30 },
  { id: "godori", label: { ko: "\uACE0\uB3C4\uB9AC", es: "Godori" }, cardIds: ["2-1", "4-1", "8-2"], bonus: MINHWATU_GODORI_BONUS },
  ...[11, 5, 10, 12].map((month) => ({ id: `month-${month}`, label: { ko: `${month}\uC6D4 \uC644\uC131`, es: `Mes ${month} completo` }, cardIds: [1, 2, 3, 4].map((index) => `${month}-${index}`), bonus: month === 11 ? 40 : 20 }))
];
function minhwatuYakuProgress(cards2, godoriBonus = MINHWATU_GODORI_BONUS) {
  const ids = new Set(cards2.map((card2) => card2.id));
  return yakuRules.map((rule) => {
    const have = rule.cardIds.filter((id) => ids.has(id)).length;
    return { ...rule, bonus: rule.id === "godori" ? godoriBonus : rule.bonus, label: { ...rule.label }, cardIds: [...rule.cardIds], have, need: rule.cardIds.length, complete: have === rule.cardIds.length };
  });
}
function scoreMinhwatuYakus(cards2, godoriBonus = MINHWATU_GODORI_BONUS) {
  return minhwatuYakuProgress(cards2, godoriBonus).reduce((sum2, yaku) => sum2 + (yaku.complete ? yaku.bonus : 0), 0);
}
function minhwatuScoreBreakdown(captures, godoriBonus = MINHWATU_GODORI_BONUS) {
  const yakus = { p1: minhwatuYakuProgress(captures.p1, godoriBonus), p2: minhwatuYakuProgress(captures.p2, godoriBonus) };
  const bonuses = { p1: scoreMinhwatuYakus(captures.p1, godoriBonus), p2: scoreMinhwatuYakus(captures.p2, godoriBonus) };
  const seat = (p) => {
    const cards2 = captures[p], basePoints = cards2.reduce((sum2, card2) => sum2 + card2.points, 0), opponentYakuPoints = bonuses[otherPlayer(p)];
    return { counts: { bright: count(cards2, (c) => c.kind === "bright"), animal: count(cards2, (c) => c.kind === "animal"), ribbon: count(cards2, (c) => c.kind === "ribbon"), plain: count(cards2, (c) => c.kind === "plain") }, basePoints, yakus: yakus[p], ownYakuPoints: bonuses[p], opponentYakuPoints, finalScore: basePoints + 2 * bonuses[p] - opponentYakuPoints };
  };
  return { p1: seat("p1"), p2: seat("p2") };
}
function appendEvent2(s, event2) {
  const events = s.events ?? [], sequence = (events.at(-1)?.sequence ?? 0) + 1;
  s.events = [...events, { ...event2, sequence }].slice(-48);
}
function captureWithEvent(s, player, table, captures, card2, source, targetIndex) {
  const before = scoreMinhwatuMatch(captures), oldYaku = minhwatuYakuProgress(captures[player]), oldCount = captures[player].length;
  if (!resolveCaptured(table, captures[player], card2, targetIndex)) return;
  const cards2 = captures[player].slice(oldCount).map(cloneCard), after = scoreMinhwatuMatch(captures);
  appendEvent2(s, { type: "capture", actor: player, title: { ko: `${card2.month}\uC6D4 ${cards2.length}\uC7A5 \uD68D\uB4DD`, es: `Captura de ${cards2.length} cartas del mes ${card2.month}` }, cards: cards2, origins: Object.fromEntries(cards2.map((c) => [c.id, c.id === card2.id ? source : "table"])), scoreChanges: { p1: after.p1 - before.p1, p2: after.p2 - before.p2 } });
  for (const yaku of minhwatuYakuProgress(captures[player])) if (yaku.complete && yaku.bonus > 0 && !oldYaku.find((old) => old.id === yaku.id)?.complete) appendEvent2(s, { type: "special", actor: player, title: { ko: `${yaku.label.ko} \uC644\uC131 \xB7 \uBCF4\uB108\uC2A4 ${yaku.bonus}\uC810`, es: `${yaku.label.es}: bono de ${yaku.bonus} pts` }, yaku: { id: yaku.id, label: yaku.label, bonus: yaku.bonus } });
}
function scoreMinhwatuMatch(captures, godoriBonus = MINHWATU_GODORI_BONUS) {
  const ownYakus = { p1: scoreMinhwatuYakus(captures.p1, godoriBonus), p2: scoreMinhwatuYakus(captures.p2, godoriBonus) };
  const basePoints = { p1: captures.p1.reduce((sum2, card2) => sum2 + card2.points, 0), p2: captures.p2.reduce((sum2, card2) => sum2 + card2.points, 0) };
  return { p1: basePoints.p1 + 2 * ownYakus.p1 - ownYakus.p2, p2: basePoints.p2 + 2 * ownYakus.p2 - ownYakus.p1 };
}
function scoreResult(captures) {
  const scores = scoreMinhwatuMatch(captures);
  if (scores.p1 === scores.p2) return { winner: "draw", reason: "Equal Minhwatu scores / empate", scores };
  return { winner: scores.p1 > scores.p2 ? "p1" : "p2", reason: "Higher Minhwatu score / mayor puntuaci\xF3n", scores };
}
function matches(table, card2) {
  return table.flatMap((c, index) => c.month === card2.month ? [index] : []);
}
function resolveCaptured(table, captures, card2, targetIndex) {
  const indices = matches(table, card2);
  if (!indices.length) {
    table.push(card2);
    return false;
  }
  const chosen = indices.length === 3 ? indices : indices.length === 1 ? indices : [targetIndex];
  for (const index of [...chosen].sort((a, b) => b - a)) captures.push(table.splice(index, 1)[0]);
  captures.push(card2);
  return true;
}
function finishTurn(s, player, deck, table, captures, hands = s.hands) {
  const finished = deck.length === 0 && hands.p1.length === 0 && hands.p2.length === 0;
  const next = { ...s, deck, table, captures, hands, pending: null, phase: finished ? "finished" : "play", turn: otherPlayer(player), result: finished ? scoreResult(captures) : null };
  if (finished) appendEvent2(next, { type: "win", winner: next.result.winner, title: { ko: next.result.winner === "draw" ? "\uBBFC\uD654\uD22C \uBB34\uC2B9\uBD80" : "\uBBFC\uD654\uD22C \uCD5C\uC885 \uC815\uC0B0", es: next.result.winner === "draw" ? "Empate en Minhwatu" : "Resultado de Minhwatu" } });
  else appendEvent2(next, { type: "turn", actor: next.turn, title: { ko: "\uB2E4\uC74C \uCC28\uB840", es: "Siguiente turno" } });
  return next;
}
function finishAfterPlay(s, player, table, captures, hands) {
  if (!s.deck.length) return finishTurn(s, player, [], table, captures, hands);
  const [drawn, ...deck] = s.deck, indices = matches(table, drawn);
  appendEvent2(s, { type: "draw", actor: player, title: { ko: `\uB354\uBBF8\uC5D0\uC11C ${drawn.month}\uC6D4 \uACF5\uAC1C`, es: `Sale una carta del mes ${drawn.month}` }, cards: [cloneCard(drawn)] });
  if (indices.length === 2) return { ...s, turn: player, hands, deck, table, captures, pending: { card: drawn }, phase: "capture-draw", result: null };
  captureWithEvent(s, player, table, captures, drawn, "draw");
  return finishTurn(s, player, deck, table, captures, hands);
}
function validate2(s, p, a) {
  if (p !== "p1" && p !== "p2") return "Invalid player";
  if (s.result || s.phase === "finished") return "Game is finished";
  if (p !== s.turn) return "Not your turn";
  if (!a || typeof a.type !== "string") return "Invalid action";
  if (a.type === "play") {
    if (s.phase !== "play") return "Resolve the current capture first";
    const index = a.payload?.index, target = a.payload?.targetIndex;
    if (!Number.isInteger(index) || Number(index) < 0 || Number(index) >= s.hands[p].length) return "Invalid hand index";
    const matchesForCard = matches(s.table, s.hands[p][Number(index)]);
    if (matchesForCard.length === 2 && (!Number.isInteger(target) || !matchesForCard.includes(Number(target)))) return "Choose one matching table card";
    if (matchesForCard.length !== 2 && target !== void 0) return "A target is only needed for a duplicate month";
    return null;
  }
  if (a.type === "capture") {
    if (s.phase !== "capture-draw" || !s.pending) return "No pending capture";
    const target = a.payload?.targetIndex, found = matches(s.table, s.pending.card);
    return found.length === 2 && Number.isInteger(target) && found.includes(Number(target)) ? null : "Choose one matching table card";
  }
  return "Unknown action";
}
function apply3(s, p, a) {
  const error = validate2(s, p, a);
  if (error) throw new Error(error);
  s = { ...s, rulesVersion: 2, events: [...s.events ?? []] };
  const hands = { p1: [...s.hands.p1], p2: [...s.hands.p2] };
  const table = [...s.table], deck = [...s.deck], captures = { p1: [...s.captures.p1], p2: [...s.captures.p2] };
  if (a.type === "capture") {
    const pending = s.pending, index = Number(a.payload.targetIndex);
    captureWithEvent(s, p, table, captures, pending.card, "draw", index);
    return finishTurn(s, p, deck, table, captures, hands);
  }
  const handIndex = Number(a.payload.index), card2 = hands[p].splice(handIndex, 1)[0], indices = matches(table, card2);
  appendEvent2(s, { type: "play", actor: p, title: { ko: `${card2.month}\uC6D4 ${card2.badge.ko} \uB0B4\uAE30`, es: `Jugada: mes ${card2.month}, ${card2.badge.es}` }, cards: [cloneCard(card2)] });
  captureWithEvent(s, p, table, captures, card2, "table", indices.length === 2 ? Number(a.payload.targetIndex) : void 0);
  return finishAfterPlay(s, p, table, captures, hands);
}
var actionLabel = (ko, es, action) => ({ label: { ko, es }, action });
var minhwatuEngine = {
  id: "minhwatu",
  createInitialState(seed) {
    const cards2 = shuffle(makeDeck(), seededRandom(seed));
    return { seed: seed >>> 0, rulesVersion: 2, turn: "p1", hands: { p1: cards2.slice(0, 10), p2: cards2.slice(10, 20) }, table: cards2.slice(20, 28), deck: cards2.slice(28), captures: { p1: [], p2: [] }, pending: null, phase: "play", result: null, events: [{ sequence: 1, type: "deal", title: { ko: "\uD654\uD22C\uD328\uB97C \uB098\uB234\uC5B4\uC694", es: "Las cartas est\xE1n repartidas" }, cards: cards2.slice(20, 28).map(cloneCard) }] };
  },
  validateAction: validate2,
  applyAction: apply3,
  getPlayerView(s, p) {
    const actions = [];
    if (!s.result && s.turn === p && s.phase === "play") s.hands[p].forEach((card2, index) => {
      const targetIndices = matches(s.table, card2);
      if (targetIndices.length === 2) targetIndices.forEach((targetIndex) => actions.push(actionLabel(`${card2.month}\uC6D4 ${card2.badge.ko} \u2192 \uBC14\uB2E5 ${targetIndex + 1}\uBC88`, `Mes ${card2.month} ${card2.badge.es} \u2192 mesa ${targetIndex + 1}`, { type: "play", payload: { index, targetIndex } })));
      else actions.push(actionLabel(`${card2.month}\uC6D4 ${card2.badge.ko} \uB0B4\uAE30`, `Jugar mes ${card2.month} ${card2.badge.es}`, { type: "play", payload: { index } }));
    });
    if (!s.result && s.turn === p && s.phase === "capture-draw" && s.pending) matches(s.table, s.pending.card).forEach((targetIndex) => actions.push(actionLabel(`${s.pending.card.month}\uC6D4 \uCE74\uB4DC\uC640 \uBC14\uB2E5 ${targetIndex + 1}\uBC88 \uAC00\uC838\uC624\uAE30`, `Capturar mes ${s.pending.card.month} con mesa ${targetIndex + 1}`, { type: "capture", payload: { targetIndex } })));
    const godoriBonus = s.result && s.rulesVersion !== 2 ? 0 : MINHWATU_GODORI_BONUS;
    const scores = scoreMinhwatuMatch(s.captures, godoriBonus);
    const hand = s.hands[p].map(cloneCard);
    const table = s.table.map(cloneCard);
    const captures = { p1: s.captures.p1.map(cloneCard), p2: s.captures.p2.map(cloneCard) };
    const pending = s.pending ? { ...cloneCard(s.pending.card), source: "draw" } : null;
    return { game: "minhwatu", turn: s.turn, phase: s.phase, ownHand: hand, hand, opponentCount: s.hands[otherPlayer(p)].length, board: { table, captures, pendingCard: pending, deckCount: s.deck.length, remainingDeck: s.deck.length, scores, breakdown: minhwatuScoreBreakdown(s.captures, godoriBonus), rulesVersion: godoriBonus ? 2 : 1, actionLog: structuredClone(s.events ?? []) }, log: structuredClone(s.events ?? []), status: s.result ? "finished" : s.turn === p ? "your-turn" : "opponent-turn", result: s.result, actions };
  },
  getResult: (s) => s.result
};

// src/games/marble.ts
var marblePawnIds = ["fox", "cat", "penguin", "astronaut", "robot", "dragon"];
var pawnNames = { fox: { ko: "\uC5EC\uC6B0", es: "Zorro" }, cat: { ko: "\uACE0\uC591\uC774", es: "Gata" }, penguin: { ko: "\uD3AD\uADC4", es: "Ping\xFCino" }, astronaut: { ko: "\uC6B0\uC8FC\uBE44\uD589\uC0AC", es: "Astronauta" }, robot: { ko: "\uB85C\uBD07", es: "Robot" }, dragon: { ko: "\uC6A9", es: "Drag\xF3n" } };
var legacyBoard = [
  { kind: "start", name: { ko: "\uCD9C\uBC1C", es: "Salida" } },
  { kind: "property", name: { ko: "\uAD11\uC8FC", es: "Gwangju" }, price: 100, rent: 12, group: "green" },
  { kind: "property", name: { ko: "\uC0B0\uD1A0\uB3C4\uBC0D\uACE0", es: "Santo Domingo" }, price: 120, rent: 15, group: "green" },
  { kind: "rest", name: { ko: "\uD734\uC2DD \uAD11\uC7A5", es: "Plaza de descanso" } },
  { kind: "property", name: { ko: "\uBC14\uB78C \uC5B8\uB355", es: "Colina del viento" }, price: 140, rent: 18, group: "blue" },
  { kind: "tax", name: { ko: "\uB3C4\uC2DC\uC138", es: "Impuesto municipal" }, price: 100 },
  { kind: "property", name: { ko: "\uBCC4\uBE5B \uAC70\uB9AC", es: "Calle estelar" }, price: 160, rent: 22, group: "blue" },
  { kind: "event", name: { ko: "\uC774\uBCA4\uD2B8 \uCE74\uB4DC", es: "Carta de evento" } },
  { kind: "property", name: { ko: "\uD30C\uB3C4\uAE38", es: "Camino de las olas" }, price: 180, rent: 26, group: "yellow" },
  { kind: "property", name: { ko: "\uB4F1\uB300 \uAC70\uB9AC", es: "Calle del faro" }, price: 200, rent: 30, group: "yellow" },
  { kind: "rest", name: { ko: "\uC815\uC6D0", es: "Jard\xEDn" } },
  { kind: "property", name: { ko: "\uAD6C\uB984 \uB300\uB85C", es: "Avenida de nubes" }, price: 220, rent: 34, group: "red" },
  { kind: "property", name: { ko: "\uB2EC \uC815\uC6D0", es: "Jard\xEDn lunar" }, price: 240, rent: 38, group: "red" },
  { kind: "tax", name: { ko: "\uC218\uB9AC\uBE44", es: "Reparaci\xF3n" }, price: 80 },
  { kind: "property", name: { ko: "\uD587\uC0B4 \uAD11\uC7A5", es: "Plaza del sol" }, price: 260, rent: 42, group: "purple" },
  { kind: "event", name: { ko: "\uC774\uBCA4\uD2B8 \uCE74\uB4DC", es: "Carta de evento" } },
  { kind: "property", name: { ko: "\uC232\uAE38", es: "Camino del bosque" }, price: 280, rent: 48, group: "purple" },
  { kind: "property", name: { ko: "\uBB34\uC9C0\uAC1C \uAE38", es: "Camino del arco\xEDris" }, price: 300, rent: 55, group: "purple" }
];
var modernBoard = [
  { kind: "start", name: { ko: "\uCD9C\uBC1C", es: "Salida" } },
  { kind: "property", name: { ko: "\uAD11\uC8FC", es: "Gwangju" }, price: 100, rent: 12, group: "green" },
  { kind: "event", name: { ko: "\uD669\uAE08\uC5F4\uC1E0", es: "Llave dorada" } },
  { kind: "property", name: { ko: "\uC0B0\uD1A0\uB3C4\uBC0D\uACE0", es: "Santo Domingo" }, price: 120, rent: 15, group: "green" },
  { kind: "property", name: { ko: "\uB9C8\uB4DC\uB9AC\uB4DC", es: "Madrid" }, price: 140, rent: 18, group: "blue" },
  { kind: "property", name: { ko: "\uC0B0\uD2F0\uC544\uACE0", es: "Santiago" }, price: 160, rent: 22, group: "blue" },
  { kind: "tax", name: { ko: "\uB3C4\uC2DC\uC138", es: "Impuesto municipal" }, price: 100 },
  { kind: "event", name: { ko: "\uD669\uAE08\uC5F4\uC1E0", es: "Llave dorada" } },
  { kind: "property", name: { ko: "\uD478\uC5D0\uB974\uD1A0\uD50C\uB77C\uD0C0", es: "Puerto Plata" }, price: 180, rent: 26, group: "purple" },
  { kind: "property", name: { ko: "\uC0B0\uD6C4\uC548", es: "San Juan" }, price: 200, rent: 30, group: "purple" },
  { kind: "island", name: { ko: "\uBB34\uC778\uB3C4", es: "Isla desierta" } },
  { kind: "property", name: { ko: "\uB77C\uBCA0\uAC00", es: "La Vega" }, price: 220, rent: 34, group: "orange" },
  { kind: "event", name: { ko: "\uD669\uAE08\uC5F4\uC1E0", es: "Llave dorada" } },
  { kind: "property", name: { ko: "\uD47C\uD0C0\uCE74\uB098", es: "Punta Cana" }, price: 240, rent: 38, group: "orange" },
  { kind: "train", name: { ko: "\uC5F4\uCC28\uC5ED", es: "Estaci\xF3n de tren" } },
  { kind: "property", name: { ko: "\uB274\uC695", es: "Nueva York" }, price: 260, rent: 42, group: "red" },
  { kind: "property", name: { ko: "\uD30C\uB9AC", es: "Par\xEDs" }, price: 280, rent: 48, group: "red" },
  { kind: "property", name: { ko: "\uB3C4\uCFC4", es: "Tokio" }, price: 300, rent: 55, group: "yellow" },
  { kind: "event", name: { ko: "\uD669\uAE08\uC5F4\uC1E0", es: "Llave dorada" } },
  { kind: "property", name: { ko: "\uBC14\uB974\uC140\uB85C\uB098", es: "Barcelona" }, price: 320, rent: 60, group: "yellow" },
  { kind: "fund", name: { ko: "\uC0AC\uD68C\uBCF5\uC9C0\uAE30\uAE08", es: "Fondo social" } },
  { kind: "property", name: { ko: "\uC0AC\uB9C8\uB098", es: "Saman\xE1" }, price: 340, rent: 64, group: "teal" },
  { kind: "property", name: { ko: "\uC544\uBC14\uB098", es: "La Habana" }, price: 360, rent: 70, group: "teal" },
  { kind: "rest", name: { ko: "\uD734\uC2DD \uAD11\uC7A5", es: "Plaza de descanso" } },
  { kind: "property", name: { ko: "\uBA55\uC2DC\uCF54\uC2DC\uD2F0", es: "Ciudad de M\xE9xico" }, price: 380, rent: 75, group: "dark" },
  { kind: "property", name: { ko: "\uB9AC\uC2A4\uBCF8", es: "Lisboa" }, price: 400, rent: 80, group: "dark" },
  { kind: "train", name: { ko: "\uC5F4\uCC28\uC5ED", es: "Estaci\xF3n de tren" } },
  { kind: "event", name: { ko: "\uD669\uAE08\uC5F4\uC1E0", es: "Llave dorada" } },
  { kind: "property", name: { ko: "\uB7F0\uB358", es: "Londres" }, price: 420, rent: 84, group: "pink" },
  { kind: "property", name: { ko: "\uB85C\uB9C8", es: "Roma" }, price: 440, rent: 88, group: "pink" },
  { kind: "train", name: { ko: "\uC138\uACC4 \uC5EC\uD589", es: "Viaje mundial" } },
  { kind: "property", name: { ko: "\uB9C8\uC774\uC560\uBBF8", es: "Miami" }, price: 460, rent: 92, group: "brown" },
  { kind: "property", name: { ko: "\uBC1C\uD30C\uB77C\uC774\uC18C", es: "Valpara\xEDso" }, price: 480, rent: 96, group: "brown" },
  { kind: "property", name: { ko: "\uC138\uBD80", es: "Ceb\xFA" }, price: 500, rent: 100, group: "gold" },
  { kind: "event", name: { ko: "\uD669\uAE08\uC5F4\uC1E0", es: "Llave dorada" } },
  { kind: "property", name: { ko: "\uD1A0\uB860\uD1A0", es: "Toronto" }, price: 520, rent: 104, group: "gold" },
  { kind: "property", name: { ko: "\uC624\uD074\uB79C\uB4DC", es: "Auckland" }, price: 540, rent: 108, group: "silver" },
  { kind: "fund-deposit", name: { ko: "\uAE30\uAE08 \uB0A9\uBD80", es: "Aporte al fondo" }, price: 150 },
  { kind: "property", name: { ko: "\uBC34\uCFE0\uBC84", es: "Vancouver" }, price: 560, rent: 112, group: "silver" },
  { kind: "rest", name: { ko: "\uD734\uC2DD \uAD11\uC7A5", es: "Plaza de descanso" } }
];
var boardFor = (s) => s.boardVersion === 2 ? modernBoard : legacyBoard;
var legacyIds = ["festival", "lottery", "rent-rebate", "travel-cost", "maintenance", "visit-santo-domingo", "advance-start", "retreat"];
var modernIds = [...legacyIds, "go-to-island", "escape-pass", "train-ticket", "city-dividend"];
var cards = {
  festival: { title: { ko: "\uB3D9\uB124 \uCD95\uC81C", es: "Fiesta del barrio" }, text: { ko: "\uCD95\uC81C \uC900\uBE44\uB97C \uB3C4\uC640 150\uC744 \uBC1B\uC2B5\uB2C8\uB2E4.", es: "Ayudas con la fiesta del barrio y recibes 150." }, effect: "cash" },
  lottery: { title: { ko: "\uC791\uC740 \uBCF5\uAD8C \uB2F9\uCCA8", es: "Premio de loter\xEDa" }, text: { ko: "\uBCF5\uAD8C\uC5D0 \uB2F9\uCCA8\uB418\uC5B4 200\uC744 \uBC1B\uC2B5\uB2C8\uB2E4.", es: "Te ganas un premio de loter\xEDa y recibes 200." }, effect: "cash" },
  "rent-rebate": { title: { ko: "\uC784\uB300\uB8CC \uD658\uAE09", es: "Reembolso de alquiler" }, text: { ko: "\uC784\uB300\uB8CC \uC77C\uBD80\uB97C \uB3CC\uB824\uBC1B\uC544 80\uC744 \uBC1B\uC2B5\uB2C8\uB2E4.", es: "Te devuelven parte del alquiler: recibes 80." }, effect: "cash" },
  "travel-cost": { title: { ko: "\uC5EC\uD589 \uACBD\uBE44", es: "Gastos de viaje" }, text: { ko: "\uC5EC\uD589 \uACBD\uBE44\uB85C 100\uC744 \uB0C5\uB2C8\uB2E4.", es: "Pagas 100 por gastos de viaje." }, effect: "cash" },
  maintenance: { title: { ko: "\uAC74\uBB3C \uC218\uB9AC", es: "Mantenimiento de edificios" }, text: { ko: "\uB0B4 \uB3C4\uC2DC\uC758 \uAC74\uC124 \uB2E8\uACC4 \uD569\uACC4\uC5D0 40\uC744 \uACF1\uD55C \uC218\uB9AC\uBE44\uB97C \uB0C5\uB2C8\uB2E4. \uBCC4\uC7A5\uC740 1\uB2E8\uACC4, \uBE4C\uB529\uC740 2\uB2E8\uACC4, \uB79C\uB4DC\uB9C8\uD06C\uB294 3\uB2E8\uACC4\uC785\uB2C8\uB2E4.", es: "Pagas 40 por cada nivel construido en tus ciudades: villa cuenta 1, edificio 2 y monumento 3." }, effect: "maintenance" },
  "visit-santo-domingo": { title: { ko: "\uC0B0\uD1A0\uB3C4\uBC0D\uACE0 \uBC29\uBB38", es: "Visita a Santo Domingo" }, text: { ko: "\uC0B0\uD1A0\uB3C4\uBC0D\uACE0\uB85C \uC774\uB3D9\uD574 \uADF8\uACF3\uC758 \uBD80\uB3D9\uC0B0 \uADDC\uCE59\uC744 \uC801\uC6A9\uD569\uB2C8\uB2E4.", es: "Ve a Santo Domingo y aplica las reglas normales de esa propiedad." }, effect: "visit" },
  "advance-start": { title: { ko: "\uCD9C\uBC1C\uC810\uC73C\uB85C \uC774\uB3D9", es: "Ve a Salida" }, text: { ko: "\uCD9C\uBC1C\uC810\uC73C\uB85C \uC774\uB3D9\uD558\uACE0 200\uC744 \uBC1B\uC2B5\uB2C8\uB2E4.", es: "Ve a Salida y recibe 200." }, effect: "move" },
  retreat: { title: { ko: "\uC138 \uCE78 \uB4A4\uB85C", es: "Retrocede tres casillas" }, text: { ko: "\uC138 \uCE78 \uB4A4\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4. \uCD9C\uBC1C \uBCF4\uB108\uC2A4\uB294 \uBC1B\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", es: "Retrocede tres casillas. No cobras al pasar por Salida." }, effect: "move" },
  "go-to-island": { title: { ko: "\uBB34\uC778\uB3C4\uB85C \uC774\uB3D9", es: "Ve a la isla desierta" }, text: { ko: "\uBB34\uC778\uB3C4\uB85C \uAC11\uB2C8\uB2E4. \uB2E4\uC74C \uC138 \uBC88\uC758 \uCC28\uB840\uB97C \uC27D\uB2C8\uB2E4.", es: "Ve a la isla desierta y pierde tus pr\xF3ximos tres turnos." }, effect: "island" },
  "escape-pass": { title: { ko: "\uD0C8\uCD9C\uAD8C", es: "Pase de salida" }, text: { ko: "\uBB34\uC778\uB3C4\uC5D0\uC11C \uB098\uC62C \uB54C \uC4F8 \uD0C8\uCD9C\uAD8C\uC744 \uBC1B\uC2B5\uB2C8\uB2E4.", es: "Recibes un pase para salir de la isla." }, effect: "pass" },
  "train-ticket": { title: { ko: "\uBB34\uB8CC \uC5F4\uCC28\uD45C", es: "Boleto de tren gratis" }, text: { ko: "\uC6B4\uC784 \uC5C6\uC774 \uBD80\uB3D9\uC0B0 \uD55C \uACF3\uC73C\uB85C \uC774\uB3D9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", es: "Puedes viajar a una propiedad sin pagar el pasaje." }, effect: "train" },
  "city-dividend": { title: { ko: "\uB3C4\uC2DC \uBC30\uB2F9\uAE08", es: "Dividendo de la ciudad" }, text: { ko: "\uC18C\uC720\uD55C \uBD80\uB3D9\uC0B0\uB9C8\uB2E4 30\uC744 \uBC1B\uC2B5\uB2C8\uB2E4.", es: "Recibes 30 por cada propiedad que tengas." }, effect: "cash" },
  "monopoly-warning": { title: { ko: "\uB3C5\uC810 \uACBD\uACE0", es: "Advertencia de monopolio" }, text: { ko: "\uC644\uC131\uD55C \uC0C9\uC0C1 \uB3C4\uC2DC\uAD70\uC774 \uAC00\uC7A5 \uB9CE\uC740 \uC0AC\uB78C\uC5D0\uAC8C \uB3C4\uC2DC\uAD70\uB2F9 100, \uCD5C\uB300 300\uC758 \uB3C5\uC810 \uBD80\uB2F4\uAE08\uC744 \uBD80\uACFC\uD569\uB2C8\uB2E4. \uB3D9\uB960\uC774\uBA74 \uCE74\uB4DC\uB97C \uBF51\uC740 \uC0AC\uB78C, \uC644\uC131\uD55C \uB3C4\uC2DC\uAD70\uC774 \uC5C6\uC73C\uBA74 \uBD80\uB2F4\uAE08\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", es: "Quien tenga m\xE1s grupos de color completos paga 100 por grupo, hasta 300. En empate paga quien sac\xF3 la carta; si nadie complet\xF3 un grupo, no se cobra." }, effect: "cash" }
};
var propertyRent = (tile, record, modern) => (tile.rent ?? 0) * (modern ? [1, 2, 4, 8][record.houses] ?? 1 : record.houses + 1);
var assetsFor = (s, p, board) => s.money[p] - (s.debt?.[p] ?? 0) + Object.entries(s.properties).reduce((sum2, [index, record]) => record.owner === p ? sum2 + (board[Number(index)]?.price ?? 0) + record.houses * 100 : sum2, 0);
var completedGroups = (s, p) => {
  const board = boardFor(s);
  return [...new Set(board.filter((t) => t.kind === "property").map((t) => t.group))].filter((group) => board.every((t, index) => t.kind !== "property" || t.group !== group || s.properties[String(index)]?.owner === p));
};
function emit(s, type, actor, ko, es, textKo, textEs, extra = {}) {
  const sequence = (s.actionSequence ?? 0) + 1;
  s.actionSequence = sequence;
  s.actionLog = [...s.actionLog ?? [], { sequence, type, actor, title: { ko, es }, text: { ko: textKo, es: textEs }, ...extra }].slice(-40);
}
var propIndices = (board) => board.flatMap((tile, index) => tile.kind === "property" ? [index] : []);
function view2(s, p) {
  const board = boardFor(s);
  const actions = [];
  const add = (ko, es, action) => actions.push({ label: { ko, es }, action });
  if (!s.result && s.active === p) {
    if (s.economicVersion === 1) {
      const debt = s.debt?.[p] ?? 0;
      if (debt === 0 && (s.phase !== "debt" || s.money[p] + 300 >= (s.pendingPayment?.amount ?? Infinity))) add("\uB300\uCD9C \uBC1B\uAE30 \xB7 300 / \uC0C1\uD658 330", "Pedir pr\xE9stamo \xB7 300 / devolver 330", { type: "borrow" });
      if (debt > 0 && s.money[p] >= debt && s.phase !== "debt") add(`\uB300\uCD9C \uC0C1\uD658 \xB7 ${debt}`, `Pagar pr\xE9stamo \xB7 ${debt}`, { type: "repay" });
      if (s.phase === "debt") add("\uD30C\uC0B0 \uC778\uC815 \xB7 \uACBD\uAE30 \uC885\uB8CC", "Declarar quiebra \xB7 terminar partida", { type: "declare-bankruptcy" });
      if (s.phase === "roll" && !s.pawnLocked?.[p]) {
        for (const pawn of marblePawnIds) if (pawn !== s.pawns?.[otherPlayer(p)]) add(`\uB9D0 \uC120\uD0DD \xB7 ${pawnNames[pawn].ko}`, `Elegir figura \xB7 ${pawnNames[pawn].es}`, { type: "choose-pawn", payload: { pawn } });
      }
    }
    if (s.phase === "roll") add("\uC8FC\uC0AC\uC704 \uAD74\uB9AC\uAE30", "Lanzar dados", { type: "roll" });
    if (s.phase === "island") {
      add("\uC30D\uC774 \uB098\uC624\uB294\uC9C0 \uAD74\uB9AC\uAE30", "Intentar sacar dobles", { type: "attempt-doubles" });
      if (s.money[p] >= 100) add("100\uC744 \uB0B4\uACE0 \uD0C8\uCD9C", "Pagar 100 para salir", { type: "pay-escape" });
      if ((s.escapePasses?.[p] ?? 0) > 0) add("\uD0C8\uCD9C\uAD8C \uC0AC\uC6A9", "Usar pase de salida", { type: "use-escape-pass" });
    }
    if (s.phase === "train-decision") {
      const fare = s.pendingTrainFare ?? 100;
      for (const index of propIndices(board)) if (s.money[p] >= fare) {
        const name = board[index].name;
        add(`\uC5F4\uCC28: ${name.ko} (${fare})`, `Tren: ${name.es} (${fare})`, { type: "choose-train", payload: { destination: index } });
      }
      add(s.pendingTrainSource === "card" ? "\uC5F4\uCC28\uB97C \uAC74\uB108\uB6F0\uACE0 \uCC28\uB840 \uB9C8\uCE58\uAE30" : "\uC5F4\uCC28\uB97C \uAC74\uB108\uB6F0\uACE0 \uC8FC\uC0AC\uC704 \uAD74\uB9AC\uAE30", s.pendingTrainSource === "card" ? "Pasar el tren y terminar turno" : "Pasar el tren y lanzar dados", { type: "skip-train" });
    }
    if (s.phase === "decision" && s.pendingTile !== null) {
      const tile = board[s.pendingTile];
      if (tile?.kind === "property" && !s.properties[String(s.pendingTile)] && s.money[p] >= (tile.price ?? Infinity)) add(`\uAD6C\uB9E4 (${tile.price})`, `Comprar (${tile.price})`, { type: "buy" });
      add("\uAD6C\uB9E4 \uAC70\uC808 / \uACC4\uC18D", "Pasar / continuar", { type: "decline" });
    }
    if (s.phase === "main") {
      for (const [indexText, record] of Object.entries(s.properties)) {
        const index = Number(indexText), tile = board[index];
        if (record.owner !== p || tile?.kind !== "property") continue;
        const groupSize = board.filter((space) => space.kind === "property" && space.group === tile.group).length;
        const ownedCount = Object.entries(s.properties).filter(([ownedIndex, owned]) => owned.owner === p && board[Number(ownedIndex)]?.group === tile.group).length;
        const canBuild = s.boardVersion === 2 || ownedCount === groupSize;
        const levels = s.boardVersion === 2 ? 3 : 2;
        if (canBuild && record.houses < levels && s.money[p] >= 100) {
          const tier = s.boardVersion === 2 ? [["\uBCC4\uC7A5", "Villa"], ["\uBE4C\uB529", "Edificio"], s.economicVersion === 1 ? ["\uB79C\uB4DC\uB9C8\uD06C", "Monumento"] : ["\uD638\uD154", "Hotel"]][record.houses] : ["\uC9D1", "Casa"];
          add(`${tier[0]}: ${tile.name.ko} (100)`, `${tier[1]}: ${tile.name.es} (100)`, { type: "build", payload: { tile: index } });
        }
      }
      add("\uCC28\uB840 \uB9C8\uCE58\uAE30", "Terminar turno", { type: "endTurn" });
    }
  }
  return {
    turn: s.active,
    phase: s.result ? "finished" : s.phase,
    board: {
      version: s.boardVersion ?? 1,
      tiles: board.map((tile, index) => ({ ...tile, name: { ...tile.name }, index, owner: s.properties[String(index)]?.owner ?? null, houses: s.properties[String(index)]?.houses ?? 0 })),
      positions: { ...s.positions },
      money: { ...s.money },
      assets: { p1: assetsFor(s, "p1", board), p2: assetsFor(s, "p2", board) },
      lastRoll: [...s.lastRoll],
      diceSequence: s.diceSequence ?? 0,
      turn: s.active,
      turns: s.turns,
      islandTurns: { p1: s.islandTurns?.p1 ?? 0, p2: s.islandTurns?.p2 ?? 0 },
      escapePasses: { p1: s.escapePasses?.p1 ?? 0, p2: s.escapePasses?.p2 ?? 0 },
      fundPool: s.fundPool ?? 0,
      trainReady: { p1: s.trainReady?.p1 ?? false, p2: s.trainReady?.p2 ?? false },
      pendingTrainFare: s.phase === "train-decision" ? s.pendingTrainFare ?? 100 : null,
      lastEvent: s.lastEvent ? { ...s.lastEvent, title: { ...s.lastEvent.title }, text: { ...s.lastEvent.text } } : null,
      lastMove: s.lastMove ? { ...s.lastMove } : null,
      economicVersion: s.economicVersion ?? 0,
      debt: { p1: s.debt?.p1 ?? 0, p2: s.debt?.p2 ?? 0 },
      pendingPayment: s.pendingPayment ? { ...s.pendingPayment, reason: { ...s.pendingPayment.reason } } : null,
      monopolies: { p1: completedGroups(s, "p1"), p2: completedGroups(s, "p2") },
      pawns: { p1: s.pawns?.p1 ?? "fox", p2: s.pawns?.p2 ?? "cat" },
      pawnLocked: { p1: s.pawnLocked?.p1 ?? true, p2: s.pawnLocked?.p2 ?? true },
      actionSequence: s.actionSequence ?? 0,
      actionLog: (s.actionLog ?? []).map((event2) => ({ ...event2, title: { ...event2.title }, text: { ...event2.text }, ...event2.moneyDelta ? { moneyDelta: { ...event2.moneyDelta } } : {} }))
    },
    ownHand: { money: s.money[p], assets: assetsFor(s, p, board), position: s.positions[p] },
    opponentCount: 1,
    status: s.result ? "finished" : s.active === p ? "Your turn" : "Opponent turn",
    result: s.result ? { ...s.result, scores: s.result.scores ? { ...s.result.scores } : void 0 } : null,
    actions
  };
}
function validation(s, p, a) {
  const board = boardFor(s);
  if (p !== "p1" && p !== "p2") return "Invalid player";
  if (!a || typeof a.type !== "string") return "Invalid action";
  if (s.result) return "Game is finished";
  if (p !== s.active) return "Not your turn";
  if (["borrow", "repay", "declare-bankruptcy", "choose-pawn"].includes(a.type)) {
    if (s.economicVersion !== 1) return "Credit and figure selection unavailable in this saved ruleset";
    if (s.phase === "finished") return "Game is finished";
    if (a.type === "borrow") return (s.debt?.[p] ?? 0) !== 0 ? "Repay the existing loan first" : a.payload?.amount !== void 0 ? "Loan amount is fixed" : s.phase === "debt" && s.money[p] + 300 < (s.pendingPayment?.amount ?? Infinity) ? "Loan cannot cover this payment" : null;
    if (a.type === "repay") return a.payload?.amount !== void 0 ? "Repayment amount is fixed" : s.phase === "debt" || !s.debt?.[p] || s.money[p] < s.debt[p] ? "Cannot repay now" : null;
    if (a.type === "declare-bankruptcy") return s.phase === "debt" && s.pendingPayment ? null : "No compulsory payment pending";
    const pawn = a.payload?.pawn;
    return s.phase !== "roll" || s.pawnLocked?.[p] ? "Figure is locked after your first roll" : !marblePawnIds.includes(pawn) || pawn === s.pawns?.[otherPlayer(p)] ? "Invalid or occupied figure" : null;
  }
  if (s.phase === "debt") return "Resolve the compulsory payment first";
  if (a.type === "roll") return s.phase === "roll" ? null : "Cannot roll now";
  if (a.type === "attempt-doubles") return s.phase === "island" ? null : "Not on the island";
  if (a.type === "pay-escape") return s.phase !== "island" ? "Not on the island" : s.money[p] < 100 ? "Insufficient funds" : null;
  if (a.type === "use-escape-pass") return s.phase !== "island" ? "Not on the island" : (s.escapePasses?.[p] ?? 0) < 1 ? "No escape pass" : null;
  if (a.type === "choose-train") {
    if (s.phase !== "train-decision") return "No train decision";
    const destination = a.payload?.destination;
    if (!Number.isInteger(destination) || board[destination]?.kind !== "property") return "Invalid destination";
    if (s.money[p] < (s.pendingTrainFare ?? 100)) return "Insufficient funds";
    return null;
  }
  if (a.type === "skip-train") return s.phase === "train-decision" ? null : "No train decision";
  if (a.type === "buy" || a.type === "decline") {
    if (s.phase !== "decision" || !Number.isInteger(s.pendingTile) || s.pendingTile !== s.positions[p]) return "No purchase decision";
    const tile = board[s.pendingTile];
    if (tile.kind !== "property" || s.properties[String(s.pendingTile)]) return "No property to decide";
    if (a.type === "buy" && s.money[p] < (tile.price ?? Infinity)) return "Insufficient funds";
    return null;
  }
  if (a.type === "build") {
    const index = a.payload?.tile;
    if (s.phase !== "main" || !Number.isInteger(index) || index < 0 || index >= board.length || board[index]?.kind !== "property" || !s.properties[String(index)] || s.properties[String(index)].owner !== p) return "Invalid property";
    const tile = board[index];
    const groupSize = board.filter((space) => space.kind === "property" && space.group === tile.group).length;
    const ownedCount = Object.entries(s.properties).filter(([ownedIndex, owned]) => owned.owner === p && board[Number(ownedIndex)]?.group === tile.group).length;
    const canBuild = s.boardVersion === 2 ? s.properties[String(index)].houses < 3 : ownedCount === groupSize && s.properties[String(index)].houses < 2;
    if (!canBuild || s.money[p] < 100) return "Cannot build here";
    return null;
  }
  if (a.type === "endTurn") return s.phase === "main" ? null : "Cannot end turn now";
  return "Unknown action";
}
function bankrupt(s, loser, winner) {
  const board = boardFor(s), value = (p) => s.boardVersion === 2 ? assetsFor(s, p, board) : s.money[p];
  emit(s, "bankruptcy", loser, "\uD30C\uC0B0", "Quiebra", "\uC9C0\uAE09 \uC758\uBB34\uB97C \uD574\uACB0\uD558\uC9C0 \uBABB\uD574 \uACBD\uAE30\uAC00 \uB05D\uB0AC\uC2B5\uB2C8\uB2E4.", "La partida termina porque no se pudo cubrir el pago obligatorio.");
  emit(s, "win", winner, "\uC2B9\uB9AC", "Victoria", "\uC0C1\uB300\uC758 \uD30C\uC0B0\uC73C\uB85C \uC2B9\uB9AC\uD588\uC2B5\uB2C8\uB2E4.", "Ganaste por la quiebra de la otra persona.");
  return { ...s, phase: "finished", pendingPayment: null, result: { winner, reason: "insolvent / insolvente", scores: { p1: value("p1"), p2: value("p2") } } };
}
function pay(s, p, amount, creditor = "bank", reason = { ko: "\uBE44\uC6A9 \uC9C0\uAE09", es: "Pago de gastos" }, type = "tax") {
  if (s.money[p] < amount) {
    if (s.economicVersion !== 1) return bankrupt(s, p, otherPlayer(p));
    s.pendingPayment = { amount, creditor, reason, type, tile: s.positions[p], resumePhase: "main", resumeActive: s.active };
    s.active = p;
    s.phase = "debt";
    emit(s, "crisis", p, "\uD30C\uC0B0 \uC704\uAE30", "Riesgo de quiebra", `${reason.ko}: ${amount} \uC9C0\uAE09\uC5D0 ${amount - s.money[p]}\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. \uB300\uCD9C \uC870\uAC74\uC744 \uD655\uC778\uD558\uAC70\uB098 \uD30C\uC0B0\uC744 \uC778\uC815\uD558\uC138\uC694.`, `${reason.es}: te faltan ${amount - s.money[p]} para pagar ${amount}. Revisa el pr\xE9stamo o declara la quiebra.`, { amount, fromPlayer: p, ...creditor === "p1" || creditor === "p2" ? { toPlayer: creditor } : {} });
    return s;
  }
  s.money[p] -= amount;
  if (creditor === "fund") s.fundPool = (s.fundPool ?? 0) + amount;
  else if (creditor === "p1" || creditor === "p2") s.money[creditor] += amount;
  emit(s, type, p, reason.ko, reason.es, `${amount}\uC744 \uC9C0\uAE09\uD588\uC2B5\uB2C8\uB2E4.`, `Pagaste ${amount}.`, { amount, fromPlayer: p, ...creditor === "p1" || creditor === "p2" ? { toPlayer: creditor } : {}, moneyDelta: { [p]: -amount, ...creditor === "p1" || creditor === "p2" ? { [creditor]: amount } : {} }, tile: s.positions[p] });
  return s;
}
function bonus(s, p, amount, ko, es) {
  s.money[p] += amount;
  emit(s, "bonus", p, ko, es, `${amount}\uC744 \uBC1B\uC558\uC2B5\uB2C8\uB2E4.`, `Recibiste ${amount}.`, { amount, toPlayer: p, moneyDelta: { [p]: amount } });
}
function moveForward(s, p, to, board) {
  const from = s.positions[p];
  if (to < from) bonus(s, p, 200, "\uCD9C\uBC1C \uBCF4\uB108\uC2A4", "Bono de Salida");
  s.positions[p] = to;
}
function resolveLanding(s, p, index, drawEvent) {
  const board = boardFor(s), tile = board[index];
  s.pendingTile = index;
  emit(s, "arrival", p, `${tile.name.ko} \uB3C4\uCC29`, `Llegaste a ${tile.name.es}`, `${tile.name.ko} \uCE78\uC758 \uD6A8\uACFC\uB97C \uD655\uC778\uD558\uC138\uC694.`, `Revisa el efecto de ${tile.name.es}.`, { tile: index });
  if (tile.kind === "property") {
    const owner = s.properties[String(index)];
    if (!owner) {
      s.phase = "decision";
      return s;
    }
    if (owner.owner !== p) {
      const rent = propertyRent(tile, owner, s.boardVersion === 2);
      s = pay(s, p, rent, owner.owner, { ko: `${tile.name.ko} \uD1B5\uD589\uB8CC`, es: `Alquiler en ${tile.name.es}` }, "rent");
    }
  } else if (tile.kind === "tax") s = pay(s, p, tile.price ?? 0, "bank", tile.name);
  else if (tile.kind === "fund") {
    bonus(s, p, s.fundPool ?? 0, "\uACF5\uB3D9 \uAE30\uAE08 \uC218\uB839", "Cobro del fondo com\xFAn");
    s.fundPool = 0;
  } else if (tile.kind === "fund-deposit") {
    const amount = tile.price ?? 150;
    s = pay(s, p, amount, "fund", tile.name);
  } else if (tile.kind === "island") {
    s.islandTurns ??= { p1: 0, p2: 0 };
    s.islandTurns[p] = 3;
    emit(s, "island", p, "\uBB34\uC778\uB3C4\uC5D0 \uBA38\uBB3C\uB7EC\uC694", "Estancia en la isla", "\uB2E4\uC74C \uC790\uAE30 \uCC28\uB840\uC5D0 \uD0C8\uCD9C \uBC29\uBC95\uC744 \uC120\uD0DD\uD569\uB2C8\uB2E4.", "En tu pr\xF3ximo turno podr\xE1s elegir c\xF3mo salir.", { tile: index });
  } else if (tile.kind === "train") {
    s.trainReady ??= { p1: false, p2: false };
    s.trainReady[p] = true;
    emit(s, "train", p, "\uC5F4\uCC28 \uD0D1\uC2B9 \uC900\uBE44", "Tren disponible", "\uB2E4\uC74C \uC790\uAE30 \uCC28\uB840\uC5D0 \uBAA9\uC801\uC9C0\uB97C \uACE0\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.", "Podr\xE1s elegir un destino en tu pr\xF3ximo turno.", { tile: index });
  } else if (tile.kind === "rest") emit(s, "rest", p, "\uC7A0\uAE50 \uC26C\uC5B4\uAC00\uC694", "Un descanso", "\uC774 \uCE78\uC5D0\uC11C\uB294 \uCD94\uAC00 \uBE44\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "Esta casilla no tiene un costo adicional.", { tile: index });
  else if (tile.kind === "event" && drawEvent) return resolveEvent(s, p);
  if (!s.result && s.phase !== "debt") s.phase = "main";
  return s;
}
function noteMove(s, p, from, to, steps, source) {
  const sequence = (s.moveSequence ?? 0) + 1;
  s.moveSequence = sequence;
  s.lastMove = { sequence, playerId: p, from, to, steps, source };
  emit(s, "move", p, "\uB9D0 \uC774\uB3D9", "Movimiento", `${from + 1}\uBC88\uC5D0\uC11C ${to + 1}\uBC88 \uCE78\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.`, `Avanzas de la casilla ${from + 1} a la ${to + 1}.`, { from, to, steps: steps ?? void 0 });
}
function resolveEvent(s, p) {
  const board = boardFor(s), isModern = s.boardVersion === 2, ids = isModern ? s.economicVersion === 1 ? [...modernIds, "monopoly-warning"] : modernIds : legacyIds;
  s.phase = "main";
  let deck = s.eventDeck ? [...s.eventDeck] : [];
  if (!deck.length) {
    const rng = s.eventRng ?? (s.rng ^ 2779096485) >>> 0;
    deck = shuffle([...ids], seededRandom(rng));
    s.eventRng = rng + (ids.length - 1) * 1831565813 >>> 0;
  }
  const id = deck.shift();
  if (isModern && id !== "escape-pass") deck.push(id);
  s.eventDeck = deck;
  let card2 = cards[id];
  const from = s.positions[p], beforeCash = s.money[p];
  emit(s, "event-card", p, card2.title.ko, card2.title.es, card2.text.ko, card2.text.es, { cardId: id, tile: from });
  let movement = null, steps = null;
  if (id === "festival") bonus(s, p, 150, card2.title.ko, card2.title.es);
  else if (id === "lottery") bonus(s, p, 200, card2.title.ko, card2.title.es);
  else if (id === "rent-rebate") bonus(s, p, 80, card2.title.ko, card2.title.es);
  else if (id === "travel-cost") s = pay(s, p, 100, "bank", card2.title);
  else if (id === "maintenance") {
    const houses = Object.values(s.properties).filter((property) => property.owner === p).reduce((count2, property) => count2 + property.houses, 0);
    s = pay(s, p, houses * 40, "bank", card2.title);
  } else if (id === "visit-santo-domingo") {
    const destination = isModern ? 3 : 2;
    movement = "visit";
    steps = (destination - from + board.length) % board.length;
    moveForward(s, p, destination, board);
    noteMove(s, p, from, destination, steps, "card");
    s = resolveLanding(s, p, destination, false);
  } else if (id === "advance-start") {
    movement = "move";
    steps = (board.length - from) % board.length;
    s.positions[p] = 0;
    noteMove(s, p, from, 0, steps, "card");
    bonus(s, p, 200, card2.title.ko, card2.title.es);
    s.pendingTile = 0;
  } else if (id === "retreat") {
    movement = "move";
    steps = -3;
    const to = (from - 3 + board.length) % board.length;
    s.positions[p] = to;
    noteMove(s, p, from, to, steps, "card");
    s = resolveLanding(s, p, to, false);
  } else if (id === "go-to-island") {
    const to = isModern ? 10 : from;
    movement = "move";
    steps = isModern ? (to - from + board.length) % board.length : 0;
    if (isModern) s.positions[p] = to;
    s.islandTurns ??= { p1: 0, p2: 0 };
    s.islandTurns[p] = 3;
    s.pendingTile = to;
    noteMove(s, p, from, to, steps, "card");
    emit(s, "island", p, card2.title.ko, card2.title.es, card2.text.ko, card2.text.es, { tile: to, cardId: id });
  } else if (id === "escape-pass") {
    s.escapePasses ??= { p1: 0, p2: 0 };
    s.escapePasses[p]++;
    emit(s, "escape", p, "\uD0C8\uCD9C\uAD8C \uD68D\uB4DD", "Pase de salida recibido", card2.text.ko, card2.text.es, { cardId: id });
  } else if (id === "train-ticket") {
    s.pendingTrainFare = 0;
    s.pendingTrainSource = "card";
    s.phase = "train-decision";
    emit(s, "train", p, card2.title.ko, card2.title.es, card2.text.ko, card2.text.es, { amount: 0, cardId: id });
  } else if (id === "city-dividend") {
    bonus(s, p, 30 * Object.values(s.properties).filter((property) => property.owner === p).length, card2.title.ko, card2.title.es);
  } else if (id === "monopoly-warning") {
    const groups = { p1: completedGroups(s, "p1"), p2: completedGroups(s, "p2") };
    const target = groups.p1.length === groups.p2.length ? p : groups.p1.length > groups.p2.length ? "p1" : "p2";
    const count2 = groups[target].length, amount = Math.min(300, count2 * 100);
    const text = { ko: count2 ? `${target === p ? "\uCE74\uB4DC\uB97C \uBF51\uC740 \uC0AC\uB78C" : "\uC0C1\uB300"}\uC758 \uC644\uC131 \uB3C4\uC2DC\uAD70 ${count2}\uAC1C: \uB3C5\uC810 \uBD80\uB2F4\uAE08 ${amount}\uC744 \uC740\uD589\uC5D0 \uB0C5\uB2C8\uB2E4.` : "\uC644\uC131\uD55C \uC0C9\uC0C1 \uB3C4\uC2DC\uAD70\uC774 \uC5C6\uC5B4 \uBD80\uB2F4\uAE08\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", es: count2 ? `${target === p ? "Quien sac\xF3 la carta" : "La otra persona"} tiene ${count2} grupos completos y paga ${amount} al banco.` : "Nadie tiene un grupo de color completo. No se cobra." };
    card2 = { ...card2, text };
    emit(s, "monopoly-warning", target, card2.title.ko, card2.title.es, text.ko, text.es, { amount, cardId: id, group: groups[target].join(", ") });
    if (amount) s = pay(s, target, amount, "bank", card2.title, "monopoly-warning");
  }
  const sequence = (s.eventSequence ?? 0) + 1;
  s.eventSequence = sequence;
  s.lastEvent = {
    id,
    sequence,
    playerId: p,
    ...card2,
    cashDelta: s.money[p] - beforeCash,
    from: movement ? from : null,
    to: movement ? s.positions[p] : null,
    steps
  };
  return s;
}
function finishTurn2(s, p) {
  s.active = otherPlayer(p);
  s.phase = "roll";
  s.pendingTile = null;
  s.turns++;
  if (s.turns >= 120) {
    const modern = s.boardVersion === 2, board = boardFor(s);
    const p1 = modern ? assetsFor(s, "p1", board) : s.money.p1, p2 = modern ? assetsFor(s, "p2", board) : s.money.p2;
    const reason = modern ? "asset turn limit / l\xEDmite por patrimonio" : "turn limit / l\xEDmite de turnos";
    s.result = p1 === p2 ? { winner: "draw", reason, scores: { p1, p2 } } : { winner: p1 > p2 ? "p1" : "p2", reason, scores: { p1, p2 } };
    s.phase = "finished";
    emit(s, "win", s.result.winner === "draw" ? p : s.result.winner, "\uC790\uC0B0 \uACB0\uC0B0", "Balance final", "120\uD134\uC744 \uB9C8\uCCD0 \uB300\uCD9C\uC744 \uBE80 \uC21C\uC790\uC0B0\uC73C\uB85C \uACB0\uACFC\uB97C \uC815\uD588\uC2B5\uB2C8\uB2E4.", "Tras 120 turnos, el resultado se decide por el patrimonio neto, descontando las deudas.");
    return s;
  }
  if ((s.islandTurns?.[s.active] ?? 0) > 0) s.phase = "island";
  else if (s.trainReady?.[s.active]) {
    s.phase = "train-decision";
    s.pendingTrainFare = 100;
    s.pendingTrainSource = "station";
  }
  emit(s, "turn", s.active, "\uB2E4\uC74C \uCC28\uB840", "Siguiente turno", "\uD604\uC7AC \uD50C\uB808\uC774\uC5B4\uC640 \uD589\uB3D9 \uB2E8\uACC4\uB97C \uD655\uC778\uD558\uC138\uC694.", "Revisa qui\xE9n juega y la siguiente acci\xF3n.");
  return s;
}
function step(s, p, a) {
  const error = validation(s, p, a);
  if (error) throw new Error(error);
  let n = {
    ...s,
    money: { ...s.money },
    positions: { ...s.positions },
    properties: { ...s.properties },
    lastRoll: [...s.lastRoll],
    eventDeck: s.eventDeck ? [...s.eventDeck] : void 0,
    islandTurns: s.islandTurns ? { ...s.islandTurns } : void 0,
    escapePasses: s.escapePasses ? { ...s.escapePasses } : void 0,
    trainReady: s.trainReady ? { ...s.trainReady } : void 0,
    lastEvent: s.lastEvent ? { ...s.lastEvent, title: { ...s.lastEvent.title }, text: { ...s.lastEvent.text } } : s.lastEvent,
    lastMove: s.lastMove ? { ...s.lastMove } : s.lastMove
  };
  n.debt = { p1: s.debt?.p1 ?? 0, p2: s.debt?.p2 ?? 0 };
  n.pawns = { p1: s.pawns?.p1 ?? "fox", p2: s.pawns?.p2 ?? "cat" };
  n.pawnLocked = { p1: s.pawnLocked?.p1 ?? true, p2: s.pawnLocked?.p2 ?? true };
  n.pendingPayment = s.pendingPayment ? { ...s.pendingPayment, reason: { ...s.pendingPayment.reason } } : null;
  const board = boardFor(n), payload = a.payload ?? {};
  if (a.type === "choose-pawn") {
    n.pawns[p] = payload.pawn;
    emit(n, "pawn", p, "\uB9D0 \uC120\uD0DD", "Figura elegida", "\uC774 \uB9D0\uB85C \uB3C4\uC2DC\uB97C \uC5EC\uD589\uD569\uB2C8\uB2E4.", "Viajar\xE1s por las ciudades con esta figura.");
    return n;
  }
  if (a.type === "borrow") {
    n.money[p] += 300;
    n.debt[p] = 330;
    emit(n, "loan", p, "\uB300\uCD9C \uC2E4\uD589", "Pr\xE9stamo recibido", "300\uC744 \uBC1B\uACE0 330\uC758 \uC0C1\uD658 \uC758\uBB34\uAC00 \uC0DD\uACBC\uC2B5\uB2C8\uB2E4. \uCD94\uAC00 \uC774\uC790\uB098 \uB9CC\uAE30 \uC5C6\uC774 \uC804\uC561 \uC0C1\uD658\uD558\uBA70, \uBBF8\uC0C1\uD658\uC561\uC740 \uCD5C\uC885 \uC790\uC0B0\uC5D0\uC11C \uBE8D\uB2C8\uB2E4.", "Recibes 300 y debes devolver 330. No hay intereses adicionales ni plazo; se paga completo y la deuda se resta del patrimonio final.", { amount: 300, debtAfter: 330, moneyDelta: { [p]: 300 } });
    if (n.phase === "debt" && n.pendingPayment) {
      const pending = n.pendingPayment;
      n = pay(n, p, pending.amount, pending.creditor, pending.reason, pending.type);
      if (!n.result && n.phase !== "finished") {
        n.pendingPayment = null;
        n.phase = pending.resumePhase;
        n.active = pending.resumeActive;
      }
    }
    return n;
  }
  if (a.type === "repay") {
    const amount = n.debt[p];
    n.money[p] -= amount;
    n.debt[p] = 0;
    emit(n, "repay", p, "\uB300\uCD9C \uC0C1\uD658 \uC644\uB8CC", "Pr\xE9stamo pagado", `${amount}\uC744 \uC0C1\uD658\uD574 \uB0A8\uC740 \uB300\uCD9C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.`, `Pagaste ${amount}; ya no tienes deuda.`, { amount, debtAfter: 0, moneyDelta: { [p]: -amount } });
    return n;
  }
  if (a.type === "declare-bankruptcy") return bankrupt(n, p, otherPlayer(p));
  if (a.type === "roll" || a.type === "attempt-doubles") {
    const random = seededRandom(s.rng), d1 = 1 + Math.floor(random() * 6), d2 = 1 + Math.floor(random() * 6);
    n.rng = s.rng + 2 * 1831565813 >>> 0;
    n.lastRoll = [d1, d2];
    n.diceSequence = (s.diceSequence ?? 0) + 1;
    n.pawnLocked[p] = true;
    emit(n, "roll", p, "\uC8FC\uC0AC\uC704 \uACB0\uACFC", "Resultado de los dados", `${d1} + ${d2} = ${d1 + d2}\uCE78`, `${d1} + ${d2} = ${d1 + d2} casillas`, { amount: d1 + d2 });
    if (a.type === "attempt-doubles" && d1 !== d2) {
      n.islandTurns ??= { p1: 0, p2: 0 };
      n.islandTurns[p] = Math.max(0, (n.islandTurns[p] ?? 0) - 1);
      emit(n, "island", p, "\uC774\uBC88\uC5D0\uB294 \uC26C\uC5B4\uAC00\uC694", "Este turno descansas", `\uC30D\uC774 \uB098\uC624\uC9C0 \uC54A\uC544 \uC774\uB3D9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB0A8\uC740 \uC815\uC9C0 ${n.islandTurns[p]}\uD134.`, `No salieron dobles. No te mueves; quedan ${n.islandTurns[p]} turnos en la isla.`);
      return finishTurn2(n, p);
    }
    if (a.type === "attempt-doubles") {
      n.islandTurns ??= { p1: 0, p2: 0 };
      n.islandTurns[p] = 0;
    }
    const from = n.positions[p], distance = d1 + d2, to = (from + distance) % board.length;
    if (from + distance >= board.length) bonus(n, p, 200, "\uCD9C\uBC1C \uBCF4\uB108\uC2A4", "Bono de Salida");
    n.positions[p] = to;
    noteMove(n, p, from, to, distance, a.type === "attempt-doubles" ? "island" : "dice");
    return resolveLanding(n, p, to, true);
  }
  if (a.type === "pay-escape") {
    n = pay(n, p, 100, "bank", { ko: "\uBB34\uC778\uB3C4 \uD0C8\uCD9C \uBE44\uC6A9", es: "Pago para salir de la isla" });
    if (!n.result) {
      n.islandTurns ??= { p1: 0, p2: 0 };
      n.islandTurns[p] = 0;
      n.phase = "roll";
      emit(n, "escape", p, "\uBB34\uC778\uB3C4 \uD0C8\uCD9C", "Salida de la isla", "\uC774\uC81C \uC8FC\uC0AC\uC704\uB97C \uAD74\uB9B4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", "Ahora puedes lanzar los dados.");
    }
    return n;
  }
  if (a.type === "use-escape-pass") {
    n.escapePasses ??= { p1: 0, p2: 0 };
    n.escapePasses[p]--;
    if (n.boardVersion === 2) {
      n.eventDeck ??= [];
      n.eventDeck.push("escape-pass");
    }
    n.islandTurns ??= { p1: 0, p2: 0 };
    n.islandTurns[p] = 0;
    n.phase = "roll";
    emit(n, "escape", p, "\uD0C8\uCD9C\uAD8C \uC0AC\uC6A9", "Pase de salida usado", "\uD0C8\uCD9C\uAD8C\uC744 \uC0AC\uC6A9\uD574 \uBB34\uC778\uB3C4\uC5D0\uC11C \uB098\uC654\uC2B5\uB2C8\uB2E4.", "Usaste el pase para salir de la isla.");
    return n;
  }
  if (a.type === "choose-train") {
    const from = n.positions[p], to = payload.destination, fare = n.pendingTrainFare ?? 100;
    n.money[p] -= fare;
    n.trainReady ??= { p1: false, p2: false };
    n.trainReady[p] = false;
    n.pendingTrainFare = null;
    n.pendingTrainSource = null;
    emit(n, "train", p, "\uC5F4\uCC28 \uCD9C\uBC1C", "El tren sale", `${board[to].name.ko}\uD589 \xB7 \uC6B4\uC784 ${fare}`, `Destino: ${board[to].name.es} \xB7 pasaje ${fare}`, { amount: fare, moneyDelta: { [p]: -fare }, from, to });
    const distance = (to - from + board.length) % board.length;
    moveForward(n, p, to, board);
    noteMove(n, p, from, to, distance, "train");
    n = resolveLanding(n, p, to, false);
    return n;
  }
  if (a.type === "skip-train") {
    const fromCard = n.pendingTrainSource === "card";
    n.trainReady ??= { p1: false, p2: false };
    n.trainReady[p] = false;
    n.pendingTrainFare = null;
    n.pendingTrainSource = null;
    if (fromCard) n.phase = "main";
    else n.phase = "roll";
    return n;
  }
  if (a.type === "buy") {
    const index = n.pendingTile, price = board[index].price;
    n.money[p] -= price;
    n.properties[String(index)] = { owner: p, houses: 0 };
    n.phase = "main";
    emit(n, "buy", p, "\uB3C4\uC2DC \uAD6C\uB9E4 \uC644\uB8CC", "Ciudad comprada", `${board[index].name.ko}\uC744 \uC18C\uC720\uD588\uC2B5\uB2C8\uB2E4.`, `Compraste ${board[index].name.es}.`, { tile: index, amount: price, moneyDelta: { [p]: -price } });
    const group = board[index].group;
    if (completedGroups(n, p).includes(group)) emit(n, "monopoly-warning", p, "\uC0C9\uC0C1 \uB3C4\uC2DC\uAD70 \uC644\uC131", "Grupo de color completo", "\uC774 \uB3C4\uC2DC\uAD70\uC744 \uBAA8\uB450 \uC18C\uC720\uD588\uC2B5\uB2C8\uB2E4. \uB3C5\uC810 \uACBD\uACE0 \uCE74\uB4DC\uAC00 \uB098\uC624\uBA74 \uBD80\uB2F4\uAE08 \uB300\uC0C1\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", "Ya tienes todas las ciudades de este color. Una carta de monopolio puede cobrarte un cargo.", { group, tile: index });
  } else if (a.type === "decline") n.phase = "main";
  else if (a.type === "build") {
    const index = payload.tile;
    n.money[p] -= 100;
    n.properties[String(index)] = { ...n.properties[String(index)], houses: n.properties[String(index)].houses + 1 };
    const level = n.properties[String(index)].houses;
    emit(n, "build", p, "\uAC74\uC124 \uC644\uB8CC", "Construcci\xF3n terminada", `${board[index].name.ko}: ${level === 3 ? "\uB79C\uB4DC\uB9C8\uD06C" : level === 2 ? "\uBE4C\uB529" : "\uBCC4\uC7A5"} \xB7 \uD1B5\uD589\uB8CC ${propertyRent(board[index], n.properties[String(index)], n.boardVersion === 2)}`, `${board[index].name.es}: ${level === 3 ? "monumento" : level === 2 ? "edificio" : "villa"} \xB7 alquiler ${propertyRent(board[index], n.properties[String(index)], n.boardVersion === 2)}`, { tile: index, amount: 100, moneyDelta: { [p]: -100 } });
  } else if (a.type === "endTurn") return finishTurn2(n, p);
  return n;
}
var marbleEngine = {
  id: "marble",
  createInitialState(seed) {
    const rng = seed >>> 0, eventRng = (rng ^ 2779096485) >>> 0;
    return {
      rng,
      active: "p1",
      positions: { p1: 0, p2: 0 },
      money: { p1: 1500, p2: 1500 },
      properties: {},
      boardVersion: 2,
      phase: "roll",
      pendingTile: null,
      lastRoll: [],
      turns: 0,
      result: null,
      eventRng: eventRng + modernIds.length * 1831565813 >>> 0,
      eventDeck: shuffle([...modernIds, "monopoly-warning"], seededRandom(eventRng)),
      eventSequence: 0,
      lastEvent: null,
      fundPool: 0,
      economicVersion: 1,
      debt: { p1: 0, p2: 0 },
      pendingPayment: null,
      actionLog: [],
      actionSequence: 0,
      pawns: { p1: "fox", p2: "cat" },
      pawnLocked: { p1: false, p2: false },
      islandTurns: { p1: 0, p2: 0 },
      escapePasses: { p1: 0, p2: 0 },
      trainReady: { p1: false, p2: false },
      pendingTrainFare: null,
      pendingTrainSource: null,
      lastMove: null,
      moveSequence: 0,
      diceSequence: 0
    };
  },
  validateAction: validation,
  applyAction: step,
  getPlayerView: view2,
  getResult: (state) => state.result
};

// src/core/registry.ts
var engines = { davinci: davinciEngine, catchmind: catchmindEngine, domino: dominoEngine, jaipur: jaipurEngine, splendor: splendorEngine, minhwatu: minhwatuEngine, marble: marbleEngine };

// src/core/reactions.ts
var reactionEmoji = {
  heart: "\u2764\uFE0F",
  laugh: "\u{1F602}",
  applause: "\u{1F44F}",
  wow: "\u{1F62E}",
  sad: "\u{1F622}"
};
function isReactionId(value) {
  return typeof value === "string" && Object.hasOwn(reactionEmoji, value);
}
function reactionForText(value) {
  const entry = Object.entries(reactionEmoji).find(([, emoji]) => emoji === value);
  return entry ? entry[0] : null;
}

// src/core/authority.ts
var ActionError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
  code;
};
function executeAction(engine, state, player, action) {
  if (!action || typeof action.type !== "string" || action.type.length > 64 || JSON.stringify(action).length > 24e3) throw new ActionError("invalid_action");
  if (engine.getResult(state)) throw new ActionError("game_finished");
  const error = engine.validateAction(state, player, action);
  if (error) throw new ActionError(error);
  const next = engine.applyAction(structuredClone(state), player, action);
  return { state: next, views: { p1: engine.getPlayerView(next, "p1"), p2: engine.getPlayerView(next, "p2") } };
}
var RETENTION_MS = 7 * 24 * 60 * 60 * 1e3;
function textLength(text) {
  return Array.from(text).length;
}
function validChat(text) {
  return typeof text === "string" && text.trim().length > 0 && textLength(text) <= 500;
}
function chatMessageForGame(gameId, value) {
  if (!validChat(value)) throw new ActionError("chat_max_500");
  const text = value.trim();
  const reaction = reactionForText(text);
  if (reaction) return { text: reactionEmoji[reaction], status: "original" };
  if (gameId !== "catchmind") throw new ActionError("chat_not_allowed");
  return { text, status: "pending" };
}
function reactionMessageForId(value) {
  if (!isReactionId(value)) throw new ActionError("invalid_reaction");
  return { text: reactionEmoji[value], status: "original" };
}
export {
  catchmindDrawDurationMs,
  chatMessageForGame,
  engines,
  executeAction,
  getCatchmindDrawDurationMs,
  getCatchmindHintStage,
  isCorrectGuess,
  isReactionId,
  reactionEmoji,
  reactionForText,
  reactionMessageForId,
  validChat
};
