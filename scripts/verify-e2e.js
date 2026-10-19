/**
 * CASE HUB — Complete End-to-End Automated Verification Script
 * Tests Journeys A through H as specified in Section 36 & 38 of requirements.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`CASE HUB — AUTOMATED QUALITY ASSURANCE & VERIFICATION`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} — ${detail}`);
      failed++;
    }
  }

  // Helper for requests with cookies
  let studentCookie = '';
  let student2Cookie = '';
  let adminCookie = '';

  // -------------------------------------------------------------
  // TEST 1: Journey A - Public Discovery (Unauthenticated)
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 1: Journey A (Public Browsing & Discovery) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/competitions?page=1&limit=9`);
    assert(res.status === 200, 'GET /api/competitions returns 200 for public visitors');
    const data = await res.json();
    assert(data.competitions && data.competitions.length > 0, `Returned ${data.competitions.length} public competitions`);
    assert(typeof data.total === 'number' && data.total >= 5, `Total count is reported correctly: ${data.total}`);

    // Verify search works
    const searchRes = await fetch(`${BASE_URL}/api/competitions?search=McKinsey`);
    const searchData = await searchRes.json();
    assert(searchData.competitions.length >= 1, 'Search by keyword "McKinsey" works');
    assert(searchData.competitions[0].organizer === 'McKinsey & Company', 'Search result matches organizer');

    // Verify detail page
    const firstId = data.competitions[0].id;
    const detailRes = await fetch(`${BASE_URL}/api/competitions/${firstId}`);
    assert(detailRes.status === 200, `GET /api/competitions/${firstId} returns 200`);
    const detailData = await detailRes.json();
    assert(detailData.competition && detailData.competition.id === firstId, 'Detail page returns exact competition record');
    assert(!detailData.competition.uploader_email, 'CRITICAL PRIVACY: Uploader email is NOT exposed in public detail API');
    assert(detailData.competition.official_registration_url.startsWith('http'), 'Official external registration URL is valid');
  } catch (err) {
    assert(false, 'Public Discovery Exception', err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Authentication & Sessions
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Authentication & Session Verification ---');
  try {
    // 1. Student Aarav Mehta login
    const loginStudentRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'usr_student_001' }),
    });
    assert(loginStudentRes.status === 200, 'Student login returns 200');
    studentCookie = loginStudentRes.headers.get('set-cookie') || '';
    const studentUser = (await loginStudentRes.json()).user;
    assert(studentUser.role === 'student', 'Student account has role "student"');

    // 2. Student 2 Ananya Sen login
    const loginStudent2Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'usr_student_002' }),
    });
    student2Cookie = loginStudent2Res.headers.get('set-cookie') || '';

    // 3. Admin Prof. Raghavendra Sharma login
    const loginAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'usr_admin_001' }),
    });
    assert(loginAdminRes.status === 200, 'Admin login returns 200');
    adminCookie = loginAdminRes.headers.get('set-cookie') || '';
    const adminUser = (await loginAdminRes.json()).user;
    assert(adminUser.role === 'admin', 'Admin account has role "admin"');

    // 4. Verify public registration cannot set role to admin
    const publicRegRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'newstudent@hsb.internal', role: 'admin' }),
    });
    const regData = await publicRegRes.json();
    assert(regData.user && regData.user.role === 'student', 'CRITICAL SECURITY: Public registration form cannot grant admin role');
  } catch (err) {
    assert(false, 'Auth Exception', err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Journey B & C - Instant Publishing & Admin Upload Email
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Journey B & C (Instant Publishing & Admin Email) ---');
  let testCompId = '';
  try {
    const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const newCompPayload = {
      name: 'HSB Jaipur National Valuation Challenge 2026',
      organizer: 'HSB Finance Society',
      description: 'Analyze discounted cash flows, leveraged buyouts, and accretion metrics for a tech conglomerate takeover. Teams of 2 to 4 students submit pitch decks.',
      category: 'Finance',
      industry: 'Investment Banking',
      registration_deadline: deadline,
      min_team_size: 2,
      max_team_size: 4,
      eligibility: 'Open to all enrolled MBA students at HSB Jaipur and partner B-schools.',
      mode: 'Hybrid',
      prize_details: '₹3,00,000 Total Prize Pool',
      entry_fee: 'Free',
      official_registration_url: 'https://unstop.com/competitions/hsb-valuation-challenge-2026',
      poster_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    };

    const submitRes = await fetch(`${BASE_URL}/api/competitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookie,
      },
      body: JSON.stringify(newCompPayload),
    });

    assert(submitRes.status === 201, 'Student competition submission returns 201 Created');
    const submitData = await submitRes.json();
    testCompId = submitData.competition.id;
    assert(testCompId && testCompId.startsWith('comp_'), `Created competition with ID: ${testCompId}`);

    // Verify INSTANT PUBLISHING (Must be visible immediately in public listing without admin approval!)
    const verifyPublicRes = await fetch(`${BASE_URL}/api/competitions?search=HSB+Jaipur+National+Valuation`);
    const verifyData = await verifyPublicRes.json();
    const found = verifyData.competitions.some((c) => c.id === testCompId);
    assert(found, 'CRITICAL REQUIREMENT: Competition is published and publicly visible INSTANTLY with no approval gate');

    // Verify Admin Notification was created and logged with correct details
    const notifRes = await fetch(`${BASE_URL}/api/admin/notifications`, {
      headers: { cookie: adminCookie },
    });
    const notifData = await notifRes.json();
    const adminUploadLog = notifData.logs.find(
      (l) => l.template_type === 'admin_new_upload' && l.competition_id === testCompId
    );

    assert(Boolean(adminUploadLog), 'Automatic admin notification email was generated upon student upload');
    assert(adminUploadLog?.subject.includes(newCompPayload.name), 'Email subject contains competition name');
    assert(adminUploadLog?.payload?.detailUrl?.includes(`/competitions/${testCompId}`), 'CRITICAL REQUIREMENT: Notification email button links to internal Case Hub detail page');
    assert(adminUploadLog?.payload?.uploaderEmail === 'aarav.mehta@hsb.internal', 'Notification payload accurately records authenticated uploader email for admin review');
  } catch (err) {
    assert(false, 'Submission Exception', err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Journey D - Saved Competitions
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Journey D (Saved Competitions Workflow) ---');
  try {
    // 1. Toggle save
    const saveRes = await fetch(`${BASE_URL}/api/competitions/${testCompId}/save`, {
      method: 'POST',
      headers: { cookie: studentCookie },
    });
    const saveData = await saveRes.json();
    assert(saveData.saved === true, 'Student saved competition successfully');

    // 2. Verify in saved list
    const getSavedRes = await fetch(`${BASE_URL}/api/saved`, {
      headers: { cookie: studentCookie },
    });
    const getSavedData = await getSavedRes.json();
    const inSaved = getSavedData.savedCompetitions.some((c) => c.id === testCompId);
    assert(inSaved, 'Saved competition persists in student saved portfolio');

    // 3. Verify student 2 cannot see student 1's saved list
    const student2SavedRes = await fetch(`${BASE_URL}/api/saved`, {
      headers: { cookie: student2Cookie },
    });
    const student2SavedData = await student2SavedRes.json();
    const student2HasIt = student2SavedData.savedCompetitions.some((c) => c.id === testCompId);
    assert(!student2HasIt, 'Privacy: Saved competitions are strictly isolated to the authenticated student');
  } catch (err) {
    assert(false, 'Saved Competitions Exception', err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Journey E - Team Finder & Concurrency Restrictions
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Journey E (Team Finder & Size Enforcement) ---');
  let teamId = '';
  try {
    // 1. Host creates a team listing with target size 2
    const createTeamRes = await fetch(`${BASE_URL}/api/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookie,
      },
      body: JSON.stringify({
        competitionId: testCompId,
        headline: 'Valuation Wizards seeking 1 financial modeler',
        description: 'Aiming for national podium. We have presentation skills, need 1 DCF modeler.',
        targetTeamSize: 2,
        contactMethod: 'Meet at Library Pod C',
      }),
    });

    assert(createTeamRes.status === 201, 'Team listing created successfully');
    const teamData = await createTeamRes.json();
    teamId = teamData.team.id;

    // 2. Student 2 joins team
    const joinRes = await fetch(`${BASE_URL}/api/teams/${teamId}/join`, {
      method: 'POST',
      headers: { cookie: student2Cookie },
    });
    assert(joinRes.status === 200, 'Second student joined team successfully');

    // 3. Team is now at capacity (2/2). Third user tries to join -> Must be rejected!
    const thirdUserRes = await fetch(`${BASE_URL}/api/teams/${teamId}/join`, {
      method: 'POST',
      headers: { cookie: adminCookie }, // Using admin account as 3rd user
    });
    assert(thirdUserRes.status === 400, 'CRITICAL: Team size limit enforced — joining full team rejected with 400');

    // 4. Duplicate join test: Student 2 tries to join again -> Must be rejected!
    const dupJoinRes = await fetch(`${BASE_URL}/api/teams/${teamId}/join`, {
      method: 'POST',
      headers: { cookie: student2Cookie },
    });
    assert(dupJoinRes.status === 400, 'Duplicate join prevention enforced — already member rejected');

    // 5. Leave team
    const leaveRes = await fetch(`${BASE_URL}/api/teams/${teamId}/leave`, {
      method: 'POST',
      headers: { cookie: student2Cookie },
    });
    assert(leaveRes.status === 200, 'Student left team successfully');
  } catch (err) {
    assert(false, 'Team Finder Exception', err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Journey F - Closing-Soon 48h Automated Reminders
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: Journey F (Closing-Soon 48h Scheduled Scanner) ---');
  try {
    const cronRes = await fetch(`${BASE_URL}/api/cron/closing-soon`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer case_hub_cron_secret_key',
      },
    });

    assert(cronRes.status === 200, 'POST /api/cron/closing-soon executed with secret');
    const cronData = await cronRes.json();
    assert(cronData.success === true, 'Closing-soon scheduler completed successfully');
    assert(typeof cronData.closingSoonFound === 'number', `Found ${cronData.closingSoonFound} closing soon challenges`);

    // Verify duplicate run does not duplicate notifications
    const secondCronRes = await fetch(`${BASE_URL}/api/cron/closing-soon`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer case_hub_cron_secret_key',
      },
    });
    const secondCronData = await secondCronRes.json();
    assert(secondCronData.dispatchedCount === 0, 'Duplicate notification prevention works — repeated runs send 0 duplicates');
  } catch (err) {
    assert(false, 'Closing-soon Exception', err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Journey G - Saved-Competition Schedule Changes
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 7: Journey G (Saved-Competition Date Change Alert) ---');
  try {
    // Modify deadline of testCompId that student 1 saved earlier
    const updatedDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const updateRes = await fetch(`${BASE_URL}/api/competitions/${testCompId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookie,
      },
      body: JSON.stringify({
        registration_deadline: updatedDeadline,
      }),
    });

    assert(updateRes.status === 200, 'Author updated competition deadline');

    // Check notification outbox to confirm saved update alert was generated
    const notifRes = await fetch(`${BASE_URL}/api/admin/notifications`, {
      headers: { cookie: adminCookie },
    });
    const notifData = await notifRes.json();
    const savedUpdateLog = notifData.logs.find(
      (l) => l.template_type === 'saved_update' && l.competition_id === testCompId
    );

    assert(Boolean(savedUpdateLog), 'Saved-competition date change automatically generated notification for students who saved it');
  } catch (err) {
    assert(false, 'Schedule change alert exception', err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Journey H - Bulk Import & Admin Moderation
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 8: Journey H (Admin Dashboard & Bulk Import) ---');
  try {
    // 1. Student attempts bulk import -> Must be denied 403
    const unauthorizedImport = await fetch(`${BASE_URL}/api/admin/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookie,
      },
      body: JSON.stringify({ rows: [] }),
    });
    assert(unauthorizedImport.status === 403, 'Security: Non-admin bulk import attempt is denied 403');

    // 2. Admin performs bulk import with 1 valid row and 1 invalid row
    const bulkPayload = {
      rows: [
        {
          name: 'HSB Strategy Open 2026',
          organizer: 'HSB Strategy Cell',
          description: 'High-stakes strategy challenge on renewable energy distribution models.',
          category: 'Case Competitions',
          registration_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          min_team_size: 2,
          max_team_size: 4,
          eligibility: 'All students',
          mode: 'Online',
          official_registration_url: 'https://unstop.com/competitions/hsb-strategy-open-2026',
        },
        {
          name: 'Invalid Incomplete Challenge',
          // Missing organizer, missing deadline, invalid url
          description: 'Too short',
          category: 'InvalidCategoryName',
        },
      ],
    };

    const adminImportRes = await fetch(`${BASE_URL}/api/admin/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify(bulkPayload),
    });

    assert(adminImportRes.status === 200, 'Admin bulk import returned 200');
    const importData = await adminImportRes.json();
    assert(importData.importedCount === 1, 'Imported exactly 1 valid competition');
    assert(importData.errorsCount === 1, 'Flagged exactly 1 invalid row with error report');
    assert(importData.rowErrors[0].errors.length >= 2, 'Row error report details missing fields');

    // 3. Test report creation & admin moderation
    const reportRes = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: studentCookie,
      },
      body: JSON.stringify({
        competitionId: testCompId,
        reason: 'Incorrect information',
        additionalDetails: 'Official website was updated with new round requirements.',
      }),
    });
    assert(reportRes.status === 201, 'Student filed moderation report');
    const reportData = await reportRes.json();

    const resolveReportRes = await fetch(`${BASE_URL}/api/reports/${reportData.report.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'resolved' }),
    });
    assert(resolveReportRes.status === 200, 'Admin resolved moderation report');
  } catch (err) {
    assert(false, 'Bulk import / moderation exception', err.message);
  }

  // -------------------------------------------------------------
  // Clean up test post
  // -------------------------------------------------------------
  if (testCompId) {
    try {
      await fetch(`${BASE_URL}/api/competitions/${testCompId}`, {
        method: 'DELETE',
        headers: { cookie: studentCookie },
      });
      console.log(`\n  [CLEANUP] Successfully cleaned up temporary test competition ${testCompId}`);
    } catch {
      // ignore
    }
  }

  console.log(`\n======================================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Allow server 1.5 seconds to accept connections if called right after launch
setTimeout(runTests, 1500);
