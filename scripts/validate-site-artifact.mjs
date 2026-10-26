import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const config = JSON.parse(readFileSync('dist/.openai/hosting.json', 'utf8'));
const worker = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
assert.equal(config.project_id, 'appgprj_6ad8bbe1b3248191a1456e8672ffbfbe');
assert.equal(config.d1, 'DB');
assert.equal(config.static, undefined);
assert.equal(worker.main, 'index.js');
assert.equal(worker.assets.binding, 'ASSETS');
assert.equal(worker.assets.directory, '../client');
assert.equal(worker.assets.not_found_handling, 'single-page-application');
assert.ok(worker.assets.run_worker_first.includes('/api/*'));
for (const path of ['dist/server/index.js', 'dist/client/index.html', 'dist/client/feedback.html', 'dist/client/play.html', 'dist/.openai/drizzle/0000_kind_deadpool.sql']) {
  assert.ok(statSync(path).size > 0, `${path} missing or empty`);
}
