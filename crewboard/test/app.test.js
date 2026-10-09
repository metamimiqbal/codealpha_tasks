const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('serves the static frontend and protects API routes without a session', async t => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /CrewBoard/);

  const response = await fetch(`${origin}/api/auth/me`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { success: false, error: { message: 'Authentication required' } });
});
