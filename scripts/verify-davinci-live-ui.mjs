import assert from "node:assert/strict";
import path from "node:path";
import { launchChromium } from "./playwright-browser.mjs";
import fs from "node:fs/promises";
const out = path.resolve(
  process.env.PLAYWRIGHT_ARTIFACT_DIR || "output/playwright/davinci-live-ui",
);
await fs.mkdir(out, { recursive: true });
const baseUrl = process.env.DAVINCI_QA_URL || "http://127.0.0.1:5219";
const b = await launchChromium();
const contexts = await Promise.all([
  b.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  }),
  b.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  }),
]);
const pages = await Promise.all(contexts.map((c) => c.newPage()));
const report = {
  method:
    "Real app lobby create/join/consent and UI legal actions; local SQL/RLS/authority protocol fixture, read refresh only, no game state injection.",
  errors: [],
  network: [],
  actions: [],
  captures: [],
  checks: [],
};
for (const [i, p] of pages.entries()) {
  p.setDefaultTimeout(20000);
  p.on("pageerror", (e) =>
    report.errors.push({ seat: i + 1, error: e.message }),
  );
  p.on("requestfailed", (r) =>
    report.network.push({
      seat: i + 1,
      url: r.url(),
      error: r.failure()?.errorText,
    }),
  );
  p.on("response", (r) => {
    if (r.status() >= 400)
      report.network.push({ seat: i + 1, url: r.url(), status: r.status() });
  });
}
async function save() {
  await fs.writeFile(out + "/report.json", JSON.stringify(report, null, 2));
}
async function snap(p, refresh = true) {
  return p.evaluate(async (r) => {
    const u = performance
      .getEntriesByType("resource")
      .find((e) => /\/src\/core\/client\.ts(?:\?|$)/.test(e.name))?.name;
    const { client } = await import(u);
    if (r) await client.reconnectRoom();
    const s = client.getSnapshot();
    return {
      roomId: s.roomId,
      playerId: s.playerId,
      version: s.version,
      phase: s.view?.phase,
      turn: s.view?.turn,
      gameId: s.gameId,
      view: s.view,
    };
  }, refresh);
}
async function both() {
  let s;
  for (let i = 0; i < 4; i++) {
    s = await Promise.all(pages.map((p) => snap(p)));
    if (s[0].version === s[1].version) break;
  }
  return s;
}
async function capture(p, label) {
  await p.waitForTimeout(600);
  const path = out + "/" + label + ".png";
  await p.screenshot({ path, fullPage: false });
  report.captures.push(path);
  await save();
  return path;
}
async function metrics(p) {
  return p.locator(".dv-joker-portrait").evaluateAll((es) =>
    es.map((e) => {
      const im = e.getBoundingClientRect(),
        tile = e.closest(".dv-tile").getBoundingClientRect(),
        b = e.parentElement.getBoundingClientRect();
      return {
        src: new URL(e.src).pathname,
        loaded: e.complete && e.naturalWidth > 0,
        insideTile:
          im.left >= tile.left &&
          im.right <= tile.right &&
          im.top >= tile.top &&
          im.bottom <= tile.bottom,
        image: im.toJSON(),
        tile: tile.toJSON(),
        valueBox: b.toJSON(),
        own: !!e.closest(".dv-own-rack"),
      };
    }),
  );
}
async function clickAction(p, a) {
  if (a.type === "place-joker") {
    await p.locator(".dv-gap-button:not(:disabled)").first().click();
    return;
  }
  if (a.type === "finish-setup") {
    await p
      .locator(".dv-actions .dv-action-primary")
      .filter({ hasText: /초기 패 준비 완료|Terminé de preparar/ })
      .click();
    return;
  }
  if (a.type === "draw" || a.type === "skip-draw") {
    await p.locator(".dv-actions .dv-action-primary").first().click();
    return;
  }
  if (a.type === "stop") {
    await p.locator(".dv-action-secondary").click();
    return;
  }
  if (a.type === "guess") {
    const t = p.locator(".dv-rival-rack .dv-tile").nth(a.payload.index);
    await t.click();
    await p
      .locator(".dv-number-grid button")
      .filter({
        hasText: new RegExp(
          "^" + (a.payload.value === "joker" ? "－" : a.payload.value) + "$",
        ),
      })
      .click();
    await p.locator(".dv-guess-submit").click();
    await p.locator(".dv-confirm-row button").first().click();
    return;
  }
  throw Error("Unsupported " + a.type);
}
try {
  for (const [i, p] of pages.entries()) {
    await p.goto(`${baseUrl}/play`);
    await p
      .getByRole("button", { name: i ? "Español · RD" : "한국어", exact: true })
      .click();
    await p.locator("#nickname").fill(i ? "Revisión Ana" : "검수 연석");
  }
  await pages[0].locator(".lobby-actions > button").click();
  await pages[0].waitForURL("**/room/**");
  await pages[1].locator(".code-input").fill(pages[0].url());
  await pages[1].locator(".code-input").press("Enter");
  await pages[1].waitForURL("**/room/**");
  await both();
  await pages[0]
    .locator(".room-game-card")
    .filter({ hasText: "다빈치 코드" })
    .click();
  await snap(pages[1]);
  await pages[1]
    .locator(".room-game-card")
    .filter({ hasText: "El código Da Vinci" })
    .click();
  await both();
  await pages[0].locator(".dv-table").waitFor();
  await capture(pages[0], "before-real-initial-p1");
  await capture(pages[1], "before-real-initial-p2");
  console.log("REAL_ROOM", pages[0].url());
  let ownJokerColors = new Set();
  let steps = 0;
  const windowGuessCounts = {};
  for (; steps < 180; steps++) {
    const states = await both();
    let chosen;
    for (let i = 0; i < 2; i++) {
      const v = states[i].view;
      if (v?.ownJokerToPlace?.color)
        chosen = {
          i,
          a: v.actions.find((x) => x.action.type === "place-joker")?.action,
        };
      if (chosen?.a) break;
      if (v?.actions?.some((x) => x.action.type === "finish-setup"))
        chosen = {
          i,
          a: v.actions.find((x) => x.action.type === "finish-setup").action,
        };
      if (chosen?.a) break;
    }
    const allMetrics = await Promise.all(pages.map((p) => metrics(p)));
    for (let i = 0; i < 2; i++) {
      for (const m of allMetrics[i]) if (m.own) ownJokerColors.add(m.src);
    }
    if (states[0].view?.result) {
      report.result = states[0].view.result;
      for (const [i, p] of pages.entries()) {
        assert.equal(await p.locator(".dv-number-grid").count(), 0);
        assert.equal(await p.locator(".dv-waiting").count(), 0);
        assert.equal(
          await p.locator(".dv-stage-message h3").innerText(),
          i ? "Resultado" : "결과",
        );
      }
      report.checks.push(
        "Both terminal panels show result, not waiting/guessing tools",
      );
      await capture(pages[0], "actual-result-p1");
      await capture(pages[1], "actual-result-p2");
      await pages[0].locator(".davinci-session-summary button").last().click();
      await both();
      await pages[1].locator(".davinci-session-summary button").last().click();
      await both();
      report.replay = await both();
      assert.ok(
        report.replay.every((s) => !s.view.result && s.view.phase === "setup"),
      );
      report.checks.push("Both players consented to a fresh actual game");
      await capture(pages[0], "actual-replay-p1");
      break;
    }
    if (!chosen?.a) {
      const i = states[0].view.turn === "p2" ? 1 : 0;
      const choices = states[i].view.actions.map((x) => x.action);
      let a =
        choices.find((x) => x.type === "draw") ??
        choices.find((x) => x.type === "skip-draw");
      if (!a) {
        const guesses = choices.filter((x) => x.type === "guess");
        if (guesses.length) {
          const idx = guesses[0].payload.index;
          const own = states[i].view.hand ?? [];
          const used = new Set(
            own
              .filter(
                (t) =>
                  t.color === states[i].view.board.opponentTiles[idx].color,
              )
              .map((t) => t.value),
          );
          const options = guesses.filter(
            (x) => x.payload.index === idx && !used.has(x.payload.value),
          );
          const key =
            i + ":" + idx + ":" + states[i].view.board.opponentTiles.length;
          windowGuessCounts[key] = (windowGuessCounts[key] ?? 0) + 1;
          const opts = options.length
            ? options
            : guesses.filter((x) => x.payload.index === idx);
          a = opts[(windowGuessCounts[key] - 1) % opts.length];
        } else a = choices.find((x) => x.type === "stop");
      }
      chosen = { i, a };
    }
    if (!chosen?.a) {
      report.stall = { states };
      break;
    }
    for (const p of pages) {
      assert.equal(
        await p
          .locator(
            ".dv-rival-rack .dv-tile:not(.is-revealed) .dv-joker-portrait",
          )
          .count(),
        0,
      );
    }
    const before = states[chosen.i].version;
    if (steps < 8 || chosen.a.type === "place-joker")
      await capture(
        pages[chosen.i],
        "before-action-" + steps + "-" + chosen.a.type,
      );
    await clickAction(pages[chosen.i], chosen.a);
    await both();
    report.actions.push({
      step: steps,
      seat: chosen.i + 1,
      action: chosen.a,
      version: before,
      metrics: await metrics(pages[chosen.i]),
    });
    if (steps % 8 === 0) console.log("STEP", steps, chosen.a.type);
    if (steps % 20 === 0)
      await capture(pages[chosen.i], "actual-play-step-" + steps);
    await save();
  }
  assert.ok(report.result, "Actual legal UI match must reach a result");
  assert.ok(
    report.actions.every((a) =>
      a.metrics.every((m) => m.loaded && m.insideTile),
    ),
    "Every observed portrait stays inside its actual tile",
  );
  report.ownJokerSources = [...ownJokerColors];
  assert.equal(
    ownJokerColors.size,
    2,
    "Actual match exposes both default joker portraits",
  );
  report.checks.push(
    "Both default joker portraits loaded inside tiles; no hidden opponent portrait leakage",
  );
  report.final = await both();
  for (let i = 0; i < 2; i++) {
    await capture(pages[i], "final-desktop-p" + (i + 1));
    await pages[i].setViewportSize({ width: 390, height: 844 });
    await capture(pages[i], "mobile-policy-p" + (i + 1));
  }
  await save();
} catch (e) {
  report.error = String(e.stack || e);
  console.log("FAIL", report.error);
  for (let i = 0; i < 2; i++)
    await capture(pages[i], "interrupted-p" + (i + 1)).catch(() => {});
  await save();
  process.exitCode = 1;
} finally {
  await b.close();
}
