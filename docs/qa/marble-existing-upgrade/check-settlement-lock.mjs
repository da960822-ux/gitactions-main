import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const base = process.env.MARBLE_URL ?? 'http://127.0.0.1:5176/play?game=marble';
try {
  for (const mode of ['2p', '4p']) for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.evaluate(async mode => {
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const ReactDOM = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const engine = mode === '2p' ? (await import('/src/games/marble.ts')).marbleEngine : (await import('/src/games/fourMarble.ts')).fourMarbleEngine;
      const Screen = (await import(mode === '2p' ? '/src/app/MarbleBoard.tsx' : '/src/app/MarbleTeamBoard.tsx')).default;
      const initial = engine.createInitialState(71);
      initial.phase = 'main'; initial.positions.p1 = 1; initial.pendingTile = 1;
      initial.properties[1] = { owner: 'p1', houses: 1 };
      window.__marbleState = initial;
      window.__marbleActions = [];
      function Live() {
        const [state, setState] = React.useState(initial);
        return React.createElement(Screen, { view: engine.getPlayerView(state, 'p1'), language: 'ko', playerId: 'p1', nickname: '플레이어', runAction: async action => {
          const next = engine.applyAction(window.__marbleState, 'p1', action);
          window.__marbleActions.push(action.type);
          window.__marbleState = next;
          setState(next);
          return true;
        } });
      }
      document.body.innerHTML = '<div id="fixture"></div>';
      ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(Live));
    }, mode);
    const button = page.locator(mode === '2p' ? '#mp-action-primary' : '#mt-action-primary');
    await button.waitFor();
    await button.click();
    await page.waitForFunction(() => window.__marbleState.properties[1]?.houses === 2);
    await page.waitForTimeout(115);
    const during = await page.evaluate(selector => {
      const control = document.querySelector(selector);
      control.click();
      return { disabled: control.disabled, houses: window.__marbleState.properties[1]?.houses, actions: window.__marbleActions.slice() };
    }, mode === '2p' ? '#mp-action-primary' : '#mt-action-primary');
    if (reducedMotion === 'no-preference') {
      if (!during.disabled || during.houses !== 2 || during.actions.length !== 1) throw Error(`${mode} repeated a build during its effect: ${JSON.stringify(during)}`);
      await page.waitForTimeout(800);
      if (await button.isDisabled()) throw Error(`${mode} remained locked after settlement effect`);
      await button.click();
    } else if (during.disabled) {
      throw Error(`${mode} delayed a reduced-motion build: ${JSON.stringify(during)}`);
    }
    await page.waitForFunction(() => window.__marbleState.properties[1]?.houses === 3);
    const actions = await page.evaluate(() => window.__marbleActions.slice());
    if (actions.length !== 2) throw Error(`${mode} submitted ${actions.length} builds`);
    if (errors.length) throw Error(`${mode} page errors: ${errors.join(', ')}`);
    console.log(mode, reducedMotion, JSON.stringify({ during, finalHouses: 3, errors }));
    await page.close();
  }
} finally { await browser.close(); }
