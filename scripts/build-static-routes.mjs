import { copyFile } from 'node:fs/promises';

// Static hosts can resolve these routes before the app's client router starts.
await Promise.all([
  ...['play', 'feedback'].map(route => copyFile('dist/index.html', `dist/${route}.html`)),
  copyFile('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.txt'),
]);
