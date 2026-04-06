const https = require('https');

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
      timeout: 60000
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(data.substring(0, 500))); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const s = (code, desc) => ({ code, desc, subCriteriaUploads: [] });
const PROG = 'BSTM';

(async () => {
  const login = await fetch('https://wcc-accre-bedev.onrender.com/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'Admin123' })
  });
  const token = login.data.token;
  const h = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  const areas = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::area.area?page=1&pageSize=100', { headers: h });
  const allAreas = areas.results || [];

  // Helper to find area and get existing criteria
  async function getArea(keyword) {
    const a = allAreas.find(x => x.area && x.area.includes(keyword));
    if (!a) { console.log('NOT FOUND:', keyword); return null; }
    const detail = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::area.area/' + a.documentId, { headers: h });
    return detail.data || detail;
  }

  // Helper to merge new criteria into existing (keep existing, add new with programs tag)
  async function addCriteria(keyword, newCriteria) {
    const area = await getArea(keyword);
    if (!area) return;
    const existing = area.areaCriteria || [];
    const merged = [...existing, ...newCriteria];
    console.log(`\nUpdating ${area.area}: ${existing.length} existing + ${newCriteria.length} new = ${merged.length} total criteria`);

    const result = await fetch('https://wcc-accre-bedev.onrender.com/content-manager/collection-types/api::area.area/' + area.documentId, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ areaCriteria: merged })
    });
    if (result.error) {
      console.error('Error:', JSON.stringify(result.error));
    } else {
      const d = result.data || result;
      console.log('Success! Total criteria:', (d.areaCriteria || []).length);
      // Show only the new BSTM ones
      (d.areaCriteria || []).filter(c => c.programs === PROG).forEach(c => {
        console.log('  ' + c.code + ' [' + PROG + ']: ' + (c.desc || '').substring(0, 70) + ' [' + (c.subcriteria||[]).length + ' sub]');
      });
    }
  }

  // ===== AREA II. FACULTY (BSTM) =====
  const area2criteria = [
    {
      code: 'A', desc: 'Academic Qualifications',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('A.1', 'The school has a policy on recruitment of faculty members which include: qualifying tests, demo-teaching, others.'),
        s('A.2', 'The percentage of faculty members with earned graduate degrees meets accreditation standards.'),
        s('A.3', 'At least 60% of the faculty handling the professional subject must be employed full-time.'),
        s('A.4', 'Faculty members teach courses along their fields of specialization.'),
        s('A.5', 'Faculty members are encouraged in continuing learning, and have other qualifications or above average or very good teaching performance and professional practice or at least 3 years industry experience to support their professional growth and development.'),
        s('A.6', 'Faculty members teaching the professional courses should be a graduate degree holder and/or practitioners with at least 3 years experience or hotel or restaurant owner and/or operator. Must have practical exposure for at least 3 years in any of the TM fields.')
      ]
    },
    {
      code: 'B', desc: 'Professional Performance',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('B.1', 'The faculty members: implement purpose and objectives, show mastery of subject matter, show evidence of preparedness, use creative and innovative teaching-learning strategies, follow outcomes-based syllabi, are aware of recent trends, make creative use of library resources, devote time for students, show skills to develop competencies, show evidence of assessment utilization.'),
        s('B.2', 'Research capabilities: faculty show evidence of professional growth through research and publications, conduct research and/or module writing, present results in fora and symposia, publish results in institutional research journal, refereed journals, and others.')
      ]
    },
    {
      code: 'C', desc: 'Teaching Assignment',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('C.1', 'A policy for determining teaching assignments and number of subject preparations is followed.'),
        s('C.2.1', 'General Education faculty members meet accreditation standards for full-time employment.'),
        s('C.2.2', 'Professional courses faculty members meet accreditation standards for full-time employment.'),
        s('C.3.1', 'General Education faculty members are given teaching assignments only along their fields of specialization.'),
        s('C.3.2', 'Professional courses faculty members are given teaching assignments only along their fields of specialization.'),
        s('C.4', 'Teaching loads of faculty members allow sufficient time for preparation of classes, adequate evaluation of student achievement, and consultation/mentoring/academic advising.'),
        s('C.5', 'Provision is made for equitable distribution of extra-class responsibilities of faculty members.'),
        s('C.6', 'The faculty-to-student ratio is generally satisfactory, i.e., pure lecture 1:40; laboratory classes 1:30.'),
        s('C.7', 'Provision is made to ensure that at least 60% of faculty member are employed on full time basis.'),
        s('C.8', 'The teaching load of a regular full-time faculty member is from 12 to 24 units per semester.'),
        s('C.9', 'In case of overload, full time lecturers are given a maximum of 3 units, with the total faculty load not exceeding 27 units per semester.'),
        s('C.10', 'The teaching load of a regular full-time laboratory instructor is from 9 units to 12 units or 36 hours/week.')
      ]
    },
    {
      code: 'D', desc: 'Rank, Tenure, Remuneration and Fringe Benefits',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('D.1.1', 'Teaching ability'),
        s('D.1.2', 'Research and/or publications'),
        s('D.1.3', 'Academic degrees earned and professional development'),
        s('D.1.4', 'Teaching experience'),
        s('D.1.5', 'Industry/Professional Experience'),
        s('D.1.6', 'University/school/college services'),
        s('D.1.7', 'Participation in university/school/college activities'),
        s('D.1.8', 'Community/extension service'),
        s('D.1.9', 'Awards/recognition'),
        s('D.2.1', 'Administrator recommendations are considered'),
        s('D.2.2', 'Department Chairman recommendations are considered'),
        s('D.2.3', 'Students recommendations are considered'),
        s('D.2.4', 'Peers recommendations are considered'),
        s('D.3', 'The salary rates are adequate in meeting the economic and social demands of the profession.'),
        s('D.4', 'The benefits and responsibilities of tenure are clearly described in the Faculty Manual or similar document.'),
        s('D.5', 'There are definite policies for termination of employment.'),
        s('D.6', 'Fringe benefits other than those mandated by law are extended to faculty members.')
      ]
    },
    {
      code: 'E', desc: 'Faculty Development',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('E.1', 'Scholarship/fellowship/student grants (local and foreign).'),
        s('E.2', 'Faculty loans for professional growth.'),
        s('E.3', 'Sabbatical leaves.'),
        s('E.4', 'Research grants (in-house and external grants/funds).'),
        s('E.5', 'Tuition fee privilege for faculty (in-house and external grants/funds).'),
        s('E.6', 'Others.'),
        s('E.7', 'Institutional support and encouragement along: active membership in professional organizations, research or publications, attendance in seminars/workshops/conferences, attendance in faculty meetings, participation in faculty committees.'),
        s('E.8', 'Provision for in-service faculty development within and outside the institution: workshops/training, colloquia, seminars/conventions, conferences, faculty industry immersions, specialized training.')
      ]
    }
  ];

  await addCriteria('II.', area2criteria);
  await sleep(2000);

  // ===== AREA III. INSTRUCTION (BSTM) =====
  const area3criteria = [
    {
      code: 'A', desc: 'Program Studies',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('A.1', 'The program of studies is responsive and relevant to the needs of the community/region and/or the larger society that the college serves.'),
        s('A.2', 'The course offerings exceed the minimum requirements of CHED.'),
        s('A.3', 'The program of studies: provides adequate general education, professional courses, food courses and electives; reflects national aspiration and development goals; implements objectives of the institution and program; implements desired program outcomes.'),
        s('A.4', 'The courses correspond to the description given in the college bulletin/catalogue.'),
        s('A.5', 'The sequence of subjects/courses is logical and realistic.'),
        s('A.6', 'Prerequisites are strictly complied with.'),
        s('A.7', 'The curriculum structure provides for flexibility through a system of electives.'),
        s('A.8', 'Practicum requirements and varied experiential learning activities are provided.'),
        s('A.9', 'Faculty members and other stakeholders participate in the formulation and re-evaluation of the program of studies.'),
        s('A.10', 'The curriculum is periodically reviewed, evaluated and updated for continuous improvement.')
      ]
    },
    {
      code: 'B', desc: 'Co-Curricular Activities',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('B.1', 'Co-curricular activities are given a proportionate role in the over-all academic program.'),
        s('B.2', 'The school adopts a definite policy regarding academic qualifications for student participation in co-curricular activities.'),
        s('B.3', 'Co-curricular activities include the following.'),
        s('B.4', 'Academic requirements are not relaxed in favor of participation in co-curricular activities.'),
        s('B.5', 'Instructional schedules are not unduly interrupted by co-curricular activities.'),
        s('B.6', "Co-curricular activities are regularly evaluated to ensure their worth and relevance to student's needs and to the attainment of the objectives of the academic program."),
        s('B.7', 'Evaluation results are used for continuous improvement of the program.')
      ]
    },
    {
      code: 'C', desc: 'Instructional Process',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('C.1', 'The instructional process as a whole is directed towards the total development of the student promoting: analytical and critical judgment, scholarly effort, social awareness, cultural values, moral and spiritual values, personal discipline, supervisory and entrepreneurship skills, environment stewardship.'),
        s('C.2', 'The school makes judicious use of: textbooks, references, audio-visual materials, student researches, team teaching, programmed instructional materials, group techniques, exposure/field trips/industry immersion, special lectures, practicum, problem solving/case studies, community activities, ICT, online resources.'),
        s('C.3', 'The teaching methods used: are adapted to subject matter, stimulate thinking, encourage group work, arouse inquiry, recognize individual differences, are varied, conducive to independent study, require library and laboratory work, develop socio/civic consciousness, conform to college standards, encourage resourcefulness, congruent with program objectives, allow application of competencies, motivate environmental stewardship, encourage experiential learning.')
      ]
    },
    {
      code: 'D', desc: 'Classroom Management',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('D.1', "Records are kept of student's daily attendance."),
        s('D.2', 'Regular class attendance is further encouraged.'),
        s('D.3', 'The college enforces its rules concerning class attendance.'),
        s('D.4', 'In food laboratory work, there is one laboratory assistant per laboratory class.'),
        s('D.5', 'In purely lecture classes, the number of students is appropriate to the size and acoustics of the room and its facilities.'),
        s('D.6', 'The teacher-to-student ratio in individual laboratory sections does not exceed 1:40.'),
        s('D.7', 'Proper classroom discipline is maintained in consonance with sound democratic practices.')
      ]
    },
    {
      code: 'E', desc: 'Academic Performance of Students',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('E.1', 'A variety of assessment and evaluation tools are used.'),
        s('E.2', 'Instructors personally rate examinations and other course requirements submitted by students.'),
        s('E.3', 'The system of evaluation and grading is clearly defined and understood by: students, faculty, department heads/program chair, dean.'),
        s('E.4', "Final marks given are a fair appraisal of a student's performance in the entire course based on all significant aspects: tests, class participation, oral and written reports, assigned projects, practical examinations, and other course requirements."),
        s('E.5', 'The school maintains adequate admissions and retention standards by enforcing additional entrance requirements and applying specific criteria for selective retention.'),
        s('E.6', "Outstanding achievement is recognized through: honor roll, Dean's list, tuition scholarship, honor medals and merit certificates, honor societies, special privileges."),
        s('E.7', 'Academically-challenged but persevering students are helped through: reduction of academic load, remedial classes, educational guidance, peer monitoring.')
      ]
    },
    {
      code: 'F', desc: 'Administrative Measures for Effective Instruction',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('F.1', 'Adequate measures are adopted to ensure punctual attendance of the faculty and students in their respective classes.'),
        s('F.2', 'The school has provisions for substitution or for special arrangements whenever teachers are absent.'),
        s('F.3.1', 'Requiring a syllabus for each subject/course approved by the appropriate authority.'),
        s('F.3.2', 'Providing laboratory manuals available for purchase by all students in all laboratory courses.'),
        s('F.3.3', 'Providing an adequate number of required pieces of equipment, apparatuses and tools in the laboratory as prescribed by the regulatory body.'),
        s('F.3.4', 'Providing activities such as case studies requiring the collection, reduction, and analysis of data.'),
        s('F.3.5', 'Submission of periodic and final examination questions to the appropriate authority.'),
        s('F.3.6', 'Supervisory visits to the classes.'),
        s('F.3.7', 'Regular faculty meetings with the dean/coordinator.'),
        s('F.3.8', 'Periodic conferences/consultation with department heads and faculty members.'),
        s('F.3.9', 'Formal/informal dialogues between students, faculty members and administration.'),
        s('F.3.10', 'Correlation and other studies on performance.'),
        s('F.4', 'Supervision is directed towards sufficient class preparation by faculty members.'),
        s('F.5', 'Adequately equipped faculty rooms are provided to facilitate class preparation.'),
        s('F.6', 'There is periodic faculty evaluation by: the academic head, department chairman, students, peers.'),
        s('F.7.1', 'Faculty Development program.'),
        s('F.7.2', 'Experimental courses and innovative programs.'),
        s('F.7.3', 'Teacher awards.'),
        s('F.7.4', 'Active participation in workshops, seminars on methodology of instruction and evaluation.'),
        s('F.8', 'Regular dialogues involving the administration, faculty, students and other stakeholders are encouraged.')
      ]
    }
  ];

  await addCriteria('III.', area3criteria);
  await sleep(2000);

  // ===== AREA IV. LABORATORIES (BSTM) =====
  const area4criteria = [
    {
      code: 'A', desc: 'Facilities',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('A.1', 'General Laboratory: properly lighted, well-ventilated, screened, two or more exits, smooth traffic flow, instructor can observe all students, separate storage space, custodian, gas/water/electricity available, fire extinguisher accessible, first aid kit accessible, laboratory development plan.'),
        s('A.2', 'Food Laboratory: enough space (2.3 sq.m. per student), work tables per group of 5-7, sinks with drainage and grease traps, exhaust fans/air-conditioning, separate locker spaces, reference charts, food models, complete chef uniform, adequate basic utensils and equipment, well lighted/ventilated, waste segregation, CLAYGO practice.'),
        s('A.3', 'In-Campus Hotel is adequately furnished to simulate an actual hotel room.'),
        s('A.4', 'General Requirement: food laboratory with facilities for hot and cold preparations, baking activities, individual kitchen units, demonstration and dining area.'),
        s('A.5', 'Special Kitchen Laboratories: provisions for major subjects requiring specific/specialized kitchen facilities, commercial kitchen for quantity food production, bar set-up for beverage management, food and beverage management and operation, international/specialty cuisine, baking, hotel operations.')
      ]
    },
    {
      code: 'B', desc: 'Equipment and Supplies',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('B.1', 'Equipment, materials and supplies conform to the requirements of the course.'),
        s('B.2', 'There are enough equipment for classroom use to demonstrate certain technologies or techniques.'),
        s('B.3', 'There is evidence of improvised equipment to demonstrate certain technologies.'),
        s('B.4', 'Equipment, materials, and supplies are adequate for the instructional needs of the class.'),
        s('B.5', 'There is periodic inventory of supplies and equipment.'),
        s('B.6', 'A laboratory custodian supervises the use of the stockroom.'),
        s('B.7', 'The number of equipment and supplies for a laboratory class is proportionate to the number of students.')
      ]
    },
    {
      code: 'C', desc: 'Maintenance',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('C.1', 'The general appearance of the laboratories is neat and orderly.'),
        s('C.2', 'Equipment, materials and supplies are systematically stored in appropriate shelves, cabinets, etc.'),
        s('C.3', 'All materials are properly labeled.'),
        s('C.4', 'There is a list of important steps for the proper use of special equipment.'),
        s('C.5', 'There is an efficient system of requisition.'),
        s('C.6', 'The inventory is systematic and kept up-to-date.'),
        s('C.7', 'There is evidence of periodic acquisition of new equipment.'),
        s('C.8', 'Equipment are in good working condition and are periodically calibrated.'),
        s('C.9', 'The laboratories have some system of repair or maintenance of equipment.'),
        s('C.10', 'The laboratory fees are adequate.'),
        s('C.11', "A set of books or manuals for teacher's reference is readily available in each laboratory.")
      ]
    },
    {
      code: 'D', desc: 'Special Provisions',
      programs: PROG, criteriaUploads: [],
      subcriteria: [
        s('D.1', 'The required number of hours per area of practicum is met.'),
        s('D.2', 'There is a practicum site for the practicum training of students. For off-campus practicum, affiliations with hotel, restaurants, resorts, airlines, travel agencies have been established. There is a practicum coordinator who monitors activities, serves as liaison, follows up students, evaluates performance, and keeps important records.'),
        s('D.3', 'Other forms of practical/experiential learning experiences are provided through networking/linkages with hospitals, food manufacturing and bakery companies, hospitality, travel and tour industries, government agencies and professional organizations.')
      ]
    }
  ];

  await addCriteria('IV.', area4criteria);

  console.log('\n========================================');
  console.log('  ALL BSTM CRITERIA ADDED SUCCESSFULLY');
  console.log('========================================');
})().catch(e => console.error('Error:', e.message));
