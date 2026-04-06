const https = require('https');

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

// ============ BSHM (HRM) - Area III Instruction ============
const BSHM_CRITERIA = [
  {
    code: 'A', desc: 'Program Studies', programs: 'BSHM',
    subcriteria: [
      { code: 'A.1', desc: 'The program of studies is responsive and relevant to the needs of the community/region and/or the larger society (specific and allied industry-sectors)' },
      { code: 'A.2', desc: 'The course offerings exceed the minimum requirements of CHED' },
      { code: 'A.3', desc: 'The program of studies provides an adequate program of general education professional courses, food courses and electives; reflects national aspirations; implements institutional and program objectives and desired program outcomes' },
      { code: 'A.4', desc: 'The courses correspond to the description given in the college bulletin/catalogue' },
      { code: 'A.5', desc: 'The sequence of subjects/courses is logical and realistic' },
      { code: 'A.6', desc: 'Prerequisites are strictly complied with' },
      { code: 'A.7', desc: 'The curriculum structure provides for flexibility through a system of electives' },
      { code: 'A.8', desc: 'Practicum requirements and varied experiential learning activities are provided' },
      { code: 'A.9', desc: 'Faculty members and other stakeholders participate in the formulation and re-evaluation of the program of studies' },
      { code: 'A.10', desc: 'The curriculum is periodically reviewed, evaluated and updated for continuous improvement' },
    ]
  },
  {
    code: 'B', desc: 'Co-Curricular Activities', programs: 'BSHM',
    subcriteria: [
      { code: 'B.1', desc: 'Co-curricular activities are given a proportionate role in the overall academic program' },
      { code: 'B.2', desc: 'The school adopts a definite policy regarding academic qualifications for student participation in co-curricular activities' },
      { code: 'B.3', desc: 'Co-curricular activities include enrichment activities, industry immersion, and personal growth activities' },
      { code: 'B.4', desc: 'Academic requirements are not relaxed in favor of participation in co-curricular activities' },
      { code: 'B.5', desc: 'Instructional schedules are not unduly interrupted by co-curricular activities' },
      { code: 'B.6', desc: 'Co-curricular activities are regularly evaluated to ensure their worth and relevance to student needs and program objectives' },
      { code: 'B.7', desc: 'Evaluation results are used for continuous improvement of the program' },
    ]
  },
  {
    code: 'C', desc: 'Instructional Process', programs: 'BSHM',
    subcriteria: [
      { code: 'C.1', desc: 'The instructional process promotes analytical/critical judgment, scholarly effort, social awareness, cultural values, moral/spiritual values, personal discipline, supervisory/entrepreneurship skills, and environment stewardship' },
      { code: 'C.2', desc: 'The school makes judicious use of textbooks, references, audio-visual materials, student researches, team teaching, programmed instruction, group techniques, field trips, special lectures, practicum, case studies, community activities, and ICT' },
      { code: 'C.3', desc: 'Teaching methods are adapted to subject matter, stimulate thinking, encourage group work, arouse inquiry, recognize individual differences, are varied, conducive to independent study, require library/lab work, develop civic consciousness, encourage creativity, and are congruent with program objectives' },
    ]
  },
  {
    code: 'D', desc: 'Classroom Management', programs: 'BSHM',
    subcriteria: [
      { code: 'D.1', desc: 'Records are kept of student daily attendance' },
      { code: 'D.2', desc: 'Regular class attendance is further encouraged' },
      { code: 'D.3', desc: 'The college enforces its rules concerning class attendance' },
      { code: 'D.4', desc: 'In food laboratory work, there is one laboratory assistant per laboratory class' },
      { code: 'D.5', desc: 'In purely lecture classes, the number of students is appropriate to the size and acoustics of the room and its facilities' },
      { code: 'D.6', desc: 'The teacher-to-student ratio in individual laboratory sections does not exceed 1:40' },
      { code: 'D.7', desc: 'Proper classroom discipline is maintained in consonance with sound democratic practices' },
    ]
  },
  {
    code: 'E', desc: 'Academic Performance of Students', programs: 'BSHM',
    subcriteria: [
      { code: 'E.1', desc: 'A variety of assessment and evaluation tools are used' },
      { code: 'E.2', desc: 'Instructors personally rate examinations and other course requirements submitted by students' },
      { code: 'E.3', desc: 'The system of evaluation and grading is clearly defined and understood by students, faculty, department heads, and dean' },
      { code: 'E.4', desc: 'Final marks given are a fair appraisal of student performance based on all significant aspects including tests, class participation, reports, projects, and practical examinations' },
      { code: 'E.5', desc: 'The school maintains adequate admissions and retention standards with entrance requirements and selective retention criteria' },
      { code: 'E.6', desc: 'Outstanding achievement is recognized through honor roll, tuition scholarship, honor medals, honor societies, and special privileges' },
      { code: 'E.7', desc: 'Academically-challenged but persevering students are helped through load reduction, remedial classes, educational guidance, and peer monitoring' },
    ]
  },
  {
    code: 'F', desc: 'Administrative Measures for Effective Instruction', programs: 'BSHM',
    subcriteria: [
      { code: 'F.1', desc: 'Adequate measures are adopted to ensure punctual attendance of faculty and students' },
      { code: 'F.2', desc: 'The school has provisions for substitution or special arrangements whenever teachers are absent' },
      { code: 'F.3', desc: 'Quality instruction is ensured by requiring syllabi, providing lab manuals, adequate equipment, case study activities, exam submission, supervisory visits, regular faculty meetings, periodic conferences, dialogues, and performance studies' },
      { code: 'F.4', desc: 'Supervision is directed towards sufficient class preparation by faculty members' },
      { code: 'F.5', desc: 'Adequately equipped faculty rooms are provided to facilitate class preparation' },
      { code: 'F.6', desc: 'There is periodic faculty evaluation by the academic head, department chairman, students, and peers' },
      { code: 'F.7', desc: 'Effective instruction is further promoted through faculty development program, experimental courses, teacher awards, and active participation in workshops/seminars' },
      { code: 'F.8', desc: 'Regular dialogues involving the administration, faculty, students and other stakeholders are encouraged' },
    ]
  },
];

// ============ BSIT (IT) - Area III Instruction ============
const BSIT_CRITERIA = [
  {
    code: 'A', desc: 'Program Studies', programs: 'BSIT',
    subcriteria: [
      { code: 'A.1', desc: 'The program of studies is relevant to the needs of the local, national, and international community' },
      { code: 'A.2', desc: 'The program of studies includes plant visits to industries, seminars on current issues/trends, OJT program and student research/capstone project' },
      { code: 'A.3', desc: 'The program of studies provides adequate general education, implements institutional and program objectives, and contributes to program outcomes' },
      { code: 'A.4', desc: 'The subjects/courses correspond to the description given in the college bulletin/catalogue' },
      { code: 'A.5', desc: 'The sequence of subjects/courses is logical and realistic and prerequisites are strictly complied with' },
      { code: 'A.6', desc: 'The curriculum structure provides for flexibility through a system of electives' },
      { code: 'A.7', desc: 'The curriculum prepares students for IT-related entry-level jobs' },
      { code: 'A.8', desc: 'Faculty members, senior students, alumni, and industry practitioners participate in the formulation and re-evaluation of the program of studies' },
      { code: 'A.9', desc: 'There is an on-going program of curriculum revision and development coordinated with available laboratory facilities and equipment and with local needs' },
    ]
  },
  {
    code: 'B', desc: 'Co-Curricular Activities', programs: 'BSIT',
    subcriteria: [
      { code: 'B.1', desc: 'Co-curricular activities are given a proportionate role in the overall academic program' },
      { code: 'B.2', desc: 'The school adopts a definite policy regarding academic qualifications for student participation in co-curricular activities' },
      { code: 'B.3', desc: 'Co-curricular activities include enrichment activities in major/specialization fields, industry immersion/exposure, and personal growth activities' },
      { code: 'B.4', desc: 'Academic requirements are not relaxed in favor of participation in co-curricular activities' },
      { code: 'B.5', desc: 'Instructional schedules are not unduly interrupted by co-curricular activities' },
      { code: 'B.6', desc: 'Co-curricular activities are evaluated regularly to ensure they are worthwhile and relevant to student needs and program objectives' },
    ]
  },
  {
    code: 'C', desc: 'Instructional Process', programs: 'BSIT',
    subcriteria: [
      { code: 'C.1', desc: 'The instructional process promotes analytical/critical judgment, scholarly effort, social awareness, moral/spiritual values, and personal discipline' },
      { code: 'C.2', desc: 'The school makes judicious use of textbooks, references, courseware materials, student researches, paired courses, e-learning, group techniques, community activities, and special lectures' },
      { code: 'C.3', desc: 'Teaching methods are adapted to subject matter, stimulate thinking, encourage group work, arouse inquiry, recognize individual differences, are varied, require library/lab work, encourage lifelong learning, resourcefulness and creativity, and are congruent with program objectives' },
    ]
  },
  {
    code: 'D', desc: 'Classroom Management', programs: 'BSIT',
    subcriteria: [
      { code: 'D.1', desc: 'The college enforces its policies and guidelines concerning class attendance' },
      { code: 'D.2', desc: 'In science laboratory work, the size of the class does not exceed 40 students' },
      { code: 'D.3', desc: 'In the computer laboratory, there is one computer unit for every student' },
      { code: 'D.4', desc: 'In purely lecture classes, the number of students is appropriate to the size and acoustics of the room' },
      { code: 'D.5', desc: 'Proper classroom discipline is maintained in consonance with sound democratic principles' },
      { code: 'D.6', desc: 'Independent work and performance are encouraged and monitored' },
    ]
  },
  {
    code: 'E', desc: 'Academic Performance of Students', programs: 'BSIT',
    subcriteria: [
      { code: 'E.1', desc: 'A variety of assessment and evaluation tools are used such as written exams, oral exams, performance tests, research work, and design/development projects' },
      { code: 'E.2', desc: 'Assessment and evaluation tools are reliable' },
      { code: 'E.3', desc: 'Assessment and evaluation tools are valid' },
      { code: 'E.4', desc: 'Instructors personally rate examinations and other requirements submitted by students' },
      { code: 'E.5', desc: 'The system of assessment and evaluation is clearly defined and understood by teachers, students, and parents' },
      { code: 'E.6', desc: 'Final marks given are a fair appraisal of student performance based on all significant aspects' },
      { code: 'E.7', desc: 'A permanent record system of student grades is maintained' },
      { code: 'E.8', desc: 'The school maintains appropriate admission and retention policies and standards' },
      { code: 'E.9', desc: 'Outstanding achievement is recognized through honor roll, tuition scholarship, honor medals, honor societies, and special privileges' },
      { code: 'E.10', desc: 'Academically-challenged but persevering students are helped through load reduction, individualized instruction, remedial classes, and educational guidance' },
    ]
  },
  {
    code: 'F', desc: 'Administrative Measures for Effective Instruction', programs: 'BSIT',
    subcriteria: [
      { code: 'F.1', desc: 'Adequate measures are adopted to ensure punctual attendance of faculty and students' },
      { code: 'F.2', desc: 'The school has provisions for substitution or special arrangements whenever teachers are absent' },
      { code: 'F.3', desc: 'Quality instruction is ensured by requiring syllabi, providing lab manuals, adequate equipment, computer lab exercises, case studies, exam submission, supervisory visits, faculty meetings, periodic conferences, dialogues, and performance studies' },
      { code: 'F.4', desc: 'There is periodic faculty evaluation by the academic head, department chairman, and students' },
      { code: 'F.5', desc: 'Effective instruction is further promoted through faculty development program, experimental courses, teacher awards, and active participation in workshops/seminars' },
    ]
  },
];

// ============ BSCRIM (CRIM) - Area III Instruction ============
const BSCRIM_CRITERIA = [
  {
    code: 'A', desc: 'Program Studies', programs: 'BSCRIM',
    subcriteria: [
      { code: 'A.1', desc: 'The program of studies is relevant to the needs of the local, national, and international community' },
      { code: 'A.2', desc: 'The program of studies includes plant visits to industries, seminars on current issues/trends, OJT program and student research/capstone project' },
      { code: 'A.3', desc: 'The program of studies provides adequate general education, implements institutional and program objectives, and contributes to program outcomes' },
      { code: 'A.4', desc: 'The subjects/courses correspond to the description given in the college bulletin/catalogue' },
      { code: 'A.5', desc: 'The sequence of subjects/courses is logical and realistic and prerequisites are strictly complied with' },
      { code: 'A.6', desc: 'The curriculum structure provides for flexibility through a system of electives' },
      { code: 'A.7', desc: 'The curriculum prepares students for relevant entry-level jobs' },
      { code: 'A.8', desc: 'Faculty members, senior students, alumni, and industry practitioners participate in the formulation and re-evaluation of the program of studies' },
      { code: 'A.9', desc: 'There is an on-going program of curriculum revision and development coordinated with available laboratory facilities and equipment and with local needs' },
    ]
  },
  {
    code: 'B', desc: 'Co-Curricular Activities', programs: 'BSCRIM',
    subcriteria: [
      { code: 'B.1', desc: 'Co-curricular activities are given a proportionate role in the overall academic program' },
      { code: 'B.2', desc: 'The school adopts a definite policy regarding academic qualifications for student participation in co-curricular activities' },
      { code: 'B.3', desc: 'Co-curricular activities include enrichment activities in major/specialization fields, industry immersion/exposure, and personal growth activities' },
      { code: 'B.4', desc: 'Academic requirements are not relaxed in favor of participation in co-curricular activities' },
      { code: 'B.5', desc: 'Instructional schedules are not unduly interrupted by co-curricular activities' },
      { code: 'B.6', desc: 'Co-curricular activities are regularly evaluated to ensure their worth and relevance to student needs and program objectives' },
    ]
  },
  {
    code: 'C', desc: 'Instructional Process', programs: 'BSCRIM',
    subcriteria: [
      { code: 'C.1', desc: 'The instructional process promotes analytical/critical judgment, scholarly effort, social awareness, moral/spiritual values, and personal discipline' },
      { code: 'C.2', desc: 'The school makes judicious use of textbooks, references, courseware materials, student researches, paired courses, e-learning, group techniques, community activities, and special lectures' },
      { code: 'C.3', desc: 'Teaching methods are adapted to subject matter, stimulate thinking, encourage group work, arouse inquiry, recognize individual differences, are varied, require library/lab work, encourage lifelong learning, resourcefulness and creativity, and are congruent with program objectives' },
    ]
  },
  {
    code: 'D', desc: 'Classroom Management', programs: 'BSCRIM',
    subcriteria: [
      { code: 'D.1', desc: 'The college enforces its policies and guidelines concerning class attendance' },
      { code: 'D.2', desc: 'In science laboratory work, the size of the class does not exceed 40 students' },
      { code: 'D.3', desc: 'In the computer laboratory, there is one computer unit for every student' },
      { code: 'D.4', desc: 'In purely lecture classes, the number of students is appropriate to the size and acoustics of the room' },
      { code: 'D.5', desc: 'Proper classroom discipline is maintained in consonance with sound democratic principles' },
      { code: 'D.6', desc: 'Independent work and performance are encouraged and monitored' },
    ]
  },
  {
    code: 'E', desc: 'Academic Performance of Students', programs: 'BSCRIM',
    subcriteria: [
      { code: 'E.1', desc: 'A variety of assessment and evaluation tools are used such as written exams, oral exams, performance tests, research work, and design/development projects' },
      { code: 'E.2', desc: 'Assessment and evaluation tools are reliable' },
      { code: 'E.3', desc: 'Assessment and evaluation tools are valid' },
      { code: 'E.4', desc: 'Instructors personally rate examinations and other requirements submitted by students' },
      { code: 'E.5', desc: 'The system of assessment and evaluation is clearly defined and understood by teachers, students, and parents' },
      { code: 'E.6', desc: 'Final marks given are a fair appraisal of student performance based on all significant aspects' },
      { code: 'E.7', desc: 'A permanent record system of student grades is maintained' },
      { code: 'E.8', desc: 'The school maintains appropriate admission and retention policies and standards' },
      { code: 'E.9', desc: 'Outstanding achievement is recognized through honor roll, tuition scholarship, honor medals, honor societies, and special privileges' },
      { code: 'E.10', desc: 'Academically-challenged but persevering students are helped through load reduction, individualized instruction, remedial classes, and educational guidance' },
    ]
  },
  {
    code: 'F', desc: 'Administrative Measures for Effective Instruction', programs: 'BSCRIM',
    subcriteria: [
      { code: 'F.1', desc: 'Adequate measures are adopted to ensure punctual attendance of faculty and students' },
      { code: 'F.2', desc: 'The school has provisions for substitution or special arrangements whenever teachers are absent' },
      { code: 'F.3', desc: 'Quality instruction is ensured by requiring syllabi, providing lab manuals, adequate equipment, case studies, exam submission, supervisory visits, faculty meetings, periodic conferences, dialogues, and performance studies' },
      { code: 'F.4', desc: 'There is periodic faculty evaluation by the academic head, department chairman, and students' },
      { code: 'F.5', desc: 'Effective instruction is further promoted through faculty development program, experimental courses, teacher awards, and active participation in workshops/seminars' },
    ]
  },
];

// ============ BSBA (CBA) - Area III Instruction ============
const BSBA_CRITERIA = [
  {
    code: 'A', desc: 'Program of Studies', programs: 'BSBA',
    subcriteria: [
      { code: 'A.1', desc: 'The program of studies is relevant to the needs of the local, national, and international community' },
      { code: 'A.2', desc: 'The program of studies includes plant visits to industries, seminars on current issues/trends, OJT program and student research project' },
      { code: 'A.3', desc: 'The program studies provide adequate general education and implement institutional and program objectives' },
      { code: 'A.4', desc: 'The subjects/courses correspond to the description given in the college bulletin/catalogue' },
      { code: 'A.5', desc: 'The sequence of subjects/courses is logical and realistic and prerequisites are strictly complied with' },
      { code: 'A.6', desc: 'The curriculum structure provides for flexibility through a system of electives or cognates' },
      { code: 'A.7', desc: 'Updated course syllabi are distributed to all students at the start of class' },
      { code: 'A.8', desc: 'Faculty members, senior students, alumni, and industry practitioners participate in the formulation and re-evaluation of the program of studies' },
      { code: 'A.9', desc: 'There is an on-going program of curriculum revision and development coordinated with available laboratory facilities and equipment and with local needs' },
    ]
  },
  {
    code: 'B', desc: 'Co-Curricular Activities', programs: 'BSBA',
    subcriteria: [
      { code: 'B.1', desc: 'Co-curricular activities are given a proportionate role in the overall academic program' },
      { code: 'B.2', desc: 'The school adopts a definite policy regarding academic qualifications for student participation in co-curricular activities' },
      { code: 'B.3', desc: 'Co-curricular activities include enrichment activities, industry exposure, and personal growth activities' },
      { code: 'B.4', desc: 'Academic requirements are not relaxed in favor of participation in co-curricular activities' },
      { code: 'B.5', desc: 'Instructional schedules are not unduly interrupted by co-curricular activities' },
      { code: 'B.6', desc: 'Co-curricular activities are regularly evaluated to ensure their worth and relevance to program objectives' },
    ]
  },
  {
    code: 'C', desc: 'Instructional Process', programs: 'BSBA',
    subcriteria: [
      { code: 'C.1', desc: 'The instructional process as a whole is directed towards the total development of the students' },
      { code: 'C.2', desc: 'The school makes judicious use of textbooks, references, courseware, and other instructional materials' },
      { code: 'C.3', desc: 'Teaching methods used are varied, effective, and adapted to subject matter' },
      { code: 'C.4', desc: 'Learning assistance program is implemented' },
      { code: 'C.5', desc: 'The performance of graduates in the CPA board examination (Accountancy) is satisfactory' },
      { code: 'C.6', desc: 'The performance of graduates in the Customs Broker board examination (Customs Administration) is satisfactory' },
      { code: 'C.7', desc: 'The performance of graduates in the Real Estate board examination (Real Estate Management) is satisfactory' },
    ]
  },
  {
    code: 'D', desc: 'Classroom Management', programs: 'BSBA',
    subcriteria: [
      { code: 'D.1', desc: 'The college implements a policy concerning class attendance' },
      { code: 'D.2', desc: 'In computer laboratory work, there is one laboratory assistant' },
      { code: 'D.3', desc: 'In lecture classes, the number of students is appropriate to the size and acoustics of the room' },
      { code: 'D.4', desc: 'Proper classroom discipline is maintained in consonance with sound democratic practices' },
      { code: 'D.5', desc: 'In classes using discussion and other interactive methods, the number of students does not exceed fifty (50)' },
      { code: 'D.6', desc: 'Independent work and performance are encouraged and monitored' },
    ]
  },
  {
    code: 'E', desc: 'Academic Performance of Students', programs: 'BSBA',
    subcriteria: [
      { code: 'E.1', desc: 'A variety of tools and instruments are used in evaluating students' },
      { code: 'E.2', desc: 'Evaluation tools/instruments are reliable and valid' },
      { code: 'E.3', desc: 'Instructors personally rate the examinations and other requirements submitted by students' },
      { code: 'E.4', desc: 'Results of tests and requirements of students are returned immediately' },
      { code: 'E.5', desc: 'The system of evaluation and grading is clearly defined and understood' },
      { code: 'E.6', desc: 'Final marks given to students are a fair appraisal of performance in the entire course' },
      { code: 'E.7', desc: 'Academically-challenged but persevering students are helped through load reduction, remedial classes, and educational guidance' },
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

  // Find Area III
  const areasResp = await fetch(BASE + '/content-manager/collection-types/api::area.area?page=1&pageSize=100', { headers: auth });
  const areas = areasResp.results || [];
  const areaIII = areas.find(a => a.area && a.area.startsWith('III.'));
  if (!areaIII) throw new Error('Area III not found!');
  console.log('Found: ' + areaIII.area + ' (docId: ' + areaIII.documentId + ')');

  // Get full detail
  await sleep(2000);
  const detail = await fetch(BASE + '/content-manager/collection-types/api::area.area/' + areaIII.documentId, { headers: auth });
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
  const result = await fetch(BASE + '/content-manager/collection-types/api::area.area/' + areaIII.documentId, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ areaCriteria: merged })
  });

  if (result.data || result.areaCriteria) {
    const updated = (result.data || result).areaCriteria || [];
    console.log('\nSuccess! Total criteria now: ' + updated.length);

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
  console.log('  ALL AREA III PROGRAMS ADDED');
  console.log('========================================');
})().catch(err => console.error('FATAL:', err.message));
