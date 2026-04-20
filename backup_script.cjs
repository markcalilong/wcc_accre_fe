const https = require('https');
const fs = require('fs');

function fetchOnce(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
      timeout: opts.timeout || 120000
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Parse error: ' + data.substring(0, 200))); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function fetch(url, opts = {}) {
  const maxRetries = 4;
  let lastErr;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchOnce(url, opts);
    } catch (e) {
      lastErr = e;
      console.log('  retry ' + (i + 1) + '/' + maxRetries + ' after ' + e.message);
      await new Promise(r => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw lastErr;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const login = await fetch('https://wcc-accre-bedev.onrender.com/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'Admin123' })
  });
  const token = login.data.token;
  const authHeaders = { 'Authorization': 'Bearer ' + token };
  console.log('Logged in successfully');

  const backup = {};

  // 1. Areas
  console.log('Fetching areas...');
  const areasResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::area.area?page=1&pageSize=100', { headers: authHeaders });
  const areasList = areasResp.results || [];
  console.log('Found ' + areasList.length + ' areas');

  const areasDetailed = [];
  for (const a of areasList) {
    await sleep(1000);
    console.log('  Fetching: ' + a.area);
    const detail = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::area.area/' + a.documentId, { headers: authHeaders });
    const d = detail.data || detail;
    areasDetailed.push(d);
    let critCount = (d.areaCriteria || []).length;
    let subCount = 0;
    (d.areaCriteria || []).forEach(c => { subCount += (c.subcriteria || []).length; });
    console.log('    criteria: ' + critCount + ', subcriteria: ' + subCount);
  }
  backup.areas = areasDetailed;

  // 2. Campuses
  await sleep(1000);
  console.log('Fetching campuses...');
  const campResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::campus.campus?page=1&pageSize=100', { headers: authHeaders });
  backup.campuses = campResp.results || [];
  console.log('  Found ' + backup.campuses.length);

  // 3. Semesters
  await sleep(1000);
  console.log('Fetching semesters...');
  const semResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::semester.semester?page=1&pageSize=100', { headers: authHeaders });
  backup.semesters = semResp.results || [];
  console.log('  Found ' + backup.semesters.length);

  // 4. Academic Years
  await sleep(1000);
  console.log('Fetching academic years...');
  const yearResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::academic-year.academic-year?page=1&pageSize=100', { headers: authHeaders });
  backup.academic_years = yearResp.results || [];
  console.log('  Found ' + backup.academic_years.length);

  // 5. Academic Programs
  await sleep(1000);
  console.log('Fetching academic programs...');
  const progResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::academic-program.academic-program?page=1&pageSize=100', { headers: authHeaders });
  backup.academic_programs = progResp.results || [];
  console.log('  Found ' + backup.academic_programs.length);

  // 6. Visit Types
  await sleep(1000);
  console.log('Fetching visit types...');
  const visitResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::visit-type.visit-type?page=1&pageSize=100', { headers: authHeaders });
  backup.visit_types = visitResp.results || [];
  console.log('  Found ' + backup.visit_types.length);

  // 7. Personel Roles
  await sleep(1000);
  console.log('Fetching personel roles...');
  const roleResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::personel-role.personel-role?page=1&pageSize=100', { headers: authHeaders });
  backup.personel_roles = roleResp.results || [];
  console.log('  Found ' + backup.personel_roles.length);

  // 8. Program Types
  await sleep(1000);
  console.log('Fetching program types...');
  const ptResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::program-type.program-type?page=1&pageSize=100', { headers: authHeaders });
  backup.program_types = ptResp.results || [];
  console.log('  Found ' + backup.program_types.length);

  // 9. Users
  await sleep(1000);
  console.log('Fetching users...');
  const apiUsersResp = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/plugin::users-permissions.user?page=1&pageSize=100', { headers: authHeaders });
  backup.users = apiUsersResp.results || [];
  console.log('  Found ' + backup.users.length);

  // Write backup
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = 'db_backup_' + timestamp + '_complete.json';
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

  // Summary
  console.log('\n========================================');
  console.log('         BACKUP COMPLETE');
  console.log('========================================');
  console.log('File: ' + filename);

  let totalCriteria = 0, totalSubcriteria = 0;
  backup.areas.forEach(a => {
    (a.areaCriteria || []).forEach(c => {
      totalCriteria++;
      totalSubcriteria += (c.subcriteria || []).length;
    });
  });

  console.log('\nAreas:             ' + backup.areas.length);
  console.log('Total Criteria:    ' + totalCriteria);
  console.log('Total Subcriteria: ' + totalSubcriteria);
  console.log('Campuses:          ' + backup.campuses.length);
  console.log('Semesters:         ' + backup.semesters.length);
  console.log('Academic Years:    ' + backup.academic_years.length);
  console.log('Academic Programs: ' + backup.academic_programs.length);
  console.log('Visit Types:       ' + backup.visit_types.length);
  console.log('Personel Roles:    ' + backup.personel_roles.length);
  console.log('Program Types:     ' + backup.program_types.length);
  console.log('Users:             ' + backup.users.length);

  console.log('\n--- SUBCRITERIA BREAKDOWN ---');
  backup.areas.forEach(a => {
    const subs = [];
    (a.areaCriteria || []).forEach(c => {
      (c.subcriteria || []).forEach(s => subs.push(c.code + ' > ' + s.code + ': ' + s.desc));
    });
    console.log(a.area + ' (' + (a.areaCriteria || []).length + ' criteria, ' + subs.length + ' subcriteria)');
    subs.forEach(s => console.log('  ' + s));
  });

  console.log('\n--- PERSONEL ROLES ---');
  backup.personel_roles.forEach(r => console.log('  ' + r.role));

  console.log('\n--- USERS ---');
  backup.users.forEach(u => console.log('  ' + u.username + ' | ' + (u.personel_role?.role || u.role?.name || 'no role')));

  const stats = fs.statSync(filename);
  console.log('\nFile size: ' + (stats.size / 1024).toFixed(1) + ' KB');
})().catch(err => console.error('FATAL:', err.message));
