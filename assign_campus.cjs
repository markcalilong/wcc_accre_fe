const https = require('https');
function doFetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: opts.method || 'GET', headers: opts.headers || {}, timeout: 120000 }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const login = await doFetch('https://wcc-accre-bedev.onrender.com/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'Admin123' })
  });
  const token = login.data.token;
  const auth = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  console.log('Logged in via admin API');

  const usersResp = await doFetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/plugin::users-permissions.user?page=1&pageSize=100', {
    headers: auth
  });
  const allUsers = usersResp.results || [];
  console.log('Total users:', allUsers.length);

  // Get first user detail to see structure
  await sleep(1000);
  const sample = await doFetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/plugin::users-permissions.user/' + allUsers[0].documentId, {
    headers: auth
  });
  const sd = sample.data || sample;
  console.log('\nSample user keys:', Object.keys(sd).join(', '));
  console.log('campuses type:', typeof sd.campuses, Array.isArray(sd.campuses) ? 'array' : '');
  console.log('campuses value:', JSON.stringify(sd.campuses).substring(0, 200));
  console.log('personel_role:', JSON.stringify(sd.personel_role).substring(0, 200));

  const SKIP_USERNAMES = ['wccsuperadmin'];
  const toUpdate = [];

  for (let i = 0; i < allUsers.length; i++) {
    const u = allUsers[i];
    await sleep(500);
    const detail = await doFetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/plugin::users-permissions.user/' + u.documentId, {
      headers: auth
    });
    const ud = detail.data || detail;
    const role = ud.personel_role?.role || '';
    const username = (ud.username || '').toLowerCase();
    const campusArr = Array.isArray(ud.campuses) ? ud.campuses : (ud.campuses?.results || ud.campuses?.data || []);
    const campusStr = campusArr.map(c => c.campusDesc || c.id).join(',') || 'none';
    console.log(ud.id, ud.username, '| role:', role || 'none', '| campuses:', campusStr);

    if (SKIP_USERNAMES.includes(username)) { console.log('  -> SKIP (superadmin)'); continue; }
    if (role.toLowerCase() === 'authenticated') { console.log('  -> SKIP (authenticated)'); continue; }
    toUpdate.push({ id: ud.id, documentId: u.documentId, username: ud.username });
  }

  console.log('\nUsers to assign North Manila:', toUpdate.length);

  // Update via content-manager PUT
  let success = 0;
  for (const u of toUpdate) {
    try {
      await sleep(500);
      await doFetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/plugin::users-permissions.user/' + u.documentId, {
        method: 'PUT',
        headers: auth,
        body: JSON.stringify({ campuses: [1] })
      });
      success++;
      console.log('  Updated:', u.username);
    } catch (e) {
      console.log('  Failed:', u.username, e.message);
    }
  }
  console.log('\nDone! ' + success + '/' + toUpdate.length + ' users assigned to WCC ATC North Manila');
})().catch(e => console.error('ERR:', e.message));
