const https = require('https');
const fs = require('fs');

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
      timeout: 120000
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const BASE = 'https://wcc-accre-bedev.onrender.com';

// ============ BSHM (HRM) - Area II Faculty ============
const BSHM_CRITERIA = [
  {
    code: 'A', desc: 'Academic Qualifications', programs: 'BSHM',
    subcriteria: [
      { code: 'A.1', desc: 'The school has a policy on recruitment of faculty members which include qualifying tests, demo-teaching, and others' },
      { code: 'A.2', desc: 'The percentage of faculty members with earned graduate degrees meets accreditation standards' },
      { code: 'A.3', desc: 'At least 60% of the faculty handling the professional subject must be employed full-time' },
      { code: 'A.4', desc: 'Faculty members teach courses along their fields of specialization' },
      { code: 'A.5', desc: 'Faculty members are encouraged in continuing learning, and have other qualifications or above average teaching performance and professional practice or at least 3 years industry experience' },
      { code: 'A.6', desc: 'Faculty members teaching professional courses should be a graduate degree holder and/or practitioners with at least 3 years experience or hotel/restaurant owner/operator with practical exposure in HM fields' },
    ]
  },
  {
    code: 'B', desc: 'Professional Performance', programs: 'BSHM',
    subcriteria: [
      { code: 'B.1', desc: 'Faculty members implement objectives, show mastery, show preparedness, use creative teaching strategies, follow outcomes-based syllabi, are aware of recent trends, make creative use of resources, devote time for consultation, show competency development skills, and utilize assessment modes' },
      { code: 'B.2', desc: 'Faculty members show evidence of professional growth through research and publications, preparation of modules, coursewares, e-learning software, and present/publish research results' },
    ]
  },
  {
    code: 'C', desc: 'Teaching Assignment', programs: 'BSHM',
    subcriteria: [
      { code: 'C.1', desc: 'A policy for determining teaching assignments and number of subject preparations is followed' },
      { code: 'C.2', desc: 'The percentage of faculty members employed on full-time basis meets accreditation standards (General Education and Professional courses)' },
      { code: 'C.3', desc: 'Faculty members are given teaching assignments only along their fields of specialization (General Education and Professional courses)' },
      { code: 'C.4', desc: 'Teaching loads allow sufficient time for preparation of classes, adequate evaluation of student achievement, and consultation/mentoring/academic advising' },
      { code: 'C.5', desc: 'Provision is made for equitable distribution of extra-class responsibilities of faculty members' },
      { code: 'C.6', desc: 'The faculty-to-student ratio is generally satisfactory (pure lecture 1:40; laboratory classes 1:30)' },
      { code: 'C.7', desc: 'Provision is made to ensure that at least 60% of faculty members are employed on full time basis' },
      { code: 'C.8', desc: 'The teaching load of a regular full-time faculty member is from 12 to 24 units per semester' },
      { code: 'C.9', desc: 'In case of overload, full time lecturers are given a maximum of 3 units, with total faculty load not exceeding 27 units per semester' },
      { code: 'C.10', desc: 'The teaching load of a regular full-time laboratory instructor is from 9 units to 12 units or 36 hours/week' },
    ]
  },
  {
    code: 'D', desc: 'Rank, Tenure, Remuneration and Fringe Benefits', programs: 'BSHM',
    subcriteria: [
      { code: 'D.1', desc: 'The criteria for promotion in rank and remuneration include teaching ability, research/publications, academic degrees, teaching experience, industry/professional experience, university services, participation in activities, community/extension service, awards/recognition' },
      { code: 'D.2', desc: 'In the application of the criteria, recommendations of administrators, department chairman, students, and peers are considered' },
      { code: 'D.3', desc: 'The salary rates are adequate in meeting the economic and social demands of the profession' },
      { code: 'D.4', desc: 'The benefits and responsibilities of tenure are clearly described in the Faculty Manual or similar document' },
      { code: 'D.5', desc: 'There are definite policies for termination of employment' },
      { code: 'D.6', desc: 'Fringe benefits other than those mandated by law are extended to faculty members' },
    ]
  },
  {
    code: 'E', desc: 'Faculty Development', programs: 'BSHM',
    subcriteria: [
      { code: 'E.1', desc: 'Scholarship/fellowship/student grants (local and foreign)' },
      { code: 'E.2', desc: 'Faculty loans for professional growth' },
      { code: 'E.3', desc: 'Sabbatical leaves' },
      { code: 'E.4', desc: 'Research grants (in-house and external grants/funds)' },
      { code: 'E.5', desc: 'Tuition fee privilege for faculty (in-house and external grants/funds)' },
      { code: 'E.6', desc: 'Other faculty development provisions' },
      { code: 'E.7', desc: 'Institutional support along active membership in professional organizations, research/publications, attendance in seminars/workshops/conferences, faculty meetings, and committee participation' },
      { code: 'E.8', desc: 'In-service faculty development within and outside the institution including workshops, colloquia, seminars, conferences, industry immersions, round table discussions, and specialized training' },
    ]
  },
];

// ============ BSIT (IT) - Area II Faculty ============
const BSIT_CRITERIA = [
  {
    code: 'A', desc: 'Academic Qualifications', programs: 'BSIT',
    subcriteria: [
      { code: 'A.1', desc: 'The school has a policy on recruitment of faculty members' },
      { code: 'A.2', desc: 'The percentage of faculty members with earned ITE graduate degrees meets accreditation standards' },
      { code: 'A.3', desc: 'Faculty members teach courses along their fields of specialization' },
      { code: 'A.4', desc: 'Deficiencies in graduate degrees of faculty members are compensated by other qualifications such as ITE-related research, industry experience and/or IT certifications' },
      { code: 'A.5', desc: 'Faculty members assigned in Practicum Courses/OJT have at least three years of teaching/industry experience along their specialized fields of study' },
      { code: 'A.6', desc: 'Faculty members are engaged in extension services such as consultancy, industry lecture/training, collaborative research/project partnership, industry immersion, and others' },
    ]
  },
  {
    code: 'B', desc: 'Professional Performance', programs: 'BSIT',
    subcriteria: [
      { code: 'B.1', desc: 'Endeavor to implement the philosophy and objectives of the institution and the specific objectives of the program under survey' },
      { code: 'B.2', desc: 'Enrich their lesson through additional readings and creative use of library resources and other instructional/learning resources' },
      { code: 'B.3', desc: 'Show mastery of the subject matter and preparedness for their classes' },
      { code: 'B.4', desc: 'Are aware of recent educational/technological trends and problems and are able to relate the subject matter to current issues' },
      { code: 'B.5', desc: 'Devote time to students for consultation/mentoring/academic advising outside of the classroom' },
    ]
  },
  {
    code: 'C', desc: 'Teaching Assignment', programs: 'BSIT',
    subcriteria: [
      { code: 'C.1', desc: 'A policy for determining teaching assignments and number of subject preparations is followed' },
      { code: 'C.2', desc: 'The percentage of faculty members employed on full-time basis meets accreditation standards (General Education and Professional courses)' },
      { code: 'C.3', desc: 'Faculty members are given teaching assignments only along their fields of specialization (General Education and Professional courses)' },
      { code: 'C.4', desc: 'Teaching loads allow sufficient time for preparation of classes, adequate evaluation of student achievement, and consultation/mentoring/academic advising' },
      { code: 'C.5', desc: 'The quality of teaching performance is considered when assigning faculty load' },
      { code: 'C.6', desc: 'Provision is made for the equitable distribution of co-curricular assignments of faculty members (advisorship, membership, chairmanship, etc.)' },
    ]
  },
  {
    code: 'D', desc: 'Rank, Tenure, Remuneration and Fringe Benefits', programs: 'BSIT',
    subcriteria: [
      { code: 'D.1', desc: 'The criteria for promotion in rank and remuneration include teaching ability, research/publications, academic degrees earned, professional development, teaching experience, participation in activities, and community/extension service' },
      { code: 'D.2', desc: 'In the application of the criteria, recommendations of administrators, department chairman, and students are considered' },
      { code: 'D.3', desc: 'The benefits and responsibilities of tenure are clearly described in the Faculty Manual or similar document' },
      { code: 'D.4', desc: 'There are definite policies for termination of employment' },
      { code: 'D.5', desc: 'Fringe benefits other than those mandated by law are extended to faculty members' },
    ]
  },
  {
    code: 'E', desc: 'Faculty Development', programs: 'BSIT',
    subcriteria: [
      { code: 'E.1', desc: 'The faculty development program is based on the training needs analysis of faculty members' },
      { code: 'E.2', desc: 'An appropriate budget is provided to implement the faculty development program' },
      { code: 'E.3.1', desc: 'Scholarships/study grants/fellowships (institutional, local, regional, national, international)' },
      { code: 'E.3.2', desc: 'Attendance to seminars/conferences/workshops (institutional, local, regional, national, international)' },
      { code: 'E.3.3', desc: 'Training (institutional, local, regional, national, international)' },
      { code: 'E.3.4', desc: 'Membership in professional organizations/committees (institutional, local, regional, national, international)' },
      { code: 'E.3.5', desc: 'Officership in professional organizations (institutional, local, regional, national, international)' },
      { code: 'E.3.6', desc: 'Industry immersion (regional, national, international)' },
    ]
  },
  {
    code: 'F', desc: 'Research and Publications', programs: 'BSIT',
    subcriteria: [
      { code: 'F.1', desc: 'The research structure of the institution/college/program is clearly drawn and understood by the faculty members' },
      { code: 'F.2', desc: 'The program under survey has a specific research agenda covering activities that promote the attainment of program outcomes' },
      { code: 'F.3', desc: 'A research policy is implemented' },
      { code: 'F.4', desc: 'Research budget and incentives are in place' },
      { code: 'F.5.1', desc: 'Evidence of research outputs through research posters (institutional, local, regional, national, international)' },
      { code: 'F.5.2', desc: 'Evidence of research outputs through articles, modules, manuals, and books (institutional, local, regional, national, international)' },
      { code: 'F.5.3', desc: 'Evidence of research outputs through system/software development projects (institutional, local, regional, national, international)' },
      { code: 'F.6', desc: 'Research presentation is evident (institutional, local, regional, national, international)' },
      { code: 'F.7', desc: 'Research outputs are published (institutional, local, regional, national, international)' },
      { code: 'F.8', desc: 'There is research utilization/technology transfer (non-commercial and commercial)' },
    ]
  },
];

// ============ BSCRIM (CRIM) - Area II Faculty ============
const BSCRIM_CRITERIA = [
  {
    code: 'A', desc: 'Academic Qualifications', programs: 'BSCRIM',
    subcriteria: [
      { code: 'A.1', desc: 'The school has a policy on recruitment of faculty members' },
      { code: 'A.2', desc: 'The percentage of faculty members with earned graduate degrees in Criminology meets accreditation standards' },
      { code: 'A.3', desc: 'Faculty members teach courses along their fields of specialization' },
      { code: 'A.4', desc: 'Deficiencies in graduate degrees of faculty members are compensated by other qualifications such as Criminology-related research, industry experience and/or relevant certifications' },
      { code: 'A.5', desc: 'Faculty members assigned in Practicum Courses/OJT have at least three years of teaching/industry experience along their specialized fields of study' },
      { code: 'A.6', desc: 'Faculty members are engaged in extension services such as consultancy, industry lecture/training, collaborative research/project partnership, industry immersion, and others' },
    ]
  },
  {
    code: 'B', desc: 'Professional Performance', programs: 'BSCRIM',
    subcriteria: [
      { code: 'B.1', desc: 'Endeavor to implement the philosophy and objectives of the institution and the specific objectives of the program under survey' },
      { code: 'B.2', desc: 'Enrich their lesson through additional readings and creative use of library resources and other instructional/learning resources' },
      { code: 'B.3', desc: 'Show mastery of the subject matter and preparedness for their classes' },
      { code: 'B.4', desc: 'Are aware of recent educational/technological trends and problems and are able to relate the subject matter to current issues' },
      { code: 'B.5', desc: 'Devote time to students for consultation/mentoring/academic advising outside of the classroom' },
    ]
  },
  {
    code: 'C', desc: 'Teaching Assignment', programs: 'BSCRIM',
    subcriteria: [
      { code: 'C.1', desc: 'A policy for determining teaching assignments and number of subject preparations is adopted and followed' },
      { code: 'C.2', desc: 'The percentage of faculty members employed on full-time basis meets accreditation standards (General Education and Professional courses)' },
      { code: 'C.3', desc: 'Faculty members are given teaching assignments only along their fields of specialization (General Education and Professional courses)' },
      { code: 'C.4', desc: 'Teaching loads allow sufficient time for preparation of classes, adequate evaluation of student achievement, and consultation/mentoring/academic advising' },
      { code: 'C.5', desc: 'The quality of teaching performance is considered when assigning faculty load' },
      { code: 'C.6', desc: 'Provision is made for the equitable distribution of co-curricular assignments of faculty members (advisorship, membership, chairmanship, etc.)' },
    ]
  },
  {
    code: 'D', desc: 'Rank, Tenure, Remuneration and Fringe Benefits', programs: 'BSCRIM',
    subcriteria: [
      { code: 'D.1', desc: 'The criteria for promotion in rank and remuneration include teaching ability, research/publications, academic degrees earned, professional development, teaching experience, participation in activities, and community/extension service' },
      { code: 'D.2', desc: 'In the application of the criteria, recommendations of administrators, department chairman, and students are considered' },
      { code: 'D.3', desc: 'The benefits and responsibilities of tenure are clearly described in the Faculty Manual or similar document' },
      { code: 'D.4', desc: 'There are definite policies for termination of employment' },
      { code: 'D.5', desc: 'Fringe benefits other than those mandated by law are extended to faculty members' },
    ]
  },
  {
    code: 'E', desc: 'Faculty Development', programs: 'BSCRIM',
    subcriteria: [
      { code: 'E.1', desc: 'The faculty development program is based on the training needs analysis of faculty members' },
      { code: 'E.2', desc: 'An appropriate budget is provided to implement the faculty development program' },
      { code: 'E.3.1', desc: 'Scholarships/study grants/fellowships (institutional, local, regional, national, international)' },
      { code: 'E.3.2', desc: 'Attendance to seminars/conferences/workshops (institutional, local, regional, national, international)' },
      { code: 'E.3.3', desc: 'Training (institutional, local, regional, national, international)' },
      { code: 'E.3.4', desc: 'Membership in professional organizations/committees (institutional, local, regional, national, international)' },
      { code: 'E.3.5', desc: 'Officership in professional organizations (institutional, local, regional, national, international)' },
      { code: 'E.3.6', desc: 'Industry immersion (regional, national, international)' },
    ]
  },
  {
    code: 'F', desc: 'Research and Publications', programs: 'BSCRIM',
    subcriteria: [
      { code: 'F.1', desc: 'The research structure of the institution/college/program is clearly drawn and understood by the faculty members' },
      { code: 'F.2', desc: 'The program under survey has a specific research agenda covering activities that promote the attainment of program outcomes' },
      { code: 'F.3', desc: 'A research policy is implemented' },
      { code: 'F.4', desc: 'Research budget and incentives are in place' },
      { code: 'F.5.1', desc: 'Evidence of research outputs through research posters (institutional, local, regional, national, international)' },
      { code: 'F.5.2', desc: 'Evidence of research outputs through articles, modules, manuals, and books (institutional, local, regional, national, international)' },
      { code: 'F.5.3', desc: 'Evidence of research outputs through system/software development projects (institutional, local, regional, national, international)' },
      { code: 'F.6', desc: 'Research presentation is evident (institutional, local, regional, national, international)' },
      { code: 'F.7', desc: 'Research outputs are published (institutional, local, regional, national, international)' },
      { code: 'F.8', desc: 'There is research utilization/technology transfer (non-commercial and commercial)' },
    ]
  },
];

// ============ BSBA (CBA) - Area II Faculty ============
const BSBA_CRITERIA = [
  {
    code: 'A', desc: 'Academic Qualifications', programs: 'BSBA',
    subcriteria: [
      { code: 'A.1', desc: 'The school has a policy on recruitment, selection and hiring of faculty members' },
      { code: 'A.2', desc: 'Faculty members teaching accounting courses are all CPAs' },
      { code: 'A.3', desc: 'Faculty members teaching taxation courses are CPAs, lawyers or CPA-lawyers' },
      { code: 'A.4', desc: 'Faculty members teaching business law courses are lawyers preferably CPA-lawyers' },
      { code: 'A.5', desc: 'The percentage of faculty members with earned graduate degree complies with accreditation requirements' },
      { code: 'A.6', desc: 'Faculty members teach courses along their field of specialization' },
      { code: 'A.7', desc: 'Deficiencies in degree of faculty members are compensated by other qualifications such as satisfactory teaching experience, outstanding professional practice and entrepreneurial experience' },
      { code: 'A.8', desc: 'Faculty members assigned in Practicum/OJT have at least three years of experience along their specialized field of study' },
      { code: 'A.9', desc: 'Faculty members are updated on global and current trends in the industry' },
    ]
  },
  {
    code: 'B', desc: 'Professional Performance', programs: 'BSBA',
    subcriteria: [
      { code: 'B.1', desc: 'Endeavor to implement the philosophy and objectives of the institution and the specific objectives of the program under survey' },
      { code: 'B.2', desc: 'Follow the syllabi and enrich them through additional readings, and creative use of library resources and other instructional/learning resources' },
      { code: 'B.3', desc: 'Show mastery of the subject matter and preparedness for their classes' },
      { code: 'B.4', desc: 'Are aware of recent educational/technological trends and problems and are able to relate the subject matter to current local and global issues' },
      { code: 'B.5', desc: 'Devote time to students for consultation/mentoring/academic advising outside of the classroom' },
      { code: 'B.6', desc: 'Show evidence of professional growth through membership in recognized educational organizations and professional associations' },
    ]
  },
  {
    code: 'C', desc: 'Teaching Assessment', programs: 'BSBA',
    subcriteria: [
      { code: 'C.1', desc: 'A policy of determining teaching assignment and number of appropriate subject preparation is followed' },
      { code: 'C.2', desc: 'The percentage of faculty members employed on a full-time basis meets accreditation requirements (General Education and Professional courses)' },
      { code: 'C.3', desc: 'Faculty members are given teaching assignments only in their major fields of specialization (General Education and Professional courses)' },
      { code: 'C.4', desc: 'Teaching loads of faculty members (both full-time and part-time) allow sufficient time for preparation of classes and adequate evaluation of student achievement' },
      { code: 'C.5', desc: 'The quality of teaching performance is considered when assigning faculty load' },
      { code: 'C.6', desc: 'Provision is made for the equitable distribution of co-curricular assignments of faculty members (advisorship, membership, chairmanship, etc.)' },
    ]
  },
  {
    code: 'D', desc: 'Rank, Tenure, Remuneration and Fringe Benefits', programs: 'BSBA',
    subcriteria: [
      { code: 'D.1', desc: 'The criteria for promotion in rank and salary include teaching proficiency, research/publications, academic degrees earned, continuing professional education, university services, teaching experience, community service, professional expertise/experience' },
      { code: 'D.2', desc: 'In the application of the criteria, recommendations of administrators, department chairperson, students, and others are considered' },
      { code: 'D.3', desc: 'Fringe benefits other than those mandated by law are extended to faculty members' },
      { code: 'D.4', desc: 'The benefits and responsibilities of tenure are clearly described in the Faculty Manual or similar document' },
      { code: 'D.5', desc: 'There are definite policies for termination of employment' },
    ]
  },
  {
    code: 'E', desc: 'Faculty Development', programs: 'BSBA',
    subcriteria: [
      { code: 'E.1', desc: 'The faculty development program is based on the training needs analysis of faculty members' },
      { code: 'E.2', desc: 'An appropriate budget is provided to implement the faculty development program' },
      { code: 'E.3', desc: 'The faculty development program of the college gives provisions for scholarships, study grants, seminars, conferences, workshops, training, membership in professional organizations, and industry immersion' },
    ]
  },
];

(async () => {
  // Login
  let login;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      login = await fetch(BASE + '/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@gmail.com', password: 'Admin123' })
      });
      if (login.data && login.data.token) break;
    } catch (e) {
      console.log('Login attempt ' + attempt + ' failed: ' + e.message);
      if (attempt < 3) { console.log('Retrying in 10s...'); await sleep(10000); }
      else throw e;
    }
  }
  const token = login.data.token;
  const auth = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  console.log('Logged in successfully\n');

  // Find Area II
  const areasResp = await fetch(BASE + '/content-manager/collection-types/api::area.area?page=1&pageSize=100', { headers: auth });
  const areas = areasResp.results || [];
  const areaII = areas.find(a => a.area && a.area.startsWith('II.'));
  if (!areaII) throw new Error('Area II not found!');
  console.log('Found: ' + areaII.area + ' (docId: ' + areaII.documentId + ')');

  // Get full detail
  await sleep(2000);
  const detail = await fetch(BASE + '/content-manager/collection-types/api::area.area/' + areaII.documentId, { headers: auth });
  const areaData = detail.data || detail;
  const existing = areaData.areaCriteria || [];
  console.log('Existing criteria: ' + existing.length);

  // Merge all 4 programs
  const allNew = [...BSHM_CRITERIA, ...BSIT_CRITERIA, ...BSCRIM_CRITERIA, ...BSBA_CRITERIA];
  const merged = [...existing, ...allNew];
  console.log('Adding ' + allNew.length + ' new criteria (' +
    BSHM_CRITERIA.length + ' BSHM + ' +
    BSIT_CRITERIA.length + ' BSIT + ' +
    BSCRIM_CRITERIA.length + ' BSCRIM + ' +
    BSBA_CRITERIA.length + ' BSBA)');
  console.log('Total after merge: ' + merged.length);

  // PUT update
  await sleep(2000);
  const payload = { areaCriteria: merged };
  const result = await fetch(BASE + '/content-manager/collection-types/api::area.area/' + areaII.documentId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify(payload)
  });

  if (result.data || result.areaCriteria) {
    const updated = (result.data || result).areaCriteria || [];
    console.log('\nSuccess! Total criteria now: ' + updated.length);

    // Summary by program
    const byProgram = {};
    updated.forEach(c => {
      const prog = c.programs || 'universal';
      if (!byProgram[prog]) byProgram[prog] = [];
      byProgram[prog].push(c);
    });

    console.log('\n--- Breakdown by Program ---');
    for (const [prog, criteria] of Object.entries(byProgram)) {
      const subCount = criteria.reduce((sum, c) => sum + (c.subcriteria || []).length, 0);
      console.log(prog + ': ' + criteria.length + ' criteria, ' + subCount + ' subcriteria');
      criteria.forEach(c => console.log('  ' + c.code + ': ' + c.desc));
    }
  } else {
    console.error('Update may have failed:', JSON.stringify(result).substring(0, 500));
  }

  console.log('\n========================================');
  console.log('  ALL AREA II PROGRAMS ADDED');
  console.log('========================================');
})().catch(err => console.error('FATAL:', err.message));
