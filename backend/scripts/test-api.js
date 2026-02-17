/**
 * Quick API test: login with seeded credentials.
 * Run when backend is up (npm run dev) and DB is seeded:
 *   node scripts/test-api.js
 * Usage: BASE_URL=http://localhost:3001 node scripts/test-api.js
 */
const BASE = process.env.BASE_URL || 'http://localhost:3001';

async function test() {
  console.log('Testing I-ICTMS API at', BASE);
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantSlug: 'demo',
      email: 'admin@demo.local',
      password: 'Password1',
    }),
  });
  const data = await loginRes.json().catch(() => ({}));
  if (loginRes.ok && data.accessToken) {
    console.log('OK Login succeeded. User:', data.user?.fullName, '| Role:', data.user?.role);
    const dashRes = await fetch(`${BASE}/api/dashboards/ict-manager`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    if (dashRes.ok) {
      const dash = await dashRes.json();
      console.log('OK Dashboard loaded. Summary:', JSON.stringify(dash.summary, null, 2));
    } else {
      console.log('Dashboard request failed:', dashRes.status);
    }
  } else {
    console.log('FAIL Login failed:', loginRes.status, data.message || data);
  }
}

test().catch((e) => {
  if (e.cause?.code === 'ECONNREFUSED') {
    console.error('Cannot reach API. Start the backend first: npm run dev');
  } else {
    console.error(e.message || e);
  }
  process.exit(1);
});
