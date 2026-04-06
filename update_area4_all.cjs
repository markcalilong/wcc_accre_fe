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

// ============ BSHM (HM) - Area IV Laboratories ============
const BSHM_CRITERIA = [
  {
    code: 'A', desc: 'Facilities', programs: 'BSHM',
    subcriteria: [
      { code: 'A.1', desc: 'General Laboratory - properly lighted, well-ventilated, screened, with two or more exits; smooth traffic flow; instructor can observe all students; separate storage space with custodian; gas, water and electricity available; fire extinguisher accessible; first aid kit in each lab; laboratory development plan' },
      { code: 'A.2', desc: 'Food Laboratory - adequate space (2.3 sq.m. per student); at least 1 work table per 5-7 students; sinks with drainage and grease traps; exhaust fans/AC for ventilation; separate locker spaces; nutritional charts available; food models provided; complete chef uniform required; adequate utensils and equipment; well lighted and ventilated; waste segregation and CLAYGO practiced' },
      { code: 'A.3', desc: 'In-Campus Hotel is adequately furnished to simulate an actual hotel room' },
      { code: 'A.4', desc: 'General Requirement - food laboratory with facilities for hot/cold preparations and baking; subdivided into equipped individual kitchen units with demonstration table, working tables, exhaust fans, table appointments, weighing scale, chopping boards, basic utensils; individual unit kitchens (1.52 sq.m. per student, 5-7 students per unit); dining area with complete dinnerware, flatware, beverageware, and service ware' },
      { code: 'A.5', desc: 'Special Kitchen Laboratories - provisions for major subjects requiring specialized facilities; commercial kitchen for quantity food production (40+ people); complete bar setup for beverage management with glasses, bar tools, and ingredients; food and beverage management provisions for various service styles; international/specialty cuisine facilities; baking laboratory with specialized equipment; hotel operations facilities with front office, mock hotel rooms, and housekeeping equipment' },
    ]
  },
  {
    code: 'B', desc: 'Equipment and Supplies', programs: 'BSHM',
    subcriteria: [
      { code: 'B.1', desc: 'Equipment, materials and supplies conform to the requirements of the course' },
      { code: 'B.2', desc: 'There are enough equipment for classroom use to demonstrate certain technologies or techniques' },
      { code: 'B.3', desc: 'There is evidence of improvised equipment to demonstrate certain technologies' },
      { code: 'B.4', desc: 'Equipment, materials, and supplies are adequate for the instructional needs of the class' },
      { code: 'B.5', desc: 'There is periodic inventory of supplies and equipment' },
      { code: 'B.6', desc: 'A laboratory custodian supervises the use of the stockroom' },
      { code: 'B.7', desc: 'The number of equipment and supplies for a laboratory class is proportionate to the number of students' },
    ]
  },
  {
    code: 'C', desc: 'Maintenance', programs: 'BSHM',
    subcriteria: [
      { code: 'C.1', desc: 'The general appearance of the laboratories is neat and orderly' },
      { code: 'C.2', desc: 'Equipment, materials and supplies are systematically stored in appropriate shelves, cabinets, etc.' },
      { code: 'C.3', desc: 'All materials are properly labeled' },
      { code: 'C.4', desc: 'There is a list of important steps for the proper use of special equipment' },
      { code: 'C.5', desc: 'There is an efficient system of requisition' },
      { code: 'C.6', desc: 'The inventory is systematic and kept up-to-date' },
      { code: 'C.7', desc: 'There is evidence of periodic acquisition of new equipment' },
      { code: 'C.8', desc: 'Equipment are in good working condition and are periodically calibrated' },
      { code: 'C.9', desc: 'The laboratories have some system of repair or maintenance of equipment' },
      { code: 'C.10', desc: 'The laboratory fees are adequate (schedule of fees with percentage used for replacement and improvements)' },
      { code: 'C.11', desc: 'A set of books or manuals for teacher reference is readily available in each laboratory' },
    ]
  },
  {
    code: 'D', desc: 'Special Provisions', programs: 'BSHM',
    subcriteria: [
      { code: 'D.1', desc: 'The required number of hours per area of practicum is met' },
      { code: 'D.2', desc: 'There is a practicum site for training; off-campus affiliations with hotels, restaurants, resorts, airlines, travel agencies established; practicum coordinator monitors activities, serves as liaison, follows up students, evaluates performance, and keeps records' },
      { code: 'D.3', desc: 'Other forms of practical/experiential learning experiences are provided through networking/linkages with hospitals, food manufacturing, bakery companies, hospitality, travel and tour industries, government agencies and professional organizations' },
    ]
  },
];

// ============ BSIT (IT) - Area IV Laboratories ============
const BSIT_CRITERIA = [
  {
    code: 'A', desc: 'Facilities', programs: 'BSIT',
    subcriteria: [
      { code: 'A.1', desc: 'The laboratories are clean and properly maintained and meet safety regulations' },
      { code: 'A.2', desc: 'The acoustics inside the laboratory conform to safety regulations, where applicable' },
      { code: 'A.3', desc: 'Lighting facilities in the laboratory are adequate and conform to the standard lighting system' },
      { code: 'A.4', desc: 'Ventilation is adequate and meets the local building code requirement' },
      { code: 'A.5', desc: 'The size of classrooms and laboratories conforms to accreditation requirements (at least 1.5 sq.m. per student for lecture, 2.0 sq.m. per student for laboratory)' },
      { code: 'A.6', desc: 'There is a provision for storage room adequate to store all equipment, peripherals and supplies' },
      { code: 'A.7', desc: 'All computer laboratory rooms are networked' },
      { code: 'A.8', desc: 'Each laboratory can be vacated by all occupants within 60 seconds; all laboratory doors open outwards' },
      { code: 'A.9', desc: 'Laboratory safety program includes annual training, fire extinguishers, evacuation procedures and drills, procedures for optimum computer equipment utilization, and posted rules and regulations' },
    ]
  },
  {
    code: 'B', desc: 'Equipment and Supplies', programs: 'BSIT',
    subcriteria: [
      { code: 'B.1', desc: 'Computer equipment, peripherals, and other instruments are adequate' },
      { code: 'B.2', desc: 'Computer supplies/materials are available for use in the computer laboratories' },
      { code: 'B.3', desc: 'Students are provided with at least 3 hours of individual hands-on time per week for computer courses with laboratory component' },
      { code: 'B.4', desc: 'Appropriate programming languages, operating systems, and application software as required in the curriculum are provided' },
      { code: 'B.5', desc: 'Adequate computer facilities are available for faculty use' },
      { code: 'B.6', desc: 'Equipment and supplies for digital electronics-related subjects are available' },
      { code: 'B.7', desc: 'High-speed printer is provided in every networked laboratory for student use' },
    ]
  },
  {
    code: 'C', desc: 'Maintenance', programs: 'BSIT',
    subcriteria: [
      { code: 'C.1', desc: 'The computer laboratory rooms are clean and orderly' },
      { code: 'C.2', desc: 'There is a program for regular preventive maintenance, repair, and check-up of computer equipment consistent with manufacturer standards' },
      { code: 'C.3', desc: 'The program includes a sufficient budget or allocation for maintenance' },
      { code: 'C.4', desc: 'Records of repairs and expenditures for repair are maintained' },
      { code: 'C.5', desc: 'Contingency measures are available (UPS/generator for power failure, backup computers for breakdown)' },
      { code: 'C.6', desc: 'There is a program for the continuing modernization and upgrading of the laboratories' },
      { code: 'C.7', desc: 'The status records of computers are constantly monitored by computer personnel' },
      { code: 'C.8', desc: 'Computer equipment are constantly monitored to ensure immediate action in case of breakdown' },
      { code: 'C.9', desc: 'Laboratory assistants (at least junior IT students) are available for classes of more than 30 students' },
      { code: 'C.10', desc: 'Laboratory equipment inventories are updated annually and maintained' },
      { code: 'C.11', desc: 'There is a list of important steps for the use of special equipment (laser printer, scanner, etc.)' },
      { code: 'C.12', desc: 'There is an efficient system of requisition of materials and supplies' },
      { code: 'C.13', desc: 'Reference and user manuals are readily available for instructors and students in each computer laboratory' },
      { code: 'C.14', desc: 'Updated anti-virus software are available' },
    ]
  },
  {
    code: 'D', desc: 'Special Provisions', programs: 'BSIT',
    subcriteria: [
      { code: 'D.1', desc: 'Physics Laboratory - voltages clearly indicated, adequate provisions for manufacturing/repairing equipment, instruments systematically stored, properly labeled, equipment list maintained, periodically calibrated, accreditation requirements complied with, lab manuals available, lab technician provided' },
      { code: 'D.2', desc: 'Speech Laboratory - equipment for aural and lingual skills; tape recorders, projectors, computers, tape language drills, language records, individual earphones; students work individually and in groups; technician available; inventory maintained; drills supplement classroom instruction' },
      { code: 'D.3', desc: 'Audio-visual Facilities - overhead projectors, projection screens, cameras, video cameras, VHS/VCD/DVD, duplicating machines, computers; electro-mechanical equipment in good working condition; materials stored, catalogued and classified' },
      { code: 'D.4', desc: 'Physical Education - indoor area with appropriate flooring, lighting, ventilation, safety measures, sanitary facilities, shower rooms, lockers; outdoor play area free from hazards, suitably surfaced, properly laid out, adequately maintained' },
    ]
  },
];

// ============ BSCRIM (CRIM) - Area IV Laboratories ============
const BSCRIM_CRITERIA = [
  {
    code: 'A', desc: 'Facilities', programs: 'BSCRIM',
    subcriteria: [
      { code: 'A.1', desc: 'General - lecture rooms equipped for demonstration; demonstration table with sink, water, electrical and gas outlets; separate storage; proper lighting, ventilation, two+ exits; free traffic flow; instructor visibility; standard furniture; utilities available; fire extinguisher accessible; first aid kit with antidotes; trained personnel for hazardous materials; safety precautions for chemicals; adequate locker space; protective aprons/gowns required' },
      { code: 'A.2', desc: 'Specific Criminalistics Laboratory - Chemistry lab with adequate working space, lab tables with resistant tops, fume hoods, locker space, plastic goggles and protective aprons' },
      { code: 'A.3', desc: 'Adequate criminalistics laboratories for hands-on training in: police photography (SLR camera operations, crime scene photography, film development); dactyloscopy (fingerprint identification, impression techniques, latent print development); firearms identification (ammunition calibers, handgun parts, bullet comparison microscope); questioned document examination (handwriting analysis, typewriting identification, counterfeit detection); polygraph examination (instrument operation, question formulation, result interpretation)' },
      { code: 'A.4', desc: 'Students monitor their competencies based on the practicum evaluation instrument designed and approved for each laboratory activity' },
      { code: 'A.5', desc: 'Scientific Investigation and Detection - students demonstrate proficiency in investigating crimes in crime scene room, interrogating subjects, and performing crime scene investigation using investigation field kit' },
    ]
  },
  {
    code: 'B', desc: 'Equipment and Supplies', programs: 'BSCRIM',
    subcriteria: [
      { code: 'B.1', desc: 'Apparatus, tools and materials conform to the requirements of the subject taught' },
      { code: 'B.2', desc: 'There are adequate equipment for classroom demonstration' },
      { code: 'B.3', desc: 'There is evidence of improvised equipment and visual aids for demonstrating basic principles of the course' },
      { code: 'B.4', desc: 'The equipment, apparatuses and supplies are adequate for instructional needs of the class' },
    ]
  },
  {
    code: 'C', desc: 'Maintenance', programs: 'BSCRIM',
    subcriteria: [
      { code: 'C.1', desc: 'The general appearance of the laboratories is neat and orderly' },
      { code: 'C.2', desc: 'Equipment, apparatus and supplies are systematically stored in appropriate shelves, cabinets, etc.' },
      { code: 'C.3', desc: 'There is a list of important steps for the proper use of special equipment' },
      { code: 'C.4', desc: 'All materials are properly labelled' },
      { code: 'C.5', desc: 'A list of apparatus and equipment is kept separate from the list of consumable and non-consumable supplies' },
      { code: 'C.6', desc: 'There is an efficient system of requisition' },
      { code: 'C.7', desc: 'Provision is made for regular restocking of perishable supplies' },
      { code: 'C.8', desc: 'The inventory is systematic and kept up-to-date' },
      { code: 'C.9', desc: 'There is evidence of periodic accession of new equipment' },
      { code: 'C.10', desc: 'Instruments are in good working condition and are periodically calibrated' },
      { code: 'C.11', desc: 'The laboratories have a system of maintenance of equipment and apparatuses' },
      { code: 'C.12', desc: 'The laboratories manufacture or improvise equipment and apparatuses' },
      { code: 'C.13', desc: 'The laboratory fees are adequate (schedule of fees with percentage for replacement and improvements)' },
      { code: 'C.14', desc: 'A set of books or manuals for teacher reference is readily available in each laboratory' },
    ]
  },
  {
    code: 'D', desc: 'Special Provisions', programs: 'BSCRIM',
    subcriteria: [
      { code: 'D.1', desc: 'Speech Laboratory with appropriate equipment and supplies' },
      { code: 'D.2', desc: 'Defense Tactics - Self-Defense with kick/punching pads, punching bags, rubber mats, safety equipment for sparring, simulated attacks; Basic Marksmanship and Combat Gun Shooting with target range and proficiency testing' },
    ]
  },
];

// ============ BSBA (CBA) - Area IV Laboratories ============
const BSBA_CRITERIA = [
  {
    code: 'A', desc: 'Facilities', programs: 'BSBA',
    subcriteria: [
      { code: 'A.1', desc: 'The laboratories are clean and properly maintained and meet safety regulations' },
      { code: 'A.2', desc: 'The acoustics inside the laboratory conform to safety regulations, where applicable' },
      { code: 'A.3', desc: 'Lighting facilities in the laboratory are adequate and conform to the standard lighting system' },
      { code: 'A.4', desc: 'Ventilation is adequate and meets the local building code requirement' },
      { code: 'A.5', desc: 'The size of classrooms and laboratories conforms to accreditation requirements (at least 1.5 sq.m. per student for lecture, 2.0 sq.m. per student for laboratory)' },
      { code: 'A.6', desc: 'There is a provision for storage room adequate to store all equipment, peripherals and supplies' },
      { code: 'A.7', desc: 'All computer laboratory rooms are networked' },
      { code: 'A.8', desc: 'Each laboratory can be vacated by all occupants within 60 seconds; all laboratory doors open outwards' },
      { code: 'A.9', desc: 'Laboratory safety program includes annual training, fire extinguishers, evacuation procedures and drills, procedures for optimum computer equipment utilization, and posted rules and regulations' },
    ]
  },
  {
    code: 'B', desc: 'Equipment and Supplies', programs: 'BSBA',
    subcriteria: [
      { code: 'B.1', desc: 'Computer equipment, peripherals, and other instruments are adequate' },
      { code: 'B.2', desc: 'Computer supplies/materials are available for use in the computer laboratories' },
      { code: 'B.3', desc: 'Students are provided with at least 3 hours of individual hands-on time per week for computer courses with laboratory component' },
      { code: 'B.4', desc: 'Appropriate programming languages, operating systems, and application software as required in the curriculum are provided' },
      { code: 'B.5', desc: 'Adequate computer facilities are available for faculty use' },
      { code: 'B.6', desc: 'Equipment and supplies for digital electronics-related subjects are available' },
      { code: 'B.7', desc: 'High-speed printer is provided in every networked laboratory for student use' },
    ]
  },
  {
    code: 'C', desc: 'Maintenance', programs: 'BSBA',
    subcriteria: [
      { code: 'C.1', desc: 'General Laboratory - neat and orderly appearance; efficient requisition system; systematic up-to-date inventory; evidence of new equipment accession; instruments in good working condition and calibrated; maintenance/repair department available; laboratory technician/helper available' },
      { code: 'C.2', desc: 'Office Simulation Room - neat and orderly; efficient requisition; regular restocking; systematic inventory; new equipment accession; equipment periodically maintained; maintenance/repair department; lab technician available; regular hardware and software/courseware upgrading' },
    ]
  },
  {
    code: 'D', desc: 'Special Provisions', programs: 'BSBA',
    subcriteria: [
      { code: 'D.1', desc: 'Speech Laboratory - equipment for aural and lingual skills; tape recorders, projectors, DVD player, tape language drills, language records, individual earphones; students work individually and in groups; visual and aural aids; technician available; inventory maintained; drills supplement classroom instruction; appropriate acoustics' },
      { code: 'D.2', desc: 'Physical Education - indoor area with appropriate flooring, lighting, ventilation, safety measures, sanitary toilets, shower/lavatory facilities, drinking facilities; outdoor play area free from hazards, suitably surfaced, properly laid out, adequately maintained' },
      { code: 'D.3', desc: 'Facilities include lockers, shower and dressing rooms which provide adequate privacy' },
      { code: 'D.4', desc: 'For Entrepreneurship program, an incubation room is provided with tables, computer, filing cabinets, and fire extinguishers' },
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

  // Find Area IV
  const areasResp = await fetch(BASE + '/content-manager/collection-types/api::area.area?page=1&pageSize=100', { headers: auth });
  const areas = areasResp.results || [];
  const areaIV = areas.find(a => a.area && a.area.startsWith('IV.'));
  if (!areaIV) throw new Error('Area IV not found!');
  console.log('Found: ' + areaIV.area + ' (docId: ' + areaIV.documentId + ')');

  // Get full detail
  await sleep(2000);
  const detail = await fetch(BASE + '/content-manager/collection-types/api::area.area/' + areaIV.documentId, { headers: auth });
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
  const result = await fetch(BASE + '/content-manager/collection-types/api::area.area/' + areaIV.documentId, {
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
  console.log('  ALL AREA IV PROGRAMS ADDED');
  console.log('========================================');
})().catch(err => console.error('FATAL:', err.message));
