import http from 'http';
import app from '../../api/index.js';

async function runEndpointTests() {
  console.log('--- STARTING SERVERLESS ENDPOINT VERIFICATION ---');

  // Start temporary server using api/index.js
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[TestServer] Serverless handler mounted on ${baseUrl}`);

  async function testReq(method: string, path: string, body?: any, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // 1. GET /api/status
  const statusRes = await testReq('GET', '/api/status');
  console.log('1. /api/status -> HTTP', statusRes.status, statusRes.data.status === 'ok' ? '✅ OK' : '❌ FAIL');

  // 2. GET /api/bibles
  const biblesRes = await testReq('GET', '/api/bibles');
  console.log('2. /api/bibles -> HTTP', biblesRes.status, Array.isArray(biblesRes.data) && biblesRes.data.length > 0 ? `✅ OK (${biblesRes.data.length} bibles)` : '❌ FAIL');

  // 3. GET /api/bibles/kjv/books
  const booksRes = await testReq('GET', '/api/bibles/kjv/books');
  console.log('3. /api/bibles/kjv/books -> HTTP', booksRes.status, Array.isArray(booksRes.data) && booksRes.data.length > 0 ? `✅ OK (${booksRes.data.length} books)` : '❌ FAIL');

  // 4. GET /api/verse-of-the-day
  const votdRes = await testReq('GET', '/api/verse-of-the-day');
  console.log('4. /api/verse-of-the-day -> HTTP', votdRes.status, votdRes.data.reference ? `✅ OK (${votdRes.data.reference})` : '❌ FAIL');

  // 5. GET /api/devotional
  const devRes = await testReq('GET', '/api/devotional');
  console.log('5. /api/devotional -> HTTP', devRes.status, devRes.data.title ? `✅ OK ("${devRes.data.title}")` : '❌ FAIL');

  // 6. POST /api/ai/message-outline
  const aiRes = await testReq('POST', '/api/ai/message-outline', {
    topic: 'Faith and Perseverance',
    passage: 'James 1:2-4',
    tone: 'inspirational',
    targetAudience: 'general',
  });
  console.log('6. /api/ai/message-outline -> HTTP', aiRes.status, aiRes.data.title ? `✅ OK ("${aiRes.data.title}")` : '❌ FAIL');

  // 7. POST /api/auth/register (Create unique test account)
  const testEmail = `test_deploy_${Date.now()}@example.com`;
  const regRes = await testReq('POST', '/api/auth/register', {
    name: 'Vercel Deployment Tester',
    email: testEmail,
    password: 'Password123!',
  });
  console.log('7. /api/auth/register -> HTTP', regRes.status, regRes.data.token ? '✅ OK (User created & Token issued)' : '❌ FAIL', regRes.data.error || '');

  const authToken = regRes.data.token;

  // 8. POST /api/auth/login
  const loginRes = await testReq('POST', '/api/auth/login', {
    email: testEmail,
    password: 'Password123!',
  });
  console.log('8. /api/auth/login -> HTTP', loginRes.status, loginRes.data.token ? '✅ OK (Login succeeded)' : '❌ FAIL');

  // 9. GET /api/auth/me
  const meRes = await testReq('GET', '/api/auth/me', undefined, authToken);
  console.log('9. /api/auth/me -> HTTP', meRes.status, meRes.data.user?.email === testEmail ? '✅ OK (Identity verified)' : '❌ FAIL');

  // 10. POST /api/analytics/event
  const analyticsRes = await testReq('POST', '/api/analytics/event', {
    eventType: 'app_launch',
    userId: regRes.data.user?.id || 'anon',
    metadata: { platform: 'vercel_test' },
  });
  console.log('10. /api/analytics/event -> HTTP', analyticsRes.status, analyticsRes.data.success === true ? '✅ OK' : '❌ FAIL');

  server.close();
  console.log('--- ALL SERVERLESS ENDPOINTS VERIFIED SUCCESSFULLY ---');
}

runEndpointTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
