// Run with TEST_PASSWORD set to the demo admin password.
// Uses demo-only records and removes the record created by this test.
const assert = require('node:assert/strict');

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5007/api/v1';
const username = process.env.TEST_USERNAME || 'admin@school-admin.com';
const password = process.env.TEST_PASSWORD;

if (!password) {
  console.error('Set TEST_PASSWORD before running the smoke test.');
  process.exit(1);
}

async function main() {
  const login = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(login.status, 200, `Login failed: ${await login.text()}`);

  const rawCookies = login.headers.getSetCookie();
  const activeCookies = new Map();
  for (const item of rawCookies) {
    const [name, value] = item.split(';')[0].split('=', 2);
    activeCookies.set(name, value);
  }
  const cookies = [...activeCookies].map(([name, value]) => `${name}=${value}`).join('; ');
  assert.ok(activeCookies.get('csrfToken'), 'Login did not return CSRF token');
  const csrfToken = decodeURIComponent(activeCookies.get('csrfToken'));

  const call = async (method, path, body) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        cookie: cookies,
        'x-csrf-token': csrfToken,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = raw; }
    return { status: response.status, data };
  };

  let createdId;
  try {
    const list = await call('GET', '/students');
    assert.equal(list.status, 200);
    assert.ok(Array.isArray(list.data.students));
    console.log('OK  GET /students');

    const emptyList = await call('GET', '/students?name=assessment-student-that-does-not-exist');
    assert.equal(emptyList.status, 200);
    assert.deepEqual(emptyList.data.students, []);
    console.log('OK  GET /students with no matches => []');

    assert.equal((await call('GET', '/students/invalid')).status, 400);
    console.log('OK  GET /students/invalid => 400');

    const email = `assessment-${Date.now()}@example.test`;
    const created = await call('POST', '/students', {
      name: 'Assessment Test Student',
      email,
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    createdId = created.data.id;
    assert.ok(Number.isInteger(createdId));
    console.log(`OK  POST /students => ${createdId}`);

    const duplicate = await call('POST', '/students', {
      name: 'Duplicate Student',
      email,
    });
    assert.equal(duplicate.status, 409, JSON.stringify(duplicate.data));
    console.log('OK  POST duplicate email => 409');

    const read = await call('GET', `/students/${createdId}`);
    assert.equal(read.status, 200, JSON.stringify(read.data));
    assert.equal(read.data.email, email);
    console.log('OK  GET /students/:id');

    const updated = await call('PUT', `/students/${createdId}`, {
      name: 'Updated Assessment Student',
    });
    assert.equal(updated.status, 200, JSON.stringify(updated.data));
    const afterUpdate = await call('GET', `/students/${createdId}`);
    assert.equal(afterUpdate.data.name, 'Updated Assessment Student');
    assert.equal(afterUpdate.data.email, email);
    console.log('OK  PUT /students/:id (partial update preserved email)');

    const status = await call('POST', `/students/${createdId}/status`, { status: true });
    assert.equal(status.status, 200, JSON.stringify(status.data));
    const afterStatus = await call('GET', `/students/${createdId}`);
    assert.equal(afterStatus.data.systemAccess, true);
    console.log('OK  POST /students/:id/status');

    const removed = await call('DELETE', `/students/${createdId}`);
    assert.equal(removed.status, 200, JSON.stringify(removed.data));
    createdId = undefined;
    console.log('OK  DELETE /students/:id');

    assert.equal((await call('GET', `/students/${afterStatus.data.id}`)).status, 404);
    console.log('OK  GET deleted student => 404');

    console.log('All smoke tests passed.');
  } finally {
    if (createdId !== undefined) {
      const cleanup = await call('DELETE', `/students/${createdId}`);
      console.log(`Cleanup student ${createdId}: HTTP ${cleanup.status}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
