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

// src/games/catchmind-topic-dictionary.json
var catchmind_topic_dictionary_default = {
  schema_version: "1.0.0",
  source_revision: "875b7c9ae1dc97bdafce50a6939c7ef003b7a0b4",
  description: "Categorized bilingual Catchmind word deck. Legacy content pairs retain stable positional IDs; additions are supplemental.",
  selection_policy: {
    mode: "single_category_required",
    allow_multiple: false,
    allow_mixed_all_categories: false,
    lock_category_after_game_start: true
  },
  counts: {
    total: 272,
    existing_legacy: 192,
    added: 80,
    categories: 6
  },
  categories: [
    {
      id: "animals",
      label: {
        ko: "\uB3D9\uBB3C",
        es: "Animales"
      },
      target_count: 62,
      examples: [
        {
          ko: "\uACE0\uC591\uC774",
          es: "gato"
        },
        {
          ko: "\uD310\uB2E4",
          es: "panda"
        },
        {
          ko: "\uD574\uD30C\uB9AC",
          es: "medusa"
        }
      ],
      word_count: 62,
      added_count: 8,
      legacy_count: 54,
      word_ids: [
        "legacy-001",
        "legacy-002",
        "legacy-003",
        "legacy-004",
        "legacy-005",
        "legacy-006",
        "legacy-007",
        "legacy-008",
        "legacy-009",
        "legacy-010",
        "legacy-011",
        "legacy-012",
        "legacy-013",
        "legacy-014",
        "legacy-015",
        "legacy-016",
        "legacy-017",
        "legacy-018",
        "legacy-019",
        "legacy-020",
        "legacy-021",
        "legacy-022",
        "legacy-023",
        "legacy-024",
        "legacy-025",
        "legacy-026",
        "legacy-027",
        "legacy-028",
        "legacy-029",
        "legacy-030",
        "legacy-031",
        "legacy-032",
        "legacy-033",
        "legacy-034",
        "legacy-035",
        "legacy-036",
        "legacy-037",
        "legacy-038",
        "legacy-039",
        "legacy-040",
        "legacy-041",
        "legacy-042",
        "legacy-043",
        "legacy-044",
        "legacy-045",
        "legacy-046",
        "legacy-047",
        "legacy-048",
        "legacy-049",
        "legacy-050",
        "legacy-051",
        "legacy-052",
        "legacy-053",
        "legacy-054",
        "animals-extra-001",
        "animals-extra-002",
        "animals-extra-003",
        "animals-extra-004",
        "animals-extra-005",
        "animals-extra-006",
        "animals-extra-007",
        "animals-extra-008"
      ]
    },
    {
      id: "food",
      label: {
        ko: "\uC74C\uC2DD",
        es: "Comida"
      },
      target_count: 45,
      examples: [
        {
          ko: "\uD53C\uC790",
          es: "pizza"
        },
        {
          ko: "\uD328\uC158\uD504\uB8E8\uD2B8",
          es: "chinola"
        },
        {
          ko: "\uB9DD\uAD6C",
          es: "mang\xFA"
        }
      ],
      word_count: 45,
      added_count: 15,
      legacy_count: 30,
      word_ids: [
        "legacy-148",
        "legacy-149",
        "legacy-150",
        "legacy-151",
        "legacy-152",
        "legacy-153",
        "legacy-154",
        "legacy-155",
        "legacy-156",
        "legacy-157",
        "legacy-158",
        "legacy-159",
        "legacy-160",
        "legacy-161",
        "legacy-162",
        "legacy-163",
        "legacy-164",
        "legacy-165",
        "legacy-166",
        "legacy-167",
        "legacy-168",
        "legacy-169",
        "legacy-170",
        "legacy-171",
        "legacy-172",
        "legacy-173",
        "legacy-174",
        "legacy-175",
        "legacy-176",
        "legacy-177",
        "food-extra-001",
        "food-extra-002",
        "food-extra-003",
        "food-extra-004",
        "food-extra-005",
        "food-extra-006",
        "food-extra-007",
        "food-extra-008",
        "food-extra-009",
        "food-extra-010",
        "food-extra-011",
        "food-extra-012",
        "food-extra-013",
        "food-extra-014",
        "food-extra-015"
      ]
    },
    {
      id: "nature_space",
      label: {
        ko: "\uC790\uC5F0\xB7\uC6B0\uC8FC",
        es: "Naturaleza y espacio"
      },
      target_count: 40,
      examples: [
        {
          ko: "\uC7A5\uBBF8",
          es: "rosa"
        },
        {
          ko: "\uD654\uC0B0",
          es: "volc\xE1n"
        },
        {
          ko: "\uD1A0\uC131",
          es: "Saturno"
        }
      ],
      word_count: 40,
      added_count: 16,
      legacy_count: 24,
      word_ids: [
        "legacy-055",
        "legacy-056",
        "legacy-057",
        "legacy-058",
        "legacy-059",
        "legacy-060",
        "legacy-061",
        "legacy-062",
        "legacy-063",
        "legacy-064",
        "legacy-065",
        "legacy-066",
        "legacy-067",
        "legacy-068",
        "legacy-069",
        "legacy-070",
        "legacy-071",
        "legacy-072",
        "legacy-073",
        "legacy-074",
        "legacy-075",
        "legacy-076",
        "legacy-077",
        "legacy-078",
        "nature_space-extra-001",
        "nature_space-extra-002",
        "nature_space-extra-003",
        "nature_space-extra-004",
        "nature_space-extra-005",
        "nature_space-extra-006",
        "nature_space-extra-007",
        "nature_space-extra-008",
        "nature_space-extra-009",
        "nature_space-extra-010",
        "nature_space-extra-011",
        "nature_space-extra-012",
        "nature_space-extra-013",
        "nature_space-extra-014",
        "nature_space-extra-015",
        "nature_space-extra-016"
      ]
    },
    {
      id: "places",
      label: {
        ko: "\uC7A5\uC18C\xB7\uAC74\uBB3C",
        es: "Lugares y edificios"
      },
      target_count: 35,
      examples: [
        {
          ko: "\uD559\uAD50",
          es: "escuela"
        },
        {
          ko: "\uB3C4\uC11C\uAD00",
          es: "biblioteca"
        },
        {
          ko: "\uB3D9\uB124 \uC2DD\uB8CC\uD488\uC810",
          es: "colmado"
        }
      ],
      word_count: 35,
      added_count: 14,
      legacy_count: 21,
      word_ids: [
        "legacy-079",
        "legacy-080",
        "legacy-081",
        "legacy-082",
        "legacy-083",
        "legacy-084",
        "legacy-085",
        "legacy-086",
        "legacy-087",
        "legacy-088",
        "legacy-089",
        "legacy-090",
        "legacy-091",
        "legacy-092",
        "legacy-093",
        "legacy-094",
        "legacy-095",
        "legacy-096",
        "legacy-097",
        "legacy-098",
        "legacy-099",
        "places-extra-001",
        "places-extra-002",
        "places-extra-003",
        "places-extra-004",
        "places-extra-005",
        "places-extra-006",
        "places-extra-007",
        "places-extra-008",
        "places-extra-009",
        "places-extra-010",
        "places-extra-011",
        "places-extra-012",
        "places-extra-013",
        "places-extra-014"
      ]
    },
    {
      id: "transport",
      label: {
        ko: "\uD0C8\uAC83",
        es: "Transporte"
      },
      target_count: 30,
      examples: [
        {
          ko: "\uC790\uB3D9\uCC28",
          es: "carro"
        },
        {
          ko: "\uAD6C\uAE09\uCC28",
          es: "ambulancia"
        },
        {
          ko: "\uC9C0\uD558\uCCA0",
          es: "metro"
        }
      ],
      word_count: 30,
      added_count: 15,
      legacy_count: 15,
      word_ids: [
        "legacy-100",
        "legacy-101",
        "legacy-102",
        "legacy-103",
        "legacy-104",
        "legacy-105",
        "legacy-106",
        "legacy-107",
        "legacy-108",
        "legacy-109",
        "legacy-110",
        "legacy-111",
        "legacy-112",
        "legacy-113",
        "legacy-114",
        "transport-extra-001",
        "transport-extra-002",
        "transport-extra-003",
        "transport-extra-004",
        "transport-extra-005",
        "transport-extra-006",
        "transport-extra-007",
        "transport-extra-008",
        "transport-extra-009",
        "transport-extra-010",
        "transport-extra-011",
        "transport-extra-012",
        "transport-extra-013",
        "transport-extra-014",
        "transport-extra-015"
      ]
    },
    {
      id: "life_hobbies",
      label: {
        ko: "\uC0DD\uD65C\xB7\uCDE8\uBBF8",
        es: "Vida diaria y pasatiempos"
      },
      target_count: 60,
      examples: [
        {
          ko: "\uCEF4\uD4E8\uD130",
          es: "computadora"
        },
        {
          ko: "\uCD95\uAD6C",
          es: "f\xFAtbol"
        },
        {
          ko: "\uC8FC\uC0AC\uC704",
          es: "dado"
        }
      ],
      word_count: 60,
      added_count: 12,
      legacy_count: 48,
      word_ids: [
        "legacy-115",
        "legacy-116",
        "legacy-117",
        "legacy-118",
        "legacy-119",
        "legacy-120",
        "legacy-121",
        "legacy-122",
        "legacy-123",
        "legacy-124",
        "legacy-125",
        "legacy-126",
        "legacy-127",
        "legacy-128",
        "legacy-129",
        "legacy-130",
        "legacy-131",
        "legacy-132",
        "legacy-133",
        "legacy-134",
        "legacy-135",
        "legacy-136",
        "legacy-137",
        "legacy-138",
        "legacy-139",
        "legacy-140",
        "legacy-141",
        "legacy-142",
        "legacy-143",
        "legacy-144",
        "legacy-145",
        "legacy-146",
        "legacy-147",
        "legacy-178",
        "legacy-179",
        "legacy-180",
        "legacy-181",
        "legacy-182",
        "legacy-183",
        "legacy-184",
        "legacy-185",
        "legacy-186",
        "legacy-187",
        "legacy-188",
        "legacy-189",
        "legacy-190",
        "legacy-191",
        "legacy-192",
        "life_hobbies-extra-001",
        "life_hobbies-extra-002",
        "life_hobbies-extra-003",
        "life_hobbies-extra-004",
        "life_hobbies-extra-005",
        "life_hobbies-extra-006",
        "life_hobbies-extra-007",
        "life_hobbies-extra-008",
        "life_hobbies-extra-009",
        "life_hobbies-extra-010",
        "life_hobbies-extra-011",
        "life_hobbies-extra-012"
      ]
    }
  ],
  words: [
    {
      id: "legacy-001",
      source_index: 1,
      category_id: "animals",
      ko: "\uACE0\uC591\uC774",
      es: "gato",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-002",
      source_index: 2,
      category_id: "animals",
      ko: "\uAC1C",
      es: "perro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-003",
      source_index: 3,
      category_id: "animals",
      ko: "\uD1A0\uB07C",
      es: "conejo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-004",
      source_index: 4,
      category_id: "animals",
      ko: "\uB9D0",
      es: "caballo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-005",
      source_index: 5,
      category_id: "animals",
      ko: "\uC18C",
      es: "vaca",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-006",
      source_index: 6,
      category_id: "animals",
      ko: "\uB3FC\uC9C0",
      es: "cerdo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-007",
      source_index: 7,
      category_id: "animals",
      ko: "\uC591",
      es: "oveja",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-008",
      source_index: 8,
      category_id: "animals",
      ko: "\uC5FC\uC18C",
      es: "cabra",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-009",
      source_index: 9,
      category_id: "animals",
      ko: "\uC554\uD0C9",
      es: "gallina",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-010",
      source_index: 10,
      category_id: "animals",
      ko: "\uC218\uD0C9",
      es: "gallo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-011",
      source_index: 11,
      category_id: "animals",
      ko: "\uC624\uB9AC",
      es: "pato",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-012",
      source_index: 12,
      category_id: "animals",
      ko: "\uAC70\uC704",
      es: "ganso",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-013",
      source_index: 13,
      category_id: "animals",
      ko: "\uCE60\uBA74\uC870",
      es: "pavo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-014",
      source_index: 14,
      category_id: "animals",
      ko: "\uBB3C\uACE0\uAE30",
      es: "pez",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-015",
      source_index: 15,
      category_id: "animals",
      ko: "\uC0C1\uC5B4",
      es: "tibur\xF3n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-016",
      source_index: 16,
      category_id: "animals",
      ko: "\uACE0\uB798",
      es: "ballena",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-017",
      source_index: 17,
      category_id: "animals",
      ko: "\uB3CC\uACE0\uB798",
      es: "delf\xEDn",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-018",
      source_index: 18,
      category_id: "animals",
      ko: "\uBB38\uC5B4",
      es: "pulpo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-019",
      source_index: 19,
      category_id: "animals",
      ko: "\uAC8C",
      es: "cangrejo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-020",
      source_index: 20,
      category_id: "animals",
      ko: "\uAC70\uBD81\uC774",
      es: "tortuga",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-021",
      source_index: 21,
      category_id: "animals",
      ko: "\uAC1C\uAD6C\uB9AC",
      es: "rana",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-022",
      source_index: 22,
      category_id: "animals",
      ko: "\uBC40",
      es: "serpiente",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-023",
      source_index: 23,
      category_id: "animals",
      ko: "\uB3C4\uB9C8\uBC40",
      es: "lagarto",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-024",
      source_index: 24,
      category_id: "animals",
      ko: "\uC545\uC5B4",
      es: "cocodrilo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-025",
      source_index: 25,
      category_id: "animals",
      ko: "\uCF54\uB07C\uB9AC",
      es: "elefante",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-026",
      source_index: 26,
      category_id: "animals",
      ko: "\uAE30\uB9B0",
      es: "jirafa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-027",
      source_index: 27,
      category_id: "animals",
      ko: "\uC0AC\uC790",
      es: "le\xF3n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-028",
      source_index: 28,
      category_id: "animals",
      ko: "\uD638\uB791\uC774",
      es: "tigre",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-029",
      source_index: 29,
      category_id: "animals",
      ko: "\uACF0",
      es: "oso",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-030",
      source_index: 30,
      category_id: "animals",
      ko: "\uC6D0\uC22D\uC774",
      es: "mono",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-031",
      source_index: 31,
      category_id: "animals",
      ko: "\uC5BC\uB8E9\uB9D0",
      es: "cebra",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-032",
      source_index: 32,
      category_id: "animals",
      ko: "\uCEA5\uAC70\uB8E8",
      es: "canguro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-033",
      source_index: 33,
      category_id: "animals",
      ko: "\uD310\uB2E4",
      es: "panda",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-034",
      source_index: 34,
      category_id: "animals",
      ko: "\uD3AD\uADC4",
      es: "ping\xFCino",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-035",
      source_index: 35,
      category_id: "animals",
      ko: "\uBD80\uC5C9\uC774",
      es: "b\xFAho",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-036",
      source_index: 36,
      category_id: "animals",
      ko: "\uC575\uBB34\uC0C8",
      es: "loro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-037",
      source_index: 37,
      category_id: "animals",
      ko: "\uB098\uBE44",
      es: "mariposa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-038",
      source_index: 38,
      category_id: "animals",
      ko: "\uBC8C",
      es: "abeja",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-039",
      source_index: 39,
      category_id: "animals",
      ko: "\uAC1C\uBBF8",
      es: "hormiga",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-040",
      source_index: 40,
      category_id: "animals",
      ko: "\uAC70\uBBF8",
      es: "ara\xF1a",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-041",
      source_index: 41,
      category_id: "animals",
      ko: "\uB2EC\uD33D\uC774",
      es: "caracol",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-042",
      source_index: 42,
      category_id: "animals",
      ko: "\uACE0\uC2B4\uB3C4\uCE58",
      es: "erizo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-043",
      source_index: 43,
      category_id: "animals",
      ko: "\uC0AC\uC2B4",
      es: "ciervo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-044",
      source_index: 44,
      category_id: "animals",
      ko: "\uC5EC\uC6B0",
      es: "zorro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-045",
      source_index: 45,
      category_id: "animals",
      ko: "\uB291\uB300",
      es: "lobo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-046",
      source_index: 46,
      category_id: "animals",
      ko: "\uB3C5\uC218\uB9AC",
      es: "\xE1guila",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-047",
      source_index: 47,
      category_id: "animals",
      ko: "\uBE44\uB458\uAE30",
      es: "paloma",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-048",
      source_index: 48,
      category_id: "animals",
      ko: "\uBC8C\uC0C8",
      es: "colibr\xED",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-049",
      source_index: 49,
      category_id: "animals",
      ko: "\uACF5\uC791",
      es: "pavo real",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-050",
      source_index: 50,
      category_id: "animals",
      ko: "\uACE0\uB798\uC0C1\uC5B4",
      es: "tibur\xF3n ballena",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-051",
      source_index: 51,
      category_id: "animals",
      ko: "\uD574\uD30C\uB9AC",
      es: "medusa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-052",
      source_index: 52,
      category_id: "animals",
      ko: "\uBD88\uAC00\uC0AC\uB9AC",
      es: "estrella de mar",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-053",
      source_index: 53,
      category_id: "animals",
      ko: "\uC0C8\uC6B0",
      es: "camar\xF3n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-054",
      source_index: 54,
      category_id: "animals",
      ko: "\uBC14\uB2F7\uAC00\uC7AC",
      es: "langosta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-055",
      source_index: 55,
      category_id: "nature_space",
      ko: "\uB9E4\uD654",
      es: "flor de ciruelo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-056",
      source_index: 56,
      category_id: "nature_space",
      ko: "\uC7A5\uBBF8",
      es: "rosa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-057",
      source_index: 57,
      category_id: "nature_space",
      ko: "\uD574\uBC14\uB77C\uAE30",
      es: "girasol",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-058",
      source_index: 58,
      category_id: "nature_space",
      ko: "\uD2A4\uB9BD",
      es: "tulip\xE1n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-059",
      source_index: 59,
      category_id: "nature_space",
      ko: "\uC120\uC778\uC7A5",
      es: "cactus",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-060",
      source_index: 60,
      category_id: "nature_space",
      ko: "\uBC84\uC12F",
      es: "hongo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-061",
      source_index: 61,
      category_id: "nature_space",
      ko: "\uB098\uBB34",
      es: "\xE1rbol",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-062",
      source_index: 62,
      category_id: "nature_space",
      ko: "\uC57C\uC790\uC218",
      es: "palmera",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-063",
      source_index: 63,
      category_id: "nature_space",
      ko: "\uAD6C\uB984",
      es: "nube",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-064",
      source_index: 64,
      category_id: "nature_space",
      ko: "\uD574",
      es: "sol",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-065",
      source_index: 65,
      category_id: "nature_space",
      ko: "\uB2EC",
      es: "luna",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-066",
      source_index: 66,
      category_id: "nature_space",
      ko: "\uBCC4",
      es: "estrella",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-067",
      source_index: 67,
      category_id: "nature_space",
      ko: "\uBB34\uC9C0\uAC1C",
      es: "arco\xEDris",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-068",
      source_index: 68,
      category_id: "nature_space",
      ko: "\uC0B0",
      es: "monta\xF1a",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-069",
      source_index: 69,
      category_id: "nature_space",
      ko: "\uD654\uC0B0",
      es: "volc\xE1n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-070",
      source_index: 70,
      category_id: "nature_space",
      ko: "\uAC15",
      es: "r\xEDo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-071",
      source_index: 71,
      category_id: "nature_space",
      ko: "\uD3ED\uD3EC",
      es: "cascada",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-072",
      source_index: 72,
      category_id: "nature_space",
      ko: "\uBC14\uB2E4",
      es: "oc\xE9ano",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-073",
      source_index: 73,
      category_id: "nature_space",
      ko: "\uC12C",
      es: "isla",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-074",
      source_index: 74,
      category_id: "nature_space",
      ko: "\uD574\uBCC0",
      es: "playa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-075",
      source_index: 75,
      category_id: "nature_space",
      ko: "\uB208\uC0AC\uB78C",
      es: "mu\xF1eco de nieve",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-076",
      source_index: 76,
      category_id: "nature_space",
      ko: "\uBC88\uAC1C",
      es: "rayo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-077",
      source_index: 77,
      category_id: "nature_space",
      ko: "\uB208\uC1A1\uC774",
      es: "copo de nieve",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-078",
      source_index: 78,
      category_id: "nature_space",
      ko: "\uC57C\uC790\uC5F4\uB9E4",
      es: "coco",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-079",
      source_index: 79,
      category_id: "places",
      ko: "\uC9D1",
      es: "casa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-080",
      source_index: 80,
      category_id: "places",
      ko: "\uC544\uD30C\uD2B8",
      es: "apartamento",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-081",
      source_index: 81,
      category_id: "places",
      ko: "\uD559\uAD50",
      es: "escuela",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-082",
      source_index: 82,
      category_id: "places",
      ko: "\uBCD1\uC6D0",
      es: "hospital",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-083",
      source_index: 83,
      category_id: "places",
      ko: "\uAD50\uD68C",
      es: "iglesia",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-084",
      source_index: 84,
      category_id: "places",
      ko: "\uC131",
      es: "castillo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-085",
      source_index: 85,
      category_id: "places",
      ko: "\uB2E4\uB9AC",
      es: "puente",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-086",
      source_index: 86,
      category_id: "places",
      ko: "\uB4F1\uB300",
      es: "faro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-087",
      source_index: 87,
      category_id: "places",
      ko: "\uD150\uD2B8",
      es: "carpa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-088",
      source_index: 88,
      category_id: "places",
      ko: "\uB3C4\uC11C\uAD00",
      es: "biblioteca",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-089",
      source_index: 89,
      category_id: "places",
      ko: "\uC18C\uBC29\uC11C",
      es: "estaci\xF3n de bomberos",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-090",
      source_index: 90,
      category_id: "places",
      ko: "\uC6B0\uCCB4\uAD6D",
      es: "oficina de correos",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-091",
      source_index: 91,
      category_id: "places",
      ko: "\uC2DD\uB2F9",
      es: "restaurante",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-092",
      source_index: 92,
      category_id: "places",
      ko: "\uC2DC\uC7A5",
      es: "mercado",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-093",
      source_index: 93,
      category_id: "places",
      ko: "\uACF5\uC6D0",
      es: "parque",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-094",
      source_index: 94,
      category_id: "places",
      ko: "\uC218\uC601\uC7A5",
      es: "piscina",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-095",
      source_index: 95,
      category_id: "places",
      ko: "\uB180\uC774\uD130",
      es: "parque infantil",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-096",
      source_index: 96,
      category_id: "places",
      ko: "\uAE30\uCC28\uC5ED",
      es: "estaci\xF3n de tren",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-097",
      source_index: 97,
      category_id: "places",
      ko: "\uBC84\uC2A4 \uC815\uB958\uC7A5",
      es: "parada de autob\xFAs",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-098",
      source_index: 98,
      category_id: "places",
      ko: "\uACF5\uD56D",
      es: "aeropuerto",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-099",
      source_index: 99,
      category_id: "places",
      ko: "\uB18D\uC7A5",
      es: "granja",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-100",
      source_index: 100,
      category_id: "transport",
      ko: "\uC790\uB3D9\uCC28",
      es: "carro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-101",
      source_index: 101,
      category_id: "transport",
      ko: "\uBC84\uC2A4",
      es: "guagua",
      aliases: {
        ko: [],
        es: [
          "autob\xFAs",
          "bus"
        ]
      },
      provenance: "existing"
    },
    {
      id: "legacy-102",
      source_index: 102,
      category_id: "transport",
      ko: "\uD2B8\uB7ED",
      es: "cami\xF3n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-103",
      source_index: 103,
      category_id: "transport",
      ko: "\uD0DD\uC2DC",
      es: "taxi",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-104",
      source_index: 104,
      category_id: "transport",
      ko: "\uC790\uC804\uAC70",
      es: "bicicleta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-105",
      source_index: 105,
      category_id: "transport",
      ko: "\uC624\uD1A0\uBC14\uC774",
      es: "motocicleta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-106",
      source_index: 106,
      category_id: "transport",
      ko: "\uBE44\uD589\uAE30",
      es: "avi\xF3n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-107",
      source_index: 107,
      category_id: "transport",
      ko: "\uD5EC\uB9AC\uCF65\uD130",
      es: "helic\xF3ptero",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-108",
      source_index: 108,
      category_id: "transport",
      ko: "\uBCF4\uD2B8",
      es: "bote",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-109",
      source_index: 109,
      category_id: "transport",
      ko: "\uBC30",
      es: "barco",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-110",
      source_index: 110,
      category_id: "transport",
      ko: "\uAE30\uCC28",
      es: "tren",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-111",
      source_index: 111,
      category_id: "transport",
      ko: "\uB85C\uCF13",
      es: "cohete",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-112",
      source_index: 112,
      category_id: "transport",
      ko: "\uD2B8\uB799\uD130",
      es: "tractor",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-113",
      source_index: 113,
      category_id: "transport",
      ko: "\uC2A4\uCF00\uC774\uD2B8\uBCF4\uB4DC",
      es: "patineta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-114",
      source_index: 114,
      category_id: "transport",
      ko: "\uC720\uBAA8\uCC28",
      es: "cochecito",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-115",
      source_index: 115,
      category_id: "life_hobbies",
      ko: "\uCEF4\uD4E8\uD130",
      es: "computadora",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-116",
      source_index: 116,
      category_id: "life_hobbies",
      ko: "\uD0DC\uBE14\uB9BF",
      es: "tableta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-117",
      source_index: 117,
      category_id: "life_hobbies",
      ko: "\uC804\uD654\uAE30",
      es: "tel\xE9fono",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-118",
      source_index: 118,
      category_id: "life_hobbies",
      ko: "\uCE74\uBA54\uB77C",
      es: "c\xE1mara",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-119",
      source_index: 119,
      category_id: "life_hobbies",
      ko: "\uD154\uB808\uBE44\uC804",
      es: "televisor",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-120",
      source_index: 120,
      category_id: "life_hobbies",
      ko: "\uB77C\uB514\uC624",
      es: "radio",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-121",
      source_index: 121,
      category_id: "life_hobbies",
      ko: "\uD5E4\uB4DC\uD3F0",
      es: "auriculares",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-122",
      source_index: 122,
      category_id: "life_hobbies",
      ko: "\uC2DC\uACC4",
      es: "reloj",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-123",
      source_index: 123,
      category_id: "life_hobbies",
      ko: "\uC548\uACBD",
      es: "lentes",
      aliases: {
        ko: [],
        es: [
          "gafas",
          "anteojos"
        ]
      },
      provenance: "existing"
    },
    {
      id: "legacy-124",
      source_index: 124,
      category_id: "life_hobbies",
      ko: "\uC6B0\uC0B0",
      es: "paraguas",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-125",
      source_index: 125,
      category_id: "life_hobbies",
      ko: "\uC5F4\uC1E0",
      es: "llave",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-126",
      source_index: 126,
      category_id: "life_hobbies",
      ko: "\uC790\uBB3C\uC1E0",
      es: "candado",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-127",
      source_index: 127,
      category_id: "life_hobbies",
      ko: "\uBB38",
      es: "puerta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-128",
      source_index: 128,
      category_id: "life_hobbies",
      ko: "\uCC3D\uBB38",
      es: "ventana",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-129",
      source_index: 129,
      category_id: "life_hobbies",
      ko: "\uC758\uC790",
      es: "silla",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-130",
      source_index: 130,
      category_id: "life_hobbies",
      ko: "\uD0C1\uC790",
      es: "mesa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-131",
      source_index: 131,
      category_id: "life_hobbies",
      ko: "\uCE68\uB300",
      es: "cama",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-132",
      source_index: 132,
      category_id: "life_hobbies",
      ko: "\uC18C\uD30C",
      es: "sof\xE1",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-133",
      source_index: 133,
      category_id: "life_hobbies",
      ko: "\uB7A8\uD504",
      es: "l\xE1mpara",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-134",
      source_index: 134,
      category_id: "life_hobbies",
      ko: "\uAC70\uC6B8",
      es: "espejo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-135",
      source_index: 135,
      category_id: "life_hobbies",
      ko: "\uCC45",
      es: "libro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-136",
      source_index: 136,
      category_id: "life_hobbies",
      ko: "\uC5F0\uD544",
      es: "l\xE1piz",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-137",
      source_index: 137,
      category_id: "life_hobbies",
      ko: "\uBD93",
      es: "pincel",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-138",
      source_index: 138,
      category_id: "life_hobbies",
      ko: "\uAC00\uC704",
      es: "tijeras",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-139",
      source_index: 139,
      category_id: "life_hobbies",
      ko: "\uB9DD\uCE58",
      es: "martillo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-140",
      source_index: 140,
      category_id: "life_hobbies",
      ko: "\uD1B1",
      es: "sierra",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-141",
      source_index: 141,
      category_id: "life_hobbies",
      ko: "\uAE30\uD0C0",
      es: "guitarra",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-142",
      source_index: 142,
      category_id: "life_hobbies",
      ko: "\uD53C\uC544\uB178",
      es: "piano",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-143",
      source_index: 143,
      category_id: "life_hobbies",
      ko: "\uB4DC\uB7FC",
      es: "tambor",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-144",
      source_index: 144,
      category_id: "life_hobbies",
      ko: "\uD2B8\uB7FC\uD3AB",
      es: "trompeta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-145",
      source_index: 145,
      category_id: "life_hobbies",
      ko: "\uCD95\uAD6C\uACF5",
      es: "bal\xF3n de f\xFAtbol",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-146",
      source_index: 146,
      category_id: "life_hobbies",
      ko: "\uB18D\uAD6C\uACF5",
      es: "bal\xF3n de baloncesto",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-147",
      source_index: 147,
      category_id: "life_hobbies",
      ko: "\uC57C\uAD6C \uBC29\uB9DD\uC774",
      es: "bate de b\xE9isbol",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-148",
      source_index: 148,
      category_id: "food",
      ko: "\uD53C\uC790",
      es: "pizza",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-149",
      source_index: 149,
      category_id: "food",
      ko: "\uD584\uBC84\uAC70",
      es: "hamburguesa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-150",
      source_index: 150,
      category_id: "food",
      ko: "\uD56B\uB3C4\uADF8",
      es: "perro caliente",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-151",
      source_index: 151,
      category_id: "food",
      ko: "\uC0CC\uB4DC\uC704\uCE58",
      es: "s\xE1ndwich",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-152",
      source_index: 152,
      category_id: "food",
      ko: "\uBC25\uADF8\uB987",
      es: "taz\xF3n de arroz",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-153",
      source_index: 153,
      category_id: "food",
      ko: "\uB2EC\uAC40",
      es: "huevo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-154",
      source_index: 154,
      category_id: "food",
      ko: "\uBE75",
      es: "pan",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-155",
      source_index: 155,
      category_id: "food",
      ko: "\uCE58\uC988",
      es: "queso",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-156",
      source_index: 156,
      category_id: "food",
      ko: "\uC6B0\uC720",
      es: "leche",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-157",
      source_index: 157,
      category_id: "food",
      ko: "\uC544\uC774\uC2A4\uD06C\uB9BC",
      es: "helado",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-158",
      source_index: 158,
      category_id: "food",
      ko: "\uCF00\uC774\uD06C",
      es: "pastel",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-159",
      source_index: 159,
      category_id: "food",
      ko: "\uCFE0\uD0A4",
      es: "galleta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-160",
      source_index: 160,
      category_id: "food",
      ko: "\uC0AC\uACFC",
      es: "manzana",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-161",
      source_index: 161,
      category_id: "food",
      ko: "\uC624\uB80C\uC9C0",
      es: "naranja",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-162",
      source_index: 162,
      category_id: "food",
      ko: "\uB9DD\uACE0",
      es: "mango",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-163",
      source_index: 163,
      category_id: "food",
      ko: "\uBC14\uB098\uB098",
      es: "guineo",
      aliases: {
        ko: [],
        es: [
          "banana",
          "banano"
        ]
      },
      provenance: "existing"
    },
    {
      id: "legacy-164",
      source_index: 164,
      category_id: "food",
      ko: "\uD328\uC158\uD504\uB8E8\uD2B8",
      es: "chinola",
      aliases: {
        ko: [],
        es: [
          "maracuy\xE1"
        ]
      },
      provenance: "existing"
    },
    {
      id: "legacy-165",
      source_index: 165,
      category_id: "food",
      ko: "\uD30C\uC778\uC560\uD50C",
      es: "pi\xF1a",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-166",
      source_index: 166,
      category_id: "food",
      ko: "\uC544\uBCF4\uCE74\uB3C4",
      es: "aguacate",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-167",
      source_index: 167,
      category_id: "food",
      ko: "\uD1A0\uB9C8\uD1A0",
      es: "tomate",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-168",
      source_index: 168,
      category_id: "food",
      ko: "\uC625\uC218\uC218",
      es: "ma\xEDz",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-169",
      source_index: 169,
      category_id: "food",
      ko: "\uB2F9\uADFC",
      es: "zanahoria",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-170",
      source_index: 170,
      category_id: "food",
      ko: "\uAC10\uC790",
      es: "papa",
      aliases: {
        ko: [],
        es: [
          "patata"
        ]
      },
      provenance: "existing"
    },
    {
      id: "legacy-171",
      source_index: 171,
      category_id: "food",
      ko: "\uC591\uD30C",
      es: "cebolla",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-172",
      source_index: 172,
      category_id: "food",
      ko: "\uACE0\uCD94",
      es: "aj\xED",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-173",
      source_index: 173,
      category_id: "food",
      ko: "\uB808\uBAAC",
      es: "lim\xF3n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-174",
      source_index: 174,
      category_id: "food",
      ko: "\uD3EC\uB3C4",
      es: "uva",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-175",
      source_index: 175,
      category_id: "food",
      ko: "\uB538\uAE30",
      es: "fresa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-176",
      source_index: 176,
      category_id: "food",
      ko: "\uC218\uBC15",
      es: "sand\xEDa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-177",
      source_index: 177,
      category_id: "food",
      ko: "\uCF54\uCF54\uB11B",
      es: "coco rallado",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-178",
      source_index: 178,
      category_id: "life_hobbies",
      ko: "\uCD95\uAD6C",
      es: "f\xFAtbol",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-179",
      source_index: 179,
      category_id: "life_hobbies",
      ko: "\uB18D\uAD6C",
      es: "baloncesto",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-180",
      source_index: 180,
      category_id: "life_hobbies",
      ko: "\uC57C\uAD6C",
      es: "b\xE9isbol",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-181",
      source_index: 181,
      category_id: "life_hobbies",
      ko: "\uD14C\uB2C8\uC2A4",
      es: "tenis",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-182",
      source_index: 182,
      category_id: "life_hobbies",
      ko: "\uC218\uC601",
      es: "nataci\xF3n",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-183",
      source_index: 183,
      category_id: "life_hobbies",
      ko: "\uB2EC\uB9AC\uAE30",
      es: "carrera",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-184",
      source_index: 184,
      category_id: "life_hobbies",
      ko: "\uCDA4",
      es: "baile",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-185",
      source_index: 185,
      category_id: "life_hobbies",
      ko: "\uB09A\uC2DC",
      es: "pesca",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-186",
      source_index: 186,
      category_id: "life_hobbies",
      ko: "\uC5F0",
      es: "chichigua",
      aliases: {
        ko: [],
        es: [
          "cometa"
        ]
      },
      provenance: "existing"
    },
    {
      id: "legacy-187",
      source_index: 187,
      category_id: "life_hobbies",
      ko: "\uC120\uBB3C",
      es: "regalo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-188",
      source_index: 188,
      category_id: "life_hobbies",
      ko: "\uC0DD\uC77C \uCF00\uC774\uD06C",
      es: "pastel de cumplea\xF1os",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-189",
      source_index: 189,
      category_id: "life_hobbies",
      ko: "\uC591\uCD08",
      es: "vela",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-190",
      source_index: 190,
      category_id: "life_hobbies",
      ko: "\uC655\uAD00",
      es: "corona",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-191",
      source_index: 191,
      category_id: "life_hobbies",
      ko: "\uB9C8\uC2A4\uD06C",
      es: "m\xE1scara",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "legacy-192",
      source_index: 192,
      category_id: "life_hobbies",
      ko: "\uD48D\uC120",
      es: "globo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "existing"
    },
    {
      id: "animals-extra-001",
      category_id: "animals",
      ko: "\uB099\uD0C0",
      es: "camello",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "animals-extra-002",
      category_id: "animals",
      ko: "\uCF54\uBFD4\uC18C",
      es: "rinoceronte",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "animals-extra-003",
      category_id: "animals",
      ko: "\uD558\uB9C8",
      es: "hipop\xF3tamo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "animals-extra-004",
      category_id: "animals",
      ko: "\uBB3C\uAC1C",
      es: "foca",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "animals-extra-005",
      category_id: "animals",
      ko: "\uCE74\uBA5C\uB808\uC628",
      es: "camale\xF3n",
      aliases: {
        ko: [],
        es: [
          "lagarto camale\xF3n"
        ]
      },
      provenance: "added"
    },
    {
      id: "animals-extra-006",
      category_id: "animals",
      ko: "\uBC15\uC950",
      es: "murci\xE9lago",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "animals-extra-007",
      category_id: "animals",
      ko: "\uD64D\uD559",
      es: "flamenco",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "animals-extra-008",
      category_id: "animals",
      ko: "\uC218\uB2EC",
      es: "nutria",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-001",
      category_id: "food",
      ko: "\uB3C4\uB11B",
      es: "dona",
      aliases: {
        ko: [],
        es: [
          "rosquilla",
          "donut",
          "d\xF3nut"
        ]
      },
      provenance: "added"
    },
    {
      id: "food-extra-002",
      category_id: "food",
      ko: "\uD32C\uCF00\uC774\uD06C",
      es: "panqueque",
      aliases: {
        ko: [],
        es: [
          "pancake",
          "hotcake"
        ]
      },
      provenance: "added"
    },
    {
      id: "food-extra-003",
      category_id: "food",
      ko: "\uD31D\uCF58",
      es: "palomitas",
      aliases: {
        ko: [],
        es: [
          "rosetas de ma\xEDz",
          "popcorn"
        ]
      },
      provenance: "added"
    },
    {
      id: "food-extra-004",
      category_id: "food",
      ko: "\uCD08\uCF5C\uB9BF",
      es: "chocolate",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-005",
      category_id: "food",
      ko: "\uD30C\uC2A4\uD0C0",
      es: "pasta",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-006",
      category_id: "food",
      ko: "\uD0C0\uCF54",
      es: "taco",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-007",
      category_id: "food",
      ko: "\uC5E0\uD30C\uB098\uB2E4",
      es: "empanada",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-008",
      category_id: "food",
      ko: "\uC218\uD504",
      es: "sopa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-009",
      category_id: "food",
      ko: "\uB9DD\uAD6C",
      es: "mang\xFA",
      aliases: {
        ko: [],
        es: [
          "mangu"
        ]
      },
      provenance: "added"
    },
    {
      id: "food-extra-010",
      category_id: "food",
      ko: "\uBAA8\uD401\uACE0",
      es: "mofongo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-011",
      category_id: "food",
      ko: "\uC0B0\uCF54\uCD08",
      es: "sancocho",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-012",
      category_id: "food",
      ko: "\uD1A0\uC2A4\uD1A4",
      es: "tostones",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "food-extra-013",
      category_id: "food",
      ko: "\uC720\uCE74\uD280\uAE40",
      es: "yuca frita",
      aliases: {
        ko: [],
        es: [
          "fritura de yuca"
        ]
      },
      provenance: "added"
    },
    {
      id: "food-extra-014",
      category_id: "food",
      ko: "\uC694\uAD6C\uB974\uD2B8",
      es: "yogur",
      aliases: {
        ko: [],
        es: [
          "yogurt"
        ]
      },
      provenance: "added"
    },
    {
      id: "food-extra-015",
      category_id: "food",
      ko: "\uCEE4\uD53C",
      es: "caf\xE9",
      aliases: {
        ko: [],
        es: [
          "cafe"
        ]
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-001",
      category_id: "nature_space",
      ko: "\uC9C0\uAD6C",
      es: "planeta Tierra",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-002",
      category_id: "nature_space",
      ko: "\uD1A0\uC131",
      es: "Saturno",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-003",
      category_id: "nature_space",
      ko: "\uC6B0\uC8FC\uC120",
      es: "nave espacial",
      aliases: {
        ko: [],
        es: [
          "astronave"
        ]
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-004",
      category_id: "nature_space",
      ko: "\uC6B0\uC8FC\uBE44\uD589\uC0AC",
      es: "astronauta",
      aliases: {
        ko: [],
        es: [
          "cosmonauta"
        ]
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-005",
      category_id: "nature_space",
      ko: "\uBCC4\uB625\uBCC4",
      es: "estrella fugaz",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-006",
      category_id: "nature_space",
      ko: "\uB2EC \uAE30\uC9C0",
      es: "base lunar",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-007",
      category_id: "nature_space",
      ko: "\uC0B0\uD638\uCD08",
      es: "arrecife de coral",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-008",
      category_id: "nature_space",
      ko: "\uB208\uC0AC\uD0DC",
      es: "avalancha",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-009",
      category_id: "nature_space",
      ko: "\uB3C4\uD1A0\uB9AC",
      es: "bellota",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-010",
      category_id: "nature_space",
      ko: "\uC774\uB07C",
      es: "musgo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-011",
      category_id: "nature_space",
      ko: "\uD30C\uB3C4",
      es: "ola",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-012",
      category_id: "nature_space",
      ko: "\uBE59\uC0B0",
      es: "t\xE9mpano de hielo",
      aliases: {
        ko: [],
        es: [
          "t\xE9mpano",
          "iceberg"
        ]
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-013",
      category_id: "nature_space",
      ko: "\uC131\uC6B4",
      es: "nebulosa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-014",
      category_id: "nature_space",
      ko: "\uD1A0\uC591",
      es: "suelo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-015",
      category_id: "nature_space",
      ko: "\uC120\uC778\uC7A5 \uAF43",
      es: "flor de cactus",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "nature_space-extra-016",
      category_id: "nature_space",
      ko: "\uC870\uAC1C\uAECD\uB370\uAE30",
      es: "concha marina",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-001",
      category_id: "places",
      ko: "\uBC15\uBB3C\uAD00",
      es: "museo",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-002",
      category_id: "places",
      ko: "\uD638\uD154",
      es: "hotel",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-003",
      category_id: "places",
      ko: "\uACBD\uCC30\uC11C",
      es: "comisar\xEDa",
      aliases: {
        ko: [],
        es: [
          "cuartel de polic\xEDa"
        ]
      },
      provenance: "added"
    },
    {
      id: "places-extra-004",
      category_id: "places",
      ko: "\uC740\uD589",
      es: "banco",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-005",
      category_id: "places",
      ko: "\uADF9\uC7A5",
      es: "teatro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-006",
      category_id: "places",
      ko: "\uAD81\uC804",
      es: "palacio",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-007",
      category_id: "places",
      ko: "\uBD84\uC218",
      es: "fuente",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-008",
      category_id: "places",
      ko: "\uC9C0\uD558\uCCA0\uC5ED",
      es: "estaci\xF3n de metro",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-009",
      category_id: "places",
      ko: "\uB3D9\uB124 \uC2DD\uB8CC\uD488\uC810",
      es: "colmado",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-010",
      category_id: "places",
      ko: "\uC57C\uC2DC\uC7A5",
      es: "mercado nocturno",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-011",
      category_id: "places",
      ko: "\uAE30\uB150\uBE44",
      es: "monumento",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-012",
      category_id: "places",
      ko: "\uACBD\uAE30\uC7A5",
      es: "estadio",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-013",
      category_id: "places",
      ko: "\uD130\uB110",
      es: "t\xFAnel",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "places-extra-014",
      category_id: "places",
      ko: "\uC218\uB3C4\uC6D0",
      es: "monasterio",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "transport-extra-001",
      category_id: "transport",
      ko: "\uAD6C\uAE09\uCC28",
      es: "ambulancia",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "transport-extra-002",
      category_id: "transport",
      ko: "\uACBD\uCC30\uCC28",
      es: "coche patrulla",
      aliases: {
        ko: [],
        es: [
          "patrulla",
          "veh\xEDculo policial"
        ]
      },
      provenance: "added"
    },
    {
      id: "transport-extra-003",
      category_id: "transport",
      ko: "\uC18C\uBC29\uCC28",
      es: "cami\xF3n de bomberos",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "transport-extra-004",
      category_id: "transport",
      ko: "\uC7A0\uC218\uD568",
      es: "submarino",
      aliases: {
        ko: [],
        es: [
          "sumergible"
        ]
      },
      provenance: "added"
    },
    {
      id: "transport-extra-005",
      category_id: "transport",
      ko: "\uC694\uD2B8",
      es: "yate",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "transport-extra-006",
      category_id: "transport",
      ko: "\uCE74\uB204",
      es: "canoa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "transport-extra-007",
      category_id: "transport",
      ko: "\uCF00\uC774\uBE14\uCE74",
      es: "telef\xE9rico",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "transport-extra-008",
      category_id: "transport",
      ko: "\uC804\uB3D9\uD0A5\uBCF4\uB4DC",
      es: "scooter el\xE9ctrico",
      aliases: {
        ko: [],
        es: [
          "patinete el\xE9ctrico"
        ]
      },
      provenance: "added"
    },
    {
      id: "transport-extra-009",
      category_id: "transport",
      ko: "\uC9C0\uD558\uCCA0",
      es: "metro",
      aliases: {
        ko: [],
        es: [
          "tren del metro"
        ]
      },
      provenance: "added"
    },
    {
      id: "transport-extra-010",
      category_id: "transport",
      ko: "\uD2B8\uB7A8",
      es: "tranv\xEDa",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "transport-extra-011",
      category_id: "transport",
      ko: "\uACAC\uC778\uCC28",
      es: "gr\xFAa",
      aliases: {
        ko: [],
        es: [
          "cami\xF3n gr\xFAa"
        ]
      },
      provenance: "added"
    },
    {
      id: "transport-extra-012",
      category_id: "transport",
      ko: "\uD654\uBB3C\uC120",
      es: "buque de carga",
      aliases: {
        ko: [],
        es: [
          "barco de carga"
        ]
      },
      provenance: "added"
    },
    {
      id: "transport-extra-013",
      category_id: "transport",
      ko: "\uD06C\uB8E8\uC988\uC120",
      es: "crucero",
      aliases: {
        ko: [],
        es: [
          "barco crucero"
        ]
      },
      provenance: "added"
    },
    {
      id: "transport-extra-014",
      category_id: "transport",
      ko: "\uB4DC\uB860",
      es: "dron",
      aliases: {
        ko: [],
        es: [
          "drone"
        ]
      },
      provenance: "added"
    },
    {
      id: "transport-extra-015",
      category_id: "transport",
      ko: "\uC9C0\uAC8C\uCC28",
      es: "montacargas",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-001",
      category_id: "life_hobbies",
      ko: "\uBC30\uB0AD",
      es: "mochila",
      aliases: {
        ko: [],
        es: [
          "bulto"
        ]
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-002",
      category_id: "life_hobbies",
      ko: "\uCE6B\uC194",
      es: "cepillo de dientes",
      aliases: {
        ko: [],
        es: [
          "cepillo dental"
        ]
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-003",
      category_id: "life_hobbies",
      ko: "\uC57C\uAD6C \uBAA8\uC790",
      es: "gorra de b\xE9isbol",
      aliases: {
        ko: [],
        es: [
          "gorra"
        ]
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-004",
      category_id: "life_hobbies",
      ko: "\uC2E0\uBC1C",
      es: "zapato",
      aliases: {
        ko: [],
        es: [
          "zapatos"
        ]
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-005",
      category_id: "life_hobbies",
      ko: "\uC30D\uC548\uACBD",
      es: "binoculares",
      aliases: {
        ko: [],
        es: [
          "prism\xE1ticos"
        ]
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-006",
      category_id: "life_hobbies",
      ko: "\uC8FC\uC0AC\uC704",
      es: "dado",
      aliases: {
        ko: [],
        es: [
          "dados"
        ]
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-007",
      category_id: "life_hobbies",
      ko: "\uD37C\uC990",
      es: "rompecabezas",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-008",
      category_id: "life_hobbies",
      ko: "\uBC30\uAD6C\uACF5",
      es: "bal\xF3n de voleibol",
      aliases: {
        ko: [],
        es: [
          "pelota de voleibol"
        ]
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-009",
      category_id: "life_hobbies",
      ko: "\uD14C\uB2C8\uC2A4 \uB77C\uCF13",
      es: "raqueta de tenis",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-010",
      category_id: "life_hobbies",
      ko: "\uC2A4\uD0A4",
      es: "esqu\xED",
      aliases: {
        ko: [],
        es: [
          "esqu\xEDs",
          "esqu\xEDes"
        ]
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-011",
      category_id: "life_hobbies",
      ko: "\uD604\uBBF8\uACBD",
      es: "microscopio",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    },
    {
      id: "life_hobbies-extra-012",
      category_id: "life_hobbies",
      ko: "\uBCA0\uAC1C",
      es: "almohada",
      aliases: {
        ko: [],
        es: []
      },
      provenance: "added"
    }
  ]
};

// src/games/catchmindTopics.ts
var catchmindCategories = catchmind_topic_dictionary_default.categories.map(({ id, label: label5 }) => ({ id, label: label5 }));
var catchmindTopicWords = catchmind_topic_dictionary_default.words;

// src/games/catchmind.ts
var label2 = (ko, es, action) => ({ label: { ko, es }, action });
function isPlayer2(p) {
  return p === "p1" || p === "p2";
}
function norm(v) {
  return v.normalize("NFC").toLowerCase().trim();
}
function answers(c) {
  return [c.ko, c.es, ...c.aliases?.ko ?? [], ...c.aliases?.es ?? []].map(norm);
}
function localeAnswers(c, locale) {
  return [c[locale], ...c.aliases?.[locale] ?? []].map(norm);
}
var defaultSettings = () => ({ category_id: null, drawTimeSeconds: 80, rounds: 6, choices: 3, hints: 2, customWords: [], customOnly: false });
function uniqueConcepts(concepts) {
  const seen = { ko: /* @__PURE__ */ new Set(), es: /* @__PURE__ */ new Set() };
  return concepts.filter((concept) => {
    const keys = { ko: localeAnswers(concept, "ko"), es: localeAnswers(concept, "es") };
    if (keys.ko.some((key) => !key || seen.ko.has(key)) || keys.es.some((key) => !key || seen.es.has(key))) return false;
    keys.ko.forEach((key) => seen.ko.add(key));
    keys.es.forEach((key) => seen.es.add(key));
    return true;
  });
}
function dealWords(seed, settings) {
  if (!settings.category_id) return [];
  const categoryWords = catchmindTopicWords.filter((word) => word.category_id === settings.category_id).map(({ ko, es, aliases }) => aliases && (aliases.ko?.length || aliases.es?.length) ? { ko, es, aliases } : { ko, es });
  const source = settings.customOnly ? settings.customWords : [...settings.customWords, ...categoryWords];
  const concepts = shuffle(uniqueConcepts(source), seededRandom(seed));
  return Array.from({ length: settings.rounds }, (_, round) => Array.from({ length: settings.choices }, (_2, choice) => concepts[(round * settings.choices + choice) % concepts.length]));
}
function validSettings(value) {
  if (!value || typeof value !== "object") return false;
  const settings = value;
  if (!catchmindCategories.some((category) => category.id === settings.category_id)) return false;
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
  const base = uniqueConcepts(catchmindTopicWords.filter((word) => word.category_id === settings.category_id));
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
function maskedHint(word, locale) {
  return [...word].map((char) => locale === "ko" ? "\u25A1" : /\p{L}/u.test(char) ? "?" : char).join("");
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
    return { seed, round: 0, drawer: "p1", wordChoices: [], answer: null, strokes: [], fills: [], nextOrder: 0, guesses: [], score: { p1: 0, p2: 0 }, deadlineAt: null, hintStage: 0, settings, phase: "choosing", result: null };
  },
  validateAction(s, p, a) {
    if (!isPlayer2(p)) return "Invalid player";
    if (s.result) return "Game is over";
    if (!a || typeof a.type !== "string") return "Invalid action";
    const payload = a.payload ?? {};
    if (a.type === "settings") return p === "p1" && s.round === 0 && s.phase === "choosing" && Object.hasOwn(s.settings, "category_id") && validSettings(payload.settings) ? null : "Room settings are invalid or locked";
    if (a.type === "choose") return s.phase === "choosing" && p === s.drawer && Number.isInteger(payload.wordId) && payload.wordId >= 0 && payload.wordId < (s.wordChoices[s.round]?.length ?? 0) ? null : "Choose one of the offered words as the drawer";
    if (a.type === "draw") {
      if (s.phase !== "drawing" || p !== s.drawer) return "Only the drawer can draw during an active round";
      const strokes = payload.strokes;
      if (!Array.isArray(strokes) || strokes.length < 1 || strokes.length > 12) return "Send 1 to 12 strokes per batch";
      let physicalStrokes = s.strokes.length;
      const incomingStrokeIds = /* @__PURE__ */ new Set();
      let totalPoints = s.strokes.reduce((sum2, stroke) => sum2 + stroke.points.length, 0);
      let last = s.strokes.at(-1);
      for (const stroke of strokes) {
        if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2 || stroke.points.length > 80) return "Each stroke needs 2 to 80 points";
        if (stroke.points.some((pt) => !pt || typeof pt.x !== "number" || typeof pt.y !== "number" || !Number.isFinite(pt.x) || !Number.isFinite(pt.y) || pt.x < 0 || pt.x > 1 || pt.y < 0 || pt.y > 1)) return "Points must be normalized between 0 and 1";
        if (stroke.color !== void 0 && (typeof stroke.color !== "string" || !/^#[0-9a-f]{6}$/i.test(stroke.color))) return "Invalid stroke color";
        if (stroke.width !== void 0 && (!Number.isFinite(stroke.width) || stroke.width < 1 || stroke.width > 24)) return "Stroke width must be between 1 and 24";
        const hasId = stroke.strokeId !== void 0, hasSegment = stroke.segmentIndex !== void 0;
        if (hasId !== hasSegment || hasId && (typeof stroke.strokeId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(stroke.strokeId) || !Number.isInteger(stroke.segmentIndex) || stroke.segmentIndex < 0 || stroke.segmentIndex > 1e4)) return "Invalid stroke segment";
        if (hasId && stroke.segmentIndex > 0) {
          if (!last || last.strokeId !== stroke.strokeId || last.segmentIndex !== stroke.segmentIndex - 1 || last.color !== (stroke.color ?? "#172033") || last.width !== (stroke.width ?? 3)) return "Stroke segments must be consecutive and keep the same style";
          const first = stroke.points[0], end = last.points.at(-1);
          const overlap = end && Math.round(first.x * 1e3) === Math.round(end.x * 1e3) && Math.round(first.y * 1e3) === Math.round(end.y * 1e3);
          totalPoints += stroke.points.length - (overlap ? 1 : 0);
          last = { ...last, segmentIndex: stroke.segmentIndex, points: [...last.points, ...overlap ? stroke.points.slice(1) : stroke.points] };
        } else {
          if (hasId && (incomingStrokeIds.has(stroke.strokeId) || s.strokes.some((item) => item.strokeId === stroke.strokeId))) return "Stroke ID has already been used";
          if (hasId) incomingStrokeIds.add(stroke.strokeId);
          physicalStrokes++;
          totalPoints += stroke.points.length;
          last = hasId ? { strokeId: stroke.strokeId, segmentIndex: stroke.segmentIndex, color: stroke.color ?? "#172033", width: stroke.width ?? 3, points: stroke.points } : void 0;
        }
      }
      if (physicalStrokes > 200) return "Round stroke limit reached";
      if (totalPoints > 4e3) return "Round point limit reached";
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
      settings.customWords = settings.customWords.map(({ ko, es }) => ({ ko: ko.trim(), es: es.trim() }));
      return { ...s, settings, wordChoices: dealWords(s.seed, settings) };
    }
    if (a.type === "choose") return { ...s, answer: s.wordChoices[s.round][a.payload.wordId], strokes: [], fills: [], guesses: [], hintStage: 0, phase: "drawing" };
    if (a.type === "draw") {
      let nextOrder = s.nextOrder;
      const nextStrokes = [...s.strokes];
      for (const st of a.payload.strokes) {
        const points = st.points.map((pt) => ({ x: Math.round(pt.x * 1e3) / 1e3, y: Math.round(pt.y * 1e3) / 1e3 }));
        const last = nextStrokes.at(-1);
        if (last && st.strokeId && st.segmentIndex > 0 && last.strokeId === st.strokeId) {
          const end = last.points.at(-1), first = points[0];
          if (end && first.x === end.x && first.y === end.y) points.shift();
          nextStrokes[nextStrokes.length - 1] = { ...last, points: [...last.points, ...points], segmentIndex: st.segmentIndex };
        } else {
          nextStrokes.push({ by: p, points, color: st.color ?? "#172033", width: st.width ?? 3, order: nextOrder++, ...st.strokeId ? { strokeId: st.strokeId, segmentIndex: st.segmentIndex } : {} });
        }
      }
      return { ...s, strokes: nextStrokes, nextOrder };
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
    if (!s.result && s.phase === "choosing" && p === "p1" && s.round === 0 && Object.hasOwn(s.settings, "category_id")) actions.push(label2("\uBC29 \uC124\uC815", "Ajustes de sala", { type: "settings", payload: { settings: s.settings } }));
    if (!s.result && s.phase === "choosing" && p === s.drawer) (s.wordChoices[s.round] ?? []).forEach((word, wordId) => actions.push(label2(`${word.ko} / ${word.es}`, `${word.es} / ${word.ko}`, { type: "choose", payload: { wordId } })));
    if (!s.result && active && p === s.drawer) actions.push(label2("\uB77C\uC6B4\uB4DC \uC885\uB8CC", "Terminar ronda", { type: "end-round" }), label2("\uD328\uC2A4", "Pasar", { type: "pass" }), label2("\uC2E4\uD589 \uCDE8\uC18C", "Deshacer", { type: "undo" }), label2("\uC804\uCCB4 \uC9C0\uC6B0\uAE30", "Borrar todo", { type: "clear" }), label2("\uCC44\uC6B0\uAE30", "Rellenar", { type: "fill" }));
    if (!s.result && s.phase === "round-over" && p === s.drawer) actions.push(label2("\uB2E4\uC74C \uB77C\uC6B4\uB4DC", "Siguiente ronda", { type: "end-round" }));
    if (!s.result && active && p === guesser) actions.push(label2("\uC815\uB2F5 \uC81C\uCD9C", "Enviar respuesta", { type: "guess", payload: { text: "" } }));
    const visibleGuesses = s.guesses.map((g) => ({ by: g.by, correct: g.correct, text: g.correct ? g.text : "\u2026" }));
    const ownAnswer = p === s.drawer && s.phase === "drawing" ? s.answer : null;
    const visibleSettings = { category_id: s.settings.category_id, categoryOptions: catchmindCategories, drawTimeSeconds: s.settings.drawTimeSeconds, rounds: s.settings.rounds, choices: s.settings.choices, hints: s.settings.hints, customWordCount: s.settings.customWords.length, customOnly: s.settings.customOnly };
    const hintLength = active && s.answer ? { ko: [...s.answer.ko].length, es: [...s.answer.es].length } : null;
    const hintWord = active && p !== s.drawer && s.answer && s.settings.hints ? { ko: maskedHint(s.answer.ko, "ko"), es: maskedHint(s.answer.es, "es") } : null;
    return { game: "catchmind", turn: s.drawer, phase: s.phase, hand: p === s.drawer ? { choices: s.phase === "choosing" ? (s.wordChoices[s.round] ?? []).map((c, wordId) => ({ wordId, ko: c.ko, es: c.es })) : [], answer: ownAnswer, settingsCustomWords: p === "p1" ? structuredClone(s.settings.customWords) : [] } : null, board: { strokes: s.strokes.map((st) => ({ ...st, points: st.points.map((pt) => ({ ...pt })) })), fills: s.fills.map((fill) => ({ ...fill })), guesses: visibleGuesses, round: s.round + 1, totalRounds: s.settings.rounds, drawer: s.drawer, answer: s.phase === "round-over" || s.phase === "finished" ? s.answer : null, hintLength, hintWord, hintStage: s.hintStage, settings: visibleSettings, scores: { ...s.score } }, opponentCount: 0, status: s.result ? "finished" : s.phase === "choosing" ? p === s.drawer ? "choose-word" : "waiting" : active ? p === s.drawer ? "drawing" : "guessing" : "round-over", result: s.result, actions };
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
var allTiles = Array.from({ length: 7 }, (_, a) => Array.from({ length: 7 - a }, (_2, i) => ({ a, b: a + i }))).flat();
var tileId = (tile) => `${Math.min(tile.a, tile.b)}-${Math.max(tile.a, tile.b)}`;
var matches = (tile, pip) => tile.a === pip || tile.b === pip;
function placedEnds(tile, side, current) {
  if (!current) return { left: tile.a, right: tile.b };
  const oriented = side === "left" ? tile.b === current.left ? tile : { a: tile.b, b: tile.a } : tile.a === current.right ? tile : { a: tile.b, b: tile.a };
  return side === "left" ? { left: oriented.a, right: current.right } : { left: current.left, right: oriented.b };
}
function legalMoves(hand, ends) {
  return hand.flatMap((tile, index) => ["left", "right"].filter((side) => legalOrient(tile, side, ends)).map((side) => ({ tile, index, side, ends: placedEnds(tile, side, ends) })));
}
function teamOf(mode, seat) {
  return mode === "partners" ? seat === "p1" || seat === "b1" ? "p1" : "p2" : mode === "humans-vs-bots" ? seat === "p1" || seat === "p2" ? "p1" : "p2" : seat === "p1" ? "p1" : "p2";
}
function following(mode, seat, offset) {
  const order = seats(mode), i = order.indexOf(seat);
  return order[(i + offset) % order.length];
}
function currentRoundEvents(context, board) {
  const log = context.log ?? [], roundStart = log.map((event2) => event2.type).lastIndexOf("round-start");
  const firstBoardSequence = Math.min(...board.map((tile) => tile.sequence ?? Infinity));
  const startSequence = roundStart >= 0 ? log[roundStart].sequence : Number.isFinite(firstBoardSequence) ? firstBoardSequence : Infinity;
  return log.filter((event2) => event2.sequence > startSequence);
}
function passVoids(context, board) {
  const voids = /* @__PURE__ */ new Map();
  for (const event2 of currentRoundEvents(context, board)) if (event2.type === "pass" && event2.actor && event2.ends) {
    const values = voids.get(event2.actor) ?? /* @__PURE__ */ new Set();
    values.add(event2.ends.left);
    values.add(event2.ends.right);
    voids.set(event2.actor, values);
  }
  return voids;
}
function unseenTiles(hand, board) {
  const known = new Set([...hand, ...board].map(tileId));
  return allTiles.filter((tile) => !known.has(tileId(tile)));
}
function probabilityCanPlay(seat, ends, unseen, voids, counts) {
  const forbidden = voids.get(seat) ?? /* @__PURE__ */ new Set();
  const eligible = unseen.filter((tile) => !forbidden.has(tile.a) && !forbidden.has(tile.b));
  const count2 = Math.max(0, Math.min(eligible.length, counts[seat] ?? 0));
  const matching = eligible.filter((tile) => matches(tile, ends.left) || matches(tile, ends.right)).length;
  let none = 1;
  for (let i = 0; i < count2; i++) none *= Math.max(0, eligible.length - matching - i) / Math.max(1, eligible.length - i);
  return 1 - none;
}
function allySignal(ally, ends, context, board, voids) {
  const last = currentRoundEvents(context, board).slice().reverse().find((event2) => event2.type === "play" && event2.actor === ally && event2.tile);
  if (!last?.tile) return 0;
  const allyVoids = voids.get(ally) ?? /* @__PURE__ */ new Set();
  const faces = [last.tile.a, last.tile.b].filter((value, index, values) => values.indexOf(value) === index);
  return faces.some((pip) => (pip === ends.left || pip === ends.right) && !allyVoids.has(pip)) ? 2.2 : 0;
}
function handSupport(hand, ends) {
  return hand.reduce((sum2, tile) => sum2 + Number(matches(tile, ends.left)) + Number(matches(tile, ends.right)), 0);
}
function futureReach(hand, ends) {
  let best = 0;
  for (const first of legalMoves(hand, ends)) {
    const afterFirst = hand.filter((_, index) => index !== first.index);
    const firstSupport = handSupport(afterFirst, first.ends);
    for (const second of legalMoves(afterFirst, first.ends)) {
      const afterSecond = afterFirst.filter((_, index) => index !== second.index);
      const score2 = first.tile.a + first.tile.b + handSupport(afterSecond, second.ends) * 0.65 + firstSupport * 0.2;
      best = Math.max(best, score2);
    }
    best = Math.max(best, first.tile.a + first.tile.b + firstSupport * 0.45);
  }
  return best;
}
function rngFrom(publicText) {
  let state = 2166136261;
  for (let i = 0; i < publicText.length; i++) state = Math.imul(state ^ publicText.charCodeAt(i), 16777619) >>> 0;
  return () => {
    state = Math.imul(state, 1664525) + 1013904223 >>> 0;
    return state / 4294967296;
  };
}
function sampleUnknownHands(unseen, actor, mode, counts, voids, random) {
  const originalSeats = seats(mode).filter((seat) => seat !== actor), needed = new Map(originalSeats.map((seat) => [seat, Math.max(0, counts[seat] ?? 7)]));
  let workBudget = 64;
  const pick = (remaining, pending, result) => {
    if (!pending.length) return result;
    const options = pending.map((seat2) => ({ seat: seat2, eligible: remaining.filter((tile) => {
      const blocked = voids.get(seat2) ?? /* @__PURE__ */ new Set();
      return !blocked.has(tile.a) && !blocked.has(tile.b);
    }) }));
    options.sort((a, b) => a.eligible.length - b.eligible.length);
    const { seat, eligible } = options[0], count2 = needed.get(seat) ?? 0;
    if (eligible.length < count2) return null;
    const restSeats = pending.filter((value) => value !== seat);
    for (let attempt = 0; attempt < 48 && workBudget > 0; attempt++, workBudget--) {
      const shuffled = eligible.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const picked = shuffled.slice(0, count2), pickedIds = new Set(picked.map(tileId)), nextRemaining = remaining.filter((tile) => !pickedIds.has(tileId(tile)));
      if (restSeats.some((other) => nextRemaining.filter((tile) => {
        const blocked = voids.get(other) ?? /* @__PURE__ */ new Set();
        return !blocked.has(tile.a) && !blocked.has(tile.b);
      }).length < (needed.get(other) ?? 0))) continue;
      const next = new Map(result);
      next.set(seat, picked);
      const complete = pick(nextRemaining, restSeats, next);
      if (complete) return complete;
    }
    return null;
  };
  return pick(unseen, originalSeats, /* @__PURE__ */ new Map());
}
function sampledRollout(move, hand, actor, mode, board, ends, context, sampled) {
  const hands = { p1: [], p2: [], b1: [], b2: [] };
  hands[actor] = hand.slice();
  for (const [seat, tiles] of sampled) hands[seat] = tiles.slice();
  const known = new Set([...hand, ...board, ...Array.from(sampled.values()).flat()].map(tileId));
  let state = { seed: 0, turn: actor, mode, hands, stock: allTiles.filter((tile) => !known.has(tileId(tile))), board: board.map((tile) => ({ ...tile })), ends: ends ? { ...ends } : null, passes: context.passes ?? 0, opening: { player: actor, tile: move.tile }, result: null, rulesVersion: 1, settings: { ...DEFAULT_SETTINGS, tranqueRule: context.tranqueRule ?? "team" }, matchScores: { p1: 0, p2: 0 }, round: 1, roundResult: null, log: (context.log ?? []).slice(), lastPlacer: board.at(-1)?.by ?? null, pasoAwarded: currentRoundEvents(context, board).some((event2) => event2.type === "paso-corrido"), roundBonuses: { p1: 0, p2: 0 } };
  state = play(state, actor, { type: "play", payload: { index: move.index, side: move.side } });
  for (let step2 = 0; step2 < 60 && !state.roundResult && !state.result; step2++) {
    const seat = state.turn, seatHand = state.hands[seat], moves = legalMoves(seatHand, state.ends);
    let chosen, chosenScore = -Infinity;
    for (const candidate of moves) {
      const rank = utility(candidate, seatHand, state.board, state.ends, {}, "normal", [], /* @__PURE__ */ new Map());
      if (rank > chosenScore) {
        chosen = candidate;
        chosenScore = rank;
      }
    }
    const action = chosen ? { type: "play", payload: { index: chosen.index, side: chosen.side } } : { type: "pass" };
    state = play(state, seat, action);
  }
  const result = state.roundResult;
  if (!result) return 0;
  if (result.winner === "draw") return 0;
  const ownTeam = teamOf(mode, actor), other = ownTeam === "p1" ? "p2" : "p1", margin = (result.pips[other] - result.pips[ownTeam]) * 1e-3;
  return result.winner === ownTeam ? 1 + margin : -1 - margin;
}
function hardRolloutWorlds(hand, actor, mode, board, context, unseen, voids) {
  const text = JSON.stringify({ actor, mode, hand: hand.map(tileId).sort(), board: board.map((tile) => [tile.a, tile.b, tile.by, tile.sequence]), counts: context.counts, passes: context.passes, log: currentRoundEvents(context, board).map((event2) => [event2.sequence, event2.type, event2.actor, event2.ends]) });
  const random = rngFrom(text), worlds = [];
  for (let i = 0; i < 16; i++) {
    const world = sampleUnknownHands(unseen, actor, mode, context.counts ?? {}, voids, random);
    if (world) worlds.push(world);
  }
  return worlds;
}
function hardRolloutScore(move, hand, actor, mode, board, ends, context, worlds) {
  if (!worlds.length) return 0;
  return worlds.reduce((total, world) => total + sampledRollout(move, hand, actor, mode, board, ends, context, world), 0) / worlds.length;
}
function utility(move, hand, board, ends, context, difficulty, unseen, voids) {
  const rest = hand.filter((_, index) => index !== move.index), pips = move.tile.a + move.tile.b;
  if (!rest.length) return 1e6 + pips + (move.tile.a === move.tile.b ? move.tile.a : 0);
  const support = handSupport(rest, move.ends), leftSupport = rest.filter((tile) => matches(tile, move.ends.left)).length, rightSupport = rest.filter((tile) => matches(tile, move.ends.right)).length;
  let score2 = pips * (difficulty === "easy" ? 0.72 : 1.05) + (move.tile.a === move.tile.b ? 0.8 + move.tile.a * 0.12 : 0) + support * (difficulty === "easy" ? 0.55 : difficulty === "normal" ? 1.05 : 2.25);
  score2 -= Number(leftSupport === 0) * 0.7 + Number(rightSupport === 0) * 0.7;
  if (difficulty !== "hard") return score2;
  const actor = context.actor, mode = context.mode ?? "1v1", counts = context.counts ?? {};
  if (!actor) return score2 + futureReach(rest, move.ends) * 0.55;
  const ownTeam = teamOf(mode, actor), near = Math.min(2, seats(mode).length - 1);
  for (let offset = 1; offset <= near; offset++) {
    const next = following(mode, actor, offset), sameTeam = teamOf(mode, next) === ownTeam;
    const canPlay = probabilityCanPlay(next, move.ends, unseen, voids, counts);
    const count2 = counts[next] ?? 7;
    const weight = count2 <= 1 ? 11 : count2 <= 2 ? 8 : count2 <= 3 ? 5 : 3;
    score2 += sameTeam ? canPlay * (offset === 1 ? 3.2 : 1.1) : -canPlay * weight * (offset === 1 ? 1 : 0.52);
    if (sameTeam && offset === 1) score2 += allySignal(next, move.ends, context, board, voids);
  }
  score2 += futureReach(rest, move.ends) * 0.2;
  return score2;
}
function chooseDominoBotAction(hand, board, ends, difficulty = "normal", publicContext = {}) {
  const moves = legalMoves(hand, ends);
  if (!moves.length) return { type: "pass" };
  if (moves.length === 1) return { type: "play", payload: { index: moves[0].index, side: moves[0].side } };
  const handOut = moves.find((move) => hand.length === 1);
  if (handOut) return { type: "play", payload: { index: handOut.index, side: handOut.side } };
  const unseen = difficulty === "hard" ? unseenTiles(hand, board) : [], voids = difficulty === "hard" ? passVoids(publicContext, board) : /* @__PURE__ */ new Map();
  const worlds = difficulty === "hard" && publicContext.actor ? hardRolloutWorlds(hand, publicContext.actor, publicContext.mode ?? "1v1", board, publicContext, unseen, voids) : [];
  const ranked = moves.map((move, index) => ({ move, index, score: utility(move, hand, board, ends, publicContext, difficulty, unseen, voids) }));
  if (difficulty === "hard" && publicContext.actor && worlds.length) {
    const candidates = ranked.slice().sort((a, b) => b.score - a.score || a.index - b.index).slice(0, Math.min(3, ranked.length));
    for (const candidate of candidates) candidate.score += hardRolloutScore(candidate.move, hand, publicContext.actor, publicContext.mode ?? "1v1", board, ends, publicContext, worlds) * 30;
  }
  const best = ranked.reduce((chosen, item) => item.score > chosen.score ? item : chosen, ranked[0]).move;
  return { type: "play", payload: { index: best.index, side: best.side } };
}
function botAction(s, seat) {
  if (!s.board.length && seat === s.opening.player) {
    const index = s.hands[seat].findIndex((t) => t.a === s.opening.tile.a && t.b === s.opening.tile.b);
    return { type: "play", payload: { index, side: "left" } };
  }
  return chooseDominoBotAction(s.hands[seat], s.board, s.ends, s.settings?.difficulty ?? "normal", { actor: seat, mode: s.mode, passes: s.passes, counts: Object.fromEntries(seats(s.mode).map((x) => [x, s.hands[x].length])), log: s.log, tranqueRule: s.settings?.tranqueRule });
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
function matches2(table, card2) {
  return table.flatMap((c, index) => c.month === card2.month ? [index] : []);
}
function resolveCaptured(table, captures, card2, targetIndex) {
  const indices = matches2(table, card2);
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
  const [drawn, ...deck] = s.deck, indices = matches2(table, drawn);
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
    const matchesForCard = matches2(s.table, s.hands[p][Number(index)]);
    if (matchesForCard.length === 2 && (!Number.isInteger(target) || !matchesForCard.includes(Number(target)))) return "Choose one matching table card";
    if (matchesForCard.length !== 2 && target !== void 0) return "A target is only needed for a duplicate month";
    return null;
  }
  if (a.type === "capture") {
    if (s.phase !== "capture-draw" || !s.pending) return "No pending capture";
    const target = a.payload?.targetIndex, found = matches2(s.table, s.pending.card);
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
  const handIndex = Number(a.payload.index), card2 = hands[p].splice(handIndex, 1)[0], indices = matches2(table, card2);
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
      const targetIndices = matches2(s.table, card2);
      if (targetIndices.length === 2) targetIndices.forEach((targetIndex) => actions.push(actionLabel(`${card2.month}\uC6D4 ${card2.badge.ko} \u2192 \uBC14\uB2E5 ${targetIndex + 1}\uBC88`, `Mes ${card2.month} ${card2.badge.es} \u2192 mesa ${targetIndex + 1}`, { type: "play", payload: { index, targetIndex } })));
      else actions.push(actionLabel(`${card2.month}\uC6D4 ${card2.badge.ko} \uB0B4\uAE30`, `Jugar mes ${card2.month} ${card2.badge.es}`, { type: "play", payload: { index } }));
    });
    if (!s.result && s.turn === p && s.phase === "capture-draw" && s.pending) matches2(s.table, s.pending.card).forEach((targetIndex) => actions.push(actionLabel(`${s.pending.card.month}\uC6D4 \uCE74\uB4DC\uC640 \uBC14\uB2E5 ${targetIndex + 1}\uBC88 \uAC00\uC838\uC624\uAE30`, `Capturar mes ${s.pending.card.month} con mesa ${targetIndex + 1}`, { type: "capture", payload: { targetIndex } })));
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

// src/games/rules.ts
var marbleCreditRules = {
  ko: [
    "\uBAA9\uD45C \u2014 \uC790\uCCB4 \uBD80\uB3D9\uC0B0 \uAC8C\uC784 \uADDC\uCE59\uC785\uB2C8\uB2E4. \uC0C1\uB300\uAC00 \uD30C\uC0B0\uD558\uBA74 \uC774\uAE30\uACE0, 120\uD134 \uB4A4\uC5D0\uB294 \uD604\uAE08+\uB3C4\uC2DC \uB9E4\uC785\uAC00+\uAC74\uC124 \uBE44\uC6A9\u2212\uBBF8\uC0C1\uD658 \uB300\uCD9C\uC744 \uD569\uCE5C \uC21C\uC790\uC0B0\uC744 \uBE44\uAD50\uD569\uB2C8\uB2E4.",
    "\uB9D0\uACFC \uC774\uB3D9 \u2014 \uCCAB \uC8FC\uC0AC\uC704\uB97C \uAD74\uB9AC\uAE30 \uC804\uC5D0 \uC6D0\uD558\uB294 \uB9D0\uC744 \uACE0\uB985\uB2C8\uB2E4. \uC0C1\uB300\uC640 \uAC19\uC740 \uB9D0\uC740 \uC120\uD0DD\uD560 \uC218 \uC5C6\uACE0 \uCCAB \uC774\uB3D9 \uB4A4\uC5D0\uB294 \uACE0\uC815\uB429\uB2C8\uB2E4. \uB450 \uC8FC\uC0AC\uC704 \uD569\uB9CC\uD07C 40\uCE78 \uBCF4\uB4DC\uB97C \uC774\uB3D9\uD558\uBA70 \uCD9C\uBC1C\uC810\uC744 \uC9C0\uB098\uBA74 200\uC744 \uBC1B\uC2B5\uB2C8\uB2E4. \uAD11\uC8FC\uC640 \uC0B0\uD1A0\uB3C4\uBC0D\uACE0\uB97C \uD3EC\uD568\uD574 24\uAC1C \uB3C4\uC2DC\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
    "\uB3C4\uC2DC\uC640 \uAC74\uC124 \u2014 \uBE48 \uB3C4\uC2DC\uB97C \uAD6C\uB9E4\uD558\uAC70\uB098 \uC9C0\uB098\uAC11\uB2C8\uB2E4. \uB0B4 \uB3C4\uC2DC\uC5D0\uB294 \uC0C9\uC0C1 \uB3C4\uC2DC\uAD70 \uC644\uC131 \uC5EC\uBD80\uC640 \uAD00\uACC4\uC5C6\uC774 \uBCC4\uC7A5\u2192\uBE4C\uB529\u2192\uB79C\uB4DC\uB9C8\uD06C\uB97C \uC21C\uC11C\uB300\uB85C \uC9C0\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB2E8\uACC4\uB9C8\uB2E4 100, \uD1B5\uD589\uB8CC\uB294 \uAE30\uBCF8\uC758 2\uBC30\u21924\uBC30\u21928\uBC30\uC785\uB2C8\uB2E4. \uC0C1\uB300 \uB3C4\uC2DC\uC758 \uD1B5\uD589\uB8CC\uB294 \uC790\uB3D9 \uC9C0\uAE09\uB429\uB2C8\uB2E4.",
    "\uB300\uCD9C \u2014 \uC790\uAE30 \uCC28\uB840\uC5D0 \uBBF8\uC0C1\uD658 \uB300\uCD9C\uC774 \uC5C6\uC73C\uBA74 300\uC744 \uBC1B\uC744 \uC218 \uC788\uACE0, \uC0C1\uD658\uC561\uC740 330\uC785\uB2C8\uB2E4. \uCD94\uAC00 \uC774\uC790\uB098 \uB9CC\uAE30\uB294 \uC5C6\uC2B5\uB2C8\uB2E4. \uC9C0\uAE09 \uC704\uAE30 \uC678\uC758 \uC790\uAE30 \uCC28\uB840\uC5D0 330 \uC804\uC561\uC744 \uC0C1\uD658\uD569\uB2C8\uB2E4. \uBBF8\uC0C1\uD658\uC561\uC740 \uC21C\uC790\uC0B0\uC5D0\uC11C \uBE7C\uBA70, \uC0C1\uD658 \uD6C4 \uB2E4\uC2DC \uBE4C\uB824\uB3C4 \uB9E4\uBC88 30\uC758 \uBE44\uC6A9\uC774 \uBC1C\uC0DD\uD569\uB2C8\uB2E4.",
    "\uC9C0\uAE09 \uC704\uAE30 \u2014 \uD1B5\uD589\uB8CC\xB7\uC138\uAE08\xB7\uCE74\uB4DC \uBE44\uC6A9\uC744 \uB0BC \uD604\uAE08\uC774 \uBD80\uC871\uD558\uBA74 \uD589\uB3D9\uC774 \uBA48\uCDA5\uB2C8\uB2E4. \uD604\uC7AC \uD604\uAE08+300\uC73C\uB85C \uC9C0\uAE09\uC561\uC744 \uCDA9\uB2F9\uD560 \uC218 \uC788\uACE0 \uAE30\uC874 \uB300\uCD9C\uC774 \uC5C6\uC744 \uB54C\uB9CC \uB300\uCD9C\uB85C \uD574\uACB0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB300\uCD9C\uC744 \uC120\uD0DD\uD558\uBA74 \uD574\uB2F9 \uC9C0\uAE09\uC744 \uD55C \uBC88 \uCC98\uB9AC\uD558\uACE0 \uC6D0\uB798 \uCC28\uB840\uB85C \uB3CC\uC544\uAC11\uB2C8\uB2E4. \uD30C\uC0B0 \uC778\uC815\uC740 \uACBD\uAE30 \uC885\uB8CC\uB97C \uB73B\uD558\uBA70 \uB3C4\uC2DC \uC790\uB3D9 \uB9E4\uAC01\uC740 \uC5C6\uC2B5\uB2C8\uB2E4.",
    "\uD669\uAE08\uC5F4\uC1E0 \u2014 13\uC885 \uCE74\uB4DC\uB294 \uC0C1\uAE08(150\xB7200\xB780), \uC5EC\uD589\uBE44 100, \uAC74\uC124 \uB2E8\uACC4\uB2F9 \uC218\uB9AC\uBE44 40, \uC0B0\uD1A0\uB3C4\uBC0D\uACE0 \uBC29\uBB38, \uCD9C\uBC1C \uC774\uB3D9(+200), \uC138 \uCE78 \uD6C4\uD1F4, \uBB34\uC778\uB3C4 \uC774\uB3D9, \uD0C8\uCD9C\uAD8C, \uBB34\uB8CC \uC5F4\uCC28\uD45C, \uB3C4\uC2DC\uB2F9 \uBC30\uB2F9 30, \uB3C5\uC810 \uACBD\uACE0\uC785\uB2C8\uB2E4. \uC774\uB3D9 \uCE74\uB4DC\uC758 \uB3C4\uCC29 \uD6A8\uACFC\uB3C4 \uC801\uC6A9\uB418\uBA70 \uC138 \uCE78 \uD6C4\uD1F4\uC5D0\uB294 \uCD9C\uBC1C \uBCF4\uB108\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    "\uB3C5\uC810 \uACBD\uACE0 \u2014 \uAC19\uC740 \uC0C9\uC758 \uB3C4\uC2DC\uB97C \uBAA8\uB450 \uAC00\uC9C4 \uB3C4\uC2DC\uAD70\uC774 \uAC00\uC7A5 \uB9CE\uC740 \uC0AC\uB78C\uC774 \uB3C4\uC2DC\uAD70\uB2F9 100, \uCD5C\uB300 300\uC744 \uC740\uD589\uC5D0 \uB0C5\uB2C8\uB2E4. \uB3D9\uB960\uC774\uBA74 \uCE74\uB4DC\uB97C \uBF51\uC740 \uC0AC\uB78C\uC5D0\uAC8C \uC801\uC6A9\uB429\uB2C8\uB2E4. \uB204\uAD6C\uB3C4 \uC644\uC131\uD55C \uB3C4\uC2DC\uAD70\uC774 \uC5C6\uC73C\uBA74 \uBE44\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB3C4\uC2DC\uAD70 \uC644\uC131 \uC790\uCCB4\uB294 \uC989\uC2DC \uC2B9\uB9AC\uB098 \uD1B5\uD589\uB8CC \uCD94\uAC00 \uBC30\uC218\uAC00 \uC544\uB2D9\uB2C8\uB2E4.",
    "\uBB34\uC778\uB3C4\xB7\uC5F4\uCC28\xB7\uAE30\uAE08 \u2014 \uBB34\uC778\uB3C4\uB294 \uC790\uAE30 \uCC28\uB840 \uC138 \uBC88 \uC815\uC9C0\uC785\uB2C8\uB2E4. \uC30D\uC774\uBA74 \uD0C8\uCD9C\uD574 \uC774\uB3D9\uD558\uACE0, \uC544\uB2C8\uBA74 \uD55C \uCC28\uB840 \uC27D\uB2C8\uB2E4. 100\uC774\uB098 \uD0C8\uCD9C\uAD8C\uC73C\uB85C \uB098\uC640 \uC8FC\uC0AC\uC704\uB97C \uAD74\uB9B4 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4. \uC5ED\uC5D0\uC11C\uB294 \uB2E4\uC74C \uCC28\uB840\uC5D0 \uC6B4\uC784 100\uC73C\uB85C \uB3C4\uC2DC\uB97C \uACE0\uB974\uAC70\uB098 \uAC74\uB108\uB701\uB2C8\uB2E4. \uBB34\uB8CC \uD45C\uB294 \uC6B4\uC784 0\uC785\uB2C8\uB2E4. \uAE30\uAE08 \uB0A9\uBD80 \uCE78\uC5D0 150\uC744 \uB0B4\uBA70 \uC0AC\uD68C\uBCF5\uC9C0\uAE30\uAE08 \uCE78\uC5D0\uC11C \uC313\uC778 \uAE30\uAE08\uC744 \uBC1B\uC2B5\uB2C8\uB2E4."
  ],
  es: [
    "Objetivo \u2014 Usamos reglas propias de un juego de propiedades. Ganas si tu pareja quiebra; despu\xE9s de 120 turnos se compara el patrimonio neto: efectivo + precio de las ciudades + costo de construcci\xF3n \u2212 deuda pendiente.",
    "Figura y movimiento \u2014 Elige una figura antes de lanzar tus primeros dados. No puede ser la misma de tu pareja y queda fija despu\xE9s. Avanza la suma de los dos dados por las 40 casillas. Al pasar por Salida recibes 200. Hay 24 ciudades, incluyendo Gwangju y Santo Domingo.",
    "Ciudades y construcci\xF3n \u2014 Puedes comprar una ciudad libre o pasar. En cualquier ciudad tuya puedes construir villa, edificio y monumento, sin completar un color. Cada nivel cuesta 100 y el alquiler pasa a 2, 4 y 8 veces el valor base. El alquiler rival se paga autom\xE1ticamente.",
    "Pr\xE9stamo \u2014 En tu turno, si no tienes deuda pendiente, puedes recibir 300 y debes devolver 330. No hay intereses adicionales ni fecha de vencimiento. Pagas los 330 completos en tu turno, fuera de una crisis de pago. La deuda se resta del patrimonio; pedir otro pr\xE9stamo despu\xE9s de pagarlo vuelve a costar 30.",
    "Crisis de pago \u2014 Si no tienes efectivo para un alquiler, impuesto o gasto de carta, el juego espera tu decisi\xF3n. Solo puedes resolverlo con un pr\xE9stamo si no debes otro y tu efectivo + 300 cubre el pago. Al pedirlo, el pago se procesa una sola vez y contin\xFAa el turno original. Declarar quiebra termina la partida; las ciudades no se venden autom\xE1ticamente.",
    "Llave dorada \u2014 Las 13 cartas incluyen premios (150, 200 y 80), gasto de viaje 100, mantenimiento 40 por nivel construido, visita a Santo Domingo, viaje a Salida (+200), retroceso de tres casillas, isla, pase de salida, boleto gratis, dividendo 30 por ciudad y advertencia de monopolio. Se aplica tambi\xE9n el efecto del destino; al retroceder no cobras Salida.",
    "Monopolio \u2014 Quien tenga m\xE1s grupos de color completos paga 100 por grupo al banco, hasta 300. En empate paga quien sac\xF3 la carta. Si nadie complet\xF3 un grupo, no se cobra. Completar un color no da una victoria inmediata ni otro multiplicador de alquiler.",
    "Isla, tren y fondo \u2014 La isla te detiene tres turnos propios. Si sacas dobles, sales y avanzas; si no, pierdes un turno. Tambi\xE9n puedes pagar 100 o usar un pase y luego lanzar. La estaci\xF3n permite viajar a una ciudad por 100 en tu pr\xF3ximo turno o pasar el tren. El boleto gratis cuesta 0. El aporte al fondo es 150 y en Fondo Social recibes lo acumulado."
  ]
};
var marbleTieredRules = {
  ko: marbleCreditRules.ko.map((rule, index) => index === 2 ? "\uB3C4\uC2DC\uC640 \uAC74\uC124 \u2014 \uBE48 \uB3C4\uC2DC\uB97C \uAD6C\uB9E4\uD558\uAC70\uB098 \uC9C0\uB098\uAC11\uB2C8\uB2E4. \uB0B4 \uB3C4\uC2DC\uC5D0\uB294 \uC0C9\uC0C1 \uB3C4\uC2DC\uAD70 \uC644\uC131 \uC5EC\uBD80\uC640 \uAD00\uACC4\uC5C6\uC774 \uBCC4\uC7A5\u2192\uBE4C\uB529\u2192\uB79C\uB4DC\uB9C8\uD06C\uB97C \uC21C\uC11C\uB300\uB85C \uC9C0\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uAC74\uC124\uBE44\uB294 \uD574\uB2F9 \uB3C4\uC2DC \uB9E4\uC785\uAC00\uC758 40%\u219260%\u219280%\uC774\uBA70, 10 \uB2E8\uC704\uB85C \uBC18\uC62C\uB9BC\uD558\uACE0 \uCD5C\uC18C 40\uC785\uB2C8\uB2E4. \uD1B5\uD589\uB8CC\uB294 \uAE30\uBCF8\uC758 2\uBC30\u21924\uBC30\u21928\uBC30\uAC00 \uB429\uB2C8\uB2E4. \uC0C1\uB300 \uB3C4\uC2DC\uC758 \uD1B5\uD589\uB8CC\uB294 \uC790\uB3D9 \uC9C0\uAE09\uB429\uB2C8\uB2E4." : rule),
  es: marbleCreditRules.es.map((rule, index) => index === 2 ? "Ciudades y construcci\xF3n \u2014 Puedes comprar una ciudad libre o pasar. En cualquier ciudad tuya puedes construir villa, edificio y monumento, sin completar un color. Cada nivel cuesta el 40 %, 60 % y 80 % del precio de compra de la ciudad; se redondea a 10 y nunca baja de 40. El alquiler pasa a 2, 4 y 8 veces el valor base. El alquiler rival se paga autom\xE1ticamente." : rule)
};
var marbleExpandedRules = {
  ko: [
    ...marbleTieredRules.ko.map((rule, index) => index === 5 ? rule.replace("\uD669\uAE08\uC5F4\uC1E0 \u2014 13\uC885 \uCE74\uB4DC\uB294", "\uD669\uAE08\uC5F4\uC1E0 \u2014 \uC0C8 \uBC29\uC740 16\uC885\uC774\uBA70 \uC774\uC804 \uC800\uC7A5 \uBC29\uC740 \uAE30\uC874 \uB371\uC744 \uC720\uC9C0\uD569\uB2C8\uB2E4. \uAE30\uBCF8 13\uC885 \uCE74\uB4DC\uB294") : rule),
    "\uB3C4\uC2DC \uCD95\uC81C\xB7\uC815\uC804 \u2014 \uCD95\uC81C\uB294 \uB0B4 \uB3C4\uC2DC \uD558\uB098\uB97C \uC120\uD0DD\uD574 \uB2E4\uC74C \uC0C1\uB300 \uCC29\uC9C0 1\uD68C \uD1B5\uD589\uB8CC\uB97C 2\uBC30\uB85C \uB9CC\uB4ED\uB2C8\uB2E4. \uC815\uC804\uC740 \uC0C1\uB300 \uB3C4\uC2DC \uD558\uB098\uB97C \uC120\uD0DD\uD574 \uB2E4\uC74C \uB0B4 \uCC29\uC9C0 1\uD68C \uD1B5\uD589\uB8CC\uB97C \uC808\uBC18\uC73C\uB85C \uB9CC\uB4ED\uB2C8\uB2E4(\uB0B4\uB9BC, \uCD5C\uC18C 1). \uB300\uC0C1 \uCC29\uC9C0\uAE4C\uC9C0 \uC720\uC9C0\uB418\uBA70 \uB2E4\uB978 \uB3C4\uC2DC\uB294 \uBC14\uB00C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB458 \uB2E4 \uAC78\uB9B0 \uB3C4\uC2DC\uB294 2\uBC30\xD7\uC808\uBC18\uC73C\uB85C \uAE30\uBCF8 \uD1B5\uD589\uB8CC\uAC00 \uB429\uB2C8\uB2E4. \uAC19\uC740 \uD6A8\uACFC\uB97C \uB2E4\uC2DC \uC120\uD0DD\uD558\uBA74 \uC911\uBCF5 \uBC30\uC218\uAC00 \uC544\uB2CC \uD574\uB2F9 \uD6A8\uACFC \uAC31\uC2E0\uC785\uB2C8\uB2E4. \uC120\uD0DD \uAC00\uB2A5\uD55C \uB3C4\uC2DC\uAC00 \uC5C6\uC73C\uBA74 \uD6A8\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    "\uD1B5\uD589\uB8CC \uBA74\uC81C\uAD8C \u2014 \uD55C \uC7A5\uC744 \uBCF4\uAD00\uD558\uACE0 \uC55E\uC73C\uB85C \uD1B5\uD589\uB8CC\uAC00 \uBC1C\uC0DD\uD558\uBA74 \uC9C0\uAE09 \uC804\uC5D0 \uC9C1\uC811 \uC0AC\uC6A9\uD558\uAC70\uB098 \uC9C0\uAE09\uC744 \uC120\uD0DD\uD569\uB2C8\uB2E4. \uC790\uB3D9 \uC0AC\uC6A9\uB418\uC9C0 \uC54A\uC73C\uBA70 \uC138\uAE08\uC5D0\uB294 \uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0AC\uC6A9\uD558\uBA74 \uD1B5\uD589\uB8CC 1\uD68C\uB9CC \uBA74\uC81C\uD558\uACE0 \uCE74\uB4DC\uB294 \uB371\uC73C\uB85C \uB3CC\uC544\uAC11\uB2C8\uB2E4. \uB300\uC0C1 \uB3C4\uC2DC \uCD95\uC81C\xB7\uC815\uC804\uC740 \uCC29\uC9C0 \uC21C\uAC04 \uC18C\uBAA8\uB418\uBBC0\uB85C \uBA74\uC81C\uAD8C\uC744 \uC368\uB3C4 \uB3C4\uC2DC \uD6A8\uACFC\uB294 \uC18C\uBAA8\uB429\uB2C8\uB2E4. \uC9C0\uAE09\uC744 \uC120\uD0DD\uD55C \uB4A4 \uD604\uAE08\uC774 \uBD80\uC871\uD558\uBA74 \uC77C\uBC18 \uC9C0\uAE09 \uC704\uAE30\uB85C \uB118\uC5B4\uAC11\uB2C8\uB2E4."
  ],
  es: [
    ...marbleTieredRules.es.map((rule, index) => index === 5 ? rule.replace("Llave dorada \u2014 Las 13 cartas incluyen", "Llave dorada \u2014 Las salas nuevas usan 16 cartas; las guardadas conservan su mazo. Las 13 cartas b\xE1sicas incluyen") : rule),
    "Festival y apag\xF3n \u2014 Festival elige una ciudad propia y duplica el alquiler en la pr\xF3xima llegada rival, una vez. Apag\xF3n elige una ciudad rival y reduce a la mitad el alquiler en tu pr\xF3xima llegada, una vez (redondeo hacia abajo, m\xEDnimo 1). Persisten hasta esa llegada y no cambian otras ciudades. Juntos dan el alquiler base: doble por mitad. Repetir el mismo efecto lo renueva, sin acumular multiplicadores. Sin ciudad elegible, no tienen efecto.",
    "Pase de alquiler \u2014 Guarda un pase y elige usarlo o pagar antes de un futuro alquiler. No se usa autom\xE1ticamente ni sirve para impuestos. Exime un solo alquiler y vuelve al mazo. Festival y apag\xF3n se consumen al llegar, incluso si usas el pase. Si eliges pagar sin efectivo suficiente, se aplica la crisis de pago normal."
  ]
};

// src/games/marble.ts
var marblePawnIds = ["fox", "cat", "penguin", "astronaut", "robot", "dragon"];
var pawnNames = { fox: { ko: "\uB9D0\uD2F0\uD478", es: "Maltipoo" }, cat: { ko: "\uACE0\uC591\uC774", es: "Gata" }, penguin: { ko: "\uD310\uB2E4", es: "Panda" }, astronaut: { ko: "\uC6B0\uC8FC\uBE44\uD589\uC0AC", es: "Astronauta" }, robot: { ko: "\uB85C\uBD07", es: "Robot" }, dragon: { ko: "\uCE5C\uCE60\uB77C", es: "Chinchilla" } };
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
var journeyBoard = modernBoard.map((tile, index) => index === 3 ? modernBoard[15] : index === 15 ? modernBoard[3] : index === 31 ? { ...tile, name: { ko: "\uB274\uC5B4\uD06C", es: "Newark" } } : index === 38 ? { ...tile, name: { ko: "\uC11C\uC6B8", es: "Se\xFAl" } } : tile);
var boardFor = (s) => s.boardVersion === 2 ? s.cityRouteVersion === 2 ? journeyBoard : modernBoard : legacyBoard;
var legacyIds = ["festival", "lottery", "rent-rebate", "travel-cost", "maintenance", "visit-santo-domingo", "advance-start", "retreat"];
var modernIds = [...legacyIds, "go-to-island", "escape-pass", "train-ticket", "city-dividend"];
var expandedIds = [...modernIds, "monopoly-warning", "city-festival", "blackout", "rent-pass"];
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
  "monopoly-warning": { title: { ko: "\uB3C5\uC810 \uACBD\uACE0", es: "Advertencia de monopolio" }, text: { ko: "\uC644\uC131\uD55C \uC0C9\uC0C1 \uB3C4\uC2DC\uAD70\uC774 \uAC00\uC7A5 \uB9CE\uC740 \uC0AC\uB78C\uC5D0\uAC8C \uB3C4\uC2DC\uAD70\uB2F9 100, \uCD5C\uB300 300\uC758 \uB3C5\uC810 \uBD80\uB2F4\uAE08\uC744 \uBD80\uACFC\uD569\uB2C8\uB2E4. \uB3D9\uB960\uC774\uBA74 \uCE74\uB4DC\uB97C \uBF51\uC740 \uC0AC\uB78C, \uC644\uC131\uD55C \uB3C4\uC2DC\uAD70\uC774 \uC5C6\uC73C\uBA74 \uBD80\uB2F4\uAE08\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", es: "Quien tenga m\xE1s grupos de color completos paga 100 por grupo, hasta 300. En empate paga quien sac\xF3 la carta; si nadie complet\xF3 un grupo, no se cobra." }, effect: "cash" },
  "city-festival": { title: { ko: "\uB3C4\uC2DC \uCD95\uC81C", es: "Festival de ciudad" }, text: { ko: "\uB0B4 \uB3C4\uC2DC \uD558\uB098\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4. \uADF8 \uB3C4\uC2DC\uC758 \uB2E4\uC74C \uC0C1\uB300 \uCC29\uC9C0 1\uD68C \uD1B5\uD589\uB8CC\uAC00 2\uBC30\uAC00 \uB429\uB2C8\uB2E4. \uB300\uC0C1 \uCC29\uC9C0\uAE4C\uC9C0 \uC720\uC9C0\uB429\uB2C8\uB2E4.", es: "Elige una ciudad propia. Su alquiler se duplica una vez, en la pr\xF3xima llegada rival. Permanece hasta esa llegada." }, effect: "cash" },
  blackout: { title: { ko: "\uC815\uC804", es: "Apag\xF3n" }, text: { ko: "\uC0C1\uB300 \uB3C4\uC2DC \uD558\uB098\uB97C \uC120\uD0DD\uD569\uB2C8\uB2E4. \uADF8 \uB3C4\uC2DC\uC758 \uB2E4\uC74C \uB0B4 \uCC29\uC9C0 1\uD68C \uD1B5\uD589\uB8CC\uAC00 \uC808\uBC18\uC774 \uB429\uB2C8\uB2E4(\uB0B4\uB9BC, \uCD5C\uC18C 1). \uB300\uC0C1 \uCC29\uC9C0\uAE4C\uC9C0 \uC720\uC9C0\uB429\uB2C8\uB2E4.", es: "Elige una ciudad rival. En tu pr\xF3xima llegada a ella pagas la mitad una vez (redondeo hacia abajo, m\xEDnimo 1). Permanece hasta esa llegada." }, effect: "cash" },
  "rent-pass": { title: { ko: "\uD1B5\uD589\uB8CC \uBA74\uC81C\uAD8C", es: "Pase de alquiler" }, text: { ko: "\uD1B5\uD589\uB8CC \uBA74\uC81C\uAD8C \uD55C \uC7A5\uC744 \uBCF4\uAD00\uD569\uB2C8\uB2E4. \uC55E\uC73C\uB85C \uD1B5\uD589\uB8CC\uB97C \uB0B4\uAE30 \uC804\uC5D0 \uC9C1\uC811 \uC120\uD0DD\uD574 1\uD68C \uBA74\uC81C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC790\uB3D9 \uC0AC\uC6A9\uB418\uC9C0 \uC54A\uC73C\uBA70 \uC138\uAE08\uC5D0\uB294 \uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", es: "Guarda un pase. Antes de un futuro alquiler puedes elegir usarlo para eximir un solo pago. No se usa autom\xE1ticamente ni sirve para impuestos." }, effect: "pass" }
};
var propertyRent = (tile, record, modern) => (tile.rent ?? 0) * (modern ? [1, 2, 4, 8][record.houses] ?? 1 : record.houses + 1);
function marbleBuildCost(tile, level, economicVersion) {
  if (economicVersion !== 2) return 100;
  const factor = [0.4, 0.6, 0.8][Math.max(0, Math.min(2, Math.trunc(level)))] ?? 0.4;
  return Math.max(40, Math.round(Math.max(0, tile.price ?? 0) * factor / 10) * 10);
}
var assetsFor = (s, p, board) => s.money[p] - (s.debt?.[p] ?? 0) + Object.entries(s.properties).reduce((sum2, [index, record]) => {
  if (record.owner !== p) return sum2;
  const tile = board[Number(index)];
  const buildingCost = tile ? Array.from({ length: record.houses }, (_, level) => marbleBuildCost(tile, level, s.economicVersion)).reduce((total, cost) => total + cost, 0) : 0;
  return sum2 + (tile?.price ?? 0) + buildingCost;
}, 0);
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
    if (s.phase === "event-decision" && s.pendingEvent) {
      const owner = s.pendingEvent.id === "city-festival" ? p : otherPlayer(p);
      for (const index of propIndices(board)) if (s.properties[String(index)]?.owner === owner) add(`${board[index].name.ko} \uC120\uD0DD`, `Elegir ${board[index].name.es}`, { type: "choose-event-city", payload: { tile: index } });
    } else if (s.phase === "rent-decision" && s.pendingRent) {
      add(`\uD1B5\uD589\uB8CC \uC9C0\uAE09 \xB7 ${s.pendingRent.amount}`, `Pagar alquiler \xB7 ${s.pendingRent.amount}`, { type: "pay-rent" });
      if ((s.rentPasses?.[p] ?? 0) > 0) add("\uBA74\uC81C\uAD8C \uC0AC\uC6A9 \xB7 \uC774\uBC88 \uD1B5\uD589\uB8CC 1\uD68C", "Usar pase \xB7 este alquiler", { type: "use-rent-pass" });
    }
    if ((s.economicVersion === 1 || s.economicVersion === 2) && s.phase !== "event-decision" && s.phase !== "rent-decision") {
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
        const cost = marbleBuildCost(tile, record.houses, s.economicVersion);
        if (canBuild && record.houses < levels && s.money[p] >= cost) {
          const tier = s.boardVersion === 2 ? [["\uBCC4\uC7A5", "Villa"], ["\uBE4C\uB529", "Edificio"], "landmark"][record.houses] : ["\uC9D1", "Casa"];
          const name = Array.isArray(tier) ? tier : s.economicVersion === 1 || s.economicVersion === 2 ? ["\uB79C\uB4DC\uB9C8\uD06C", "Monumento"] : ["\uD638\uD154", "Hotel"];
          add(`${name[0]}: ${tile.name.ko} (${cost})`, `${name[1]}: ${tile.name.es} (${cost})`, { type: "build", payload: { tile: index } });
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
      cityRouteVersion: s.cityRouteVersion ?? 1,
      tiles: board.map((tile, index) => {
        const houses = s.properties[String(index)]?.houses ?? 0;
        const maxLevels = s.boardVersion === 2 ? 3 : 2;
        const canUpgrade = tile.kind === "property" && houses < maxLevels;
        return {
          ...tile,
          name: { ...tile.name },
          index,
          owner: s.properties[String(index)]?.owner ?? null,
          houses,
          rentModifiers: s.rentModifiers?.[String(index)] ? { ...s.rentModifiers[String(index)].festival ? { festival: { ...s.rentModifiers[String(index)].festival } } : {}, ...s.rentModifiers[String(index)].blackout ? { blackout: { ...s.rentModifiers[String(index)].blackout } } : {} } : null,
          nextBuildCost: canUpgrade ? marbleBuildCost(tile, houses, s.economicVersion) : null,
          nextRent: canUpgrade ? propertyRent(tile, { owner: s.properties[String(index)]?.owner ?? p, houses: houses + 1 }, s.boardVersion === 2) : null
        };
      }),
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
      pendingEvent: s.pendingEvent ? { ...s.pendingEvent } : null,
      pendingRent: s.pendingRent ? { ...s.pendingRent, reason: { ...s.pendingRent.reason } } : null,
      rentPasses: { p1: s.rentPasses?.p1 ?? 0, p2: s.rentPasses?.p2 ?? 0 },
      rentModifiers: Object.fromEntries(Object.entries(s.rentModifiers ?? {}).map(([tile, effects]) => [tile, { ...effects.festival ? { festival: { ...effects.festival } } : {}, ...effects.blackout ? { blackout: { ...effects.blackout } } : {} }])),
      eventVersion: s.eventVersion ?? 0,
      eventCardCount: s.boardVersion !== 2 ? 8 : s.eventVersion === 3 ? 16 : s.economicVersion ? 13 : 12,
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
  if (s.phase === "event-decision") {
    const index = a.payload?.tile, pending = s.pendingEvent;
    if (a.type !== "choose-event-city" || !pending || pending.playerId !== p) return "Choose an event city first";
    const owner = pending.id === "city-festival" ? p : otherPlayer(p);
    return !Number.isInteger(index) || board[index]?.kind !== "property" || s.properties[String(index)]?.owner !== owner ? "Invalid event city" : null;
  }
  if (s.phase === "rent-decision") {
    if (!s.pendingRent || s.pendingRent.playerId !== p) return "No rent decision";
    if (a.type === "pay-rent") return null;
    if (a.type === "use-rent-pass") return (s.rentPasses?.[p] ?? 0) > 0 ? null : "No rent pass";
    return "Resolve the rent decision first";
  }
  if (["choose-event-city", "pay-rent", "use-rent-pass"].includes(a.type)) return "No matching decision";
  if (["borrow", "repay", "declare-bankruptcy", "choose-pawn"].includes(a.type)) {
    if (s.economicVersion !== 1 && s.economicVersion !== 2) return "Credit and figure selection unavailable in this saved ruleset";
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
    if (!canBuild || s.money[p] < marbleBuildCost(tile, s.properties[String(index)].houses, s.economicVersion)) return "Cannot build here";
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
    if (s.economicVersion !== 1 && s.economicVersion !== 2) return bankrupt(s, p, otherPlayer(p));
    s.pendingPayment = { amount, creditor, reason, type, tile: s.positions[p], resumePhase: "main", resumeActive: s.active };
    s.active = p;
    s.phase = "debt";
    emit(s, "crisis", p, "\uD30C\uC0B0 \uC704\uAE30", "Riesgo de quiebra", `${reason.ko}: ${amount} \uC9C0\uAE09\uC5D0 ${amount - s.money[p]}\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4. \uB300\uCD9C \uC870\uAC74\uC744 \uD655\uC778\uD558\uAC70\uB098 \uD30C\uC0B0\uC744 \uC778\uC815\uD558\uC138\uC694.`, `${reason.es}: te faltan ${amount - s.money[p]} para pagar ${amount}. Revisa el pr\xE9stamo o declara la quiebra.`, { amount, fromPlayer: p, fromAccount: p, toAccount: creditor, ...creditor === "p1" || creditor === "p2" ? { toPlayer: creditor } : {} });
    return s;
  }
  s.money[p] -= amount;
  if (creditor === "fund") s.fundPool = (s.fundPool ?? 0) + amount;
  else if (creditor === "p1" || creditor === "p2") s.money[creditor] += amount;
  emit(s, type, p, reason.ko, reason.es, `${amount}\uC744 \uC9C0\uAE09\uD588\uC2B5\uB2C8\uB2E4.`, `Pagaste ${amount}.`, { amount, fromPlayer: p, fromAccount: p, toAccount: creditor, ...creditor === "p1" || creditor === "p2" ? { toPlayer: creditor } : {}, moneyDelta: { [p]: -amount, ...creditor === "p1" || creditor === "p2" ? { [creditor]: amount } : {} }, tile: s.positions[p] });
  return s;
}
function bonus(s, p, amount, ko, es, source = "bank") {
  s.money[p] += amount;
  emit(s, "bonus", p, ko, es, `${amount}\uC744 \uBC1B\uC558\uC2B5\uB2C8\uB2E4.`, `Recibiste ${amount}.`, { amount, toPlayer: p, fromAccount: source, toAccount: p, moneyDelta: { [p]: amount } });
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
      let rent = propertyRent(tile, owner, s.boardVersion === 2);
      const effects = s.eventVersion === 3 ? s.rentModifiers?.[String(index)] : void 0;
      const festival = effects?.festival?.owner === owner.owner && effects.festival.playerId === owner.owner;
      const blackout = effects?.blackout?.owner === owner.owner && effects.blackout.playerId === p;
      if (festival) rent *= 2;
      if (blackout) rent = Math.max(1, Math.floor(rent / 2));
      if (festival || blackout) {
        const remaining = { ...effects };
        if (festival) delete remaining.festival;
        if (blackout) delete remaining.blackout;
        s.rentModifiers ??= {};
        s.rentModifiers[String(index)] = remaining;
        if (!remaining.festival && !remaining.blackout) delete s.rentModifiers[String(index)];
        emit(s, "event-card", p, "\uB3C4\uC2DC \uD6A8\uACFC \uC801\uC6A9", "Efecto de ciudad aplicado", "\uB300\uC0C1 \uB3C4\uC2DC \uCC29\uC9C0\uB85C \uD1B5\uD589\uB8CC \uD6A8\uACFC 1\uD68C\uB97C \uC18C\uBAA8\uD588\uC2B5\uB2C8\uB2E4. \uBA74\uC81C\uAD8C\uC744 \uC368\uB3C4 \uB3C4\uC2DC \uD6A8\uACFC\uB294 \uC18C\uBAA8\uB429\uB2C8\uB2E4.", "La llegada consume el efecto de alquiler de una vez, incluso si usas un pase.", { tile: index, amount: rent });
      }
      const reason = { ko: `${tile.name.ko} \uD1B5\uD589\uB8CC`, es: `Alquiler en ${tile.name.es}` };
      if (s.eventVersion === 3 && (s.rentPasses?.[p] ?? 0) > 0) {
        s.pendingRent = { amount: rent, creditor: owner.owner, playerId: p, tile: index, reason };
        s.phase = "rent-decision";
        return s;
      }
      s = pay(s, p, rent, owner.owner, reason, "rent");
    }
  } else if (tile.kind === "tax") s = pay(s, p, tile.price ?? 0, "bank", tile.name);
  else if (tile.kind === "fund") {
    bonus(s, p, s.fundPool ?? 0, "\uACF5\uB3D9 \uAE30\uAE08 \uC218\uB839", "Cobro del fondo com\xFAn", "fund");
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
  const board = boardFor(s), isModern = s.boardVersion === 2, ids = isModern ? s.eventVersion === 3 ? expandedIds : s.economicVersion === 1 || s.economicVersion === 2 ? [...modernIds, "monopoly-warning"] : modernIds : legacyIds;
  s.phase = "main";
  let deck = s.eventDeck ? [...s.eventDeck] : [];
  if (!deck.length) {
    const rng = s.eventRng ?? (s.rng ^ 2779096485) >>> 0;
    deck = shuffle(ids.filter((id2) => !(s.eventVersion === 3 && (id2 === "escape-pass" && (s.escapePasses?.p1 ?? 0) + (s.escapePasses?.p2 ?? 0) > 0 || id2 === "rent-pass" && (s.rentPasses?.p1 ?? 0) + (s.rentPasses?.p2 ?? 0) > 0))), seededRandom(rng));
    s.eventRng = rng + (deck.length - 1) * 1831565813 >>> 0;
  }
  const id = deck.shift();
  if (isModern && id !== "escape-pass" && id !== "rent-pass") deck.push(id);
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
    const destination = board.findIndex((tile) => tile.name.ko === "\uC0B0\uD1A0\uB3C4\uBC0D\uACE0");
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
  } else if (id === "city-festival" || id === "blackout") {
    const owner = id === "city-festival" ? p : otherPlayer(p);
    if (propIndices(board).some((index) => s.properties[String(index)]?.owner === owner)) {
      s.pendingEvent = { id, playerId: p };
      s.phase = "event-decision";
    } else {
      card2 = { ...card2, text: { ko: "\uC120\uD0DD \uAC00\uB2A5\uD55C \uB3C4\uC2DC\uAC00 \uC5C6\uC5B4 \uD6A8\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.", es: "No hay ninguna ciudad elegible; la carta no tiene efecto." } };
      emit(s, "event-card", p, card2.title.ko, card2.title.es, card2.text.ko, card2.text.es, { cardId: id, moneyDelta: { [p]: 0 } });
    }
  } else if (id === "rent-pass") {
    s.rentPasses ??= { p1: 0, p2: 0 };
    s.rentPasses[p] = 1;
    emit(s, "event-card", p, card2.title.ko, card2.title.es, card2.text.ko, card2.text.es, { cardId: id, moneyDelta: { [p]: 0 } });
  } else if (id === "monopoly-warning") {
    const groups = { p1: completedGroups(s, "p1"), p2: completedGroups(s, "p2") };
    const target = groups.p1.length === groups.p2.length ? p : groups.p1.length > groups.p2.length ? "p1" : "p2";
    const count2 = groups[target].length, amount = Math.min(300, count2 * 100);
    const text = { ko: count2 ? `${target === p ? "\uCE74\uB4DC\uB97C \uBF51\uC740 \uC0AC\uB78C" : "\uC0C1\uB300"}\uC758 \uC644\uC131 \uB3C4\uC2DC\uAD70 ${count2}\uAC1C: \uB3C5\uC810 \uBD80\uB2F4\uAE08 ${amount}\uC744 \uC740\uD589\uC5D0 \uB0C5\uB2C8\uB2E4.` : "\uC644\uC131\uD55C \uC0C9\uC0C1 \uB3C4\uC2DC\uAD70\uC774 \uC5C6\uC5B4 \uBD80\uB2F4\uAE08\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", es: count2 ? `${target === p ? "Quien sac\xF3 la carta" : "La otra persona"} tiene ${count2} grupos completos y paga ${amount} al banco.` : "Nadie tiene un grupo de color completo. No se cobra." };
    card2 = { ...card2, text };
    emit(s, "monopoly-warning", target, card2.title.ko, card2.title.es, text.ko, text.es, { amount, fromAccount: target, toAccount: "bank", cardId: id, group: groups[target].join(", ") });
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
  n.pendingEvent = s.pendingEvent ? { ...s.pendingEvent } : null;
  n.pendingRent = s.pendingRent ? { ...s.pendingRent, reason: { ...s.pendingRent.reason } } : null;
  n.rentPasses = { p1: s.rentPasses?.p1 ?? 0, p2: s.rentPasses?.p2 ?? 0 };
  n.rentModifiers = Object.fromEntries(Object.entries(s.rentModifiers ?? {}).map(([tile, effects]) => [tile, { ...effects.festival ? { festival: { ...effects.festival } } : {}, ...effects.blackout ? { blackout: { ...effects.blackout } } : {} }]));
  const board = boardFor(n), payload = a.payload ?? {};
  if (a.type === "choose-event-city") {
    const index = payload.tile, id = n.pendingEvent.id, key = id === "city-festival" ? "festival" : "blackout";
    n.rentModifiers[String(index)] = { ...n.rentModifiers[String(index)], [key]: { source: id, playerId: p, owner: n.properties[String(index)].owner } };
    n.pendingEvent = null;
    n.phase = "main";
    const text = { ko: `${board[index].name.ko}: ${id === "city-festival" ? "\uB2E4\uC74C \uC0C1\uB300 \uCC29\uC9C0 1\uD68C \uD1B5\uD589\uB8CC 2\uBC30" : "\uB2E4\uC74C \uB0B4 \uCC29\uC9C0 1\uD68C \uD1B5\uD589\uB8CC \uC808\uBC18"}. \uB300\uC0C1 \uCC29\uC9C0\uAE4C\uC9C0 \uC720\uC9C0\uB429\uB2C8\uB2E4.`, es: `${board[index].name.es}: ${id === "city-festival" ? "alquiler doble en la pr\xF3xima llegada rival, una vez" : "mitad del alquiler en tu pr\xF3xima llegada, una vez"}. Permanece hasta esa llegada.` };
    if (n.lastEvent?.id === id) n.lastEvent = { ...n.lastEvent, text };
    emit(n, "event-card", p, cards[id].title.ko, cards[id].title.es, text.ko, text.es, { cardId: id, tile: index, moneyDelta: { [p]: 0 } });
    return n;
  }
  if (a.type === "pay-rent" || a.type === "use-rent-pass") {
    const pending = n.pendingRent;
    n.pendingRent = null;
    n.phase = "main";
    if (a.type === "pay-rent") return pay(n, p, pending.amount, pending.creditor, pending.reason, "rent");
    n.rentPasses[p] = 0;
    n.eventDeck ??= [];
    if (!n.eventDeck.includes("rent-pass")) n.eventDeck.push("rent-pass");
    emit(n, "rent", p, "\uD1B5\uD589\uB8CC \uBA74\uC81C\uAD8C \uC0AC\uC6A9", "Pase de alquiler usado", `${pending.reason.ko} ${pending.amount}\uC744 1\uD68C \uBA74\uC81C\uD588\uC2B5\uB2C8\uB2E4.`, `Eximiste una vez ${pending.amount} de ${pending.reason.es}.`, { cardId: "rent-pass", tile: pending.tile, amount: 0, fromAccount: p, toAccount: pending.creditor, moneyDelta: { [p]: 0, [pending.creditor]: 0 } });
    return n;
  }
  if (a.type === "choose-pawn") {
    n.pawns[p] = payload.pawn;
    emit(n, "pawn", p, "\uB9D0 \uC120\uD0DD", "Figura elegida", "\uC774 \uB9D0\uB85C \uB3C4\uC2DC\uB97C \uC5EC\uD589\uD569\uB2C8\uB2E4.", "Viajar\xE1s por las ciudades con esta figura.");
    return n;
  }
  if (a.type === "borrow") {
    n.money[p] += 300;
    n.debt[p] = 330;
    emit(n, "loan", p, "\uB300\uCD9C \uC2E4\uD589", "Pr\xE9stamo recibido", "300\uC744 \uBC1B\uACE0 330\uC758 \uC0C1\uD658 \uC758\uBB34\uAC00 \uC0DD\uACBC\uC2B5\uB2C8\uB2E4. \uCD94\uAC00 \uC774\uC790\uB098 \uB9CC\uAE30 \uC5C6\uC774 \uC804\uC561 \uC0C1\uD658\uD558\uBA70, \uBBF8\uC0C1\uD658\uC561\uC740 \uCD5C\uC885 \uC790\uC0B0\uC5D0\uC11C \uBE8D\uB2C8\uB2E4.", "Recibes 300 y debes devolver 330. No hay intereses adicionales ni plazo; se paga completo y la deuda se resta del patrimonio final.", { amount: 300, debtAfter: 330, fromAccount: "bank", toAccount: p, moneyDelta: { [p]: 300 } });
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
    emit(n, "repay", p, "\uB300\uCD9C \uC0C1\uD658 \uC644\uB8CC", "Pr\xE9stamo pagado", `${amount}\uC744 \uC0C1\uD658\uD574 \uB0A8\uC740 \uB300\uCD9C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.`, `Pagaste ${amount}; ya no tienes deuda.`, { amount, debtAfter: 0, fromAccount: p, toAccount: "bank", moneyDelta: { [p]: -amount } });
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
    emit(n, "train", p, "\uC5F4\uCC28 \uCD9C\uBC1C", "El tren sale", `${board[to].name.ko}\uD589 \xB7 \uC6B4\uC784 ${fare}`, `Destino: ${board[to].name.es} \xB7 pasaje ${fare}`, { amount: fare, fromAccount: p, toAccount: "bank", moneyDelta: { [p]: -fare }, from, to });
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
    emit(n, "buy", p, "\uB3C4\uC2DC \uAD6C\uB9E4 \uC644\uB8CC", "Ciudad comprada", `${board[index].name.ko}\uC744 \uC18C\uC720\uD588\uC2B5\uB2C8\uB2E4.`, `Compraste ${board[index].name.es}.`, { tile: index, amount: price, fromAccount: p, toAccount: "bank", moneyDelta: { [p]: -price } });
    const group = board[index].group;
    if (completedGroups(n, p).includes(group)) emit(n, "monopoly-warning", p, "\uC0C9\uC0C1 \uB3C4\uC2DC\uAD70 \uC644\uC131", "Grupo de color completo", "\uC774 \uB3C4\uC2DC\uAD70\uC744 \uBAA8\uB450 \uC18C\uC720\uD588\uC2B5\uB2C8\uB2E4. \uB3C5\uC810 \uACBD\uACE0 \uCE74\uB4DC\uAC00 \uB098\uC624\uBA74 \uBD80\uB2F4\uAE08 \uB300\uC0C1\uC774 \uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", "Ya tienes todas las ciudades de este color. Una carta de monopolio puede cobrarte un cargo.", { group, tile: index });
  } else if (a.type === "decline") n.phase = "main";
  else if (a.type === "build") {
    const index = payload.tile, cost = marbleBuildCost(board[index], n.properties[String(index)].houses, n.economicVersion);
    n.money[p] -= cost;
    n.properties[String(index)] = { ...n.properties[String(index)], houses: n.properties[String(index)].houses + 1 };
    const level = n.properties[String(index)].houses;
    emit(n, "build", p, "\uAC74\uC124 \uC644\uB8CC", "Construcci\xF3n terminada", `${board[index].name.ko}: ${level === 3 ? "\uB79C\uB4DC\uB9C8\uD06C" : level === 2 ? "\uBE4C\uB529" : "\uBCC4\uC7A5"} \xB7 \uD1B5\uD589\uB8CC ${propertyRent(board[index], n.properties[String(index)], n.boardVersion === 2)}`, `${board[index].name.es}: ${level === 3 ? "monumento" : level === 2 ? "edificio" : "villa"} \xB7 alquiler ${propertyRent(board[index], n.properties[String(index)], n.boardVersion === 2)}`, { tile: index, amount: cost, fromAccount: p, toAccount: "bank", moneyDelta: { [p]: -cost } });
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
      cityRouteVersion: 2,
      phase: "roll",
      pendingTile: null,
      lastRoll: [],
      turns: 0,
      result: null,
      eventRng: eventRng + (expandedIds.length - 1) * 1831565813 >>> 0,
      eventDeck: shuffle(expandedIds, seededRandom(eventRng)),
      eventSequence: 0,
      lastEvent: null,
      fundPool: 0,
      eventVersion: 3,
      pendingEvent: null,
      pendingRent: null,
      rentPasses: { p1: 0, p2: 0 },
      rentModifiers: {},
      economicVersion: 2,
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
