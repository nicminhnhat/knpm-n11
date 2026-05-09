// KNPM N11 smoke test script
// Cach dung: dam bao backend dang chay http://localhost:3001, sau do chay: node knpm_smoke_test.js
// Co the doi API URL: $env:BASE_URL='http://localhost:3001'; node knpm_smoke_test.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123456';
const suffix = Date.now();

let pass = 0;
let fail = 0;
const state = {};

function log(ok, name, info = '') {
  const icon = ok ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} - ${name}${info ? ' - ' + info : ''}`);
  ok ? pass++ : fail++;
}

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

async function expectSuccess(name, method, path, body, token) {
  try {
    const r = await req(method, path, body, token);
    const ok = r.ok && r.data?.success !== false;
    log(ok, name, `${method} ${path} -> ${r.status}`);
    if (!ok) console.log('   Response:', JSON.stringify(r.data, null, 2));
    return r;
  } catch (e) {
    log(false, name, e.message);
    return { ok: false, data: {} };
  }
}

async function expectFail(name, method, path, body, token) {
  try {
    const r = await req(method, path, body, token);
    const ok = !r.ok || r.data?.success === false;
    log(ok, name, `${method} ${path} -> ${r.status}`);
    if (!ok) console.log('   Expected fail, got:', JSON.stringify(r.data, null, 2));
    return r;
  } catch (e) {
    log(false, name, e.message);
    return { ok: false, data: {} };
  }
}

async function main() {
  console.log(`\n=== KNPM N11 SMOKE TEST: ${BASE_URL} ===\n`);

  await expectSuccess('Backend root', 'GET', '/');
  await expectSuccess('Health API', 'GET', '/api/health');
  await expectSuccess('Health DB', 'GET', '/api/health/db');

  const studentEmail = `student_${suffix}@test.local`;
  const landlordEmail = `landlord_${suffix}@test.local`;
  const password = '123456';

  let r = await expectSuccess('Register student', 'POST', '/api/auth/register', {
    fullName: 'Sinh Vien Test', email: studentEmail, password, role: 'STUDENT'
  });
  state.studentToken = r.data.token;
  state.studentId = r.data.user?.id;

  r = await expectSuccess('Register landlord', 'POST', '/api/auth/register', {
    fullName: 'Chu Tro Test', email: landlordEmail, password, role: 'LANDLORD', phone: `09${String(suffix).slice(-8)}`
  });
  state.landlordToken = r.data.token;
  state.landlordId = r.data.user?.id;

  r = await expectSuccess('Login admin', 'POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  state.adminToken = r.data.token;
  if (!state.adminToken) {
    console.log('\nKhong login duoc admin. Hay kiem tra da chay npm.cmd run seed:admin chua, va ADMIN_EMAIL/ADMIN_PASSWORD trong .env.\n');
  }

  await expectSuccess('Login student', 'POST', '/api/auth/login', { email: studentEmail, password });
  await expectSuccess('Login landlord', 'POST', '/api/auth/login', { email: landlordEmail, password });
  await expectSuccess('Get current student /me', 'GET', '/api/auth/me', undefined, state.studentToken);
  await expectSuccess('Update student profile', 'PUT', '/api/profile', { fullName: 'Sinh Vien Test Updated' }, state.studentToken);

  await expectFail('Unverified landlord cannot create room', 'POST', '/api/landlord/rooms', {
    title: 'Phong test truoc xac minh', description: 'Phong nay dung de test', address: 'Hue', price: 1000000, area: 20
  }, state.landlordToken);

  r = await expectSuccess('Landlord submit verification', 'POST', '/api/verification/requests', {
    fullName: 'Chu Tro Test', phone: '0900000000', address: 'Hue', documentType: 'CCCD', documentNumber: `CCCD${suffix}`, documentUrl: 'https://example.com/cccd-test.jpg'
  }, state.landlordToken);
  state.verificationId = r.data.request?.id;

  if (state.adminToken && state.verificationId) {
    await expectSuccess('Admin list verifications', 'GET', '/api/admin/verifications?status=PENDING', undefined, state.adminToken);
    await expectSuccess('Admin approve landlord verification', 'PATCH', `/api/admin/verifications/${state.verificationId}`, { action: 'approve' }, state.adminToken);
  }

  r = await expectSuccess('Verified landlord create room', 'POST', '/api/landlord/rooms', {
    title: `Phong tro test ${suffix}`,
    description: 'Phong rong, gan truong, co wifi va cho de xe.',
    address: '77 Nguyen Hue, Hue',
    district: 'Hue',
    price: 1500000,
    area: 22,
    type: 'SINGLE',
    amenities: ['wifi', 'parking'],
    images: [{ url: 'https://example.com/room.jpg', alt: 'Phong test' }]
  }, state.landlordToken);
  state.roomId = r.data.room?.id;

  if (state.roomId) {
    await expectSuccess('Landlord update room status', 'PATCH', `/api/landlord/rooms/${state.roomId}/status`, { status: 'AVAILABLE' }, state.landlordToken);
    r = await expectSuccess('Landlord create post', 'POST', '/api/landlord/posts', {
      roomId: state.roomId,
      title: `Bai dang test ${suffix}`,
      description: 'Bai dang cho thue phong test day du thong tin de admin duyet.'
    }, state.landlordToken);
    state.postId = r.data.post?.id;
  }

  if (state.adminToken && state.postId) {
    await expectSuccess('Admin list pending posts', 'GET', '/api/admin/posts?status=PENDING', undefined, state.adminToken);
    await expectSuccess('Admin approve post', 'PATCH', `/api/admin/posts/${state.postId}/moderate`, { action: 'approve' }, state.adminToken);
  }

  await expectSuccess('Public list rooms', 'GET', '/api/rooms');
  if (state.roomId) await expectSuccess('Public room detail', 'GET', `/api/rooms/${state.roomId}`);
  await expectSuccess('Public list posts', 'GET', '/api/posts');
  if (state.postId) await expectSuccess('Public post detail', 'GET', `/api/posts/${state.postId}`);

  if (state.roomId) {
    await expectSuccess('Student add favorite', 'POST', `/api/favorites/${state.roomId}`, {}, state.studentToken);
    await expectSuccess('Student list favorites', 'GET', '/api/favorites', undefined, state.studentToken);
    await expectSuccess('Student review room', 'POST', `/api/rooms/${state.roomId}/reviews`, { rating: 5, content: 'Phong tot, thong tin ro rang.' }, state.studentToken);
    await expectSuccess('Public list room reviews', 'GET', `/api/rooms/${state.roomId}/reviews`);
  }

  if (state.postId) {
    r = await expectSuccess('Student report post', 'POST', '/api/reports', { postId: state.postId, reason: 'Test bao cao vi pham', content: 'Noi dung bao cao test.' }, state.studentToken);
    state.reportId = r.data.report?.id;

    r = await expectSuccess('Student create message thread', 'POST', '/api/messages/threads', { postId: state.postId, content: 'Em muon hoi them ve phong nay.' }, state.studentToken);
    state.threadId = r.data.thread?.id;
  }

  if (state.threadId) {
    await expectSuccess('Landlord send reply message', 'POST', `/api/messages/threads/${state.threadId}/messages`, { content: 'Phong con trong, em co the hen lich xem.' }, state.landlordToken);
    await expectSuccess('Student list thread messages', 'GET', `/api/messages/threads/${state.threadId}/messages`, undefined, state.studentToken);
  }

  if (state.adminToken && state.reportId) {
    await expectSuccess('Admin list reports', 'GET', '/api/admin/reports?status=PENDING', undefined, state.adminToken);
    await expectSuccess('Admin resolve report', 'PATCH', `/api/admin/reports/${state.reportId}/resolve`, { action: 'resolve', adminNote: 'Da kiem tra bao cao test.' }, state.adminToken);
  }

  if (state.adminToken) {
    await expectSuccess('Admin list users', 'GET', '/api/admin/users', undefined, state.adminToken);
    await expectSuccess('Admin dashboard', 'GET', '/api/admin/dashboard', undefined, state.adminToken);
  }

  await expectSuccess('Student notifications', 'GET', '/api/notifications', undefined, state.studentToken);
  await expectSuccess('Landlord notifications', 'GET', '/api/notifications', undefined, state.landlordToken);

  console.log(`\n=== KET QUA: ${pass} PASS, ${fail} FAIL ===`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Smoke test crashed:', error);
  process.exitCode = 1;
});
